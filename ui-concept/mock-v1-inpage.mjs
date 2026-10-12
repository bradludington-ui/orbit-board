// mock.mjs <board.html> <outDir> -- MOCKUPS ONLY. Loads the REAL board (unchanged file, blob 4d273c06) in Chromium with
// SYNTHETIC data, then applies the proposed UI changes IN THE PAGE ONLY (DOM/CSS injected after load) to show the intended
// design in the program's own styling. Nothing is written to the board file; nothing is saved.
import { chromium } from '/home/user/orbit-board/node_modules/playwright-core/index.mjs';
import { pathToFileURL } from 'node:url';
const [board, out] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.on('dialog', d => d.dismiss().catch(() => {}));
await page.goto(pathToFileURL(board).href);
await page.waitForTimeout(600);

// ── synthetic board: three services, 14 requirements across PMOs (the same seed boot.mjs uses) ──
const PM = ['PSM', 'ATL', 'TSS', 'AV', 'MxS', 'LOG'];
const NAMES = ['Depot pod overhaul', 'Engine spares pool', 'Training system refresh', 'Avionics software drop', 'Maintenance data link',
  'Logistics IT sustainment', 'Support equipment buy', 'Simulator concurrency', 'Field service reps', 'Repair network stand-up',
  'Tech data update', 'Obsolescence redesign', 'Test equipment recal', 'Packaging & shipping'];
const items = NAMES.map((n, i) => ({ id: 'S' + String(i + 1).padStart(2, '0'), grp: PM[i % PM.length], team: PM[i % PM.length], sect: '', custom: false,
  title: 'Synthetic — ' + n, event: n, ccar: 'SYN-' + (100 + i), fy26: [0, 0, 0],
  ask: [ (9 + (i * 7) % 23) * 1e6, (2 + (i * 3) % 7) * 1e6, (1 + (i * 5) % 4) * 1e6 ], alloc: null }));
await page.evaluate(({ items }) => {
  SVC.length = 0; ['USAF', 'ANG', 'AFRC'].forEach(s => SVC.push(s)); DATA.services = SVC;
  if (typeof MS === 'undefined' || !MS) { MS = { base: 2027, cur: 2027, ts: 0, years: {} }; }
  MS.cur = 2027; MS.base = 2027;
  const order = items.map(i => i.id);
  const st = { order, alloc: {}, mc: {}, fsrc: {}, custom: [], removed: [], discSvc: [180e6, 40e6, 22e6], mandSvc: [25e6, 6e6, 3e6] };
  MS.years['2027'] = st; applyState(st);
  DATA.items.length = 0; items.forEach(i => DATA.items.push(i));
  BASE_ITEMS.length = 0; DATA.items.forEach(i => { BASE_ITEMS.push(i); BASE_ASK[i.id] = i.ask.slice(); });
  S.discSvc = st.discSvc; S.mandSvc = st.mandSvc; S.order = order; S.fsrc = {}; S.mc = {}; S.alloc = {};
  S.bm = { disc: st.discSvc, mand: st.mandSvc, adds: [] };
  try { localStorage.setItem('prio27who', 'Synthetic user'); } catch (e) {}
  render();
}, { items });
await page.evaluate(() => { try { uiSetMode('review'); } catch (e) {} render(); });
await page.waitForTimeout(400);
const shot = async (name, opts = {}) => { await page.waitForTimeout(250); await page.screenshot({ path: `${out}/${name}.png`, ...opts }); };

await shot('0-today');

// ── MOCK STYLES, injected in the page only ──
await page.addStyleTag({ content: `
  .mk-tag{position:fixed;left:12px;bottom:12px;z-index:999;background:#d4a017;color:#111;font:700 11px/1.2 system-ui;padding:6px 10px;border-radius:6px;letter-spacing:.3px;box-shadow:0 4px 14px rgba(0,0,0,.4)}
  .mk-nav{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:6px;border:1px solid var(--line2);background:var(--panel2);color:var(--ink);font-size:13px;cursor:pointer;flex:none}
  .mk-sum{display:none;align-items:center;gap:6px;font-size:12px;color:var(--ink);font-weight:600;white-space:nowrap}
  .mk-sum .mk-pill{border:1px solid var(--line2);border-radius:999px;padding:2px 9px;background:var(--panel);font-weight:600}
  html.mk-navc .tbar, html.mk-navc .posture, html.mk-navc .hdr .ctx, html.mk-navc .hdr .srch, html.mk-navc .hdr #m_view,
  html.mk-navc .hdr .fchips, html.mk-navc .hdr > .csep{display:none!important}
  html.mk-navc .mk-sum{display:inline-flex}
  html.mk-navc #topStack{box-shadow:0 2px 10px rgba(0,0,0,.25)}
  html.mk-drawer .gridsplit{grid-template-columns:minmax(0,1fr)!important}
  html.mk-drawer .inspector{position:fixed!important;top:0!important;right:0;bottom:0;left:auto;width:min(480px,92vw);max-height:none!important;height:100%;
    z-index:60;border-radius:0;border-width:0 0 0 1px;box-shadow:-14px 0 34px rgba(0,0,0,.34);transform:translateX(102%);transition:none}
  html.mk-drawer .inspector.open{transform:translateX(0)}
  html.mk-drawer .inspector .drawerbar{display:flex}
  html.mk-drawer .drawerscrim.on{display:block}
  html.mk-drawer #list .row.cur{box-shadow:inset 3px 0 0 var(--gold);background:var(--panel2)}
  .mk-imp .modal{width:860px;border-color:var(--gold)}
  .mk-imp h3{margin:0 0 4px;font-size:15px}
  .mk-imp p.lead{margin:0 0 14px;color:var(--mut);font-size:12px;line-height:1.5}
  .mk-ch{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
  .mk-ch button{all:unset;cursor:pointer;display:flex;flex-direction:column;gap:8px;padding:14px;border:1px solid var(--line2);border-radius:10px;background:var(--panel2);color:var(--ink)}
  .mk-ch button:hover,.mk-ch button.mk-focus{border-color:var(--gold);box-shadow:0 0 0 2px color-mix(in srgb,var(--gold) 35%,transparent)}
  .mk-ch .ico{font-size:22px}
  .mk-ch b{font-size:13.5px}
  .mk-ch span.d{font-size:11.5px;line-height:1.5;color:var(--mut)}
  .mk-ch span.w{font-size:10.5px;color:var(--dim);border-top:1px solid var(--line);padding-top:7px;margin-top:auto}
  .mk-imp .foot{display:flex;justify-content:space-between;align-items:center;margin-top:14px;font-size:11px;color:var(--dim)}
`});
// the collapse control and the one-line summary, placed in the real header
await page.evaluate(() => {
  const hdr = document.querySelector('.hdr'), brand = hdr.querySelector('.brand');
  const b = document.createElement('button'); b.className = 'mk-nav'; b.textContent = '▴'; b.title = 'Collapse the bars to one line';
  brand.after(b);
  const sum = document.createElement('span'); sum.className = 'mk-sum';
  const sel = document.getElementById('appnSel'); const ap = sel && sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : 'O&M';
  const fy = (document.getElementById('b_fy') || {}).textContent || 'FY27'; const pmo = (document.getElementById('b_pmo') || {}).textContent || 'All offices';
  sum.innerHTML = '<span class="mk-pill">' + ap + '</span><span class="mk-pill">' + fy.replace(/\s*▾\s*$/, '') + '</span><span class="mk-pill">' + pmo.replace(/\s*▾\s*$/, '') + '</span>';
  b.after(sum);
  const tag = document.createElement('div'); tag.className = 'mk-tag'; tag.id = 'mkTag'; document.body.appendChild(tag);
});
const tag = t => page.evaluate(t => { document.getElementById('mkTag').textContent = t; }, t);

