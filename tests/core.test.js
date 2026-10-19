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

test('Daten: jedes Lied gehört genau einer der zehn Albumphasen an', () => {
  const d = SM.normalize(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'daten', 'shalalameter-daten.json'), 'utf8')));
  const ids = SM.albums(d).map(a => a.id);
  assert.strictEqual(ids.length, 10);
  const songs = SM.derive(d, {typeOn: new Set(SM.TYPES.map(t => t.id)), minSicher: 1, aufl: false});
  for (const s of songs) {
    const p = SM.phaseInfo(d, s.l);
    assert.ok(p && ids.includes(p.album.id), `${s.l.titel} ohne Phase`);
    assert.ok(!p.unklar, `${s.l.titel}: Gleichstand zweier Alben`);
  }
  const cols = SM.phaseCols(d, songs, SM.sounds(d), 'sum');
  assert.strictEqual(cols.reduce((t, c) => t + c.songs.length, 0), d.lieder.length, 'jedes Lied in genau einer Spalte');
});

test('Liedreihenfolge: Albumphase, dann Tracks des Albums, dann übrige nach Datum', () => {
  const d = SM.normalize(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'daten', 'shalalameter-daten.json'), 'utf8')));
  const ordnung = SM.liedOrdnung(d);
  const titel = id => d.lieder.find(l => l.id === id);
  const sortiert = ids => ids.map(titel).sort(ordnung).map(l => l.id);
  // Glitzerschwein: Track 1, 2, 6, danach die Single von 2023-02-24
  assert.deepStrictEqual(sortiert(['autobahn', 'schau-mein-bruderherz-ich-blute', 'leck-mich-am-arsch-amore-mio', 'an-der-ecke-bellt-ein-hund']),
    ['an-der-ecke-bellt-ein-hund', 'leck-mich-am-arsch-amore-mio', 'autobahn', 'schau-mein-bruderherz-ich-blute']);
  // Frühere Albumphase vor späterer, auch wenn das Alphabet anders sortieren würde
  assert.deepStrictEqual(sortiert(['rabenflugel', 'pony']), ['pony', 'rabenflugel']);
  // Jedes eigene Lied auf einem Studioalbum seiner Phase hat eine Tracknummer
  for (const l of d.lieder.filter(l => l.typ === 'original')) {
    const p = SM.phaseInfo(d, l);
    if (p && l.veroeffentlichung === `${p.album.titel} (Album)`) assert.ok(Number.isInteger(l.track), `${l.titel} ohne Tracknummer`);
  }
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

/* ---------- Fanzählungen ---------- */
test('Konsens unter 3 Stimmen: Durchschnitt, aufgerundet', () => {
  assert.strictEqual(SM.consensus([4]), 4);
  assert.strictEqual(SM.consensus([4, 5]), 5);
  assert.strictEqual(SM.consensus([2, 3]), 3);
  assert.strictEqual(SM.consensus([0, 1]), 1);
  assert.strictEqual(SM.consensus([]), null);
});

test('Konsens ab 3 Stimmen: häufigster Wert', () => {
  assert.strictEqual(SM.consensus([9, 9, 3]), 9);
  assert.strictEqual(SM.consensus([1, 16, 16, 16, 2]), 16);
});

test('Konsens bei Gleichstand: Median aller Stimmen, aufgerundet', () => {
  assert.strictEqual(SM.consensus([1, 2, 3]), 2);
  assert.strictEqual(SM.consensus([4, 4, 7, 7]), 6);
  assert.strictEqual(SM.consensus([1, 1, 2, 2, 9]), 2);
});

const FANDATA = () => SM.normalize({
  laute: [{id: 'a', name: 'A', status: 'freigegeben'}, {id: 'b', name: 'B', status: 'freigegeben'}],
  lieder: [{id: 'l1', erstveroeffentlichung: '2020-01-01', typ: 'original'}, {id: 'l2', erstveroeffentlichung: '2020-01-01', typ: 'original'}],
  zaehlungen: [
    {lied_id: 'l1', grundlage: 'online_text', sicherheit: 'mittel', status: 'gezaehlt', werte: {a: 4, b: 1}},
    {lied_id: 'l2', grundlage: 'online_text', status: 'kein_text_gefunden', werte: null},
  ],
});

