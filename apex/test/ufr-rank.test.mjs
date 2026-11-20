// My ranking of the unfunded list (CONTRACT §43). The keeper puts each appropriation and fiscal year's unfunded lines in
// an order of their own, 1 to N; that order is used in place of the tracker's on the Unfunded page, the PDFs and a view-only
// copy; a tracker imported again replaces everything about a line and keeps the ranking, a line being known by its CCaR
// record and its title together; every disconnect between the two is flagged. Invented data; every expectation is written
// out by hand from the lines below.
//
//   node apex/test/ufr-rank.test.mjs
process.env.TZ = 'America/New_York';
import { loadTool, pageHtml, checks } from './harness.mjs';

const C = checks('ufr-rank');
const J = x => JSON.stringify(x);
const settle = (ms = 40) => new Promise(res => setTimeout(res, ms));
const K = k => k * 100000;                                   // $K -> cents
const line = (ap, row, rank, title, ccar, k, pmo) => ({ ap, fy: 2027, sheet: ap === 'om' ? 'O&M' : 'Initial Spares', row, rank: String(rank), title, pmo: pmo || 'AV', ccar,
  cents: [K(k), 0, 0, 0, 0, 0, 0], total: K(k), status: 'Unfunded', exec: 'Yes', sfcb: '' });
// THE TRACKER, FY2027:   O&M   1 Alpha C1 100   2 Bravo C2 200   3 Charlie C3 300   4 Delta C4 400        Spares   1 Echo C5 50
const T1 = { ok: true, fy: 2027, name: 'UFR FY27.xlsx', unit: 1000, tabs: [], notes: [], ignored: [], lines: [
  line('om', 10, 1, 'Alpha', 'C1', 100), line('om', 11, 2, 'Bravo', 'C2', 200), line('om', 12, 3, 'Charlie', 'C3', 300), line('om', 13, 4, 'Delta', 'C4', 400), line('sp', 10, 1, 'Echo', 'C5', 50, 'PP')] };
// THE TRACKER IMPORTED AGAIN, with everything moved about:
//   O&M   1 Bravo C2 250 (was 200)   2 Delta c4 " delta " 450 (the same line, spelled another way)   3 Foxtrot C6 600 (new)   4 Alpha C1 150
//         Charlie C3 is gone;  5 Alpha C9 70 (the same title, another record: another line)
const T2 = { ok: true, fy: 2027, name: 'UFR FY27 v2.xlsx', unit: 1000, tabs: [], notes: [], ignored: [], lines: [
  line('om', 10, 1, 'Bravo', 'C2', 250), line('om', 11, 2, ' delta ', 'c4', 450), line('om', 12, 3, 'Foxtrot', 'C6', 600), line('om', 13, 4, 'Alpha', 'C1', 150), line('om', 14, 5, 'Alpha', 'C9', 70),
  line('sp', 10, 1, 'Echo', 'C5', 50, 'PP')] };
const HEADERS = ['FY', 'Month', 'CCaR No', 'Title', 'Budget', 'C/L', 'SB', 'Plan Event', 'Date', 'Amount', 'Alloc', 'Event Description', 'OPR', 'PMT PID#', 'Contracting POC', 'Material Lead', 'PM/TPOC',
  'Obligation Category', 'PMO', 'Sub-PMO', 'Category', 'Navy SI Code', 'IPT', 'Spares WBS', 'Quantity', 'CLINs', 'AF EEIC', 'RCN', 'PSR', 'CSR', 'Contract Mod', 'Cost Element'];   // CONTRACT §2, restated
