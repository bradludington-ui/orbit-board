// Charts §62 (Brad, 24 Nov 2026, of a mock-up: "Go with B and build it"): what moved since the last pull, will it reach the
// OSD goal by September, and the IPT picker. SP.movedOf and SP.goalLandingOf are held to inputs built by hand here; the page
// to a plan imported twice, every expectation worked out from the rows below.
//
//   node apex/test/charts-62.test.mjs
process.env.TZ = 'America/New_York';
import { loadTool, pageHtml, checks } from './harness.mjs';

const C = checks('charts-62');
const J = x => JSON.stringify(x);
const settle = (ms = 20) => new Promise(res => setTimeout(res, ms));
const HEADERS = ['FY', 'Month', 'CCaR No', 'Title', 'Budget', 'C/L', 'SB', 'Plan Event', 'Date', 'Amount', 'Alloc', 'Event Description',
  'OPR', 'PMT PID#', 'Contracting POC', 'Material Lead', 'PM/TPOC', 'Obligation Category', 'PMO', 'Sub-PMO', 'Category', 'Navy SI Code',
  'IPT', 'Spares WBS', 'Quantity', 'CLINs', 'AF EEIC', 'RCN', 'PSR', 'CSR', 'Contract Mod', 'Cost Element'];   // CONTRACT §2, restated
