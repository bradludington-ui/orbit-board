// The slide pictures (CONTRACT §10), in Chromium, from the synthetic fixture's every block. Each PNG is decoded again and
// read pixel by pixel, never trusted from the drawing code's own idea of where it drew.
//
// What it holds the pictures to:
//   - every block's PNG is 2000 x 675 and not blank: it carries the title bar's navy, the header's gold and the status
//     colours, and a fair share of the canvas is drawn on;
//   - the CUI marking is drawn at the top and at the bottom: the same text in both bands, centred, nothing else there;
//   - the table never overflows: everything drawn between the bands lies inside the region, with the table's right
//     border whole, for the fixture's widest block and for a block made far wider and taller on purpose;
//   - a picture made with switches off says what it shows;
//   - SP.allPicturesZip opens with Python's zipfile, holds '{Ap} FY{fy}.png' for every block, and each is a 2000 x 675 PNG;
//   - Copy picture puts the PNG on the clipboard where the browser allows it, and where it is refused says so plainly;
//   - with a BAE report loaded (CONTRACT §14.3, rule 6), every picture is the CCaR plan's: each cell of each block is the
//     one it is with no report, but for the Obligation % label's word ('CCaR plan' where the report covers the block),
//     and the band's Total column is the oracle's plan headline (test/fixture/oracle.py, bae-all);
//   - with no report, every PNG is the one the code before the report drew (commit 0c71592, on main), byte for byte.
//
//   node spend-plan/test/pictures.test.mjs
import { chromium } from 'playwright-core';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CHROME } from '../../tools/chrome.mjs';
import { pageHtml, checks, scratchDir } from './harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..');
// the code before the BAE report (CONTRACT §14: with none loaded, nothing changes), on main
const BEFORE = '0c71592';
const C = checks('pictures');
const tmp = scratchDir('sfcbsp-pic-');
const MODS = ['util', 'xlsx-read', 'import', 'engine', 'xlsx-write', 'pictures'];
const J = o => JSON.stringify(o);
// restated from CONTRACT §10 and §2, never read from the tool
const W = 2000, H = 675, CUI = 'CUI//REL TO US DoW';
const pad2 = n => String(n).padStart(2, '0');
const commas = d => d.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
// §2 fmtM and fmtPct, restated: $M to two decimals ('-' for zero, '<0.01' under $5,000, negatives in parentheses), and a
// percentage to hundredths, half away from zero; a picture prints nothing for a missing percentage
function fmtM(c) {
  if (c === 0) return '-';
  const a = Math.abs(c);
  let body;
  if (a < 500000) body = '<0.01';
  else { let q = Math.floor(a / 1e6); if (a - q * 1e6 >= 500000) q++; body = commas(String(Math.floor(q / 100))) + '.' + pad2(q % 100); }
  return c < 0 ? '(' + body + ')' : body;
}
function pct(x) {
  if (typeof x !== 'number') return '';
  const h = Math.round(Number((Math.abs(x) * 10000).toPrecision(12)));
  return (x < 0 && h ? '-' : '') + commas(String(Math.floor(h / 100))) + '.' + pad2(h % 100) + '%';
}
const STATUS_WORD = { green: 'On track', yellow: 'Within 10', red: 'Behind' };
// The page the sources at BEFORE build, from git, assembled by that commit's own build.mjs in a scratch tree; null when
// this clone does not hold the commit (the check that needs it then fails, saying so)
async function pageBefore(dir) {
  if (spawnSync('git', ['-C', REPO, 'cat-file', '-e', BEFORE + '^{commit}']).status !== 0) return null;
  const root = join(dir, 'before', 'spend-plan');
  mkdirSync(join(root, 'src'), { recursive: true });
  const ls = spawnSync('git', ['-C', REPO, 'ls-tree', '--name-only', BEFORE, 'spend-plan/src/'], { encoding: 'utf8' });
  for (const f of ['spend-plan/build.mjs'].concat(ls.stdout.split('\n').filter(Boolean))) {
    const r = spawnSync('git', ['-C', REPO, 'show', BEFORE + ':' + f], { maxBuffer: 1 << 28 });
    if (r.status !== 0) return null;
    writeFileSync(join(root, f.replace(/^spend-plan\//, '')), r.stdout);
  }
  const { assemble } = await import(pathToFileURL(join(root, 'build.mjs')).href);
  return assemble({ modules: MODS });
}
const FX = join(tmp.dir, 'fx');
mkdirSync(FX);
function py(args, input) {
  const r = spawnSync('python3', ['-I', ...args], { encoding: 'utf8', maxBuffer: 1 << 28, input });
  if (r.status !== 0) throw new Error('python3 failed: ' + r.stderr.slice(-800));
  return r.stdout;
}

// In the page: decode a PNG blob again and measure it. Bands are the top and bottom 30 rows (§10: "small bold text at
// the top and bottom"); "dark" is anything a reader sees as ink; the table box is everything not white between them.
const ANALYSE = `window.__analyse = async function (blob, bandH) {
  const bm = await createImageBitmap(blob);
  const cv = document.createElement('canvas'); cv.width = bm.width; cv.height = bm.height;
  const g = cv.getContext('2d'); g.drawImage(bm, 0, 0);
  const d = g.getImageData(0, 0, bm.width, bm.height).data, w = bm.width, h = bm.height;
  const px = (x, y) => { const i = (y * w + x) * 4; return [d[i], d[i + 1], d[i + 2]]; };
  const white = p => p[0] > 250 && p[1] > 250 && p[2] > 250;
  const dark = p => p[0] + p[1] + p[2] < 300;
  const box = (y0, y1, test) => { let x0 = w, x1 = -1, ya = h, yb = -1, n = 0;
    for (let y = y0; y < y1; y++) for (let x = 0; x < w; x++) if (test(px(x, y))) { n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < ya) ya = y; if (y > yb) yb = y; }
    return { n, x0, x1, y0: ya, y1: yb }; };
  let nonWhite = 0; const exact = {};
  const want = { navy: [31, 58, 104], gold: [255, 230, 153], green: [0, 176, 80], yellow: [255, 215, 0], red: [192, 0, 0] };
  for (const k in want) exact[k] = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (!(d[i] > 250 && d[i + 1] > 250 && d[i + 2] > 250)) nonWhite++;
    for (const k in want) if (d[i] === want[k][0] && d[i + 1] === want[k][1] && d[i + 2] === want[k][2]) exact[k]++;
  }
  const top = box(0, bandH, dark), bottom = box(h - bandH, h, dark);
  // anything at all in a band that is not the marking's own ink box: a table run into the band shows here
  const topAll = box(0, bandH, p => !white(p)), bottomAll = box(h - bandH, h, p => !white(p));
  const table = box(bandH, h - bandH, p => !white(p));
  // the table's right border: drawn down the whole height of the box when the table is whole, cut off when it is not
  // (measured from the first ink in that column to the last, so a line of words above the table is not counted)
  let edge = 0, e0 = -1, e1 = -1;
  for (let y = table.y0; y <= table.y1; y++) if (!white(px(table.x1, y))) { edge++; if (e0 < 0) e0 = y; e1 = y; }
  // the two bands, pixel for pixel: the same words drawn the same way
  let same = true;
  for (let y = 0; y < bandH && same; y++) for (let x = 0; x < w; x++) { const a = px(x, y), b = px(x, h - bandH + y); if (a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2]) { same = false; break; } }
  // a brownish line of words under the top band: the "what is shown" line of a filtered picture (§4.3)
  const shown = box(bandH, bandH + 30, p => p[0] > 100 && p[1] < 90 && p[2] < 40 && p[0] - p[1] > 60);
  return { w, h, nonWhite: nonWhite / (w * h), exact, top, bottom, topAll, bottomAll, table, edge: e0 >= 0 && e1 - e0 > 100 ? edge / (e1 - e0 + 1) : 0, same, shown };
};
// the width the marking's words take at a size, in this browser's own sans-serif: a band whose ink is far narrower or
// wider than any size of these words is not these words
window.__textW = (t, px) => { const c = document.createElement('canvas').getContext('2d'); c.font = 'bold ' + px + 'px Arial, sans-serif'; return c.measureText(t).width; };
window.__b64 = async blob => { const u = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };`;

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
try {
  py([join(HERE, 'fixture', 'make_fixture.py'), '--out', FX]);
  const PAGE = join(tmp.dir, 'pictures.html');
  writeFileSync(PAGE, pageHtml({ modules: MODS }));
  const b64 = readFileSync(join(FX, 'pull-all.xlsx')).toString('base64');
  async function open(ctx) {
    const p = await ctx.newPage();
    const w = { p, errors: [] };
    p.on('pageerror', e => w.errors.push(e.message));
    p.on('console', m => { if (m.type() === 'error') w.errors.push(m.text()); });
    await p.goto(pathToFileURL(PAGE).href);
    await p.addScriptTag({ content: ANALYSE });
    // the fixture, imported by the tool's own reader, and the model every switch on, and with USAF off
    await p.evaluate(async b64 => {
      const bin = atob(b64), u = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      const parsed = await SP.parseFiles([{ name: 'pull-all.xlsx', data: u.buffer }], { now: '2026-11-09T12:00:00.000Z' });
      const S = SP.defaultSettings('2026-11-09');
      window.__M = SP.buildModel(parsed.pulls, S, SP.defaultView());
      const v = SP.defaultView(); v.svc.USAF = false;
      window.__Moff = SP.buildModel(parsed.pulls, S, v);
    }, b64);
    return w;
  }
  const ctx = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  const P = await open(ctx);
  const ev = (fn, arg) => P.p.evaluate(fn, arg);

  // ================================================================ every block of the fixture (§10)
  const blocks = await ev(() => __M.blocks.map(b => b.apLabel + ' FY' + b.fy));
  // a block with no goal (money for a later year) or nothing approved has no status anywhere, so no status colour
  const hasStatus = await ev(() => __M.blocks.map(b => !!b.status || b.statusC.some(s => s && s.status)));
  C.chk('the fixture has blocks to draw', blocks.length >= 4, J(blocks));
  const sizes = await ev(() => __M.blocks.map(b => { const c = SP.blockCanvas(b, __M); return [c.width, c.height]; }));
  C.chk('every block’s canvas is 2000 x 675', sizes.every(s => s[0] === W && s[1] === H), J(sizes));
  const minW = await ev(t => __textW(t, 12), CUI), maxW = await ev(t => __textW(t, 26), CUI);
  const res = await ev(async () => {
    const out = [];
    for (const b of __M.blocks) out.push(await __analyse(await SP.blockPng(b, __M), 30));
    return out;
  });
  res.forEach((a, i) => {
    const n = blocks[i];
    C.eq(n + ': the PNG is 2000 x 675', [a.w, a.h], [W, H]);
    C.chk(n + ': not blank (' + (a.nonWhite * 100).toFixed(1) + '% drawn on)', a.nonWhite > 0.05, '');
    C.chk(n + ': the title bar’s navy and the header’s gold are there', a.exact.navy > 5000 && a.exact.gold > 5000, J(a.exact));
    C.chk(n + (hasStatus[i] ? ': its status colours are there' : ': it has no status, and no status colour is drawn'),
      hasStatus[i] ? a.exact.green + a.exact.yellow + a.exact.red > 500 : a.exact.green + a.exact.yellow + a.exact.red === 0, J(a.exact));
    for (const [where, band, all] of [['top', a.top, a.topAll], ['bottom', a.bottom, a.bottomAll]]) {
      const bw = band.x1 - band.x0 + 1, cx = (band.x0 + band.x1) / 2;
      C.chk(n + ': the CUI marking is drawn at the ' + where, band.n > 100 && bw >= minW && bw <= maxW && Math.abs(cx - W / 2) < 20,
        J(band) + ' width ' + bw + ' want ' + minW.toFixed(0) + '–' + maxW.toFixed(0));
      C.chk(n + ': nothing else is drawn in the ' + where + ' band', all.x0 >= band.x0 - 3 && all.x1 <= band.x1 + 3, J(all));
    }
    C.chk(n + ': the top and bottom markings are the same words, drawn the same', a.same);
    // a clear row is left between the table and each band: a table run into a band touches its edge row
    C.chk(n + ': the table lies inside the region, clear of both bands and both sides',
      a.table.x0 >= 8 && a.table.x1 <= W - 9 && a.table.y0 > 31 && a.table.y1 < H - 32, J(a.table));
    C.chk(n + ': the table’s right border is whole (it was not cut off)', a.edge > 0.95, a.edge.toFixed(3));
    C.chk(n + ': nothing says it is filtered, because nothing is', a.shown.n === 0, J(a.shown));
  });
  // review S9: a status cell with no status (no goal, the next-year column, No date) is drawn with no fill but the closed
  // months' grey, as on the screen and in the workbook. It was v12's FFE699 base fill, a word-less near-yellow beside the
  // FFD700 of "Within 10". Each such cell is found from the layout, and its middle pixel is read off the drawn canvas.
  const blankSt = await ev(() => {
    const out = [];
    __M.blocks.forEach(b => {
      const cv = SP.blockCanvas(b, __M), ctx = cv.getContext('2d');
      const L = pic_layout(document.createElement('canvas').getContext('2d'), b, __M);
      let y = L.oy + PIC_T.titleH * L.scale;
      for (const r of L.rows) {
        if (r.cells[0] && r.cells[0].t === 'OSD Status') {
          let x = L.ox;
          r.cells.forEach((c, j) => {
            const w = L.widths[j] * L.scale;
            if (j > 0 && !c.t) {
              const d = ctx.getImageData(Math.round(x + w / 2), Math.round(y + (r.h * L.scale) / 2), 1, 1).data;
              out.push({ block: b.apLabel + ' FY' + b.fy, j, rgb: [d[0], d[1], d[2]] });
            }
            x += w;
          });
        }
        y += r.h * L.scale;
      }
    });
    return out;
  });
  const okFill = c => (c[0] === 255 && c[1] === 255 && c[2] === 255) || (c[0] === 242 && c[1] === 242 && c[2] === 242);
  C.chk('S9: the fixture has status cells with no status to look at', blankSt.length > 0, J(blankSt.length));
  C.chk('S9: a status cell with no status is white (or the closed grey), never v12’s gold', blankSt.every(x => okFill(x.rgb)),
    J(blankSt.filter(x => !okFill(x.rgb)).slice(0, 4)));
  // the widest block: the one whose table, unscaled, is widest (the layout is read only to choose it)
  const widest = await ev(() => {
    const ctx = document.createElement('canvas').getContext('2d');
    let best = null;
    __M.blocks.forEach((b, i) => { const L = pic_layout(ctx, b, __M); if (!best || L.natW > best.natW) best = { i, natW: L.natW, name: b.apLabel + ' FY' + b.fy, cols: L.nCols }; });
    return best;
  });
  const wa = res[widest.i];
  C.chk('the widest block (' + widest.name + ', ' + widest.cols + ' columns) fits the region whole',
    wa.table.x1 <= W - 9 && wa.table.x0 >= 8 && wa.edge > 0.95 && wa.table.y1 < H - 32, J(wa.table));
  C.chk('the widest block is drawn across the region’s width (scaled to fit it)', wa.table.x1 - wa.table.x0 > W - 2 * 16 - 10, J(wa.table));

  // a block made far wider and taller than any real one: 40 offices, one with a 300-character name, $M in the millions
  const stress = await ev(async () => {
    const b = JSON.parse(JSON.stringify(__M.blocks.reduce((a, x) => (x.pmoRows.length > a.pmoRows.length ? x : a))));
    const big = 999999999999999;
    const name = 'Sustainment Office ' + 'with a very long name '.repeat(12) + 'Supercalifragilisticexpialidocious'.repeat(3);
    b.pmoRows = Array.from({ length: 40 }, (_, i) => ({ pmo: 'p' + i, label: i === 3 ? name : 'Office ' + i, cols: b.cols.map(() => big), total: big }));
    b.cols = b.cols.map(() => big); b.approved = big;
    const ctx = document.createElement('canvas').getContext('2d');
    const L = pic_layout(ctx, b, __M);
    return { a: await __analyse(await SP.blockPng(b, __M), 30), fitsH: L.natH * L.scale <= L.region.h + 0.5, shrunk: L.natW * L.scale < L.region.w - 1 };
  });
  C.chk('a block far too tall: shrunk further to fit the height (CONTRACT §10)', stress.fitsH && stress.shrunk, J(stress));
  C.chk('a block far too tall and wide: everything stays inside the region',
    stress.a.table.x0 >= 8 && stress.a.table.x1 <= W - 9 && stress.a.table.y0 > 31 && stress.a.table.y1 < H - 32 && stress.a.edge > 0.95, J(stress.a.table));
  C.chk('a block far too tall: the CUI marking is still alone in both bands',
    stress.a.topAll.x1 - stress.a.topAll.x0 < maxW && stress.a.bottomAll.x1 - stress.a.bottomAll.x0 < maxW && stress.a.same);

  // ========================================================================= switches off (§4.3)
  const off = await ev(async () => {
    const b = __Moff.blocks[0];
    const ctx = document.createElement('canvas').getContext('2d');
    return { a: await __analyse(await SP.blockPng(b, __Moff), 30), said: pic_layout(ctx, b, __Moff).shown, text: __Moff.shown.text };
  });
  C.chk('USAF off: the picture says what it shows', off.a.shown.n > 50 && off.said === off.text && /Services shown/.test(off.text), J({ said: off.said, n: off.a.shown.n }));
  C.chk('USAF off: the table still fits below that line', off.a.table.y0 > 31 && off.a.table.y1 < H - 32 && off.a.edge > 0.95, J(off.a.table));

  // ========================================================================= with a BAE report (§14.3, rule 6)
  // The fixture's report imported with its pull. A picture measures the CCaR plan by month, so every cell is the cell it
  // is with no report, but the Obligation % label's word: 'CCaR plan' where the report covers the block (its Approved is
  // then the report's, and the plan beside it is not that Approved), 'Approved' elsewhere (§14.5). The band's Total
  // column is the plan's headline, held to the oracle's figures.
  const XB = (() => {
    const out = join(tmp.dir, 'exp-bae-all.json');
    py([join(HERE, 'fixture', 'oracle.py'), '--scenario', 'bae-all', '--fixture', FX, '--out', out]);
    return JSON.parse(readFileSync(out, 'utf8'));
  })();
  const baeB64 = readFileSync(join(FX, 'bae.xlsx')).toString('base64');
  const lay = await ev(async ([b64p, b64r]) => {
    const u8 = b64 => { const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; };
    const parsed = await SP.parseFiles([{ name: 'pull-all.xlsx', data: u8(b64p) }, { name: 'bae.xlsx', data: u8(b64r) }], { now: '2026-11-09T12:00:00.000Z' });
    const bae = Object.assign({}, parsed.bae, { importedAt: '2026-11-09T12:00:00.000Z' });
    window.__Mb = SP.buildModel(parsed.pulls, SP.defaultSettings('2026-11-09'), SP.defaultView(), bae);
    const ctx = document.createElement('canvas').getContext('2d');
    // each row's cells as drawn: text, alignment, font, ink and fill (widths may move with the label's length)
    const cells = (b, M) => pic_layout(ctx, b, M).rows.map(r => r.cells.map(c => [c.t, c.align, c.font, c.ink, c.fill]));
    return __Mb.blocks.map((b, i) => ({ key: b.ap + '|' + b.fy, covered: b.covered, withBae: cells(b, __Mb), without: cells(__M.blocks[i], __M),
      same: __M.blocks[i].ap === b.ap && __M.blocks[i].fy === b.fy }));
  }, [b64, baeB64]);
  C.chk('with a report: the same blocks as with none, in the same order', lay.length === blocks.length && lay.every(l => l.same), J(lay.map(l => l.key)));
  C.chk('with a report: the fixture has blocks the report covers and blocks it does not', lay.some(l => l.covered) && lay.some(l => !l.covered), J(lay.map(l => [l.key, l.covered])));
  const word = [];
  for (const l of lay) {
    const x = XB.blocks[l.key];
    // with no report, the label reads 'Approved' and the figure is the plan: the only cell that may differ is that word
    const want = l.without.map(r => r.map(c => (typeof c[0] === 'string' && c[0].startsWith('Obligation %  (Approved ') && x.covered
      ? [c[0].replace('Obligation %  (Approved ', 'Obligation %  (CCaR plan ')].concat(c.slice(1)) : c)));
    if (J(l.withBae) !== J(want)) word.push(l.key + (x.covered ? ' (covered)' : ''));
    // the band's Total column (cell 1 and the last): the plan, its Obl %, goal and status (the oracle's slide figures)
    const band = Object.fromEntries(l.withBae.filter(r => r.length > 2).map(r => [String(r[0][0]).startsWith('Obligation %') ? 'obl' : r[0][0], r]));
    const s = x.slide, tot = r => r ? [r[1][0], r[r.length - 1][0]] : null;
    const got = [tot(band['Monthly Totals']), tot(band['Cumulative Totals']), tot(band.obl), tot(band['OSD Goal %']), tot(band['OSD Status'])];
    const exp = [[fmtM(s.basis), fmtM(s.basis)], [fmtM(s.basis), fmtM(s.basis)], [pct(s.oblPct), pct(s.oblPct)], [pct(s.goal), pct(s.goal)],
      [s.status ? STATUS_WORD[s.status] : '', s.status ? STATUS_WORD[s.status] : '']];
    if (J(got) !== J(exp)) word.push(l.key + ' Total column ' + J(got) + ' want ' + J(exp));
    // and that plan is not the report's Approved where the report covers the block: the check can tell the two apart
    if (x.covered && x.planned === x.approved) word.push(l.key + ' is covered but its plan is its Approved, so it proves nothing');
  }
  C.chk('with a report: every cell of every picture is the plan’s, as with none, but the label’s word (CCaR plan where covered), and the Total column is the oracle’s plan headline (rule 6)',
    !word.length, word.slice(0, 4).join('; '));
  C.chk('with a report: the label word says CCaR plan on every covered block, and Approved on the others', lay.every(l => {
    const lab = l.withBae.map(r => r[0] && r[0][0]).find(t => typeof t === 'string' && t.startsWith('Obligation %'));
    return lab && lab.startsWith('Obligation %  (' + (XB.blocks[l.key].covered ? 'CCaR plan ' : 'Approved ') + fmtM(XB.blocks[l.key].slide.basis).replace(/^-$/, '0.00') + 'M;');
  }), '');
  // the PNG of a covered block is drawn from that layout: it opens and is a whole picture like every other
  const covPng = await ev(async () => { const b = __Mb.blocks.find(x => x.covered); return __analyse(await SP.blockPng(b, __Mb), 30); });
  C.chk('with a report: a covered block’s picture is whole (2000 x 675, its table inside the region)', covPng.w === W && covPng.h === H && covPng.edge > 0.95
    && covPng.table.y0 > 31 && covPng.table.y1 < H - 32, J(covPng.table));

  // ========================================================================= with no report: as before (§14)
  // Every block's PNG, with every switch on and with USAF off, drawn by this code and by the code at BEFORE in the same
  // browser: byte for byte the same, so not a pixel of a picture moved with the report's arrival.
  {
    const html = await pageBefore(tmp.dir);
    if (C.chk('the code before the BAE report is in this clone (commit ' + BEFORE + ', on main); if this fails, run git fetch --unshallow', !!html)) {
      const OLD = join(tmp.dir, 'pictures-before.html');
      writeFileSync(OLD, html);
      const q = await ctx.newPage();
      const qe = [];
      q.on('pageerror', e => qe.push(e.message));
      await q.goto(pathToFileURL(OLD).href);
      await q.addScriptTag({ content: ANALYSE });
      const pngs = page => page.evaluate(async b64 => {
        const bin = atob(b64), u = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
        const parsed = await SP.parseFiles([{ name: 'pull-all.xlsx', data: u.buffer }], { now: '2026-11-09T12:00:00.000Z' });
        const S = SP.defaultSettings('2026-11-09');
        const v = SP.defaultView(); v.svc.USAF = false;
        const out = [];
        for (const M of [SP.buildModel(parsed.pulls, S, SP.defaultView()), SP.buildModel(parsed.pulls, S, v)]) {
          for (const b of M.blocks) out.push([b.apLabel + ' FY' + b.fy + (M.shown.all ? '' : ' (USAF off)'), await __b64(await SP.blockPng(b, M))]);
        }
        return out;
      }, b64);
      const was = await pngs(q), now = await pngs(P.p);
      C.eq('no report: the code before draws the same blocks', was.map(x => x[0]), now.map(x => x[0]));
      const moved = now.filter((x, i) => !was[i] || was[i][1] !== x[1]).map(x => x[0]);
      C.chk('no report: every picture, every switch on and USAF off, is the one the code before the report drew, byte for byte', was.length === now.length && !moved.length,
        moved.length + ' of ' + now.length + ' differ: ' + moved.slice(0, 4).join(', '));
      C.eq('no script error in the page the code before builds', qe, []);
      await q.close();
    }
  }

  // ========================================================================== every picture in a zip (§10)
  const zip64 = await ev(async () => __b64(await SP.allPicturesZip(__M)));
  const zp = join(tmp.dir, 'pictures.zip');
  writeFileSync(zp, Buffer.from(zip64, 'base64'));
  const zr = JSON.parse(py(['-c', `
import io, json, struct, sys, zipfile, zlib
from PIL import Image
z = zipfile.ZipFile(sys.argv[1])
out = {'bad': z.testzip(), 'names': z.namelist(), 'png': [], 'phys': []}
for n in z.namelist():
    b = z.read(n)
    ok = b[:8] == b'\\x89PNG\\r\\n\\x1a\\n' and b[12:16] == b'IHDR'
    out['png'].append([n, ok] + (list(struct.unpack('>II', b[16:24])) if ok else []))
    # every chunk, its CRC checked, and the pHYs: where it sits, what it says, and the resolution PIL reads from it
    i, order, crc_ok, phys = 8, [], True, None
    while i + 8 <= len(b):
        ln = struct.unpack('>I', b[i:i + 4])[0]; t = b[i + 4:i + 8]; d = b[i + 8:i + 8 + ln]
        crc_ok = crc_ok and struct.unpack('>I', b[i + 8 + ln:i + 12 + ln])[0] == (zlib.crc32(t + d) & 0xffffffff)
        order.append(t.decode('latin-1'))
        if t == b'pHYs': phys = list(struct.unpack('>IIB', d))
        i += 12 + ln
    im = Image.open(io.BytesIO(b)); im.load()
    out['phys'].append({'name': n, 'phys': phys, 'beforeIdat': 'pHYs' in order and order.index('pHYs') < order.index('IDAT'),
                        'nPhys': order.count('pHYs'), 'crc': crc_ok, 'dpi': [round(x) for x in im.info.get('dpi', (0, 0))], 'size': list(im.size)})
print(json.dumps(out))
`, zp]));
  C.chk('the zip opens with Python’s zipfile and every member reads back intact', zr.bad === null, J(zr.bad));
  C.eq('the zip holds one "{Ap} FY{fy}.png" per block, in block order', zr.names, blocks.map(n => n + '.png'));
  C.chk('every PNG in the zip is 2000 x 675', zr.png.length === blocks.length && zr.png.every(p => p[1] === true && p[2] === W && p[3] === H), J(zr.png.slice(0, 3)));
  // 13.33 x 4.5 in holds only if the PNG says 150 dpi: with no pHYs chunk Office places it at 96 dpi, 20.83 x 7.03 in,
  // larger than the slide (review XP-7). One pHYs, 5906 px a metre each way (150 dpi), before the image data, every
  // chunk's CRC right, and the PNG still decodes at 2000 x 675.
  C.chk('every PNG says 150 dpi (one pHYs of 5906 px/m, before the image data), its chunks intact, and decodes',
    zr.phys.length === blocks.length && zr.phys.every(x => J(x.phys) === J([5906, 5906, 1]) && x.nPhys === 1 && x.beforeIdat && x.crc
      && J(x.dpi) === J([150, 150]) && J(x.size) === J([W, H])), J(zr.phys.slice(0, 2)));

  // a PNG that already says its resolution keeps ONE pHYs: given the tool's own PNG again, the bytes come back unchanged
  const again = await ev(async () => {
    const u = new Uint8Array(await (await SP.blockPng(__M.blocks[0], __M)).arrayBuffer());
    const v = pic_withDpi(u);
    return { same: u.length === v.length && u.every((b, i) => b === v[i]), n: u.length };
  });
  C.chk('a PNG that already holds a pHYs keeps one: adding 150 dpi again changes no byte', again.same && again.n > 1000, J(again));

  // =========================================================================== the clipboard (§10)
  const copy = await ev(async () => {
    const b = __M.blocks[0];
    const r = await SP.copyBlockPicture(b, __M);
    const items = await navigator.clipboard.read();
    const blob = items.length && items[0].types.includes('image/png') ? await items[0].getType('image/png') : null;
    const bm = blob ? await createImageBitmap(blob) : null;
    return { r, size: bm ? [bm.width, bm.height] : null, name: b.apLabel + ' FY' + b.fy };
  });
  C.chk('Copy picture, allowed: it says the picture is on the clipboard', copy.r.ok === true && copy.r.message.includes(copy.name) && /clipboard/.test(copy.r.message), J(copy.r));
  C.eq('Copy picture, allowed: the clipboard holds the block as a 2000 x 675 PNG', copy.size, [W, H]);
  const ctx2 = await browser.newContext({ permissions: [] });   // the browser's answer to "may this page write the clipboard?" is no
  const Q = await open(ctx2);
  const denied = await Q.p.evaluate(async () => SP.copyBlockPicture(__M.blocks[0], __M));
  C.chk('Copy picture, refused: it says so, and offers Save picture', denied.ok === false && /not copied/.test(denied.message) && /Save picture/.test(denied.message), J(denied));
  C.chk('Copy picture, refused: the message is plain words (no error name, no stack)',
    !/Exception|Error|\n|\bat \w+ \(/.test(denied.message) && denied.message.length < 300, denied.message);
  const none = await Q.p.evaluate(async () => { const real = navigator.clipboard.write; navigator.clipboard.write = undefined;
    try { return await SP.copyBlockPicture(__M.blocks[0], __M); } finally { navigator.clipboard.write = real; } });
  C.chk('Copy picture, where the browser has no picture clipboard: it says so, and offers Save picture', none.ok === false && /Save picture/.test(none.message), J(none));
  C.eq('no script error in either page', [P.errors, Q.errors], [[], []]);
  await ctx2.close();
  await ctx.close();
} catch (e) {
  C.chk('the test ran to the end', false, (e && e.stack) || String(e));
} finally {
  await browser.close();
  tmp.rm();
  C.done();
}
