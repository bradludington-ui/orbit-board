// §10 PICTURES — one slide block as a picture for PowerPoint (CONTRACT §10).
//
//   SP.blockCanvas(block, model)            -> a 2000 x 675 canvas: the block from its title bar through OSD Status
//   await SP.blockPng(block, model)         -> a PNG Blob of it
//   await SP.copyBlockPicture(block, model) -> {ok, message}: the PNG on the clipboard, or why not
//   await SP.allPicturesZip(model)          -> a zip Blob, one '{Ap} FY{fy}.png' per block
//
// 2000 x 675 px is 13.33 x 4.5 in at 150 dpi, the slide region v12's instructions named. v12 asked people to select a
// cell range and Copy as Picture, which came out about 1,664 x 286 px (5.8 : 1) against that 2.96 : 1 region, with the
// FY+ column hidden (FINDINGS look §10.2). Here the block is drawn to the region's own shape, every column shown.
//
// Every figure is READ from the model (SP.buildModel), printed with the tool's own formats: the picture, the screens and
// the workbook print the same numbers, so a slide can never disagree with the workbook it came from. Canvas text is
// never parsed as markup, so a hostile plan event is drawn as the characters it is.

// ---------------------------------------------------------------------------------------------------------------
// THE LOOK: §8's colours and words (FINDINGS "### look")
// ---------------------------------------------------------------------------------------------------------------
const PIC_W = 2000, PIC_H = 675;
const PIC = Object.freeze({
  navy: '#1F3A68', gold: '#FFE699', box: '#404040', grid: '#808080', ink: '#1A1A1A', closed: '#F2F2F2', plan: '#808080',
  white: '#FFFFFF', filtered: '#8A3A00',
  status: Object.freeze({ green: '#00B050', yellow: '#FFD700', red: '#C00000' }),
  // white on red and green, black on yellow: the word must be readable on its own colour, which never stands alone
  statusInk: Object.freeze({ green: '#FFFFFF', yellow: '#000000', red: '#FFFFFF' }),
});
const PIC_FONT = 'Calibri, Carlito, "Segoe UI", Arial, sans-serif';
// The picture's own frame, in canvas pixels: the CUI marking in a band at the top and the bottom, and the table in
// the region between, never under either band.
const PIC_CUI_BAND = 30, PIC_CUI_PX = 18, PIC_MARGIN = 16, PIC_SHOWN_H = 26;
// The table in its own units (about a pixel at 1:1), scaled as a whole to the region afterwards. Sizes follow v12:
// title bar 14 pt, header 11 pt, PMO rows 11 pt, the totals band 10 pt.
const PIC_T = Object.freeze({
  titleH: 34, headH: 30, rowH: 22, spacerH: 10, padX: 7, minNumW: 64,
  labelMax: 520,              // a longer PMO name wraps in its cell rather than squeezing every figure on the slide
  fTitle: 19, fHead: 14, fPmo: 14.5, fBand: 13.3,
  lPmo: 17, lBand: 16,        // line heights, for a label that wraps
});
function pic_font(px, bold, italic) { return (italic ? 'italic ' : '') + (bold ? 'bold ' : '') + px + 'px ' + PIC_FONT; }

// ---------------------------------------------------------------------------------------------------------------
// LAYOUT: what goes in each cell, and how wide and tall everything is before scaling. Kept apart from the drawing, so
// a test can hold the layout to the region without reading pixels, and the pixels to the layout.
// ---------------------------------------------------------------------------------------------------------------
function pic_cols(model) { return model.cols.filter(c => c.id !== 'nodate' || model.showNoDate); }
function pic_money(c) { return typeof c === 'number' && isFinite(c) ? SP.fmtM(c) : ''; }
function pic_pct(x) { return typeof x === 'number' && isFinite(x) ? SP.fmtPct(x) : ''; }
// words into lines no wider than maxW; a word wider than a line is broken by characters, never left to run out
function pic_wrap(ctx, text, maxW) {
  const words = String(text).split(/\s+/).filter(w => w !== '');
  const lines = [];
  let cur = '';
  const push = w => {
    if (ctx.measureText(w).width <= maxW) return w;
    let piece = '';
    for (const ch of w) {
      if (piece && ctx.measureText(piece + ch).width > maxW) { lines.push(piece); piece = ch; } else piece += ch;
    }
    return piece;
  };
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (!cur || ctx.measureText(t).width <= maxW) { cur = cur ? t : push(w); continue; }
    lines.push(cur);
    cur = push(w);
  }
  if (cur || !lines.length) lines.push(cur);
  return lines;
}

