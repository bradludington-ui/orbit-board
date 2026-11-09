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
//   - Copy picture puts the PNG on the clipboard where the browser allows it, and where it is refused says so plainly.
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
const C = checks('pictures');
const tmp = scratchDir('sfcbsp-pic-');
const MODS = ['util', 'xlsx-read', 'import', 'engine', 'xlsx-write', 'pictures'];
const J = o => JSON.stringify(o);
// restated from CONTRACT §10 and §2, never read from the tool
const W = 2000, H = 675, CUI = 'CUI//REL TO US DoW';
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
