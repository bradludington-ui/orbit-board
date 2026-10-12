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
        + '\n\n  • “' + f[0] + '” — ' + q + '\n\nLoad it on its own (PMO Import › One submission), where its question is asked about that file alone; then load the rest.']));
      chk(name, where, 'the status line says the same', b.stat, '⚠ Nothing loaded — “' + f[0] + '” would ask a question first — load it on its own (One submission)');
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
        + '\n\nLoad each of those on its own (PMO Import › One submission), where its question is asked about that file alone; then load the rest.']]));
      chk(name, where, 'the status line names all three', b.stat,
        '⚠ Nothing loaded — “PSM-no-year.json”, “ATL-FY28.json”, “no-office.json” would ask a question first — load each on its own (One submission)');
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
