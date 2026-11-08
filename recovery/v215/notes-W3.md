# v2.15 W3 — storage writes, Save and import wording, test gaps (item 144; item 146 as contract §1.3 assigns it)

Branch `v215-w3`, from the slot commit `8c24ea2`. Every finding was reproduced on the slot commit before it was fixed: each new
check below fails there unless it is labelled CONTROL (`BOARD=<slot board> node <slimmed suite>`; the slot run's output is the
"fails on the slot commit" column).

## What was built

### Item 144 — the other direct storage writes go through `lsSet`; no record where the plan's own write was refused
- **`lsSet(key, val, what, o)` takes three new options**, all of them for this page's own state, through `lsOwn()`:
  - `o.own` — never folded into an import being prepared (`_lsCapture`) and never counted as a list the file carries (none of
    these is one). This also closes item 146's "`writerKey` / `whoAmI` captured into an import being prepared".
  - `o.lose` — a refusal leaves work on screen only: the key goes on `_lsOnly`, which `memOnlyNow()` reads (leaving asks;
    switching appropriation and the reopening imports wait, D13). A later write of that key that lands takes it off, and so does a
    file save (`sideWrote`).
  - `o.say` — the caller's own sentence, said once per key per page after the browser's reason (never lsSet's "Use 💾 Save to
    write it into the file", which is untrue of something no file holds). Without it a refusal says nothing.
  Every refusal is in Save diagnostics (`DIAG.refused`), as every other one is.
- **Per key** (contract §1.3: `.kept` does leave work on screen only, `uiPrefWrite` and the menu groups do not):

  | write | `what` (Save diagnostics) | on screen only | sentence |
  |---|---|---|---|
  | `baseSet` — a mark saying the work is **unsaved** | This browser’s record of the <appropriation> plan | yes | "This browser could not record that the work on screen is unsaved, so until 💾 Save writes it into the file, closing or reloading this page asks first." |
  | `baseSet` — any other mark (saved, a file, a folder) | the same | no | none (the record still says unsaved, which loses nothing: D17's hazard C) |
  | `keepAside`'s `.kept`, and `keptPutBack`'s swap and its restore | Work kept aside on <appropriation> | yes | the callers' own (every caller already says why nothing was loaded) |
  | the stopped-import mark (`impMixedMark`, from `fullImportUndone` and `batchImportUndone`) | The hold on a stopped import | yes | "Browser storage would not keep the hold on the stopped import, so it lasts only while this page is open. Save both copies offered in the message line before closing it; closing asks first." |
  | `jrnlMarkSeen` | Which change journal entries you have seen | no | "… so the next time the board opens they show as new again." |
  | `pmoMineSet` | Your office | no | "… This page keeps it until it is closed; the next copy you open asks again." |
  | `uiPrefWrite` | A view setting of this browser | no | none |
  | the open menu group (`menuGrp`) | Which menu group is open | no | none |
  | `SIDE_OPEN_KEY` (`sideBootCheck`) | What opening an older file wrote | no | none (the next opening reads the list as unsaved: asks, loses nothing) |
  | `writerKey`, `whoAmI` (already through lsSet, quiet) | as before | no | as before (now `own`) |

- **`baseSet` and `baseMarkDirty` write no record where this page's own plan write was refused** (`baseRecBlocked()`:
  `_persistFail`, not `_recMark`, and storage's plan no longer the copy this page wrote last or opened, `impOwnCopyGone()`). The last
  term came from the whole suite: blocked whenever the plan was refused, a file save's clean mark was held back over this page's own
  older stored copy, and v2.14 RV2-C's check (C) failed (the next opening kept that older copy aside over the file). While storage still
  holds this page's own work, the record behaves as in v2.14; once another tab has saved its board there, nothing here rewrites it. The one exception is the mark `save()` and `loadStored()` write just before the plan
  (`_recMark`): a tab killed between the two writes must leave the record unsaved, and both already put it back when storage refuses
  the plan (`baseUnmark`, v2.14 RV2-C). Once storage takes the plan again, `persist()`'s success branch marks the record for the
  unsaved work it now holds (`if(DIRTY) baseMarkDirty()`). Reproduced on the slot commit: with this page's plan refused, a load
  counted (`loadCounted`), a file save's clean mark and a mark of its own each rewrote another tab's record.
- `cycCarrySaved`'s record write is W2's function (contract §2): left for the integration (below).

### Item 146 — Save and the file route
- **The hold's note read safely** (`impNoteStr`, `impNoteTs`, `impNoteSays`): `impHandMsg`, `impHandClear` and `fullImportUndone`'s
  alert. Reproduced: a note whose `name` is `{"toString":1}` made all three throw ("Cannot convert object to primitive value").
- **A Save stopped while storage was full leaves no pen line** (`saveStopMark` keeps `raw0`, the plan storage held before the save's
  own `save()`, and `raw1`, what that `save()` wrote; `saveStopBack` treats storage still holding `raw1` as this page's (`ours`),
  writes it back from memory, and where storage refuses that too puts `raw0` back with its record). Reproduced on the slot commit:
  storage kept the "(writer)" journal line.
- **`fhSaveNew` and `fhRepick` on the left menu's `dd_save`** (*Save as a new file…*, *Choose another file…*, under the ▾ beside
  💾 Save, after *Save a copy…*); `tools/left-menu.mjs`'s map counts each once.
- **Save as a new file takes the writer the board already has** when that is this browser (`fw` is `WRITER` for a file with no
  state, when `writerIsMe(WRITER)`): no "(writer) not set → …" line, no "You are now this board’s writer". Reproduced.
- **A refusal forgets the file it refused** (`fhForget(h)`): the page's own remembered entry, or `_fhMem` when the failing handle is
  the new file *Save as a new file…* wrote. Reproduced: `_fhPut(null)` deleted the page's own entry.
- **The file route's write calls `fhLegacyRelease`** (`impFileWriteTo`, and step 1's as-it-was write `impFileSaveWas`).
- **`impFileBuild` names a writer only by a key this browser keeps** (storage holds `R.wk`); otherwise the file names no writer and
  its first Save asks once to become its writer. Reproduced: with the key refused throughout, the file named a key no browser kept.
