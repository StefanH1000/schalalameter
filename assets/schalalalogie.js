// Schalalalogie: Fachschaftsforum zum Haarespalten und Jauchzen.
// Ansichten über die Adresse: #  (Themenliste), #neu, #thema/<id>, #lied/<lied-id> (Liedthema, entsteht beim ersten Beitrag).
// Beitragstexte werden nie als HTML ausgegeben, nur über SM.textMitLinks (maskiert, Links mit rel="nofollow ugc noopener").
(() => {
const {esc} = SM;
const F = SchalalaFans, api = F.forum;
const $ = id => document.getElementById(id);
const main = $('ansicht');
let lieder = new Map();       // Lied-ID → Lied aus der Datendatei (Titel, Jahr, Veröffentlichung)
let daten = null;             // die ganze Datendatei, für Albumphasen und Reihenfolge
let filter = 'alle';

const REGELN = 'Bleib freundlich, auch wenn jemand anders gezählt hat. Poste keine kompletten Liedtexte, ein, zwei Zeilen als Zitat reichen. Respektiere das Fortuna-Team und alle anderen Fans.';
const ART = {lied: 'Lied', frei: 'Thema', abstimmung: 'Abstimmung'};

const zeit = t => new Date(t).toLocaleString('de-DE', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'});
const tag = t => new Date(t).toLocaleDateString('de-DE', {day: 'numeric', month: 'long', year: 'numeric'});
const plural = (n, eins, viele) => `${n} ${n === 1 ? eins : viele}`;
const liedTitel = (id, ersatz) => (lieder.get(id) || {}).titel || ersatz || id;

function stoerung(text, nochmal) {
  main.innerHTML = `<div class="stoerung"><span>${esc(text || 'Die Schalalalogie ist gerade nicht erreichbar. Bitte versuch es später noch einmal.')}</span><button type="button" class="knopf hell" id="nochmal">Noch einmal versuchen</button></div>`;
  $('nochmal').addEventListener('click', nochmal || route);
}

/* ---------- Themenliste ---------- */
async function zeigeListe() {
  main.innerHTML = '<p class="muted">Wird geladen …</p>';
  let themen;
  try { themen = await api.themen(); } catch (e) { return stoerung(); }
  const zeig = themen.filter(t => filter === 'alle' || t.art === filter);
  const pills = [['alle', 'Alle'], ['lied', 'Lieder'], ['frei', 'Freie Themen'], ['abstimmung', 'Abstimmungen']]
    .map(([k, l]) => `<button type="button" class="pill" data-f="${k}" aria-pressed="${filter === k}">${l}</button>`).join('');
  main.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:16px">
      <div class="leiste"><div class="filter" role="group" aria-label="Themen filtern">${pills}</div><a class="knopf" href="#neu">Neues Thema</a></div>
      ${zeig.length ? `<ul class="themen">${zeig.map(t => `<li><a href="${t.art === 'lied' ? '#lied/' + encodeURIComponent(t.lied_id) : '#thema/' + t.id}">
        <span><span class="art">${ART[t.art]}</span><b>${esc(t.art === 'lied' ? liedTitel(t.lied_id, t.titel) : t.titel)}</b><br>
          <small>von ${esc(t.spitzname)} · ${esc(zeit(t.erstellt))}</small></span>
        <span class="zahl">${plural(+t.beitraege, 'Beitrag', 'Beiträge')}${t.art === 'abstimmung' ? `<br>${plural(+t.stimmen, 'Stimme', 'Stimmen')} · ${t.geschlossen ? 'geschlossen' : 'offen'}` : ''}<br>zuletzt ${esc(zeit(t.letzte_aktivitaet))}</span>
      </a></li>`).join('')}</ul>`
      : `<div class="leer">${themen.length ? 'In dieser Auswahl gibt es noch nichts.' : 'Noch ist es still in der Fachschaft.'} <a href="#neu">Fang ein Thema an.</a></div>`}
    </div>`;
  main.querySelectorAll('[data-f]').forEach(b => b.addEventListener('click', () => { filter = b.dataset.f; zeigeListe(); }));
}

/* ---------- Formularteile ---------- */
function absenderFelder() {
  return `
    <label class="feld">Dein Spitzname
      <input type="text" name="name" maxlength="40" required value="${esc(F.spitzname())}">
      <small>Derselbe wie beim Zählen. Er steht öffentlich an deinen Beiträgen, bitte keinen echten Namen.</small>
    </label>
    <div class="hp" aria-hidden="true"><label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>`;
}
function textFeld(label, pflicht) {
  return `<label class="feld">${label}
      <textarea name="text" maxlength="2000" ${pflicht ? 'required' : ''}></textarea>
      <span class="zeichen" data-zeichen>0 von 2.000 Zeichen</span>
    </label>`;
}
function zeichenZaehler(form) {
  const ta = form.querySelector('textarea[name="text"]'), z = form.querySelector('[data-zeichen]');
  if (ta && z) ta.addEventListener('input', () => { z.textContent = `${ta.value.length.toLocaleString('de-DE')} von 2.000 Zeichen`; });
}
// Prüft Spitzname und Text im Browser; gibt {name} zurück oder setzt die Fehlermeldung.
function absender(form) {
  const name = form.elements.name.value.trim();
  if (!name) { meldeFehler(form, 'Bitte gib einen Spitznamen an.'); form.elements.name.focus(); return null; }
  F.spitzname(name);
  return {name, bot: !!form.elements.website.value};
}
function meldeFehler(form, text) {
  const f = form.querySelector('.fehler');
  f.textContent = text; f.hidden = !text;
}
async function senden(form, fn) {
  const knopf = form.querySelector('button[type="submit"]');
  meldeFehler(form, '');
  knopf.disabled = true;
  try { return await fn(); }
  catch (e) { meldeFehler(form, e.message); return null; }
  finally { knopf.disabled = false; }
}

/* ---------- Neues Thema ---------- */
function zeigeNeu(vorLied) {
  // Nach Albumphase gruppiert, darin in Trackreihenfolge (SM.liedOrdnung); ohne Datendatei alphabetisch.
  const option = l => `<option value="${esc(l.id)}"${l.id === vorLied ? ' selected' : ''}>${esc(l.titel)} (${esc(String(l.erstveroeffentlichung || '').slice(0, 4))})</option>`;
  let optionen;
  if (daten) {
    const gruppen = new Map();
    for (const l of [...lieder.values()].sort(SM.liedOrdnung(daten))) {
      const p = SM.phaseInfo(daten, l), titel = p ? p.album.titel : 'Weitere Lieder';
      (gruppen.get(titel) || gruppen.set(titel, []).get(titel)).push(l);
    }
    optionen = [...gruppen].map(([t, ls]) => `<optgroup label="${esc(t)}">${ls.map(option).join('')}</optgroup>`).join('');
  } else {
    optionen = [...lieder.values()].sort((a, b) => a.titel.localeCompare(b.titel, 'de')).map(option).join('');
  }
  main.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:14px">
      <a class="zurueck" href="#">← Alle Themen</a>
      <form class="formular" id="neu" novalidate>
        <h3>Neues Thema</h3>
        <p class="regeln">${esc(REGELN)}</p>
        <div class="segment" role="radiogroup" aria-label="Art des Themas">
          <label><input type="radio" name="art" value="frei" ${vorLied ? '' : 'checked'}> Freies Thema</label>
          <label><input type="radio" name="art" value="abstimmung"> Abstimmung</label>
          <label><input type="radio" name="art" value="lied" ${vorLied ? 'checked' : ''}> Zu einem Lied</label>
        </div>
        <div data-nur="lied"><label class="feld">Lied<select name="lied">${optionen}</select><small>Jedes Lied hat ein Thema. Gibt es schon eins, landet dein Beitrag dort.</small></label></div>
        <div data-nur="frei abstimmung"><label class="feld"><span data-titel>Titel</span><input type="text" name="titel" maxlength="140"></label></div>
        <div data-nur="abstimmung" class="feld">Antworten
          <div class="antwortfelder" id="antworten"></div>
          <button type="button" class="knopf hell" id="mehr" style="align-self:flex-start">Antwort hinzufügen</button>
          <small>2 bis 6 Antworten.</small>
        </div>
        <div data-nur="abstimmung"><label class="feld">Läuft bis (freiwillig)<input type="date" name="endet"><small>Ohne Datum bleibt die Abstimmung offen, bis die Moderation sie schließt.</small></label></div>
        <div data-text></div>
        ${absenderFelder()}
        <p class="fehler" role="alert" hidden></p>
        <button type="submit" class="knopf">Thema anlegen</button>
      </form>
    </div>`;
  const form = $('neu');
  const antw = $('antworten');
  const neueAntwort = () => {
    if (antw.children.length >= 6) return;
    antw.insertAdjacentHTML('beforeend', `<input type="text" name="antwort" maxlength="100" aria-label="Antwort ${antw.children.length + 1}">`);
    $('mehr').hidden = antw.children.length >= 6;
  };
  neueAntwort(); neueAntwort();
  $('mehr').addEventListener('click', () => { neueAntwort(); antw.lastElementChild.focus(); });
  const umschalten = () => {
    const art = form.elements.art.value;
    form.querySelectorAll('[data-nur]').forEach(el => { el.hidden = !el.dataset.nur.split(' ').includes(art); });
    form.querySelector('[data-titel]').textContent = art === 'abstimmung' ? 'Frage' : 'Titel';
    const alt = form.elements.text ? form.elements.text.value : '';
    form.querySelector('[data-text]').innerHTML = textFeld(art === 'abstimmung' ? 'Erläuterung (freiwillig)' : 'Dein Beitrag', art !== 'abstimmung');
    form.elements.text.value = alt;
    zeichenZaehler(form);
  };
  form.querySelectorAll('input[name="art"]').forEach(r => r.addEventListener('change', umschalten));
  umschalten();

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const ab = absender(form); if (!ab) return;
    const art = form.elements.art.value, text = form.elements.text.value.trim(), titel = form.elements.titel.value.trim();
    const antworten = [...form.querySelectorAll('input[name="antwort"]')].map(i => i.value.trim()).filter(Boolean);
    if (art !== 'abstimmung' && !text) return meldeFehler(form, 'Bitte schreib einen Beitrag.');
    if (art !== 'lied' && !titel) return meldeFehler(form, art === 'abstimmung' ? 'Bitte stell eine Frage.' : 'Bitte gib einen Titel an.');
    if (art === 'abstimmung' && antworten.length < 2) return meldeFehler(form, 'Eine Abstimmung braucht mindestens 2 Antworten.');
    const lied = form.elements.lied.value;
    const datum = form.elements.endet.value;
    if (ab.bot) { location.hash = '#'; return; }
    const r = await senden(form, () => api.themaAnlegen({
      art, titel: art === 'lied' ? liedTitel(lied) : titel, text, lied_id: art === 'lied' ? lied : null,
      antworten: art === 'abstimmung' ? antworten : null,
      endet: art === 'abstimmung' && datum ? new Date(datum + 'T23:59:59').toISOString() : null,
      spitzname: ab.name, geraet_id: F.geraetId(),
    }));
    if (r) location.hash = art === 'lied' ? '#lied/' + encodeURIComponent(lied) : '#thema/' + r.thema_id;
  });
}

/* ---------- Thema ---------- */
async function zeigeThema(id, liedId, neuerBeitrag) {
  if (!neuerBeitrag) main.innerHTML = '<p class="muted">Wird geladen …</p>';
  let thema, beitraege = [], antworten = [];
  try {
    thema = liedId ? await api.liedthema(liedId) : await api.thema(id);
    if (thema) [beitraege, antworten] = await Promise.all([api.beitraege(thema.id), thema.art === 'abstimmung' ? api.antworten(thema.id) : []]);
  } catch (e) { return stoerung(null, () => zeigeThema(id, liedId)); }
  if (!thema && !liedId) {
    main.innerHTML = '<div style="display:flex; flex-direction:column; gap:14px"><a class="zurueck" href="#">← Alle Themen</a><div class="leer">Dieses Thema gibt es nicht (mehr).</div></div>';
    return;
  }
  const l = liedId ? lieder.get(liedId) : thema && thema.lied_id ? lieder.get(thema.lied_id) : null;
  if (liedId && !l) {
    main.innerHTML = '<div style="display:flex; flex-direction:column; gap:14px"><a class="zurueck" href="#">← Alle Themen</a><div class="leer">Dieses Lied kennt das Schalalameter nicht.</div></div>';
    return;
  }
  const titel = l ? l.titel : thema.titel;
  const offen = thema && thema.art === 'abstimmung' && !thema.geschlossen;
  const meta = [];
  if (l) meta.push(`${esc(String(l.erstveroeffentlichung || '').slice(0, 4))}${l.veroeffentlichung ? ' · ' + esc(l.veroeffentlichung) : ''}`);
  if (thema && thema.art !== 'lied') meta.push(`angelegt von ${esc(thema.spitzname)} · ${esc(zeit(thema.erstellt))}`);
  if (thema && thema.art === 'abstimmung') meta.push(thema.geschlossen ? 'Abstimmung geschlossen' : thema.endet ? `läuft bis ${esc(tag(thema.endet))}` : 'Abstimmung offen');
  if (l) meta.push(`<a href="zaehlen.html?lied=${encodeURIComponent(l.id)}">Dieses Lied zählen</a>`);

  const meine = thema ? F.store('schalala-stimme-' + thema.id) : null;
  const summe = antworten.reduce((t, a) => t + +a.stimmen, 0);
  const umfrage = thema && thema.art === 'abstimmung' ? `
    <div class="umfrage" role="group" aria-label="Antworten">
      ${antworten.map(a => {
        const p = summe ? Math.round(+a.stimmen / summe * 100) : 0;
        return `<button type="button" data-antwort="${a.id}" ${offen ? '' : 'disabled'} class="${String(a.id) === meine ? 'meine' : ''}" aria-pressed="${String(a.id) === meine}">
          <span class="balken" style="width:${p}%"></span><span>${esc(a.text)}</span><span class="n">${a.stimmen} · ${p} %</span></button>`;
      }).join('')}
      <small class="muted">${plural(summe, 'Stimme', 'Stimmen')}. ${offen ? (meine ? 'Du kannst deine Stimme ändern, solange die Abstimmung offen ist.' : 'Tipp auf eine Antwort, um abzustimmen.') : ''}</small>
      <p class="fehler" id="stimm-fehler" role="alert" hidden></p>
    </div>` : '';

  main.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:16px">
      <a class="zurueck" href="#">← Alle Themen</a>
      <div class="thema-kopf"><span class="art">${ART[thema ? thema.art : 'lied']}</span><h2>${esc(titel)}</h2><div class="meta">${meta.map(m => `<span>${m}</span>`).join('')}</div></div>
      ${umfrage}
      <div class="leiste"><h3 style="font-size:17px">${plural(beitraege.length, 'Beitrag', 'Beiträge')}</h3><button type="button" class="knopf hell" id="neuladen">Neu laden</button></div>
      <div class="beitraege">${beitraege.length ? beitraege.map(b => `
        <article class="beitrag${String(b.id) === String(neuerBeitrag) ? ' neu' : ''}" id="b-${b.id}">
          <header><b>${esc(b.spitzname)}</b><time datetime="${esc(b.erstellt)}">${esc(zeit(b.erstellt))}</time></header>
          <div class="btext">${SM.textMitLinks(b.text)}</div>
          <footer><button type="button" class="melden" data-melden="${b.id}">Melden</button></footer>
        </article>`).join('') : `<div class="leer">${l ? 'Zu diesem Lied gibt es noch keine Beiträge. Schreib den ersten.' : 'Noch keine Beiträge.'}</div>`}</div>
      <form class="formular" id="antwort" novalidate>
        <h3>${l && !thema ? 'Erster Beitrag zu diesem Lied' : 'Mitreden'}</h3>
        <p class="regeln">${esc(REGELN)}</p>
        ${textFeld('Dein Beitrag', true)}
        ${absenderFelder()}
        <p class="fehler" role="alert" hidden></p>
        <button type="submit" class="knopf">Absenden</button>
      </form>
    </div>`;

  $('neuladen').addEventListener('click', () => zeigeThema(id, liedId));
  main.querySelectorAll('[data-antwort]').forEach(b => b.addEventListener('click', async () => {
    const fe = $('stimm-fehler');
    try {
      await api.abstimmen({thema_id: thema.id, antwort_id: +b.dataset.antwort, geraet_id: F.geraetId()});
      F.store('schalala-stimme-' + thema.id, b.dataset.antwort);
      zeigeThema(id, liedId, 'stimme');
    } catch (e) { fe.textContent = e.message; fe.hidden = false; }
  }));
  // Melden in zwei Schritten, damit niemand aus Versehen meldet. Der Beitrag bleibt sichtbar.
  main.querySelectorAll('[data-melden]').forEach(b => b.addEventListener('click', async () => {
    if (!b.classList.contains('frage')) { b.classList.add('frage'); b.textContent = 'Wirklich melden? Noch einmal tippen'; return; }
    b.disabled = true;
    try {
      await api.melden({beitrag_id: +b.dataset.melden, geraet_id: F.geraetId()});
      b.classList.remove('frage'); b.textContent = 'Gemeldet. Danke, die Moderation schaut es sich an.';
    } catch (e) { b.disabled = false; b.textContent = e.message; }
  }));

  const form = $('antwort');
  zeichenZaehler(form);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const ab = absender(form); if (!ab) return;
    const text = form.elements.text.value.trim();
    if (!text) return meldeFehler(form, 'Bitte schreib etwas.');
    if (ab.bot) { form.reset(); return; }
    const r = await senden(form, () => thema
      ? api.beitragSchreiben({thema_id: thema.id, text, spitzname: ab.name, geraet_id: F.geraetId()})
      : api.themaAnlegen({art: 'lied', titel: l.titel, text, lied_id: l.id, spitzname: ab.name, geraet_id: F.geraetId()}));
    if (!r) return;
    await zeigeThema(id, liedId, r.beitrag_id);
    const neu = $('b-' + r.beitrag_id);
    if (neu) neu.scrollIntoView({block: 'center'});
  });
}

/* ---------- Adresse ---------- */
function route() {
  const [teil, wert] = location.hash.slice(1).split('/').map(s => decodeURIComponent(s || ''));
  window.scrollTo(0, 0);
  if (!F.ready()) return stoerung('Die Schalalalogie ist noch nicht freigeschaltet.');
  if (teil === 'neu') return zeigeNeu(wert || null);
  if (teil === 'thema' && /^\d+$/.test(wert)) return zeigeThema(+wert, null);
  if (teil === 'lied' && wert) return zeigeThema(null, wert);
  return zeigeListe();
}

(async () => {
  try {
    const res = await fetch('daten/shalalameter-daten.json', {cache: 'no-cache'});
    const d = SM.normalize(await res.json());
    lieder = new Map(d.lieder.map(l => [l.id, l]));
    daten = d;
  } catch (e) { /* ohne Datendatei zeigen Liedthemen ihren gespeicherten Titel */ }
  window.addEventListener('hashchange', route);
  route();
})();
})();
