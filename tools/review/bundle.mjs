// SPLIT THE BOARD FOR REVIEW: its styles, markup and scripts as three files, and the PowerPoint
// template unpacked, each with a SHA-256 in a manifest.
//
//   node tools/review/bundle.mjs [board.html] [--out <dir>]
//
//   With no file it reads the repository's prioritization-board-grid.html. Output goes to review/out/
//   (ignored by git), or to --out. Node built-ins only. The board is read, never changed.
//
// WHAT IT WRITES
//   board.css          the bodies of every <style> element
//   board-markup.html  everything that is not a style or script body: the page's elements, inline
//                      handlers (onclick and the like), inline style attributes, comments and the two
//                      data islands (pubState, pubMode), which are "null" in a release
//   board.js           the bodies of every <script> that runs (two in v1.99: the theme script and the
//                      main script), in file order. The data islands are not scripts and are not here.
//   template/<part>    the PowerPoint template the board carries in TPL_PARTS (board line 24627 in
//                      v1.99), one file per part, decoded from base64
//   MANIFEST.txt       the SHA-256 of the board, of each file above and of each template part
//
// LINE NUMBERS ARE THE BOARD'S. The three files are PADDED, not cut: line N of each file is line N of
// the board, and a character keeps its column. Whatever belongs to another file is blanked (each
// character becomes a space, then spaces at the end of a line are dropped), so a scanner's "board.js
// line 6712" is board line 6712. Line 1 of the board is the doctype, so line 1 of board.css and board.js
// is free and carries a one-line note saying this; in board-markup.html the note is a comment on line 1,
// after the doctype. The tool then reads the three files back and checks that, laid over each other,
// they give back every line of the board (spaces at line ends aside). It fails if they do not.
//
// A SAVED BOARD IS REFUSED. A saved board holds budget data, and this kit never writes budget data into
// the working tree. Bundle the release; use which-build.mjs to name the release inside a saved board.
//
// THE TEMPLATE. Each part's name is checked before anything is written (no "..", no absolute path, no
// drive letter, no backslash), and each part's base64 must be canonical: decoding it and encoding it
// again gives the same text. Each decoded part is then checked for what it claims to be: an .xml or
// .rels part must be UTF-8 and well-formed XML (checked here by a small reader, not a full XML parser);
// a .png, .jpeg, .wmf or .bin (an OLE embedding) must start with that format's signature. The manifest
// lists what each part was found to be. ppt/presentation.xml and ppt/_rels/presentation.xml.rels hold the
// placeholders __SLDIDS__ and __SLDRELS__, which the export fills in (buildPptx, board line 24670).
//
// Exit status: 0 written and checked; 1 written, but a check failed (the tool says which); 2 nothing
// written (unreadable board, saved board, unsafe part name, or an output folder this tool did not make).
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { BOARD, ROOT, argPath, buildStamp, contextAt, dataState, lineOf, lineStarts, objectLiteralAt,
  readBoard, regions, scanJs, sha256 } from './lib.mjs';

const USAGE = 'usage: node tools/review/bundle.mjs [board.html] [--out <dir>]';
const MARK = '# review bundle MANIFEST, written by tools/review/bundle.mjs';
const args = process.argv.slice(2);
if (args.includes('-h') || args.includes('--help')) { console.log(USAGE); process.exit(0); }
let board = null, out = join(ROOT, 'review', 'out');
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out') { if (!args[i + 1]) { console.error(USAGE); process.exit(2); } out = argPath(args[++i]); continue; }
  if (args[i].startsWith('-') || board) { console.error(USAGE); process.exit(2); }
  board = argPath(args[i]);
}
board = board || BOARD;
const fail = (msg, code = 2) => { console.error(msg); process.exit(code); };

let buf, text;
try { ({ buf, text } = readBoard(board)); } catch (e) { fail(`cannot read ${board}: ${e.message}`); }
const data = dataState(text);
if (data.populated) {
  fail(`${board} holds data (pubState ${data.pubState}; pubMode ${data.pubMode}; APPNS ${data.appns}).\n` +
    'This is a saved board, not a release. Nothing written: the kit never puts budget data in the working tree.');
}
const boardSha = sha256(buf), build = buildStamp(text) || '(no BUILD stamp)';
const starts = lineStarts(text);

// ---- which characters go to which file ------------------------------------------------------------
const regs = regions(text);
const css = regs.filter(r => r.kind === 'css'), js = regs.filter(r => r.kind === 'js');
// Keep the characters inside `keep` (sorted [start, end) ranges); blank the rest, newlines aside.
function padded(keep, invert) {
  const parts = [];
  let at = 0;
  const blank = s => s.replace(/[^\n]/g, ' ');
  for (const r of keep) {
    parts.push(invert ? text.slice(at, r.start) : blank(text.slice(at, r.start)));
    parts.push(invert ? blank(text.slice(r.start, r.end)) : text.slice(r.start, r.end));
    at = r.end;
  }
  parts.push(invert ? text.slice(at) : blank(text.slice(at)));
  return parts.join('').split('\n').map(l => l.replace(/[ \r]+$/, ''));
}
const cssLines = padded(css, false);
const jsLines = padded(js, false);
const markupLines = padded([...css, ...js].sort((a, b) => a.start - b.start), true);