- **`impFileFailed`'s sentence is true when the file chosen was this board's own** (`impFileIsOwn`: the page's file name, or `FH`'s):
  "“…” is this board’s own file: the browser emptied it when you chose it, so this board as it was is in no file now", and
  "💾 this board as it was" (`R.rescue.own`, built by `fullImportPreHtml` from what storage held) is offered and held
  (`impFileRescued`, `impFileCloseAsk`, `impFileCopies`). One sentence for the box and the line: `impFileFailSay`.
- **Switching to an appropriation the file holds no plan for** asks no false HOLD ON (`saveNoneHere(p)`: this page has saved
  nothing, the file has no plan for the appropriation on screen, and it is still the very save this page opened). Reproduced.
- **A pubState that is a JSON array is refused as not a board.** Reproduced: it was claimed and written over.

- **Every stop before a Save's write puts the writer back** (found by `npm run savetarget` C, not in the item): a Save that read a file
  whose writer is this browser set `WRITER` to that file's ('me') and kept it on Cancel, so the page took another file's writer for its
  own and its next Save into the bare program wrote it in without claiming the pen. `WRITER=prevWriter` now runs at every stop, not only
  when the pen moved.

### Item 146 — wording
- `writerMay`'s "before v1.95": **did not reproduce** — v2.14 round 2 (the lead) had already removed it ("No writer is recorded for …
  yet."). Left.
- The full-import report's "(v2.9)": the version as the file spells it (`fullBuildTxt`), in the report and in the too-old alert.
- `JRNL_NOT_WHOLE`: "Delete this added requirement on its row’s ⋯ menu"; "open an earlier saved copy of the board file (or, working
  out of the shared folder, History & recovery › Earlier copies…)". audit-board's v2.14 W4 check moved with it (`// v2.15 W3:`).
- The folder-mode refusal (`memOnlyBlock`): working out of the shared folder with a list, a record or kept work on screen only, it
  names ⬇ Save a copy ("💾 Save writes the board but not what browser storage refused"); with only the plan, "💾 Save writes them into
  the shared folder".
