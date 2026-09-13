// Boot the real board in jsdom and hand back a window we can drive.
import { JSDOM, VirtualConsole } from 'jsdom';
import { readFileSync } from 'node:fs';

export const BOARD = process.env.BOARD
  || new URL('../../prioritization-board.html', import.meta.url).pathname;

// `html` boots a board from a STRING rather than from disk -- what buildSavedHtml() hands back,
// so a saved file can be reopened and compared against the board that wrote it.
export function boot({ svc, items, quiet = true, html = null } = {}) {
  const vc = new VirtualConsole();
  const errors = [];
  vc.on('jsdomError', e => errors.push(e.message));
  if (!quiet) vc.sendTo(console);

  const dom = new JSDOM(html != null ? html : readFileSync(BOARD, 'utf8'), {
    runScripts: 'dangerously',
    virtualConsole: vc,
    url: 'https://example.invalid/board.html',
  });
  const w = dom.window;
  // Things the page touches that jsdom does not implement. None of them are on the math path.
  w.URL.createObjectURL = () => 'blob:stub';
  w.URL.revokeObjectURL = () => {};
  w.HTMLAnchorElement.prototype.click = function () {};
  w.alert = () => {}; w.confirm = () => true; w.prompt = () => null;

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
