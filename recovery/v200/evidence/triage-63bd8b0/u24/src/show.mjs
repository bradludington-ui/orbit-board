// show.mjs <out.json>... : prints each observation of a probe run, compactly. Reader only (no board is run).
import { readFileSync } from 'node:fs';
const S = o => !o ? '-' : `screen=${o.screen && o.screen.whose} clean=${o.recordedClean} base=${o.baseCopy && o.baseCopy.whose}@${o.baseCopy && o.baseCopy.where} FALSELY=${o.falselyClean}`
  + ` DIRTY=${o.DIRTY} bd=${o.base && o.base.dirty} busy=${o.busy} gen=${o.gen} kept=${o.kept && o.kept.whose}${o.kept ? '(' + o.kept.why + ')' : ''} stored=${o.stored && o.stored.whose}`
  + (o.head !== undefined ? ` head=${o.head && o.head.whose} hist=[${(o.hist || []).map(h => h.whose).join(',')}]` : '')
  + (o.file ? ` file=${o.file.whose} writes=${o.fileWrites}` : '')
  + `\n      header=${JSON.stringify(o.header)} btns=${JSON.stringify(o.statusBtns)}\n      status=${JSON.stringify((o.status || '').slice(0, 260))}`
  + `\n      reach=${JSON.stringify(o.reach)}`;
for (const p of process.argv.slice(2)) {
  const O = JSON.parse(readFileSync(p, 'utf8'));
  console.log('=====', O.scenario, 'board', O.IDS.board.slice(0, 8), 'probe', O.IDS.probe.slice(0, 8), 'errors', O.errors.length, O.incomplete || '', 'wall', O.wall_s);
  if (O.errors.length) console.log(O.errors.join('\n'));
  const R = O.steps;
  for (const k of Object.keys(R)) {
    const v = R[k];
    if (v && v.screen) console.log(' ', k, '|', v.label, '\n     ', S(v), v.asked && v.asked.length ? '\n      asked=' + JSON.stringify(v.asked.map(q => q.slice(0, 140))) : '');
    else if (v && v.opened) { console.log(' ', k, '(reopen) connect=', JSON.stringify(v.connect)); console.log('   opened\n     ', S(v.opened)); console.log('   afterEdit\n     ', S(v.afterEdit)); }
    else console.log(' ', k, '=', JSON.stringify(v).slice(0, 400));
  }
}
