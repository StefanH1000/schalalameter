// Schalalameter, „Zähl mit“: Fans reichen eine Zählung für ein Lied und einen Laut ein.
// Der aktuelle Wert erscheint erst nach dem Absenden, damit unabhängig gezählt wird.
(() => {
const {esc} = SM;
const $ = id => document.getElementById(id);
const NEU = '__neu';
let data = null;
let rows = [];

function store(key, val) {
  try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
  return val;
}
// Zufällige Geräte-Kennung, nur in diesem Browser gespeichert; sie verknüpft spätere Korrekturen mit der eigenen Zählung.
function geraetId() {
  let id = store('schalala-geraet');
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
    id = crypto.randomUUID ? crypto.randomUUID()
      : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
    store('schalala-geraet', id);
  }
  return id;
}

async function init() {
  if (!SchalalaFans.ready()) { $('aus').hidden = false; $('zf-senden').disabled = true; }
  const fans = SchalalaFans.load(3000);
  const res = await fetch('daten/shalalameter-daten.json', {cache: 'no-cache'});
  data = SM.normalize(await res.json());
  rows = (await fans) || [];
  renderLieder();
  renderLaute();
  $('zf-name').value = store('schalala-spitzname') || '';
  const want = new URLSearchParams(location.search).get('lied');
  if (want && data.lieder.some(l => l.id === want)) $('zf-lied').value = want;
}

// Lieder ohne jede Zählung (weder in der Datendatei noch von Fans) stehen oben und sind markiert.
function renderLieder() {
  const fanLieder = new Set(rows.filter(r => r.laut_id).map(r => r.lied_id));
  const counted = l => fanLieder.has(l.id) || data.zaehlungen.some(z => z.lied_id === l.id && SM.countable(z));
  const phase = l => { const p = SM.phaseInfo(data, l); return p ? (p.album.reihenfolge || 0) : 99; };
  const sorted = data.lieder.slice().sort((a, b) => phase(a) - phase(b) || String(a.erstveroeffentlichung).localeCompare(String(b.erstveroeffentlichung)) || a.titel.localeCompare(b.titel, 'de'));
  const label = l => `${l.titel} (${String(l.erstveroeffentlichung || '').slice(0, 4)})${l.typ && l.typ !== 'original' ? ' · ' + (SM.TYPE_LABEL[l.typ] || l.typ) : ''}`;
  const open = sorted.filter(l => !counted(l)), done = sorted.filter(counted);
  $('zf-lied').innerHTML = '<option value="">Bitte ein Lied wählen</option>'
    + (open.length ? `<optgroup label="Noch ohne Zählung (${open.length})">${open.map(l => `<option value="${esc(l.id)}">● ${esc(label(l))}</option>`).join('')}</optgroup>` : '')
    + `<optgroup label="Schon gezählt">${done.map(l => `<option value="${esc(l.id)}">${esc(label(l))}</option>`).join('')}</optgroup>`;
}

function renderLaute() {
  const snds = SM.sounds(data);
  $('zf-laut').innerHTML = '<option value="">Bitte ein Schalala wählen</option>'
    + SM.families(data).map(f => `<optgroup label="${esc(f.untertitel || f.anzeigename)}">${snds.filter(s => s.familie === f.id)
      .map(s => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}</optgroup>`).join('')
    + `<optgroup label="Neu"><option value="${NEU}">anderer Laut …</option></optgroup>`;
}

$('zf-laut').addEventListener('change', e => {
  const neu = e.target.value === NEU;
  $('zf-neu-row').hidden = !neu;
  if (neu) $('zf-neu').focus();
});
function setAnzahl(n) { $('zf-anzahl').value = String(Math.max(0, Math.min(200, Math.round(n) || 0))); }
$('zf-minus').addEventListener('click', () => setAnzahl(+$('zf-anzahl').value - 1));
$('zf-plus').addEventListener('click', () => setAnzahl(+$('zf-anzahl').value + 1));
$('zf-anzahl').addEventListener('change', e => setAnzahl(+e.target.value));

function fehler(msg) { const f = $('zf-fehler'); f.textContent = msg || ''; f.hidden = !msg; }

$('zf').addEventListener('submit', async e => {
  e.preventDefault();
  fehler('');
  const liedId = $('zf-lied').value, laut = $('zf-laut').value;
  const neu = laut === NEU ? $('zf-neu').value.trim() : '';
  const name = $('zf-name').value.trim();
  const anzahl = +$('zf-anzahl').value;
  if (!liedId) return fehler('Bitte wähl ein Lied.');
  if (!laut) return fehler('Bitte wähl ein Schalala.');
  if (laut === NEU && !neu) return fehler('Bitte schreib, wie der neue Laut klingt.');
  if (!Number.isInteger(anzahl) || anzahl < 0 || anzahl > 200) return fehler('Die Anzahl muss zwischen 0 und 200 liegen.');
  if (!name) return fehler('Bitte gib einen Spitznamen an.');
  store('schalala-spitzname', name);
  const lied = data.lieder.find(l => l.id === liedId);
  const sound = SM.sounds(data).find(s => s.id === laut);
  // Bot-Falle: Ist das unsichtbare Feld gefüllt, tun wir so, als sei alles angekommen.
  if ($('zf-website').value) return zeigeErgebnis(lied, sound, neu, null);

  const btn = $('zf-senden');
  btn.disabled = true; btn.textContent = 'Wird gesendet …';
  try {
    await SchalalaFans.submit({
      lied_id: liedId, laut_id: laut === NEU ? '' : laut, vorschlag: neu, anzahl, spitzname: name,
      grundlage: document.querySelector('input[name="grundlage"]:checked').value, geraet_id: geraetId(),
    });
    rows = (await SchalalaFans.load(3000)) || rows;
    zeigeErgebnis(lied, sound, neu, anzahl);
  } catch (err) {
    fehler(err.message);
  } finally {
    btn.disabled = !SchalalaFans.ready(); btn.textContent = 'Zählung abschicken';
  }
});

function zeigeErgebnis(lied, sound, neu, eigene) {
  const box = $('ergebnis');
  let wert = '';
  if (sound) {
    const z = SM.fanZaehlungen(data, rows).find(x => x.lied_id === lied.id);
    const v = z ? z.werte[sound.id] : null, n = z && z.fan[sound.id] ? z.fan[sound.id] : 0;
    wert = v == null ? '' : `<div class="wert"><b>${v}</b><span>${esc(sound.name)} in „${esc(lied.titel)}“ nach jetzigem Stand, aus ${n} ${n === 1 ? 'Fanzählung' : 'Fanzählungen'}${eigene != null ? ` (deine: ${eigene})` : ''}</span></div>`;
  }
  box.innerHTML = `
    <h2>Danke!</h2>
    <p>${neu ? `Dein Vorschlag „${esc(neu)}“ für „${esc(lied.titel)}“ ist eingegangen und wird geprüft.` : 'Deine Zählung ist eingegangen.'}</p>
    ${wert}
    <div class="zf-actions">
      <button type="button" class="btn primary" id="noch-einer">Noch ein Laut in diesem Lied</button>
      <a class="btn" href="./">Zum Schalalameter</a>
    </div>`;
  box.hidden = false;
  $('formular').hidden = true;
  $('noch-einer').addEventListener('click', () => {
    $('zf-laut').value = ''; $('zf-neu').value = ''; $('zf-neu-row').hidden = true; setAnzahl(0);
    box.hidden = true; $('formular').hidden = false; $('zf-laut').focus();
  });
  box.scrollIntoView({block: 'nearest'});
}

init().catch(() => fehler('Die Lieder konnten nicht geladen werden. Bitte lade die Seite neu.'));
})();
