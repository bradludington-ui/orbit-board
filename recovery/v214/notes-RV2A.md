# v2.14 review round 2 — RV2-A (the file route and Save)

Worktree `/home/user/orbit-wt/v214-rv2a`, branch `v214-rv2a`, from 74a6aec (the merged v2.14 tree with round 1's fixes, the lead's
round-2 fix a2971ba and the empty round-2 slots). Every finding was reproduced on this board, before anything was changed, with the
reviewers' and skeptics' probes copied into `scratchpad/v214rev2/rv2-A/` (`seams/`, `fileroute/`, `journeys/`, `critic/`) and pointed
at this worktree's board (`BOARD=…/v214-rv2a/prioritization-board-grid.html`). Each was run again after the fix.

The checks are seven audit-import blocks in the RV2-A slot, all named `v2.14 RV2-A — …`. Slimmed together on 74a6aec
(`git show 74a6aec:prioritization-board-grid.html`) **31 checks fail**, and no check labelled a CONTROL fails there; on the fixed board
all pass. Mutations: 21 new in mutate.mjs's RV2-A slot (`v214-rv2-a-*`) and 5 older ones retargeted; `proofs-RV2A.json`,
`proved-RV2A.jsonl` (see the end).

## The findings, most severe first

### aswas-pick-not-checked-against-import (data loss) — reproduced, fixed

**Reproduced** with the reviewer's `w1-aswas-into-import.mjs` and `w2-write-over-aswas.mjs`. w1: "the imported file on disk is NEW:
true" → "after the as-it-was step, the imported file holds: the board as it was (OLD)"; the box said "✓ Saved as “new-board.html”";
"anything offering the imported file? false | holds false"; "✕ asked: 0 | leave asks: false". w2: Write into backup.html, "paused?
false", then "backup.html holds the unsaved work now: false | … any storage key holds it: false".

**Fixed** (impFileSaveWas, impFileWriteTo, impFileNameStep, impFileCarryOn, impFileRescued, impFileDrawIn; one name test,
`impFileSameName`, the test Write's name-match pause has always made — trimmed, any case):
- Step 1's file with the imported file's name: the board as it was is written into it as chosen, and then the file imported is held —
  `R.rescue={at, html:null, inc, was:true}`. The box says “X” has the name of the file you are importing, so it may be that file,
  and offers 💾 the file you imported; the message line says the same with the button; ✕ and leaving the page ask until it is
  downloaded (impFileHolds). The box's failure paragraph and Write's "Try again with a new name…" are not drawn for it (nothing was
  tried and nothing failed). Step 1 counts as done: the board as it was is in that file.
- Write's file with the name of the file step 1 saved the board as it was into: the import is written there (the browser has
  already emptied it), the note goes in, and Write pauses before anything is cleared (`R.pause.was`). The box offers 💾 this board as
  it was (`R.rescue.aw`, R.was.html byte for byte), and the file imported too where the name is its as well. **Carry on asks first**
  while the board as it was is not downloaded (D7: saved or explicitly declined before anything is cleared), and so does ✕.
- Decided: the reviewer's shape, the pattern Write's name-match pause (D9) already uses — write as chosen, then hold and offer —
  rather than writing the imported file back into its place (which would have written the import's text into a same-named file
  elsewhere that the person had chosen on purpose).

**Check** (block "step 1’s file and Write’s file are each checked against the other…"): (a) step 1 into the imported file — the
notice, the offer, nothing said to have failed, Write's own words, the message line, leaving asks, ✕ asks with the new wording and
Cancel keeps the box, the download is NEW byte for byte and then nothing is held; (b) Write into step 1's file — paused, nothing
cleared, the offer, Carry on asks and Cancel stays, ✕ asks, the download is the board as it was byte for byte, then Carry on finishes;
(c) Write to a new name (a CONTROL, no pause); (d) the close question (also noticed, below).

### aswas-older-stamp-put-back-missed (data loss) — reproduced, fixed

**Reproduced** with the reviewer's `w3-aswas-older-stamp.mjs` and both skeptics' probes (`probe3`, `probe4`, `sk2` and its CONTROL):
"its stamp older than A’s screen: true", "✓ Saved as “as-it-was.”", "holds B’s put-back work: false", Write enabled, and after
Write the put-back work in no storage key and no file.

**Fixed**, by identity, never by stamp:
- `_persistLast`: the copy of this plan this page holds as its own in browser storage — what storage holds once the opening has
  chosen (the copy it took up, the one it wrote over a copy kept aside, or a saved copy the file opened over), then what persist()
  last wrote. A `var`, set after the boot's "which copy opens" block (one line there, named here as outside my code: the boot), and
  by persist() (one line).
