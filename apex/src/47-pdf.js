// §33.5 THE PDF WRITER. A PDF made inside the page, with no library and no network: pages of text, rules, filled boxes and
// (at most a few) JPEG pictures. The text is real text in the two standard fonts every PDF reader carries (Helvetica and
// Helvetica-Bold), so a published spend plan can be searched and copied from, and a ten-page document is tens of
// kilobytes, where a picture of each page would be megabytes and unreadable to a screen reader.
//
// Two rules:
//   - A width is measured from the font's own table (PDF_W below), never guessed: a right-aligned dollar figure that is
//     two points off sits over the rule beside it. The table is Helvetica's advance widths in thousandths of the type
//     size, for the WinAnsi codes 32 to 255 (measured from Liberation Sans, which is metric-compatible by design).
//   - A character the font's encoding cannot hold is written as '?', never dropped: a title that lost a character in
//     silence would read as a different title.
//
//   SP.pdfTextWidth(text, size, bold) -> points
//   SP.pdfWrap(text, size, bold, maxWidth, maxLines) -> [lines]   (the last line ends '...' when the text did not fit)
//   SP.pdfBytes({title, pages: [{w, h, ops}], images: {name: Uint8Array of a JPEG}}) -> Uint8Array
//     ops, with x and y in points from the page's TOP LEFT (the writer turns y over, as PDF counts from the bottom):
//       {t: 'rect', x, y, w, h, fill, stroke, lw}          fill and stroke are '#RRGGBB' or absent
//       {t: 'line', x1, y1, x2, y2, stroke, lw}
//       {t: 'text', x, y, s, size, bold, color, align}     y is the baseline; align 'l' (default), 'c' or 'r' about x
//       {t: 'img', x, y, w, h, name}
// The same input gives the same bytes: nothing here reads a clock.

const PDF_W = Object.freeze({
  reg: [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,0,556,0,222,556,333,1000,556,556,333,1000,667,333,1000,0,611,0,0,222,222,333,333,350,556,1000,333,1000,500,333,944,0,500,667,278,333,556,556,556,556,260,556,333,737,370,556,584,333,737,552,400,549,333,333,333,576,537,333,333,333,365,556,834,834,834,611,667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,549,611,556,556,556,556,500,556,500],
  bold: [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,0,556,0,278,556,500,1000,556,556,333,1000,667,333,1000,0,611,0,0,278,278,500,500,350,556,1000,333,1000,556,333,944,0,500,667,278,333,556,556,556,556,280,556,333,737,370,556,584,333,737,552,400,549,333,333,333,576,556,333,333,333,365,556,834,834,834,611,722,722,722,722,722,722,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,556,556,556,556,556,278,278,278,278,611,611,611,611,611,611,611,549,611,611,611,611,611,556,611,556],
});
// the characters WinAnsi keeps at 128 to 159, where Unicode has them elsewhere
const PDF_HIGH = Object.freeze({ 0x20AC: 128, 0x201A: 130, 0x0192: 131, 0x201E: 132, 0x2026: 133, 0x2020: 134, 0x2021: 135, 0x02C6: 136,
  0x2030: 137, 0x0160: 138, 0x2039: 139, 0x0152: 140, 0x017D: 142, 0x2018: 145, 0x2019: 146, 0x201C: 147, 0x201D: 148, 0x2022: 149,
  0x2013: 150, 0x2014: 151, 0x02DC: 152, 0x2122: 153, 0x0161: 154, 0x203A: 155, 0x0153: 156, 0x017E: 158, 0x0178: 159 });
// text -> its WinAnsi codes. A tab, a line break and a no-break space are a space; anything the encoding lacks is '?'
function pdf_codes(text) {
  const out = [];
  for (const ch of String(text === null || text === undefined ? '' : text)) {
    const cp = ch.codePointAt(0);
    let b;
    if (cp === 9 || cp === 10 || cp === 13 || cp === 0xA0) b = 32;
    else if (cp >= 32 && cp <= 126) b = cp;
    else if (cp >= 161 && cp <= 255) b = cp;
    else if (Object.prototype.hasOwnProperty.call(PDF_HIGH, cp)) b = PDF_HIGH[cp];
    else if (cp < 32 || cp === 127) continue;            // a control character draws nothing
    else b = 63;
    out.push(b);
  }
  return out;
}
function pdf_w(codes, size, bold) {
  const T = bold ? PDF_W.bold : PDF_W.reg;
  let w = 0;
  for (const b of codes) w += T[b - 32] || 0;
  return w * size / 1000;
}
SP.pdfTextWidth = function pdfTextWidth(text, size, bold) { return pdf_w(pdf_codes(text), size, !!bold); };

