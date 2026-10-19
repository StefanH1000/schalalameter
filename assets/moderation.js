// Werkstatt, Bereich Schalalalogie: Moderation nach Anmeldung über Supabase Auth (E-Mail und Passwort).
// Was erlaubt ist, entscheiden die Policies in der Datenbank (Tabelle moderation); diese Seite zeigt nur an.
(() => {
const {esc} = SM;
const F = window.SchalalaFans;
const $ = id => document.getElementById(id);
const box = $('mod');
if (!box) return;
let lieder = new Map();
fetch('daten/shalalameter-daten.json', {cache: 'no-cache'}).then(r => r.json()).then(d => { lieder = new Map((d.lieder || []).map(l => [l.id, l.titel])); }).catch(() => {});

const zeit = t => new Date(t).toLocaleString('de-DE', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'});
const themaTitel = t => t ? (t.art === 'lied' ? lieder.get(t.lied_id) || t.titel : t.titel) : '?';
const themaLink = t => t ? `schalalalogie.html#${t.art === 'lied' ? 'lied/' + encodeURIComponent(t.lied_id) : 'thema/' + t.id}` : '#';
const status = (txt) => { $('mod-status').textContent = txt || ''; };

function anmeldeformular(meldung) {
  box.innerHTML = `
    <form id="mod-login" class="grid3" autocomplete="on">
      <label>E-Mail<input type="text" name="email" autocomplete="username" required></label>
      <label>Passwort<input type="password" name="pw" autocomplete="current-password" required style="border:1px solid var(--line); background:var(--paper); border-radius:8px; padding:8px 10px; width:100%"></label>
      <div class="actions" style="align-self:end"><button class="btn primary" type="submit">Anmelden</button></div>
    </form>
    <p class="hint">Konten legt die Projektleitung in Supabase an, eine Selbstregistrierung gibt es nicht. ${meldung ? `<b style="color:var(--danger)">${esc(meldung)}</b>` : ''}</p>`;
  $('mod-login').addEventListener('submit', async e => {
    e.preventDefault();
    status('Anmeldung …');
    try { await F.auth.anmelden(e.target.email.value.trim(), e.target.pw.value); status(''); laden(); }
    catch (err) { status(''); anmeldeformular(err.message); }
  });
}

const knopf = (tab, id, feld, an, textAn, textAus) =>
  `<button type="button" class="btn small" data-tab="${tab}" data-id="${id}" data-feld="${feld}" data-wert="${!an}">${an ? textAus : textAn}</button>`;
const gesperrtTag = g => g ? ' <span class="tag" style="color:var(--danger)">gesperrt</span>' : '';

async function laden() {
  const token = await F.auth.token();
  if (!token) return anmeldeformular();
  status('Wird geladen …');
  const opt = {token};
  let ich, meldungen, beitraege, themen, zaehlungen;
  try {
    [ich, meldungen, beitraege, themen, zaehlungen] = await Promise.all([
      F.get('moderation?select=user_id', opt),
      F.get('meldungen?select=id,beitrag_id,grund,erstellt&erledigt=eq.false&order=erstellt.desc&limit=500', opt),
      F.get('beitraege?select=id,thema_id,text,spitzname,erstellt,gesperrt&order=erstellt.desc&limit=100', opt),
      F.get('themen?select=id,art,lied_id,titel,spitzname,erstellt,letzte_aktivitaet,endet,geschlossen,gesperrt&order=letzte_aktivitaet.desc&limit=300', opt),
      F.get('fan_zaehlungen?select=id,lied_id,laut_id,vorschlag,anzahl,spitzname,grundlage,aktualisiert,gesperrt,name_ausgeblendet&order=aktualisiert.desc&limit=200', opt),
    ]);
  } catch (e) {
    status('');
    if (e.status === 401) { F.auth.merken(null); return anmeldeformular('Die Anmeldung ist abgelaufen.'); }
    box.innerHTML = `<p class="status">${esc(e.message)}</p><div class="actions"><button class="btn" type="button" id="mod-neu">Neu laden</button></div>`;
    $('mod-neu').addEventListener('click', laden);
    return;
  }
  const s = F.auth.sitzung() || {};
  const kopf = `<div class="actions" style="justify-content:space-between; margin-bottom:10px"><span class="status">Angemeldet als ${esc(s.email || '?')}</span>
    <span class="actions"><button class="btn small" type="button" id="mod-neu">Neu laden</button><button class="btn small" type="button" id="mod-ab">Abmelden</button></span></div>`;
  if (!ich.length) {
    box.innerHTML = kopf + '<p>Dieses Konto darf nicht moderieren. Die Nutzer-ID muss in der Tabelle <code>moderation</code> stehen (siehe Übergabe).</p>';
    return verdrahten();
  }
  const themaVon = new Map(themen.map(t => [t.id, t]));
  // Gemeldete Beiträge: die Beiträge dazu fehlen evtl. in den neuesten 100, deshalb gezielt nachladen.
  const gemeldetIds = [...new Set(meldungen.map(m => m.beitrag_id))];
  const fehlend = gemeldetIds.filter(id => !beitraege.some(b => b.id === id));
  if (fehlend.length) beitraege = beitraege.concat(await F.get(`beitraege?select=id,thema_id,text,spitzname,erstellt,gesperrt&id=in.(${fehlend.join(',')})`, opt).catch(() => []));
  const beitragVon = new Map(beitraege.map(b => [b.id, b]));

  const beitragZeile = (b, extra) => {
    const t = themaVon.get(b.thema_id);
    return `<li><span><b>${esc(b.spitzname)}</b> <span class="ct">${esc(zeit(b.erstellt))} · <a href="${themaLink(t)}" target="_blank" rel="noopener">${esc(themaTitel(t))}</a></span>${gesperrtTag(b.gesperrt)}
      <div style="white-space:pre-wrap; overflow-wrap:anywhere; font-size:14px; margin-top:4px">${SM.textMitLinks(b.text)}</div>${extra || ''}</span>
      <span class="act">${knopf('beitraege', b.id, 'gesperrt', b.gesperrt, 'Sperren', 'Freigeben')}</span></li>`;
  };

  const pruef = gemeldetIds.map(id => {
    const b = beitragVon.get(id); if (!b) return '';
    const ms = meldungen.filter(m => m.beitrag_id === id);
    const gruende = ms.map(m => m.grund).filter(Boolean);
    return beitragZeile(b, `<div class="ct" style="margin-top:4px; color:var(--danger)">${ms.length}× gemeldet${gruende.length ? ': ' + gruende.map(esc).join(' · ') : ''}</div>`)
      .replace('<span class="act">', `<span class="act"><button type="button" class="btn small" data-erledigt="${id}">Erledigt</button>`);
  }).join('');

  // Aufgeklappte Bereiche bleiben nach einer Aktion offen.
  const offen = [...box.querySelectorAll('details')].map(d => d.open);
  box.innerHTML = kopf + `
    <h3 style="font-size:15px; margin:6px 0 4px">Prüfliste: gemeldete Beiträge (${gemeldetIds.length})</h3>
    <p class="hint" style="margin:0 0 6px">Sperren blendet den Beitrag öffentlich aus. „Erledigt“ nimmt ihn von der Liste, ohne ihn zu sperren.</p>
    <ul class="cands">${pruef || '<li class="empty muted">Nichts gemeldet.</li>'}</ul>
    <details style="margin-top:16px"><summary style="cursor:pointer; font-weight:600">Neueste Beiträge (${Math.min(beitraege.length, 100)})</summary>
      <ul class="cands">${beitraege.slice(0, 100).map(b => beitragZeile(b)).join('') || '<li class="empty muted">Noch keine Beiträge.</li>'}</ul></details>
    <details style="margin-top:10px"><summary style="cursor:pointer; font-weight:600">Themen und Abstimmungen (${themen.length})</summary>
      <ul class="cands">${themen.map(t => `<li><span><span class="tag" style="margin:0 6px 0 0">${t.art}</span><a href="${themaLink(t)}" target="_blank" rel="noopener">${esc(themaTitel(t))}</a>${gesperrtTag(t.gesperrt)}${(t.art === 'abstimmung' || t.art === 'familie') && t.geschlossen ? ' <span class="tag">geschlossen</span>' : ''}<br>
        <span class="ct">von ${esc(t.spitzname)} · ${esc(zeit(t.erstellt))}${t.endet ? ' · läuft bis ' + esc(zeit(t.endet)) : ''}</span></span>
        <span class="act">${t.art === 'abstimmung' || t.art === 'familie' ? knopf('themen', t.id, 'geschlossen', t.geschlossen, 'Schließen', 'Wieder öffnen') : ''}${knopf('themen', t.id, 'gesperrt', t.gesperrt, 'Sperren', 'Freigeben')}</span></li>`).join('') || '<li class="empty muted">Noch keine Themen.</li>'}</ul></details>
    <details style="margin-top:10px"><summary style="cursor:pointer; font-weight:600">Fanzählungen (neueste ${zaehlungen.length})</summary>
      <ul class="cands">${zaehlungen.map(z => `<li><span><b>${esc(lieder.get(z.lied_id) || z.lied_id)}</b> · ${z.laut_id ? esc(z.laut_id) : `Vorschlag „${esc(z.vorschlag)}“`} · ${z.anzahl}×${gesperrtTag(z.gesperrt)}<br>
        <span class="ct">${esc(z.spitzname)}${z.name_ausgeblendet ? ' (Name ausgeblendet)' : ''} · ${z.grundlage === 'booklet' ? 'Booklet' : 'Gehör'} · ${esc(zeit(z.aktualisiert))}</span></span>
        <span class="act">${knopf('fan_zaehlungen', z.id, 'name_ausgeblendet', z.name_ausgeblendet, 'Name ausblenden', 'Name zeigen')}${knopf('fan_zaehlungen', z.id, 'gesperrt', z.gesperrt, 'Sperren', 'Freigeben')}</span></li>`).join('') || '<li class="empty muted">Noch keine Zählungen.</li>'}</ul></details>`;
  box.querySelectorAll('details').forEach((d, i) => { d.open = !!offen[i]; });
  status('');
  verdrahten();
}

function verdrahten() {
  $('mod-neu') && $('mod-neu').addEventListener('click', laden);
  $('mod-ab') && $('mod-ab').addEventListener('click', async () => { await F.auth.abmelden(); anmeldeformular(); });
  box.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', async () => {
    b.disabled = true;
    try {
      await F.patch(`${b.dataset.tab}?id=eq.${b.dataset.id}`, {[b.dataset.feld]: b.dataset.wert === 'true'}, await F.auth.token());
      laden();
    } catch (e) { b.disabled = false; status(e.message); }
  }));
  box.querySelectorAll('[data-erledigt]').forEach(b => b.addEventListener('click', async () => {
    b.disabled = true;
    try { await F.patch(`meldungen?beitrag_id=eq.${b.dataset.erledigt}&erledigt=eq.false`, {erledigt: true}, await F.auth.token()); laden(); }
    catch (e) { b.disabled = false; status(e.message); }
  }));
}

if (!F || !F.ready()) box.innerHTML = '<p class="muted">Supabase ist noch nicht eingerichtet (assets/supabase-config.js).</p>';
else laden();
})();
