// v2.13 (item 136): THE PPBE CYCLE AT THE TOP OF THE BOARD, put on a board for the browser checks to measure -- the same state
// for keyboard-reach V, layout-fits S and standards-check, so each measures one header.
//
// CYC_TAG_SEED (page code, evaluated in a board before it is saved -- buildPopulated's `extra`) tags the plan on screen BES28 and
// logs this appropriation's BES28 position for the year on screen: the first service $1 of discretionary and nothing of
// mandatory, with the first requirement directing its whole value there on a Split -- an OVER -- and the second service
// $12,345,678,901 of discretionary nobody holds -- UNALLOCATED, in the billions. The figure beside the PPBE cycle then states both
// ("FY27 · $12.35B unallocated · ⚠ … over"), so #cycFit is on screen to be reached and measured.
//
// cycOtherStore(cycle) is another appropriation's saved plan as its own board keeps it in browser storage, tagged `cycle` and
// logging controls for it: seeded beside the board under that appropriation's key, it puts the appropriations on different
// cycles, so the PPBE cycle reads ⚠ Mixed and its list names each one's.
//
// seedLs(ctx, set) writes browser storage from a page of its own once it has loaded, and closes it -- NEVER from an init script.
// tools/pmo-save.mjs measured why (v2.12): an init script runs while a file:// document is still being created, and in
// Chromium 153 a storage access that early sometimes gives the tab a storage area of its own, so what it seeds never reaches the
// board. Every file:// page shares one origin, so a seed page in a folder of its own seeds the board's storage.
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const CYC_TAG_SEED = `(function(){
  var cur=+MS.cur, id=S.order[0], it=itemById(id), val={};
  val[SVC[0]]={_all:{}}; val[SVC[0]]._all[cur]={d:1, m:0};
  val[SVC[1]]={_all:{}}; val[SVC[1]]._all[cur]={d:12345678901, m:0};
  MS.ppbe=MS.ppbe||{}; MS.ppbe['BES|2028']={v:2, split:true, lines:{}, val:val};
  MS.cycle='BES|2028';
  S.fsrc[id]={m:'split', dv:it.ask.slice(), mv:SVC.map(function(){ return 0; })};
  baLiveAll(); })();`;

// Another appropriation's plan, as its board keeps it: one year, nothing in it, tagged `cycle`, with that cycle's controls logged
// for its first service -- so the PPBE cycle's list says "controls entered" for it. `ts` newer than any file it could meet.
export const cycOtherStore = (cycle, fy = 2027, svc = 'USAF') => JSON.stringify({
  base: fy, cur: fy, ts: Date.now(), by: 'Pat', cycle,
  ppbe: { [cycle]: { v: 2, split: true, lines: {}, val: { [svc]: { _all: { [fy]: { d: 500000000, m: 0 } } } } } },
  years: { [fy]: { order: [] } } });

// The browser-storage key each appropriation's plan is kept under (the board's _SLUGMAP)
export const CYC_KEY = { om: 'prio27om', ff: 'prio27ff', sp: 'prio27sp', opn: 'prio27opn' };

let SEEDF = '';
export const seedLs = async (ctx, set, rm = []) => {
  if (!SEEDF) { const d = mkdtempSync(join(tmpdir(), 'orbit-cycseed-')); SEEDF = join(d, 'seed.html');
    writeFileSync(SEEDF, '<!doctype html><meta charset="utf-8"><title>seed</title>');
    process.on('exit', () => { try { rmSync(d, { recursive: true, force: true }); } catch {} }); }
  const p = await ctx.newPage(); await p.goto('file://' + SEEDF);
  await p.evaluate(([set, rm]) => { rm.forEach(k => localStorage.removeItem(k)); Object.keys(set).forEach(k => localStorage.setItem(k, set[k])); }, [set, rm]);
  await p.close();
};