// Wrap on spaces; a single word wider than the line is broken where it fills it (a CCaR title with no space must not run
// into the next column). With maxLines, what did not fit is cut and the last line ends '...', so the reader sees it was.
SP.pdfWrap = function pdfWrap(text, size, bold, maxW, maxLines) {
  const words = String(text === null || text === undefined ? '' : text).replace(/\s+/g, ' ').trim().split(' ').filter(x => x !== '');
  const W = s => SP.pdfTextWidth(s, size, bold);
  const lines = [];
  let cur = '';
  const push = s => { lines.push(s); };
  for (let word of words) {
    for (;;) {
      const tryLine = cur ? cur + ' ' + word : word;
      if (W(tryLine) <= maxW) { cur = tryLine; break; }
      if (cur) { push(cur); cur = ''; continue; }
      // the word alone is too wide: take as many characters as fit (at least one, or a narrow column would loop for ever)
      let n = 1;
      const chars = [...word];
      while (n < chars.length && W(chars.slice(0, n + 1).join('')) <= maxW) n++;
      push(chars.slice(0, n).join(''));
      word = chars.slice(n).join('');
      if (!word) break;
    }
  }
  if (cur) push(cur);
  if (maxLines && lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (last && W(last + '...') > maxW) last = last.slice(0, -1);
    kept[maxLines - 1] = last.replace(/\s+$/, '') + '...';
    return kept;
  }
  return lines;
};

function pdf_n(x) {
  if (typeof x !== 'number' || !isFinite(x)) throw new Error('pdfBytes: a position or size is not a number');
  const s = (Math.round(x * 100) / 100).toFixed(2).replace(/\.?0+$/, '');
  return s === '-0' || s === '' ? '0' : s;
}
function pdf_rgb(hex, what) {
  const m = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(String(hex));
  if (!m) throw new Error('pdfBytes: ' + what + ' is not a colour written #RRGGBB');
  return [1, 2, 3].map(i => String(Math.round(parseInt(m[i], 16) / 255 * 1000) / 1000)).join(' ');
}
// a text string as PDF writes it: ( ) and \ escaped, and every code above 126 as \ooo, so the stream stays plain ASCII
function pdf_str(codes) {
  let s = '(';
  for (const b of codes) {
    if (b === 40 || b === 41 || b === 92) s += '\\' + String.fromCharCode(b);
    else if (b > 126) s += '\\' + b.toString(8).padStart(3, '0');
    else s += String.fromCharCode(b);
  }
  return s + ')';
}
// A JPEG's width, height and number of colour components, read from its frame header (SOF0 to SOF15, less the three
// markers in that range that are not frame headers). Anything else is not a JPEG this writer can place.
SP.jpegInfo = function jpegInfo(u8) {
  if (!u8 || u8.length < 4 || u8[0] !== 0xFF || u8[1] !== 0xD8) return null;
  let i = 2;
  while (i + 9 < u8.length) {
    if (u8[i] !== 0xFF) return null;
    const m = u8[i + 1];
    if (m === 0xFF) { i++; continue; }
    if (m === 0xD8 || (m >= 0xD0 && m <= 0xD7) || m === 0x01) { i += 2; continue; }
    const len = (u8[i + 2] << 8) | u8[i + 3];
    if (len < 2) return null;
    if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) {
      const h = (u8[i + 5] << 8) | u8[i + 6], w = (u8[i + 7] << 8) | u8[i + 8], n = u8[i + 9];
      return w > 0 && h > 0 && (n === 1 || n === 3) ? { w, h, n } : null;
    }
    i += 2 + len;
  }
  return null;
};

