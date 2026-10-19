// Schalalameter, öffentliche Seite: gestapelte Kurven nach Familien über die Albumphasen
// (Familien ein- und ausblendbar), Detail einer Familie mit Steckbrief und kleinen Kurven je Laut,
// Übersicht aller Schalalas, gewählte Albumphase mit ihren Liedern.
(() => {
const {esc, fmt} = SM;
const $ = id => document.getElementById(id);

let data = null;
let detail = null;               // id der Familie, deren Detail offen ist
let hidden = new Set();          // ausgeblendete Familien
// Die Seite zeigt nur eigene Lieder, jede Sicherheitsstufe und zählt, was im Text steht.
const typeOn = new Set(['original']);
const minSicher = 1;
const aufl = false;
let sel = null;                  // gewählte Albumphase (id)
let hoverIdx = null;
// Darstellung des Hauptdiagramms: absolut oder relativ (je Album ergeben die eingeblendeten Familien 100 %).
// Nur eine Ansichtsvorliebe, deshalb im Browser gemerkt und nicht in der Adresse.
let relativ = false;
try { relativ = localStorage.getItem('schalala-skala') === 'relativ'; } catch (e) {}
let geo = null;

const color = slot => `var(--c${slot})`;
const num = v => fmt(+v.toFixed(1));
const fams = () => SM.families(data);
const sounds = () => SM.sounds(data);
// Überall stehen die Laute groß (Untertitel) und der Familienname klein darunter.
const short = f => f.untertitel || f.anzeigename;
const long = f => f.anzeigename;
const visFams = () => fams().filter(f => !hidden.has(f.id));
const membersOf = f => sounds().filter(s => s.familie === f.id);
const famValue = (counts, f) => membersOf(f).reduce((t, s) => t + (counts[s.id] || 0), 0);
// Wert einer Familie in einer Albumphase, wie das Hauptdiagramm ihn zeigt: absolut oder als Anteil in Prozent.
const colTotal = c => visFams().reduce((t, f) => t + famValue(c.counts, f), 0);
const chartValue = (c, f) => { if (!relativ) return famValue(c.counts, f); const s = colTotal(c); return s ? famValue(c.counts, f) / s * 100 : 0; };
const detailFam = () => fams().find(f => f.id === detail) || null;
// Die Rangliste zählt bei offenem Detail nur dessen Laute, sonst alle eingeblendeten Familien.
const rankSounds = () => { const d = detailFam(); return d ? membersOf(d) : visFams().flatMap(membersOf); };
const total = s => rankSounds().reduce((t, x) => t + (s.values[x.id] || 0), 0);
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const datum = d => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ''); return m ? `${+m[3]}.${+m[2]}.${m[1]}` : (d || ''); };

const LUPE = '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12.6 12.6 17 17" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';

// Lange Namen umbrechen statt kürzen (SVG kennt keinen automatischen Umbruch).
function wrapLabel(text, max){
  const lines = [];
  let cur = '';
  for (const w of String(text).split(' ')) {
    if (cur && (cur + ' ' + w).length > max) { lines.push(cur); cur = w; }
    else cur = cur ? cur + ' ' + w : w;
  }
  if (cur) lines.push(cur);
  return lines;
}

/* ---------- Daten laden ---------- */
async function loadData(){
  const params = new URLSearchParams(location.search);
  if (params.has('vorschau')) {
    try {
      const d = SM.normalize(JSON.parse(localStorage.getItem(SM.DRAFT_KEY) || 'null'));
      if (d) { showNotice('<span><strong>Vorschau.</strong> Diese Ansicht zeigt den Entwurf aus der Werkstatt in diesem Browser, nicht die veröffentlichten Daten.</span><a class="btn" href="./">Veröffentlichte Daten zeigen</a>'); return d; }
    } catch (e) {}
  }
  // Datendatei, Fanzählungen und Liedthemen der Schalalalogie parallel; ohne Antwort von Supabase nach 3 Sekunden nur die Datendatei.
  const fans = window.SchalalaFans ? window.SchalalaFans.load(3000) : Promise.resolve(null);
  const themen = window.SchalalaFans && SchalalaFans.ready() ? SchalalaFans.forum.liedthemen(3000) : Promise.resolve(null);
  themen.then(rows => { diskussion = rows ? new Map(rows.map(x => [x.lied_id, +x.beitraege])) : null; if (data) render(); });
  const res = await fetch('daten/shalalameter-daten.json', {cache: 'no-cache'});
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const d = SM.normalize(await res.json());
  if (!d) throw new Error('Format');
  if (d.beispiel) showNotice('<span><strong>Beispieldaten.</strong> Titel und Zahlen sind erfunden. Die echte Auszählung folgt in Kürze.</span>');
  const rows = await fans;
  fanZeilen = rows;
  return rows && rows.length ? SM.withFans(d, rows) : d;
}
const zaehlLink = id => `zaehlen.html?lied=${encodeURIComponent(id)}`;
// Fanzählungen, wie sie aus Supabase kamen (für „Zuletzt gezählt“); null, wenn nicht erreichbar.
let fanZeilen = null;
// Beiträge je Liedthema (Lied-ID → Anzahl); null, solange nicht geladen oder Supabase nicht erreichbar.
let diskussion = null;
const diskLink = id => {
  const n = diskussion ? diskussion.get(id) || 0 : null;
  return `<a class="zaehlmit" href="schalalalogie.html#lied/${encodeURIComponent(id)}">Diskussion${n ? ` (${n})` : ''}</a>`;
};
function showNotice(html){ $('notice').innerHTML = html; $('notice').hidden = false; }

