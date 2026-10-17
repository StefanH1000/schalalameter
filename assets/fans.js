// Schalalameter: Zugriff auf Supabase per fetch (ohne Bibliothek).
// Öffentlich: Lesen nur über die Ansichten, Schreiben nur über die Funktionen (siehe supabase/tabelle.sql).
// Moderation: Anmeldung mit E-Mail und Passwort über die Auth-Schnittstelle, danach Tabellen mit dem Zugangstoken.
(function (root) {
  const cfg = root.SCHALALA_SUPABASE || {};
  const ready = () => !!(cfg.url && cfg.key);
  const NICHT_ERREICHBAR = 'Die Verbindung zum Server klappt gerade nicht. Bitte prüfe dein Netz und versuche es später noch einmal.';

  // token: Zugangstoken einer angemeldeten Person (nur Werkstatt); sonst gilt der öffentliche Schlüssel.
  function headers(extra, token) {
    const h = {apikey: cfg.key, Accept: 'application/json', ...extra};
    // Ältere anon-Schlüssel sind JWTs und gehören zusätzlich in Authorization; neue publishable keys nicht.
    if (token) h.Authorization = 'Bearer ' + token;
    else if (/^eyJ/.test(cfg.key)) h.Authorization = 'Bearer ' + cfg.key;
    return h;
  }
  function base(teil) { return String(cfg.url).replace(/\/+$/, '') + (teil || '/rest/v1/'); }

  async function fehlerText(res, ersatz) {
    let msg = '';
    try { const j = await res.json(); msg = j.message || j.msg || j.error_description || ''; } catch (e) {}
    return msg || ersatz || `Fehler ${res.status}`;
  }

  // GET auf eine Ansicht oder Tabelle, z. B. get('themen_oeffentlich?order=erstellt.desc').
  async function get(pfad, opt) {
    const o = opt || {};
    if (!ready()) throw new Error(NICHT_ERREICHBAR);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), o.timeoutMs || 8000);
    let res;
    try {
      res = await fetch(base() + pfad, {headers: headers(o.range ? {Range: o.range, 'Range-Unit': 'items'} : {}, o.token), signal: ctrl.signal, cache: 'no-store'});
    } catch (e) {
      throw new Error(NICHT_ERREICHBAR);
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok && res.status !== 206) { const e = new Error(await fehlerText(res)); e.status = res.status; throw e; }
    return res.json();
  }

  // Funktion aufrufen (POST /rpc/name); wirft einen Fehler mit lesbarer Meldung.
  async function rpc(name, body) {
    if (!ready()) throw new Error('Das ist noch nicht freigeschaltet.');
    let res;
    try {
      res = await fetch(base() + 'rpc/' + name, {method: 'POST', headers: headers({'Content-Type': 'application/json'}), body: JSON.stringify(body)});
    } catch (e) {
      throw new Error(NICHT_ERREICHBAR);
    }
    if (!res.ok) throw new Error(await fehlerText(res, `Das hat nicht geklappt (Fehler ${res.status}).`));
    return res.json();
  }

  // PATCH für die Moderation, z. B. patch('beitraege?id=eq.5', {gesperrt: true}, token).
  async function patch(pfad, body, token) {
    let res;
    try {
      res = await fetch(base() + pfad, {method: 'PATCH', headers: headers({'Content-Type': 'application/json', Prefer: 'return=representation'}, token), body: JSON.stringify(body)});
    } catch (e) {
      throw new Error(NICHT_ERREICHBAR);
    }
    if (!res.ok) throw new Error(await fehlerText(res));
    const rows = await res.json();
    if (!rows.length) throw new Error('Nichts geändert. Fehlt das Moderationsrecht?');
    return rows;
  }

  /* ---------- Fanzählungen ---------- */
  // Alle sichtbaren Einreichungen, seitenweise. Nach timeoutMs wird abgebrochen und null geliefert,
  // dann zeigt die Seite nur die Datendatei.
  async function load(timeoutMs) {
    if (!ready()) return null;
    const ende = Date.now() + (timeoutMs || 3000);
    try {
      const rows = [], page = 1000;
      // Ohne Spalte spitzname (tabelle.sql noch nicht neu ausgeführt) antwortet die Ansicht mit 400: dann ohne Namen laden.
      let felder = 'lied_id,laut_id,anzahl,vorschlag,grundlage,spitzname';
      for (let from = 0; ; from += page) {
        let chunk;
        try {
          chunk = await get('fan_zaehlungen_oeffentlich?select=' + felder, {range: `${from}-${from + page - 1}`, timeoutMs: Math.max(1, ende - Date.now())});
        } catch (e) {
          if (e.status === 400 && felder.endsWith(',spitzname')) { felder = felder.replace(',spitzname', ''); from -= page; continue; }
          throw e;
        }
        rows.push(...chunk);
        if (chunk.length < page) break;
      }
      return rows;
    } catch (e) {
      return null;
    }
  }

  async function submit(z) {
    if (!ready()) throw new Error('Das Einreichen ist noch nicht freigeschaltet.');
    await rpc('zaehlung_einreichen', {
      p_lied_id: z.lied_id, p_laut_id: z.laut_id || '', p_anzahl: z.anzahl, p_vorschlag: z.vorschlag || '',
      p_spitzname: z.spitzname, p_grundlage: z.grundlage, p_geraet_id: z.geraet_id,
    });
    return true;
  }

  /* ---------- Schalalalogie ---------- */
  const enc = encodeURIComponent;
  const forum = {
    themen: () => get('themen_oeffentlich?select=*&order=letzte_aktivitaet.desc&limit=500'),
    // Anzahl Beiträge je Liedthema, für „Diskussion (N)“ auf der Startseite; null, wenn nicht erreichbar.
    liedthemen: timeoutMs => get('themen_oeffentlich?select=id,lied_id,beitraege&art=eq.lied', {timeoutMs}).catch(() => null),
    thema: async id => (await get(`themen_oeffentlich?select=*&id=eq.${enc(id)}`))[0] || null,
    liedthema: async liedId => (await get(`themen_oeffentlich?select=*&art=eq.lied&lied_id=eq.${enc(liedId)}`))[0] || null,
    beitraege: themaId => get(`beitraege_oeffentlich?select=*&thema_id=eq.${enc(themaId)}&order=erstellt.asc,id.asc&limit=1000`),
    antworten: themaId => get(`antworten_oeffentlich?select=*&thema_id=eq.${enc(themaId)}&order=position.asc`),
    themaAnlegen: t => rpc('thema_anlegen', {
      p_art: t.art, p_titel: t.titel || '', p_text: t.text || '', p_lied_id: t.lied_id || null,
      p_antworten: t.antworten || null, p_endet: t.endet || null, p_spitzname: t.spitzname, p_geraet_id: t.geraet_id,
    }),
    beitragSchreiben: b => rpc('beitrag_schreiben', {p_thema_id: b.thema_id, p_text: b.text, p_spitzname: b.spitzname, p_geraet_id: b.geraet_id}),
    abstimmen: s => rpc('abstimmen', {p_thema_id: s.thema_id, p_antwort_id: s.antwort_id, p_geraet_id: s.geraet_id}),
    melden: m => rpc('melden', {p_beitrag_id: m.beitrag_id, p_grund: m.grund || '', p_geraet_id: m.geraet_id}),
  };

  /* ---------- Anmeldung der Moderierenden (nur Werkstatt) ---------- */
  // Sitzung nur für diesen Tab (sessionStorage); kein service_role-Schlüssel, nur das Zugangstoken der Person.
  const SKEY = 'schalala-moderation';
  const auth = {
    sitzung() { try { return JSON.parse(sessionStorage.getItem(SKEY) || 'null'); } catch (e) { return null; } },
    merken(s) { try { s ? sessionStorage.setItem(SKEY, JSON.stringify(s)) : sessionStorage.removeItem(SKEY); } catch (e) {} },
    async tokenAnfrage(art, body) {
      let res;
      try {
        res = await fetch(base('/auth/v1/token?grant_type=') + art, {method: 'POST', headers: headers({'Content-Type': 'application/json'}), body: JSON.stringify(body)});
      } catch (e) { throw new Error(NICHT_ERREICHBAR); }
      if (!res.ok) throw new Error(res.status === 400 ? 'E-Mail oder Passwort stimmen nicht.' : await fehlerText(res));
      const j = await res.json();
      const s = {token: j.access_token, refresh: j.refresh_token, bis: Date.now() + (j.expires_in || 3600) * 1000, email: j.user && j.user.email};
      auth.merken(s);
      return s;
    },
    anmelden: (email, password) => auth.tokenAnfrage('password', {email, password}),
    // Gültiges Zugangstoken; erneuert es kurz vor Ablauf.
    async token() {
      let s = auth.sitzung();
      if (!s) return null;
      if (Date.now() > s.bis - 60000) {
        try { s = await auth.tokenAnfrage('refresh_token', {refresh_token: s.refresh}); } catch (e) { auth.merken(null); return null; }
      }
      return s.token;
    },
    async abmelden() {
      const s = auth.sitzung();
      auth.merken(null);
      if (s) try { await fetch(base('/auth/v1/logout'), {method: 'POST', headers: headers({}, s.token)}); } catch (e) {}
    },
  };

  /* ---------- Gerät und Spitzname (Zähl mit und Schalalalogie teilen sie) ---------- */
  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
    return val;
  }
  // Zufällige Geräte-Kennung, nur in diesem Browser gespeichert; sie verknüpft spätere Korrekturen mit der eigenen Zählung
  // und begrenzt Stimmen und Beiträge je Gerät.
  function geraetId() {
    let id = store('schalala-geraet');
    if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
      id = crypto.randomUUID ? crypto.randomUUID()
        : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
      store('schalala-geraet', id);
    }
    return id;
  }
  const spitzname = v => v === undefined ? (store('schalala-spitzname') || '') : store('schalala-spitzname', v);

  root.SchalalaFans = {ready, load, submit, get, rpc, patch, forum, auth, store, geraetId, spitzname, NICHT_ERREICHBAR};
})(window);
