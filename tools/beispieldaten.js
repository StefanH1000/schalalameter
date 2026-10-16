// Erzeugt erfundene Beispieldaten im Cowork-Format: node tools/beispieldaten.js
// Wird durch die echte shalalameter-daten.json aus Cowork ersetzt.
const fs = require('fs');
const path = require('path');

let seed = 11;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pois = mean => { let n = 0, p = Math.exp(-mean), s = p; const u = rnd(); while (u > s && n < 12) { n++; p *= mean / n; s += p; } return n; };

const laute = [
  {id: 'piu', name: 'Piu piu', status: 'freigegeben'},
  {id: 'shalala', name: 'Shalala', status: 'freigegeben'},
  {id: 'lalala', name: 'Lalala', status: 'freigegeben'},
  {id: 'nanana', name: 'Nanana', status: 'freigegeben'},
  {id: 'ohoho', name: 'Oh-oh-oh', status: 'freigegeben'},
];
const plan = {2016: 4, 2017: 5, 2018: 2, 2019: 5, 2020: 2, 2021: 6, 2022: 4, 2023: 4, 2024: 6, 2025: 5};
const lieder = [], zaehlungen = [];
let n = 0;
for (const [ys, k] of Object.entries(plan)) {
  const y = +ys, t = (y - 2016) / 9;
  for (let i = 0; i < k; i++) {
    n++;
    const id = 'beispiel-' + n;
    const typ = (y === 2019 && i >= 3) ? 'uebersetzung' : (n % 9 === 0 ? 'cover' : 'original');
    const month = String(1 + Math.floor(rnd() * 12)).padStart(2, '0');
    lieder.push({id, titel: `Beispiellied ${n}`, erstveroeffentlichung: `${y}-${month}-01`, veroeffentlichung: `Beispielalbum ${y}`, auch_auf: [], typ, original_id: null, notiz: ''});
    if (n % 7 === 3) {
      zaehlungen.push({lied_id: id, grundlage: 'online_text', quelle_url: '', quelle_art: 'community', gezaehlt_von: 'beispiel', gezaehlt_am: '2026-10-16', status: 'kein_text_gefunden', werte: null, sicherheit: 'niedrig', notiz: 'Kein Text gefunden'});
      continue;
    }
    const werte = {
      piu: pois(0.3 + 3.2 * t),
      shalala: pois(y === 2021 ? 4.5 : 0.6 + 1.2 * Math.sin(t * 3)),
      lalala: pois(2.6 - 2.1 * t),
      nanana: pois(0.8),
      ohoho: pois(0.6 + 0.5 * t),
    };
    const sich = ['hoch', 'mittel', 'mittel', 'niedrig'][Math.floor(rnd() * 4)];
    const z = {lied_id: id, grundlage: 'online_text', quelle_url: 'https://example.org/beispiel/' + n, quelle_art: sich === 'hoch' ? 'offiziell' : 'community',
      gezaehlt_von: 'beispiel', gezaehlt_am: '2026-10-16', status: 'gezaehlt', werte, anzahl_aufgeloest: null, belege: {}, kandidaten: {}, sicherheit: sich, notiz: ''};
    if (rnd() < 0.3) {
      z.anzahl_aufgeloest = {...werte};
      const big = Object.keys(werte).sort((a, b) => werte[b] - werte[a])[0];
      z.anzahl_aufgeloest[big] = werte[big] * 2;
      z.notiz = 'Refrain im Text nur einmal ausgeschrieben';
    }
    if (rnd() < 0.25) z.kandidaten['hey hey hey'] = 1 + Math.floor(rnd() * 3);
    if (y >= 2023 && rnd() < 0.4) z.kandidaten['bumm'] = 1 + Math.floor(rnd() * 4);
    if (n === 12) z.kandidaten['dubidu'] = 3;
    zaehlungen.push(z);
    if (n % 5 === 1) {
      const b = {...werte, shalala: werte.shalala + 1};
      zaehlungen.push({...z, grundlage: 'booklet', quelle_url: '', quelle_art: 'offiziell', gezaehlt_von: 'beispiel-fan', sicherheit: 'hoch', werte: b, anzahl_aufgeloest: null, kandidaten: {}, notiz: 'Beispiel: zweite Zählung nach Booklet'});
    }
  }
}

const out = path.join(__dirname, '..', 'daten', 'shalalameter-daten.json');
fs.writeFileSync(out, JSON.stringify({version: 1, beispiel: true, laute, lieder, zaehlungen, kandidaten_verworfen: []}, null, 2) + '\n');
console.log(`${lieder.length} Lieder, ${zaehlungen.length} Zählungen -> ${out}`);
