// Shalalameter – Werkstatt: Daten laden, neue Laute freigeben, Zählungen erfassen, Datei exportieren.
(() => {
const {esc} = SM;
const $ = id => document.getElementById(id);
const color = slot => `var(--c${slot})`;
let data = null;

function saveDraft(){
  try { localStorage.setItem(SM.DRAFT_KEY, JSON.stringify(data)); $('draft-status').textContent = 'Entwurf gespeichert'; }
  catch (e) { $('draft-status').textContent = 'Entwurf konnte nicht gespeichert werden (Browser-Speicher gesperrt).'; }
}
async function loadPublished(){
  const res = await fetch('daten/shalalameter-daten.json', {cache: 'no-cache'});
  return SM.normalize(await res.json());
}
async function init(){
  try { data = SM.normalize(JSON.parse(localStorage.getItem(SM.DRAFT_KEY) || 'null')); } catch (e) { data = null; }
  if (data) $('draft-status').textContent = 'Entwurf aus diesem Browser geladen';
  else { data = await loadPublished(); $('draft-status').textContent = 'Veröffentlichte Daten geladen'; }
  render();
}

/* ---------- Laden / Export ---------- */
function importText(txt){
  try {
    const d = SM.normalize(JSON.parse(txt));
    if (!d) throw new Error('format');
    delete d.beispiel;
    data = d; saveDraft(); render();
    $('io-status').textContent = `Importiert: ${d.lieder.length} Lieder, ${d.zaehlungen.length} Zählungen, ${SM.sounds(d).length} Laute.`;
  } catch (e) {
    $('io-status').textContent = 'Import fehlgeschlagen: Erwartet wird JSON mit den Listen „lieder“ und „zaehlungen“ wie im Cowork-Format.';
  }
}
$('import').addEventListener('click', () => importText($('io-text').value));
$('io-file').addEventListener('change', e => {
  const f = e.target.files && e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => importText(String(r.result));
  r.onerror = () => { $('io-status').textContent = 'Die Datei konnte nicht gelesen werden. Füge den Inhalt stattdessen ins Feld ein.'; };
  r.readAsText(f);
});
$('export').addEventListener('click', () => { $('io-text').value = JSON.stringify(data, null, 2); $('io-status').textContent = 'Der Entwurf steht im Feld.'; });
$('download').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(data, null, 2) + '\n'], {type: 'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'shalalameter-daten.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  $('draft-status').textContent = 'Datei heruntergeladen';
});
$('reload-pub').addEventListener('click', async () => {
  try { localStorage.removeItem(SM.DRAFT_KEY); } catch (e) {}
  data = await loadPublished(); render();
  $('draft-status').textContent = 'Entwurf verworfen, veröffentlichte Daten geladen';
});

/* ---------- Neue Laute ---------- */
let candList = [];
function renderCands(){
  candList = SM.candidates(data);
  const snds = SM.sounds(data), full = false;
  $('cands').innerHTML = candList.length ? candList.map((c, i) => {
    const note = SM.candidateEntry(data, c.ph)?.notiz;
    return `<li>
    <span><span class="ph">${esc(c.ph)}</span><br><span class="ct">${c.total}× in ${c.songs.size} ${c.songs.size === 1 ? 'Lied' : 'Liedern'}${note ? ' · ' + esc(note) : ''}</span></span>
    <span class="act">
      <select id="cand-${i}" aria-label="Ziel für ${esc(c.ph)}">
        ${full ? '' : '<option value="__neu">als neuer Laut</option>'}
        ${snds.map(s => `<option value="${esc(s.id)}">zu ${esc(s.name)}</option>`).join('')}
      </select>
      <button type="button" class="btn small" data-approve="${i}">Übernehmen</button>
      <button type="button" class="btn small" data-drop="${i}">Verwerfen</button>
    </span></li>`;
  }).join('') : '<li class="empty muted">Keine offenen Kandidaten.</li>';
}
$('cands').addEventListener('click', e => {
  const ai = e.target.dataset.approve, di = e.target.dataset.drop;
  if (ai != null) {
    const c = candList[+ai];
    SM.approveCandidate(data, c.ph, $('cand-' + ai).value);
    saveDraft(); render();
    $('cand-status').textContent = `„${c.ph}“ übernommen`;
  } else if (di != null) {
    const c = candList[+di];
    data.kandidaten_verworfen.push(c.ph); saveDraft(); render();
    $('cand-status').textContent = `„${c.ph}“ verworfen`;
  }
});

