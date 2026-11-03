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
import { ACE_REP_SEED, ACE_COL_ASK } from './ace-seed.mjs';   // v2.12 (item 132)
import { CYC_TAG_SEED, CYC_KEY, cycOtherStore } from './cyc-seed.mjs';   // v2.13 (item 136)

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
  // v2.13 (item 136): THE PPBE CYCLE AT THE TOP, on screen to be measured. The board is tagged BES28 with BES28 controls logged
  // that leave the year on screen both unallocated and over (tools/cyc-seed.mjs), and OPN's plan in this browser is on PB27, so
  // the PPBE cycle reads ⚠ Mixed and the figure beside it is drawn -- measured with everything else, and its list measured open
  // with the menus below. Bare, the board is untagged: the figure is hidden and the list holds one appropriation's line.
  const file = buildPopulated(build, CYC_TAG_SEED);
  for (const theme of THEMES) {
    const page = await browser.newPage({ viewport: { width: 1700, height: 1000 } });
    await page.goto('file://' + file);
    await page.evaluate(([t, k, st]) => { try { localStorage.setItem('spmtTheme', t); localStorage.setItem(k, st); } catch (e) {} },
      [theme, CYC_KEY.opn, cycOtherStore('PB|2027')]);
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
    // v2.13 (item 136): the PPBE cycle and the figure beside it must have been on screen for that, or the run fails: a control
    // measured by nothing would pass by being absent
    const cycShown = await page.evaluate(() => { try { const f = document.getElementById('cycFit'), bc = document.getElementById('b_cyc');
      return { fit: !!f && !f.hidden && f.getClientRects().length > 0 && /unallocated/.test(f.textContent) && /over/.test(f.textContent),
        mixed: !!bc && bc.getClientRects().length > 0 && /Mixed/.test(bc.textContent) }; } catch (e) { return { fit: false, mixed: false }; } });
    if (!cycShown.fit || !cycShown.mixed) record(build, theme, { sc: 'coverage', key: 'the PPBE cycle and the figure beside it were not on screen to measure',
      detail: `the PPBE cycle ${cycShown.mixed ? 'read' : 'did NOT read'} Mixed; the figure ${cycShown.fit ? 'was' : 'was NOT'} drawn with an unallocated and an over figure`, n: 1 });
    // v1.92 (item 36): AND WITH EACH MENU OPEN. v1.91 measured with every menu closed, so it never saw that no
    // menu item could be reached from the keyboard. Each toolbar menu in turn (the Fund tools' in Fund), then
    // a row's ⋯ menu.
    // v2.00 (menu, 19 Oct): File, Reports & exports, Data and Setup left the toolbar for the LEFT MENU, so each place their items
    // went is measured open instead, the same way: its three boxes (left:rep, left:imp, left:data), each flyout (Setup with
    // each folded group open, as the menu's were), the menu folded to icons, and Save showing unsaved work. Work kept aside
    // is set, so History & recovery and the save state show their controls.
    // v2.13 (item 136): and the PPBE cycle's (cyc), its list naming every appropriation's cycle
    for (const m of ['view', 'fy', 'cyc', 'pmo', 'basis', 'modetools', '(row)', 'left:rep', 'left:imp', 'left:data', 'left:fydp', 'left:exec',
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
      if (m === 'cyc') { const cl = await page.evaluate(() => { const d = document.getElementById('dd_cyc');
          return !!d && d.getClientRects().length > 0 && d.querySelectorAll('.cycall-row').length >= 2 && d.querySelectorAll('button.mi').length >= 3; });
        if (!cl) record(build, theme, { sc: 'coverage', key: 'the PPBE cycle’s list was not on screen to measure',
          detail: 'the list with every appropriation’s line and the cycles to put them on was NOT open', n: 1 }); }
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

    // v2.07 (item 121): THE ADD BOX, measured with all of it on screen. Opened for PSM (the BAE list loaded above offers PSM's
    // names): four services' values typed, so their budget pickers show, one chosen; a destination that is not a prime, so
    // the two OGC fields show; a CCaR number typed; then Add pressed early, so the missing fields are marked and the box says
    // what is missing. Then From another year, on another year holding two of PSM's requirements, one ready and one not,
    // with the incomplete one ticked; then that one brought in, so the box shows it filled in to finish, with Skip. Each state
    // must be on screen, or the run fails: a box measured short of its form passes by being absent.
    const addShown = await page.evaluate(() => { try {
      if (typeof arShow !== 'function') return { n: false, y: false, f: false };
      openMenu = null; rowMenuId = null; clinOpen = {}; syncBtns(); render();
      setPmoFilter('PSM'); if (arOn()) arHide(); toggleAdd();
      const v = (id, x) => { const e = document.getElementById(id); if (e) e.value = x; };
      v('arEvent', 'Depot field team travel'); v('arV0', '1,250,000'); v('arV1', '300,000'); v('arV3', '200,000'); v('arV5', '150,000'); arUpdate();
      const g = flowEntsAZ().filter(e => e.kind !== 'prime')[0]; arPt('OGC'); v('arTo', g ? g.k : ''); arUpdate();
      const o = [].filter.call(document.getElementById('arB0').options, x => x.value)[0]; if (o) v('arB0', o.value);
      v('arCcar', 'JSF5000'); arCcarTyped(); arAdd(false);
      const sh = id => { const e = document.getElementById(id); return !!e && e.getClientRects().length > 0; };
      return { n: sh('arEvent') && sh('arB0') && sh('arB1') && sh('arEnd') && sh('arMipr') && !!document.querySelector('#arNew .miss')
        && /still needed/.test(document.getElementById('arMsg').textContent) };
    } catch (e) { return { n: false, err: String(e.message) }; } });
    for (const f of await page.evaluate(PROBE)) record(build, theme, f);
    const yrShown = await page.evaluate(() => { try {
      const Y = MS.cur - 1, base = { order: [], alloc: {}, mc: {}, removed: [], titles: {}, ccar: {}, pid: {}, ptype: {}, obCat: {}, wbs: {}, dest: {},
        desc: {}, cons: {}, budgetAsg: {}, discSvc: SVC.map(() => 0), mandSvc: SVC.map(() => 0), custom: [] };
      const mk = (id, ev, tot) => ({ id, grp: 'PSM', team: 'PSM', sect: 'new', custom: true, title: '', event: ev, ccar: '',
        fy26: SVC.map(() => 0), ask: SVC.map((s, i) => i === 0 ? tot : 0), alloc: null });
      base.custom = [mk('NEW-1', 'Engine module repair capacity, FY26 surge', 900000), mk('NEW-2', 'Low observable restoration kits', 400000)];
      base.order = S.order.filter(id => grpOf(itemById(id)) === 'PSM').slice(0, 2).concat(['NEW-1', 'NEW-2']);
      const prime = (flowEntsAZ().filter(e => e.kind === 'prime')[0] || {}).k || '';
      Object.assign(base.ptype, { 'NEW-1': 'PRIME' }); Object.assign(base.obCat, { 'NEW-1': OB_CATS[0] });
      base.dest['NEW-1'] = { to: prime, end: '' }; base.desc['NEW-1'] = 'Repair line capacity'; base.cons['NEW-1'] = 'The line stops in March.';
      base.budgetAsg['NEW-1'] = { USAF: 'USAF O&M- CAM Discretionary PSM' }; base.ccar['NEW-2'] = 'JSF5011'; base.pid['NEW-2'] = 'PID9011';
      MS.years[Y] = base;
      arTab('yr'); naFromPick(String(Y)); naFromTick('NEW-2', true);
      const b = document.getElementById('naFromBtn');
      return document.querySelectorAll('#naFromWrap tr[data-id]').length >= 4 && !!document.querySelector('#naFromWrap .ar-pill.ok')
        && !!document.querySelector('#naFromWrap .ar-pill.no') && !!b && !b.disabled;
    } catch (e) { return false; } });
    for (const f of await page.evaluate(PROBE)) record(build, theme, f);
    const finShown = await page.evaluate(() => { try {
      // the form still holds what was typed, so bringing one in to finish asks first (v2.07 review): answered OK
      const c0 = window.confirm; window.confirm = () => true;
      try { naFromAdd(); } finally { window.confirm = c0; }
      const fb = document.getElementById('arFinBar');
      return !!fb && !fb.hidden && !!fb.querySelector('button') && arTabOn === 'new';
    } catch (e) { return false; } });
    for (const f of await page.evaluate(PROBE)) record(build, theme, f);
    await page.evaluate(() => { try { arHide(); delete MS.years[MS.cur - 1]; setPmoFilter('ALL'); } catch (e) {} });
    if (!addShown.n || !yrShown || !finShown) record(build, theme, { sc: 'coverage', key: 'the Add box was not on screen whole to measure',
      detail: `the form with budget pickers, the OGC fields and the missing marked ${addShown.n ? 'was' : 'was NOT'} shown; `
        + `From another year with its rows ${yrShown ? 'was' : 'was NOT'}; one being finished ${finShown ? 'was' : 'was NOT'}`
        + (addShown.err ? ' (' + addShown.err + ')' : ''), n: 1 });

    // v2.08 (item 122): THE EDIT BOX, measured with all of it on screen, as the Add box is: a requirement made an OGC sent to
    // a government activity, so Which awards to and the MIPR type show, its per-service RCN / EEIC rows open where it has
    // them, and the required list drawn. It must be on screen, or the run fails: a box measured short of its form passes by
    // being absent. Behind it the board is inert, so nothing else on the page reached it.
    const edShown = await page.evaluate(() => { try {
      if (typeof openEdit !== 'function') return { n: false };
      openMenu = null; rowMenuId = null; clinOpen = {}; syncBtns(); render();
      const id = S.order.filter(x => ptypeOf(x) !== 'PRIME')[0];
      if (typeof rcnSvcOpen !== 'undefined') rcnSvcOpen[id] = true;
      setCur(id); openEdit(id, 'rec');
      const v = (eid, x) => { const e = document.getElementById(eid); if (!e) return; e.value = x;
        e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); };
      erPt('OGC'); const g = flowEntsAZ().filter(e => e.kind !== 'prime')[0]; v('erTo', g ? g.k : '');
      const sh = eid => { const e = document.getElementById(eid); return !!e && e.getClientRects().length > 0; };
      return { n: ['erEvent', 'erPid', 'erEnd', 'erMipr', 'erDesc', 'erCons', 'erNote', 'erChk', 'erToPanel', 'erSaveBtn'].every(sh) };
    } catch (e) { return { n: false, err: String(e.message) }; } });
    for (const f of await page.evaluate(PROBE)) record(build, theme, f);
    await page.evaluate(() => { try { if (erOn()) erClose(); } catch (e) {} });
    if (!edShown.n) record(build, theme, { sc: 'coverage', key: 'the edit box was not on screen whole to measure',
      detail: 'the box with the OGC fields, the written fields and the required list was NOT shown' + (edShown.err ? ' (' + edShown.err + ')' : ''), n: 1 });

    // v2.10 (item 130): FYDP DISCONNECTS, measured with its tables on screen, as the Add and edit boxes are: a cost estimate across
    // O&M, Full Fund and Spares and O&M's BES28 position put on the board, an International figure typed, the Summary, then the
    // USAF sheet. Its page is white in every theme, in the slides' own colours; it must be on screen, or the run fails.
    const fdcShown = await page.evaluate(() => { try {
      if (typeof toggleFdc !== 'function') return { n: false };
      openMenu = null; rowMenuId = null; clinOpen = {}; syncBtns(); render();
      const Y = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033], S6 = ['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC-C', 'USN'], L = [];
      ['om', 'ff', 'sp'].forEach((ap, a) => S6.forEach((sv, s) => { const v = {}; Y.forEach(y => { v[y] = (a + 1) * 9e8 + (s + 1) * 4e7 + (y - 2020) * 3e6; }); L.push({ ap, pmo: 'AV', svc: sv, v }); }));
      ACEDB.sets['2025ACE'] = { label: '2025ACE', ts: Date.now(), years: Y, lines: L, appn: {}, skip: {} };
      const val = {}, lines = {}; S6.forEach((sv, s) => { lines[sv] = [{ k: '_all', all: true }]; val[sv] = { _all: {} };
        [2027, 2028, 2029, 2030, 2031, 2032].forEach(y => { val[sv]._all[y] = { d: (s + 1) * 1.3e8 + (y - 2027) * 2e6, m: y === 2027 ? 5e6 : 0 }; }); });
      MS.ppbe = MS.ppbe || {}; MS.ppbe['BES|2028'] = { v: 2, split: true, lines, val };
      if (!fdcOpen) toggleFdc(); fdcTab(0);
      const e = document.getElementById('fdcIn_ir_om_2028'); e.value = '1,234.5'; e.dispatchEvent(new Event('change', { bubbles: true }));
      return { n: document.querySelectorAll('#fdcPage tbody tr').length > 40 && e.value === '$1,234.5' && !!document.querySelector('#fdcPage .neg') };
    } catch (e) { return { n: false, err: String(e.message) }; } });
    for (const f of await page.evaluate(PROBE)) record(build, theme, f);
    const fdcSvc = await page.evaluate(() => { try { fdcTab(1); return /USAF CTOL/.test(document.querySelector('#fdcPage .fdct2').textContent); } catch (e) { return false; } });
    for (const f of await page.evaluate(PROBE)) record(build, theme, f);
    await page.evaluate(() => { try { if (fdcOpen) toggleFdc(); delete ACEDB.sets['2025ACE']; delete MS.ppbe['BES|2028']; } catch (e) {} });
    if (!fdcShown.n || !fdcSvc) record(build, theme, { sc: 'coverage', key: 'FYDP Disconnects was not on screen whole to measure',
      detail: `the Summary with its figures, a shortfall and an International figure ${fdcShown.n ? 'was' : 'was NOT'} shown; the USAF sheet ${fdcSvc ? 'was' : 'was NOT'}`
        + (fdcShown.err ? ' (' + fdcShown.err + ')' : ''), n: 1 });

    // v2.14 W2 (item 141): THE FILE ROUTE'S BOX, measured with step 1 showing (this page holds unsaved work), its buttons and its
    // checkbox; then after a failure, with both rescues offered. It must be on screen, or the run fails.
    const ifShown = await page.evaluate(() => { try {
      if (typeof impFileOffer !== 'function') return { n: false };
      openMenu = null; rowMenuId = null; syncBtns(); render();
      const W = [[_AP.key, '{}', 'x', 'the O&M plan']]; W.full = { rep: 'r' };
      DIRTY = true;
      fullImportUndone({ ok: false, at: 0, why: 'QuotaExceededError', back: true, now: ['was'], held: [localStorage.getItem(_AP.key)] }, W, 'the text', 'ORBIT Live.html');
      return { n: !!document.querySelector('#impFilePanel.open #impFileSkip') && !!document.getElementById('impFileGo') };
    } catch (e) { return { n: false, err: String(e.message) }; } });
    for (const f of await page.evaluate(PROBE)) record(build, theme, f);
    const ifResc = await page.evaluate(() => { try {
      _impFile.rescue = { at: 'ORBIT Live (ORBIT v2.14).html', html: { text: 'x', name: 'n', got: false }, inc: { text: 'y', name: 'm', got: false } }; impFileDraw();
      return document.querySelectorAll('#impFileBody button').length >= 4; } catch (e) { return false; } });
    for (const f of await page.evaluate(PROBE)) record(build, theme, f);
    await page.evaluate(() => { try { impFileShut(); _impFileLast = null; DIRTY = false; syncBtns(); } catch (e) {} });
    if (!ifShown.n || !ifResc) record(build, theme, { sc: 'coverage', key: 'the file route’s box was not on screen whole to measure',
      detail: `the box with step 1 ${ifShown.n ? 'was' : 'was NOT'} shown; with both rescues ${ifResc ? 'was' : 'was NOT'}` + (ifShown.err ? ' (' + ifShown.err + ')' : ''), n: 1 });

    // v2.12 (item 132): THE COST ESTIMATE IMPORT'S REPORT AND MAPPING BOX, measured with what the 2026 file puts in them: every
    // reason with rows and dollars, the named rows and the conflicting names, the columns read open; then the mapping box asking for
    // two renamed titles from the file's own 44 headers. Each must be on screen, or the run fails.
    const aceShown = await page.evaluate(([seed, ask]) => { try {
      if (typeof aceRepShow !== 'function') return { r: false, c: false };
      openMenu = null; rowMenuId = null; clinOpen = {}; syncBtns(); render();
      (0, eval)(seed); aceRepShow('2026ACE');
      const d = document.querySelector('#aceRepBody details'); if (d) d.open = true;
      const r = document.querySelectorAll('#aceRepBody .acerep-why tr').length >= 12 && document.querySelectorAll('#aceRepBody .acerep-named').length >= 5;
      return { r };
    } catch (e) { return { r: false, err: String(e.message) }; } }, [ACE_REP_SEED, ACE_COL_ASK]);
    for (const f of await page.evaluate(PROBE)) record(build, theme, f);
    await page.evaluate(() => { try { aceRepClose(); } catch (e) {} });
    const aceCol = await page.evaluate(ask => { try { (0, eval)(ask); return document.querySelectorAll('#aceColBody select').length === 2; } catch (e) { return false; } }, ACE_COL_ASK);
    for (const f of await page.evaluate(PROBE)) record(build, theme, f);
    await page.evaluate(() => { try { aceColCancel(); delete ACEDB.sets['2026ACE']; render(); } catch (e) {} });
    if (!aceShown.r || !aceCol) record(build, theme, { sc: 'coverage', key: 'the cost estimate import’s report or mapping box was not on screen to measure',
      detail: `the report with its reasons and named rows ${aceShown.r ? 'was' : 'was NOT'} shown; the mapping box with its two pickers ${aceCol ? 'was' : 'was NOT'}`
        + (aceShown.err ? ' (' + aceShown.err + ')' : ''), n: 1 });
    // v2.12 (item 134): FIT TO THE PPBE POSITION, measured with an over on screen: the plan tagged with a position that gives the
    // first service $1 of discretionary in the year on screen, and the first requirement directing its whole value there on a
    // Split, so the year's tables, the over line and its requirement list with Go to are drawn. Then the plan is put back.
    const fitShown = await page.evaluate(() => { try {
      if (typeof fitShow !== 'function') return { n: false };
      openMenu = null; rowMenuId = null; clinOpen = {}; syncBtns(); render();
      const id = S.order[0], it = itemById(id);
      window.__fitKeep = { cyc: MS.cycle, id, fsrc: S.fsrc[id] ? JSON.stringify(S.fsrc[id]) : null };
      MS.ppbe = MS.ppbe || {}; MS.ppbe['POM|2099'] = { v: 2, split: true, lines: {}, val: { [SVC[0]]: { _all: { [MS.cur]: { d: 1, m: 0 } } } } };
      MS.cycle = 'POM|2099'; S.fsrc[id] = { m: 'split', dv: it.ask.slice(), mv: SVC.map(() => 0) };
      baLiveAll(); save(); render(); fitShow();
      return { n: !!document.querySelector('#fitBody .fitover') && document.querySelectorAll('#fitBody .fitgo').length > 0 && !!document.querySelector('#fitBody table.fittab') };
    } catch (e) { return { n: false, err: String(e.message) }; } });
    for (const f of await page.evaluate(PROBE)) record(build, theme, f);
    await page.evaluate(() => { try { fitOpen = false; const k = window.__fitKeep; MS.cycle = k.cyc;
      if (k.fsrc) S.fsrc[k.id] = JSON.parse(k.fsrc); else delete S.fsrc[k.id];
      delete MS.ppbe['POM|2099']; baLiveAll(); save(); render(); } catch (e) {} });
    if (!fitShown.n) record(build, theme, { sc: 'coverage', key: 'Fit to the PPBE position was not on screen whole to measure',
      detail: 'the year’s table, an over line and its requirement list with Go to was NOT shown' + (fitShown.err ? ' (' + fitShown.err + ')' : ''), n: 1 });

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
      // v2.07 (item 121): and the Add box's own controls, sampled with the box open -- behind it the board is inert, so the
      // sample above never reached them, and with the box open nothing else can be focused
      const boxFocus = await page.evaluate(() => { try {
        setPmoFilter('PSM'); if (arOn()) arHide(); toggleAdd();
        const e0 = document.getElementById('arV0'); if (e0) e0.value = '1,000'; arPt('OGC');
        const g = flowEntsAZ().filter(e => e.kind !== 'prime')[0]; const to = document.getElementById('arTo'); if (to && g) to.value = g.k; arUpdate();
        const seen = new Set(), bad = [];
        const sig = el => { const cs = getComputedStyle(el);
          return [cs.outlineStyle, cs.outlineWidth, cs.outlineColor, cs.boxShadow, cs.borderColor, cs.backgroundColor].join('|'); };
        let n = 0;
        for (const el of document.querySelectorAll('#addPanel .modal button, #addPanel .modal input, #addPanel .modal select, #addPanel .modal textarea')) {
          const k = el.tagName + '|' + (el.className || '') + '|' + (el.type || '');
          if (seen.has(k)) continue; seen.add(k);
          const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
          const before = sig(el); el.focus(); if (document.activeElement !== el) continue;
          n++; if (before === sig(el)) bad.push(k); el.blur();
        }
        arHide(); setPmoFilter('ALL');
        return { bad, n };
      } catch (e) { return { bad: [], n: 0 }; } });
      for (const k of boxFocus.bad)
        record(build, theme, { sc: 'focus', key: k,
          detail: 'focusing it changes no outline, shadow, border or background', n: 1 });
      if (boxFocus.n < 5) record(build, theme, { sc: 'coverage', key: 'the Add box’s controls were not sampled for a visible focus',
        detail: `${boxFocus.n} control shape(s) of the box took focus to be sampled`, n: 1 });
      // v2.08 (item 122): and the edit box's, the same way
      const edFocus = await page.evaluate(() => { try {
        const id = S.order.filter(x => ptypeOf(x) !== 'PRIME')[0]; setCur(id); openEdit(id, 'rec'); erPt('OGC');
        const g = flowEntsAZ().filter(e => e.kind !== 'prime')[0], to = document.getElementById('erTo');
        if (to && g) { to.value = g.k; to.dispatchEvent(new Event('change', { bubbles: true })); }
        const seen = new Set(), bad = [];
        const sig = el => { const cs = getComputedStyle(el);
          return [cs.outlineStyle, cs.outlineWidth, cs.outlineColor, cs.boxShadow, cs.borderColor, cs.backgroundColor].join('|'); };
        let n = 0;
        for (const el of document.querySelectorAll('#editPanel .modal button, #editPanel .modal input, #editPanel .modal select, #editPanel .modal textarea')) {
          const k = el.tagName + '|' + (el.className || '') + '|' + (el.type || '');
          if (seen.has(k)) continue; seen.add(k);
          const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
          const before = sig(el); el.focus(); if (document.activeElement !== el) continue;
          n++; if (before === sig(el)) bad.push(k); el.blur();
        }
        erClose();
        return { bad, n };
      } catch (e) { return { bad: [], n: 0 }; } });
      for (const k of edFocus.bad)
        record(build, theme, { sc: 'focus', key: k,
          detail: 'focusing it changes no outline, shadow, border or background', n: 1 });
      if (edFocus.n < 5) record(build, theme, { sc: 'coverage', key: 'the edit box’s controls were not sampled for a visible focus',
        detail: `${edFocus.n} control shape(s) of the box took focus to be sampled`, n: 1 });
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
