// FOCUSED harness (reuse review): VERBATIM from the suite given -- imports, failure list, keepBoards, SEEN/chk, the
// v2.00 (U2) block(s) '// ══ the change journal is the safety net, and nothing tested it ════════════════════════════════' .. '})();', the top-level helpers they reference (closure: MINE, asBooted, base, it), the guard. Not the full suite.
import { boot, seed, BOARD, capture, cv, bootMark, bootRelease, settleBoards, stopAtFirstFailure } from './boot.mjs';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { JSDOM, VirtualConsole } from 'jsdom';
let failures = [];
stopAtFirstFailure(failures);   // in the mutation sweep only: see boot.mjs
// The boards a later block reuses: V185W, V186L and V14 are built once and read by the blocks after.
// Each is read through a guard -- a block above its `let` line runs while it is still uninitialised.
const keepBoards = () => [() => V185W, () => V186L, () => V14]
  .map(f => { try { return f(); } catch { return null; } })
  .flatMap(v => (!v || typeof v !== 'object') ? [] : [v, ...Object.values(v)])   // never a string: V186L is a whole board file, and spreading one made 3.2 million entries a block
  .filter(x => x && typeof x === 'object' && x.w).map(x => x.w);
// EVERY NAMED SCENARIO MUST RUN. A block appended after process.exit() never executes and reads as
// a pass -- the proposal scenario in audit-import.mjs sat there for a whole verification round and
// five mutations aimed at it survived. chk() records every scenario it hears from; at the summary,
// any `const name = '...'` in this file it never heard from is a failure, not a pass.
import { readFileSync as _selfRead } from 'node:fs';
import { fileURLToPath as _selfPath } from 'node:url';
const SEEN = new Set();
// SUITE_CHECKS=<file> records EVERY check -- name, place, claim, verdict, and what was read -- so a
// change to the suite itself can be proved to have kept every check and its verdict (v1.87).
import { appendFileSync as _ckAppend } from 'node:fs';
const CHECKS = process.env.SUITE_CHECKS || '';
const chk = (scenario, where, what, got, want) => {
  SEEN.add(scenario);
  const ok = (typeof got === 'number' && typeof want === 'number')
    ? Math.abs(got - want) <= 0.005 : String(got) === String(want);
  if (CHECKS) _ckAppend(CHECKS, JSON.stringify([scenario, where, what, ok, String(got).slice(0, 400)]) + '\n');
  if (!ok) failures.push({ scenario, where, what, got, want });
};
const it = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: id,
  event: id, ccar: '', fy26: ask.map(() => 0), ask, alloc: null });

const MINE = ['USAF', 'ANG', 'AFRC'];
const base = () => ({ services: MINE,
  items: [it('A', 'PSM', [9000000, 2000000, 1000000])],
  disc: [9000000, 2000000, 1000000], mand: [0, 0, 0], order: ['A'] });

const asBooted = (ev, sc) => ev(`(function(){
  BASE_ITEMS.length=0;
  ${JSON.stringify(sc.items)}.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
  return 'ok'; })()`);