/* ---------- Adresse: #phase, #phase/familie, #phase/familie/aus1,aus2 (familie „-“ = kein Detail) ---------- */
function writeHash(){
  const parts = [sel || ''];
  if (detail || hidden.size) parts.push(detail || '-');
  if (hidden.size) parts.push([...hidden].join(','));
  history.replaceState(null, '', '#' + parts.join('/'));
}
function readHash(){
  const [p, d, a] = location.hash.slice(1).split('/');
  const alb = SM.albums(data);
  if (alb.some(x => x.id === p)) sel = p;
  else if (/^\d{4}$/.test(p || '')) {
    // Ältere Links mit Jahreszahl: das Album dieses Jahres, sonst das zeitlich nächste.
    const y = +p;
    const hit = alb.find(x => String(x.datum).startsWith(p)) ||
      alb.slice().sort((a1, a2) => Math.abs(+a1.datum.slice(0, 4) - y) - Math.abs(+a2.datum.slice(0, 4) - y))[0];
    if (hit) sel = hit.id;
  }
  const ids = new Set(fams().map(f => f.id));
  detail = d && ids.has(d) ? d : null;
  hidden = new Set((a || '').split(',').filter(x => ids.has(x)));
  if (hidden.size >= ids.size) hidden = new Set();
}
function toggleFam(id){
  if (hidden.has(id)) hidden.delete(id);
  else { if (visFams().length <= 1) return; hidden.add(id); }
  writeHash(); render();
}
function openDetail(id){
  detail = detail === id ? null : id;
  writeHash(); render();
  if (detail) $('detail').scrollIntoView({block: 'nearest', behavior: reduceMotion() ? 'auto' : 'smooth'});
}

function renderStats(songs){
  const shown = songs.filter(s => s.shown);
  const counted = shown.filter(s => s.counted).length;
  const noText = shown.filter(s => !s.best).length;
  $('stats').innerHTML = `<span><b>${shown.length}</b> Lieder</span><span><b>${counted}</b> gezählt</span><span><b>${noText}</b> ohne Text</span>`
    + `<span><b>${sounds().length}</b> Schalalas in ${fams().length} Familien</span>`;
}

/* ---------- Zähl mit: Knopf mit offenen Liedern, Albumphasen mit Lücken ---------- */
// Offen = eigenes Lied ohne jede Zählung. Lücke = Albumphase, in der weniger als die Hälfte der gezeigten Lieder gezählt ist.
function renderZaehlMit(songs, cols){
  const offen = songs.filter(s => s.typ === 'original' && !s.best).length;
  for (const id of ['cta-n', 'cta-fest-n']) { $(id).textContent = `${offen} ${offen === 1 ? 'Lied' : 'Lieder'} offen`; $(id).hidden = !offen; }
  const gaps = cols.filter(c => c.songs.length && c.counted.length < c.songs.length / 2);
  $('luecken').innerHTML = gaps.length ? '<span>Hier fehlen noch Zählungen:</span>' + gaps.map(c =>
    `<a href="zaehlen.html?album=${encodeURIComponent(c.album.id)}"><span><b>${esc(c.album.titel)}</b><small>${c.counted.length ? `nur ${c.counted.length}` : 'noch keins'} von ${c.songs.length} Liedern gezählt</small></span><span class="go">Zähl mit →</span></a>`).join('') : '';
  $('luecken').hidden = !gaps.length;
}
// Fester Knopf auf dem Handy, sobald der obere Knopf aus dem Bild gescrollt ist.
if ('IntersectionObserver' in window) {
  new IntersectionObserver(([e]) => { $('cta-fest').hidden = e.isIntersecting || e.boundingClientRect.top > 0; }).observe($('cta'));
}

/* ---------- Legende: Schalter + Lupe je Familie ---------- */
function famTotal(songs, f){
  const m = membersOf(f);
  return songs.filter(x => x.shown && x.counted).reduce((a, s) => a + m.reduce((b, x) => b + (s.values[x.id] || 0), 0), 0);
}
function renderLegend(songs){
  $('legend').innerHTML = fams().map(f => {
    const on = !hidden.has(f.id), open = detail === f.id, t = famTotal(songs, f);
    return `<span class="lchip${on ? '' : ' off'}${open ? ' open' : ''}${t ? '' : ' empty'}">
      <button type="button" class="tog" data-tog="${esc(f.id)}" aria-pressed="${on}" title="${esc(short(f))} ein- oder ausblenden">
        <span class="sw" style="background:${color(f.slot)}"></span>
        <span class="lt"><span class="ln">${esc(short(f))}</span><span class="ls">${esc(long(f))}</span></span>
        <span class="n">${t}</span>
      </button><button type="button" class="lupe" data-lupe="${esc(f.id)}" aria-expanded="${open}" aria-controls="detail" aria-label="Steckbrief ${esc(long(f))} ${open ? 'schließen' : 'öffnen'}">${LUPE}</button></span>`;
  }).join('');
  const note = $('legend-note');
  note.hidden = !hidden.size;
  note.innerHTML = hidden.size ? `${hidden.size} ${hidden.size === 1 ? 'Familie' : 'Familien'} ausgeblendet · <button type="button" class="linkbtn" id="show-all">Alle zeigen</button>` : '';
}
$('legend').addEventListener('click', e => {
  const t = e.target.closest('[data-tog]'); if (t) { toggleFam(t.dataset.tog); return; }
  const l = e.target.closest('[data-lupe]'); if (l) openDetail(l.dataset.lupe);
});
$('legend-note').addEventListener('click', e => {
  if (e.target.id === 'show-all') { hidden = new Set(); writeHash(); render(); }
});