const prow = (cc, title, budget) => ({ FY: 2027, 'CCaR No': cc, Title: title, Budget: budget, 'Plan Event': 'E ' + cc, Date: '2026-12-01', Amount: '1000000', Alloc: 'Not Allocated', PMO: 'Air Vehicle (AV)' });
const csv = rows => [HEADERS.join(',')].concat(rows.map(o => HEADERS.map(h => (o[h] === undefined ? '' : o[h])).join(','))).join('\n');
const OM = csv([prow('C1', 'Alpha', 'USAF O&M- Tessa Base Discretionary')]), SPR = csv([prow('C5', 'Echo', 'USAF Initial Spares Tessa')]);
const ranksOf = (X, ap) => Object.keys(X.ufr).flatMap(k => X.ufr[k].lines).filter(l => l.ap === ap).sort((a, b) => Number(a.rank) - Number(b.rank)).map(l => [l.rank, l.title.trim(), l.rankFile, l.total / 100000]);
const errs = t => t.errors.filter(e => !/^Not implemented: (Window's scrollTo\(\) method|HTMLInputElement\.prototype\.click|HTMLCanvasElement)/.test(String(e)));

try {
  // ============================================================================ the ranking itself (SP.ufrRanked, SP.ufrMove)
  const t = loadTool({ modules: ['util', 'xlsx-read', 'import', 'engine', 'publish', 'pdf', 'xlsx-write', 'store'] });
  const SP = t.SP;
  const U1 = { 2027: T1 }, U2 = { 2027: T2 };
  let X = SP.ufrRanked(U1, undefined);
  C.eq('never ranked: every line is where the tracker has it, nothing is flagged, no group is the keeper’s', J([ranksOf(X, 'om'), ranksOf(X, 'sp'), X.flags, X.groups['om|2027'].mine, X.groups['om|2027'].n]),
    J([[['1', 'Alpha', '1', 100], ['2', 'Bravo', '2', 200], ['3', 'Charlie', '3', 300], ['4', 'Delta', '4', 400]], [['1', 'Echo', '1', 50]], [], false, 4]));
  C.chk('the lists given are not changed', J(U1) === J({ 2027: T1 }) && !('rk' in T1.lines[0]));
  const keyOf = title => X.ufr[2027].lines.find(l => l.title === title).rk;
  // Delta to rank 1: Delta, Alpha, Bravo, Charlie
  let R = { 'om|2027': SP.ufrMove(U1, undefined, 'om|2027', keyOf('Delta'), 1) };
  C.eq('Delta moved to 1: the keeper’s order is the whole group, each line by its record and title', J(R['om|2027'].map(e => [e.c, e.t])), J([['C4', 'Delta'], ['C1', 'Alpha'], ['C2', 'Bravo'], ['C3', 'Charlie']]));
  X = SP.ufrRanked(U1, R);
  C.eq('ranked: 1 to N in the keeper’s order, the tracker’s rank beside it; the other appropriation is untouched', J([ranksOf(X, 'om'), ranksOf(X, 'sp'), X.groups['om|2027'].mine, X.groups['sp|2027'].mine]),
    J([[['1', 'Delta', '4', 400], ['2', 'Alpha', '1', 100], ['3', 'Bravo', '2', 200], ['4', 'Charlie', '3', 300]], [['1', 'Echo', '1', 50]], true, false]));
  C.eq('the disconnect is flagged, once for the group, naming every line that differs', J(X.flags),
    J(['O&M FY2027: 4 lines are ranked differently from the tracker, and your rank is used: “Delta” (CCaR C4) is 1 (tracker 4); “Alpha” (CCaR C1) is 2 (tracker 1); “Bravo” (CCaR C2) is 3 (tracker 2); “Charlie” (CCaR C3) is 4 (tracker 3).']));
  // Bravo to 2: Delta, Bravo, Alpha, Charlie. Charlie is 4 on both, so three differ... the tracker has Charlie 3: four differ still but Bravo agrees (2 and 2)
  R = { 'om|2027': SP.ufrMove(U1, R, 'om|2027', keyOf('Bravo'), 2) };
  X = SP.ufrRanked(U1, R);
  C.eq('Bravo moved to 2: Delta, Bravo, Alpha, Charlie; a line where both agree is not flagged', J([ranksOf(X, 'om').map(r => r[1]), X.flags[0].match(/“\w+”/g)]), J([['Delta', 'Bravo', 'Alpha', 'Charlie'], ['“Delta”', '“Alpha”', '“Charlie”']]));
  C.eq('a place past the end is the last place; a place before the start is the first; a line not in the group moves nothing',
    J([SP.ufrMove(U1, R, 'om|2027', keyOf('Delta'), 99).map(e => e.t), SP.ufrMove(U1, R, 'om|2027', keyOf('Charlie'), 0).map(e => e.t), SP.ufrMove(U1, R, 'om|2027', 'nope', 1), SP.ufrMove(U1, R, 'ff|2027', keyOf('Delta'), 1)]),
    J([['Bravo', 'Alpha', 'Charlie', 'Delta'], ['Charlie', 'Delta', 'Bravo', 'Alpha'], null, null]));
  // ---- the tracker imported again: R is Delta, Bravo, Alpha, Charlie
  //   on T2: Delta (c4, " delta ") 450; Bravo 250; Alpha C1 150 keep the keeper's order -> 1 Delta, 2 Bravo, 3 Alpha
  //   then what the keeper has not ranked, in the tracker's order: Foxtrot (tracker 3) -> 4, Alpha C9 (tracker 5) -> 5
  //   Charlie is in the ranking and not on the tracker
  X = SP.ufrRanked(U2, R);
  C.eq('imported again: every figure is the new tracker’s, and the ranking stays on its lines (found by record and title, whatever their case and spaces)', J(ranksOf(X, 'om')),
    J([['1', 'delta', '2', 450], ['2', 'Bravo', '1', 250], ['3', 'Alpha', '4', 150], ['4', 'Foxtrot', '3', 600], ['5', 'Alpha', '5', 70]]));
  C.eq('the same title on another CCaR record is another line: it is new, not the ranked one', J(X.ufr[2027].lines.filter(l => l.title === 'Alpha').map(l => [l.ccar, l.rank, !!l.rankNew])), J([['C1', '3', false], ['C9', '5', true]]));
  // the same CCaR record under another title is another line too: the title is half of what a line is known by
  const two = SP.ufrRanked({ 2027: Object.assign({}, T1, { lines: [line('om', 10, 1, 'Bravo Two', 'C2', 10), line('om', 11, 2, 'Bravo', 'C2', 20)] }) }, { 'om|2027': [{ k: keyOf('Bravo'), c: 'C2', t: 'Bravo' }] });
  C.eq('the same CCaR record under another title is another line: the ranked Bravo is 1, Bravo Two is new and 2', J(ranksOf(two, 'om').map(r => [r[0], r[1]]).concat([two.ufr[2027].lines.map(l => !!l.rankNew)])), J([['1', 'Bravo'], ['2', 'Bravo Two'], [true, false]]));
  C.eq('every disconnect is flagged: ranks that differ, lines not ranked, a ranked line that is gone', J(X.flags), J([
    'O&M FY2027: 3 lines are ranked differently from the tracker, and your rank is used: “ delta ” (CCaR c4) is 1 (tracker 2); “Bravo” (CCaR C2) is 2 (tracker 1); “Alpha” (CCaR C1) is 3 (tracker 4).',
    'O&M FY2027: “Foxtrot” (CCaR C6) is on the tracker and not in your ranking; it is 4, after the lines you ranked.',
    'O&M FY2027: “Alpha” (CCaR C9) is on the tracker and not in your ranking; it is 5, after the lines you ranked.',
    'O&M FY2027: “Charlie” (CCaR C3) is in your ranking and is no longer on the tracker; it is not listed.']));
  C.eq('the group says how many of its ranked lines are gone', X.groups['om|2027'].gone, 1);
  // moving a line after that import keeps Charlie in the ranking, after the lines the tracker has
  const R2 = SP.ufrMove(U2, R, 'om|2027', X.ufr[2027].lines.find(l => l.title === 'Foxtrot').rk, 1);
  C.eq('a move after the import ranks every line now on the tracker and keeps the one that is gone, last', J(R2.map(e => e.t.trim() + ' ' + e.c)), J(['Foxtrot C6', 'delta c4', 'Bravo C2', 'Alpha C1', 'Alpha C9', 'Charlie C3']));
  // two lines with one record and one title are told apart by their order on the tracker
  const twin = { 2027: Object.assign({}, T1, { lines: [line('om', 10, 1, 'Alpha', 'C1', 100), line('om', 11, 2, 'Alpha', 'C1', 200), line('om', 12, 3, 'Bravo', 'C2', 300)] }) };
  const XT = SP.ufrRanked(twin, undefined), kk = XT.ufr[2027].lines.map(l => l.rk);
  C.chk('two lines with the same record and title have keys of their own', new Set(kk).size === 3);
  C.eq('and the second can be ranked above the first', J(ranksOf(SP.ufrRanked(twin, { 'om|2027': SP.ufrMove(twin, undefined, 'om|2027', kk[1], 1) }), 'om').map(r => r[3])), J([200, 100, 300]));
  // a ranking with no list loaded for it is kept and said
  C.eq('a ranking whose list is not loaded is kept, and flagged', J(SP.ufrRanked({}, R).flags), J(['O&M FY2027: your ranking of 4 lines is kept, and no unfunded list is loaded for it.']));

  // ---- the published plan follows the ranking
  SP.storeInit();
  SP.applyImport(await SP.parseFiles([{ name: 'om.csv', data: OM }, { name: 'sp.csv', data: SPR }], { now: '2026-11-09T12:00:00.000Z' }));
  SP.setSettings({ asOf: '2026-10' });
  const M = SP.buildModel(SP.state.pulls.current, SP.state.settings, SP.defaultView(), null);
  const D = SP.publishData(M, SP.ufrRanked(U1, R).ufr, null, {});
  C.eq('the PDFs’ unfunded list for O&M is in the keeper’s order, numbered 1 to N', J(D.docs.find(d => d.id === 'ap:om').ufr.map(l => [l.rank, l.title])), J([['1', 'Delta'], ['2', 'Bravo'], ['3', 'Alpha'], ['4', 'Charlie']]));

  // ---- the store keeps it
  C.chk('setUfrRank keeps a ranking and marks the plan unsaved; the same again changes nothing', (() => { SP.setUfr(T1, '2026-11-10T12:00:00.000Z'); SP.markSaved && SP.markSaved(); const a = SP.setUfrRank('om|2027', R['om|2027']), b = SP.setUfrRank('om|2027', R['om|2027']);
    return a === true && b === false && J(SP.state.ufrRank['om|2027'].map(e => e.t)) === J(['Delta', 'Bravo', 'Alpha', 'Charlie']) && SP.isDirty(); })());
  SP.setUfr(T2, '2026-11-12T12:00:00.000Z');
  C.chk('importing the tracker again replaces the list whole and leaves the ranking as it was', SP.state.ufr['2027'].name === 'UFR FY27 v2.xlsx' && SP.state.ufr['2027'].lines.length === 6
    && J(SP.state.ufrRank['om|2027'].map(e => e.t)) === J(['Delta', 'Bravo', 'Alpha', 'Charlie']));
  const saved = SP.savedHtml();
  const viewOnly = SP.viewOnlyHtml('2026-11-12T13:00:00.000Z');
  C.chk('null takes a ranking off', SP.setUfrRank('om|2027', null) === true && SP.state.ufrRank === undefined);
  t.close();
  const t2 = loadTool({ html: saved });
  t2.SP.storeInit();
  C.eq('a saved plan opens with the ranking', J(t2.SP.state.ufrRank['om|2027'].map(e => e.t)), J(['Delta', 'Bravo', 'Alpha', 'Charlie']));
  t2.close();
  const bad = loadTool({ html: saved.replace('"ufrRank":{"om|2027":[', '"ufrRank":{"om|2027":[7,') });
  bad.SP.storeInit();
  C.chk('a saved plan whose ranking is not a list of lines is not opened as a plan', !bad.SP.state.ufrRank && !bad.SP.state.ufr, J(Object.keys(bad.SP.state)));
  bad.close();

  // ============================================================================ on the page
  const A = loadTool({ html: pageHtml({}) }), W = A.window, doc = W.document, S = A.SP;
  for (let i = 0; i < 200 && !doc.getElementById('uiMain'); i++) await settle(5);
  S.applyImport(await S.parseFiles([{ name: 'om.csv', data: OM }, { name: 'sp.csv', data: SPR }], { now: '2026-11-09T12:00:00.000Z' }));
  S.setSettings({ asOf: '2026-10' });
  S.setUfr(T1, '2026-11-10T12:00:00.000Z');
  await settle(60);
  const main = () => doc.getElementById('uiMain');
  const click = async el => { el.dispatchEvent(new W.MouseEvent('click', { bubbles: true })); await settle(); };
  await click(doc.querySelector('#uiNav [data-v=ufr]'));
  const rows = () => [...main().querySelectorAll('#uiUfrT tbody tr[data-ufr]')].map(tr => { const i = tr.querySelector('input.urk'), f = tr.querySelector('.urkf');
    return [i ? i.value : tr.querySelector('.urank').textContent, tr.querySelector('.tg').textContent, f ? f.textContent : '']; });
  const box = title => [...main().querySelectorAll('#uiUfrT tbody tr[data-ufr]')].find(tr => tr.querySelector('.tg').textContent === title);
  const type = async (title, v) => { const i = box(title).querySelector('input.urk'); i.value = v; i.dispatchEvent(new W.Event('change', { bubbles: true })); await settle(); };
  C.eq('the Unfunded page: each line’s rank is in a box, as the tracker has it', J(rows()), J([['1', 'Alpha', ''], ['2', 'Bravo', ''], ['3', 'Charlie', ''], ['4', 'Delta', ''], ['1', 'Echo', '']]));
  C.chk('it says how to rank, and nothing is flagged yet', /Type a rank, or press ▲ ▼/.test(main().querySelector('#uiUfrRankHow').textContent) && !main().querySelector('#uiUfrRankChk') && !main().querySelector('[data-act=ufrreset]'));
  C.chk('a rank box says its range: 1 to the number of lines of its appropriation and year', box('Delta').querySelector('input.urk').max === '4' && box('Echo').querySelector('input.urk').max === '1');
  S.markSaved && S.markSaved();
  await type('Delta', '1');
  C.eq('1 typed in Delta’s box: Delta, Alpha, Bravo, Charlie, each with the tracker’s rank noted under it', J(rows()), J([['1', 'Delta', 'tracker 4'], ['2', 'Alpha', 'tracker 1'], ['3', 'Bravo', 'tracker 2'], ['4', 'Charlie', 'tracker 3'], ['1', 'Echo', '']]));
  C.chk('the message says where it went, and the plan is unsaved', /“Delta” is rank 1 of 4\./.test(doc.querySelector('.msg').textContent) && S.isDirty(), doc.querySelector('.msg').textContent);
  C.chk('the group says it is in your ranking and offers the tracker’s ranks back; the other group does not', (() => { const g = [...main().querySelectorAll('tr.ugrp')].map(x => x.textContent);
    return /^O&M FY2027 in your ranking Use the tracker’s ranks$/.test(g[0]) && g[1] === 'Initial Spares FY2027'; })(), [...main().querySelectorAll('tr.ugrp')].map(x => x.textContent).join(' | '));
  C.eq('the disconnect is listed on the page', J([...main().querySelectorAll('#uiUfrRankChk li')].map(li => li.textContent.replace(/:.*/, ''))), J(['O&M FY2027']));
  await click(box('Bravo').querySelector('[data-act=ufrup]'));
  C.eq('▲ on Bravo moves it up one: Delta, Bravo, Alpha, Charlie', J(rows().slice(0, 4).map(r => r[1])), J(['Delta', 'Bravo', 'Alpha', 'Charlie']));
  await click(box('Delta').querySelector('[data-act=ufrdown]'));
  C.eq('▼ on Delta moves it down one: Bravo, Delta, Alpha, Charlie', J(rows().slice(0, 4).map(r => r[1])), J(['Bravo', 'Delta', 'Alpha', 'Charlie']));
  await click(box('Bravo').querySelector('[data-act=ufrup]'));
  C.eq('▲ on the first line leaves it first', J(rows().slice(0, 4).map(r => r[1])), J(['Bravo', 'Delta', 'Alpha', 'Charlie']));
  await type('Alpha', '');
  C.chk('an empty box changes nothing and says a rank is a whole number', J(rows().slice(0, 4).map(r => r[1])) === J(['Bravo', 'Delta', 'Alpha', 'Charlie']) && /A rank is a whole number from 1 to 4/.test(doc.querySelector('.msg').textContent));
  await type('Alpha', '9');
  C.chk('9 typed where there are 4 puts the line last, and says so', J(rows().slice(0, 4).map(r => r[1])) === J(['Bravo', 'Delta', 'Charlie', 'Alpha']) && /“Alpha” is rank 4 of 4 \(9 is outside 1 to 4\)/.test(doc.querySelector('.msg').textContent), doc.querySelector('.msg').textContent);
  // a filter on: the rank typed is the line's place in the whole list, not among the lines shown
  const q = doc.getElementById('uiUfrQ'); q.value = 'charlie'; q.dispatchEvent(new W.Event('input', { bubbles: true })); await settle();
  C.eq('with the list narrowed to Charlie, its box still shows 3', J(rows()), J([['3', 'Charlie', '']]));
  await type('Charlie', '1');
  q.value = ''; doc.getElementById('uiUfrQ').value = ''; doc.getElementById('uiUfrQ').dispatchEvent(new W.Event('input', { bubbles: true })); await settle();
  C.eq('1 typed there puts it first of the whole list: Charlie, Bravo, Delta, Alpha', J(rows().slice(0, 4).map(r => r[1])), J(['Charlie', 'Bravo', 'Delta', 'Alpha']));
  // the tracker imported again, through the store as the Settings button does
  S.setUfr(T2, '2026-11-12T12:00:00.000Z'); await click(doc.querySelector('#uiNav [data-v=ufr]'));
  //   the keeper's order Charlie, Bravo, Delta, Alpha: Charlie is gone -> 1 Bravo, 2 delta, 3 Alpha(C1), then Foxtrot 4, Alpha(C9) 5
  C.eq('after the tracker is imported again: the ranking holds, new lines follow and say so', J(rows().slice(0, 5)), J([['1', 'Bravo', ''], ['2', ' delta ', ''], ['3', 'Alpha', 'tracker 4'], ['4', 'Foxtrot', 'not ranked by you'], ['5', 'Alpha', 'not ranked by you']]));
  C.eq('the page lists every disconnect', [...main().querySelectorAll('#uiUfrRankChk li')].length, 4);
  C.chk('and offers to take the line that is gone out of the ranking', /Take the 1 line no longer on the tracker out of your ranking/.test(main().querySelector('[data-act=ufrforget]').textContent));
  await click(doc.querySelector('#uiNav [data-v=settings]'));
  C.chk('Settings lists the same disconnects under To check on the unfunded list', [...main().querySelectorAll('#uiUfrNotes li')].filter(li => /your rank|your ranking/.test(li.textContent)).length === 4, main().querySelector('#uiUfrNotes') && main().querySelector('#uiUfrNotes').textContent);
  await click(doc.querySelector('#uiNav [data-v=ufr]'));
  await click(main().querySelector('[data-act=ufrforget]'));
  C.chk('taken out: Charlie is no longer in the ranking, and three disconnects are left', J(S.state.ufrRank['om|2027'].map(e => e.t.trim())) === J(['Bravo', 'Delta', 'Alpha']) && [...main().querySelectorAll('#uiUfrRankChk li')].length === 3 && !main().querySelector('[data-act=ufrforget]'),
    J(S.state.ufrRank['om|2027']));
  // a view-only copy: the keeper's ranks, as text, with nothing to change and nothing flagged
  const vo = loadTool({ html: S.viewOnlyHtml('2026-11-12T13:00:00.000Z') });
  for (let i = 0; i < 200 && !vo.window.document.getElementById('uiMain'); i++) await settle(5);
  vo.window.document.querySelector('#uiNav [data-v=ufr]').dispatchEvent(new vo.window.MouseEvent('click', { bubbles: true })); await settle(60);
  const vm = vo.window.document.getElementById('uiMain');
  C.eq('a view-only copy shows the keeper’s ranks', J([...vm.querySelectorAll('#uiUfrT tbody tr[data-ufr]')].slice(0, 5).map(tr => [tr.querySelector('.urank').textContent, tr.querySelector('.tg').textContent])),
    J([['1', 'Bravo'], ['2', ' delta '], ['3', 'Alpha'], ['4', 'Foxtrot'], ['5', 'Alpha']]));
  C.chk('and has no rank box, no ▲▼, no reset, no list of disconnects, and refuses a ranking', !vm.querySelector('input.urk') && !vm.querySelector('.urkb') && !vm.querySelector('[data-act=ufrreset]') && !vm.querySelector('#uiUfrRankChk')
    && !vm.querySelector('#uiUfrRankHow') && vo.SP.setUfrRank('om|2027', null) === false && !!vo.SP.state.ufrRank);
  C.eq('no script error in the view-only copy', J(errs(vo)), '[]');
  vo.close();
  // back to the tracker's ranks
  await click(main().querySelector('[data-act=ufrreset]'));
  C.eq('Use the tracker’s ranks: the list is as the tracker has it, and nothing is flagged', J([rows().slice(0, 5), !!main().querySelector('#uiUfrRankChk'), S.state.ufrRank === undefined]),
    J([[['1', 'Bravo', ''], ['2', ' delta ', ''], ['3', 'Foxtrot', ''], ['4', 'Alpha', ''], ['5', 'Alpha', '']], false, true]));
  // Import from last version brings the ranking with the lists
  S.setUfrRank('sp|2027', [{ k: 'x', c: 'C5', t: 'Echo' }]);
  const fresh = loadTool({ modules: ['util', 'xlsx-read', 'import', 'engine', 'publish', 'pdf', 'xlsx-write', 'store'] });
  fresh.SP.storeInit();
  const took = fresh.SP.takeSettings(S.savedHtml(), 'APEX last.html');
  C.chk('Import from last version takes the ranking with the unfunded lists', took.ok === true && J(fresh.SP.state.ufrRank) === J({ 'sp|2027': [{ k: 'x', c: 'C5', t: 'Echo' }] }) && !!fresh.SP.state.ufr['2027'], took.message);
  fresh.close();
  C.eq('no script error on the page', J(errs(A)), '[]');
  A.close();
  void viewOnly;
} catch (err) {
  console.error(err);
  C.chk('the test ran to its end', false, (err && err.message) || String(err));
}
C.done();