- **E2 refused for room pointing to ⬅ Import a full board: did not reproduce** — v2.14 RV2-A already ends that alert with "use
  Imports & exports › Import a full board (new version)…", and audit-import's v2.14 W2 (item 141 E) block (c) holds it. Left.
- Save diagnostics' two prefixes: "the board's" share of storage and the walk of every store both read `CLR_PREFIX`.
- Every `.nb.lnk` in the message line on `--edge` (`#statWrap button.nb.lnk, #shareStat button.nb.lnk`); `npm run standards` now
  draws its long warning with a link button of its own.

### Item 146 — the rest
- `writerKey`/`whoAmI` not captured: `o.own` (above).
- `importState`'s `prio27appn` write through `lsSet` (quiet, own); the page reopens only when the plan landed (`landed`, and
  `e2Commit`), and when the appropriation to open is refused it says to choose it at the top instead of reopening on the wrong one.
- The dead `if(res.back) _sideGen=g0;` is in `cycApplyAll`, which only the lead changes (contract §2): for the integration.
- `driveStorePull`'s unreachable `!driveStoreOn()` term removed (the function returns at its first line when the store is off).
- A cancelled download: `memOnlyBlock`'s `_dlOnly` question no longer says the downloaded copy holds the changes ("… holds them only
  if the download was kept: check your Downloads folder first.").

### Item 146 — test gaps
- `v215-w3-marksback-drops-dl` drops `lsMarksBack`'s `_dlOnly` restore; caught by v2.14 W3's "a refused import leaves the board as
  saved as it was".
- `W214.refuse()` no longer resets the marks by hand (audit-import); `lsMarksBack` does it, so every W2 block now sees it.
- `tools/import-file.mjs` A, D and `--gtk` compare storage byte for byte (`bytes()`), not key names and lengths (`lens()`, gone).
- W2 check 5's `impShellEmpty` → `impPlanHasReqs` branch: block (h) (a CONTROL) and `v215-w3-shell-ignores-plans`.
- audit-inject "W3-1": the file route's other file-name sinks drawn through the board's own code (a failed Write, this board's own
  file, a raced write, the download route, the two pauses, the route whose note was refused, a note whose fields are not text);
  six `v215-w3-name-*` mutations each take one `esc()` off.
- `tools/save-target.mjs` E seeds a mark from each page it opens and names the storage seam when the next page cannot read it
  (`seam()`), as storagefull does.

## Decided in the build (Brad can reverse any of these)
1. A refused **"saved"** mark on the record leaves nothing on screen only and says nothing (D17's hazard C: the record still says
   unsaved, which loses nothing). Only a refused **"unsaved"** mark does.
2. `keptPutBack`'s swap and its restore are "keepAside's `.kept`" too: through `lsSet`, on screen only when refused.
3. View settings and the open menu group say nothing when refused (their comments always said so); the journal's seen mark and the
   office each say one sentence once per page; `SIDE_OPEN_KEY` says nothing (it is written while the board opens).
4. A refused stopped-import mark counts as work on screen only, so leaving asks — the hold then lives in this page alone.
5. `_lsOnly` is cleared by any file save (`sideWrote`): the save wrote what is on screen.
6. A Save stopped while storage refuses the plan puts back the copy storage held before the save (`raw0`), with its record, when
   storage still holds exactly what that save's own `save()` wrote; the edit made meanwhile stays on screen only, as any refused
   edit does. Where storage held nothing before (`raw0` null), the plan key is removed again.
7. The file route's new file names no writer when this browser's key could not be stored when the file was built; its first Save
   then asks once to become the writer (rather than naming a key no browser keeps). The note still offers to store the key.
8. "This board's own file" for a failed Write is judged by name: the page's own file name (`fhOwnName`) or the file it saves to
   (`FH`). A same-named file in another folder is read as the board's own; that only adds a copy offered and a sentence.
9. `saveNoneHere` skips the HOLD ON only while the file is still the very save this page opened (`PUB_FILE_TS`); a file saved by
   anyone since still asks.
