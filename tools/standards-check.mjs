// SECTION 508 / WCAG 2.2 CONFORMANCE, MEASURED ON THE BOARD PEOPLE ACTUALLY OPEN.
//
// This is the one place the programme has an OUTSIDE standard to be held to. Everything else here
// checks the board against its own rules; this checks it against 36 CFR 1194 (Section 508), which
// adopts WCAG 2.0 AA by reference, plus the 2.1/2.2 success criteria a dense internal tool most
// often fails. A finding names its criterion, so it can be cited rather than argued about.
//
// WHY IT MEASURES THE RENDERED PAGE AND NOT THE TOKENS. colour-check.mjs already holds three token
// pairs -- ink, mut and dim against panel -- above AA, and that is necessary and nowhere near
// sufficient: it cannot see a chip whose colour is set inline, a disabled control, a value painted
// on a lifted surface rather than the panel, or any of the hundreds of pairs that only exist once
// the board has requirements on it. So this walks what the browser actually painted.
//
// AND WHY IT MEASURES A POPULATED BOARD. An empty board has no rows, no panels and no chart. The IA
// census once reported 98 clickables against 810 for exactly this reason. A conformance run against
// an empty board is a conformance run against something nobody opens.
//
// THE BASELINE POSTURE, which matters more than any single check. This board was not built to AA
// and asserting it outright would produce a wall of findings nobody acts on -- the failure mode
// this repo already avoids with the colour baseline and the money-coverage gaps. So: every finding
// is recorded in tools/a11y-baseline.json with a date, the run FAILS on anything NEW, and it also
// fails when a recorded finding is FIXED but not struck off, because a list of known holes that has
// stopped being true is worse than no list. Debt is visible and gated; it is never a pass.
//
//   node tools/standards-check.mjs              check against the baseline
//   node tools/standards-check.mjs --emit       print the current findings as a baseline, to paste
//   node tools/standards-check.mjs --full       print every finding, not just the summary
//   node tools/standards-check.mjs --board F    measure another build of the board (a proof against an old one)
import { chromium } from 'playwright-core';
import { readFileSync, existsSync } from 'node:fs';
import { buildPopulated } from './ia-fixture.mjs';
import { CHROME } from './chrome.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const BASELINE = new URL('./a11y-baseline.json', import.meta.url).pathname;
const emit = process.argv.includes('--emit');
const full = process.argv.includes('--full');
const boardArg = (i => i >= 0 ? process.argv[i + 1] : null)(process.argv.indexOf('--board'));

// Every theme, because contrast is the one thing that changes with the palette and a reader who
// picked Parchment is owed the same floor as one who left it on Harbor.
const THEMES = ['harbor', '', 'navy', 'parchment', 'blueprint'];
const BUILDS = [boardArg || (ROOT + 'prioritization-board-grid.html')];

// ---- the criteria, named so a finding can be cited -----------------------------------------------
const SC = {
  contrast:  '1.4.3 Contrast (Minimum) — AA',
  uiContrast:'1.4.11 Non-text Contrast — AA',
  target:    '2.5.8 Target Size (Minimum) — AA',
  name:      '4.1.2 Name, Role, Value — A',
  keys:      '2.1.1 Keyboard — A',
  focus:     '2.4.7 Focus Visible — AA',
  reflow:    '1.4.10 Reflow — AA',
  rel:       '1.3.1 Info and Relationships — A',
  lang:      '3.1.1 Language of Page — A',
  title:     '2.4.2 Page Titled — A',
  coverage:  'the run measured what it must (v1.96)',
};

