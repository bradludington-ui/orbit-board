// THE OTHER APPROPRIATIONS' FRAMES, IN A REAL BROWSER (v1.85).
//
// The five-year spend plan's tabs read every appropriation other than the open one by opening
// it as its own board in a sandboxed srcdoc frame. jsdom runs no such frame, so the suites stand a
// second board in for it (tools/export-audit/boot.mjs); this is the check that the real thing does
// what the stand-in assumes, in Chromium, on both builds:
//
//   1. The frame the board builds is sandboxed for real: inside it, browser storage is refused and
//      this page cannot be reached, and nothing it tries lands in this browser.
//   2. An export from O&M opens Full Fund in a frame, waits for it, downloads the workbook, and
//      leaves no frame behind -- and the Full Fund blocks carry no refusal.
//   3. Every byte of browser storage is what it was before the export.
//   4. The Full Fund tab, and Full Fund's block on every service and PMO tab, is what Full Fund's own board
//      prints when the same browser switches to it and exports (v2.04: the workbook of item 112).
//
//   node tools/fydp-frames.mjs
import { chromium } from 'playwright-core';
import { CHROME } from './chrome.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const SV = ['USAF', 'ANG', 'AFRC'];
const it = (id, grp, ask, ccar) => ({ id, grp, team: grp, sect: '', custom: false, title: 'Req ' + id, event: 'Req ' + id,
  ccar, fy26: ask.map(() => 0), ask, alloc: null });
const OM = { items: [it('A', 'AV', [900, 200, 100], 'JSF5594'), it('B', 'AV', [400, 100, 50], 'JSF5594'), it('C', 'PSM', [300, 80, 40], ''),
                     it('E', 'TSS', [150, 40, 20], 'JSF1000')],
             disc: [1200, 300, 150], mand: [300, 80, 40], trim: { A: { m: 't', v: 1000 } } };
const FF = { items: [it('F', 'AV', [700, 100, 60], 'JSF7000'), it('G', 'TSS', [500, 90, 30], 'JSF1000'), it('H', 'CDS', [250, 60, 20], '')],
             disc: [900, 150, 60], mand: [200, 40, 20], trim: { F: { m: 't', v: 600 } } };

