# v2.09 second review — the copy's Save, and the boot's opening rule (fixer RV2-save)

Fixes for five findings of the second independent review of v2.09 (the board read at `ba3c294`, identical at `bc3a0f6`), each
with a skeptic's verdict (the skeptic's reading taken where it differs): `shared-key-second-open-replaces-unsaved-work` (partly,
a blocker: data loss, older than v2.09 -- on the board and in a copy alike), `putback-keeps-adopted-office`,
`saved-page-follows-other-tab-choice` (older than v2.09), `as-published-line-says-unsaved-work-saved` (introduced by the first
review's fix) and `copy-takes-board-package` (partly, older than v2.09). Branch `v209-rv2-save`, on `bc3a0f6`. Brad's decisions
for item 127 are binding: reopening adopts the office the FILE was saved for; a page's office is the page's own (the first
round's per-page fix stands); work put back, or saved from the copy as published, gets the office it really belongs to, and Save
asks before saving work for an office it was not saved for; opening a file never replaces work this browser holds that no saved
copy has without keeping it aside first -- on every opening; and a copy's work comes and goes only by ✉ Submit input.

## What was fixed, and how

**Browser storage takes what an opening put on screen before the record calls it clean** (`shared-key-second-open…`, blocker).
- The cause is the boot's `fileTs > ours` branch, byte-identical since v2.08: it applied the newer file and recorded the base
  `{file, dirty:false}` without writing storage, so storage kept the work it had just kept aside under a record saying "clean,
  from this file". The next opening of an older file showed that work again, beside a kept copy that looked a spare; discarding
  it, then opening the newer file again, replaced the work with nothing kept. The skeptic reproduced it on the board itself (two
  board files of one appropriation), inside one office of a copy (its file and the copy as published), and across two offices.
- Now, where storage held this board's copy and the board took it up (`_bootOwnRead`), the branch writes the state just opened straight into storage
  (`MS.years[MS.cur]=S; localStorage.setItem(_AP.key, …)`), as `persist()` does -- `persist()` and `save()` read `let`s
  declared below and cannot run there yet (the skeptic measured the boot dying). Only once that write lands is the base marked
  clean. Refused (a full browser), the base is left describing what storage still holds -- the unsaved work, dirty -- so the next
  opening keeps it aside again. Where storage held nothing, there is nothing for the record to disagree with, and nothing is
  written (a first opening in a fresh browser is as it was). This mirrors `bootTakeFile` and `pmoTakeFile`, which persist.
- The consequence, by the v1.89 rule (the newer of the two opens): after a newer file has been opened, an older one opened next
  shows that newer save. It already did the moment any edit or year switch persisted. The board's `_bootMoved` line said that copy
  "has changes made since it was last saved" and that the file "has been saved since then as well"; with no unsaved changes it now
  says it is another save, the one this browser last opened or wrote, with no changes since, and that Save asks before writing over
  this file (identity, never clock order; `ownUnsaved()` decides which sentence, the one rule for it).
- **A file the board refuses at opening is not recorded as the save the work came from** (found writing the check for the fix
  above; older than v2.09). The branch ignored `applyStore(PUB)`'s answer: a newer file refused (built for other services) left
  this browser's copy on screen while the record said "clean, from this file" and `LASTKNOWN` named it, so the next 💾 Save wrote
  this browser's copy over that file without a question; a copy kept aside by that opening sat in the kept slot as if the work had
  been replaced. Now a refused file changes nothing -- storage, the record, `LASTKNOWN`, and the kept slot (a copy this opening kept
  is taken back) -- and the opening says the file was not opened and that Save will ask (`_bootRefused`).
- **A copy in storage the board could not take up is never written over** (`_bootOwnRead`, a guard for the write above): it is not
  what an opening shows or keeps aside, so the write is skipped and the record left describing it.
- **Both opening lines now say when work is kept aside and not on screen** (`bootKeptNote()`), with put it back: the save state's
  "↶ work kept aside" alone read as a spare of what was on screen.

**The office follows the work on screen** (`putback-keeps-adopted-office`, `saved-page-follows-other-tab-choice`).
- `_pmoMem` records why the page has its office: `how:'chosen'` (`pmoMineSet`, the person in this page) or `how:'adopted'`
  (`pmoAdopt`, from the work's mark), the choice kept under an adoption (`was`).
- `pmoFollowWork()`, in a copy, after different work is put on screen: work saved for an office adopts it; work saved for none
  drops an adoption back to the office chosen in this page, or, where nobody chose here, to the person's own choice in the browser
  (as the copy as published reads it). A choice made in the page is never dropped by it. The banner is redrawn.
- Called by `keptPutBack` (the main gap: Ann's unmarked AV work came back under PSM's banner, the Add box added for PSM, Submit
  dropped her edits as another office's, and Save asked nothing and marked her work PSM's), `bootTakeFile` (the file's version is
  that file's office's work), `pmoTakeFile` (in place of `pmoAdopt`, so a file saved for none brings none), and after the copy's
  Save writes (`_pmoSaveCopyRun`) and `pmoSaveCopyDl` marks: a page whose office came from the browser's setting kept reading that
  setting after its Save, so a choice of another office in another tab re-pointed it under a stale bar. The boot keeps its
  `pmoAdopt()` (the page has no office yet there, so the two agree).

**The copy as published says what is true of this browser's work** (`as-published-line-says-unsaved-work-saved`). Read from the
work's own mark (`pmoForOf(MS)`, which only a copy's Save and Save a copy write), never from a record that differs from the publish
stamp: saved for no office, "it has not been saved to an office's file yet: 💾 Save asks where to keep it"; saved for one, "that
work was last saved to a file of <office>'s own" (and "has changes since" where the record says so), and Save "writes to that file,
and asks where it is if this browser has not saved it before" (the handle store is IndexedDB, which the boot cannot read).

**A PMO copy takes no board, package or state file at any door** (`copy-takes-board-package`, older than v2.09; the skeptic's
fuller reading). `copyImportRefuse(fname)` (§19, beside `pmoCopyRefuse`): in a copy, the file is refused, nothing asked or changed,
and the message says a copy's work comes and goes only as ✉ Submit input, and to open the office's own file to carry on in it.
- `importState` calls it right after the import check and `pmoCopyRefuse` (which still names a copy's own office file and how it is
  opened), so ⬅ Import one appropriation in a copy refuses the board's issued package, a board file (and a consolidated one), a JSON
  state file and a submittal -- every route behind it, with one gate rather than one per route.
- `importBoards` calls it before anything is asked or read: ⇊ Import several boards at once in a copy took a board file the same
  way (found while fixing this; reproduced on ba3c294: the office's unsaved edit gone, nothing kept aside).
- `loadShared` answers a copy as an unconfigured machine (nothing asked for): the state file beside the board is the board's own,
  and a copy on the same share, in a browser where somebody once opted in (or served over http), loaded it over the office's work.

**The guide** (`o-wrong`): one entry, "After opening another office's file, my own work is not on screen" (kept aside, not lost;
↶ work kept aside puts it back on your own office). A second, for the import refusal, took the guide past the 60 KB the v1.86 help
check allows (59,403 characters before; 59,603 now): the refusal's own message says it all, so it was left out.

## Decided in the fix, and why

- **The storage write runs only where storage held this board's copy.** With nothing there, the record has nothing to disagree
  with, and writing would change a first opening in a fresh browser for no gain.
- **Refused, the record is left as it was**, not set dirty by hand: it already describes what storage still holds, unsaved work
  included (an older browser with no `dirty` in its record still answers through the journal, `ownUnsaved`).
- **After a newer file, the older one shows the newer save** -- the v1.89 rule, now consistent whether or not anything persisted in
  between. In a copy that means the copy as published, reopened after another office's file was opened in this browser, shows that
  office's work under its mark, this browser's own work kept aside and said to be. Sealing the plan key per office file is not done
  here (Brad has not decided it, and it would not close the board's route or the one-office route).
- **The board's `_bootMoved` line was reworded for a clean record** because the storage write makes that case the ordinary one; the
  wording for unsaved changes is unchanged (v1.89's checks read it).
- **`bootTakeFile` adopts the office of the file's work** in a copy, as opening that file does (Brad's rule). It was safe before
  (Submit refused, Save asked); it is now consistent with every other way work reaches the screen.
- **A copy refuses every file at ⬅ Import and ⇊ Import several, not packages alone.** The task named packages; the skeptic named the
  state file and the board file at the same door, and ⇊ was found doing the same. One rule (a copy's work comes and goes only by
  Submit), refused where each door starts, rather than a second, looser gate in `pkgApply` that the router no longer reaches. The
  cards stay in the copy's menu, refusing with the reason, as ⬅ Import a full board already did there.
- **The sidecar gate** is the same rule at the one door that is not a person's choice. Gated in `loadShared`, so `sharedArrived`
  and `adoptShared` are never reached in a copy.

## Checks

audit-import, W3 slot, four new blocks ("v2.09 second review — …"), each run on ba3c294 (`BOARD=…/board-ba3c294.html`): 38 failing
checks there, every non-CONTROL check of the four (counted: 13, 11, 2 and 12); all pass on the fix.
- *a newer file, the older one, the newer again* -- the board (storage holds what is on screen and the record is true; the older
  file shows the newer save, Ann's work only in the kept slot; its line says another save and that the kept work is not on screen;
  storage nearly full: the record still says unsaved, and after the kept copy is discarded the next opening keeps the work aside
  again; a file the board cannot take: the record, the kept slot and `LASTKNOWN` untouched, and said; a copy in storage the board
  cannot take up, never written over) and a copy, two offices and one office (the office's file and the copy as published).
- *the office follows the work on screen* -- put back after the boot kept the work aside (banner, Add box, Submit for AV, first Save
  AV's name and mark); after the file's version; a choice made in the page outliving an adoption and another tab's write; work saved
  for AV put back under a setting saying PSM; the saved file's version (`bootTakeFile`); a page that saved, by 💾 Save and by ⬇ Save a
  copy, staying on its office after another tab chose (Submit, the next Save asking nothing); and the copy as published, never saved,
  still following the setting (a CONTROL).
- *the copy as published says what is true* -- work saved for no office (the kept work saved as a file, opened on another machine,
  carried on); and PSM's work changed since its Save.
- *a PMO copy takes no board, package or state file at any import door* -- the board's issued package, its state file, a board file
  and a submittal at ⬅ Import, a board file at ⇊ Import several; the copy's own office file still told apart (a CONTROL); Submit
  unchanged; the shared state file asked for by the board (a CONTROL) and not by the copy.

`tools/pmo-save.mjs` (Chromium), two new sections, both failing on ba3c294: **I** a page that saved for the office it read from the
setting keeps it when a second tab chooses another (bar, Add box, Submit, the next Save); **J** a newer office file, then the copy as
published, in one real browser storage (storage holds what the newer file put on screen; the copy shows that save, the kept work said
not to be on screen; put back on her own office).

## Mutations

23 new (`v209-rv2-save-*`), 4 retargeted in place (`v209-w3-adopt-from-file`, `v209-rv-save-adopt-browser-wide`: the adoption now
records how and was; `v209-rv-save-take-office-stays`, `v209-rv-save-take-unsaved`: `pmoTakeFile` calls `pmoFollowWork()` -- the same
defects). Proved CAUGHT against their own blocks, with every existing v2.09 mutation whose find sits in a function changed here (28,
their caughtBy reused), v1.89's `boot-no-keep-aside` (the boot branch) and v1.84's `copy-boot-line` (the opening chain): 53 in
all, every one CAUGHT, none by a throw alone (`recovery/v209/proofs-RV2-save.json`, `recovery/v209/proved-RV2-save.jsonl`). The
boot-branch and opening-chain ones were proved again after the last edit to either. mcount: 2,623 of 2,623 targets match once.

## Proved with (27 Oct 2026)

- `npm run check`; mcount 2,623/2,623.
- Whole: audit-board, audit-other, audit.mjs, audit-hostile, audit-inject, audit-ui -- all pass, on the final tree.
- audit-import, every block (148 scenarios), in three slimmed chunks each carrying the V185W/V186L/V14 writers -- all pass, on the
  final tree. The first pass found the help guide over its 60 KB (above), fixed.
- audit-recon, the seven blocks naming a function changed here or reopening with storage (W7 F1, U10 ×2, U32/U33, U37, U44, W4) --
  all pass, at an 8 GB heap.
- Browser: pmosave (I and J new; 4 checks fail on ba3c294), menus, panels, leftmenu, keys, dialogs, hostile, pmoyears, standards
  (0 findings) -- all pass.
- The round-trip fuzz, seeds 822950757 and 651796399: nothing lost.
- The reviewers' and skeptics' repros pointed at the fixed board: s8 / sk.mjs routes A and B and HANDLE=1 (the office back on AV,
  Save marks AV), sk2 (bootTakeFile on PSM), s1 / rep.mjs (the saved page holds AV), s10 (CONTROL holds), s7b and k1 (the line names
  PSM's work, says Save asks, and that the kept work is not on screen), s9 / k1-copy / k3-one-office / k2-board (storage holds what
  the newer file opened; the copy as published or the older file shows that save, the work only in the kept slot -- its discard is a
  choice about work not on screen, said so), s5 / s5b / pkg-k1 / pkg-k2 and batch-in-copy (every file refused, nothing asked, the
  plan, storage and Submit unchanged).

## Known gaps

- The shared plan key: one published copy's office files and the copy as published share the copy's plan key in a browser, so the
  newer save opened there is what the copy as published opens next (said, its own work kept aside and said). Sealing the key per
  office file is a decision Brad has not made.
- `pmoForAsk`'s wording where a kept handle exists is unchanged (the first round's gap).
- A copy in browser storage the board cannot take up (figures of another width naming no services) is still kept aside at an
  opening as the empty board that stood in for it (older than v2.09); it is no longer written over, but "put it back" would put that
  empty board on screen, keeping the file's work aside in its place. Nothing is lost; it is confusing.
- The board's `_bootMoved` line for unsaved changes still says the file "has been saved since then as well" when the file is in fact
  older (v1.89's wording, by identity); unchanged here, its checks read it.
- A Save whose write fails after the work was marked (a read-only file) leaves the mark and does not make the office the page's;
  Submit refuses a mismatch and Save asks, so it is safe.
