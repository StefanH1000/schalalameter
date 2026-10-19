// Lokaler Testserver: node tools/serve.js  ->  http://localhost:8080
// Nur für den eigenen Rechner: lauscht ausschließlich auf 127.0.0.1, liefert keine versteckten Dateien
// und Ordner (.git, .claude …) und nichts außerhalb des Projektordners aus.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = +process.env.PORT || 8080;
const TYPES = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon'};

http.createServer((req, res) => {
  const nein = code => { res.writeHead(code); res.end(code === 404 ? 'Nicht gefunden' : ''); };
  let p;
  try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { return nein(400); }
  if (p.endsWith('/')) p += 'index.html';
  const file = path.resolve(ROOT, '.' + p);
  const rel = path.relative(ROOT, file);
  // Echte Verzeichnisgrenze statt startsWith: „../shalalameter-nebenan“ fällt hier heraus.
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return nein(403);
  if (rel.split(path.sep).some(teil => teil.startsWith('.') || teil === 'node_modules')) return nein(404);
  fs.readFile(file, (err, buf) => {
    if (err) return nein(404);
    res.writeHead(200, {'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream'});
    res.end(buf);
  });
}).listen(PORT, '127.0.0.1', () => console.log(`Schalalameter läuft auf http://localhost:${PORT}`));
