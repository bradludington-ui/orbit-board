// SPLIT THE BOARD FOR REVIEW: its styles, markup and scripts as three files, each with a SHA-256 in a
// manifest.
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
//   board.js           the bodies of every <script> that runs (two since v1.99: the theme script and the
//                      main script), in file order. The data islands are not scripts and are not here.
//   MANIFEST.txt       the SHA-256 of the board and of each file above
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
// NO TEMPLATE STEP SINCE v2.05. Until v2.05 the board carried the PowerPoint deck's template as
// base64 in `const TPL_PARTS=`, and this tool unpacked and checked each part. v2.05 (item 114) removed the
// deck and the template with it, so there is nothing to unpack. An older release bundled with this tool
// keeps its TPL_PARTS as text inside board.js, unchecked; bundle it with the kit at that release
// (branch claude/security-review-kit, commit b6f1ffc) to have its parts unpacked.
//
// Exit status: 0 written and checked; 1 written, but a check failed (the tool says which); 2 nothing
// written (unreadable board, saved board, or an output folder this tool did not make).
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { BOARD, ROOT, argPath, buildStamp, dataState, lineStarts, readBoard, regions, sha256 } from './lib.mjs';

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

// ---- the output folder: only one this tool made, or a new or empty one -------------------------------
// 'template' is a folder the pre-v2.05 tool wrote; it is cleared too, so no stale part sits beside a new bundle.
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

// ---- the manifest: sha256sum format, so `cd review/out && sha256sum -c MANIFEST.txt` checks it ----------
const posix = p => p.split(sep).join('/');
// A path as printed: from the repository when it is inside it, whole otherwise.
const show = p => { const r = relative(ROOT, p); return r && !r.startsWith('..') ? posix(r) : p; };
const m = [
  MARK,
  `# board ${rel}, BUILD ${build}, ${buf.length} bytes, ${starts.length} lines`,
  '# board.css, board-markup.html and board.js are padded: line N in each is line N of the board.',
  '# lines below: SHA-256, two spaces, path from this folder (as sha256sum writes them)',
  `${boardSha}  ${posix(relative(out, board))}`,
  ...written.map(w => `${w.sha}  ${w.name}`),
];
put('MANIFEST.txt', m.join('\n') + '\n');

// ---- report ------------------------------------------------------------------------------------------
console.log(`board        ${board}`);
console.log(`BUILD        ${build}`);
console.log(`SHA-256      ${boardSha}`);
for (const w of written) console.log(`wrote        ${show(join(out, w.name))}  ${w.lines} lines, ${w.bytes} bytes  ${w.sha}`);
console.log(`manifest     ${show(join(out, 'MANIFEST.txt'))}  ${m.length} lines`);
console.log(`check        the three files laid over each other give back ${boardLines.length - 1 - bad} of ${boardLines.length - 1} board lines after line 1`);
for (const p of problems) console.log(`PROBLEM      ${p}`);
process.exit(problems.length ? 1 : 0);
