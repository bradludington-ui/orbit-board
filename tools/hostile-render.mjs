// A HOSTILE BOARD DOES NOTHING WHEN IT IS DRAWN -- in a real browser (v1.88).
//
// Every name, id, key and piece of text a board shows can arrive in a file from someone else -- a PMO
// copy coming back, a consolidated file, a package, a submittal. The board builds its screens as HTML
// strings, so a value written into one unescaped is markup, and a value written into an inline handler
// is code. Either way something in the file would run inside the board, where it can change the figures
// that are then briefed. The import door (inboundCheck) refuses such files; this proves the DRAWING is
// safe whatever gets past the door -- including a board saved before v1.88, when nothing was checked.
//
// The fixture and the sweep are tools/export-audit/hostile.mjs, shared with audit-hostile.mjs, which
// runs the same sweep in jsdom so the mutation sweep can see it. What only a browser adds: an <img
// onerror> that a planted value turned into markup actually FIRES here, and is counted.
//
//   node tools/hostile-render.mjs [--list]
import { chromium } from 'playwright-core';
import { buildHostile, hostileSweep } from './export-audit/hostile.mjs';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { CHROME } from './chrome.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const FILE = resolve(process.env.BOARD || join(ROOT, 'prioritization-board-grid.html'));
const { saved, n } = buildHostile(readFileSync(FILE, 'utf8'));
const dir = mkdtempSync(join(tmpdir(), 'spmt-hostile-'));
process.on('exit', () => { try { rmSync(dir, { recursive: true, force: true }); } catch {} });
const file = join(dir, 'hostile.html');
writeFileSync(file, saved);

let bad = 0;
const chk = (what, ok, detail) => { if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}${detail ? '   ' + detail : ''}`); };
console.log(`\nhostile board — ${FILE.split('/').pop()}: ${n} requirements, script-shaped text in every field the fixture fills`);

const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
await ctx.addInitScript(() => { window.__hits = []; window.__pw = t => { window.__hits.push(String(t)); }; });
const p = await ctx.newPage();
p.on('dialog', d => d.dismiss().catch(() => {}));
const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
await p.goto('file://' + file);
await p.waitForFunction(() => typeof render === 'function' && document.querySelectorAll('.row').length > 0, null, { timeout: 40000 });

const r = await hostileSweep(code => p.evaluate(code), () => p.waitForTimeout(120));
const hits = await p.evaluate(() => [...new Set(window.__hits)]);
await b.close();

chk('every planted field was drawn somewhere, so the checks below looked at it', r.unseen.length === 0,
  r.unseen.length ? 'never drawn: ' + r.unseen.join(', ') : `${r.shown.size} planted values seen on screen as text`);
if (process.argv.includes('--list')) console.log('    drawn: ' + [...r.shown].sort().join(' '));
chk('nothing planted in the board ran when it was drawn', hits.length === 0, hits.length ? 'ran: ' + hits.join(', ') : '');
chk('no inline handler on any screen carries a planted call as code', r.found.size === 0,
  r.found.size ? [...r.found.entries()].map(([t, w]) => `\n        ${t} — ${w}`).join('') : `${r.ids} requirements, ${r.panels} panels, ${r.menus} menus`);
chk('nothing threw while it was drawn', errs.length === 0, errs.length ? `${errs.length}; first: ${errs[0]}` : '');
console.log(bad ? `\n${bad} check(s) failed — a value from a file can run inside the board\n`
                : '\nNothing a file can carry runs when the board draws it\n');
process.exit(bad ? 1 : 0);