// ══ the change journal is the safety net, and nothing tested it ════════════════════════════════
// pmoApply()'s confirmation says, in as many words: "Each one is recorded in the change journal, so
// it can be found and undone later." That sentence is the recourse when a programme office's
// proposal is accepted in error, and it was covered by nothing at all.
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'the change journal';
  try {
  const sc = base();
  sc.items.push(it('B', 'ATL', [3000000, 500000, 250000]));
  sc.order.push('B');

  // ── A HAND EDIT IS RECORDED, AND PUTTING IT BACK RESTORES EXACTLY WHAT WAS THERE ─────────────
  {
    const { ev } = boot(); seed(ev, sc); asBooted(ev, sc);
    ev(`try{ localStorage.setItem('prio27who','BLL'); }catch(e){}
        S.desc['A']='What the board said first.'; save(); 'ok'`);
    const before = ev(`JSON.stringify({desc:S.desc, ccar:S.ccar, asks:S.asks})`);
    const n0 = +ev('(MS.jrnl||[]).length');
    // jrnlSync() re-takes the shadow WITHOUT writing entries; jrnlCapture() is what diffs the
    // shadow against now and records. Calling sync twice records nothing at all -- which the first
    // version of this check did, and then read somebody else's entry as its own.
    ev(`jrnlSync(); S.desc['A']='Rewritten.'; jrnlCapture(); save(); 'ok'`);
    chk(name, 'record', 'the change is journalled', +ev('(MS.jrnl||[]).length') > n0 ? 'recorded' : 'silent', 'recorded');
    const e = JSON.parse(ev(`JSON.stringify((MS.jrnl||[])[(MS.jrnl||[]).length-1])`));
    chk(name, 'record', 'with the path it changed', JSON.stringify(e.p), JSON.stringify(['desc', 'A']));
    chk(name, 'record', 'the value before', e.a, 'What the board said first.');
    chk(name, 'record', 'and the value after', e.b, 'Rewritten.');
    chk(name, 'record', 'and it is marked as something that can be put back',
      ev(`jrnlUndoable((MS.jrnl||[])[(MS.jrnl||[]).length-1])`), true);

    const idx = +ev('(MS.jrnl||[]).length') - 1;
    ev(`window.confirm=function(){return true;}; jrnlUndo(${idx}); 'ok'`);
    chk(name, 'undo', 'undoing restores exactly what was there',
      ev(`JSON.stringify({desc:S.desc, ccar:S.ccar, asks:S.asks})`), before);
    // BOTH ENTRIES MUST STAND. Capturing the revert as an ordinary diff folded it into the original
    // entry and then dropped that entry as a no-op, which erased the very change being reverted.
    chk(name, 'undo', 'and the reversal is itself journalled',
      +ev('(MS.jrnl||[]).length') > idx + 1 ? 'recorded' : 'lost', 'recorded');
    chk(name, 'undo', 'the change it reversed still stands',
      ev(`JSON.stringify(((MS.jrnl||[])[${idx}]||{}).p)`), JSON.stringify(['desc', 'A']));
    chk(name, 'undo', 'and the reversal is marked as one',
      ev(`!!((MS.jrnl||[])[${idx + 1}]||{}).f`), true);
  }

  // ── A VALUE TOO LARGE TO RECORD IS NOT UNDOABLE, AND SAYS SO ─────────────────────────────────
  // JRNL_BIG caps a journalled value at 300 characters and stores a SIZE in its place. An impact
  // statement runs well past that. Restoring one from the journal would put back a placeholder --
  // silent data loss on the one field the whole PMO workflow exists to collect -- so the entry must
  // refuse to be undone rather than half-succeed.
  {
    const { ev } = boot(); seed(ev, sc); asBooted(ev, sc);
    const LONG = 'The depot line stops in March and forty aircraft go unsupported. '.repeat(9);
    chk(name, 'big values', 'the fixture is genuinely past the cap', LONG.length > 300, true);
    ev(`try{ localStorage.setItem('prio27who','BLL'); }catch(e){}
        jrnlSync(); S.cons['A']=${JSON.stringify(LONG)}; jrnlCapture(); save(); 'ok'`);
    const last = +ev('(MS.jrnl||[]).length') - 1;
    chk(name, 'big values', 'it is journalled as a size, not as the text',
      ev(`typeof ((MS.jrnl||[])[${last}]||{}).b === 'object'`), true);
    chk(name, 'big values', 'and the entry refuses to be undone',
      ev(`jrnlUndoable((MS.jrnl||[])[${last}])`), false);
    const held = ev(`S.cons['A']`);
    const said = ev(`(function(){ var m=''; setStat=function(x){ m+=x; };
      window.confirm=function(){ return true; }; jrnlUndo(${last}); return m; })()`);
    chk(name, 'big values', 'it says why rather than putting back a placeholder',
      /cannot be put back/.test(said) ? 'said' : 'silent: ' + said.slice(0, 60), 'said');
    chk(name, 'big values', 'and the statement is still there, whole',
      ev(`S.cons['A']`), held);
  }

  // ── THE PROMISE pmoApply MAKES: an accepted proposal can be found and undone ─────────────────
  {
    const { ev } = boot(); seed(ev, sc); asBooted(ev, sc);
    ev(`try{ localStorage.setItem('prio27who','BLL'); }catch(e){}
        S.ccar['B']='CC-ORIGINAL'; save(); 'ok'`);
    const before = ev(`JSON.stringify({ccar:S.ccar, asks:S.asks})`);
    ev(`window.alert=function(){}; window.confirm=function(){return true;};
        pmoTake({spmtPkg:1,dir:'submit',ap:'',fy:2027,ts:Date.now(),by:'PMO',fromTs:1,
          svc:SVC.slice(), items:{B:{ccar:'CC-FROM-PMO'}}, base:{B:{ccar:'CC-ORIGINAL'}}},'s.json');
        PMOPICK={}; pmoRows().forEach(function(r){ if(r.id==='B'&&r.key==='ccar') PMOPICK[pickKey(r)]=true; });
        pmoApply(); 'ok'`);
    chk(name, 'a PMO change', 'it applied', ev(`S.ccar['B']`), 'CC-FROM-PMO');
    const idx = +ev(`(function(){ const j=MS.jrnl||[];
      for(let i=j.length-1;i>=0;i--){ const e=j[i];
        if(e&&Array.isArray(e.p)&&e.p[0]==='ccar'&&e.p[1]==='B') return i; } return -1; })()`);
    chk(name, 'a PMO change', 'and it is in the journal, by path', idx >= 0 ? 'found' : 'NOT FOUND', 'found');
    if (idx >= 0) {
      chk(name, 'a PMO change', 'it can be put back', ev(`jrnlUndoable((MS.jrnl||[])[${idx}])`), true);
      ev(`window.confirm=function(){return true;}; jrnlUndo(${idx}); 'ok'`);
      chk(name, 'a PMO change', 'and undoing it leaves the board as it was',
        ev(`JSON.stringify({ccar:S.ccar, asks:S.asks})`), before);
    }
  }
  } catch (e) {
    // A THROW INSIDE THE BLOCK IS A FAILING CHECK, NOT A DEATH: on a mutated board a thing the block
    // expects can be missing, and reading it threw; the sweep must see a suite that noticed, not one
    // that died. Only a death outside any block — boot, a syntax error, the process killed — is a crash.
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const src = _selfRead(_selfPath(import.meta.url), 'utf8');
  const named = [...src.matchAll(/^  const name = '([^']+)'/gm)].map(m => m[1]);   // a scenario's own line, never this one
  // A name built by concatenation ('convert to split — ' + label) is heard only in its finished
  // forms, so a literal that any heard scenario STARTS WITH has run. A dead block's literal has none.
  named.forEach(n => { if (![...SEEN].some(s => s === n || s.startsWith(n))) failures.push({ scenario: n, where: 'harness',
    what: 'this scenario never ran — is its block after process.exit()?', got: 'never ran', want: 'ran' }); });
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();
console.log('\n' + '='.repeat(96));
if (!failures.length) { console.log('ALL CHECKS PASSED'); process.exit(0); }
const by = {};
failures.forEach(f => { const k = f.scenario + ' | ' + f.where; (by[k] ||= []).push(f); });
console.log(`${failures.length} FAILING CHECK(S)\n`);
for (const [k, fs] of Object.entries(by)) {
  console.log(`--- ${k}`);
  fs.forEach(f => {
    const g = String(f.got), w = String(f.want);
    if (g.length < 160 && w.length < 160) { console.log(`    ${f.what}\n        got ${g}   want ${w}`); return; }
    // Two multi-kilobyte stores tell you nothing side by side. Point at the first difference.
    let i = 0; while (i < g.length && i < w.length && g[i] === w[i]) i++;
    const cut = Math.max(0, i - 60);
    console.log(`    ${f.what}\n        first differs at char ${i} of ${g.length}/${w.length}`
      + `\n          got  \u2026${g.slice(cut, i + 90)}\u2026`
      + `\n          want \u2026${w.slice(cut, i + 90)}\u2026`);
  });
}
process.exit(1);