10. `fhRepick` was left as it is (it forgets the page's own entry by design, and `v214-w1-repick-keeps` reads its text).
11. The record is held back only while storage's plan is another tab's (`impOwnCopyGone`): v2.14 RV2-C's clean mark after a file save
    over this page's own older stored copy is kept, because that copy is older work the file now holds.

## Checks
New (audit-import, the W3 slot), each failing on the slot commit unless CONTROL:
- **"v2.15 W3 — the other storage writes go through lsSet, and a refused plan writes no record (item 144)"**: (a) the journal's seen
  mark, the office, a view setting, the open menu group — each refused alone; (b) work kept aside; (c) the unsaved mark (and,
  CONTROL, a later write that lands takes it off), the saved mark; (d) the stopped-import hold; (e) a refused plan leaves another
  tab's record alone, and storage taking the plan again marks it; (f) the writer key and the editor name during an import's
  capture; (g) Import one appropriation of another appropriation's file with the appropriation to open refused (and, CONTROL, not
  refused); (h) `impShellEmpty` with a plan holding a requirement (CONTROL).
- **"v2.15 W3 — Save, the file route and their messages (item 146)"**: (a) a note whose fields are not text; (b) a Save stopped while
  storage refused an edit; (c) Save as a new file on a board this browser writes; (d) that new file refused; (e) a state that is a
  list; (f) Full Fund's first Save over a file that holds O&M alone (and its fixture, CONTROL); (g) the file route's
  `fhLegacyRelease`; (h) the writer key refused throughout the route; (i) Write failing into this board's own file; (j) a v2.09
  file's report; (k) the shared folder's refusal wording; (l) Save diagnostics' board share; (m) the ▾ beside Save.
- audit-inject **"W3-1 the file route’s other sinks draw file names as text"**: every sink a CONTROL on the slot commit but the note
  whose fields are not text, which fails there.

Changed on purpose (`// v2.15 W3:` in each):
- audit-board, v2.14 W4's journal panel check: `JRNL_NOT_WHOLE`'s new wording.
- audit-board, v2.14 W3's "after a downloaded copy" check: the `_dlOnly` question's new wording.
- audit-import, `W214.refuse()`: no hand reset of the marks.
- `tools/import-file.mjs`: `bytes()` for `lens()`.
- `tools/save-target.mjs`: `seam()` in E.
- `tools/standards-check.mjs`: the long warning carries a link button.
- `tools/left-menu.mjs`: `fhSaveNew: 1, fhRepick: 1` in WANT, and its count 71 → 73.
- audit-board v1.96: Save’s ▾ 3 items, and the File menu's calls with `fhSaveNew`, `fhRepick`; audit-other: the board's ddSave CONTROL.
- audit-import, the W3 block (n) (added after savetarget C found the writer leak) and (e2) (the hold half).

## Mutations
41 new (`v215-w3-*`, `v215-w3-cancel-keeps-writer` and `v215-w3-rec-blocked-own-copy` among them) and 26 retargeted; `recovery/v215/proofs-W3.json` names each one's check, `proved-W3.jsonl` holds the
verdicts (see the report below). Retargeted, each to the line that now carries the same defect:
`guard-not-a-board-writes`, `unsaved-flag-never-set`, `impmixed-not-kept`, `menu-grp-not-kept`, `v199-batch-no-mark`,
`v200-u19-putback-refused-no-restore`, `v200-u19-putback-restore-unsaved-only`, `v200-u19-putback-refused-words-swap`,
`v209-w3-board-save-keeps-handle`, `v209-rv-save-board-moved-handle-kept`, `v214-w2-lift-leaves-copies`,
`v214-rv1-a-held-record-written`, `v214-rv1-c-stop-no-persist`, `v214-rv1-c-stop-persists-over-tab`, `v214-rv1-c-stop-after-unset`,
`v214-w3-dl-no-question`, `v214-w2-no-readback`, `v214-w2-readback-length`, `v214-w2-writer-unclaimed`, `v214-rv2-a-aw-not-held`,
`v214-w4-pull-keeps-nothing-saved`, `v214-w1-picked-denied-kept`, `v214-w1-cancel-pen-moved`, `v214-w1-later-unremembered`,
`v214-rv1-c-stop-later-skipped`, `v214-rv1-c-stop-denied-skipped`. None retired.
- `v214-rv1-a-held-record-written` (the hold's half of baseSet's guard) SURVIVED its own v2.14 RV1-A check on the first run: a held
  page's refused plan sets `_persistFail`, so the new guard covered it there. It is proved against the W3 block's (e2), a held page that
  has written nothing yet (a CONTROL on the slot commit).