test('Fankonsens: Onlinezählung ist die erste Stimme, Laute ohne Fanstimme bleiben', () => {
  const d = FANDATA();
  const [z] = SM.fanZaehlungen(d, [{lied_id: 'l1', laut_id: 'a', anzahl: 8}]);
  assert.strictEqual(z.grundlage, 'fankonsens');
  assert.deepStrictEqual(z.werte, {a: 6, b: 1});       // (4 + 8) / 2 = 6; b unverändert
  assert.deepStrictEqual(z.fan, {a: 1});
  const drei = SM.fanZaehlungen(d, [8, 8].map(n => ({lied_id: 'l1', laut_id: 'a', anzahl: n})))[0];
  assert.strictEqual(drei.werte.a, 8);                   // Stimmen 4, 8, 8: häufigster Wert
  assert.strictEqual(drei.sicherheit, 'hoch');
  const ohneText = SM.fanZaehlungen(d, [{lied_id: 'l2', laut_id: 'b', anzahl: 3}])[0];
  assert.deepStrictEqual(ohneText.werte, {a: 0, b: 3});  // ohne Onlinezählung keine Onlinestimme
});

test('Fankonsens: unbekannte IDs, Vorschläge und ungültige Anzahlen zählen nicht', () => {
  const d = FANDATA();
  const rows = [
    {lied_id: 'gibts-nicht', laut_id: 'a', anzahl: 5},
    {lied_id: 'l1', laut_id: 'gibts-nicht', anzahl: 5},
    {lied_id: 'l1', laut_id: '', vorschlag: 'peng', anzahl: 2},
    {lied_id: 'l1', laut_id: 'a', anzahl: 500},
    {lied_id: 'l1', laut_id: 'a', anzahl: 2.5},
  ];
  assert.deepStrictEqual(SM.fanZaehlungen(d, rows), []);
  assert.deepStrictEqual(SM.fanVorschlaege(d, rows).map(v => [v.ph, v.n]), [['peng', 1]]);
});

test('Fankonsens: Vorschläge zählen erst nach der Freigabe, dann für den neuen Laut', () => {
  const d = FANDATA();
  const rows = [
    {lied_id: 'l1', laut_id: '', vorschlag: 'Peng peng', anzahl: 3},
    {lied_id: 'l1', laut_id: '', vorschlag: 'peng-peng', anzahl: 5},
    {lied_id: 'l1', laut_id: '', vorschlag: 'Zisch', anzahl: 2},
  ];
  assert.deepStrictEqual(SM.fanZaehlungen(d, rows), []);
  assert.deepStrictEqual(SM.fanVorschlaege(d, rows).map(v => [v.ph, v.n, v.total]), [['Peng peng', 2, 8], ['Zisch', 1, 2]]);
  const id = SM.approveCandidate(d, 'Peng peng', '__neu');
  const [z] = SM.fanZaehlungen(d, rows);
  assert.strictEqual(z.werte[id], 4);                    // Stimmen 3 und 5, ohne Onlinezählung
  assert.strictEqual(z.fan[id], 2);
  assert.deepStrictEqual(SM.fanVorschlaege(d, rows).map(v => v.ph), ['Zisch']);
  d.laute.find(l => l.id === id).aliase = ['zisch'];      // Alias: Zisch zählt ebenfalls für diesen Laut
  assert.strictEqual(SM.fanZaehlungen(d, rows)[0].fan[id], 3);
});

