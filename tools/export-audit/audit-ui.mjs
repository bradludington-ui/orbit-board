// THE NEW UI KEEPS ITS PROMISES (v2.00 UI track) -- the real board in jsdom, synthetic data made at run time only.
//
// The UI track puts a new face on the board: a sidebar, KPI cards, an Import box, a record that slides over. It computes
// no money and saves nothing of its own, but where one of its controls drives the board's own loaders, what that control
// promises is held here: what the board holds, what browser storage holds, and what the person is told. Every expected
// value below is written out by hand; the board is only ever asked what IS.
import { boot, seed, bootMark, bootRelease, settleBoards, stopAtFirstFailure } from './boot.mjs';

let failures = [];
stopAtFirstFailure(failures);   // in the mutation sweep only: see boot.mjs
// EVERY NAMED SCENARIO MUST RUN, as in every suite here: chk() records every scenario it hears from, and at the summary
// any `const name = '...'` in this file it never heard from is a failure, not a pass.
import { readFileSync as _selfRead } from 'node:fs';
import { fileURLToPath as _selfPath } from 'node:url';
const SEEN = new Set();
const chk = (scenario, where, what, got, want) => {
  SEEN.add(scenario);
  if (String(got) !== String(want)) failures.push({ scenario, where, what, got, want });
};
const keepBoards = () => [];   // no board here outlives its block

// ==== v2.00 UI chunk 3 (M1): the PMO batch ("All submissions at once") is all or nothing ====
// The chunk 2 review (M1): the batch's dry run answered OK to every question pmoTake asks, and the real run then asked
// the person. Cancel on a later file put the review back but left the earlier files' destination lists folded into the
// board -- DESTDB, prio27destdb and the saved file's destDb -- while the message said nothing on the board was changed.
// Brad, 12 Oct: "Fix UI M1 in chunk 3, with cancellation and failed-rollback tests." The fix: a file that would ask is
// refused before anything loads, named with its question, to be loaded on its own; a real run that still fails is put
// back whole; and the message says only what is checked to be true when it is said.
// THE FIXTURE. Eight requirements over three services; a review already holding TSS's submittal with one tick, the state
// every batch must leave as it found it. The files carry DESTINATION LISTS (a PMO copy sends its list with its
// submittal), so a load that goes part-way leaves a mark on the board itself, not only in the review.
const J = JSON.stringify;
const wait = ms => new Promise(r => setTimeout(r, ms));
const MINE = ['USAF', 'ANG', 'AFRC'];
const ITEMS = ['PSM', 'ATL', 'TSS', 'AV', 'MxS', 'LOG', 'PSM', 'ATL'].map((g, i) => ({ id: 'S0' + (i + 1), grp: g, team: g, sect: '',
  custom: false, title: 'Synthetic ' + (i + 1), event: 'Ev ' + (i + 1), ccar: 'SYN-' + (101 + i), fy26: [0, 0, 0],
  ask: [(5 + i) * 1000000, 2000000, 1000000], alloc: null }));
const SEEDED = ['Lockheed Martin', 'Pratt & Whitney', 'NAWCAD Patuxent River', 'NAWCWD China Lake', 'FRC East, Cherry Point',
  'NAWCAD Lakehurst', 'Defense Logistics Agency', 'OC-ALC Oklahoma City'];
const sub = o => J(Object.assign({ spmtPkg: 1, dir: 'submit', ap: '', fy: 2027, ts: 1789000000000, svc: MINE }, o));
const F = {
  TSS: ['TSS.json', sub({ pmo: 'TSS', by: 'PMO TSS', items: { S03: { asks: [7300000, 2000000, 1000000], cons: 'TSS says' } },
    base: { S03: { asks: [7000000, 2000000, 1000000] } } })],
  AV: ['AV.json', sub({ pmo: 'AV', by: 'PMO AV', dest: [{ k: 'dZulu', n: 'Depot Zulu', kind: 'gov', t: '' }],
    items: { S04: { asks: [8500000, 2000000, 1000000], cons: 'AV says', dest: { to: 'dZulu', end: '' } } },
    base: { S04: { asks: [8000000, 2000000, 1000000] } } })],
  AVagain: ['AV-again.json', sub({ pmo: 'AV', by: 'PMO AV', dest: [{ k: 'dZulu2', n: 'Depot Zulu Two', kind: 'gov', t: '' }],
    items: { S04: { asks: [8900000, 2000000, 1000000], cons: 'AV again', dest: { to: 'dZulu2', end: '' } } },
    base: { S04: { asks: [8000000, 2000000, 1000000] } } })],
  PSM: ['PSM.json', sub({ pmo: 'PSM', by: 'PMO PSM', items: { S01: { asks: [5100000, 2000000, 1000000], cons: 'PSM says' } },
    base: { S01: { asks: [5000000, 2000000, 1000000] } } })],
  // the three questions pmoTake asks: no fiscal year; another year; no programme office (that one is asked AFTER the
  // file's own destination list has been folded in)
  NOFY: ['PSM-no-year.json', sub({ fy: undefined, pmo: 'PSM', by: 'PMO PSM', dest: [{ k: 'dYank', n: 'Depot Yankee', kind: 'gov', t: '' }],
    items: { S01: { asks: [5007000, 2000000, 1000000], cons: 'no year', dest: { to: 'dYank', end: '' } } },
    base: { S01: { asks: [5000000, 2000000, 1000000] } } })],
  FY28: ['ATL-FY28.json', sub({ fy: 2028, pmo: 'ATL', by: 'PMO ATL', dest: [{ k: 'dXray', n: 'Depot Xray', kind: 'gov', t: '' }],
    items: { S02: { asks: [6008000, 2000000, 1000000], cons: 'for FY28', dest: { to: 'dXray', end: '' } } },
    base: { S02: { asks: [6000000, 2000000, 1000000] } } })],
  NOPMO: ['no-office.json', sub({ by: 'Pat', dest: [{ k: 'dWhis', n: 'Depot Whiskey', kind: 'gov', t: '' }],
    items: { S07: { asks: [11009000, 2000000, 1000000], cons: 'no office', dest: { to: 'dWhis', end: '' } } },
    base: { S07: { asks: [11000000, 2000000, 1000000] } } })],
  BROKEN: ['broken.json', '{"spmtPkg":1,"dir":"submit","pmo":"PSM",'],
  WIDTH: ['PSM-wrong-width.json', sub({ pmo: 'PSM', by: 'PMO PSM', items: { S01: { asks: [1, 2], cons: 'two figures' } },
    base: { S01: { asks: [5000000, 2000000, 1000000] } } })],
};
F.AVcopy = ['AV-copy.json', F.AV[1]];
// the questions as pmoTake asks them, word for word
const Q_NOFY = '⚠ That submittal does not say which fiscal year it was written for.\n\nOK — hold it for FY27, the year on screen. '
  + 'It can be applied only while FY27 is on screen.\nCancel — load nothing.';
const Q_FY28 = 'That submittal was written for FY28, and this board is on FY27.\n\nThis board has no FY28 yet. Switching to FY28 starts it.'
  + '\n\nOK — hold it for FY28. It can be applied only while FY28 is on screen.\nCancel — apply it to another year, or load nothing.';
const Q_FY28b = 'Hold it for FY27 instead — the year on screen?\n\nIt was written for FY28: its values, its text and its award dates would be '
  + 'applied to FY27.\n\nOK — hold it for FY27.\nCancel — load nothing.';
const Q_NOPMO = 'ℹ That submittal does not say which programme office it is from.\n\nIt was written before submittals carried a scope, so it '
  + 'may propose changes to ANY requirement on the board — including ones another office owns.\n\nReview it anyway?';
const SAME = 'The submittal review is exactly as it was before (1 held), and nothing on the board was changed.';

