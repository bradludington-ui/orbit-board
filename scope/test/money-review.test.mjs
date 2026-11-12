// The money review's findings (R2, R3, R5, R6, R7), each held on a small pull made here, in jsdom, through the page's
// own controls where a person would use them. Every name and figure below is invented; each expectation is worked out
// from the rows this file writes, never read back from the tool's own figures.
//
// What it holds the tool to:
//   R2  the Not Allocated view's PMO filter shows a PMO's OWN part of each item (what its PMO tab lists), never the
//       whole of an item another PMO shares, and lists a PMO once however its name is spelled (§4.4);
//   R3  under a switch, an entered Authorized (which is for the appropriation and FY as a whole) is marked ‡ beside the
//       figure on the screen and in the workbook, the TOTAL too, and no product claims "every figure counts only
//       these" without naming it and the notes on rows not counted, which cover every service and lane;
//   R5  executed rows with no readable date are counted and said: the headline Obl % stands above the as-of column by
//       exactly the executed money dated after the as-of month plus the executed money with no date;
//   R6  a new import replaces the last import's unidentified rows, so the Summary never points at rows the Import
//       report no longer lists;
//   R7  the Obligation % label and the PMO strip print Approved in the same words on the screen, in the workbook and on
//       the picture: a negative in parentheses, a non-zero amount under $5,000 as <0.01, zero as 0.00.
//
//   node scope/test/money-review.test.mjs
import { spawnSync } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTool, checks, scratchDir } from './harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const C = checks('money-review');
const NOW = '2026-04-15T12:00:00Z';
const HEADERS = ['FY', 'Month', 'CCaR No', 'Title', 'Budget', 'C/L', 'SB', 'Plan Event', 'Date', 'Amount', 'Alloc', 'Event Description',
  'OPR', 'PMT PID#', 'Contracting POC', 'Material Lead', 'PM/TPOC', 'Obligation Category', 'PMO', 'Sub-PMO', 'Category', 'Navy SI Code',
  'IPT', 'Spares WBS', 'Quantity', 'CLINs', 'AF EEIC', 'RCN', 'PSR', 'CSR', 'Contract Mod', 'Cost Element'];   // CONTRACT §2, restated