test('Fankonsens: Spitznamen je Lied, ausgeblendete (leere) Namen fehlen', () => {
  const d = FANDATA();
  const [z] = SM.fanZaehlungen(d, [
    {lied_id: 'l1', laut_id: 'a', anzahl: 8, spitzname: 'Kalle'},
    {lied_id: 'l1', laut_id: 'b', anzahl: 2, spitzname: 'Kalle'},
    {lied_id: 'l1', laut_id: 'a', anzahl: 7, spitzname: ''},
    {lied_id: 'l1', laut_id: 'a', anzahl: 6, spitzname: ' Taube '},
    {lied_id: 'l1', laut_id: '', vorschlag: 'Zisch', anzahl: 1, spitzname: 'Nur-Vorschlag'},
  ]);
  assert.deepStrictEqual(z.namen, ['Kalle', 'Taube']);   // Vorschlag ohne Freigabe zählt nicht, also auch kein Name
  assert.strictEqual(SM.namenListe(['A']), 'A');
  assert.strictEqual(SM.namenListe(['A', 'B']), 'A und B');
  assert.strictEqual(SM.namenListe(['A', 'B', 'C']), 'A, B und C');
  assert.strictEqual(SM.namenListe(['A', 'B', 'C', 'D']), 'A, B, C und einer weiteren Person');
  assert.strictEqual(SM.namenListe(['A', 'B', 'C', 'D', 'E']), 'A, B, C und 2 weiteren');
});

test('Fankonsens: „Keine Schalalas“ ist eine Stimme 0 für jeden Laut des Lieds', () => {
  const d = FANDATA();
  const [ohne] = SM.fanZaehlungen(d, [{lied_id: 'l2', laut_id: 'keine', anzahl: 0, spitzname: 'Kalle'}]);
  assert.deepStrictEqual(ohne.werte, {a: 0, b: 0});
  assert.deepStrictEqual(ohne.fan, {a: 1, b: 1});
  assert.strictEqual(ohne.fan_anzahl, 1);                // eine Einreichung, nicht eine je Laut
  assert.deepStrictEqual(ohne.namen, ['Kalle']);
  const [mit] = SM.fanZaehlungen(d, [
    {lied_id: 'l1', laut_id: 'keine', anzahl: 0},
    {lied_id: 'l1', laut_id: 'a', anzahl: 6},
  ]);
  assert.strictEqual(mit.werte.a, 4);                     // Stimmen 4 (online), 6, 0: kein häufigster Wert, Median 4
  assert.strictEqual(mit.werte.b, 1);                     // Stimmen 1 (online), 0: Durchschnitt aufgerundet
  assert.strictEqual(mit.fan_anzahl, 2);
});

test('Rangfolge: Gehör vor Booklet vor Fankonsens vor Onlinetext', () => {
  const d = FANDATA();
  const mitFans = SM.withFans(d, [{lied_id: 'l1', laut_id: 'a', anzahl: 10}]);
  const best = l => SM.bestOf(mitFans.zaehlungen.filter(z => z.lied_id === l));
  assert.strictEqual(best('l1').grundlage, 'fankonsens');
  assert.strictEqual(best('l1').werte.a, 7);
  mitFans.zaehlungen.push({lied_id: 'l1', grundlage: 'booklet', sicherheit: 'niedrig', status: 'gezaehlt', werte: {a: 2, b: 0}});
  assert.strictEqual(best('l1').grundlage, 'booklet');
  mitFans.zaehlungen.push({lied_id: 'l1', grundlage: 'gehoert', sicherheit: 'niedrig', status: 'gezaehlt', werte: {a: 5, b: 0}});
  assert.strictEqual(best('l1').grundlage, 'gehoert');
  assert.strictEqual(d.zaehlungen.length, 2, 'Datendatei bleibt unverändert');
});

test('Familienfrage: Familien in tabelle.sql passen zur Datendatei', () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'tabelle.sql'), 'utf8');
  const block = sql.slice(sql.indexOf('insert into public.familien'), sql.indexOf('on conflict (id) do update set text'));
  const zeilen = [...block.matchAll(/\('([a-z0-9-]+)',\s*'((?:[^']|'')*)',\s*(\d+)\)/g)].map(m => ({id: m[1], text: m[2].replace(/''/g, "'"), pos: +m[3]}));
  const d = SM.normalize(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'daten', 'shalalameter-daten.json'), 'utf8')));
  const erwartet = SM.families(d).map((f, i) => ({id: f.id, text: f.untertitel ? `${f.untertitel} (${f.anzeigename})` : f.anzeigename, pos: i + 1}));
  assert.deepStrictEqual(zeilen.filter(z => z.id !== SM.WEISS_NICHT), erwartet);
  assert.ok(zeilen.some(z => z.id === SM.WEISS_NICHT && z.text === 'Weiß nicht'), '„Weiß nicht“ fehlt');
});

