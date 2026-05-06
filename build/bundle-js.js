/**
 * build/bundle-js.js
 * Concatenates all JS source files into dist/main.js in the correct load order.
 *
 * Order matters because the source files use IIFE pattern (not ES modules):
 *   1. core utilities (i18n)
 *   2. components (navbar, drawer)
 *   3. page sections (hero, about, jcd-slider, news, awards)
 *
 * To add a new file, just append it to FILES below.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'js');
const OUT_DIR = path.join(ROOT, 'dist');
const OUT_FILE = path.join(OUT_DIR, 'main.js');

// Load order — explicit to avoid surprises.
const FILES = [
  'i18n.js',
  'components/navbar.js',
  'components/drawer.js',
  'sections/hero.js',
  'sections/about.js',
  'sections/jcd-slider.js',
  'sections/news.js',
  'sections/awards.js',
  'sections/register-interest.js',
];

function bundle() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const banner =
    '/*! JCDC main.js — bundled ' + new Date().toISOString() + ' */\n';
  const parts = [banner];

  for (const rel of FILES) {
    const abs = path.join(SRC, rel);
    if (!fs.existsSync(abs)) {
      console.warn('[bundle-js] Skipping missing file:', rel);
      continue;
    }
    const code = fs.readFileSync(abs, 'utf8');
    parts.push('\n/* ===== ' + rel + ' ===== */\n');
    parts.push(code);
    if (!code.endsWith('\n')) parts.push('\n');
  }

  fs.writeFileSync(OUT_FILE, parts.join(''), 'utf8');
  const sizeKb = (fs.statSync(OUT_FILE).size / 1024).toFixed(2);
  console.log('[bundle-js] Wrote ' + OUT_FILE + ' (' + sizeKb + ' KB)');
}

bundle();
