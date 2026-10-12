// Chunk 3 (part 2) width sweep, in Chromium, on the actual board with synthetic data made at run time only.
//   node sweep3.mjs <board.html> <part> <out.json>
//   part = posture -- S1: every control in the funding posture strip (Needs attention's entries, Funding detail), in
//                     Funding and Brief, at every width 700-1900 in steps of 20 (1440 among them), with the sidebar open,
//                     as the rail, docked, and docked with the rail: on screen without scrolling the strip, not cut by it,
//                     and the thing under its own centre (elementFromPoint), so a click there reaches it. Rows are checked
//                     at each width too (overflow, a cell outside its row, a cut money figure, the page scrolling sideways).
//   part = reports -- S5: Reports & exports opened from its button, then each of its folded groups opened from its heading,
//                     at 760, 761 and 1000 and every width 700-1900 in steps of 20, with the sidebar open (at 900 and
//                     narrower: open over the page, which the click on Reports closes, as any click outside it does) and as
//                     the rail: the menu inside the window and clear of the sidebar, and every item, scrolled into view
//                     inside the menu, inside the window and the thing under its own centre. At 760, 761 and 1000 every
//                     other toolbar menu and its groups too.
// Each setting is made as a person makes it: the sidebar's own ‹ button, View › Record panel › Docked beside the table.
import { chromium } from '/home/user/orbit-ui/node_modules/playwright-core/index.mjs';
import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';
const [FILE, part, OUT] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const errs = [];
// the chunk 2 review's seed (rv2/sweep.mjs): fourteen requirements, one carrying a nine-digit figure per service and a
// nine-digit allocation, so the widest figures the strip and the rows print are on screen; one without a CCaR record, so
// Needs attention carries one entry more than it otherwise would
const PM = ['PSM', 'ATL', 'TSS', 'AV', 'MxS', 'LOG'];
const NAMES = ['Depot pod overhaul', 'Engine spares pool', 'Training system refresh', 'Avionics software drop', 'Maintenance data link', 'Logistics IT sustainment', 'Support equipment buy', 'Simulator concurrency', 'Field service reps', 'Repair network stand-up', 'Tech data update', 'Obsolescence redesign', 'Test equipment recal', 'Packaging & shipping'];
const items = NAMES.map((n, i) => ({ id: 'S' + String(i + 1).padStart(2, '0'), grp: PM[i % PM.length], team: PM[i % PM.length], sect: '', custom: false, title: 'Synthetic — ' + n, event: n, ccar: i === 13 ? '' : 'SYN-' + (100 + i), fy26: [0, 0, 0], ask: [(9 + (i * 7) % 23) * 1e6, (2 + (i * 3) % 7) * 1e6, (1 + (i * 5) % 4) * 1e6], alloc: null }));
items[0].ask = [234567891, 123456789, 101234567];
async function open(w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('dialog', d => d.dismiss().catch(() => {}));
  page.on('pageerror', e => errs.push(part + ' ' + String(e)));
  await page.goto(pathToFileURL(FILE).href);
  await page.waitForTimeout(500);
  await page.evaluate(({ items }) => {
    SVC.length = 0; ['USAF', 'ANG', 'AFRC'].forEach(s => SVC.push(s)); DATA.services = SVC;
    MS.cur = 2027; MS.base = 2027;
    const order = items.map(i => i.id);
    const st = { order, alloc: {}, mc: {}, fsrc: {}, custom: [], removed: [], discSvc: [180e6, 40e6, 22e6], mandSvc: [25e6, 6e6, 3e6] };
    MS.years['2027'] = st; applyState(st);
    DATA.items.length = 0; items.forEach(i => DATA.items.push(i));
    BASE_ITEMS.length = 0; DATA.items.forEach(i => { BASE_ITEMS.push(i); BASE_ASK[i.id] = i.ask.slice(); });
    S.discSvc = st.discSvc; S.mandSvc = st.mandSvc; S.order = order; S.fsrc = {}; S.mc = {}; S.alloc = {};
    S.alloc[order[0]] = { m: 't', v: 345678901 };
    S.bm = { disc: st.discSvc, mand: st.mandSvc, adds: [] };
    render();
  }, { items });
  return page;
}
async function setRail(p, on) { const is = await p.evaluate(() => !!(window.UI2 && UI2.rail)); if (is !== on) { await p.click('#uiCollapse'); await p.waitForTimeout(80); } }
async function setDock(p, on) { await p.click('#uiDensBtn'); await p.waitForTimeout(60);
  await p.click(`#uiDensPop button.o:has-text("${on ? 'Docked beside the table' : 'Slides over the table'}")`); await p.waitForTimeout(80); }
