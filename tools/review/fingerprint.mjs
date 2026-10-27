// FINGERPRINT A BOARD FILE: the SHA-256 of the file, and the CODE FINGERPRINT of the program inside it.
//
//   node tools/review/fingerprint.mjs [board.html ...] [--json] [--canon <file>]
//
//   With no file it reads the repository's prioritization-board-grid.html. --json prints the values as
//   JSON (the fields a review/builds.json entry needs). --canon writes the canonical form described below
//   to <file>, so two files that should match can be compared line by line. Node built-ins only.
//
// TWO HASHES, TWO QUESTIONS.
//   SHA-256 (file)    Is this exactly that file? It is the value PowerShell gives for
//                     Get-FileHash -Algorithm SHA256 <file>. PowerShell prints it in capitals; it is the
//                     same number.
//   code fingerprint  Which release's program is inside this file? A saved board is the program and the
//                     budget data in one file, so its SHA-256 changes on every save. The code fingerprint
//                     leaves the data out. Every save of one release gives the same value, and
//                     which-build.mjs looks it up in review/builds.json.
//
// HOW A BOARD SAVES ITSELF (line numbers are the v1.99 board at commit 6de4432).
//   - Line 1972, the first statement of the main script:
//         const SRC0 = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
//     The page records its own text once, while it is still loading. outerHTML is not the file: it is the
//     browser re-writing the page it built from the file.
//   - Line 6945 (savedHtmlOf): every board file the page writes -- Save, the PMO copy, the work kept aside,
//     the board as it stood before a full import -- is SRC0 with the body of
//     <script type="application/json" id="pubState"> replaced by the board's data as JSON.
//   - Line 2450 (pmoCopyHtml): a PMO copy also writes its mode into
//     <script type="application/json" id="pubMode">.
//   - Line 9849 (appnsOnlyIn): "one appropriation out" also re-writes the object after 'const APPNS = '
//     in the main script (line 2342 in the release).
//   - Line 19179 (fydpFrameHtml): the FYDP reader builds a page from SRC0 the same way. It loads that page
//     into a hidden frame and never writes it to disk.
//
// WHY THE FINGERPRINT IS NOT "THE FILE WITH TWO ISLANDS EMPTIED". That plain hash is printed below as
// "islands emptied". It names a byte-identical copy and nothing else, because outerHTML re-writes the
// markup. A v1.99 save, set beside the v1.99 release, shows every kind of change:
//   - <html lang="en"> gains data-theme="harbor". The theme script sets it (line 1295) before SRC0 is
//     taken, so the saver's colour theme is baked in. Midnight removes the attribute instead.
//   - The newline between <html> and <head> goes, and a tag written over two lines comes back on one
//     (the drawer scrim button, lines 1963-1964).
//   - "O&M" in text comes back as "O&amp;M"; "&mdash;" and "&#9656;" come back as the characters.
//   - <circle .../> comes back as <circle ...></circle>; the bare attribute "hidden" as hidden="".
//   - A <table> written without <tbody> comes back with one (line 1591).
//   - The file ends at the main script's </script>, then </body></html>: nothing after the main script
//     had been read when SRC0 was taken. The release has 31,333 lines; a save of it has 31,329.
// Scripts and styles come back byte for byte.
//
// WHAT THE CODE FINGERPRINT COVERS (scheme orbit-code-v1, built in lib.mjs)
// The file is cut into tokens the way a browser cuts it (a <script> ends at the first "</script", whatever
// its JavaScript says), and a canonical form is hashed. Kept, exactly:
//   - the text of every <script> and <style>, byte for byte (in a release before v2.05 that includes the
//     PowerPoint template in TPL_PARTS);
//   - every element, in order, with every attribute and its value. Inline handlers such as onclick are
//     code, and they are kept;
//   - every comment inside <html>, and every piece of text;
//   - the end tags whose place changes what the page does: a, button, form, iframe, math, noscript, object,
//     select, svg and template;
//   - anything after the main script. A save cannot carry it, but the blank file would run it, so a release
//     with anything there can never match its own saves. That is on purpose.
//
// WHAT IT IGNORES, AND WHY
//   - The body of the first <script type="application/json" id="pubState">: the board's data, written by
//     every save (line 6945).
//   - The body of the first <script type="application/json" id="pubMode">: the PMO copy's mode (line 2450).
//   - The object after the first 'const APPNS = ' in a script, BUT ONLY when it parses as plain JSON, so it
//     cannot hold code: a data slot, re-written by "one appropriation out" (line 9849), and where the old
//     per-board builds kept their data. If it is not plain JSON it is hashed as code, and the tool says so.
//   - data-theme on <html>: the saver's colour theme (line 1295).
//   - What outerHTML re-writes without changing what the page does: the doctype; comments before <html>
//     (they are not inside documentElement); every end tag not listed above (a browser writes the ones the
//     source leaves implied); a <tbody> with no attributes (the parser inserts one); how attributes are
//     quoted; self-closing slashes; letter case of tag and attribute names; a repeated attribute (a browser
//     keeps the first, and so does this); character references (&mdash; and the dash itself are the same
//     character); and whitespace in text (runs of it count as one space, and text that is only whitespace
//     is dropped).
//   - Windows line endings and a byte-order mark. A browser removes both before it reads anything else, so
//     a copy checked out with CRLF line endings is the same program.
//
// LIMITS, SAID PLAINLY
//   - Two files that differ only in whitespace inside text, or in where an end tag outside the list sits,
//     share a fingerprint. Neither can add code: every script, handler and attribute is covered.
//   - A browser extension that writes into the page before SRC0 is taken puts its change into every save
//     from that browser, and those saves will not match. The SCRIPT fingerprint (the executable scripts
//     alone) is printed too; which-build.mjs uses it to say "the scripts match, the markup does not".
//   - The canonical form was checked against v1.99 saves written by the board's own save code under jsdom:
//     release and saves give one code fingerprint. It has not yet been checked against a save written by
//     the browser people use. Do that once (open the blank release, Save, run which-build.mjs on the save)
//     before relying on it.
import { writeFileSync } from 'node:fs';
import { BOARD, argPath, describeBoard } from './lib.mjs';

