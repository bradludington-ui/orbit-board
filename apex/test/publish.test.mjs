// Publish spend plan (CONTRACT §33): the unfunded list's reader, the documents' figures, their pages, the PDF bytes, what
// the plan saves and the page itself. Every expectation is worked by hand from the small invented plan and the invented
// UFR tracker below; nothing here is read back from the code under test.
//
//   node apex/test/publish.test.mjs
process.env.TZ = 'America/New_York';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadTool, pageHtml, checks, scratchDir } from './harness.mjs';

const C = checks('publish');
const J = x => JSON.stringify(x);
const settle = (ms = 20) => new Promise(res => setTimeout(res, ms));
const NOW = '2026-11-09T12:00:00.000Z';
const HEADERS = ['FY', 'Month', 'CCaR No', 'Title', 'Budget', 'C/L', 'SB', 'Plan Event', 'Date', 'Amount', 'Alloc', 'Event Description',
  'OPR', 'PMT PID#', 'Contracting POC', 'Material Lead', 'PM/TPOC', 'Obligation Category', 'PMO', 'Sub-PMO', 'Category', 'Navy SI Code',
  'IPT', 'Spares WBS', 'Quantity', 'CLINs', 'AF EEIC', 'RCN', 'PSR', 'CSR', 'Contract Mod', 'Cost Element'];   // CONTRACT §2, restated