/* ---------- Zählung erfassen ---------- */
function renderCountForm(){
  const sel = $('cf-lied'), cur = sel.value;
  sel.innerHTML = [...data.lieder].sort((a, b) => String(a.titel).localeCompare(String(b.titel), 'de'))
    .map(l => `<option value="${esc(l.id)}">${esc(l.titel)} (${esc(String(l.erstveroeffentlichung || '').slice(0, 4))})</option>`).join('');
  if (cur && data.lieder.some(l => l.id === cur)) sel.value = cur;
  const box = $('cf-nums'), prev = {};
  box.querySelectorAll('input').forEach(i => { prev[i.dataset.id] = i.value; });
  box.innerHTML = SM.sounds(data).map(s => `<label><span class="l"><span class="sw" style="background:${color(s.slot)}"></span>${esc(s.name)}</span>
    <input type="number" min="0" step="1" id="cf-n-${esc(s.id)}" data-id="${esc(s.id)}" value="${esc(prev[s.id] ?? '0')}"></label>`).join('');
}
$('cf-auto').addEventListener('click', () => {
  const counts = SM.countText($('cf-text').value, SM.sounds(data));
  for (const [id, n] of Object.entries(counts)) { const el = $('cf-n-' + id); if (el) el.value = n; }
  $('cf-status').textContent = 'Vorgezählt. Bitte prüfen.';
});
$('count-form').addEventListener('submit', e => {
  e.preventDefault();
  const werte = {};
  $('cf-nums').querySelectorAll('input').forEach(i => { werte[i.dataset.id] = Math.max(0, parseInt(i.value, 10) || 0); });
  const grund = $('cf-grund').value;
  data.zaehlungen.push({
    lied_id: $('cf-lied').value, grundlage: grund, quelle_url: $('cf-quelle').value.trim(),
    quelle_art: grund === 'booklet' ? 'offiziell' : 'community',
    gezaehlt_von: $('cf-von').value.trim() || 'unbekannt', gezaehlt_am: new Date().toISOString().slice(0, 10),
    status: 'gezaehlt', werte, anzahl_aufgeloest: null, belege: {}, kandidaten: {}, sicherheit: $('cf-sicher').value, notiz: $('cf-notiz').value.trim(),
  });
  saveDraft();
  const l = data.lieder.find(x => x.id === $('cf-lied').value);
  $('cf-text').value = ''; $('cf-notiz').value = '';
  $('cf-status').textContent = `Zählung für „${l ? l.titel : ''}“ gespeichert`;
  render();
});

/* ---------- Offene Lieder ---------- */
function renderOpen(){
  const songs = SM.derive(data, {typeOn: new Set(SM.TYPES.map(t => t.id)), minSicher: 1, aufl: false});
  const open = songs.filter(s => !s.best).sort((a, b) => (a.year || 0) - (b.year || 0));
  $('open-count').textContent = `${open.length} von ${songs.length}`;
  $('open-list').innerHTML = open.map(s => `<li><button type="button" class="linkbtn" data-lied="${esc(s.l.id)}">${esc(s.l.titel)}</button> <span class="muted">${s.year || '?'} · ${SM.TYPE_LABEL[s.typ]}</span></li>`).join('')
    || '<li class="muted">Alle Lieder haben eine Zählung.</li>';
}
$('open-list').addEventListener('click', e => {
  const id = e.target.dataset.lied; if (!id) return;
  $('cf-lied').value = id;
  $('erfassen').scrollIntoView({block: 'start'});
  $('cf-grund').focus({preventScroll: true});
});

function render(){ renderCands(); renderCountForm(); renderOpen(); }
init().catch(() => { $('draft-status').textContent = 'Die veröffentlichten Daten konnten nicht geladen werden. Lade eine Datei.'; data = {laute: [], lieder: [], zaehlungen: [], kandidaten_verworfen: []}; render(); });
})();