const open = () => {
  const X = boot();
  X.ev('Date.now=function(){ return 1790000000000; }; 1');
  seed(X.ev, { services: MINE, items: ITEMS, disc: [40000000, 10000000, 5000000], mand: [5000000, 2000000, 1000000], order: ITEMS.map(i => i.id) });
  X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    S.bm={disc:S.discSvc, mand:S.mandSvc, adds:[]}; render(); save(); 'ok'`);
  return X;
};
const files = (X, list) => { X.w.__f = list.map(([n, t]) => new X.w.File([t], n, { type: 'application/json' })); };
// one file through ⬅ Load a submittal file (importState), as a person loads one
const loadOne = async (X, f) => {
  const n0 = X.ev('PMOSUBS.length');
  files(X, [f]); X.ev(`importState({files:window.__f, value:''}); 1`);
  for (let i = 0; i < 80 && X.ev('PMOSUBS.length') === n0; i++) await wait(25);
};
// the board every batch starts from: the review holding TSS, its one row ticked, then storage watched -- every setItem
// and removeItem logged, and either one refusable (window.__fail) or reading made to throw (window.__noRead) on demand
const ready = async () => {
  const X = open();
  X.w.confirm = () => true; X.w.alert = () => {};
  await loadOne(X, F.TSS);
  X.ev(`subPick(0, 'S03', 'asks', true); 1`);
  X.ev(`(function(){ window.__w=[]; window.__fail=null; window.__noRead=false;
    var P=Object.getPrototypeOf(localStorage), set=P.setItem, rm=P.removeItem, get=P.getItem, key=P.key;
    P.setItem=function(k,v){ window.__w.push('set '+k); if(window.__fail && window.__fail(k)){ var e=new Error('storage refused (test)'); e.name='QuotaExceededError'; throw e; } return set.call(this,k,v); };
    P.removeItem=function(k){ window.__w.push('remove '+k); return rm.call(this,k); };
    P.getItem=function(k){ if(window.__noRead) throw new Error('storage unreadable (test)'); return get.call(this,k); };
    P.key=function(i){ if(window.__noRead) throw new Error('storage unreadable (test)'); return key.call(this,i); };
    return 1; })()`);
  X.ev('window.__ids=[PMOSUBS, PMOPICK, DESTDB, DESTDB.ents, DESTDB.lmap, DESTDB.ents[0], window.alert, window.confirm, window.setStat, window.subOpenReview, window.destPkgIn]; 1');
  return X;
};
// what IS: the review, the destination list, the plan, every key in storage and the save state -- then the saved payload,
// which buildSavedHtml makes by saving (save() moves the save count and writes the plan to storage), so all of it is read
// again after, with the header redrawn: `post` is the board as the next step finds it, and what that step is measured from
const look = X => JSON.parse(X.ev(`(function(){
  var snap=function(){
    var ls={}, ks=[]; for(var i=0;i<localStorage.length;i++) ks.push(localStorage.key(i)); ks.sort().forEach(function(k){ ls[k]=localStorage.getItem(k); });
    return { review:JSON.stringify({subs:PMOSUBS, pick:PMOPICK, open:subOpen}),
      offices:PMOSUBS.map(function(p){ return p.pmo||p.by; }), ticks:Object.keys(PMOPICK).filter(function(k){ return PMOPICK[k]; }), open:subOpen,
      dest:JSON.stringify(DESTDB), destNames:DESTDB.ents.map(function(e){ return e.n; }), destTs:DESTDB.ts,
      flowShared:!!(MS.flow && MS.flow.ents===DESTDB.ents), plan:JSON.stringify(MS),
      ls:ls, save:[_sideGen, _sideSaved, _dlOnly, DIRTY, _saveGen, JSON.stringify(_lsRefused)],
      head:(document.getElementById('saveState')||{}).textContent||'' }; };
  var o=snap(), pm=buildSavedHtml().match(/<script type="application\\/json" id="pubState">([\\s\\S]*?)<\\/script>/);
  o.payload=pm? pm[1] : null; saveStateShow(); o.post=snap();   // the header redrawn for what the test's own save() moved
  return JSON.stringify(o); })()`));
// the same objects as before the batch -- the review's, the destination list's, and the board's own functions
const ids = X => X.ev(`JSON.stringify([PMOSUBS, PMOPICK, DESTDB, DESTDB.ents, DESTDB.lmap, DESTDB.ents[0], window.alert, window.confirm, window.setStat,
  window.subOpenReview, window.destPkgIn].map(function(o, i){ return o===window.__ids[i]; }))`);
const reviewHtml = X => X.ev(`(function(){ subClose(); subOpenReview(); var e=document.getElementById('subBody'); return e? e.innerHTML : ''; })()`);
// the same browser, reopened from the board's saved file: what its destination list reads
const reopen = X => {
  const ls = look(X).ls, R = boot({ html: X.ev('buildSavedHtml()'), ls });
  const out = { dest: JSON.parse(R.ev('JSON.stringify(DESTDB.ents.map(function(e){ return e.n; }))')), errors: R.errors.slice() };
  return out;
};
// the batch, as a person runs it: every alert and every question kept; a question is answered Cancel unless said otherwise
const batch = async (X, list, { answer = false, onAsk = null } = {}) => {
  const said = [], asked = [];
  X.w.alert = m => { said.push(String(m)); };
  X.w.confirm = m => { asked.push(String(m)); if (onAsk) onAsk(); return answer; };
  X.ev('if(window.__ids){ window.__ids[6]=window.alert; window.__ids[7]=window.confirm; } 1');
  files(X, list);
  X.ev('window.__w=[]; 1');
  const r = await X.w.uiSubMany({ files: X.w.__f, value: '' });
  const res = JSON.parse(J(r));
  return { r: { ok: res.ok, taken: res.taken, asks: res.asks, back: res.back, same: res.same, left: res.left },
    said, asked, writes: JSON.parse(X.ev('JSON.stringify(window.__w)')), stat: X.ev(`document.getElementById('shareStat').textContent`) };
};
// a dry run that misses a question, so the real run asks it: the only way left to reach a Cancel part-way, and so the
// way the put-back is proved for each question
const missAsks = X => X.ev(`(function(){ var own=uiTakeDry; uiTakeDry=function(p, n){ var r=own(p, n); r.asks=[]; return r; }; return 1; })()`);
// EVERYTHING AS BEFORE: the review (the same objects, the same contents, TSS alone with its tick), the destination list
// (the same objects, the eight the board seeds), the plan, the saved payload, every key of storage, the save state, the
// review reopened, and the board reopened in the same browser
const asBefore = (name, where, X, A, H0) => {
  const Z = look(X), B = A.post;
  chk(name, where, 'the review exactly as before: what it holds, its tick, open', Z.review === B.review, true);
  chk(name, where, 'the review holds TSS alone, with its one tick, open', J([Z.offices, Z.ticks, Z.open]), J([['TSS'], ['0|S03|asks'], true]));
  chk(name, where, 'the same objects: PMOSUBS, PMOPICK, DESTDB, its ents, lmap and first entry, and alert, confirm, setStat, subOpenReview, destPkgIn',
    ids(X), J([true, true, true, true, true, true, true, true, true, true, true]));
  chk(name, where, 'the destination list exactly as before', Z.dest === B.dest, true);
  chk(name, where, 'the destination list is the eight the board seeds, unstamped, still the plan’s own (MS.flow.ents)',
    J([Z.destNames, Z.destTs, Z.flowShared]), J([SEEDED, 0, true]));
  chk(name, where, 'the plan (MS) exactly as before', Z.plan === B.plan, true);
  chk(name, where, 'the saved payload byte for byte as before, with no destination from the batch',
    J([Z.payload === A.payload, /Depot (Zulu|Yankee|Xray|Whiskey)/.test(Z.payload)]), J([true, false]));
  chk(name, where, 'browser storage: every key and value exactly as before', J(Z.ls) === J(B.ls), true);
  chk(name, where, 'browser storage holds the three keys it held', J(Object.keys(Z.ls)), J(['prio27destdb', 'prio27om', 'prio27om.base']));
  chk(name, where, 'the save state exactly as before, and the header says what it said', J([Z.save, Z.head]), J([B.save, B.head]));
  chk(name, where, 'reopening the review shows exactly what it showed before', reviewHtml(X) === H0, true);
  const R = reopen(X);
  chk(name, where, 'the board reopened in the same browser reads the eight seeded destinations, without errors', J(R), J({ dest: SEEDED, errors: [] }));
  chk(name, where, 'no page errors', J(X.errors), J([]));
};
const start = async () => { const X = await ready(); const A = look(X); const H0 = reviewHtml(X); return { X, A, H0 }; };

await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const name = 'v2.00 UI (M1) — a batch with a file that would ask is refused before anything loads';
  const __bm = bootMark();
  try {
    // each question alone, beside AV (whose destination list the old real run folded in before the question)
    for (const [f, q, stat] of [[F.NOFY, 'That submittal does not say which fiscal year it was written for.'],
      [F.FY28, 'That submittal was written for FY28, and this board is on FY27.'],
      [F.NOPMO, 'That submittal does not say which programme office it is from.']]) {
      const where = 'AV, then ' + f[0];
      const { X, A, H0 } = await start();
      const b = await batch(X, [F.AV, f]);
      chk(name, where, 'refused, nothing taken, the file and its question named', J(b.r),
        J({ ok: false, taken: 0, asks: [{ file: f[0], q }], back: null, same: true, left: [] }));
      chk(name, where, 'the person is asked nothing: no question is put while a batch runs', J(b.asked), J([]));
      chk(name, where, 'the one message names the file and its question, says to load it on its own, and that nothing changed', J(b.said), J([
        '⚠ None of the 2 submittal files was loaded: “' + f[0] + '” would ask a question before it could be loaded, and a batch loads only files that need no answer'
        + '\n\n' + SAME
        + '\n\n  • “' + f[0] + '” — ' + q + '\n\nLoad it on its own (Program offices › ⬅ Load one submission…), where its question is asked about that file alone; then load the rest.']));
      chk(name, where, 'the status line says the same', b.stat, '⚠ Nothing loaded — “' + f[0] + '” would ask a question first — load it on its own (Program offices › ⬅ Load one submission…)');
      chk(name, where, 'no storage write of any kind', J(b.writes), J([]));
      asBefore(name, where, X, A, H0);
    }
    // all three at once: every file that would ask is named, in the order picked
    {
      const where = 'no year, AV, another year, no office';
      const { X, A, H0 } = await start();
      const b = await batch(X, [F.NOFY, F.AV, F.FY28, F.NOPMO]);
      chk(name, where, 'refused, nothing taken, all three named in the order picked', J(b.r), J({ ok: false, taken: 0, asks: [
        { file: 'PSM-no-year.json', q: 'That submittal does not say which fiscal year it was written for.' },
        { file: 'ATL-FY28.json', q: 'That submittal was written for FY28, and this board is on FY27.' },
        { file: 'no-office.json', q: 'That submittal does not say which programme office it is from.' }], back: null, same: true, left: [] }));
      chk(name, where, 'no question asked, one message', J([b.asked, b.said]), J([[], [
        '⚠ None of the 4 submittal files was loaded: 3 of them would ask a question before they could be loaded, and a batch loads only files that need no answer'
        + '\n\n' + SAME
        + '\n\n  • “PSM-no-year.json” — That submittal does not say which fiscal year it was written for.'
        + '\n  • “ATL-FY28.json” — That submittal was written for FY28, and this board is on FY27.'
        + '\n  • “no-office.json” — That submittal does not say which programme office it is from.'
        + '\n\nLoad each of those on its own (Program offices › ⬅ Load one submission…), where its question is asked about that file alone; then load the rest.']]));
      chk(name, where, 'the status line names all three', b.stat,
        '⚠ Nothing loaded — “PSM-no-year.json”, “ATL-FY28.json”, “no-office.json” would ask a question first — load each on its own (Program offices › ⬅ Load one submission…)');
      chk(name, where, 'no storage write of any kind', J(b.writes), J([]));
      asBefore(name, where, X, A, H0);
    }
    // the same with storage refusing every write: still nothing tried
    {
      const where = 'storage refusing every write · AV, then no year';
      const { X, A, H0 } = await start();
      X.ev('window.__fail=function(){ return true; }; 1');
      const b = await batch(X, [F.AV, F.NOFY]);
      X.ev('window.__fail=null; 1');
      chk(name, where, 'refused before anything loads, and nothing asked', J([b.r.ok, b.r.taken, (b.r.asks || []).length, b.r.same, b.asked]), J([false, 0, 1, true, []]));
      chk(name, where, 'no storage write tried', J(b.writes), J([]));
      asBefore(name, where, X, A, H0);
    }
    // the file loaded on its own afterwards asks its question, as one file always has
    {
      const where = 'the file that asked, loaded on its own afterwards';
      const { X } = await start();
      await batch(X, [F.AV, F.NOFY]);
      const asked = [];
      X.w.confirm = m => { asked.push(String(m)); return true; };
      await loadOne(X, F.NOFY);
      chk(name, where, 'One submission asks the question, and on OK holds it for FY27 beside TSS', J([asked, X.ev('JSON.stringify(PMOSUBS.map(function(p){ return [p.pmo, p.forFy]; }))')]),
        J([[Q_NOFY], J([['TSS', 2027], ['PSM', 2027]])]));
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();

await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const name = 'v2.00 UI (M1) — a batch that fails part-way is put back whole';
  const __bm = bootMark();
  try {
    // CANCEL, for each question, after AV has been taken and its destination list stored. The dry run is made to miss the
    // question, so the real run asks it -- the defect the review found, reached on purpose.
    for (const [f, qs, writes] of [
      [F.NOFY, [Q_NOFY], ['set prio27destdb', 'set prio27destdb']],
      [F.FY28, [Q_FY28, Q_FY28b], ['set prio27destdb', 'set prio27destdb']],
      // no office: asked after its own list was folded in and stored, so that is put back too
      [F.NOPMO, [Q_NOPMO], ['set prio27destdb', 'set prio27destdb', 'set prio27destdb']]]) {
      const where = 'AV taken, then Cancel on ' + f[0];
      const { X, A, H0 } = await start();
      missAsks(X);
      const b = await batch(X, [F.AV, f]);
      chk(name, where, 'not loaded; AV had been taken; everything put back and checked', J(b.r),
        J({ ok: false, taken: 1, asks: [], back: true, same: true, left: [] }));
      chk(name, where, 'the question was asked in the real run, word for word, and answered Cancel', J(b.asked), J(qs));
      chk(name, where, 'the message says AV was taken back out, and — checked — that nothing on the board was changed', J(b.said), J([
        '⚠ None of the 2 submittal files was loaded: “' + f[0] + '” was not taken, so the 1 taken before it was taken back out of the review\n\n' + SAME]));
      chk(name, where, 'the status line', b.stat, '⚠ Nothing loaded — “' + f[0] + '” was not taken');
      chk(name, where, 'storage writes: the load’s own, then one write putting the destination list back -- nothing else', J(b.writes), J(writes));
      asBefore(name, where, X, A, H0);
    }
    // the FIRST file cancelled: its own part-way change (the list folded in before the office question) goes back
    {
      const where = 'Cancel on the first file (no office), whose list was already folded in';
      const { X, A, H0 } = await start();
      missAsks(X);
      const b = await batch(X, [F.NOPMO, F.AV]);
      chk(name, where, 'not loaded; nothing taken; put back and checked', J(b.r), J({ ok: false, taken: 0, asks: [], back: true, same: true, left: [] }));
      chk(name, where, 'one question, one message', J([b.asked, b.said]), J([[Q_NOPMO], ['⚠ None of the 2 submittal files was loaded: “no-office.json” was not taken\n\n' + SAME]]));
      chk(name, where, 'storage writes: its own fold, then the put-back', J(b.writes), J(['set prio27destdb', 'set prio27destdb']));
      asBefore(name, where, X, A, H0);
    }
    // AN ERROR part-way: the review cannot be drawn for the second file, after pmoTake has already held it
    {
      const where = 'AV taken, then an error while PSM is taken';
      const { X, A, H0 } = await start();
      X.ev(`(function(){ var own=subOpenReview, n=0; subOpenReview=function(){ if(++n===2) throw new Error('the review could not be drawn (test)'); return own.apply(this, arguments); };
        window.__sorOwn=own; return 1; })()`);
      const b = await batch(X, [F.AV, F.PSM]);
      X.ev('subOpenReview=window.__sorOwn; 1');
      chk(name, where, 'not loaded; AV had been taken; put back and checked', J(b.r), J({ ok: false, taken: 1, asks: [], back: true, same: true, left: [] }));
      chk(name, where, 'nothing asked; the message names the error', J([b.asked, b.said]), J([[], [
        '⚠ None of the 2 submittal files was loaded: “PSM.json” was not taken (an error: the review could not be drawn (test)), so the 1 taken before it was taken back out of the review\n\n' + SAME]]));
      chk(name, where, 'storage writes: AV’s list, then the put-back', J(b.writes), J(['set prio27destdb', 'set prio27destdb']));
      asBefore(name, where, X, A, H0);
    }
    // STORAGE REFUSING EVERY WRITE, then Cancel: nothing reached storage, so nothing is written back; the save state the
    // refusal moved (the list counted as unsaved) goes back too
    {
      const where = 'storage refusing every write · AV taken, then Cancel on no year';
      const { X, A, H0 } = await start();
      missAsks(X);
      X.ev('window.__fail=function(){ return true; }; 1');
      const b = await batch(X, [F.AV, F.NOFY]);
      X.ev('window.__fail=null; 1');
      chk(name, where, 'not loaded; put back and checked', J(b.r), J({ ok: false, taken: 1, asks: [], back: true, same: true, left: [] }));
      chk(name, where, 'the one write tried was the load’s own, refused; none to put back', J(b.writes), J(['set prio27destdb']));
      chk(name, where, 'the message says nothing on the board was changed', b.said[b.said.length - 1],
        '⚠ None of the 2 submittal files was loaded: “PSM-no-year.json” was not taken, so the 1 taken before it was taken back out of the review\n\n' + SAME);
      asBefore(name, where, X, A, H0);
    }
    // A BOARD THAT READS SAVED STILL READS SAVED. Opened from its own saved file (nothing unsaved, storage holding no
    // destination list), the review holding TSS; AV's list is stored part-way -- the header turns to Unsaved changes --
    // and then Cancel. The list is taken out of storage again (it held none), the save count goes back, and the header
    // says Saved as it did. Nothing here calls buildSavedHtml, whose save() would itself make the board unsaved.
    {
      const where = 'a board opened from its saved file · AV taken, then Cancel on no year';
      const S0 = open(), X = boot({ html: S0.ev('buildSavedHtml()') });
      X.ev('Date.now=function(){ return 1790000000000; }; 1');
      X.w.confirm = () => true; X.w.alert = () => {};
      await loadOne(X, F.TSS);
      X.ev(`(function(){ window.__w=[]; var P=Object.getPrototypeOf(localStorage), set=P.setItem, rm=P.removeItem;
        P.setItem=function(k,v){ window.__w.push('set '+k); return set.call(this,k,v); }; P.removeItem=function(k){ window.__w.push('remove '+k); return rm.call(this,k); }; return 1; })()`);
      const st = () => JSON.parse(X.ev(`JSON.stringify({save:[_sideGen, _sideSaved, _dlOnly, DIRTY, _saveGen, JSON.stringify(_lsRefused)], unsaved:unsavedNow(),
        head:(document.getElementById('saveState')||{}).textContent, ls:Object.keys(localStorage).sort(), dest:DESTDB.ents.map(function(e){ return e.n; }),
        review:JSON.stringify({subs:PMOSUBS, pick:PMOPICK, open:subOpen}), plan:JSON.stringify(MS)})`));
      const A = st();
      chk(name, where, 'CONTROL — before: reads saved, nothing unsaved, storage holding the plan’s base only, the eight seeded destinations',
        J([A.save, A.unsaved, /^Saved /.test(A.head), A.ls, A.dest]), J([[0, 0, false, false, 0, '{}'], false, true, ['prio27om.base'], SEEDED]));
      missAsks(X);
      let mid = '';
      const b = await batch(X, [F.AV, F.NOFY], { onAsk: () => { mid = X.ev(`(document.getElementById('saveState')||{}).textContent`); } });
      const Z = st();
      chk(name, where, 'part-way, while the question was up, the header said Unsaved changes', mid, 'Unsaved changes');
      chk(name, where, 'not loaded; put back and checked', J(b.r), J({ ok: false, taken: 1, asks: [], back: true, same: true, left: [] }));
      chk(name, where, 'storage writes: AV’s list, then the list removed again -- storage held none', J(b.writes), J(['set prio27destdb', 'remove prio27destdb']));
      chk(name, where, 'after: the save state, the header, storage, the list, the review and the plan exactly as before',
        J([Z.save, Z.unsaved, Z.head === A.head, Z.ls, Z.dest, Z.review === A.review, Z.plan === A.plan]),
        J([[0, 0, false, false, 0, '{}'], false, true, ['prio27om.base'], SEEDED, true, true]));
      chk(name, where, 'no page errors', J([S0.errors, X.errors]), J([[], []]));
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();

await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const name = 'v2.00 UI (M1) — a put-back that cannot finish says exactly what it could not put back';
  const __bm = bootMark();
  try {
    // (a) STORAGE TAKES AV's LIST, THEN REFUSES TO TAKE THE OLD ONE BACK. The board on screen is put back; the copy kept in
    // this browser is not, and the message says so -- with the browser's reason and what it means -- and never that
    // nothing was changed.
    {
      const where = 'storage refuses the put-back · AV taken, then Cancel on no year';
      const { X, A, H0 } = await start();
      missAsks(X);
      X.ev(`(function(){ var n=0; window.__fail=function(k){ return k==='prio27destdb' && ++n>1; }; return 1; })()`);
      const b = await batch(X, [F.AV, F.NOFY]);
      X.ev('window.__fail=null; 1');
      chk(name, where, 'not put back whole, and not said to be', J(b.r),
        J({ ok: false, taken: 1, asks: [], back: false, same: false, left: ['the destination list kept in this browser'] }));
      chk(name, where, 'the message names what could not be put back, the browser’s reason and what it means; and what is as before', J(b.said), J([
        '⚠ None of the 2 submittal files was loaded: “PSM-no-year.json” was not taken, so the 1 taken before it was taken back out of the review\n\n'
        + '⚠ NOT EVERYTHING IS AS IT WAS. Checked just now, this is not as before the batch:\n'
        + '  • the destination list kept in this browser — it could not be put back (QuotaExceededError). It holds what the batch wrote there, and '
        + 'opening the board again in this browser would read it instead of the destination list on screen.\n\n'
        + 'Checked just now and exactly as before: the submittal review, the destination list on this board, the plan on screen, whether the board reads as saved.']));
      chk(name, where, 'it never says nothing on the board was changed', /nothing on the board was changed/.test(b.said.join('\n')), false);
      chk(name, where, 'the status line says it too', b.stat,
        '⚠ Nothing loaded — “PSM-no-year.json” was not taken. Not as before the batch: the destination list kept in this browser.');
      chk(name, where, 'storage writes: AV’s list, then the put-back, refused', J(b.writes), J(['set prio27destdb', 'set prio27destdb']));
      const Z = look(X);
      chk(name, where, 'the board on screen IS put back: the review, the destination list, the plan, the payload, the save state',
        J([Z.review === A.post.review, Z.dest === A.post.dest, Z.plan === A.post.plan, Z.payload === A.payload, J(Z.save) === J(A.post.save), ids(X)]),
        J([true, true, true, true, true, J([true, true, true, true, true, true, true, true, true, true, true])]));
      chk(name, where, 'storage: every other key as before', J(Object.keys(Z.ls).filter(k => k !== 'prio27destdb').map(k => Z.ls[k] === A.post.ls[k])), J([true, true]));
      const kept = JSON.parse(Z.ls.prio27destdb);
      chk(name, where, 'the copy kept in this browser holds exactly what the message says: the seeded eight and AV’s Depot Zulu, stamped by the batch',
        J([kept.ents.map(e => e.n), kept.ts]), J([SEEDED.concat(['Depot Zulu']), 1790000000000]));
      chk(name, where, 'reopening the review shows exactly what it showed before', reviewHtml(X) === H0, true);
      chk(name, where, 'reopened in this browser, the board reads that list -- as the message said it would', J(reopen(X)),
        J({ dest: SEEDED.concat(['Depot Zulu']), errors: [] }));
      chk(name, where, 'no page errors', J(X.errors), J([]));
    }
    // (b) STORAGE CANNOT EVEN BE READ when the put-back comes: what it holds cannot be checked, and the message says that
    {
      const where = 'storage unreadable at the put-back · AV taken, then Cancel on no year';
      const { X, A, H0 } = await start();
      missAsks(X);
      const b = await batch(X, [F.AV, F.NOFY], { onAsk: () => { X.w.__noRead = true; } });
      X.w.__noRead = false;
      chk(name, where, 'not put back whole, and not said to be', J(b.r), J({ ok: false, taken: 1, asks: [], back: false, same: false,
        left: ['browser storage — it could not be read just now, so it could not be checked or put back'] }));
      chk(name, where, 'the message says storage could not be checked or put back, and what is as before', J(b.said), J([
        '⚠ None of the 2 submittal files was loaded: “PSM-no-year.json” was not taken, so the 1 taken before it was taken back out of the review\n\n'
        + '⚠ NOT EVERYTHING IS AS IT WAS. Checked just now, this is not as before the batch:\n'
        + '  • browser storage — it could not be read just now, so it could not be checked or put back.\n\n'
        + 'Checked just now and exactly as before: the submittal review, the destination list on this board, the plan on screen, whether the board reads as saved.']));
      chk(name, where, 'storage writes: AV’s list only; nothing written blind', J(b.writes), J(['set prio27destdb']));
      const Z = look(X);
      chk(name, where, 'the board on screen IS put back', J([Z.review === A.post.review, Z.dest === A.post.dest, Z.plan === A.post.plan, Z.payload === A.payload, J(Z.save) === J(A.post.save)]),
        J([true, true, true, true, true]));
      chk(name, where, 'the copy kept in this browser holds AV’s list, which the message did not claim to have put back',
        J(JSON.parse(Z.ls.prio27destdb).ents.map(e => e.n)), J(SEEDED.concat(['Depot Zulu'])));
      chk(name, where, 'reopening the review shows exactly what it showed before', reviewHtml(X) === H0, true);
      chk(name, where, 'no page errors', J(X.errors), J([]));
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();

await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const name = 'v2.00 UI (M1) — refused batches leave everything as it was, and a good batch loads as one by one';
  const __bm = bootMark();
  try {
    for (const [where, list, said] of [
      ['the same office twice, differing', [F.AV, F.PSM, F.AVagain],
        '⚠ None of the 3 submittal files was loaded: “AV.json” and “AV-again.json” are both from AV. A batch takes one submittal per office — load the one you mean\n\n' + SAME],
      ['the same office twice, identical', [F.AV, F.AVcopy],
        '⚠ None of the 2 submittal files was loaded: “AV.json” and “AV-copy.json” are both from AV. A batch takes one submittal per office — load the one you mean\n\n' + SAME],
      ['a good file, then a malformed one', [F.AV, F.BROKEN],
        '⚠ None of the 2 submittal files was loaded: “broken.json” is not a programme office’s submittal\n\n' + SAME],
      ['a good file, then one of the wrong width (refused only by the dry run)', [F.AV, F.WIDTH],
        '⚠ None of the 2 submittal files was loaded: “PSM-wrong-width.json” would not be taken — ⚠ That submittal proposes requirement values with the wrong number of services for 1 requirement (S01).\n\n' + SAME]]) {
      const { X, A, H0 } = await start();
      const b = await batch(X, list);
      chk(name, where, 'refused, nothing taken, nothing asked', J([b.r.ok, b.r.taken, b.asked]), J([false, 0, []]));
      chk(name, where, 'the message', J(b.said), J([said]));
      chk(name, where, 'no storage write of any kind', J(b.writes), J([]));
      asBefore(name, where, X, A, H0);
    }
    // a good batch with storage refusing every write: loaded, exactly as the same files loaded one by one with storage
    // refusing; storage itself untouched
    for (const failing of [false, true]) {
      const where = 'a good batch, PSM then AV' + (failing ? ', storage refusing every write' : '');
      const { X, A } = await start(), T = await start();
      if (failing) { X.ev('window.__fail=function(){ return true; }; 1'); T.X.ev('window.__fail=function(){ return true; }; 1'); }
      const b = await batch(X, [F.PSM, F.AV]);
      T.X.w.confirm = () => true; T.X.w.alert = () => {};
      await loadOne(T.X, F.PSM); await loadOne(T.X, F.AV);
      X.ev('window.__fail=null; 1'); T.X.ev('window.__fail=null; 1');
      chk(name, where, 'loaded, both taken, nothing asked', J([b.r.ok, b.r.taken, b.asked]), J([true, 2, []]));
      chk(name, where, 'storage writes: AV’s list once', J(b.writes), J(['set prio27destdb']));
      const Z = look(X), O = look(T.X);
      chk(name, where, 'held in the order picked after TSS, nothing ticked (as a single load leaves it), Depot Zulu in the list',
        J([Z.offices, Z.ticks, Z.destNames]), J([['TSS', 'PSM', 'AV'], [], SEEDED.concat(['Depot Zulu'])]));
      chk(name, where, 'the review, the destination list, the plan, the payload, every storage key and the save state: as one by one',
        J([Z.review === O.review, Z.dest === O.dest, Z.plan === O.plan, Z.payload === O.payload, J(Z.ls) === J(O.ls), J(Z.save) === J(O.save)]),
        J([true, true, true, true, true, true]));
      chk(name, where, failing ? 'storage refused: every key exactly as before the batch' : 'storage took AV’s list',
        failing ? J(Z.ls) === J(A.post.ls) : JSON.parse(Z.ls.prio27destdb).ents.map(e => e.n).join('|'), failing ? true : SEEDED.concat(['Depot Zulu']).join('|'));
      chk(name, where, 'no page errors', J([X.errors, T.X.errors]), J([[], []]));
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end v2.00 UI chunk 3 (M1) ====

// ==== v2.00 UI chunk 3 (M1, fix round): what the M1 verifier found these tests could not see ====
// The verifier's mutants that passed every check above: the put-back going back to the board as it was BEFORE the files
// were read (v12), the destination list put back shallowly (v01), and the check made blind to the destination list, the
// plan, the save state, the review or the storage keys the batch added (v02-v05, v07) -- each passed because no case
// here reached it with a difference. And "every key of browser storage" was proved for prio27destdb alone (v13). Each
// case below reaches one of them; expected values are written out by hand, as above.
// A PMO copy whose list names Lockheed Martin -- the board's own seeded destination -- under a key of its own, as a
// government site with a place of its own: destJoin then changes the board's entry IN PLACE (its match terms gain the
// copy's, and the different kind is recorded as a conflict). Every fixture above only adds destinations.
const G = {
  LM: ['MxS-lm.json', sub({ pmo: 'MxS', by: 'PMO MxS', dest: [{ k: 'dLMx', n: 'Lockheed Martin', kind: 'gov', t: 'Fort Worth' },
    { k: 'dZulu', n: 'Depot Zulu', kind: 'gov', t: '' }],
    items: { S05: { asks: [9500000, 2000000, 1000000], cons: 'MxS says', dest: { to: 'dLMx', end: 'dZulu' } } },
    base: { S05: { asks: [9000000, 2000000, 1000000] } } })],
};
const LM_SEEDED = { k: 'lm', n: 'Lockheed Martin', kind: 'prime', t: 'LM, LOCKHEED' };
// the headline of every case below that cancels on PSM-no-year.json after AV was taken
const HEAD_NOFY = '⚠ None of the 2 submittal files was loaded: “PSM-no-year.json” was not taken, so the 1 taken before it was taken back out of the review';
// as start(), with something done to the board before it is looked at
const startWith = async code => { const X = await ready(); X.ev(code); const A = look(X); const H0 = reviewHtml(X); return { X, A, H0 }; };
// the board as it is, without buildSavedHtml (whose save() would itself move the save state): for the board opened from its
// saved file, as the saved-board case above reads it
const stNow = X => JSON.parse(X.ev(`JSON.stringify({save:[_sideGen, _sideSaved, _dlOnly, DIRTY, _saveGen, JSON.stringify(_lsRefused)], unsaved:unsavedNow(),
  head:(document.getElementById('saveState')||{}).textContent, ls:(function(){ var o={}; Object.keys(localStorage).sort().forEach(function(k){ o[k]=localStorage.getItem(k); }); return o; })(),
  dest:DESTDB.ents.map(function(e){ return e.n; }), destTxt:JSON.stringify(DESTDB), review:JSON.stringify({subs:PMOSUBS, pick:PMOPICK, open:subOpen}),
  plan:JSON.stringify(MS)})`));
// a board opened from its own saved file (nothing unsaved, storage holding no destination list), the review holding TSS,
// storage watched as in ready() -- and removeItem refusable too (window.__failRm)
const readySaved = async () => {
  const S0 = open(), X = boot({ html: S0.ev('buildSavedHtml()') });
  X.ev('Date.now=function(){ return 1790000000000; }; 1');
  X.w.confirm = () => true; X.w.alert = () => {};
  await loadOne(X, F.TSS);
  X.ev(`(function(){ window.__w=[]; window.__fail=null; window.__failRm=null; var P=Object.getPrototypeOf(localStorage), set=P.setItem, rm=P.removeItem;
    P.setItem=function(k,v){ window.__w.push('set '+k); if(window.__fail && window.__fail(k)){ var e=new Error('storage refused (test)'); e.name='QuotaExceededError'; throw e; } return set.call(this,k,v); };
    P.removeItem=function(k){ window.__w.push('remove '+k); if(window.__failRm && window.__failRm(k)){ var e=new Error('storage refused (test)'); e.name='SecurityError'; throw e; } return rm.call(this,k); };
    return 1; })()`);
  return { S0, X };
};

await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const name = 'v2.00 UI (M1) — what changes while the files are read is kept when the batch is put back';
  const __bm = bootMark();
  try {
    // The batch waits only while its files are read, and the board can change in that time: a live-refresh tick, a single
    // load landing, the person's own click. The put-back goes back to the board as it was once the files were read, so a
    // change made meanwhile is not erased under "nothing on the board was changed" (the verifier's v12, with no second
    // snapshot, took Depot Mid off the board and out of storage). The change is made by wrapping uiFileText: once the
    // second file has been read, before the batch goes on.
    const during = (X, code) => X.ev(`(function(){ var own=uiFileText, n=0; uiFileText=function(f){ return own(f).then(function(t){
      if(++n===2){ ${code} } return t; }); }; return 1; })()`);
    {
      const where = 'a destination added while the files are read · AV taken, then Cancel on no year';
      const { X, A } = await start();
      // the board's own destPkgIn, as a single submittal's load landing in that moment folds its list in and stores it
      during(X, `destPkgIn({dest:[{k:'dMid', n:'Depot Mid', kind:'gov', t:''}]});`);
      missAsks(X);
      const b = await batch(X, [F.AV, F.NOFY]);
      chk(name, where, 'not loaded; AV had been taken; put back and checked', J(b.r), J({ ok: false, taken: 1, asks: [], back: true, same: true, left: [] }));
      chk(name, where, 'the message is the plain one: the batch changed nothing', J(b.said), J([HEAD_NOFY + '\n\n' + SAME]));
      chk(name, where, 'storage writes: Depot Mid’s, then AV’s, then the put-back', J(b.writes), J(['set prio27destdb', 'set prio27destdb', 'set prio27destdb']));
      const Z = look(X);
      chk(name, where, 'Depot Mid is kept on screen, stamped when it was stored, still the plan’s own list; Depot Zulu is not there',
        J([Z.destNames, Z.destTs, Z.flowShared]), J([SEEDED.concat(['Depot Mid']), 1790000000000, true]));
      const kept = JSON.parse(Z.ls.prio27destdb);
      chk(name, where, 'and in the copy kept in this browser', J([kept.ents.map(e => e.n), kept.ts]), J([SEEDED.concat(['Depot Mid']), 1790000000000]));
      chk(name, where, 'and in the saved payload, which has no Depot Zulu', J([/Depot Mid/.test(Z.payload), /Depot Zulu/.test(Z.payload)]), J([true, false]));
      chk(name, where, 'the review exactly as before: TSS alone, its tick, open', J([Z.review === A.post.review, Z.offices, Z.ticks, Z.open]),
        J([true, ['TSS'], ['0|S03|asks'], true]));
      chk(name, where, 'the same objects as before', ids(X), J([true, true, true, true, true, true, true, true, true, true, true]));
      chk(name, where, 'the board reopened in this browser reads Depot Mid with the seeded eight, without errors', J(reopen(X)),
        J({ dest: SEEDED.concat(['Depot Mid']), errors: [] }));
      chk(name, where, 'no page errors', J(X.errors), J([]));
    }
    {
      const where = 'the review’s tick taken off while the files are read · AV taken, then Cancel on no year';
      const { X, A } = await start();
      during(X, `subPick(0, 'S03', 'asks', false);`);
      missAsks(X);
      const b = await batch(X, [F.AV, F.NOFY]);
      chk(name, where, 'not loaded; AV had been taken; put back and checked', J(b.r), J({ ok: false, taken: 1, asks: [], back: true, same: true, left: [] }));
      chk(name, where, 'the message is the plain one', J(b.said), J([HEAD_NOFY + '\n\n' + SAME]));
      chk(name, where, 'storage writes: AV’s list, then the put-back', J(b.writes), J(['set prio27destdb', 'set prio27destdb']));
      const Z = look(X);
      chk(name, where, 'the tick stays off, as the person left it; TSS still held, the review open', J([Z.offices, Z.ticks, Z.open]), J([['TSS'], [], true]));
      chk(name, where, 'the destination list, the plan, the saved payload and every storage key exactly as before',
        J([Z.dest === A.post.dest, Z.destNames, Z.plan === A.post.plan, Z.payload === A.payload, J(Z.ls) === J(A.post.ls)]), J([true, SEEDED, true, true, true]));
      chk(name, where, 'no page errors', J(X.errors), J([]));
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();

await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const name = 'v2.00 UI (M1) — a destination the load changed in place is put back as it was';
  const __bm = bootMark();
  try {
    // CONTROL: the file, loaded on its own, does change the board's Lockheed Martin in place
    {
      const where = 'MxS-lm.json loaded on its own (CONTROL)';
      const { X } = await start();
      await loadOne(X, G.LM);
      chk(name, where, 'Lockheed Martin gains Fort Worth, the kind conflict is recorded, Depot Zulu is added; nothing asked',
        X.ev(`JSON.stringify([destHas('lm'), DESTDB.conflicts, DESTDB.ents.map(function(e){ return e.n; }), PMOSUBS.map(function(p){ return p.pmo; })])`),
        J([{ k: 'lm', n: 'Lockheed Martin', kind: 'prime', t: 'LM, LOCKHEED, Fort Worth' }, [{ k: 'lm', from: 'om', kind: 'gov' }], SEEDED.concat(['Depot Zulu']), ['TSS', 'MxS']]));
    }
    // Cancel on the next file, and an error while it is the file being taken: each time the entry, the conflicts, the whole
    // list and the plan go back to exactly what they were
    for (const [where, list, said, writes, sor] of [
      ['MxS (naming Lockheed Martin) taken, then Cancel on no year', [G.LM, F.NOFY], HEAD_NOFY, ['set prio27destdb', 'set prio27destdb'], false],
      ['AV taken, then an error while MxS (naming Lockheed Martin) is taken', [F.AV, G.LM],
        '⚠ None of the 2 submittal files was loaded: “MxS-lm.json” was not taken (an error: the review could not be drawn (test)), so the 1 taken before it was taken back out of the review',
        ['set prio27destdb', 'set prio27destdb', 'set prio27destdb'], true]]) {
      const { X, A, H0 } = await start();
      if (sor) X.ev(`(function(){ var own=subOpenReview, n=0; subOpenReview=function(){ if(++n===2) throw new Error('the review could not be drawn (test)'); return own.apply(this, arguments); };
        window.__sorOwn=own; return 1; })()`);
      else missAsks(X);
      const b = await batch(X, list);
      if (sor) X.ev('subOpenReview=window.__sorOwn; 1');
      chk(name, where, 'not loaded; one taken first; put back and checked', J(b.r), J({ ok: false, taken: 1, asks: [], back: true, same: true, left: [] }));
      chk(name, where, 'the message', J(b.said), J([said + '\n\n' + SAME]));
      chk(name, where, 'storage writes: each list folded in, then one put-back', J(b.writes), J(writes));
      chk(name, where, 'Lockheed Martin exactly as seeded, and no conflict recorded',
        X.ev(`JSON.stringify([destHas('lm'), DESTDB.conflicts])`), J([LM_SEEDED, []]));
      asBefore(name, where, X, A, H0);
      // after asBefore, whose own look() is the one save its measures allow for
      chk(name, where, 'Fort Worth is in neither the saved payload nor the copy kept in this browser',
        (() => { const Z = look(X); return J([/Fort Worth/.test(Z.payload), /Fort Worth/.test(Z.ls.prio27destdb)]); })(), J([false, false]));
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();

await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const name = 'v2.00 UI (M1) — the check names each part that is not as before';
  const __bm = bootMark();
  try {
    // Each case makes one part of the put-back fail (or something it does not cover change), so the check meets a real
    // difference there; every other part is put back. The message must name that part -- with the browser's reason when a
    // step failed -- and list every other part as checked and as before. Each fault is injected, and says "(test)".
    // (a) THE DESTINATION LIST cannot be put back in memory (uiGraphPut throws). The plan names it too: MS.flow.ents is the list.
    {
      const where = 'the destination list cannot be put back (fault injected) · AV taken, then Cancel on no year';
      const { X, A } = await start();
      missAsks(X);
      X.ev(`uiGraphPut=function(){ throw new Error('the list would not take its entries back (test)'); }; 1`);
      const b = await batch(X, [F.AV, F.NOFY]);
      chk(name, where, 'not put back whole, and not said to be', J(b.r),
        J({ ok: false, taken: 1, asks: [], back: false, same: false, left: ['the destination list on this board', 'the plan on screen'] }));
      chk(name, where, 'the message names the list, with the reason, and the plan; and what is as before', J(b.said), J([HEAD_NOFY + '\n\n'
        + '⚠ NOT EVERYTHING IS AS IT WAS. Checked just now, these are not as before the batch:\n'
        + '  • the destination list on this board — it could not be put back (Error)\n  • the plan on screen.\n\n'
        + 'Checked just now and exactly as before: the submittal review, whether the board reads as saved, browser storage.']));
      chk(name, where, 'the status line says it too', b.stat,
        '⚠ Nothing loaded — “PSM-no-year.json” was not taken. Not as before the batch: the destination list on this board; the plan on screen.');
      const Z = look(X);
      chk(name, where, 'true: the list on screen still holds Depot Zulu; the review, storage and the save state are as before',
        J([Z.destNames, Z.review === A.post.review, J(Z.ls) === J(A.post.ls), J(Z.save) === J(A.post.save)]), J([SEEDED.concat(['Depot Zulu']), true, true, true]));
      chk(name, where, 'no page errors', J(X.errors), J([]));
    }
    // (b) THE PLAN alone: something the put-back does not cover changes MS while the batch runs (set from the question)
    {
      const where = 'the plan changed during the batch (fault injected) · AV taken, then Cancel on no year';
      const { X, A } = await start();
      missAsks(X);
      const b = await batch(X, [F.AV, F.NOFY], { onAsk: () => X.ev(`MS.uiFault='set while the batch ran (test)'; 1`) });
      chk(name, where, 'put back, but not everything is as before, and it is said', J(b.r),
        J({ ok: false, taken: 1, asks: [], back: true, same: false, left: ['the plan on screen'] }));
      chk(name, where, 'the message names the plan, and what is as before', J(b.said), J([HEAD_NOFY + '\n\n'
        + '⚠ NOT EVERYTHING IS AS IT WAS. Checked just now, this is not as before the batch:\n  • the plan on screen.\n\n'
        + 'Checked just now and exactly as before: the submittal review, the destination list on this board, whether the board reads as saved, browser storage.']));
      const Z = look(X);
      chk(name, where, 'true: the plan holds the change; the review, the list, storage and the save state are as before',
        J([X.ev('MS.uiFault'), Z.review === A.post.review, Z.dest === A.post.dest, J(Z.ls) === J(A.post.ls), J(Z.save) === J(A.post.save)]),
        J(['set while the batch ran (test)', true, true, true, true]));
      chk(name, where, 'no page errors', J(X.errors), J([]));
    }
    // (c) THE SAVE STATE cannot be put back. Before the batch storage refused the destination list once, so the board
    // counts it unsaved (_lsRefused); AV's load is stored, which takes that count away; the put-back must give it back,
    // and the record is made unable to take it (fault injected: Object.preventExtensions, set from the question).
    {
      const where = 'the save state cannot be put back (fault injected) · storage refused the list before; AV taken, then Cancel on no year';
      const { X, A } = await startWith(`window.__fail=function(k){ return k==='prio27destdb'; }; persistDest(); window.__fail=null; 1`);
      chk(name, where, 'CONTROL — before: the list storage refused is counted unsaved', X.ev('JSON.stringify(Object.keys(_lsRefused))'), J(['prio27destdb']));
      missAsks(X);
      const b = await batch(X, [F.AV, F.NOFY], { onAsk: () => X.ev('Object.preventExtensions(_lsRefused); 1') });
      chk(name, where, 'not put back whole, and not said to be', J(b.r),
        J({ ok: false, taken: 1, asks: [], back: false, same: false, left: ['whether the board reads as saved'] }));
      chk(name, where, 'the message names the save state, with the reason, and what is as before', J(b.said), J([HEAD_NOFY + '\n\n'
        + '⚠ NOT EVERYTHING IS AS IT WAS. Checked just now, this is not as before the batch:\n  • whether the board reads as saved — it could not be put back (TypeError).\n\n'
        + 'Checked just now and exactly as before: the submittal review, the destination list on this board, the plan on screen, browser storage.']));
      chk(name, where, 'storage writes: AV’s list, then the put-back', J(b.writes), J(['set prio27destdb', 'set prio27destdb']));
      const R = X.ev('JSON.stringify(Object.keys(_lsRefused))'), Z = look(X);
      chk(name, where, 'true: the refused list is no longer counted unsaved; the review, the list, the plan and storage are as before',
        J([R, Z.review === A.post.review, Z.dest === A.post.dest, Z.plan === A.post.plan, J(Z.ls) === J(A.post.ls)]), J([J([]), true, true, true, true]));
      chk(name, where, 'no page errors', J(X.errors), J([]));
    }
    // (d) THE REVIEW cannot be put back: its array refuses to take its submittals back (fault injected, set from the question)
    {
      const where = 'the review cannot be put back (fault injected) · AV taken, then Cancel on no year';
      const { X, A } = await start();
      missAsks(X);
      const b = await batch(X, [F.AV, F.NOFY], { onAsk: () => X.ev(`Object.defineProperty(PMOSUBS, 'push', {configurable:true, writable:true,
        value:function(){ throw new Error('the review would not take its submittals back (test)'); }}); 1`) });
      X.ev('delete PMOSUBS.push; 1');
      chk(name, where, 'not put back whole, and not said to be', J(b.r), J({ ok: false, taken: 1, asks: [], back: false, same: false,
        left: ['the submittal review (the submittals it holds, its ticks, whether it is open)'] }));
      chk(name, where, 'the headline says the review could not be put back; the message names it, with the reason, and what is as before', J(b.said), J([
        '⚠ The batch stopped part-way, and the submittal review could not be put back as it was: “PSM-no-year.json” was not taken\n\n'
        + '⚠ NOT EVERYTHING IS AS IT WAS. Checked just now, this is not as before the batch:\n'
        + '  • the submittal review (the submittals it holds, its ticks, whether it is open) — it could not be put back (Error).\n\n'
        + 'Checked just now and exactly as before: the destination list on this board, the plan on screen, whether the board reads as saved, browser storage.']));
      chk(name, where, 'the status line says it too', b.stat,
        '⚠ The batch stopped part-way — “PSM-no-year.json” was not taken. Not as before the batch: the submittal review (the submittals it holds, its ticks, whether it is open).');
      const Z = look(X);
      chk(name, where, 'true: the review lost TSS and its tick; the list, the plan, storage and the save state are as before',
        J([Z.offices, Z.ticks, Z.dest === A.post.dest, Z.plan === A.post.plan, J(Z.ls) === J(A.post.ls), J(Z.save) === J(A.post.save)]), J([[], [], true, true, true, true]));
      chk(name, where, 'no page errors', J(X.errors), J([]));
    }
    // (e) A STORAGE KEY THE BATCH ADDED cannot be removed. The board opened from its saved file holds no destination list
    // in storage; AV's load adds one; removing it again is refused (fault injected).
    {
      const where = 'a key the batch added cannot be removed (fault injected) · a board opened from its saved file; AV taken, then Cancel on no year';
      const { S0, X } = await readySaved();
      const A = stNow(X);
      chk(name, where, 'CONTROL — before: reads saved, storage holding the plan’s base only', J([A.unsaved, /^Saved /.test(A.head), Object.keys(A.ls)]),
        J([false, true, ['prio27om.base']]));
      missAsks(X);
      X.ev(`window.__failRm=function(k){ return k==='prio27destdb'; }; 1`);
      const b = await batch(X, [F.AV, F.NOFY]);
      X.ev('window.__failRm=null; 1');
      chk(name, where, 'not put back whole, and not said to be', J(b.r),
        J({ ok: false, taken: 1, asks: [], back: false, same: false, left: ['the destination list kept in this browser'] }));
      chk(name, where, 'the message names the copy kept in this browser, the reason and what it means; and what is as before', J(b.said), J([HEAD_NOFY + '\n\n'
        + '⚠ NOT EVERYTHING IS AS IT WAS. Checked just now, this is not as before the batch:\n'
        + '  • the destination list kept in this browser — it could not be put back (SecurityError). It holds what the batch wrote there, and '
        + 'opening the board again in this browser would read it instead of the destination list on screen.\n\n'
        + 'Checked just now and exactly as before: the submittal review, the destination list on this board, the plan on screen, whether the board reads as saved.']));
      chk(name, where, 'storage writes: AV’s list, then its removal, refused', J(b.writes), J(['set prio27destdb', 'remove prio27destdb']));
      const Z = stNow(X);
      chk(name, where, 'true: on screen the review, the list, the plan, the save state and the header are as before',
        J([Z.review === A.review, Z.destTxt === A.destTxt, Z.plan === A.plan, J(Z.save) === J(A.save), Z.head === A.head]), J([true, true, true, true, true]));
      chk(name, where, 'true: storage holds the key it did not hold, with the seeded eight and Depot Zulu',
        J([Object.keys(Z.ls), JSON.parse(Z.ls.prio27destdb).ents.map(e => e.n)]), J([['prio27destdb', 'prio27om.base'], SEEDED.concat(['Depot Zulu'])]));
      chk(name, where, 'reopened in this browser, the board reads that list -- as the message said it would', J(reopen(X)),
        J({ dest: SEEDED.concat(['Depot Zulu']), errors: [] }));
      chk(name, where, 'no page errors', J([S0.errors, X.errors]), J([[], []]));
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();

await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const name = 'v2.00 UI (M1) — the put-back gives back every storage key the batch changed, and writes no other';
  const __bm = bootMark();
  try {
    // pmoTake writes one key today, prio27destdb. The put-back is not written for that key: every key that differs is
    // given back, one the batch added is removed, one it removed is written again, and one it left alone is not written.
    // While the question is up (fault injected), prio27om is changed, prio27test added and prio27om.base removed.
    {
      const where = 'three other keys changed, added and removed during the batch (fault injected) · AV taken, then Cancel on no year';
      const { X, A, H0 } = await start();
      missAsks(X);
      const b = await batch(X, [F.AV, F.NOFY], { onAsk: () => X.ev(`localStorage.setItem('prio27om', 'changed while the batch ran (test)');
        localStorage.setItem('prio27test', 'added while the batch ran (test)'); localStorage.removeItem('prio27om.base'); 1`) });
      chk(name, where, 'not loaded; put back and checked', J(b.r), J({ ok: false, taken: 1, asks: [], back: true, same: true, left: [] }));
      chk(name, where, 'the message is the plain one', J(b.said), J([HEAD_NOFY + '\n\n' + SAME]));
      chk(name, where, 'storage writes during the batch: AV’s list, then the three made while the question was up', J(b.writes.slice(0, 4)),
        J(['set prio27destdb', 'set prio27om', 'set prio27test', 'remove prio27om.base']));
      chk(name, where, 'the put-back’s writes: the added key removed, the three that differ written back -- and nothing else', J(b.writes.slice(4).sort()),
        J(['remove prio27test', 'set prio27destdb', 'set prio27om', 'set prio27om.base']));
      asBefore(name, where, X, A, H0);
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end v2.00 UI chunk 3 (M1, fix round) ====

// ==== v2.00 UI chunk 3 (M1, fix round 2): what the M1 verifier's second round found ====
// A batch refused while its files were still being read -- two files from one office, a malformed one -- was measured
// against the board as it was BEFORE the reads. When the board changed in that time (a single load landing, a tick taken
// off), the message said the batch had stopped part-way, could not put the review back and had written the stored
// destination list: none of it true, for a batch that had taken nothing. Now such a refusal is measured against the board
// as it is when it is said; only a real run that stopped part-way is said to have; and the stored list is said to hold
// what the batch wrote only when it holds the batch's own write. Expected values are written out by hand, as above.
// ATL's submittal, loaded on its own while a batch is reading its files: a single load landing in that moment, by the
// product's own path (⬅ Load a submittal file). Its list adds "Depot Mid".
const H = {
  ATL: ['ATL.json', sub({ pmo: 'ATL', by: 'PMO ATL', dest: [{ k: 'dMid', n: 'Depot Mid', kind: 'gov', t: '' }],
    items: { S02: { asks: [6200000, 2000000, 1000000], cons: 'ATL says', dest: { to: 'dMid', end: '' } } },
    base: { S02: { asks: [6000000, 2000000, 1000000] } } })],
};
// as the fix round's own `during`: something done to the board once the second file has been read, before the batch goes on
const whileRead = (X, code) => X.ev(`(function(){ var own=uiFileText, n=0; uiFileText=function(f){ return own(f).then(function(t){
  if(++n===2){ ${code} } return t; }); }; return 1; })()`);
// a single submittal through ⬅ Load a submittal file (importState), its read started now and not waited for: it lands
// while a batch started next is reading its own files
const loadStarted = (X, f) => { X.w.__one = [new X.w.File([f[1]], f[0], { type: 'application/json' })]; X.ev(`importState({files:window.__one, value:''}); 1`); };
// the destination list kept in this browser, as look() read it: its names and stamp, or that it is not there or cannot be
// read -- never a throw, so a case whose stored list has gone still runs the rest of its checks
const stored = ls => { try { const o = JSON.parse(ls.prio27destdb); return { names: o.ents.map(e => e.n), ts: o.ts }; }
  catch (e) { return { names: 'absent or unreadable', ts: null }; } };

await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const name = 'v2.00 UI (M1) — a batch refused before it takes anything says only what is true of it';
  const __bm = bootMark();
  try {
    // Each refusal reached while the board changes under it: Depot Mid folded in by the board's own destPkgIn, the review's
    // tick taken off, and ATL loaded on its own landing. The batch has taken nothing, so the message and the status line
    // are the plain ones -- never that it stopped part-way, put the review back or wrote the stored list -- and the change
    // made meanwhile stays: on screen, in the copy kept in this browser, in the saved payload and on reopening.
    for (const [list, said, stat] of [
      [[F.AV, F.AVcopy],
        '⚠ None of the 2 submittal files was loaded: “AV.json” and “AV-copy.json” are both from AV. A batch takes one submittal per office — load the one you mean',
        '⚠ Nothing loaded — “AV.json” and “AV-copy.json” are both from AV. A batch takes one submittal per office — load the one you mean'],
      [[F.AV, F.BROKEN],
        '⚠ None of the 2 submittal files was loaded: “broken.json” is not a programme office’s submittal',
        '⚠ Nothing loaded — “broken.json” is not a programme office’s submittal']]) {
      const files2 = list.map(f => f[0]).join(' + ');
      {
        const where = 'Depot Mid folded in while the files are read · ' + files2;
        const { X, A } = await start();
        whileRead(X, `destPkgIn({dest:[{k:'dMid', n:'Depot Mid', kind:'gov', t:''}]});`);
        const b = await batch(X, list);
        chk(name, where, 'refused, nothing taken, nothing put back, and checked as said', J(b.r), J({ ok: false, taken: 0, asks: [], back: null, same: true, left: [] }));
        chk(name, where, 'nothing asked; the message is the plain one', J([b.asked, b.said]), J([[], [said + '\n\n' + SAME]]));
        chk(name, where, 'the status line is the plain one', b.stat, stat);
        chk(name, where, 'storage writes: Depot Mid’s alone -- the batch wrote nothing', J(b.writes), J(['set prio27destdb']));
        const Z = look(X);
        chk(name, where, 'Depot Mid kept on screen (stamped when it was stored, still the plan’s own list), in the copy kept in this browser and in the saved payload; no Depot Zulu',
          J([Z.destNames, Z.destTs, Z.flowShared, stored(Z.ls).names, /Depot Mid/.test(Z.payload), /Depot Zulu/.test(Z.payload)]),
          J([SEEDED.concat(['Depot Mid']), 1790000000000, true, SEEDED.concat(['Depot Mid']), true, false]));
        chk(name, where, 'the review exactly as before: TSS alone, its tick, open', J([Z.review === A.post.review, Z.offices, Z.ticks, Z.open]),
          J([true, ['TSS'], ['0|S03|asks'], true]));
        chk(name, where, 'the same objects as before', ids(X), J([true, true, true, true, true, true, true, true, true, true, true]));
        chk(name, where, 'the board reopened in this browser reads Depot Mid with the seeded eight, without errors', J(reopen(X)),
          J({ dest: SEEDED.concat(['Depot Mid']), errors: [] }));
        chk(name, where, 'no page errors', J(X.errors), J([]));
      }
      {
        const where = 'the review’s tick taken off while the files are read · ' + files2;
        const { X, A } = await start();
        whileRead(X, `subPick(0, 'S03', 'asks', false);`);
        const b = await batch(X, list);
        chk(name, where, 'refused, nothing taken, nothing put back, and checked as said', J(b.r), J({ ok: false, taken: 0, asks: [], back: null, same: true, left: [] }));
        chk(name, where, 'nothing asked; the message is the plain one', J([b.asked, b.said]), J([[], [said + '\n\n' + SAME]]));
        chk(name, where, 'the status line is the plain one', b.stat, stat);
        chk(name, where, 'no storage write of any kind', J(b.writes), J([]));
        const Z = look(X);
        chk(name, where, 'the tick stays off, as the person left it; TSS still held, the review open', J([Z.offices, Z.ticks, Z.open]), J([['TSS'], [], true]));
        chk(name, where, 'the destination list, the plan, the saved payload and every storage key exactly as before',
          J([Z.dest === A.post.dest, Z.destNames, Z.plan === A.post.plan, Z.payload === A.payload, J(Z.ls) === J(A.post.ls)]), J([true, SEEDED, true, true, true]));
        chk(name, where, 'no page errors', J(X.errors), J([]));
      }
      {
        const where = 'ATL loaded on its own (⬅ Load a submittal file), landing while the files are read · ' + files2;
        const { X } = await start();
        loadStarted(X, H.ATL);
        const b = await batch(X, list);
        chk(name, where, 'refused, nothing taken, nothing put back, and checked as said', J(b.r), J({ ok: false, taken: 0, asks: [], back: null, same: true, left: [] }));
        chk(name, where, 'nothing asked; the one message is the batch’s, the plain one, counting ATL among those held', J([b.asked, b.said]),
          J([[], [said + '\n\nThe submittal review is exactly as it was before (2 held), and nothing on the board was changed.']]));
        chk(name, where, 'the status line is the plain one', b.stat, stat);
        chk(name, where, 'storage writes: ATL’s list alone -- the batch wrote nothing', J(b.writes), J(['set prio27destdb']));
        const Z = look(X);
        chk(name, where, 'ATL is held after TSS, nothing ticked (as a single load leaves it), the review open', J([Z.offices, Z.ticks, Z.open]), J([['TSS', 'ATL'], [], true]));
        chk(name, where, 'Depot Mid on screen, in the copy kept in this browser and in the saved payload; no Depot Zulu',
          J([Z.destNames, stored(Z.ls).names, /Depot Mid/.test(Z.payload), /Depot Zulu/.test(Z.payload)]),
          J([SEEDED.concat(['Depot Mid']), SEEDED.concat(['Depot Mid']), true, false]));
        chk(name, where, 'the board reopened in this browser reads Depot Mid with the seeded eight, without errors', J(reopen(X)),
          J({ dest: SEEDED.concat(['Depot Mid']), errors: [] }));
        chk(name, where, 'no page errors', J(X.errors), J([]));
      }
    }
    // ONLY A REAL RUN THAT STOPPED PART-WAY is said to have. Here the dry run changes the review (fault injected: it takes
    // the tick off) and a file that would ask then refuses the batch, before anything is taken. The check names the review;
    // the headline still says nothing was loaded, and nothing claims a put-back that never happened.
    {
      const where = 'the dry run takes the review’s tick off (fault injected) · AV, then no year';
      const { X, A } = await start();
      X.ev(`(function(){ var own=uiTakeDry; uiTakeDry=function(p, n){ var r=own(p, n); subPick(0, 'S03', 'asks', false); return r; }; return 1; })()`);
      const b = await batch(X, [F.AV, F.NOFY]);
      chk(name, where, 'refused before anything is taken; the review named as not as before', J(b.r), J({ ok: false, taken: 0,
        asks: [{ file: 'PSM-no-year.json', q: 'That submittal does not say which fiscal year it was written for.' }], back: null, same: false,
        left: ['the submittal review (the submittals it holds, its ticks, whether it is open)'] }));
      chk(name, where, 'the message: nothing loaded, the review named, the rest as before, then the file and its question', J(b.said), J([
        '⚠ None of the 2 submittal files was loaded: “PSM-no-year.json” would ask a question before it could be loaded, and a batch loads only files that need no answer\n\n'
        + '⚠ NOT EVERYTHING IS AS IT WAS. Checked just now, this is not as before the batch:\n'
        + '  • the submittal review (the submittals it holds, its ticks, whether it is open).\n\n'
        + 'Checked just now and exactly as before: the destination list on this board, the plan on screen, whether the board reads as saved, browser storage.'
        + '\n\n  • “PSM-no-year.json” — That submittal does not say which fiscal year it was written for.'
        + '\n\nLoad it on its own (Program offices › ⬅ Load one submission…), where its question is asked about that file alone; then load the rest.']));
      chk(name, where, 'the status line says nothing loaded, and names the review', b.stat,
        '⚠ Nothing loaded — “PSM-no-year.json” would ask a question first — load it on its own (Program offices › ⬅ Load one submission…). Not as before the batch: the submittal review (the submittals it holds, its ticks, whether it is open).');
      chk(name, where, 'never that the batch stopped part-way, or that anything was put back', /stopped part-way|put back/.test(b.said.join('\n') + '\n' + b.stat), false);
      chk(name, where, 'no storage write of any kind', J(b.writes), J([]));
      const Z = look(X);
      chk(name, where, 'true: the tick is off and TSS still held; the list, the plan, the payload and storage are as before',
        J([Z.offices, Z.ticks, Z.dest === A.post.dest, Z.plan === A.post.plan, Z.payload === A.payload, J(Z.ls) === J(A.post.ls)]), J([['TSS'], [], true, true, true, true]));
      chk(name, where, 'no page errors', J(X.errors), J([]));
    }
    // "IT HOLDS WHAT THE BATCH WROTE THERE" only of the batch's own write. While the question is up, another hand writes the
    // stored destination list (fault injected: the eight seeded and a "Depot Other", stamped later than anything here),
    // and storage then refuses the put-back. What is still true is said: the stored list was not put back, and opening the
    // board again in this browser would read it.
    {
      const where = 'another write to the stored list while the question is up, then the put-back refused (fault injected) · AV taken, then Cancel on no year';
      const { X, A, H0 } = await start();
      missAsks(X);
      const b = await batch(X, [F.AV, F.NOFY], { onAsk: () => X.ev(`localStorage.setItem('prio27destdb', JSON.stringify({ts:1790000000001,
        ents:flowDefEnts().concat([{k:'dOther', n:'Depot Other', kind:'gov', t:''}]), lmap:{}, lsig:{}, conflicts:[], gone:[]}));
        window.__fail=function(k){ return k==='prio27destdb'; }; 1`) });
      X.ev('window.__fail=null; 1');
      chk(name, where, 'not put back whole, and not said to be', J(b.r),
        J({ ok: false, taken: 1, asks: [], back: false, same: false, left: ['the destination list kept in this browser'] }));
      chk(name, where, 'the message names the stored list and the reason, says what reopening would read, and never that the batch wrote it', J(b.said), J([HEAD_NOFY + '\n\n'
        + '⚠ NOT EVERYTHING IS AS IT WAS. Checked just now, this is not as before the batch:\n'
        + '  • the destination list kept in this browser — it could not be put back (QuotaExceededError). Opening the board again in this browser would read it '
        + 'instead of the destination list on screen.\n\n'
        + 'Checked just now and exactly as before: the submittal review, the destination list on this board, the plan on screen, whether the board reads as saved.']));
      chk(name, where, 'the status line', b.stat, '⚠ Nothing loaded — “PSM-no-year.json” was not taken. Not as before the batch: the destination list kept in this browser.');
      chk(name, where, 'storage writes: AV’s list, the other write, then the put-back, refused', J(b.writes), J(['set prio27destdb', 'set prio27destdb', 'set prio27destdb']));
      const Z = look(X);
      chk(name, where, 'true: the copy kept in this browser holds the other write -- the seeded eight and Depot Other, no Depot Zulu',
        J([stored(Z.ls).names, stored(Z.ls).ts]), J([SEEDED.concat(['Depot Other']), 1790000000001]));
      chk(name, where, 'true: the board on screen is put back: the review, the list, the plan and the payload',
        J([Z.review === A.post.review, Z.dest === A.post.dest, Z.plan === A.post.plan, Z.payload === A.payload]), J([true, true, true, true]));
      chk(name, where, 'reopening the review shows exactly what it showed before', reviewHtml(X) === H0, true);
      chk(name, where, 'true: reopened in this browser, the board reads the stored list -- as the message said it would', J(reopen(X)),
        J({ dest: SEEDED.concat(['Depot Other']), errors: [] }));
      chk(name, where, 'no page errors', J(X.errors), J([]));
    }
    // AND NOT "INSTEAD OF THE LIST ON SCREEN" when they are the same. The board's own list cannot be put back (fault
    // injected: uiGraphPut throws) and neither can the stored one (storage refuses): both hold what the batch made them.
    {
      const where = 'neither the list on screen nor the stored list can be put back (fault injected) · AV taken, then Cancel on no year';
      const { X } = await start();
      missAsks(X);
      X.ev(`uiGraphPut=function(){ throw new Error('the list would not take its entries back (test)'); }; 1`);
      X.ev(`(function(){ var n=0; window.__fail=function(k){ return k==='prio27destdb' && ++n>1; }; return 1; })()`);
      const b = await batch(X, [F.AV, F.NOFY]);
      X.ev('window.__fail=null; 1');
      chk(name, where, 'not put back whole, and not said to be', J(b.r), J({ ok: false, taken: 1, asks: [], back: false, same: false,
        left: ['the destination list on this board', 'the plan on screen', 'the destination list kept in this browser'] }));
      chk(name, where, 'the message: the stored list holds what the batch wrote -- and nothing about reading it instead of the list on screen', J(b.said), J([HEAD_NOFY + '\n\n'
        + '⚠ NOT EVERYTHING IS AS IT WAS. Checked just now, these are not as before the batch:\n'
        + '  • the destination list on this board — it could not be put back (Error)\n  • the plan on screen\n'
        + '  • the destination list kept in this browser — it could not be put back (QuotaExceededError). It holds what the batch wrote there.\n\n'
        + 'Checked just now and exactly as before: the submittal review, whether the board reads as saved.']));
      const Z = look(X);
      chk(name, where, 'true: the list on screen and the stored list are the same -- the seeded eight and Depot Zulu, as the batch left them',
        J([Z.destNames, stored(Z.ls).names, Z.ls.prio27destdb === Z.dest]), J([SEEDED.concat(['Depot Zulu']), SEEDED.concat(['Depot Zulu']), true]));
      chk(name, where, 'no page errors', J(X.errors), J([]));
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();

await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const name = 'v2.00 UI (M1) — the save state put back is the one taken after the files were read';
  const __bm = bootMark();
  try {
    // A part-way failure is put back to the board as it was once its files were read -- its save state too. Every case of
    // the fix round started from a board that already read Unsaved changes, so a put-back that kept the save state from
    // BEFORE the reads went unseen (the verifier's w06). Here the board is opened from its saved file and reads Saved; Depot
    // Mid is folded in while the files are read (stored, and in no saved file), then Cancel part-way. The header must keep
    // saying Unsaved changes: a board that read Saved there would let Depot Mid be lost from the shared file on closing.
    {
      const where = 'a board opened from its saved file · Depot Mid folded in while the files are read · AV taken, then Cancel on no year';
      const { S0, X } = await readySaved();
      const A = stNow(X);
      chk(name, where, 'CONTROL — before: reads Saved, nothing unsaved, storage holding the plan’s base only, the eight seeded destinations',
        J([A.unsaved, /^Saved /.test(A.head), Object.keys(A.ls), A.dest]), J([false, true, ['prio27om.base'], SEEDED]));
      whileRead(X, `destPkgIn({dest:[{k:'dMid', n:'Depot Mid', kind:'gov', t:''}]}); window.__unsavedAfterReads=unsavedNow();
        window.__saveAfterReads=JSON.stringify([_sideGen, _sideSaved, _dlOnly, DIRTY, _saveGen, JSON.stringify(_lsRefused)]);`);
      missAsks(X);
      const b = await batch(X, [F.AV, F.NOFY]);
      chk(name, where, 'CONTROL — once the files were read, Depot Mid had made the board unsaved', X.ev('window.__unsavedAfterReads'), true);
      chk(name, where, 'not loaded; AV had been taken; put back and checked', J(b.r), J({ ok: false, taken: 1, asks: [], back: true, same: true, left: [] }));
      chk(name, where, 'the message is the plain one', J(b.said), J([HEAD_NOFY + '\n\n' + SAME]));
      chk(name, where, 'storage writes: Depot Mid’s, then AV’s, then the put-back', J(b.writes), J(['set prio27destdb', 'set prio27destdb', 'set prio27destdb']));
      const Z = stNow(X);
      chk(name, where, 'the header says Unsaved changes, and the board counts itself unsaved: Depot Mid is in no saved file', J([Z.head, Z.unsaved]), J(['Unsaved changes', true]));
      chk(name, where, 'the save state is exactly the one taken once the files were read', J(Z.save) === X.ev('window.__saveAfterReads'), true);
      chk(name, where, 'Depot Mid kept on screen and in the copy kept in this browser; Depot Zulu in neither',
        J([Z.dest, stored(Z.ls).names]), J([SEEDED.concat(['Depot Mid']), SEEDED.concat(['Depot Mid'])]));
      chk(name, where, 'the review exactly as before: TSS held', J([Z.review === A.review, JSON.parse(Z.review).subs.map(p => p.pmo)]), J([true, ['TSS']]));
      chk(name, where, 'the board reopened in this browser reads Depot Mid with the seeded eight, without errors', J(reopen(X)),
        J({ dest: SEEDED.concat(['Depot Mid']), errors: [] }));
      chk(name, where, 'no page errors', J([S0.errors, X.errors]), J([[], []]));
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();

await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const name = 'v2.00 UI (M1) — the check names any storage key that is not as before, not only the destination list’s';
  const __bm = bootMark();
  try {
    // The fix round proved every key PUT BACK; the check's own comparison only ever met a difference in prio27destdb, so a
    // check that compared that key alone (the verifier's w11), or noticed an added key only when it was that one (w10),
    // passed every case. Here another key differs when the check is made, and its put-back is refused (fault injected,
    // set from the question): prio27om changed and its write-back refused; prio27test added and its removal refused.
    // removeItem made refusable on top of ready()'s own hook, which still logs every call
    const rmRefusable = X => X.ev(`(function(){ window.__failRm=null; var P=Object.getPrototypeOf(localStorage), rm=P.removeItem;
      P.removeItem=function(k){ if(window.__failRm && window.__failRm(k)){ window.__w.push('remove '+k); var e=new Error('storage refused (test)'); e.name='SecurityError'; throw e; }
        return rm.call(this,k); }; return 1; })()`);
    for (const [where, onAsk, key, reason, during, back, kept, keys] of [
      ['prio27om changed while the question is up, its write-back refused (fault injected) · AV taken, then Cancel on no year',
        `localStorage.setItem('prio27om', 'changed while the batch ran (test)'); window.__fail=function(k){ return k==='prio27om'; }; 1`,
        'prio27om', 'QuotaExceededError', ['set prio27destdb', 'set prio27om'], ['set prio27destdb', 'set prio27om'],
        { prio27om: 'changed while the batch ran (test)' }, ['prio27destdb', 'prio27om', 'prio27om.base']],
      ['prio27test added while the question is up, its removal refused (fault injected) · AV taken, then Cancel on no year',
        `localStorage.setItem('prio27test', 'added while the batch ran (test)'); window.__failRm=function(k){ return k==='prio27test'; }; 1`,
        'prio27test', 'SecurityError', ['set prio27destdb', 'set prio27test'], ['remove prio27test', 'set prio27destdb'],
        { prio27test: 'added while the batch ran (test)' }, ['prio27destdb', 'prio27om', 'prio27om.base', 'prio27test']]]) {
      const { X, A } = await start();
      rmRefusable(X);
      missAsks(X);
      const b = await batch(X, [F.AV, F.NOFY], { onAsk: () => X.ev(onAsk) });
      X.ev('window.__fail=null; window.__failRm=null; 1');
      chk(name, where, 'not put back whole, and not said to be: the key named', J(b.r),
        J({ ok: false, taken: 1, asks: [], back: false, same: false, left: ['browser storage “' + key + '”'] }));
      chk(name, where, 'the message names the key and the browser’s reason; and what is as before', J(b.said), J([HEAD_NOFY + '\n\n'
        + '⚠ NOT EVERYTHING IS AS IT WAS. Checked just now, this is not as before the batch:\n'
        + '  • browser storage “' + key + '” — it could not be put back (' + reason + ').\n\n'
        + 'Checked just now and exactly as before: the submittal review, the destination list on this board, the plan on screen, whether the board reads as saved.']));
      chk(name, where, 'never that nothing was changed, nor that browser storage is as before', /nothing on the board was changed|browser storage\./.test(b.said.join('\n')), false);
      chk(name, where, 'the status line names the key', b.stat, '⚠ Nothing loaded — “PSM-no-year.json” was not taken. Not as before the batch: browser storage “' + key + '”.');
      chk(name, where, 'storage writes during the batch: AV’s list, then the test’s own', J(b.writes.slice(0, 2)), J(during));
      chk(name, where, 'the put-back’s writes: the destination list given back, and the refused one', J(b.writes.slice(2).sort()), J(back));
      const Z = look(X);
      chk(name, where, 'true: storage holds what the message says it does, and every other key exactly as before',
        J(Object.keys(Z.ls).map(k => [k, Object.prototype.hasOwnProperty.call(kept, k) ? Z.ls[k] === kept[k] : Z.ls[k] === A.post.ls[k]])),
        J(keys.map(k => [k, true])));
      chk(name, where, 'true: the review, the destination list, the plan, the payload and the save state are as before',
        J([Z.review === A.post.review, Z.dest === A.post.dest, Z.plan === A.post.plan, Z.payload === A.payload, J(Z.save) === J(A.post.save)]), J([true, true, true, true, true]));
      chk(name, where, 'no page errors', J(X.errors), J([]));
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();

await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const name = 'v2.00 UI (M1) — after a put-back that cannot finish, the saved file and the board reopened hold what was reported';
  const __bm = bootMark();
  try {
    // The fix round's cases (a)-(d) checked each message against the board on screen. The M1 test spec asks more of a
    // failed put-back: exactly the reported partial state, in what is saved and in what reopens. The same four faults
    // (each injected, as there), and then: the saved payload's destination list and plan, the review reopened, and the
    // board reopened from its saved file in this browser.
    const fault = {
      list: X => X.ev(`uiGraphPut=function(){ throw new Error('the list would not take its entries back (test)'); }; 1`),
      plan: X => X.ev(`MS.uiFault='set while the batch ran (test)'; 1`),
      save: X => X.ev('Object.preventExtensions(_lsRefused); 1'),
      review: X => X.ev(`Object.defineProperty(PMOSUBS, 'push', {configurable:true, writable:true,
        value:function(){ throw new Error('the review would not take its submittals back (test)'); }}); 1`),
    };
    for (const [where, before, f, atAsk, left, dest, planHas, samePayload, reviewSame] of [
      ['(a) the destination list cannot be put back (fault injected) · AV taken, then Cancel on no year', null, 'list', false,
        ['the destination list on this board', 'the plan on screen'], SEEDED.concat(['Depot Zulu']), 'Depot Zulu', false, true],
      ['(b) the plan changed during the batch (fault injected) · AV taken, then Cancel on no year', null, 'plan', true,
        ['the plan on screen'], SEEDED, 'set while the batch ran (test)', false, true],
      ['(c) the save state cannot be put back (fault injected) · storage refused the list before; AV taken, then Cancel on no year',
        `window.__fail=function(k){ return k==='prio27destdb'; }; persistDest(); window.__fail=null; 1`, 'save', true,
        ['whether the board reads as saved'], SEEDED, null, true, true],
      ['(d) the review cannot be put back (fault injected) · AV taken, then Cancel on no year', null, 'review', true,
        ['the submittal review (the submittals it holds, its ticks, whether it is open)'], SEEDED, null, true, false]]) {
      const { X, A, H0 } = before ? await startWith(before) : await start();
      missAsks(X);
      if (!atAsk) fault[f](X);
      const b = await batch(X, [F.AV, F.NOFY], { onAsk: atAsk ? () => fault[f](X) : null });
      if (f === 'review') X.ev('delete PMOSUBS.push; 1');
      chk(name, where, 'the state reported: not put back whole, and these named', J([b.r.back, b.r.same, b.r.left]), J([f === 'plan', false, left]));
      const Z = look(X), P = JSON.parse(Z.payload);
      chk(name, where, 'the saved payload’s destination list is the one on screen', J([P.destDb.ents.map(e => e.n), Z.destNames]), J([dest, dest]));
      chk(name, where, planHas ? 'the saved payload carries what the message said is not as before' : 'the saved payload is byte for byte as before the batch',
        planHas ? Z.payload.includes(planHas) : Z.payload === A.payload, true);
      if (planHas) chk(name, where, 'and so it is not the payload from before the batch', Z.payload === A.payload, samePayload);
      chk(name, where, reviewSame ? 'reopening the review shows exactly what it showed before' : 'reopening the review shows it without TSS, as the message said',
        reviewSame ? reviewHtml(X) === H0 : J([reviewHtml(X) === H0, Z.offices]), reviewSame ? true : J([false, []]));
      chk(name, where, 'the board reopened from its saved file in this browser reads the destination list reported, without errors', J(reopen(X)),
        J({ dest, errors: [] }));
      chk(name, where, 'no page errors', J(X.errors), J([]));
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end v2.00 UI chunk 3 (M1, fix round 2) ====

// ==== v2.00 UI chunk 3 (S2): a board-wide journal line recorded under another year suppresses "Last recorded edit" ====
// The chunk 2 review's S2: the RECORD panel's "Last recorded edit" looked for a board-wide journal line only among the lines
// of the year on screen, so a service-list change made while FY28 was on screen left FY27's record naming a note as the
// last edit over figures the change had moved. Brad, 12 Oct: "consider board-wide journal events before filtering by year;
// suppress a misleading 'Last recorded edit.'" Each case is the board's own calls: a note on S03 in FY27 (setNote), FY28
// opened (switchYear, rolled forward), something done there, FY27 opened again -- then what the record says about S03.
// Expected values are written out by hand; the board is only asked what IS.
const S2_NOTE = { t: 1790000600000, by: 'unknown', fy: 2027, p: ['notes', 'S03'], a: null, b: 'probe note' };
const S2_TAIL = ' · unknown · note (change journal; ranking moves are not journalled)';
// the board, S03 noted in FY27, FY28 opened; `code` run there; FY27 opened again. What the record says about S03 then.
const s2Run = async (code, { back = true } = {}) => {
  const X = open();
  X.w.confirm = () => true; X.w.alert = () => {};
  X.ev(`Date.now=function(){ return 1790000600000; }; setNote('S03','probe note'); render(); 1`);
  X.ev(`Date.now=function(){ return 1790000700000; }; switchYear(2028); render(); 1`);
  const r = { fy28: X.ev('MS.cur'), ran: X.ev(`Date.now=function(){ return 1790000900000; }; (function(){ ${code} })()`) };
  if (back) X.ev(`Date.now=function(){ return 1790001000000; }; switchYear(2027); render(); 1`);
  r.cur = X.ev('MS.cur');
  r.tail = JSON.parse(X.ev(`JSON.stringify(MS.jrnl.slice(-3).map(function(e){ return [e.fy, e.p.length? e.p[0] : null]; }))`));
  r.last = JSON.parse(X.ev(`JSON.stringify(uiLastEdit('S03'))`));
  X.ev(`setCur('S03'); 1`); await wait(40);
  r.panel = JSON.parse(X.ev(`JSON.stringify([].slice.call(document.querySelectorAll('#inspector .uiDOv, #inspector .uiDHist')).map(function(e){ return e.textContent; }))`));
  r.X = X;
  return r;
};
const s2Says = r => r.panel.map(t => t.includes('Last recorded edit ') && t.includes(S2_TAIL) ? 'the note' : (t.includes('Last recorded edit') ? 'another line' : 'no line'));

await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const name = 'v2.00 UI (S2) — a board-wide journal line recorded under another year suppresses the last-edit line';
  const __bm = bootMark();
  try {
    // CONTROL: before anything else happens, FY27's record names the note, in its Overview and in its History
    {
      const where = 'CONTROL: the note on S03, FY28 opened and nothing done there';
      const r = await s2Run('return 1;');
      chk(name, where, 'FY28 was opened, and FY27 is on screen again', J([r.fy28, r.cur]), J([2028, 2027]));
      chk(name, where, 'the last edit is the note, exactly', J(r.last), J(S2_NOTE));
      chk(name, where, 'the record says so in its Overview and its History', J(s2Says(r)), J(['the note', 'the note']));
      chk(name, where, 'no page errors', J(r.X.errors), J([]));
    }
    // THE BOARD-WIDE KINDS, each recorded while FY28 was on screen: the record no longer names the note
    for (const [where, code, ran, line] of [
      ['the service list changed (svcSaveList) while FY28 was on screen', `return svcSaveList(['USAF','ANG']);`, true, '(services)'],
      ['a copy put back from the folder (the load line the restore records, jrnlSync) while FY28 was on screen',
        `jrnlSync('restored the copy from probe'); return true;`, true, '(load)'],
      ['201 changes in one save while FY28 was on screen (the test writes 201 notes at once; the board’s own save records 200 and a (more) line)',
        `for(var i=0;i<201;i++) S.notes['Z'+i]='n'+i; save(); return MS.jrnl[MS.jrnl.length-1].b;`,
        '1 more change in this save, past the first 200 — not recorded one by one, and not undoable from here', '(more)'],
      ['a save that could not be recorded while FY28 was on screen (fault injected: the journal’s walk throws once)',
        `var own=jrnlWalk; jrnlWalk=function(){ throw new Error('walk refused (test)'); }; try{ setNote('S05','FY28 note'); } finally { jrnlWalk=own; } return MS.jrnl[MS.jrnl.length-1].b;`,
        'the changes in this save could not all be recorded (walk refused (test))', '(unrecorded)']]) {
      const r = await s2Run(code);
      chk(name, where, 'CONTROL — what the board’s own call returned', J(r.ran), J(ran));
      chk(name, where, 'CONTROL — the line is recorded under FY28, and FY27 is on screen again', J([r.tail.filter(t => t[1] === line), r.cur]), J([[[2028, line]], 2027]));
      chk(name, where, 'FY27: no last edit is named for S03', J(r.last), J(null));
      chk(name, where, 'the record says nothing of a last edit, in its Overview or its History', J(s2Says(r)), J(['no line', 'no line']));
      chk(name, where, 'no page errors', J(r.X.errors), J([]));
    }
    // the service-list change moved FY27's figures, which is why the note cannot stand as the last edit
    {
      const where = 'the service list changed while FY28 was on screen: FY27’s figures moved with it';
      const r = await s2Run(`return svcSaveList(['USAF','ANG']);`);
      chk(name, where, 'S03’s requirement value in FY27 lost AFRC', r.X.ev(`JSON.stringify((S.asks||{})['S03'] || BASE_ASK['S03'])`), J([7000000, 2000000]));
    }
    // the same kind recorded under FY27 itself: suppressed, as before
    {
      const where = 'the service list changed while FY27 was on screen';
      const r = await s2Run(`switchYear(2027); return svcSaveList(['USAF','ANG']);`);
      chk(name, where, 'CONTROL — the line is recorded under FY27', J(r.tail.filter(t => t[1] === '(services)')), J([[2027, '(services)']]));
      chk(name, where, 'no last edit is named for S03', J([r.last, s2Says(r)]), J([null, ['no line', 'no line']]));
    }
    // WHAT IS NOT BOARD-WIDE leaves FY27's line standing: the pen changing hands, a note on S03 in FY28, a requirement
    // removed in FY28, FY28 itself created -- each of them FY28's own, or no change to any field
    for (const [where, code, line] of [
      ['the pen changed hands while FY28 was on screen (writerJournal)', `writerJournal(null); return true;`, '(writer)'],
      ['a note on S03 in FY28', `setNote('S03','FY28 note'); return true;`, 'notes'],
      ['S05 removed in FY28 (removeReq)', `removeReq('S05'); return true;`, 'removed']]) {
      const r = await s2Run(code);
      chk(name, where, 'CONTROL — the last line is FY28’s own, and FY27 is on screen again', J([r.tail.slice(-1), r.cur]), J([[[2028, line]], 2027]));
      chk(name, where, 'CONTROL — FY28 was created by a whole-year line of its own', r.X.ev(`MS.jrnl.some(function(e){ return e.fy===2028 && e.p.length===0; })`), true);
      chk(name, where, 'FY27: the last edit is still the note, exactly', J(r.last), J(S2_NOTE));
      chk(name, where, 'the record says so in its Overview and its History', J(s2Says(r)), J(['the note', 'the note']));
      chk(name, where, 'no page errors', J(r.X.errors), J([]));
    }
    // and in FY28 itself, the FY28 note is S03's last edit there
    {
      const where = 'a note on S03 in FY28, read in FY28';
      const r = await s2Run(`setNote('S03','FY28 note'); return true;`, { back: false });
      chk(name, where, 'FY28: the last edit is FY28’s note', J(r.last), J({ t: 1790000900000, by: 'unknown', fy: 2028, p: ['notes', 'S03'], a: 'probe note', b: 'FY28 note' }));
      chk(name, where, 'no page errors', J(r.X.errors), J([]));
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end v2.00 UI chunk 3 (S2) ====

// ==== v2.00 UI chunk 3 (S3): a refused batch, from a board that reads Saved, changes nothing and writes nothing ====
// The chunk 2 review's S3: the batch's dry run (uiTakeDry) runs the board's own pmoTake on a copy of each file with alert,
// confirm, setStat, subOpenReview, destPkgIn, PMOSUBS and PMOPICK held back. That is sound only while those are everything
// pmoTake changes: one that came to write a journal line, browser storage or a counter would leak through the dry run with
// nothing to say so. Every M1 case above starts from a board already reading Unsaved changes, where a dry run that marked
// the board unsaved would show nothing; these start from a board opened from its saved file, which reads Saved. Brad, 12
// Oct: "add the refused-batch test and note. Verify storage, MS and DESTDB remain unchanged, including no unintended
// writes." The note is the comment above pmoTake. Expected values are written out by hand, as above.
const S3_ASK = (f, q) => '⚠ None of the 2 submittal files was loaded: “' + f + '” would ask a question before it could be loaded, and a batch loads only files that need no answer'
  + '\n\n' + SAME + '\n\n  • “' + f + '” — ' + q + '\n\nLoad it on its own (Program offices › ⬅ Load one submission…), where its question is asked about that file alone; then load the rest.';

await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const name = 'v2.00 UI (S3) — a refused batch, from a board that reads Saved, changes nothing and writes nothing';
  const __bm = bootMark();
  try {
    for (const [where, list, said] of [
      ['a good file, then a malformed one (refused as the files are read)', [F.AV, F.BROKEN],
        '⚠ None of the 2 submittal files was loaded: “broken.json” is not a programme office’s submittal\n\n' + SAME],
      ['the same office twice (refused before the dry run)', [F.AV, F.AVcopy],
        '⚠ None of the 2 submittal files was loaded: “AV.json” and “AV-copy.json” are both from AV. A batch takes one submittal per office — load the one you mean\n\n' + SAME],
      ['a good file, then one of the wrong width (refused by the dry run, which ran pmoTake on both)', [F.AV, F.WIDTH],
        '⚠ None of the 2 submittal files was loaded: “PSM-wrong-width.json” would not be taken — ⚠ That submittal proposes requirement values with the wrong number of services for 1 requirement (S01).\n\n' + SAME],
      ['a good file, then one that would ask (the dry run ran pmoTake on both; AV’s list and its own held back)', [F.AV, F.NOFY],
        S3_ASK('PSM-no-year.json', 'That submittal does not say which fiscal year it was written for.')],
      ['a good file, then one with no office (asked after its own list is folded in, so the dry run held that fold back)', [F.AV, F.NOPMO],
        S3_ASK('no-office.json', 'That submittal does not say which programme office it is from.')]]) {
      const { S0, X } = await readySaved();
      X.ev('window.__s3=[MS, MS.jrnl, DESTDB, DESTDB.ents, DESTDB.lmap, PMOSUBS, PMOPICK]; 1');
      const A = stNow(X);
      chk(name, where, 'CONTROL — before: reads Saved, nothing unsaved, storage holding the plan’s base only, the eight seeded destinations, TSS held',
        J([A.unsaved, /^Saved /.test(A.head), Object.keys(A.ls), A.dest, JSON.parse(A.review).subs.map(p => p.pmo)]), J([false, true, ['prio27om.base'], SEEDED, ['TSS']]));
      const b = await batch(X, list);
      chk(name, where, 'refused, nothing taken, nothing asked', J([b.r.ok, b.r.taken, b.asked]), J([false, 0, []]));
      chk(name, where, 'the message', J(b.said), J([said]));
      chk(name, where, 'setItem and removeItem were never called, for any key', J(b.writes), J([]));
      const Z = stNow(X);
      chk(name, where, 'browser storage: every key and value exactly as before, and the one key it held', J([J(Z.ls) === J(A.ls), Object.keys(Z.ls)]), J([true, ['prio27om.base']]));
      chk(name, where, 'MS: the same object and the same journal, exactly as before', J([X.ev('MS===window.__s3[0] && MS.jrnl===window.__s3[1]'), Z.plan === A.plan]), J([true, true]));
      chk(name, where, 'DESTDB: the same objects (the list, its ents, its lmap), exactly as before, the eight seeded',
        J([X.ev('DESTDB===window.__s3[2] && DESTDB.ents===window.__s3[3] && DESTDB.lmap===window.__s3[4]'), Z.destTxt === A.destTxt, Z.dest]), J([true, true, SEEDED]));
      chk(name, where, 'the review: the same objects, exactly as before', J([X.ev('PMOSUBS===window.__s3[5] && PMOPICK===window.__s3[6]'), Z.review === A.review]), J([true, true]));
      chk(name, where, 'still reads Saved: the save state exactly as before, the header Saved, nothing unsaved', J([Z.save, /^Saved /.test(Z.head), Z.unsaved]), J([A.save, true, false]));
      chk(name, where, 'no page errors', J([S0.errors, X.errors]), J([[], []]));
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end v2.00 UI chunk 3 (S3) ====

// ==== v2.00 UI chunk 3 (S2, fix round): the same-year half of the rules S2 rewrote ====
// The S2 verifier: S2 rewrote the line that reads a whole year (an empty path) and a removed requirement as lines that may
// have changed this requirement without naming it, and kept both tied to their own year; only the other-year half was
// tested above. With either dropped from that line (the verifier's vS2-removed-ignored and vS2-empty-path-ignored), every
// check passed, and a requirement removed in the year on screen after S03's note left "Last recorded edit … note"
// standing. These are that half: each line recorded in FY27, the year on screen, after the note.
//   - S05 removed in FY27 (removeReq), the board's own call.
//   - A whole-year line for FY27. No call on this board writes one after a line in its own year: a year's plan comes into
//     the file once, when the year is created (FY28's own whole-year line above), and none takes a year out. A journal
//     carried in a saved file can hold one, so it is put at the end of the board's journal as such a file carries it (the
//     shape jrnlCapture writes when a year's plan changes in one piece), the board saved, and the board reopened from that
//     saved file in the same browser: what the record says there is read.
// Expected values are written out by hand; the board is only asked what IS.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const name = 'v2.00 UI (S2) — a whole year or a removed requirement in the year on screen, after the note, suppresses the last-edit line';
  const __bm = bootMark();
  try {
    // CONTROL: the same note, FY28 opened and FY27 again, nothing else -- the record names the note (as in the S2 block)
    {
      const where = 'CONTROL: the note on S03, FY28 opened and FY27 again, nothing done in either';
      const r = await s2Run(`switchYear(2027); return true;`);
      chk(name, where, 'FY27 is on screen, and the last edit is the note, exactly', J([r.cur, r.last]), J([2027, S2_NOTE]));
      chk(name, where, 'the record says so in its Overview and its History', J(s2Says(r)), J(['the note', 'the note']));
      chk(name, where, 'no page errors', J(r.X.errors), J([]));
    }
    // S05 removed in FY27, the year on screen, after S03's note
    {
      const where = 'S05 removed in FY27 (removeReq), the year on screen, after the note on S03';
      const r = await s2Run(`switchYear(2027); removeReq('S05'); return S.removed.indexOf('S05')>=0;`);
      chk(name, where, 'CONTROL — S05 is on FY27’s removed list, and the last line is FY27’s removal of it', J([r.ran, r.tail.slice(-1), r.cur]), J([true, [[2027, 'removed']], 2027]));
      chk(name, where, 'CONTROL — the removal line is S05’s, not S03’s', r.X.ev(`JSON.stringify([MS.jrnl[MS.jrnl.length-1].p, MS.jrnl[MS.jrnl.length-1].b])`), J([['removed', 0], 'S05']));
      chk(name, where, 'FY27: no last edit is named for S03', J(r.last), J(null));
      chk(name, where, 'the record says nothing of a last edit, in its Overview or its History', J(s2Says(r)), J(['no line', 'no line']));
      chk(name, where, 'no page errors', J(r.X.errors), J([]));
    }
    // a whole-year line for FY27 at the end of the journal, carried through the saved file into the board reopened from it
    {
      const where = 'a whole-year line for FY27 after the note, in the journal of a saved file, the board reopened from it';
      const r = await s2Run(`switchYear(2027); return true;`);
      r.X.ev(`MS.jrnl.push({t:1790000950000, by:'K Jones', fy:2027, p:[], a:{_b:4100}, b:{_b:4200}}); save(); 1`);
      const R = boot({ html: r.X.ev('buildSavedHtml()'), ls: look(r.X).ls });
      const got = JSON.parse(R.ev(`JSON.stringify({ cur: MS.cur, tail: MS.jrnl.slice(-3).map(function(e){ return [e.fy, e.p.length? e.p[0] : null, e.by]; }),
        label: jrnlLabel(MS.jrnl[MS.jrnl.length-1]), last: uiLastEdit('S03') })`));
      chk(name, where, 'CONTROL — reopened on FY27; last in its journal the note, FY28 created, and the whole-year line, read as the FY27 plan replaced',
        J([got.cur, got.tail, got.label]), J([2027, [[2027, 'notes', 'unknown'], [2028, null, 'unknown'], [2027, null, 'K Jones']], 'the FY27 plan — replaced']));
      chk(name, where, 'FY27: no last edit is named for S03', J(got.last), J(null));
      R.ev(`setCur('S03'); 1`); await wait(40);
      const panel = JSON.parse(R.ev(`JSON.stringify([].slice.call(document.querySelectorAll('#inspector .uiDOv, #inspector .uiDHist')).map(function(e){ return e.textContent; }))`));
      chk(name, where, 'the record says nothing of a last edit, in its Overview or its History', J(s2Says({ panel })), J(['no line', 'no line']));
      chk(name, where, 'no page errors, in the board or the board reopened', J([r.X.errors, R.errors]), J([[], []]));
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end v2.00 UI chunk 3 (S2, fix round) ====

{
  const src = _selfRead(_selfPath(import.meta.url), 'utf8');
  const named = [...src.matchAll(/^  const name = '([^']+)'/gm)].map(m => m[1]);   // a scenario's own line, never this one
  named.forEach(n => { if (![...SEEN].some(s => s === n || s.startsWith(n))) failures.push({ scenario: n, where: 'harness',
    what: 'this scenario never ran — is its block after process.exit()?', got: 'never ran', want: 'ran' }); });
}
console.log('\n' + '='.repeat(96));
if (!failures.length) { console.log('ALL CHECKS PASSED'); process.exit(0); }
const by = {};
failures.forEach(f => { const k = f.scenario + ' | ' + f.where; (by[k] ||= []).push(f); });
console.log(`${failures.length} FAILING CHECK(S)\n`);
for (const [k, fs] of Object.entries(by)) {
  console.log(`--- ${k}`);
  fs.forEach(f => console.log(`    ${f.what}\n        got ${f.got}   want ${f.want}`));
}
process.exit(1);