// The note on line 1. Line 1 of a board is its doctype, so the CSS and JS files have nothing there.
const rel = relative(ROOT, board) || board;
const say = what => `${what}: from ${rel} (BUILD ${build}, SHA-256 ${boardSha}), written by ` +
  'tools/review/bundle.mjs. PADDED: line N here is line N of the board, columns kept; everything that is not ' +
  (what === 'board.css' ? 'a <style> body' : what === 'board.js' ? 'the body of a running <script>' : 'markup') +
  ' is blanked.';
if (cssLines[0] || jsLines[0]) fail('line 1 of the board holds style or script text, so there is no free line for the note. Nothing written.');
cssLines[0] = '/* ' + say('board.css').replace(/\*\//g, '* /') + ' */';
jsLines[0] = '// ' + say('board.js');
markupLines[0] += '<!-- ' + say('board-markup.html').replace(/--/g, '- -') + ' -->';

// ---- the template ----------------------------------------------------------------------------------
// TPL_PARTS is found as the board's own code uses it: a `const TPL_PARTS=` in a running script, at a code
// position (not in a comment or a string), followed by a JSON object of part name -> base64 text.
let tpl = null, tplLine = null;
for (const r of js) {
  const re = /\bconst\s+TPL_PARTS\s*=\s*\{/g;
  const body = text.slice(r.start, r.end);
  let m, scan = null;
  while ((m = re.exec(body))) {
    scan = scan || scanJs(text, r.start, r.end);
    if (contextAt(scan, r.start + m.index).where !== 'code') continue;
    if (tpl) fail('more than one `const TPL_PARTS=` in the running scripts. Nothing written.');
    const o = objectLiteralAt(text, r.start + m.index + m[0].length - 1, r.end);
    if (!o || !o.json || !Object.values(o.value).every(v => typeof v === 'string')) fail('TPL_PARTS is not a JSON object of strings. Nothing written.');
    tpl = o.value; tplLine = lineOf(starts, r.start + m.index);
  }
}
const UNSAFE = /[\\:*?"<>|\u0000-\u001f]/;
const parts = tpl ? Object.entries(tpl) : [];
for (const [name, b64] of parts) {
  if (!name || name.length > 200 || UNSAFE.test(name) || name.startsWith('/') ||
      name.split('/').some(seg => !seg || seg === '.' || seg === '..')) fail(`unsafe template part name ${JSON.stringify(name)}. Nothing written.`);
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(b64) || b64.length % 4 || Buffer.from(b64, 'base64').toString('base64') !== b64)
    fail(`template part ${name}: the base64 is not canonical. Nothing written.`);
}

// ---- the output folder: only one this tool made, or a new or empty one -------------------------------
const OURS = ['board.css', 'board-markup.html', 'board.js', 'MANIFEST.txt', 'template'];
if (existsSync(out)) {
  const have = readdirSync(out);
  const man = join(out, 'MANIFEST.txt');
  const made = existsSync(man) && readFileSync(man, 'utf8').startsWith(MARK);
  if (have.length && !made) fail(`${out} is not empty and was not written by bundle.mjs. Nothing written.`);
  for (const f of OURS) rmSync(join(out, f), { recursive: true, force: true });
}
mkdirSync(out, { recursive: true });

// ---- write -------------------------------------------------------------------------------------------
const written = [];
const put = (name, body) => {
  const p = join(out, ...name.split('/'));
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, body);
  return p;
};
for (const [name, lines] of [['board.css', cssLines], ['board-markup.html', markupLines], ['board.js', jsLines]]) {
  const body = Buffer.from(lines.join('\n') + '\n', 'utf8');
  put(name, body);
  written.push({ name, sha: sha256(body), bytes: body.length, lines: lines.length });
}
const problems = [];
const tparts = [];
for (const [name, b64] of parts) {
  const bytes = Buffer.from(b64, 'base64');
  put('template/' + name, bytes);
  const found = whatIs(name, bytes);
  if (!found.ok) problems.push(`template/${name}: ${found.what}`);
  tparts.push({ name, sha: sha256(bytes), bytes: bytes.length, what: found.what });
}

// ---- check: laid over each other, the three files give back the board ----------------------------------
const back = ['board.css', 'board-markup.html', 'board.js'].map(f => readFileSync(join(out, f), 'utf8').split('\n'));
const boardLines = text.split('\n');
let bad = 0, firstBad = null;
for (let n = 0; n < boardLines.length; n++) {
  if (n === 0) continue;                                  // line 1 carries the notes
  const want = boardLines[n].replace(/[ \r]+$/, '');
  const got = back.map(f => f[n] || '');
  const w = Math.max(...got.map(g => g.length));
  let s = '', twice = false;
  for (let c = 0; c < w; c++) {
    const here = got.map(g => g[c]).filter(x => x !== undefined && x !== ' ');
    if (here.length > 1) twice = true;                    // two files claim one character
    s += here.length ? here[0] : ' ';
  }
  if (twice || s.replace(/ +$/, '') !== want) { bad++; if (!firstBad) firstBad = n + 1; }
}
if (back.some(f => f.length !== boardLines.length + 1)) problems.push('the three files do not have one line per board line');
if (bad) problems.push(`${bad} board lines are not given back by the three files (first: line ${firstBad})`);
if (!tpl) problems.push('no `const TPL_PARTS=` found: the template was not unpacked');

// ---- the manifest: sha256sum format, so `cd review/out && sha256sum -c MANIFEST.txt` checks it ----------
const posix = p => p.split(sep).join('/');
// A path as printed: from the repository when it is inside it, whole otherwise.
const show = p => { const r = relative(ROOT, p); return r && !r.startsWith('..') ? posix(r) : p; };
const m = [
  MARK,
  `# board ${rel}, BUILD ${build}, ${buf.length} bytes, ${starts.length} lines`,
  '# board.css, board-markup.html and board.js are padded: line N in each is line N of the board.',
  tpl ? `# template: ${parts.length} parts, from TPL_PARTS at board line ${tplLine}` : '# template: none found',
  '# lines below: SHA-256, two spaces, path from this folder (as sha256sum writes them)',
  `${boardSha}  ${posix(relative(out, board))}`,
  ...written.map(w => `${w.sha}  ${w.name}`),
  ...tparts.map(t => `${t.sha}  template/${t.name}`),
  '# what each template part was found to be (bytes, then the check):',
  ...tparts.map(t => `#   template/${t.name}  ${t.bytes}  ${t.what}`),
];
put('MANIFEST.txt', m.join('\n') + '\n');

// ---- report ------------------------------------------------------------------------------------------
console.log(`board        ${board}`);
console.log(`BUILD        ${build}`);
console.log(`SHA-256      ${boardSha}`);
for (const w of written) console.log(`wrote        ${show(join(out, w.name))}  ${w.lines} lines, ${w.bytes} bytes  ${w.sha}`);
const kinds = {};
for (const t of tparts) { const k = t.what.split(',')[0]; kinds[k] = (kinds[k] || 0) + 1; }
console.log(`template     ${tparts.length} parts from TPL_PARTS (board line ${tplLine}), ${tparts.reduce((a, t) => a + t.bytes, 0)} bytes: ` +
  Object.entries(kinds).map(([k, n]) => `${n} ${k}`).join(', '));
console.log(`manifest     ${show(join(out, 'MANIFEST.txt'))}  ${m.length} lines`);
console.log(`check        the three files laid over each other give back ${boardLines.length - 1 - bad} of ${boardLines.length - 1} board lines after line 1`);
for (const p of problems) console.log(`PROBLEM      ${p}`);
process.exit(problems.length ? 1 : 0);

// ---- what a template part is ---------------------------------------------------------------------------
function whatIs(name, b) {
  const ext = (name.match(/\.([A-Za-z0-9]+)$/) || [])[1]?.toLowerCase() || '';
  const starts = (...sig) => sig.every((v, i) => b[i] === v);
  if (ext === 'xml' || ext === 'rels') {
    let s;
    try { s = new TextDecoder('utf-8', { fatal: true }).decode(b); } catch { return { ok: false, what: 'xml, NOT valid UTF-8' }; }
    const why = xmlProblem(s.replace(/^﻿/, ''));
    return why ? { ok: false, what: `xml, NOT well-formed: ${why}` } : { ok: true, what: 'xml, well-formed' };
  }
  if (ext === 'png') return starts(0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A) && b.includes(Buffer.from('IEND'), b.length - 12)
    ? { ok: true, what: 'png, signature and IEND' } : { ok: false, what: 'png, NOT a PNG signature' };
  if (ext === 'jpeg' || ext === 'jpg') return starts(0xFF, 0xD8, 0xFF) && b[b.length - 2] === 0xFF && b[b.length - 1] === 0xD9
    ? { ok: true, what: 'jpeg, start and end markers' } : { ok: false, what: 'jpeg, NOT JPEG markers' };
  if (ext === 'wmf') {
    const placeable = starts(0xD7, 0xCD, 0xC6, 0x9A);
    const plain = (b[0] === 1 || b[0] === 2) && b[1] === 0 && b[2] === 9 && b[3] === 0 && (b[5] === 1 || b[5] === 3) && b[4] === 0;
    return placeable || plain ? { ok: true, what: `wmf, ${placeable ? 'placeable' : 'standard'} header` } : { ok: false, what: 'wmf, NOT a WMF header' };
  }
  if (ext === 'bin') return starts(0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1)
    ? { ok: true, what: 'ole, compound file signature (an embedded object)' } : { ok: false, what: 'bin, NOT an OLE compound file' };
  return { ok: false, what: `.${ext}, a kind this tool does not check` };
}

// A small well-formedness reader: tags nest and match, there is one root element, attributes are quoted
// and not repeated, "<" never appears in text or a value, and every "&" starts a reference. It does not
// read a DTD; a part with <!DOCTYPE is reported, because an Office part should never have one.
function xmlProblem(s) {
  const NAME = /^[A-Za-z_:À-￿][\w.\-:·-￿]*/;
  const REF = /^&(?:[A-Za-z_:][\w.\-:]*|#[0-9]+|#x[0-9A-Fa-f]+);/;
  const stack = [];
  let i = 0, root = false;
  const textOk = (t, inRoot) => {
    if (!inRoot && /\S/.test(t)) return 'text outside the root element';
    for (let k = t.indexOf('&'); k >= 0; k = t.indexOf('&', k + 1)) if (!REF.test(t.slice(k))) return 'a bare "&"';
    if (t.includes(']]>')) return '"]]>" in text';
    return null;
  };
  while (i < s.length) {
    const lt = s.indexOf('<', i);
    const t = s.slice(i, lt < 0 ? s.length : lt);
    const w = textOk(t, stack.length > 0);
    if (w) return w;
    if (lt < 0) break;
    if (s.startsWith('<?', lt)) { const e = s.indexOf('?>', lt + 2); if (e < 0) return 'an unclosed "<?"'; i = e + 2; continue; }
    if (s.startsWith('<!--', lt)) { const e = s.indexOf('-->', lt + 4); if (e < 0) return 'an unclosed comment'; i = e + 3; continue; }
    if (s.startsWith('<![CDATA[', lt)) { if (!stack.length) return 'CDATA outside the root'; const e = s.indexOf(']]>', lt); if (e < 0) return 'an unclosed CDATA'; i = e + 3; continue; }
    if (s.startsWith('<!', lt)) return 'a <!DOCTYPE or other declaration';
    if (s[lt + 1] === '/') {
      const m = NAME.exec(s.slice(lt + 2)); if (!m) return `a bad end tag at ${lt}`;
      const e = s.indexOf('>', lt); if (e < 0 || /\S/.test(s.slice(lt + 2 + m[0].length, e))) return `a bad end tag </${m[0]}>`;
      if (stack.pop() !== m[0]) return `</${m[0]}> does not close the open element`;
      i = e + 1; continue;
    }
    const m = NAME.exec(s.slice(lt + 1)); if (!m) return `a "<" that starts no tag at ${lt}`;
    if (!stack.length && root) return 'a second root element';
    let j = lt + 1 + m[0].length; const seen = new Set();
    for (;;) {
      const ws = /^[ \t\r\n]*/.exec(s.slice(j))[0]; j += ws.length;
      if (s.startsWith('/>', j)) { j += 2; if (!stack.length) root = true; break; }
      if (s[j] === '>') { j++; stack.push(m[0]); root = true; break; }
      if (!ws) return `<${m[0]}>: attributes not separated by space`;
      const a = NAME.exec(s.slice(j)); if (!a) return `<${m[0]}>: a bad attribute`;
      if (seen.has(a[0])) return `<${m[0]}>: ${a[0]} given twice`;
      seen.add(a[0]); j += a[0].length;
      const eq = /^[ \t\r\n]*=[ \t\r\n]*/.exec(s.slice(j)); if (!eq) return `<${m[0]}>: ${a[0]} has no value`;
      j += eq[0].length;
      const q = s[j]; if (q !== '"' && q !== "'") return `<${m[0]}>: ${a[0]} is not quoted`;
      const e = s.indexOf(q, j + 1); if (e < 0) return `<${m[0]}>: ${a[0]} is not closed`;
      const v = s.slice(j + 1, e);
      if (v.includes('<')) return `<${m[0]}>: "<" in the value of ${a[0]}`;
      for (let k = v.indexOf('&'); k >= 0; k = v.indexOf('&', k + 1)) if (!REF.test(v.slice(k))) return `<${m[0]}>: a bare "&" in ${a[0]}`;
      j = e + 1;
    }
    i = j;
  }
  if (stack.length) return `<${stack[stack.length - 1]}> is never closed`;
  if (!root) return 'no root element';
  return null;
}
