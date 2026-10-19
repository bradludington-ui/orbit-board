// xcheck.mjs -- THE CHECKER'S hand-written expected literals for the scenarios it ADDED (x/u20x.mjs). Reads only the
// probe's JSON (x/out/<sc>.<pass>.json); runs no board. Written 12 Oct, ~11:50 AM ET, BEFORE any added scenario was run.
//   usage: node xcheck.mjs <pass>
// Kinds: RUN, LCK, FIX, PRE (as the builder's), and
//   CNT  the *count control: the W scenario with the waiting save COUNTED by the harness. Healthy = behaves as the
//        builder's counted control C1 did (put back refused / adoption refused / nothing recorded, then the choice)
//   U20  the property under test on the added trigger scenarios (BR-Wreal*, no harness-connect shortcut)
//   CTL  BR-C1real, the counted control of the *real fixture
//   O4   the pre-existing path driven by the Live timer alone (one tab, no lock contention) -- NOT U20
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const pass = process.argv[2];
const dir = new URL('./out/', import.meta.url).pathname;
const J = JSON.stringify;
const rows = [];
const chk = (sc, kind, what, got, want) => { const ok = J(got) === J(want); rows.push({ sc, kind, what, got, want, ok }); };
const LINEAGE = {   // hand-written, as the builder's
  PB: { 'F0-BASE': [], 'K-KEPTWORK': ['F0-BASE'], 'N-NEWER': ['F0-BASE'], 'S1-ONSCREEN': ['N-NEWER', 'F0-BASE'] },
  AD: { 'F0-BASE': [], 'WORKING': ['F0-BASE'], 'N2-NEWER': ['F0-BASE'] },
  BR: { 'F00-FIRST': [], 'F0-BASE': ['F00-FIRST'], 'B-EDIT': [] },
};
LINEAGE.O4 = LINEAGE.BR;
const LEAVES = { PB: ['K-KEPTWORK', 'S1-ONSCREEN'], AD: ['WORKING', 'N2-NEWER'], BR: ['B-EDIT', 'F0-BASE'], O4: ['B-EDIT', 'F0-BASE'] };
const unasked = (route, rec) => !!rec && rec.wrote > 0 && rec.before !== rec.after && rec.before !== '(no copy)'
  && !((LINEAGE[route][rec.after] || []).includes(rec.before)) && rec.asked.length === 0;
const reachable = (route, step) => LEAVES[route].map(m => ((step.reach || {})[m] || []).filter(p => !p.startsWith('outside')).length > 0);
const has = (s, re) => re.test(String(s || ''));
const SC = ['PB-Wcount', 'AD-Wcount', 'BR-Wcount', 'BR-Wreal', 'BR-Wrealtick', 'BR-C1real', 'BR-Wrealcount', 'BR-Wrealh', 'O4-tick', 'O4-tickh',
  'BR-Wrealtickcount'];   // added ~11:51 AM ET, before any run of it
