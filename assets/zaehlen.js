// Schalalameter, „Zähl mit“: Fans zählen einen Laut in einem Lied mit und schicken ihre Zahl ein.
// Schmal: vier Schritte nacheinander (Lied, Laut, Zählen, Abschicken). Breit: alles in drei Spalten.
// Der aktuelle Stand erscheint erst nach dem Absenden, damit unabhängig gezählt wird.
(() => {
const {esc} = SM;
const $ = id => document.getElementById(id);
const breit = matchMedia('(min-width: 900px)');
let data = null, rows = [], snds = [], fams = [];
let liste = [];               // alle Lieder mit Album, Summe und Status, sortiert
const st = {lied: null, laut: null, neu: false, filter: 'offen', suche: '', schritt: 1, album: null};

const {store, geraetId} = SchalalaFans;
const coverUrl = a => a ? (a.cover || `assets/cover/${a.id}.jpg`) : '';
const coverImg = a => a ? `<img src="${esc(coverUrl(a))}" alt="" data-cover>` : '<span class="ohne"></span>';
// Fehlt ein Cover, tritt ein leeres Feld an seine Stelle. Ein Listener statt onerror-Attribut, das die CSP verbietet.
document.addEventListener('error', e => {
  const t = e.target;
  if (t instanceof HTMLImageElement && t.hasAttribute('data-cover')) t.replaceWith(Object.assign(document.createElement('span'), {className: 'ohne'}));
}, true);
const jahr = l => String(l.erstveroeffentlichung || '').slice(0, 4);
const plural = n => n === 1 ? 'Schalala' : 'Schalalas';

/* ---------- Daten ---------- */
async function init() {
  if (!SchalalaFans.ready()) { $('aus').hidden = false; $('senden').disabled = true; }
  const fans = SchalalaFans.load(3000);
  const res = await fetch('daten/shalalameter-daten.json', {cache: 'no-cache'});
  data = SM.normalize(await res.json());
  rows = (await fans) || [];
  snds = SM.sounds(data);
  fams = SM.families(data);
  baueListe();
  renderLaute();
  $('name').value = store('schalala-spitzname') || '';
  // Vorauswahl eines Albums (Link aus den Lücken auf der Startseite): nur dessen Lieder zeigen.
  const alb = new URLSearchParams(location.search).get('album');
  if (alb && liste.some(x => x.album && x.album.id === alb)) {
    st.album = alb;
    if (!liste.some(x => x.offen && x.album && x.album.id === alb)) st.filter = 'alle';
  }
  const want = new URLSearchParams(location.search).get('lied');
  const vor = want && liste.find(x => x.l.id === want);
  if (vor) {
    if (!vor.offen) st.filter = 'alle';
    waehleLied(vor.l.id);
    st.schritt = 2; $('zm').dataset.schritt = 2;
  }
  renderFilter();
  renderLieder();
  if (vor && breit.matches) { const b = $('liste').querySelector('[aria-pressed="true"]'); if (b) b.scrollIntoView({block: 'center'}); window.scrollTo(0, 0); }
  history.replaceState({schritt: st.schritt}, '');
}

// Summe je Lied aus der besten Zählung (Datendatei plus Fankonsens); offen = noch keine Zählung.
function baueListe() {
  const mit = SM.withFans(data, rows);
  const byLied = new Map();
  for (const z of mit.zaehlungen) if (SM.countable(z)) (byLied.get(z.lied_id) || byLied.set(z.lied_id, []).get(z.lied_id)).push(z);
  liste = data.lieder.filter(l => l.typ === 'original').map(l => {
    const best = SM.bestOf(byLied.get(l.id) || []);
    const p = SM.phaseInfo(data, l);
    return {l, album: p ? p.album : null, offen: !best, summe: best ? snds.reduce((t, s) => t + SM.value(best, s.id, false), 0) : 0};
  }).sort((a, b) => ((a.album && a.album.reihenfolge) ?? 99) - ((b.album && b.album.reihenfolge) ?? 99)
    || String(a.l.erstveroeffentlichung).localeCompare(String(b.l.erstveroeffentlichung)) || a.l.titel.localeCompare(b.l.titel, 'de'));
}
const eintrag = id => liste.find(x => x.l.id === id);

/* ---------- Schritt 1: Lied ---------- */
function renderFilter() {
  const offen = liste.filter(x => x.offen).length;
  $('f-offen').textContent = `Noch ohne Zählung · ${offen}`;
  $('f-alle').textContent = `Alle · ${liste.length}`;
  $('f-offen').setAttribute('aria-pressed', st.filter === 'offen');
  $('f-alle').setAttribute('aria-pressed', st.filter === 'alle');
  const a = st.album && (liste.find(x => x.album && x.album.id === st.album) || {}).album;
  $('f-album').hidden = !a;
  if (a) { $('f-album').textContent = `${a.titel} ×`; $('f-album').setAttribute('aria-label', `Nur ${a.titel}, Filter entfernen`); }
}
const norm = s => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
function renderLieder() {
  const q = norm(st.suche.trim());
  // Bei einer Suche werden alle Lieder durchsucht, unabhängig vom Filter.
  const sicht = liste.filter(x => q ? norm(x.l.titel).includes(q)
    : (st.filter === 'alle' || x.offen) && (!st.album || (x.album && x.album.id === st.album)));
  const gruppen = new Map();
  for (const x of sicht) {
    const k = x.album ? x.album.id : '';
    if (!gruppen.has(k)) gruppen.set(k, {album: x.album, lieder: []});
    gruppen.get(k).lieder.push(x);
  }
  const html = [...gruppen.values()].map(g => {
    const alle = liste.filter(x => (x.album ? x.album.id : '') === (g.album ? g.album.id : ''));
    const offen = alle.filter(x => x.offen).length;
    const info = [g.album ? String(g.album.datum || '').slice(0, 4) : '',
      st.filter === 'offen' && !q ? `${offen} von ${alle.length} noch offen` : `${alle.length - offen} von ${alle.length} gezählt`].filter(Boolean).join(' · ');
    return `<div><div class="album-kopf">${coverImg(g.album)}<div><b>${esc(g.album ? g.album.titel : 'Ohne Album')}</b><small>${esc(info)}</small></div></div>
      <div class="lieder">${g.lieder.map(x => `<button type="button" data-lied="${esc(x.l.id)}" aria-pressed="${x.l.id === st.lied}">
        <span>${esc(x.l.titel)}</span>
        ${x.offen ? '<span class="markierung offen">noch offen</span>' : `<span class="markierung">${x.summe} ${plural(x.summe)}</span>`}</button>`).join('')}</div></div>`;
  }).join('');
  $('liste').innerHTML = html || `<p class="leer">${q ? 'Kein Lied gefunden.' : 'Alle Lieder sind schon gezählt. Unter „Alle“ kannst du nachzählen.'}</p>`;
}
$('liste').addEventListener('click', e => {
  const b = e.target.closest('[data-lied]');
  if (!b) return;
  waehleLied(b.dataset.lied);
  renderLieder();
  geheZu(2);
});
$('suche').addEventListener('input', e => { st.suche = e.target.value; renderLieder(); });
$('f-offen').addEventListener('click', () => { st.filter = 'offen'; renderFilter(); renderLieder(); });
$('f-alle').addEventListener('click', () => { st.filter = 'alle'; renderFilter(); renderLieder(); });
$('f-album').addEventListener('click', () => { st.album = null; renderFilter(); renderLieder(); });

function waehleLied(id) {
  if (st.lied !== id) setAnzahl(0);
  st.lied = id;
  renderAuswahl();
}

/* ---------- Schritt 2: Laut ---------- */
function renderLaute() {
  $('familien').innerHTML = fams.map(f => `<div class="familie" style="--fc:var(--c${f.slot})">
    <div class="familie-kopf"><span class="sw" style="background:var(--c${f.slot})"></span><b>${esc(f.untertitel || f.anzeigename)}</b>${f.untertitel ? `<small>${esc(f.anzeigename)}</small>` : ''}</div>
    <div class="lautchips">${snds.filter(s => s.familie === f.id).map(s => `<button type="button" class="chip" data-laut="${esc(s.id)}" aria-pressed="false">${esc(s.name)}</button>`).join('')}</div>
  </div>`).join('');
}
$('familien').addEventListener('click', e => {
  const b = e.target.closest('[data-laut]');
  if (!b) return;
  if (st.laut !== b.dataset.laut || st.neu) setAnzahl(0);
  st.laut = b.dataset.laut; st.neu = false;
  renderAuswahl();
});
// „Keine Schalalas in diesem Lied“: eine Einreichung mit Laut-ID SM.KEINE und Anzahl 0, ohne Mitzählen.
$('keine-chip').addEventListener('click', () => {
  st.laut = SM.KEINE; st.neu = false;
  setAnzahl(0);
  renderAuswahl();
});
$('neu-chip').addEventListener('click', () => {
  if (!st.neu) setAnzahl(0);
  st.neu = true; st.laut = null;
  renderAuswahl();
  $('neu').focus();
});
$('neu').addEventListener('input', renderAuswahl);

const keine = () => !st.neu && st.laut === SM.KEINE;
const lautName = () => st.neu ? $('neu').value.trim() : keine() ? 'Keine Schalalas' : (snds.find(s => s.id === st.laut) || {}).name || '';
const lautFarbe = () => { const s = !st.neu && snds.find(x => x.id === st.laut); return s ? `var(--c${s.slot})` : 'var(--muted)'; };

function liedKarte(x) {
  if (!x) return '';
  const info = [x.album ? x.album.titel : '', jahr(x.l), x.offen ? 'noch ohne Zählung' : `${x.summe} ${plural(x.summe)}`].filter(Boolean).join(' · ');
  return `${coverImg(x.album)}<div><b>${esc(x.l.titel)}</b><small>${esc(info)}</small></div>`;
}
function renderAuswahl() {
  const x = eintrag(st.lied);
  for (const b of $('familien').querySelectorAll('[data-laut]')) b.setAttribute('aria-pressed', !st.neu && b.dataset.laut === st.laut);
  $('neu-chip').setAttribute('aria-pressed', st.neu);
  $('keine-chip').setAttribute('aria-pressed', keine());
  $('anzahl-zeile').hidden = keine();
  $('zurueck-von-4').dataset.zu = keine() ? 2 : 3;
  $('zurueck-von-4').textContent = keine() ? '← Anderes Schalala' : '← Weiterzählen';
  $('neu-feld').hidden = !st.neu;
  $('liedkarte').innerHTML = liedKarte(x);
  $('sendekarte').innerHTML = x ? liedKarte(x).replace(/<small>.*<\/small>/, `<small><span class="sw" style="background:${lautFarbe()}; display:inline-block; vertical-align:-1px"></span> ${esc(lautName() || '–')}</small>`) : '';
  $('laut-in').textContent = x ? `in „${x.l.titel}“` : '';
  const name = lautName();
  $('zu-zaehlen').textContent = st.neu ? 'Weiter zum Zählen' : keine() ? 'Weiter zum Abschicken' : name ? `„${name}“ zählen` : 'Bitte ein Schalala wählen';
  $('zu-zaehlen').disabled = !st.neu && !name;
  $('z-lied').textContent = x ? x.l.titel : '';
  const lautHtml = name ? `<span class="sw" style="background:${lautFarbe()}"></span>${esc(name)}` : '<span class="muted">Erst Lied und Schalala wählen</span>';
  $('z-laut-schmal').innerHTML = lautHtml;
  $('z-laut-breit').innerHTML = name ? lautHtml : '';
  renderTipp(name);
  $('tipp').disabled = !x || !name || keine();
  renderAnzahl();
}

// Zählknopf: Farbe der Familie, Aufschrift der Laut. Auf Grün, Gelb und Pink (Plätze 3 bis 5) ist weiße Schrift
// zu schwach, dort steht sie dunkel. Ohne Wahl oder bei einem Vorschlag bleibt die Akzentfarbe.
const DUNKLE_SCHRIFT = new Set([3, 4, 5]);
// Verkleinert die Schrift so, dass der breiteste Wortteil (getrennt an Leerzeichen und nach Bindestrichen) in den
// Kreis passt und nie mitten im Wort umbricht. Breite und Grundgröße wie im CSS: schmal min(236px, 62vw) und 34px, breit 160px und 28px.
const messen = document.createElement('canvas').getContext('2d');
function schriftFaktor(text) {
  const basis = breit.matches ? 28 : 34;
  const kreis = breit.matches ? 160 : Math.min(236, innerWidth * .62);
  const platz = kreis - (breit.matches ? 32 : 44) - 16;
  messen.font = `400 ${basis}px ${getComputedStyle(document.documentElement).getPropertyValue('--display') || 'serif'}`;
  const breitester = Math.max(...text.split(/\s+|(?<=-)/).filter(Boolean).map(t => messen.measureText(t).width));
  const zeilen = Math.ceil(messen.measureText(text).width / platz);
  return Math.max(.4, Math.min(1, platz / breitester, zeilen > 3 ? 3 / zeilen : 1)).toFixed(2);
}
// Nach dem Laden der Schrift und bei Größenänderung neu messen.
document.fonts && document.fonts.ready.then(() => renderTipp(lautName()));
breit.addEventListener('change', () => renderTipp(lautName()));
function renderTipp(name) {
  const b = $('tipp'), s = !st.neu && snds.find(x => x.id === st.laut);
  if (s) b.style.setProperty('--fc', `var(--c${s.slot})`); else b.style.removeProperty('--fc');
  if (s) b.dataset.ton = DUNKLE_SCHRIFT.has(s.slot) ? 'dunkel' : 'hell'; else delete b.dataset.ton;
  const text = name || 'Scha-lala!';
  b.textContent = text;
  b.style.setProperty('--ts', schriftFaktor(text));
  b.setAttribute('aria-label', name ? `${name} gehört, eins mehr` : 'Erst Lied und Schalala wählen');
}

/* ---------- Schritt 3 und 4: Zählen, Abschicken ---------- */
function setAnzahl(n) { $('anzahl').value = String(Math.max(0, Math.min(200, Math.round(n) || 0))); renderAnzahl(); }
const anzahl = () => +$('anzahl').value || 0;
function renderAnzahl() {
  const n = anzahl(), name = lautName() || 'Schalala';
  $('z-n').textContent = n;
  $('z-einheit').textContent = `${n === 1 ? 'Schalala' : 'Schalalas'} bisher`;
  $('senden').textContent = keine() ? 'Keine Schalalas melden' : `${n} × ${name} abschicken`;
}
function tipp() {
  if ($('tipp').disabled) return;
  setAnzahl(anzahl() + 1);
  $('tipp').classList.add('gedrueckt');
  setTimeout(() => $('tipp').classList.remove('gedrueckt'), 90);
}
$('tipp').addEventListener('click', tipp);
$('zurueck').addEventListener('click', () => setAnzahl(anzahl() - 1));
$('vonvorn').addEventListener('click', () => setAnzahl(0));
$('null').addEventListener('click', () => { setAnzahl(0); geheZu(4); });
$('minus').addEventListener('click', () => setAnzahl(anzahl() - 1));
$('plus').addEventListener('click', () => setAnzahl(anzahl() + 1));
$('anzahl').addEventListener('change', e => setAnzahl(+e.target.value));

// Leertaste zählt mit, solange kein Textfeld den Fokus hat. Auch keyup abfangen, sonst löst ein
// fokussierter Knopf zusätzlich seinen Klick aus.
const imTextfeld = t => t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
const leertasteAktiv = () => !$('ergebnis').hidden ? false : breit.matches || st.schritt === 3;
document.addEventListener('keydown', e => {
  if (e.code !== 'Space' || imTextfeld(e.target) || !leertasteAktiv()) return;
  e.preventDefault();
  if (!e.repeat) tipp();
});
document.addEventListener('keyup', e => {
  if (e.code === 'Space' && !imTextfeld(e.target) && leertasteAktiv()) e.preventDefault();
});

/* ---------- Schritte (nur schmal sichtbar) ---------- */
function fehler(id, msg) { const f = $(id); f.textContent = msg || ''; f.hidden = !msg; }
function pruefeBis(n) {
  if (n >= 2 && !st.lied) return 1;
  if (n >= 3 && !st.neu && !st.laut) return 2;
  if (n >= 3 && st.neu && !$('neu').value.trim()) { fehler('fehler-laut', 'Bitte schreib, wie der neue Laut klingt.'); return 2; }
  return n;
}
function geheZu(n, ausHistorie) {
  fehler('fehler-laut', '');
  n = pruefeBis(n);
  if (n === st.schritt) return;
  st.schritt = n;
  $('zm').dataset.schritt = n;
  if (!breit.matches) {
    if (!ausHistorie) history.pushState({schritt: n}, '');
    window.scrollTo(0, 0);
  }
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-zu]');
  if (b) geheZu(+b.dataset.zu);
});
$('zu-zaehlen').addEventListener('click', () => geheZu(keine() ? 4 : 3));
// Zurück-Taste des Handys geht einen Schritt zurück.
addEventListener('popstate', e => {
  if (!$('ergebnis').hidden) zeigeFormular();
  geheZu((e.state && e.state.schritt) || 1, true);
});

