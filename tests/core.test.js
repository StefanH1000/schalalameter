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

test('Gleichstand zwischen Quellen: mehr Laute gewinnen', () => {
  const zs = [
    {grundlage: 'online_text', sicherheit: 'mittel', quelle_art: 'lizenziert', status: 'gezaehlt', werte: {a: 0}},
    {grundlage: 'online_text', sicherheit: 'mittel', quelle_art: 'lizenziert', status: 'gezaehlt', werte: {a: 5}},
  ];
  assert.strictEqual(SM.bestOf(zs).werte.a, 5);
});

test('Kandidaten nur aus der besten Zählung je Lied', () => {
  const data = SM.normalize({
    laute: [{id: 'a', name: 'A', status: 'freigegeben'}], lieder: [{id: '1'}],
    zaehlungen: [
      {lied_id: '1', status: 'gezaehlt', sicherheit: 'hoch', werte: {a: 0}, kandidaten: {bumm: 9}},
      {lied_id: '1', status: 'gezaehlt', sicherheit: 'mittel', werte: {a: 0}, kandidaten: {bumm: 9, kawumm: 3}},
    ],
  });
  assert.deepStrictEqual(SM.candidates(data).map(c => [c.ph, c.total]), [['bumm', 9]]);
});

test('aufgelöste Refrains nur auf Wunsch', () => {
  const z = {werte: {a: 2}, anzahl_aufgeloest: {a: 6}};
  assert.strictEqual(SM.value(z, 'a', false), 2);
  assert.strictEqual(SM.value(z, 'a', true), 6);
  assert.strictEqual(SM.value({werte: {a: 2}, anzahl_aufgeloest: 6}, 'a', true), 2);
});

/* ---------- Albumphasen ---------- */
const ALBEN = [
  {id: 'a1', titel: 'Erstes', datum: '2016-02-26', reihenfolge: 1},
  {id: 'a2', titel: 'Zweites', datum: '2017-08-18', reihenfolge: 2},
  {id: 'a3', titel: 'Drittes', datum: '2019-05-03', reihenfolge: 3},
];
const phase = (lied, extra = []) => SM.phaseInfo(SM.normalize({alben: ALBEN, lieder: [lied, ...extra], zaehlungen: []}), lied);

test('Phase Regel 1: Überschreibung im Feld „phase“ gewinnt immer', () => {
  const p = phase({id: 'x', veroeffentlichung: 'Zweites (Album)', erstveroeffentlichung: '2017-08-18', phase: 'a3'});
  assert.strictEqual(p.album.id, 'a3');
  assert.strictEqual(p.regel, 1);
});

test('Phase Regel 2: Übersetzung folgt dem Original, auch dessen Überschreibung', () => {
  const orig = {id: 'o', veroeffentlichung: 'Erstes (Album)', erstveroeffentlichung: '2016-02-26'};
  const ueb = {id: 'u', typ: 'uebersetzung', original_id: 'o', veroeffentlichung: 'Fremd (Album)', erstveroeffentlichung: '2019-09-27'};
  assert.deepStrictEqual([phase(ueb, [orig]).album.id, phase(ueb, [orig]).regel], ['a1', 2]);
  assert.strictEqual(phase(ueb, [{...orig, phase: 'a2'}]).album.id, 'a2');
});

test('Phase Regel 3: Studioalbum über veroeffentlichung oder auch_auf, bei mehreren das erste', () => {
  assert.strictEqual(phase({id: 'x', veroeffentlichung: 'Drittes (Album)', erstveroeffentlichung: '2016-01-01'}).album.id, 'a3');
  const beide = phase({id: 'y', veroeffentlichung: 'Single (Single)', erstveroeffentlichung: '2019-04-01',
    auch_auf: ['Drittes (2019-05-03)', 'Zweites (2017-08-18)']});
  assert.deepStrictEqual([beide.album.id, beide.regel], ['a2', 3]);
  // Eine gleichnamige Single ist kein Studioalbum.
  assert.strictEqual(phase({id: 'z', veroeffentlichung: 'Drittes (Single)', erstveroeffentlichung: '2016-03-01'}).regel, 4);
});

test('Phase Regel 4: sonst das zeitlich nächste Album, Gleichstand wird gemeldet', () => {
  const p = phase({id: 'x', veroeffentlichung: 'Single (Single)', erstveroeffentlichung: '2018-01-24'});
  assert.deepStrictEqual([p.album.id, p.regel, p.abstand, p.unklar], ['a2', 4, 159, false]);
  const t = SM.phaseInfo(SM.normalize({alben: [{id: 'p', titel: 'P', datum: '2020-01-01'}, {id: 'q', titel: 'Q', datum: '2020-01-11'}],
    lieder: [{id: 'm', erstveroeffentlichung: '2020-01-06'}], zaehlungen: []}), {id: 'm', erstveroeffentlichung: '2020-01-06'});
  assert.strictEqual(t.unklar, true);
});