const USAGE = 'usage: node tools/review/fingerprint.mjs [board.html ...] [--json] [--canon <file>]';
const args = process.argv.slice(2);
if (args.includes('-h') || args.includes('--help')) { console.log(USAGE); process.exit(0); }
const json = args.includes('--json');
let canonOut = null;
const files = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--json') continue;
  if (args[i] === '--canon') { canonOut = args[++i]; if (!canonOut) { console.error(USAGE); process.exit(2); } canonOut = argPath(canonOut); continue; }
  if (args[i].startsWith('-')) { console.error(`unknown option ${args[i]}\n${USAGE}`); process.exit(2); }
  files.push(argPath(args[i]));
}
if (!files.length) files.push(BOARD);
if (canonOut && files.length !== 1) { console.error('--canon takes exactly one board file'); process.exit(2); }

const out = [];
for (const f of files) {
  let r;
  try { r = describeBoard(f); } catch (e) { console.error(`${f}: ${e.message}`); process.exit(2); }
  out.push(r);
  if (canonOut) { writeFileSync(canonOut, r.canon + '\n'); }
  if (json) continue;
  console.log(`file               ${r.file}  (${r.bytes.toLocaleString('en-US')} bytes)`);
  console.log(`BUILD stamp        ${r.build || '(none found)'}`);
  console.log(`data               pubState ${r.data.pubState}; pubMode ${r.data.pubMode}; APPNS ${r.data.appns}`);
  console.log(`SHA-256 (file)     ${r.sha256}   = Get-FileHash -Algorithm SHA256`);
  console.log(`git blob           ${r.gitBlob}   = git hash-object`);
  console.log(`code fingerprint   ${r.code}   ${r.scheme}: the program without its data`);
  console.log(`script fingerprint ${r.script}   the executable scripts alone`);
  console.log(`islands emptied    ${r.islandsEmptied}   bytes with pubState and pubMode emptied; names a byte-identical copy only`);
  console.log(`ignored            ${r.ignored.length ? r.ignored.join('; ') : 'nothing'}`);
  for (const w of r.warnings) console.log(`WARNING            ${w}`);
  if (canonOut) console.log(`canonical form     written to ${canonOut}`);
  if (files.length > 1) console.log('');
}
if (json) console.log(JSON.stringify(out.map(({ canon, ...r }) => r), null, 2));
