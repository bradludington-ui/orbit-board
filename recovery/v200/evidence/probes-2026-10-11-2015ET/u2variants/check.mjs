// check.mjs -- reads out/<variant>-2.json and judges each observed value against LITERAL expectations written here by hand.
// No board code runs here. usage: node check.mjs <dir>
import { readFileSync, writeFileSync } from 'node:fs';
const D = process.argv[2];
const V = ['BASE', 'U2a', 'U2b', 'U2ab'];
const O = Object.fromEntries(V.map(v => [v, JSON.parse(readFileSync(`${D}/out/${v}-2.json`, 'utf8'))]));
const K = 'K-KEPTWORK', S1 = 'S1-ONSCREEN', N = 'N-NEWER';
const rows = [];
const J = JSON.stringify;
const chk = (v, sc, id, what, got, want) => rows.push({ v, sc, id, what, got: J(got), want: J(want), ok: J(got) === J(want) });
const fl = x => [x.DIRTY, x._baseDirty, !!(x.base && x.base.dirty)];
const reachable = w => w.K_in.filter(p => p !== 'browserMain');   // a copy the person can reach: screen, kept slot, folder/file, folder history
for (const v of V) for (const sc of ['folder', 'file']) {
  const r = O[v][sc].race, head = sc === 'folder' ? 'folderHead' : 'fileHead', why = sc === 'folder' ? 'folder' : 'file';
  const word = sc === 'folder' ? 'folder' : 'file';
  // fixture: K kept aside through the product path, S1 on screen unsaved, the save held at its write
  chk(v, sc, 'FX1', 'before the race: screen, kept note, kept why, [DIRTY,_baseDirty,record], head',
    [r.setup.beforeRace.screen, r.setup.beforeRace.kept.note, r.setup.beforeRace.kept.meta.why, fl(r.setup.beforeRace.flags), sc === 'folder' ? r.setup.beforeRace.head : r.setup.beforeRace.fileHead],
    [S1, K, why, [true, true, true], N]);
  chk(v, sc, 'FX2', 'the save reached its write and was held there; _saveBusy when keptPutBack ran', [r.reached, r.during.saveBusyAtCall], [true, 1]);
  const refusal = v === 'U2b' || v === 'U2ab';
  if (!refusal) {
    chk(v, sc, 'P1', 'during: the put-back happened (S1 -> K on screen; one confirm asked)', [r.during.screenBefore, r.during.screenAfter, r.during.prompts.length], [S1, K, 1]);
    chk(v, sc, 'P2', 'during: _saveGen moved by the put-back (BASE: 0, U2a: 1)', r.during.genAfter - r.during.genBefore, v === 'BASE' ? 0 : 1);
  } else {
    chk(v, sc, 'B1', 'during: refused -- screen still S1, no confirm, kept slot byte-identical, MS JSON byte-identical',
      [r.during.screenAfter, r.during.prompts.length, r.during.keptByteIdentical, r.during.msByteIdentical], [S1, 0, true, true]);
    chk(v, sc, 'B1s', 'during: the status says so', r.during.status,
      '⏳ A save is under way — put the kept work back once it finishes. Nothing was changed: the kept work is still kept, and what is on screen is unchanged.');
  }
  // after the save lands
  const L = r.afterLanding;
  if (v === 'BASE') {
    chk(v, sc, 'D1', 'DEFECT after landing: K on screen marked SAVED [DIRTY,_baseDirty,record]=[false,false,false]; head S1; kept S1',
      [L.where.screen, fl(L.flags), L.where[head], L.where.kept], [K, [false, false, false], S1, S1]);
    chk(v, sc, 'D2', 'DEFECT after reopen: K in no copy the person can reach (screen, kept slot, ' + word + ', history)', reachable(r.reopen1.where), []);
  } else if (v === 'U2a') {
    chk(v, sc, 'A2', 'after landing: K on screen, UNSAVED [true,true,true]; head S1; kept S1', [L.where.screen, fl(L.flags), L.where[head], L.where.kept], [K, [true, true, true], S1, S1]);
    chk(v, sc, 'A2s', 'after landing: the status says the change is not in the ' + word + ' yet', new RegExp('not in the ' + word + ' yet').test(L.status), true);
    chk(v, sc, 'A3', 'reopen: K on screen or kept (never lost), recorded unsaved', [reachable(r.reopen1.where).some(p => p === 'screen' || p === 'kept'), !!r.reopen1.flags.base.dirty], [true, true]);
    chk(v, sc, 'A4', 'the next Save writes K', r.afterSave.where[head], K);
  } else {
    chk(v, sc, 'B2', 'after landing: S1 on screen, saved [false,false,false]; head S1; kept K, byte-identical to before the refused call',
      [L.where.screen, fl(L.flags), L.where[head], L.where.kept, L.keptStillByteIdenticalToBeforeCall], [S1, [false, false, false], S1, K, true]);
    chk(v, sc, 'B3', 'reopen: K kept aside (kept slot), S1 on screen and in the ' + word, [r.reopen1.where.kept, r.reopen1.where.screen, r.reopen1.where[head]], [K, S1, S1]);
    chk(v, sc, 'B4', 'retry after landing: one confirm, K on screen, UNSAVED [true,true,true]',
      [r.retry.applicable, r.retry.putBack.prompts.length, r.retry.putBack.where.screen, fl(r.retry.putBack.flags)], [true, 1, K, [true, true, true]]);
    chk(v, sc, 'B5', 'then Save: the ' + word + ' holds K', r.afterSave.where[head], K);
    chk(v, sc, 'B6', 'reopen after that Save: K on screen and in the ' + word, [r.reopen2.where.screen, r.reopen2.where[head]], [K, K]);
  }
  // the promise the put-back's own status line makes: "💾 Save will ask before it writes over ..."
  chk(v, sc, 'ASK', 'the first Save after the put-back asked before writing over the ' + word + "'s copy (the put-back's promise)", r.save.asked, true);
  // no-race control
  chk(v, sc, 'NR', 'no-race put-back: normalized result identical to BASE', O[v][sc].norace.cmp === O.BASE[sc].norace.cmp, true);
  chk(v, sc, 'NR0', 'no-race put-back ran with no save running (_saveBusy)', O[v][sc].norace.saveBusyAtCall, 0);
}
writeFileSync(`${D}/out/checks.json`, JSON.stringify(rows, null, 1));
for (const r of rows) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.v.padEnd(4)} ${r.sc.padEnd(6)} ${r.id.padEnd(4)} ${r.what}\n        want ${r.want}\n        got  ${r.got}`);
const by = {}; rows.forEach(r => { const k = r.v; by[k] = by[k] || [0, 0]; by[k][r.ok ? 0 : 1]++; });
console.log(J(by));