test('Phasenspalten: alle Alben in Reihenfolge, auch leere; Filter wirken', () => {
  const data = SM.normalize({
    alben: ALBEN,
    laute: [{id: 'a', name: 'A', status: 'freigegeben'}],
    lieder: [
      {id: '1', titel: 'Eins', erstveroeffentlichung: '2016-02-26', veroeffentlichung: 'Erstes (Album)', typ: 'original'},
      {id: '2', titel: 'Zwei', erstveroeffentlichung: '2019-05-03', veroeffentlichung: 'Drittes (Album)', typ: 'original'},
      {id: '3', titel: 'Drei', erstveroeffentlichung: '2019-05-03', veroeffentlichung: 'Drittes (Album)', typ: 'cover'},
      {id: '4', titel: 'Vier', erstveroeffentlichung: '2019-05-03', veroeffentlichung: 'Drittes (Album)', typ: 'original'},
    ],
    zaehlungen: [
      {lied_id: '1', status: 'gezaehlt', grundlage: 'online_text', sicherheit: 'hoch', werte: {a: 4}},
      {lied_id: '2', status: 'gezaehlt', grundlage: 'online_text', sicherheit: 'niedrig', werte: {a: 2}},
      {lied_id: '3', status: 'gezaehlt', grundlage: 'online_text', sicherheit: 'hoch', werte: {a: 9}},
    ],
  });
  const songs = SM.derive(data, {typeOn: new Set(['original']), minSicher: 1, aufl: false});
  const cols = SM.phaseCols(data, songs, SM.sounds(data), 'sum');
  assert.deepStrictEqual(cols.map(c => c.key), ['a1', 'a2', 'a3']);
  assert.deepStrictEqual(cols.map(c => c.counts.a), [4, 0, 2]);
  assert.deepStrictEqual(cols.map(c => c.year), [2016, 2017, 2019]);
  assert.strictEqual(cols[2].songs.length, 2);
  assert.strictEqual(cols[2].counted.length, 1);
  const strict = SM.derive(data, {typeOn: new Set(['original']), minSicher: 3, aufl: false});
  assert.deepStrictEqual(SM.phaseCols(data, strict, SM.sounds(data), 'sum').map(c => c.counts.a), [4, 0, 0]);
  const mitCover = SM.derive(data, {typeOn: new Set(['original', 'cover']), minSicher: 1, aufl: false});
  assert.strictEqual(SM.phaseCols(data, mitCover, SM.sounds(data), 'sum')[2].counts.a, 11);
});

test('Daten: festgelegte Überschreibungen und Beispiele der Zuordnung', () => {
  const d = SM.normalize(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'daten', 'shalalameter-daten.json'), 'utf8')));
  const ph = id => SM.phaseInfo(d, d.lieder.find(l => l.id === id));
  for (const id of ['trust-me-i-m-an-alien', 'druckerkolonne', 'bella-ciao', 'die-ewige-sabine', 'hossegor', 'hooray-hooray', 'vereinsheim']) {
    assert.deepStrictEqual([ph(id).album.id, ph(id).regel], ['helm-ab', 1], id);
  }
  assert.deepStrictEqual([ph('weltuntergang').album.id, ph('weltuntergang').regel], ['rueckkehr', 1]);
  assert.deepStrictEqual([ph('brusseler-platz').album.id, ph('brusseler-platz').regel], ['solo-1', 3]);
  assert.strictEqual(ph('deux-cieux').album.id, ph('zwei-himmel').album.id);
  // Überschreibungen nur dort, wo festgelegt; alle übrigen Phasen werden berechnet.
  assert.deepStrictEqual(d.lieder.filter(l => l.phase).map(l => l.id).sort(),
    ['bella-ciao', 'die-ewige-sabine', 'druckerkolonne', 'hooray-hooray', 'hossegor', 'trust-me-i-m-an-alien', 'vereinsheim', 'weltuntergang']);
});

