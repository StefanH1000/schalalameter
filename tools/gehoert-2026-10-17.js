// Einmalig: abgehörte Zählung für „Alles explodiert“ eintragen und „uuuuh“ dem Laut „Uh, uh, uh“ zuschlagen.
// node tools/gehoert-2026-10-17.js
const fs = require('fs');
const path = require('path');
const SM = require('../assets/core.js');

const file = path.join(__dirname, '..', 'daten', 'shalalameter-daten.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

// Abgehört vom Projektverantwortlichen. Olé wurde nicht abgehört und kommt aus dem Booklet.
const laute = data.laute.filter(l => l.status === 'freigegeben').map(l => l.id);
data.zaehlungen.push({
  lied_id: 'alles-explodiert', grundlage: 'gehoert', quelle_url: '', quelle_art: 'offiziell',
  gezaehlt_von: 'Projektverantwortlicher', gezaehlt_am: '2026-10-17', status: 'gezaehlt',
  werte: {...Object.fromEntries(laute.map(l => [l, 0])), kawumm: 2, bumm: 7, ole: 1},
  anzahl_aufgeloest: null, belege: {}, kandidaten: {}, sicherheit: 'hoch',
  notiz: 'Abgehört: 2× Kawumm, 7× Bumm. Olé nicht abgehört, aus dem Booklet übernommen.',
});

// „uuuuh“ („Life at the Hollywood Bowl“) zählt als „Uh, uh, uh“.
SM.approveCandidate(data, 'uuuuh', 'uh-uh-uh');
for (const z of data.zaehlungen) if (z.belege && z.belege.uuuuh) {
  z.belege['uh-uh-uh'] = [...(z.belege['uh-uh-uh'] || []), ...z.belege.uuuuh];
  delete z.belege.uuuuh;
}

fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
console.log('Alles explodiert abgehört, uuuuh → uh-uh-uh.');
