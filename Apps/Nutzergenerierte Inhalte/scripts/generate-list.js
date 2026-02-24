/**
 * Generiert list.json aus dem Ordner Media/360/Fotos (inkl. Unterordner).
 * Ausführen: node scripts/generate-list.js
 * Die list.json wird in Media/360/Fotos/list.json geschrieben.
 */

const fs = require('fs');
const path = require('path');

const FOTOS_DIR = path.join(__dirname, '..', 'Media', '360', 'Fotos');
const LIST_FILE = path.join(FOTOS_DIR, 'list.json');
const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

if (!fs.existsSync(FOTOS_DIR)) {
  fs.mkdirSync(FOTOS_DIR, { recursive: true });
  console.log('Ordner erstellt:', FOTOS_DIR);
}

function scanDir(dir, relativePath = '') {
  const folders = {};
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = entries
    .filter(e => e.isFile() && IMAGE_EXT.includes(path.extname(e.name).toLowerCase()))
    .map(e => e.name)
    .sort();
  if (files.length) {
    folders[relativePath] = files;
  }
  for (const e of entries) {
    if (!e.isDirectory() || e.name === '.' || e.name === '..') continue;
    const subDir = path.join(dir, e.name);
    const subRel = relativePath ? relativePath + '/' + e.name : e.name;
    Object.assign(folders, scanDir(subDir, subRel));
  }
  return folders;
}

const folders = scanDir(FOTOS_DIR);
const total = Object.values(folders).reduce((n, arr) => n + arr.length, 0);
const list = { folders, updated: new Date().toISOString() };
fs.writeFileSync(LIST_FILE, JSON.stringify(list, null, 2), 'utf8');
console.log('list.json erstellt mit', Object.keys(folders).length, 'Ordner(n) und', total, 'Bild(ern):', LIST_FILE);
