# v2.09 review — the copy's Save (fixer RV-save)

Fixes for five findings of the independent review of the integrated v2.09 board (frozen at `9bc5496`), each CONFIRMED by a
skeptic: `copy-colleague-save-unreachable`, `adopt-switches-office-browser-wide` (with the cross finding
`office-follows-other-tab`, fixed by the same change, the skeptic's fuller version), `import-hold-not-sealed`,
`copy-sendback-package-board-door` and `moved-file-handle-never-forgotten` (the copy's Save and the board's). Branch
`v209-rv-save`, on `9bc5496`. Brad's decisions for item 127 are binding: one file per office; reopening adopts the office the
FILE was saved for and Submit refuses another; that is per file, so opening one office's file never changes the office another
tab or copy works under; the person's own choice (pickMyPmo, the Add box) works as in v2.08; Save asks before writing over a
newer save, and the way out it names must work; a PMO copy comes in only through the PMO import screen; a moved or renamed
office file is said and asked for, never written over unread.

## What was fixed, and how

**The office a page works under is that page's** (`adopt-switches-office-browser-wide`, `office-follows-other-tab`).
- `pmoAdopt()` sets the page's office (`_pmoMem`) from the work's mark and no longer writes the browser's setting
  (`prio27pmo`), which every `file://` page shares. Opening PSM's file to look at it set PSM for every copy and tab in the
  browser: unsaved AV work in another copy then added for, saved for and was marked PSM's, asking nothing.
- `myPmo()` returns the page's office whenever the page has one (chosen here, or adopted), and reads the browser's setting only
  while it has none. Before, it read storage first on every call, so a tab holding PSM's file followed another tab's write: its
  bar said PSM while its Add box added for AV, its Submit was refused, and its Save offered to write PSM's work over AV's file.
- `pickMyPmo` and the Add box (`arSetOffice`) still write the browser's setting through `pmoMineSet`, as in v2.08, so a copy
  opened next (with no mark) starts on the person's last choice.

**Cancel on the HOLD ON has a way to the colleague's save** (`copy-colleague-save-unreachable`).
- New `pmoTakeFile()` (after `bootTakeFile`): in a copy, open the file's own save, keeping this browser's work aside first
  (`keepAside(MS, {why:'file', …})`). Other work already kept: refused, `keptOccupiedMsg`. No room: refused, said. Otherwise
  `applyStore(PUB)`, `LASTKNOWN=PUB_FILE_TS`, base clean, `pmoAdopt()` (the office follows the work now on screen), persist,
  the banner redrawn, and a line offering to put the kept work back.
- The opening line's `_bootMoved` branch, in a copy, offers it (`open the file’s version`) instead of "⬅ Import the file",
  which a copy refuses for a copy's file.
- The copy's HOLD ON: its Cancel line says to open the office's file again, where that opening line offers the file's version;
  with other work kept aside already, it says that comes first and offers put back / save as a file / discard.
- The copy as published, reopened after the office's file was saved, said the file "has been saved since then as well — by BLL"
  at the publish time beside a state reading Saved. It now says the file is the copy as published and the work was last saved to
  a file of its own (a branch before `_bootMoved`, keyed on `!pmoForOf(PUB)` -- identity, not clock order).
- `pmoCopyRefuse` in a copy, for this copy's own file of an office: says it is opened, never imported, and how its saved version
  is reached (the old text said "another copy").

**The board's stopped-import hold is the board's** (`import-hold-not-sealed`). `IMP_MIXED_KEY='prio27impMixed'+SIDE_SFX`
(`SIDE_SFX` is '' on the board). A copy opened in the portfolio team's browser opened on the board's hold, refused its own Save
for it, and offered "allow saving again…", which lifted the board's hold.

**A copy sends no appropriation package, and the board takes none from one** (`copy-sendback-package-board-door`, older than
v2.09).
- `sandboxBlock` at the top of `pkgIssue`, `pkgPushAll` (before the question and the staggered issues), `pkgSendBack`,
  `pkgReturn`, and `publishJson` (a copy's plan as a state file is the same door; no button reaches it in a copy, so a gate).
- `pkgBody` in a copy draws one line: packages are the portfolio team's; the office's work goes as ✉ Submit input.
- The board: `pkgCopyRefuse(pkg, fname)` at the top of `pkgApply` (after the shape check) refuses a package that carries an
  office's saved work (`pmoForOf(pkg.ms)`, which the board never keeps) or whose name carries the copy's `[PMO COPY yyyy-mm-dd]`
  stamp (every file a copy writes is named with it, `expName`), naming Program offices › Review submittals.

**A file moved after its first Save is asked for again** (`moved-file-handle-never-forgotten`, the board's half older than
v2.09). In the `getFile()` catch of `_pmoSaveCopyRun` and of `_saveInPlaceFileRun`, a `NotFoundError` forgets the handle
(`pmoFhForget(k)`; on the board `FH=null; _fhPut(null)`) and says the file is no longer where it was saved and that the next
Save asks where it is. Every other read failure keeps its handle and its "syncing, try again" message. Nothing is written over a
file that was not read; the file picked next goes through the same target check and HOLD ON as any.

## Decided in the fix, and why

- **A page that has an office keeps it whatever another page writes**, a choice made in another tab included. Brad's rule is
  that opening a file never changes another tab's office; a choice made in another tab re-pointing an open page is the same
  hazard (its bar is drawn once and does not follow), and v2.08 had it too. A page with no office of its own (the copy as
  published, nobody having chosen in it) still reads the browser's setting live, as in v2.08; the person's choice still writes
  that setting for the copies opened next.
- **Opening the file's version is offered, not done**, and only in a copy, only where the work on screen is not the file's
  (`_bootMoved`), with a confirm. It takes the plan only, as `bootTakeFile` does; side lists and cycles stay as the opening chose
  them by the boot's newer-of rule.
- **The board refuses an older copy's package by what it can see**: the office mark, or the copy stamp in its name. A package from
  a copy published before this fix, never saved for an office and renamed, carries nothing that tells it from the board's own --
  stated, not papered over (it can no longer be written by a copy of this version).
- **"Saved since" stays an identity test.** The reviewer suggested saying it only when the file's time is later than the save the
  work came from; CLAUDE.md's rule is that Save and opening compare saves by identity, never by clock order (a colleague's slow
  clock). Only the case that identity can tell apart -- the copy as published, which carries no office mark -- got its own line.

## Checks

audit-import, W3 slot, five new blocks ("v2.09 review — …"), each run on 9bc5496 (`BOARD=…/board-9bc5496.html`): 38 failing
checks there, every non-CONTROL check of the five; all pass on the fix.
- *opening one office’s file never changes the office another page works under* -- Ann's own AV choice survives opening PSM's
  file (browser setting, the page already open, her copy reopened: banner, Add box, Submit for AV, first Save AV's name); two tabs
  sharing storage and the handle store (the first stays PSM, its Save writes PSM's file and leaves AV's alone); the file's version
  taken over another office's work adopts the file's office.
- *two people in one office: after Cancel, the office’s file opens as saved, this browser’s work kept aside first* -- the copy as
  published reopened; the HOLD ON and its Cancel line (both branches); the opening line offering the file's version; a save under
  way, occupied and no-room refusals; taken (Kim's save on screen, Pat's kept, the next Save writes with the kept handle asking nothing); put back
  (Save asks again).
- *a PMO copy never reads, shows or lifts the board’s stopped-import hold* -- opening, Save, "allow saving again" in the copy, the
  board still held after.
- *a PMO copy sends no appropriation package, and the board takes none written in one* -- the panel, every writer refused at once
  (nothing asked, nothing downloaded), the board refusing a package with the mark and one with the stamp, and taking one with
  neither (a CONTROL).
- *a file moved or renamed after its first Save: the next Save asks where it is* -- the copy and the board; a sync failure keeps
  its handle (a CONTROL).

Changed on purpose, in place in the W3 slot (`// v2.09 review:`): two checks expected adoption to write the browser's setting
("this browser now says PSM"); the setting is now left as the person set it (`null` on a machine never told, `AV` where AV was
chosen).

`tools/pmo-save.mjs` (Chromium), two new sections: **G** two tabs in one real browser (one storage): the first tab stays on PSM and
the setting is untouched; the person's own choice in the second tab writes it and the copy opened next follows (CONTROLs). **H** a
file moved after its first Save with a real handle (OPFS, the page served from 127.0.0.1), the copy's Save and the board's:
NotFoundError said, the handle forgotten, and after a reopen the next Save asks. On 9bc5496: G fails twice; H's browser dies
outright on the handle the old board kept to the moved file (this Chromium crashes reading a kept OPFS handle whose file is
gone), recorded as a FAIL of that section, each run in a browser of its own so a death fails only its section.

## Mutations

24 new (`v209-rv-save-*`), 2 retargeted in place (`v209-w3-adopt-from-file`, `v209-w3-mine-mem`: the adoption and `myPmo` lines
they aimed at were rewritten; the same defects). All 26 proved CAUGHT against their own block
(`recovery/v209/proofs-RV-save.json`, `recovery/v209/proved-RV-save.jsonl`). `v209-rv-save-pkg-push-open` first SURVIVED:
`pkgIssue`'s own gate refused each staggered issue, so the check (nothing downloaded) could not tell; the check now also asks that
nothing was asked (the PUSH question), and it is caught. mcount: 2,567 of 2,567 targets match once.

## Proved with (27 Oct 2026)

- `npm run check`; mcount 2,567/2,567; `npm run coverage:money` (24/24) and `npm run defects` hold.
- Whole: audit-board, audit-other, audit.mjs, audit-hostile, audit-inject, audit-ui -- all pass.
- Slimmed: every audit-import block naming a function changed here (68 scenarios, with V186L's writer) -- all pass; the three
  audit-recon blocks naming one (U10, U32/U33, U44) -- all pass, at an 8 GB heap (at 5 GB the run died out of heap; nothing
  failed).
- Browser: pmosave (G and H new), pmoyears, leftmenu, menus, panels, hostile, dialogs, keys -- all pass.
- The round-trip fuzz, seed 272621724: nothing lost.
- The reviewers' own repros pointed at the fixed board: f4, t3 and the cross skeptic's rep.mjs (the office stays), f5 (the board's
  hold kept), f3 and board-moved.mjs (the picker asks again), s6 (the as-published line), f6/s7/sk.mjs (no package, no buttons).

## Known gaps

- Two offices' files of ONE published copy share that copy's plan key in one browser (the skeptic's related note), so opening
  PSM's file in a browser holding AV's newer work of the same copy opens AV's work (W3's "the office follows the work"); the file's
  version is now one click away (`pmoTakeFile`), but the shared key is untouched here.
- A page with no office of its own (the copy as published, nobody having chosen in it) still follows another tab's choice live, as
  in v2.08; its banner is not redrawn when that happens.
- `pmoForAsk`'s wording ("It goes to a file of AV’s own") is unchanged where a kept AV handle exists (optional in the review; the
  trigger, adoption re-pointing a page, is gone).
- A package written by a copy published before this fix, never saved for an office and renamed, is not recognised by the board.
- `keptPutBack` and `bootTakeFile` do not re-adopt the office of the work they put on screen (unchanged; Submit refuses a mismatch
  and Save asks, so it is safe).