// 1a: the bars expanded, with the new collapse control beside the logo
await tag('MOCKUP 1a · bars expanded — new ▴ collapse control beside the logo');
await shot('1a-bars-expanded', { clip: { x: 0, y: 0, width: 1440, height: 420 } });
// 1b: collapsed to one line: logo · context pills · status · Save · Help · File
await page.evaluate(() => { document.documentElement.classList.add('mk-navc'); const b = document.querySelector('.mk-nav'); b.textContent = '▾'; b.title = 'Show the bars'; try { gridSticky(); } catch (e) {} });
await tag('MOCKUP 1b · bars collapsed to one line — context kept as pills, Save always visible');
await shot('1b-bars-collapsed');
await page.evaluate(() => { document.documentElement.classList.remove('mk-navc'); const b = document.querySelector('.mk-nav'); b.textContent = '▴'; try { gridSticky(); } catch (e) {} });

// 2: full-width grid, the RECORD panel as a drawer from the right over it, the selected row marked
await page.evaluate(() => {
  document.documentElement.classList.add('mk-drawer');
  const ids = gridIds(); curRow = ids[2]; gridMark(); inspectorBody();
  document.getElementById('inspector').classList.add('open'); const s = document.getElementById('drawerScrim'); if (s) s.classList.add('on');
  const r = document.getElementById('row-' + curRow); if (r) r.scrollIntoView({ block: 'center' });
});
await tag('MOCKUP 2 · grid uses the full width; the RECORD drawer slides over it (Esc / ✕ / click outside closes)');
await shot('2-grid-drawer');
await page.evaluate(() => { document.getElementById('inspector').classList.remove('open'); const s = document.getElementById('drawerScrim'); if (s) s.classList.remove('on'); window.scrollTo(0, 0); });
await tag('MOCKUP 2b · drawer closed — the grid at full width, selected row marked');
await shot('2b-grid-full-width');
await page.evaluate(() => document.documentElement.classList.remove('mk-drawer'));

// 3: the one Import popup with three choices (each choice runs the import that menu item runs today)
await page.evaluate(() => {
  const bg = document.createElement('div'); bg.className = 'modal-bg open mk-imp';
  bg.innerHTML = '<div class="modal"><h3>⬅ Import</h3>'
    + '<p class="lead">What does the file you are bringing in hold? Nothing is read until you pick the file, and every import checks and previews before it changes anything.</p>'
    + '<div class="mk-ch">'
    + '<button class="mk-focus"><span class="ico">🗂</span><b>Full board</b><span class="d">Everything in a previous board file — all four appropriations, every locked cycle and the lists. Use it when a new version of ORBIT comes out.</span><span class="w">Replaces this board · one file</span></button>'
    + '<button><span class="ico">📄</span><b>One appropriation</b><span class="d">Takes only the appropriations you name from any board file. Each is checked and previewed first; nothing else changes.</span><span class="w">Adds or replaces what you name · one file</span></button>'
    + '<button><span class="ico">🗃</span><b>Several boards</b><span class="d">Merges several board files in one go. Every file is read and checked first, and it takes all of them or none.</span><span class="w">Consolidated board · pick every file together</span></button>'
    + '</div><div class="foot"><span>📁 File ▾ › Boards and appropriations › ⬅ Import…  (one item instead of three)</span><span>Esc or click outside to cancel</span></div></div>';
  document.body.appendChild(bg);
});
await tag('MOCKUP 3 · one Import popup, three choices — each runs the same import as today’s menu item');
await shot('3-import-popup');
await browser.close();
console.log('ok');