// ---- what runs inside the page -------------------------------------------------------------------
// Returned findings are GROUPED. A board with 115 rows has thousands of control instances; one
// finding per instance is a baseline nobody can read and a diff nobody can review. The key is what
// makes two findings the same PROBLEM -- a colour pair, a handler, a control shape -- and the count
// rides along so the scale is still visible.
const PROBE = () => {
  const out = [];
  const px = v => parseFloat(v) || 0;

  // -- colour -------------------------------------------------------------------------------------
  const parse = c => {
    const m = /rgba?\(([^)]+)\)/.exec(c || '');
    if (!m) return null;
    const p = m[1].split(',').map(x => parseFloat(x));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const over = (fg, bg) => ({            // composite a translucent colour onto what is behind it
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
  const lum = c => {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const hex = c => '#' + [c.r, c.g, c.b].map(v =>
    Math.round(v).toString(16).padStart(2, '0')).join('');

  // The effective background: walk up compositing every translucent layer until something opaque.
  // Stopping at the first non-transparent ancestor is wrong on this board -- panels are lifted with
  // rgba() over a darker ground, so the real backdrop is two or three layers up.
  const bgOf = el => {
    let acc = null;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return { c: null, img: true };
      const c = parse(cs.backgroundColor);
      if (!c || c.a === 0) continue;
      acc = acc ? over(acc, c) : c;
      if (acc.a >= 0.999) return { c: acc, img: false };
    }
    const body = parse(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
    return { c: acc ? over(acc, body) : body, img: false };
  };

  const vis = el => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || px(cs.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  // Only elements holding their OWN text. Otherwise a wrapper is measured with its child's colour.
  const ownText = el => [...el.childNodes]
    .filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();

  const add = (sc, key, detail, extra) => {
    const hit = out.find(o => o.sc === sc && o.key === key);
    if (hit) { hit.n++; return; }
    out.push({ sc, key, detail, n: 1, ...(extra || {}) });
  };

  // 1.4.3 — text against what is actually behind it
  for (const el of document.querySelectorAll('body *')) {
    const t = ownText(el);
    if (!t || !vis(el)) continue;
    const cs = getComputedStyle(el);
    const fg0 = parse(cs.color); if (!fg0) continue;
    const bg = bgOf(el); if (bg.img || !bg.c) continue;
    const fg = fg0.a < 1 ? over(fg0, bg.c) : fg0;
    const size = px(cs.fontSize), weight = parseInt(cs.fontWeight, 10) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const need = large ? 3 : 4.5;
    const r = ratio(fg, bg.c);
    if (r >= need - 0.005) continue;
    add('contrast', `${hex(fg)} on ${hex(bg.c)} @${Math.round(size)}px`,
      `${r.toFixed(2)}:1, needs ${need}:1 — e.g. "${t.slice(0, 40)}"`, { ratio: +r.toFixed(2), need });
  }

  // 2.5.8 / 4.1.2 / control-level findings. Keyed by HANDLER, so one entry covers every row that
  // carries the same control rather than 115 copies of it.
  const CTRL = 'button, input, select, textarea, a[href], [onclick], [onchange]';
  for (const el of document.querySelectorAll(CTRL)) {
    if (!vis(el)) continue;
    const tag = el.tagName.toLowerCase();
    const h = (el.getAttribute('onclick') || el.getAttribute('onchange') || '')
      .replace(/'[^']*'/g, "'…'").replace(/"[^"]*"/g, '"…"').replace(/\s+/g, ' ').trim();
    const id = `${tag} | ${h || '(' + (el.type || 'link') + ')'}`;
    const r = el.getBoundingClientRect();

    // 2.5.8 AA is 24x24. Inline controls inside a sentence are excepted by the standard; nothing on
    // this board is inline prose, so the raw measurement is the honest one to record.
    if (r.width < 24 || r.height < 24)
      add('target', id, `${Math.round(r.width)}x${Math.round(r.height)}px, needs 24x24`);

    // 4.1.2 — a control with no accessible name is unusable with a screen reader even though it
    // works perfectly with a mouse, which is exactly why it survives visual review.
    const name = (el.getAttribute('aria-label') || el.getAttribute('title')
      || el.textContent || '').trim()
      || (el.labels && el.labels.length ? [...el.labels].map(l => l.textContent).join(' ').trim() : '')
      || (el.getAttribute('placeholder') || '').trim()
      || (el.getAttribute('alt') || '').trim();
    if (!name) add('name', id, 'no accessible name — no text, aria-label, title, label or placeholder');
  }

  // 1.4.11 — a border is how a chip or a control says where it ENDS and what state it is in. It has
  // to be discernible against what is next to it: 3:1 against the surface inside it OR the one
  // outside. Contrasting with either side is enough to see an edge; failing both means the control
  // has no visible boundary. Scoped to things that carry state or take a click -- every bordered
  // div on the page would be noise, and 1.4.11 is about user interface components.
  const STATEFUL = 'button, input, select, textarea, a[href], [onclick], [onchange], .rchip, .chip';
  for (const el of document.querySelectorAll(STATEFUL)) {
    if (!vis(el)) continue;
    const cs = getComputedStyle(el);
    const w = Math.max(px(cs.borderTopWidth), px(cs.borderBottomWidth),
                       px(cs.borderLeftWidth), px(cs.borderRightWidth));
    if (w <= 0 || cs.borderTopStyle === 'none' || cs.borderTopStyle === 'hidden') continue;
    const bc0 = parse(cs.borderTopColor);
    if (!bc0 || bc0.a === 0) continue;
    const inside = bgOf(el);
    const outside = el.parentElement ? bgOf(el.parentElement) : inside;
    if (inside.img || outside.img || !inside.c || !outside.c) continue;
    const bc = bc0.a < 1 ? over(bc0, outside.c) : bc0;
    const best = Math.max(ratio(bc, inside.c), ratio(bc, outside.c));
    if (best >= 2.995) continue;
    // KEYED BY THE COLOUR PAIR ALONE, not by the control. A low-contrast border token is ONE
    // decision applied to hundreds of controls; keying by handler reported it as 240 separate
    // findings, which is a baseline nobody can review and a diff nobody can read. One line saying
    // "--line is 1.4:1 against --panelA" is the finding, and it names the fix.
    add('uiContrast', `${hex(bc)} border on ${hex(outside.c)}`,
      `${best.toFixed(2)}:1, needs 3:1 — e.g. ${el.tagName.toLowerCase()}`
      + `${el.className ? '.' + String(el.className).split(' ')[0] : ''}, no discernible edge`);
  }

  // 1.3.1 — a data table with no header cells states no relationship between a figure and what it
  // is a figure OF. The exports are read by other people in other tools; this is the on-screen half.
  for (const t of document.querySelectorAll('table')) {
    if (!vis(t)) continue;
    const rows = t.querySelectorAll('tr');
    if (rows.length < 3) continue;                       // a two-row layout table states nothing
    if (t.querySelector('th')) continue;
    const first = (rows[0].textContent || '').replace(/\s+/g, ' ').trim().slice(0, 48);
    add('rel', t.className || '(unclassed table)', `${rows.length} rows, no <th> — first row "${first}"`);
  }

  // 2.1.1 Keyboard (v1.91, item 29) — anything that does something when clicked must also be reachable
  // from the keyboard: a native control, or one given a tab stop. A clickable div or span, or a link
  // with no address, is mouse-only -- a keyboard user cannot open, change or bring back what it holds.
  // The status line, the save state and the RECORD panel's CCaR record, PID and rename were exactly
  // that, and this run reported 0 findings because nothing here looked. Keyed by the handler, so one
  // entry covers every row carrying the same control. Not a finding: a panel's backdrop, which closes
  // on a click OUTSIDE the panel -- every panel has its own close button and Esc.
  for (const el of document.querySelectorAll('[onclick]')) {
    if (!vis(el)) continue;
    const tag = el.tagName;
    const native = /^(BUTTON|INPUT|SELECT|TEXTAREA|SUMMARY|OPTION)$/.test(tag) || (tag === 'A' && el.hasAttribute('href'));
    if (native || el.tabIndex >= 0) continue;
    const h = el.getAttribute('onclick') || '';
    if (/event\.target\s*===?\s*this/.test(h)) continue;
    // v1.92: a menu's box stops a click inside it closing the menu; that is not a control
    if (/^\s*event\.stopPropagation\(\)\s*;?\s*$/.test(h)) continue;
    // the whole handler, arguments folded (the 2.5.8 key's rule): "scOpen=!scOpen;render()" and
    // "gsOpen=!gsOpen;render()" are two different controls, and naming only render() hid which
    const fn = h.replace(/'[^']*'/g, "'…'").replace(/"[^"]*"/g, '"…"').replace(/\s+/g, ' ').trim().slice(0, 60);
    add('keys', `${tag.toLowerCase()} | ${fn}`, 'clickable, but a keyboard cannot reach it: not a control, and no tab stop');
  }

  // 3.1.1 / 2.4.2 — page level, cheap and absolute.
  if (!document.documentElement.getAttribute('lang'))
    add('lang', '<html>', 'no lang attribute — a screen reader guesses the pronunciation rules');
  if (!(document.title || '').trim())
    add('title', '<title>', 'the page has no title');

  return out;
};

// ---- drive it -------------------------------------------------------------------------------------
const browser = await chromium.launch({ executablePath: CHROME });
const findings = new Map();          // stable key -> finding
const record = (build, theme, f) => {
  // A finding's identity is the criterion and what is wrong, NOT where it was seen. The same colour
  // pair on both builds is one problem; recording it twice would double the baseline and make a
  // build-only fix look like a half-fix.
  const key = `${f.sc} | ${f.key}`;
  const cur = findings.get(key);
  if (cur) { cur.n += f.n; cur.where.add(`${build.includes('grid') ? 'grid' : 'card'}:${theme || 'midnight'}`); return; }
  findings.set(key, { sc: f.sc, key: f.key, detail: f.detail, n: f.n,
    where: new Set([`${build.includes('grid') ? 'grid' : 'card'}:${theme || 'midnight'}`]) });
};

for (const build of BUILDS) {
  const file = buildPopulated(build);
  for (const theme of THEMES) {
    const page = await browser.newPage({ viewport: { width: 1700, height: 1000 } });
    await page.goto('file://' + file);
    await page.evaluate(t => { try { localStorage.setItem('spmtTheme', t); } catch (e) {} }, theme);
    await page.reload();
    await page.waitForTimeout(700);
    await page.evaluate(() => { try { if (typeof render === 'function') render(); } catch (e) {} });
    // v1.91: measure the status line the way people see a warning -- shown, on one line, cut off, with
    // its buttons -- not as the quiet start-up line, which is hidden and would be measured as nothing.
    await page.evaluate(() => { try { if (typeof setStat === 'function') setStat('\u26a0 A long warning written for the '
      + 'conformance check, so the status line is measured the way people see it: shown, on one line, cut off at the '
      + 'end, with its own buttons beside it.'); } catch (e) {} });
    // v1.91: and with Funding detail OPEN. v1.90 folded the scorecards, the fit strip and the funding panels
    // behind it, so from then on this run measured none of them -- colour, targets or keyboard. Open, they
    // are measured as they were before the fold.
    await page.evaluate(() => { try { if (typeof fundDetailToggle === 'function' && !fundDetailOpen) fundDetailToggle(); } catch (e) {} });
    // v1.91 (item 35): a BAE list loaded and one choice made on the selected requirement, so the RECORD
    // panel's budget section is measured with its pickers and buttons -- without a list it is one line.
    await page.evaluate(() => { try { if (typeof budRecordHtml !== 'function') return;
      BUDDB = { ts: 1700000000031, files: [], rows: ['USAF O&M- CAM Discretionary PSM', 'USAF O&M - CAM OBBBA Mandatory PSM',
        'USAF O&M- CAM CONG PSM', 'USAF O&M - ANG CAM Discretionary PSM', 'USMC STOVL O&M -1A9A FL Discretionary PSM',
        'USN O&M CV Discretionary PSM'].map(budParseName).filter(Boolean) };
      _budRegCache = null;
      const id = curRow || gridIds()[0]; if (!S.budgetAsg) S.budgetAsg = {};
      S.budgetAsg[id] = { 'USAF|disc': 'USAF O&M- CAM CONG PSM' }; render(); } catch (e) {} });
    // v1.92 (item 36): EVERY FUNDING DETAIL PANEL OPEN, not only the ones the board opens by default -- a
    // header that was a clickable div, and the panel under it, were measured by nothing while closed.
    await page.evaluate(() => { try { ['scOpen', 'gsOpen', 'taOpen', 'pmoSumOpen', 'siOpen', 'ceOpen', 'teamOpen', 'buysOpen']
      .forEach(function(n){ try { (0, eval)(n + '=true'); } catch (e) {} }); render(); } catch (e) {} });
    await page.waitForTimeout(300);
    for (const f of await page.evaluate(PROBE)) record(build, theme, f);
    // v1.92 (item 36): AND WITH EACH MENU OPEN. v1.91 measured with every menu closed, so it never saw that no
    // menu item could be reached from the keyboard. Each toolbar menu in turn (the Fund tools' in Fund), then
    // a row's ⋯ menu.
    // v2.00 (menu, 19 Oct): File, Reports & exports, Data and Setup left the toolbar for the LEFT MENU, so each place their items
    // went is measured open instead, the same way: its three boxes (left:rep, left:imp, left:data), each flyout (Setup with
    // each folded group open, as the menu's were), the menu folded to icons, and Save showing unsaved work. Work kept aside
    // is set, so History & recovery and the save state show their controls.
    for (const m of ['view', 'fy', 'pmo', 'basis', 'modetools', '(row)', 'left:rep', 'left:imp', 'left:data', 'left:fydp', 'left:exec',
                     'left:pmo', 'left:aud', 'left:hist', 'left:setup', 'left:save', 'left:rail', 'left:dirty']) {
      await page.evaluate(m => { try {
        if (m === 'basis' || m === 'modetools') { uiMode = 'fund'; uiApply(); render(); }
        if (m === '(row)') { openMenu = null; syncBtns(); rowMenuId = gridIds()[0]; render(); }
        else if (m.indexOf('left:') === 0) { const k = m.slice(5); rowMenuId = null; openMenu = null;
          _keptMeta = { t: 1700000000000, why: 'folder' }; render();
          if (k === 'rep') uiRepOpen(); else if (k === 'imp') uiImpOpen(); else if (k === 'data') uiDataOpen();
          else if (k === 'rail') { UI2.rail = true; uiRailApply(); uiSync(); }
          else if (k === 'dirty') { DIRTY = true; syncBtns(); }
          else uiFlyOpen(k, document.getElementById('uiNav_' + k)); }
        else { rowMenuId = null; openMenu = m; syncBtns(); } } catch (e) {} }, m);
      await page.waitForTimeout(150);
      for (const f of await page.evaluate(PROBE)) record(build, theme, f);
      // v1.96 (item 65): A LONG MENU FOLDS, so each of its groups is measured open, one at a time, as a person sees it
      const host = m === 'left:setup' ? '#uiFly' : '#dd_' + m, gk = m === 'left:setup' ? 'setup' : m;
      const gs = m === '(row)' || (m.indexOf('left:') === 0 && m !== 'left:setup') ? [] : await page.evaluate(h => [...document.querySelectorAll(h + ' .gh')].map(x => x.getAttribute('data-g')), host);
      for (const g of gs) {
        await page.evaluate(([m, g]) => { try { menuGrpOpen[m] = g; syncBtns(); } catch (e) {} }, [gk, g]);
        await page.waitForTimeout(80);
        for (const f of await page.evaluate(PROBE)) record(build, theme, f);
      }
      if (gs.length) await page.evaluate(m => { try { menuGrpOpen[m] = ''; syncBtns(); } catch (e) {} }, gk);
      if (m.indexOf('left:') === 0) await page.evaluate(() => { try { uiFlyClose(); uiRepClose(); uiImpClose(); uiDataClose();
        UI2.rail = false; uiRailApply(); uiSync(); DIRTY = false; _keptMeta = null; syncBtns(); } catch (e) {} });
    }
    await page.evaluate(() => { try { openMenu = null; rowMenuId = null; uiMode = 'review'; uiApply(); syncBtns(); render(); } catch (e) {} });
    // v1.96 (item 64): THE REPAIRED-AWARD CONTROLS. The board this runs on carries two awards the board repaired when it
    // opened; the 🔧 list under Needs attention is measured open, then the award block of one, with ✓ Checked. Both must
    // be on screen, or the run fails: a control measured by nothing would pass by being absent.
    const fixShown = await page.evaluate(() => { try {
      attShow('awfix'); const a = !!document.querySelector('#attPanel.open button.attgo');
      return a; } catch (e) { return false; } });
    for (const f of await page.evaluate(PROBE)) record(build, theme, f);
    const checkShown = await page.evaluate(() => { try {
      attClose(); const id = attLists().awfix.map(x => x.id)[0]; setCur(id); render();
      const b = document.querySelector('#inspector button[onclick^="awdFixOk"]'); return !!b && b.getClientRects().length > 0; } catch (e) { return false; } });
    for (const f of await page.evaluate(PROBE)) record(build, theme, f);
    if (!fixShown || !checkShown) record(build, theme, { sc: 'coverage', key: 'the repaired-award controls were not on screen to measure',
      detail: `the 🔧 list ${fixShown ? 'was' : 'was NOT'} open; ✓ Checked ${checkShown ? 'was' : 'was NOT'} drawn`, n: 1 });
    // v1.98 (item 83): THE CLIN GRID'S RCN / EEIC BY SERVICE. A prime with two CLINs on the Air Force services: CLIN 0001
    // with ANG on its own combination and its by-service line open, CLIN 0002 with services on no combination (the amber
    // flag). The button in both states and the line's pickers must be on screen, or the run fails.
    const rcnShown = await page.evaluate(() => { try {
      if (typeof clinRcnCell !== 'function') return { b: false, s: false };
      const id = gridIds()[0], A = SVC.map(sv => ['USAF', 'ANG', 'AFRC'].includes(sv) ? 1000 : 0);
      if (!S.ptype) S.ptype = {}; S.ptype[id] = 'PRIME';
      if (!S.clinNew) S.clinNew = {}; S.clinNew[id] = [{ key: 'n1', clin: '0001', desc: 'Air vehicle', ccar: '', ask: A.slice() },
        { key: 'n2', clin: '0002', desc: 'Engines', ccar: '', ask: A.slice() }];
      if (!S.clinAlloc) S.clinAlloc = {}; S.clinAlloc[id] = { n1: A.slice(), n2: A.slice() };
      MS.rcn = [{ k: 'Q1', rcn: '12345', eeic: '59ABC', t: 'Standard', svc: ['USAF', 'ANG', 'AFRC'] }, { k: 'Q2', rcn: '12345', eeic: '59ANG', t: 'ANG', svc: ['ANG'] }];
      if (!S.clinRcn) S.clinRcn = {}; S.clinRcn[id] = { n1: 'Q1' };
      S.clinRcnSvc = {}; S.clinRcnSvc[id] = { n1: { ANG: 'Q2' }, n2: { ANG: 'Q2' } };
      if (S.rcnAsg) delete S.rcnAsg[id];
      clinOpen[id] = true; rcnClinOpen[id + '|n1'] = true; setCur(id); render();
      const row = document.getElementById('row-' + id);
      return { b: !!(row && row.querySelector('button.rcnby.on') && row.querySelector('button.rcnby.gap')), s: !!(row && row.querySelector('tr.rcnsub select')) };
    } catch (e) { return { b: false, s: false }; } });
    for (const f of await page.evaluate(PROBE)) record(build, theme, f);
    if (!rcnShown.b || !rcnShown.s) record(build, theme, { sc: 'coverage', key: 'the CLIN grid’s RCN / EEIC by service was not on screen to measure',
      detail: `the by-service button ${rcnShown.b ? 'was' : 'was NOT'} drawn in both states; its line ${rcnShown.s ? 'was' : 'was NOT'} open`, n: 1 });

    // 1.4.10 Reflow — the standard's own number is 320 CSS px. Measured once per build, on the
    // default theme only: a palette cannot change a layout width.
    if (theme === THEMES[0]) {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.waitForTimeout(500);
      const over = await page.evaluate(() => Math.max(0,
        document.documentElement.scrollWidth - document.documentElement.clientWidth));
      if (over > 1) record(build, theme, { sc: 'reflow', key: `${build.includes('grid') ? 'grid' : 'card'} @320px`,
        detail: `${over}px of horizontal scroll at 320px wide`, n: 1 });

      // 2.4.7 Focus Visible — a keyboard user has to be able to see where they are. Sampled across
      // the distinct control shapes rather than every instance; focus styling is per-selector.
      await page.setViewportSize({ width: 1700, height: 1000 });
      await page.waitForTimeout(300);
      const noFocus = await page.evaluate(() => {
        const seen = new Set(), bad = [];
        const sig = el => { const cs = getComputedStyle(el);
          return [cs.outlineStyle, cs.outlineWidth, cs.outlineColor, cs.boxShadow,
                  cs.borderColor, cs.backgroundColor].join('|'); };
        for (const el of document.querySelectorAll('button, input, select, textarea, a[href]')) {
          const k = el.tagName + '|' + (el.className || '') + '|' + (el.type || '');
          if (seen.has(k)) continue; seen.add(k);
          const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
          const before = sig(el);
          el.focus();
          if (document.activeElement !== el) continue;
          const after = sig(el);
          if (before === after) bad.push(k);
          el.blur();
        }
        return bad;
      });
      for (const k of noFocus)
        record(build, theme, { sc: 'focus', key: k,
          detail: 'focusing it changes no outline, shadow, border or background', n: 1 });
    }
    await page.close();
  }
}
await browser.close();

// ---- compare against the recorded baseline ---------------------------------------------------------
const list = [...findings.values()]
  .map(f => ({ ...f, where: [...f.where].sort() }))
  .sort((a, b) => a.sc.localeCompare(b.sc) || b.n - a.n || a.key.localeCompare(b.key));

if (emit) {
  console.log(JSON.stringify({
    notes: 'Recorded Section 508 / WCAG findings. The run fails on anything NEW, and also when a '
         + 'recorded finding stops occurring without being struck off — a list of known holes that '
         + 'has stopped being true is worse than no list. Regenerate with --emit after a fix, and '
         + 'say in the commit which criterion was closed.',
    recorded: new Date().toISOString().slice(0, 10),
    findings: list.map(f => ({ sc: f.sc, key: f.key, n: f.n, detail: f.detail })),
  }, null, 2));
  process.exit(0);
}

const base = existsSync(BASELINE)
  ? JSON.parse(readFileSync(BASELINE, 'utf8')) : { findings: [] };
const baseKeys = new Set(base.findings.map(f => `${f.sc} | ${f.key}`));
const nowKeys = new Set(list.map(f => `${f.sc} | ${f.key}`));
const added = list.filter(f => !baseKeys.has(`${f.sc} | ${f.key}`));
const fixed = base.findings.filter(f => !nowKeys.has(`${f.sc} | ${f.key}`));

const W = 104;
console.log('\nSECTION 508 / WCAG 2.2 CONFORMANCE — measured on a populated board, every theme, both builds');
console.log('='.repeat(W));
console.log(`baseline recorded ${base.recorded || '(none)'} · ${base.findings.length} known finding(s)`);
console.log('a finding names its criterion so it can be cited, not argued about\n');

const byCrit = {};
list.forEach(f => (byCrit[f.sc] ||= []).push(f));
for (const k of Object.keys(SC)) {
  const fs = byCrit[k] || [];
  const inst = fs.reduce((a, f) => a + f.n, 0);
  console.log(`  ${fs.length ? 'debt' : 'ok  '}  ${SC[k].padEnd(42)} `
    + (fs.length ? `${fs.length} distinct, ${inst} instance(s)` : 'no findings'));
  if (full || added.some(a => a.sc === k)) {
    for (const f of fs) console.log(`          ${added.includes(f) ? 'NEW  ' : '     '}${f.key}`
      + `\n               ${f.detail}   [${f.n}x · ${f.where.join(' ')}]`);
  }
}

console.log('\n' + '='.repeat(W));
if (added.length) {
  console.log(`${added.length} NEW FINDING(S) — not in the baseline:\n`);
  added.forEach(f => console.log(`  ${SC[f.sc]}\n      ${f.key}\n      ${f.detail}`
    + `\n      seen ${f.n}x on ${f.where.join(', ')}\n`));
}
if (fixed.length) {
  console.log(`${fixed.length} RECORDED FINDING(S) NO LONGER OCCUR — strike them off:\n`);
  fixed.forEach(f => console.log(`  ${SC[f.sc] || f.sc}\n      ${f.key}`));
  console.log('\n  Regenerate the baseline with --emit and say in the commit which criterion closed.');
}
if (added.length || fixed.length) process.exit(1);

const inst = list.reduce((a, f) => a + f.n, 0);
console.log(`CONFORMANCE HOLDS AGAINST THE BASELINE — ${list.length} known finding(s), ${inst} instance(s),`
  + ' nothing new');
console.log('These are DEBT, not a pass. They are printed every run until they are closed.');
process.exit(0);
