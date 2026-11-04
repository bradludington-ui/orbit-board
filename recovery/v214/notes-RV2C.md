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

- **The same rule on the load paths, not changed** (outside this fixer's code): `loadCounted(); persist();` (the shared state
  file's load and its automatic load, a board import; `adoptShared`, line ~11442, ~11550, ~41461) marks the record unsaved and
  ignores a refused persist the way save() did, so on a board storage no longer takes the next opening would read the older stored
  copy as unsaved work the same way. `keptPutBack` writes `{file: the kept work's base, dirty:true}` then `persist()` likewise, though
  there the record names the kept work's file and the HOLD ON still fires. Not reproduced; the lead may want the same three lines
  there (read the record before the mark, put it back when `persist()` returns false and it is still what the mark wrote).
- **A record an earlier build wrote dirty over an older stored copy** stays dirty until a Save lands; nothing heals it on opening.
- The `leave` mode's save state in the critic's probe reads "Saved" after an edit only because the probe calls `save()` without a
  `render()`; a person's edit redraws.

## Runs

`npm run check` all passed; `boot-same` identical. Suites whole at 8 GB, one at a time: audit-import, audit-board (its first run was killed
with exit 137 beside two other fixers' suites; rerun alone) and audit-recon, each ALL CHECKS PASSED. Browser checks: `npm run
storagefull`, `savetarget`, `fileimport` and `keys` all passed; `npm run fuzz` nothing lost (seed 780206414). Not run: dialogs, panels,
standards -- nothing this change draws is a box, a panel or a control (`saveStateShow()` is the save state's own redraw).
