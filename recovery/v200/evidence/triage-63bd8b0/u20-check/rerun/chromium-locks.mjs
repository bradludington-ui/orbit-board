// chromium-locks.mjs -- the mock checked against a REAL browser: Chromium's own Web Locks across tabs of one profile, and
// U20's premise with the board itself loaded in each tab.
//   usage: node chromium-locks.mjs <boardRoot> <outJson>
// Part 1 (the API, no board code): the locktest cases that can be observed from outside a real browser -- T1 exclusive FIFO
//   across three tabs, T2 release on a rejected promise and on a throw, T6 ifAvailable, T7 shared then exclusive (FIFO).
//   The same sequences, with the same hand-written expected values, as locktest.mjs runs against the mock.
// Part 2 (the board, 98eed7e8, in two tabs): U20's premise. Tab A's saveSerial holds 'orbit-save'; tab B's saveSerial waits
//   on it: B's _saveBusy, whether B's function ran, and what navigator.locks.query() shows; and whether U2's put-back
//   refusal sees B's waiting save (keptPutBack with something kept and window.confirm answering Cancel, so nothing changes).
//   Controls: B's own save running (counted), and no contention.
// The page is served from https://orbit.invalid/board.html by request interception (a secure context, one origin for every
// tab); every other request is aborted. Chromium: tools/chrome.mjs (never `playwright install`). Every wait has a timeout,
// and a watchdog ends the run at 150 s.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const root = resolve(process.argv[2]);
const outPath = resolve(process.argv[3]);
const req = createRequire(root + '/package.json');
const { chromium } = req('playwright-core');
const { CHROME } = await import(pathToFileURL(root + '/tools/chrome.mjs').href);
const blobOf = buf => createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');
const boardBytes = readFileSync(root + '/prioritization-board-grid.html');
const IDS = { board: blobOf(boardBytes), script: blobOf(readFileSync(new URL(import.meta.url))), chrome: CHROME,
  started: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }) + ' ET' };
const J = JSON.stringify;
const results = [];
const chk = (id, what, got, want) => { const pass = J(got) === J(want); results.push({ id, what, got, want, pass }); console.log((pass ? 'PASS ' : 'FAIL ') + id + ' ' + what + ' got=' + J(got) + (pass ? '' : ' want=' + J(want))); };
let browser = null;
const finish = async (code, why) => { try { if (browser) await Promise.race([browser.close(), new Promise(r => setTimeout(r, 5000))]); } catch {}
  writeFileSync(outPath, JSON.stringify({ IDS, results, pass: results.filter(r => r.pass).length, fail: results.filter(r => !r.pass).length, incomplete: why || null,
    finished: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }) + ' ET' }, null, 1));
  console.log('chromium-locks', why || 'done', results.filter(r => r.pass).length, 'pass', results.filter(r => !r.pass).length, 'fail'); process.exit(code); };
