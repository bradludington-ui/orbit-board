// cmp.mjs : READ-ONLY. For every re-run of mine (out/r-<board>-<scn>-<next>.json), the builder's final run of the same label
// (rec/L4/u17/out/f-<board>-<scn>-<next>.json): the same check ids, kinds, pass/fail, observed values and expected values?
// Also: the builder's expected literals == mine (same probe file, so they must be). Prints one line per label and totals.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
const C = '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u17-check';
const U = '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u17';
const J = JSON.stringify;
const mine = readdirSync(C + '/out').filter(n => /^r-/.test(n)).sort();
let same = 0, diff = 0, missing = 0; const tot = { fixture: [0, 0], predict: [0, 0], contract: [0, 0], harness: [0, 0] };
const totB = { fixture: [0, 0], predict: [0, 0], contract: [0, 0], harness: [0, 0] };
for (const n of mine) {
  const lab = n.replace(/^r-/, '').replace(/\.json$/, '');
  const fb = U + '/out/f-' + lab + '.json';
  let m; try { m = JSON.parse(readFileSync(C + '/out/' + n, 'utf8')); } catch (e) { console.log('UNREADABLE mine ' + lab + ' ' + e.message); diff++; continue; }
  for (const c of m.checks) { (tot[c.kind] = tot[c.kind] || [0, 0])[c.pass ? 0 : 1]++; }
  if (!existsSync(fb)) { console.log('NO BUILDER RUN ' + lab); missing++; continue; }
  const b = JSON.parse(readFileSync(fb, 'utf8'));
  for (const c of b.checks) { (totB[c.kind] = totB[c.kind] || [0, 0])[c.pass ? 0 : 1]++; }
  const key = c => J([c.id, c.kind, c.pass, c.observed, c.expected]);
  const mk = m.checks.map(key), bk = b.checks.map(key);
  const d = [];
  for (let i = 0; i < Math.max(mk.length, bk.length); i++) if (mk[i] !== bk[i]) d.push({ i, mine: mk[i], builder: bk[i] });
  const idsOk = m.ids.board === b.ids.board && m.ids.bootMjs === b.ids.bootMjs && m.ids.shim === b.ids.shim && m.ids.probe === b.ids.probe;
  const u = J(m.u17state) === J(b.u17state);
  if (!d.length && idsOk && u) { same++; console.log('SAME ' + lab + ' (' + m.checks.length + ' checks; ' + m.checks.filter(c => !c.pass).length + ' fail; u17state ' + J(m.u17state && m.u17state.tuple) + ')'); }
  else { diff++; console.log('DIFF ' + lab + ' ids ' + idsOk + ' u17state ' + u + ' ' + J(d).slice(0, 1500)); }
}
console.log('TOTAL labels ' + mine.length + ': same ' + same + ', differ ' + diff + ', no builder run ' + missing);
console.log('MINE   pass/fail by kind ' + J(tot));
console.log('BUILDER (same labels) pass/fail by kind ' + J(totB));
