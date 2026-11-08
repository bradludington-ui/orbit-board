// END TO END IN CHROMIUM, the file-first prototype (proto.html), on the board the shipped import refuses (sizes/out/e-v212.html).
// 1. The browser the old board ran in (its own storage seeded from page code after load; the estimate refused at seeding, as
//    measured), or a browser filled to the brim by another file:// page (--full).
// 2. The v2.13 program (the prototype) opened from file://, Board › Import a full board through the real #fullFile input. The
//    Save dialog is stood in for, from page code after load: a handle whose bytes land on disk beside the program.
// 3. What the import wrote and removed; the page after its reload.
// 4. The written file opened from file:// as a person would: what it shows, what opening wrote, an edit, 💾 Save (the board's own
//    in-place save, through the same stand-in), the file reopened, and another appropriation opened from it.
// usage: node --max-old-space-size=8192 e2e.mjs [--full] [--label X] [--prog proto.html]
import { chromium } from '/home/user/orbit-board/node_modules/playwright-core/index.mjs';
import { CHROME } from '/home/user/orbit-board/tools/chrome.mjs';
import { readFileSync, copyFileSync, mkdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
const D = new URL('.', import.meta.url).pathname;
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 ? process.argv[i + 1] : d; };
const FULL = process.argv.includes('--full'), LABEL = arg('label', FULL ? 'e2e-full' : 'e2e-old');
const RUN = join(D, 'run', LABEL); mkdirSync(RUN, { recursive: true });
copyFileSync(arg('prog', join(D, 'proto.html')), join(RUN, 'ORBIT v2.13.html'));
copyFileSync(join(D, '../sizes/out/e-v212.html'), join(RUN, 'ORBIT Live.html'));
writeFileSync(join(RUN, 'blank.html'), '<!doctype html><meta charset="utf-8"><title>blank</title><body>blank</body>');
const OUTNAME = 'ORBIT Live (ORBIT v2.13).html', OUTP = join(RUN, OUTNAME);
const keysNow = p => p.evaluate(() => { const o = {}; let t = 0; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i), v = localStorage.getItem(k); o[k] = v.length; t += k.length + v.length; } return { keys: o, total: t }; });
const stat = p => p.evaluate(() => { const e = document.getElementById('shareStat'); return e ? e.textContent.replace(/\s+/g, ' ').slice(0, 600) : ''; });
const R = { label: LABEL, chromium: '', steps: [] };
const step = (name, v) => { R.steps.push([name, v]); console.log('--', name, JSON.stringify(v).slice(0, 900)); };

const browser = await chromium.launch({ executablePath: CHROME });
R.chromium = browser.version();
const ctx = await browser.newContext();
const dialogs = [];
ctx.on('page', p => p.on('dialog', async d => { dialogs.push({ type: d.type(), msg: d.message().slice(0, 300) }); await d.accept(); }));
// the stand-in for the Save dialog: one file on disk per name, read and written as a FileSystemFileHandle would
await ctx.exposeFunction('__fsRead', name => { const p = join(RUN, name); return existsSync(p) ? readFileSync(p, 'utf8') : ''; });
await ctx.exposeFunction('__fsWrite', (name, text) => { writeFileSync(join(RUN, name), text); return text.length; });
const PICKER = name => `(function(){
  window.showSaveFilePicker=async function(){
    const nm=${JSON.stringify(name)};
    return { kind:'file', name:nm,
      getFile: async function(){ const t=await window.__fsRead(nm); return new File([t], nm, {type:'text/html'}); },
      createWritable: async function(){ let buf=''; return { write: async function(d){ buf=(typeof d==='string')? d : await new Response(d).text(); },
                                                               close: async function(){ await window.__fsWrite(nm, buf); } }; },
      requestPermission: async function(){ return 'granted'; }, queryPermission: async function(){ return 'granted'; } };
  }; return 'stubbed'; })()`;

// 1. this browser
const blank = await ctx.newPage();
await blank.goto('file://' + join(RUN, 'blank.html'));
if (FULL) {
  step('filled by another page', await blank.evaluate(() => {
    // fill to the last character: halve until refused
    let n = 0, chunk = 4194304; localStorage.clear();
    while (chunk >= 1) { try { localStorage.setItem('another-file-page-' + n, 'f'.repeat(chunk)); n++; } catch (e) { chunk = Math.floor(chunk / 2); } }
    let t = 0; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); t += k.length + localStorage.getItem(k).length; } return { keys: localStorage.length, total: t };
  }));
} else {
  const ls = JSON.parse(readFileSync(join(D, '../sizes/out/e-v212.ls.json'), 'utf8'));
  const order = ['prio27appn', 'prio27om', 'prio27ff', 'prio27sp', 'prio27opn', 'prio27om-cyc', 'prio27ff-cyc', 'prio27sp-cyc', 'prio27opn-cyc',
    'prio27buddb', 'prio27destdb', 'prio27execdb', 'prio27acedb'];
  Object.keys(ls).forEach(k => { if (order.indexOf(k) < 0) order.push(k); });
  step('old board seeded', await blank.evaluate(([ls, order]) => order.filter(k => ls[k] != null).map(k => { try { localStorage.setItem(k, ls[k]); return [k, ls[k].length, 'stored']; } catch (e) { return [k, ls[k].length, e.name]; } }), [ls, order]));
}
step('storage before', await keysNow(blank));