for (const sc of SC) {
  const p = dir + sc + '.' + pass + '.json';
  if (!existsSync(p)) { chk(sc, 'RUN', 'output present', false, true); continue; }
  const O = JSON.parse(readFileSync(p, 'utf8')); const R = O.steps; const route = sc.split('-')[0]; const kind = sc.split('-')[1];
  chk(sc, 'RUN', 'finished, no error, board 98eed7e8', [O.errors.length, O.incomplete || null, O.IDS.board.slice(0, 8)], [0, null, '98eed7e8']);
  if (O.errors.length || O.incomplete) continue;
  const st = O.lock.browser.stats;
  chk(sc, 'LCK', 'never two holders of orbit-save; most held at once; nothing unmodeled; every grant released',
    [st.violations.length, st.maxHeld['orbit-save'], st.unmodeled.length, st.grants === st.releases], [0, 1, 0, true]);
  const count = /count/.test(kind), real = /real/.test(kind) || route === 'O4', W = /^W/.test(kind);
  if (count) chk(sc, 'FIX', 'the harness counted B’s lock requests (wrapper installed)', O.counted, 'counted');
  if (route !== 'O4') chk(sc, 'FIX', 'tab A: FULL FUND, one storage area both ways, jsdom had no navigator.locks', [O.tabA.slug, O.tabA.key, O.tabA.share, O.tabA.lockInstall.had], ['ff', 'prio27ff', ['from A', null], false]);
  else chk(sc, 'FIX', 'one tab: no tab A', O.tabA, { none: true });
  const S0 = R.setup;
  if (route === 'PB') chk(sc, 'FIX', 'start (as PB): S1 unsaved, K kept (folder), N the folder’s copy', [S0.screen, S0.DIRTY, S0.kept && S0.kept.note, S0.kept && S0.kept.why, S0.head.note], ['S1-ONSCREEN', true, 'K-KEPTWORK', 'folder', 'N-NEWER']);
  if (route === 'AD') chk(sc, 'FIX', 'start (as AD): WORKING, DIRTY false, record unsaved, nothing kept, F0 in the folder', [S0.screen, S0.DIRTY, !!(S0.base && S0.base.dirty), S0.kept, S0.head.note], ['WORKING', false, true, null, 'F0-BASE']);
  if (route === 'BR' || route === 'O4') chk(sc, 'FIX', 'start: B-EDIT on screen, nothing recorded (0), F0 the folder’s copy, not newer than the screen', [S0.screen, S0.driveBase, S0.head.note, S0.theirsNotNewer], ['B-EDIT', 0, 'F0-BASE', true]);
  if (real) chk(sc, 'FIX', 'the opening connected through driveAutoConnect: [need, live, recorded, its read missed the O&M copy]',
    [S0.opening.need, S0.opening.live, S0.opening.driveBase, S0.opening.folderOps.includes('B:miss:spmt-2027-om.json')], ['', true, 0, true]);
  if (/h$/.test(kind)) chk(sc, 'FIX', 'the folder’s history holds F00-FIRST (spaced)', S0.hist.map(h => h.note + (/-recent/.test(h.name) ? '(r)' : '')), ['F00-FIRST']);
  // PRE
  if (W) {
    chk(sc, 'PRE', 'A’s save held, holding the lock', [R.Aheld.reached, R.Aheld.heldBy, R.Aheld.Abusy], [true, ['A'], 1]);
    chk(sc, 'PRE', 'at the action: [B _saveBusy, A _saveBusy, held by, pending, B’s folder ops since its save]',
      [R.premise.Bbusy, R.premise.Abusy, R.premise.heldBy, R.premise.pendingOf, R.premise.BfolderOpsSinceSave.length], [count ? 1 : 0, 1, ['A'], ['B'], 0]);
    chk(sc, 'PRE', 'grants: A, then B', R.grantOrder.slice(0, 2), ['A', 'B']);
  }
  if (kind === 'C1real') chk(sc, 'PRE', 'counted control: [B _saveBusy, held by, pending, B’s save at its read]',
    [R.premise.Bbusy, R.premise.heldBy, R.premise.pendingOf, R.premise.BfolderOpsSinceSave.slice(-1)[0]], [1, ['B'], [], 'B:read:spmt-2027-om.json']);
  const D = R.during, V = R.save, N = R.next;
  // CNT: the trigger removed -> the C1 behaviour (literals as the builder's C1 checks)
  if (sc === 'PB-Wcount') { chk(sc, 'CNT', 'put back REFUSED while the counted save waits: [screen, kept, MS same, kept same, said, asked]',
      [D.screen, D.kept.note, D.msUnchanged, D.keptUnchanged, has(D.status, /Not put back.*a save was under way/), D.prompts.length], ['S1-ONSCREEN', 'K-KEPTWORK', true, true, true, 0]);
    chk(sc, 'CNT', 'then S1’s save lands: [folder, screen, saved, kept]', [V.head.note, V.screen, V.saved, V.kept.note], ['S1-ONSCREEN', 'S1-ONSCREEN', true, 'K-KEPTWORK']); }
  if (sc === 'AD-Wcount') { chk(sc, 'CNT', 'refresh REFUSED while the counted save waits: [screen, unchanged, said "not loaded"]', [D.screen, D.unchanged, has(D.status, /was not loaded/)], ['WORKING', true, true]);
    chk(sc, 'CNT', 'then the save refuses with the choice: [folder, screen, saved, said, wrote]', [V.head.note, V.screen, V.saved, has(V.status, /Nothing was written/), V.rec.wrote], ['N2-NEWER', 'WORKING', false, true, 0]); }
  if (sc === 'BR-Wrealtickcount') chk(sc, 'INFO', 'after the refused save, tick 1’s own refresh recorded the folder’s copy (driveBaseOf = F0’s stamp) [observed mechanism]', V.driveBase === O.T.F0, true);
  if (sc === 'BR-Wcount' || sc === 'BR-Wrealcount' || sc === 'BR-C1real' || sc === 'BR-Wrealtickcount') {
    const K = sc === 'BR-C1real' ? 'CTL' : 'CNT';
    chk(sc, K, 'the refresh records NOTHING (driveBaseOf stays 0)', D.driveBase, 0);
    chk(sc, K, 'then the save refuses with the choice: [wrote, folder, said]', [V.rec.wrote, V.head.note, has(V.status, /Nothing was written/) && has(V.status, /Save yours over theirs/)], [0, 'F0-BASE', true]); }
  if (sc === 'BR-Wreal' || sc === 'BR-Wrealtick' || sc === 'BR-Wrealh')
    chk(sc, 'INFO', 'the refresh during the wait recorded the folder’s copy (driveBaseOf = F0’s stamp) [observed mechanism]', D.driveBase === O.T.F0, true);
  // O4: the Live timer alone
  if (route === 'O4') {
    chk(sc, 'O4', 'tick 1: the autosave is refused, nothing written: [wrote, folder]', [R.tick1.rec.wrote, R.tick1.head.note], [0, 'F0-BASE']);
    chk(sc, 'O4', 'tick 1: its refresh then records the folder’s copy as the base [observed mechanism]', R.tick1.driveBase === O.T.F0, true);
    chk(sc, 'O4', 'grants: B only (no contention)', [...new Set(R.grantOrder)], ['B']);
  }
  // the properties at each step after B's save (O4: after tick 2's autosave)
  const steps = route === 'O4' ? [['tick 2’s autosave', R.tick2, R.tick2 && R.tick2.rec], ['the next Save', N, N && N.rec], ['the reopen', R.reopen, null]]
    : [['B’s save', V, V && V.rec], ['the next Save', N, N && N.rec], ['the reopen', R.reopen, null]];
  for (const [label, step, recOf] of steps) {
    if (!step) continue;
    let K = route === 'O4' ? 'O4' : count ? 'CNT' : kind === 'C1real' ? 'CTL' : 'U20';
    if (sc === 'BR-Wrealtickcount' && label !== 'B’s save') K = 'O4';   // after tick 1's own refresh: the pre-existing path
    chk(sc, K, label + ': not falsely clean', !!step.falselyClean, false);
    if (recOf) chk(sc, K, label + ': did not write over a copy without asking (by lineage)', unasked(route, recOf), false);
    chk(sc, K, label + ': every leaf copy in a place this board reaches [' + LEAVES[route].join(', ') + ']', reachable(route, step), LEAVES[route].map(() => true));
  }
}
const fails = rows.filter(r => !r.ok);
const byKind = {}; for (const r of rows) { byKind[r.kind] = byKind[r.kind] || { pass: 0, fail: 0 }; byKind[r.kind][r.ok ? 'pass' : 'fail']++; }
for (const r of rows) console.log((r.ok ? 'pass ' : 'FAIL ') + r.kind.padEnd(4) + ' ' + r.sc.padEnd(13) + ' ' + r.what + (r.ok ? '' : '  got=' + J(r.got) + ' want=' + J(r.want)));
console.log('\nBY KIND', J(byKind));
console.log('FAILING', fails.length, J(fails.map(f => f.kind + ' ' + f.sc + ': ' + f.what)));
writeFileSync(dir + 'xchecks.' + pass + '.json', JSON.stringify({ pass, byKind, rows }, null, 1));
