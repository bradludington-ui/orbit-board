# v2.09 W3 — item 127: Save in a PMO copy, and the board refusing a copy at its other doors

Built on Brad's "Go on v2.09" (26 Oct 2026), from NEXT-VERSION.md item 127 and the investigation in
`scratchpad/v209/res-save.json` (the skeptic's corrections taken over the investigator's where they differ). Branch `v209-w3`.

## As built

**The copy's own Save, `pmoSaveCopy()`** (§17, after `publishJson`). In a copy only (on the board it is `saveInPlace`).
- Refused at once on a locked view (`cycBlock`) and under a stopped import (`impMixedBlock`), never queued; asks which office
  first when none is set (`pickMyPmo`); asks before saving work last saved for another office (`pmoForAsk`); then runs
  through `saveSerial` (`_pmoSaveCopyRun(off)`), re-checking both gates after the read, and refusing if the office changed
  while it waited.
- **Its own handle**: `pmoFhKey(off)` = `'pmo-copy|'+PMODE.ts+'|'+office` in this browser's `prio-fh` store (`_pfhPut`,
  `_pfhGet`, `pmoFhForget`), and `_pfh` in the page. The board's `FH`, `_fhGet`, `_fhPut` and its `FNAME` entry are never
  touched.
- **The first Save** opens the picker on `pmoSaveName(off)`: `<title> — PMO COPY — <office> — <publish date>.html` (the title
  with the copy's own year). Never `FNAME`, never the published copy's name.
- **The target check** (`pmoSaveTargetWhy`, reading `pmoCopyOfText`): an empty file is taken; otherwise it must be a PMO copy
  with this copy's publish stamp and appropriation, whose saved state carries this office's mark. The copy as published (no
  mark), the board or any non-copy board file, another office's file, another copy's file and a file that is not a board are
  refused, said, and the handle forgotten (page and store). A file that cannot be read is never written over.
- **HOLD ON**: the board's own question, by `LASTKNOWN` identity, naming who saved the office's file since.
- **The bytes**: `MS.pmoFor={pmo:off}`, then `buildSavedHtml()` (plain: a cycle locked in the copy is kept), and the file's
  copy-mode tag is checked against `SRC0`'s before writing (true by construction; a guard against a future assembly change).
- **Marked saved exactly as the board's Save does**: `LASTKNOWN=wrote`, base `{file, dirty:false}` and `DIRTY=false` only if
  `_saveGen` has not moved, `sideWrote(sideAt)`. `WRITER` and `writerMay` are never consulted.
- **⬇ Save a copy** in a copy (`pmoSaveCopyDl`): the office's file as a download, same name; marks nothing saved
  (`_dlOnly=true`, the save state says *downloaded — not in your office's file yet*). It is also the fallback where there is
  no picker (Firefox) and after a write that fails.

**The office rides in the saved state** -- `MS.pmoFor={pmo}` in the plan (the pubState payload), never in `pubMode`.
`pmoForOf(ms)` reads and validates it (name rules as the door's, TDZ-free). Because it is in the plan it travels with the
work: into browser storage with every edit, into the file with every Save, so when this browser's copy is newer than the
file opened, it is that work's office the copy opens on. **Opening adopts it** (`pmoAdopt()`, run right after the boot
restore): `pmoMineSet(office)`. `myPmo()` reads storage first, as always, unless storage refused the office this page was
last told (`_pmoMem`, declared in §02); `pickMyPmo` and the Add box's `arSetOffice` set it through `pmoMineSet`.
**Submit refuses a different office** (`pmoForBlock()`, one line in `pmoSubmit` after the `cycBlock` line). **The board holds
no mark**: `applyStore` deletes `MS.pmoFor` outside a copy, so no copy it publishes reads as one office's file.

**The foot** (markup `#pmoSaveRow` / `#pmoSaveBtn`, hidden on the board; `pmoFootSet()` from `saveStateShow`): in a copy, 💾
Save with its ▾ beside it, the save state under them, then ✉ Submit input (`#saveBtn`, `pmoSubmit()`, still the primary
button). Plain style with the ▾'s edge against the navy; its own rail rules (44×40 icon, dirty dot). `dd_save` in a copy offers
only the copy's Save a copy. Ctrl+S (`uiSaveKey`) is `pmoSaveCopy` in a copy. The save state in a copy reads as the board's
(Saved / Unsaved changes / downloaded), and *not saved to a file yet* until the work is saved for an office.

**The words**: `sandboxBlock`'s text, the copy's greeting (names the office whose file it is), `bootOwnMsg` in a copy, Submit's
title, the bar's chip ("✎ Editable · PMO copy", no "no Save"), the storage-refused messages in `persist` and `lsSet`, and the
guide: a new office section `o-save` ("Save your work, and come back to it"), `o-explore`, `o-send`, `o-wrong` (two entries
rewritten, one added), `t-publish` and a paragraph in `t-subs`.

**The board side.**
- `pmoCopyWhy(txt)` / `pmoCopyRefuse(fname, txt, tail)` (§19, beside `inRefuse`): a file whose copy mode is a sandbox is
  refused, naming its office (or *as published*) and the PMO import screen; in a copy the same doors say to open the file
  itself. Called after the import check at `importState` (every path it routes: board, consolidated, JSON is unaffected),
  `fullImportText`, `consTakePick`, and `importBoards` (a copy among the files refuses the batch, nothing taken).
- `_saveInPlaceFileRun` refuses a target that is a PMO copy before the writer check (which reads "me" on the board's own
  machine) and forgets the handle, as it does a file that is not a board.

**The sealed side lists**: `SIDE_SFX` and `EXDB_KEY`, `ACEDB_KEY`, `BUDDB_KEY`, `RPDB_KEY` (§02): in a copy each carries
`-pmo<publish stamp>`, as the plan, cycles and destinations already did. The boot reads, `persist*`, `fileKeyOf`, `lsSet`'s
locked-view gate and `sideBootCheck`/`sideBootSay` use them. `fullImportText`'s writes keep the board's literal keys (a copy
never takes a full import). A first open of a copy reads what its file carries.

## Decided in the build, and why

- **"The first Save always goes to a new file"**: built as the target rule rather than "refuse any non-empty file on the
  first Save". The first Save always opens the picker on a new office-named file; a file it is pointed at is taken only if it
  is this copy's file for this office. That is what lets a second person, or the same person on another machine, take turns
  in the office's one file (Brad's "two people in one office may take turns in one file"), while the copy as published, which
  every office opens, can never be written (the skeptic's K1).
- **The mark lives in the plan (`MS.pmoFor`)**, not beside it in the payload. Both are "in the saved state"; in the plan it
  follows the work through browser storage, so a browser holding one office's newer work never opens it under another
  office's name, and every board file and kept-aside file already carries it with no change to `savedHtmlOf`.
- **Adoption writes the office into this browser** (`prio27pmo`), as choosing it always did; the page keeps it when storage
  refuses. Submit refuses only when the work carries a mark and the office set differs.
- **The suggested name carries the copy's publish date**, not today's, so the office's file is named for the copy round it
  belongs to, and the same name is suggested on every machine.
- **Save a copy's download carries the office's mark** (it is the office's work); `keptSaveFile` carries the kept store's own
  mark, whatever it was.
- **The saved copy keeps the board's writer record** as the published copy carried it: nothing in a copy reads it, and the
  board's Save refuses a copy before its writer check.
- **`sideBootCheck` now runs in a copy** (it was skipped because a copy's Save was refused), with its record sealed too
  (`SIDE_OPEN_KEY` + `SIDE_SFX`): a list this browser holds that the file opened lacks reads unsaved, as on the board.
- **The pubMode guard before writing** cannot fire by construction; it has no mutation (a mutation removing it would be
  equivalent).

## Checks

- audit-import slot, six blocks: the save and the reopen with empty storage (same mode, keys, work, cycles, office, Submit
  package less its clock); every target refused and its handle forgotten; two people, two machines, three round trips with the
  kept-aside slot never met, and the download marking nothing saved; the office adopted, following the work, a mismatch refused,
  storage refusing the office, the board holding no mark; every board door and the board's Save refusing a copy; the sealed side
  lists. 75 checks, 7 of them CONTROLs; 46 of the rest fail on v2.08 one by one and the rest with their block (a step that
  opens a file only the new Save writes).
- audit-other slot, one block: the foot in jsdom, its ▾, Ctrl+S, the gate still refusing the board's Save, Save a copy and file
  save in a copy (`pmo-gate-open` bites here), and the words. 16 checks, 4 CONTROLs, the other 12 fail on v2.08.
- Changed on purpose: audit-import's v1.84 copy block (the save indicator; the ▾), each with a `// v2.09 W3:` comment;
  `tools/left-menu.mjs` D (the copy's Save and Save a copy reached once each, the ▾'s item).
- `tools/pmo-save.mjs` (new, Chromium): the foot at 1366×768 and 1366×657 in Harbor and Midnight, folded to the rail, 1.4.11 and
  1.4.3 on the new button, the keyboard (Tab order, focus ring, Enter, Ctrl+S), the picker's name, the real handle store (the
  board's entry untouched, the copy's under its own key), and the board's foot as a CONTROL. 14 of its checks fail on v2.08.

## Mutations

42 new (`v209-w3-*`), 6 retargeted to the sealed keys and `pmoMineSet` (`ace-store-past-lsset`, `rp-store-past-lsset`,
`v197w2-reprog-key-missed`, `v197w2-dest-key-missed`, `v202-89-lsset-writes-swapped`, `v207-121-copy-office-not-kept`), 2
retired as obsolete (`copy-save-state`, `copy-file-menu`); `pmo-gate-open`, `copy-save-button` and `copy-boot-line` kept and
proved still biting. Every one proved against its own check (`recovery/v209/proved-W3.jsonl`).

## Not built, or left

- A Save that waited while the office was changed is refused (`_pmoSaveCopyRun`'s office check); no check reaches that race.
- `npm run pmosave` (`node tools/pmo-save.mjs`) should be added to package.json and to `verify:grid`.
- The guide's Save text is W3's; W2 owns the banner's list of years and the out-year text, so `o-send`'s first sentence and
  `t-publish`/`t-subs` may meet W2's edits at integration.
