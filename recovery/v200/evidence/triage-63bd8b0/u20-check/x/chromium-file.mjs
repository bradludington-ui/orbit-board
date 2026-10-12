// chromium-file.mjs -- THE CHECKER'S realism test of the builder's Chromium shortcut. The builder served the board at
// https://orbit.invalid (request interception). The board is built to be opened from a FILE (driveHint/driveWinPath read a
// file: URL: "the folder this program is in"). Does U20's premise hold there too: two tabs of the board opened from the same
// file:// path, in one browser profile -- is navigator.locks there, do the tabs share 'orbit-save', and does tab B's waiting
// save stay uncounted? Also the same on two DIFFERENT file paths (two copies of the board in one folder).
//   usage: node chromium-file.mjs <boardRoot> <outJson>
// Hand-written expected literals; every wait bounded; watchdog 150 s. Chromium via tools/chrome.mjs (never playwright install).
import { writeFileSync, readFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const root = resolve(process.argv[2]);
const outPath = resolve(process.argv[3]);
const req = createRequire(root + '/package.json');
const { chromium } = req('playwright-core');
const { CHROME } = await import(pathToFileURL(root + '/tools/chrome.mjs').href);
const blobOf = buf => createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');
const boardPath = root + '/prioritization-board-grid.html';
// a SECOND copy of the board (same bytes, another name) in the checker's own directory, for the two-paths case
const second = resolve(dirname(outPath), 'second-copy', 'Board-copy.html');
mkdirSync(dirname(second), { recursive: true }); if (!existsSync(second)) copyFileSync(boardPath, second);
const IDS = { board: blobOf(readFileSync(boardPath)), second: blobOf(readFileSync(second)), script: blobOf(readFileSync(new URL(import.meta.url))), chrome: CHROME,
  started: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }) + ' ET' };
const J = JSON.stringify; const results = [];
const chk = (id, what, got, want) => { const pass = J(got) === J(want); results.push({ id, what, got, want, pass }); console.log((pass ? 'PASS ' : 'FAIL ') + id + ' ' + what + ' got=' + J(got) + (pass ? '' : ' want=' + J(want))); };
const info = []; const note = (id, what, v) => { info.push({ id, what, v }); console.log('INFO ' + id + ' ' + what + ' ' + J(v)); };
let browser = null;
const finish = async (code, why) => { try { if (browser) await Promise.race([browser.close(), new Promise(r => setTimeout(r, 5000))]); } catch {}
  writeFileSync(outPath, JSON.stringify({ IDS, results, info, pass: results.filter(r => r.pass).length, fail: results.filter(r => !r.pass).length, incomplete: why || null,
    finished: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }) + ' ET' }, null, 1));
  console.log('chromium-file', why || 'done', results.filter(r => r.pass).length, 'pass', results.filter(r => !r.pass).length, 'fail'); process.exit(code); };
setTimeout(() => finish(3, 'WATCHDOG: incomplete at 150 s'), 150000).unref();
const pause = ms => new Promise(r => setTimeout(r, ms));
try {
  browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'], timeout: 30000 });
  const ctx = await browser.newContext();
  const open = async (path) => { const p = await ctx.newPage(); p.setDefaultTimeout(30000);
    await p.goto(pathToFileURL(path).href, { waitUntil: 'load', timeout: 60000 });
    await p.waitForFunction(() => typeof saveSerial === 'function' && typeof _saveBusy === 'number', null, { timeout: 30000 });
    return p; };
  const waitFor = async (p, fn, arg, ms = 5000) => { try { await p.waitForFunction(fn, arg, { timeout: ms }); return true; } catch { return false; } };
  const env = p => p.evaluate(() => [location.protocol, String(self.origin), window.isSecureContext, typeof navigator.locks, typeof (navigator.locks && navigator.locks.request)]);
  const qry = p => p.evaluate(async () => { try { const s = await navigator.locks.query(); return { held: s.held.filter(x => x.name === 'orbit-save').length, pending: s.pending.filter(x => x.name === 'orbit-save').length }; } catch (e) { return { err: String(e && e.name) }; } });
  // one scenario: tab A holds 'orbit-save' through the board's own saveSerial; tab B's saveSerial asks for it
  const scenario = async (id, pathA, pathB) => {
    const A = await open(pathA), B = await open(pathB);
    note(id, 'env A, B: [protocol, origin, secure context, typeof navigator.locks, typeof request]', [await env(A), await env(B)]);
    await A.evaluate(() => { window.__aErr = null; window.__pA = saveSerial(() => new Promise(r => { window.__relA = r; })); window.__pA.catch(e => { window.__aErr = String(e && (e.name + ': ' + e.message)); }); return 1; });
    const aHolds = await waitFor(A, () => (typeof window.__relA === 'function' && _saveBusy === 1) || window.__aErr !== null);
    await B.evaluate(() => { window.__bRan = false; window.__bErr = null; window.__pB = saveSerial(() => { window.__bRan = true; window.__busyInside = _saveBusy; }); window.__pB.catch(e => { window.__bErr = String(e && (e.name + ': ' + e.message)); }); return 1; });
    await pause(400);
    const w = { aHolds, aErr: await A.evaluate(() => window.__aErr), aBusy: await A.evaluate(() => _saveBusy), bBusy: await B.evaluate(() => _saveBusy), bRan: await B.evaluate(() => window.__bRan),
      bErr: await B.evaluate(() => window.__bErr), qA: await qry(A), qB: await qry(B) };
    await A.evaluate(() => { if (window.__relA) window.__relA(); return 1; });
    const bDone = await waitFor(B, () => window.__bRan === true || window.__bErr !== null);
    await pause(200);
    const after = { bDone, bRan: await B.evaluate(() => window.__bRan), busyInside: await B.evaluate(() => window.__busyInside === undefined ? null : window.__busyInside), bBusy: await B.evaluate(() => _saveBusy), bErr: await B.evaluate(() => window.__bErr) };
    await A.close(); await B.close();
    return { w, after };
  };
  // F1: the SAME file in two tabs
  const s1 = await scenario('F1', boardPath, boardPath);
  note('F1', 'while A holds (raw)', s1.w); note('F1', 'after A released (raw)', s1.after);
  chk('F1', 'same file, two tabs: A holds; B waits uncounted: [A holds, A err, A busy, B busy, B ran, B err]', [s1.w.aHolds, s1.w.aErr, s1.w.aBusy, s1.w.bBusy, s1.w.bRan, s1.w.bErr], [true, null, 1, 0, false, null]);
  chk('F1', 'same file: then B runs (counted inside) and ends: [ran, busy inside, busy after, err]', [s1.after.bRan, s1.after.busyInside, s1.after.bBusy, s1.after.bErr], [true, 1, 0, null]);
  // F2: two DIFFERENT board files (same folder tree) -- informational: whether file:// tabs share one lock manager across paths
  const s2 = await scenario('F2', boardPath, second);
  note('F2', 'two different files: while A holds (raw)', s2.w); note('F2', 'two different files: after A released (raw)', s2.after);
  await finish(results.some(r => !r.pass) ? 1 : 0);
} catch (e) { results.push({ id: 'ERROR', what: String((e && e.stack) || e).slice(0, 800), pass: false }); console.log('THREW', String((e && e.stack) || e).slice(0, 800)); await finish(2); }
