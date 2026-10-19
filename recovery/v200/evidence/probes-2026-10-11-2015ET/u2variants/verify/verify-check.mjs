// verify-check.mjs -- VERIFIER's own judgement of probe outputs against LITERAL expectations written here by hand.
// Runs no board code. Fixture times (T.F1, T.t0, T.s1Save, T.f2) are the times of the fixture's own copies as the harness
// read them from its mock folder/file (the probe's fileTs/fold.copy helpers, not ORBIT functions); they are used only to NAME
// which copy a checkpoint points at. usage: node verify-check.mjs <verifyDir>
import { readFileSync, writeFileSync } from 'node:fs';
const V = process.argv[2];
const rd = p => JSON.parse(readFileSync(p, 'utf8'));
const K = 'K-KEPTWORK', S1 = 'S1-ONSCREEN', N = 'N-NEWER';
const rows = []; const J = JSON.stringify;
const chk = (who, id, what, got, want) => rows.push({ who, id, what, got: J(got), want: J(want), ok: J(got) === J(want) });
const fl = x => [x.DIRTY, x._baseDirty, !!(x.base && x.base.dirty)];
const reach = w => w.K_in.filter(p => p !== 'browserMain');
const name = (t, T) => { const hit = Object.entries(T).filter(([, v]) => v === t).map(([k]) => k); return hit.length ? hit.sort().join('=') : (t ? 'other' : '0'); };
const PROMISE_FOLDER = '💾 Save will ask before it writes over the shared folder, which Alice saved after it.';
const PROMISE_FILE = '💾 Save will ask before it writes over the saved file, which Alice saved after it.';
// ---- V1: no-race control judged against hand-written literals (not against BASE's output)
const outs = { BASE: `${V}/out/BASE-2.json`, U2a: `${V}/out/U2a-2.json`, U2b: `${V}/out/U2b-2.json`, U2ab: `${V}/out/U2ab-2.json`,
  'M3-alwaysRefuse': `${V}/mut/M3-alwaysRefuse.json`, 'M5-noCheckpointOverwrite': `${V}/mut/M5-noCheckpointOverwrite.json` };
for (const [who, p] of Object.entries(outs)) {
  const O = rd(p);
  const f = O.folder.norace, Tf = f.T;
  chk(who, 'NRL-folder', 'no-race folder put-back: [screen, flags, checkpoint names folder|file, kept note, kept why, #confirms, header, promise said, head]',
    [f.where.screen, fl(f.flags), name(f.flags.base.folder['om|2027'], Tf), name(f.flags.base.file, Tf), f.kept.note, f.kept.meta && f.kept.meta.why, f.prompts.length, f.header, f.status.includes(PROMISE_FOLDER), f.where.folderHead],
    [K, [true, true, true], 't0', 'F1', S1, 'swap', 1, 'Unsaved changes · ↶ work kept aside', true, N]);
  const g = O.file.norace, Tg = g.T;
  chk(who, 'NRL-file', 'no-race file put-back: [screen, flags, checkpoint name file, LASTKNOWN name, kept note, kept why, #confirms, header, promise said, head]',
    [g.where.screen, fl(g.flags), name(g.flags.base.file, Tg), name(g.flags.LASTKNOWN, Tg), g.kept.note, g.kept.meta && g.kept.meta.why, g.prompts.length, g.header, g.status.includes(PROMISE_FILE), g.where.fileHead],
    [K, [true, true, true], 'F1=f1', 'F1=f1', S1, 'swap', 1, 'Unsaved changes · ↶ work kept aside', true, N]);
  // ---- V2: which copy the checkpoint names right after the landing (race). Literal: BASE/U2a = S1's own write; M5 = K's own.
  const r = O.folder.race, rf = O.file.race;
  const expFolder = { BASE: 's1Save=t2', U2a: 's1Save=t2', U2b: 's1Save=t2', U2ab: 's1Save=t2', 'M3-alwaysRefuse': 's1Save=t2', 'M5-noCheckpointOverwrite': 't0' }[who];
  const expFile = { BASE: 'f2', U2a: 'f2', U2b: 'f2', U2ab: 'f2', 'M3-alwaysRefuse': 'f2', 'M5-noCheckpointOverwrite': 'F1=f1' }[who];
  chk(who, 'CKP-folder', 'after landing: folder checkpoint names', name(r.afterLanding.flags.base.folder['om|2027'], r.T), expFolder);
  chk(who, 'CKP-file', 'after landing: file checkpoint (LASTKNOWN) names', name(rf.afterLanding.flags.LASTKNOWN, rf.T), expFile);
}
// ---- V3: U2b's refusal checks applied to BASE's output (the refusal absent): each must FAIL, or the control is blind.
{ const O = rd(`${V}/out/BASE-2.json`);
  for (const sc of ['folder', 'file']) { const r = O[sc].race, head = sc === 'folder' ? 'folderHead' : 'fileHead';
    chk('BASE-as-U2b', 'B1-' + sc, 'refusal control on a board without the refusal (expect this row to FAIL)',
      [r.during.screenAfter, r.during.prompts.length, r.during.keptByteIdentical, r.during.msByteIdentical], [S1, 0, true, true]);
    chk('BASE-as-U2b', 'B3-' + sc, 'reopen control on a board without the refusal (expect this row to FAIL)',
      [r.reopen1.where.kept, r.reopen1.where.screen, r.reopen1.where[head]], [K, S1, S1]); } }
// ---- V4: the extension (same session, one live tick; no-race autosave and Save) -- hand-written literals per variant.
for (const v of ['BASE', 'U2a', 'U2b']) {
  const O = rd(`${V}/out/EXT-${v}.json`);
  const t = O.E1.afterTick.where;
  const want = { BASE: [S1, [], S1, 0, 0], U2a: [K, ['screen', 'folderHead'], K, 1, 0], U2b: [S1, ['kept'], S1, 0, 0] }[v];
  chk(v, 'E1', 'race, then ONE live tick in the same session: [screen, K reachable in, folder head, folder writes, confirms]',
    [t.screen, reach(t), t.folderHead, O.E1.afterTick.folderWrites, O.E1.afterTick.prompts.length], want);
  chk(v, 'E2', 'no race: put back, ONE live tick: [folder writes, folder head, screen]',
    [O.E2.afterTick.folderWrites, O.E2.afterTick.where.folderHead, O.E2.afterTick.where.screen], [0, N, K]);
  chk(v, 'E3', 'no race: put back, 💾 Save: [folder writes, folder head, refused with a choice]',
    [O.E3.afterSave.folderWrites, O.E3.afterSave.where.folderHead, /Nothing was written/.test(O.E3.afterSave.status) && /Save yours over theirs/.test(O.E3.afterSave.status)], [0, N, true]);
}
writeFileSync(`${V}/out/verify-checks.json`, JSON.stringify(rows, null, 1));
for (const r of rows) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.who.padEnd(24)} ${r.id.padEnd(11)} ${r.what}\n        want ${r.want}\n        got  ${r.got}`);
const by = {}; rows.forEach(r => { by[r.who] = by[r.who] || [0, 0]; by[r.who][r.ok ? 0 : 1]++; }); console.log(J(by));
