# v2.14 review round 2, fixer RV2-C: Save's record when browser storage refuses the plan

Branch `v214-rv2c`, from `99f754a` (`74a6aec`, the merged v2.14 tree with round 1's fixes and the round-2 slots, plus the lead's
Windows-kit fix and the writer question's wording). Three findings: the half-2 critic's two (no skeptic had checked them),
`stop-on-refused-storage-reads-saved-then-file-overwritten` and `refused-edit-makes-older-stored-copy-unsaved-work`, and
`stop-rolls-back-list-marks` (two skeptics, a regression from round 1), which RV2-A owns. The critic's probe
(`scratchpad/v214rev2/r2b-critic/p1-stop-refused.mjs`) was copied into `scratchpad/v214rev2/rv2-C/` and pointed at this worktree's
board before it was relied on. The board before is `git show 74a6aec:prioritization-board-grid.html` (`rv2-C/pre.html`).

Both critic findings are one defect: **save() marks this browser's record (`<key>.base`) "unsaved work" before persist(), and left
it so when browser storage refused the write.** The record describes the plan browser storage holds; a refused write changed
nothing there. Marked anyway, the record named an OLDER stored copy as unsaved work against the very file the page came from.

## 1. stop-on-refused-storage-reads-saved-then-file-overwritten (data loss)

**Reproduced** on this worktree (`rv2-C/repro-mine.txt`; modes `locked`, `denied`, `later`; slot empty and in use). The board file
holds note A = LATER; storage holds an older copy (A = EARLIER) and refuses the plan; the record is `{"file":<the file>,"dirty":false}`.
A 💾 Save that stops before it writes (write access denied, `'later'`, or the write refused as read-only) leaves the page clean
(`DIRTY` false, leaving asks nothing -- right: nothing was typed) but the record `{"file":<the file>,"dirty":true,"blank":false,
"folder":{}}`, and the save state reading "Unsaved changes". Reopened in that browser:
- slot empty: the file opens, and the older copy is kept aside as "work this browser held that no saved copy had" (it fills the slot);
- slot in use: the file is NOT opened -- the older copy (A = EARLIER) is on screen, "BLL saved a newer copy … the newer copy was not
  loaded and nothing was lost" -- and an edit plus 💾 Save writes it over the file asking nothing (questions `[]`, file A = EARLIER).

Why: the bytes are built by `buildSavedHtml()`, whose `save()` marked the record; `persist()` was refused; `saveStopBack` puts the
record back only while `mine` (storage holds this page's own save stamp), which cannot hold when storage refused this page's write.
`_saveInPlaceFileRun`'s HOLD ON cannot fire after the reopen, because the record's `file` is this very file (LASTKNOWN).

**Fixed** in `save()` (below, one rule for both findings). With it, the record is never marked over a refused write, so a stopped
Save has nothing to put back there; `saveStopBack` is unchanged in that part, and its comment now says why `mine` false leaves
nothing to do. **Also**, at the end of `saveStopBack`, `saveStateShow()` again: `lsMarksBack` drew the save state before
`_baseDirty` went back, so a Save that stopped over a board nothing changed read "Unsaved changes" until the next redraw (the
critic's "although the save state still reads 'Unsaved changes'"). That line is below RV2-A’s change to the marks line, with
five unchanged lines between: `git merge-tree` merges `v214-rv2a` and `v214-rv2b` into this branch with no conflict, and on both
trial merges every mutation target matches once (3,533 and 3,529).

The critic's proposed fix (keep the stored text in `saveStopMark`, put the record back when storage still holds it) was judged and
not taken: it closes only the stop path, and `refused-edit-…` would stay open. With the save() rule there is no case left where
`mine` is false, storage is unchanged and the record differs from what the mark found.

After the fix (`rv2-C/repro-fixed.txt`): every mode, both slots -- the record is what it was, the save state reads Saved, the
reopening opens the file's LATER copy with nothing kept aside, and its edit + Save keeps A = LATER.

## 2. refused-edit-makes-older-stored-copy-unsaved-work (data loss; pre-existing in v2.13 and 74a6aec)

**Reproduced** (`rv2-C/repro-mine.txt`, mode `leave`): the same board, an edit storage refuses (`⚠ This change is not in browser
storage …`), the page left anyway (the browser asked; the person accepts losing that one edit). The record was `dirty:true` naming
this file; reopened, slot empty: the older copy kept aside as unsaved work; slot in use: the older copy on screen and the next Save
writes it over the file -- every change saved in the file after that copy lost, not only the one edit the leave question named.

**Fixed** in `save()`: it reads the record before `baseMarkDirty()` and after it; when `persist()` returns false and the record is
still what the mark wrote, the record goes back to what it was (removed when it held nothing). The page's own memory keeps the
unsaved work: `DIRTY`, `_baseDirty` and `memOnlyNow()` are as before, so leaving still asks and switching appropriation still waits.
When storage takes the plan again, the next edit marks the record as before (checked). The two-tab case of item 129 is unchanged in
kind: a refused write here leaves whatever record the other tab last wrote, which describes what storage holds.

Not taken: the critic's boot alternative (`own=false` when storage's plan is older than the save its record names) -- it has the
two-tab edge case the critic named, and records already written dirty by an earlier build are not healed by this fix (they heal on
the next Save that lands, which writes `{file, dirty:false}`).

## 3. stop-rolls-back-list-marks (RV2-A's)

Not changed here, as the brief says: RV2-A owns the marks line of `saveStopBack` (on `v214-rv2a` it keeps the lists' marks when
`_sideGen` moved). This fix does not depend on it: the RV2-C check involves no list, and it passes on this board and on RV2-A's
board with this fix applied (`rv2-C/slim-rv2a.log`, ALL CHECKS PASSED).
**Reproduced** on this worktree, unchanged by this fix (the reviewer's `_p2.mjs`, copied to `rv2-C/m/`): the refused variant reads
`memOnly:true, leaveAsks:true` while the Save waits and `memOnly:false, leaveAsks:false, unsaved:false` after it stops -- 2 FAILING
CHECKS (`rv2-C/p2-mine.log`). On the trial merge of this branch with `v214-rv2a` (`git merge-tree`, `rv2-C/mergeA/board.html`) it
passes, ALL CHECKS PASSED (`rv2-C/p2-mergeA.log`), and so does the RV2-C check there and on the trial merge with `v214-rv2b`.

## The check

audit-import `v2.14 RV2-C — a write browser storage refuses leaves this browser’s record as it was: the older stored copy is not
read as unsaved work, and the file is not written over with it (…)`, 41 checks, expectations from the fixture's own notes and file
time. Slot empty and in use, each: (i) an edit storage refuses -- on screen only and leaving asks (CONTROL); the record byte for byte
as it was; then storage takes writes again and the next edit IS recorded unsaved against the file (CONTROL); reopened: the file's
LATER note on screen and the kept slot as it was; its edit + Save writes once and the file keeps LATER. (ii) a Save stopped by
`denied`, `later` and a read-only file -- nothing written and said (CONTROL); the record as it was; the board reads saved, not
"Unsaved changes", and leaving asks nothing; reopened and saved as in (i). **Fails on 74a6aec with 26 failing checks**; passes here.

## Mutations (recovery/v214/proofs-RV2C.json, proved-RV2C.jsonl: 4 of 4 CAUGHT by failed checks, none by a throw)

- `v214-rv2-c-refused-record-marked` (save): the put-back gone -- 20 failing checks.
- `v214-rv2-c-stored-record-put-back` (save): the put-back not gated on a refusal, so stored unsaved work is recorded saved -- 2.
- `v214-rv2-c-stop-state-stale` (saveStopBack): the redraw at its end gone -- 6.
- `v214-rv1-c-stop-no-persist` RETARGETED in place: its find ended at the function's closing brace, which the new lines moved;
  it now ends at the new comment. Caught by RV1-C's own block (7 failing checks).
`mcount`: 3,512 entries, every one once.

Not added: a mutation on the "still what the mark wrote" guard (nothing can write the record between the mark and the put-back --
save() is synchronous -- so it would be equivalent; the guard is there for safety), and on the `rec0===null` branch (writing the
text "null" reads as no record to `baseGet()`, so equivalent too).

## Left, and why

- **The same rule on the load paths**: left in the first pass, and fixed in the finish below (a package for the board on
  screen, the shared state file by hand and automatically, and ↶ Put this back). `bootTakeFile` and `keptPutBack` are still left;
  the finish section says why.
- **A record an earlier build wrote dirty over an older stored copy** stays dirty until a Save lands; nothing heals it on opening.
- The `leave` mode's save state in the critic's probe reads "Saved" after an edit only because the probe calls `save()` without a
  `render()`; a person's edit redraws.

## Runs

`npm run check` all passed; `boot-same` identical. Suites whole at 8 GB, one at a time: audit-import, audit-board (its first run was killed
with exit 137 beside two other fixers' suites; rerun alone) and audit-recon, each ALL CHECKS PASSED. Browser checks: `npm run
storagefull`, `savetarget`, `fileimport` and `keys` all passed; `npm run fuzz` nothing lost (seed 780206414). Not run: dialogs, panels,
standards -- nothing this change draws is a box, a panel or a control (`saveStateShow()` is the save state's own redraw).

## Finish: after the independent check (`scratchpad/v214rev2/rv2-C-check/`, verdict needs-work)

The check confirmed the first two findings closed on the routes it named (the critic's probe, every mode and both slot
states). It found two more problems, and both are now fixed.

### (1) A regression from b6ab3cb: a load that asks read "saved" over an edit storage refused (data loss)

**Reproduced** on b6ab3cb with the check's probe (`rv2-C/p-adopt.mjs`, `QUOTA=size|key`). Storage refuses an edit; the person
follows "load the shared one (what you have is kept aside first)". It asked "What is on screen is saved, so nothing is kept
aside", and on OK it replaced the edit, kept nowhere. 74a6aec kept the edit (`key`) or refused the load for want of room
(`size`).

Why: b6ab3cb left the record (`<key>.base`) clean after a refused write, which is right for the boot: the record describes the
plan browser storage holds. But `sharedKeepMine()`, `adoptShared()`, `driveRestore()` and `driveStorePull()` used the same
record to answer a different question, whether the work ON SCREEN is unsaved.

**Fixed:** `screenUnsaved(other)` = `!!_baseDirty || ownUnsaved(MS, other, baseGet())`, read by all four. The page's own
memory answers for the screen and the record answers for storage; either one saying unsaved keeps the work aside first.

- `driveRestore`: with only the record, an edit storage refused was kept aside marked saved, with "saved only in the board
  file". Nothing was lost there, but the words were false.
- `driveStorePull`: unchanged in any reachable case. Its `if(DIRTY)` refusal comes first, and with DIRTY false `_baseDirty`
  agrees with the record unless another tab has cleaned the record. It reads the same rule so the four cannot drift. It has no
  mutation of its own, because no single-tab fixture can make the two readings differ there.
- `keptPutBack` already read `DIRTY || baseGet().dirty`. `impUnsavedList` reads `unsavedNow()`. Both read the page's memory
  already.

### (2) The same mark over a refused write, by a load (data loss; in 74a6aec and b6ab3cb alike)

**Reproduced** with the check's `p-pkg.mjs` (modes `pkg` and `shared`). Three loads did it: `pkgApply` of a package for the
board on screen (its lsSet refused), `adoptShared`, and `sharedArrived`'s automatic load. Each marked the record
`{file:<this file>, dirty:true}` over the older copy storage still held.

- Reopened with the slot empty: that copy was kept aside as unsaved work.
- Reopened with the slot in use: the older copy was put on screen, and an edit plus 💾 Save wrote it over the file, asking
  nothing.

**Fixed, by one rule:** the mark is still written first, so that a tab killed between the two writes leaves the record
unsaved. When the write is then refused, the mark is put back, but only while the record is still what the mark wrote.
`baseRaw()` and `baseUnmark(r0, r1)` are the one implementation.

| Route | How it uses the rule |
|---|---|
| `save()` | uses the two helpers (the same behaviour as b6ab3cb) |
| `adoptShared`, `sharedArrived` | call `loadStored()`: loadCounted, persist, put back on refusal |
| `pkgApply` | `r0` before loadCounted; puts back when `!wrote` |
| `driveRestore` | its own `persist()` comes before the mark, and the mark is put back when that persist was refused |

The fourth route, `driveRestore` (↶ Put this back), was found while doing this. It is the same defect: reopened, the file was
not opened and 💾 Save wrote storage's older copy over it (checked in part (C) below).

`importBoards` keeps `loadCounted(); persist();`, with a comment saying why: lsAll has already written this board's plan, so its
mark is true whether or not the persist after it lands. Putting the record back there would record unsaved stored work as saved.

### Left, and why

- **`bootTakeFile`** (folder mode only: `persist(); …; loadCounted()`). It runs only after the person chose "This browser's own
  work is NOT kept", and the refused persist leaves that abandoned work in storage. Not reproduced, and not changed.
- **`keptPutBack`**. Its record names the kept work's own base file, so the HOLD ON still asks before a Save writes over a
  different file. Not reproduced, and not changed. The same three lines would fit both if the lead wants them.
- **`stop-rolls-back-list-marks`**: RV2-A's, as before. This branch does not depend on it.

### The check (audit-import, RV2-C slot, second block)

`v2.14 RV2-C — after a write browser storage refused, every load that asks reads what is on screen as unsaved, and a load over
a refused write leaves the record as it was (…)` has 40 checks. Every expectation comes from the fixture's own notes and file
time.

- **(A) An edit storage refused, then the shared copy loaded by hand.** Run twice: with only the plan refused, and with every
  write the size of the plan refused.
  - CONTROLs: the edit is on screen only, and the offer comes up.
  - Nothing asks "What is on screen is saved".
  - With only the plan refused, the edit is kept aside whole before the load. With every such write refused, the copy is not
    loaded and the board says there is no room.
- **(B) Three loads over a refused write, each with the kept slot empty and in use.** The loads: a package for the board on
  screen, the shared state file loaded by hand, and the shared state file loaded automatically.
  - CONTROL: the load is on screen only, and storage still holds EARLIER.
  - The record is byte for byte what it was.
  - Reopened: the file's LATER is on screen, and the kept slot is as it was.
  - Edit plus 💾 Save writes once, and the file keeps LATER.
- **(C) ↶ Put this back of a folder copy, Live view just watching, storage refusing the plan.** Storage took S0, the file holds
  S1, and an edit typed after the save is on screen only.
  - The edit is kept aside as work in no saved copy (`saved:false`), in those words.
  - The record stays clean.
  - Reopened: S1 is on screen, the kept slot still holds the edit, and Save keeps S1.

Results:

| Board | Failing checks | Which parts fail |
|---|---|---|
| 74a6aec | 18 of 40 | (B) and (C). (A) passes there: the regression was b6ab3cb's own |
| b6ab3cb | 24 of 40 | (A), (B) and (C) |
| this fix | 0 | ALL CHECKS PASSED |

The first RV2-C block (41 checks) still passes.

### Mutations (`recovery/v214/proofs-RV2C.json` → `proved-RV2C.jsonl`: 20 of 20 CAUGHT by failed checks, threw 0 on every one)

**New (9):**

| Mutation | What it breaks | Failing checks |
|---|---|---|
| `v214-rv2-c-screen-record-only` | the helper reads the record alone | 6 |
| `v214-rv2-c-keepmine-record-only` | `sharedKeepMine` | 2 |
| `v214-rv2-c-adopt-asks-saved` | `adoptShared`'s question | 2 |
| `v214-rv2-c-restore-label-record-only` | `driveRestore`'s label | 2 |
| `v214-rv2-c-load-marks-refused` | `loadStored`'s put-back | 10 |
| `v214-rv2-c-adopt-load-unstored` | `adoptShared` back to loadCounted + persist | 5 |
| `v214-rv2-c-auto-load-unstored` | `sharedArrived`, the same | 5 |
| `v214-rv2-c-pkg-marks-refused` | `pkgApply`'s put-back | 5 |
| `v214-rv2-c-restore-marks-refused` | `driveRestore`'s put-back | 3 |

**Retargeted in place: 9.** Each still breaks the same thing on the line that now carries it, and each is caught by its own
check.

| Mutation | Its check | Failing checks |
|---|---|---|
| `v214-rv2-c-refused-record-marked` | RV2-C, first block | 20 |
| `v214-rv2-c-stored-record-put-back` | RV2-C, first block | 2 |
| `restore-own-stale` | W4 U63/U64 | 2 |
| `v200-r5-restore-gen` | v2.00 R5 | 4 |
| `v200-r5-restore-basedirty` | v2.00 R5 | 1 |
| `v200-u10-shared-gate-in-adopt` | recon v2.00 U10 | 1 |
| `v202-e7-u29-load-unasked` | v2.02 E7 | 3 |
| `v214-rv1-b-own-package-uncounted` | RV1-B | 3 |
| `v214-rv1-b-own-package-not-a-load` | RV1-B | 3 |

The first two were retargeted because save() now uses `baseUnmark`. The other seven matched nothing once these lines changed;
mcount found them.

**Re-proved unchanged (2):** `v214-rv2-c-stop-state-stale` (6 failing) and `v214-rv1-c-stop-no-persist` (7 failing).

mcount: 3,521 entries, every one matched once.

### Runs (finish), on the final tree

A container restart stopped the first finish run after audit-recon. Everything below was run again, or re-read from logs written
after the last board change, on the tree committed with these notes.

- The check's probes on this board (`rv2-C/p-adopt.mjs`, `p-pkg.mjs`):
  - `QUOTA=key`: no "What is on screen is saved" question, and the typed edit is kept aside before the shared copy loads.
  - `QUOTA=size`: the shared copy is not loaded and the edit stays on screen, with the reason said.
  - `pkg` and `shared`, slot empty and in use: the record is unchanged, the file reopens on LATER, and edit + Save keeps LATER.
- `prove.py` again on the final board (the only board change since the first proof run was a comment): 20 of 20 CAUGHT by
  failed checks, threw 0, the same counts (`proved-RV2C.jsonl`).
- `mcount`: 3,521 entries, every one once. `npm run check`: all passed. `boot-same`: identical.
- Whole suites at 8 GB, one at a time: audit-import, audit-board and audit-recon (logs written after the last board change),
  audit-inject and audit-other (re-run): each ALL CHECKS PASSED.
- Browser: `npm run storagefull`, `savetarget`, `fileimport`, `keys` all passed. `npm run fuzz`: nothing lost, seed 973023294.
- Not run: dialogs, panels, standards. This change draws no box, panel or control.
- `stop-rolls-back-list-marks` stays RV2-A's (the check confirmed it closes on the trial merge with `v214-rv2a`).