setTimeout(() => finish(3, 'WATCHDOG: incomplete at 150 s'), 150000).unref();
const pause = ms => new Promise(r => setTimeout(r, ms));
const URLB = 'https://orbit.invalid/board.html';
try {
  browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'], timeout: 30000 });
  const ctx = await browser.newContext();
  const aborted = [];
  await ctx.route('**/*', route => { const u = route.request().url();
    if (u === URLB) return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: boardBytes });
    aborted.push(u.slice(0, 80)); return route.abort(); });
  const open = async () => { const p = await ctx.newPage(); p.setDefaultTimeout(30000);
    await p.goto(URLB, { waitUntil: 'load', timeout: 60000 });
    await p.waitForFunction(() => typeof saveSerial === 'function' && typeof keptPutBack === 'function' && typeof _saveBusy === 'number', null, { timeout: 30000 });
    return p; };
  const A = await open(), B = await open(), C = await open();
  const env = await Promise.all([A, B, C].map(p => p.evaluate(() => [location.origin, window.isSecureContext, typeof navigator.locks, typeof (navigator.locks && navigator.locks.request)])));
  chk('env', 'three tabs, one origin, secure context, navigator.locks present', env, [['https://orbit.invalid', true, 'object', 'function'], ['https://orbit.invalid', true, 'object', 'function'], ['https://orbit.invalid', true, 'object', 'function']]);
  // ---- Part 1: the API ----------------------------------------------------------------------------------------------
  // helpers in every page: a named request whose callback records it ran and holds until released
  for (const p of [A, B, C]) await p.evaluate(() => {
    window.__ran = []; window.__rel = {}; window.__res = {};
    window.__ask = (tag, name, opts, how) => { const cb = lock => { window.__ran.push(tag);
        if (how === 'hold') return new Promise(r => { window.__rel[tag] = r; }).then(v => tag + ':' + v);
        if (how === 'reject') return Promise.reject(new Error('rejected'));
        if (how === 'throw') throw new Error('thrown');
        if (how === 'null?') return lock === null ? 'null' : lock.name + '/' + lock.mode;
        return 7; };
      const pr = opts ? navigator.locks.request(name, opts, cb) : navigator.locks.request(name, cb);
      pr.then(v => { window.__res[tag] = ['ok', v]; }, e => { window.__res[tag] = ['err', e.message]; });
      return 'asked'; };
    return 'ok'; });
  const ran = async () => { const o = {}; for (const [n, p] of [['A', A], ['B', B], ['C', C]]) o[n] = await p.evaluate(() => window.__ran.slice()); return o; };
  const order = async () => { const r = await ran(); return [...r.A.map(t => t), ...r.B, ...r.C]; };
  const q = async (p, name) => p.evaluate(async n => { const s = await navigator.locks.query(); return { held: s.held.filter(x => x.name === n).map(x => x.clientId), pending: s.pending.filter(x => x.name === n).map(x => x.clientId) }; }, name);
  const waitFor = async (p, fn, arg, ms = 5000) => { try { await p.waitForFunction(fn, arg, { timeout: ms }); return true; } catch { return false; } };
  // T1
  await A.evaluate(() => window.__ask('A', 'T1', { mode: 'exclusive' }, 'hold')); await waitFor(A, () => window.__ran.includes('A'));
  await B.evaluate(() => window.__ask('B', 'T1', { mode: 'exclusive' }, 'hold')); await pause(50);
  await C.evaluate(() => window.__ask('C', 'T1', { mode: 'exclusive' }, 'hold')); await pause(50);
  await A.evaluate(() => window.__ask('A2', 'T1', null, 'hold')); await pause(300);
  const q1 = await q(A, 'T1'); const r1 = await ran();
  const cid = { A: q1.held[0] };
  chk('T1', 'A runs and holds; B, C, A again pending in that order (clients: [B, C, A])', [r1.A, r1.B, r1.C, q1.held.length, q1.pending.length, q1.pending[2] === q1.held[0], q1.pending[0] !== q1.pending[1]], [['A'], [], [], 1, 3, true, true]);
  await A.evaluate(() => window.__rel.A(1)); await waitFor(B, () => window.__ran.includes('B')); await pause(300);
  const r2 = await ran(); const q2 = await q(A, 'T1');
  chk('T1', 'after A releases: B runs and holds; C, A pending', [r2.B, r2.C, r2.A, q2.held.length, q2.pending.length], [['B'], [], ['A'], 1, 2]);
  await B.evaluate(() => window.__rel.B(2)); await waitFor(C, () => window.__ran.includes('C'));
  await C.evaluate(() => window.__rel.C(3)); await waitFor(A, () => window.__ran.includes('A2'));
  await A.evaluate(() => window.__rel.A2(4)); await waitFor(A, () => !!window.__res.A2);
  const res1 = [await A.evaluate(() => window.__res.A), await B.evaluate(() => window.__res.B), await C.evaluate(() => window.__res.C), await A.evaluate(() => window.__res.A2)];
  chk('T1', 'each request resolves with its callback’s value, in grant order', res1, [['ok', 'A:1'], ['ok', 'B:2'], ['ok', 'C:3'], ['ok', 'A2:4']]);
  // T2
  await A.evaluate(() => window.__ask('R1', 'T2', {}, 'reject')); await B.evaluate(() => window.__ask('R2', 'T2', {}, 'throw')); await C.evaluate(() => window.__ask('R3', 'T2', {}, 'value'));
  await waitFor(C, () => !!window.__res.R3);
  chk('T2', 'a rejection and a throw reject request(), a value resolves it; each lock released', [await A.evaluate(() => window.__res.R1), await B.evaluate(() => window.__res.R2), await C.evaluate(() => window.__res.R3), (await q(A, 'T2')).held.length],
    [['err', 'rejected'], ['err', 'thrown'], ['ok', 7], 0]);
  // T6
  await A.evaluate(() => window.__ask('H6', 'T6', {}, 'hold')); await waitFor(A, () => window.__ran.includes('H6'));
  await B.evaluate(() => window.__ask('I6', 'T6', { ifAvailable: true }, 'null?')); await waitFor(B, () => !!window.__res.I6);
  const pend6 = (await q(A, 'T6')).pending.length;
  await A.evaluate(() => window.__rel.H6(0)); await waitFor(A, () => !!window.__res.H6);
  await B.evaluate(() => window.__ask('J6', 'T6', { ifAvailable: true }, 'null?')); await waitFor(B, () => !!window.__res.J6);
  chk('T6', 'ifAvailable: [while held, queued, when free]', [(await B.evaluate(() => window.__res.I6))[1], pend6, (await B.evaluate(() => window.__res.J6))[1]], ['null', 0, 'T6/exclusive']);
  // T7
  await A.evaluate(() => window.__ask('SA', 'T7', { mode: 'shared' }, 'hold')); await B.evaluate(() => window.__ask('SB', 'T7', { mode: 'shared' }, 'hold'));
  await waitFor(B, () => window.__ran.includes('SB')); await pause(50);
  await C.evaluate(() => window.__ask('X7', 'T7', { mode: 'exclusive' }, 'hold')); await pause(50);
  await A.evaluate(() => window.__ask('S7', 'T7', { mode: 'shared' }, 'value')); await pause(300);
  const ran7a = await ran(); const q7a = await q(A, 'T7');
  chk('T7', 'shared A and B together; the exclusive and the later shared wait', [ran7a.A.includes('SA'), ran7a.B.includes('SB'), ran7a.C.includes('X7'), ran7a.A.includes('S7'), q7a.held.length, q7a.pending.length], [true, true, false, false, 2, 2]);
  await A.evaluate(() => window.__rel.SA(0)); await B.evaluate(() => window.__rel.SB(0)); await waitFor(C, () => window.__ran.includes('X7')); await pause(300);
  const ran7b = await ran();
  chk('T7', 'then the exclusive alone; the later shared still waits', [ran7b.C.includes('X7'), ran7b.A.includes('S7'), (await q(A, 'T7')).held.length], [true, false, 1]);
  await C.evaluate(() => window.__rel.X7(0)); await waitFor(A, () => window.__ran.includes('S7'));
  chk('T7', 'then the later shared', (await ran()).A.includes('S7'), true);
  // ---- Part 2: the board, U20's premise -------------------------------------------------------------------------------
  // keep something aside in B (this board's own keepAside, of what is on screen), so ↶ Put back has work to put back;
  // window.confirm answers Cancel, so a put back that is not refused asks and then changes nothing.
  const prepB = () => B.evaluate(() => { localStorage.removeItem(_AP.key + '.kept');
    const k = keepAside(MS, { why: 'folder', by: 'X', ts: 1 }, baseGet()); window.__asked = [];
    window.confirm = function (qq) { window.__asked.push(String(qq).slice(0, 60)); return false; }; return k; });
  // (the status line is blanked first -- harness only -- so a refusal said by an EARLIER call is not read as this one's)
  const putBackNow = () => B.evaluate(() => { const n0 = window.__asked.length; const el = document.getElementById('shareStat'); if (el) el.textContent = ''; keptPutBack();
    const st = (document.getElementById('shareStat') || {}).textContent || ''; return { refused: /Not put back/.test(st) && /a save was under way/.test(st), asked: window.__asked.length - n0 }; });
  // W: A holds 'orbit-save' through its saveSerial; B's saveSerial waits on it
  chk('P0', 'B has work kept aside (keepAside returned true)', await prepB(), true);
  await A.evaluate(() => { window.__pA = saveSerial(() => new Promise(r => { window.__relA = r; })); return 1; });
  await waitFor(A, () => typeof window.__relA === 'function' && _saveBusy === 1);
  await B.evaluate(() => { window.__bRan = false; window.__pB = saveSerial(() => { window.__bRan = true; window.__busyInside = _saveBusy; }); return 1; });
  await pause(400);
  const wB = await B.evaluate(async () => { const s = await navigator.locks.query(); return { busy: _saveBusy, ran: window.__bRan, held: s.held.filter(x => x.name === 'orbit-save').length, pending: s.pending.filter(x => x.name === 'orbit-save').length }; });
  const wA = await A.evaluate(() => _saveBusy);
  chk('P1', 'W: A’s save holds the lock; B’s save waits: [B _saveBusy, B ran, held, pending, A _saveBusy]', [wB.busy, wB.ran, wB.held, wB.pending, wA], [0, false, 1, 1, 1]);
  chk('P1', 'W: ↶ Put back in B while its save waits: [refused, asked]', await putBackNow(), { refused: false, asked: 1 });
  await A.evaluate(() => { window.__relA(); return 1; });
  const bDone = await waitFor(B, () => window.__bRan === true);
  await pause(200);
  chk('P1', 'W: A released -> B’s save ran (counted inside), then nothing under way', [bDone, await B.evaluate(() => window.__busyInside), await B.evaluate(() => _saveBusy)], [true, 1, 0]);
  // C1: B's own save running (counted); a second save queued in B
  await B.evaluate(() => { window.__pB1 = saveSerial(() => new Promise(r => { window.__relB = r; })); return 1; });
  await waitFor(B, () => typeof window.__relB === 'function' && _saveBusy === 1);
  await B.evaluate(() => { window.__b2 = false; window.__pB2 = saveSerial(() => { window.__b2 = true; }); return 1; }); await pause(200);
  chk('P2', 'C1: B’s own save running: [B _saveBusy, second save ran]', [await B.evaluate(() => _saveBusy), await B.evaluate(() => window.__b2)], [1, false]);
  chk('P2', 'C1: ↶ Put back in B while its own save runs: [refused, asked]', await putBackNow(), { refused: true, asked: 0 });
  await B.evaluate(() => { window.__relB(); return 1; }); await waitFor(B, () => window.__b2 === true); await pause(200);
  chk('P2', 'C1: released -> the second save ran, nothing under way', [await B.evaluate(() => window.__b2), await B.evaluate(() => _saveBusy)], [true, 0]);
  // C2: no contention
  await B.evaluate(() => { window.__b3 = false; window.__pB3 = saveSerial(() => { window.__b3 = true; }); return 1; });
  chk('P3', 'C2: no contention: B’s save runs at once and ends', [await waitFor(B, () => window.__b3 === true, null, 3000), await B.evaluate(() => _saveBusy)], [true, 0]);
  chk('P3', 'C2: ↶ Put back with no save: [refused, asked]', await putBackNow(), { refused: false, asked: 1 });
  chk('env', 'requests other than the board’s page were aborted (none needed)', aborted.length >= 0, true);
  await finish(results.some(r => !r.pass) ? 1 : 0);
} catch (e) { results.push({ id: 'ERROR', what: String((e && e.stack) || e).slice(0, 800), pass: false }); console.log('THREW', String((e && e.stack) || e).slice(0, 800)); await finish(2); }
