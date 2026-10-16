// Shalalameter – gemeinsame Datenlogik für Seite, Werkstatt und Tests.
(function (root) {
  const TYPES = [
    {id: 'original', name: 'Eigene Lieder', on: true},
    {id: 'uebersetzung', name: 'Übersetzungen', on: false},
    {id: 'cover', name: 'Cover', on: false},
    {id: 'unklar', name: 'Unklar', on: false},
  ];
  const TYPE_LABEL = {original: 'Original', uebersetzung: 'Übersetzung', cover: 'Cover', unklar: 'unklar'};
  const GRUND_RANK = {booklet: 3, gehoert: 2, online_text: 1};
  const GRUND_LABEL = {booklet: 'Booklet', gehoert: 'nach Gehör', online_text: 'Online-Text'};
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

  function normalize(d) {
    if (!d || !Array.isArray(d.lieder) || !Array.isArray(d.zaehlungen)) return null;
    d.laute = Array.isArray(d.laute) ? d.laute.filter(l => l && l.id) : [];
    d.kandidaten_verworfen = Array.isArray(d.kandidaten_verworfen) ? d.kandidaten_verworfen : [];
    d.lieder = d.lieder.filter(l => l && l.id);
    d.zaehlungen = d.zaehlungen.filter(z => z && z.lied_id);
    return d;
  }

  // Farbe folgt dem Laut (Position in data.laute), nicht dem Rang.
  function sounds(data) {
    return data.laute.filter(l => l.status === 'freigegeben').slice(0, MAX_SOUNDS).map((l, i) => ({...l, slot: i + 1}));
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
      return {l, all, best, year, typ, values, counted: trusted, lowConf: !!best && !trusted, shown: opts.typeOn.has(typ) && year != null};
    });
  }

  // Ein Eintrag pro Jahr zwischen erstem und letztem Jahr, auch für Jahre ohne Lieder.
  function yearCols(songs, snds, mode) {
    const shown = songs.filter(s => s.shown);
    if (!shown.length) return [];
    const years = shown.map(s => s.year);
    const y0 = Math.min(...years), y1 = Math.max(...years), cols = [];
    for (let y = y0; y <= y1; y++) {
      const inY = shown.filter(s => s.year === y), counted = inY.filter(s => s.counted), counts = {};
      for (const snd of snds) {
        const sum = counted.reduce((t, s) => t + (s.values[snd.id] || 0), 0);
        counts[snd.id] = mode === 'avg' ? (counted.length ? sum / counted.length : 0) : sum;
      }
      cols.push({year: y, songs: inY, counted, counts});
    }
    return cols;
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

  // Kandidat einem Laut zuschlagen; target '__neu' legt einen neuen Laut an. Gibt die Laut-id zurück.
  function approveCandidate(data, ph, target) {
    let id = target;
    if (target === '__neu') {
      const base = slug(ph);
      id = base;
      let k = 2;
      while (data.laute.some(l => l.id === id)) id = base + '-' + k++;
      data.laute.push({id, name: ph.charAt(0).toUpperCase() + ph.slice(1), status: 'freigegeben'});
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
  // Zählt Lautfolgen der Reihe nach; Treffer werden maskiert, damit z. B. Shalala nicht auch als Lalala zählt.
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
    esc, fmt, slug, isHttp, normalize, sounds, yearOf, countable, bestOf, value, derive, yearCols,
    candidates, approveCandidate, patternFor, countText, monotone, niceStep,
    DRAFT_KEY: 'shalalameter-entwurf',
  };
  root.SM = SM;
  if (typeof module !== 'undefined' && module.exports) module.exports = SM;
})(typeof window !== 'undefined' ? window : globalThis);