// cell: {t: text, align: 'l'|'r'|'c', font, ink, fill, swatch?: status colour (a plan status)}
function pic_layout(ctx, block, model) {
  const T = PIC_T;
  const V = pic_cols(model);
  const nNum = V.length + 2;                 // Total, the columns, Total
  const fPmoB = pic_font(T.fPmo, true), fBandB = pic_font(T.fBand, true), fPlan = pic_font(T.fBand, true, true);
  const cell = (t, align, font, ink, fill) => ({ t, align, font, ink, fill: fill || null });
  const closedFill = c => (c.closed ? PIC.closed : null);
  const rows = [];
  // the header
  rows.push({ kind: 'head', cells: [cell('PMO', 'c', pic_font(T.fHead, true), PIC.ink, PIC.gold), cell('Total', 'c', pic_font(T.fHead, true), PIC.ink, PIC.gold)]
    .concat(V.map(c => cell(c.label, 'c', pic_font(T.fHead, true), PIC.ink, PIC.gold)), [cell('Total', 'c', pic_font(T.fHead, true), PIC.ink, PIC.gold)]) });
  // the PMO rows: every PMO with money in the block (§6 item 11), never a typed list
  for (const p of block.pmoRows || []) {
    rows.push({ kind: 'pmo', cells: [cell(p.label, 'l', fPmoB, PIC.navy), cell(pic_money(p.total), 'r', fPmoB, PIC.navy)]
      .concat(V.map(c => cell(pic_money(p.cols[c.index]), 'r', fPmoB, PIC.navy, closedFill(c))), [cell(pic_money(p.total), 'r', fPmoB, PIC.navy)]) });
  }
  rows.push({ kind: 'spacer', cells: [] });
  const band = (label, tot, each) => ({ kind: 'band', cells: [cell(label, 'r', fBandB, PIC.navy), tot].concat(V.map(each), [tot]) });
  // A slide measures the CCaR PLAN by month (CONTRACT §14.3, rule 6): its Total column is the plan and the plan's headline,
  // never a BAE report's Approved, which its months would not add to. SP.plannedOf and SP.slideOf give them; with no
  // report they are the block's own Approved and headline, so nothing on a picture moves. Only the label's word does.
  const plan = SP.plannedOf(block), sl = SP.slideOf(block);
  rows.push(band('Monthly Totals', cell(pic_money(plan), 'r', fBandB, PIC.navy),
    c => cell(pic_money(block.cols[c.index]), 'r', fBandB, PIC.navy, closedFill(c))));
  // the running sum ends in the last dated column; No date is outside it (§4.5), so its cell stays empty
  rows.push(band('Cumulative Totals', cell(pic_money(plan), 'r', fBandB, PIC.navy),
    c => cell(c.id === 'nodate' ? '' : pic_money(block.cum[c.index]), 'r', fBandB, PIC.navy, closedFill(c))));
  // the label in the one wording the screen and the workbook use too (SP.oblLabel: '0.00M', never '-M', review R7; and
  // 'CCaR plan' where a BAE report covers the block, §14.5)
  rows.push(band(SP.oblLabel(block, model),
    cell(pic_pct(sl.oblPct), 'c', fBandB, PIC.navy),
    c => {
      const o = block.obl[c.index] || {};
      // a planned percentage is not an obligation: italic and grey, as §8 prints it
      return o.kind === 'plan' ? cell(pic_pct(o.v), 'c', fPlan, PIC.plan, closedFill(c)) : cell(pic_pct(o.v), 'c', fBandB, PIC.navy, closedFill(c));
    }));
  rows.push(band('OSD Goal %', cell(pic_pct(sl.goal), 'c', fBandB, PIC.navy), c => cell(pic_pct(block.goalC[c.index]), 'c', fBandB, PIC.navy, closedFill(c))));
  // no status (no goal here, or No date): no fill but the closed months' grey, as the workbook and the screens draw it. A
  // word-less gold cell beside a yellow "Within 10" read as a status by colour alone (review S9)
  const st = (status, plan, c) => {
    if (!status || !PIC.status[status]) return cell('', 'c', fBandB, PIC.ink, c ? closedFill(c) : null);
    const word = SP.statusWord(status);
    // a plan status: its fill and readable ink, in italic, as the workbook prints it (CONTRACT §8)
    if (plan) return cell(word, 'c', fPlan, PIC.statusInk[status], PIC.status[status]);
    return cell(word, 'c', fBandB, PIC.statusInk[status], PIC.status[status]);
  };
  rows.push(band('OSD Status', st(sl.status, false, null), c => { const s = block.statusC[c.index] || {}; return st(s.status, s.kind === 'plan', c); }));

  // widths: each column as wide as its widest text, the label column up to labelMax (wider labels wrap)
  const widths = new Array(nNum + 1).fill(0);
  for (const r of rows) {
    r.cells.forEach((c, j) => {
      if (!c.t) return;
      ctx.font = c.font;
      let w = ctx.measureText(c.t).width + 2 * T.padX + (c.swatch ? 14 : 0);
      if (j === 0) w = Math.min(w, T.labelMax);
      widths[j] = Math.max(widths[j], w);
    });
  }
  for (let j = 1; j <= nNum; j++) widths[j] = Math.max(widths[j], T.minNumW);
  widths[0] = Math.max(widths[0], 160);
  // heights: a label that wraps makes its row taller; nothing is cut
  for (const r of rows) {
    if (r.kind === 'head') { r.h = T.headH; continue; }
    if (r.kind === 'spacer') { r.h = T.spacerH; continue; }
    const lab = r.cells[0];
    ctx.font = lab.font;
    lab.lines = pic_wrap(ctx, lab.t, widths[0] - 2 * T.padX);
    const lh = r.kind === 'pmo' ? T.lPmo : T.lBand;
    r.h = Math.max(T.rowH, lab.lines.length * lh + 6);
    r.lh = lh;
  }
  const title = (block.apLabel || '') + ' FY' + block.fy + ' - Spend Plan (PMO Summary, slide-ready)';
  ctx.font = pic_font(T.fTitle, true);
  const tableW = widths.reduce((a, b) => a + b, 0);
  const natW = Math.max(tableW, ctx.measureText(title).width + 2 * T.padX + 8);
  if (natW > tableW) widths[0] += natW - tableW;   // a title wider than the table widens the label column, so the bar covers the table
  const natH = T.titleH + rows.reduce((a, r) => a + r.h, 0);

  // the region and the scale: fit the width, then shrink further if the height would not fit (CONTRACT §10)
  const shown = model.shown && !model.shown.all ? String(model.shown.text || '') : '';
  const top = PIC_CUI_BAND + (shown ? PIC_SHOWN_H : 0) + 4;
  const region = { x: PIC_MARGIN, y: top, w: PIC_W - 2 * PIC_MARGIN, h: PIC_H - PIC_CUI_BAND - 4 - top };
  let scale = region.w / natW;
  if (natH * scale > region.h) scale = region.h / natH;
  const ox = region.x + (region.w - natW * scale) / 2, oy = region.y + (region.h - natH * scale) / 2;
  return { title, rows, widths, natW, natH, scale, ox, oy, region, shown, nCols: nNum + 1,
    box: { x: ox, y: oy, w: natW * scale, h: natH * scale },
    cui: { top: { y: 0, h: PIC_CUI_BAND }, bottom: { y: PIC_H - PIC_CUI_BAND, h: PIC_CUI_BAND } } };
}

