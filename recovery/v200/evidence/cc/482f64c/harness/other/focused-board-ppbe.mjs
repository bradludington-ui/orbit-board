// FOCUSED HARNESS: audit-board preamble, the PPBE CYCLES blocks and the guard, VERBATIM from /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/482f64c/after/tools/export-audit/audit-board.mjs
// Audit the figures the BOARD derives and shows but never exports.
//
// The three export suites compare printed cells against the lane engine. Anything the board
// computes for the screen alone is invisible to them — a mutation sweep found exactly that: the
// cumulative column could be made to skip unfunded dollars entirely and every export suite passed,
// because no export carries it.
//
// The cumulative is not decoration. It is how the cutline banners are placed, so it is the figure
// that tells someone where the money runs out. Its oracle is derived here, from the scenario's own
// inputs, never read back from tiers() — an oracle that asks the code under test what the answer
// is will agree with it, including when it is wrong.
import { boot, seed, stopAtFirstFailure, capture, cv } from './boot.mjs';

const failures = [];
stopAtFirstFailure(failures);   // in the mutation sweep only: see boot.mjs
// EVERY NAMED SCENARIO MUST RUN. A block appended after process.exit() never executes and reads as
// a pass -- the proposal scenario in audit-import.mjs sat there for a whole verification round and
// five mutations aimed at it survived. chk() records every scenario it hears from; at the summary,
// any `const name = '...'` in this file it never heard from is a failure, not a pass.
import { readFileSync as _selfRead } from 'node:fs';
import { fileURLToPath as _selfPath } from 'node:url';
const SEEN = new Set();
// SUITE_CHECKS=<file> records every check (v1.99), as audit-import and audit-recon do, so a fail-before run can be counted
import { appendFileSync as _ckAppend } from 'node:fs';
const CHECKS = process.env.SUITE_CHECKS || '';
const chk = (scenario, where, what, got, want) => {
  SEEN.add(scenario);
  const ok = typeof got === 'number' && typeof want === 'number'
    ? Math.abs(got - want) <= 0.005 : String(got) === String(want);
  if (CHECKS) _ckAppend(CHECKS, JSON.stringify([scenario, where, what, ok, String(got).slice(0, 400)]) + '\n');
  if (!ok) failures.push({ scenario, where, what, got, want });
};
const sum = a => a.reduce((x, y) => x + y, 0);

const SVC3 = ['STOVL', 'CV', 'CTOL'];
const it = (id, grp, ask, extra = {}) => ({
  id, grp, team: grp, sect: '', custom: false, title: id + ' title', event: id + ' event',
  ccar: '', fy26: ask.map(() => 0), ask, alloc: null, ...extra,
});

