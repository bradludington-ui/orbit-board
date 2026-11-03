# v2.14 review round 1, fixer RV1-C: Save and the import doors

Branch `v214-rv1c`, from `44aa984` (the merged, integrated v2.14 tree with the four fixers' slots). Four findings:
`cancel-leaves-pen-line-in-storage`, `stray-hold-says-newer`, `stray-rule-only-own-opening` (a critic's, no skeptic had checked
it) and `e2-drops-other-cycles-and-bae`, with the math reviewer's also-noticed item (importStores never took `budDb`). Every probe
was copied into `scratchpad/v214rev/rv1-C/` (`sv/`, `sk2/`, `cr/`, `od/`) and pointed at this worktree's board before it was
relied on. The pre-fix board for the checks is `git show 44aa984:prioritization-board-grid.html`.

The board changes are in the code this fixer owns, and one line in each of three readers the critic's finding names
(`fydpStoreLocal`, `diagStoreOf`, beside `pubsFor`), named below.

## 1. cancel-leaves-pen-line-in-storage (untrue message; the audit record)

**Reproduced** on this worktree, before the fix: `sv/p1-cancel-journal.mjs` -- questions "No writer is recorded…" then "⚠ HOLD ON
— “board.html” holds …", writes 0, WRITER null, pen lines memory 0 / **storage 1**, the record `{"file":…,"dirty":false}` →
`{"file":…,"dirty":true,"blank":false,"folder":{}}`, DIRTY and `unsavedNow()` false → true; reopened, the journal reads
"BLL (writer) not set BLL". `sv/p1b-denied-program.mjs` (program picked in the Open window, request `denied`): pen lines memory 0,
storage 1, storage journal 6 → 7.

**Fixed** in `_saveInPlaceFileRun`. `saveStopMark()` is taken just before the pen moves (after every question that can return
before it): `lsMarks()`, `_baseDirty`, the record's text, the save stamp (`MS.ts`, `MS.by`), the save history (`MS.log`) and the
plan object itself. Right after `buildSavedHtml()` (whose `save()` is what wrote storage) it notes the record's text as that save
left it (`stop.after`). `saveStopBack(stop, penLine)` runs at every exit after the mark that writes nothing -- (b)'s Cancel,
`'later'`, `'denied'` and the catch (so the read-only path v2.13 already had is fixed too):
- the pen line comes out of the working plan (`writerJournalUndo(penLine, k.ms)`: also when a locked view came up meanwhile);
- when nothing was changed while the save waited (`_saveGen` moved by `save()`'s own count only), the stamp, the save history, the
  marks (`lsMarksBack`) and `_baseDirty` go back, and so does the record -- only while it still holds what this save wrote, so a
  record another tab wrote meanwhile is never written over;
- browser storage is written again from memory (`persist()`), as the folder save does after its own undo (v2.00 U18), unless a
  locked view is on screen (persist refuses there; the folder precedent leaves it to the next change the same way).
A change typed while write access was asked keeps its marks: the board stays unsaved and storage holds the change, without the pen
line. `stop=null` once the write has landed, so nothing after the write is ever taken for a stop before it.
Measured after the fix: storage is byte for byte what it was before the Save (every key), on every one of the four exits.

**Check** audit-import `v2.14 RV1-C — a Save that stops before it writes leaves browser storage, the journal and this browser’s
record as they were (cancel-leaves-pen-line-in-storage)`: (a) claim then Cancel at (b): every key of storage as before, the board
as saved as before under the same stamp; reopened, no pen line and no writer; that page's granted Save writes the file with one
pen line for its one claim (44aa984 wrote two). (b) `'later'` and `'denied'` through the Open window. (c) a read-only file (the
catch). (d) a change typed while write access was asked: kept, unsaved, and no pen line in storage. **Fails on 44aa984 with 8
failing checks**; passes here.

**Mutations** (10): `v214-rv1-c-stop-no-persist`, `-stop-marks-kept`, `-stop-record-kept`, `-stop-stamp-kept`, `-stop-after-unset`,
`-stop-cancel-skipped`, `-stop-later-skipped`, `-stop-denied-skipped`, `-stop-catch-skipped`, `-stop-ignores-typing`. All CAUGHT.

## 2. stray-hold-says-newer (untrue message)

**Reproduced**: `sv/p5-stray-occupied.mjs` -- "file ts … < blank work ts … : true", `_bootStray` true, the blank work on screen, and
"⚠ unknown saved a newer copy to the saved file …, so the newer copy was not loaded"; the skeptic's no-room probe
(`sk2/p7-noroom.mjs`) printed "⚠ The saved file is newer — …" over an older file.

**Fixed**: the boot's hold carries `stray: fileTs<ours` (true only when the stray rule sent an older file down that branch).
`keptOccupiedMsg` takes a sixth argument, `older`, and says "⚠ The saved file was not opened. It was saved by … (…), before the work
on screen, which was typed on a page with no board file and is in no saved copy. The file opens over such work only once that work
is kept aside, and this browser already keeps earlier work aside (kept …). Kept work is never replaced, so nothing was lost. Deal
with the kept work first: …". The no-room line opens "⚠ The saved file was not opened — … saved it …, before the work on screen,
which was typed on a page with no board file — but this browser holds work …". The routing (D4, C17: held back) is unchanged; only
the words for the stray case. A newer file held back still says "newer".

**Check** audit-import `v2.14 RV1-C — a board file the stray rule holds back is said to be older than the work on screen, never
newer (stray-hold-says-newer)`, reached by ordinary steps (skeptic 2's `p6-reach`: blank work, a newer file keeps it aside, put
back, the older file opened), the no-room case (`boot({quota})`), and a CONTROL: a newer file held back for no room still says it is
newer. **Fails on 44aa984 with 2 failing checks**; passes here.

**Mutations** (4): `v214-rv1-c-held-stray-unmarked`, `-held-occupied-newer`, `-held-noroom-newer`, `-occupied-msg-newer`. All CAUGHT.

## 3. stray-rule-only-own-opening (a critic's finding; data loss at the HOLD ON's OK)

**Reproduced, fully** (`cr/pA-stray-other-appn.mjs` on this worktree before the fix): Full Fund opened from the file shows F, G and
keeps the blank work aside; on O&M, `fydpStoreLocal('ff')` gave the blank work (order [], note Z, no positions), FYDP Disconnects no
positions, the five-year plan "its board opened a different saved state than the newest one here", the next Save's bytes carried
the blank Full Fund, 💾 Save asked the HOLD ON "• Full Fund — 2 requirements, 1 year" and with OK the file held the blank Full Fund;
cycApplyAll said "Full Fund changed" and tagged the blank work, and Full Fund then opened untagged with the tagged blank work kept
aside. `cr/pA2-fdc.mjs`: "No PPBE position is logged …" with the blank work, "positions logged for Full Fund" without.

**Fixed**: `strayOther(k, ls, fb)` (beside `pubsFor`) restates the boot's own test (`_bootStray`, C17) for another appropriation:
its record (`<key>.base`) says `dirty:true`, no file, `blank:true`; its stored plan carries no data pack (`_hasData`); and the
file's copy holds a plan older than it. Anything unreadable is no stray work, and the newer copy is taken as before. Read by:
- `pubsFor` (every Save, and `PUBS` after it) -- in this fixer's area;
- `fydpStoreLocal` -- one line, `else if(strayOther(k, st, pb)) st=pb;` -- and through it `cycOtherOf`, `cycApplyAll`, `fdcStores`,
  `fdcFolderRead` and `fydpGather` (whose frame already applied the stray rule; now the two agree, and `fydpTake`'s time check is the
  cross-check between them);
- `diagStoreOf` -- one condition, so Save diagnostics says what Save writes.
After the fix (`pA` again): every reader reads the file's Full Fund, Save asks only the writer question and the file keeps its
Full Fund, the five-year plan prints Full Fund, FYDP Disconnects reads BES28.

**Decided in the fix** (Brad's to reverse): `cycApplyAll` **skips** Full Fund here -- the skip that already exists for a file's copy
over unsaved work ("this browser holds Full Fund work the saved file does not have"; open its board, then choose again). The critic
suggested tagging the file's copy instead; that writes the file's copy into storage over the blank work with nothing kept aside --
only Full Fund's own opening keeps it aside -- so it would lose that work. Opening Full Fund keeps it aside and then offers the tag.

**Check** audit-import `v2.14 RV1-C — another appropriation’s blank work is read as its own board reads it: Save, the cycle bar,
FYDP Disconnects and the five-year plan take the file’s copy (stray-rule-only-own-opening)`: the CONTROL (Full Fund's own opening),
then from O&M: `fydpStoreLocal`, `diagStoreOf`, `fdcStores`, `cycOtherOf`, `fydpGather`, the bytes the next Save builds, a real Save
through a stand-in file (one question, one write, the file's Full Fund kept), `cycApplyAll` (not changed, said, blank work still
stored untagged and recorded blank); CONTROLs: an import's record (no blank mark) and a stored plan carrying a data pack are the
newer copy as before. **Fails on 44aa984 with 8 failing checks**; passes here.

**Mutations** (5): `v214-rv1-c-stray-other-pubsfor`, `-stray-other-local`, `-stray-other-diag`, `-stray-other-unmarked`,
`-stray-other-over-pack`. All CAUGHT.

**Left, and why:** `strayOther` and the boot's `_bootStray` line are the same rule written twice. The boot line is the target of
`v214-w1-stray-any-record`, `-stray-over-pack` and `v214-int-stray-unguarded` and reads values (`_bootOwnRead`, `_bootOwnPack`) only
the opening has, so it was left as it is; the five-year plan's frame-versus-reader time check now fails if they ever disagree.
Readers that take browser storage FIRST regardless of time (`pkgStoreOf`, `bandPeers` and the ladder push, the by-band sheet) follow
a different, older rule and are not this finding's; they were left.

## 4. e2-drops-other-cycles-and-bae (data loss) and the also-noticed BAE list

**Reproduced**: `od/p9-e2loss.mjs v213` (the reviewer's fixtures, read in place) on this worktree before the fix -- E1 (empty
browser): Full Fund `["PB|2027"]`, BAE 2; E2 (a cost estimate held): "🧩 Loaded … 1 locked PPBE cycle came across (PB27)", then Full
Fund `[]`, BAE 0, no `prio27ff-cyc` and no `prio27buddb`.

**Fixed**:
- importState's shell branch for a file carrying several appropriations calls `cycTake(fullSt, <every other appropriation the file
  seeds>)` inside the capture, before `e2Commit()`, so the locks commit with the plans, all or nothing; the line adds cycTake's
  sentences ("1 locked PPBE cycle for Full Fund came across (PB27).").
- importStores gains the BAE list: taken whole where this browser holds none ("The BAE list came across (N rows)."); a list held here
  is never replaced by an import that merges (C18), and is said to be kept ("This board’s own BAE list (N rows) was KEPT — the
  file’s (M rows) was not taken. A BAE list is replaced by importing the BAE file itself."). Being in importStores, the populated
  board's whole-file take (`consTakeApply`, every appropriation) now takes it too, which its own comment already promised.
After the fix (`p9` again): E2 gives Full Fund `["PB|2027"]`, BAE 2.

**Decided in the fix**: the BAE list is not merged row by row (by appropriation) where this browser holds one; it is kept and said.
A one-appropriation file into a browser holding another appropriation's rows therefore leaves its own rows behind, and says so.

**Check** audit-import `v2.14 RV1-C — a board file taken the merging way (E2) brings every appropriation’s locked cycles and its BAE
list (e2-drops-other-cycles-and-bae)`: (a) a browser holding a cost estimate: both appropriations' locks, the file's BAE list, the
estimate kept, the line naming both; (b) a browser holding a BAE list: kept, said, and the locks still come; (c) storage refusing
Full Fund's locks refuses the whole import, storage as it was; (d) `consTakeApply` taking a consolidated file whole: the BAE list
comes across and is said. **Fails on 44aa984 with 6 failing checks**; passes here.

**Mutations** (7): `v214-rv1-c-e2-own-cycles-only`, `-e2-cycles-after-commit`, `-e2-cycles-unsaid`, `-bae-not-taken`,
`-bae-replaces-held`, `-bae-kept-unsaid`, `-bae-unsaid`. All CAUGHT.

**Left**: the open appropriation's own line still reads "1 locked PPBE cycle came across (PB27)." without naming it (cycTake's
wording for a single own appropriation, unchanged).

## Proofs

`recovery/v214/proofs-RV1C.json` lists the 26 new mutations and five existing ones whose lines sit beside the fix
(`v214-w1-cancel-pen-moved`, `-picked-denied-kept`, `-later-unremembered`, `-later-writes`, and `frame-store-older-wins` beside the
new line in `fydpStoreLocal`). `prove.py` (`JOBS=1 HEAP=8192`): **31 of 31 CAUGHT**, each by failed checks
(`recovery/v214/proved-RV1C.jsonl`). Note on `v214-w1-cancel-pen-moved`: saveStopBack now also takes the pen line out of the
working plan, so that mutant no longer leaves the line in memory; it is still caught, by WRITER not put back (W1 check 3(7)).
`frame-store-older-wins` needs the v1.85 block that writes `V185W` beside the one that reads it (13 checks fail, and the block throws).
`mcount`: 3,411 entries, every one once; every new mutant parses (`mkmut.py` + `tools/check.mjs`). No existing check was changed and no
existing mutation retargeted.

## Runs
