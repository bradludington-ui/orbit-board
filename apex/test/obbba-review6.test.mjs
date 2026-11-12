// FY2025 O&M OBBBA funding (CONTRACT §17): the third review's findings on it, each in a plan where only it decides.
// Every pull and report below is written here, by hand, as CSV, and every name and figure in them is invented. Each
// expectation is worked out from the rows this file writes and §17's words, never read back from the tool's own figures.
//
//   M6-2  four branches of the rule no other check reached: the fixtures that test §17 also hold pull rows named OBBBA and
//         no unreadable report row marked in Budget Flex 02, so each branch could be broken with every check passing:
//           W1  an unreadable FY2025 report row outside O&M, marked either way, is never listed as OBBBA money that counts;
//           W4  a report row marks its budget's O&M FY2025 pull rows "read or not" (§17.1): one whose Authorized cannot be
//               read still takes them out;
//           W5  a report whose only FY2025 O&M OBBBA rows are its own, marked in Budget Flex 02 alone, with no pull row of
//               their budget, gives model.bae.rows.obbba and the Import report's line for them;
//           W6  a plan whose only word is in a Budget Flex 02 outside O&M gives model.obbbaElsewhere and its list.
//   M6-3, P6-3  a board saved by an earlier build (the §15 build, cc4a4c8; the build before §15, f8fe40e), opened by this
//         one: the Import report's file part names FY2025 O&M OBBBA funding among what the figures leave out by THIS page's
//         rule, never by the count the importing page stored; on the view, the workbook's Import Report sheet, and a plan
//         taken into this page (takePlan) alike, and the stored report is left as it was.
//   P6-2  the list of OBBBA money outside O&M names its count in the section's words, "marked in Budget Flex 02 only";
//         Help and the README say what that list holds and no more (FY2025, while First FY is 2025 or earlier).
//
//   node apex/test/obbba-review6.test.mjs   (the checks on old boards read two earlier builds from git: in a
//   shallow clone run git fetch --unshallow first)
process.env.TZ = 'America/New_York';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadTool, pageHtml, checks, scratchDir } from './harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..');
const C = checks('obbba-review6');
const tmp = scratchDir('sfcbsp-obbba-r6-');
const J = x => JSON.stringify(x);
const settle = (ms = 20) => new Promise(res => setTimeout(res, ms));
const NOW = '2026-11-09T12:00:00.000Z';
// the §15 build (the code before §17: its contract commit 8c0603e changed no code) and the BAE build before §15
const BUILD15 = 'cc4a4c8', BUILD14 = 'f8fe40e';

// ------------------------------------------------------------------------------------------------ restated, never read
const WHY = 'FY2025 O&M OBBBA funding (not a reporting year)';
const pad2 = n => String(n).padStart(2, '0');
const commas = d => d.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const usd = c => (c < 0 ? '-' : '') + '$' + commas(String(Math.floor(Math.abs(c) / 100))) + '.' + pad2(Math.abs(c) % 100);
const rw = n => n + (n === 1 ? ' row' : ' rows');
const D = d => Math.round(d * 100);
const normKey = s => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
const flat = s => String(s ?? '').replace(/\s+/g, ' ').trim();
// §15.4 the file part's sentence on what the figures leave out, FY2025 O&M OBBBA funding named when the report holds a
// readable row of it by §17's rule
const fileLine = (approved, authorized, named) => '  The readable rows hold Approved ' + usd(approved) + ' and Authorized ' + usd(authorized)
  + ': every budget in the report, before Flyaway' + (named ? ', FY2025 O&M OBBBA funding' : '') + ' and the budgets that name no appropriation are left out.';

// ------------------------------------------------------------------------------------------------ the pulls and reports
const HEADERS = ['FY', 'Month', 'CCaR No', 'Title', 'Budget', 'C/L', 'SB', 'Plan Event', 'Date', 'Amount', 'Alloc', 'Event Description',
  'OPR', 'PMT PID#', 'Contracting POC', 'Material Lead', 'PM/TPOC', 'Obligation Category', 'PMO', 'Sub-PMO', 'Category', 'Navy SI Code',
  'IPT', 'Spares WBS', 'Quantity', 'CLINs', 'AF EEIC', 'RCN', 'PSR', 'CSR', 'Contract Mod', 'Cost Element'];   // CONTRACT §2, restated