// ---------------------------------------------------------------------------------------------------------------
// DRAWING
// ---------------------------------------------------------------------------------------------------------------
function pic_text(ctx, c, x, y, w, h, lines, lh) {
  if (!c.t) return;
  ctx.font = c.font;
  ctx.fillStyle = c.ink;
  ctx.textBaseline = 'middle';
  const T = PIC_T;
  const ls = lines || [c.t];
  const first = y + h / 2 - ((ls.length - 1) * (lh || 0)) / 2;
  ls.forEach((t, i) => {
    const yy = first + i * (lh || 0);
    if (c.swatch) {
      // a swatch beside a word (no caller draws one since the integration ruling; kept for a cell that asks)
      const tw = ctx.measureText(t).width, sw = 10, all = sw + 4 + tw;
      const sx = x + (w - all) / 2;
      ctx.fillStyle = c.swatch;
      ctx.fillRect(sx, yy - sw / 2, sw, sw);
      ctx.strokeStyle = PIC.grid; ctx.lineWidth = 0.75;
      ctx.strokeRect(sx, yy - sw / 2, sw, sw);
      ctx.fillStyle = c.ink;
      ctx.textAlign = 'left';
      ctx.fillText(t, sx + sw + 4, yy);
      return;
    }
    if (c.align === 'l') { ctx.textAlign = 'left'; ctx.fillText(t, x + T.padX, yy); }
    else if (c.align === 'r') { ctx.textAlign = 'right'; ctx.fillText(t, x + w - T.padX, yy); }
    else { ctx.textAlign = 'center'; ctx.fillText(t, x + w / 2, yy); }
  });
}

