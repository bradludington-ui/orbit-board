// Boot the real board in jsdom and hand back a window we can drive.
import { JSDOM, VirtualConsole } from 'jsdom';
import { readFileSync, writeSync } from 'node:fs';
import { setFlagsFromString } from 'node:v8';
import { runInNewContext } from 'node:vm';

export const BOARD = process.env.BOARD
  || new URL('../../prioritization-board-grid.html', import.meta.url).pathname;

// `html` boots a board from a STRING rather than from disk -- what buildSavedHtml() hands back,
// so a saved file can be reopened and compared against the board that wrote it.
// `appn` opens that appropriation ('FULL FUND') the way a browser that last chose it would: set in
// browser storage before the page parses, so nothing is added to the page's own source -- a board
// booted that way still saves, publishes and opens its frames from a clean SRC0.
// `ls` is what the browser already holds ({key: value}), for "the same browser, reopened": each
// jsdom window has storage of its own.
// EVERY BOARD THIS PROCESS OPENS (v1.86), so a suite can close the ones a block has finished with. A
// jsdom window is a whole board -- ~3 MB of page and everything it built -- and one left open is kept
// for the life of the process. audit-import boots ~100 of them; unclosed, one run peaked at 5.3 GB and
// four of them at once (the mutation sweep) no longer fitted in the machine. bootMark() before a
// block, bootRelease(mark, keep) after it: every board opened since the mark is closed except `keep`.
const OPEN = [];
// STOP AT THE FIRST FAILED CHECK -- IN THE MUTATION SWEEP ONLY (v1.87). The sweep asks one thing of a
// suite: does ANY check fail on this mutated board? The first failure answers it; running the rest
// was most of a caught mutation's cost. mutate.mjs sets MUT_FIRST_FAIL=1 for the suites it runs, and
// each suite hands its failures list here. Nothing else sets it, so `npm run audit`, the gate's own
// suite stage and a run by hand still report every failure. No suite ever removes a recorded failure,
// so stopping at the first cannot turn a failing run into a passing one. The line is the one the
// sweep already reads ("N FAILING CHECK(S)"), written synchronously so exiting cannot lose it.
export function stopAtFirstFailure(failures) {
  if (process.env.MUT_FIRST_FAIL !== '1') return failures;
  failures.push = function (...xs) {
    const n = Array.prototype.push.apply(this, xs);
    let first = ''; try { first = JSON.stringify(xs[0]).slice(0, 400); } catch { first = String(xs[0]); }
    writeSync(1, `\n${this.length} FAILING CHECK(S) -- stopped at the first (MUT_FIRST_FAIL)\n\n--- ${first}\n`);
    process.exit(1);
    return n;
  };
  return failures;
}
export const bootMark = () => OPEN.length;
export function bootRelease(mark, keep = []) {
  const kept = new Set(keep);
  for (let i = OPEN.length - 1; i >= mark; i--) {
    if (kept.has(OPEN[i])) continue;
    try { OPEN[i].close(); } catch {}
    OPEN.splice(i, 1);
  }
}
// A CLOSED BOARD IS FREED ONLY WHEN NOTHING HOLDS IT, AFTER A FEW COLLECTIONS WITH THE LOOP TURNING.
// Two things held them in audit-import (measured: every one of its ~105 boards alive at the end, +10
// MB a block, 1.6 GB live, peaks of 5-6 GB). A board created in a TOP-LEVEL `{ }` block of a module is
// kept for the life of the module -- the identical code inside a function lets it go -- so each block
// runs as `await (async () => { ... })();`. And a disposed V8 context goes only over several cycles
// with the loop turning between them, which a suite running top to bottom never does:
// settleBoards() after a bootRelease() gives it those turns.
setFlagsFromString('--expose-gc');
const collect = runInNewContext('gc');
export async function settleBoards(rounds = 1) {
  for (let k = 0; k < rounds; k++) { collect(); await new Promise(r => setImmediate(r)); }
}
// THE PROGRAM, SET IN RATHER THAN PARSED (v1.86). A board is ~3.2 MB, ~3.1 MB of it one inline
// <script> -- the program -- which is the last thing in <body>. jsdom's HTML parser reads a script
// body one character at a time: 634 ms of every 687 ms boot was that, not running the board. So the
// page is parsed with a placeholder where the program sits and the program is then put in its place
// as a script element whose text is set whole; jsdom runs it at that moment, exactly where the
// parser would have, with every element before it already built. The page ends up the same, byte for
// byte -- the program's first line records its own source (SRC0), and every save and PMO copy is
// built from it -- which tools/export-audit/boot-same.mjs proves (audit:suites runs it first). A page not shaped like a board
// (no pubMode block, or anything but </body></html> after the program) takes the ordinary parse,
// and BOOT_PARSE=1 forces it everywhere.
const PH = '<script type="text/x-orbit-program"></script>';
function splitProgram(src) {
  if (process.env.BOOT_PARSE === '1') return null;
  const pm = src.indexOf('id="pubMode"'); if (pm < 0) return null;
  const a = src.indexOf('<script>', pm), b = src.lastIndexOf('</script>');
  if (a < 0 || b < a || !/^\s*<\/body>\s*<\/html>\s*$/.test(src.slice(b + 9))) return null;
  return { page: src.slice(0, a) + PH + src.slice(b + 9), code: src.slice(a + 8, b) };
}
export function boot({ svc, items, quiet = true, html = null, appn = null, ls = null } = {}) {
  const vc = new VirtualConsole();
  const errors = [];
  vc.on('jsdomError', e => errors.push(e.message));
  if (!quiet) vc.sendTo(console);

  const src = html != null ? html : readFileSync(BOARD, 'utf8');
  const split = splitProgram(src);
  const dom = new JSDOM(split ? split.page : src, {
    runScripts: 'dangerously',
    virtualConsole: vc,
    url: 'https://example.invalid/board.html',
    beforeParse(win) {
      if (ls) for (const k of Object.keys(ls)) { try { win.localStorage.setItem(k, ls[k]); } catch {} }
      if (appn) { try { win.localStorage.setItem('prio27appn', appn); } catch {} }
    },
  });
  const w = dom.window;
  if (split) {
    const ph = w.document.querySelector('script[type="text/x-orbit-program"]');
    const sc = w.document.createElement('script');
    sc.textContent = split.code;
    // what the parser had not reached yet when it ran the program -- the whitespace after it, inside
    // <body> and after it -- comes out while the program runs and goes back after, so SRC0 is the
    // parser's, character for character
    const later = [];
    for (let n = ph; n && n !== w.document.documentElement; n = n.parentNode)
      for (let x = n.nextSibling; x; x = x.nextSibling) later.push([n.parentNode, x]);
    later.forEach(([, x]) => x.remove());
    ph.replaceWith(sc);                     // connected, so jsdom runs it now
    later.forEach(([parent, x]) => parent.appendChild(x));
  }
  OPEN.push(w);
  // Things the page touches that jsdom does not implement. None of them are on the math path.
  w.URL.createObjectURL = () => 'blob:stub';
  w.URL.revokeObjectURL = () => {};
  w.HTMLAnchorElement.prototype.click = function () {};
  w.alert = () => {}; w.confirm = () => true; w.prompt = () => null;
  // Streams and fetch primitives the XLSX reader needs. jsdom ships none of them; every real
  // browser does, and Node has them globally. Injecting the SAME realm's Blob alongside Response
  // and DecompressionStream matters -- a jsdom Blob piped into a Node stream does not interop, and
  // the failure looks like a corrupt workbook rather than a missing polyfill.
  for (const g of ['Blob', 'Response', 'Request', 'Headers', 'ReadableStream', 'WritableStream',
                   'TransformStream', 'DecompressionStream', 'CompressionStream']) {
    if (typeof globalThis[g] === 'function') w[g] = globalThis[g];
  }

  // THE OTHER APPROPRIATIONS' FRAMES (v1.85). The five-year plan opens each other appropriation in a
  // sandboxed srcdoc frame, which jsdom does not run. Here the frame is a second board booted from
  // the very HTML the page built for it -- its storage shim included, so it reads the copy it was
  // handed and nothing else -- asked the same question, and answering at once, so every tool that
  // captures a workbook synchronously still does. What each frame did is kept on __fydpFrames for
  // the suites. The browser path itself (the iframe, postMessage, storage untouched) is checked in
  // Chromium by tools/fydp-frames.mjs.
  w.__fydpFrames = [];
  w.fydpFrame = (html, nonce) => {
    let r, c = null, keys = [];
    try {
      c = boot({ html, quiet });
      const F = c.w.__fydpFrame;
      if (!F) throw new Error('the frame shim did not run');
      F.done = true;
      r = JSON.parse(c.w.eval(`JSON.stringify(fydpProbeReply(${JSON.stringify(F.src)}))`));
      keys = JSON.parse(c.w.eval('JSON.stringify((function(){ var o=[]; for(var i=0;i<localStorage.length;i++) o.push(localStorage.key(i)); return o; })())'));
    } catch (e) { r = { err: String((e && e.message) || e) }; }
    w.__fydpFrames.push({ nonce, err: r.err || '', errors: c ? c.errors.slice() : [], keys, bytes: html.length });
    try { if (c) { c.w.close(); const i = OPEN.indexOf(c.w); if (i >= 0) OPEN.splice(i, 1); } } catch {}
    r.nonce = nonce;
    return { then(ok) { ok(r); return this; } };
  };

  const ev = code => w.eval(code);
  return { dom, w, ev, errors };
}

