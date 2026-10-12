// locktest.mjs -- CONTROL 3, part 1: the lock mock on its own, in three bare jsdom windows ("tabs") sharing one manager.
//   usage: node locktest.mjs <boardRoot> <outJson>      (boardRoot only to resolve the same jsdom the boards use)
// Every expected value is a literal written by hand. Every wait is bounded: until() by a deadline (default 5 s), within()
// by a timer; a test that does not finish is recorded as such, never waited on for ever.
import { writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { makeLockManager } from './locks-mock.mjs';
const root = resolve(process.argv[2]);
const outPath = resolve(process.argv[3]);
const req = createRequire(root + '/package.json');
const { JSDOM } = req('jsdom');
const blobOf = buf => createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');
const IDS = { locktest: blobOf(readFileSync(new URL(import.meta.url))), mock: blobOf(readFileSync(new URL('./locks-mock.mjs', import.meta.url))),
  started: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }) + ' ET' };
const tick = () => new Promise(r => setImmediate(r));
const until = async (cond, ms = 5000) => { const end = Date.now() + ms; while (Date.now() < end) { if (cond()) return true; await tick(); } return !!cond(); };
const within = (p, ms = 5000) => Promise.race([p.then(v => ({ ok: true, v }), e => ({ ok: false, e: String(e) })), new Promise(r => setTimeout(() => r({ timedOut: true }), ms))]);
const gate = () => { let res, rej; const p = new Promise((a, b) => { res = a; rej = b; }); return { p, open: v => res(v), fail: e => rej(e) }; };
const win = () => new JSDOM('<!doctype html><p>tab', { url: 'https://example.invalid/board.html', runScripts: 'outside-only' }).window;
const results = []; const J = JSON.stringify;
// THE WATCHDOG: whatever is awaited below, the script ends within 60 s, writing what it has, marked incomplete.
setTimeout(() => { writeFileSync(outPath, JSON.stringify({ IDS, results, incomplete: 'watchdog at 60 s' }, null, 1)); console.log('WATCHDOG: incomplete at 60 s'); process.exit(3); }, 60000).unref();
const chk = (id, what, got, want) => { const pass = J(got) === J(want); results.push({ id, what, got, want, pass }); console.log((pass ? 'PASS ' : 'FAIL ') + id + ' ' + what + ' got=' + J(got) + (pass ? '' : ' want=' + J(want))); };