const q = v => { const s = v === undefined || v === null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = rows => [HEADERS.join(',')].concat(rows.map(o => HEADERS.map(h => q(o[h])).join(','))).join('\n');
const EX = 'Actual Execution is allocated', NA = 'Not Allocated';
const AV = 'Air Vehicle (AV)', PP = 'Propulsion (PP)';
const row = (FY, ccar, Title, Budget, pe, Date, Amount, Alloc, PMO) => ({ FY, 'CCaR No': ccar, Title, Budget, 'Plan Event': pe, Date, Amount, Alloc, PMO });
// budgets that name each service by the import's own rule (§3)
const B = { usaf: 'USAF O&M- Tessa Base Discretionary', ang: 'USAF ANG O&M Tessa', stovl: 'USN STOVL O&M Tessa', usn: 'USN CV O&M Tessa', sp: 'USAF APN Spares Tessa Base Initial' };
// THE PLAN (Data through Oct-2026; JSF6654 is a Special CCaR by default):
//   O&M FY2027  JSF6654 Prime Alpha   AV: USAF 3,000,000.40 awarded 15 Oct 2026;  PP: USN 1,000,000.00 planned 10 Mar 2027
//               TS0002  Tessa B       AV: USAF 5,000,000 planned 20 Oct 2026; ANG 500,000.60 awarded 5 Oct 2026; USAF 250,000 no date
//                                     (two days of one month: its award dates are Oct-2026 once, then No date)
//               TS0007  Garnet Rework PP: STOVL 700,000 planned 1 Dec 2026
//   O&M FY2026  TS0003  Tessa C       AV: USAF 2,000,000 awarded 1 Dec 2025
//   Spares FY2027 TS0005 Tessa E      PP: USAF 1,000,000 planned 1 Jun 2027
const OM = [
  row(2027, 'JSF6654', 'Prime Alpha', B.usaf, 'P1', '2026-10-15', '3000000.40', EX, AV),
  row(2027, 'JSF6654', 'Prime Alpha', B.usn, 'P2', '2027-03-10', '1000000', NA, PP),
  row(2027, 'TS0002', 'Tessa B', B.usaf, 'T2a', '2026-10-20', '5000000', NA, AV),
  row(2027, 'TS0002', 'Tessa B', B.ang, 'T2b', '2026-10-05', '500000.60', EX, AV),
  row(2027, 'TS0002', 'Tessa B', B.usaf, 'T2c', '', '250000', NA, AV),
  row(2027, 'TS0007', 'Garnet Rework', B.stovl, 'T7', '2026-12-01', '700000', NA, PP),
  row(2026, 'TS0003', 'Tessa C', B.usaf, 'T3', '2025-12-01', '2000000', EX, AV),
];
const SPR = [row(2027, 'TS0005', 'Tessa E', B.sp, 'T5', '2027-06-01', '1000000', NA, PP)];
// THE UNFUNDED LIST, FY2027, O&M, in $K:
//   1 Prime Alpha   AV                JSF6654  USAF 2,000  STOVL 500             -> under Prime Contracts
//   2 Tessa B       Air Vehicle (AV)  TS0002   ANG 300
//   3 New thing     PP                TS0099   USN CV 400                         -> no plan event: Approved $0
//   4 Garnet Rework AV                TS0007   USAF 100                           -> the plan has TS0007 under PP: placed under AV, flagged
const c7 = o => { const a = [0, 0, 0, 0, 0, 0, 0]; for (const k of Object.keys(o)) a[Number(k)] = o[k]; return a; };
const D$ = d => Math.round(d * 100);
const fig = (app, obl, ufr) => ({ required: app + ufr, approved: app, obligated: obl, remaining: app - obl, delta: -ufr });

// the tracker as a real workbook, laid out as Brad's is: a title line, the posture rows, the heading row on row 9 of O&M
// and row 8 of OPN, a TOTALS row, and tabs the reader must leave alone
const PY = `
import sys
from openpyxl import Workbook
wb = Workbook()
s = wb.active; s.title = 'SUMMARY'; s['A1'] = 'FY2027 UFR summary'
om = wb.create_sheet('O&M')
om['A1'] = 'FY2027  UNFUNDED REQUIREMENTS (UFR) TRACKER  —  Operations & Maintenance (O&M)'
om.append([None, 'FY26 FUNDING POSTURE', None, None, None, 'USAF', 'ANG', 'AFRC', 'STOVL', 'USMC CV', 'USN CV', 'Total Amount ($K)'])
for lab in ['Funds Available ($K):', 'Total UFRs ($K):', 'Exec-Ready ($K):', 'SFCB Approved ($K):', 'Declining Balance ($K):']: om.append([None, lab])
om.append([])
om.append(['Rank', 'Requirement Title', 'PMO', 'CCaR\\nRecord', 'Total Amount ($K)', 'USAF', 'ANG', 'AFRC', 'STOVL', 'USMC CV', 'USN CV', 'Funding Status', 'Exec\\nReady?', 'SFCB Action'])
om.append([1, 'Prime Alpha', 'AV', 'JSF6654', 2500, 2000, None, None, 500, None, None, 'Pending', 'Yes', 'Approved 12 Nov'])
om.append([2, 'Tessa B', 'Air Vehicle (AV)', 'TS0002', 300, None, 300, None, None, None, None, 'Unfunded', 'No', ''])
om.append([])
om.append([3, 'New thing', 'PP', 'TS0099', 400, None, None, None, None, None, 400, 'Unfunded', 'Yes', ''])
om.append([4, 'Garnet Rework', 'AV', 'TS0007', 100, 100, '-', None, None, None, None, 'Unfunded', 'Yes', 'Deferred'])
om.append([None, 'TOTALS', None, None, 3300, 2100, 300, 0, 500, 0, 400])
om.append([9, 'Below the totals row', 'AV', 'TS9', 1, 1])
opn = wb.create_sheet('OPN')
opn['A1'] = 'FY2027  UNFUNDED REQUIREMENTS (UFR) TRACKER  —  Other Procurement, Navy (OPN)'
for lab in ['Funds Available ($K):', 'Total UFRs ($K):', 'Exec-Ready ($K):', 'SFCB Approved ($K):', 'Declining Balance ($K):']: opn.append([None, lab])
opn.append([])
opn.append(['Rank', 'Requirement Title', 'PMO', 'CCaR Record', 'Total Amount\\n($K)', 'USAF', 'STOVL', 'USMC CV', 'USN CV', 'Funding Status', 'Exec\\nReady?', 'SFCB Action'])
opn.append([1, 'Navy item', 'PP', 'TS0200', 12.3456, None, None, None, 12.3456, 'Unfunded', 'Yes', ''])
opn.append([2, 'Sum is off', 'PP', 'TS0201', 50, 10, 20, None, None, '', '', ''])
opn.append([3, 'Total only', 'PP', 'TS0202', 7, None, None, None, None, '', '', ''])
opn.append([4, 'Bad cell', 'PP', '', 0, 'TBD', None, None, None, '', '', ''])
opn.append([None, 'TOTALS', None, None, 99])
m = wb.create_sheet('MASTER'); m['A1'] = 'Requirement Title'; m['B1'] = 'CCaR Record'
wb.save(sys.argv[1])
`;

const tmp = scratchDir('apex-publish-');
let failed = null;
try {
  writeFileSync(join(tmp.dir, 'mk.py'), PY);
  execFileSync('python3', [join(tmp.dir, 'mk.py'), join(tmp.dir, 'ufr.xlsx')]);
  const t = loadTool({ modules: ['util', 'xlsx-read', 'import', 'engine', 'publish', 'pdf', 'xlsx-write', 'store'] });
  const SP = t.SP;

  // ---------------------------------------------------------------- §33.1 the unfunded list's reader
  const wb = await SP.readXlsx(new Uint8Array(readFileSync(join(tmp.dir, 'ufr.xlsx'))));
  const U = SP.readUfr(wb, 'UFR Tracker FY27.xlsx');
  C.chk('the tracker is read', U.ok === true, J(U.why));
  C.eq('its fiscal year, from the title line', U.fy, 2027);
  C.eq('its unit, from the Total Amount heading', U.unit, 1000);
  C.eq('the O&M and OPN tabs are read, in the tool’s order', J(U.tabs), J([{ ap: 'om', sheet: 'O&M', lines: 4, cents: D$(3300000) }, { ap: 'opn', sheet: 'OPN', lines: 4, cents: D$(12345.6 + 30000 + 7000) }]));
  C.eq('SUMMARY and MASTER are left alone', J(U.ignored), J(['SUMMARY', 'MASTER']));
  const L = U.lines;
  C.eq('eight lines: the blank row is skipped and nothing under TOTALS is read', L.length, 8);
  C.eq('line 1: $K to whole cents by service (USAF 2,000 and STOVL 500), the heading with a line break still read',
    J([L[0].ap, L[0].fy, L[0].rank, L[0].title, L[0].pmo, L[0].ccar, L[0].cents, L[0].total, L[0].status, L[0].exec, L[0].sfcb]),
    J(['om', 2027, '1', 'Prime Alpha', 'AV', 'JSF6654', c7({ 0: D$(2000000), 3: D$(500000) }), D$(2500000), 'Pending', 'Yes', 'Approved 12 Nov']));
  C.eq('line 2: ANG is its own column on O&M', J(L[1].cents), J(c7({ 1: D$(300000) })));
  C.eq('line 3: USN CV', J(L[2].cents), J(c7({ 5: D$(400000) })));
  C.eq('line 4: a dash in a service cell is nothing', J(L[3].cents), J(c7({ 0: D$(100000) })));
  C.eq('OPN has no ANG or AFRC column: USN CV is still USN, and 12.3456 ($K) is $12,345.60', J(L[4].cents), J(c7({ 5: 1234560 })));
  C.eq('services that do not add to Total Amount: the services are used', J([L[5].cents, L[5].total]), J([c7({ 0: D$(10000), 3: D$(20000) }), D$(30000)]));
  C.eq('a Total Amount with nothing under any service goes under “Service not identified”', J([L[6].cents, L[6].total]), J([c7({ 6: D$(7000) }), D$(7000)]));
  C.eq('a cell that is not an amount counts as $0', J(L[7].cents), J(c7({})));
  const noteHas = re => U.notes.some(n => re.test(n));
  C.chk('note: the services add to another figure than Total Amount', noteHas(/OPN row 10: the services add to \$30,000\.00, its Total Amount says \$50,000\.00; the services are used/), J(U.notes));
  C.chk('note: the amount under no service', noteHas(/OPN row 11: \$7,000\.00 is in Total Amount with nothing under any service/), J(U.notes));
  C.chk('note: the cell that is not an amount, by tab and row', noteHas(/OPN row 12: the USAF cell is not an amount; it is counted as \$0/), J(U.notes));
  C.chk('note: a line with no CCaR Record', noteHas(/OPN row 12 \(“Bad cell”\) has no CCaR Record/), J(U.notes));
  C.chk('note: the TOTALS row that disagrees with its lines', noteHas(/OPN: its TOTALS row says \$99,000\.00, its lines add to \$49,345\.60/), J(U.notes));
  C.eq('the O&M tab, which ties, raises no note', U.notes.filter(n => /^O&M/.test(n)).length, 0);
  // refusals: a file is taken whole or not at all
  const sheet = (name, title, head, rows) => ({ name, rows: [[title], [], head].concat(rows), rowNo: null });
  const H = ['Rank', 'Requirement Title', 'PMO', 'CCaR Record', 'Total Amount ($K)', 'USAF'];
  const T27 = 'FY2027 UNFUNDED REQUIREMENTS (UFR) TRACKER — Full Fund Support', T28 = 'FY2028 UNFUNDED REQUIREMENTS (UFR) TRACKER — Initial Spares';
  const ref = (s, re, what) => { const r = SP.readUfr({ sheets: s }, 'x.xlsx'); C.chk('refused: ' + what, r.ok === false && re.test(r.why), J(r)); };
  ref([sheet('Full Fund', T27, H, []), sheet('Initial Spares', T28, H, [])], /different fiscal years \(FY2027 and FY2028\)/, 'tabs of two fiscal years');
  ref([sheet('Full Fund', T27, ['Rank', 'Requirement Title', 'CCaR Record', 'USAF'], [])], /“Full Fund” tab has no PMO column/, 'a tab with no PMO column');
  ref([sheet('Full Fund', T27, ['Rank', 'Requirement Title', 'PMO', 'CCaR Record'], [])], /has no service column/, 'a tab with no service column');
  ref([sheet('Full Fund', T27, H, []), sheet('FF', T27, H, [])], /two tabs are for Full Fund/, 'two tabs for one appropriation');
  ref([sheet('Full Fund', T27, ['Something else'], [])], /no heading row naming Requirement Title and CCaR Record/, 'a tracker tab with no heading row');
  ref([{ name: 'Sheet1', rows: [['hello']] }], /no tab in it is a UFR tracker tab/, 'a workbook with no tracker tab');
  const dollars = SP.readUfr({ sheets: [sheet('Sheet7', T27, ['Requirement Title', 'PMO', 'CCaR Record', 'USAF'], [['A thing', 'AV', 'TS1', '1,234.56'], ['B thing', 'AV', 'TS2', '(5)']])] }, 'd.xlsx');
  C.eq('a tab found by its title (Full Fund), with no unit named: amounts are dollars; text figures and parentheses are read',
    J([dollars.ok && dollars.tabs[0].ap, dollars.unit, dollars.lines.map(l => l.cents[0])]), J(['ff', 1, [123456, -500]]));

  // ---------------------------------------------------------------- §33.2 the documents' figures
  SP.storeInit();
  SP.applyImport(await SP.parseFiles([{ name: 'om.csv', data: csv(OM) }, { name: 'sp.csv', data: csv(SPR) }], { now: NOW }));
  SP.setSettings({ asOf: '2026-10' });
  const model = () => SP.buildModel(SP.state.pulls.current, SP.state.settings, SP.defaultView(), null);
  const M = model();
  const omOnly = { ok: true, fy: 2027, name: 'UFR Tracker FY27.xlsx', unit: 1000, tabs: U.tabs.slice(0, 1), lines: L.slice(0, 4), notes: [], ignored: [] };
  const old = { 2024: { fy: 2024, name: 'old.xlsx', lines: [Object.assign({}, L[0], { fy: 2024 })] } };
  const ufr = Object.assign({ 2027: omOnly }, old);
  const pub = { desc: { jsf6654: 'The prime contract' } };
  const D = SP.publishData(M, ufr, pub, { settings: SP.state.settings });
  C.eq('one document per appropriation with data, then one per PMO, in the tool’s order',
    J(D.docs.map(d => [d.id, d.file])), J([['ap:om', 'APEX Spend Plan - O&M.pdf'], ['ap:sp', 'APEX Spend Plan - Initial Spares.pdf'],
      ['pmo:air vehicle (av)', 'APEX Spend Plan - PMO AV.pdf'], ['pmo:propulsion (pp)', 'APEX Spend Plan - PMO PP.pdf']]));
  C.eq('the fiscal years on offer', J([D.fys, D.allFys]), J([[2026, 2027], [2026, 2027]]));
  const doc = id => D.docs.find(d => d.id === id);
  const secOf = (d, ap, fy) => d.sections.find(s => s.ap === ap && s.fy === fy);
  const shape = s => s.groups.map(g => [g.label, g.records.map(r => [r.title, r.ccar, r.total, r.dates, r.ufrOnly])]);
  const om = doc('ap:om');
  C.eq('the O&M document: each fiscal year its own section, earliest first', J(om.sections.map(s => [s.ap, s.fy, s.n])), J([['om', 2026, 1], ['om', 2027, 5]]));
  const A_PRIME = D$(3000000.40) + D$(1000000), A_TB = D$(5000000) + D$(500000.60) + D$(250000);
  C.eq('an award date is its month, written Dec-2025', J(secOf(om, 'om', 2026).groups[0].records[0].dates), J(['Dec-2025']));
  C.eq('O&M FY2027: Prime Contracts first (the prime over both PMOs), then each PMO; Required = Approved + unfunded, Delta = Approved - Required',
    J(shape(secOf(om, 'om', 2027))), J([
      ['Prime Contracts', [['Prime Alpha', 'JSF6654', fig(A_PRIME, D$(3000000.40), D$(2500000)), ['Oct-2026', 'Mar-2027'], false]]],
      [AV, [['Garnet Rework', 'TS0007', fig(0, 0, D$(100000)), [], true],
        ['Tessa B', 'TS0002', fig(A_TB, D$(500000.60), D$(300000)), ['Oct-2026', 'No date'], false]]],
      [PP, [['Garnet Rework', 'TS0007', fig(D$(700000), 0, 0), ['Dec-2026'], false],
        ['New thing', 'TS0099', fig(0, 0, D$(400000)), [], true]]]]));
  const prime = secOf(om, 'om', 2027).groups[0].records[0];
  // §33.10 a record's plan event titles, in the order they fall: what its description is until one is typed
  C.eq('the prime’s plan events, earliest first, over both PMOs', J(prime.events), J(['P1', 'P2']));
  C.eq('Tessa B’s: by date (5 Oct, then 20 Oct), the one with no date last', J(secOf(om, 'om', 2027).groups[1].records[1].events), J(['T2b', 'T2a', 'T2c']));
  C.eq('a record that is only on the unfunded list has none', J(secOf(om, 'om', 2027).groups[1].records[0].events), J([]));
  C.eq('the prime, by service: USAF, ANG, AFRC, STOVL, USMC CV, USN',
    J(prime.svc), J([fig(D$(3000000.40), D$(3000000.40), D$(2000000)), fig(0, 0, 0), fig(0, 0, 0), fig(0, 0, D$(500000)), fig(0, 0, 0), fig(D$(1000000), 0, 0)]));
  C.eq('its description is the one saved for its CCaR number', prime.desc, 'The prime contract');
  const tb = secOf(om, 'om', 2027).groups[1].records[1];
  C.eq('Tessa B, by service', J(tb.svc.slice(0, 2)), J([fig(D$(5250000), 0, 0), fig(D$(500000.60), D$(500000.60), D$(300000))]));
  const SEC_A = A_PRIME + A_TB + D$(700000), SEC_U = D$(2500000 + 300000 + 400000 + 100000);
  C.eq('the section’s totals are its records added', J(secOf(om, 'om', 2027).total), J(fig(SEC_A, D$(3000000.40) + D$(500000.60), SEC_U)));
  C.eq('and by service', J(secOf(om, 'om', 2027).svc.map(f => f.required)),
    J([D$(3000000.40) + D$(5250000) + D$(2000000) + D$(100000), D$(500000.60) + D$(300000), 0, D$(700000) + D$(500000), 0, D$(1000000) + D$(400000)]));
  C.eq('Approved over the section is the block’s own plan', secOf(om, 'om', 2027).total.approved, M.blocks.find(b => b.key === 'om|2027').rows.reduce((n, r) => n + r.cents, 0));
  C.eq('the O&M stoplight: its blocks, as the Summary has them', J(om.stoplight.rows.map(r => [r.fy, r.approved, r.obligated, r.status])),
    J(M.blocks.filter(b => b.ap === 'om').map(r => [r.fy, r.approved, r.obligated, r.status])));
  C.eq('and each PMO’s rows of O&M', J(om.stoplight.pmoRows.map(r => [r.pmoLabel, r.fy, r.approved])),
    J([[AV, 2026, D$(2000000)], [AV, 2027, D$(3000000.40) + A_TB], [PP, 2027, D$(1700000)]]));
  C.eq('the O&M unfunded list: its four lines, by rank', J(om.ufr.map(l => [l.rank, l.ccar, l.pmoLabel, l.total])),
    J([['1', 'JSF6654', AV, D$(2500000)], ['2', 'TS0002', AV, D$(300000)], ['3', 'TS0099', PP, D$(400000)], ['4', 'TS0007', AV, D$(100000)]]));
  // a PMO's document holds that PMO's data and nobody else's
  const av = doc('pmo:air vehicle (av)'), pp = doc('pmo:propulsion (pp)');
  C.eq('in a PMO’s document the prime lists that PMO’s plan events only', J([secOf(av, 'om', 2027).groups[0].records[0].events, secOf(pp, 'om', 2027).groups[0].records[0].events]), J([['P1'], ['P2']]));
  // §33.9 the colour down the left side: Prime Contracts its own, each PMO its own, the same in every document
  const cols = d => d.sections.flatMap(x => x.groups.map(g => g.label + ' ' + g.color));
  C.eq('O&M: Prime Contracts, Air Vehicle and Propulsion each have their own colour', J([...new Set(cols(om))]), J(['Air Vehicle (AV) #B9D7B0', 'Prime Contracts #8EAADB', 'Propulsion (PP) #E9B9C4']));
  C.eq('and a PMO’s own document uses the same ones', J([[...new Set(cols(av))], [...new Set(cols(pp))]]), J([['Air Vehicle (AV) #B9D7B0', 'Prime Contracts #8EAADB'], ['Prime Contracts #8EAADB', 'Propulsion (PP) #E9B9C4']]));
  C.eq('the seven PMOs the tool knows and Prime Contracts are eight different colours, fixed by the tool’s list',
    new Set(SP.PMO_ORDER.map(n => SP.publishColor(SP.normKey(n), false)).concat([SP.publishColor('', true)])).size, 8);
  C.chk('a PMO the tool does not know has a colour by its name: the same each time, however it is spelled, and none of those eight',
    SP.publishColor('Mystery Office', false) === SP.publishColor(' mystery  office ', false) && !SP.PMO_ORDER.map(n => SP.publishColor(n, false)).concat([SP.publishColor('', true)]).includes(SP.publishColor('Mystery Office', false)));
  const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  C.chk('the black label reads on every one of them (7:1 or better)', SP.PMO_ORDER.map(n => SP.publishColor(n, false)).concat([SP.publishColor('', true), SP.publishColor('a', false), SP.publishColor('b', false), SP.publishColor('c', false), SP.publishColor('d', false)])
    .every(h => (lum(h) + 0.05) / 0.05 >= 7));
  C.eq('the AV document: O&M FY2026 and FY2027', J(av.sections.map(s => [s.ap, s.fy])), J([['om', 2026], ['om', 2027]]));
  C.eq('AV, O&M FY2027: its share of the prime (with the unfunded line that names AV), then its own records',
    J(shape(secOf(av, 'om', 2027))), J([
      ['Prime Contracts', [['Prime Alpha', 'JSF6654', fig(D$(3000000.40), D$(3000000.40), D$(2500000)), ['Oct-2026'], false]]],
      [AV, [['Garnet Rework', 'TS0007', fig(0, 0, D$(100000)), [], true], ['Tessa B', 'TS0002', fig(A_TB, D$(500000.60), D$(300000)), ['Oct-2026', 'No date'], false]]]]));
  C.eq('PP: O&M FY2027 then Initial Spares FY2027; its share of the prime carries no unfunded amount',
    J(pp.sections.map(s => [s.ap, s.fy, shape(s)])), J([
      ['om', 2027, [['Prime Contracts', [['Prime Alpha', 'JSF6654', fig(D$(1000000), 0, 0), ['Mar-2027'], false]]],
        [PP, [['Garnet Rework', 'TS0007', fig(D$(700000), 0, 0), ['Dec-2026'], false], ['New thing', 'TS0099', fig(0, 0, D$(400000)), [], true]]]]],
      ['sp', 2027, [[PP, [['Tessa E', 'TS0005', fig(D$(1000000), 0, 0), ['Jun-2027'], false]]]]]]));
  C.eq('a PMO’s unfunded list is its own lines', J([av.ufr.map(l => l.rank), pp.ufr.map(l => l.rank)]), J([['1', '2', '4'], ['3']]));
  C.eq('a PMO’s stoplight is its own rows, by appropriation then year', J(pp.stoplight.rows.map(r => [r.ap, r.fy, r.approved])), J([['om', 2027, D$(1700000)], ['sp', 2027, D$(1000000)]]));
  C.eq('the two PMOs’ sections of O&M FY2027 add to the appropriation’s', secOf(av, 'om', 2027).total.required + secOf(pp, 'om', 2027).total.required, secOf(om, 'om', 2027).total.required);
  C.eq('three things to check: the record with no plan event, and the PMO that differs (which also has no plan event there)', D.flags.length, 3);
  C.chk('flag: no plan event carries the CCaR record', D.flags.some(f => /New thing.*CCaR TS0099.*no plan event.*Approved \$0/.test(f)), J(D.flags));
  C.chk('flag: the unfunded list and the spend plan name different PMOs', D.flags.some(f => /Garnet Rework.*unfunded list says Air Vehicle \(AV\), the spend plan has that CCaR record under Propulsion \(PP\)/.test(f)), J(D.flags));
  C.eq('a line of a year before First FY is not shown, and is counted', J(D.ufrSkipped), J([{ ap: 'om', fy: 2024, n: 1 }]));
  C.eq('every CCaR record once, for the Descriptions list', J(D.records.map(r => [r.ccar, r.title, r.desc])),
    J([['TS0007', 'Garnet Rework', ''], ['TS0099', 'New thing', ''], ['JSF6654', 'Prime Alpha', 'The prime contract'], ['TS0002', 'Tessa B', ''], ['TS0003', 'Tessa C', ''], ['TS0005', 'Tessa E', '']]));
  C.eq('descriptions missing, per document', J(D.docs.map(d => d.missing)), J([4, 1, 3, 3]));
  // one fiscal year only
  const D27 = SP.publishData(M, ufr, pub, { fys: [2027], settings: SP.state.settings });
  C.eq('FY2027 alone: FY2026 is in no section and no stoplight', J(D27.docs.map(d => [d.id, d.sections.map(s => s.fy), d.stoplight.rows.map(r => r.fy)])),
    J([['ap:om', [2027], [2027]], ['ap:sp', [2027], [2027]], ['pmo:air vehicle (av)', [2027], [2027]], ['pmo:propulsion (pp)', [2027, 2027], [2027, 2027]]]));
  // no unfunded list: Required is Approved
  const D0 = SP.publishData(M, null, null, {});
  C.chk('with no unfunded list, Required equals Approved on every record and Delta is zero',
    D0.docs.every(d => d.sections.every(s => s.groups.every(g => g.records.every(r => r.total.required === r.total.approved && r.total.delta === 0)))) && D0.docs.every(d => d.ufr.length === 0));
  // a PMO the tool does not know
  const odd = SP.publishData(M, { 2027: { fy: 2027, lines: [Object.assign({}, L[1], { pmo: 'Mystery Office' }), Object.assign({}, L[2], { pmo: 'Mystery Office' })] } }, null, {});
  C.chk('an unknown PMO on a record the plan has under one PMO is placed there', odd.flags.some(f => /Tessa B.*“Mystery Office” is not one APEX knows; it is placed under Air Vehicle \(AV\)/.test(f)), J(odd.flags));
  C.chk('an unknown PMO on a record the plan does not have is listed under its own name, with a document',
    odd.flags.some(f => /New thing.*listed under that name/.test(f)) && odd.docs.some(d => d.kind === 'pmo' && d.label === 'Mystery Office'), J(odd.docs.map(d => d.label)));

  // ---------------------------------------------------------------- §33.5 the PDF writer's measures
  C.eq('a width from the font’s table: four digits at 10 pt', SP.pdfTextWidth('1234', 10, false), 22.24);
  C.eq('bold is its own table', SP.pdfTextWidth('Total', 10, true), (611 + 611 + 333 + 556 + 278) / 100);
  C.eq('wrap on spaces', J(SP.pdfWrap('alpha beta gamma delta', 10, false, 60)), J(['alpha beta', 'gamma delta']));
  C.eq('a word wider than the line is broken, never run past it', J(SP.pdfWrap('ABCDEFGHIJ', 10, false, 30)), J(['ABCD', 'EFGH', 'IJ']));
  C.eq('what does not fit is cut, and says so', J(SP.pdfWrap('alpha beta gamma delta epsilon', 10, false, 60, 2)), J(['alpha beta', 'gamma del...']));
  C.eq('whole dollars: rounded from cents, commas, parentheses, a dash for zero', J([SP.fmtWhole(123456789), SP.fmtWhole(-250000000), SP.fmtWhole(0), SP.fmtWhole(49), SP.fmtWhole(50)]),
    J(['1,234,568', '(2,500,000)', '-', '-', '1']));

  // ---------------------------------------------------------------- §33.4 the pages
  const jpg = new Uint8Array(execFileSync('python3', ['-c', 'import sys,io\nfrom PIL import Image\nb=io.BytesIO(); Image.new("RGB",(40,20),(10,90,160)).save(b,"JPEG"); sys.stdout.buffer.write(b.getvalue())']));
  C.eq('a JPEG’s size is read from its frame header', J(SP.jpegInfo(jpg)), J({ w: 40, h: 20, n: 3 }));
  C.eq('and anything else is not a JPEG', SP.jpegInfo(new Uint8Array([1, 2, 3, 4])), null);
  const ctx = { program: 'Tessa Program', fm: { om: 'O. Lead', sp: 'S. Lead' }, asOfLabel: M.asOfLabel, today: '2026-11-17', uploaded: 'Data uploaded 9 Nov 2026.', emblem: jpg, model: M, bae: false,
    ufrFiles: [{ fy: 2027, name: 'UFR Tracker FY27.xlsx', day: '2026-11-14' }] };
  const P = SP.publishPages(om, ctx);
  const texts = p => p.ops.filter(o => o.t === 'text').map(o => o.s);
  const has = (p, s) => texts(p).includes(s);
  const all = p => texts(p).join(' ');     // a label that wraps in its cell is read across its lines
  C.eq('O&M: a stoplight page, a page per fiscal year, the unfunded list', P.pages.length, 4);
  C.chk('every page is letter, landscape', P.pages.every(p => p.w === 792 && p.h === 612));
  C.chk('every page carries the CUI marking top and bottom', P.pages.every(p => p.ops.filter(o => o.t === 'text' && o.s === SP.CUI && o.align === 'c' && (o.y === 15 || o.y === 603)).length === 2));
  C.eq('every page says which page it is, and whose', J(P.pages.map(p => [texts(p).find(s => /^Page /.test(s)), has(p, 'APEX Spend Plan - O&M')])),
    J([['Page 1 of 4', true], ['Page 2 of 4', true], ['Page 3 of 4', true], ['Page 4 of 4', true]]));
  C.chk('nothing is drawn off the page', P.pages.every(p => p.ops.every(o => o.t === 'text' ? o.x >= 0 && o.x <= 792 && o.y >= 0 && o.y <= 612
    : o.t === 'line' ? Math.min(o.x1, o.x2) >= 0 && Math.max(o.x1, o.x2) <= 792 : o.x >= 0 && o.x + o.w <= 792.01 && o.y >= 0 && o.y + o.h <= 612.01)));
  C.chk('no figure runs out of its cell to the left (a right-aligned figure’s width is inside the page’s left margin)',
    P.pages.every(p => p.ops.every(o => o.t !== 'text' || o.align !== 'r' || o.x - SP.pdfTextWidth(o.s, o.size, o.bold) >= 18)));
  const p1 = P.pages[0];
  C.chk('page 1: the title, the appropriation, the band, who and when', has(p1, 'Tessa Program - Spend Plan') && has(p1, 'Operations & Maintenance') && has(p1, 'Execution status - FY2026, FY2027')
    && has(p1, 'O&M FM Lead: O. Lead') && has(p1, 'Data as of: 17 Nov 2026  |  Data through Oct-2026'), J(texts(p1).slice(0, 8)));
  C.chk('page 1: the emblem is placed, inside its 54 pt box, its shape kept', p1.ops.some(o => o.t === 'img' && o.name === 'emblem' && o.w === 54 && o.h === 27));
  // §33.7 the emblem sits in the band: the band runs out from behind it, from the emblem's blue into the band's colour
  const strips = p1.ops.filter(o => o.t === 'rect' && o.y === 57 && o.h === 12);
  C.eq('page 1: the band fades from the emblem’s blue to its own colour, in strips that lap, then runs on in one piece',
    J([strips.length, strips[0].fill, strips[0].x, strips[29].fill, strips[1].x - strips[0].x < strips[0].w, strips[30].fill, strips[30].x + strips[30].w]), J([31, '#2A5BA8', 45, '#8EAADB', true, '#8EAADB', 774]));
  C.chk('page 1: the emblem is drawn after the band, so it lies over the band’s start', p1.ops.findIndex(o => o.t === 'img') > p1.ops.indexOf(strips[30]));
  C.eq('every page carries the emblem at the top left: large on a page with the full header, small on the unfunded list',
    J(P.pages.map(p => p.ops.filter(o => o.t === 'img').map(o => [o.x, o.w, o.h]))), J([[[18, 54, 27]], [[18, 54, 27]], [[18, 54, 27]], [[18, 20, 10]]]));
  const blk27 = M.blocks.find(b => b.key === 'om|2027');
  C.chk('page 1: the stoplight prints the block’s own figures and status word, in its colour',
    has(p1, SP.fmtM(blk27.approved) + '†') && has(p1, SP.fmtPct(blk27.oblPct)) && p1.ops.some(o => o.t === 'text' && o.s === SP.statusWord(blk27.status) && o.bold), J(texts(p1)));
  C.chk('page 1: each PMO’s row, the legend, the † words and how to read the plan', has(p1, 'Each PMO in O&M') && has(p1, PP) && has(p1, SP.STATUS_LEGEND_TEXT)
    && texts(p1).some(s => s.startsWith('† ' + SP.markText('†', M).slice(0, 30))) && texts(p1).some(s => /Required = Approved \+ the unfunded list/.test(s)) && texts(p1).some(s => /Unfunded list: FY2027 loaded 14 Nov 2026 \(UFR Tracker FY27\.xlsx\)/.test(s)));
  const p3 = P.pages[2];
  C.chk('the FY2027 page: its title lines and band', has(p3, 'Tessa Program - FY27 Spend Plan') && has(p3, 'Operations & Maintenance') && has(p3, 'Consolidated Sustainment Spend Plan'));
  C.chk('the FY2027 page: the columns of the template', ['PMO', 'Requirement Title', 'Description', 'Award Date', 'Service', 'Required', 'Approved', 'Obligated', 'Remaining', 'Delta (+/-)'].every(h => has(p3, h)));
  C.chk('the FY2027 page: Prime Contracts, then the divider, then each PMO', /Prime Contracts/.test(all(p3)) && has(p3, 'All Other O&M Contracts - separated by PMO') && /Air Vehicle \(AV\)/.test(all(p3)) && /Propulsion \(PP\)/.test(all(p3)), all(p3).slice(0, 400));
  C.chk('the FY2027 page: the prime’s title, CCaR number, description and award dates', has(p3, 'Prime Alpha') && has(p3, 'CCaR JSF6654') && has(p3, 'The prime contract') && has(p3, 'Oct-2026') && has(p3, 'Mar-2027') && has(p3, 'No date'));
  C.chk('the FY2027 page: the prime’s Required, Approved, Obligated and Remaining in whole dollars', ['6,500,000', '4,000,000', '3,000,000', '1,000,000'].every(s => has(p3, s)), J(texts(p3).filter(s => /^[\d,()]+$/.test(s)).slice(0, 30)));
  C.chk('the FY2027 page: a Delta below zero is in parentheses and red', p3.ops.some(o => o.t === 'text' && o.s === '(2,500,000)' && o.color === '#B00000'));
  C.chk('the FY2027 page: the section’s totals, top right', has(p3, 'TOTAL') && has(p3, SP.fmtWhole(SEC_A + SEC_U)) && has(p3, SP.fmtWhole(SEC_A)));
  C.eq('the FY2027 page: six service rows and a Total for each of its five records', J([texts(p3).filter(s => s === 'USAF ANG').length, texts(p3).filter(s => s === 'Total').length]), J([6, 5]));
  C.eq('the FY2027 page: the left side is drawn in each group’s colour, top to bottom', J(p3.ops.filter(o => o.t === 'rect' && o.x === 18 && o.w === 58 && o.y > 100).map(o => o.fill)), J(['#8EAADB', '#B9D7B0', '#E9B9C4']));
  const descX = 204 + 4, evX = descX + 6;
  const evOf = p => p.ops.filter(o => o.t === 'text' && o.x === evX).sort((a, b) => a.y - b.y);
  C.eq('the FY2027 page: a record with no typed description lists its plan event titles, in order (Tessa B)', J(evOf(p3).filter(o => /^T2/.test(o.s)).map(o => o.s)), J(['T2b', 'T2a', 'T2c']));
  C.chk('each title has its own bullet, level with it', evOf(p3).filter(o => /^T2/.test(o.s)).every(o => p3.ops.some(b => b.t === 'text' && b.s === '\u2022' && b.x === descX && b.y === o.y)));
  { const ys = evOf(p3).filter(o => /^T2/.test(o.s)).map(o => o.y); C.chk('with a little air between one title and the next', Math.abs((ys[1] - ys[0]) - 9.2) < 0.01, J(ys)); }
  // a prime with no typed description carries its Requirement Title over, never its plan events
  const Pav = SP.publishPages(D0.docs.find(d => d.id === 'pmo:propulsion (pp)'), ctx).pages[1];
  C.chk('a prime with nothing typed: its Description is its Requirement Title (so the title is printed twice) and its plan events are not listed',
    texts(Pav).filter(x => x === 'Prime Alpha').length === 2 && !texts(Pav).includes('P2') && texts(Pav).includes('T7'), J(texts(Pav).filter(x => /Prime|P2|T7/.test(x))));
  C.eq('the tag every title of a record begins with is left off the list; one that differs, or a single title with no tag, and they print as they are',
    J([SP.publishEventNames(['OGC - CAD/PAD Shipping', 'ogc -  Seat Cartridges']), SP.publishEventNames(['OGC - Chem Bio Labor']), SP.publishEventNames(['OGC - A', 'LM - B']), SP.publishEventNames(['Plain title', 'OGC - B']), SP.publishEventNames(['Air Vehicle - long - name'])]),
    J([['CAD/PAD Shipping', 'Seat Cartridges'], ['Chem Bio Labor'], ['OGC - A', 'LM - B'], ['Plain title', 'OGC - B'], ['Air Vehicle - long - name']]));
  C.chk('and a typed description replaces the list (the prime): its plan events are not printed', has(p3, 'The prime contract') && !has(p3, 'P1') && !has(p3, 'P2'));
  const p4 = P.pages[3];
  C.chk('the last page: the unfunded list, filtered to this document, with its columns', has(p4, 'Unfunded requirements') && ['Rank', 'Requirement Title', 'PMO', 'CCaR Record', 'USAF', 'ANG', 'AFRC', 'STOVL', 'USMC CV', 'USN CV', 'Total', 'Funding Status', 'Exec Ready?', 'SFCB Action'].every(h => has(p4, h)));
  C.chk('the last page: a line’s amounts, status and action; the subtotal and the total', has(p4, 'O&M FY2027') && has(p4, 'New thing') && has(p4, 'TS0099') && has(p4, '400,000') && has(p4, 'Pending') && has(p4, 'Approved 12 Nov')
    && has(p4, 'Subtotal - O&M FY2027') && has(p4, 'Total unfunded') && texts(p4).filter(s => s === '3,300,000').length === 2, J(texts(p4)));
  C.chk('every page of the O&M plan names the O&M FM Lead and no other', P.pages.slice(0, 3).every(p => has(p, 'O&M FM Lead: O. Lead')) && !P.pages.some(p => texts(p).some(s => /S\. Lead/.test(s))));
  const Ppp = SP.publishPages(pp, ctx);
  C.chk('a PMO’s plan: its stoplight page names the FM Lead of each appropriation it covers; each section’s pages name their own',
    has(Ppp.pages[0], 'FM Leads: O&M: O. Lead | Initial Spares: S. Lead') && has(Ppp.pages[1], 'O&M FM Lead: O. Lead') && has(Ppp.pages[2], 'Initial Spares FM Lead: S. Lead'), J(Ppp.pages.map(p => texts(p).filter(s => /Lead/.test(s)))));
  C.chk('a PMO’s document: one stoplight at the front, a page per appropriation and year, then its unfunded list',
    Ppp.pages.length === 4 && texts(Ppp.pages[0]).includes('Propulsion (PP) by appropriation and fiscal year') && texts(Ppp.pages[1]).includes('Propulsion (PP) - Operations & Maintenance')
    && texts(Ppp.pages[2]).includes('Propulsion (PP) - Initial Spares') && texts(Ppp.pages[2]).includes('PMO Spend Plan - Initial Spares FY2027') && texts(Ppp.pages[3]).includes('Unfunded requirements'),
    J(Ppp.pages.map(p => texts(p).slice(0, 4))));
  C.eq('only its first page is a stoplight', Ppp.pages.filter(p => texts(p).some(s => /^Execution status/.test(s))).length, 1);
  const P0 = SP.publishPages(D0.docs[0], Object.assign({}, ctx, { ufrFiles: [], emblem: null, fm: {}, program: '' }));
  C.chk('with no unfunded list the last page and the notes say so; with no names or emblem none is printed',
    texts(P0.pages[P0.pages.length - 1]).includes('No unfunded list is loaded.') && texts(P0.pages[0]).some(s => /No unfunded list is loaded: Required equals Approved/.test(s))
    && !texts(P0.pages[0]).some(s => /Lead/.test(s)) && !P0.pages.some(p => p.ops.some(o => o.t === 'img')) && texts(P0.pages[0]).includes('Spend Plan')
    && J(P0.pages[0].ops.filter(o => o.t === 'rect' && o.y === 57).map(o => [o.x, o.w, o.fill])) === J([[18, 756, '#8EAADB']]));
  // a long section: no record's block of service rows is split across pages
  const big = { id: 'ap:om', kind: 'ap', ap: 'om', label: 'O&M', long: 'Operations & Maintenance', file: 'Big.pdf', stoplight: { rows: [], total: {}, pmoRows: [] }, ufr: [],
    sections: [{ ap: 'om', apLabel: 'O&M', fy: 2027, total: fig(0, 0, 0), svc: [0, 1, 2, 3, 4, 5].map(() => fig(0, 0, 0)), n: 40,
      groups: [{ label: PP, prime: false, records: Array.from({ length: 40 }, (_, i) => ({ key: 'k' + i, ccar: 'K' + i, title: 'Record ' + i + ' ' + 'word '.repeat(i % 9), desc: 'd '.repeat(i * 3),
        dates: Array.from({ length: (i * 7) % 40 }, (_, j) => 'Jan-' + (2027 + j)), svc: [0, 1, 2, 3, 4, 5].map(() => fig(100, 0, 0)), total: fig(600, 0, 0), ufrOnly: false,
        events: i === 3 ? Array.from({ length: 60 }, (_, j) => 'Event ' + j + ' of record three') : i === 4 ? ['A plan event title long enough that it has to wrap under itself in the description column'] : [] })) }] }] };
  big.sections[0].groups[0].records[3].desc = ''; big.sections[0].groups[0].records[4].desc = '';
  const PB = SP.publishPages(big, ctx).pages.slice(1, -1);
  C.chk('forty records take several pages', PB.length >= 5, String(PB.length));
  C.chk('on each of them every record is whole: as many first rows (USAF) as Total rows (one USAF is the header’s), and each record’s number on one page only',
    PB.every(p => texts(p).filter(s => s === 'USAF').length - 1 === texts(p).filter(s => s === 'Total').length)
    && Array.from({ length: 40 }, (_, i) => PB.filter(p => texts(p).includes('CCaR K' + i)).length).every(n => n === 1));
  const allT = PB.flatMap(p => p.ops.filter(o => o.t === 'text'));
  C.chk('sixty plan events: the list stops inside twelve lines and says how many more there are', allT.filter(o => /^Event \d+ of record three$/.test(o.s)).length === 11 && allT.some(o => o.s === '+49 more plan events'),
    String(allT.filter(o => /^Event \d+ of record three$/.test(o.s)).length));
  { const w = allT.filter(o => o.x === evX && /plan event title long enough|under itself|description column/.test(o.s)).sort((a, b) => a.y - b.y);
    C.chk('a long plan event title wraps squarely under itself, with one bullet for the whole title', w.length >= 2 && Math.abs(w[1].y - w[0].y - 7.4) < 0.01
      && PB.flatMap(p => p.ops).filter(b => b.t === 'text' && b.s === '\u2022' && w.some(o => o.y === b.y)).length === 1, J(w.map(o => [o.s, o.y]))); }
  // the Total row is never stretched: in every record, tall or not, its rows are all one height
  { const rowsOf = p => { const m = new Map(); for (const o of p.ops) if (o.t === 'rect' && o.x === 424 && o.w === 60 && o.y > 100) { m.set(o.y, o.h); } return [...m].sort((a, b) => a[0] - b[0]).map(x => x[1]); };
    const hs = PB.flatMap(rowsOf), blocks = []; for (let i = 0; i + 7 <= hs.length; i += 7) blocks.push(hs.slice(i, i + 7));
    C.chk('in each of the forty records the six service rows and the Total row are the same height', blocks.length === 40 && blocks.every(b => b.every(v => Math.abs(v - b[0]) < 0.01)), J(blocks.slice(0, 5)));
    C.chk('the record with sixty plan events: its twelve-line list sets the block’s height, shared by its seven rows (16.4 pt each); one with no list keeps the usual 9.5', blocks.some(b => Math.abs(b[0] - (12 * 7.4 + 11 * 1.8 + 6) / 7) < 0.01) && blocks.some(b => Math.abs(b[0] - 9.5) < 0.01), J([...new Set(blocks.map(b => Math.round(b[0] * 10) / 10))])); }
  C.chk('and nothing is drawn below the body', PB.every(p => p.ops.every(o => o.t !== 'rect' || o.y + o.h <= 592.01)));
  // the header with the summary, and the column headings, are on every page of a section
  C.chk('every page of the section carries the full header: the emblem, both title lines, the totals by service and the band',
    PB.every(p => p.ops.some(o => o.t === 'img' && o.w === 54) && has(p, 'Tessa Program - FY27 Spend Plan') && has(p, 'Operations & Maintenance') && has(p, 'TOTAL')
      && texts(p).filter(s => s === 'USMC (F-35B)').length >= 1 && texts(p).some(s => /^Data as of: /.test(s))), J(PB.map(p => texts(p).slice(0, 3))));
  C.chk('and the column headings, at the same place on each', PB.every(p => ['PMO', 'Requirement Title', 'Description', 'Award Date', 'Service', 'Delta (+/-)'].every(h => has(p, h)))
    && new Set(PB.map(p => p.ops.find(o => o.t === 'text' && o.s === 'Requirement Title').y)).size === 1);
  C.eq('the first page’s band is the plan’s name; each later page’s says continued', J([texts(PB[0]).includes('Consolidated Sustainment Spend Plan'), PB.slice(1).every(p => texts(p).includes('Consolidated Sustainment Spend Plan (continued)'))]), J([true, true]));
  C.chk('the page is used to a quarter inch of its sides and down to the CUI line', PB.every(p => Math.min(...p.ops.filter(o => o.t === 'rect').map(o => o.x)) === 18 && Math.max(...p.ops.filter(o => o.t === 'rect').map(o => o.x + o.w)) === 774)
    && Math.max(...PB.slice(0, -1).map(p => Math.max(...p.ops.filter(o => o.t === 'rect').map(o => o.y + o.h)))) > 540);

  // ---------------------------------------------------------------- §33.5 the PDF bytes, read by other programs
  const bytes = SP.publishPdf(om, ctx);
  C.eq('the same input gives the same bytes', Buffer.compare(Buffer.from(bytes), Buffer.from(SP.publishPdf(om, ctx))), 0);
  writeFileSync(join(tmp.dir, 'om.pdf'), bytes);
  const pt = spawnSync('pdftotext', ['-layout', join(tmp.dir, 'om.pdf'), '-'], { encoding: 'utf8' });
  C.eq('poppler reads it with no complaint', J([pt.status, pt.stderr]), J([0, '']));
  const pages = pt.stdout.split('\f').filter(s => s.trim() !== '');
  C.eq('four pages', pages.length, 4);
  C.chk('each page’s text holds the CUI marking twice', pages.every(s => s.split(SP.CUI).length === 3));
  C.chk('the text can be searched: the prime’s line, to the dollar, and the mark †', /Prime Alpha/.test(pages[2]) && /\$\s+6,500,000\s+\$\s+4,000,000\s+\$\s+3,000,000\s+\$\s+1,000,000\s+\$\s+\(2,500,000\)/.test(pages[2]) && /†/.test(pages[0]), pages[2].slice(0, 1500));
  const py = spawnSync('python3', ['-c', 'import sys,pypdf\nr=pypdf.PdfReader(sys.argv[1])\nx=r.pages[0].images\nprint(len(r.pages), r.metadata.title, len(x), x[0].image.size if x else None, [float(v) for v in r.pages[1].mediabox[2:]], all(float(p.mediabox[2]) > float(p.mediabox[3]) and not p.get("/Rotate") for p in r.pages), r.trailer["/Root"]["/ViewerPreferences"]["/PickTrayByPDFSize"])', join(tmp.dir, 'om.pdf')], { encoding: 'utf8' });
  C.eq('pypdf reads the same: its pages, title, the emblem’s picture, the page size, every page wider than tall and not turned, and the printing hint', py.stdout.trim() + py.stderr, '4 APEX Spend Plan - O&M 1 (40, 20) [792.0, 612.0] True True');
  const strange = SP.pdfBytes({ title: 'x', pages: [{ w: 200, h: 100, ops: [{ t: 'text', x: 10, y: 20, s: 'a(b)c\\d — “é” 例', size: 9 }] }] });
  writeFileSync(join(tmp.dir, 's.pdf'), strange);
  const st = spawnSync('pdftotext', [join(tmp.dir, 's.pdf'), '-'], { encoding: 'utf8' });
  C.eq('parentheses, a backslash, a dash, curly quotes and an accent come through; a character the font lacks is “?”', J([st.stdout.trim(), st.stderr]), J(['a(b)c\\d — “é” ?', '']));
  let threw = '';
  try { SP.pdfBytes({ pages: [{ w: 10, h: 10, ops: [{ t: 'img', x: 0, y: 0, w: 1, h: 1, name: 'none' }] }] }); } catch (e) { threw = e.message; }
  C.chk('a picture that was not given is an error, never an empty box', /was not given/.test(threw), threw);

  // ---------------------------------------------------------------- §33.6 saved in the plan
  C.chk('a plan that never loaded a list or typed a word holds neither key', !('ufr' in SP.state) && !('publish' in SP.state));
  C.chk('setUfr keeps the list, by fiscal year', SP.setUfr(U, '2026-11-14T15:00:00.000Z') === true && SP.state.ufr['2027'].lines.length === 8 && SP.state.ufr['2027'].name === 'UFR Tracker FY27.xlsx' && SP.isDirty());
  C.chk('a refused read is not kept', SP.setUfr({ ok: false, why: 'x' }) === false);
  C.chk('setPublish keeps descriptions (trimmed), each appropriation’s FM Lead (and no name for anything that is not one) and the emblem',
    SP.setPublish({ desc: { ts0002: '  The   second  ', ts0003: 'x' }, fm: { om: ' O.  Lead ', ff: 'F. Lead', zz: 'nobody' }, program: 'Tessa Program', emblem: 'data:image/jpeg;base64,' + Buffer.from(jpg).toString('base64') }) === true
    && J(SP.state.publish.desc) === J({ ts0002: 'The second', ts0003: 'x' }) && J(SP.state.publish.fm) === J({ om: 'O. Lead', ff: 'F. Lead' }) && /^data:image\/jpeg/.test(SP.state.publish.emblem));
  C.chk('a blank description is taken away; the same thing twice is no change', SP.setPublish({ desc: { ts0003: '' } }) === true && !('ts0003' in SP.state.publish.desc) && SP.setPublish({ desc: { ts0003: '' } }) === false);
  C.chk('an FM Lead cleared is taken away, and the last one takes the table with it', SP.setPublish({ fm: { ff: '' } }) === true && J(SP.state.publish.fm) === J({ om: 'O. Lead' }));
  C.chk('an emblem that is not a JPEG is not kept', SP.setPublish({ emblem: 'data:text/html;base64,AAAA' }) === false);
  C.chk('Print no emblem is kept as yes, and taken away as no; null puts the built-in emblem back',
    SP.setPublish({ noEmblem: true }) === true && SP.state.publish.noEmblem === true && SP.setPublish({ noEmblem: false }) === true && !('noEmblem' in SP.state.publish)
    && SP.setPublish({ emblem: null }) === true && !('emblem' in SP.state.publish) && SP.setPublish({ emblem: 'data:image/jpeg;base64,' + Buffer.from(jpg).toString('base64') }) === true);
  const saved = SP.savedHtml();
  const t2 = loadTool({ html: saved });
  t2.SP.storeInit();
  C.eq('saved and reopened, the list and the settings come back whole', J([t2.SP.state.ufr, t2.SP.state.publish]), J([SP.state.ufr, SP.state.publish]));
  t2.close();
  C.chk('removeUfr takes the list away, and the key with the last one', SP.removeUfr(2027) === true && !('ufr' in SP.state) && SP.removeUfr(2027) === false);
  // a saved plan whose list is damaged is refused whole, as any other damaged part is
  const good = JSON.parse(J(SP.state)); good.savedAt = NOW;
  for (const [what, mut, re] of [
    ['a line with six amounts', s => { s.ufr = { 2027: { fy: 2027, lines: [Object.assign({}, L[0], { cents: [1, 2, 3, 4, 5, 6] })] } }; }, /unfunded list for FY2027.*whole cents by service/],
    ['a list filed under another year', s => { s.ufr = { 2028: { fy: 2027, lines: [] } }; }, /unfunded list for FY2028.*fiscal year/],
    ['descriptions that are not text', s => { s.publish = { desc: { a: 5 } }; }, /descriptions are not text/],
    ['an emblem that is not a JPEG', s => { s.publish = { emblem: 'data:image/svg+xml;base64,AAAA' }; }, /emblem is not a JPEG/],
    ['FM Leads that are not names', s => { s.publish = { fm: { om: 7 } }; }, /FM Leads are not names by appropriation/],
    ['a no-emblem setting that is not yes or no', s => { s.publish = { noEmblem: 'yes' }; }, /printing no emblem is not yes or no/]]) {
    const s = JSON.parse(J(good)); mut(s);
    const tb = loadTool({ modules: ['util', 'xlsx-read', 'import', 'engine', 'publish', 'pdf', 'store'], state: s });
    const r = tb.SP.storeInit();
    C.chk('refused on opening: ' + what, r.ok === false && re.test(r.message), J(r));
    tb.close();
  }
  C.eq('the description list from a file: by CCaR number, first one kept, blanks skipped',
    J(SP.readDescriptions({ sheets: [{ name: 'x', rows: [['junk'], ['CCaR No', 'Title', 'Short Description'], ['TS0002', 't', ' Buys  things '], ['ts0002', 't', 'again'], ['TS0003', 't', ''], ['', 't', 'none']] }] })),
    J({ ok: true, map: { ts0002: 'Buys things' }, n: 1, sheet: 'x' }));
  C.chk('a file with no such columns is refused', SP.readDescriptions({ sheets: [{ name: 'x', rows: [['A', 'B']] }] }).ok === false);
  t.close();

  // ---------------------------------------------------------------- the page
  const tt = loadTool({ html: pageHtml({}) });
  const W = tt.window, doc2 = W.document, S2 = tt.SP;
  for (let i = 0; i < 200 && !doc2.getElementById('uiMain'); i++) await settle(5);
  S2.applyImport(await S2.parseFiles([{ name: 'om.csv', data: csv(OM) }, { name: 'sp.csv', data: csv(SPR) }], { now: NOW }));
  S2.setSettings({ asOf: '2026-10' });
  await settle();
  const main = () => doc2.getElementById('uiMain');
  const click = el => el.dispatchEvent(new W.MouseEvent('click', { bubbles: true }));
  const change = el => el.dispatchEvent(new W.Event('change', { bubbles: true }));
  const nav = doc2.querySelector('[data-act=view][data-v="publish"]');
  C.chk('one item in the menu, under Briefing', !!nav && nav.textContent === 'Publish PDFs' && nav.closest('.navg').getAttribute('aria-label') === 'Briefing');
  click(nav); await settle();
  C.eq('the page’s title', main().querySelector('h2.title').textContent, 'Publish spend plan');
  const docRows = () => [...main().querySelectorAll('#uiPubDocs tbody tr')].map(tr => [...tr.children].slice(0, 5).map(td => td.textContent));
  C.eq('the documents, before any unfunded list', J(docRows()), J([
    ['APEX Spend Plan - O&M', 'Consolidated, every PMO · FY2026, FY2027', '4', '0', '0 typed, 4 list plan events'],
    ['APEX Spend Plan - Initial Spares', 'Consolidated, every PMO · FY2027', '1', '0', '0 typed, 1 list plan events'],
    ['APEX Spend Plan - PMO AV', 'That PMO only, O&M · FY2026, FY2027', '3', '0', '0 typed, 3 list plan events'],
    ['APEX Spend Plan - PMO PP', 'That PMO only, O&M, Initial Spares · FY2027', '3', '0', '0 typed, 3 list plan events']]));
  C.chk('with no list it says Required equals Approved', /No unfunded list is loaded: Required equals Approved/.test(main().querySelector('#uiUfrList').textContent));
  // the unfunded list, through the page's own file box
  const fileIn = main().querySelector('#uiUfrFile');
  const buf = readFileSync(join(tmp.dir, 'ufr.xlsx'));
  Object.defineProperty(fileIn, 'files', { value: [{ name: 'UFR Tracker FY27.xlsx', arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) }], configurable: true });
  change(fileIn);
  for (let i = 0; i < 200 && !S2.state.ufr; i++) await settle(10);
  await settle(40);
  C.chk('importing the tracker keeps it in the plan and marks the plan unsaved', !!S2.state.ufr && S2.state.ufr['2027'].lines.length === 8 && S2.isDirty());
  C.chk('the page lists it: its year, file, lines and total', /FY2027: “UFR Tracker FY27\.xlsx”, loaded \d{4}-\d\d-\d\d · 8 lines · \$3,349,345\.60/.test(main().querySelector('#uiUfrList').textContent), main().querySelector('#uiUfrList').textContent);
  C.chk('the message says what came in', /the FY2027 unfunded list, 8 lines from O&M, OPN; 5 to check/.test(doc2.querySelector('.msg').textContent), doc2.querySelector('.msg').textContent);
  C.eq('the documents now carry the unfunded lines, and OPN has a document of its own (unfunded only)', J(docRows().map(r => [r[0], r[2], r[3]])), J([
    ['APEX Spend Plan - O&M', '6', '4'], ['APEX Spend Plan - Initial Spares', '1', '0'], ['APEX Spend Plan - OPN', '4', '4'], ['APEX Spend Plan - PMO AV', '4', '3'], ['APEX Spend Plan - PMO PP', '8', '5']]));
  C.chk('what to check is listed: the tracker’s own notes and the placements', main().querySelectorAll('#uiUfrNotes li').length === 5 + 3 + 4, String(main().querySelectorAll('#uiUfrNotes li').length));
  // a description typed is saved and counted
  C.eq('descriptions: none written yet', main().querySelector('#uiPubDescN').textContent, '0 of 9 typed; the rest list their plan events');
  const box = main().querySelector('input[data-act=pubdesc][data-k="jsf6654"]');
  box.value = 'The prime contract'; change(box); await settle();
  C.chk('a description typed is kept in the plan, by CCaR number', S2.state.publish && S2.state.publish.desc.jsf6654 === 'The prime contract');
  C.eq('and counted', main().querySelector('#uiPubDescN').textContent, '1 of 9 typed; the rest list their plan events');
  C.eq('and the O&M document has one fewer missing', docRows()[0][4], '1 typed, 4 list plan events');
  const missBox = main().querySelector('input[data-act=pubmiss]'); missBox.checked = true; change(missBox); await settle();
  C.eq('Show only the missing: eight rows', main().querySelectorAll('#uiPubDesc tbody tr').length, 8);
  C.eq('four FM Lead boxes, one for each appropriation, and no BFM box', J([[...main().querySelectorAll('input[data-act=pubfm]')].map(b => b.parentElement.textContent.trim()), /BFM/.test(main().textContent)]),
    J([['O&M FM Lead', 'Full Fund FM Lead', 'Initial Spares FM Lead', 'OPN FM Lead'], false]));
  const lead = main().querySelector('input[data-act=pubfm][data-ap=om]'); lead.value = 'O. Lead'; change(lead); await settle();
  const lead2 = main().querySelector('input[data-act=pubfm][data-ap=opn]'); lead2.value = 'N. Lead'; change(lead2); await settle();
  C.chk('a name typed is kept, under its appropriation', J(S2.state.publish.fm) === J({ om: 'O. Lead', opn: 'N. Lead' }) && main().querySelector('input[data-act=pubfm][data-ap=om]').value === 'O. Lead');
  // one fiscal year
  const fy26 = main().querySelector('input[data-act=pubfy][data-fy="2026"]'); fy26.checked = false; change(fy26); await settle();
  C.eq('FY2026 unticked: the documents cover FY2027 only', J(docRows().map(r => r[1].split(' · ')[1])), J(['FY2027', 'FY2027', 'FY2027', 'FY2027', 'FY2027']));
  const fy26b = main().querySelector('input[data-act=pubfy][data-fy="2026"]'); fy26b.checked = true; change(fy26b); await settle();
  // downloads: what the page hands the browser
  const got = [];
  S2.download = (name, data, mime) => { got.push({ name, data, mime }); return name; };
  // a switch turned off on screen must not shrink a published plan
  const usnBox = [...doc2.querySelectorAll('#uiSwitches input[data-act=svc]')].find(b => /USN \(USN CV\)/.test(b.parentElement.textContent));
  usnBox.checked = false; change(usnBox); await settle(40);
  C.chk('USN is switched off on screen', !/USN \(USN CV\)/.test(doc2.querySelector('.filtbtn').textContent) && doc2.querySelector('.filtbtn').classList.contains('filtered'), doc2.querySelector('.filtbtn').textContent);
  C.chk('the page says every service and lane is counted', /Every service and lane is counted, whatever the Filter above says/.test(main().textContent));
  click(main().querySelector('button[data-act=pubdoc][data-i="0"]'));
  for (let i = 0; i < 200 && !got.length; i++) await settle(10);
  C.chk('Download PDF hands the browser a PDF by the document’s name', got.length === 1 && got[0].name === 'APEX Spend Plan - O&M.pdf' && got[0].mime === 'application/pdf' && Buffer.from(got[0].data.slice(0, 5)).toString() === '%PDF-', J(got.map(g => g.name)));
  writeFileSync(join(tmp.dir, 'ui.pdf'), got[0].data);
  const ut = spawnSync('pdftotext', ['-layout', join(tmp.dir, 'ui.pdf'), '-'], { encoding: 'utf8' }).stdout;
  C.chk('with USN switched off on screen the PDF still counts USN: the prime’s Approved is 4,000,000 and Required 6,500,000', /\$\s+6,500,000\s+\$\s+4,000,000/.test(ut) && /O&M FM Lead: O\. Lead/.test(ut) && !/N\. Lead/.test(ut), ut.slice(0, 600));
  // §33.7 the built-in emblem is printed unless the plan holds another or asks for none
  const embBytes = Buffer.from(S2.EMBLEM_DEFAULT.split(',')[1], 'base64');
  C.eq('the built-in emblem is a JPEG, 240 px square', J([/^data:image\/jpeg;base64,/.test(S2.EMBLEM_DEFAULT), S2.jpegInfo(new Uint8Array(embBytes))]), J([true, { w: 240, h: 240, n: 3 }]));
  C.chk('the page shows it and says it is the built-in one', main().querySelector('img#uiPubEmb').getAttribute('src') === S2.EMBLEM_DEFAULT && main().querySelector('#uiPubEmbWhat').textContent === 'The built-in emblem.');
  const imgs = f => spawnSync('python3', ['-c', 'import sys,pypdf\nr=pypdf.PdfReader(sys.argv[1])\nprint([[i.image.size for i in p.images] for p in r.pages[:2]])', f], { encoding: 'utf8' }).stdout.trim();
  C.eq('and the PDF carries it on its pages', imgs(join(tmp.dir, 'ui.pdf')), '[[(240, 240)], [(240, 240)]]');
  const noEmb = main().querySelector('input[data-act=pubnoemb]'); noEmb.checked = true; change(noEmb); await settle();
  C.chk('Print no emblem is kept in the plan, and the page says none is printed', S2.state.publish.noEmblem === true && /No emblem is printed/.test(main().querySelector('#uiPubEmb').textContent));
  got.length = 0;
  click(main().querySelector('button[data-act=pubdoc][data-i="0"]'));
  for (let i = 0; i < 200 && !got.length; i++) await settle(10);
  writeFileSync(join(tmp.dir, 'ui2.pdf'), got[0].data);
  C.eq('and the PDF then carries none', imgs(join(tmp.dir, 'ui2.pdf')), '[[], []]');
  await settle();
  const noEmb2 = main().querySelector('input[data-act=pubnoemb]'); noEmb2.checked = false; change(noEmb2); await settle();
  got.length = 0;
  await settle();
  click(main().querySelector('button[data-act=pubzip]'));
  for (let i = 0; i < 300 && !got.length; i++) await settle(10);
  await settle(30);
  C.chk('Download all hands over one zip, named for the data', got.length === 1 && /^APEX spend plans - data through Oct-2026 - \d{4}-\d\d-\d\d\.zip$/.test(got[0].name) && got[0].mime === 'application/zip', J(got.map(g => g.name)) + ' ' + doc2.querySelector('.msg').textContent);
  writeFileSync(join(tmp.dir, 'all.zip'), got[0].data);
  const zl = spawnSync('python3', ['-c', 'import sys,zipfile\nz=zipfile.ZipFile(sys.argv[1]); print(z.testzip(), sorted(z.namelist()))', join(tmp.dir, 'all.zip')], { encoding: 'utf8' });
  C.eq('the zip holds the five PDFs, whole', zl.stdout.trim(), "None ['APEX Spend Plan - Initial Spares.pdf', 'APEX Spend Plan - O&M.pdf', 'APEX Spend Plan - OPN.pdf', 'APEX Spend Plan - PMO AV.pdf', 'APEX Spend Plan - PMO PP.pdf']");
  // removing the list
  click(main().querySelector('button[data-act=ufrdel]')); await settle();
  C.chk('Remove takes the list out of the plan and the page', !S2.state.ufr && /No unfunded list is loaded/.test(main().querySelector('#uiUfrList').textContent));
  C.eq('no script error on the page', J(tt.errors.filter(e => !/^Not implemented: (Window's scrollTo\(\) method|HTMLInputElement\.prototype\.click|HTMLCanvasElement)/.test(String(e)))), '[]');
  tt.close();
} catch (e) {
  failed = e;
} finally {
  tmp.rm();
}
if (failed) { console.error(failed); C.chk('the test ran to its end', false, (failed && failed.message) || String(failed)); }
C.done();
