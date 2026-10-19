// xshow.mjs -- the checker's reader (from the builder's src/show.mjs, plus tick1/tick2/opening/counted): prints the
// observed values of probe outputs compactly. Reads JSON only.
import { readFileSync } from 'node:fs';
const J = JSON.stringify;
const cut = (s, n = 230) => { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n) + '…' : s; };
const st = o => o ? J({ screen: o.screen, saved: o.saved, DIRTY: o.DIRTY, bd: o._baseDirty, rd: o.base && o.base.dirty, dB: o.driveBase, LK: o.LASTKNOWN, busy: o.busy,
  kept: o.kept && (o.kept.note + '/' + o.kept.why), head: o.head && (o.head.note + '@' + o.head.ts + ' by ' + o.head.by), hist: o.hist && o.hist.map(h => h.note + (/-recent/.test(h.name) ? '(r)' : '')),
  file: o.file && (o.file.note + '@' + o.file.ts + ' w' + o.file.writes), fc: o.falselyClean, reach: o.reach, putBack: o.hasPutBack }) : '-';
for (const p of process.argv.slice(2)) {
  const O = JSON.parse(readFileSync(p, 'utf8')); const R = O.steps;
  console.log('==== ' + O.scenario + '  ' + p.split('/').pop() + '  errors=' + O.errors.length + (O.incomplete ? ' INCOMPLETE ' + O.incomplete : '') + '  T=' + J(O.T) + '  counted=' + (O.counted || '-'));
  if (O.errors.length) console.log('  ERR', cut(O.errors[0], 900));
  console.log('  tabA', J(O.tabA));
  if (R.setup && R.setup.opening) console.log('  opening', cut(J(R.setup.opening), 700));
  for (const k of ['setup', 'Aheld', 'waiting', 'premise', 'tick1Pending', 'xSave', 'refreshRet', 'putBackClick', 'during', 'Aret', 'saveRet', 'tick1Ret', 'tick1', 'tick2Ret', 'tick2', 'save', 'grantOrder', 'nextRet', 'next', 'lastAppnChoice', 'reopenPull', 'reopen']) {
    if (!(k in R)) continue; const v = R[k];
    if (v && typeof v === 'object' && 'screen' in v) {
      console.log('  ' + k.padEnd(10), st(v));
      console.log('  ' + ''.padEnd(10), 'status:', cut(v.status), '| prompts:', cut(J(v.prompts), 200), '| header:', cut(v.header, 80));
      if (v.rec) console.log('  ' + ''.padEnd(10), 'rec:', cut(J(v.rec), 400));
      if ('msUnchanged' in v || 'unchanged' in v || 'theirsNotNewer' in v) console.log('  ' + ''.padEnd(10), J({ msUnchanged: v.msUnchanged, keptUnchanged: v.keptUnchanged, unchanged: v.unchanged, theirsNotNewer: v.theirsNotNewer }));
    } else console.log('  ' + k.padEnd(10), cut(J(v), 600));
  }
  console.log('  lock', J({ stats: { ...O.lock.browser.stats, label: undefined }, other: O.lock.other.stats.grants }));
  console.log('  writes', cut(J(O.folderWrites), 600));
}