// T1 EXCLUSIVE, FIFO, ACROSS TABS: A holds; B, C, A again ask in that order; each is granted only after the previous release,
// in request order; never two holders; the callback runs in a later task, not inside request().
{
  const M = makeLockManager('T1'); const [wa, wb, wc] = [win(), win(), win()]; M.install(wa, 'A'); M.install(wb, 'B'); M.install(wc, 'C');
  const order = []; const gs = { A: gate(), B: gate(), C: gate(), A2: gate() }; let inside = 0, maxInside = 0, syncCall = false;
  const cb = tag => () => { order.push(tag); inside++; maxInside = Math.max(maxInside, inside); return gs[tag].p.then(v => { inside--; return tag + ':' + v; }); };
  const pA = wa.navigator.locks.request('orbit-save', { mode: 'exclusive' }, cb('A'));
  syncCall = order.length > 0;
  const pB = wb.navigator.locks.request('orbit-save', { mode: 'exclusive' }, cb('B'));
  const pC = wc.navigator.locks.request('orbit-save', { mode: 'exclusive' }, cb('C'));
  const pA2 = wa.navigator.locks.request('orbit-save', cb('A2'));             // the two-argument form: exclusive by default
  await until(() => order.length >= 1);
  const s1 = [order.slice(), M.heldBy('orbit-save'), M.pendingOf('orbit-save')];
  for (let i = 0; i < 50; i++) await tick();
  const s2 = [order.slice(), M.heldBy('orbit-save')];                        // still only A, however long A holds it
  gs.A.open(1); const rA = await pA;
  await until(() => order.length >= 2); const s3 = [order.slice(), M.heldBy('orbit-save'), M.pendingOf('orbit-save')];
  gs.B.open(2); gs.C.open(3); gs.A2.open(4);
  const all = await Promise.all([pB, pC, pA2]);
  chk('T1', 'callback not called inside request()', syncCall, false);
  chk('T1', 'first: A runs, A holds, B C A pending in order', s1, [['A'], ['A'], ['B', 'C', 'A']]);
  chk('T1', 'B is not run while A holds (50 turns)', s2, [['A'], ['A']]);
  chk('T1', 'A resolves with its callback’s value', rA, 'A:1');
  chk('T1', 'after A releases: B runs and holds; C, A pending', s3, [['A', 'B'], ['B'], ['C', 'A']]);
  chk('T1', 'grant order and results', [order, all], [['A', 'B', 'C', 'A2'], ['B:2', 'C:3', 'A2:4']]);
  chk('T1', 'never two inside; no violation; most held at once', [maxInside, M.stats.violations.length, M.stats.maxHeld['orbit-save']], [1, 0, 1]);
  chk('T1', 'promise of the requesting window’s realm', pA instanceof wa.Promise && pB instanceof wb.Promise, true);
}
// T2 RELEASE ON A REJECTED PROMISE AND ON A SYNCHRONOUS THROW; T3 A PLAIN VALUE.
{
  const M = makeLockManager('T2'); const [wa, wb] = [win(), win()]; M.install(wa, 'A'); M.install(wb, 'B');
  const e1 = new Error('rejected'), e2 = new Error('thrown');
  const p1 = wa.navigator.locks.request('L', () => Promise.reject(e1));
  const p2 = wb.navigator.locks.request('L', () => { throw e2; });
  const p3 = wa.navigator.locks.request('L', () => 7);
  const r = [];
  for (const p of [p1, p2, p3]) { try { r.push(['ok', await p]); } catch (e) { r.push(['err', e.message]); } }
  chk('T2', 'rejection and throw reject request(); a value resolves it; each released', [r, M.heldBy('L'), M.stats.releases], [[['err', 'rejected'], ['err', 'thrown'], ['ok', 7]], [], 3]);
}
// T4 THE RELEASE COMES BEFORE request() SETTLES: the next waiter is granted before the first's promise is seen settled.
{
  const M = makeLockManager('T4'); const [wa, wb] = [win(), win()]; M.install(wa, 'A'); M.install(wb, 'B');
  const seen = [];
  const pA = wa.navigator.locks.request('L', () => Promise.resolve('a'));
  pA.then(() => seen.push('A settled, held by ' + J(M.heldBy('L'))));
  const pB = wb.navigator.locks.request('L', () => { seen.push('B invoked'); return 'b'; });
  await pA; await pB;
  chk('T4', 'A’s promise settles after its release (B already granted then)', seen[0], 'A settled, held by ["B"]');
}
// T5 NAMES ARE INDEPENDENT.
{
  const M = makeLockManager('T5'); const [wa, wb] = [win(), win()]; M.install(wa, 'A'); M.install(wb, 'B');
  const g = gate(); let both = false;
  const pA = wa.navigator.locks.request('L', () => g.p);
  const pB = wb.navigator.locks.request('M', () => { both = M.heldBy('L').length === 1; return 1; });
  await pB; g.open(); await pA;
  chk('T5', 'M granted while L held', both, true);
}
// T6 ifAvailable: held -> callback(null) at once, nothing queued; free -> granted.
{
  const M = makeLockManager('T6'); const [wa, wb] = [win(), win()]; M.install(wa, 'A'); M.install(wb, 'B');
  const g = gate();
  const pA = wa.navigator.locks.request('L', () => g.p);
  await until(() => M.heldBy('L').length === 1);
  const r1 = await wb.navigator.locks.request('L', { ifAvailable: true }, l => l === null ? 'null' : 'lock');
  const pend = M.pendingOf('L').length;
  g.open(); await pA;
  const r2 = await wb.navigator.locks.request('L', { ifAvailable: true }, l => l === null ? 'null' : l.name + '/' + l.mode);
  chk('T6', 'ifAvailable: [while held, queued, when free]', [r1, pend, r2], ['null', 0, 'L/exclusive']);
}
// T7 SHARED: two shared at once; an exclusive queued behind them waits; a shared asked after that exclusive waits too (FIFO).
{
  const M = makeLockManager('T7'); const [wa, wb, wc] = [win(), win(), win()]; M.install(wa, 'A'); M.install(wb, 'B'); M.install(wc, 'C');
  const gA = gate(), gB = gate(), gX = gate(); const ran = [];
  const pA = wa.navigator.locks.request('L', { mode: 'shared' }, () => { ran.push('A'); return gA.p; });
  const pB = wb.navigator.locks.request('L', { mode: 'shared' }, () => { ran.push('B'); return gB.p; });
  const pX = wc.navigator.locks.request('L', { mode: 'exclusive' }, () => { ran.push('X'); return gX.p; });
  const pS = wa.navigator.locks.request('L', { mode: 'shared' }, () => { ran.push('S'); return 's'; });
  await until(() => ran.length >= 2); for (let i = 0; i < 30; i++) await tick();
  const s1 = [ran.slice(), M.heldBy('L'), M.pendingOf('L')];
  gA.open(); gB.open(); await until(() => ran.length >= 3); for (let i = 0; i < 30; i++) await tick();
  const s2 = [ran.slice(), M.heldBy('L')];
  gX.open(); await Promise.all([pA, pB, pX, pS]);
  chk('T7', 'shared A B together; X then S wait', s1, [['A', 'B'], ['A', 'B'], ['C', 'A']]);
  chk('T7', 'X alone; S still waits', s2, [['A', 'B', 'X'], ['C']]);
  chk('T7', 'then S; no violation', [ran, M.stats.violations.length], [['A', 'B', 'X', 'S'], 0]);
}
// T8 query() and closeClient(): a tab that goes away releases what it holds and its waiting requests are dropped.
{
  const M = makeLockManager('T8'); const [wa, wb, wc] = [win(), win(), win()]; M.install(wa, 'A'); M.install(wb, 'B'); M.install(wc, 'C');
  const g = gate(); let cRan = false;
  wa.navigator.locks.request('L', () => g.p);
  wb.navigator.locks.request('L', () => 'b');
  const pC = wc.navigator.locks.request('L', () => { cRan = true; return 'c'; });
  await until(() => M.heldBy('L').length === 1);
  const qy = await wc.navigator.locks.query();
  M.closeClient('B');
  M.closeClient('A');
  const rC = await pC;
  chk('T8', 'query: held A; pending B, C', [qy.held.map(x => x.clientId), qy.pending.map(x => x.clientId)], [['A'], ['B', 'C']]);
  chk('T8', 'after B and A close: C granted; one dropped', [rC, cRan, M.stats.dropped], ['c', true, 1]);
}
// T9 UNMODELED OPTIONS ARE REFUSED, NOT IGNORED; bad arguments reject.
{
  const M = makeLockManager('T9'); const wa = win(); M.install(wa, 'A');
  const r = [];
  for (const [n, o, c] of [['L', { steal: true }, () => 1], ['L', { signal: {} }, () => 1], ['-L', {}, () => 1], ['L', {}, null], ['L', { mode: 'x' }, () => 1]]) {
    try { await wa.navigator.locks.request(n, o, c); r.push('ok'); } catch (e) { r.push('rejected'); } }
  chk('T9', 'steal, signal, -name, no callback, bad mode: each rejected; unmodeled counted', [r, M.stats.unmodeled.length], [['rejected', 'rejected', 'rejected', 'rejected', 'rejected'], 2]);
}
// T10 STRESS: 300 requests from three tabs on one name, random hold lengths (0-5 turns, seeded): FIFO in request order,
// never two holders, every request settles.
{
  const M = makeLockManager('T10'); const ws = [win(), win(), win()]; ws.forEach((w, i) => M.install(w, 'T' + i));
  let s = 12345; const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  const asked = [], ran = []; let inside = 0, maxInside = 0; const ps = [];
  for (let i = 0; i < 300; i++) {
    const w = ws[Math.floor(rnd() * 3)], hold = Math.floor(rnd() * 6);
    asked.push(i);
    ps.push(w.navigator.locks.request('orbit-save', { mode: 'exclusive' }, async () => { inside++; maxInside = Math.max(maxInside, inside); ran.push(i);
      for (let k = 0; k < hold; k++) await tick(); inside--; return i; }));
    if (rnd() < 0.3) await tick();
  }
  const done = await until(() => ran.length === 300 && M.heldBy('orbit-save').length === 0, 20000);
  const all = await within(Promise.allSettled(ps), 5000);
  const settled = all.ok ? all.v.filter(x => x.status === 'fulfilled').length : 'not settled';
  chk('T10', '[finished, FIFO = request order, most inside at once, violations, settled]', [done, J(ran) === J(asked), maxInside, M.stats.violations.length, settled], [true, true, 1, 0, 300]);
}
const OUT = { IDS, results, pass: results.filter(r => r.pass).length, fail: results.filter(r => !r.pass).length,
  finished: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }) + ' ET' };
writeFileSync(outPath, JSON.stringify(OUT, null, 1));
console.log('locktest', OUT.pass, 'pass', OUT.fail, 'fail');
process.exit(OUT.fail ? 1 : 0);
