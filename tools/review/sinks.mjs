// WHERE TEXT BECOMES PAGE MARKUP: an inventory of the board's HTML sinks, found by pattern. No verdicts.
//
//   node tools/review/sinks.mjs [board.html] [--out <file.csv>]
//
//   With no file it reads the repository's prioritization-board-grid.html and writes review/sinks.csv.
//   Node built-ins only. The board is read, never changed.
//
// WHAT IT LISTS. Every place in the board's source where a string is handed to the browser as HTML:
//   innerHTML =, innerHTML +=     an element's content replaced by (or extended with) parsed HTML
//   outerHTML =, outerHTML +=     the element itself replaced by parsed HTML
//   innerHTML set another way     el['innerHTML'] = ..., or an object literal with an innerHTML key
//   insertAdjacentHTML            parsed HTML inserted beside or inside an element
//   document.write                parsed HTML written into a document (a pop-up window's, for example)
//   srcdoc                        every mention: a frame whose whole page is a string
//   setStat call                  every call of setStat(), the status line. setStat (board line 6707 in
//                                 v1.99) puts its argument into #shareStat with innerHTML (line 6712), so
//                                 each call is a sink one step removed. Its definition is not listed.
//   createContextualFragment, setHTMLUnsafe / parseHTMLUnsafe
//                                 other ways a page parses a string as HTML (none in v1.99)
//   DOMParser.parseFromString     a string parsed as HTML into a separate document, not the page
//
// WHAT EACH ROW SAYS. line and col (1-based, as an editor counts them; col counts UTF-16 units, as
// VS Code does); kind (above); function: the NAMED functions around the sink, outermost first, as
// "importState > r.onload" (a function assigned to r.onload, inside importState), or "(top level)". An
// anonymous callback is not named, so a sink inside one shows the named function around it. context: "code", or
// "string" / "template" when the pattern sits inside a string that is itself code run elsewhere (a frame
// or a pop-up), or "inline handler onclick" and the like for markup attributes; source: the board line,
// trimmed of indentation, cut to 160 characters. When the sink sits past the first 150 characters, the
// 160 characters shown start 40 before it, after a "…".
//
// WHAT IT LEAVES OUT. Matches inside a JavaScript comment or a regular expression are not sinks; they are
// counted and their lines printed, not listed. Reading innerHTML or outerHTML (as the board does to keep
// its own text in SRC0, line 1972) is not a sink. Functions that BUILD an HTML string and return it are
// not listed: the string becomes markup where it reaches one of the sinks above.
//
// NO VERDICTS. A row says only that text becomes markup there. Whether the text can carry anything
// harmful depends on where it comes from and whether it was escaped on the way; that judgement is not in
// this file, and must not be added to it.
//
// THE CSV IS SAFE TO OPEN IN EXCEL. A cell that starts with = + - @ or a tab would be read by a
// spreadsheet as a formula, and many source lines start with "+" (a continued string). Such a cell is
// written with a leading apostrophe ('), as OWASP advises for CSV files. The line number finds the exact
// text in the board.
//
// Exit status: 0 written; 2 the board could not be read.
import { writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { BOARD, ROOT, argPath, attrOf, buildStamp, contextAt, lineOf, lineStarts, readBoard, regions,
  scanJs, sha256, tokenizeHtml } from './lib.mjs';

const USAGE = 'usage: node tools/review/sinks.mjs [board.html] [--out <file.csv>]';
const args = process.argv.slice(2);
if (args.includes('-h') || args.includes('--help')) { console.log(USAGE); process.exit(0); }
let board = null, out = join(ROOT, 'review', 'sinks.csv');
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out') { if (!args[i + 1]) { console.error(USAGE); process.exit(2); } out = argPath(args[++i]); continue; }
  if (args[i].startsWith('-') || board) { console.error(USAGE); process.exit(2); }
  board = argPath(args[i]);
}
board = board || BOARD;

let buf, text;
try { ({ buf, text } = readBoard(board)); } catch (e) { console.error(`cannot read ${board}: ${e.message}`); process.exit(2); }
const starts = lineStarts(text);

