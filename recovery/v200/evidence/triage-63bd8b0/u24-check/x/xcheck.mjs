// xcheck.mjs -- the U24 CHECKER's expected values for the scenarios it ADDED (x/u24probe-x.mjs), hand-written literals,
// written at 15:32-15:36 EDT on 12 Oct 2026, BEFORE any of these scenarios was run, from reading board 98eed7e8:
//   save() L6765 (_saveGen++, DIRTY, base.dirty), buildSavedHtml L7034 (calls save()), _saveInPlaceFileRun L8320-8402
//   (gen taken after the bytes; clean only if unmoved), _driveStorePushRun L26786-26891 (MS.ts restamped, body and gen taken
//   before snapKeep and the head write; driveBaseSet(ap, wroteTs, clean)), adoptShared L8453 (persist only, no count),
//   sharedArrived L31580 (DIRTY guard; adopts when st.ts >= MS.ts), driveStorePull L26674, boot file logic L6459-6474,
//   importBoards L8465 (lsAll -> lsSet -> fileMark: counted; base.dirty never set).
//   usage: node xcheck.mjs <pass>   (reads x/out/<pass>-<scenario>.json; writes x/out/xchecks-<pass>.json)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const pass = process.argv[2];
const dir = new URL('./out/', import.meta.url).pathname;
const J = JSON.stringify;
const rows = [];
const chk = (sc, kind, what, got, want) => { const ok = J(got) === J(want); rows.push({ sc, kind, what, got, want, ok }); return ok; };
const tgt = o => o.head !== undefined ? (o.head && o.head.whose) : (o.file && o.file.whose);
const END = o => [o.screen.whose, o.recordedClean, o.baseCopy.whose, tgt(o), o.falselyClean];
const RO = o => [o.screen.whose, o.recordedClean, o.baseCopy.whose, o.falselyClean];
const RF = o => [o.screen.whose, o.recordedClean, o.falselyClean];
const ACT = (o, a) => [o.screen.whose, o.busy, a.genMoved, o.DIRTY, !!(o.base && o.base.dirty), o.kept ? o.kept.whose : null];
const INBOARD = p => !p.startsWith('outside') && p !== 'importSource';
// hold: [reached, busy, target content, DIRTY, questions asked]
// act:  [screen, busy, _saveGen moved, DIRTY, record dirty, kept]
// end:  [screen, recorded clean, base copy, target content, FALSELY CLEAN]; reopen: [screen, recorded clean, base copy, FALSELY CLEAN]
// refresh (folder): [screen, recorded clean, FALSELY CLEAN]; K: [K1, K2, K3] FALSELY CLEAN; reach: per point, per leaf
const E = {
  // HARNESS CONTROL: an ordinary edit during the same held save is counted: unsaved at the end, never falsely clean
  'SHc-fold-Wedit': { leaves: ['BRAD-2', 'SHARED'], hold: [true, 1, 'BRAD-1', true, 0], act: ['SHARED', 1, true, true, true, null],
    end: ['SHARED', false, 'BRAD-2', 'BRAD-2', false], reopen: ['SHARED', false, 'BRAD-2', false], refresh: ['SHARED', false, false],
    K: [false, false, false], reach: { end: [true, true], reopened: [true, true], edited: [true, true] } },
  'SHc-file-Wedit': { leaves: ['BRAD-2', 'SHARED'], hold: [true, 1, 'BRAD-1', true, 0], act: ['SHARED', 1, true, true, true, null],
    end: ['SHARED', false, 'BRAD-2', 'BRAD-2', false], reopen: ['SHARED', false, 'BRAD-2', false],
    K: [false, null, false], reach: { end: [true, true], reopened: [true, true], edited: [true, true] } },
  // TIMING CONTROL: the link clicked before the save builds its bytes: the save writes SHARED and records it: consistent
  'SHc-fold-Wread': { leaves: ['BRAD-2', 'SHARED'], hold: [true, 1, 'BRAD-1', true, 0], act: ['SHARED', 1, false, true, true, 'BRAD-2'],
    end: ['SHARED', true, 'SHARED', 'SHARED', false], reopen: ['SHARED', true, 'SHARED', false], refresh: ['SHARED', true, false],
    K: [false, false, false], reach: { end: [true, true], reopened: [true, true], edited: [true, true] } },
  'SHc-file-Wread': { leaves: ['BRAD-2', 'SHARED'], hold: [true, 1, 'BRAD-1', true, 0], act: ['SHARED', 1, false, true, true, 'BRAD-2'],
    end: ['SHARED', true, 'SHARED', 'SHARED', false], reopen: ['SHARED', true, 'SHARED', false],
    K: [false, null, false], reach: { end: [true, true], reopened: [true, true], edited: [true, true] } },
  // WINDOW: held at the history copy's close (bytes and gen already taken): the same falsely-clean end as SHc-fold-W
  'SHc-fold-Whist': { leaves: ['BRAD-2', 'SHARED'], hold: [true, 1, 'BRAD-1', true, 0], holdPath: true, act: ['SHARED', 1, false, true, true, 'BRAD-2'],
    end: ['SHARED', true, 'BRAD-2', 'BRAD-2', true], reopen: ['BRAD-2', true, 'BRAD-2', false], refresh: ['BRAD-2', true, false],
    K: [true, false, false], reach: { end: [true, true], reopened: [true, true], edited: [true, true] } },
  // ROUTE: no clock skew; the state file written after the save started is adopted during it: the same as SHa-fold-W
  'SHa-fold-Wlate': { leaves: ['BRAD-2', 'SHARED'], hold: [true, 1, 'BRAD-1', false, 0], late: true, act: ['SHARED', 1, false, false, true, 'BRAD-2'],
    end: ['SHARED', true, 'BRAD-2', 'BRAD-2', true], reopen: ['SHARED', true, 'BRAD-2', true], refresh: ['SHARED', true, true],
    K: [true, true, true], reach: { end: [true, true], reopened: [true, true], edited: [true, true] } },
  // ATTRIBUTION: an import with NO save during it, from a clean record; the folder copy newer than the imported board ->
  // the reopen loads the folder copy and keeps nothing aside (O2): IMPORT in no board copy, as in IB-fold-Wclean
  'IB-fold-C3clean': { leaves: ['BRAD-1', 'IMPORT'], saved: 0, act: ['IMPORT', 0, true, true, false, null],
    end: ['IMPORT', false, 'BRAD-1', 'BRAD-1', false], reopen: ['BRAD-1', true, 'BRAD-1', false], refresh: ['IMPORT', false, false],
    K: [false, false, false], reach: { end: [true, true], reopened: [true, false], edited: [true, false] } },
  'IB-fold-C1oldclean': { leaves: ['BRAD-1', 'IMPORT'], older: true, act: ['IMPORT', 0, true, true, false, null],
    end: ['IMPORT', false, 'BRAD-1', 'BRAD-1', false], reopen: ['BRAD-1', true, 'BRAD-1', false], refresh: ['IMPORT', false, false],
    K: [false, false, false], reach: { end: [true, true], reopened: [true, false], edited: [true, false] } },
  // COUNTERFACTUAL (added 15:37 EDT, before its run): BT-file-W, then the record marked unsaved by the harness before the reopen.
  // By the boot logic (L6459-6464) the file is newer, own work unsaved, the kept slot occupied by KEPT-0 -> the file is held back,
  // CAROL-F stays on screen and in storage. So CAROL-F's loss at the reopen in BT-file-W comes from the falsely-clean record.
  'BT-file-Wcf': { leaves: ['BRAD-2', 'KEPT-0', 'CAROL-F'], hold: [true, 1, 'CAROL-F', true, 1], act: ['CAROL-F', 1, false, false, false, 'KEPT-0'],
    end: ['CAROL-F', true, 'BRAD-2', 'BRAD-2', true], reopen: ['CAROL-F', false, 'BRAD-2', false],
    K: [true, null, false], reach: { end: [true, true, true], reopened: [true, true, true], edited: [true, true, true] } },
  // ROUTE (added 15:41 EDT, before its run): the Live autosave as the held save (liveTick L26356 -> driveStorePush(true), then
  // livePoll(true) -> driveStorePull(true) in the same tick). By code: falsely clean only between the landing and that refresh
  // (landed); the refresh then loads the folder's BRAD-2 over SHARED, quietly (own=false), so the end is consistent -- and the
  // status line still reads "Shared state loaded (published …)" because the autosave says nothing after a status line was set.
  'SHc-fold-Wauto': { leaves: ['BRAD-2', 'SHARED'], hold: [true, 1, 'BRAD-1', true, 0], auto: [true, true, true], act: ['SHARED', 1, false, true, true, 'BRAD-2'],
    landed: ['SHARED', 0, true, 'BRAD-2', true],
    end: ['BRAD-2', true, 'BRAD-2', 'BRAD-2', false], endWords: 'shared-loaded', reopen: ['BRAD-2', true, 'BRAD-2', false], refresh: ['BRAD-2', true, false],
    K: [false, false, false], reach: { end: [true, true], reopened: [true, true], edited: [true, true] } },
};
for (const sc of Object.keys(E)) {
  const p = dir + pass + '-' + sc + '.json'; const X = E[sc];
  if (!existsSync(p)) { chk(sc, 'RUN', 'output present', false, true); continue; }
  const O = JSON.parse(readFileSync(p, 'utf8')); const R = O.steps;
  chk(sc, 'RUN', 'finished, no error, board 98eed7e8', [O.errors.length, O.incomplete || null, O.IDS.board.slice(0, 8)], [0, null, '98eed7e8']);
  if (O.errors.length || O.incomplete) continue;
  if (X.hold) { const H = R.atHold; chk(sc, 'HOLD', 'held [reached, busy, target, DIRTY, asked]', [R.heldReached, H.busy, tgt(H), H.DIRTY, H.asked.length], X.hold); }
  if (X.holdPath) chk(sc, 'HOLD', 'the hold was hit at the history copy, not the head', /^history\/spmt-2027-om-\d{8}-\d{6}\.json$/.test(R.holdHitPath || ''), true);
  if (X.late) chk(sc, 'FIX', 'the state file was stamped after the save restamped the board (no clock skew), within 5 s', R.lateTsMinusSaveTs > 0 && R.lateTsMinusSaveTs < 5000, true);
  if (X.saved !== undefined) chk(sc, 'FIX', 'the save alone landed [questions asked]', [R.saved.asked.length], [X.saved]);
  if (X.older) chk(sc, 'FIX', 'the imported board is older than the folder copy', R.impFile.ts < R.setup.head.ts, true);
  if (sc.startsWith('SHc') && !/Wedit/.test(sc)) chk(sc, 'FIX', "the person clicked 'load the shared one' (no question)", [R.act.how, R.act.asked.length], ['clicked', 0]);
  if (/Wedit/.test(sc)) chk(sc, 'FIX', 'an ordinary edit was typed during the held save (no question)', [R.act.how, R.act.asked.length], ['typed', 0]);
  if (sc.startsWith('IB')) chk(sc, 'FIX', 'the batch asked once, answered OK, and finished', [R.act.asked.length, R.act.how.finished], [1, true]);
  if (sc.startsWith('SHa')) chk(sc, 'FIX', 'the answer arrived', R.act.how.arrived, true);
  if (sc.startsWith('BT')) chk(sc, 'FIX', "the person clicked 'open the file’s version' and answered its one question OK", [R.act.how, R.act.asked.length], ['clicked', 1]);
  if (X.auto) chk(sc, 'FIX', 'the autosave was on and armed before the tick [auto, live, DIRTY]', [R.autoPre.auto, R.autoPre.live, R.autoPre.DIRTY], X.auto);
  if (X.landed) chk(sc, 'PRED', 'after the autosave landed, before its refresh [screen, busy, recorded clean, base, FALSELY CLEAN]',
    R.landed ? [R.landed.screen.whose, R.landed.busy, R.landed.recordedClean, R.landed.baseCopy.whose, R.landed.falselyClean] : 'refresh hold not reached', X.landed);
  if (X.endWords) chk(sc, 'PRED', 'what the status line says at the end', /^Shared state loaded \(published/.test(R.end.status) ? 'shared-loaded' : R.end.status.slice(0, 80), X.endWords);
  if (R.cfMarked) chk(sc, 'CF', 'COUNTERFACTUAL mark applied: [DIRTY, record dirty, screen]', [R.cfMarked.DIRTY, !!R.cfMarked.base.dirty, R.cfMarked.screen.whose], [true, true, 'CAROL-F']);
  chk(sc, 'PRED', 'the action [screen, busy, gen moved, DIRTY, record dirty, kept]', ACT(R.afterAct, R.act), X.act);
  chk(sc, 'PRED', 'end', END(R.end), X.end);
  chk(sc, 'PRED', 'reopen', RO(R.reopen.opened), X.reopen);
  if (X.refresh) chk(sc, 'PRED', 'refresh', RF(R.afterRefresh), X.refresh);
  chk(sc, 'K', 'K1/K2/K3 falsely clean', [R.end.falselyClean, R.afterRefresh ? R.afterRefresh.falselyClean : null, R.reopen.opened.falselyClean], X.K);
  for (const [lbl, o] of [['end', R.end], ['reopened', R.reopen.opened], ['edited', R.reopen.afterEdit]])
    chk(sc, 'REACH', lbl + ': ' + X.leaves.join(', ') + ' in a board copy', X.leaves.map(m => (o.reach[m] || []).filter(INBOARD).length > 0), X.reach[lbl]);
}
writeFileSync(dir + 'xchecks-' + pass + '.json', J({ pass, rows }, null, 1));
for (const r of rows) console.log(r.ok ? 'ok  ' : 'FAIL', r.sc.padEnd(19), r.kind.padEnd(6), r.what.slice(0, 70), r.ok ? '' : '\n      got  ' + J(r.got) + '\n      want ' + J(r.want));
console.log('TOTAL', rows.length, 'checks,', rows.filter(r => !r.ok).length, 'fail');
