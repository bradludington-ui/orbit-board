// v2.22 W3 (item 155, the RECORD card): the board the record's browser check (tools/record-card.mjs) and its screenshots read.
// Built through the board's own code in jsdom and written out as a saved board file, so Chromium opens a populated board the
// way a person does. What it carries, each because a part of the record needs it to have something to show:
//   - six services and seven offices, every band, a trimmed allocation and must-pays (the figures line, 149.31);
//   - R001 starred and short of discretionary (the MC shortage beside the figures, only when starred and short);
//   - R002 on three incremental awards (one block per award, 149.43), and R004 with an award repaired on opening;
//   - R003 a prime contract with two CLINs (the CLIN line, 149.48);
//   - R005 with its record fields set (the line of obligation category, WBS and Goes to, 149.47);
//   - a BAE list whose names run long, one line chosen and the rest by rule (149.34, 149.24 c);
//   - FY28 started from FY27 and one value moved there (the other years' line, 149.50).
import { boot, seed } from './export-audit/boot.mjs';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const SVCN = ['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC-C', 'USN'];
const PMOS = ['PSM', 'AV', 'ATL', 'MxS', 'CDS', 'TSS', 'PP'];

export function buildRecordBoard(html) {
  const items = Array.from({ length: 14 }, (_, i) => ({
    id: 'R' + String(i + 1).padStart(3, '0'), grp: PMOS[i % 7], team: PMOS[i % 7], sect: '', custom: false,
    title: 'Requirement ' + (i + 1), event: 'Requirement ' + (i + 1), ccar: '', fy26: SVCN.map(() => 0),
    ask: SVCN.map((_, j) => Math.round([2400, 380, 210, 1150, 420, 640][j] * 1000 * (1 + ((i * 7 + j) % 5) / 4))),
    alloc: null }));
  items[0].title = items[0].event = 'Engine depot overhaul with a long title that runs on past one line of the record';
  const sc = { services: SVCN, items, disc: [9200000, 1450000, 860000, 4150000, 1760000, 2500000],
    mand: [1700000, 270000, 160000, 760000, 320000, 460000], order: items.map(x => x.id),
    mc: { R001: true, R005: true, R012: true } };
  const { ev } = boot({ html });
  seed(ev, sc);
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    var B=['safety','pdm','netavail','ktlo','pdm','liab','liab','netavail','netavail','safety','netavail','ktlo','netavail','netavail'];
    S.order.forEach(function(id,i){ S.band[id]=B[i]; S.ccar[id]='JSF'+(7100+i*7); S.pid[id]='PID'+(4200+i*3); });
    S.cons.R001='Line stops in March.';
    applyState(S);
    S.order.forEach(function(id){ seedSplit(id); });
    S.alloc.R010={m:'t', v:Math.round(askTot(itemById('R010'))*0.6)};
    S.fsrc.R001.dv=S.fsrc.R001.dv.map(function(v){ return Math.round(v*0.5); });
    S.ptype.R003='PRIME';
    if(!S.clinNew) S.clinNew={};
    S.clinNew.R003=[{key:'n1', clin:'0001', desc:'Depot labour', ccar:'', ask:[800000,0,0,200000,0,0]},
                    {key:'n2', clin:'0002', desc:'Spares', ccar:'', ask:[400000,100000,0,0,0,0]}];
    S.ptype.R005='OGC'; S.obCat=S.obCat||{}; S.obCat.R005=OB_CATS[0]; S.wbs=S.wbs||{}; S.wbs.R005=[{w:'1.2.3 - Depot maintenance', v:[]}];
    S.awards.R002={mode:'inc', inc:[{d:'2026-11', day:4, sv:[600000,100000,50000,300000,100000,150000]},
                                     {d:'2027-02', day:16, sv:[600000,100000,50000,300000,100000,150000]},
                                     {d:'2027-05', day:1, sv:[0,0,0,0,0,0]}]};
    S.awards.R004={mode:'single', d:'2027-03', day:12, fix:{how:'repair', orig:'{"mode":"single","d":"2027-13","day":12}',
      n:['The date 2027-13 is not a month, so the award was set aside.'], at:1700000000000}};
    BUDDB={ts:1700000000041, files:[], rows:['USAF O&M- CAM Discretionary PSM', 'USAF O&M - CAM OBBBA Mandatory PSM', 'USAF O&M- CAM CONG PSM',
      'USAF O&M - ANG CAM Discretionary PSM', 'USAF O&M - ANG CAM OBBBA Mandatory PSM', 'USMC STOVL O&M -1A9A FL Discretionary PSM',
      'USN O&M CV Discretionary PSM'].map(budParseName).filter(Boolean)}; _budRegCache=null;
    if(!S.budgetAsg) S.budgetAsg={}; S.budgetAsg.R001={'USAF|disc':'USAF O&M- CAM CONG PSM'};
    applyState(S); save(); 'ok'`);
  // FY28 started from FY27, one value moved there, then back to FY27
  ev(`switchYear(2028); S.asks=S.asks||{}; var a=itemById('R001').ask.slice(); a[0]=a[0]+1000000; setAsk('R001',0,String(a[0])); switchYear(2027); 'ok'`);
  const dir = mkdtempSync(join(tmpdir(), 'orbit-record-'));
  const file = join(dir, 'board.html');
  writeFileSync(file, ev('buildSavedHtml()'));
  return { file, dir, done: () => { try { rmSync(dir, { recursive: true, force: true }); } catch {} } };
}
export const boardHtml = path => readFileSync(path, 'utf8');