let bad = 0;
const chk = (what, ok, detail) => { if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${what}${detail ? '   ' + detail : ''}`); };
const cv = c => (c && typeof c === 'object' && 'v' in c) ? c.v : c;
// v2.04 (item 112): a tab's blocks -- the section heading above each ('' on an appropriation tab), its lines, TOTAL last
const blocks = (sh) => { const out = []; if (!sh) return out; let sec = ''; const R = sh.rows;
  for (let i = 0; i < R.length; i++) { const r = R[i] || [], c0 = r[0];
    if (c0 && typeof c0 === 'object' && c0.s === 6) { sec = String(c0.v); continue; }
    const v = r.map(cv); if (v[0] !== 'CCaR Record' || v[1] !== 'Requirement Title') continue;
    const rows = []; i += 2; for (; i < R.length; i++) { const x = (R[i] || []).map(cv); rows.push(x); if (x[0] === 'TOTAL') break; }
    out.push({ sec, hdr: v, rows }); }
  return out; };
const tab = (S, n) => (S || []).find(s => s.name === n);
// seed one plan on the open board and save it into browser storage
const seedAndSave = (p, sc) => p.evaluate(({ sc, SV }) => {
  SVC.length = 0; SV.forEach(s => SVC.push(s)); DATA.services = SVC; MS.cur = 2027; MS.base = 2027;
  const order = sc.items.map(i => i.id);
  const st = { order, alloc: {}, mc: {}, fsrc: {}, custom: [], removed: [], discSvc: sc.disc, mandSvc: sc.mand };
  MS.years['2027'] = st; applyState(st);
  DATA.items.length = 0; sc.items.forEach(i => DATA.items.push(i));
  BASE_ITEMS.length = 0; sc.items.forEach(i => { BASE_ITEMS.push(i); BASE_ASK[i.id] = i.ask.slice(); });
  S.discSvc = sc.disc; S.mandSvc = sc.mand; S.order = order; S.fsrc = {}; S.mc = {}; S.alloc = JSON.parse(JSON.stringify(sc.trim));
  MS.years['2027'] = S; MS.cycle = 'BES|2028'; save(); render(); return MS.ts;
}, { sc, SV });
const storage = (p) => p.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return JSON.stringify(o); });
// export the five-year plan and wait for the download, keeping the sheets it was built from
async function exportPlan(p) {
  await p.evaluate(() => { window.__sheets = null; if (!window.__b0) window.__b0 = buildXlsx;
    buildXlsx = function (sh, x) { window.__sheets = JSON.parse(JSON.stringify(sh)); return window.__b0(sh, x); }; fydpSrc = 'working';
    // the name the board gives the file. Headless Chromium on Linux reports any name carrying the
    // board's em dashes as "download" -- synchronous exports included, before v1.85 too -- so the
    // name is read where the board sets it, and the download event proves the file was handed over.
    window.__dlName = ''; if (!window.__click0) { window.__click0 = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () { if (this.download) window.__dlName = this.download; return window.__click0.call(this); }; } });
  const dl = p.waitForEvent('download', { timeout: 150000 });
  const t0 = Date.now();
  await p.evaluate(() => { exportFydpPlan(); });
  const during = await p.evaluate(() => [...document.querySelectorAll('iframe')].map(f => f.getAttribute('sandbox')));
  const d = await dl;
  const ms = Date.now() - t0;
  const after = await p.evaluate(() => document.querySelectorAll('iframe').length);
  const sheets = await p.evaluate(() => window.__sheets);
  return { during, after, sheets, ms, file: await p.evaluate(() => window.__dlName), got: !!d };
}

const b = await chromium.launch({ executablePath: CHROME });
for (const build of ['prioritization-board-grid.html']) {
  console.log(`\n${build}`);
  const ctx = await b.newContext({ acceptDownloads: true });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file://' + ROOT + build); await p.waitForTimeout(500);

  // 1. THE SANDBOX IS REAL: the frame the board opens cannot use storage or reach this page
  const probe = await p.evaluate(() => {
    const html = '<script>var r={nonce:"N1"};'
      + 'try{ localStorage.setItem("fydp-escape","1"); r.ls="wrote"; }catch(e){ r.ls=e.name; }'
      + 'try{ r.parent=!!parent.document.body; }catch(e){ r.parent=e.name; }'
      + 'try{ indexedDB.open("fydp-escape"); r.idb="opened"; }catch(e){ r.idb=e.name; }'
      + 'parent.postMessage(r,"*");<\/script>';
    return fydpFrame(html, 'N1');
  });
  chk('inside the frame, browser storage is refused', probe.ls === 'SecurityError', probe.ls);
  chk('and this page cannot be reached from it', probe.parent === 'SecurityError', String(probe.parent));
  chk('and neither can the database the board keeps its folder handle in', probe.idb === 'SecurityError', probe.idb);
  chk('nothing it tried landed here', await p.evaluate(() => localStorage.getItem('fydp-escape')) === null);
  chk('and the frame is gone', await p.evaluate(() => document.querySelectorAll('iframe').length) === 0);

  // 2. FULL FUND AND O&M, EACH SAVED ON ITS OWN, IN THIS BROWSER
  await seedAndSave(p, FF);
  await p.evaluate(() => { localStorage.setItem('prio27ff', localStorage.getItem('prio27om')); localStorage.removeItem('prio27om'); });
  await seedAndSave(p, OM);
  await p.reload(); await p.waitForTimeout(700);
  chk('the board reopens as O&M with its own plan', await p.evaluate(() => APPN + '|' + S.order.join(',')) === 'O&M|A,B,C,E');
  const before = await storage(p);
  const X = await exportPlan(p);
  chk('Full Fund is opened in one sandboxed frame while the export waits', JSON.stringify(X.during) === '["allow-scripts"]', JSON.stringify(X.during));
  chk('the workbook downloads once it answers', X.got && /^ORBIT FYDP Spend Plan — working plan — FY27–FY31 /.test(X.file), X.file + ` after ${X.ms} ms`);
  chk('and no frame is left behind', X.after === 0);
  chk('every byte of browser storage is what it was', (await storage(p)) === before);
  const names = (X.sheets || []).map(s => s.name).join(',');
  chk('the Summary, a tab per appropriation that holds a plan, per service, then per PMO', names === 'Summary,O&M,Full Fund,USAF,ANG,AFRC,PSM,AV,CDS,TSS', names);
  const refused = (X.sheets || []).filter(sh => sh.rows.some(r => (r || []).some(c => / IS NOT IN THIS WORKBOOK — /.test(String(cv(c) ?? '')))));
  chk('no tab carries a refusal', refused.length === 0, refused.map(s => s.name).join(','));

  // 3. THE SAME BROWSER, SWITCHED TO FULL FUND: its own tabs print what the O&M export printed for it
  await p.evaluate(() => localStorage.setItem('prio27appn', 'FULL FUND'));
  await p.reload(); await p.waitForTimeout(700);
  chk('the board reopens as Full Fund', await p.evaluate(() => APPN + '|' + S.order.join(',')) === 'FULL FUND|F,G,H');
  const Y = await exportPlan(p);
  let ties = 0; const off = [];
  const same = (what, a, w) => { ties++; if (JSON.stringify(a) !== JSON.stringify(w)) off.push(what); };
  same('Full Fund tab', blocks(tab(X.sheets, 'Full Fund')), blocks(tab(Y.sheets, 'Full Fund')));
  (X.sheets || []).slice(3).forEach(sh => blocks(sh).filter(b2 => / — Full Fund$/.test(b2.sec)).forEach(b2 => {
    const own = blocks(tab(Y.sheets, sh.name)).find(x => / — Full Fund$/.test(x.sec));
    same(sh.name, b2.rows, own ? own.rows : null); }));
  chk('the Full Fund tab, and Full Fund’s block on each service and PMO tab, is what Full Fund’s own board prints', ties === 7 && !off.length, `${ties} ties` + (off.length ? ' · ' + off.join(', ') : ''));
  const fl = (blocks(tab(Y.sheets, 'Full Fund'))[0] || { hdr: [], rows: [] }), fr = fl.rows.find(r => r[1] === 'Req F') || [];
  chk('an allocation below the requirement came through as such (F, trimmed to 600, all of it drawn)',
    Math.round(fr[fl.hdr.indexOf('FY27') + 1] * 1e6) === 600 && Math.round(fr[fl.hdr.indexOf('FY27')] * 1e6) === 860);
  chk('nothing threw', errs.length === 0, errs.slice(0, 2).join(' | '));
  await ctx.close();
}
await b.close();
console.log(bad ? `\n${bad} frame check(s) failed\n`
  : '\nThe frames are sealed, the export waits for them, storage is untouched, and every block ties to its own board\n');
process.exit(bad ? 1 : 0);
