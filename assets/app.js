// Shalalameter – öffentliche Seite: Kurven-Diagramm, Filter, gewählter Zeitabschnitt.
(() => {
const {esc, fmt} = SM;
const $ = id => document.getElementById(id);

let data = null;
let hidden = new Set();
let mode = 'sum';
let typeOn = new Set(SM.TYPES.filter(t => t.on).map(t => t.id));
let minSicher = 1;
let aufl = false;
let selYear = null;
let hoverIdx = null;
let geo = null;

const color = slot => `var(--c${slot})`;
const sounds = () => SM.sounds(data);
const visible = () => sounds().filter(s => !hidden.has(s.id));
const total = s => visible().reduce((t, x) => t + (s.values[x.id] || 0), 0);

/* ---------- Daten laden ---------- */
async function loadData(){
  const params = new URLSearchParams(location.search);
  if (params.has('vorschau')) {
    try {
      const d = SM.normalize(JSON.parse(localStorage.getItem(SM.DRAFT_KEY) || 'null'));
      if (d) { showNotice('<span><strong>Vorschau.</strong> Diese Ansicht zeigt den Entwurf aus der Werkstatt in diesem Browser, nicht die veröffentlichten Daten.</span><a class="btn" href="./">Veröffentlichte Daten zeigen</a>'); return d; }
    } catch (e) {}
  }
  const res = await fetch('daten/shalalameter-daten.json', {cache: 'no-cache'});
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const d = SM.normalize(await res.json());
  if (!d) throw new Error('Format');
  if (d.beispiel) showNotice('<span><strong>Beispieldaten.</strong> Titel und Zahlen sind erfunden. Die echte Auszählung folgt in Kürze.</span>');
  return d;
}
function showNotice(html){ $('notice').innerHTML = html; $('notice').hidden = false; }

/* ---------- Filter ---------- */
function renderTypeFilter(){
  const fs = $('typ-filter');
  for (const t of SM.TYPES) fs.insertAdjacentHTML('beforeend', `<label class="pill"><input type="checkbox" id="typ-${t.id}" data-typ="${t.id}" ${typeOn.has(t.id) ? 'checked' : ''}> ${t.name}</label>`);
}
$('typ-filter').addEventListener('change', e => {
  const t = e.target.dataset.typ; if (!t) return;
  e.target.checked ? typeOn.add(t) : typeOn.delete(t); render();
});
$('f-sicher').addEventListener('change', e => { minSicher = +e.target.value; render(); });
$('f-aufl').addEventListener('change', e => { aufl = e.target.checked; render(); });
for (const [id, m] of [['mode-sum', 'sum'], ['mode-avg', 'avg']]) {
  $(id).addEventListener('click', () => {
    mode = m; ['mode-sum', 'mode-avg'].forEach(b => $(b).setAttribute('aria-pressed', b === id)); render();
  });
}

function renderStats(songs){
  const shown = songs.filter(s => s.shown);
  const counted = shown.filter(s => s.counted).length;
  const noText = shown.filter(s => !s.best).length;
  const low = shown.filter(s => s.lowConf).length;
  const hiddenTyp = songs.filter(s => !typeOn.has(s.typ)).length;
  $('stats').innerHTML = `<span><b>${shown.length}</b> Lieder</span><span><b>${counted}</b> gezählt</span><span><b>${noText}</b> ohne Text</span>`
    + (low ? `<span><b>${low}</b> unter Sicherheitsschwelle</span>` : '')
    + (hiddenTyp ? `<span class="muted">${hiddenTyp} ausgeblendet (Typ)</span>` : '');
}

/* ---------- Legende ---------- */
function renderLegend(songs){
  $('legend').innerHTML = sounds().map(s => {
    const t = songs.filter(x => x.shown && x.counted).reduce((a, x) => a + (x.values[s.id] || 0), 0);
    return `<button type="button" data-id="${esc(s.id)}" aria-pressed="${!hidden.has(s.id)}" title="${esc(s.name)} ein- oder ausblenden">
      <span class="sw" style="background:${color(s.slot)}"></span>${esc(s.name)} <span class="n">${t}</span></button>`;
  }).join('');
}
$('legend').addEventListener('click', e => {
  const b = e.target.closest('button[data-id]'); if (!b) return;
  const id = b.dataset.id; hidden.has(id) ? hidden.delete(id) : hidden.add(id); render();
});

/* ---------- Gestapelte Kurven ---------- */
function renderChart(cols){
  const svg = $('chart'), wrap = $('chart-wrap');
  wrap.querySelector('.empty-chart')?.remove();
  if (!cols.length) {
    svg.setAttribute('width', 0); svg.setAttribute('height', 0); svg.innerHTML = ''; geo = null;
    wrap.insertAdjacentHTML('beforeend', '<div class="empty-chart">Keine Lieder für diese Auswahl. Ändere die Filter.</div>');
    return;
  }
  const vis = visible();
  const cw = wrap.clientWidth - 8;
  const M = {t: 18, r: 28, b: 46, l: 40};
  const H = cw < 600 ? 310 : 430;
  const n = cols.length;
  const W = Math.max(cw, M.l + M.r + Math.max(1, n - 1) * 52);
  const iw = W - M.l - M.r, ih = H - M.t - M.b;
  const xs = t => n === 1 ? M.l + iw / 2 : M.l + (t / (n - 1)) * iw;

  // Jede Schicht wird einzeln geglättet und dann gestapelt, so kreuzen sich die Kurven nie.
  const fns = vis.map(s => SM.monotone(cols.map(c => c.counts[s.id])));
  const SUB = 24, ts = [];
  if (n === 1) ts.push(-0.5, 0.5);
  else for (let k = 0; k <= (n - 1) * SUB; k++) ts.push(k / SUB);
  const stacks = ts.map(t => { let acc = 0; return fns.map(f => (acc += f(n === 1 ? 0 : t))); });
  const maxT = Math.max(1e-9, ...stacks.map(st => st.length ? st[st.length - 1] : 0));
  const step = SM.niceStep(Math.max(maxT, mode === 'avg' ? 1 : 4)), top = Math.ceil(maxT / step) * step || step;
  const y = v => M.t + ih - (v / top) * ih;
  const xt = t => n === 1 ? M.l + iw / 2 + t * iw : xs(t);

  let out = '';
  for (let v = 0; v <= top + 1e-9; v += step) {
    out += `<line class="${v === 0 ? 'base' : 'grid'}" x1="${M.l}" x2="${W - M.r}" y1="${y(v)}" y2="${y(v)}"/>`;
    out += `<text x="${M.l - 10}" y="${y(v) + 4}" text-anchor="end">${fmt(+v.toFixed(2))}</text>`;
  }
  const si = cols.findIndex(c => c.year === selYear);
  const half = n === 1 ? iw / 2 : iw / (n - 1) / 2;
  if (si >= 0) {
    const x0 = Math.max(M.l, xs(si) - half), x1 = Math.min(W - M.r, xs(si) + half);
    out += `<rect class="selband" x="${x0}" y="${M.t}" width="${x1 - x0}" height="${ih}"/>`;
  }
  vis.forEach((s, k) => {
    const upper = ts.map((t, j) => `${xt(t).toFixed(1)},${y(stacks[j][k]).toFixed(1)}`);
    const lower = ts.map((t, j) => `${xt(t).toFixed(1)},${y(k ? stacks[j][k - 1] : 0).toFixed(1)}`).reverse();
    out += `<path class="layer" fill="${color(s.slot)}" d="M${upper.join('L')}L${lower.join('L')}Z"/>`;
  });
  // Direkte Beschriftung an der dicksten Stelle jeder Schicht
  vis.forEach((s, k) => {
    let best = -1, bj = 0;
    stacks.forEach((st, j) => { const th = st[k] - (k ? st[k - 1] : 0); if (th > best) { best = th; bj = j; } });
    if ((best / top) * ih < 20) return;
    const x = Math.min(W - M.r - 40, Math.max(M.l + 40, xt(ts[bj])));
    out += `<text class="lbl" x="${x}" y="${y(stacks[bj][k] - best / 2) + 4}" text-anchor="middle">${esc(s.name)}</text>`;
  });
  if (si >= 0) {
    out += `<line class="selline" x1="${xs(si)}" x2="${xs(si)}" y1="${M.t}" y2="${M.t + ih}"/>`;
    let acc = 0;
    vis.forEach(s => { const v = cols[si].counts[s.id]; acc += v; if (v > 0) out += `<circle class="dot" cx="${xs(si)}" cy="${y(acc)}" r="4.5" fill="${color(s.slot)}"/>`; });
  }
  const every = Math.max(1, Math.ceil(40 / (n === 1 ? 999 : iw / (n - 1))));
  cols.forEach((c, i) => {
    if (i % every && i !== si) return;
    out += `<text class="yr${i === si ? ' sel' : ''}" x="${xs(i)}" y="${H - M.b + 18}" text-anchor="middle">${c.year}</text>`;
    // Abdeckung: gezählte / alle Lieder des Jahres
    if (c.songs.length) out += `<text class="cov" x="${xs(i)}" y="${H - M.b + 32}" text-anchor="middle">${c.counted.length}/${c.songs.length}</text>`;
  });
  cols.forEach((c, i) => {
    const x0 = Math.max(0, xs(i) - half), x1 = Math.min(W, xs(i) + half);
    out += `<rect class="hit" data-i="${i}" tabindex="0" role="button" aria-pressed="${i === si}" aria-label="${c.year}: ${c.counted.length} von ${c.songs.length} Liedern gezählt" x="${x0}" y="${M.t}" width="${x1 - x0}" height="${ih + M.b}"/>`;
  });
  svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = out;
  geo = {cols, xs, M, ih};
}

function showTip(i){
  const tip = $('tip');
  if (i == null || !geo) { tip.hidden = true; return; }
  const c = geo.cols[i];
  const rows = visible().map(s =>
    `<div class="row"><span class="sw" style="background:${color(s.slot)}"></span><span>${esc(s.name)}</span><span>${fmt(+c.counts[s.id].toFixed(1))}</span></div>`).join('');
  const meta = c.songs.length ? `${c.counted.length} von ${c.songs.length} Liedern gezählt${mode === 'avg' ? ' · Ø je Lied' : ''}` : 'keine Lieder';
  tip.innerHTML = `<b>${c.year}</b><div class="meta">${meta}</div>${rows}`;
  tip.hidden = false;
  const wrap = $('chart-wrap'), bx = geo.xs(i);
  let left = bx + 16;
  if (left + tip.offsetWidth > wrap.scrollLeft + wrap.clientWidth) left = bx - 16 - tip.offsetWidth;
  tip.style.left = Math.max(wrap.scrollLeft, left) + 'px';
  tip.style.top = '24px';
}
function setHover(i){
  if (i === hoverIdx) return;
  hoverIdx = i;
  const svg = $('chart');
  svg.querySelector('.hover')?.remove();
  if (i != null && geo && geo.cols[i].year !== selYear) {
    const x = geo.xs(i), first = svg.querySelector('.hit');
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.setAttribute('class', 'hover'); l.setAttribute('x1', x); l.setAttribute('x2', x);
    l.setAttribute('y1', geo.M.t); l.setAttribute('y2', geo.M.t + geo.ih);
    svg.insertBefore(l, first);
  }
  showTip(i);
}
function select(i){
  if (!geo || !geo.cols[i]) return;
  selYear = geo.cols[i].year;
  history.replaceState(null, '', '#' + selYear);
  render();
  $('chart').querySelector(`.hit[data-i="${i}"]`)?.focus({preventScroll: true});
}
const chart = $('chart');
chart.addEventListener('pointermove', e => { const h = e.target.closest('.hit'); setHover(h ? +h.dataset.i : null); });
chart.addEventListener('pointerleave', () => setHover(null));
chart.addEventListener('click', e => { const h = e.target.closest('.hit'); if (h) select(+h.dataset.i); });
chart.addEventListener('keydown', e => {
  const h = e.target.closest('.hit'); if (!h) return;
  const i = +h.dataset.i;
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(i); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); select(Math.min(geo.cols.length - 1, i + 1)); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); select(Math.max(0, i - 1)); }
});

