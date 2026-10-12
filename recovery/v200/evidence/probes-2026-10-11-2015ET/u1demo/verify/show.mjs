import { readFileSync } from 'node:fs';
const a = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const which = process.argv[3] || 'product', K = +(process.argv[4] || 1e6);
const s = a.scenarios.find(x => x.path === which && x.K === K);
const J = JSON.stringify;
console.log('steps', J(s.steps).slice(0, 1500));
for (const k of ['c1', 'c2', 'c3']) { const r = s.reads[k]; console.log('\n==', k, J([r.flow.selYears, r.flow.selAppns, r.flow.tot, r.flow.execV, r.flow.planV, r.flow.appn]));
  console.log(' label:', r.flow.label); console.log(' panel total', r.panel.total, '| mix:', r.panel.mix); console.log(' boxes:', J(r.panel.boxes));
  console.log(' xl scope', J(r.export.scope), 'tot', J(r.export.tot), 'us', J(r.export.us), 'lines', J(r.export.lines)); console.log(' notes', J(r.export.notes)); console.log(' ms2026After', r.ms2026After); }
for (const src of ['c4', 'c4reopen']) for (const k of ['c4a', 'c4b', 'c4c']) { const r = s.reads[src][k]; console.log('\n==', src, k, J([r.flow.selYears, r.flow.selAppns, r.flow.tot, r.flow.execV, r.flow.planV, r.flow.appn]));
  console.log(' label:', r.flow.label); console.log(' panel total', r.panel.total, '| mix:', r.panel.mix, '| moneyM', J(r.panel.moneyM)); console.log(' boxes:', J(r.panel.boxes));
  console.log(' xl scope', J(r.export.scope), 'tot', J(r.export.tot), 'us', J(r.export.us), 'lines', J(r.export.lines)); console.log(' notes', J(r.export.notes)); }
console.log('\nchip26 board', J(s.reads.c4.chip26)); console.log('chip26 reopen', J(s.reads.c4reopen.chip26)); console.log('seq', J(s.reads.c4.seq));
console.log('yearChips', J(s.reads.c4.yearChips.map(c => [c.fy, c.text, c.on])));
console.log('\nc6with', J([s.reads.c6with.flow.tot, s.reads.c6with.flow.execV, s.reads.c6with.flow.planV, s.reads.c6with.exportTot, s.reads.c6with.perYear]));
console.log('c6without', J([s.reads.c6without.flow.tot, s.reads.c6without.exportTot, s.reads.c6without.perYear, s.reads.c6without.ms2026]));
for (const t of ['c5-with-plan', 'c5-after-removal']) { const r = s.reads[t]; console.log('\n', t, J([r.saved, r.flow.sel, r.flow.tot, r.flow.label, r.flow.rows, r.panel, r.export, r.confirm, r.errors, r.ms.v2026, r.ms.keys])); }
console.log('\ndetector', J(s.detectorControl)); console.log('env', J(s.env)); console.log('finalMs', J(s.finalMs));
