// Schalalameter: Fanzählungen über die REST-Schnittstelle von Supabase (ohne Bibliothek).
// Lesen nur über die Ansicht fan_zaehlungen_oeffentlich, Einreichen nur über die Funktion zaehlung_einreichen.
(function (root) {
  const cfg = root.SCHALALA_SUPABASE || {};
  const ready = () => !!(cfg.url && cfg.key);

  function headers(extra) {
    const h = {apikey: cfg.key, Accept: 'application/json', ...extra};
    // Ältere anon-Schlüssel sind JWTs und gehören zusätzlich in Authorization; neue publishable keys nicht.
    if (/^eyJ/.test(cfg.key)) h.Authorization = 'Bearer ' + cfg.key;
    return h;
  }
  function base() { return String(cfg.url).replace(/\/+$/, '') + '/rest/v1/'; }

  // Alle sichtbaren Einreichungen, seitenweise. Nach timeoutMs wird abgebrochen und null geliefert,
  // dann zeigt die Seite nur die Datendatei.
  async function load(timeoutMs) {
    if (!ready()) return null;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs || 3000);
    try {
      const rows = [], page = 1000;
      for (let from = 0; ; from += page) {
        const res = await fetch(base() + 'fan_zaehlungen_oeffentlich?select=lied_id,laut_id,anzahl,vorschlag,grundlage',
          {headers: headers({Range: `${from}-${from + page - 1}`, 'Range-Unit': 'items'}), signal: ctrl.signal, cache: 'no-store'});
        if (!res.ok && res.status !== 206) throw new Error('HTTP ' + res.status);
        const chunk = await res.json();
        rows.push(...chunk);
        if (chunk.length < page) break;
      }
      return rows;
    } catch (e) {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  // Einreichen; wirft einen Fehler mit lesbarer Meldung.
  async function submit(z) {
    if (!ready()) throw new Error('Das Einreichen ist noch nicht freigeschaltet.');
    let res;
    try {
      res = await fetch(base() + 'rpc/zaehlung_einreichen', {
        method: 'POST',
        headers: headers({'Content-Type': 'application/json'}),
        body: JSON.stringify({
          p_lied_id: z.lied_id, p_laut_id: z.laut_id || '', p_anzahl: z.anzahl, p_vorschlag: z.vorschlag || '',
          p_spitzname: z.spitzname, p_grundlage: z.grundlage, p_geraet_id: z.geraet_id,
        }),
      });
    } catch (e) {
      throw new Error('Keine Verbindung. Bitte prüfe dein Netz und versuche es noch einmal.');
    }
    if (!res.ok) {
      let msg = '';
      try { msg = (await res.json()).message || ''; } catch (e) {}
      throw new Error(msg || `Die Zählung wurde nicht angenommen (Fehler ${res.status}).`);
    }
    return true;
  }

  root.SchalalaFans = {ready, load, submit};
})(window);