/* ---------- Absenden ---------- */
$('zf').addEventListener('submit', async e => {
  e.preventDefault();
  fehler('fehler', '');
  const lied = eintrag(st.lied);
  const neu = st.neu ? $('neu').value.trim() : '';
  const name = $('name').value.trim();
  const n = +$('anzahl').value;
  if (!lied) return fehler('fehler', 'Bitte wähl ein Lied.');
  if (!st.neu && !st.laut) return fehler('fehler', 'Bitte wähl ein Schalala.');
  if (st.neu && !neu) return fehler('fehler', 'Bitte schreib, wie der neue Laut klingt.');
  if (!Number.isInteger(n) || n < 0 || n > 200) return fehler('fehler', 'Die Anzahl muss zwischen 0 und 200 liegen.');
  if (!name) { $('name').focus(); return fehler('fehler', 'Bitte gib einen Spitznamen an.'); }
  store('schalala-spitzname', name);
  const sound = st.neu ? null : snds.find(s => s.id === st.laut);
  const ohne = keine();
  // Bot-Falle: Ist das unsichtbare Feld gefüllt, tun wir so, als sei alles angekommen.
  if ($('website').value) return zeigeErgebnis(lied, sound, neu, n, ohne);

  const btn = $('senden');
  btn.disabled = true; btn.textContent = 'Wird gesendet …';
  try {
    await SchalalaFans.submit({
      lied_id: lied.l.id, laut_id: ohne ? SM.KEINE : sound ? sound.id : '', vorschlag: neu, anzahl: ohne ? 0 : n, spitzname: name,
      grundlage: document.querySelector('input[name="grundlage"]:checked').value, geraet_id: geraetId(),
    });
    rows = (await SchalalaFans.load(3000)) || rows;
    baueListe();
    zeigeErgebnis(eintrag(lied.l.id), sound, neu, n, ohne);
  } catch (err) {
    fehler('fehler', err.message);
  } finally {
    btn.disabled = !SchalalaFans.ready();
    renderAnzahl();
  }
});

