// v2.23 W2 (item 158, one requirement across the FYDP): the board the Across the FYDP browser check (tools/fydp-across.mjs) and its
// screenshots read. Built through the board's own code in jsdom and written out as a saved board file, so Chromium opens a populated
// board the way a person does. Base FY27, so the window is FY26 (the year before the base) to FY31. What it carries, each because a
// part of the tab needs it to have something to show:
//   - six services and five requirements in FY27, R001 the one the tab is opened on, with a nine-digit USAF requirement (a box must
//     show $123,456,789 whole);
//   - FY28 and FY29 rolled forward from FY27, FY29's lanes cut so R001 is short there, and in FY29 a directed USAF discretionary figure
//     its lane cannot pay (the box keeps it and says what it drew);
//   - FY30 started blank, holding other work of its own -- it has R001 in no form: "Add to FY30" -- and FY31 and FY26 not started.
import { boot, seed } from './export-audit/boot.mjs';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const SVCN = ['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC-C', 'USN'];
const PMOS = ['PSM', 'AV', 'ATL', 'MxS', 'CDS'];

export function buildAcrossBoard(html) {
  const items = Array.from({ length: 5 }, (_, i) => ({
    id: 'R' + String(i + 1).padStart(3, '0'), grp: PMOS[i], team: PMOS[i], sect: '', custom: false,
    title: 'Requirement ' + (i + 1), event: 'Requirement ' + (i + 1), ccar: '', fy26: SVCN.map(() => 0),
    ask: SVCN.map((_, j) => Math.round([1200, 690, 375, 820, 610, 415][j] * 1000 * (1 + ((i * 3 + j) % 4) / 5))),
    alloc: null }));
  items[0].title = items[0].event = 'OGC Engine Module Repair Capacity';
  items[0].ask[0] = 123456789;
  const sc = { services: SVCN, items, disc: [140000000, 3000000, 1600000, 3800000, 2600000, 1900000],
    mand: [20000000, 600000, 300000, 700000, 500000, 400000], order: items.map(x => x.id), mc: {} };
  const { ev } = boot({ html });
  seed(ev, sc);
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    S.order.forEach(function(id, i){ S.ccar[id]='JSF'+(5003+i); S.pid[id]='PID'+(9003+i); });
    applyState(S); S.order.forEach(function(id){ seedSplit(id); }); save();
    window.confirm=function(){ return true; };
    switchYear(2028); var a=itemById('R001').ask.slice(); a[1]=a[1]+21000; applyAskVec('R001', a); save();
    switchYear(2027); switchYear(2029);
    S.discSvc=S.discSvc.map(function(v){ return Math.round(v*0.4); }); S.bm={disc:S.discSvc.slice(), mand:S.mandSvc.slice(), adds:[]};
    applyState(S); var _f=S.fsrc.R001; _f.dv[0]=_f.dv[0]+5000000; save();
    switchYear(2027);
    var _q=0; window.confirm=function(){ return (_q++)>0; }; switchYear(2030); window.confirm=function(){ return true; };
    reqCreate('AV', {title:'Other work', event:'Other work', ask:[999000,0,0,0,0,0]}); save();
    switchYear(2027); render(); 'ok'`);
  const dir = mkdtempSync(join(tmpdir(), 'orbit-across-'));
  const file = join(dir, 'board.html');
  writeFileSync(file, ev('buildSavedHtml()'));
  return { file, dir, done: () => { try { rmSync(dir, { recursive: true, force: true }); } catch {} } };
}
