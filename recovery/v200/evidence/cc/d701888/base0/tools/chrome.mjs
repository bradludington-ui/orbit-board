// WHERE CHROMIUM IS (v1.91, item 34). Every browser check launches the same executable, found the same way:
//   1. CHROME_BIN, when it is set -- a machine that keeps Chromium somewhere else says so once, here;
//   2. /opt/pw-browsers/chromium -- the image's own link, which carries no version number;
//   3. the newest /opt/pw-browsers/chromium-<revision>/chrome-linux/chrome;
// or a clear error naming everything it tried. It never downloads anything: `playwright install` is not run
// in this repository, ever. Fourteen tools used to name revision 1194 by hand, so a machine with any other
// revision could run none of them -- a review found exactly that and could not re-run a single browser check.
//
//   import { CHROME } from './chrome.mjs';      // the path, found once when the tool starts
//   node tools/chrome.mjs --selftest            // proves the order on throwaway folders (npm run chrome)
import { statSync, readdirSync, mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export function findChrome(env = process.env, root = '/opt/pw-browsers') {
  const tried = [];
  const isFile = p => { tried.push(p); try { return statSync(p).isFile(); } catch { return false; } };
  if (env.CHROME_BIN) {
    // Set on purpose, so a wrong value is an error rather than a quiet fall-through to some other browser.
    if (isFile(env.CHROME_BIN)) return env.CHROME_BIN;
    throw new Error(`CHROME_BIN is set to ${env.CHROME_BIN}, which is not a file. Point it at a Chromium, or unset it.`);
  }
  const link = join(root, 'chromium');
  if (isFile(link)) return link;
  let revs = [];
  try { revs = readdirSync(root).map(n => /^chromium-(\d+)$/.exec(n)).filter(Boolean).map(m => +m[1]).sort((a, b) => b - a); } catch {}
  for (const r of revs) { const p = join(root, 'chromium-' + r, 'chrome-linux', 'chrome'); if (isFile(p)) return p; }
  throw new Error(`No Chromium found. Tried: ${tried.length ? tried.join(', ') : root + ' (not readable)'}. `
    + 'Set CHROME_BIN to a Chromium executable. Never run `playwright install` here.');
}

const SELF = /chrome\.mjs$/.test(process.argv[1] || '');
export const CHROME = SELF ? null : findChrome();

if (SELF && process.argv.includes('--selftest')) {
  const base = mkdtempSync(join(tmpdir(), 'orbit-chrome-'));
  const bin = (dir) => { mkdirSync(dir, { recursive: true }); const f = join(dir, 'chrome'); writeFileSync(f, ''); return f; };
  let bad = 0;
  const expect = (what, fn, want) => {
    let got; try { got = fn(); } catch (e) { got = 'ERROR: ' + e.message; }
    const ok = typeof want === 'function' ? want(got) : got === want;
    if (!ok) bad++;
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}${ok ? '' : ` -- got ${got}`}`);
  };
  // two revisions, no link: the newer one
  const r1 = join(base, 'r1'); bin(join(r1, 'chromium-1100', 'chrome-linux')); const newer = bin(join(r1, 'chromium-1300', 'chrome-linux'));
  expect('the newest revision when there is no link', () => findChrome({}, r1), newer);
  // a link beats every revision
  const r2 = join(base, 'r2'); const inside = bin(join(r2, 'chromium-1200', 'chrome-linux')); symlinkSync(inside, join(r2, 'chromium'));
  expect('the version-free link before any revision', () => findChrome({}, r2), join(r2, 'chromium'));
  // CHROME_BIN beats both
  const own = bin(join(base, 'elsewhere'));
  expect('CHROME_BIN before the link and the revisions', () => findChrome({ CHROME_BIN: own }, r2), own);
  // CHROME_BIN pointing nowhere is an error, not a fall-through
  expect('a CHROME_BIN that is not a file is refused', () => findChrome({ CHROME_BIN: join(base, 'nope') }, r2), g => /^ERROR: CHROME_BIN is set/.test(g));
  // nothing at all: an error that says what it tried
  const r3 = join(base, 'r3'); mkdirSync(r3);
  expect('nothing found names what was tried and never offers to download', () => findChrome({}, r3),
    g => /^ERROR: No Chromium found/.test(g) && g.includes(join(r3, 'chromium')) && /Never run `playwright install`/.test(g));
  rmSync(base, { recursive: true, force: true });
  let here = '';
  try { here = findChrome(); } catch (e) { here = 'none -- ' + e.message; }
  console.log(`\n  on this machine: ${here}`);
  console.log(bad ? `\n  ${bad} check(s) failed\n` : '\n  Chromium is found the same way by every browser check\n');
  process.exit(bad || /^none/.test(here) ? 1 : 0);
}