const ORDINAL = {2: 'zweite', 3: 'dritte', 4: 'vierte', 5: 'fünfte', 6: 'sechste', 7: 'siebte', 8: 'achte', 9: 'neunte', 10: 'zehnte'};
// Spitznamen der anderen, die in diesem Lied dasselbe gezählt haben; der eigene Name zählt einmal nicht mit.
function andereNamen(passt) {
  const ich = $('name').value.trim();
  let selbst = false;
  const namen = [];
  for (const r of rows) {
    if (r.lied_id !== st.lied || !passt(r)) continue;
    const n = String(r.spitzname || '').trim();
    if (!n) continue;
    if (n === ich && !selbst) { selbst = true; continue; }
    if (!namen.includes(n)) namen.push(n);
  }
  return namen;
}
function naechstesOffenes() {
  const i = liste.findIndex(x => x.l.id === st.lied);
  return [...liste.slice(i + 1), ...liste.slice(0, Math.max(i, 0))].find(x => x.offen && x.l.id !== st.lied) || null;
}
function zeigeErgebnis(x, sound, neu, eigene, ohne) {
  const box = $('ergebnis');
  let mitte;
  if (ohne) {
    const z = SM.fanZaehlungen(data, rows).find(r => r.lied_id === x.l.id);
    const summe = z ? Object.values(z.werte).reduce((t, v) => t + v, 0) : 0;
    const andere = andereNamen(r => r.laut_id === SM.KEINE);
    mitte = `<div class="vergleich"><div><small>Deine Meldung</small><b>0</b></div><div class="stand"><small>Stand jetzt</small><b>${summe}</b></div></div>
      <p>${andere.length ? `Auch ${esc(SM.namenListe(andere))} ${andere.length === 1 ? 'hat' : 'haben'} hier keine Schalalas gehört. ` : ''}Deine Meldung zählt als 0 für jedes Schalala in diesem Lied. Hat jemand anders doch eins gehört, fließen beide Zählungen in den Wert ein.</p>`;
  } else if (sound) {
    const z = SM.fanZaehlungen(data, rows).find(r => r.lied_id === x.l.id);
    const v = z ? z.werte[sound.id] : eigene, k = z && z.fan[sound.id] ? z.fan[sound.id] : 1;
    const andere = andereNamen(r => r.laut_id === sound.id);
    const wer = k <= 1 ? 'Du bist die erste Fanstimme für dieses Schalala in diesem Lied.'
      : andere.length ? `Du bist nach ${esc(SM.namenListe(andere))} die ${ORDINAL[k] || k + '.'} Stimme.` : `Aus ${k} Fanzählungen.`;
    mitte = `<div class="vergleich"><div><small>Deine Zählung</small><b>${eigene}</b></div><div class="stand"><small>Stand jetzt</small><b>${v}</b></div></div>
      <p>${wer} Ab drei Stimmen zählt der häufigste Wert.</p>`;
  } else {
    mitte = `<div class="vergleich"><div><small>Dein Vorschlag</small><span class="vorschlag-chip">${esc(neu)}</span></div><div><small>gezählt</small><b>${eigene}</b></div></div>
      <p>${(a => a.length ? `Auch ${esc(SM.namenListe(a))} ${a.length === 1 ? 'hat' : 'haben'} „${esc(neu)}“ in diesem Lied gehört. ` : '')(andereNamen(r => !r.laut_id && SM.slug(r.vorschlag || '') === SM.slug(neu)))}Neue Laute werden erst geprüft. Sobald „${esc(neu)}“ freigegeben ist, erscheint er auf dem Schalalameter, mit deiner Zahl und allen anderen Zählungen dazu.</p>`;
  }
  const next = naechstesOffenes();
  box.innerHTML = `
    <h2>Danke!</h2>
    <p>${ohne ? 'Deine Meldung ist angekommen: keine Schalalas.' : sound ? 'Deine Zählung ist angekommen.' : 'Dein neues Schalala ist gespeichert.'}</p>
    <div class="karte">
      <div class="liedkarte" style="border:0; padding:0">${coverImg(x.album)}<div><b>${esc(x.l.titel)}</b><small>${!ohne && sound ? `<span class="sw" style="background:var(--c${sound.slot}); display:inline-block; vertical-align:-1px"></span> ${esc(sound.name)}` : esc([x.album && x.album.titel, jahr(x.l)].filter(Boolean).join(' · '))}</small></div></div>
      ${mitte}
    </div>
    <div class="knoepfe">
      ${ohne ? '' : '<button type="button" class="gross" id="noch-einer">Noch ein Schalala in diesem Lied</button>'}
      ${next ? `<button type="button" class="gross${ohne ? '' : ' hell'}" id="naechstes" data-lied="${esc(next.l.id)}">Nächstes Lied ohne Zählung</button>` : ''}
      <a class="gross hell" href="schalalalogie.html#lied/${encodeURIComponent(x.l.id)}">Über dieses Lied fachsimpeln</a>
      <a class="backlink" href="./" style="justify-content:center">Zum Schalalameter</a>
    </div>`;
  box.hidden = false;
  $('zm-grid').hidden = true;
  document.querySelector('.zm-head').style.display = 'flex';
  window.scrollTo(0, 0);
  if (!ohne) $('noch-einer').addEventListener('click', () => { zeigeFormular(); geheZu(2); });
  if (next) $('naechstes').addEventListener('click', () => { zeigeFormular(); waehleLied(next.l.id); renderLieder(); geheZu(2); });
}
function zeigeFormular() {
  st.laut = null; st.neu = false; $('neu').value = ''; setAnzahl(0);
  renderFilter(); renderLieder(); renderAuswahl();
  $('ergebnis').hidden = true; $('zm-grid').hidden = false;
  document.querySelector('.zm-head').style.display = '';
}

init().catch(() => { $('liste').innerHTML = '<p class="fehler">Die Lieder konnten nicht geladen werden. Bitte lade die Seite neu.</p>'; });
})();
