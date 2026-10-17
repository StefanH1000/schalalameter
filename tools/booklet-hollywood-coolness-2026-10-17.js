// Einmalig: Zählungen nach den Booklets von „Live at the Hollywood Bowl“ (beide Seiten der Textbeilage)
// und „Das Ende der Coolness Vol. 2“ (nur Seite 4, ohne das Titellied) eintragen.
// node tools/booklet-hollywood-coolness-2026-10-17.js
// Die Texte selbst werden nicht gespeichert, nur die Zahlen und der Laut als Beleg.
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'daten', 'shalalameter-daten.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

// werte: freigegebene Laute; kandidaten: neue Laute (erscheinen erst nach Freigabe).
const BOOKLET = {
  // Live at the Hollywood Bowl
  'life-at-the-hollywood-bowl': {kandidaten: {uuuuh: 1},
    notiz: '„Pepsi Becher Service Boy, uuuuh“. Kein „Hey hey hey“ im Booklet (Online-Text: 2).'},
  'internet-zerf-cken': {werte: {'uh-uh-uh': 3}, belege: {'uh-uh-uh': Array(3).fill('Uh uh uh uh uuh')},
    notiz: '„EinsNull“ sind Wörter, kein Laut.'},
  'ciao-kakao': {werte: {'whoopie-whoopie': 3, 'uh-uh-uh': 1},
    belege: {'whoopie-whoopie': Array(3).fill('whoopie whoopie'), 'uh-uh-uh': ['Uh uh uh ah']},
    notiz: 'Online-Text: 4× Whoopie whoopie, Booklet 3×. „Uhm ja …“ als Zögern nicht gezählt.'},
  'slowly-fades-away': {},
  'ray-of-fukin-sunshine': {werte: {'yeah-yeah-yeah': 4, 'ladi-dadi-dai': 3},
    belege: {'yeah-yeah-yeah': Array(4).fill('Yeah! Yeah! Yeah!'), 'ladi-dadi-dai': Array(3).fill('Ladi dadi dai')}},
  'bosch-blau': {},
  'i-want-to-misbehave': {},
  marklin: {notiz: '„ey“ zählt als Wort.'},
  'ich-trag-so-viele-bilder': {},
  'kleines-herz': {},
  'unfug-the-world': {},
  'makelloses-fieber': {},
  // Das Ende der Coolness Vol. 2, Booklet Seite 4
  matrosen: {},
  'alles-explodiert': {werte: {kawumm: 1, bumm: 3, ole: 1},
    belege: {kawumm: ['kawumm!'], bumm: ['bumm', 'bumm', 'bumm'], ole: ['olé olé olé']},
    notiz: 'Booklet druckt „kawumm! / bumm, bumm, bumm“ nur einmal (Online-Text: 3 Blöcke, bumm 9, kawumm 3, olé 3).'},
  bumsrepublik: {},
  'coffee-keeps-me-busy': {notiz: '„mau-mau“ ist das Kartenspiel, kein Laut.'},
  'zwei-himmel': {},
  'ein-analoges-madchen': {},
  'das-heilige-kanonenrohr': {},
  rakete: {},
  'der-tag': {notiz: '„ey“ zählt als Wort.'},
  pizzablitz: {},
  pony: {},
};

const laute = data.laute.filter(l => l.status === 'freigegeben').map(l => l.id);
for (const [id, b] of Object.entries(BOOKLET)) {
  if (!data.lieder.some(l => l.id === id)) throw new Error('Lied fehlt: ' + id);
  for (const l of Object.keys(b.werte || {})) if (!laute.includes(l)) throw new Error('Laut fehlt: ' + l);
  const werte = {...Object.fromEntries(laute.map(l => [l, 0])), ...(b.werte || {})};
  const belege = {...(b.belege || {}), ...Object.fromEntries(Object.entries(b.kandidaten || {}).map(([ph, n]) => [ph, Array(n).fill(ph)]))};
  data.zaehlungen.push({
    lied_id: id, grundlage: 'booklet', quelle_url: '', quelle_art: 'offiziell',
    gezaehlt_von: 'claude', gezaehlt_am: '2026-10-17', status: 'gezaehlt',
    werte, anzahl_aufgeloest: null, belege, kandidaten: b.kandidaten || {},
    sicherheit: 'hoch', notiz: b.notiz || '',
  });
}

fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
console.log(`${Object.keys(BOOKLET).length} Booklet-Zählungen.`);
