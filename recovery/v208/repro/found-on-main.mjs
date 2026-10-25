// node recovery/v208/repro/found-on-main.mjs   (from the repository root; BOARD=<file> to aim it at another build)
// Four defects found while writing the v2.08 handoff (25 Oct 2026), each reproduced here in jsdom on main f508fdb (v2.07).
// All four are older than v2.07. This prints PRESENT or GONE for each and always exits 0: it is evidence, not a check. When one
// is fixed, its own check goes in a suite with a mutation, as every fix does; this file only says what was found.
import { boot, seed } from '../../../tools/export-audit/boot.mjs';
const it = (id, grp, ask) => ({ id, title: 'Req ' + id, event: 'EV-' + id, grp, ask });
const say = (k, present, what) => console.log((present ? 'PRESENT ' : 'GONE    ') + k + ' -- ' + what);
const board = sc => { const b = boot(); seed(b.ev, sc); b.ev('render(); "ok"'); return b; };

// 1. Clearing a requirement's decision band deletes its impact statement (setBand('') also deletes S.cons[id]). A statement
//    over 300 characters is journalled as its size, so the journal cannot put it back.
{
  const { ev } = board({ services: ['USAF'], items: [it('A', 'PSM', [100])], disc: [100], mand: [0], order: ['A'] });
  ev(`S.cons=S.cons||{}; S.cons.A='Depot line stops in March. '+'x'.repeat(400); S.band=S.band||{}; S.band.A='b1'; save(); "ok"`);
  ev(`setBand('A',''); "ok"`);
  say('band-clears-impact', !ev(`(S.cons||{}).A`), 'clearing the band in the RECORD panel deletes the impact statement');
}
// 2. A redraw while the Impact or Description & note pop-up is open replaces what was typed with what is stored. render()
//    redraws the pop-up (fldBody), and with Live view on in shared-folder mode every tick calls render() (livePoll), at least
//    every 10 s and by default every 30 s -- so typing that takes longer than a tick is lost. The redraw is measured here;
//    the Live tick is read from the code (liveStart -> liveTick -> livePoll -> render), not run against a real folder.
{
  const { ev } = board({ services: ['USAF'], items: [it('A', 'PSM', [100])], disc: [100], mand: [0], order: ['A'] });
  ev(`openFld('A','cons'); document.getElementById('fld-cons').value='typed, not yet saved'; render(); "ok"`);
  const a = ev(`(document.getElementById('fld-cons')||{}).value`);
  ev(`fldClose(); openFld('A','dn'); document.getElementById('fld-desc').value='typed, not yet saved'; render(); "ok"`);
  const b = ev(`(document.getElementById('fld-desc')||{}).value`);
  say('popup-redraw-loses-typing', a !== 'typed, not yet saved' || b !== 'typed, not yet saved',
      'a render() while a written-field pop-up is open replaces the typing (impact: ' + JSON.stringify(a) + ', description: ' + JSON.stringify(b) + ')');
}
// 3. Setting a requirement's office to the office it is already in moves it to the bottom of that office's ranking, and the
//    move is not journalled (pmoOrder is in JRNL_SKIP). Classify's bulk PMO setter calls setGrp on every row, so a bulk set
//    of an office reorders every row already in it.
{
  const { ev } = board({ services: ['USAF'], items: [it('A', 'PSM', [100]), it('B', 'PSM', [100]), it('C', 'PSM', [100])], disc: [300], mand: [0], order: ['A', 'B', 'C'] });
  ev(`S.pmoOrder=S.pmoOrder||{}; S.pmoOrder.PSM=['A','B','C']; save(); setGrp('A','PSM'); "ok"`);
  const o = ev(`JSON.stringify(S.pmoOrder.PSM)`);
  say('same-office-reranks', o !== '["A","B","C"]', 'setGrp(A, its own office) leaves the PSM ranking ' + o);
}
// 4. Changing Goes to from a government activity to a prime keeps the old "Which awards to" and the MIPR type, which the
//    RECORD panel then hides. destEndOf() still answers the old second hop, and the funds flow read by final destination
//    (flowDestResolve, axis 'end') files the prime's money there.
{
  const { ev } = board({ services: ['USAF'], items: [it('A', 'PSM', [100])], disc: [100], mand: [0], order: ['A'] });
  ev(`setDest('A','to','pax'); setDest('A','end','lm'); setMipr('A','direct'); setDest('A','to','pw'); "ok"`);
  const end = ev(`destEndOf(itemById('A'))`), mipr = ev(`(S.mipr||{}).A||''`);
  say('prime-keeps-ogc-fields', end !== 'pw' || mipr !== '', 'after Goes to = Pratt & Whitney: final destination ' + JSON.stringify(end) + ', MIPR type ' + JSON.stringify(mipr));
}
