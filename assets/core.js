// Schalalameter: gemeinsame Datenlogik für Seite, Werkstatt und Tests.
(function (root) {
  const TYPES = [
    {id: 'original', name: 'Eigene Lieder', on: true},
    {id: 'uebersetzung', name: 'Übersetzungen', on: false},
    {id: 'cover', name: 'Cover', on: false},
    {id: 'unklar', name: 'Unklar', on: false},
  ];
  const TYPE_LABEL = {original: 'Original', uebersetzung: 'Übersetzung', cover: 'Cover', unklar: 'unklar'};
  // Rangfolge der Grundlagen: nach Gehör (sorgfältig abgehört, aus der Werkstatt) vor Booklet vor Fankonsens vor Onlinetext.
  // Abgehört gewinnt, weil Booklets Wiederholungen oft nur einmal abdrucken.
  const GRUND_RANK = {gehoert: 5, booklet: 4, fankonsens: 3, online_text: 1};
  const GRUND_LABEL = {booklet: 'Booklet', fankonsens: 'Fankonsens', gehoert: 'nach Gehör', online_text: 'Online-Text'};
  const SICHER_RANK = {hoch: 3, mittel: 2, niedrig: 1};
  const MAX_SOUNDS = 8;

  // Muster fürs Vorzählen; neue Laute bekommen ein Muster aus ihrem Namen.
  // Silben verbinden nur Leerzeichen und Bindestriche: Komma und Zeilenumbruch beenden eine Lautfolge.
  const SEP = String.raw`[ \t\-]`;
  const PATTERNS = {
    piu:     String.raw`\bp+i+u+(?:${SEP}*p+i+u+)*\b`,
    shalala: String.raw`\bs(?:c)?ha+(?:${SEP}*la+){2,}\b`,
    lalala:  String.raw`\b(?:la+${SEP}*){2,}\b`,
    nanana:  String.raw`\b(?:na+${SEP}*){3,}\b`,
    ohoho:   String.raw`\b(?:[ou]h+${SEP}*){3,}\b`,
  };

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  }
  function fmt(n) {
    return Number.isInteger(n) ? String(n) : n.toLocaleString('de-DE', {maximumFractionDigits: 1, minimumFractionDigits: 1});
  }
  function slug(s) {
    return String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'laut';
  }
  function isHttp(u) { return /^https?:\/\//.test(u || ''); }
  // Beitragstext der Schalalalogie als sicheres HTML: alles maskiert, nur http(s)-Adressen werden zu Links.
  // Satzzeichen am Ende gehören nicht zur Adresse, eine schließende Klammer nur, wenn sie eine öffnende schließt.
  // Zeilenumbrüche bleiben als \n stehen (Darstellung mit white-space: pre-wrap).
  function textMitLinks(text) {
    const s = String(text ?? ''), re = /https?:\/\/[^\s<>"'`]+/g;
    let out = '', last = 0, m;
    while ((m = re.exec(s))) {
      let url = m[0];
      for (;;) {
        if (/[.,;:!?'"\]]$/.test(url)) url = url.slice(0, -1);
        else if (url.endsWith(')') && url.split('(').length < url.split(')').length) url = url.slice(0, -1);
        else break;
      }
      if (!/^https?:\/\/[^/?#\s]+/.test(url)) continue;
      out += esc(s.slice(last, m.index)) + `<a href="${esc(url)}" rel="nofollow ugc noopener" target="_blank">${esc(url)}</a>`;
      last = m.index + url.length;
      re.lastIndex = last;
    }
    return out + esc(s.slice(last));
  }

  function normalize(d) {
    if (!d || !Array.isArray(d.lieder) || !Array.isArray(d.zaehlungen)) return null;
    d.laute = Array.isArray(d.laute) ? d.laute.filter(l => l && l.id) : [];
    d.kandidaten_verworfen = Array.isArray(d.kandidaten_verworfen) ? d.kandidaten_verworfen : [];
    d.lieder = d.lieder.filter(l => l && l.id);
    d.zaehlungen = d.zaehlungen.filter(z => z && z.lied_id);
    return d;
  }

  // Laute sind in Familien gruppiert; die Farbe folgt der Familie (Position in data.familien), nicht dem Rang.
  // Ohne data.familien bildet jeder Laut seine eigene Familie (ältere Datendateien).
  function familyId(data, l) {
    return l.familie || (Array.isArray(data.familien) && data.familien.length ? 'weitere' : l.id);
  }
  function families(data) {
    const released = data.laute.filter(l => l.status === 'freigegeben');
    const declared = Array.isArray(data.familien) ? data.familien : [];
    const all = declared.slice();
    for (const l of released) {
      const id = familyId(data, l);
      if (!all.some(f => f.id === id)) all.push({id, name: id === 'weitere' ? 'Weitere Laute' : l.name});
    }
    const used = new Set(released.map(l => familyId(data, l)));
    return all.map((f, i) => ({...f, anzeigename: f.anzeigename || f.name, untertitel: f.untertitel || '', steckbrief: f.steckbrief || '', slot: Math.min(i + 1, MAX_SOUNDS)}))
      .filter(f => used.has(f.id));
  }
  function sounds(data) {
    const slot = new Map(families(data).map(f => [f.id, f.slot]));
    return data.laute.filter(l => l.status === 'freigegeben').map(l => {
      const familie = familyId(data, l);
      return {...l, familie, slot: slot.get(familie) || MAX_SOUNDS};
    });
  }
  function yearOf(lied) {
    const m = /^(\d{4})/.exec(lied.erstveroeffentlichung || '');
    return m ? +m[1] : null;
  }
  function countable(z) {
    return z.status !== 'kein_text_gefunden' && !!z.werte && typeof z.werte === 'object';
  }
  // Verlässlichste Zählung: Booklet > Gehör > Online-Text, dann Sicherheit, dann Quellenart.
  // Bei Gleichstand gewinnt die Zählung mit mehr Lauten: Online-Texte kürzen Laute eher weg, als dass sie welche erfinden.
  const QUELLE_RANK = {offiziell: 3, lizenziert: 2, community: 1};
  function sumOf(z) {
    const kand = z.kandidaten && typeof z.kandidaten === 'object' ? Object.values(z.kandidaten) : [];
    // Feste Laute zählen vor Kandidaten; Kandidaten entscheiden nur bei sonst gleichem Stand.
    return Object.values(z.werte).reduce((t, v) => t + (+v || 0), 0) * 1000 + kand.reduce((t, v) => t + (+v || 0), 0);
  }
  function bestOf(zs) {
    return zs.filter(countable).sort((a, b) =>
      (GRUND_RANK[b.grundlage] || 0) - (GRUND_RANK[a.grundlage] || 0) ||
      (SICHER_RANK[b.sicherheit] || 0) - (SICHER_RANK[a.sicherheit] || 0) ||
      (QUELLE_RANK[b.quelle_art] || 0) - (QUELLE_RANK[a.quelle_art] || 0) ||
      sumOf(b) - sumOf(a) ||
      String(b.gezaehlt_am || '').localeCompare(String(a.gezaehlt_am || '')))[0] || null;
  }
  function value(z, id, aufl) {
    const a = z.anzahl_aufgeloest;
    if (aufl && a && typeof a === 'object' && Number.isFinite(+a[id])) return +a[id];
    const v = +z.werte[id];
    return Number.isFinite(v) ? v : 0;
  }

  /* ---------- Fanzählungen ---------- */
  // Konsens je Lied und Laut aus allen Stimmen (ganze Zahlen):
  // unter 3 Stimmen der Durchschnitt, aufgerundet; ab 3 der häufigste Wert,
  // bei mehreren gleich häufigen Werten der Median aller Stimmen, aufgerundet.
  function consensus(votes) {
    const v = votes.filter(x => Number.isFinite(x));
    if (!v.length) return null;
    if (v.length < 3) return Math.ceil(v.reduce((t, x) => t + x, 0) / v.length);
    const freq = new Map();
    for (const x of v) freq.set(x, (freq.get(x) || 0) + 1);
    const top = Math.max(...freq.values());
    const modes = [...freq].filter(([, n]) => n === top).map(([x]) => x);
    if (modes.length === 1) return modes[0];
    const s = v.slice().sort((a, b) => a - b), m = s.length >> 1;
    return Math.ceil(s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2);
  }

  // Baut aus den Fan-Einreichungen je Lied eine Zählung mit Grundlage „fankonsens“.
  // Die bisherige beste Zählung aus der Datendatei (ohne Booklet) zählt je Laut, den sie enthält, als erste Stimme mit.
  // Laute ohne Fanstimme übernehmen den Wert dieser Zählung, ohne sie 0.
  // Einreichungen mit unbekannter Lied- oder Laut-ID zählen nicht. Ein Vorschlag (ohne Laut-ID) zählt erst,
  // wenn ein freigegebener Laut so heißt (Name, ID oder Feld `aliase`), also nach der Freigabe in der Werkstatt.
  function vorschlagsLaut(snds) {
    const m = new Map();
    for (const s of snds) for (const n of [s.id, s.name, ...(Array.isArray(s.aliase) ? s.aliase : [])]) if (n) m.set(slug(n), s.id);
    return ph => m.get(slug(ph)) || null;
  }
  // Laut-ID KEINE: „Keine Schalalas in diesem Lied“, eine Einreichung, die für jeden Laut des Lieds als Stimme 0 zählt.
  const KEINE = 'keine';
  function fanZaehlungen(data, rows) {
    const lieder = new Set(data.lieder.map(l => l.id));
    const snds = sounds(data).filter(s => s.id !== KEINE), laute = new Set(snds.map(s => s.id)), ausVorschlag = vorschlagsLaut(snds);
    const byLied = new Map(), namen = new Map(), keine = new Map();
    for (const r of Array.isArray(rows) ? rows : []) {
      const n = Number(r && r.anzahl);
      if (!r || !lieder.has(r.lied_id) || !Number.isInteger(n) || n < 0 || n > 200) continue;
      const laut = r.laut_id ? r.laut_id : String(r.vorschlag || '').trim() ? ausVorschlag(r.vorschlag) : null;
      if (laut !== KEINE && !laute.has(laut)) continue;
      const name = String(r.spitzname || '').trim();
      if (name) (namen.get(r.lied_id) || namen.set(r.lied_id, new Set()).get(r.lied_id)).add(name);
      if (!byLied.has(r.lied_id)) byLied.set(r.lied_id, new Map());
      if (laut === KEINE) { keine.set(r.lied_id, (keine.get(r.lied_id) || 0) + 1); continue; }
      const m = byLied.get(r.lied_id);
      if (!m.has(laut)) m.set(laut, []);
      m.get(laut).push(n);
    }
    const out = [];
    for (const [liedId, perLaut] of byLied) {
      const base = bestOf(data.zaehlungen.filter(z => z.lied_id === liedId && z.grundlage !== 'booklet' && z.grundlage !== 'fankonsens'));
      const werte = {}, stimmen = {}, nKeine = keine.get(liedId) || 0;
      let minStimmen = Infinity, fan = nKeine;
      for (const s of snds) {
        const eigen = perLaut.get(s.id) || [];
        const fv = eigen.length || nKeine ? [...eigen, ...Array(nKeine).fill(0)] : null;
        fan += eigen.length;
        // Kennt die Zählung den Laut gar nicht (z. B. ein später freigegebener Fanvorschlag), ist sie keine Stimme.
        const online = base && base.werte && s.id in base.werte ? value(base, s.id, false) : null;
        if (fv) {
          const all = online == null ? fv : [online, ...fv];
          werte[s.id] = consensus(all);
          stimmen[s.id] = fv.length;
          minStimmen = Math.min(minStimmen, all.length);
        } else {
          werte[s.id] = online == null ? 0 : online;
        }
      }
      out.push({
        lied_id: liedId, grundlage: 'fankonsens', quelle_url: '', quelle_art: 'community', gezaehlt_von: 'Fans',
        status: 'gezaehlt', werte, anzahl_aufgeloest: null, belege: {}, kandidaten: {},
        sicherheit: minStimmen >= 3 ? 'hoch' : 'mittel', fan: stimmen, fan_anzahl: fan, notiz: '',
        namen: [...(namen.get(liedId) || [])], keine: nKeine,
      });
    }
    return out;
  }
  // „Kalle, Taube und 2 weiteren“: höchstens drei Namen, der Rest als Zahl.
  function namenListe(namen, max = 3) {
    const n = namen.slice(0, max), rest = namen.length - n.length;
    if (rest > 0) return `${n.join(', ')} und ${rest === 1 ? 'einer weiteren Person' : rest + ' weiteren'}`;
    return n.length > 1 ? `${n.slice(0, -1).join(', ')} und ${n[n.length - 1]}` : (n[0] || '');
  }
  // Datendatei plus Fankonsens; die Datendatei selbst bleibt unverändert.
  function withFans(data, rows) {
    const extra = fanZaehlungen(data, rows);
    return extra.length ? {...data, zaehlungen: [...data.zaehlungen, ...extra]} : data;
  }
  // Offene Vorschläge für neue Laute aus den Einreichungen, nach Häufigkeit. Schon freigegebene fallen weg.
  function fanVorschlaege(data, rows) {
    const lieder = new Set(data.lieder.map(l => l.id));
    const bekannt = vorschlagsLaut(sounds(data));
    const map = new Map();
    for (const r of Array.isArray(rows) ? rows : []) {
      const ph = String((r && r.vorschlag) || '').trim();
      if (!ph || !lieder.has(r.lied_id) || bekannt(ph)) continue;
      const key = slug(ph);
      const e = map.get(key) || {ph, total: 0, songs: new Set(), n: 0};
      e.total += Number(r.anzahl) || 0; e.n++; e.songs.add(r.lied_id);
      map.set(key, e);
    }
    return [...map.values()].sort((a, b) => b.n - a.n || b.total - a.total);
  }

  /* ---------- Albumphasen ---------- */
  function albums(data) {
    return (Array.isArray(data.alben) ? data.alben : []).slice()
      .sort((a, b) => (a.reihenfolge ?? 0) - (b.reihenfolge ?? 0) || String(a.datum).localeCompare(String(b.datum)));
  }
  function dayNum(d) {
    const m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/.exec(d || '');
    return m ? Date.UTC(+m[1], (+m[2] || 1) - 1, +m[3] || 1) / 864e5 : null;
  }
  // Zuordnung eines Lieds zu einer Albumphase, Regeln in dieser Reihenfolge:
  // 1 Überschreibung im Feld `phase`, 2 Übersetzung folgt dem Original (`original_id`),
  // 3 Lied steht auf einem Studioalbum (`veroeffentlichung` oder `auch_auf`), bei mehreren das zuerst erschienene,
  // 4 sonst das Album mit dem geringsten Abstand in Tagen zur Erstveröffentlichung.
  // Ergebnis: {album, regel, abstand?, unklar?}; unklar = Gleichstand bei Regel 4.
  function phaseInfo(data, lied, seen) {
    const alb = albums(data);
    if (!alb.length || !lied) return null;
    const byId = new Map(alb.map(a => [a.id, a]));
    if (lied.phase && byId.has(lied.phase)) return {album: byId.get(lied.phase), regel: 1};
    if (lied.typ === 'uebersetzung' && lied.original_id) {
      const s = seen || new Set();
      if (!s.has(lied.id)) {
        s.add(lied.id);
        const p = phaseInfo(data, data.lieder.find(l => l.id === lied.original_id), s);
        if (p) return {album: p.album, regel: 2};
      }
    }
    const auch = Array.isArray(lied.auch_auf) ? lied.auch_auf : [];
    const on = alb.filter(a => lied.veroeffentlichung === `${a.titel} (Album)` || auch.includes(`${a.titel} (${a.datum})`));
    if (on.length) return {album: on.sort((a, b) => String(a.datum).localeCompare(String(b.datum)))[0], regel: 3};
    const d = dayNum(lied.erstveroeffentlichung);
    if (d == null) return null;
    let best = null, bd = Infinity, tie = false;
    for (const a of alb) {
      const dd = Math.abs(dayNum(a.datum) - d);
      if (dd < bd) { bd = dd; best = a; tie = false; } else if (dd === bd) tie = true;
    }
    return {album: best, regel: 4, abstand: bd, unklar: tie};
  }

  // opts: {typeOn:Set, minSicher:1..3, aufl:boolean}
  function derive(data, opts) {
    const byLied = new Map();
    for (const z of data.zaehlungen) {
      if (!byLied.has(z.lied_id)) byLied.set(z.lied_id, []);
      byLied.get(z.lied_id).push(z);
    }
    const snds = sounds(data);
    return data.lieder.map(l => {
      const all = byLied.get(l.id) || [];
      const best = bestOf(all);
      const year = yearOf(l);
      const typ = TYPE_LABEL[l.typ] ? l.typ : 'unklar';
      const values = {};
      if (best) for (const s of snds) values[s.id] = value(best, s.id, opts.aufl);
      const trusted = !!best && (SICHER_RANK[best.sicherheit] || 1) >= opts.minSicher;
      const pi = phaseInfo(data, l);
      return {l, all, best, year, typ, values, phase: pi ? pi.album.id : null, phaseRegel: pi ? pi.regel : null,
        counted: trusted, lowConf: !!best && !trusted, shown: opts.typeOn.has(typ) && year != null};
    });
  }

  // Reihenfolge der Lieder: nach Albumphase, darin zuerst die Lieder des Albums in Trackreihenfolge (Feld `track`),
  // danach die übrigen der Phase zugeordneten Lieder (Singles, EPs, Live) nach Erscheinungsdatum.
  function liedOrdnung(data) {
    const pos = new Map();
    const p = l => {
      if (!pos.has(l.id)) { const i = phaseInfo(data, l); pos.set(l.id, i ? (i.album.reihenfolge ?? 99) : 99); }
      return pos.get(l.id);
    };
    return (a, b) => p(a) - p(b) || (a.track == null) - (b.track == null) || (a.track ?? 0) - (b.track ?? 0)
      || String(a.erstveroeffentlichung || '').localeCompare(String(b.erstveroeffentlichung || ''))
      || String(a.titel).localeCompare(String(b.titel), 'de');
  }

  // Eine Spalte je Albumphase in Erscheinungsreihenfolge, gleichmäßig verteilt, auch ohne Lieder.
  // Ohne `alben` in den Daten (ältere Dateien) wird jedes Jahr zu einer eigenen Phase.
  function phaseCols(data, songs, snds, mode) {
    const shown = songs.filter(s => s.shown);
    let alb = albums(data);
    const pseudo = !alb.length;
    if (pseudo) {
      const years = [...new Set(shown.map(s => s.year))].sort((a, b) => a - b);
      alb = years.map(y => ({id: String(y), titel: String(y), kurz: String(y), datum: `${y}-01-01`}));
    }
    const ordnung = liedOrdnung(data);
    return alb.map(a => {
      const inP = shown.filter(s => pseudo ? String(s.year) === a.id : s.phase === a.id).sort((x, y) => ordnung(x.l, y.l));
      const counted = inP.filter(s => s.counted), counts = {};
      for (const snd of snds) {
        const sum = counted.reduce((t, s) => t + (s.values[snd.id] || 0), 0);
        counts[snd.id] = mode === 'avg' ? (counted.length ? sum / counted.length : 0) : sum;
      }
      return {key: a.id, album: a, label: a.kurz || a.titel, year: yearOf({erstveroeffentlichung: a.datum}), songs: inP, counted, counts};
    });
  }

  // Nur aus der besten Zählung je Lied, sonst zählt ein Laut bei mehreren Quellen mehrfach.
  function candidates(data) {
    const byLied = new Map();
    for (const z of data.zaehlungen) {
      if (!byLied.has(z.lied_id)) byLied.set(z.lied_id, []);
      byLied.get(z.lied_id).push(z);
    }
    const map = new Map();
    for (const zs of byLied.values()) {
      const z = bestOf(zs);
      if (!z || !z.kandidaten || typeof z.kandidaten !== 'object') continue;
      for (const [ph, v] of Object.entries(z.kandidaten)) {
        if (data.kandidaten_verworfen.includes(ph)) continue;
        const e = map.get(ph) || {ph, total: 0, songs: new Set()};
        e.total += +v || 0;
        e.songs.add(z.lied_id);
        map.set(ph, e);
      }
    }
    return [...map.values()].sort((a, b) => b.total - a.total || a.ph.localeCompare(b.ph));
  }

  function candidateEntry(data, ph) {
    return data.laute.find(l => l.status !== 'freigegeben' && (l.schreibweise_in_daten === ph || l.id === slug(ph))) || null;
  }

  // Kandidat einem Laut zuschlagen; target '__neu' legt einen neuen Laut an. Gibt die Laut-id zurück.
  function approveCandidate(data, ph, target) {
    let id = target;
    if (target === '__neu') {
      // Steht der Kandidat schon in data.laute (Status „kandidat“), wird dieser Eintrag freigegeben.
      const known = candidateEntry(data, ph);
      if (known) {
        known.status = 'freigegeben';
        known.name = known.name.charAt(0).toUpperCase() + known.name.slice(1);
        id = known.id;
      } else {
        const base = slug(ph);
        id = base;
        let k = 2;
        while (data.laute.some(l => l.id === id)) id = base + '-' + k++;
        const neu = {id, name: ph.charAt(0).toUpperCase() + ph.slice(1), status: 'freigegeben'};
        if (Array.isArray(data.familien) && data.familien.length) {
          neu.familie = 'weitere';
          if (!data.familien.some(f => f.id === 'weitere')) data.familien.push({id: 'weitere', name: 'Weitere Laute'});
        }
        data.laute.push(neu);
      }
    }
    for (const z of data.zaehlungen) {
      if (!z.kandidaten || !(ph in z.kandidaten)) continue;
      const add = +z.kandidaten[ph] || 0;
      if (z.werte) z.werte[id] = (+z.werte[id] || 0) + add;
      if (z.anzahl_aufgeloest && typeof z.anzahl_aufgeloest === 'object') z.anzahl_aufgeloest[id] = (+z.anzahl_aufgeloest[id] || 0) + add;
      delete z.kandidaten[ph];
    }
    return id;
  }

  function patternFor(s) {
    if (PATTERNS[s.id]) return PATTERNS[s.id];
    const parts = String(s.name).toLowerCase().split(/[\s\-,]+/).filter(Boolean).map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return String.raw`\b` + parts.join(SEP + '*') + String.raw`\b`;
  }
  // Zählt Lautfolgen der Reihe nach; Treffer werden maskiert, damit z. B. Schalala nicht auch als Lalala zählt.
  // Das Schalala-Muster erkennt beide Schreibweisen (mit und ohne c) und Silben mit Leerzeichen dazwischen.
  function countText(text, snds) {
    let work = String(text || '');
    const out = {};
    for (const s of snds) {
      let re;
      try { re = new RegExp(patternFor(s), 'gi'); } catch (e) { out[s.id] = 0; continue; }
      let n = 0;
      work = work.replace(re, m => { n++; return ' '.repeat(m.length); });
      out[s.id] = n;
    }
    return out;
  }

  // Monotone kubische Interpolation (Fritsch–Carlson): kein Überschwingen, Werte bleiben >= 0.
  function monotone(ys) {
    const n = ys.length;
    if (n === 1) return () => ys[0];
    const d = [], m = new Array(n);
    for (let i = 0; i < n - 1; i++) d[i] = ys[i + 1] - ys[i];
    m[0] = d[0];
    m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
    for (let i = 0; i < n - 1; i++) {
      if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
      const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
      if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
    }
    return t => {
      const i = Math.max(0, Math.min(n - 2, Math.floor(t))), u = t - i, u2 = u * u, u3 = u2 * u;
      return Math.max(0, (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * m[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * m[i + 1]);
    };
  }
  function niceStep(max) {
    const raw = max / 4, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  }

  const SM = {
    TYPES, TYPE_LABEL, GRUND_RANK, GRUND_LABEL, SICHER_RANK, MAX_SOUNDS, PATTERNS,
    esc, fmt, slug, isHttp, textMitLinks, normalize, families, sounds, yearOf, countable, bestOf, value, derive, albums, phaseInfo, liedOrdnung, phaseCols, consensus, fanZaehlungen, namenListe, KEINE, withFans, fanVorschlaege,
    candidates, candidateEntry, approveCandidate, patternFor, countText, monotone, niceStep,
    DRAFT_KEY: 'shalalameter-entwurf',
  };
  root.SM = SM;
  if (typeof module !== 'undefined' && module.exports) module.exports = SM;
})(typeof window !== 'undefined' ? window : globalThis);