/* ---------- Zeitabschnitt ---------- */
function countRow(z){
  const snds = sounds();
  const w = SM.countable(z) ? snds.map(s => `<td>${SM.value(z, s.id, aufl)}</td>`).join('')
    : `<td colspan="${snds.length}" style="text-align:left">${z.status === 'kein_text_gefunden' ? 'kein Text gefunden' : esc(z.status)}</td>`;
  const src = SM.isHttp(z.quelle_url) ? `<a href="${esc(z.quelle_url)}" target="_blank" rel="noopener">Link</a>` : esc(z.quelle_url || '–');
  return `<tr><td>${esc(SM.GRUND_LABEL[z.grundlage] || z.grundlage)}</td><td>${esc(z.gezaehlt_von || '–')}</td><td>${esc(z.sicherheit || '–')}</td>${w}<td style="text-align:left">${src}</td></tr>`;
}
function renderPeriod(cols){
  const c = cols.find(x => x.year === selYear);
  const uc = $('uncounted');
  renderTable(cols);
  if (!c) { $('period-h').textContent = '–'; $('period-sum').textContent = ''; $('rank').innerHTML = ''; uc.hidden = true; return; }
  const vis = visible(), snds = sounds();
  const all = c.counted.map(s => ({s, tot: total(s)})).sort((a, b) => b.tot - a.tot || a.s.l.titel.localeCompare(b.s.l.titel, 'de'));
  const list = all.filter(x => x.tot > 0), silent = all.filter(x => x.tot === 0);
  const sumAll = list.reduce((t, x) => t + x.tot, 0);
  const maxTot = Math.max(1, ...list.map(x => x.tot));
  $('period-h').textContent = String(c.year);
  $('period-sum').textContent = c.songs.length ? `${c.counted.length} von ${c.songs.length} Liedern gezählt · ${sumAll} Laute · sortiert nach Anzahl` : '';
  $('rank').innerHTML = list.length ? list.map((x, i) => {
    const s = x.s, segs = vis.filter(v => s.values[v.id] > 0), b = s.best;
    const link = SM.isHttp(b.quelle_url) ? `<a href="${esc(b.quelle_url)}" target="_blank" rel="noopener">Quelle</a>` : '';
    const gekuerzt = b.anzahl_aufgeloest && typeof b.anzahl_aufgeloest === 'object' && !aufl;
    return `<li>
      <span class="pos">${i + 1}</span>
      <span><span class="t">${esc(s.l.titel)}</span><br><span class="m">${esc(s.l.erstveroeffentlichung)}${s.l.veroeffentlichung ? ' · ' + esc(s.l.veroeffentlichung) : ''}</span></span>
      <span class="viz">
        <span class="bar" style="width:${(x.tot / maxTot) * 100}%">${segs.map(v => `<span style="flex:${s.values[v.id]};background:${color(v.slot)}"></span>`).join('')}</span>
        <span class="chips">${segs.map(v => `<span class="chip"><i style="background:${color(v.slot)}"></i>${esc(v.name)} ${s.values[v.id]}</span>`).join('') || '<span class="muted">keine Laute</span>'}</span>
      </span>
      <span class="tot">${x.tot}</span>
      <span class="src">
        ${s.typ !== 'original' ? `<span class="badge typ">${SM.TYPE_LABEL[s.typ]}</span>` : ''}
        <span class="badge ${esc(b.sicherheit)}">${esc(b.sicherheit || '?')}</span>
        <span>${esc(SM.GRUND_LABEL[b.grundlage] || b.grundlage)}${b.quelle_art ? ' · ' + esc(b.quelle_art) : ''}</span>
        ${link}
        ${gekuerzt ? '<span class="muted">Refrain im Text gekürzt</span>' : ''}
        ${b.notiz ? `<span class="muted">${esc(b.notiz)}</span>` : ''}
      </span>
      ${s.all.length > 1 ? `<details><summary>${s.all.length} Zählungen vergleichen</summary><div class="counts"><table><thead><tr><th>Grundlage</th><th>Von</th><th>Sicherheit</th>${snds.map(v => `<th>${esc(v.name)}</th>`).join('')}<th style="text-align:left">Quelle</th></tr></thead><tbody>${s.all.map(countRow).join('')}</tbody></table></div></details>` : ''}
    </li>`;
  }).join('') : `<li class="empty muted">${c.counted.length ? `In den gezählten Liedern aus ${c.year} kommen keine dieser Laute vor.` : `Aus ${c.year} gibt es keine gezählten Lieder für diese Auswahl.`}</li>`;
  const rest = c.songs.filter(s => !s.counted);
  const lines = [];
  if (silent.length) lines.push('<b>Ohne Laute:</b> ' + silent.map(x => esc(x.s.l.titel)).join(' · '));
  if (rest.length) lines.push('<b>Ohne Zählung:</b> ' + rest.map(s =>
    `${esc(s.l.titel)} <span class="muted">(${s.lowConf ? 'unter Sicherheitsschwelle' : 'kein Text gefunden'})</span>`).join(' · '));
  uc.hidden = !lines.length;
  uc.innerHTML = lines.join('<br>');
}
function renderTable(cols){
  const snds = sounds();
  $('table').innerHTML = `<table><thead><tr><th>Jahr</th><th>Gezählt</th>${snds.map(s => `<th>${esc(s.name)}</th>`).join('')}</tr></thead><tbody>${
    cols.map(c => `<tr><td>${c.year}</td><td>${c.counted.length}/${c.songs.length}</td>${snds.map(s => `<td>${fmt(+c.counts[s.id].toFixed(1))}</td>`).join('')}</tr>`).join('')
  }</tbody></table>`;
}

/* ---------- Gesamtrender ---------- */
function render(){
  const songs = SM.derive(data, {typeOn, minSicher, aufl});
  const cols = SM.yearCols(songs, sounds(), mode);
  if (!cols.some(c => c.year === selYear)) {
    let best = null, bv = -1;
    cols.forEach(c => { const v = visible().reduce((t, s) => t + c.counts[s.id], 0); if (v > bv) { bv = v; best = c.year; } });
    selYear = best;
  }
  hoverIdx = null; $('tip').hidden = true;
  renderStats(songs); renderLegend(songs); renderChart(cols); renderPeriod(cols);
}

renderTypeFilter();
loadData().then(d => {
  data = d;
  const fromHash = parseInt(location.hash.slice(1), 10);
  if (fromHash) selYear = fromHash;
  render();
  let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(render, 120); });
}).catch(() => {
  $('chart-wrap').innerHTML = '<div class="empty-chart">Die Daten konnten nicht geladen werden. Bitte lade die Seite neu.</div>';
});
})();
