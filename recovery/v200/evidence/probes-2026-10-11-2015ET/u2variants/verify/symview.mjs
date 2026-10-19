// symview.mjs -- prints the checkpoint-related observed values of one probe output with every timestamp named by the
// scenario's own fixture times (R.T). Runs no board code. usage: node symview.mjs out.json
import { readFileSync } from 'node:fs';
const O = JSON.parse(readFileSync(process.argv[2], 'utf8'));
for (const sc of ['folder', 'file']) {
  const R = O[sc].race, T = R.T;
  const names = Object.entries(T).filter(([, t]) => t).sort((a, b) => b[1] - a[1]);
  const sym = v => { let s = JSON.stringify(v); s = s.replace(/\b1[78]\d{11}\b/g, m => { const hit = names.filter(([, t]) => String(t) === m).map(([k]) => k); return '<' + (hit.length ? hit.join('=') : '?' + m.slice(-5)) + '>'; }); return s; };
  const f = x => x ? sym({ D: x.DIRTY, bD: x._baseDirty, base: x.base, LK: x.LASTKNOWN, dB: x.driveBase, gen: x._saveGen, busy: x._saveBusy, MSts: x.MSts }) : '-';
  console.log(`\n### ${O.IDS.variant} ${sc}   T=${sym(T)}`);
  console.log('beforeRace  ', f(R.setup.beforeRace.flags), ' kept.meta', sym(R.setup.beforeRace.kept.meta));
  console.log('during      ', f(R.during.flags), ' kept', R.during.kept.note, sym(R.during.kept.meta), ' prompts', R.during.prompts.length, ' gen', R.during.genBefore, '->', R.during.genAfter);
  console.log('afterLanding', f(R.afterLanding.flags), ' where', sym(R.afterLanding.where), ' status', JSON.stringify(R.afterLanding.status), ' header', JSON.stringify(R.afterLanding.header));
  console.log('reopen1     ', f(R.reopen1.flags), ' where', sym(R.reopen1.where), ' status', JSON.stringify(R.reopen1.status), ' header', JSON.stringify(R.reopen1.header));
  console.log('reopen1+edit', sym(R.reopen1.afterOneEdit.where));
  if (R.retry.putBack) console.log('retry       ', f(R.retry.putBack.flags), ' where', sym(R.retry.putBack.where), ' prompts', JSON.stringify(R.retry.putBack.prompts), ' kept', JSON.stringify(R.retry.putBack.kept.present));
  console.log('save        ', 'head', R.save.headBefore, '->', R.save.headAfter, ' asked', R.save.asked, ' prompts', JSON.stringify(R.save.prompts), ' status', JSON.stringify(R.save.status));
  if (R.saveOver) console.log('saveOver    ', 'head', R.saveOver.headAfter, ' prompts', JSON.stringify(R.saveOver.prompts), ' status', JSON.stringify(R.saveOver.status));
  console.log('afterSave   ', f(R.afterSave.flags), ' where', sym(R.afterSave.where));
  console.log('reopen2     ', f(R.reopen2.flags), ' where', sym(R.reopen2.where), ' status', JSON.stringify(R.reopen2.status));
}