// THE STRIP: every control in it, judged where it is drawn
const STRIP = () => {
  const s = document.getElementById('posture');
  if (!s || getComputedStyle(s).display === 'none') return { shown: false };
  const S = s.getBoundingClientRect();
  const side = document.getElementById('uiSide');
  const sideR = (side && getComputedStyle(side).display !== 'none') ? side.getBoundingClientRect().right : 0;
  const ctl = [...new Set([...s.querySelectorAll('button, select, input, a[href], [onclick]')])]
    .filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden');
  const bad = [];
  ctl.forEach(e => {
    const r = e.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const lbl = (e.textContent || e.getAttribute('aria-label') || e.tagName).replace(/\s+/g, ' ').trim().slice(0, 34);
    const why = [];
    if (!(r.width > 0 && r.height > 0)) why.push('no size');
    if (r.left < S.left - 0.5 || r.right > S.right + 0.5) why.push('outside the strip (' + Math.round(r.left) + '–' + Math.round(r.right) + ' in ' + Math.round(S.left) + '–' + Math.round(S.right) + ')');
    if (r.right > innerWidth + 0.5 || r.left < -0.5 || r.top < -0.5 || r.bottom > innerHeight + 0.5) why.push('outside the window');
    if (r.left < sideR - 0.5) why.push('under the sidebar');
    const top = document.elementFromPoint(cx, cy);
    if (!top || !(top === e || e.contains(top))) why.push('covered by ' + (top ? (top.id ? '#' + top.id : top.tagName.toLowerCase() + '.' + String(top.className).split(' ')[0]) : 'nothing'));
    if (why.length) bad.push(lbl + ': ' + why.join(', '));
  });
  const fd = ctl.some(e => /Funding detail/.test(e.textContent || ''));
  const att = s.querySelector('.ppatt');
  return { shown: true, n: ctl.length, fundingDetail: fd, needsAttention: !!att && att.getClientRects().length > 0,
    scrolls: s.scrollWidth > s.clientWidth + 1, h: Math.round(S.height), bad };
};
// THE ROWS, as the chunk 2 review's sweep measures them
const ROWS = () => {
  const vis = e => e && e.offsetParent !== null && getComputedStyle(e).visibility !== 'hidden';
  const rows = [...document.querySelectorAll('#list .row')].filter(vis);
  let rowsOver = 0; const cellsOut = new Set(), moneyCut = [];
  rows.forEach(row => { const R = row.getBoundingClientRect(); if (row.scrollWidth > row.clientWidth) rowsOver++;
    [...row.children].filter(vis).forEach(c => { const r = c.getBoundingClientRect(); if (r.right > R.right + 1 || r.left < R.left - 1) cellsOut.add(c.className.split(' ')[0]); });
    row.querySelectorAll('.num, .amt').forEach(c => { if (vis(c) && c.scrollWidth > c.clientWidth + 1) moneyCut.push((c.textContent || '').trim().slice(0, 16)); }); });
  return { rowsOver, cellsOut: [...cellsOut], moneyCut: moneyCut.slice(0, 4), page: document.documentElement.scrollWidth - document.documentElement.clientWidth };
};
const widths = []; for (let w = 700; w <= 1900; w += 20) widths.push(w);
const out = { part, file: FILE, widths: [widths[0], widths[widths.length - 1], 20], res: {} };
if (part === 'posture') {
  for (const [cfg, rail, dock] of [['sidebar open', false, false], ['rail', true, false], ['docked', false, true], ['docked + rail', true, true]]) {
    const p = await open(1440, 900);
    await setRail(p, rail); await setDock(p, dock);
    out.res[cfg] = { set: await p.evaluate(() => ({ cls: document.documentElement.className, ls: Object.keys(localStorage).filter(k => /^prio27ui/.test(k)).sort().map(k => k + '=' + localStorage.getItem(k)) })) };
    for (const mode of ['fund', 'brief']) {
      await p.evaluate(m => { uiSetMode(m); render(); try { drawerClose(); } catch (e) {} window.scrollTo(0, 0); }, mode);
      const bad = [], strip = {};
      for (const w of widths) {
        await p.setViewportSize({ width: w, height: 900 }); await p.evaluate(() => { window.dispatchEvent(new Event('resize')); render(); window.scrollTo(0, 0); }); await p.waitForTimeout(110);
        const s = await p.evaluate(STRIP), r = await p.evaluate(ROWS);
        strip[w] = { n: s.n, h: s.h };
        const why = [];
        if (!s.shown) why.push('the strip is not shown');
        else {
          if (!s.fundingDetail) why.push('no Funding detail');
          if (!s.needsAttention) why.push('no Needs attention');
          if (s.scrolls) why.push('the strip scrolls');
          if (s.bad.length) why.push(...s.bad);
        }
        if (r.rowsOver || r.cellsOut.length || r.moneyCut.length || r.page > 0) why.push('rows: ' + JSON.stringify(r));
        if (why.length) bad.push(w + ': ' + why.join(' | '));
      }
      out.res[cfg][mode] = { bad, strip };
    }
    await p.context().close();
  }
}
// ONE OPEN TOOLBAR MENU, judged as dropdowns-visible judges it -- and against the sidebar's edge as well
const MENU = () => {
  const dd = document.querySelector('.menu.open > .mdd'); if (!dd) return { none: true };
  const W = innerWidth, H = innerHeight, r = dd.getBoundingClientRect(), out = [];
  const side = document.getElementById('uiSide');
  const sideR = (side && getComputedStyle(side).display !== 'none') ? side.getBoundingClientRect().right : 0;
  if (r.top < -0.5 || r.left < -0.5 || r.bottom > H + 0.5 || r.right > W + 0.5) out.push('the menu runs outside the window');
  if (r.left < sideR - 0.5) out.push('the menu starts under the sidebar (' + Math.round(r.left) + ' < ' + Math.round(sideR) + ')');
  const items = [...dd.querySelectorAll('.mi, button, select, input')].filter(e => e.offsetParent !== null || getComputedStyle(e).position === 'fixed');
  items.forEach(e => {
    e.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    const c = e.getBoundingClientRect(), x = c.left + Math.min(c.width / 2, 20), y = c.top + c.height / 2;
    const label = (e.textContent || e.getAttribute('aria-label') || e.tagName).replace(/\s+/g, ' ').trim().slice(0, 40);
    if (c.top < -0.5 || c.bottom > H + 0.5 || c.left < -0.5 || c.right > W + 0.5) { out.push('"' + label + '" is outside the window'); return; }
    const top = document.elementFromPoint(x, y);
    if (!top || !(top === e || e.contains(top))) out.push('"' + label + '" is covered by ' + (top ? (top.id ? '#' + top.id : top.tagName.toLowerCase() + '.' + String(top.className).split(' ')[0]) : 'nothing'));
  });
  return { items: items.length, left: Math.round(r.left), right: Math.round(r.right), sideR: Math.round(sideR), sideways: dd.scrollWidth > dd.clientWidth + 1, problems: out };
};
if (part === 'reports') {
  const ws = [760, 761, 1000].concat(widths.filter(w => w !== 760 && w !== 1000));
  for (const [cfg, rail] of [['sidebar open', false], ['rail', true]]) {
    const res = out.res[cfg] = { bad: [], looked: 0 };
    for (const w of ws) {
      const p = await open(w, 900);
      await setRail(p, rail && w > 900);   // at 900 and narrower the sidebar is the rail whatever was chosen
      const keys = [760, 761, 1000].includes(w) ? await p.evaluate(() => [...document.querySelectorAll('.menu[id^="m_"]')].map(m => m.id.slice(2))
        .filter(k => { const bt = document.getElementById('b_' + k); if (!bt) return false; const c = bt.getBoundingClientRect(); return c.width > 0 && c.height > 0; })) : ['reports'];
      for (const k of keys) {
        await p.evaluate(() => window.scrollTo(0, 0));
        if (!rail && w <= 900) { await p.click('#uiCollapse'); await p.waitForTimeout(80); }   // the sidebar open over the page
        await p.click('#b_' + k); await p.waitForTimeout(120);
        const gs = await p.evaluate(k => [...document.querySelectorAll('#dd_' + k + ' .gh')].map(h => h.getAttribute('data-g')), k);
        for (const g of [null, ...gs]) {
          if (g) { await p.click(`#dd_${k} .gh[data-g="${g}"]`); await p.waitForTimeout(100); }
          const r = await p.evaluate(MENU); res.looked++;
          const at = w + ' ' + k + (g ? ' › ' + g : '');
          if (r.none) res.bad.push(at + ': the menu is not open');
          else r.problems.forEach(x => res.bad.push(at + ': ' + x));
          if (k === 'reports' && [760, 761, 1000, 1440].includes(w)) (res.edges = res.edges || {})[at] = { left: r.left, right: r.right, sidebarEdge: r.sideR, items: r.items, scrollsSideways: r.sideways };
        }
        await p.keyboard.press('Escape'); await p.waitForTimeout(60);
      }
      await p.context().close();
    }
  }
  await browser.close();
  out.errs = errs;
  writeFileSync(OUT, JSON.stringify(out, null, 1));
  const n = Object.values(out.res).reduce((a, c) => a + c.bad.length, 0);
  console.log(part, 'problems:', n, '· page errors:', errs.length);
  for (const [cfg, c] of Object.entries(out.res)) {
    const ws2 = [...new Set(c.bad.map(x => +x.split(' ')[0]))];
    console.log(`  ${cfg.padEnd(14)} ${c.looked} opened · ${ws2.length ? c.bad.length + ' problem(s) at ' + ws2.length + ' width(s): ' + ws2.join(' ') : 'every item in the window, clear of the sidebar and on top'}`);
  }
  process.exit(n || errs.length ? 1 : 0);
}
await browser.close();
out.errs = errs;
writeFileSync(OUT, JSON.stringify(out, null, 1));
const n = Object.values(out.res).reduce((a, c) => a + ['fund', 'brief'].reduce((b, m) => b + ((c[m] || {}).bad || []).length, 0), 0);
console.log(part, 'widths with a problem:', n, '· page errors:', errs.length);
for (const [cfg, c] of Object.entries(out.res)) for (const m of ['fund', 'brief']) if (c[m]) {
  const ws = c[m].bad.map(x => +x.split(':')[0]);
  console.log(`  ${cfg.padEnd(14)} ${m.padEnd(6)} ${ws.length ? ws.length + ' width(s): ' + ws.join(' ') : 'every width clean'}`);
}
process.exit(n || errs.length ? 1 : 0);
