// Einmalig: Zählungen nach dem Booklet (Textbeilage der LP) von „Revolution!“ eintragen.
// node tools/booklet-revolution-2026-10-17.js
// Die Texte selbst werden nicht gespeichert, nur die Zahlen und der Laut als Beleg.
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'daten', 'shalalameter-daten.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

// Neue Laute stehen als Kandidaten drin und erscheinen erst nach der Freigabe in der Werkstatt.
const BOOKLET = {
  rabenflugel: {kandidaten: {'kuruu-kuruu': 1, 'ram-tam-tam': 1},
    notiz: 'Raben und Perkussion in einer Zeile: „Kuruu-kuruu und Ram-tam-tam“, zwei Laute.'},
  'me-fall-like-rain': {notiz: 'Booklet-Titel „Me fall like rain??“. Das angehängte „ey“ zählt als Wort, nicht als Laut.'},
  'die-polyintensiven': {notiz: '„Fiki hey!“ nicht gezählt: unklar, ob Name oder Ruf.'},
  'ich-bade-meine-angst': {},
  'nudeln-mit-tomatensosse': {notiz: 'Fassung auf Revolution!. „Heave away“ ist Shanty-Text, kein Laut.'},
  'kleiner-kapitan': {},
  'ausflug-in-den-club': {kandidaten: {'dub-di-dub-di-dubb': 5}, notiz: 'Refrain einmal abgedruckt.'},
  'das-gerausch': {},
  'ich-bin-frei': {},
  'ich-mag-mich-fuhlen-wie-eine-taube': {},
  'cognac-fur-die-huren': {kandidaten: {'tatütata': 1},
    notiz: '„ein Tatütata“ als Nomen, aber reine Lautmalerei. „Hurra“ und „Halleluja“ sind hier Wörter und zählen nicht.'},
};

const laute = data.laute.filter(l => l.status === 'freigegeben').map(l => l.id);
for (const [id, b] of Object.entries(BOOKLET)) {
  if (!data.lieder.some(l => l.id === id)) throw new Error('Lied fehlt: ' + id);
  const werte = Object.fromEntries(laute.map(l => [l, 0]));
  const belege = Object.fromEntries(Object.entries(b.kandidaten || {}).map(([ph, n]) => [ph, Array(n).fill(ph)]));
  data.zaehlungen.push({
    lied_id: id, grundlage: 'booklet', quelle_url: '', quelle_art: 'offiziell',
    gezaehlt_von: 'claude', gezaehlt_am: '2026-10-17', status: 'gezaehlt',
    werte, anzahl_aufgeloest: null, belege, kandidaten: b.kandidaten || {},
    sicherheit: 'hoch', notiz: b.notiz || '',
  });
}
// Göppingen fehlt in der Textbeilage, vermutlich ein Instrumental.
data.zaehlungen.push({
  lied_id: 'goppingen', grundlage: 'booklet', quelle_url: '', quelle_art: 'offiziell',
  gezaehlt_von: 'claude', gezaehlt_am: '2026-10-17', status: 'kein_text_gefunden',
  werte: {}, anzahl_aufgeloest: null, belege: {}, kandidaten: {}, sicherheit: null,
  notiz: 'Kein Text im Booklet abgedruckt, vermutlich instrumental.',
});
for (const id of [...Object.keys(BOOKLET), 'goppingen']) {
  const l = data.lieder.find(x => x.id === id);
  l.notiz = String(l.notiz || '').replace(/ ?Noch nicht gezählt\./, '');
}

fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
console.log(`${Object.keys(BOOKLET).length} Booklet-Zählungen, Göppingen ohne Text.`);
