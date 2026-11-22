// Review group B (phone, print and accessibility): the checks for what the review of 21 Nov 2026 found and the owner's
// rules allowed. Each part names its issue:
//   I13  a picker's label wraps and the picker fits its card: My PMO, Unfunded and SRRB do not scroll sideways at 390, 360
//        or 320 px, with a long office name (§38)
//   I28  on a phone the lists and the Summary keep their row's name while scrolled sideways (§38's pattern)
//   I31  an opened unfunded line's words are held to the list's visible width on a phone
//   I61  the keyboard's ring can be seen on the menu and on the phone's Menu button (3:1 against what is behind it)
//   I67  a picker's edge clears 3:1 against the sheet
//   I34  printed, the page is landscape and keeps its colours, and the printed line names the view's pickers and search
//   I35  the long lists keep their headings under the top while they scroll, where the table fits; a phone is as it was
//   I64  a "Skip to the page" link is the first Tab stop, and the window's title names the view once there is data
//   I09  a view-only copy does not say the plain "Opened the plan saved" notice; a keeper's page still does
//   I26  under Awards by month, the same figures as a table; a late part is hatched
//   I62  a published PDF says its language and asks a viewer to show its title (and claims no tags)
//   I08  a view-only copy's Help: the reader's sections first, the keeper's left out, a list of sections, every rule kept
// Invented data throughout. REVIEW_B_HTML=<a built apex.html> runs the same checks on that page instead of the sources
// (how each check was shown to fail with its fix undone).
//
//   node apex/test/review-b.test.mjs
process.env.TZ = 'America/New_York';
import { chromium } from 'playwright-core';
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CHROME } from '../../tools/chrome.mjs';
import { loadTool, pageHtml, scratchDir, checks } from './harness.mjs';

const C = checks('review-b');
const J = x => JSON.stringify(x);
const settle = (ms = 20) => new Promise(res => setTimeout(res, ms));
const OTHER = process.env.REVIEW_B_HTML ? readFileSync(process.env.REVIEW_B_HTML, 'utf8') : null;
const withState = (html, st) => html.replace('<script id="spState" type="application/json">null</script>',
  () => '<script id="spState" type="application/json">' + JSON.stringify(st).replace(/</g, '\\u003c') + '</script>');
const html = st => (OTHER ? (st ? withState(OTHER, st) : OTHER) : pageHtml(st ? { state: st } : {}));
const HEADERS = ['FY', 'Month', 'CCaR No', 'Title', 'Budget', 'C/L', 'SB', 'Plan Event', 'Date', 'Amount', 'Alloc', 'Event Description',
  'OPR', 'PMT PID#', 'Contracting POC', 'Material Lead', 'PM/TPOC', 'Obligation Category', 'PMO', 'Sub-PMO', 'Category', 'Navy SI Code',
  'IPT', 'Spares WBS', 'SRRB', 'CLINs', 'AF EEIC', 'RCN', 'PSR', 'CSR', 'Contract Mod', 'Cost Element'];   // CONTRACT §2, with column Y headed SRRB (§44)
