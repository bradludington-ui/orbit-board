# v2.14 W4 — the held findings (items 129, 124; ledger U63, U64, U35)

Builder W4, branch `v214-w4`, from the slot commit `ea412ca`. Contract §8 decides; map.md › held is the reference
(`proto/held-sketch.diff`).

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
(applied cleanly to the slot board) and finished by hand where the sketch stopped:

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

## Checks

Each new block was run alone (`slim.py`) on the W4 board (all pass) and on the slot's board (`git show ea412ca:…`), where each fails:

| Block (suite) | W4 board | slot board |
|---|---|---|
| `v2.14 W4 — two tabs: …` (audit-import) — (a)–(g) | pass | 10 failing: (a), (b), (c), (c2), (d) ×2, (e), (g) ×2, errors |
| `v2.14 W4 — two copies out at once: …` (audit-import) — (a)–(g) | pass | 9 failing: (a), (b), (c), (d) ×2, (e), and the block throws at (f) (no `pmoStampApart`) |
| `v2.14 W4 — a hand-chosen “no SI code” …` (audit-import) — (a)–(d), (f) | pass | 7 failing: (a), (b), (c), (d) |
| `v2.14 W4 — a shared-folder copy that replaces work saved only in the board file …` (audit-import) — U63 (a)–(e), U64 (a)–(c), (e) | pass | 4 failing: U63 (a) ×3, then the block throws |
| `v2.14 W4 — Put back finds an added requirement by its id …` (audit-board) — (a)–(h) | pass | (a), (b), (c), (d), (e), (g), then the block throws |
| `v2.14 W4 — the RCN / EEIC list keeps what is typed across a redraw …` (audit-board) — (1)–(8) | pass | (1) ×3, (2), (3) ×3, (4) ×3, (5) ×3, (7) |

CONTROL parts (pass on both): check 1 (f) and the fixtures' "(a CONTROL)" lines; check 2 (f) (stamp rule) and (g); check 4's D (LA →
AT) and (f) (a v2.13 proposal accepted as following the rules); check 5 U63 (e), U64 (c); check 3 (f); check 6 (8).

Not built from the map's lists, for stage 2 or the lead: check 4 reads the review's words through `pmoFmtVal` on the rows and the
`#subBody` text, not `pmoReport`'s workbook cells; check 5 has no U64 (d) (an edit typed during the history write -- NR01's own block
covers that path and is `restore-own-stale`'s catcher); check 6 (8)'s second half (the RECORD panel's F2 and "redraw holds") is the
existing blocks, unchanged.

**Existing checks moved, each with its `// v2.14` comment** (all five blocks pass whole-block on the W4 board, slimmed together):
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

**Spot proofs (stage 2 runs the whole list):** every one of the 47 mutants builds with `mkmut.py` and parses (`check.mjs`'s
"main script parses"). Run against their own block, slimmed: `v214-w4-jrnl-gone-silent` 2 failing, `-rcn-lost-silent` 1,
`-jrnl-whole-offered` 2 (audit-board); `-base-blank-sticky` 2, `-base-file-unread` 2, `-restore-says-folder` 1, `-si-door-refused` 4,
`-stamp-unknown-apart` 1 (audit-import). None is recorded in `proved-W4.jsonl`, which prove.py writes.

**Also run:** `npm run check` (all checks passed), `node tools/export-audit/boot-same.mjs` (identical either way), `npm run defects`
(holds), mcount 3260/3260. **Not run in this stage:** the suites whole, `npm run fuzz` (twice, two seeds), audit-inject whole, and the
other browser checks (`panels`, `dialogs`, `standards`, …) -- stage 2's.

## Mutations

40 new (`v214-w4-*`, in the W4 slot of `mutate.mjs`, ids single-quoted) and 7 retargeted in place, each with a `// v2.14 W4` comment.
`mcount`: 3260 entries, 3260 once (3220 at the slot + 40). The proof list is `recovery/v214/proofs-W4.json` (47 entries). **Not yet
proved** -- stage 2 runs `JOBS=1 HEAP=8192 python3 -I -B recovery/v208/bin/prove.py recovery/v214/proofs-W4.json recovery/v214/proved-W4.jsonl`.
Every mutant should be checked to parse first (`node tools/check.mjs <mutant>`).

Finds that differ from map.md's text, each the same defect: `base-file-kept`, `base-folder-kept` (C17's `blank:bl` in the record);
`base-blank-sticky` (find `dirty:true, blank:bl};`), `base-blank-ignored` (find `const bl=pageBlankNow()===true;`); `jrnl-whole-offered`,
`jrnl-old-place-offered` (find `(e.p.length<3 || typeof e.p[1]!=='string')`); `jrnl-gone-silent` (moved, see Decided);
`kept-saved-unmarked` (the line now carries a trailing comment, so the find is the statement and the repl four spaces);
`rcn-lost-silent` (`&& rcnOpen`, see Decided).

The proofs' `caughtBy` for the 7 retargets is my reading, to be confirmed by the proof run: `unsaved-flag-never-set` → check 1;
`v202-e7-u24-load-*` → "v2.02 (E7, U24, U29, U31) — a load is counted as a change"; `v200-r5-restore-*` → "v2.00 (R5) — a restore during
a save stays unsaved"; `restore-no-keep-aside` → "v1.95 — ↶ Put this back keeps unsaved work aside first"; `restore-own-stale` → "v1.96 —
↶ Put this back never drops an edit typed while the folder is written (NR01)". The 40 new ones name the W4 block their part sits in;
`v214-w4-base-blank-*` are re-proved by the lead in INT-3 (§11.5) as well.

`math-defects.json`: `put-back-lands-on-the-next-added-requirement` (check 3; `v214-w4-jrnl-by-place`, `-jrnlset-gone`) and
`roll-forward-skips-or-doubles-a-continuation` (check 2; `v214-w4-twin-yearhas`, `-rolled-hit`). `npm run defects`: REGISTER HOLDS, 15
known, 15 guarded by 47 mutations.

## For the integration

- **W1:** `baseMarkDirty` writes `blank` from `pageBlankNow()` (the stub returns false until W1 fills it). Check 1 (g) stands
  `pageBlankNow` in by assignment (`pageBlankNow=function(){…}` in the page), so it does not depend on W1's body.
- **W1's first-Save change** may move check 1 (c)/(c2) and check 5 (U63 (b)), which save through W1H's `disk()` stand-in (FH set,
  `showSaveFilePicker` throwing): C16's sweep should look at them.
- **One kept slot (§12 Q4):** U63/U64 keep saved work aside, so any fixture that loads a folder copy over a board file now fills the kept
  slot. The re-bases above are the ones audit-import met; a new block that loads a folder copy should start from the folder's own copy.
- **D28 for the ship notes:** an ORBIT older than v2.14 open on the same browser should not put back a line v2.14 journalled by id
  (`['custom','NEW-2', …]`): v2.13's `jrnlSet` walks a string into the list, reports it put back, and changes nothing.
- The journal now names added requirements by id, so `cycWho` and `pmoOutChanged` see their edits (map design C's side effect).

## npm script to add

None (keyboard-reach is an existing tool; section W is run by `npm run keys`).

## Known gaps

- C10 / D22: driveStorePull's shell branch reopens whether or not `persist()` landed (storage-full's recommendation, not built).
  Nothing is lost there: the folder keeps its copy.