// 2. the program, and the import
const page = await ctx.newPage();
const errs = []; page.on('pageerror', e => errs.push(String(e.message).slice(0, 200)));
await page.goto('file://' + join(RUN, 'ORBIT v2.13.html'));
await page.waitForTimeout(2500);
step('program opened', await page.evaluate(() => ({ order: S.order.length, items: DATA.items.length, shell: IS_SHELL, build: BUILD })));
await page.evaluate(PICKER(OUTNAME));
await page.evaluate(() => { window.__fileFirst = true; });
dialogs.length = 0;
const t0 = Date.now();
const nav = page.waitForEvent('load', { timeout: 120000 }).catch(e => 'no reload: ' + e.message);
await page.setInputFiles('#fullFile', join(RUN, 'ORBIT Live.html'));
const navR = await nav;
step('import', { ms: Date.now() - t0, reloaded: typeof navR !== 'string', dialogs: dialogs.map(d => d.type + ': ' + d.msg.slice(0, 160)), written: existsSync(OUTP) ? statSync(OUTP).size : 0 });
await page.waitForTimeout(2500);
step('storage after import', await keysNow(page));
step('the reloaded page says', { stat: await stat(page), shows: await page.evaluate(() => ({ order: S.order.length, shell: IS_SHELL })) });
const written = readFileSync(OUTP, 'utf8');
step('written file', { chars: written.length, pubStateChars: (written.match(/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/) || ['', ''])[1].length, sameAsJsdomRouteB: written.length });

// 4. open the written file as a person would
const nb = await ctx.newPage();
const errs2 = []; nb.on('pageerror', e => errs2.push(String(e.message).slice(0, 200)));
await nb.goto('file://' + OUTP);
await nb.waitForTimeout(3000);
const FIG = () => nb.evaluate(() => { const t = tierTotals(tiers()); return { appn: APPN, order: S.order.length, items: DATA.items.length, shell: IS_SHELL, years: Object.keys(MS.years), cyc: Object.keys(CYCDB.cycles || {}), ace: Object.keys(ACEDB.sets || {}), ex: Object.keys(EXDB.all || {}), bud: (BUDDB.rows || []).length, tot: [t.dUsed, t.mUsed, t.u1Amt, t.u2Amt], lost: _bootLost.slice(), unsaved: unsavedNow(), persistFail: _persistFail }; });
step('imported file opened', { fig: await FIG(), stat: await stat(nb), errors: errs2.slice() });
step('storage after opening it', await keysNow(nb));
// an edit
step('edit (a note on the first requirement)', await nb.evaluate(() => { const id = S.order[0]; setNote(id, 'file-first e2e note'); return { id, persistFail: _persistFail, unsaved: unsavedNow(), note: S.notes[id] }; }));
step('after edit', { stat: await stat(nb), storage: await keysNow(nb) });
// 💾 Save in place, through the same stand-in
await nb.evaluate(PICKER(OUTNAME));
dialogs.length = 0;
await nb.evaluate(() => saveInPlace());
await nb.waitForTimeout(4000);
step('save', { stat: await stat(nb), dialogs: dialogs.map(d => d.type + ': ' + d.msg.slice(0, 200)), unsaved: await nb.evaluate(() => unsavedNow()), chars: statSync(OUTP).size });
// save again (the writer record is checked against what was written)
dialogs.length = 0;
await nb.evaluate(() => { setNote(S.order[1], 'second edit'); return saveInPlace(); });
await nb.waitForTimeout(4000);
step('second save', { stat: await stat(nb), dialogs: dialogs.map(d => d.type + ': ' + d.msg.slice(0, 200)), unsaved: await nb.evaluate(() => unsavedNow()) });
// reopen
const nc = await ctx.newPage();
const errs3 = []; nc.on('pageerror', e => errs3.push(String(e.message).slice(0, 200)));
await nc.goto('file://' + OUTP);
await nc.waitForTimeout(3000);
step('reopened', { fig: await nc.evaluate(() => { const t = tierTotals(tiers()); return { order: S.order.length, items: DATA.items.length, note0: S.notes[S.order[0]], note1: S.notes[S.order[1]], tot: [t.dUsed, t.mUsed, t.u1Amt, t.u2Amt], unsaved: unsavedNow() }; }), stat: await stat(nc), errors: errs3 });
// another appropriation, opened from the same file (switchAppn reloads)
const navF = nc.waitForEvent('load', { timeout: 60000 }).catch(e => 'no reload');
await nc.evaluate(() => switchAppn('FULL FUND'));
await navF; await nc.waitForTimeout(3000);
step('Full Fund from the file', { fig: await nc.evaluate(() => { const t = tierTotals(tiers()); return { appn: APPN, order: S.order.length, items: DATA.items.length, cyc: Object.keys(CYCDB.cycles || {}), tot: [t.dUsed, t.mUsed, t.u1Amt, t.u2Amt] }; }), stat: await stat(nc), errors: errs3 });
step('storage at the end', await keysNow(nc));
R.errors = errs;
await browser.close();
writeFileSync(join(RUN, 'result.json'), JSON.stringify(R, null, 1));