- impFileWasMiss: this plan's stored copy is held by the screen only while it is exactly `_persistLast` (it was `ts <= MS.ts`).
- fullImportPreHtml: where step 1 names this plan's stored copy and not the screen, that copy goes into the as-it-was file whatever
  its clock, as another appropriation's does (skeptic 2's route: A's screen saved, so one file can hold the copy Write clears).
- Case (c) (the screen unsaved AND a put-back copy) is as RV1-A decided: the file keeps the screen, the box names the other as not
  held, and Write waits for "Carry on without a copy of it".

**Check** (block "this plan’s stored copy is held by the screen only while it is this page’s own…"): (a) skeptic 2's route built from
the board's own steps (typed in X, a newer save opened in A keeps it aside, B puts it back, A imports) — the as-it-was file holds the
put-back work, ✓, and after Write it is in a file written; (b) A unsaved plus B's put-back — the box names the O&M plan as not held
and Write waits, storage untouched; (c) a CONTROL — this page's own save, behind the screen (changed in memory since), counts as held;
(d) a CONTROL — the copy this page opened from (an older shape, so not the screen's text), unwritten since, counts as held. (c) and
(d) pass on 74a6aec too; they are what keeps the new rule from holding Write back for this page's own copies.

### leftask-decline-skips-savestopback, impleftask-cancel-leaves-phantom-save, leftask-cancel-skips-saveStopBack (one defect) — reproduced, fixed

**Reproduced** with `seams/p1-leftask-decline.mjs` and `fileroute/c1b.mjs FULL=1`: storage om null → newly stamped, record dirty,
DIRTY false → true, reopened "Opened with this browser’s copy of the board — it has changes made after this file was last saved";
with full storage memOnly true, leave asks, a full import refused.

**Fixed**: `saveStopBack(stop, penLine)` in the impLeftAsk decline branch, as at every other exit after the mark. After: record
unchanged, DIRTY false, stamp unmoved, reopened "📦 Opened with the saved board state"; full storage: memOnly false, leaving does not
ask, imports not refused. Left as found (every exit alike, RV1-C's `mine` rule): with full storage the stored record stays dirty
(the plan was never stored, so it is not "mine"); the reopen rewrites it.

**Check** (block "a Save declined at the question about a copy left…"): (a) storage with room — the stamp, editor, save history,
marks and record as before; every other storage key as before and the O&M plan, where written, under the stamp and history it had;
the reopen says nothing of changes after the save; (b) no room — not unsaved, leaving does not ask, an import is not refused, no save
in the history.

### open-window-program-pick-silently-becomes-save-target (contested; the lead decided to fix) — reproduced, fixed

**Reproduced** with `journeys/p5.mjs kit`: save1 "Saved in place … “ORBIT v2.14 candidate.html” now carries this state … You are now
this board’s writer", program intact false, board file has edit false; every later Save to the program; the board file fresh: titles {}.

**Fixed** (_saveInPlaceFileRun, after `bare` is known): a page opened from a board file (`PUB_FILE_TS>0 || LASTKNOWN>0`) that picks
in the Open window a bare ORBIT program not bearing its own file name (`fhOwnName()`) writes nothing, remembers nothing (FH null, the
page's handle forgotten), claims no pen, and says “X” is the ORBIT program with no board in it, not this board’s file “Y”, so it was
not written over; press 💾 Save again and pick “Y”. The program's own page, and a program bearing this page's file name, are left to
item 141 D as before. Decided: refused like the PMO-copy pick (the lead's decision), not asked (skeptic 2's suggestion).

**Check** (block "a page opened from a board file never writes its board into the bare ORBIT program…"): (a) nothing written, write
access never asked (`ops ['read']`), nothing remembered, both files named, no pen claimed; the next Save opens the Open window again
and the board file picked is written and remembered; (b) a CONTROL — the program's own page writes the program it ran in.

### opening-kept-copy-says-file-saved-after-it (minor; the hint half refuted by a skeptic) — reproduced, fixed

**Reproduced** with `fileroute/a2b.mjs MODE=putback`: "💾 Save will ask before it writes over the saved file, which unknown saved after it."

**Fixed**: keepLeft's kept meta carries `imp:true` (why stays 'file', so keptWhere and every other reader read it as before), and
keptPutBack says "It changed after the full import was written into its file, so nobody saved that file after it. 💾 Save will ask
before it writes over a copy saved after the one this work came from." (the rule wording RV1-D gave the other two kinds). Save does
ask (the HOLD ON). Left: the History & recovery hint "from before the saved file replaced it" — both skeptics judged it true of this
copy (the import's file did replace it in storage when it opened); unchanged.

**Check** (block "work the import’s own file kept aside is put back saying when it changed…") (a).

### take-all-big-board-dead-end (minor, the critic's) — reproduced, fixed

**Reproduced** with `critic/m3.mjs`: ALL, five questions answered OK, then only "Nothing was imported … browser storage refused the
Initial Spares plan (QuotaExceededError). This board is exactly as it was."

**Fixed** (fullImportUndone's put-back branch): refused for room (`done.why` a quota refusal, not a full import), the alert and the
message line add "Browser storage has no room for it. To bring a whole board in anyway, use Imports & exports › Import a full board
(new version)…: it writes a board browser storage cannot hold into a new board file." Written with `›` so `npm run menus`
checks the path. Not built: the optional room estimate before consTakePick's questions (it would change the take's flow).

**Check** (block "a whole board taken in by Import one appropriation and refused for room…"): refused for room names the way; a
CONTROL refused for another reason (SecurityError) does not.

## Also noticed (reproduced and fixed)

1. **saveStopBack erased a list's marks** (r2b's savedoors finding too): reproduced with r2b's skeptic block — denied and write-failed
   Saves with a cost estimate imported during the wait read "Saved", and, storage having refused it, leaving stopped asking. Fixed:
   when `_sideGen` moved since the mark, only the plan's marks go back; `_sideGen`, `_lsRefused` and `_dlOnly` stay as the change left
   them. Check (block "a list changed while a Save waited…"): denied and write-failed, stored and refused, and a plan edit (a CONTROL).
2. **Blank work put back lost its blank mark** (read in the code by the reviewer): reproduced in the check — keptPutBack's baseSet
   merged into the record of the screen it replaced. Fixed: the mark comes back with it, written true or false, and `_pageBlank`
   follows so the next edit keeps it (one line outside my list: `_pageBlank` is the boot's). Check (block "work the import’s own file
   kept aside…") (b) and (c).
3. **A held page whose stored copy the import cleared did not ask on leaving**: reproduced (w3: "leaving B asks: false"). Fixed in
   memOnlyNow: `DIRTY && impHandKey(_AP.key)` — the hold refuses every write of this page's plan, so its unsaved work is on screen
   only. It also stops switching appropriation and imports on such a page, with memOnlyBlock's message. Check: block "this plan’s
   stored copy…" (a), B held.
4. **impFileCloseAsk said "this copy is all there is of it" of the chosen file**: fixed — the file imported is all there is of it
   only "if “X” was the file you imported"; the new board "is held only here"; the board as it was "if “X” was the file step 1 saved
   it into". The two prefixes older checks read ("The file you imported is not saved yet.", "The two copies are not saved yet.") are
   kept. Check: block "step 1’s file and Write’s file…" (a) and (d).

## Left, and why

- The boot's stray branch keeps work aside with `why:'file'` over a file OLDER than the work, so its put-back also says "which X
  saved after it" (skeptic 1 of opening-kept-copy, also noticed; not reproduced). It is the boot's keep-aside (RV1-C's stray area), not
  the import's kind; the same `imp`-style flag passed through keepAside would fix it.
- With full storage, a declined Save leaves this browser's record dirty (saveStopBack's `mine` rule, the same at every exit).
- The room estimate before consTakePick's questions (the critic's optional fix).

## Existing checks and mutations changed with the behaviour

- audit-import W2 "on an empty board, Import one appropriation takes a board file whole or not at all" (c) refused: the alert, refused
  for room, now ends with the sentence naming the full import (`// v2.14 RV2-A:` there). It was the only existing check the fixes moved.
- The two-copies close question keeps its first sentence, "The two copies are not saved yet.", which W2 (e) reads (the first wording
  had a colon, and prove.py's clean run of W2 caught it: NOT CLEAN, fixed before the proof).
- Retargeted in place, the same defect on the line that now carries it: `v214-w2-marker-after-pause` (the name tests after the note now
  begin with the check against step 1's file), `v214-rv1-a-kept-without-record` (the kept meta also carries `imp`),
  `v214-rv1-c-stop-marks-kept` (the marks go back through the list-aware call), `v214-rv1-a-aswas-screen-traded` (the stored copy is
  also taken where step 1 names it), and `v214-rv1-c-stop-cancel-skipped` lengthened (its find matched the new decline branch too).

## Lines outside the code I own

- The boot (after "which copy opens"): `var _persistLast=null;` and the one read of browser storage that sets it.
- `persist()`: one line, `_persistLast=txt` (the string it writes is now kept in a const).
- `memOnlyNow()`: one condition (a held page with unsaved work).
- keptPutBack: `_pageBlank`, the boot's, is set from the kept record's blank mark.

## Mutations and the proof

21 new in the RV2-A slot, 5 retargeted (above). mcount: 3,530 entries, each found once; every mutant built with mkmut.py passes
`node tools/check.mjs`. `JOBS=1 HEAP=8192 python3 -I -B recovery/v208/bin/prove.py recovery/v214/proofs-RV2A.json
recovery/v214/proved-RV2A.jsonl`: **26 of 26 CAUGHT, each by a failed check, none by a throw** (every block ran clean on the board
first).

| mutation | caught by (audit-import) | failing checks |
|---|---|---|
| `v214-rv2-a-leftask-no-putback` | a Save declined at the question about a copy left | 4 |
| `v214-rv2-a-stop-side-erased` | a list changed while a Save waited | 5 |
| `v214-rv2-a-own-by-stamp` | this plan’s stored copy is held by the screen only… | 1 |
| `v214-rv2-a-own-never` | 〃 | 2 |
| `v214-rv2-a-persist-unrecorded` | 〃 | 1 |
| `v214-rv2-a-boot-own-unread` | 〃 | 1 |
| `v214-rv2-a-aswas-named-by-clock` | 〃 | 3 |
| `v214-rv2-a-held-not-asked` | 〃 | 1 |
| `v214-rv2-a-was-pick-unchecked` | step 1’s file and Write’s file are each checked | 4 |
| `v214-rv2-a-was-notice-says-failed` | 〃 | 1 |
| `v214-rv2-a-was-notice-retry` | 〃 | 1 |
| `v214-rv2-a-write-over-was` | 〃 | 5 |
| `v214-rv2-a-carryon-unasked` | 〃 | 3 |
| `v214-rv2-a-aw-not-held` | 〃 | 3 |
| `v214-rv2-a-close-copies-of-it` | 〃 | 1 |
| `v214-rv2-a-program-pick-written` | a page opened from a board file never writes… | 4 |
| `v214-rv2-a-imp-kept-unmarked` | work the import’s own file kept aside | 1 |
| `v214-rv2-a-imp-putback-words` | 〃 | 1 |
| `v214-rv2-a-putback-blank-dropped` | 〃 | 1 |
| `v214-rv2-a-putback-blank-forgotten` | 〃 | 1 |
| `v214-rv2-a-room-unnamed` | a whole board taken in … refused for room | 1 |
| `v214-w2-marker-after-pause` (retargeted) | W2 — a full import browser storage cannot hold | 3 |
| `v214-rv1-a-kept-without-record` (retargeted) | RV1-A — the import’s own file keeps a plan | 1 |
| `v214-rv1-c-stop-marks-kept` (retargeted) | RV1-C — a Save that stops before it writes | 4 |
| `v214-rv1-a-aswas-screen-traded` (retargeted) | RV1-A — the as-it-was file holds every copy | 2 |
| `v214-rv1-c-stop-cancel-skipped` (lengthened) | RV1-C — a Save that stops before it writes | 4 |

## Runs, on the final tree

- `npm run check`: all checks passed. `node tools/export-audit/boot-same.mjs`: every page, source, save and error list identical.
- The seven RV2-A blocks slimmed together: 31 failing checks on 74a6aec (none a CONTROL); ALL CHECKS PASSED here.
- **Whole, at 8 GB, one at a time** (a room gate before each; the first attempt at import and board was killed, exit 137, while two
  other fixers' suites ran, and was rerun): **audit-import, audit-board, audit-recon, audit-other, audit-inject, audit-hostile — ALL
  CHECKS PASSED** each.
- Browser: `npm run menus` (the new "Imports & exports › Import a full board (new version)…" path is read and found), `fileimport`,
  `savetarget`, `storagefull`, `keys`, `dialogs`, `panels` pass; `standards` 0 findings, nothing new.
- The reviewers' and skeptics' probes on the final board: p1 and c1b (decline puts back; full storage: not on screen only), w1/w2
  (held and offered; paused), w3, probe3, probe4, sk2 (✓ with the work, or named and Write waiting), m3 (the alert and the line name
  the full import), p5 (refused, nothing written; the board file picked next is written and keeps every edit, also in a fresh browser).
- **p5 first "reproduced" on the fixed board**, and that was the probe: journeys' cached written file (`written-kit-v212.json`) was
  built by bd5ff6d's file route, and a board file carries its own program, so the page under test ran bd5ff6d's code. Run with
  `CT=rv2a` the cache is rebuilt by this board, and the defect is gone. **A probe that opens a cached board file tests the program
  that wrote it**, not the one in BOARD.