SP.blockCanvas = function blockCanvas(block, model) {
  if (!block || !model || !Array.isArray(model.cols)) throw new Error('There is no block to draw.');
  const cv = document.createElement('canvas');
  cv.width = PIC_W; cv.height = PIC_H;
  const ctx = cv.getContext && cv.getContext('2d');
  if (!ctx) throw new Error('This browser cannot draw pictures (it has no canvas), so no picture was made.');
  ctx.fillStyle = PIC.white;
  ctx.fillRect(0, 0, PIC_W, PIC_H);
  const L = pic_layout(ctx, block, model);
  // the CUI marking, top and bottom, outside the table's region (§6 item 14)
  ctx.fillStyle = '#000000';
  ctx.font = pic_font(PIC_CUI_PX, true);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(SP.CUI, PIC_W / 2, PIC_CUI_BAND / 2);
  ctx.fillText(SP.CUI, PIC_W / 2, PIC_H - PIC_CUI_BAND / 2);
  // what the picture shows, when not everything is shown (§4.3): a slide is a product too
  if (L.shown) {
    ctx.fillStyle = PIC.filtered;
    ctx.font = pic_font(16, true, true);
    ctx.textAlign = 'left';
    ctx.fillText(L.shown, PIC_MARGIN, PIC_CUI_BAND + PIC_SHOWN_H / 2 + 2, PIC_W - 2 * PIC_MARGIN);
  }
  ctx.save();
  ctx.setTransform(L.scale, 0, 0, L.scale, L.ox, L.oy);
  const T = PIC_T, W = L.natW;
  // the title bar
  ctx.fillStyle = PIC.navy;
  ctx.fillRect(0, 0, W, T.titleH);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, W, T.titleH); ctx.clip();
  ctx.fillStyle = PIC.white; ctx.font = pic_font(T.fTitle, true); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(L.title, T.padX + 4, T.titleH / 2);
  ctx.restore();
  ctx.strokeStyle = PIC.box; ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, W - 2, T.titleH - 2);
  // the rows
  let y = T.titleH;
  for (const r of L.rows) {
    if (r.kind === 'spacer') { y += r.h; continue; }
    let x = 0;
    r.cells.forEach((c, j) => {
      const w = L.widths[j];
      if (c.fill) { ctx.fillStyle = c.fill; ctx.fillRect(x, y, w, r.h); }
      pic_text(ctx, c, x, y, w, r.h, j === 0 && c.lines ? c.lines : null, r.lh);
      if (r.kind === 'head') { ctx.strokeStyle = PIC.box; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, r.h - 2); }
      else { ctx.strokeStyle = PIC.grid; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, r.h - 1); }
      x += w;
    });
    y += r.h;
  }
  ctx.restore();
  return cv;
};

