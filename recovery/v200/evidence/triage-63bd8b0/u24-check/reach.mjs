// reach.mjs <out.json> <leaf...> : prints, read-only, where each leaf content is at the end, at the reopen and after the
// reopen's one edit (the probe's own `reach` lists), plus the screen, the record and the status lines at those points.
import { readFileSync } from 'node:fs';
const [p, ...leaves] = process.argv.slice(2);
const O = JSON.parse(readFileSync(p, 'utf8')); const R = O.steps;
const pts = [['end', R.end], ['reopened', R.reopen && R.reopen.opened], ['edited', R.reopen && R.reopen.afterEdit], ['refresh', R.afterRefresh]];
console.log(O.scenario, 'probe', O.IDS.probe.slice(0, 8), 'board', O.IDS.board.slice(0, 8));
for (const [n, o] of pts) { if (!o) continue;
  console.log(' ', n.padEnd(9), 'screen', o.screen.whose, '| recordedClean', o.recordedClean, '| base', o.baseCopy.whose, '| falselyClean', o.falselyClean,
    '| kept', o.kept ? o.kept.whose : null, '| stored', o.stored ? o.stored.whose : null);
  for (const m of leaves) console.log('     ', m.padEnd(8), JSON.stringify(o.reach[m] || []));
  console.log('      status:', (o.status || '').slice(0, 170)); }