// ═══ PPBE CYCLES — THE LOCK IS THE WINDOW, FROZEN ══════════════════════════════════════════
// A lock copies every window year that holds a plan, projects each from ITS OWN state, and never
// changes afterwards; the working plan is untouched and gets its tag and reference. The year on
// screen sits OUTSIDE the window here (base = cur+1), the way FY27 does once the base rolls to
// FY28, and three window years are deliberately blank. Then the file, the import, the legacy
// migration and the Spruills are each made to prove they read the lock and nothing else.
{
  const name = 'PPBE cycles — the lock is the window, frozen';
  try {
  const sc = { services: ['USAF', 'ANG', 'STOVL'],
    items: [it('A', 'PSM', [100, 50, 20]), it('B', 'AV', [80, 40, 10]), it('C', 'PSM', [60, 30, 15]), it('D', 'MxS', [40, 20, 5])],
    disc: [150, 60, 30], mand: [40, 20, 10], order: ['A', 'B', 'C', 'D'] };
  const { ev, errors } = boot();
  seed(ev, sc);
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); 'ok'`);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));
  const cur = +ev('MS.cur');
  // two more planned years: cur+1 with A's value doubled, cur+5 (the last window year) without D
  ev(`MS.years[MS.cur]=S; MS.base=MS.cur+1;
      var y1=JSON.parse(JSON.stringify(S)); y1.asks={A:[200,100,40]}; delete y1.pmoOrder; MS.years[MS.cur+1]=y1;
      var y5=JSON.parse(JSON.stringify(S)); y5.order=['A','B','C']; y5.removed=['D']; delete y5.pmoOrder; MS.years[MS.cur+5]=y5;
      'ok'`);
  const held = [cur, cur + 1, cur + 5];
  chk(name, 'window', 'the years a lock takes: the window where planned, and the year on screen outside it',
    ev('JSON.stringify(cycWindowYears())'), JSON.stringify(held));
  ev(`blCyc='PB'; blYr=MS.cur; blNote='  as briefed  '; cycLock(); 'ok'`);
  const key = 'PB|' + cur;
  const c = () => JSON.parse(ev(`JSON.stringify(blGet('${key}')||null)`));
  const C0 = c();
  chk(name, 'lock', 'the cycle exists and is locked', !!(C0 && C0.locked), true);
  chk(name, 'lock', 'it holds exactly the planned window years, whole', Object.keys(C0.years).join(','), held.join(','));
  chk(name, 'lock', 'and a projection for each', Object.keys(C0.proj).join(','), held.join(','));
  chk(name, 'lock', 'the note is kept, trimmed', C0.note, 'as briefed');
  chk(name, 'lock', 'the base and the window are recorded', C0.base + ':' + C0.window.join(','), (cur + 1) + ':' + held.join(','));
  chk(name, 'lock', 'the working plan takes the tag, being untagged', ev('MS.cycle'), key);
  chk(name, 'lock', 'and reads its deltas against the lock', ev('MS.cycleRef'), key);
  chk(name, 'lock', 'the board on screen is unchanged: still the year it was on', +ev('MS.cur'), cur);
  chk(name, 'lock', 'with its own order intact', ev('JSON.stringify(S.order)'), JSON.stringify(sc.order));
  // each projection is ITS year's plan
  const askOf = (fy, id) => JSON.stringify(((C0.proj[fy].reqs.find(r => r.id === id)) || {}).ask);
  chk(name, 'projection', `FY${(cur + 1) % 100}’s projection carries FY${(cur + 1) % 100}’s value of A, not the screen year’s`, askOf(cur + 1, 'A'), JSON.stringify([200, 100, 40]));
  chk(name, 'projection', 'the year on screen keeps its own', askOf(cur, 'A'), JSON.stringify([100, 50, 20]));
  chk(name, 'projection', `FY${(cur + 5) % 100} has no D`, C0.proj[cur + 5].reqs.some(r => r.id === 'D') ? 'D present' : 'absent', 'absent');
  const fundNow = JSON.parse(ev(`JSON.stringify((function(){ var T=tiers(); return S.order.map(function(id){ var p=T[id]; return p.d.map(function(v,i){ return v+p.m[i]; }); }); })())`));
  chk(name, 'projection', 'funded is the lane draw, d+m per service, requirement by requirement',
    JSON.stringify(C0.proj[cur].reqs.map(r => r.fund)), JSON.stringify(fundNow));
  chk(name, 'projection', 'and disc and mand are stored apart, adding to it',
    C0.proj[cur].reqs.every(r => r.fund.every((v, i) => Math.abs(v - (r.d[i] + r.m[i])) < 1e-9)) ? 'yes' : 'no', 'yes');
  chk(name, 'projection', 'the PMO roll-up funded is its requirements added',
    JSON.stringify(C0.proj[cur].pmo.PSM.fund),
    JSON.stringify([0, 1, 2].map(i => C0.proj[cur].reqs.filter(r => r.grp === 'PSM').reduce((a, r) => a + r.fund[i], 0))));
  chk(name, 'projection', 'the budget authority of the year is carried', JSON.stringify([C0.proj[cur].disc, C0.proj[cur].mand]), JSON.stringify([sc.disc, sc.mand]));
  // immutability
  const frozen = JSON.stringify(C0.years[cur]);
  ev(`setAsk('B',0,'1'); S.mc['A']=true; save(); 'ok'`);
  const C1 = c();
  chk(name, 'frozen', 'editing the board leaves the locked year byte-identical', JSON.stringify(C1.years[cur]) === frozen ? 'unchanged' : 'CHANGED', 'unchanged');
  chk(name, 'frozen', 'because the lock is a copy, not a reference', ev(`blGet('${key}').years[MS.cur]===MS.years[MS.cur]`), false);
  chk(name, 'frozen', 'and the projection did not move either', JSON.stringify(C1.proj[cur].reqs.map(r => r.ask)), JSON.stringify(C0.proj[cur].reqs.map(r => r.ask)));
  // a second lock under the same key is refused while locked; delete is refused while locked
  ev(`cycLock(); 'ok'`);
  chk(name, 'locked', 'a second lock under a locked key is refused', c().ts, C0.ts);
  ev(`blDelete('${key}'); 'ok'`);
  chk(name, 'locked', 'delete is refused while locked', !!c(), true);
  ev(`blLock('${key}', false); 'ok'`);
  chk(name, 'unlock', 'an unlock is stamped with who and when', (c().unlocks || []).length + ':' + ((c().unlocks || [{}])[0].by || ''), '1:' + ev('whoAmI()'));
  chk(name, 'unlock', 'and the cycle is open', c().locked, false);
  chk(name, 'header', 'the header names the working cycle', /PB\d\d/.test(ev(`document.getElementById('cycTag').textContent`)), true);
  // save → reopen: the store, the tag and the reference travel in the file
  const html = ev('buildSavedHtml()');
  const R = boot({ html });
  chk(name, 'file', 'the locked cycles come back from a saved file, byte for byte', R.ev('JSON.stringify(CYCDB)'), ev('JSON.stringify(CYCDB)'));
  chk(name, 'file', 'so does the working plan’s tag', R.ev('MS.cycle'), ev('MS.cycle'));
  chk(name, 'file', 'and its reference', R.ev('MS.cycleRef'), ev('MS.cycleRef'));
  chk(name, 'file', 'a package for a manager does not carry the store', ev(`JSON.stringify(pkgStrip({cycDb:{byAp:{}}, years:{}}))`), JSON.stringify({ years: {} }));
  // import: a cycle held here is never replaced by one arriving in a file; one not held is taken
  const imp = JSON.parse(ev(`(function(){
      var mine=blGet('${key}'); var inc={cycDb:{byAp:{}}}; var slot={cycles:{}}; inc.cycDb.byAp[mySlug()]=slot;
      var theirs=JSON.parse(JSON.stringify(mine)); theirs.ts=mine.ts+1; theirs.note='THEIRS';
      slot.cycles['${key}']=theirs;
      slot.cycles['BES|'+(MS.cur+1)]=JSON.parse(JSON.stringify(mine));
      var said=importStores(inc);
      return JSON.stringify({said:said, note:blGet('${key}').note, took:!!blGet('BES|'+(MS.cur+1))}); })()`));
  chk(name, 'import', 'a cycle held here is left alone', imp.note, 'as briefed');
  chk(name, 'import', 'a cycle not held here is taken', imp.took, true);
  chk(name, 'import', 'and both are said in words', imp.said.some(x => /left alone/.test(x)) && imp.said.some(x => /came across/.test(x)), true);
  ev(`blLock('BES|'+(MS.cur+1), false); blDelete('BES|'+(MS.cur+1)); 'ok'`);
  // delete, once unlocked, and the reference clears
  ev(`blDelete('${key}'); 'ok'`);
  chk(name, 'delete', 'an unlocked cycle can be deleted', c(), null);
  chk(name, 'delete', 'and a reference to it is cleared, not left dangling', ev('MS.cycleRef'), '');
  // legacy: a one-year baseline becomes a partial cycle, once
  const lk = 'POM|' + cur;
  ev(`var L={}; L['${lk}']={fy:MS.cur, ap:mySlug(), ts:5, by:'legacy', locked:true, svc:SVC.slice(), disc:[1,2,3], mand:[0,0,0], bands:[],
        reqs:[{id:'A', title:'A', grp:'PSM', ccar:'', pid:'', band:'', mc:false, ask:[100,50,20], alloc:[100,50,20]}],
        pmo:{PSM:{ask:[100,50,20], alloc:[100,50,20], n:1}}};
      MS.baselines=L; cycMigrateLegacy(); 'ok'`);
  const M = JSON.parse(ev(`JSON.stringify(blGet('${lk}')||null)`));
  chk(name, 'legacy', 'a one-year baseline becomes a cycle', !!M, true);
  chk(name, 'legacy', 'marked partial, holding that one year’s projection and no state',
    M.partial + ':' + Object.keys(M.proj).join(',') + ':' + Object.keys(M.years).length, 'true:' + cur + ':0');
  chk(name, 'legacy', 'its lock, author and stamp carried', M.locked + ':' + M.by + ':' + M.ts, 'true:legacy:5');
  chk(name, 'legacy', 'the legacy container is gone once carried', ev('MS.baselines===undefined'), true);
  chk(name, 'legacy', 'the Spruills can read it for the year it holds', ev(`JSON.stringify((blPmoAlloc('${lk}','PSM',MS.cur)||{}).alloc)`), JSON.stringify([100, 50, 20]));
  ev(`blLock('${lk}', false); blDelete('${lk}'); cycMigrateLegacy(); 'ok'`);
  chk(name, 'legacy', 'a migrated cycle deleted on purpose does not come back on the next load', ev(`blGet('${lk}')`), null);
  // the Spruills reads every year the cycle holds, and none it does not
  ev(`blCyc='PB'; blYr=MS.cur; cycLock(); spFund='bl|PB|'+MS.cur; 'ok'`);
  const D = JSON.parse(ev(`JSON.stringify(pmoDetail('PSM',[MS.cur, MS.cur+1, MS.cur+2, MS.cur+5]).filter(function(b){ return b.name===APPN; })[0].ctl)`));
  const P1 = JSON.parse(ev(`JSON.stringify(cycProj('PB|'+MS.cur, MS.cur+1).pmo.PSM.alloc)`));
  chk(name, 'spruills', 'a cycle gives the PMO its control for every year it holds', [D.USAF[cur + 1], D.ANG[cur + 1], D.STOVL[cur + 1]].join(','), P1.join(','));
  chk(name, 'spruills', 'and none for a year it never held', String(D.USAF[cur + 2]), 'undefined');
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH. On a mutated board a cycle can be
    // missing where the block expects one, and reading it threw; the sweep then saw a suite that
    // died, which proves nothing (CRASHED), where it should see a suite that noticed (a failure).
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}


// ═══ PPBE CYCLES — A LOCKED VIEW IS READ-ONLY AND LEAVES NO TRACE ═════════════════════════
// Viewing a cycle sets the whole working store aside and puts a throwaway copy on the page with
// the cycle's years in it, so every panel reads the lock through the ordinary path. Everything
// below is about the two things that must then be true: nothing changed on the copy can look
// kept or reach anything durable, and leaving returns the working plan byte for byte.
{
  const name = 'PPBE cycles — a locked view is read-only and leaves no trace';
  try {
  const sc = { services: ['USAF', 'ANG', 'STOVL'],
    items: [it('A', 'PSM', [100, 50, 20]), it('B', 'AV', [80, 40, 10]), it('C', 'PSM', [60, 30, 15]), it('D', 'MxS', [40, 20, 5])],
    disc: [150, 60, 30], mand: [40, 20, 10], order: ['A', 'B', 'C', 'D'] };
  const { ev, errors } = boot();
  seed(ev, sc);
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); 'ok'`);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));
  const cur = +ev('MS.cur');
  const key = 'PB|' + cur;
  // a second planned year, the lock, and then the working plan moves on
  ev(`MS.years[MS.cur]=S; MS.base=MS.cur;
      var y1=JSON.parse(JSON.stringify(S)); y1.asks={A:[200,100,40]}; delete y1.pmoOrder; MS.years[MS.cur+1]=y1;
      blCyc='PB'; blYr=MS.cur; cycLock();
      setAsk('B',0,'123'); S.mc['A']=true; save(); 'ok'`);
  const settled = () => ev(`(function(){ var m=JSON.parse(JSON.stringify(MS)); Object.keys(m.years).forEach(function(y){ delete m.years[y].pmoOrder; });
    m.ts=0; (m.log||[]).forEach(function(e){ e.ts=0; }); return JSON.stringify(m); })()`);
  const lm0 = ev(`flowCfg().rules.lm`);
  const before = settled(), ls0 = ev(`localStorage.getItem(_AP.key)`), lock0 = ev(`JSON.stringify(CYCDB)`);
  const title0 = ev('document.title'), dirty0 = ev('DIRTY'), shadow0 = ev('JSON.stringify(_jrnlShadow)');
  chk(name, 'fixture', 'the working plan has moved on since the lock', ev(`JSON.stringify(itemById('B').ask)`), JSON.stringify([123, 40, 10]));
  chk(name, 'fixture', 'and is dirty', dirty0, true);
  // THE JOURNAL AS IT STOOD, to compare byte for byte after the view. The check this replaces
  // searched the journal's JSON for '999' (the value typed on the view) -- and found it in every
  // entry's TIMESTAMP whenever the clock read 1789 99x xxx xxx, which it did from 11:26Z to 14:13Z
  // on 21 Sep 2026, when the v1.80 gate ran this suite. A check that greps the serialised world
  // for a number is a check that fails on the clock.
  const jrnl0 = ev('JSON.stringify(MS.jrnl||[])');
  ev(`cycView('${key}'); 'ok'`);
  chk(name, 'view', 'the view is on', ev('CYCVIEW'), key);
  chk(name, 'view', 'the board shows the locked plan: B as it was', ev(`JSON.stringify(itemById('B').ask)`), JSON.stringify([80, 40, 10]));
  chk(name, 'view', 'and A unstarred', ev(`!!S.mc.A`), false);
  chk(name, 'view', 'on the year the plan was on', +ev('MS.cur'), cur);
  chk(name, 'view', 'every year on the drill is the cycle’s, so every panel reads the lock', ev(`JSON.stringify(MS.years[MS.cur+1].asks.A)`), JSON.stringify([200, 100, 40]));
  chk(name, 'view', 'the chart of accounts prints the locked ask', ev(`coaRows().filter(function(r){ return r.id==='B'; })[0].ask`), 130);
  chk(name, 'view', 'the header says so', /VIEWING PB\d\d/.test(ev(`document.getElementById('cycTag').textContent`)), true);
  chk(name, 'view', 'the board carries the banner', /VIEWING PB\d\d \(LOCKED\)/.test(ev(`document.getElementById('list').textContent`)), true);
  chk(name, 'view', 'the title says so, for every export that prints it', /LOCKED VIEW/.test(ev('document.title')), true);
  chk(name, 'view', 'and every file name says so', /\[PB\d\d LOCKED\]\.xlsx$/.test(ev(`expName('ORBIT Breakouts.xlsx')`)), true);
  // writes are refused, and revert
  ev(`setAsk('B',0,'999'); 'ok'`);
  chk(name, 'writes', 'an edit is refused and reverts on screen', ev(`JSON.stringify(itemById('B').ask)`), JSON.stringify([80, 40, 10]));
  chk(name, 'writes', 'and the status says it was not kept', /not kept/i.test(ev(`document.getElementById('shareStat').innerHTML`)), true);
  chk(name, 'writes', 'save() returns false', ev('save()'), false);
  chk(name, 'writes', 'persist() returns false', ev('persist()'), false);
  chk(name, 'writes', 'browser storage is untouched', ev(`localStorage.getItem(_AP.key)`) === ls0, true);
  chk(name, 'writes', 'the lock itself is untouched', ev(`JSON.stringify(CYCDB)`) === lock0, true);
  chk(name, 'writes', 'a board file cannot be built from a view', ev(`(function(){ try{ buildSavedHtml(); return 'built'; }catch(e){ return 'refused'; } })()`), 'refused');
  chk(name, 'writes', 'a board cannot be loaded over a view', ev(`applyStore({base:MS.base, cur:MS.cur, years:{}})`), false);
  chk(name, 'writes', 'a lock cannot be taken from a view', ev(`blCyc='BES'; blYr=MS.cur; cycLock(); blGet('BES|'+MS.cur)`), null);
  chk(name, 'writes', 'the cycle on screen cannot be deleted', ev(`blLock('${key}',false); blDelete('${key}'); !!blGet('${key}')`), true);
  ev(`blLock('${key}',true); flowCfg().rules.lm='VIEWEDIT'; 'ok'`);   // an MS-level edit, to be lost with the view
  // years stay inside the cycle
  ev(`switchYear(MS.cur+1); 'ok'`);
  chk(name, 'years', 'a year the cycle holds opens, as the cycle held it', +ev('MS.cur') + ':' + ev(`JSON.stringify(itemById('A').ask)`), (cur + 1) + ':' + JSON.stringify([200, 100, 40]));
  chk(name, 'years', 'still on view', ev('CYCVIEW'), key);
  ev(`switchYear(MS.cur+3); 'ok'`);
  chk(name, 'years', 'a year the cycle never held is refused, not created', +ev('MS.cur') + ':' + ev(`MS.years[MS.cur+3]===undefined`), (cur + 1) + ':true');
  chk(name, 'years', 'and the status says which years it holds', /holds no FY/.test(ev(`document.getElementById('shareStat').innerHTML`)), true);
  // leave
  ev(`cycLeave(); 'ok'`);
  chk(name, 'leave', 'the view is off', ev('CYCVIEW'), '');
  chk(name, 'leave', 'the working plan is back, byte for byte', settled() === before, true);
  chk(name, 'leave', 'on the year it was on', +ev('MS.cur'), cur);
  chk(name, 'leave', 'with the board wired to it', ev('MS.years[MS.cur]===S'), true);
  chk(name, 'leave', 'B as the working plan has it', ev(`JSON.stringify(itemById('B').ask)`), JSON.stringify([123, 40, 10]));
  chk(name, 'leave', 'an edit to the board’s own settings made while viewing did not survive', ev(`flowCfg().rules.lm`), lm0);
  chk(name, 'leave', 'the title and the file names are back', ev('document.title') === title0 && !/LOCKED/.test(ev(`expName('x.xlsx')`)), true);
  chk(name, 'leave', 'the header is back to the working tag', ev(`document.getElementById('cycTag').textContent`), 'PB' + String(cur).slice(-2));
  chk(name, 'leave', 'the dirty flag is what it was', ev('DIRTY'), dirty0);
  chk(name, 'leave', 'and the journal is byte for byte what it was before the view', ev('JSON.stringify(MS.jrnl||[])') === jrnl0, true);
  chk(name, 'leave', 'so it carries nothing typed on the view', ev(`JSON.stringify(MS.jrnl||[]).indexOf('VIEWEDIT')<0 && !(MS.jrnl||[]).some(function(e){ return JSON.stringify([e.before,e.after,e.b,e.a,e.v]).indexOf('999')>=0; })`), true);
  // THE JOURNAL'S SHADOW is the one thing save() touches that persist() does not guard: a save
  // that ran on the view would take its shadow from the lock, and the first real save afterwards
  // would journal the difference as edits nobody made, in the current user's name.
  chk(name, 'leave', 'the journal’s shadow was never taken from the view', ev('JSON.stringify(_jrnlShadow)') === shadow0, true);
  const j0 = +ev('(MS.jrnl||[]).length');
  chk(name, 'leave', 'a later save still works', ev(`setAsk('C',0,'61'); save()`), true);
  chk(name, 'leave', 'and journals that edit alone — no phantom entries carrying the lock’s values',
    ev(`(MS.jrnl||[]).length>${j0} && (MS.jrnl||[]).slice(${j0}).every(function(e){ return JSON.stringify(e.p).indexOf('C')>=0; })`), true);
  // a migrated one-year cycle holds no plan to show
  ev(`var L={}; L['POM|'+MS.cur]={fy:MS.cur, ap:mySlug(), ts:5, by:'legacy', locked:true, svc:SVC.slice(), disc:[1,2,3], mand:[0,0,0], bands:[], reqs:[], pmo:{}};
      MS.baselines=L; cycMigrateLegacy(); cycView('POM|'+MS.cur); 'ok'`);
  chk(name, 'partial', 'a migrated one-year cycle cannot be viewed, and says why', ev('CYCVIEW') + ':' + /holds no plan to show/.test(ev(`document.getElementById('shareStat').innerHTML`)), ':true');
  // a cycle that never held the year on screen opens on the first year it holds
  ev(`switchYear(MS.cur+3); cycView('${key}'); 'ok'`);
  chk(name, 'open', 'a cycle that never held the year on screen opens on the first year it holds', +ev('MS.cur'), cur);
  ev(`cycLeave(); 'ok'`);
  chk(name, 'open', 'and leaving returns to the year that was on screen', +ev('MS.cur'), cur + 3);
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH. On a mutated board a cycle can be
    // missing where the block expects one, and reading it threw; the sweep then saw a suite that
    // died, which proves nothing (CRASHED), where it should see a suite that noticed (a failure).
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}


