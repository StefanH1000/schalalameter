// Einmalig: alle Kandidaten freigeben und den Lauten Familien zuordnen.
// node tools/freigabe-2026-10-16.js
const fs = require('fs');
const path = require('path');
const SM = require('../assets/core.js');

const file = path.join(__dirname, '..', 'daten', 'shalalameter-daten.json');
const data = SM.normalize(JSON.parse(fs.readFileSync(file, 'utf8')));

// Reihenfolge = Farbreihenfolge der Kurven.
data.familien = [
  {id: 'piu', name: 'Piu piu'},
  {id: 'shalala', name: 'Shalala'},
  {id: 'silben', name: 'La-la, Da-da & Co.'},
  {id: 'knall', name: 'Bumm & Kawumm'},
  {id: 'rufe', name: 'Oh, Ah, Uh'},
  {id: 'instrumente', name: 'Dudeln & Tröten'},
  {id: 'jubel', name: 'Hey, Yeah, Olé'},
];
const FAMILIE = {
  piu: 'piu',
  shalala: 'shalala',
  lalala: 'silben', nanana: 'silben', 'da-da': 'silben', 'da-da-da': 'silben', 'lo-lo-lo': 'silben', 'ba-ba-ba': 'silben', 'ladi-dadi-dai': 'silben',
  bumm: 'knall', kawumm: 'knall', 'boom-laboom': 'knall',
  ohoho: 'rufe', 'ah-ah': 'rufe', 'ah-ah-ah': 'rufe', 'ah-ah-oh-ah-ah': 'rufe', 'ah-uh': 'rufe', 'uh-uh-uh': 'rufe', 'mh-mh-mh-hm': 'rufe',
  dudeldudeldudel: 'instrumente', 'dum-didi-dum': 'instrumente', 'ta-ta-ra-ta-ta': 'instrumente', 'humpe-tateraa': 'instrumente', 'fuzzi-fuzzi-fuzz': 'instrumente',
  'hey-hey-hey': 'jubel', 'yeah-yeah-yeah': 'jubel', ole: 'jubel', 'hooray-hooray': 'jubel', 'whoopie-whoopie': 'jubel',
};

// Alle Kandidaten aus der Laute-Liste und aus den Zählungen freigeben.
const phrases = new Set(data.laute.filter(l => l.status !== 'freigegeben').map(l => l.schreibweise_in_daten || l.name));
for (const z of data.zaehlungen) for (const ph of Object.keys(z.kandidaten || {})) phrases.add(ph);
for (const ph of phrases) SM.approveCandidate(data, ph, '__neu');

const offen = [];
for (const l of data.laute) {
  if (FAMILIE[l.id]) l.familie = FAMILIE[l.id];
  else offen.push(l.id);
}
if (offen.length) throw new Error('Ohne Familie: ' + offen.join(', '));

fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
console.log(`${data.laute.filter(l => l.status === 'freigegeben').length} Laute freigegeben, ${data.familien.length} Familien.`);