test('Familienfrage: Lautschlüssel in SQL wie SM.slug', () => {
  // Nachbau von public.laut_schluessel aus tabelle.sql
  const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'tabelle.sql'), 'utf8');
  const m = /translate\(lower\(coalesce\(p_text, ''\)\), '([^']+)', '([^']+)'\)/.exec(sql);
  assert.ok(m, 'laut_schluessel nicht gefunden');
  const von = [...m[1]], nach = [...m[2]];
  assert.strictEqual(von.length, nach.length);
  const sqlSchluessel = s => [...s.toLowerCase()].map(c => { const i = von.indexOf(c); return i < 0 ? c : nach[i]; }).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  for (const s of ['Peng peng', 'peng-peng', 'PÄNG, päng!', 'Olé olé', 'Tä-tä-rä', 'Hüh hüh', 'Soße', 'Crème', '  Wumm  ', 'Ça va', 'Ñam'])
    assert.strictEqual(sqlSchluessel(s), SM.slug(s), s);
});

test('Familienfrage: Auswertung, häufigste Familie vorgewählt, „Weiß nicht“ zählt nicht mit', () => {
  const d = SM.normalize({
    familien: [{id: 'a', name: 'A', untertitel: 'Aa'}, {id: 'b', name: 'B'}, {id: 'c', name: 'C'}],
    laute: [{id: 'x', name: 'X', status: 'freigegeben', familie: 'a'}, {id: 'y', name: 'Y', status: 'freigegeben', familie: 'b'},
      {id: 'z', name: 'Z', status: 'freigegeben', familie: 'c'}],
    lieder: [], zaehlungen: [],
  });
  const w = SM.familienWahl(d, [{wert: 'b', stimmen: 2}, {wert: 'c', stimmen: '2'}, {wert: 'weiss-nicht', stimmen: 5}]);
  assert.deepStrictEqual(w.liste.map(f => [f.id, f.name, f.stimmen]), [['a', 'Aa', 0], ['b', 'B', 2], ['c', 'C', 2]]);
  assert.strictEqual(w.vorschlag, 'b');                   // Gleichstand: die frühere Familie
  assert.strictEqual(w.weissNicht, 5);                    // auch mit den meisten Stimmen kein Vorschlag
  assert.strictEqual(SM.familienWahl(d, [{wert: 'weiss-nicht', stimmen: 3}]).vorschlag, null);
  assert.strictEqual(SM.familienWahl(d, null).vorschlag, null);
});

test('Familienfrage: Freigabe in der gewählten Familie, sonst „Weitere Laute“', () => {
  const neu = () => SM.normalize({familien: [{id: 'knall', name: 'Rummse'}], laute: [{id: 'bumm', name: 'Bumm', status: 'freigegeben', familie: 'knall'}], lieder: [], zaehlungen: []});
  const d1 = neu();
  SM.approveCandidate(d1, 'Peng peng', '__neu', 'knall');
  assert.strictEqual(d1.laute.find(l => l.id === 'peng-peng').familie, 'knall');
  const d2 = neu();
  SM.approveCandidate(d2, 'Peng peng', '__neu', 'gibts-nicht');
  assert.strictEqual(d2.laute.find(l => l.id === 'peng-peng').familie, 'weitere');
});