- `menu-grp-not-kept`'s own check (audit-board v1.96 menus) had moved with Save's ▾ (1 item → 3); the expectation was moved
  (`// v2.15 W3:`), and so were audit-board v1.96 "what the File menu held" and audit-other's ddSave CONTROL.

## For the integration
1. **`cycCarrySaved` (W2's)**: its record write `localStorage.setItem(key, JSON.stringify(Object.assign(b, {file:wrote,
   dirty:false})))` should go through `lsSet(key, …, 'This browser’s record of the '+_SLUGMAP[k].t+' plan', {own:true})` (a clean
   mark: refused, nothing on screen only, as `baseSet`'s clean mark), keeping its `return` on a refusal. W2 may already rewrite it
   for item 143.
2. **`cycApplyAll` (the lead's)**: remove the dead `if(res.back) _sideGen=g0;` — `lsAll`'s `lsMarksBack` has already put `_sideGen`
   back to the value `g0` read just before (tests 2). No mutation aims at it.
3. The boot's `_impOpen` keeps a changed plan aside with a direct write to `<key>.kept` (`keepLeft`, v2.14 W2's); it is not
   `keepAside` and was left. Route it through `lsSet` with `{own:true, lose:true}` if the lead wants every `.kept` write counted.
4. `apPut`'s record write (v2.14 RV1-B, `localStorage.setItem(bkey, …)`) is another direct record write outside contract §1.3's list;
   left as found.

## npm script to add
None.

## Known gaps
- `SIDE_OPEN_KEY`'s refusal has no check: it is written only while an older file opens, and the harness cannot refuse that write
  without refusing the opening's others. Its write is one line, read in review.
- `importState`'s "reopen only when the plan landed" for the populated board (no `_e2`) cannot be reached from the harness
  (`IS_SHELL` is true for every board booted there; CLAUDE.md's v1.44 note); the refused-appropriation half is checked.
- A Save stopped while storage refuses the plan, where a later `save()` of this page did land (storage holds a newer copy with the
  pen line, not `raw1`), still leaves that line; only the case storage still holds `raw1` is put back.
- `.nb.lnk`'s edge is checked in Chromium only (`npm run standards`); no jsdom mutation aims at the CSS.
- A refused stopped-import mark makes leaving ask, but a refused import already makes it ask through `_lsRefused`; no fixture makes
  the mark the only reason, so `lose:true` there has no mutation.
- `impFileRescued`'s new `own` term has no mutation that bites: the other two rescues are not yet downloaded in the check either.

## Results (on the final tree)
- **Proofs**: all 67 (41 new, 26 retargeted) CAUGHT against their own checks on the final board, none by a block that threw
  (`proved-W3.jsonl`). The first round's file is not kept: two came out without a verdict there (above), and the board changed after.
- **Fails on the slot commit**: the two W3 audit-import blocks, slimmed and run with `BOARD=` the slot board: 27 failing checks, every
  one a check this file lists as failing there; the CONTROLs pass. audit-inject's W3-1: on the slot board only its note-fields check
  fails. `npm run standards --board <slot>`: 5 NEW 1.4.11 findings (the `.nb.lnk` edge); on this board, nothing new.
- **Whole suites** (each through heavy.sh): audit-board, audit-import (re-run on the final board), audit-recon, audit-other,
  audit-hostile, audit-inject, audit-ui, audit.mjs — ALL CHECKS PASSED; legacy-fsrc — "every legacy Force setting computes exactly as
  before"; boot-same — "every page, source, save and error list is identical either way". audit-recon, -other, -hostile, -inject, -ui,
  audit.mjs, legacy and boot-same ran on the tree before the last two board changes (the writer put back at a stop; the record held
  back only over another tab's plan), which touch the Save path alone.
- **Browser**: leftmenu, menus, savetarget (re-run after the writer fix), fileimport, storagefull, keys (re-run on the final board),
  panels, dialogs, standards — all pass. layout was not run (not touched).
- `npm run check`: all checks passed. mcount: every target matches once.