test('Daten: jedes Lied gehört genau einer der neun Albumphasen an', () => {
  const d = SM.normalize(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'daten', 'shalalameter-daten.json'), 'utf8')));
  const ids = SM.albums(d).map(a => a.id);
  assert.strictEqual(ids.length, 9);
  const songs = SM.derive(d, {typeOn: new Set(SM.TYPES.map(t => t.id)), minSicher: 1, aufl: false});
  for (const s of songs) {
    const p = SM.phaseInfo(d, s.l);
    assert.ok(p && ids.includes(p.album.id), `${s.l.titel} ohne Phase`);
    assert.ok(!p.unklar, `${s.l.titel}: Gleichstand zweier Alben`);
  }
  const cols = SM.phaseCols(d, songs, SM.sounds(d), 'sum');
  assert.strictEqual(cols.reduce((t, c) => t + c.songs.length, 0), d.lieder.length, 'jedes Lied in genau einer Spalte');
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

test('Kandidat aus der Laute-Liste wird freigegeben statt doppelt angelegt', () => {
  const data = SM.normalize({
    laute: [{id: 'a', name: 'A', status: 'freigegeben'}, {id: 'bumm', name: 'bumm', status: 'kandidat', schreibweise_in_daten: 'bumm'}],
    lieder: [{id: '1'}],
    zaehlungen: [{lied_id: '1', werte: {a: 0}, kandidaten: {bumm: 9}}],
  });
  assert.strictEqual(SM.approveCandidate(data, 'bumm', '__neu'), 'bumm');
  assert.strictEqual(data.laute.length, 2);
  assert.deepStrictEqual(SM.sounds(data).map(s => s.name), ['A', 'Bumm']);
  assert.strictEqual(data.zaehlungen[0].werte.bumm, 9);
});

test('Familien bestimmen die Farbe, neue Laute landen in „Weitere Laute“', () => {
  const data = SM.normalize({
    familien: [{id: 'x', name: 'X'}, {id: 'y', name: 'Y'}],
    laute: [{id: 'a', name: 'A', status: 'freigegeben', familie: 'y'}, {id: 'b', name: 'B', status: 'freigegeben', familie: 'y'}],
    lieder: [{id: '1'}],
    zaehlungen: [{lied_id: '1', werte: {a: 1}, kandidaten: {'peng peng': 2}}],
  });
  assert.deepStrictEqual(SM.families(data).map(f => [f.id, f.slot]), [['y', 2]]);
  assert.deepStrictEqual(SM.sounds(data).map(s => s.slot), [2, 2]);
  SM.approveCandidate(data, 'peng peng', '__neu');
  assert.deepStrictEqual(SM.families(data).map(f => f.id), ['y', 'weitere']);
});

test('Kurven schwingen nicht unter null', () => {
  const f = SM.monotone([0, 5, 0, 0, 7]);
  for (let t = 0; t <= 4; t += 0.05) assert.ok(f(t) >= 0);
  assert.strictEqual(f(2.5), 0);
});

test('Vorzählen erkennt Shalala und Schalala als denselben Laut', () => {
  const c = SM.countText('Shalala\nSchalala\nSha la la\nScha la la\nschalalala', SOUNDS);
  assert.strictEqual(c.shalala, 5);
  assert.strictEqual(c.lalala, 0);
});

test('jede Familie hat Anzeigename, Untertitel und Steckbrief', () => {
  const d = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'daten', 'shalalameter-daten.json'), 'utf8'));
  assert.ok(d.familien.length > 0);
  for (const f of d.familien) {
    for (const k of ['anzeigename', 'untertitel', 'steckbrief']) assert.ok(String(f[k] || '').trim(), `Familie ${f.id} ohne ${k}`);
  }
});

test('kein sichtbarer Text enthält noch „Shalala“', () => {
  const root = path.join(__dirname, '..');
  // Seiten und Skripte: „Shalala“ mit großem S ist nie eine interne Kennung (die heißen shalala, shalalameter).
  for (const f of ['index.html', 'werkstatt.html', 'impressum.html', 'datenschutz.html', 'assets/app.js', 'assets/werkstatt.js', 'assets/core.js']) {
    const txt = fs.readFileSync(path.join(root, f), 'utf8');
    assert.ok(!/Shalala/.test(txt), `${f} enthält „Shalala“`);
  }
  // Daten: alles, was die Seite anzeigt. Liedtitel wie „Anleitung zum Sha-la-la“ bleiben, wie sie heißen.
  const d = JSON.parse(fs.readFileSync(path.join(root, 'daten', 'shalalameter-daten.json'), 'utf8'));
  const sichtbar = [
    ...d.laute.map(l => l.name),
    ...d.familien.flatMap(f => [f.name, f.anzeigename, f.untertitel, f.steckbrief]),
    ...d.lieder.map(l => l.notiz),
    ...d.zaehlungen.map(z => z.notiz),
  ];
  for (const t of sichtbar) assert.ok(!/shalala/i.test(t || ''), `sichtbarer Datentext enthält „Shalala“: ${t}`);
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
