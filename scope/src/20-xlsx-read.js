// §2 XLSX-READ — the .xlsx and .csv readers (CONTRACT §3).
//
// readXlsx is a port of ORBIT's xlsxRead (prioritization-board-grid.html, §24 READING WORKBOOKS, with its _xunesc,
// _xdecode and XML_BADCH): the same bounded reads, the same plain messages, native DecompressionStream and no library.
// Credit to that reader; what it learned the hard way is kept below in its own words. Added here: date1904, the cell
// types b, e and d, a row number read from the row itself, cells written without a reference, rows written as
// <row …/>, rich-text inline strings, phonetic runs left out of shared strings, and element names with a namespace
// prefix (the Open XML SDK writes <x:row>).

// XML text back to characters. &amp; LAST: decoded first, the literal text "&lt;" would be turned into "&lt;" and then
// into "<" by the following pass - one decode too many, and silent.
function xr_unesc(t) {
  return String(t == null ? '' : t)
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, h) => xr_fromCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => xr_fromCode(Number(d)))
    .replace(/&amp;/g, '&');
}
function xr_fromCode(n) { return n >= 0 && n <= 0x10FFFF ? String.fromCodePoint(n) : '\uFFFD'; }
// characters a workbook cannot hold (ORBIT's XML_BADCH)
const XR_BADCH = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/;
// OOXML'S OWN ESCAPE, _xHHHH_, IS READ AS THE CHARACTER IT STANDS FOR (ORBIT v2.02, E2). A part spells a character XML
// cannot hold as _x + four hex digits + _, and a literal underscore that would begin one as _x005F_. Only lower-case x,
// exactly four digits and the closing underscore decode, read once left to right: _x005F_x0041_ is the text _x0041_,
// never "A". Two codes that make one character (a surrogate pair) decode together. A code for a character a workbook
// cannot hold -- or half of a pair -- is KEPT AS WRITTEN, never dropped and never turned into a character the tool would
// then carry invisibly.
function xr_decode(t, n) {
  const s = String(t == null ? '' : t);
  if (s.indexOf('_x') < 0) return s;
  const re = /_x([0-9A-Fa-f]{4})_/g, one = /^_x([0-9A-Fa-f]{4})_/;
  let out = '', at = 0, m;
  while ((m = re.exec(s))) {
    const u = parseInt(m[1], 16);
    let ch = null, end = re.lastIndex;
    if (u >= 0xD800 && u <= 0xDBFF) {
      const m2 = one.exec(s.slice(end)), v = m2 ? parseInt(m2[1], 16) : -1;
      if (v >= 0xDC00 && v <= 0xDFFF) { ch = String.fromCharCode(u, v); end += m2[0].length; re.lastIndex = end; }
    } else if (!(u >= 0xDC00 && u <= 0xDFFF) && !XR_BADCH.test(String.fromCharCode(u))) ch = String.fromCharCode(u);
    if (ch === null) { if (n) n.kept++; continue; }
    out += s.slice(at, m.index) + ch; at = end;
    if (n) n.dec++;
  }
  return out + s.slice(at);
}
// every <t> of a string item, in order; a phonetic reading (<rPh>) is a pronunciation guide, not part of the text
function xr_runs(xml, txt) {
  let s = '';
  const body = String(xml).replace(/<(?:\w+:)?rPh\b[\s\S]*?<\/(?:\w+:)?rPh>/g, '');
  for (const tm of body.matchAll(/<(?:\w+:)?t\b([^>]*?)(\/>|>([\s\S]*?)<\/(?:\w+:)?t>)/g)) if (tm[2] !== '/>') s += tm[3];
  return txt(s);
}
// spreadsheet column letters -> zero-based index (A -> 0)
function xr_colIndex(letters) {
  let ci = 0;
  for (const ch of letters.toUpperCase()) ci = ci * 26 + (ch.charCodeAt(0) - 64);
  return ci - 1;
}
const XR_MAXCOL = 16384;   // XFD: a reference past it is not a worksheet cell, and an array that long is a damaged file

