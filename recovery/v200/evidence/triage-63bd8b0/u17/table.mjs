// table.mjs : read-only; markdown tables of the final runs (out/f-*.json): per route and board, the expected (literal) and
// observed values of the refresh/adoption, the settled record (K1), the later refresh and reopen (K2/K3), V3next and V4putback.
import { readFileSync, readdirSync } from 'node:fs';
const U = '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u17';
const J = x => JSON.stringify(x).replace(/\|/g, '\\|');
const runs = {};
for (const f of readdirSync(U + '/out').filter(f => f.startsWith('f-')).sort()) {
  const r = JSON.parse(readFileSync(U + '/out/' + f, 'utf8'));
  (runs[r.scenario] = runs[r.scenario] || {})[r.board + ':' + r.next] = r;
}
const order = ['S1harness', 'S1tick', 'S1perm', 'S1open', 'S1pen', 'V1same', 'V1sameperm', 'V2live', 'W2pull', 'W2tick',
  'Ca', 'Cb', 'Cc', 'C1', 'C3', 'U25ws', 'U25wf', 'U25mid', 'L20',
  'SHd', 'SHdC', 'SHdk', 'SHdkC', 'SHa', 'SHaC', 'BT', 'BTC', 'IB', 'IBC', 'FBT', 'FBTC', 'FSHd', 'FSHdC'];
const get = (r, suffix) => r && r.checks.find(c => c.id === r.scenario + suffix);
const mark = c => !c ? '-' : (c.pass ? 'ok ' : 'FAIL ') + J(c.observed);
const P = s => console.log(s);
P('### A. The refresh or adoption during the save, and the settled record (U17 state = K1 recorded clean while screen != base copy)');
P('| route | board | refresh / adoption: expected | observed | match | K1 [screen, clean, base copy] | U17 state (pred.) | K2 later refresh | K3 reopen |');
P('|---|---|---|---|---|---|---|---|---|');
for (const s of order) for (const b of ['u13', 'pre']) {
  const R = runs[s] || {}; const r = R[b + ':save'] || R[b + ':none'] || R[b + ':putback']; if (!r) continue;
  const rn = R[b + ':none'] || r;   // K2/K3 for the adoption/file families come from the 'none' run
  const a = get(r, '.refresh') || get(r, '.adopt');
  const k1 = get(r, '.K1'), us = get(r, '.U17state'), k2 = get(rn, '.K2'), k3 = get(rn, '.K3');
  P(`| ${s} | ${b === 'u13' ? '63bd8b0' : '1375b72b'} | ${a ? J(a.expected) : '-'} | ${a ? J(a.observed) : '-'} | ${a ? (a.pass ? 'yes' : 'NO') : '-'} | ${k1 ? (k1.pass ? 'consistent ' : 'FALSELY CLEAN ') + J(k1.observed) : '-'} | ${us ? J(us.observed) + (us.pass ? '' : ' (MISPREDICTED)') : '-'} | ${k2 ? (k2.pass ? 'ok' : 'FAIL') + ' ' + (Array.isArray(k2.observed) ? J(k2.observed) : k2.observed) : '-'} | ${k3 ? (k3.pass ? 'ok' : 'FAIL') + ' ' + (Array.isArray(k3.observed) ? J(k3.observed) : k3.observed) : '-'} |`);
}
P('');
P('### B. V3next: Brad\'s next 💾 Save from where the route ended');
P('| route | board | expected [asked, screen before, head/file before, after, says, clean after, record names head] | observed | match | U17.V3 [falsely clean, wrote over without asking] | overwritten copy now in |');
P('|---|---|---|---|---|---|---|');
for (const s of order) for (const b of ['u13', 'pre']) {
  const r = (runs[s] || {})[b + ':save']; if (!r) continue;
  const v = get(r, '.V3next'), u = get(r, '.U17.V3');
  const w = r.v3parts && r.v3parts.overwrittenNowIn; const wl = w ? Object.entries(w).filter(([k, x]) => x === true || (Array.isArray(x) && x.length)).map(([k, x]) => x === true ? k : k + ':' + x.map(n => String(n).replace('spmt-2027-om-', '')).join(',')).join('; ') : '';
  P(`| ${s} | ${b === 'u13' ? '63bd8b0' : '1375b72b'} | ${J(v.expected)} | ${J(v.observed)} | ${v.pass ? 'yes' : 'NO'} | ${u.pass ? 'not U17 ' : 'U17 '}${J(u.observed)} | ${r.v3parts && r.v3parts.overwritten}: ${wl || 'NOWHERE'} |`);
}
P('');
P('### C. V4putback: ↶ put it back, then 💾 Save');
P('| route | board | expected [kept before, claim, screen before, head/file before, put back says, kept after, screen after, head/file after Save, Save says(, Save asked)] | observed | match | U17.V4 [falsely clean, claim false, screen copy kept nowhere] |');
P('|---|---|---|---|---|---|');
for (const s of order) for (const b of ['u13', 'pre']) {
  const r = (runs[s] || {})[b + ':putback']; if (!r) continue;
  const v = get(r, '.V4putback'), u = get(r, '.U17.V4');
  P(`| ${s} | ${b === 'u13' ? '63bd8b0' : '1375b72b'} | ${J(v.expected)} | ${J(v.observed)} | ${v.pass ? 'yes' : 'NO'} | ${u.pass ? 'not U17 ' : 'U17 '}${J(u.observed)} |`);
}
P('');
P('### D. File mode: does the work the held save wrote survive the next Save?');
P('| route | board | reachY | expected | observed |');
P('|---|---|---|---|---|');
for (const s of ['FBT', 'FBTC', 'FSHd', 'FSHdC']) for (const b of ['u13', 'pre']) {
  const r = (runs[s] || {})[b + ':save']; const c = get(r, '.reachY');
  P(`| ${s} | ${b === 'u13' ? '63bd8b0' : '1375b72b'} | ${c.kind} | ${J(c.expected)} | ${J(c.observed)}${c.pass ? '' : ' (FAIL)'} |`);
}
