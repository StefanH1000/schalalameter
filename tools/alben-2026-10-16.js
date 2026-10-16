// Einmalig: Albumphasen anlegen und die festgelegten Überschreibungen eintragen.
// node tools/alben-2026-10-16.js
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'daten', 'shalalameter-daten.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

// titel muss der Schreibweise in `veroeffentlichung` („<titel> (Album)“) und `auch_auf` („<titel> (<datum>)“) entsprechen.
data.alben = [
  {id: 'coolness', titel: 'Das Ende der Coolness Vol. 2', kurz: 'Coolness', datum: '2016-02-26', reihenfolge: 1},
  {id: 'hey-sexy', titel: 'Hey Sexy', kurz: 'Hey Sexy', datum: '2017-08-18', reihenfolge: 2},
  {id: 'helm-ab', titel: 'Helm ab zum Gebet', kurz: 'Helm ab', datum: '2019-05-03', reihenfolge: 3},
  {id: 'rueckkehr', titel: 'Die Rückkehr zur Normalität', kurz: 'Rückkehr', datum: '2021-06-04', reihenfolge: 4},
  {id: 'solo-1', titel: 'Solo I.', kurz: 'Solo I.', datum: '2022-03-25', reihenfolge: 5},
  {id: 'glitzerschwein', titel: 'Glitzerschwein', kurz: 'Glitzerschwein', datum: '2023-09-08', reihenfolge: 6},
  {id: 'universum', titel: 'Universum', kurz: 'Universum', datum: '2024-10-11', reihenfolge: 7},
  {id: 'himmelerdenblau', titel: 'Himmelerdenblau', kurz: 'Himmelerdenblau', datum: '2025-08-29', reihenfolge: 8},
  {id: 'hollywood-bowl', titel: 'Live at the Hollywood Bowl', kurz: 'Hollywood Bowl', datum: '2026-03-06', reihenfolge: 9},
];

const UEBERSCHREIBUNG = {
  // Regenradar-EP erschien einen Tag vor dem Album und gehört dazu.
  'trust-me-i-m-an-alien': 'helm-ab', druckerkolonne: 'helm-ab', 'bella-ciao': 'helm-ab', 'die-ewige-sabine': 'helm-ab',
  hossegor: 'helm-ab', 'hooray-hooray': 'helm-ab', vereinsheim: 'helm-ab',
  // Nach Datum läge Helm ab knapp näher (378 zu 385 Tage); inhaltlich gehört es zur Rückkehr.
  weltuntergang: 'rueckkehr',
};
for (const [id, phase] of Object.entries(UEBERSCHREIBUNG)) {
  const l = data.lieder.find(x => x.id === id);
  if (!l) throw new Error('Lied fehlt: ' + id);
  l.phase = phase;
}

fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
console.log(`${data.alben.length} Alben, ${Object.keys(UEBERSCHREIBUNG).length} Überschreibungen.`);
