// table2.mjs : read-only; ONE condensed markdown row per route and board from the final runs (out/f-*.json).
import { readFileSync, readdirSync } from 'node:fs';
const U = '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u17';
const J = x => JSON.stringify(x).replace(/\|/g, '\\|').replace(/"/g, '');
const runs = {};
for (const f of readdirSync(U + '/out').filter(f => f.startsWith('f-')).sort()) {
  const r = JSON.parse(readFileSync(U + '/out/' + f, 'utf8')); (runs[r.scenario] = runs[r.scenario] || {})[r.board + ':' + r.next] = r; }
const order = ['S1harness', 'S1tick', 'S1perm', 'S1open', 'S1pen', 'V1same', 'V1sameperm', 'V2live', 'W2pull', 'W2tick',
  'Ca', 'Cb', 'Cc', 'C1', 'C3', 'U25ws', 'U25wf', 'U25mid', 'L20',
  'SHd', 'SHdC', 'SHdk', 'SHdkC', 'SHa', 'SHaC', 'BT', 'BTC', 'IB', 'IBC', 'FBT', 'FBTC', 'FSHd', 'FSHdC'];
const get = (r, s) => r && r.checks.find(c => c.id === r.scenario + s);
const all = (r, kinds) => r ? r.checks.filter(c => kinds.includes(c.kind)) : [];
console.log('| route | board | U17 state: expected / observed [screen, clean, base copy] | K2 later refresh / K3 reopen | V3next: U17? (overwritten copy now in) | V4putback: U17? [falsely clean, claim, claim false, screen copy kept nowhere] | fixture+predict checks (all 3 runs) |');
console.log('|---|---|---|---|---|---|---|');
for (const s of order) for (const b of ['u13', 'pre']) {
  const R = runs[s] || {}; const rs = R[b + ':save'], rp = R[b + ':putback'], rn = R[b + ':none'] || rs; if (!rs) continue;
  const us = get(rs, '.U17state'); const k2 = get(rn, '.K2'), k3 = get(rn, '.K3');
  const kk = c => !c ? '-' : (c.pass ? 'ok' : 'FAIL') + (Array.isArray(c.observed) ? ' ' + J(c.observed) : '');
  const v3 = get(rs, '.U17.V3'); const w = rs.v3parts && rs.v3parts.overwrittenNowIn;
  const wl = w ? Object.entries(w).filter(([k, x]) => x === true || (Array.isArray(x) && x.length)).map(([k, x]) => x === true ? k : (k === 'folderHistory' ? 'history' + (x.some(n => /-recent/.test(n)) ? ' (-recent)' : '') : 'earlier file version only')).join(', ') : '';
  const v4 = get(rp, '.U17.V4'); const p4 = rp && rp.v4parts;
  const fp = [rs, rp, R[b + ':none']].filter(Boolean).flatMap(r => all(r, ['fixture', 'predict']));
  console.log(`| ${s} | ${b === 'u13' ? '63bd8b0' : '1375b72b'} | ${J(us.expected)} / ${J(us.observed)} ${J(rs.u17state.tuple)} | ${kk(k2)} / ${kk(k3)} | ${v3.pass ? 'no' : '**U17**'} (${rs.v3parts.overwritten}: ${wl || '**nowhere**'}) | ${v4 ? (v4.pass ? 'no' : '**U17**') + ' ' + J([p4.falselyClean, p4.claim, p4.falseClaim, p4.notKept]) : '-'} | ${fp.filter(c => c.pass).length}/${fp.length} |`);
}
