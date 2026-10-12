// fileorigin.mjs <boardRoot> : can jsdom (the version the board's suites use) give a page at a file:// URL localStorage?
// The board's file:// sidecar route needs localStorage.spmtSidecar==='1' and the board keeps all its state there.
// Nothing here loads the board; it only asks jsdom.
import { createRequire } from 'node:module';
const req = createRequire(process.argv[2] + '/package.json');
const { JSDOM } = req('jsdom');
const out = { jsdom: req('jsdom/package.json').version };
for (const url of ['file:///C:/Teams/Board.html', 'https://example.invalid/board.html']) {
  try { const d = new JSDOM('<p>x</p>', { url }); d.window.localStorage.setItem('spmtSidecar', '1');
    out[url] = { origin: d.window.location.origin, ls: d.window.localStorage.getItem('spmtSidecar') }; d.window.close(); }
  catch (e) { out[url] = { error: (e && e.name) + ': ' + String((e && e.message) || e).slice(0, 120) }; }
}
console.log(JSON.stringify(out, null, 1));