/* ---------- Achse: Albumphasen gleichmäßig verteilt, als Cover ---------- */
// Name, Jahr und Abdeckung stehen im Tooltip und in der Phasenansicht, nicht an der Achse.
const coverSrc = a => a.cover || `assets/cover/${a.id}.jpg`;
function axisLayout(cw, n){
  const W = Math.max(cw, 300);
  const spacing = (W - 40 - 28) / Math.max(1, n - 1);
  const size = Math.round(Math.max(26, Math.min(56, spacing * 0.72)));
  return {size, M: {t: 18, r: Math.max(28, size / 2 + 6), b: size + 20, l: Math.max(40, size / 2 + 6)}};
}
function phaseAxis(cols, xs, y0, si, size){
  return cols.map((c, i) => {
    const x = xs(i) - size / 2, y = y0 + 10;
    // Unter dem Bild liegt der Kurzname; er ist nur zu sehen, wenn das Cover fehlt.
    return `<g class="cov-item${i === si ? ' sel' : ''}">`
      + `<rect class="cov-bg" x="${x}" y="${y}" width="${size}" height="${size}" rx="3"/>`
      + (size >= 44 ? `<text class="cov-alt" x="${xs(i)}" y="${y + size / 2 + 3}" text-anchor="middle">${esc(c.label)}</text>` : '')
      + `<image href="${esc(coverSrc(c.album))}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice"/>`
      + (i === si ? `<rect class="cov-ring" x="${x - 3}" y="${y - 3}" width="${size + 6}" height="${size + 6}" rx="5"/>` : '')
      + `</g>`;
  }).join('');
}
function hitRects(cols, xs, half, W, top, height){
  return cols.map((c, i) => {
    const x0 = Math.max(0, xs(i) - half), x1 = Math.min(W, xs(i) + half);
    return `<rect class="hit" data-i="${i}" tabindex="0" role="button" aria-pressed="${c.key === sel}" aria-label="${esc(c.album.titel)}: ${c.counted.length} von ${c.songs.length} Liedern gezählt" x="${x0}" y="${top}" width="${x1 - x0}" height="${height}"/>`;
  }).join('');
}

