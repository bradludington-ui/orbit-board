// check.mjs -- the EXPECTED values, written by hand, against the OBSERVED values in out/<scenario>.<pass>.json.
//   usage: node check.mjs <pass>          (e.g. r1; reads out/*.r1.json, writes out/checks.<pass>.json)
// Nothing here runs a board. Observed values come only from the probe's JSON. Expected values are literals.
// Kinds of check:
//   FIX  the fixture is what the scenario says (a precondition)
//   PRE  U20's premise at the moment of the action (B's save waiting on A's lock and not counted)
//   CTL  a healthy control behaves correctly
//   U20  the property under test on a trigger scenario (W): B never ends FALSELY CLEAN, never WRITES OVER A COPY WITHOUT
//        ASKING (a copy whose work is not in what replaces it, by the fixture's lineage), and every leaf copy stays in a place
//        this board can reach (screen, browser storage, kept slot, the folder's copy or history, or the file)
//   OUT  a check of the same properties on a path that does not involve U20 (pre-existing, single tab), kept apart
//   LCK  the lock mock was never held twice (control 3), and was used
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const pass = process.argv[2];
const dir = new URL('./out/', import.meta.url).pathname;
const J = JSON.stringify;
const rows = [];
const chk = (sc, kind, what, got, want) => { const ok = J(got) === J(want); rows.push({ sc, kind, what, got, want, ok }); };
// THE FIXTURES' LINEAGE (hand-written): which copies each copy's work descends from. Writing Y over X needs no question when
// X is Y itself (a re-stamp) or one of Y's ancestors; otherwise it replaces work that Y does not have.
const LINEAGE = {
  PB: { 'F0-BASE': [], 'K-KEPTWORK': ['F0-BASE'], 'N-NEWER': ['F0-BASE'], 'S1-ONSCREEN': ['N-NEWER', 'F0-BASE'] },
  AD: { 'F0-BASE': [], 'WORKING': ['F0-BASE'], 'N2-NEWER': ['F0-BASE'] },
  BR: { 'F00-FIRST': [], 'F0-BASE': ['F00-FIRST'], 'B-EDIT': [] },
  PF: { 'K-KEPTWORK': [], 'N-NEWER': [], 'S1-ONSCREEN': ['N-NEWER'] },
};
const LEAVES = { PB: ['K-KEPTWORK', 'S1-ONSCREEN'], AD: ['WORKING', 'N2-NEWER'], BR: ['B-EDIT', 'F0-BASE'], PF: ['K-KEPTWORK', 'S1-ONSCREEN'] };
const LEAVES_H = ['B-EDIT', 'F0-BASE', 'F00-FIRST'].filter(x => x !== 'F00-FIRST');   // F00-FIRST is F0-BASE's ancestor
const unasked = (route, rec) => !!rec && rec.wrote > 0 && rec.before !== rec.after && rec.before !== '(no copy)'
  && !((LINEAGE[route][rec.after] || []).includes(rec.before)) && rec.asked.length === 0;
// AD-C2b: X's save of N2 is refused at X (its own clash: WORKING landed first), so N2 never reaches this folder and stays on
// X's screen -- not a copy of this board's (corrected at 10:48 AM ET after pass r1, which listed N2 as a leaf here).
const leavesOf = (sc, route) => sc === 'AD-C2b' ? ['WORKING'] : (route === 'BR' ? LEAVES_H : LEAVES[route]);
const reachable = (sc, route, step) => leavesOf(sc, route).map(m => ((step.reach || {})[m] || []).filter(p => !p.startsWith('outside')).length > 0);
const has = (s, re) => re.test(String(s || ''));

const SC = ['PB-W', 'PB-Wtick', 'PB-C1', 'PB-C2a', 'PB-C2b', 'PB-NL', 'AD-W', 'AD-Wtick', 'AD-C1', 'AD-C2a', 'AD-C2b',
  'BR-W', 'BR-Wtick', 'BR-C1', 'BR-C2a', 'BR-C2b', 'BR-Wperm', 'BR-C1perm', 'BR-Wh', 'BR-C1h', 'BR-Wpermh', 'BR-C2ah', 'BR-C2bh',
  'PF-W', 'PF-C1', 'PF-C2a'];
