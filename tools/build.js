// Baut den Ordner dist/ für Cloudflare: nur die Seiten, assets/, daten/, _headers und favicon.ico.
// docs/, supabase/, tools/, tests/ und README bleiben draußen, damit sie bei privatem Repository nicht öffentlich werden.
// npm run build
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const SEITEN = ['index.html', 'zaehlen.html', 'schalalalogie.html', 'werkstatt.html', 'impressum.html', 'datenschutz.html'];
const ORDNER = ['assets', 'daten'];

fs.rmSync(DIST, {recursive: true, force: true});
fs.mkdirSync(DIST);
for (const f of [...SEITEN, '_headers', 'favicon.ico']) fs.copyFileSync(path.join(ROOT, f), path.join(DIST, f));
for (const d of ORDNER) fs.cpSync(path.join(ROOT, d), path.join(DIST, d), {recursive: true, filter: q => !path.basename(q).startsWith('.')});

let n = 0, bytes = 0;
(function zaehle(d) {
  for (const e of fs.readdirSync(d, {withFileTypes: true})) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) zaehle(p); else { n++; bytes += fs.statSync(p).size; }
  }
})(DIST);
console.log(`dist/: ${n} Dateien, ${(bytes / 1024).toFixed(0)} KB`);