const q = v => { const s = v === undefined || v === null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = rows => [HEADERS.join(',')].concat(rows.map(o => HEADERS.map(h => q(o[h])).join(','))).join('\n');
// three PMOs, one of them a 32-character name (the review measured 32 in the invented data), 6 services, 2 fiscal years
const SV = ['USAF O&M- Tessa Base Discretionary', 'USAF ANG O&M Tessa', 'USAF AFRC O&M Tessa', 'USN STOVL O&M Tessa', 'USN USMC CV O&M Tessa', 'USN CV O&M Tessa'];
const PMOS = ['Air Vehicle Sustainment Ops (AVSO)', 'Propulsion (PP)', 'Combat Data Systems (CDS)'];
const ROWS = [];
for (const fy of [2026, 2027]) for (let i = 0; i < 36; i++) for (let s = 0; s < 6; s++) {
  const m = 1 + ((i * 5 + s * 3) % 12), yy = fy - (m >= 10 ? 1 : 0);
  ROWS.push({ FY: fy, 'CCaR No': 'TS' + (1000 + i), Title: 'Invented requirement number ' + i + ' for sustainment of the fleet', Budget: SV[s], 'Plan Event': 'PE ' + i + '-' + s,
    Date: yy + '-' + String(m).padStart(2, '0') + '-' + String(1 + ((i + s) % 27)).padStart(2, '0'), Amount: String(100000 * (1 + i) + 1000 * s),
    Alloc: (i + s) % 3 === 0 ? 'Actual Execution is allocated' : 'Not Allocated', PMO: PMOS[i % 3], SRRB: (i + s) % 4 === 0 ? 'Yes' : 'No' });
}
const line = (rank, title, pmo, ccar, c) => ({ ap: 'om', fy: 2027, sheet: 'O&M', row: 10 + rank, rank: String(rank), title, pmo, ccar, cents: c.concat([0]), total: c.reduce((a, b) => a + b, 0), status: 'Unfunded', exec: 'Yes', sfcb: '' });
const UFR = { ok: true, fy: 2027, name: 'UFR FY2027.xlsx', unit: 1000, tabs: [], notes: [], ignored: [], lines: [
  line(1, 'Invented requirement number 3 for sustainment of the fleet', 'PP', 'TS1003', [5e7, 1e7, 0, 2e7, 0, 1e7]), line(2, 'A new unfunded thing', 'PP', 'TS9999', [7e7, 0, 0, 0, 0, 0])]
  .concat(Array.from({ length: 28 }, (_, k) => line(3 + k, 'Another invented unfunded line ' + k, ['PP', 'CDS'][k % 2], 'TU' + (2000 + k), [1e6 * (k + 1), 0, 2e5, 0, 0, 0]))) };
// the contrast ratio of two CSS colours (WCAG 2.x relative luminance)
const lum = c => { const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(c); return [1, 2, 3].map(i => { const v = Number(m[i]) / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
  .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0); };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

let browser = null, scratch = null;
try {
  // ---- the plan, made in jsdom as the keeper makes it
  const t0 = loadTool({ html: html(null) });
  for (let i = 0; i < 200 && !t0.window.document.getElementById('uiMain'); i++) await settle(5);
  t0.SP.applyImport(await t0.SP.parseFiles([{ name: 'om.csv', data: csv(ROWS) }], { now: '2026-11-09T12:00:00.000Z' }));
  t0.SP.setSettings({ asOf: '2026-10' });
  t0.SP.setUfr(UFR, '2026-11-10T12:00:00.000Z');
  const KEEP = JSON.parse(J(t0.SP.state));
  KEEP.savedAt = '2026-11-10T12:30:00.000Z';
  const VO = Object.assign(JSON.parse(J(KEEP)), { viewOnly: true });
  t0.close();
  const boot = async st => {
    const t = loadTool({ html: html(st) });
    for (let i = 0; i < 200 && !t.window.document.getElementById('uiMain'); i++) await settle(5);
    await settle(40);
    const W = t.window, doc = W.document;
    return { t, W, doc, SP: t.SP, main: () => doc.getElementById('uiMain'), click: el => { if (el) el.dispatchEvent(new W.MouseEvent('click', { bubbles: true })); },
      async view(v) { this.click(doc.querySelector('[data-act=view][data-v="' + v + '"]')); await settle(); return this.main(); } };
  };

  // ============================================================== I09, I64: the opening notice, the title and the skip link
  {
    const E = await boot(null);
    C.eq('I64: with no data the window is titled CUI - APEX, the page’s name, marked (§19, I58)', E.doc.title, 'CUI - APEX');
    E.t.close();
    const K = await boot(KEEP), V = await boot(VO);
    C.chk('I09: a keeper’s page still says which plan it opened', /^Opened the plan saved/.test(K.doc.getElementById('uiMsg').textContent), K.doc.getElementById('uiMsg').textContent);
    C.eq('I09: a view-only copy does not say the plain opening notice', V.doc.getElementById('uiMsg').textContent, '');
    C.chk('I09: a view-only copy still says Data through as words, and no First FY (§35, §48)', /^Data through Oct-2026( · Published \d{1,2} [A-Z][a-z]{2} \d{4})?$/.test(V.doc.getElementById('uiAsOfText').textContent), V.doc.getElementById('uiAsOfText').textContent);
    C.eq('I64: with data the window’s title names the view, the year and the copy', [K.doc.title, V.doc.title], ['CUI - Summary - APEX FY2027', V.doc.title.startsWith('CUI - Summary - APEX FY2027 (view only) · data through ') ? V.doc.title : 'CUI - Summary - APEX FY2027 (view only) · data through …']);
    await K.view('cal');
    C.eq('I64: … and follows a change of view', K.doc.title, 'CUI - Calendar - APEX FY2027');
    K.click(K.doc.getElementById('uiHelp')); await settle();
    C.eq('I64: … Help too', K.doc.title, 'CUI - Help - APEX FY2027');
    const first = K.doc.querySelector('#app a[href], #app button, #app input, #app select');
    C.chk('I64: the first control in the page is "Skip to the page", pointing at the view', !!first && first.classList.contains('skip') && first.getAttribute('href') === '#uiMain' && first.textContent === 'Skip to the page');
    K.click(K.doc.querySelector('a.skip')); await settle();
    C.eq('I64: pressed, the view itself has the keyboard', K.doc.activeElement && K.doc.activeElement.id, 'uiMain');

    // ============================================================== I08: Help in a view-only copy
    const kh = (K.click(K.doc.getElementById('uiHelp')), await settle(), K.click(K.doc.getElementById('uiHelp')), await settle(), K.main());
    const kHeads = [...kh.querySelectorAll('h3.sub')].map(h => h.textContent);
    V.click(V.doc.getElementById('uiHelp')); await settle();
    const vh = V.main(), vHeads = [...vh.querySelectorAll('h3.sub')].map(h => h.textContent);
    C.chk('I08: the keeper’s Help is the whole guide, with no list of sections', kHeads.includes('Importing') && kHeads.includes('Manage data') && !kh.querySelector('#uiHelpToc'), J(kHeads));
    C.eq('I08: the copy’s Help opens with its note, then the list of sections', [vh.querySelector('.help').firstElementChild.id, vh.querySelector('.help').children[1].id], ['uiVoHelp', 'uiHelpToc']);
    C.eq('I08: the reader’s sections come first: the figures, finding a requirement, My PMO, the unfunded list', vHeads.slice(0, 4), ['The figures', 'Finding a requirement', 'My PMO and the Award calendar', 'The unfunded list']);
    C.eq('I08: what only the keeper can use is not drawn', ['Importing', 'Publishing a view-only copy', 'Moving to a new version of APEX', 'Manage data', 'Unobligated Requirements'].filter(h => vHeads.includes(h)), []);
    C.eq('I08: every other section of the guide is there, once, and nothing new', vHeads.slice().sort(), kHeads.filter(h => !['Importing', 'Publishing a view-only copy', 'Moving to a new version of APEX', 'Manage data', 'Unobligated Requirements'].includes(h)).sort());
    const toc = [...vh.querySelectorAll('#uiHelpToc a')];
    C.eq('I08: the list names each section, in order, and each link reaches its heading', [toc.map(a => a.textContent), toc.every(a => { const h = V.doc.getElementById(a.getAttribute('href').slice(1)); return h && h.textContent === a.textContent; })], [vHeads, true]);
    V.click(toc[2]); await settle();
    C.eq('I08: a link pressed gives its section’s heading the keyboard', V.doc.activeElement && V.doc.activeElement.textContent, vHeads[2]);
    // the rules Help must always state (§15.1, §17, §23, §24) are the same sentences in both
    const KEEPER = ['Importing', 'Publishing a view-only copy', 'Moving to a new version of APEX', 'Manage data', 'Unobligated Requirements'];
    const said = root => [...root.querySelectorAll('h3.sub')].filter(h => !KEEPER.includes(h.textContent)).flatMap(h => { const ul = h.nextElementSibling; return ul ? [...ul.querySelectorAll('li')].map(l => l.textContent) : []; })
      .filter(s => /left out|First FY/.test(s));
    C.chk('I08: every rule sentence the keeper’s Help states about what is left out or First FY is in the copy’s, word for word', said(kh).length >= 3 && J(said(kh)) === J(said(vh).slice().sort((a, b) => said(kh).indexOf(a) - said(kh).indexOf(b))), J(said(kh).filter(s => !said(vh).includes(s))));
    C.chk('I08: the copy’s Help is shorter by what it leaves out', vh.textContent.split(/\s+/).length < kh.textContent.split(/\s+/).length - 600, vh.textContent.split(/\s+/).length + ' vs ' + kh.textContent.split(/\s+/).length);

    // ============================================================== I26: the awards by month as figures
    const m = await V.view('charts');
    const X = V.SP.chartsOf(V.SP.buildModel(V.SP.state.pulls.current, V.SP.state.settings, V.SP.defaultView(), null), V.SP.requirementsOf(V.SP.buildModel(V.SP.state.pulls.current, V.SP.state.settings, V.SP.defaultView(), null)));
    const tb = m.querySelector('[data-ch=months] table.chmonths');
    C.chk('I26: under Awards by month, a table of its figures', !!tb, 'none');
    if (tb) {
      const rows = [...tb.querySelectorAll('tbody tr')].map(tr => [tr.querySelector('th').textContent, ...[...tr.querySelectorAll('td')].map(td => Number(td.getAttribute('data-c')))]);
      C.eq('I26: one row a column of the chart: awarded, late, projected and total, as the bars carry them', rows, X.cols.map(c => [c.label, c.awarded, c.late, c.projected, c.total]));
      const foot = [...tb.querySelectorAll('tfoot td')].map(td => Number(td.getAttribute('data-c')));
      C.eq('I26: and a total row that adds them', foot, ['awarded', 'late', 'projected', 'total'].map(k => X.cols.reduce((s, c) => s + c[k], 0)));
      C.chk('I26: the chart had a late part to show', X.cols.some(c => c.late > 0));
    }
    const lateRects = [...m.querySelectorAll('.chsvg rect.chb-late')], hatch = [...m.querySelectorAll('.chsvg rect.chhatch')];
    C.chk('I26: each late part of a bar is hatched over its red, and only a late part', lateRects.length > 0 && hatch.length === lateRects.length
      && hatch.every((h, i) => h.getAttribute('x') === lateRects[i].getAttribute('x') && h.getAttribute('y') === lateRects[i].getAttribute('y') && h.getAttribute('fill') === 'url(#uiChHatch)'), lateRects.length + ' late, ' + hatch.length + ' hatched');

    // ============================================================== I34: the printed line names the pickers and the search
    await K.view('find');
    const qb = K.doc.getElementById('uiFindQ');
    qb.value = 'number 3'; qb.dispatchEvent(new K.W.Event('input', { bubbles: true })); await settle();
    C.chk('I34: on paper, the line says what was searched for', /Picked on this page: Find “number 3”$/.test(K.doc.getElementById('uiPrintHead').textContent), K.doc.getElementById('uiPrintHead').textContent);
    await K.view('mypmo');
    C.chk('I34: … and what office was picked', /Picked on this page: Choose your PMO [^·]+?( · Coming up [^·]+)?$/.test(K.doc.getElementById('uiPrintHead').textContent), K.doc.getElementById('uiPrintHead').textContent);
    await K.view('summary');
    C.chk('I34: … and nothing where nothing is picked', !/Picked on this page/.test(K.doc.getElementById('uiPrintHead').textContent) && /All services, both lanes$/.test(K.doc.getElementById('uiPrintHead').textContent), K.doc.getElementById('uiPrintHead').textContent);
    C.eq('no script error in jsdom', J([K, V].flatMap(T => T.t.errors.filter(x => !/^Not implemented: (Window's scrollTo\(\) method|HTMLInputElement\.prototype\.click|HTMLCanvasElement)/.test(String(x))))), '[]');
    K.t.close(); V.t.close();
  }

  // ============================================================== I62: the PDF's language and title
  {
    const t = loadTool({ html: html(null) });
    const bytes = t.SP.pdfBytes({ title: 'Invented', pages: [{ w: 792, h: 612, ops: [{ t: 'text', x: 10, y: 20, s: 'Hello' }] }] });
    const s = Buffer.from(bytes).toString('latin1'), cat = (/1 0 obj\n([^\n]*)\n/.exec(s) || [])[1] || '';
    C.chk('I62: the catalog says the document is in English', /\/Lang \(en-US\)/.test(cat), cat);
    C.chk('I62: … and asks a viewer to show the title, in the one ViewerPreferences it had', /\/ViewerPreferences << \/PickTrayByPDFSize true \/Duplex \/DuplexFlipShortEdge \/DisplayDocTitle true >>/.test(cat), cat);
    C.chk('I62: and claims no tags it does not have', !/MarkInfo|StructTreeRoot/.test(s));
    t.close();
  }

  // ============================================================== in Chromium: the layout, the keyboard and paper
  scratch = scratchDir('apex-review-b-');
  const fileK = join(scratch.dir, 'keeper.html'), fileV = join(scratch.dir, 'view-only.html');
  writeFileSync(fileK, html(KEEP)); writeFileSync(fileV, html(VO));
  browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const open = async (file, width, height, mobile) => {
    const cx = await browser.newContext(mobile ? { viewport: { width, height }, isMobile: true, hasTouch: true } : { viewport: { width, height } });
    const p = await cx.newPage(), errs = [];
    p.on('pageerror', e => errs.push(String(e)));
    await p.goto(pathToFileURL(file).href);
    await p.waitForSelector('#uiNav button[data-v]', { state: 'attached' });
    await p.evaluate(() => { const x = document.getElementById('uiMsgX'); if (x && !x.hidden) x.click(); });
    await p.waitForTimeout(120);
    return { p, cx, errs };
  };
  const go = async (p, v) => { await p.evaluate(v => document.querySelector('#uiNav button[data-v="' + v + '"]').click(), v); await p.waitForTimeout(200); };
  const sideways = p => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

  // ---- a phone
  for (const width of [390, 360, 320]) {
    const { p, cx, errs } = await open(fileV, width, 800, true);
    const bad = [];
    for (const v of ['mypmo', 'ufr', 'srrb', 'find', 'summary']) { await go(p, v); const sx = await sideways(p); if (sx > 1) bad.push(v + ' ' + sx + ' px'); }
    C.eq('I13: at ' + width + ' px My PMO, Unfunded, SRRB, Requirements and the Summary do not scroll the page sideways, with a 32-character office', bad, []);
    await go(p, 'mypmo');
    C.chk('I13: at ' + width + ' px the long office is the one picked on My PMO', (await p.evaluate(() => document.querySelector('#uiMain select[data-act=pmof]').selectedOptions[0].textContent)).length >= 32);
    if (width !== 320) {
      // I28: scrolled sideways, the row's name stays where it was, and nothing shows through it
      const pins = [];
      for (const [v, sel] of [['find', 'table.findt tbody th.lab'], ['mypmo', 'table.findt tbody th.lab'], ['srrb', 'table.findt tbody th.lab'], ['ufr', 'table.findt tbody th.lab'], ['summary', 'table.grid.top tbody th.apg']]) {
        await go(p, v);
        pins.push(await p.evaluate(([v, sel]) => { const cell = document.querySelector('#uiMain ' + sel), tw = cell.closest('.tw');
          scrollTo(0, scrollY + cell.getBoundingClientRect().top - 200);
          tw.scrollLeft = 400; const r = cell.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.top + Math.min(8, r.height / 2));
          return [v, tw.scrollLeft > 100, Math.abs(r.left - tw.getBoundingClientRect().left) <= 4, !!hit && cell.contains(hit), getComputedStyle(cell).backgroundColor !== 'rgba(0, 0, 0, 0)']; }, [v, sel]));
      }
      C.eq('I28: at ' + width + ' px each list scrolled sideways keeps its row’s name in place, on top and filled', pins.filter(x => !(x[1] && x[2] && x[3] && x[4])), []);
      await go(p, 'summary');
      const fyp = await p.evaluate(() => { const tw = document.querySelector('#uiMain table.grid.top').closest('.tw'), fy = tw.querySelector('tbody th.apg + td'), ap = tw.querySelector('tbody th.apg');
        tw.scrollLeft = 400; const a = ap.getBoundingClientRect(), f = fy.getBoundingClientRect(); return { gap: Math.round(f.left - a.right), ap: Math.round(a.left - tw.getBoundingClientRect().left), fy: fy.textContent, sl: tw.scrollLeft }; });
      C.chk('I28: at ' + width + ' px the Summary keeps FY beside the appropriation', fyp.sl > 100 && Math.abs(fyp.ap) <= 3 && fyp.gap <= 0 && fyp.gap >= -6 && /^FY\d{4}$/.test(fyp.fy), J(fyp));
      // I31: an opened unfunded line's words fit the list's visible box
      await go(p, 'ufr');
      await p.evaluate(() => document.querySelector('#uiMain [data-act=ufropen]').click()); await p.waitForTimeout(200);
      const d = await p.evaluate(() => { const td = document.querySelector('#uiMain tr.udetail td[colspan]'), box = td.closest('.tw').getBoundingClientRect(), inner = (td.querySelector('.udet') || td).getBoundingClientRect();
        return { left: Math.round(inner.left - box.left), right: Math.round(box.right - inner.right), text: /Approved|Mandatory|Not in the spend plan/.test(td.textContent) }; });
      C.chk('I31: at ' + width + ' px an opened unfunded line’s words sit inside the list’s visible box', d.left >= 0 && d.right >= 0 && d.text, J(d));
      // I35: a phone is as it was: the lists' headings are not held under the top
      await p.evaluate(() => scrollTo(0, 2600)); await p.waitForTimeout(80);
      C.chk('I35: at ' + width + ' px a list’s headings scroll away with it, as before', await p.evaluate(() => getComputedStyle(document.querySelector('#uiMain table.findt thead th')).position !== 'sticky'));
      // I61: the Menu button's ring is drawn inside it, in the light ink
      await p.evaluate(() => scrollTo(0, 0));
      await p.focus('#uiNavBtn'); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab');
      const ring = await p.evaluate(() => { const b = document.activeElement, cs = getComputedStyle(b); return { id: b.id, oc: cs.outlineColor, off: parseFloat(cs.outlineOffset), w: parseFloat(cs.outlineWidth), bg: cs.backgroundColor }; });
      C.chk('I61: at ' + width + ' px the Menu button’s keyboard ring is inside it and clears 3:1 on its navy', ring.id === 'uiNavBtn' && ring.w >= 2 && ring.off < 0 && ratio(ring.oc, ring.bg) >= 3, J(ring));
    }
    C.eq('at ' + width + ' px: no script error', errs, []);
    await cx.close();
  }

  // ---- a laptop
  {
    const { p, cx, errs } = await open(fileK, 1366, 768, false);
    // I61: the ring on a menu item, against the menu's own navy
    await p.focus('#uiNav button[data-v=cal]'); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab');
    const r = await p.evaluate(() => { const a = document.activeElement, cs = getComputedStyle(a); return { v: a.getAttribute('data-v'), oc: cs.outlineColor, w: parseFloat(cs.outlineWidth), nav: getComputedStyle(document.getElementById('uiNav')).backgroundColor }; });
    C.chk('I61: at 1366 px a menu item’s keyboard ring clears 3:1 against the menu', r.v === 'cal' && r.w >= 2 && ratio(r.oc, r.nav) >= 3, J(r) + ' ' + ratio(r.oc, r.nav).toFixed(2));
    // I67: a picker's edge against the sheet around it
    await go(p, 'om');
    const e = await p.evaluate(() => { const s = document.querySelector('#uiMain select'); return { edge: getComputedStyle(s).borderTopColor, sheet: getComputedStyle(document.getElementById('uiMain')).backgroundColor }; });
    C.chk('I67: a picker’s edge clears 3:1 against the sheet', ratio(e.edge, e.sheet) >= 3, J(e) + ' ' + ratio(e.edge, e.sheet).toFixed(2));
    // I35: the long lists keep their headings under the top while they scroll
    const held = [];
    for (const v of ['find', 'mypmo', 'ufr', 'srrb']) {
      await go(p, v);
      held.push(await p.evaluate(async v => { const t = document.querySelector('#uiMain table.findt'), th = t.querySelector('thead th'), tb = t.getBoundingClientRect();
        scrollTo(0, scrollY + tb.top + tb.height / 2 - 300); await new Promise(r => setTimeout(r, 60));
        const topH = parseFloat(document.documentElement.style.getPropertyValue('--topH')), r = th.getBoundingClientRect();
        return [v, Math.abs(r.top - topH) <= 2, t.getBoundingClientRect().top < topH - 50, document.documentElement.scrollWidth - document.documentElement.clientWidth, Math.round(r.top), topH, Math.round(t.getBoundingClientRect().top), Math.round(tb.height), th.closest('.tw').className, scrollY]; }, v));
    }
    C.eq('I35: at 1366 px each long list, scrolled to its middle, keeps its headings just under the top, and the page does not scroll sideways', held.filter(x => !(x[1] && x[2] && x[3] <= 1)), []);
    C.chk('I35: the keyboard’s scroll padding counts the headings', await p.evaluate(() => parseFloat(document.documentElement.style.getPropertyValue('--theadH')) > 10));
    // I64: Tab from the top: the skip link first, seen while it has the keyboard; Enter takes the keyboard to the view
    await p.evaluate(() => scrollTo(0, 0)); await p.mouse.click(5, 5); await p.keyboard.press('Tab');
    const sk = await p.evaluate(() => { const a = document.activeElement, r = a.getBoundingClientRect(); return { cls: a.className, txt: a.textContent, top: Math.round(r.top), h: Math.round(r.height), w: Math.round(r.width) }; });
    C.chk('I64: the first Tab stop is "Skip to the page", on screen while it has the keyboard', sk.cls === 'skip' && sk.txt === 'Skip to the page' && sk.top >= 0 && sk.h >= 24 && sk.w > 50, J(sk));
    await p.keyboard.press('Enter'); await p.waitForTimeout(80);
    C.eq('I64: Enter on it gives the view the keyboard', await p.evaluate(() => document.activeElement.id), 'uiMain');
    C.chk('I64: unfocused, it is off the screen', await p.evaluate(() => { const a = document.querySelector('a.skip'); return !!a && a.getBoundingClientRect().bottom <= 0; }));
    // I34: on paper: landscape, and the sheet's colours kept
    await go(p, 'summary');
    await p.emulateMedia({ media: 'print' });
    const pc = await p.evaluate(() => { const g = s => { const e = document.querySelector(s); return e ? getComputedStyle(e).printColorAdjust || getComputedStyle(e).webkitPrintColorAdjust : 'none'; };
      return [g('#uiMain h2.title'), g('#uiMain tr.total th'), g('#uiMain td.st'), g('#uiMain tr.hd th')]; });
    C.eq('I34: printed, the title bar, the TOTAL row, the status fills and the headings keep their colours', pc, ['exact', 'exact', 'exact', 'exact']);
    const pdf = Buffer.from(await p.pdf({ preferCSSPageSize: true })).toString('latin1');
    const box = (/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/.exec(pdf) || []).slice(1).map(Number);
    C.chk('I34: printed, the page is landscape Letter', box.length === 2 && Math.round(box[0]) === 792 && Math.round(box[1]) === 612, J(box));
    await p.emulateMedia({ media: 'screen' });
    C.eq('at 1366 px: no script error', errs, []);
    await cx.close();
  }
} catch (err) {
  console.error(err);
  C.chk('the test ran to its end', false, (err && err.message) || String(err));
}
if (browser) await browser.close();
if (scratch) scratch.rm();
C.done();
