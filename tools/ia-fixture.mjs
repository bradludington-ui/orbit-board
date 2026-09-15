// A POPULATED board, written to a temp file, for the IA tools to measure.
//
// Measuring the bare board file is measuring a board nobody uses. With no requirements loaded, the
// panels that only appear beside data are not in the DOM at all -- the first census run counted 98
// clickables against 810 on a loaded board, and reported six healthy exports as unreachable because
// the buttons that reach them had not been rendered yet. A review of an empty board is a review of
// something the programme office never opens.
import { boot, seed } from './export-audit/boot.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SVCN = ['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC-C', 'USN'];
const PMOS = ['PSM', 'PP', 'AV', 'MxS', 'CDS', 'TSS'];
const NAMES = ['Sustainment Fuel (Ferry Flights)', 'Depot Field Team Travel',
  'ALIS/ODIN Infrastructure Refresh', 'Engine Module Repair Capacity',
  'Low Observable Restoration Kits', 'Flight Test Instrumentation',
  'Training GDOS Eglin IT Support', 'Supply Chain Data Analytics'];

export function buildPopulated(boardFile) {
  const items = [];
  PMOS.forEach((g, gi) => {
    for (let k = 0; k < 6; k++) {
      const i = items.length;
      items.push({ id: 'R' + String(i).padStart(3, '0'), grp: g, team: g, sect: '', custom: false,
        title: 'OGC - ' + NAMES[i % NAMES.length], event: 'OGC ' + NAMES[i % NAMES.length],
        ccar: 'JSF' + (5000 + i), fy26: SVCN.map(() => 0),
        ask: SVCN.map((_, j) => Math.round([850000, 2671000, 500000, 2306185, 1250000, 740000][(i + j) % 6] * (j === 0 ? 1 : 0.3))),
        alloc: null });
    }
  });
  const sc = { services: SVCN, items,
    disc: [38000000, 7000000, 3500000, 6000000, 2400000, 3600000],
    mand: [ 9000000, 1800000,  900000, 1500000,  600000,  900000],
    order: items.map(x => x.id),
    mc: Object.fromEntries(items.filter((_, i) => i % 5 === 0).map(x => [x.id, true])) };

  const { ev } = boot({ html: readFileSync(boardFile, 'utf8') });
  seed(ev, sc);
  // Enough state that the data-dependent surfaces render: bands, trims, award dates, split sources.
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.order.forEach(function(id,i){
        if(i%4===0) S.band[id]='pdm'; else if(i%7===0) S.band[id]='ktlo';
        if(i%5===0) S.alloc[id]={m:'t', v:Math.round(itemById(id).ask.reduce(function(a,b){return a+b;},0)*0.6)};
        if(i%9===0) seedSplit(id);
        if(i%6===0) S.awards[id]={mode:'single', d:FYMON[(i%10)][0], day:9};
        if(i%11===0) S.cons[id]='Depot line stops in March; aircraft unsupported into FY28.';
        S.pid[id]='PID'+(9000+i);
      });
      applyState(S); save(); 'ok'`);

  const dir = mkdtempSync(join(tmpdir(), 'spmt-ia-'));
  const out = join(dir, boardFile.split('/').pop());
  writeFileSync(out, ev('buildSavedHtml()'));
  return out;
}