const TRIGGER = sc => /-W/.test(sc);
const OUTSIDE = sc => /^BR-C2a/.test(sc);       // refresh FIRST, then Save: no wait, no second tab involved -- not a control
for (const sc of SC) {
  const p = dir + sc + '.' + pass + '.json';
  if (!existsSync(p)) { chk(sc, 'RUN', 'output present', false, true); continue; }
  const O = JSON.parse(readFileSync(p, 'utf8')); const R = O.steps; const route = sc.split('-')[0]; const kind = sc.split('-')[1];
  chk(sc, 'RUN', 'finished, no error, board 98eed7e8', [O.errors.length, O.incomplete || null, O.IDS.board.slice(0, 8)], [0, null, '98eed7e8']);
  if (O.errors.length || O.incomplete) continue;
  // LCK: the mock (not used in PB-NL, by design)
  const st = O.lock.browser.stats;
  if (sc === 'PB-NL') chk(sc, 'LCK', 'no navigator.locks on A and B: no request reached the mock', [st.requests, O.tabA.lockInstall.none || false], [0, true]);
  else chk(sc, 'LCK', 'never two holders of orbit-save; most held at once; nothing unmodeled; every grant released', [st.violations.length, st.maxHeld['orbit-save'], st.unmodeled.length, st.grants === st.releases], [0, 1, 0, true]);
  chk(sc, 'FIX', 'tab A: FULL FUND (ff, prio27ff), one storage area with B both ways, jsdom had no navigator.locks', [O.tabA.slug, O.tabA.key, O.tabA.share, O.tabA.lockInstall.had], ['ff', 'prio27ff', ['from A', null], false]);
  // FIX: the scenario's starting state
  const S0 = R.setup;
  if (route === 'PB') chk(sc, 'FIX', 'start: S1 on screen and unsaved, K kept aside (folder), N the folder’s copy', [S0.screen, S0.DIRTY, S0.kept && S0.kept.note, S0.kept && S0.kept.why, S0.head.note], ['S1-ONSCREEN', true, 'K-KEPTWORK', 'folder', 'N-NEWER']);
  if (route === 'AD') chk(sc, 'FIX', 'start: reopened, WORKING on screen, DIRTY false, the record unsaved, nothing kept, F0 the folder’s copy', [S0.screen, S0.DIRTY, !!(S0.base && S0.base.dirty), S0.kept, S0.head.note], ['WORKING', false, true, null, 'F0-BASE']);
  if (route === 'BR') chk(sc, 'FIX', 'start: B-EDIT on screen, nothing recorded for the folder (0), F0 the folder’s copy, not newer than the screen', [S0.screen, S0.driveBase, S0.head.note, S0.theirsNotNewer], ['B-EDIT', 0, 'F0-BASE', true]);
  if (route === 'BR' && /perm/.test(kind)) chk(sc, 'FIX', 'the opening’s own connect stopped at one click, recording nothing', [S0.opening && S0.opening.need, S0.opening && S0.opening.driveBase], ['click', 0]);
  if (route === 'BR' && /h$/.test(kind)) chk(sc, 'FIX', 'the folder’s history holds F00-FIRST (spaced, newest)', S0.hist.map(h => h.note + (/-recent/.test(h.name) ? '(r)' : '')), ['F00-FIRST']);
  if (route === 'PF') chk(sc, 'FIX', 'start: S1 on screen, K kept aside (file), N in the file', [S0.screen, S0.kept && S0.kept.note, S0.kept && S0.kept.why, S0.file.note], ['S1-ONSCREEN', 'K-KEPTWORK', 'file', 'N-NEWER']);
  // PRE
  if (TRIGGER(sc)) {
    chk(sc, 'PRE', 'A’s save held, holding the lock', [R.Aheld.reached, R.Aheld.heldBy, R.Aheld.Abusy], [true, ['A'], 1]);
    const P = R.premise;
    chk(sc, 'PRE', 'at the action: [B _saveBusy, A _saveBusy, lock held by, pending, B’s folder/file operations since its save was asked]',
      [P.Bbusy, P.Abusy, P.heldBy, P.pendingOf, P.BfolderOpsSinceSave ? P.BfolderOpsSinceSave.length : P.BfileReadsSinceSave], [0, 1, ['A'], ['B'], 0]);
    chk(sc, 'PRE', 'grants: A first, then B (B’s save ran only after A released)', R.grantOrder.slice(0, 2), ['A', 'B']);
  }
  if (kind.startsWith('C1')) {
    const P = R.premise;
    chk(sc, 'PRE', 'counted control: [B _saveBusy, lock held by, pending, B’s save at its read]', [P.Bbusy, P.heldBy, P.pendingOf, route === 'PF' ? true : P.BfolderOpsSinceSave.slice(-1)[0]], [1, ['B'], [], route === 'PF' ? true : 'B:read:spmt-2027-om.json']);
  }
  if (sc === 'PB-NL') chk(sc, 'CTL', 'without Web Locks B’s save does not wait: it read and wrote the folder’s copy while A’s save was held', [R.premise.Bbusy + R.premise.Abusy >= 1, R.premise.BfolderOpsSinceSave.includes('B:read:spmt-2027-om.json'), R.premise.BfolderOpsSinceSave.includes('B:close:spmt-2027-om.json')], [true, true, true]);
  // CTL: the controls' own behaviour (literals)
  const D = R.during, V = R.save, N = R.next;
  if (sc === 'PB-C1' || sc === 'PF-C1') chk(sc, 'CTL', 'put back REFUSED while B’s save runs: [screen, kept, MS byte-identical, kept byte-identical, said so, asked]',
    [D.screen, D.kept.note, D.msUnchanged, D.keptUnchanged, has(D.status, /Not put back.*a save was under way/), D.prompts.length], ['S1-ONSCREEN', 'K-KEPTWORK', true, true, true, 0]);
  if (sc === 'PB-C1') chk(sc, 'CTL', 'then S1’s save lands: [folder, screen, saved, kept]', [V.head.note, V.screen, V.saved, V.kept.note], ['S1-ONSCREEN', 'S1-ONSCREEN', true, 'K-KEPTWORK']);
  if (sc === 'PF-C1') chk(sc, 'CTL', 'then S1’s save lands: [file, screen, saved, kept]', [V.file.note, V.screen, V.saved, V.kept.note], ['S1-ONSCREEN', 'S1-ONSCREEN', true, 'K-KEPTWORK']);
  if (sc === 'PB-C2a') chk(sc, 'CTL', 'put back, then Save: refused with the choice, nothing written: [screen, kept, folder, saved, said]',
    [V.screen, V.kept.note, V.head.note, V.saved, has(V.status, /Nothing was written/) && has(V.status, /Save yours over theirs/), V.rec.wrote], ['K-KEPTWORK', 'S1-ONSCREEN', 'N-NEWER', false, true, 0]);
  if (sc === 'PB-C2b') { chk(sc, 'CTL', 'Save lands S1; then put back: K on screen, nothing kept in its place (S1 saved)', [V.head.note, V.saved, D.screen, D.kept], ['S1-ONSCREEN', true, 'K-KEPTWORK', null]);
    chk(sc, 'CTL', 'the next Save is refused with the choice, nothing written', [N.head.note, has(N.status, /Nothing was written/), N.rec.wrote], ['S1-ONSCREEN', true, 0]); }
  if (sc === 'PF-C2a') chk(sc, 'CTL', 'put back, then Save: HOLD ON asked (answered Cancel), nothing written', [V.screen, V.kept.note, V.rec.asked.length, has(V.rec.asked[0], /HOLD ON/), V.file.note, V.rec.wrote], ['K-KEPTWORK', 'S1-ONSCREEN', 1, true, 'N-NEWER', 0]);
  if (sc === 'AD-C1') { chk(sc, 'CTL', 'refresh REFUSED while B’s save runs: [screen, nothing changed byte for byte, said "not loaded"]', [D.screen, D.unchanged, has(D.status, /was not loaded/)], ['WORKING', true, true]);
    chk(sc, 'CTL', 'then the save refuses with the choice: [folder, screen, saved, said, wrote]', [V.head.note, V.screen, V.saved, has(V.status, /Nothing was written/), V.rec.wrote], ['N2-NEWER', 'WORKING', false, true, 0]); }
  if (sc === 'AD-C2a') chk(sc, 'CTL', 'refresh adopts N2 (WORKING kept aside); then Save writes N2: [during screen, kept, after folder, screen, saved]', [D.screen, D.kept.note, V.head.note, V.screen, V.saved], ['N2-NEWER', 'WORKING', 'N2-NEWER', 'N2-NEWER', true]);
  if (sc === 'AD-C2b') chk(sc, 'CTL', 'Save lands WORKING; X’s save is then refused (its own clash, nothing written); refresh loads nothing', [V.head.note, V.saved, R.xSave.head.note, has(R.xSave.status, /Nothing was written/), D.screen], ['WORKING', true, 'WORKING', true, 'WORKING']);
  if (/^BR-C1/.test(sc)) { chk(sc, 'CTL', 'refresh records NOTHING while B’s save runs (driveBaseOf stays 0)', D.driveBase, 0);
    chk(sc, 'CTL', 'then the save refuses with the choice: [wrote, folder, said]', [V.rec.wrote, V.head.note, has(V.status, /Nothing was written/) && has(V.status, /Save yours over theirs/)], [0, 'F0-BASE', true]); }
  if (/^BR-C2b/.test(sc)) chk(sc, 'CTL', 'Save first (no wait): refused with the choice: [wrote, folder, said]', [V.rec.wrote, V.head.note, has(V.status, /Nothing was written/)], [0, 'F0-BASE', true]);
  // U20 / CTL / OUT: the properties, on every scenario, at each step after B's save
  for (const [label, step, recOf] of [['B’s save', V, V && V.rec], ['the next Save', N, N && N.rec], ['the reopen', R.reopen, null]]) {
    if (!step) continue;
    let kindP = TRIGGER(sc) ? 'U20' : 'CTL';
    if (OUTSIDE(sc)) kindP = 'OUT';
    if (/^BR-C2b/.test(sc) && label !== 'B’s save') kindP = 'OUT';     // after the refused Save, the refresh then records F0: the pre-existing path
    if (sc === 'PB-NL') kindP = 'INFO';
    chk(sc, kindP, label + ': not falsely clean', !!step.falselyClean, false);
    if (recOf) chk(sc, kindP, label + ': did not write over a copy without asking (by lineage)', unasked(route, recOf), false);
    chk(sc, kindP, label + ': every leaf copy in a place this board reaches [' + leavesOf(sc, route).join(', ') + ']', reachable(sc, route, step), leavesOf(sc, route).map(() => true));
  }
}
// control 3, part 1: the mock's own tests
{ const p = dir + 'locktest.' + pass + '.json';
  if (existsSync(p)) { const L = JSON.parse(readFileSync(p, 'utf8')); chk('locktest', 'LCK', 'the mock’s own tests T1-T10 (19 checks)', [L.pass, L.fail, L.incomplete || null], [19, 0, null]); }
  else chk('locktest', 'LCK', 'output present', false, true); }

const fails = rows.filter(r => !r.ok);
const byKind = {}; for (const r of rows) { byKind[r.kind] = byKind[r.kind] || { pass: 0, fail: 0 }; byKind[r.kind][r.ok ? 'pass' : 'fail']++; }
for (const r of rows) console.log((r.ok ? 'pass ' : 'FAIL ') + r.kind.padEnd(4) + ' ' + r.sc.padEnd(10) + ' ' + r.what + (r.ok ? '' : '  got=' + J(r.got) + ' want=' + J(r.want)));
console.log('\nBY KIND', J(byKind));
console.log('FAILING', fails.length, J(fails.map(f => f.kind + ' ' + f.sc + ': ' + f.what)));
writeFileSync(dir + 'checks.' + pass + '.json', JSON.stringify({ pass, byKind, rows }, null, 1));