/* ---------- Hauptdiagramm: gestapelte Kurven der eingeblendeten Familien ---------- */
function renderChart(cols){
  const svg = $('chart'), wrap = $('chart-wrap');
  wrap.querySelector('.empty-chart')?.remove();
  if (!cols.length) {
    svg.setAttribute('width', 0); svg.setAttribute('height', 0); svg.innerHTML = ''; geo = null;
    wrap.insertAdjacentHTML('beforeend', '<div class="empty-chart">Keine Lieder für diese Auswahl. Ändere die Filter.</div>');
    return;
  }
  const vis = visFams();
  const cw = wrap.clientWidth - 8;
  const n = cols.length;
  const {size, M} = axisLayout(cw, n);
  const H = (cw < 600 ? 270 : 390) + M.b;
  const W = Math.max(cw, 300);
  const iw = W - M.l - M.r, ih = H - M.t - M.b;
  const xs = t => n === 1 ? M.l + iw / 2 : M.l + (t / (n - 1)) * iw;

  // Jede Schicht wird einzeln geglättet und dann gestapelt, so kreuzen sich die Kurven nie.
  // Die Achse passt sich den eingeblendeten Familien an.
  const fns = vis.map(f => SM.monotone(cols.map(c => chartValue(c, f))));
  const SUB = 24, ts = [];
  if (n === 1) ts.push(-0.5, 0.5);
  else for (let k = 0; k <= (n - 1) * SUB; k++) ts.push(k / SUB);
  // Relativ: Zwischen den Alben kann die Summe der geglätteten Schichten knapp über 100 % liegen, deshalb gekappt.
  const stacks = ts.map(t => { let acc = 0; return fns.map(fn => (acc += fn(n === 1 ? 0 : t), relativ ? Math.min(acc, 100) : acc)); });
  const maxT = Math.max(1e-9, ...stacks.map(st => st.length ? st[st.length - 1] : 0));
  const step = relativ ? 25 : SM.niceStep(Math.max(maxT, 4)), top = relativ ? 100 : Math.ceil(maxT / step) * step || step;
  const y = v => M.t + ih - (v / top) * ih;
  const xt = t => n === 1 ? M.l + iw / 2 + t * iw : xs(t);

  let out = '';
  for (let v = 0; v <= top + 1e-9; v += step) {
    out += `<line class="${v === 0 ? 'base' : 'grid'}" x1="${M.l}" x2="${W - M.r}" y1="${y(v)}" y2="${y(v)}"/>`;
    out += `<text x="${M.l - 10}" y="${y(v) + 4}" text-anchor="end">${fmt(+v.toFixed(2))}${relativ ? ' %' : ''}</text>`;
  }
  const si = cols.findIndex(c => c.key === sel);
  const half = n === 1 ? iw / 2 : iw / (n - 1) / 2;
  if (si >= 0) {
    const x0 = Math.max(M.l, xs(si) - half), x1 = Math.min(W - M.r, xs(si) + half);
    out += `<rect class="selband" x="${x0}" y="${M.t}" width="${x1 - x0}" height="${ih}"/>`;
  }
  vis.forEach((f, k) => {
    const upper = ts.map((t, j) => `${xt(t).toFixed(1)},${y(stacks[j][k]).toFixed(1)}`);
    const lower = ts.map((t, j) => `${xt(t).toFixed(1)},${y(k ? stacks[j][k - 1] : 0).toFixed(1)}`).reverse();
    out += `<path class="layer${f.id === detail ? ' open' : ''}" fill="${color(f.slot)}" d="M${upper.join('L')}L${lower.join('L')}Z"/>`;
  });
  // Direkte Beschriftung an der dicksten Stelle jeder Schicht
  vis.forEach((f, k) => {
    let best = -1, bj = 0;
    stacks.forEach((st, j) => { const th = st[k] - (k ? st[k - 1] : 0); if (th > best) { best = th; bj = j; } });
    const lines = wrapLabel(short(f), 16);
    if ((best / top) * ih < lines.length * 15 + 6) return;
    const xx = Math.min(W - M.r - 60, Math.max(M.l + 60, xt(ts[bj])));
    const y0 = y(stacks[bj][k] - best / 2) + 4 - (lines.length - 1) * 7.5;
    out += `<text class="lbl" x="${xx}" y="${y0}" text-anchor="middle">${lines.map((l, i) => `<tspan x="${xx}" dy="${i ? 15 : 0}">${esc(l)}</tspan>`).join('')}</text>`;
  });
  if (si >= 0) {
    out += `<line class="selline" x1="${xs(si)}" x2="${xs(si)}" y1="${M.t}" y2="${M.t + ih}"/>`;
    let acc = 0;
    vis.forEach(f => { const v = chartValue(cols[si], f); acc += v; if (v > 0) out += `<circle class="dot" cx="${xs(si)}" cy="${y(Math.min(acc, top))}" r="4.5" fill="${color(f.slot)}"/>`; });
  }
  out += phaseAxis(cols, xs, H - M.b, si, size);
  out += hitRects(cols, xs, half, W, M.t, ih + M.b);
  svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('aria-label', `Gestapelte Kurven: ${relativ ? 'Anteile der Familien je Albumphase, jedes Album 100 %' : 'Schalalas je Albumphase nach Familien'}${hidden.size ? ', ' + hidden.size + ' ausgeblendet' : ''}`);
  svg.innerHTML = out;
  geo = {cols, xs, M, ih, W, half, iw};
}