test('Zuletzt gezählt: neueste zehn, nur eigene Lieder und freigegebene Laute, „Keine Schalalas“', () => {
  const d = SM.normalize({
    laute: [{id: 'a', name: 'A', status: 'freigegeben'}, {id: 'peng-peng', name: 'Peng peng', status: 'freigegeben'}],
    lieder: [{id: 'l1', titel: 'Eins', typ: 'original'}, {id: 'l2', titel: 'Zwei', typ: 'cover'}],
    zaehlungen: [],
  });
  const t = m => `2026-10-18T10:${String(m).padStart(2, '0')}:00Z`;
  const rows = [
    {lied_id: 'l1', laut_id: 'a', anzahl: 3, spitzname: 'Kalle', aktualisiert: t(1)},
    {lied_id: 'l1', laut_id: 'keine', anzahl: 0, spitzname: 'Taube', aktualisiert: t(5)},
    {lied_id: 'l1', laut_id: '', vorschlag: 'peng-PENG', anzahl: 2, spitzname: '', aktualisiert: t(4)},  // freigegeben
    {lied_id: 'l1', laut_id: '', vorschlag: 'Zisch', anzahl: 9, spitzname: 'X', aktualisiert: t(9)},     // nicht freigegeben
    {lied_id: 'l2', laut_id: 'a', anzahl: 1, spitzname: 'X', aktualisiert: t(8)},                        // Cover
    {lied_id: 'l1', laut_id: 'gibts-nicht', anzahl: 1, spitzname: 'X', aktualisiert: t(7)},
    {lied_id: 'l1', laut_id: 'a', anzahl: 1, spitzname: 'X'},                                           // ohne Zeit
  ];
  const z = SM.zuletztGezaehlt(d, rows);
  assert.deepStrictEqual(z.map(x => [x.lied.id, x.laut ? x.laut.id : null, x.anzahl, x.spitzname]),
    [['l1', null, 0, 'Taube'], ['l1', 'peng-peng', 2, ''], ['l1', 'a', 3, 'Kalle']]);
  const viele = Array.from({length: 15}, (_, i) => ({lied_id: 'l1', laut_id: 'a', anzahl: i, aktualisiert: t(10 + i)}));
  assert.deepStrictEqual(SM.zuletztGezaehlt(d, viele).map(x => x.anzahl), [14, 13, 12, 11, 10, 9, 8, 7, 6, 5]);
  assert.deepStrictEqual(SM.zuletztGezaehlt(d, null), []);
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

test('Beitragstext: HTML wird sichtbarer Text', () => {
  const html = SM.textMitLinks('Hallo <script>alert("x")</script> & <img src=x onerror=alert(1)>');
  assert.ok(!/<script|<img/i.test(html), 'kein HTML aus dem Beitrag');
  assert.strictEqual(html, 'Hallo &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &lt;img src=x onerror=alert(1)&gt;');
});

test('Beitragstext: Adressen werden sichere Links', () => {
  const html = SM.textMitLinks('Siehe https://example.org/a?b=1&c=2. Und (http://x.de/y) oder https://de.wikipedia.org/wiki/Bumm_(Laut)!');
  assert.ok(html.includes('<a href="https://example.org/a?b=1&amp;c=2" rel="nofollow ugc noopener" target="_blank">https://example.org/a?b=1&amp;c=2</a>. Und'));
  assert.ok(html.includes('(<a href="http://x.de/y" rel="nofollow ugc noopener" target="_blank">http://x.de/y</a>)'));
  assert.ok(html.includes('href="https://de.wikipedia.org/wiki/Bumm_(Laut)"'), 'Klammer im Link bleibt');
  assert.strictEqual((html.match(/<a /g) || []).length, 3);
});

test('Beitragstext: nur http und https, keine Tricks über Anführungszeichen', () => {
  assert.ok(!SM.textMitLinks('javascript:alert(1) data:text/html,x ftp://x.de').includes('<a'));
  const html = SM.textMitLinks('https://x.de/"onmouseover="alert(1)');
  assert.ok(html.startsWith('<a href="https://x.de/" '), html);
  assert.ok(!/<a[^>]*onmouseover/.test(html));
  assert.strictEqual(SM.textMitLinks('https:// nichts'), 'https:// nichts');
  assert.strictEqual(SM.textMitLinks('Zeile 1\nZeile 2'), 'Zeile 1\nZeile 2');
});