const q = v => { const s = v === undefined || v === null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = rows => [HEADERS.join(',')].concat(rows.map(o => HEADERS.map(h => q(o[h])).join(','))).join('\n');
const EX = 'Actual Execution is allocated', NA = 'Not Allocated', B_OM = 'USAF O&M- Tessa Base Discretionary AV';
const row = (FY, ccar, Title, pe, Date, Amount, Alloc, sub) => ({ FY, 'CCaR No': ccar, Title, Budget: B_OM, 'Plan Event': pe, Date, Amount, Alloc, PMO: 'Air Vehicle (AV)', 'Sub-PMO': sub || '' });
const D = d => Math.round(d * 100);
// THE FIRST PULL (O&M, Data through Oct-2026):
//   Tessa A  T1  3.0M awarded Oct 2026      Sub-PMO Wing Team
//   Tessa B  T2  5.0M planned Mar 2027      Sub-PMO Wing Team
//   Tessa D  T4  2.0M planned Feb 2027      (FY2026, no Sub-PMO)
//   Garnet   T7  0.7M planned Jun 2027      (no Sub-PMO)
//   Tessa H  T8  20.0M planned Nov 2027, after September (no Sub-PMO), the same in both pulls: O&M FY2027 cannot reach its
//                September goal on this plan, so the card has a year that falls short to show
// THE SECOND: Tessa B's T2 moves to May 2027 (5.0 later); Tessa D's T4 moves to Jan 2027 (2.0 earlier); Garnet's T7 is gone
// (0.7 dropped); Tessa A gains a new plan event T1b, 1.5M in Apr 2027 (Wing Team); Tessa A's T1 grows to 3.25M (0.25 in place).
const P1 = [row(2027, 'TS0001', 'Tessa A', 'T1', '2026-10-15', '3000000', EX, 'Wing Team'), row(2027, 'TS0002', 'Tessa B', 'T2', '2027-03-10', '5000000', NA, 'Wing Team'),
  row(2026, 'TS0004', 'Tessa D', 'T4', '2027-02-05', '2000000', NA), row(2027, 'TS0007', 'Garnet', 'T7', '2027-06-01', '700000', NA), row(2027, 'TS0008', 'Tessa H', 'T8', '2027-11-01', '20000000', NA)];
const P2 = [row(2027, 'TS0001', 'Tessa A', 'T1', '2026-10-15', '3250000', EX, 'Wing Team'), row(2027, 'TS0001', 'Tessa A', 'T1b', '2027-04-02', '1500000', NA, 'Wing Team'),
  row(2027, 'TS0002', 'Tessa B', 'T2', '2027-05-10', '5000000', NA, 'Wing Team'), row(2026, 'TS0004', 'Tessa D', 'T4', '2027-01-05', '2000000', NA), row(2027, 'TS0008', 'Tessa H', 'T8', '2027-11-01', '20000000', NA)];

try {
  // ============================================================================================ SP.movedOf, by hand
  {
    const tt = loadTool({ html: pageHtml({}) }), SP = tt.SP;
    const ln = (pmo, title, change, from, to, extra) => Object.assign({ key: title, ap: 'om', fy: 2027, parts: ['om', '2027', pmo.toLowerCase(), title.toLowerCase(), 'pe', 'c'], pmo, title, pe: 'pe', change,
      moved: { cents: Math.max(0, (from.concat(to).reduce((s, x) => s + x.cents, 0) - Math.abs(change)) / 2), from, to } }, extra || {});
    const Dd = { om: { label: 'O&M', importedAt: ['2026-11-01T00:00:00Z', '2026-11-20T00:00:00Z'], leaves: {
      new: [{ key: 'n', ap: 'om', fy: 2027, parts: ['om', '2027', 'x', 'n', 'pe', 'c'], pmo: 'X', after: 400 }],
      gone: [{ key: 'g', ap: 'om', fy: 2027, parts: ['om', '2027', 'x', 'g', 'pe', 'c'], pmo: 'X', before: 300 }],
      changed: [
        ln('X', 'later', 0, [{ ym: '2027-01', cents: 1000 }], [{ ym: '2027-04', cents: 1000 }]),
        ln('Y', 'earlier', 0, [{ ym: '2027-06', cents: 200 }], [{ ym: '2027-02', cents: 200 }]),
        // 10 to March and 4 back to November from December: by where the money ended up, later (December 14 -> March 10, November 4)
        ln('Y', 'mixed', 0, [{ ym: '2026-12', cents: 1400 }], [{ ym: '2027-03', cents: 1000 }, { ym: '2026-11', cents: 400 }]),
        ln('X', 'grew', 50, [], []),
        ln('X', 'other fy', 0, [{ ym: '2026-01', cents: 999 }], [{ ym: '2026-05', cents: 999 }], { fy: 2026, parts: ['om', '2026', 'x', 'other fy', 'pe', 'c'] }),
      ], unread: [] } } };
    const X = SP.movedOf(Dd, l => String(l.fy) === '2027', 2);
    C.eq('movedOf: later is the line that moved later plus the mixed line by where it ended up; earlier the other; the other FY is left out',
      [X.later, X.earlier], [1000 + 1400, 200]);
    C.eq('… new and dropped are their whole amounts, and a change in place is its change', [X.added, X.dropped, X.inPlace], [400, 300, 50]);
    C.eq('… by PMO, most moved first, never netted', X.byPmo, [{ label: 'Y', later: 1400, earlier: 200 }, { label: 'X', later: 1000, earlier: 0 }]);
    C.eq('… the biggest moves later first, each with every month its money left and reached, most first',
      X.top.map(t => [t.line.title, t.was, t.now, t.cents]), [['mixed', [{ ym: '2026-12', cents: 1400 }], [{ ym: '2027-03', cents: 1000 }, { ym: '2026-11', cents: 400 }], 1400], ['later', [{ ym: '2027-01', cents: 1000 }], [{ ym: '2027-04', cents: 1000 }], 1000]]);
    C.eq('… with a limit of two, none left over; with one, the rest named', [X.restN, X.restC, SP.movedOf(Dd, l => String(l.fy) === '2027', 1).restN, SP.movedOf(Dd, l => String(l.fy) === '2027', 1).restC], [0, 0, 1, 1000]);
    C.eq('… the pulls it compares, with their import times', X.aps, [{ ap: 'om', label: 'O&M', importedAt: ['2026-11-01T00:00:00Z', '2026-11-20T00:00:00Z'] }]);

    // ========================================================================================== SP.goalLandingOf, by hand
    // one block: basis 1,000.00 ($100,000 in cents); actual 10% through Nov, plan 30% at Dec, nothing in Jan to Mar, 55% at Jun,
    // 70% at Sep; goals 25% / 50% / 75% / 90% at the quarter ends. A second with no September goal.
    const mo = (v, kind, goal) => ({ v, kind, goal });
    const months = [mo(0.05, 'actual', 0.08), mo(0.10, 'actual', 0.16), mo(0.30, 'plan', 0.25), mo(null, null, 0.33), mo(null, null, 0.41), mo(null, null, 0.50),
      mo(0.40, 'plan', 0.58), mo(0.50, 'plan', 0.66), mo(0.55, 'plan', 0.75), mo(0.60, 'plan', 0.80), mo(0.65, 'plan', 0.85), mo(0.70, 'plan', 0.90)];
    const O = { rows: [{ key: 'om|2027', ap: 'om', approved: 10000000 }, { key: 'sp|2028', ap: 'sp', approved: 500 }],
      charts: [{ key: 'om|2027', apLabel: 'O&M', fy: 2027, months }, { key: 'sp|2028', apLabel: 'Initial Spares', fy: 2028, months: months.map(x => mo(x.v, x.kind, null)) }] };
    const G = SP.goalLandingOf(O);
    C.eq('goalLandingOf: obligated so far is the last actual month, it lands at September’s %, against September’s goal', [G[0].now, G[0].land, G[0].goal, G[0].basis], [0.10, 0.70, 0.90, 10000000]);
    C.eq('… short is (90% - 70%) of the basis, in cents', G[0].short, 2000000);
    C.eq('… each quarter end: the goal and the plan of the basis (Mar has no figure, so the plan there is Dec’s 30%), and what is short',
      G[0].quarters, [{ label: '31 Dec', goal: 2500000, plan: 3000000, short: 0 }, { label: '31 Mar', goal: 5000000, plan: 3000000, short: 2000000 },
        { label: '30 Jun', goal: 7500000, plan: 5500000, short: 2000000 }, { label: '30 Sep', goal: 9000000, plan: 7000000, short: 2000000 }]);
    C.eq('… a block with no September goal: no short and no quarters', [G[1].goal, G[1].short, G[1].quarters], [null, null, []]);
    tt.close();
  }

  // ============================================================================================ the page
  const tt = loadTool({ html: pageHtml({}) }), W = tt.window, doc = W.document, SP = tt.SP;
  for (let i = 0; i < 200 && !doc.getElementById('uiMain'); i++) await settle(5);
  const main = () => doc.getElementById('uiMain');
  SP.applyImport(await SP.parseFiles([{ name: 'om.csv', data: csv(P1) }], { now: '2026-11-01T12:00:00.000Z' }));
  SP.setSettings({ asOf: '2026-10' });
  SP.applyImport(await SP.parseFiles([{ name: 'om2.csv', data: csv(P2) }], { now: '2026-11-20T12:00:00.000Z' }));
  SP.setSettings({ asOf: '2026-10' });
  await settle(40);
  doc.querySelector('[data-act=view][data-v=charts]').dispatchEvent(new W.MouseEvent('click', { bubbles: true })); await settle();
  const pick = async (f, label) => { const s = main().querySelector('select[data-act=chf][data-f=' + f + ']'); s.value = [...s.options].find(o => o.textContent === label).value; s.dispatchEvent(new W.Event('change', { bubbles: true })); await settle(); };
  const tiles = () => ['uiMvLater', 'uiMvEarlier', 'uiMvNew', 'uiMvGone', 'uiMvPlace'].map(id => Number(doc.getElementById(id).getAttribute('data-c')));
  C.eq('Charts draws the two new cards after Awards by month', [...main().querySelectorAll('.chcard')].map(c => c.getAttribute('data-ch')).slice(0, 3), ['months', 'moved', 'goal']);
  C.eq('what moved: 5.0 later (Tessa B), 2.0 earlier (Tessa D), 1.5 new (Tessa A’s T1b), 0.7 dropped (Garnet), 0.25 grown in place (Tessa A’s T1)', tiles(), [D(5e6), D(2e6), D(1.5e6), D(0.7e6), D(0.25e6)]);
  C.eq('… the biggest move later: Tessa B’s T2, Mar 2027 to May 2027, 5.00', [...doc.querySelectorAll('#uiChMoved tbody tr')].map(tr => [...tr.children].map(c => c.querySelector('.tg') ? c.querySelector('.tg').textContent : c.textContent)),
    [['Tessa B', 'T2', 'Mar 2027', 'May 2027', '5.00']]);
  C.chk('… its requirement opens from it', !!doc.querySelector('#uiChMoved .tg[data-act=reqopen]'));
  C.chk('… the bars carry the PMO’s moves in words', /Air Vehicle \(AV\): moved later 5\.00 \(\$M\)/.test(main().querySelector('.chmvsvg').textContent) && /moved earlier 2\.00/.test(main().querySelector('.chmvsvg').textContent));
  await pick('fy', 'FY2027');
  C.eq('FY2027 picked: Tessa D (FY2026) leaves the earlier tile', tiles(), [D(5e6), 0, D(1.5e6), D(0.7e6), D(0.25e6)]);
  await pick('fy', 'All');

  // IPT: offered once a PMO with a named Sub-PMO is picked
  C.chk('no IPT picker until a PMO is picked', !main().querySelector('select[data-act=chf][data-f=ipt]'));
  await pick('pmo', 'Air Vehicle (AV)');
  C.eq('the IPT picker offers the office’s Sub-PMOs and (no IPT)', [...main().querySelector('select[data-act=chf][data-f=ipt]').options].map(o => o.textContent), ['All', 'Wing Team', '(no IPT)']);
  await pick('ipt', 'Wing Team');
  C.eq('Wing Team: Tessa A and Tessa B only, and the count says which IPT', [main().querySelector('#uiChCount').textContent], ['2 requirements. IPT Wing Team: only the rows whose Sub-PMO is Wing Team.']);
  C.eq('… what moved is Wing Team’s: Tessa B later, nothing earlier, Tessa A’s new event and growth, nothing dropped', tiles(), [D(5e6), 0, D(1.5e6), 0, D(0.25e6)]);
  C.eq('… awards by month counts Wing Team’s rows alone (3.25 + 1.5 + 5.0)', Number(main().querySelector('#uiChMonths tfoot td[data-k=total]').getAttribute('data-c')), D(9.75e6));
  C.chk('… its requirements still open, found among every requirement', [...main().querySelectorAll('[data-ch=months], [data-ch=moved]')].length === 2 && !!main().querySelector('#uiChMoved .tg[data-act=reqopen]'));
  await pick('pmo', 'All');
  C.chk('the PMO set back to All takes the IPT off', !main().querySelector('select[data-act=chf][data-f=ipt]') && !main().querySelector('#uiChIpt'));

  // will it reach the goal: the page prints SP.goalLandingOf's figures; option B
  const M = SP.buildModel(SP.state.pulls.current, SP.state.settings, SP.getView ? SP.getView() : SP.defaultView(), null);
  const G = SP.goalLandingOf(SP.overviewOf(M, null));
  const says = () => [...main().querySelectorAll('[data-ch=goal] .glrow')].map(g => [g.getAttribute('data-bk'), g.querySelector('.glsay').getAttribute('data-short')]);
  C.eq('the goal card has a bar for each block, each saying what SP.goalLandingOf says it is short', says(), G.map(b => [b.key, b.short === null ? '' : String(b.short)]));
  const short = G.filter(b => b.short > 0);
  C.chk('the fixture has a block that falls short, so the table can be seen', short.length > 0, J(G.map(b => [b.key, b.land, b.goal])));
  C.chk('FY on All: one line naming the short years, and no quarter table', !!doc.getElementById('uiChGoalLine') && !main().querySelector('.chgoalt')
    && short.every(b => doc.getElementById('uiChGoalLine').textContent.includes(b.apLabel + ' FY' + b.fy + ' (' + SP.fmtMText(b.short) + ')')), doc.getElementById('uiChGoalLine') && doc.getElementById('uiChGoalLine').textContent);
  await pick('fy', 'FY' + short[0].fy);
  const tbl = main().querySelector('.chgoalt[data-bk="' + short[0].key + '"]');
  C.chk('an FY picked: the quarter table of the year that falls short, and no line', !!tbl && !doc.getElementById('uiChGoalLine'));
  C.eq('… its cells are the quarters’ goal, plan and short', ['goal', 'plan', 'short'].map(k => [...tbl.querySelectorAll('td[data-k=' + k + ']')].map(td => Number(td.getAttribute('data-c')))),
    ['goal', 'plan', 'short'].map(k => short[0].quarters.map(q => q[k])));
  C.eq('no script error on the page', J(tt.errors.filter(e => !/^Not implemented: (Window's scrollTo\(\) method|HTMLInputElement\.prototype\.click|HTMLCanvasElement)/.test(String(e)))), '[]');
  tt.close();
} catch (err) {
  console.error(err);
  C.chk('the test ran to its end', false, (err && err.message) || String(err));
}
C.done();