SP.pdfBytes = function pdfBytes(doc) {
  if (!doc || !Array.isArray(doc.pages) || !doc.pages.length) throw new Error('pdfBytes: a document needs at least one page');
  const imgs = doc.images && typeof doc.images === 'object' ? doc.images : {};
  const imgNames = Object.keys(imgs).filter(k => Object.prototype.hasOwnProperty.call(imgs, k));
  const imgInfo = {};
  imgNames.forEach((k, i) => {
    const info = SP.jpegInfo(imgs[k]);
    if (!info) throw new Error('pdfBytes: the picture "' + k + '" is not a JPEG this writer can place');
    imgInfo[k] = Object.assign({ id: 'Im' + (i + 1) }, info);
  });
  // objects: 1 catalog, 2 pages, 3 Helvetica, 4 Helvetica-Bold, 5 info, then the pictures, then a page and its content each
  const objs = [];                         // each: a string, or {dict, bytes} for a stream with binary data
  const add = o => { objs.push(o); return objs.length; };
  add(null); add(null);
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  add('<< /Title ' + pdf_str(pdf_codes(doc.title || '')) + ' /Producer (APEX) >>');
  const imgObj = {};
  for (const k of imgNames) {
    const f = imgInfo[k];
    imgObj[k] = add({ dict: '<< /Type /XObject /Subtype /Image /Width ' + f.w + ' /Height ' + f.h + ' /ColorSpace /'
      + (f.n === 1 ? 'DeviceGray' : 'DeviceRGB') + ' /BitsPerComponent 8 /Filter /DCTDecode /Length ' + imgs[k].length + ' >>', bytes: imgs[k] });
  }
  const xo = imgNames.length ? ' /XObject << ' + imgNames.map(k => '/' + imgInfo[k].id + ' ' + imgObj[k] + ' 0 R').join(' ') + ' >>' : '';
  const kids = [];
  for (const pg of doc.pages) {
    const H = pg.h, W = pg.w;
    if (!(W > 0 && H > 0) || !Array.isArray(pg.ops)) throw new Error('pdfBytes: a page needs a width, a height and a list of ops');
    // the page's drawing, with the fill colour, stroke colour and line width written only when they change: a spend plan
    // page is two thousand cells, and saying each one's colours again made a thirteen-page document half a megabyte
    const c = [];
    let fill = '', stroke = '', lw = '';
    const setFill = hex => { const v = pdf_rgb(hex, 'a colour'); if (v !== fill) { fill = v; c.push(v + ' rg'); } };
    const setStroke = (hex, w) => {
      const v = pdf_rgb(hex, 'a stroke'), ww = pdf_n(w || 0.5);
      if (v !== stroke) { stroke = v; c.push(v + ' RG'); }
      if (ww !== lw) { lw = ww; c.push(ww + ' w'); }
    };
    for (const o of pg.ops) {
      if (o.t === 'rect') {
        if (!o.fill && !o.stroke) continue;
        if (o.fill) setFill(o.fill);
        if (o.stroke) setStroke(o.stroke, o.lw);
        c.push(pdf_n(o.x) + ' ' + pdf_n(H - o.y - o.h) + ' ' + pdf_n(o.w) + ' ' + pdf_n(o.h) + ' re ' + (o.fill && o.stroke ? 'B' : o.fill ? 'f' : 'S'));
      } else if (o.t === 'line') {
        setStroke(o.stroke || '#000000', o.lw);
        c.push(pdf_n(o.x1) + ' ' + pdf_n(H - o.y1) + ' m ' + pdf_n(o.x2) + ' ' + pdf_n(H - o.y2) + ' l S');
      } else if (o.t === 'text') {
        const codes = pdf_codes(o.s);
        if (!codes.length) continue;
        const size = o.size || 8, bold = !!o.bold, w = pdf_w(codes, size, bold);
        const x = o.align === 'r' ? o.x - w : o.align === 'c' ? o.x - w / 2 : o.x;
        setFill(o.color || '#000000');
        c.push('BT /' + (bold ? 'F2' : 'F1') + ' ' + pdf_n(size) + ' Tf ' + pdf_n(x) + ' ' + pdf_n(H - o.y) + ' Td ' + pdf_str(codes) + ' Tj ET');
      } else if (o.t === 'img') {
        if (!imgInfo[o.name]) throw new Error('pdfBytes: a page places the picture "' + o.name + '", which was not given');
        c.push('q ' + pdf_n(o.w) + ' 0 0 ' + pdf_n(o.h) + ' ' + pdf_n(o.x) + ' ' + pdf_n(H - o.y - o.h) + ' cm /' + imgInfo[o.name].id + ' Do Q');
      } else throw new Error('pdfBytes: an op of kind ' + JSON.stringify(o.t) + ' is not one this writer draws');
    }
    const body = c.join('\n') + '\n';
    const content = add('<< /Length ' + body.length + ' >>\nstream\n' + body + 'endstream');
    kids.push(add('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pdf_n(W) + ' ' + pdf_n(H) + '] /Resources << /Font << /F1 3 0 R /F2 4 0 R >>'
      + xo + ' >> /Contents ' + content + ' 0 R >>'));
  }
  // what a reader is told about printing: take the paper the page is (so a landscape page is printed landscape, never
  // turned onto a portrait sheet and shrunk), and when printing both sides flip on the short edge, as landscape reads
  objs[0] = '<< /Type /Catalog /Pages 2 0 R /ViewerPreferences << /PickTrayByPDFSize true /Duplex /DuplexFlipShortEdge >> >>';
  objs[1] = '<< /Type /Pages /Count ' + kids.length + ' /Kids [' + kids.map(k => k + ' 0 R').join(' ') + '] >>';
  // the file: every string is ASCII by construction (pdf_str), so a character is a byte; picture bytes go in as they are
  const parts = [];
  let at = 0;
  const put = s => { const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 0xFF; parts.push(u); at += u.length; };
  const raw = u => { parts.push(u); at += u.length; };
  put('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  const offs = [];
  objs.forEach((o, i) => {
    offs.push(at);
    put((i + 1) + ' 0 obj\n');
    if (typeof o === 'string') put(o + '\n');
    else { put(o.dict + '\nstream\n'); raw(o.bytes); put('\nendstream\n'); }
    put('endobj\n');
  });
  const xref = at;
  put('xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n' + offs.map(n => String(n).padStart(10, '0') + ' 00000 n \n').join(''));
  put('trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R /Info 5 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
  const out = new Uint8Array(at);
  let p = 0;
  for (const u of parts) { out.set(u, p); p += u.length; }
  return out;
};