// [kind, pattern]. Each pattern is run over the whole file; where the match sits decides what is kept.
const KINDS = [
  ['innerHTML =', /\.innerHTML\s*=(?!=)/g],
  ['innerHTML +=', /\.innerHTML\s*\+=/g],
  ['outerHTML =', /\.outerHTML\s*=(?!=)/g],
  ['outerHTML +=', /\.outerHTML\s*\+=/g],
  ['innerHTML set another way', /\[\s*(['"`])(?:inner|outer)HTML\1\s*\]\s*\+?=(?!=)|(?<=[{,]\s*)(['"]?)(?:inner|outer)HTML\2\s*:/g],
  ['insertAdjacentHTML', /\.insertAdjacentHTML\s*\(/g],
  ['document.write', /\bdocument\s*\.\s*write(?:ln)?\s*\(/g],
  ['srcdoc', /\bsrcdoc\b/g],
  ['setStat call', /(?<![\w$.])setStat\s*\(/g],
  ['createContextualFragment', /\.createContextualFragment\s*\(/g],
  ['setHTMLUnsafe / parseHTMLUnsafe', /\b(?:setHTMLUnsafe|parseHTMLUnsafe)\s*\(/g],
  ['DOMParser.parseFromString', /\.parseFromString\s*\(/g],
];

const regs = regions(text);
const scans = new Map();                       // a JavaScript region's scan, made once when first needed
let toks = null;                               // the markup's tokens, made once when first needed
const rows = [], skipped = [];
for (const [kind, re] of KINDS) {
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(text))) {
    const pos = m.index + (m[0][0] === '.' ? 1 : 0);           // point at the name, not the dot
    if (kind === 'setStat call' && /\bfunction\s*\*?\s*$/.test(text.slice(Math.max(0, pos - 40), pos))) continue;
    const line = lineOf(starts, pos), col = pos - starts[line - 1] + 1;
    const r = regs.find(x => x.start <= pos && pos < x.end);
    let context, fn;
    if (r && r.kind === 'js') {
      if (!scans.has(r.start)) scans.set(r.start, scanJs(text, r.start, r.end));
      const c = contextAt(scans.get(r.start), pos);
      if (c.where === 'comment' || c.where === 'regex') { skipped.push({ line, kind, where: c.where }); continue; }
      const named = c.chain.filter(f => f.name).map(f => f.name);
      context = c.where;
      fn = named.length ? named.join(' > ') : '(top level)';
    } else if (r) {
      context = r.kind === 'css' ? 'style' : `data island${r.id ? ' ' + r.id : ''}`;
      fn = '(not a script)';
    } else {
      toks = toks || tokenizeHtml(text);
      const t = toks.find(x => x.type === 'start' && x.start <= pos && pos < x.end);
      const a = t && t.attrs.find(x => x.vs <= pos && pos < x.ve);
      if (a && a.name.startsWith('on')) {
        context = `inline handler ${a.name}`;
        const id = attrOf(t, 'id');
        fn = `(${a.name} on <${t.name}${id ? ' id=' + id : ''}>)`;
      } else { context = 'markup'; fn = '(not a script)'; }
    }
    rows.push({ line, col, kind, fn, context, source: sourceAt(line, col) });
  }
}
rows.sort((a, b) => a.line - b.line || a.col - b.col);

// The board line, trimmed, cut to 160 characters so the sink itself shows.
function sourceAt(line, col) {
  const raw = text.slice(starts[line - 1], line < starts.length ? starts[line] - 1 : text.length).replace(/\r$/, '');
  const lead = raw.length - raw.trimStart().length;
  const s = raw.trim(), at = col - 1 - lead;
  if (s.length <= 160 || at <= 150) return s.slice(0, 160);
  const from = Math.max(0, at - 40);
  return '…' + s.slice(from, from + 159);
}

// ---- write the CSV ------------------------------------------------------------------------------------
const cell = v => {
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;                    // never a formula in a spreadsheet
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const csv = ['line,col,kind,function,context,source',
  ...rows.map(x => [x.line, x.col, x.kind, x.fn, x.context, x.source].map(cell).join(','))];
writeFileSync(out, csv.join('\n') + '\n');

// ---- report -------------------------------------------------------------------------------------------
const show = p => { const r = relative(ROOT, p); return r && !r.startsWith('..') ? r : p; };
console.log(`board        ${board}`);
console.log(`BUILD        ${buildStamp(text) || '(no BUILD stamp)'}`);
console.log(`SHA-256      ${sha256(buf)}`);
const by = new Map();
for (const x of rows) { const k = `${x.kind} [${x.context}]`; by.set(k, (by.get(k) || 0) + 1); }
for (const [kind] of KINDS) {
  const ks = [...by.keys()].filter(k => k.startsWith(kind + ' ['));
  if (!ks.length) console.log(`${String(0).padStart(5)}  ${kind}`);
  for (const k of ks) console.log(`${String(by.get(k)).padStart(5)}  ${k}`);
}
console.log(`${String(rows.length).padStart(5)}  rows, in ${new Set(rows.map(x => x.fn)).size} functions`);
if (skipped.length) console.log(`  not listed: ${skipped.length} matches in a comment or regular expression, at line${skipped.length > 1 ? 's' : ''} ` +
  skipped.map(x => `${x.line} (${x.kind}, ${x.where})`).join(', '));
console.log(`wrote        ${show(out)}`);
