// Import from last version (CONTRACT §34): what was typed into the APEX file used before is taken into a new one, so nothing
// is typed twice. A page with no pull takes the old plan whole; a page that already holds a pull takes only the settings,
// the publishing settings and the unfunded lists, and keeps its own pulls. Invented data throughout.
//
//   node apex/test/last-version.test.mjs
process.env.TZ = 'America/New_York';
import { loadTool, pageHtml, checks } from './harness.mjs';

const C = checks('last-version');
const J = x => JSON.stringify(x);
const settle = (ms = 20) => new Promise(res => setTimeout(res, ms));
const HEADERS = ['FY', 'Month', 'CCaR No', 'Title', 'Budget', 'C/L', 'SB', 'Plan Event', 'Date', 'Amount', 'Alloc', 'Event Description',
  'OPR', 'PMT PID#', 'Contracting POC', 'Material Lead', 'PM/TPOC', 'Obligation Category', 'PMO', 'Sub-PMO', 'Category', 'Navy SI Code',
  'IPT', 'Spares WBS', 'Quantity', 'CLINs', 'AF EEIC', 'RCN', 'PSR', 'CSR', 'Contract Mod', 'Cost Element'];   // CONTRACT §2, restated
const q = v => { const s = v === undefined || v === null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = rows => [HEADERS.join(',')].concat(rows.map(o => HEADERS.map(h => q(o[h])).join(','))).join('\n');
const row = (FY, ccar, Title, Date, Amount) => ({ FY, 'CCaR No': ccar, Title, Budget: 'USAF O&M- Tessa Base Discretionary', 'Plan Event': 'E ' + ccar, Date, Amount, Alloc: 'Not Allocated', PMO: 'Air Vehicle (AV)' });
const OLD_PULL = [row(2027, 'TS0001', 'Tessa A', '2026-12-01', '1000000')];
const NEW_PULL = [row(2027, 'TS0001', 'Tessa A', '2026-12-01', '1500000'), row(2027, 'TS0009', 'Tessa New', '2027-02-01', '700000')];
const line = (fy, ccar, cents) => ({ ap: 'om', fy, sheet: 'O&M', row: 10, rank: '1', title: 'Line ' + ccar, pmo: 'AV', ccar, cents: [cents, 0, 0, 0, 0, 0, 0], total: cents, status: '', exec: '', sfcb: '' });
const ufrOf = (fy, ccar, cents) => ({ ok: true, fy, name: 'UFR FY' + fy + '.xlsx', unit: 1000, tabs: [], lines: [line(fy, ccar, cents)], notes: [], ignored: [] });
const MODS = ['util', 'xlsx-read', 'import', 'engine', 'publish', 'pdf', 'xlsx-write', 'store'];
const fresh = () => { const t = loadTool({ modules: MODS }); t.SP.storeInit(); return t; };
const pullsOf = SP => J(SP.state.pulls);

try {
  // ---- the last version: a pull, settings typed by hand, descriptions, FM Leads and an unfunded list, saved
  const old = fresh();
  old.SP.applyImport(await old.SP.parseFiles([{ name: 'om.csv', data: csv(OLD_PULL) }], { now: '2026-10-09T12:00:00.000Z' }));
  old.SP.setSettings({ asOf: '2026-09', firstFY: 2026, authorized: { 'om|2027': 123456700, 'ff|2026': 5000000 }, special: ['TS0001'], budgets: { 'usaf o&m- tessa base discretionary': { svc: 'USAF ANG' } } });
  old.SP.setPublish({ desc: { ts0001: 'Old description' }, fm: { om: 'O. Lead', ff: 'F. Lead' }, program: 'Tessa Program' });
  old.SP.setUfr(ufrOf(2027, 'TS0001', 20000000), '2026-10-10T12:00:00.000Z');
  const OLD_SET = J(old.SP.state.settings), OLD_PUB = J(old.SP.state.publish), OLD_UFR = J(old.SP.state.ufr);
  const file = old.SP.savedHtml();
  old.close();

  // ---- into a page that already holds newer pulls: only what was typed is taken
  const t = fresh(), SP = t.SP;
  let asked = [], answer = true;
  t.window.confirm = msg => { asked.push(String(msg)); return answer; };
  SP.applyImport(await SP.parseFiles([{ name: 'om.csv', data: csv(NEW_PULL) }], { now: '2026-11-09T12:00:00.000Z' }));
  SP.setSettings({ asOf: '2026-10' });
  SP.setPublish({ desc: { ts0009: 'Typed here' }, fm: { opn: 'N. Lead' } });
  SP.setUfr(ufrOf(2027, 'TS0009', 111), '2026-11-10T12:00:00.000Z');
  SP.setUfr(ufrOf(2028, 'TS0009', 222), '2026-11-10T12:00:00.000Z');
  const PULLS = pullsOf(SP), HIST = J(SP.state.history), LAST = J(SP.state.lastImport), U28 = J(SP.state.ufr['2028']), MINE = J([SP.state.settings, SP.state.publish, SP.state.ufr]);
  // asked first, and "no" changes nothing
  answer = false;
  let r = SP.takeSettings(file, 'APEX last.html');
  C.chk('it asks before replacing what was typed here, naming what the file brings and that the pulls are not changed',
    asked.length === 1 && /2 Authorized amounts/.test(asked[0]) && /1 description, 2 FM Leads/.test(asked[0]) && /unfunded list for FY2027/.test(asked[0])
    && /pulls and BAE report are not changed, and Data through stays 2026-10/.test(asked[0]), asked[0]);
  C.chk('answering no takes nothing', r.ok === false && /Nothing was taken: you chose to keep/.test(r.message) && J([SP.state.settings, SP.state.publish, SP.state.ufr]) === MINE);
  answer = true;
  r = SP.takeSettings(file, 'APEX last.html');
  C.chk('answering yes takes it', r.ok === true && /^Took from “APEX last\.html”: the settings \(2 Authorized amounts, goal curves, Special CCaRs, 1 budget override, First FY\)/.test(r.message), r.message);
  const want = JSON.parse(OLD_SET); want.asOf = '2026-10';
  C.eq('the settings are the last version’s: the Authorized amounts, Special CCaRs, budget overrides and First FY', J(SP.state.settings), J(want));
  C.eq('Data through stays this page’s: it is the month this page’s own pull runs to', SP.state.settings.asOf, '2026-10');
  C.eq('the descriptions, FM Leads and program title are the last version’s', J(SP.state.publish), OLD_PUB);
  C.eq('the unfunded list of a year both hold is the last version’s; a year only this page holds is kept', J([J(SP.state.ufr['2027']) === J(JSON.parse(OLD_UFR)['2027']), J(SP.state.ufr['2028']) === U28]), J([true, true]));
  C.eq('this page’s pulls are untouched', pullsOf(SP), PULLS);
  C.eq('and so are its import history and last import report', J([J(SP.state.history), J(SP.state.lastImport)]), J([HIST, LAST]));
  C.chk('the page has unsaved work', SP.isDirty());
  // the figures follow: the Authorized typed in the last version is this model's
  const M = SP.buildModel(SP.state.pulls.current, SP.state.settings, SP.defaultView(), null), b = M.blocks.find(x => x.key === 'om|2027');
  C.eq('the model uses it: O&M FY2027’s Authorized is the amount typed in the last version, over this page’s newer plan', J([b.authorizedEntered, b.authorized, b.approved]), J([true, 123456700, 220000000]));
  // a second time changes nothing, and says so
  asked = [];
  r = SP.takeSettings(file, 'APEX last.html');
  C.chk('taking the same file again changes nothing, asks nothing and says so', r.ok === true && /^Nothing changed/.test(r.message) && asked.length === 0, r.message + ' ' + asked.length);
  t.close();

  // ---- into a page with nothing typed: no question
  const e = fresh();
  let n = 0; e.window.confirm = () => { n++; return true; };
  r = e.SP.takeSettings(file, 'APEX last.html');
  C.chk('an empty page takes it without a question', r.ok === true && n === 0, r.message);
  C.eq('with no pull of its own, Data through is the file’s', J([J(e.SP.state.settings) === OLD_SET, J(e.SP.state.publish) === OLD_PUB, J(e.SP.state.ufr) === OLD_UFR, J(e.SP.state.pulls)]), J([true, true, true, J({ current: {}, previous: {} })]));
  // refusals
  for (const [what, text, re] of [['a file that is not APEX', '<html><body>hello</body></html>', /is not a APEX file/], ['an APEX file with no plan saved', pageHtml({ modules: MODS }), /no plan saved in it/],
    ['a plan that cannot be read', file.replace('"tool":"sfcb-spend-plan"', '"tool":"other"'), /another tool/]]) {
    const before = J(e.SP.state), x = e.SP.takeSettings(text, 'x.html');
    C.chk('refused: ' + what, x.ok === false && re.test(x.message) && J(e.SP.state) === before, x.message);
  }
  e.close();

  // ---- the page: one button, which takes the plan whole into an empty page and the typed parts into one with data
  const tt = loadTool({ html: pageHtml({}) });
  const W = tt.window, doc = W.document, S2 = tt.SP;
  for (let i = 0; i < 200 && !doc.getElementById('uiMain'); i++) await settle(5);
  const enc = new TextEncoder().encode(file);
  const pick = async () => { const f = doc.getElementById('uiLastFile'); Object.defineProperty(f, 'files', { value: [{ name: 'APEX last.html', arrayBuffer: async () => enc.buffer.slice(0) }], configurable: true });
    f.dispatchEvent(new W.Event('change', { bubbles: true })); await settle(80); };
  C.chk('the button is in Manage data and on the empty page', [...doc.querySelectorAll('button[data-act=lastpick]')].map(b => b.textContent).join('|') === 'Import from last version…|Import from last version…'
    && !!doc.querySelector('#uiManage button[data-act=lastpick]'), [...doc.querySelectorAll('button[data-act=lastpick]')].length);
  await pick();
  C.chk('an empty page takes the last version whole: its pull too', !!S2.state.pulls.current.om && S2.state.pulls.current.om.rows.length === 1 && J(S2.state.publish) === OLD_PUB && /^Took the plan in “APEX last\.html”/.test(doc.querySelector('.msg').textContent),
    doc.querySelector('.msg').textContent);
  S2.applyImport(await S2.parseFiles([{ name: 'om.csv', data: csv(NEW_PULL) }], { now: '2026-11-09T12:00:00.000Z' }));
  await settle(40);
  C.chk('a newer pull imported afterwards replaces the old one and keeps the Authorized amounts', S2.state.pulls.current.om.rows.length === 2 && S2.state.settings.authorized['om|2027'] === 123456700);
  S2.setSettings({ authorized: {} }); S2.setPublish({ fm: { om: 'Someone else' } });
  const P2 = pullsOf(S2);
  await pick();
  C.chk('with a pull on the page the same button takes only what was typed, and leaves the pull', pullsOf(S2) === P2 && S2.state.settings.authorized['om|2027'] === 123456700 && S2.state.publish.fm.om === 'O. Lead'
    && /^Took from “APEX last\.html”/.test(doc.querySelector('.msg').textContent), doc.querySelector('.msg').textContent);
  C.chk('Help says how to move to a new version', (() => { doc.querySelector('[data-act=help]').dispatchEvent(new W.MouseEvent('click', { bubbles: true })); return /Moving to a new version of APEX/.test(doc.getElementById('uiMain').textContent); })());
  C.eq('no script error on the page', J(tt.errors.filter(x => !/^Not implemented: (Window's scrollTo\(\) method|HTMLInputElement\.prototype\.click)/.test(String(x)))), '[]');
  tt.close();
} catch (err) {
  console.error(err);
  C.chk('the test ran to its end', false, (err && err.message) || String(err));
}
C.done();