function showTip(i){
  const tip = $('tip');
  if (i == null || !geo) { tip.hidden = true; return; }
  const c = geo.cols[i];
  const rows = visFams().map(f =>
    `<div class="row"><span class="sw" style="background:${color(f.slot)}"></span><span>${esc(short(f))}</span><span>${relativ ? `${Math.round(chartValue(c, f))} % <span class="muted">(${num(famValue(c.counts, f))})</span>` : num(famValue(c.counts, f))}</span></div>`).join('');
  const meta = `${c.year || ''}${c.songs.length ? ` · ${c.counted.length} von ${c.songs.length} Liedern gezählt` : ' · keine Lieder'}`;
  tip.innerHTML = `<b>${esc(c.album.titel)}</b><div class="meta">${meta}</div>${rows}`;
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
  if (i != null && geo && geo.cols[i].key !== sel) {
    const x = geo.xs(i), first = svg.querySelector('.hit');
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.setAttribute('class', 'hover'); l.setAttribute('x1', x); l.setAttribute('x2', x);
    l.setAttribute('y1', geo.M.t); l.setAttribute('y2', geo.M.t + geo.ih);
    svg.insertBefore(l, first);
  }
  showTip(i);
}
function selectPhase(key, focusSvg){
  sel = key;
  writeHash();
  render();
  if (focusSvg && geo) focusSvg.querySelector(`.hit[data-i="${geo.cols.findIndex(c => c.key === key)}"]`)?.focus({preventScroll: true});
}
function bindPhaseKeys(svg){
  svg.addEventListener('click', e => { const h = e.target.closest('.hit'); if (h) selectPhase(geo.cols[+h.dataset.i].key, svg); });
  svg.addEventListener('keydown', e => {
    const h = e.target.closest('.hit'); if (!h) return;
    const i = +h.dataset.i, last = geo.cols.length - 1;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectPhase(geo.cols[i].key, svg); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); selectPhase(geo.cols[Math.min(last, i + 1)].key, svg); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); selectPhase(geo.cols[Math.max(0, i - 1)].key, svg); }
  });
}
document.querySelector('.skala').addEventListener('click', e => {
  const b = e.target.closest('[data-skala]'); if (!b) return;
  relativ = b.dataset.skala === 'relativ';
  try { localStorage.setItem('schalala-skala', relativ ? 'relativ' : 'absolut'); } catch (err) {}
  render();
});
function renderSkala(){ document.querySelectorAll('[data-skala]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.skala === 'relativ') === relativ))); }
const chart = $('chart');
chart.addEventListener('pointermove', e => { const h = e.target.closest('.hit'); setHover(h ? +h.dataset.i : null); });
chart.addEventListener('pointerleave', () => setHover(null));
bindPhaseKeys(chart);

/* ---------- Detail einer Familie: Steckbrief + kleine Kurven je Laut ---------- */
function renderDetail(cols, songs){
  const f = detailFam(), box = $('detail');
  box.hidden = !f;
  if (!f || !geo) { box.innerHTML = ''; return; }
  const members = membersOf(f);
  const hits = s => members.reduce((t, m) => t + (s.values[m.id] || 0), 0);
  const counted = songs.filter(s => s.shown && s.counted);
  const sum = counted.reduce((t, s) => t + hits(s), 0);
  const top = counted.map(s => ({s, h: hits(s)})).filter(x => x.h > 0)
    .sort((a, b) => b.h - a.h || a.s.l.titel.localeCompare(b.s.l.titel, 'de')).slice(0, 3);

  // Kleine Kurven: eine Zeile je Laut, alle in der Familienfarbe und im selben Maßstab.
  // Eigene Breite, weil das Detail eingerückt ist; Achse nach denselben Regeln wie im Hauptdiagramm.
  const n = cols.length, si = cols.findIndex(c => c.key === sel);
  const avail = Math.max(260, box.clientWidth - 36);
  const {size, M} = axisLayout(avail, n);
  const W = Math.max(avail, 300);
  const iwD = W - M.l - M.r;
  const xs = t => n === 1 ? M.l + iwD / 2 : M.l + (t / (n - 1)) * iwD;
  const half = n === 1 ? iwD / 2 : iwD / (n - 1) / 2;
  const rows = members.map(s => ({s, t: cols.reduce((a, c) => a + (c.counts[s.id] || 0), 0)}))
    .sort((a, b) => b.t - a.t || a.s.name.localeCompare(b.s.name, 'de'));
  let max = 0;
  for (const c of cols) for (const s of members) max = Math.max(max, c.counts[s.id] || 0);
  max = max || 1;
  const RH = 44, GAP = 14, TOP = 6;
  const plotBottom = TOP + rows.length * (RH + GAP);
  const H = plotBottom + M.b;
  let svg = '';
  if (si >= 0) {
    const x0 = Math.max(M.l, xs(si) - half), x1 = Math.min(W - M.r, xs(si) + half);
    svg += `<rect class="selband" x="${x0}" y="0" width="${x1 - x0}" height="${plotBottom}"/>`;
  }
  rows.forEach((r, k) => {
    const base = TOP + k * (RH + GAP) + RH;
    const yv = v => base - (v / max) * (RH - 16);
    const fn = SM.monotone(cols.map(c => c.counts[r.s.id] || 0));
    const pts = [];
    if (n === 1) pts.push([xs(0) - 20, yv(fn(0))], [xs(0) + 20, yv(fn(0))]);
    else for (let j = 0; j <= (n - 1) * 16; j++) pts.push([xs(j / 16), yv(fn(j / 16))]);
    svg += `<line class="base" x1="${M.l}" x2="${W - M.r}" y1="${base}" y2="${base}"/>`;
    svg += `<path class="mini" fill="${color(f.slot)}" d="M${pts[0][0].toFixed(1)},${base}L${pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L')}L${pts[pts.length - 1][0].toFixed(1)},${base}Z"/>`;
    svg += `<text class="mlbl" x="${M.l}" y="${base - RH + 10}">${esc(r.s.name)} <tspan class="mtot">${num(r.t)}</tspan></text>`;
    if (si >= 0) {
      const v = cols[si].counts[r.s.id] || 0;
      if (v > 0) svg += `<circle class="dot" cx="${xs(si)}" cy="${yv(v)}" r="4" fill="${color(f.slot)}"/><text class="mval" x="${xs(si) + 8}" y="${yv(v) + 4}">${num(v)}</text>`;
    }
  });
  if (si >= 0) svg += `<line class="selline" x1="${xs(si)}" x2="${xs(si)}" y1="0" y2="${plotBottom}"/>`;
  svg += phaseAxis(cols, xs, plotBottom, si, size);
  svg += hitRects(cols, xs, half, W, 0, H);

  box.innerHTML = `
    <div class="sb-grid">
      <div class="sb-main">
        <div class="sb-head"><span class="sw" style="background:${color(f.slot)}"></span>
          <div><h2 class="sb-name" id="detail-h">${esc(short(f))}</h2><div class="sb-sub">${esc(long(f))}</div></div>
          <button type="button" class="btn small sb-closebtn" id="detail-close">Schließen</button>
        </div>
        ${f.steckbrief ? `<p class="sb-text">${esc(f.steckbrief)}</p>` : ''}
      </div>
      <div class="sb-facts">
        <div class="sb-sum"><b>${sum}</b><span>Schalalas im aktuellen Filter</span></div>
        ${top.length ? `<div><div class="eyebrow">Die meisten Treffer</div><ol class="sb-top3">${top.map(x =>
          `<li><span class="t">${esc(x.s.l.titel)}</span><span class="y">${members.filter(m => x.s.values[m.id] > 0)
            .sort((a, b) => x.s.values[b.id] - x.s.values[a.id]).map(m => `${esc(m.name)} ${x.s.values[m.id]}`).join(' · ')}</span></li>`).join('')}</ol></div>`
          : '<p class="muted">Im aktuellen Filter enthält kein Lied Schalalas dieser Familie.</p>'}
      </div>
    </div>
    <div class="chart-scroll detail-scroll"><svg id="detail-chart" role="group" aria-labelledby="detail-h" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${svg}</svg></div>
    <p class="hint">Jede Zeile ein Schalala dieser Familie, alle im selben Maßstab. Ein Klick auf ein Album wählt es aus.</p>`;
  $('detail-close').addEventListener('click', () => openDetail(f.id));
  bindPhaseKeys($('detail-chart'));
}

/* ---------- Alle Schalalas (Heatmap nach Albumphasen) ---------- */
function renderGrid(cols){
  const box = $('grid');
  if (!cols.length) { box.innerHTML = ''; return; }
  const snds = sounds();
  const sumOf = s => cols.reduce((t, c) => t + (c.counts[s.id] || 0), 0);
  let max = 0;
  for (const c of cols) for (const s of snds) max = Math.max(max, c.counts[s.id] || 0);
  const cell = (v, slot, isSel) => {
    const cls = isSel ? ' class="sel"' : '';
    if (!(v > 0)) return `<td${cls}><span class="z">·</span></td>`;
    const p = Math.round(18 + 62 * Math.sqrt(v / (max || 1)));
    return `<td${cls}><span class="v" style="background:color-mix(in oklab, var(--c${slot}) ${p}%, var(--surface))">${num(v)}</span></td>`;
  };
  let html = `<table class="heat"><thead><tr><th scope="col">Schalala</th>${cols.map(c =>
    `<th scope="col" class="${c.key === sel ? 'sel' : ''}"><button type="button" data-phase="${esc(c.key)}" aria-pressed="${c.key === sel}" title="${esc(c.album.titel)} (${c.year || ''})"><img src="${esc(coverSrc(c.album))}" alt="" width="30" height="30" loading="lazy"><span class="sr">${esc(c.album.titel)} ${c.year || ''}</span></button></th>`).join('')}<th scope="col">Σ</th></tr></thead>`;
  for (const f of fams()) {
    const members = membersOf(f).map(s => ({s, t: sumOf(s)})).sort((a, b) => b.t - a.t || a.s.name.localeCompare(b.s.name, 'de'));
    const ft = members.reduce((t, m) => t + m.t, 0);
    const cls = ['fam', hidden.has(f.id) ? 'off' : '', detail === f.id ? 'open' : ''].filter(Boolean).join(' ');
    html += `<tbody class="${cls}"><tr class="famrow"><th scope="rowgroup" colspan="${cols.length + 1}"><span class="famlabel">
      <span class="sw" style="background:${color(f.slot)}"></span><span class="fn">${esc(short(f))}</span><span class="fs">${esc(long(f))}</span>
      <button type="button" class="lupe small" data-lupe="${esc(f.id)}" aria-expanded="${detail === f.id}" aria-controls="detail" aria-label="Steckbrief ${esc(long(f))} ${detail === f.id ? 'schließen' : 'öffnen'}">${LUPE}</button>
      </span></th><td class="tot">${num(ft)}</td></tr>`;
    for (const {s, t} of members) {
      html += `<tr><th scope="row">${esc(s.name)}</th>${cols.map(c => cell(c.counts[s.id], f.slot, c.key === sel)).join('')}<td class="tot">${t > 0 ? num(t) : '<span class="z">0</span>'}</td></tr>`;
    }
    html += '</tbody>';
  }
  box.innerHTML = html + '</table>';
}
$('grid').addEventListener('click', e => {
  const l = e.target.closest('[data-lupe]'); if (l) { openDetail(l.dataset.lupe); return; }
  const b = e.target.closest('button[data-phase]'); if (b) selectPhase(b.dataset.phase, null);
});

/* ---------- Gewählte Albumphase ---------- */
function countRow(z){
  const ids = new Set(Object.keys(z.werte || {}).filter(k => +z.werte[k] > 0));
  const found = sounds().filter(s => ids.has(s.id)).map(s => `${esc(s.name)} ${SM.value(z, s.id, aufl)}`).join(', ');
  const w = SM.countable(z) ? (found || '<span class="muted">keine Schalalas</span>') : (z.status === 'kein_text_gefunden' ? 'kein Text gefunden' : esc(z.status));
  const src = SM.isHttp(z.quelle_url) ? `<a href="${esc(z.quelle_url)}" target="_blank" rel="noopener">Link</a>` : esc(z.quelle_url || 'keine Angabe');
  return `<tr><td>${esc(SM.GRUND_LABEL[z.grundlage] || z.grundlage)}</td><td>${esc(z.sicherheit || 'keine Angabe')}</td><td style="text-align:left; white-space:normal">${w}</td><td style="text-align:left">${src}</td></tr>`;
}
function renderPeriod(cols){
  const c = cols.find(x => x.key === sel);
  const uc = $('uncounted');
  renderTable(cols);
  if (!c) { $('period-h').textContent = ''; $('period-scope').textContent = ''; $('period-sum').textContent = ''; $('rank').innerHTML = ''; uc.hidden = true; return; }
  const f = detailFam(), rs = rankSounds();
  // Balken: im Detail ein Segment je Laut, sonst eins je eingeblendeter Familie.
  const parts = f ? rs.map(s => ({slot: s.slot, ids: [s.id]})) : visFams().map(x => ({slot: x.slot, ids: membersOf(x).map(s => s.id)}));
  const ordnung = SM.liedOrdnung(data);
  const all = c.counted.map(s => ({s, tot: total(s)})).sort((a, b) => b.tot - a.tot || ordnung(a.s.l, b.s.l));
  const list = all.filter(x => x.tot > 0), silent = all.filter(x => x.tot === 0);
  const sumAll = list.reduce((t, x) => t + x.tot, 0);
  const maxTot = Math.max(1, ...list.map(x => x.tot));
  $('period-h').innerHTML = `<img class="pcover" src="${esc(coverSrc(c.album))}" alt="" width="48" height="48"><span>${esc(c.album.titel)}</span>`;
  $('period-scope').textContent = f ? `nur ${short(f)}` : (hidden.size ? `ohne ${fams().filter(x => hidden.has(x.id)).map(short).join(', ')}` : '');
  $('period-sum').textContent = `Album erschienen ${/^\d{4}$/.test(c.album.datum) ? '' : 'am '}${datum(c.album.datum)}` + (c.songs.length ? ` · ${c.counted.length} von ${c.songs.length} Liedern gezählt · ${sumAll} Schalalas · sortiert nach Anzahl` : '');
  $('rank').innerHTML = list.length ? list.map((x, i) => {
    const s = x.s, b = s.best;
    const segs = parts.map(p => ({slot: p.slot, v: p.ids.reduce((t, id) => t + (s.values[id] || 0), 0)})).filter(g => g.v > 0);
    const found = rs.filter(v => s.values[v.id] > 0);
    const link = SM.isHttp(b.quelle_url) ? `<a href="${esc(b.quelle_url)}" target="_blank" rel="noopener">Quelle</a>` : '';
    const gekuerzt = b.anzahl_aufgeloest && typeof b.anzahl_aufgeloest === 'object' && !aufl;
    // Fanzählungen zählen nur, wenn der Fankonsens auch die angezeigte Zählung ist (Booklet sticht ihn).
    const fz = b.grundlage === 'fankonsens' ? b : null;
    const fanN = id => fz && fz.fan[id] ? `<span class="fanN">aus ${fz.fan[id]}</span>` : '';
    return `<li>
      <span class="pos">${i + 1}</span>
      <span><span class="t">${esc(s.l.titel)}</span> <span class="jahr">${s.year}</span><br><span class="m">${esc(datum(s.l.erstveroeffentlichung))}${s.l.veroeffentlichung ? ' · ' + esc(s.l.veroeffentlichung) : ''}</span></span>
      <span class="viz">
        <span class="bar" style="width:${(x.tot / maxTot) * 100}%">${segs.map(g => `<span style="flex:${g.v};background:${color(g.slot)}"></span>`).join('')}</span>
        <span class="chips">${found.map(v => `<span class="chip"><i style="background:${color(v.slot)}"></i>${esc(v.name)} ${s.values[v.id]}${fanN(v.id)}</span>`).join('')}</span>
      </span>
      <span class="tot">${x.tot}</span>
      <span class="src">
        ${s.typ !== 'original' ? `<span class="badge typ">${SM.TYPE_LABEL[s.typ]}</span>` : ''}
        <span class="badge ${esc(b.sicherheit)}">${esc(b.sicherheit || '?')}</span>
        <span>${esc(SM.GRUND_LABEL[b.grundlage] || b.grundlage)}${b.quelle_art ? ' · ' + esc(b.quelle_art) : ''}</span>
        ${fz ? `<span class="fanTot">aus ${fz.fan_anzahl} ${fz.fan_anzahl === 1 ? 'Fanzählung' : 'Fanzählungen'}${fz.namen.length ? `, gezählt von ${esc(SM.namenListe(fz.namen))}` : ''}</span>` : ''}
        ${link}
        ${gekuerzt ? '<span class="muted">Refrain im Text gekürzt</span>' : ''}
        ${b.notiz ? `<span class="muted">${esc(b.notiz)}</span>` : ''}
        <a class="zaehlmit" href="${zaehlLink(s.l.id)}">Zähl mit</a>
        ${diskLink(s.l.id)}
      </span>
      ${s.all.length > 1 ? `<details><summary>${s.all.length} Zählungen vergleichen</summary><div class="counts"><table><thead><tr><th>Grundlage</th><th>Sicherheit</th><th style="text-align:left">Schalalas</th><th style="text-align:left">Quelle</th></tr></thead><tbody>${s.all.map(countRow).join('')}</tbody></table></div></details>` : ''}
    </li>`;
  }).join('') : `<li class="empty muted">${c.counted.length ? `In den gezählten Liedern dieser Albumphase kommen ${f ? 'keine Schalalas dieser Familie' : 'keine Schalalas'} vor.` : 'In dieser Albumphase gibt es keine gezählten Lieder für diese Auswahl.'}</li>`;
  const rest = c.songs.filter(s => !s.counted);
  const lines = [];
  const titleYear = s => `${esc(s.l.titel)} <span class="muted">${s.year}</span>`;
  if (silent.length) lines.push(`<b>${f ? 'Ohne Schalalas dieser Familie' : 'Ohne Schalalas'}:</b> ` + silent.map(x => `${titleYear(x.s)} <a class="zaehlmit" href="${zaehlLink(x.s.l.id)}">Zähl mit</a> ${diskLink(x.s.l.id)}`).join(' · '));
  if (rest.length) lines.push('<b>Ohne Zählung:</b> ' + rest.map(s =>
    `${titleYear(s)} <span class="muted">(${s.lowConf ? 'unter Sicherheitsschwelle' : s.all.length ? 'kein Text gefunden' : 'noch nicht gezählt'})</span> <a class="zaehlmit" href="${zaehlLink(s.l.id)}">Zähl mit</a> ${diskLink(s.l.id)}`).join(' · '));
  uc.hidden = !lines.length;
  uc.innerHTML = lines.join('<br>');
}
function renderTable(cols){
  const fs = fams();
  $('table').innerHTML = `<table><thead><tr><th>Albumphase</th><th>Jahr</th><th>Gezählt</th>${fs.map(f => `<th>${esc(short(f))}</th>`).join('')}</tr></thead><tbody>${
    cols.map(c => `<tr><td>${esc(c.album.titel)}</td><td>${c.year || ''}</td><td>${c.counted.length}/${c.songs.length}</td>${fs.map(f => `<td>${num(famValue(c.counts, f))}</td>`).join('')}</tr>`).join('')
  }</tbody></table>`;
}

/* ---------- Zuletzt gezählt: die zehn neuesten Fanzählungen ---------- */
// Ohne Verbindung zu Supabase oder ohne Zählungen bleibt der Kasten verborgen. Der Liedtitel führt zur Albumphase.
function renderZuletzt(){
  const box = $('zuletzt');
  const liste = fanZeilen ? SM.zuletztGezaehlt(data, fanZeilen, 10) : [];
  box.hidden = !liste.length;
  if (!liste.length) { box.innerHTML = ''; return; }
  const tag = t => new Date(t).toLocaleDateString('de-DE', {day: 'numeric', month: 'numeric', year: 'numeric'});
  box.innerHTML = `<h2 id="zuletzt-h">Zuletzt gezählt</h2><ol>${liste.map(z => {
    const p = SM.phaseInfo(data, z.lied);
    const ziel = p ? '#' + encodeURIComponent(p.album.id) : zaehlLink(z.lied.id);
    return `<li><a href="${ziel}">${esc(z.lied.titel)}</a>
      <span class="laut">${z.laut ? `<span class="sw" style="background:${color(z.laut.slot)}"></span>${esc(z.laut.name)} <b>${z.anzahl}</b>` : 'keine Schalalas gefunden'}</span>
      <span class="wer">${z.spitzname ? esc(z.spitzname) + ' · ' : ''}<time datetime="${new Date(z.zeit).toISOString()}">${tag(z.zeit)}</time></span></li>`;
  }).join('')}</ol>`;
}
// Ein Klick auf ein Lied wählt dessen Albumphase und springt zur Liste der Lieder.
$('zuletzt').addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (a) setTimeout(() => document.querySelector('.period').scrollIntoView({block: 'start', behavior: reduceMotion() ? 'auto' : 'smooth'}), 60);
});

/* ---------- Gesamtrender ---------- */
function render(){
  const songs = SM.derive(data, {typeOn, minSicher, aufl});
  const cols = SM.phaseCols(data, songs, sounds(), 'sum');
  if (!cols.some(c => c.key === sel)) {
    let best = null, bv = -1;
    cols.forEach(c => { const v = rankSounds().reduce((t, s) => t + c.counts[s.id], 0); if (v > bv) { bv = v; best = c.key; } });
    sel = best;
  }
  hoverIdx = null; $('tip').hidden = true;
  renderStats(songs); renderZaehlMit(songs, cols); renderZuletzt(); renderLegend(songs); renderSkala(); renderChart(cols); renderDetail(cols, songs); renderGrid(cols); renderPeriod(cols);
}

loadData().then(d => {
  data = d;
  readHash();
  render();
  let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(render, 120); });
  window.addEventListener('hashchange', () => { readHash(); render(); });
}).catch(() => {
  $('chart-wrap').innerHTML = '<div class="empty-chart">Die Daten konnten nicht geladen werden. Bitte lade die Seite neu.</div>';
});
})();