const q = v => { const s = v === undefined || v === null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = rows => [HEADERS.join(',')].concat(rows.map(o => HEADERS.map(h => q(o[h])).join(','))).join('\n');
const BAE_H = ['Budget Name', 'Budget FY Numeric', 'Budget Approved Amount', 'Budget Authorized Amount', 'Budget Flex 01', 'Budget Flex 02', 'Budget Flex 03'];
const baeCsv = rows => [BAE_H.join(',')].concat(rows.map(r => BAE_H.map((_, i) => q(r[i])).join(','))).join('\n');
const EX = 'Actual Execution is allocated', NA = 'Not Allocated';
const row = (FY, ccar, Title, Budget, pe, Date, Amount, Alloc, PMO) => ({ FY, 'CCaR No': ccar, Title, Budget, 'Plan Event': pe, Date, Amount, Alloc, PMO });
// invented budget names: O&M by "O&M", Initial Spares by "APN Spares … Initial" (§14.2 places a report row by its name)
const B_OM = 'USAF O&M- Kappa Base Discretionary AV';               // ordinary O&M
const B_MK = 'USAF O&M- Kappa Relief Discretionary AV';             // O&M, marked only in a report row's Budget Flex 02
const B_SP = 'USAF APN Spares Kappa Relief Initial';                // Initial Spares, no word in its name
const B_SPN = 'USAF APN Spares Kappa OBBBA Initial';                // Initial Spares, named OBBBA
const B_SPU = 'USAF APN Spares Kappa Other OBBBA Initial';          // Initial Spares, named OBBBA, unreadable in the report
const B_OMN = 'USAF O&M- Kappa OBBBA Discretionary AV';             // O&M, named OBBBA
const ROW_OM = row(2025, 'KK0001', 'Kappa A', B_OM, 'K1', '2024-11-10', '3000000', EX, 'Air Vehicle (AV)');
const S0 = SPx => { const s = SPx.defaultSettings('2026-11-09'); s.asOf = '2026-10'; return s; };
const withBae = parsed => (parsed.bae ? Object.assign({}, parsed.bae, { importedAt: NOW }) : null);

const t = loadTool();
const SP = t.SP;
async function model(pull, bae, both) {
  const P = await SP.parseFiles([{ name: 'om.csv', data: csv(pull) }, { name: 'bae.csv', data: baeCsv(bae) }], { now: NOW });
  const M = SP.buildModel(P.pulls, S0(SP), SP.defaultView(), withBae(P));
  return both ? { M, P } : M;
}
async function block(name, fn) {
  try { await fn(); } catch (e) { C.chk(name + ': the checks stopped part way: ' + String((e && e.stack) || e).split('\n').slice(0, 3).join(' | '), false); }
}
async function boot(html) {
  const tt = loadTool({ html });
  tt.window.confirm = () => true;
  const W = tt.window, doc = W.document;
  for (let i = 0; i < 200 && !doc.getElementById('uiMain'); i++) await settle(5);
  const T = {
    t: tt, W, doc, SP: tt.SP,
    main: () => doc.getElementById('uiMain'),
    click(el) { el.dispatchEvent(new W.MouseEvent('click', { bubbles: true })); },
    async view(v) { T.click(doc.querySelector('[data-act=view][data-v="' + v + '"]')); await settle(); return T.main(); },
    async help() { T.click(doc.querySelector('#uiHelp')); await settle(); return T.main(); },
    errors: () => tt.errors.filter(e => !/^Not implemented: (Window's scrollTo\(\) method|HTMLInputElement\.prototype\.click)/.test(String(e))),
  };
  return T;
}
const withState = (html, state) => html.replace('<script id="spState" type="application/json">null</script>',
  () => '<script id="spState" type="application/json">' + J(state).replace(/</g, '\\u003c') + '</script>');
const stateOf = html => JSON.parse(html.match(/<script id="spState" type="application\/json">([\s\S]*?)<\/script>/)[1].replace(/\\u003c/g, '<'));
// the Import Report sheet's text cells, in order
const sheetTexts = (spec, name) => {
  const s = spec.sheets.find(x => x.sh ? x.sh.name === name : x.name === name);
  const rows = s ? (s.sh ? s.sh.rows : s.rows) : [];
  return rows.map(r => (r.cells || []).map(c => (c && typeof c.v === 'string' ? c.v : '')).join(''));
};

try {
  // =================================================================================================================
  // M6-2 W4: A REPORT ROW MARKS ITS BUDGET "READ OR NOT" (§17.1). Its Authorized cannot be read, so it counts nowhere, yet
  // its Budget Flex 02 marks B_MK, and the pull's O&M FY2025 row of B_MK is FY2025 O&M OBBBA funding, by the report.
  // =================================================================================================================
  await block('W4', async () => {
    const pull = [ROW_OM, row(2025, 'KK0002', 'Kappa B', B_MK, 'K2', '2024-12-10', '2000000', EX, 'Air Vehicle (AV)')];
    const { M, P } = await model(pull, [[B_OM, 2025, '5000000', '4000000', '', '', ''], [B_MK, 2025, '3000000', 'n/a', '', 'OBBBA', '']], true);
    C.eq('W4: the pull budget the unreadable report row marks is left out, by the report',
      M.excluded.obbba.budgets.map(b => [b.key, b.name, b.ap, b.by, b.rows, b.cents, b.obligated]),
      [[normKey(B_MK), B_MK, 'om', 'report', 1, D(2000000), D(2000000)]]);
    C.eq('W4: the left-out rows, in all', [M.excluded.obbba.rows, M.excluded.obbba.cents, M.excluded.obbba.obligated], [1, D(2000000), D(2000000)]);
    const om = M.blocks.find(b => b.key === 'om|2025');
    C.eq('W4: O&M FY2025 plans and obligates the ordinary row alone', om && [om.covered, om.planned, om.obligated], [true, D(3000000), D(3000000)]);
    // rows.obbba is there (a pull row is left out: §15.3) and counts the readable report rows of it: none
    C.eq('W4: the report row is unreadable, not counted as OBBBA funding', [M.bae.rows.bad, M.bae.rows.obbba], [1, 0]);
    const spec = SP.excelSpec(M, P.pulls, S0(SP), { report: P.report, today: '2026-11-09', bae: withBae(P) });
    const raw = sheetTexts(spec, 'O&M Raw Data');
    C.eq('W4: the raw data sheet: the ordinary row counts, the other is left out by the report’s Budget Flex 02',
      [raw.filter(r => r.includes(B_OM) && r.includes('Yes')).length, raw.filter(r => r.includes(B_MK) && r.includes('No: ' + WHY + ', marked in the BAE report’s Budget Flex 02')).length], [1, 1]);
  });

  // =================================================================================================================
  // M6-2 W1: AN UNREADABLE FY2025 ROW OUTSIDE O&M IS NEVER LISTED AS OBBBA MONEY THAT COUNTS (§17.2: the money that counts;
  // an unreadable row counts nowhere). Two such Initial Spares rows, one marked in Budget Flex 02, one named, beside a
  // readable one named OBBBA, which is the list's only row.
  // =================================================================================================================
  await block('W1', async () => {
    const M = await model([ROW_OM], [[B_OM, 2025, '5000000', '4000000', '', '', ''], [B_SP, 2025, 'n/a', '700000', '', 'OBBBA', ''],
      [B_SPU, 2025, '600000', 'not a figure', '', '', ''], [B_SPN, 2025, '800000', '750000', '', '', '']]);
    C.eq('W1: OBBBA money outside O&M: the readable Initial Spares row alone, never the two that could not be read', M.obbbaElsewhere,
      [{ ap: 'sp', fy: 2025, pull: { rows: 0, cents: 0, obligated: 0 }, report: { rows: 1, approved: D(800000), authorized: D(750000), byName: 1, byFlex02: 0 } }]);
    C.eq('W1: the report’s rows: two unreadable', M.bae.rows.bad, 2);
    C.eq('W1: the Import report’s list, the same', SP.obbbaElsewhereLines(M),
      ['Initial Spares FY2025: in the CCaR pull, none; in the BAE report, 1 row (named OBBBA: 1 row; marked in Budget Flex 02 only: 0 rows), Approved '
        + usd(D(800000)) + ', Authorized ' + usd(D(750000)) + '.']);
  });

  // =================================================================================================================
  // M6-2 W5: THE ONLY FY2025 O&M OBBBA ROWS ARE THE REPORT'S, MARKED IN BUDGET FLEX 02 ALONE, and no pull row is of their
  // budget: model.bae.rows counts them by scope, and the Import report says so on its rows-by-scope line.
  // =================================================================================================================
  await block('W5', async () => {
    const M = await model([ROW_OM], [[B_OM, 2025, '5000000', '4000000', '', '', ''], [B_MK, 2025, '3000000', '2500000', '', 'Relief OBBBA', '']]);
    C.eq('W5: no pull row is left out', M.excluded.obbba.rows, 0);
    C.eq('W5: the report’s rows by scope: 1 sustainment row, 1 FY2025 O&M OBBBA row', [M.bae.rows.in, M.bae.rows.obbba], [1, 1]);
    C.eq('W5: the report row, marked in Budget Flex 02', M.bae.derived.filter(d => d.scope === 'obbba').map(d => [d.name, d.obbbaBy, d.why]),
      [[B_MK, 'flex02', WHY + ', marked in Budget Flex 02']]);
    const lines = SP.baeModelLines(M);
    C.chk('W5: the Import report’s rows by scope (the sheet) count it on its own line',
      lines.some(l => l.includes(' naming no appropriation, 1 row of ' + WHY + ' and ')), J(lines.slice(0, 3)));
    C.chk('W5: the Import report’s section is shown, with the report’s row', SP.obbbaLoaded(M)
      && SP.obbbaLines(M).includes('In the BAE report: 1 row, Approved ' + usd(D(3000000)) + ', Authorized ' + usd(D(2500000))
        + ' (named OBBBA: 0 rows; marked in Budget Flex 02 only: 1 row).'), J(SP.obbbaLines(M)));
    // the screen's line, on a page that imported the same files
    const T = await boot(pageHtml({}));
    T.SP.applyImport(await T.SP.parseFiles([{ name: 'om.csv', data: csv([ROW_OM]) },
      { name: 'bae.csv', data: baeCsv([[B_OM, 2025, '5000000', '4000000', '', '', ''], [B_MK, 2025, '3000000', '2500000', '', 'Relief OBBBA', '']]) }], { now: NOW }));
    T.SP.setSettings({ asOf: '2026-10' });
    await settle();
    const li = (await T.view('report')).querySelector('li[data-scope="obbba"]');
    C.eq('W5: the screen’s rows by scope: its own line', li && flat(li.textContent), WHY + ', counted nowhere: 1 row.');
    C.eq('W5: no script error', T.errors(), []);
    T.t.close();
  });

  // =================================================================================================================
  // M6-2 W6: THE ONLY WORD ANYWHERE IS AN INITIAL SPARES FY2025 REPORT ROW'S BUDGET FLEX 02: model.obbbaElsewhere lists it,
  // and the Import report's list says so (§17.2: written when any row's name or Budget Flex 02 holds the word).
  // =================================================================================================================
  await block('W6', async () => {
    const M = await model([ROW_OM], [[B_OM, 2025, '5000000', '4000000', '', '', ''], [B_SP, 2025, '800000', '700000', '', 'OBBBA', '']]);
    C.eq('W6: OBBBA money outside O&M: Initial Spares FY2025, one report row marked in Budget Flex 02', M.obbbaElsewhere,
      [{ ap: 'sp', fy: 2025, pull: { rows: 0, cents: 0, obligated: 0 }, report: { rows: 1, approved: D(800000), authorized: D(700000), byName: 0, byFlex02: 1 } }]);
    C.eq('W6: the Import report’s list (P6-2: the section’s words, "only")', SP.obbbaElsewhereLines(M),
      ['Initial Spares FY2025: in the CCaR pull, none; in the BAE report, 1 row (named OBBBA: 0 rows; marked in Budget Flex 02 only: 1 row), Approved '
        + usd(D(800000)) + ', Authorized ' + usd(D(700000)) + '.']);
    C.eq('W6: nothing is left out', [M.excluded.obbba.rows, 'obbba' in M.bae.rows], [0, false]);
  });

  // =================================================================================================================
  // M6-3, P6-3: A BOARD SAVED BY AN EARLIER BUILD, OPENED BY THIS ONE. The import report it holds stored a count of OBBBA
  // rows made by its own rule; this page names FY2025 O&M OBBBA funding in the file part by §17's rule, on every surface.
  // =================================================================================================================
  async function assembleAt(sha) {
    if (spawnSync('git', ['-C', REPO, 'cat-file', '-e', sha + '^{commit}']).status !== 0) return null;
    const root = join(tmp.dir, sha, 'spend-plan');
    mkdirSync(join(root, 'src'), { recursive: true });
    const ls = spawnSync('git', ['-C', REPO, 'ls-tree', '--name-only', sha, 'spend-plan/src/'], { encoding: 'utf8' });
    for (const f of ['spend-plan/build.mjs'].concat(ls.stdout.split('\n').filter(Boolean))) {
      const r = spawnSync('git', ['-C', REPO, 'show', sha + ':' + f], { maxBuffer: 1 << 28 });
      if (r.status !== 0) return null;
      writeFileSync(join(root, f.replace(/^spend-plan\//, '')), r.stdout);
    }
    const { assemble } = await import(pathToFileURL(join(root, 'build.mjs')).href);
    return assemble;
  }
  // the cases, each the files an earlier build imports and saves; want: whether the file part names FY2025 O&M OBBBA
  const R_OM = [B_OM, 2025, '5000000', '4000000', '', '', ''];
  const CASES = [
    { id: 'flex02', want: true, what: 'its only FY2025 O&M OBBBA row is marked in Budget Flex 02 alone (the old rule counted none)',
      bae: [R_OM, [B_MK, 2025, '3000000', '2500000', '', 'Relief OBBBA', '']], approved: D(8000000), authorized: D(6500000) },
    { id: 'spares', want: false, what: 'its only OBBBA row is Initial Spares FY2025, named OBBBA (the §15 rule counted it; it counts now)',
      bae: [R_OM, [B_SPN, 2025, '800000', '750000', '', '', '']], approved: D(5800000), authorized: D(4750000) },
    { id: 'named', want: true, what: 'its only OBBBA row is O&M FY2025, named OBBBA (the build before §15 stored no count)',
      bae: [R_OM, [B_OMN, 2025, '1000000', '900000', '', '', '']], approved: D(6000000), authorized: D(4900000) },
  ];
  const filesOf = c => [{ name: 'om.csv', data: csv([ROW_OM]) }, { name: 'bae.csv', data: baeCsv(c.bae) }];
  const lineIn = L => L.filter(l => /^\s*The readable rows hold Approved/.test(l));
  for (const sha of [BUILD15, BUILD14]) {
    await block('old ' + sha, async () => {
      const asm = await assembleAt(sha);
      if (!C.chk('the build ' + sha + ' is in this clone (in a shallow clone run git fetch --unshallow)', !!asm)) return;
      for (const c of CASES) {
        const tag = 'a board saved by ' + sha + ', its report: ' + c.what;
        const tb = loadTool({ html: asm({}) });
        tb.SP.applyImport(await tb.SP.parseFiles(filesOf(c), { now: NOW }));
        tb.SP.setSettings({ asOf: '2026-10' });
        const savedText = tb.SP.savedHtml();
        tb.close();
        const saved = stateOf(savedText);
        const stored = J(saved.lastImport.report.bae);
        const want = fileLine(c.approved, c.authorized, c.want);
        // the page opened on the saved plan
        const T = await boot(withState(pageHtml({}), saved));
        const st = T.SP.state;
        C.eq(tag + ': SP.importReportLines with the report on screen', lineIn(T.SP.importReportLines(st.lastImport.report, st.bae.current)), [want]);
        const rl = [...(await T.view('report')).querySelectorAll('div.rl')].map(d => d.textContent).filter(s => /^The readable rows hold Approved/.test(s));
        C.eq(tag + ': the Import report view', rl, [want.trim()]);
        const M = T.SP.buildModel(st.pulls.current, st.settings, T.SP.defaultView(), st.bae.current);
        const spec = T.SP.excelSpec(M, st.pulls.current, st.settings, { report: st.lastImport.report, today: '2026-11-09', bae: st.bae.current });
        C.eq(tag + ': the workbook’s Import Report sheet', lineIn(sheetTexts(spec, 'Import Report')), [want]);
        C.eq(tag + ': the stored report is left as it was', J(T.SP.state.lastImport.report.bae), stored);
        C.eq(tag + ': no script error', T.errors(), []);
        T.t.close();
        // the plan taken into a new page (Help: "import the saved plan’s .html file on its own")
        const T2 = await boot(pageHtml({}));
        const tk = T2.SP.takePlan(savedText, 'old.html');
        await settle();
        const s2 = T2.SP.state;
        C.chk(tag + ': taken into this page', tk && tk.ok !== false, J(tk));
        C.eq(tag + ': taken, SP.importReportLines with the report on screen', lineIn(T2.SP.importReportLines(s2.lastImport && s2.lastImport.report, s2.bae && s2.bae.current)), [want]);
        T2.t.close();
        // the same files imported fresh by this page say the same
        const tf = loadTool();
        tf.SP.applyImport(await tf.SP.parseFiles(filesOf(c), { now: NOW }));
        C.eq(tag + ': a fresh import in this page says the same', lineIn(tf.SP.importReportLines(tf.SP.state.lastImport.report, tf.SP.state.bae.current)), [want]);
        tf.close();
      }
    });
  }

  // a report that is not the one on screen (a refused import's: another import time) is read by its own count, never
  // against the report on screen, whatever that holds: here the one on screen holds no FY2025 O&M OBBBA row, the other one
  await block('refused', async () => {
    const tf = loadTool();
    tf.SP.applyImport(await tf.SP.parseFiles(filesOf(CASES[1]), { now: NOW }));
    const P = await tf.SP.parseFiles(filesOf(CASES[0]), { now: '2026-11-16T12:00:00.000Z' });
    C.eq('a report not on screen is read by its own count, the report on screen given or not',
      [lineIn(tf.SP.importReportLines(P.report)), lineIn(tf.SP.importReportLines(P.report, tf.SP.state.bae.current))],
      [[fileLine(CASES[0].approved, CASES[0].authorized, true)], [fileLine(CASES[0].approved, CASES[0].authorized, true)]]);
    tf.close();
  });

  // =================================================================================================================
  // P6-2: Help and the README say what the list of OBBBA money outside O&M holds, and no more
  // =================================================================================================================
  await block('help', async () => {
    const T = await boot(pageHtml({}));
    const h = flat((await T.help()).textContent);
    C.chk('Help: the list is FY2025 money outside O&M, while First FY is 2025 or earlier, by the pull’s Budget and the report’s two marks',
      h.includes('The Import report lists the FY2025 OBBBA money outside O&M that counts (while First FY is 2025 or earlier): the CCaR pull’s rows whose Budget '
        + 'holds the word, and the BAE report’s rows whose Budget Name or Budget Flex 02 holds it; OBBBA money of any other FY is not listed.')
      && !h.includes('the Import report lists the OBBBA money outside O&M it counts'), h.slice(0, 300));
    T.t.close();
    const rd = flat(readFileSync(join(HERE, '..', 'README.md'), 'utf8'));
    C.chk('README: the same', rd.includes('The Import report lists the FY2025 OBBBA money outside O&M that counts (while First FY is 2025 or earlier): the CCaR '
      + 'pull\'s rows whose Budget holds the word, and the BAE report\'s rows whose Budget Name or Budget Flex 02 holds it. OBBBA money of any other FY is not listed.')
      && !rd.includes('and the Import report lists it as such'), '');
  });
} catch (e) {
  C.chk('the test ran to the end', false, (e && e.stack) || String(e));
} finally {
  t.close();
  tmp.rm();
  C.done();
}
