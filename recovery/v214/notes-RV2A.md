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

## The finish: what the independent check found in round 1's fixes

The check (on 391d6f9) found the first round's fix for `aswas-pick-not-checked-against-import` held only on the routes that land,
an untrue clause in the `opening-kept-copy` wording, and an untrue refusal from the also-noticed 3 change. Each was reproduced on this
board first with the check's probes, copied to `scratchpad/v214rev2/rv2-A/check2/` and pointed at this worktree's board.

### 1. The step-1 failure branch (data loss) — reproduced, fixed

**Reproduced** with `fileroute/w1f.mjs` (a write refused) and `w1g.mjs` (read back otherwise): "the imported file on disk now: EMPTY",
"anything offering the imported file? false | R.rescue null", and after "💾 this board as it was" was downloaded "holds false | leave
asks false", "✕ asked: []". The name test ran only after a write that landed.

**Fixed** (impFileSaveWas's catch, impFileDrawIn, impFileWasDl): the catch makes the same name test. A file with the imported file's
name gets the same hold as on the landing route (`R.rescue {inc, was:true}`), marked `wasFail`. The box says the board as it was
"could not be written into it either" and offers both copies. The message line offers the file imported beside the board as it was.
✕ and leaving ask until the file imported is downloaded. Step 1 done again into that name, and landing this time: `wasFail` is
cleared and a download already made still counts (the rescue is kept, not made again). `impFileWasDl` redraws the box, so a copy
downloaded from the message line is no longer offered there as if it were not.

### 2. The mirror, on Write's failure branch (data loss) — reproduced, fixed

**Reproduced** with `fileroute/w2f.mjs` (and `KNOB=failWrite`): rescue offers `["html","inc"]`, "box offers this board as it was?
false | step 1 still ✓? true"; Write again into new2.html: "reopened true | the unsaved work … in any file false | in any storage key
false".

**Fixed** (impFileFailed, impFileRescueBtns, impFileDrawIn, impFileCloseAsk, impFileSaveWas): impFileFailed tests the chosen name against
step 1's file before anything else. Where they match, the board as it was is offered (`R.rescue.aw`, R.was.html byte for byte), and
step 1 is reset (`R.step1=null`, and `R.skip=false`: the decision is to be made again, now the copy it rested on is gone). Write is then
held until step 1 is done again or let go. The box and the message line say so ("…and it has the name of the file step 1 saved this
board as it was into, so that copy is gone from it and step 1 is to be done again: save all three copies now"). ✕ names all three
(`impFileCloseAsk`: "This board as it was is not saved yet, nor is the imported board (new version), held only here, nor is the file
you imported."). Step 1 done again into another file marks the offered copy covered (`aw.got`), so ✕ then asks only of the two.
After: "rescue offers ["html","inc","aw"] | box offers … true | step 1 still ✓? false"; Write again: "reopened false | … in any
storage key true".

### 3. The put-back wording (untrue message) — reproduced, fixed

**Reproduced** with `fileroute/a2s.mjs`: the file saved after the kept work changed, then ↶ Put back: "…so nobody saved that file
after it."

**Fixed** (keptPutBack): the inference is dropped and the two true halves kept: "It changed after the full import was written into
its file. 💾 Save will ask before it writes over a copy saved after the one this work came from." The earlier block's part (a) reads
the new sentence (`// v2.14 RV2-A finish:` there).

### 4. The download route's importing page (untrue refusal, from also-noticed 3) — reproduced, fixed

**Reproduced** with `journeys/dl.mjs SKIP=1`: "held true | DIRTY true | memOnlyNow true | … leave asks true", and switching
appropriation refused with "browser storage refused them, so no saved copy holds them", while "storage O&M holds the edit: true".

**Fixed** (memOnlyNow, impFileMarkWrite, impOwnCopyGone): a held page's unsaved work counts as on screen only when two things are true.
First, the page did not write the note itself (`_impNoteMine`, set by impFileMarkWrite). Its step 1 saved or let go everything it held,
and any edit after the note is refused by the hold and counted by `_persistFail`. Second, storage's copy of this plan is no longer the
one this page wrote last (`impOwnCopyGone`: `localStorage.getItem(_AP.key)!==_persistLast`, unreadable counted as gone). The hold
alone is not enough. After: "memOnlyNow false | leave asks false", switching not refused.

The earlier block's held page (part (a) of "this plan’s stored copy…") now gives B the browser storage A's Write left (`sync`), as a
second tab shares it. Before, the fixture only handed B the note, so B's storage still held B's copy: the old rule passed it, and the
new rule rightly does not count that as on screen only. (`// v2.14 RV2-A finish:` there.) The reviewers' w3 probe likewise hands B
only the note, so it now reads "leaving B asks: false", which is right for what B's storage holds there.

### 5. The raced branch (data loss; found while finishing, the same defect on a third branch) — reproduced, fixed

The check named the two failure branches. Looking for their siblings (CLAUDE.md: the misses are next to the fixed sink), Write has a
third ending after its pick: the write lands while another tab saves (or this page changes), and `impFileWriteTo` returned to
`impFileRaced` **before** either name test. The raced route clears nothing at once, but the file it wrote clears, when it opens, every
copy unchanged since the click. With Write given the file step 1 saved the board as it was into, that file holds the import, the box
closed, and the unsaved work step 1 had named went from storage at the opening: in no file and no storage key.

**Reproduced** with the new part (f) on ece4291: "the box stays, paused on step 1’s file, and offers the board as it was" got
`[false,false,false]`; Carry on, ✕ and the download each found nothing to act on (4 failing checks). The same with the imported file's
name, part (g) (2 more).

**Fixed** (impFileWriteTo): in the raced branch the two name tests come first. On a match the raced note goes in (as impFileRaced writes
it: the hashes of what storage held at the click, so ✕ at the pause keeps a note and the file never opens behind older copies) and
the box pauses on the name as the route that lands does: the board as it was (`aw`) or the file imported offered, Carry on and ✕
asking until it is saved. Carry on reads the race again (`impFileCarryOn`, unchanged) and ends on the raced route: the moved lists
named, nothing cleared, nothing reopened.

### The check, and the proof

**Check:** one new audit-import block in the RV2-A slot, `v2.14 RV2-A finish — a write that fails after its pick lets nothing go
unasked, a kept copy put back says only what is so, and only a page another tab’s import holds counts its work as on screen only`.
- (a) Step 1 into the imported file's name, the write refused / read back otherwise. The box and the line offer both copies. With the
  board as it was downloaded, the file imported is still held, ✕ asks, and the download is NEW byte for byte. Then (refused) step 1
  again into the same name, landing: "is in it now", ✓ downloaded kept.
- (b) Write into step 1's file, the close refused. Nothing cleared, aw offered, step 1 no longer ✓, and Write held even to a name
  that would take it. ✕ names all three. Step 1 again lets ✕ name only two, the download is WAS byte for byte, and Write then finishes
  with the work in backup2.html.
- (c) The a2s route: the import's file saved after it opened, then the put-back line.
- (d) The download route's importing page: not on screen only, nor after the downloaded file's opening clears storage. An edit after
  the note is a CONTROL.
- (e) A page another tab's import holds: not on screen only while storage holds its copy; on screen only once that copy is cleared.
- (f) (bfbf89b) Write into step 1's file, landing while another tab saves Full Fund (the W2 race's gate). The raced note is in before
  the pause; the box pauses on step 1's file and offers the board as it was; Carry on and ✕ ask, Cancel stays; the download is WAS
  byte for byte; then Carry on ends on the raced route, the list named, nothing cleared or reopened.
- (g) (bfbf89b) The same race with Write given the imported file's name, step 1 let go: paused, the file imported offered and
  downloaded byte for byte, Carry on ending on the raced route.

Slimmed alone, (a)–(e) failed **20 checks on 74a6aec** and **22 on 391d6f9** (round 1's tree). With (f) and (g) it fails **26 on
74a6aec** and **6 on ece4291**, none labelled a CONTROL, and passes here.

**Mutations:** 17 new in the RV2-A slot (`v214-rv2-a-was-fail-unheld`, `-was-fail-unmarked`, `-was-fail-says-written`,
`-was-fail-no-was-btn`, `-was-fail-line-silent`, `-wasdl-no-redraw`, `-was-redo-said-failed`, `-was-redo-reoffered`,
`-write-fail-was-lost`, `-write-fail-step1-kept`, `-write-fail-btn-missing`, `-close-aw-new-board`, `-redo-aw-held`,
`-imp-putback-nobody`, `-held-own-note`, `-held-copy-ignored`, `-note-mine-unset`). Three were retargeted in place to the line that
now carries the same defect:
- `v214-rv2-a-held-not-asked`: the held rule's line now carries the two conditions.
- `v214-rv1-a-was-dl-not-counted`: impFileWasDl now redraws between its two lines.
- `v214-rv2-a-was-notice-says-failed`: lengthened, since step 1's success branch now holds its text six spaces in.

mcount: 3,547 entries, each found once. Every new and retargeted mutant built with mkmut.py passes `node tools/check.mjs`. The whole
RV2-A list (44, round 1's 26 included) was proved again on this board, the round-1 results set aside
(`scratchpad/v214rev2/rv2-A/proved-RV2A-round1.jsonl`). The proof (`prove3.log`) started at 01:25:45, after the board, the
suite, mutate.mjs and proofs-RV2A.json were last changed, and it is the tree committed as ece4291: **44 of 44 CAUGHT, each by a failed
check, none by a throw.** Round 1's 26 were caught as in the table above (same counts); the finish's 18:

| mutation | caught by (audit-import) | failing checks |
|---|---|---|
| `v214-rv2-a-was-fail-unheld` | RV2-A finish — a write that fails after its pick | 11 |
| `v214-rv2-a-was-fail-unmarked` | 〃 | 2 |
| `v214-rv2-a-was-fail-says-written` | 〃 | 2 |
| `v214-rv2-a-was-fail-no-was-btn` | 〃 | 2 |
| `v214-rv2-a-was-fail-line-silent` | 〃 | 2 |
| `v214-rv2-a-wasdl-no-redraw` | 〃 | 2 |
| `v214-rv2-a-was-redo-said-failed` | 〃 | 1 |
| `v214-rv2-a-was-redo-reoffered` | 〃 | 1 |
| `v214-rv2-a-write-fail-was-lost` | 〃 | 7 |
| `v214-rv2-a-write-fail-step1-kept` | 〃 | 7 |
| `v214-rv2-a-write-fail-btn-missing` | 〃 | 3 |
| `v214-rv2-a-close-aw-new-board` | 〃 | 1 |
| `v214-rv2-a-redo-aw-held` | 〃 | 1 |
| `v214-rv2-a-imp-putback-nobody` | 〃 | 1 |
| `v214-rv2-a-held-own-note` | 〃 | 1 |
| `v214-rv2-a-held-copy-ignored` | 〃 | 1 |
| `v214-rv2-a-note-mine-unset` | 〃 | 1 |
| `v214-rv1-a-was-dl-not-counted` (retargeted) | RV1-A — the room left is said | 1 |

The two retargeted ones among round 1's ids, `v214-rv2-a-held-not-asked` (1) and `v214-rv2-a-was-notice-says-failed` (1), were
caught again by the blocks named for them above.

**The raced branch (bfbf89b):** three new mutations and one retargeted:
- `v214-rv2-a-raced-name-untested` takes the name tests out of the raced branch (the defect put back).
- `v214-rv2-a-raced-pause-unmarked` pauses without writing the raced note first.
- `v214-rv2-a-raced-was-unoffered` reads step 1's file as if it were only the file imported, so the board as it was is never offered.
- `v214-w2-race-page-unchecked` (W2's, retargeted in place): the raced branch now opens a block, so its find ends at
  `if(moved2.length || raced){`; the same defect (an edit on this page while the file was written is cleared from under it).

mcount: 3,550 entries, each found once; each of the four mutants passes `node tools/check.mjs`. **The whole list, 48, was proved
again on bfbf89b** (`prove4.log`, the earlier results set aside in `scratchpad/v214rev2/rv2-A/proved-RV2A-finish1.jsonl`): **48 of 48
CAUGHT, each by a failed check, none by a throw**, every block clean on the board first. The 44 above were caught with the same counts;
the four new:

| mutation | caught by (audit-import) | failing checks |
|---|---|---|
| `v214-rv2-a-raced-name-untested` | RV2-A finish — a write that fails after its pick | 6 |
| `v214-rv2-a-raced-pause-unmarked` | 〃 | 1 |
| `v214-rv2-a-raced-was-unoffered` | 〃 | 4 |
| `v214-w2-race-page-unchecked` (retargeted) | W2 — the file route keeps | 1 |

### What the check also said, and was left

- aswas-older-stamp, "one note, not a defect": where tab A edits before its own boot has settled (a timing of the reviewer's probe;
  DIRTY is reset afterwards), the as-it-was file now holds storage's copy, not A's unflagged edit. The edit is not lost: it is in
  the kept slot after Write. Left.
- take-all, "a minor point": the room sentence is also said when one appropriation or several boards are taken. It is worded "To
  bring a whole board in anyway", so it is true either way. Left.

### The check's probes, rerun on the finished board (ece4291)

Copied in `scratchpad/v214rev2/rv2-A/check2/`, each output kept beside it as `*-fin.out`:
- `w1f` (step 1's write refused) and `w1g` (read back otherwise): "anything offering the imported file? true | R.rescue
  [at, html, inc, was, wasFail] | holds true"; after the board as it was is downloaded "holds true | leave asks true"; ✕ asks "The
  file you imported is not saved yet…" (and only once that is answered OK is the box closed and the hold let go).
- `w2f`: "rescue offers ["html","inc","aw"] | box offers "this board as it was"? true | step 1 still ✓? false"; Write again into
  new2.html: "reopened false … in any storage key true" (Write waits for step 1).
- `a2s`: "…It changed after the full import was written into its file. 💾 Save will ask before it writes over a copy saved after
  the one this work came from."
- `dl SKIP=1`: "memOnlyNow false | impFileHolds false | leave asks false", switching not refused, "storage O&M holds the edit: true".
  (Its "as-it-was copy (R.was) holds it: false" is the probe's reading: once the download route shuts the box, `_impFileLast` is set
  only for a rescue or a held as-it-was copy, so there is nothing for it to read. Step 1's download was made, `was.got true`.)
- The reviewers' original `w1-aswas-into-import` and `w2-write-over-aswas`: held and offered; paused with storage untouched.

### Lines outside the code I own

- `memOnlyNow()`: the held condition now reads `!_impNoteMine && impOwnCopyGone()`. `impOwnCopyGone()` is new, beside `unsavedNow`.
- `_impNoteMine`: a `var` beside `_impFile`, set in impFileMarkWrite.

## Runs, on round 1's tree (391d6f9)

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

