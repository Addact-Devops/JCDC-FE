/**
 * build/watch-js.js
 * Watches src/js for changes and re-runs the bundler. No external deps —
 * uses fs.watch which is good enough for a small project.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'js');
const BUNDLER = path.join(__dirname, 'bundle-js.js');

let timer = null;
function rebuild() {
  clearTimeout(timer);
  // Debounce — editors often fire multiple events per save.
  timer = setTimeout(() => {
    console.log('[watch-js] Change detected, rebuilding…');
    const r = spawnSync(process.execPath, [BUNDLER], { stdio: 'inherit' });
    if (r.status !== 0) console.error('[watch-js] Bundle failed.');
  }, 80);
}

console.log('[watch-js] Watching ' + SRC);
rebuild(); // initial build

fs.watch(SRC, { recursive: true }, (_event, filename) => {
  if (!filename) return;
  if (!filename.endsWith('.js')) return;
  rebuild();
});
