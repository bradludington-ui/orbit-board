// summarize.mjs <results.json> : per-check pass/fail counts per scenario, and the key observed figures (product path)
import { readFileSync } from 'node:fs';
const r = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const J = JSON.stringify;
const t = {};
r.results.forEach(x => { const k = x.id; t[k] = t[k] || {}; const s = x.scenario.split('|').slice(1).join('|'); t[k][s] = t[k][s] || { passed: 0, failed: 0, recorded: 0 }; t[k][s][x.status]++; });
console.log(`board ${r.boardLabel} blob ${r.boardBlob}: passed ${r.passed}, failed ${r.failed} (${J(r.failedByKind)}), recorded ${r.recorded}; product=state agree ${J(r.agree)}`);
for (const k of Object.keys(t)) console.log(k.padEnd(9), Object.entries(t[k]).map(([s, v]) => `${s}: ${v.passed}P/${v.failed}F`).join('  '));
for (const s of r.scenarios.filter(s => s.path === 'product')) {
  console.log(`--- ${s.scenario}`);
  for (const k of ['c1', 'c2', 'c3']) { const x = s.reads[k]; console.log(k, J({ sel: x.flow.selYears, tot: x.flow.tot, exec: x.flow.execV, plan: x.flow.planV, panel: x.panel.total, xlTot: x.export.tot, xlUs: x.export.us, om: x.export.lines.om, sp: x.export.lines.sp, mix: !!x.panel.mix, note: x.export.notes.some(n => n.startsWith('NOTE: planned and executed')), label: x.flow.label })); }
  for (const w of ['c4', 'c4reopen']) for (const k of ['c4a', 'c4b', 'c4c']) { const x = s.reads[w][k]; console.log(w, k, J({ sel: x.flow.selYears, tot: x.flow.tot, exec: x.flow.execV, plan: x.flow.planV, panel: x.panel.total, xlTot: x.export.tot, om: x.export.lines.om, sp: x.export.lines.sp, label: x.flow.label, boxes: x.panel.boxes.length })); }
  console.log('c4 seq', J(s.reads.c4.seq.map(q => q[1])), 'reopen seq', J(s.reads.c4reopen.seq.map(q => q[1])));
  console.log('chip26', J(s.reads.c4.chip26));
  console.log('c6', J({ with: [s.reads.c6with.flow.tot, s.reads.c6with.flow.execV, s.reads.c6with.flow.planV, s.reads.c6with.exportTot], without: [s.reads.c6without.flow.tot, s.reads.c6without.flow.execV, s.reads.c6without.flow.planV, s.reads.c6without.exportTot], reopen: s.reads.c4reopenAllYears.tot }));
  for (const k of ['c5-with-plan', 'c5-after-removal']) { const x = s.reads[k]; console.log(k, J({ saved: x.saved, sel: x.flow.sel, tot: x.flow.tot, label: x.flow.label, chipsOn: x.panel.chipsOn, scope: x.export.scope, xlTot: x.export.tot, yearsInCopy: x.ms.keys, confirm: x.confirm.n, errors: x.errors.length })); }
  console.log('detector', J(s.detectorControl));
}