// Build a board with known numbers. Deliberately awkward on purpose: uneven per-service asks,
// so any place that averages across services instead of weighting by service shows up.
export function seed(ev, { services, items, disc, mand, order, mc = {}, fsrc = {}, alloc = {} }) {
  // NOTE: applyState() rebuilds DATA.items from the baseline, so items must be pushed AFTER it.
  ev(`
    SVC.length = 0;
    ${JSON.stringify(services)}.forEach(s => SVC.push(s));
    DATA.services = SVC;
    if (typeof MS === 'undefined' || !MS) { MS = {base:2027, cur:2027, ts:0, years:{}}; }
    MS.cur = 2027; MS.base = 2027;
    const st = {
      order: ${JSON.stringify(order)},
      alloc: ${JSON.stringify(alloc)},
      mc: ${JSON.stringify(mc)},
      fsrc: ${JSON.stringify(fsrc)},
      custom: [], removed: [],
      discSvc: ${JSON.stringify(disc)},
      mandSvc: ${JSON.stringify(mand)}
    };
    MS.years['2027'] = st;
    applyState(st);
    DATA.items.length = 0;
    ${JSON.stringify(items)}.forEach(i => DATA.items.push(i));
    S.discSvc = ${JSON.stringify(disc)};
    S.mandSvc = ${JSON.stringify(mand)};
    S.order   = ${JSON.stringify(order)};
    S.fsrc    = ${JSON.stringify(fsrc)};
    S.mc      = ${JSON.stringify(mc)};
    S.alloc   = ${JSON.stringify(alloc)};
    'ok';
  `);
}

// Run exportExcel but capture the sheet objects instead of building a file.
export function capture(ev) {
  ev(`
    globalThis.__sheets = null;
    if (!globalThis.__origBuildXlsx) globalThis.__origBuildXlsx = buildXlsx;
    buildXlsx = function(sheets, extra){ globalThis.__sheets = sheets; return new Uint8Array(0); };
    exportExcel();
    'ok';
  `);
  return ev('JSON.stringify(globalThis.__sheets)');
}

// A cell may be a bare value or {v,s}. Normalise.
export const cv = c => (c && typeof c === 'object' && 'v' in c) ? c.v : c;
export const num = c => { const v = cv(c); return typeof v === 'number' ? v : NaN; };