// ═══ PPBE CYCLES — THE DELTAS AGAINST THE REFERENCE ═══════════════════════════════════════
// After a lock the working plan moves on. Every change is read against the lock's projection of
// the same year: value, allocation, funded (the lane draw), rank, band, PMO, the star, a
// requirement added, one removed. The totals must be accounted for by the rows -- changed rows
// plus new ones, less the removed -- and every figure must be the board's own authorities
// (tiers() and svcAlloc()) less the projection's. The lock is taken with TWO years held, and the
// base sits on the second, so a delta read against the wrong year cannot pass by coincidence.
{
  const name = 'PPBE cycles — the deltas against the reference';
  try {
  const sc = { services: ['USAF', 'ANG', 'STOVL'],
    items: [it('A', 'PSM', [100, 50, 20]), it('B', 'AV', [80, 40, 10]), it('C', 'PSM', [60, 30, 15]), it('D', 'MxS', [40, 20, 0]),
            it('E', 'PSM', [30, 10, 5]), it('F', 'AV', [20, 10, 5]), it('G', 'MxS', [12, 6, 3])],
    // USAF and ANG are deep, so a requirement nobody touched keeps its draw whatever the others do;
    // STOVL is nearly dry, so at least one requirement is funded below its allocation and a delta
    // that reads the allocation as the draw cannot pass by coincidence.
    disc: [1000, 500, 10], mand: [80, 40, 0], order: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] };
  const { ev, errors } = boot();
  seed(ev, sc);
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); 'ok'`);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));
  const cur = +ev('MS.cur'), key = 'PB|' + cur;
  ev(`MS.years[MS.cur]=S; MS.base=MS.cur+1;
      var y1=JSON.parse(JSON.stringify(S)); y1.asks={A:[200,100,40]}; delete y1.pmoOrder; MS.years[MS.cur+1]=y1;
      blCyc='PB'; blYr=MS.cur; cycLock(); 'ok'`);
  chk(name, 'lock', 'the lock became the reference and the working tag', ev('MS.cycleRef') + ':' + ev('MS.cycle'), key + ':' + key);
  chk(name, 'lock', 'and the status offers the retag to the next cycle', /Retag it as BES/.test(ev(`document.getElementById('shareStat').innerHTML`)), true);
  chk(name, 'before', 'nothing has changed yet', ev(`(function(){ var D=cycDelta(MS.cur); return D.nChanged+':'+D.nNew+':'+D.nRemoved; })()`), '0:0:0');
  const fundWasA = +ev(`cycProj('${key}', MS.cur).reqs.filter(function(r){ return r.id==='A'; })[0].fund.reduce(function(a,b){ return a+b; },0)`);
  // the working plan moves on: a value, a trim, a star, a rank, a band, a PMO, one added, one removed
  ev(`setAsk('B',0,'123');
      S.alloc['A']={m:'t', v:100};
      S.mc['C']=true; S.grp['C']='AV';
      S.order.splice(S.order.indexOf('D'),1); S.order.unshift('D');
      S.band['B']='pdm'; S.mc['F']=true;         // F's ONLY change is the star, so the star alone must count
      S.custom.push({id:'NEW-1', grp:'PSM', sect:'new', custom:true, title:'Added here', event:'Added here', ccar:'', fy26:[0,0,0], ask:[10,5,2], alloc:null});
      S.order.push('NEW-1');
      S.removed.push('G'); S.order=S.order.filter(function(id){ return id!=='G'; });
      applyState(S); save(); render(); 'ok'`);
  const D = JSON.parse(ev(`JSON.stringify(cycDelta(MS.cur))`));
  chk(name, 'read', 'the deltas read against the reference, for the year on screen', D && D.ref + ':' + D.fy, key + ':' + cur);
  chk(name, 'value', 'B’s requirement moved by what was typed', D.rows.B.ask + ':' + D.rows.B.askWas + ':' + D.rows.B.askNow, '43:130:173');
  chk(name, 'value', 'A’s value did not move, and the delta is read against THIS year, not the base year', D.rows.A.ask, 0);
  chk(name, 'alloc', 'A’s allocation moved by the trim', D.rows.A.alloc, 100 - 170);
  const fundNowA = +ev(`(function(){ var p=tiers()['A']; return p.d.reduce(function(a,b){ return a+b; },0)+p.m.reduce(function(a,b){ return a+b; },0); })()`);
  chk(name, 'funded', 'A’s funded delta is the lane draw now less the lane draw locked', D.rows.A.fund, fundNowA - fundWasA);
  chk(name, 'funded', 'and A is funded below its allocation on the dry lane, so funded and allocated are told apart', D.rows.A.fundNow < D.rows.A.allocNow, true);
  chk(name, 'rank', 'D moved up three places', D.rows.D.rank + ':' + D.rows.D.rankWas + ':' + D.rows.D.rankNow, '3:4:1');
  chk(name, 'rank', 'and A down one', D.rows.A.rank, -1);
  chk(name, 'rank', 'E and F kept their places', D.rows.E.rank + ':' + D.rows.F.rank, '0:0');
  chk(name, 'flags', 'C was starred and moved office', D.rows.C.mcWas + '>' + D.rows.C.mcNow + ' ' + D.rows.C.grpWas + '>' + D.rows.C.grp, 'false>true PSM>AV');
  chk(name, 'flags', 'B changed band', D.rows.B.bandWas + '>' + D.rows.B.bandNow, 'null>pdm');
  chk(name, 'flags', 'F, starred and nothing else, counts as changed', D.rows.F.changed + ':' + D.rows.F.mcWas + '>' + D.rows.F.mcNow + ':' + D.rows.F.rank + ':' + D.rows.F.fund, 'true:false>true:0:0');
  chk(name, 'new', 'the added requirement is NEW, with no locked figure', D.rows['NEW-1'].isNew + ':' + D.rows['NEW-1'].askWas + ':' + D.rows['NEW-1'].ask, 'true:0:17');
  chk(name, 'removed', 'the removed requirement is listed with its locked figures', D.removed.map(r => r.id + ':' + r.askWas).join(','), 'G:21');
  chk(name, 'unchanged', 'E is unchanged', D.rows.E.changed, false);
  chk(name, 'counts', 'changed, new and removed are counted', D.nChanged + ':' + D.nNew + ':' + D.nRemoved, '6:1:1');
  // conservation: the rows account for the totals
  const rows = Object.values(D.rows), S_ = a => a.reduce((x, y) => x + y, 0);
  chk(name, 'totals', 'the requirement total moved by the rows, less the removed', Math.round((S_(rows.map(r => r.ask)) - S_(D.removed.map(r => r.askWas))) * 100) / 100, Math.round(D.tot.ask * 100) / 100);
  chk(name, 'totals', 'so did the allocation', Math.round((S_(rows.map(r => r.alloc)) - S_(D.removed.map(r => r.allocWas))) * 100) / 100, Math.round(D.tot.alloc * 100) / 100);
  chk(name, 'totals', 'and the funded', Math.round((S_(rows.map(r => r.fund)) - S_(D.removed.map(r => r.fundWas))) * 100) / 100, Math.round(D.tot.fund * 100) / 100);
  chk(name, 'totals', 'now is the board: the requirement total', D.tot.askNow, +ev(`S.order.reduce(function(a,id){ return a+askTot(itemById(id)); },0)`));
  chk(name, 'totals', 'and the funded total is the lane draw', D.tot.fundNow, +ev(`(function(){ var T=tiers(), s=0; S.order.forEach(function(id){ var p=T[id]; s+=p.d.reduce(function(a,b){return a+b;},0)+p.m.reduce(function(a,b){return a+b;},0); }); return s; })()`));
  chk(name, 'totals', 'the pots are read live', D.pots.discNow + ':' + D.pots.mandNow, '1510:120');
  // the row chip
  const rowHtml = id => ev(`(document.getElementById('row-${id}')||{}).innerHTML||''`);
  chk(name, 'chip', 'B carries the chip with its delta', /Δ PB\d\d/.test(rowHtml('B')) && /\+\$43/.test(rowHtml('B')), true);
  chk(name, 'chip', 'D’s chip says it moved up three', /▲3/.test(rowHtml('D')), true);
  chk(name, 'chip', 'the added requirement’s chip says NEW', /NEW/.test(rowHtml('NEW-1')), true);
  chk(name, 'chip', 'C’s chip names the star and the office move', /starred/.test(rowHtml('C')) && /PSM→AV/.test(rowHtml('C')), true);
  chk(name, 'chip', 'E, unchanged, carries no chip', /Δ PB/.test(rowHtml('E')), false);
  const chipF = (/<div class="dchip"[^>]*>([\s\S]*?)<\/div>/.exec(rowHtml('F')) || [])[1] || '';
  chk(name, 'chip', 'F’s chip names the star, and nothing else', /★ starred/.test(chipF) && !/req |alloc |funded |rank /.test(chipF), true);
  // the panel
  ev(`cycChgOpen=true; render(); 'ok'`);
  const panel = ev(`document.getElementById('cycChgBody').innerHTML`);
  chk(name, 'panel', 'the panel lists the added and the removed', /Added here/.test(panel) && /REMOVED/.test(panel) && /G event/.test(panel), true);
  chk(name, 'panel', 'and closes: the rows account for the totals', /✓ the rows account for the totals/.test(panel), true);
  chk(name, 'panel', 'B’s change is attributed from the journal', /unknown/.test(ev(`cycWho('B', cycDelta(MS.cur).ts, MS.cur)`)), true);
  chk(name, 'panel', 'a pure rank change says the order is not journaled', /order edits are not journaled/.test(panel), true);
  ev(`cycChgOpen=false; 'ok'`);
  // the inspector, on the build that has one
  if (ev(`typeof inspectorBody==='function' && typeof setCur==='function'`)) {
    ev(`setCur('B'); inspectorBody(); 'ok'`);
    const insp = ev(`(document.getElementById('inspector')||{}).innerHTML||''`);
    chk(name, 'inspector', 'the record panel shows the change since the reference', /Since PB\d\d/.test(insp) && /\+\$43/.test(insp), true);
  }
  // the retag
  ev(`cycRetagNext(); 'ok'`);
  chk(name, 'retag', 'the working plan is tagged as the next cycle, BES of the following year', ev('MS.cycle'), 'BES|' + (cur + 1));
  chk(name, 'retag', 'and the reference is unchanged', ev('MS.cycleRef'), key);
  chk(name, 'retag', 'POM is followed by BES the same year, BES by PB', ev(`JSON.stringify([cycNextOf('POM|2027'), cycNextOf('BES|2027')])`), JSON.stringify([{ cyc: 'BES', yr: 2027 }, { cyc: 'PB', yr: 2027 }]));
  // no reference, and a reference that lacks the year
  ev(`MS.cycleRef=''; render(); 'ok'`);
  chk(name, 'none', 'without a reference there is no delta and no chip', ev('cycDelta(MS.cur)') === null && !/Δ PB/.test(rowHtml('B')), true);
  ev(`cycChgOpen=true; render(); 'ok'`);
  chk(name, 'none', 'and the panel says so', /No reference cycle/.test(ev(`document.getElementById('cycChgBody').innerHTML`)), true);
  ev(`cycChgOpen=false; MS.cycleRef='${key}'; switchYear(MS.cur+3); cycChgOpen=true; render(); 'ok'`);
  chk(name, 'year', 'on a year the reference never held there is no delta, and the panel says which years it holds', ev('cycDelta(MS.cur)') === null && /holds no FY/.test(ev(`document.getElementById('cycChgBody').innerHTML`)), true);
  ev(`cycChgOpen=false; switchYear(MS.cur-3); 'ok'`);
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH. On a mutated board a cycle can be
    // missing where the block expects one, and reading it threw; the sweep then saw a suite that
    // died, which proves nothing (CRASHED), where it should see a suite that noticed (a failure).
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}


// ═══ PPBE CYCLES — A PMO COPY CARRIES THE REFERENCE PROJECTION, AND NOTHING ELSE OF THE STORE ═══
// Two cycles are locked and the working plan moves on. The copy published for the offices must
// carry ONE cycle, the reference, as a projection only: no year states, no other lock, nothing that
// can be put on the drill -- and still read it: the rows' deltas, the compare and the five-year
// plan on the copy must say what the board says. And the copy must be smaller than a full save.
{
  const name = 'PPBE cycles — a PMO copy carries the reference projection only';
  try {
  const sc = { services: ['USAF', 'ANG', 'STOVL'],
    items: [it('A', 'PSM', [100, 50, 20]), it('B', 'AV', [80, 40, 10]), it('C', 'PSM', [60, 30, 15])],
    disc: [200, 100, 40], mand: [80, 40, 20], order: ['A', 'B', 'C'] };
  const { ev, errors } = boot();
  seed(ev, sc);
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); 'ok'`);
  if (errors.length) console.log(`  [${name}] jsdom errors:`, errors.slice(0, 2));
  const cur = +ev('MS.cur'), keyA = 'PB|' + cur, keyB = 'BES|' + (cur + 1);
  ev(`MS.years[MS.cur]=S; MS.base=MS.cur+1;
      var y1=JSON.parse(JSON.stringify(S)); delete y1.pmoOrder; MS.years[MS.cur+1]=y1;
      blCyc='PB'; blYr=MS.cur; cycLock(); blCyc='BES'; blYr=MS.cur+1; cycLock();
      MS.cycleRef='${keyA}'; save(); setAsk('B',0,'123'); 'ok'`);
  const dB = +ev(`(function(){ _cycDeltaCache=null; return cycDelta(MS.cur).rows.B.ask; })()`);
  chk(name, 'board', 'the board holds two locks and reads its deltas against PB', ev(`blList().join(',')`) + ' ' + dB, [keyA, keyB].sort().join(',') + ' 43');
  const full = +ev(`buildSavedHtml().length`);
  const html = ev(`pmoCopyHtml({sandbox:true, by:'BLL', ts:Date.now(), fy:MS.cur, ap:APPN, base:pmoBaseline()})`);
  chk(name, 'size', 'the copy is smaller than a full save: no year states, one cycle', html.length < full, true);
  const pub = JSON.parse((/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/.exec(html) || [])[1] || '{}');
  const slug = ev('_AP.slug');
  chk(name, 'store', 'the copy packs one appropriation’s cycle store', Object.keys((pub.cycDb || {}).byAp || {}).join(','), slug);
  const st = ((pub.cycDb || {}).byAp || {})[slug] || { cycles: {} };
  chk(name, 'store', 'holding the reference cycle only', Object.keys(st.cycles || {}).join(','), keyA);
  const c = (st.cycles || {})[keyA] || {};
  chk(name, 'store', 'as a projection: no year states, marked partial and reference-only', JSON.stringify(Object.keys(c.years || { missing: 1 })) + ' ' + c.partial + ' ' + c.refOnly, '[] true true');
  chk(name, 'store', 'with the projection of both years it held', Object.keys(c.proj || {}).sort().join(','), cur + ',' + (cur + 1));
  const C = boot({ html });
  chk(name, 'copy', 'the copy knows it is one', String(C.ev('SANDBOX')), 'true');
  chk(name, 'copy', 'and holds the reference only', C.ev(`blList().join(',')`), keyA);
  chk(name, 'copy', 'the rows read their deltas against it, as the board does', C.ev(`(function(){ var d=cycDelta(MS.cur); return d? String(d.rows.B.ask) : 'none'; })()`), String(dB));
  chk(name, 'copy', 'the five-year plan reads it for both years', C.ev(`(function(){ var d=fydpData('${keyA}'); return d? d.held.join(',') : 'none'; })()`), cur + ',' + (cur + 1));
  chk(name, 'copy', 'and offers it as a source', new RegExp('<option value="' + keyA.replace('|', '\\|') + '"').test(C.ev(`fydpOpen=true; render(); fydpOpen=false; document.getElementById('fydpBody').innerHTML`)), true);
  chk(name, 'copy', 'the compare reads it', C.ev(`(function(){ var d=cycCmpData('${keyA}','working'); return d&&d.fy[MS.cur]&&d.fy[MS.cur].rows.B? String(d.fy[MS.cur].rows.B.d.ask) : 'none'; })()`), String(dB));
  chk(name, 'copy', 'but it cannot be put on the drill: there is no state to show', C.ev(`(function(){ var s=''; try{ cycView('${keyA}'); }catch(e){ s='threw '+e.message; } return (CYCVIEW||'')+'|'+s; })()`), '|');
  chk(name, 'copy', 'and the copy says why', /holds no plan to show/.test(C.ev(`document.getElementById('shareStat').innerHTML`)), true);
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH. On a mutated board a cycle can be
    // missing where the block expects one, and reading it threw; the sweep then saw a suite that
    // died, which proves nothing (CRASHED), where it should see a suite that noticed (a failure).
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
}

{
  const src = _selfRead(_selfPath(import.meta.url), 'utf8');
  const named = [...src.matchAll(/^  const name = '([^']+)'/gm)].map(m => m[1]);   // a scenario's own line, never this one
  // A name built by concatenation ('convert to split — ' + label) is heard only in its finished
  // forms, so a literal that any heard scenario STARTS WITH has run. A dead block's literal has none.
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