// THE PNG'S RESOLUTION. A canvas writes no pHYs chunk, and Office places a PNG without one at 96 dpi: 2000 x 675 px came
// out 20.83 x 7.03 in, larger than a 13.33 x 7.5 in slide, and its size on the slide was whatever PowerPoint's
// shrink-to-fit made of it (review XP-7). One pHYs chunk saying 150 dpi (5906 px a metre) goes right after IHDR, before
// any image data, as the PNG specification orders it; one already there is replaced, never doubled.
const PIC_PPM = Math.round(150 / 0.0254);   // 5906
const PIC_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function pic_crc(u8, from, to) {
  let c = 0xFFFFFFFF;
  for (let i = from; i < to; i++) c = PIC_CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
// a PNG's bytes -> the same with one pHYs of 150 dpi; anything that is not a PNG with IHDR first comes back unchanged
function pic_withDpi(u8) {
  const sig = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
  if (!(u8 instanceof Uint8Array) || u8.length < 33 || sig.some((b, i) => u8[i] !== b)) return u8;
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const type = i => String.fromCharCode(u8[i + 4], u8[i + 5], u8[i + 6], u8[i + 7]);
  if (type(8) !== 'IHDR') return u8;
  const keep = [];          // [from, to) runs of the original bytes to keep (the signature too), any pHYs left out
  let i = 8, run = 0;
  while (i + 12 <= u8.length) {
    const len = dv.getUint32(i), end = i + 12 + len;
    if (end > u8.length) return u8;
    if (type(i) === 'pHYs') { keep.push([run, i]); run = end; }
    i = end;
    if (type(i - 12 - len) === 'IEND') break;
  }
  keep.push([run, u8.length]);
  const ch = new Uint8Array(21);
  const cv = new DataView(ch.buffer);
  cv.setUint32(0, 9); ch.set([0x70, 0x48, 0x59, 0x73], 4);   // length 9, 'pHYs'
  cv.setUint32(8, PIC_PPM); cv.setUint32(12, PIC_PPM); ch[16] = 1;   // px per metre, x and y; unit: the metre
  cv.setUint32(17, pic_crc(ch, 4, 17));
  const ihdrEnd = 8 + 12 + dv.getUint32(8);
  const total = keep.reduce((a, [f, t]) => a + t - f, 0) + ch.length;
  const out = new Uint8Array(total);
  let o = 0;
  for (const [f, t] of keep) {
    // the chunk goes in right after IHDR, which the first run of kept bytes always holds
    if (f <= ihdrEnd && ihdrEnd <= t) {
      out.set(u8.subarray(f, ihdrEnd), o); o += ihdrEnd - f;
      out.set(ch, o); o += ch.length;
      out.set(u8.subarray(ihdrEnd, t), o); o += t - ihdrEnd;
    } else { out.set(u8.subarray(f, t), o); o += t - f; }
  }
  return out;
}

// The PNG is encoded with toDataURL, synchronously, not with toBlob. Measured at integration in Chromium on the real
// workbook: with the Slide blocks view on screen, toBlob on a canvas that is not in the page waited about a second
// for the browser's idle time on every picture (Save all pictures took 17 s for 11 blocks); toDataURL takes about 20 ms.
// toBlob stays as the way out for a browser whose toDataURL does not give a PNG.
function pic_dataUrlBlob(url) {
  const i = url.indexOf(',');
  if (!/^data:image\/png;base64,/.test(url.slice(0, i + 1))) return null;
  const bin = atob(url.slice(i + 1));
  const a = new Uint8Array(bin.length);
  for (let k = 0; k < bin.length; k++) a[k] = bin.charCodeAt(k);
  return new Blob([pic_withDpi(a)], { type: 'image/png' });
}
SP.blockPng = function blockPng(block, model) {
  return new Promise((resolve, reject) => {
    let cv;
    try { cv = SP.blockCanvas(block, model); } catch (e) { reject(e); return; }
    const fail = () => new Error('The picture of ' + block.apLabel + ' FY' + block.fy + ' could not be made into a PNG.');
    if (typeof cv.toDataURL === 'function') {
      let b = null;
      try { b = pic_dataUrlBlob(cv.toDataURL('image/png')); } catch (e) { b = null; }
      if (b) { resolve(b); return; }
    }
    if (typeof cv.toBlob !== 'function') { reject(new Error('This browser cannot turn a drawing into a PNG, so no picture was made.')); return; }
    cv.toBlob(b => {
      if (!b) { reject(fail()); return; }
      b.arrayBuffer().then(ab => resolve(new Blob([pic_withDpi(new Uint8Array(ab))], { type: 'image/png' })), () => resolve(b));
    }, 'image/png');
  });
};

// The clipboard. The PNG goes to the clipboard as a PROMISE: Safari honours a write only when it starts in the click
// itself, and drawing first would end that. Where the browser refuses (no permission, an old browser, a locked-down
// profile), the reason is said in plain words and Save picture, which always works, is offered instead.
SP.copyBlockPicture = async function copyBlockPicture(block, model) {
  const name = (block && block.apLabel ? block.apLabel + ' FY' + block.fy : 'this block');
  const instead = ' Use Save picture to keep it as a file instead.';
  const cb = typeof navigator !== 'undefined' ? navigator.clipboard : null;
  if (!cb || typeof cb.write !== 'function' || typeof ClipboardItem !== 'function') {
    return { ok: false, message: 'This browser does not let a page put a picture on the clipboard, so the picture of ' + name + ' was not copied.' + instead };
  }
  const png = SP.blockPng(block, model);
  png.catch(() => {});      // the failure is reported once, below, never as an unhandled rejection besides
  try {
    await cb.write([new ClipboardItem({ 'image/png': png })]);
  } catch (e) {
    let why;
    try { await png; why = null; } catch (e2) { why = 'it could not be drawn: ' + ((e2 && e2.message) || e2); }
    if (!why) why = e && e.name === 'NotAllowedError' ? 'the browser did not allow this page to use the clipboard'
      : 'the clipboard refused it' + (e && e.message ? ': ' + e.message : '');
    return { ok: false, message: 'The picture of ' + name + ' was not copied: ' + why + '.' + instead };
  }
  // The browser re-encodes a clipboard picture and may drop its 150 dpi (review XP-7), so the size is said, not promised
  return { ok: true, message: 'The picture of ' + name + ' is on the clipboard (2000 x 675 px, drawn for 13.33 x 4.5 in): paste it into the slide;'
    + ' if it comes in larger, set its width to 13.33 in.' };
};

SP.allPicturesZip = async function allPicturesZip(model) {
  if (!model || !Array.isArray(model.blocks) || !model.blocks.length) throw new Error('There is no block to draw, so no pictures were made.');
  const files = [];
  for (const b of model.blocks) files.push({ name: b.apLabel + ' FY' + b.fy + '.png', data: await SP.blockPng(b, model) });
  return new Blob([await SP.zipFiles(files)], { type: 'application/zip' });
};
