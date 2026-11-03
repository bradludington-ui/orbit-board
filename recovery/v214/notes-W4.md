# v2.14 W4 — the held findings (items 129, 124; ledger U63, U64, U35)

Builder W4, branch `v214-w4`, from the slot commit `ea412ca`. Contract §8 decides; map.md › held is the reference
(`proto/held-sketch.diff`). Stage 1 built the board change, the checks and the mutations (`33550c0`); stage 2 finished the checks
the map lists that stage 1 had left out, proved every mutation and retarget, and ran the suites and browser checks whole.

## Reproduced on the slot commit (stage 1, step 1)

The slot's board (`git show ea412ca:prioritization-board-grid.html`), with the map's repro scripts copied to the scratch
folder (their `boot.mjs` import pointed at this worktree, the two-tab skeptics' `BOARDS` at `BOARD`). Every finding still
reproduces, exactly as the map records for v2.13:

- **Two tabs** (`recovery/v209/held/two-tabs/skeptic/k2-jsdom.mjs`): after tab 1 types ANN-2 the record reads
  `{"file":<Kim's F1>,"dirty":false}` while tab 1's LASTKNOWN is F0. Variant A: opening Kim's F2 shows R2 null, nothing kept
  (the kept slot holds only ANN-1), ANN-2 only in `prio27om`. Variant B: reopening F1 and Save asks only the writer question,
  no HOLD ON, and writes ANN-2 over Kim's file (R3 null). Control (tab 1's own Save): HOLD ON asked.
  `k3-copy.mjs`: the same under `prio27om-pmo<ts>` (record `{"file":…,"dirty":false}` after tab 1 typed; ANN-2 only in the
  copy's key).
- **Years** (`recovery/v209/held/years/js/t1,t2,t3,t5` and the skeptics' `sk1`, `sk3-variant`, `sk.mjs`, `repro.mjs`):
  t1 "1 copy created across FY30 · 1 already there and left alone", FY30 holds Alpha only; naFromHere shows Bravo here.
  t2: Bravo's rows "FY29 ALREADY HOLDS NEW-1 — accepting adds it again" (NEW-1 is Alpha). t3: the duplicate question,
  Cancel, FY30 holds Alpha only. t5: FY31 holds Delta twice (NEW-1 and NEW-2), review flags nothing. sk1: Copy to year asks
  about NEW-1 (Alpha's copy) and then makes NEW-2. sk apply / handroll / other-new1: FY30 holds Gamma twice, nothing flagged
  (other-new1 is the map's CONTROL; on v2.13 it shows the same doubled Gamma because nothing is flagged at all).
  chain existing: both Bravo rows flagged "ALREADY HOLDS NEW-1" with `namedIs` Alpha.
- **Item 124 Put back** (`proto/held-124-putback2.mjs`): fields journalled at `["custom",0]`, `["custom",1]`; after deleting
  NEW-1, Put back of Y's 200 lands on NEW-3 (`[["NEW-2",250],["NEW-3",200]]`); Put back of the deleted Z's value leaves
  `{ask,fy26}` with no id in `S.custom`, and the next edit saves it. `held-124-putback.mjs` throws inside applyState.
  `held-124-addline.mjs`: Put back of the added line throws and leaves `S.custom` as `[null]`.
- **SI** (`proto/held-124-si.mjs`): in the PP copy `S.si {"A":""}`; Submit says "Nothing to send yet."
- **U63** (`proto/held-u63.mjs`): after the quiet pull the screen is Bob's F, nothing kept; the next file Save asks nothing;
  S1 is in no copy.
- **U64** (`proto/held-u64.mjs`): Put this back keeps nothing (kept null), status says "press 💾 Save to write it back to the
  folder for everyone" while `driveStoreOn()` is false; Save asks nothing; S1 is in no copy.
- **U35** (`proto/held-u35.mjs`, `held-u35b.mjs`): 88888 typed, one redraw: the field shows 11111, Esc would not ask; after a
  load that adds a row above the typing is gone; a load that removes the row says nothing.

## What was built

In `prioritization-board-grid.html`, map.md › held › Functions 1–30, with C17's blank mark, starting from `proto/held-sketch.diff`
(applied cleanly to the slot board) and finished by hand where the sketch stopped (stage 1, `33550c0`; stage 2 changed no board line):

- **Item 129, two tabs:** `baseMarkDirty()` above `loadCounted`, the one record writer (C1): reads the record fresh, names LASTKNOWN,
  `_driveBase` (in a try) and the blank mark (`const bl=pageBlankNow()===true;`, `(b.blank===true)!==bl` among the conditions,
  `blank:bl` always written). `loadCounted`, `save()` and `driveRestore` go through it.
- **Item 129, the twin rule, the chain walk, the rolled requirement:** `pmoStampApart`, `pmoLinkApart`, `pmoChainApart`, `yrCopySame`
  (design B's text and comments, placed above the `pmoProvId` comment); `yearHas`, `yearLinkOf` (with `me`), `naFromHere`,
  `pmoPriorHere` (the chain stamp and the rolled direct hit), each with a v2.14 comment.
- **Item 124, Put back by id:** `jrnlWalk`'s by-id branch, `jrnlById`, `jrnlCustomPlace`, `jrnlCustomHere`, `jrnlSet`'s by-id walk and
  refusal, `jrnlUndoable`'s line, the gone-requirement refusal in `jrnlUndo` (see Decided), and the journal panel's
  "not put back here" cell with its two titles (`JRNL_NOT_WHOLE`, `JRNL_NOT_PLACE`).
- **Item 124, "no SI code":** `pmoVal`, `pmoNorm`, `pmoFmtVal` (both words, and the proposal line in `'__new'`), `pmoProposalOf`
  (`siNone`), `pmoTake`, `pmoAcceptProposal`.
- **U63 / U64:** `keepAside` (`meta.saved`), `keptOccupiedMsg` (`inFile`), `saveStateShow`'s kept-button title, `driveStorePull` and
  `driveRestore` (U19's keep rule, the in-file occupied refusal, the saved-work no-room sentences, the loaded/put-back sentences, and
  Put this back naming where 💾 Save writes).
- **U35:** `rcnBody` / `rcnDraw` split, rows drawn with `data-rk` and fields with `data-rf`, `inspHeld` carrying rk/rf/dp,
  `inspHeldBack` through `inspHeldSame`, `heldRedraw`, and the RCN input listener on its own line.

Proved by hand on the W4 board with the same repro scripts: every finding above is gone (k2: the record names F0 and stays dirty,
variant A keeps ANN-2 on screen with the occupied refusal, variant B asks HOLD ON; k3 the same under the copy's key; t1 "2 copies
created"; t2/t3 no false ALREADY HOLDS and Bravo reaches FY30; t5 flagged and FY31 holds Delta once on Cancel; putback2 lands on Y and
refuses a gone Z; addline not offered; SI sent; U63/U64 kept aside with the words; U35 held, by row, and said when the row is gone).

**Stage 2 (tests only):** check 4 now reads the change report's cells from the workbook's own bytes (map check 4 (c)); check 5 gained
U63 (f) and U64 (d), the map's two CONTROL parts stage 1 had left out, and its two `keptOf(…)[0]` reads became null-safe so a missing
kept copy is a failing check, not a throw that skips every part after it. `proofs-W4.json`: `restore-own-stale` now names check 5 (see
Mutations).

## Decided in the build

- **The gone-requirement refusal sits ahead of `jrnlUndo`'s `cycBlock` line**, not after the `jrnlUndoable` line as map Functions 14
  says: two v2.00 finds (`v200-u10-journal-gate-after-question`, `v200-u10-journal-putback-sync-only`) span from the `cycBlock` line
  through the confirm, so a line inserted between them left both matching nothing (the sketch did not include this edit, so the map's
  mcount on it could not see it). It reads the line itself, is skipped in a locked view (`!CYCVIEW`, so the lock still refuses
  first) and for any line `jrnlUndoable` refuses (those keep today's words). It still refuses before asking anything.
  `v214-w4-jrnl-gone-silent`'s find is on that line (`g.p[0]==='custom' && jrnlUndoable(g) && !jrnlCustomHere(g)){`).
- **The "lost typing" sentence is said only while the RCN / EEIC box is open** (`if(lost.length && rcnOpen)`): closing the box after a
  discard (Esc or ✕, which the box controller asks about) would otherwise report the discarded field as "not kept". `rcn-lost-silent`'s
  find follows (`  if(lost.length && rcnOpen) setStat(` → `  if(false && rcnOpen) setStat(`).
- **The no-room sentences for saved work are separate lines** (`if(ka!==true && !own){ … }`) ahead of each function's existing no-room
  block, so `restore-keep-refusal-ignored` keeps matching its block byte for byte.
- **driveRestore's U64 comment sits above the `const own=` line**, so `restore-own-stale`'s retarget find (`const own=…;\n    const keep=own`)
  matches.
- A year whose added requirements repeat an id is journalled by place; its lines carry `JRNL_NOT_PLACE`'s title ("Recorded before
  v2.14 by its place …"), which is exact for old lines and loose for such a year (map design C gives only the two titles).
- Check 4 sends B "back to the rules" by deleting its stored none (`delete S.si.B; save()`), as the map's repro does: the edit box
  offers "— follows the PMO and prime rules —" only where no code is stored, so a stored none cannot be taken back there. D's CONTROL
  is LA → AT (not EN, which the PMO rules give PP anyway: `setSi` stores nothing for it).
- Check 1 (e) has Kim save from a browser holding the same writer key as Ann's, so the folder Save reaches the base check instead of
  being refused as another writer's; and the folder fixtures start from the folder's own copy (`driveBaseSet(mySlug(), +MS.ts)`), as
  the re-based U63 fixtures do.
- **Stage 2: `restore-own-stale` is proved by check 5's U64 (d), not by NR01's block.** With `own` forced false, the work typed during
  the history write is still kept aside under U19's rule (its stamp is not the folder's), so every NR01 check (`/kept aside/`, the
  note in the kept copy) still passes; only the words and the `saved` mark tell the two kinds apart. U64 (d) asserts both: "What was
  on screen, in no saved copy, is kept aside", no "saved only in the board file", and `meta.saved` absent. That is what map check 5
  (d) was written for.
- **Stage 2: U63 (f) reopens the page** before the pull: in the same tab the pull refuses outright on this session's `DIRTY` ("you have
  unsaved changes"), so unsaved work reaches the keep only as a reopened page's record (`ownUnsaved`), which is the route the keep exists
  for.

## Checks

Each new block passes on the W4 board and fails on the slot's board (`git show ea412ca:…`), slimmed (`slim.py`):

| Block (suite) | W4 board | slot board |
|---|---|---|
| `v2.14 W4 — two tabs: …` (audit-import) — (a)–(g) | pass | 10 failing: (a), (b), (c), (c2), (d) ×2, (e), (g) ×2, errors |
| `v2.14 W4 — two copies out at once: …` (audit-import) — (a)–(g) | pass | 9 failing: (a), (b), (c), (d) ×2, (e), and the block throws at (f) (no `pmoStampApart`) |
| `v2.14 W4 — a hand-chosen “no SI code” …` (audit-import) — (a)–(d), (f) | pass | 9 failing: (a), (b), (c) the review ×3, (c) the change report ×2 (stage 2), (d) ×2 |
| `v2.14 W4 — a shared-folder copy that replaces work saved only in the board file …` (audit-import) — U63 (a)–(f), U64 (a)–(e) | pass | 11 failing: U63 (a) ×3, (b) ×2, (c), (d); U64 (a) ×2, (b), (e). The CONTROLs U63 (e), (f), U64 (c), (d) pass there |
| `v2.14 W4 — Put back finds an added requirement by its id …` (audit-board) — (a)–(h) | pass | (a), (b), (c), (d), (e), (g), then the block throws |
| `v2.14 W4 — the RCN / EEIC list keeps what is typed across a redraw …` (audit-board) — (1)–(8) | pass | (1) ×3, (2), (3) ×3, (4) ×3, (5) ×3, (7) |

CONTROL parts (pass on both): check 1 (f) and the fixtures' "(a CONTROL)" lines; check 2 (f) (stamp rule) and (g); check 4's D (LA →
AT) and (f) (a v2.13 proposal accepted as following the rules); check 5 U63 (e), (f), U64 (c), (d); check 3 (f); check 6 (8).

**Stage 2 added** (each run on the W4 board and on the slot's board, as above):
- check 4 (c), **the change report**: `pmoReport()`'s workbook captured from the Blob and read back with `xlsxRead`; each Navy SI code row's
  "On the board now" and "Proposed" cells by requirement (A rules → none, B none → rules, C OT → none), and the proposal row's Proposed
  cell naming "Navy SI code none (chosen by hand)". Fails on the slot commit (2 checks).
- check 5 U63 (f) **CONTROL**: Alice saves S1, types S2 and does not save; Bob saves F to the folder; Alice's page is reopened from her
  browser (S2 on screen, not this session's DIRTY); a quiet refresh loads F and keeps S2 aside, `meta.saved` absent, with "This browser
  held work no saved copy had; it is kept aside". Passes on the slot commit.
- check 5 U64 (d) **CONTROL** (NR01's route): an edit typed while Put this back keeps the folder's copy in the history is kept aside as work
  in no saved copy, `meta.saved` absent, with "What was on screen, in no saved copy, is kept aside" and not "saved only in the board
  file". Passes on the slot commit; catches `restore-own-stale`.

Check 6 (8)'s second half (the RECORD panel's F2 and "redraw holds") is the existing blocks, unchanged, run whole below.

**Existing checks moved, each with its `// v2.14` comment** (all five blocks pass on the W4 board, whole suites below):
- audit-board "v1.97 W4 — a figure journalled before the list changed …": looks up `'custom.'+id+'.ask.0'`.
- audit-import "v2.09 review — Apply into a year it starts …": the accepted requirement's add line is `['custom', nid]` and not offered;
  its description and impact statement still are.
- audit-import "v2.09 review — a link to another of the office’s proposals …": the Put back path is `['custom', <Q's FY31 id>, 'prior', 'id']`.
- U63's 18 (map check 8): "v2.00 (U13) — a refresh during a save loads nothing" -- one line in its `brad()` fixture starts Brad's screen
  as the folder's own copy (`driveBaseSet(mySlug(), +MS.ts||0)` before `driveAutoConnect()`), which clears all 16 of its failures
  ((1) ×2, (3a), (3b), (4a)–(4d), (5) Ca, (5) Cc, (6b) and their follow-ons); "v1.89 — saving never silently overwrites somebody’s
  work" -- the colleague's tab Q starts as the folder's own copy the same way ("folder, the other side"); "v2.00 (U30)" (5d) -- its
  expectation changes: what was on screen is kept aside as saved work (`['folder', true]`), exactly the newly kept case.

**`tools/keyboard-reach.mjs` section W** (map check 7): on the W4 board every section passes (W's five lines ok, 0 FAIL); on the slot's
board W fails 3 (the field reads `98888` after the redraws, Tab commits that, and Esc after a redraw asks nothing and the box closes
with `222227` stored) and the tool exits 1. Run by `node tools/keyboard-reach.mjs [--board FILE]` (it is in `npm run keys`).

`math-defects.json`: `put-back-lands-on-the-next-added-requirement` (check 3; `v214-w4-jrnl-by-place`, `-jrnlset-gone`) and
`roll-forward-skips-or-doubles-a-continuation` (check 2; `v214-w4-twin-yearhas`, `-rolled-hit`), each written as the person saw it.

### Runs (stage 2, on the W4 board, one jsdom suite at a time; durations wall-clock on this 4-core box)

| Command | Duration | Exit | Result |
|---|---|---|---|
| `python3 -I -B recovery/v200/bin/mkmut.py …` + `node tools/check.mjs <mutant>`, all 47 | ~3 min | 0 | 47/47 built (each find once), 47/47 `ok    main script parses` |
| `JOBS=1 HEAP=8192 python3 -I -B recovery/v208/bin/prove.py recovery/v214/proofs-W4.json recovery/v214/proved-W4.jsonl <12 board ids>` | ~4.5 min | 0 | both blocks clean; 12/12 CAUGHT |
| `JOBS=1 HEAP=8192 python3 -I -B recovery/v208/bin/prove.py recovery/v214/proofs-W4.json recovery/v214/proved-W4.jsonl` (the other 35) | ~10 min | 0 | 7 blocks clean; 35/35 CAUGHT |
| `npm run keys` (keyboard-reach, section W included) | 99 s | 0 | 175 ok, 0 FAIL |
| `npm run editors` | 53 s | 0 | 44 ok, 0 FAIL |
| `npm run dialogs` | 242 s | 0 | every box takes the keyboard, keeps it, gives it back, and asks before typing is lost |
| `npm run panels` | 13 s | 0 | 267 ok, 0 FAIL |
| `npm run pointer` | 235 s | 0 | 309 ok, 0 FAIL |
| `npm run menus` | 5 s | 0 | 84 ok, 0 FAIL (the new sentences' menu paths) |
| `npm run controls` | 4 s | 0 | every recorded control present, nothing unrecorded |
| `npm run pmosave` | 41 s | 0 | 76 ok, 0 FAIL |
| `node tools/standards-check.mjs` | 59 s | 0 | conformance holds: 0 known findings, nothing new |
| `node tools/hostile-render.mjs` | 33 s | 0 | nothing a file can carry runs when the board draws it |
| `node tools/export-audit/boot-same.mjs` | 6 s | 0 | every page, source, save and error list identical either way |
| `node tools/export-audit/audit-board.mjs` (8 GB) | 294 s | 0 | ALL CHECKS PASSED |
| `node tools/export-audit/audit-import.mjs` (8 GB) | 1,081 s | 0 | ALL CHECKS PASSED |
| `node tools/export-audit/audit-inject.mjs` | 9 s | 0 | ALL CHECKS PASSED |
| `node tools/export-audit/audit-hostile.mjs` | 55 s | 0 | ALL CHECKS PASSED |
| `node tools/export-audit/audit-other.mjs` | 150 s | 0 | ALL CHECKS PASSED |
| `node tools/export-audit/audit-recon.mjs` (8 GB) | 858 s | 0 | ALL CHECKS PASSED |
| `node tools/export-audit/audit.mjs` | 8 s | 0 | ALL CHECKS PASSED |
| `node tools/export-audit/legacy-fsrc.mjs` | 3 s | 0 | every legacy Force setting computes exactly as before |
| `node tools/export-audit/audit-ui.mjs` | 70 s | 0 | ALL CHECKS PASSED |
| `npm run fuzz` (1) | 14 s | 0 | seed 964217746: nothing was lost, 3 randomized boards |
| `npm run fuzz` (2) | 14 s | 0 | seed 868794620: nothing was lost, 3 randomized boards |
| `npm run check` | 3 s | 0 | all checks passed |
| `python3 -I -B recovery/v200/bin/mcount.py tools/export-audit/mutate.mjs prioritization-board-grid.html` | 5 s | 0 | 3260 entries, 3260 once (3220 + 40), none missing, none multiple |
| `npm run defects` | <1 s | 0 | REGISTER HOLDS: 15 known, 15 guarded by 47 mutations |

No suite died (no exit 134/137), so none was rerun. Every suite and browser check ran after stage 2's last suite edit and on the
board as committed in `33550c0` (stage 2 changed no board line).

## Mutations

40 new (`v214-w4-*`, in the W4 slot of `mutate.mjs`, ids single-quoted) and 7 retargeted in place, each with a `// v2.14 W4` comment.
`mcount`: 3260 entries, 3260 once (3220 at the slot + 40). No retirement.

Finds that differ from map.md's text, each the same defect: `base-file-kept`, `base-folder-kept` (C17's `blank:bl` in the record);
`base-blank-sticky` (find `dirty:true, blank:bl};`), `base-blank-ignored` (find `const bl=pageBlankNow()===true;`); `jrnl-whole-offered`,
`jrnl-old-place-offered` (find `(e.p.length<3 || typeof e.p[1]!=='string')`); `jrnl-gone-silent` (moved, see Decided);
`kept-saved-unmarked` (the line now carries a trailing comment, so the find is the statement and the repl four spaces);
`rcn-lost-silent` (`&& rcnOpen`, see Decided).

**Every mutant parses.** All 47 were built with `recovery/v200/bin/mkmut.py` (each find matching once) and `node tools/check.mjs <mutant>`
printed `ok    main script parses` for every one (47/47).

**Proofs:** `JOBS=1 HEAP=8192 python3 -I -B recovery/v208/bin/prove.py recovery/v214/proofs-W4.json recovery/v214/proved-W4.jsonl`, in
two runs (the 12 audit-board ids first, ~4.5 min; then the 35 audit-import ids, ~10 min, after stage 2's check edits, so the slims are
the final suite). Every check named was clean on the unmutated board first. **47 of 47 CAUGHT, none SURVIVED, none CRASHED, none NOT
APPLIED.** One catch carries a throw beside its checks: `v214-w4-jrnlset-gone` (3 failing: "(c) gone · jrnlSet refuses …" got
`[true,false]`, "(e) the panel" got 2, and the block then threw) -- caught by two checks, not by the throw alone.

| Mutation | Check (block) | Failing checks |
|---|---|---|
| `v214-w4-base-cache` | two tabs | 8 |
| `v214-w4-base-file-kept` | two tabs | 5 |
| `v214-w4-base-folder-kept` | two tabs | 1 |
| `v214-w4-base-file-unread` | two tabs | 2 |
| `v214-w4-base-blank-sticky` | two tabs | 2 |
| `v214-w4-base-blank-ignored` | two tabs | 1 |
| `v214-w4-twin-yearhas` | two copies | 2 |
| `v214-w4-twin-linkof` | two copies | 3 |
| `v214-w4-linkof-self-other-year` | two copies | 1 |
| `v214-w4-twin-nafrom` | two copies | 1 |
| `v214-w4-chain-stamp` | two copies | 2 |
| `v214-w4-stamp-pub-blind` | two copies | 7 |
| `v214-w4-stamp-unknown-apart` | two copies | 1 |
| `v214-w4-rolled-hit` | two copies | 2 |
| `v214-w4-rolled-any` | two copies | 1 |
| `v214-w4-jrnl-by-place` | Put back finds (board) | 7 |
| `v214-w4-jrnl-ids-dup` | Put back finds (board) | 1 |
| `v214-w4-jrnlset-gone` | Put back finds (board) | 3 (and the block threw) |
| `v214-w4-jrnl-whole-offered` | Put back finds (board) | 2 |
| `v214-w4-jrnl-old-place-offered` | Put back finds (board) | 3 |
| `v214-w4-jrnl-gone-silent` | Put back finds (board) | 2 |
| `v214-w4-si-none-absent` | a hand-chosen “no SI code” | 6 |
| `v214-w4-si-door-refused` | a hand-chosen “no SI code” | 5 |
| `v214-w4-si-fmt-none` | a hand-chosen “no SI code” | 2 |
| `v214-w4-si-fmt-rules` | a hand-chosen “no SI code” | 3 |
| `v214-w4-si-proposal-unsent` | a hand-chosen “no SI code” | 4 |
| `v214-w4-si-proposal-unaccepted` | a hand-chosen “no SI code” | 1 |
| `v214-w4-si-proposal-unshown` | a hand-chosen “no SI code” | 2 |
| `v214-w4-pull-keeps-nothing-saved` | a shared-folder copy | 7 |
| `v214-w4-pull-not-said` | a shared-folder copy | 1 |
| `v214-w4-pull-occupied-words` | a shared-folder copy | 1 |
| `v214-w4-kept-saved-unmarked` | a shared-folder copy | 3 |
| `v214-w4-restore-keeps-nothing-saved` | a shared-folder copy | 3 |
| `v214-w4-restore-says-folder` | a shared-folder copy | 1 |
| `v214-w4-rcn-not-marked` | the RCN / EEIC list (board) | 14 |
| `v214-w4-rcn-no-hold` | the RCN / EEIC list (board) | 14 |
| `v214-w4-rcn-by-place` | the RCN / EEIC list (board) | 8 |
| `v214-w4-rcn-dlgpend` | the RCN / EEIC list (board) | 3 |
| `v214-w4-rcn-lost-silent` | the RCN / EEIC list (board) | 1 |
| `v214-w4-rcn-change-in-draw` | the RCN / EEIC list (board) | 1 |
| `unsaved-flag-never-set` (retarget) | two tabs | 13 |
| `v202-e7-u24-load-uncounted` (retarget) | v2.02 (E7, U24, U29, U31) — a load is counted as a change | 7 |
| `v202-e7-u24-load-session-only` (retarget) | v2.02 (E7, U24, U29, U31) — a load is counted as a change | 6 |
| `v200-r5-restore-gen` (retarget) | v2.00 (R5) — a restore during a save stays unsaved | 4 |
| `v200-r5-restore-basedirty` (retarget) | v2.00 (R5) — a restore during a save stays unsaved | 1 |
| `restore-no-keep-aside` (retarget) | v1.95 — ↶ Put this back keeps unsaved work aside first | 2 |
| `restore-own-stale` (retarget) | a shared-folder copy (U64 (d)) | 2 |

The records are `recovery/v214/proved-W4.jsonl` (one line each, `git add -f`). `caughtBy` in `proofs-W4.json` names the block that caught
each; stage 1's reading held for the other six retargets, and `restore-own-stale` moved from NR01's block to check 5 (see Decided).
`v214-w4-base-blank-*` are re-proved by the lead in INT-3 (§11.5) as well.

## For the integration

- **W1:** `baseMarkDirty` writes `blank` from `pageBlankNow()` (the stub returns false until W1 fills it). Check 1 (g) stands
  `pageBlankNow` in by assignment (`pageBlankNow=function(){…}` in the page), so it does not depend on W1's body.
- **W1's first-Save change** may move check 1 (c)/(c2) and check 5 (U63 (b)), which save through W1H's `disk()` stand-in (FH set,
  `showSaveFilePicker` throwing): C16's sweep should look at them. Check 5 U63 (f) also saves through `disk()` (`saveInPlaceFile()`).
- **One kept slot (§12 Q4):** U63/U64 keep saved work aside, so any fixture that loads a folder copy over a board file now fills the kept
  slot. The re-bases above are the ones audit-import met; a new block that loads a folder copy should start from the folder's own copy
  (`driveBaseSet(mySlug(), +MS.ts||0)`).
- **Placement:** the "that added requirement is no longer in FY…" refusal sits ahead of `jrnlUndo`'s `cycBlock` line (see Decided), not
  where map Functions 14 puts it; the two v2.00 finds that span that line still match once.
- **D28 for the ship notes:** an ORBIT older than v2.14 open on the same browser should not put back a line v2.14 journalled by id
  (`['custom','NEW-2', …]`): v2.13's `jrnlSet` walks a string into the list, reports it put back, and changes nothing.
- The journal now names added requirements by id, so `cycWho` and `pmoOutChanged` see their edits (map design C's side effect).
- No seam line was edited.

## npm script to add

None (keyboard-reach is an existing tool; section W is run by `npm run keys`).

## Known gaps

- C10 / D22: driveStorePull's shell branch reopens whether or not `persist()` landed (storage-full's recommendation, not built).
  Nothing is lost there: the folder keeps its copy.
- A year whose added requirements repeat an id is journalled by place, and its lines show `JRNL_NOT_PLACE`'s title ("Recorded before
  v2.14 …"), which is loose for such a year (the map gives only the two titles).
- In check 4, B is sent back to the rules by deleting its stored none in the page (`delete S.si.B; save()`), not through a control: the
  edit box offers "follows the rules" only where no code is stored (see Decided).
