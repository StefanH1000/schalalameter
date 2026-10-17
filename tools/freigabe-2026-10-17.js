// Einmalig: die Kandidaten aus dem Booklet von „Revolution!“ freigeben, „Fiki hey“ nachtragen, Familien zuordnen.
// node tools/freigabe-2026-10-17.js
const fs = require('fs');
const path = require('path');
const SM = require('../assets/core.js');

const file = path.join(__dirname, '..', 'daten', 'shalalameter-daten.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

// „Fiki hey!“ in „Die Polyintensiven“ zählt doch, als Ruf.
const poly = data.zaehlungen.find(z => z.lied_id === 'die-polyintensiven' && z.grundlage === 'booklet');
poly.kandidaten['fiki hey'] = 1;
poly.belege['fiki hey'] = ['fiki hey'];
poly.notiz = '';

const FAMILIE = {
  'dub-di-dub-di-dubb': 'instrumente', 'kuruu-kuruu': 'instrumente', 'ram-tam-tam': 'instrumente', 'tatütata': 'instrumente',
  'fiki hey': 'jubel',
};
for (const [ph, fam] of Object.entries(FAMILIE)) {
  const id = SM.approveCandidate(data, ph, '__neu');
  const laut = data.laute.find(l => l.id === id);
  laut.familie = fam;
  laut.schreibweise_in_daten = ph;
  // Belege unter der Laut-ID statt unter dem Kandidatentext.
  for (const z of data.zaehlungen) if (z.belege && z.belege[ph]) { z.belege[id] = z.belege[ph]; delete z.belege[ph]; }
}
// Die Hilfsfamilie „Weitere Laute“ ist leer, sobald alle neuen Laute zugeordnet sind.
if (!data.laute.some(l => l.familie === 'weitere')) data.familien = data.familien.filter(f => f.id !== 'weitere');

fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
console.log(data.laute.slice(-5).map(l => `${l.id} (${l.name}) → ${l.familie}`).join('\n'));