// A FILE WITH NO ZIP DIRECTORY, SAID AS WHAT IT IS. Every such file used to be called "possibly truncated; export it
// again" -- the wrong advice for an old .xls, a web page some system named .xls, a CSV named .xlsx or a saved plan, none
// of which a fresh export fixes (review IMP-10). Only a file that starts like a zip and has lost its end is truncated.
const XR_OLE2 = [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1];
function xr_isOle2(u) { return u.length >= 8 && XR_OLE2.every((b, i) => u[i] === b); }
// A STREAM OF AN OLE2 COMPOUND FILE, by name. An .xlsx encrypted with a password, or by a sensitivity label that encrypts
// (likely for a CUI workbook), is an OLE2 file too, holding EncryptedPackage. Called "an Excel 97–2003 workbook", it sent
// the person to save it again as .xlsx, which keeps the encryption: advice that loops (review F3). A directory entry is
// 128 bytes, its name in UTF-16LE, the name's length in bytes (closing zero included) at byte 64, and every entry sits on
// a 128-byte step from the end of the 512-byte header, whatever the sector size. Bounded by the file: nothing is followed.
function xr_oleHas(u, name) {
  const len = (name.length + 1) * 2;
  outer: for (let p = 512; p + 128 <= u.length; p += 128) {
    if (u[p + 64] !== len || u[p + 65] !== 0) continue;
    for (let k = 0; k < name.length; k++) if (u[p + 2 * k] !== name.charCodeAt(k) || u[p + 2 * k + 1] !== 0) continue outer;
    return true;
  }
  return false;
}
// what an OLE2 file is, and what to do about it, in words: {what, advice}
function xr_oleWhat(u) {
  if (xr_oleHas(u, 'EncryptedPackage')) return {
    enc: true, what: 'an encrypted Office file (a password, or a sensitivity label that encrypts, protects it), which this tool cannot read',
    advice: ' Saving it again in Excel keeps the encryption. Import a copy that is not encrypted: export the pull from CCaR again, or, '
      + 'where you may, remove the password in Excel (File › Info › Protect Workbook › Encrypt with Password) and save it.' };
  return { what: 'an Excel 97–2003 workbook (.xls), which this tool does not read',
    advice: ' Open it in Excel, save it as an Excel Workbook (.xlsx), and import that.' };
}
// TEXT IN UTF-16. Excel's "Unicode Text" and the "CSV (Unicode)" some reporting servers write are UTF-16, which says so
// with a byte-order mark (FF FE or FE FF); a writer that leaves the mark out leaves every other byte of English text zero.
// Read as Windows-1252, the header became "ÿþF\0Y\0…": the file was refused for having no header row, and the report said
// it had been read as Windows-1252 (review F2). Without the mark, NUL is valid UTF-8, so it was read as UTF-8 and refused
// with no note at all. No UTF-8 or Windows-1252 CSV holds a NUL byte, let alone every other byte. null when it is neither.
function xr_utf16Of(u) {
  if (u.length >= 2 && u[0] === 0xFF && u[1] === 0xFE) return { enc: 'utf-16le', bom: true };
  if (u.length >= 2 && u[0] === 0xFE && u[1] === 0xFF) return { enc: 'utf-16be', bom: true };
  const n = Math.min(u.length, 8192) & ~1;
  if (n < 4) return null;
  let ze = 0, zo = 0;
  for (let i = 0; i < n; i += 2) { if (u[i] === 0) ze++; if (u[i + 1] === 0) zo++; }
  const pairs = n / 2;
  if (zo * 4 >= pairs && ze * 10 <= zo) return { enc: 'utf-16le', bom: false };
  if (ze * 4 >= pairs && zo * 10 <= ze) return { enc: 'utf-16be', bom: false };
  return null;
}
SP.utf16Of = xr_utf16Of;
// A FILE NAMED .csv THAT IS NOT TEXT AT ALL. Read as text, a real .xlsx named .csv became Windows-1252 noise, was refused
// for having no header row, and the report said it had been read as Windows-1252, with no word that it is a workbook
// (review F3). '' when the bytes may be text.
SP.notCsvWhy = function notCsvWhy(u) {
  const csv = 'it is not CSV text, though its name ends .csv: it is ';
  if (u.length >= 4 && u[0] === 0x50 && u[1] === 0x4B && (u[2] === 3 || u[2] === 5) && (u[3] === 4 || u[3] === 6)) {
    return csv + 'a ZIP file, as an Excel Workbook (.xlsx) is. If it is a workbook, give it a name ending .xlsx and import it again';
  }
  if (xr_isOle2(u)) { const o = xr_oleWhat(u); return csv + o.what + '.' + o.advice.replace(/\.$/, ''); }
  return '';
};
function xr_notZip(u) {
  const no = 'That file is not an .xlsx workbook: ';
  const asXlsx = ' Open it in Excel, save it as an Excel Workbook (.xlsx), and import that.';
  // an encrypted workbook is a workbook: it is said to be encrypted, never "not an .xlsx"
  if (xr_isOle2(u)) { const o = xr_oleWhat(u); return (o.enc ? 'That file is ' : no + 'it is ') + o.what + '.' + o.advice; }
  if (u.length >= 2 && u[0] === 0x50 && u[1] === 0x4B) {
    return 'That file is not an .xlsx workbook (no ZIP end-of-directory record). It starts like one, so it was most '
      + 'likely cut short in a download or a copy; export it again and retry.';
  }
  const n = Math.min(u.length, 8192), t16 = xr_utf16Of(u);
  const raw = t16 ? new TextDecoder(t16.enc).decode(u.subarray(0, n & ~1)) : new TextDecoder('utf-8').decode(u.subarray(0, n));
  const head = raw.replace(/^﻿/, '').replace(/^\s+/, '');
  if (/<meta\s+name=["']?sfcb-spend-plan["'\s>]/i.test(head)) {
    return no + 'it is a saved SCOPE plan, not a CCaR pull. To bring that plan into this page, import the plan file on its '
      + 'own: the page then offers to take its pulls, history and settings.';
  }
  if (/^<\?xml[\s\S]{0,4000}urn:schemas-microsoft-com:office:spreadsheet/i.test(head)) {
    return no + 'it is an Excel 2003 XML Spreadsheet.' + asXlsx;
  }
  // Excel's and reporting servers' "Single File Web Page" (MHTML) starts with mail headers, not a tag: called "plain text,
  // rename it .csv", it was refused again for having no header row (review F3)
  if (/^MIME-Version[ \t]*:/i.test(head) || /^(?:[\w-]+[ \t]*:[^\r\n]*\r?\n)*Content-Type[ \t]*:[ \t]*multipart\/related/i.test(head)) {
    return no + 'it is a web archive (a Single File Web Page, .mht). Excel and some reporting systems save a table this way and name it .xls.' + asXlsx;
  }
  // an XML declaration, comments and a doctype say nothing about what follows: an XHTML table starts "<?xml", a page
  // some server wrote may start with a comment, and each was called plain text (review F3)
  const body = head.replace(/^(?:<\?xml[^>]*\?>\s*|<!--[\s\S]*?-->\s*)+/i, '');
  if (/^<(?:!doctype\s+html|html|head|body|table|meta|style|div)\b/i.test(body)) {
    return no + 'it is a web page (HTML). Some systems save a table this way and name it .xls.' + asXlsx;
  }
  // text: no NUL and nearly every character printable or a line break. UTF-16 is judged on its characters, not its bytes:
  // every other byte of it is zero, and a UTF-16 CSV named .xlsx was told it "may have been truncated" (review F3).
  let ctl = 0;
  if (t16) { for (let i = 0; i < head.length; i++) { const c = head.charCodeAt(i); if (c < 9 || (c > 13 && c < 32)) ctl++; } }
  else for (let i = 0; i < n; i++) { const b = u[i]; if (b === 0) { ctl = n; break; } if (b < 9 || (b > 13 && b < 32)) ctl++; }
  if (ctl * 50 < (t16 ? Math.max(1, head.length) : n)) {
    return no + 'it is plain text' + (t16 ? ' (UTF-16)' : '') + '. If it is a CSV export, give it a name ending .csv and import it again.';
  }
  return 'That file is not an .xlsx workbook (no ZIP end-of-directory record), and it is not a kind of file this tool '
    + 'recognises. If it came from a download, it may have been truncated; export it again and retry.';
}
// A ZIP FILE THAT HOLDS NO WORKBOOK AT ALL is not a damaged workbook: its directory was read whole. Called "most likely
// damaged or incompletely downloaded; export it again", a zipped CSV named .xlsx sent the person to export once more a file
// that was never a workbook (review F3). It is said for what it holds.
async function xr_zipWhat(entries, get) {
  const no = 'That file is not an .xlsx workbook: ';
  let mime = '';
  try { mime = String((await get('mimetype')) || '').trim(); } catch (e) { mime = ''; }
  if (/opendocument\.spreadsheet/i.test(mime)) return no + 'it is an OpenDocument spreadsheet (.ods). Open it in Excel or LibreOffice, save it as an Excel Workbook (.xlsx), and import that.';
  if (entries.has('word/document.xml')) return no + 'it is a Word document (.docx). Export the pull from CCaR as an Excel Workbook (.xlsx) or a CSV, and import that.';
  if (entries.has('ppt/presentation.xml')) return no + 'it is a PowerPoint presentation (.pptx). Export the pull from CCaR as an Excel Workbook (.xlsx) or a CSV, and import that.';
  const files = [...entries.keys()].filter(k => k && !k.endsWith('/'));
  const cut = s => (s.length > 80 ? s.slice(0, 79) + '…' : s);
  const list = files.slice(0, 5).map(s => '“' + cut(s) + '”').join(', ') + (files.length > 5 ? ' and ' + (files.length - 5) + ' more' : '');
  const inner = files.some(k => /\.(csv|xlsx)$/i.test(k));
  return no + 'it is a ZIP file holding ' + (files.length ? list : 'nothing') + ', not a workbook.'
    + (inner ? ' If the pull is the file inside, take it out of the ZIP file (in Windows: right-click › Extract All) and import that.'
      : ' Export the pull from CCaR as an Excel Workbook (.xlsx) or a CSV, and import that.');
}

// EVERY OFFSET BELOW COMES OUT OF THE FILE ITSELF, so a truncated or damaged workbook can point anywhere. Unchecked, a
// DataView read past the end throws "Offset is outside the bounds of the DataView" -- true, and useless to someone who
// just wants to know their CCaR pull did not survive the download. Each read is bounded, and each failure says what is
// wrong with the file.
async function readXlsx(buf) {
  // ArrayBuffer by its tag, not instanceof: a buffer made in another realm (a test, a worker) is still a buffer
  let u;
  if (Object.prototype.toString.call(buf) === '[object ArrayBuffer]') u = new Uint8Array(buf);
  else if (ArrayBuffer.isView(buf)) u = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  else throw new Error('That file could not be read \u2014 no bytes were given to the reader.');
  const dv = new DataView(u.buffer, u.byteOffset, u.byteLength);
  const SZ = u.length;
  const BAD = why => new Error('That file is not a readable .xlsx — ' + why
    + '. It is most likely damaged or incompletely downloaded; export it again and retry.');
  const need = (off, len, why) => { if (!(off >= 0 && off + len <= SZ)) throw BAD(why); };
  // The end-of-directory record is the last 22 bytes plus a comment of at most 65,535: looking further back only finds
  // the same four bytes inside compressed data and reads garbage as a directory.
  let e = -1;
  for (let i = SZ - 22, lo = Math.max(0, SZ - 22 - 65535); i >= lo; i--) { if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; } }
  if (e < 0) throw new Error(SZ === 0 ? 'That file is empty — nothing was read.' : xr_notZip(u));
  need(e, 22, 'its end-of-directory record runs past the end of the file');
  const cnt = dv.getUint16(e + 10, true), cdOff = dv.getUint32(e + 16, true);
  if (cnt === 0xFFFF || cdOff === 0xFFFFFFFF) throw BAD('it is written in the ZIP64 format, which this reader does not read');
  need(cdOff, 4, 'its directory starts at byte ' + cdOff + ', past the end of a ' + SZ + '-byte file');
  // keyed by names out of the file: a Map, so an entry named __proto__ is an entry and not the prototype of the table
  const entries = new Map();
  let p = cdOff;
  for (let k = 0; k < cnt; k++) {
    // A corrupt entry count would otherwise walk off the end one header at a time.
    need(p, 46, 'its directory claims ' + cnt + ' entries but runs out of file after ' + k);
    if (dv.getUint32(p, true) !== 0x02014b50) throw BAD('its directory is damaged at entry ' + (k + 1) + ' of ' + cnt);
    const nlen = dv.getUint16(p + 28, true), elen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true);
    need(p + 46, nlen, 'a name in its directory runs past the end of the file');
    entries.set(new TextDecoder().decode(u.subarray(p + 46, p + 46 + nlen)),
      { comp: dv.getUint16(p + 10, true), csize: dv.getUint32(p + 20, true), off: dv.getUint32(p + 42, true) });
    p += 46 + nlen + elen + clen;
  }
  async function get(name) {
    const en = entries.get(name); if (!en) return null;
    need(en.off, 30, 'the entry for ' + name + ' points past the end of the file');
    if (dv.getUint32(en.off, true) !== 0x04034b50) throw BAD('the entry for ' + name + ' does not start where its directory says');
    const nlen = dv.getUint16(en.off + 26, true), elen = dv.getUint16(en.off + 28, true);
    const start = en.off + 30 + nlen + elen;
    need(start, en.csize, 'the data for ' + name + ' runs past the end of the file');
    const data = u.subarray(start, start + en.csize);
    let out;
    if (en.comp === 0) out = data;
    else if (en.comp !== 8) throw BAD(name + ' inside it is compressed with method ' + en.comp + ', which this reader does not read');
    else {
      try { out = await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer(); }
      catch (err) { throw BAD(name + ' inside it could not be decompressed'); }
    }
    // XML 1.0 §2.11: a line break written raw in a part is CR LF or CR, and every XML reader -- Excel's included -- reads
    // it as LF before anything else. Kept raw, a note typed in Excel with Alt+Enter arrives here as "\r\n" while Excel and
    // openpyxl show "\n" (the real v12 workbook carries seven). A CR meant to survive is written &#13; or _x000D_, and
    // those are decoded after this, so they still do.
    return new TextDecoder().decode(out).replace(/\r\n?/g, '\n');
  }
  // every text the reader takes -- shared strings, inline strings, a formula's text result, a sheet's name -- is XML
  // text first (xr_unesc) and OOXML's escaped string second (xr_decode), in that order, through this one reading
  const esc = { dec: 0, kept: 0 }, txt = x => xr_decode(xr_unesc(x), esc);
  const sst = [];
  const sx = await get('xl/sharedStrings.xml');
  if (sx) {
    for (const m of sx.matchAll(/<(?:\w+:)?si\b[^>]*?\/>|<(?:\w+:)?si\b[^>]*>([\s\S]*?)<\/(?:\w+:)?si>/g)) sst.push(m[1] === undefined ? '' : xr_runs(m[1], txt));
  }
  const wbx = await get('xl/workbook.xml');
  const rels = await get('xl/_rels/workbook.xml.rels');
  // A zip without these is a zip, not a workbook. Reading on would throw on null.matchAll and report a TypeError, which
  // says nothing about the file the person picked. An Excel Binary Workbook is a zip too: say what it is and what to do.
  if (!wbx && entries.has('xl/workbook.bin'))
    throw new Error('That file is an Excel Binary Workbook (.xlsb), which this tool does not read — open it in Excel and save it as an Excel Workbook (.xlsx), then import that.');
  // with no part under xl/ at all it was never a workbook; a workbook that lost xl/workbook.xml but kept the rest is damaged
  if (!wbx && ![...entries.keys()].some(k => /^xl\//i.test(k))) throw new Error(await xr_zipWhat(entries, get));
  if (!wbx) throw BAD('it contains no workbook part (xl/workbook.xml)');
  if (!rels) throw BAD('its workbook has no relationships part (xl/_rels/workbook.xml.rels)');
  const wbPr = /<(?:\w+:)?workbookPr\b([^>]*)>/.exec(wbx);
  const date1904 = !!(wbPr && /(?:^|\s)date1904="(?:1|true)"/i.test(wbPr[1]));
  // Attribute order is not guaranteed by the format, and a Target may be relative to xl/ with ../ segments.
  const relPath = t => {
    let v = xr_unesc(t).replace(/^\//, '');
    if (!/^xl\//.test(v)) v = 'xl/' + v;
    const parts = [];
    v.split('/').forEach(seg => { if (seg === '..') parts.pop(); else if (seg && seg !== '.') parts.push(seg); });
    return parts.join('/');
  };
  const rmap = new Map();
  for (const m of rels.matchAll(/<(?:\w+:)?Relationship\b([^>]*)>/g)) {
    const at = m[1];
    const id = (at.match(/(?:^|\s)Id="([^"]*)"/) || [])[1];
    const tg = (at.match(/(?:^|\s)Target="([^"]*)"/) || [])[1];
    if (id && tg) rmap.set(id, relPath(tg));
  }
  const sheets = [];
  // <sheet\b keeps this off <sheets> and <sheetPr>. Attributes are read one at a time so their order does not matter,
  // and the relationship id is taken under any namespace prefix.
  for (const m of wbx.matchAll(/<(?:\w+:)?sheet\b([^>]*?)\/?>/g)) {
    const at = m[1];
    const nameRaw = (at.match(/(?:^|\s)name="([^"]*)"/) || [])[1];
    if (nameRaw === undefined) continue;
    const rid = (at.match(/(?:^|\s)(?:[A-Za-z0-9_.-]+:)?id="([^"]*)"/) || [])[1];
    const state = (at.match(/(?:^|\s)state="([^"]*)"/) || [])[1] || 'visible';
    const name = txt(nameRaw);
    const part = rid ? rmap.get(rid) : null;
    if (!part) { sheets.push({ name, state, rows: [], rowNo: [], problem: 'the workbook names this sheet but does not say where its data is' }); continue; }
    const xml = await get(part);
    // a part named in the rels but absent from the zip is a broken workbook, not a quiet skip
    if (!xml) { sheets.push({ name, state, rows: [], rowNo: [], problem: 'its data (' + part + ') is missing from the file' }); continue; }
    const rows = [], rowNo = [], noResult = [];
    // <row …/> carries no cells: Excel writes one for a row that only has a height or a style. Without its own branch the
    // lazy body below would run on into the next row and swallow it.
    for (const rm of xml.matchAll(/<(?:\w+:)?row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?row>)/g)) {
      const cells = [];
      let maxc = 0, lastCi = -1;
      const rAttr = /(?:^|\s)r="(\d+)"/.exec(rm[1]);
      let rno = rAttr ? Number(rAttr[1]) : 0;
      for (const cm of (rm[2] || '').matchAll(/<(?:\w+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?c>)/g)) {
        const attrs = cm[1], body = cm[2] || '';
        const ref = /(?:^|\s)r="([A-Za-z]+)(\d+)"/.exec(attrs);
        // a cell may leave its reference out; it is then the one after the last
        const ci = ref ? xr_colIndex(ref[1]) : lastCi + 1;
        if (!(ci >= 0 && ci < XR_MAXCOL)) throw BAD('a cell in sheet "' + name + '" sits past the last column a worksheet has');
        lastCi = ci;
        if (!rno && ref) rno = Number(ref[2]);
        const t = (attrs.match(/(?:^|\s)t="(\w+)"/) || [])[1] || 'n';
        let v = null;
        if (t === 'inlineStr') {
          const im = /<(?:\w+:)?is\b[^>]*>([\s\S]*?)<\/(?:\w+:)?is>/.exec(body);
          // INLINE STRINGS ARE ESCAPED TOO. Taken raw, every workbook written this way came back with &amp; in place
          // of & - and "O&M" is in nearly every budget name.
          v = im ? xr_runs(im[1], txt) : '';
        } else if (!/<(?:\w+:)?v\b[^>]*\/>/.test(body)) {   // <v/> is an empty cached value: a formula with no result
          const vm = /<(?:\w+:)?v\b[^>]*>([\s\S]*?)<\/(?:\w+:)?v>/.exec(body);
          if (vm) {
            const raw = vm[1];
            if (t === 's') {
              // A shared-string index past the end of the table yields undefined, which lands in the sheet as a blank
              // cell and reads as missing data rather than a damaged file.
              const ix = Number(raw);
              if (!(Number.isInteger(ix) && ix >= 0 && ix < sst.length)) throw BAD('a cell points at text #' + raw.trim()
                + ' but its shared-string table holds ' + sst.length);
              v = sst[ix];
            } else if (t === 'str' || t === 'e') v = txt(raw);            // a formula's text result; an error such as #N/A
            else if (t === 'b') v = raw.trim() === '1' || /^true$/i.test(raw.trim());
            else if (t === 'd') { const s = txt(raw).trim(), dm = /^(\d{4}-\d{2}-\d{2})/.exec(s); v = dm ? dm[1] : s; }
            else {
              // a number; anything else written there is kept as its text, so the import can name it instead of
              // carrying NaN into the model
              const s = raw.trim(), n = s === '' ? NaN : Number(s);
              v = s === '' ? null : isFinite(n) ? n : txt(raw);
            }
          }
        }
        // A FORMULA SAVED WITHOUT ITS RESULT. Excel always saves a result with a formula: a number, an error (t="e"), or an
        // empty text (t="str" with <v/>, which v12's own formula columns hold by the thousand and which is rightly blank). A
        // formula of number type with no value was written by a program that never calculated it (openpyxl writes
        // <f>…</f><v></v>). Read as blank, an Amount so written counted as $0 and was reported nowhere (review IMP-6). It is
        // read as its formula's text instead, so an Amount or FY written that way makes its row unreadable and is named,
        // and the sheet counts every such cell.
        const fm = v === null && t === 'n' && body ? /<(?:\w+:)?f\b[^>]*?(?:\/>|>([\s\S]*?)<\/(?:\w+:)?f>)/.exec(body) : null;
        if (fm) {
          v = '=' + (fm[1] ? txt(fm[1]).trim() : '(a shared formula)');
          noResult.push(SP.colLetter(ci) + (rno || (rowNo.length ? rowNo[rowNo.length - 1] + 1 : 1)));
        }
        if (v !== null) { cells[ci] = v; if (ci + 1 > maxc) maxc = ci + 1; }
      }
      const arr = new Array(maxc);
      for (let i = 0; i < maxc; i++) arr[i] = cells[i] !== undefined ? cells[i] : '';
      if (!rno) rno = rowNo.length ? rowNo[rowNo.length - 1] + 1 : 1;
      rows.push(arr);
      rowNo.push(rno);
    }
    sheets.push({ name, state, rows, rowNo, noResult });
  }
  return { sheets, date1904, esc };
}
SP.readXlsx = readXlsx;

// RFC 4180: comma-separated, a field in double quotes may hold commas, line breaks and "" for a quote. A byte-order mark
// at the start is not data. Any line ending (CRLF, LF, CR) ends a record outside quotes. A quote that opens a field and
// never closes is refused rather than read: it would otherwise swallow every later row into one cell, silently.
// Returns string[][]: record i is row i+1, as a spreadsheet opening the file numbers it.
function readCsv(text) {
  let s = String(text ?? '');
  if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1);
  const rows = [], n = s.length;
  let row = [], f = '', i = 0, quoted = false, inQ = false, qRow = 0;
  while (i < n) {
    if (inQ) {
      const j = s.indexOf('"', i);
      if (j < 0) { f += s.slice(i); i = n; break; }
      f += s.slice(i, j);
      if (s.charCodeAt(j + 1) === 34) { f += '"'; i = j + 2; } else { inQ = false; i = j + 1; }
      continue;
    }
    const ch = s.charCodeAt(i);
    if (ch === 34 && f === '' && !quoted) { inQ = true; quoted = true; qRow = rows.length + 1; i++; continue; }
    if (ch === 44) { row.push(f); f = ''; quoted = false; i++; continue; }
    if (ch === 10 || ch === 13) {
      row.push(f); rows.push(row); row = []; f = ''; quoted = false;
      i += (ch === 13 && s.charCodeAt(i + 1) === 10) ? 2 : 1;
      continue;
    }
    // plain text runs to the next comma, quote or line break in one step
    let j = i + 1;
    while (j < n) { const c = s.charCodeAt(j); if (c === 44 || c === 10 || c === 13 || c === 34) break; j++; }
    f += s.slice(i, j); i = j;
  }
  if (inQ) throw new Error('That file is not a readable .csv — a quoted value that begins on row ' + qRow
    + ' never ends, so every row after it would be read as part of that one value. Export it again and retry.');
  if (f !== '' || row.length || quoted) { row.push(f); rows.push(row); }
  return rows;
}
SP.readCsv = readCsv;