const EXEC = 'Actual Execution is allocated', NA = 'Not Allocated';
const q = v => { const s = v === undefined || v === null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = rows => [HEADERS.join(',')].concat(rows.map(o => HEADERS.map(h => q(o[h])).join(','))).join('\n');
// $M as the contract's fmtM writes it (§2), with zero written 0.00 inside a sentence: restated here, not read from the tool
function mText(c) {
  if (c === 0) return '0.00';
  const a = Math.abs(c);
  let body;
  if (a < 500000) body = '<0.01';
  else { let h = Math.floor(a / 1e6); if (a - h * 1e6 >= 500000) h++; body = String(Math.floor(h / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + String(h % 100).padStart(2, '0'); }
  return c < 0 ? '(' + body + ')' : body;
}
const dollars = s => Math.round(Number(s) * 100);
function boot() {
  const t = loadTool();
  C.eq('the page boots with no script errors', t.errors, []);
  const doc = t.window.document;
  const click = sel => { const el = doc.querySelector(sel); if (!el) return false; el.dispatchEvent(new t.window.MouseEvent('click', { bubbles: true })); return true; };
  const choose = (el, value) => { el.value = value; el.dispatchEvent(new t.window.Event('change', { bubbles: true })); };
  const tick = (sel, on) => { const el = doc.querySelector(sel); el.checked = on; el.dispatchEvent(new t.window.Event('change', { bubbles: true })); };
  const main = () => doc.getElementById('uiMain') || doc.querySelector('main');
  const imp = async (files, settings) => {
    const parsed = await t.SP.parseFiles(files.map(([name, rows]) => ({ name, data: csv(rows) })), { now: NOW });
    t.SP.applyImport(parsed);
    if (settings) t.SP.setSettings(settings);
    t.SP.uiRender();
    return parsed;
  };
  return { t, SP: t.SP, doc, click, choose, tick, main, imp };
}
const decode = s => String(s).replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

// =====================================================================================================================
// R2 — the Not Allocated view's PMO filter
// =====================================================================================================================
{
  const B = { FY: 2026, Title: 'Invented Title', Budget: 'USAF O&M Discretionary', Alloc: NA };
  const AV = 'Alpha Wing (AW)', AVCAPS = 'ALPHA  WING (AW)', SUP = 'Support Office (SO)', PROP = 'Propulsion Cell (PC)';
  const rows = [
    // AW: spelled the usual way on three rows (so its label is that spelling), in capitals and a doubled space on the
    // rows of one item: one PMO by §4.4, whose own Not Allocated is $0.50M + $7.00M
    { ...B, 'CCaR No': 'XX0001', PMO: AV, 'Plan Event': 'Exec event', Date: '2025-10-15', Amount: '1000000', Alloc: EXEC },
    { ...B, 'CCaR No': 'XX0001', PMO: AV, 'Plan Event': 'Exec event', Date: '2025-11-15', Amount: '1000000', Alloc: EXEC },
    { ...B, 'CCaR No': 'XX0002', PMO: AV, 'Plan Event': 'Event lower', Date: '2026-03-10', Amount: '500000' },
    { ...B, 'CCaR No': 'XX0003', PMO: AVCAPS, 'Plan Event': 'Event caps', Date: '2026-03-12', Amount: '7000000' },
    // one plan event in May shared by SO (+$4M and -$4M: its part nets to $0) and PC (+$9M)
    { ...B, 'CCaR No': 'XX0004', PMO: SUP, 'Plan Event': 'Event shared', Date: '2026-05-15', Amount: '4000000' },
    { ...B, 'CCaR No': 'XX0004', PMO: SUP, 'Plan Event': 'Event shared', Date: '2026-05-20', Amount: '-4000000' },
    { ...B, 'CCaR No': 'XX0005', PMO: PROP, 'Plan Event': 'Event shared', Date: '2026-05-15', Amount: '9000000' },
    // an August item that is PC's money, named on SO only by a $0.00 row (the shape the review found)
    { ...B, 'CCaR No': 'XX0006', PMO: PROP, 'Plan Event': 'Event zero', Date: '2026-08-31', Amount: '4121007.35' },
    { ...B, 'CCaR No': 'XX0006', PMO: PROP, 'Plan Event': 'Event zero', Date: '2026-08-31', Amount: '88316.40' },
    { ...B, 'CCaR No': 'XX0007', PMO: SUP, 'Plan Event': 'Event zero', Date: '2026-08-31', Amount: '0.00' },
    // SO's own money: one item of $1.25M
    { ...B, 'CCaR No': 'XX0008', PMO: SUP, 'Plan Event': 'Event own', Date: '2026-06-10', Amount: '1250000' },
    // FY2027: SO +$3M and PC -$3M on one plan event in one month, so the item nets to $0 and is not in the full list,
    // while each PMO's own part is not $0: the FY must still be a choice when either PMO is chosen
    { ...B, FY: 2027, 'CCaR No': 'XX0010', PMO: SUP, 'Plan Event': 'Event offset', Date: '2026-07-10', Amount: '3000000' },
    { ...B, FY: 2027, 'CCaR No': 'XX0011', PMO: PROP, 'Plan Event': 'Event offset', Date: '2026-07-12', Amount: '-3000000' },
    // a row with no PMO: '(no PMO)' is a PMO like any other, whose key is the empty text (it must not read as "All")
    { ...B, 'CCaR No': 'XX0009', PMO: '  ', 'Plan Event': 'Event blank', Date: '2026-07-10', Amount: '2000000' },
  ];
  // each PMO's own Not Allocated, from the rows above: what its PMO tab lists (§5: "PMO blocks list only that PMO's items")
  const NOPMO = '(no PMO)';
  const OWN = { [AV]: dollars('7500000'), [SUP]: dollars('1250000') + dollars('3000000'),
    [PROP]: dollars('9000000') + dollars('4121007.35') + dollars('88316.40') - dollars('3000000'), [NOPMO]: dollars('2000000') };
  // every item: the shared one nets to PC's $9M; the $0 row adds nothing; the FY2027 one nets to $0 and is left out
  const ALL = OWN[AV] + OWN[PROP] + OWN[SUP] + OWN[NOPMO];
  const T = boot();
  await T.imp([['O&M Raw Data.csv', rows]], { asOf: '2026-03' });
  T.click('button[data-act=view][data-v=na]');
  const sel = () => T.doc.querySelector('select[data-act=naf][data-f=pmo]');
  const count = () => { const p = T.main().querySelector('p.count'); return p ? p.textContent : ''; };
  const sumRows = () => [...T.main().querySelectorAll('table.na tbody td[data-c]')].reduce((s, td) => s + Number(td.getAttribute('data-c')), 0);
  const pmoCells = () => [...T.main().querySelectorAll('table.na tbody tr')].map(tr => tr.children[6] && tr.children[6].textContent);
  C.chk('R2: the Not Allocated view is drawn with its PMO filter', !!sel(), T.main().innerHTML.slice(0, 200));
  const labels = [...sel().options].map(o => o.textContent);
  // in PMO order (§4.4: none of these is on SP.PMO_ORDER, so by label, '(no PMO)' last)
  C.eq('R2: the PMO filter lists each PMO once, by its label, whatever spellings its rows use (§4.4)', labels, ['All', AV, PROP, SUP, NOPMO]);
  C.chk('R2: no filter: every item, every dollar', sumRows() === ALL && count().includes('$' + mText(ALL) + 'M'), count() + ' / ' + sumRows());
  for (const pmo of [AV, SUP, PROP, NOPMO]) {
    const i = [...sel().options].findIndex(o => o.textContent === pmo);
    T.choose(sel(), sel().options[i].value);
    C.chk('R2: ' + pmo + ': the filter is still on it after the redraw', sel().options[sel().selectedIndex].textContent === pmo);
    C.chk('R2: ' + pmo + ': the filtered list adds to its own Not Allocated, as its PMO tab does', sumRows() === OWN[pmo],
      'rows add to ' + sumRows() + ', its own part is ' + OWN[pmo]);
    C.chk('R2: ' + pmo + ': the count line says its own dollars', count().includes('$' + mText(OWN[pmo]) + 'M'), count());
    C.chk('R2: ' + pmo + ': every row it lists names that PMO alone', pmoCells().length > 0 && pmoCells().every(c => SPnorm(c) === SPnorm(pmo)), JSON.stringify(pmoCells()));
  }
  // a PMO and an FY together: SO's FY2027 part, in a year the full list has no item for
  {
    const i = [...sel().options].findIndex(o => o.textContent === SUP);
    T.choose(sel(), sel().options[i].value);
    const fy = T.doc.querySelector('select[data-act=naf][data-f=fy]');
    const j = [...fy.options].findIndex(o => o.textContent === 'FY2027');
    C.chk('R2: FY2027 is a choice although its one item nets to $0 across PMOs', j > 0, [...fy.options].map(o => o.textContent).join(','));
    if (j > 0) {
      T.choose(fy, fy.options[j].value);
      C.chk('R2: ' + SUP + ' in FY2027 lists its own $3.00M', sumRows() === dollars('3000000') && count().includes('$3.00M'), count());
    }
    T.click('button[data-act=naclear]');
    C.chk('R2: Clear filters goes back to every item', sumRows() === ALL && sel().value === '', count());
  }
  // the engine's PMO tabs are the other half of "the two views agree": the same PMO's lists add to the same dollars
  const M = T.SP.buildModel(T.SP.state.pulls.current, T.SP.state.settings, T.SP.defaultView());
  for (const p of M.pmos) {
    const own = p.blocks.reduce((s, pb) => s + pb.na.reduce((x, it) => x + it.cents, 0), 0);
    C.chk('R2: ' + p.label + ': its PMO tab lists its own part', own === (OWN[p.label] || 0), own + ' vs ' + OWN[p.label]);
  }
  T.t.close();
}
function SPnorm(s) { return String(s ?? '').replace(/[\s ]+/g, ' ').trim().toLowerCase(); }

// =====================================================================================================================
// R3 — under a switch, what the switches do not reach is said beside it
// =====================================================================================================================
{
  const B = { 'CCaR No': 'XX0101', Title: 'Invented Title', PMO: 'Alpha Wing (AW)', 'Plan Event': 'Event one', Alloc: NA };
  const AF = 'USAF O&M Discretionary', NAVY = 'USN O&M Discretionary';
  const om = [
    { ...B, FY: 2026, Budget: AF, Date: '2025-11-10', Amount: '30000000', Alloc: EXEC },
    { ...B, FY: 2026, Budget: AF, Date: '2026-02-10', Amount: '20000000' },
    { ...B, FY: 2026, Budget: NAVY, Date: '2025-12-10', Amount: '8000000', Alloc: EXEC },
    { ...B, FY: 2026, Budget: NAVY, Date: '2026-04-10', Amount: '2000000' },
    // money before the first FY, both services; an unreadable amount on a USAF row
    { ...B, FY: 2024, Budget: AF, Date: '2024-01-10', Amount: '6000000' },
    { ...B, FY: 2024, Budget: NAVY, Date: '2024-01-10', Amount: '1000000' },
    { ...B, FY: 2026, Budget: AF, Date: '2026-01-10', Amount: 'about ten' },
  ];
  // a USAF row whose budget names no appropriation, on a sheet whose name names none either
  const other = [{ ...B, FY: 2026, Budget: 'USAF Mystery Line', Date: '2026-01-10', Amount: '4000000' }];
  const AUTH = dollars('500000000');
  const T = boot();
  await T.imp([['O&M Raw Data.csv', om], ['Export.csv', other]], { asOf: '2026-03', firstFY: 2025, authorized: { 'om|2026': AUTH } });
  const SP = T.SP;
  const view = SP.defaultView(); view.svc.USAF = false;
  const M = SP.buildModel(SP.state.pulls.current, SP.state.settings, view);
  const M0 = SP.buildModel(SP.state.pulls.current, SP.state.settings, SP.defaultView());
  const b = M.blocks.find(x => x.key === 'om|2026');
  C.chk('R3: with USAF off, O&M FY2026 Approved is the Navy rows only', b && b.approved === dollars('10000000'), b && b.approved);
  C.chk('R3: an entered Authorized stays as entered (§4.5)', b && b.authorized === AUTH && b.authorizedEntered === true);
  C.eq('R3: the mark beside Authorized: ‡ under a switch, nothing with every switch on, † where not entered',
    typeof SP.authMark !== 'function' ? 'SP.authMark is missing'
      : [SP.authMark(b, M), SP.authMark(M0.blocks.find(x => x.key === 'om|2026'), M0), SP.authMark(Object.assign({}, b, { authorizedEntered: false }), M)], ['‡', '', '†']);
  const N = M.summary.notes;
  const first = N[0] || '';
  C.chk('R3: the first note says what is shown', first.startsWith(M.shown.text), first);
  C.chk('R3: the first note does not claim every figure counts only these without naming the exceptions',
    !/Every figure counts only these\.$/.test(first) && first.includes('‡') && /every service and lane/.test(first), first);
  const bf = N.find(n => /^Money before FY2025/.test(n)), un = N.find(n => /names no appropriation/.test(n)), ur = N.find(n => /could not be read/.test(n));
  C.chk('R3: the before-first note is there and counts both services (USAF is off)', !!bf && bf.includes('$' + mText(dollars('7000000')) + 'M'), bf);
  for (const [what, n] of [['money before the first FY', bf], ['rows not identified', un], ['unreadable rows', ur]]) {
    C.chk('R3: the note on ' + what + ' says it covers every service and lane', !!n && /every service and lane/.test(n), n);
  }
  C.chk('R3: a note says the entered Authorized covers every service and lane, and is marked ‡',
    N.some(n => /^Authorized/.test(n) && n.includes('‡') && /O&M FY2026/.test(n) && /every service and lane/.test(n)), N.join(' / '));
  const N0 = M0.summary.notes.join('\n');
  C.chk('R3: with every switch on, no ‡ and no "every service and lane" caveat', !/‡|every service and lane/.test(N0), N0);
  // the screen: the mark beside the figure, on the Summary and the O&M view, the TOTAL too
  T.tick('input[data-act=svc][data-i="0"]', false);
  T.click('button[data-act=view][data-v=summary]');
  const authCell = sel => { const tr = T.main().querySelector(sel); return tr ? tr.querySelectorAll('td.n')[1] : null; };
  const rowCell = authCell('tr[data-bk="om|2026"]'), totCell = authCell('tr[data-bk="total"]');
  C.chk('R3: screen Summary: the entered Authorized is marked ‡', !!rowCell && rowCell.textContent.includes('‡') && Number(rowCell.getAttribute('data-c')) === AUTH, rowCell && rowCell.outerHTML);
  C.chk('R3: screen Summary: the TOTAL that adds it in is marked ‡', !!totCell && totCell.textContent.includes('‡'), totCell && totCell.outerHTML);
  T.click('button[data-act=view][data-v=om]');
  const apCell = authCell('tr[data-bk="om|2026"]');
  C.chk('R3: screen O&M view: the entered Authorized is marked ‡ and the mark is explained', !!apCell && apCell.textContent.includes('‡')
    && /‡[^<]*every service and lane/.test(T.main().textContent), apCell && apCell.outerHTML);
  T.click('button[data-act=view][data-v=help]');
  C.chk('R3: Help names what the switches do not reach', /‡/.test(T.main().textContent) && /every service and lane/.test(T.main().textContent));
  T.tick('input[data-act=svc][data-i="0"]', true);
  T.click('button[data-act=view][data-v=summary]');
  C.chk('R3: screen Summary with every switch on: no ‡', !T.main().textContent.includes('‡'));
  // the workbook: the same marks as a format on the number cell, so the cell is still the figure
  const spec = SP.excelSpec(M, SP.state.pulls.current, SP.state.settings, { today: '2026-04-15' });
  const sheet = name => spec.sheets.find(s => s.name === name);
  const fmtOf = c => (c && c.s && c.s.fmt) || '';
  const sm = sheet('Summary');
  const smRow = sm.rows.find(r => r.cells[1] && r.cells[1].v === 2026), smTot = sm.rows.find(r => r.cells[0] && r.cells[0].v === 'TOTAL - Sustainment');
  C.chk('R3: workbook Summary: the entered Authorized cell is the figure, its format marks ‡', !!smRow && smRow.cells[3].v === AUTH / 1e8 && fmtOf(smRow.cells[3]).includes('‡'), JSON.stringify(smRow && smRow.cells[3]));
  C.chk('R3: workbook Summary: the TOTAL Authorized is marked ‡', !!smTot && fmtOf(smTot.cells[3]).includes('‡'), JSON.stringify(smTot && smTot.cells[3]));
  const texts = sh => sh.rows.flatMap(r => r.cells.map(c => (c && typeof c.v === 'string' ? c.v : ''))).join('\n');
  C.chk('R3: workbook Summary: a legend line explains ‡', /^‡$/m.test(texts(sm)) && /every service and lane/.test(texts(sm)));
  const oms = sheet('O&M');
  const omRow = oms.rows.find(r => r.cells[0] && r.cells[0].v === 2026 && r.cells[2]);
  C.chk('R3: workbook O&M sheet: the entered Authorized is marked ‡, and the mark explained', !!omRow && fmtOf(omRow.cells[2]).includes('‡') && /‡/.test(texts(oms)) && /every service and lane/.test(texts(oms)),
    JSON.stringify(omRow && omRow.cells[2]));
  C.chk('R3: workbook Settings: the switches line names what they do not reach', !/every figure counts only what is shown\)/.test(texts(sheet('Settings'))), texts(sheet('Settings')).split('\n').filter(x => /Switches/.test(x)).join(' / '));
  const spec0 = SP.excelSpec(M0, SP.state.pulls.current, SP.state.settings, { today: '2026-04-15' });
  C.chk('R3: workbook with every switch on: no ‡ anywhere', !spec0.sheets.some(s => s.rows.some(r => r.cells.some(c => c && ((typeof c.v === 'string' && c.v.includes('‡')) || fmtOf(c).includes('‡'))))));
  T.t.close();
}

// =====================================================================================================================
// R5 — executed rows with no readable date
// =====================================================================================================================
{
  const B = { FY: 2026, 'CCaR No': 'XX0201', Title: 'Invented Title', Budget: 'USAF O&M Discretionary', PMO: 'Alpha Wing (AW)', 'Plan Event': 'Event one', Alloc: EXEC };
  const rows = [
    { ...B, Date: '2025-11-15', Amount: '4000000' },
    { ...B, Date: '', Amount: '3000000' },                  // a blank date
    { ...B, Date: '31/13/2026', Amount: '1000000' },        // a date that cannot be read
    { ...B, Date: '2026-05-15', Amount: '500000' },         // executed, dated after the as-of month
    { ...B, Date: '2026-06-15', Amount: '1500000', Alloc: NA },
  ];
  const T = boot();
  await T.imp([['O&M Raw Data.csv', rows]], { asOf: '2026-03' });
  const SP = T.SP;
  const M = SP.buildModel(SP.state.pulls.current, SP.state.settings, SP.defaultView());
  const b = M.blocks[0];
  C.eq('R5: the block counts its executed rows whatever their date (§4.5)', [b.approved, b.obligated], [dollars('10000000'), dollars('8500000')]);
  C.eq('R5: executed with no readable date: its dollars and rows', [b.execNoDate, b.execNoDateRows], [dollars('4000000'), 2]);
  C.eq('R5: the model adds them up', M.execNoDate, { cents: dollars('4000000'), rows: 2 });
  const asOfActual = Math.round(b.obl[M.asOfIndex].v * b.approved);
  C.chk('R5: headline obligated = actual through the as-of column + executed after it + executed with no date',
    b.obligated === asOfActual + b.execAfterAsOf + b.execNoDate, [b.obligated, asOfActual, b.execAfterAsOf, b.execNoDate].join(' '));
  const n = M.summary.notes.find(x => /no readable date|no date/i.test(x) && /Actual Execution/.test(x));
  C.chk('R5: a Summary note names the executed rows with no date, and their dollars', !!n && n.startsWith('2 rows marked Actual Execution ($' + mText(dollars('4000000')) + 'M)'), M.summary.notes.join(' / '));
  // the same identity on every block of the synthetic fixture, every PMO block too, at two as-of months
  const tmp = scratchDir('sfcbsp-mr-');
  const fx = join(tmp.dir, 'fx');
  mkdirSync(fx);
  const mk = spawnSync('python3', ['-I', join(HERE, 'fixture', 'make_fixture.py'), '--out', fx], { encoding: 'utf8' });
  if (mk.status !== 0) C.chk('R5: the fixture is made', false, mk.stderr.slice(-400));
  else {
    const buf = readFileSync(join(fx, 'pull-all.xlsx'));
    const parsed = await SP.parseFiles([{ name: 'pull-all.xlsx', data: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) }], { now: '2026-11-09T12:00:00Z' });
    const bad = [];
    for (const asOf of ['2026-10', '2026-03']) {
      const s = Object.assign(SP.defaultSettings('2026-11-09'), { asOf, firstFY: 2024 });
      const F = SP.buildModel(parsed.pulls, s, SP.defaultView());
      for (const x of F.blocks.concat(F.pmos.flatMap(p => p.blocks))) {
        if (!x.approved) continue;
        const act = Math.round(x.obl[F.asOfIndex].v * x.approved);
        if (x.obligated !== act + x.execAfterAsOf + x.execNoDate) bad.push(asOf + ' ' + x.key + ' ' + [x.obligated, act, x.execAfterAsOf, x.execNoDate].join('/'));
      }
    }
    C.chk('R5: on every fixture block the headline and the as-of column differ by exactly what the notes name', !bad.length, bad.slice(0, 4).join('; '));
  }
  tmp.rm();
  T.t.close();
}

// =====================================================================================================================
// R6 — an import replaces the last import's unidentified rows
// =====================================================================================================================
{
  const B = { FY: 2026, 'CCaR No': 'XX0301', Title: 'Invented Title', PMO: 'Alpha Wing (AW)', 'Plan Event': 'Event one', Date: '2026-01-10', Alloc: NA };
  const om1 = [{ ...B, Budget: 'USAF O&M Discretionary', Amount: '1000000' }];
  const lost = [{ ...B, Budget: 'Mystery Line', Amount: '850000' }, { ...B, Budget: 'Mystery Line', Amount: '150000' }];
  const T = boot();
  const SP = T.SP;
  await T.imp([['O&M Raw Data.csv', om1], ['Export.csv', lost]], { asOf: '2026-03' });
  const st = SP.state;
  C.chk('R6: the first import keeps its two unidentified rows apart', !!st.pulls.current.unidentified && st.pulls.current.unidentified.rows.length === 2);
  const notesOf = () => SP.buildModel(st.pulls.current, st.settings, SP.defaultView()).summary.notes.filter(n => /names no appropriation/.test(n));
  C.chk('R6: and the Summary names them', notesOf().length === 1 && notesOf()[0].startsWith('2 rows ($' + mText(dollars('1000000')) + 'M)'), notesOf().join(' / '));
  const om2 = [{ ...B, Budget: 'USAF O&M Discretionary', Amount: '2000000' }];
  await T.imp([['O&M Raw Data.csv', om2]], { asOf: '2026-03' });
  C.chk('R6: an import with none leaves no unidentified rows current', !st.pulls.current.unidentified || !st.pulls.current.unidentified.rows.length,
    st.pulls.current.unidentified && st.pulls.current.unidentified.rows.length);
  C.chk('R6: the Summary no longer names rows the Import report does not list', notesOf().length === 0, notesOf().join(' / '));
  const rl = SP.importReportLines(st.lastImport.report).filter(l => /not identified/i.test(l));
  C.eq('R6: (the Import report, the last import\'s, lists none)', rl, []);
  C.chk('R6: the rows it replaced are kept as the previous ones', !!st.pulls.previous.unidentified && st.pulls.previous.unidentified.rows.length === 2);
  await T.imp([['O&M Raw Data.csv', om2], ['Export.csv', lost.slice(0, 1)]], { asOf: '2026-03' });
  C.chk('R6: an import that has some replaces them with its own', st.pulls.current.unidentified && st.pulls.current.unidentified.rows.length === 1
    && notesOf().length === 1 && notesOf()[0].startsWith('1 row ($' + mText(dollars('850000')) + 'M)'), notesOf().join(' / '));
  T.t.close();
}

// =====================================================================================================================
// R7 — the Approved figure inside the Obligation % label and the PMO strip, the same on every product
// =====================================================================================================================
{
  const B = { FY: 2026, 'CCaR No': 'XX0401', Title: 'Invented Title', Budget: 'USAF O&M Discretionary', 'Plan Event': 'Event one', Date: '2026-01-10', Alloc: NA };
  const P = { zero: 'Zero Office (ZO)', neg: 'Negative Office (NO)', tiny: 'Tiny Office (TO)', big: 'Big Office (BO)' };
  const rows = [
    { ...B, PMO: P.zero, Amount: '1000000' }, { ...B, PMO: P.zero, Amount: '-1000000' },
    { ...B, PMO: P.neg, Amount: '-1234567890' },
    { ...B, PMO: P.tiny, Amount: '3000' },
    { ...B, PMO: P.big, Amount: '2718280000' },
  ];
  const WANT = { zero: '0.00', neg: '(1,234.57)', tiny: '<0.01', big: '2,718.28' };
  const T = boot();
  await T.imp([['O&M Raw Data.csv', rows]], { asOf: '2026-03' });
  const SP = T.SP, w = T.t.window;
  const M = SP.buildModel(SP.state.pulls.current, SP.state.settings, SP.defaultView());
  const spec = SP.excelSpec(M, SP.state.pulls.current, SP.state.settings, { today: '2026-04-15' });
  // the picture's layout, measured with a stand-in for the canvas (jsdom draws nothing): its text is what it would draw
  const ctx = { font: '', measureText: s => ({ width: String(s).length * 7 }) };
  for (const [k, label] of Object.entries(P)) {
    const p = M.pmos.find(x => x.label === label);
    const pb = p && p.blocks[0];
    if (!C.chk('R7: ' + k + ': the PMO block is there', !!pb)) continue;
    const want = 'Obligation %  (Approved ' + WANT[k] + 'M; actual through Mar, plan after)';
    const scr = decode((w.ui_band(M, pb).match(/>(Obligation %[^<]*)</) || [])[1] || '');
    const sh = spec.sheets.find(s => s.name === 'PMO ' + SP.pmoCode(label));
    const wb = sh && sh.rows.map(r => r.cells[0] && r.cells[0].v).find(v => typeof v === 'string' && v.startsWith('Obligation %'));
    const pic = (w.pic_layout(ctx, pb, M).rows.find(r => r.kind === 'band' && /^Obligation %/.test(r.cells[0].t)) || { cells: [{}] }).cells[0].t;
    C.eq('R7: ' + k + ': the Obligation % label on the screen, the workbook and the picture', [scr, wb, pic], [want, want, want]);
    // the PMO strip: screen and workbook
    const strip = pb.apLabel + ' FY' + pb.fy + ' Summary  |  Approved ' + WANT[k] + 'M  |  Authorized ' + WANT[k] + 'M  |  Obligated 0.00M  |  Unobligated ' + WANT[k] + 'M';
    T.click('button[data-act=view][data-v=pmos]');
    const ps = T.doc.querySelector('select[data-act=pmo]');
    const i = [...ps.options].findIndex(o => o.textContent === label);
    T.choose(ps, ps.options[i].value);
    const sStrip = decode((T.main().querySelector('tr.strip td') || {}).innerHTML || '').replace(/ {2,}\| {2,}/g, '  |  ');
    const wStrip = sh && sh.rows.map(r => r.cells[0] && r.cells[0].v).find(v => typeof v === 'string' && / Summary {2}\| {2}Approved /.test(v));
    C.eq('R7: ' + k + ': the PMO strip on the screen and in the workbook', [sStrip, wStrip], [strip, strip]);
  }
  T.t.close();
}

C.done();
