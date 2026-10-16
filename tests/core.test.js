const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const SM = require('../assets/core.js');

const SOUNDS = [
  {id: 'piu', name: 'Piu piu'}, {id: 'shalala', name: 'Shalala'}, {id: 'lalala', name: 'Lalala'},
  {id: 'nanana', name: 'Nanana'}, {id: 'ohoho', name: 'Oh-oh-oh'},
];

test('zählt Lautfolgen statt Silben', () => {
  const c = SM.countText('piu piu piu\nund dann piu', SOUNDS);
  assert.strictEqual(c.piu, 2);
});

test('Shalala zählt nicht zusätzlich als Lalala', () => {
  const c = SM.countText('Shalala, sha-la-la-la, Schalala\nla la la', SOUNDS);
  assert.strictEqual(c.shalala, 3);
  assert.strictEqual(c.lalala, 1);
});

test('Komma und Zeilenumbruch trennen Lautfolgen', () => {
  const c = SM.countText('shalala, shalala\nla la\nla la', SOUNDS);
  assert.strictEqual(c.shalala, 2);
  assert.strictEqual(c.lalala, 2);
});

test('Nanana braucht drei Silben, „na na“ ist kein Laut', () => {
  const c = SM.countText('na na, so ist das\nna na na na', SOUNDS);
  assert.strictEqual(c.nanana, 1);
});

test('Oh-oh-oh und Uh-uh-uh', () => {
  const c = SM.countText('oh oh oh\nuh uh uh\noh, wie schön', SOUNDS);
  assert.strictEqual(c.ohoho, 2);
});

test('keine Treffer in normalen Wörtern', () => {
  const c = SM.countText('Lampe, Lala-Land? Nein: Laterne, Schal, Pinguin, Nase', SOUNDS);
  assert.strictEqual(c.piu, 0);
  assert.strictEqual(c.shalala, 0);
  assert.strictEqual(c.nanana, 0);
});

test('Muster für neue Laute aus dem Namen', () => {
  const c = SM.countText('Hey hey hey! hey-hey-hey', [{id: 'x', name: 'Hey hey hey'}]);
  assert.strictEqual(c.x, 2);
});

test('beste Zählung: Booklet vor Online-Text, dann Sicherheit', () => {
  const zs = [
    {grundlage: 'online_text', sicherheit: 'hoch', status: 'gezaehlt', werte: {a: 1}},
    {grundlage: 'booklet', sicherheit: 'niedrig', status: 'gezaehlt', werte: {a: 2}},
    {grundlage: 'booklet', sicherheit: 'hoch', status: 'gezaehlt', werte: {a: 3}},
    {grundlage: 'booklet', sicherheit: 'hoch', status: 'kein_text_gefunden', werte: null},
  ];
  assert.strictEqual(SM.bestOf(zs).werte.a, 3);
});

test('aufgelöste Refrains nur auf Wunsch', () => {
  const z = {werte: {a: 2}, anzahl_aufgeloest: {a: 6}};
  assert.strictEqual(SM.value(z, 'a', false), 2);
  assert.strictEqual(SM.value(z, 'a', true), 6);
  assert.strictEqual(SM.value({werte: {a: 2}, anzahl_aufgeloest: 6}, 'a', true), 2);
});

test('Jahre ohne Lieder erscheinen als leere Abschnitte, Filter wirken', () => {
  const data = SM.normalize({
    laute: [{id: 'a', name: 'A', status: 'freigegeben'}],
    lieder: [
      {id: '1', titel: 'Eins', erstveroeffentlichung: '2016-02-26', typ: 'original'},
      {id: '2', titel: 'Zwei', erstveroeffentlichung: '2018', typ: 'original'},
      {id: '3', titel: 'Drei', erstveroeffentlichung: '2018', typ: 'cover'},
      {id: '4', titel: 'Vier', erstveroeffentlichung: '2018', typ: 'original'},
    ],
    zaehlungen: [
      {lied_id: '1', status: 'gezaehlt', grundlage: 'online_text', sicherheit: 'hoch', werte: {a: 4}},
      {lied_id: '2', status: 'gezaehlt', grundlage: 'online_text', sicherheit: 'niedrig', werte: {a: 2}},
      {lied_id: '3', status: 'gezaehlt', grundlage: 'online_text', sicherheit: 'hoch', werte: {a: 9}},
    ],
  });
  const songs = SM.derive(data, {typeOn: new Set(['original']), minSicher: 1, aufl: false});
  const cols = SM.yearCols(songs, SM.sounds(data), 'sum');
  assert.deepStrictEqual(cols.map(c => c.year), [2016, 2017, 2018]);
  assert.deepStrictEqual(cols.map(c => c.counts.a), [4, 0, 2]);
  assert.strictEqual(cols[2].songs.length, 2);
  assert.strictEqual(cols[2].counted.length, 1);

  const strict = SM.derive(data, {typeOn: new Set(['original']), minSicher: 3, aufl: false});
  assert.deepStrictEqual(SM.yearCols(strict, SM.sounds(data), 'sum').map(c => c.counts.a), [4, 0, 0]);
});

test('Kandidat freigeben überträgt die Zahlen', () => {
  const data = SM.normalize({
    laute: [{id: 'a', name: 'A', status: 'freigegeben'}], lieder: [{id: '1'}],
    zaehlungen: [{lied_id: '1', werte: {a: 1}, kandidaten: {'hey hey': 3}}],
  });
  const id = SM.approveCandidate(data, 'hey hey', '__neu');
  assert.strictEqual(id, 'hey-hey');
  assert.strictEqual(data.zaehlungen[0].werte['hey-hey'], 3);
  assert.strictEqual(SM.candidates(data).length, 0);
  assert.strictEqual(SM.sounds(data).length, 2);
});

test('Kurven schwingen nicht unter null', () => {
  const f = SM.monotone([0, 5, 0, 0, 7]);
  for (let t = 0; t <= 4; t += 0.05) assert.ok(f(t) >= 0);
  assert.strictEqual(f(2.5), 0);
});

test('veröffentlichte Datendatei ist gültig', () => {
  const d = SM.normalize(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'daten', 'shalalameter-daten.json'), 'utf8')));
  assert.ok(d, 'Datei hat lieder und zaehlungen');
  const ids = new Set(d.lieder.map(l => l.id));
  assert.strictEqual(ids.size, d.lieder.length, 'Lied-ids sind eindeutig');
  for (const z of d.zaehlungen) assert.ok(ids.has(z.lied_id), `Zählung verweist auf unbekanntes Lied ${z.lied_id}`);
  for (const l of d.lieder) assert.ok(SM.yearOf(l), `Lied ${l.id} hat kein Jahr`);
  assert.ok(SM.sounds(d).length > 0, 'mindestens ein freigegebener Laut');
});
