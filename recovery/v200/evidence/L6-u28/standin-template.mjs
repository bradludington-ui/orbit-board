// standin-template.mjs <board.html> <out.html> [scale] -- the board TEMPLATE with the Segoe stand-in declared at the end of
// its <head>, made by the repository's own tools/font-standin.mjs (withStandin; +6% unless a scale is given). For
// layout-fits --board <out.html>, the Windows-margin pass layout-fits has none of its own. Run from the repository root.
// U28 fix round 2 (13 Oct): it wrote over any file, its own input included (the board would have shipped with a
// 'Segoe UI' face in it), and a scale that was not a number gave "+NaN%" and a face drawn at 100%. Now it writes only a
// new file, never <board.html>, and only for a scale from 100 to 150; otherwise it REFUSES (exit 2) and writes nothing.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const lib = resolve('tools/font-standin.mjs');
if (!existsSync(lib)) { console.log(`standin-template: no ${lib}; run this from the repository root`); process.exit(2); }
const { withStandin, STANDIN_SCALE } = await import(pathToFileURL(lib).href);
const [IN, OUT, S] = process.argv.slice(2);
if (!IN || !OUT) { console.log('usage: standin-template.mjs <board.html> <out.html> [scale]'); process.exit(2); }
if (resolve(OUT) === resolve(IN)) { console.log(`standin-template: REFUSED: <out.html> is <board.html> (${resolve(IN)}); nothing written`); process.exit(2); }
const scale = S === undefined ? STANDIN_SCALE : (/^\d+(\.\d+)?$/.test(S) ? +S : NaN);
if (!(scale >= 100 && scale <= 150)) { console.log(`standin-template: REFUSED: the scale "${S}" is not a number from 100 to 150; nothing written`); process.exit(2); }
const html = withStandin(readFileSync(IN, 'utf8'), scale);
try { writeFileSync(OUT, html, { flag: 'wx' }); }   // wx: a new file only -- never over the board, a link or an old template
catch (e) {
  if (e.code !== 'EEXIST') throw e;
  console.log(`standin-template: REFUSED: ${resolve(OUT)} already exists; nothing written over it`); process.exit(2);
}
console.log('stand-in +' + (scale - 100) + '% template written: ' + OUT);
process.exit(0);
