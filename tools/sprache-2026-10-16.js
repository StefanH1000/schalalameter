// Einmalig: Schreibweise „Schalala“, Anzeigenamen, Untertitel und Steckbriefe der Familien.
// node tools/sprache-2026-10-16.js
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'daten', 'shalalameter-daten.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

// id bleibt; name ist der bisherige Name (für die Werkstatt), anzeigename der neue für die Seite.
const TEXTE = {
  piu: {name: 'Piu piu', anzeigename: 'Spatzenlaser', untertitel: 'Piu piu',
    steckbrief: 'Ein Vogel, der schießt, oder eine Waffe, die zwitschert. Oft gehört, doch nie gesungen.'},
  shalala: {name: 'Schalala', anzeigename: 'Schalalamente', untertitel: 'Schalala',
    steckbrief: 'Die Silbe für alles, was zugleich egal und heilig ist.'},
  silben: {name: 'La-la, Da-da & Co.', anzeigename: 'Silbenhack', untertitel: 'La la, Da da und Co',
    steckbrief: 'Wo der Text aufhört und alle trotzdem weitersingen.'},
  knall: {name: 'Bumm & Kawumm', anzeigename: 'Rummse', untertitel: 'Bumm und Kawumm',
    steckbrief: 'Der große Knall in kleinen Verhältnissen.'},
  rufe: {name: 'Oh, Ah, Uh', anzeigename: 'DNA Elemente eines erfüllten Lebens', untertitel: 'Oh, Ah, Uh',
    steckbrief: 'Staunen, Seufzen, Sehnen. Vokale ohne Worte drumherum.'},
  instrumente: {name: 'Dudeln & Tröten', anzeigename: 'Täterätätä im Pyjama', untertitel: 'Dudeln und Tröten',
    steckbrief: 'Blaskapelle, Kirmes und Fanfare aus einem einzigen Mund.'},
  jubel: {name: 'Hey, Yeah, Olé', anzeigename: 'Daseinslaute', untertitel: 'Hey, Yeah, Olé',
    steckbrief: 'Stadiongebrüll, das eigentlich eine Liebeserklärung ist.'},
};

for (const f of data.familien) {
  if (!TEXTE[f.id]) throw new Error('Keine Texte für Familie ' + f.id);
  Object.assign(f, TEXTE[f.id]);
}
const laut = data.laute.find(l => l.id === 'shalala');
laut.name = 'Schalala';

// Sichtbare Notizen nennen den Laut beim Namen; Liedtitel und Belege bleiben unverändert.
let n = 0;
for (const z of data.zaehlungen) {
  if (z.notiz && /\bshalala\b/i.test(z.notiz)) { z.notiz = z.notiz.replace(/\bshalala\b/gi, 'Schalala'); n++; }
}

fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
console.log(`${data.familien.length} Familien mit Texten, Laut „Schalala“, ${n} Notizen angepasst.`);
