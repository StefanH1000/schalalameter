// Setzt an CSS- und JS-Verweisen eine neue Versionsnummer (?v=…), damit Browser nach einem Update
// nicht mit alten Dateien aus dem Cache weiterarbeiten. Vor jedem Push ausführen: npm run cachebust
const fs = require('fs');
const path = require('path');

const v = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
for (const f of ['index.html', 'werkstatt.html', 'impressum.html', 'datenschutz.html', 'zaehlen.html', 'schalalalogie.html']) {
  const file = path.join(__dirname, '..', f);
  const before = fs.readFileSync(file, 'utf8');
  const after = before.replace(/(href|src)="(assets\/[^"?]+\.(?:css|js))(?:\?v=[^"]*)?"/g, `$1="$2?v=${v}"`);
  if (after !== before) fs.writeFileSync(file, after);
}
console.log('Version ' + v);
