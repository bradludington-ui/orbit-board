// The Content-Security-Policy, proved in Chromium (v2.04, item 106; Brad, 22 Oct 2026: "Yes for now").
//
//   node tools/csp-check.mjs [--board FILE]
//
// The board is opened the way people open it -- from a file:// URL -- and asked to reach another host three ways: fetch,
// an image and a frame. Each must be REFUSED BY THE POLICY (a securitypolicyviolation event naming the directive), not
// merely fail: this container has no route out, so a request that fails for that reason would read as a pass and prove
// nothing. The board must still open with no script error, and the FYDP frame (a srcdoc frame) must still be allowed.
// Proved against a board without the policy (v2.03): every refusal check fails there.
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { CHROME } from './chrome.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const bi = process.argv.indexOf('--board');
const FILE = resolve(bi >= 0 ? process.argv[bi + 1] : join(ROOT, 'prioritization-board-grid.html'));
let bad = 0;
const chk = (what, ok, detail) => { if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}${detail && !ok ? '   ' + detail : ''}`); };

const dir = mkdtempSync(join(tmpdir(), 'orbit-csp-'));
const page0 = join(dir, 'board.html');
writeFileSync(page0, readFileSync(FILE));
const browser = await chromium.launch({ executablePath: CHROME });
try {
  const p = await browser.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(pathToFileURL(page0).href, { waitUntil: 'load' });
  await p.waitForTimeout(300);
  chk('the board opens from a file:// URL with no script error', errs.length === 0 && await p.evaluate(() => typeof BUILD === 'string'), errs.slice(0, 2).join(' | '));
  const got = await p.evaluate(async () => {
    const seen = [];
    document.addEventListener('securitypolicyviolation', e => seen.push(e.effectiveDirective + ' ' + e.blockedURI));
    try { await fetch('https://example.invalid/orbit-csp-probe'); } catch (e) {}
    await new Promise(r => { const i = new Image(); i.onload = i.onerror = r; i.src = 'https://example.invalid/orbit-csp-probe.png'; });
    await new Promise(r => { const f = document.createElement('iframe'); f.onload = r; f.src = 'https://example.invalid/'; document.body.appendChild(f); setTimeout(r, 800); });
    let srcdoc = false;
    await new Promise(r => { const f = document.createElement('iframe'); f.setAttribute('sandbox', 'allow-scripts'); f.srcdoc = '<p>x</p>'; f.onload = () => { srcdoc = true; r(); }; document.body.appendChild(f); setTimeout(r, 800); });
    await new Promise(r => setTimeout(r, 200));
    return { seen, srcdoc, meta: !!document.querySelector('meta[http-equiv="Content-Security-Policy"]') };
  });
  chk('the page carries the policy', got.meta);
  chk('a fetch to another host is refused by the policy (connect-src)', got.seen.some(s => s.startsWith('connect-src https://example.invalid')), JSON.stringify(got.seen));
  chk('an image from another host is refused by the policy (img-src)', got.seen.some(s => s.startsWith('img-src https://example.invalid')), JSON.stringify(got.seen));
  chk('a frame on another host is refused by the policy (frame-src)', got.seen.some(s => s.startsWith('frame-src https://example.invalid')), JSON.stringify(got.seen));
  chk('a srcdoc frame (the five-year plan reads other appropriations through one) still opens', got.srcdoc);
} finally { await browser.close(); rmSync(dir, { recursive: true, force: true }); }
console.log(bad ? `\n${bad} CSP check(s) failed` : '\nThe browser refuses every connection to another host, and the board still opens');
process.exit(bad ? 1 : 0);
