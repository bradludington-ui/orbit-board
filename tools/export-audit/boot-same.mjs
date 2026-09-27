// THE FAST BOOT CHANGES NOTHING THE BOARD CAN SEE (v1.86). boot.mjs sets the board's program in as
// a whole script element instead of letting jsdom's parser read it a character at a time (5-6x
// faster). This proves, on both builds, for a board as shipped, seeded and rendered, reopened from
// its own save, and as a published PMO copy, that the two ways give the same page, the same source
// the program records for every save (SRC0), the same saved file (the clock held still, since a save
// stamps it) and the same errors. audit:suites runs it first; BOOT_PARSE=1 is the ordinary parse.
//   node tools/export-audit/boot-same.mjs
import { boot, seed } from './boot.mjs';
import { readFileSync } from 'node:fs';
const MINE = ['USAF', 'ANG', 'AFRC'];
const it = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: 'Req ' + id, event: id, ccar: 'JSF5594', fy26: ask.map(() => 0), ask, alloc: null });
const sc = { services: MINE, items: [it('A', 'AV', [5e6, 1e6, 5e5]), it('B', 'PSM', [2e6, 3e5, 0])], disc: [6e6, 1e6, 2e5], mand: [1e6, 3e5, 1e5], order: ['A', 'B'] };
let bad = 0;
const both = (label, opts, after) => {
  const r = {};
  for (const mode of ['parse', 'fast']) {
    process.env.BOOT_PARSE = mode === 'parse' ? '1' : '';
    const t0 = performance.now();
    const B = boot(opts);
    const ms = performance.now() - t0;
    B.ev('Date.now = function(){ return 1790000000000; }; 1');   // a save stamps the time
    if (after) after(B.ev);
    r[mode] = { ms, src0: B.ev('SRC0'), dom: B.ev('document.documentElement.outerHTML'), saved: B.ev('buildSavedHtml()'), errors: B.errors.join('|') };
    B.w.close();
  }
  const same = k => r.parse[k] === r.fast[k];
  const ok = same('src0') && same('dom') && same('saved') && same('errors');
  if (!ok) bad++;
  console.log(`${ok ? 'same' : 'DIFF'}  ${label.padEnd(40)} parse ${r.parse.ms.toFixed(0)} ms · fast ${r.fast.ms.toFixed(0)} ms` + (ok ? '' : '  ' + ['src0', 'dom', 'saved', 'errors'].filter(k => !same(k)).join(',')) + (r.fast.errors ? '  errors: ' + r.fast.errors.slice(0, 80) : ''));
  return r.fast.saved;
};
for (const f of ['prioritization-board.html', 'prioritization-board-grid.html']) {
  process.env.BOARD = new URL('../../' + f, import.meta.url).pathname;
  const html = readFileSync(process.env.BOARD, 'utf8');
  both(f + ' as shipped', { html });
  const saved = both(f + ' seeded, rendered', { html }, ev => { seed(ev, sc); ev('save(); render(); 1'); });
  both(f + ' reopened from its save', { html: saved }, ev => ev('render(); 1'));
  process.env.BOOT_PARSE = '';
  const P = boot({ html: saved });
  const copy = P.ev(`pmoCopyHtml({ sandbox: true, by: 'T', ts: 1790000000000, fy: MS.cur, ap: APPN, base: pmoBaseline(), pv: PMO_PV, ord: {} })`);
  P.w.close();
  both(f + ' a published PMO copy', { html: copy }, ev => ev('render(); 1'));
}
console.log(bad ? `${bad} DIFFERENT` : 'every page, source, save and error list is identical either way');
process.exit(bad ? 1 : 0);
