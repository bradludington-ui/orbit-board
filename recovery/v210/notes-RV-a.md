# v2.10 review, fixer a (item 130, FYDP Disconnects): A-1, A-2, A-3

On `4c531a0` (the joined item 130), branch `v210-fix-a`. The three findings of the review of the figures and the box, each
confirmed by a skeptic (`scratchpad/v210/rev/findings-figures.json`), fixed as their proposed fixes said, each with a check that
fails on `4c531a0` and a mutation that undoes it, proved CAUGHT one at a time (`proofs-RV-a.json`, `proved-RV-a.jsonl`). No sweep.
BUILD is unchanged.

## A-1 (blocker): Full Fund's USMC-B reaches the STOVL sheet

- **What was wrong.** Full Fund's own service list calls the F-35B service `USMC-B` and keys its PPBE positions by it; the
  estimate files it `STOVL` (`aceSvcOf`). `FDC_GROUPS` matched by name alone, so Full Fund's F-35B controls reached no service
  sheet: STOVL printed PROCUREMENT controls $0 against the whole requirement (0% Funded), the four service sheets came short of the
  Summary by exactly that figure, and the box named USMC-B as counted on the Summary only (the workbook said nothing).
- **The fix.** Each group takes the other name the board's own alias table gives each of its services (`SVC_ALIAS`, read by own
  key), so STOVL is `['STOVL','USMC-B']` -- on the requirement side, the controls side and in the notes, which all read
  `g.svcs`. The alias table itself, never `svcBoardOf`: the other appropriations' stores are not the board on screen, and
  `svcBoardOf('STOVL')` on a Full Fund board answers `USMC-B`, which would lose O&M's STOVL instead.
- **Check.** audit-other "v2.10 review — FYDP Disconnects: Full Fund’s USMC-B is the STOVL sheet’s, and the service sheets add up
  to the Summary (A-1)": O&M on screen with Full Fund (keyed USMC-B, plus a NAVY-X in no group) and Spares in storage, then Full
  Fund on screen (its own list) with O&M and Spares in storage. Per appropriation the STOVL sheet's controls, Discretionary,
  Mandatory and delta from the fixture's literals; the four sheets plus the services no sheet takes (XSVC in the estimate, NAVY-X
  in the position) equal the Summary, line by line (US, controls, D, M), year by year and the FYDP total; the note names XSVC and
  NAVY-X and never USMC-B; the STOVL tab draws Full Fund's controls. 16 checks fail on `4c531a0` (Full Fund's lines on both boards).
- **Mutation.** `v210-rv-a-alias-dropped`.

## A-2: an International figure left by a click keeps the click's keyboard

- **What was wrong.** Chromium fires the change of a figure typed and left with the mouse while the keyboard is nowhere and the
  click's focus has still to land. `fdcIntlSet` wrote into the box at that moment (the cells it moves, the message line, its
  class alone), the box's observer ran `dlgSync`, whose "redrawn away" branch handed the keyboard back to the field just left, and
  the click's focus was dropped: 250 typed in FY28, FY30 clicked, 7 typed, read FY28 $2,507M and FY30 $0; a sheet tab clicked
  after a figure left the keyboard on the estimate picker. The Tab path did not apply (pointerdown clears `_navStep`).
- **The fix, in `fdcIntlSet` alone** (the box controller is unchanged): the figure is kept at once, and with the keyboard nowhere
  and no Tab on its way every write into the box -- the message line and the cells drawn again -- waits one turn
  (`setTimeout 0`), by which time the click's focus has landed. The Tab path is as it was. The deferred redraw does nothing if the
  box has closed meanwhile.
- **Checks.** keys R (Chromium, a real mouse): 250 in FY28 left with Tab (as before), FY30 clicked and 7 typed, FY31 clicked and 3
  typed -- the keyboard on FY31 and FY28 $250M, FY30 $7M; then the USAF tab clicked -- the tab pressed with the keyboard on it and
  FY31 $3M. Both new checks fail on `4c531a0` (`{"focus":"fdcIn_ir_om_2030"}`, then `{"focus":"fdcAce"}`) and on the mutant, and
  pass here. The jsdom stand-in, audit-other "v2.10 review — FYDP Disconnects: an International figure left by a click keeps the
  click’s keyboard (A-2)", delivers the click as Chromium does (pointerdown on the target, the field left with the keyboard
  nowhere, its change, the observer's microtask, then the click's focus only if nothing took the keyboard, then the click), with
  the microtasks before it run first, as a browser has run them before anyone clicks; it reproduces `4c531a0` exactly (FY28,
  then fdcAce) and fails 3 checks there.
- **Mutation.** `v210-rv-a-click-not-waited` (caught by the jsdom block; by hand, keys R fails on its mutant too).

## A-3: with the team on the shared folder, another appropriation is read as its own board opens it

- **What was wrong.** In folder mode (`driveStoreOn()`) Full Fund's own board opens the folder's copy when that is newer
  (`driveStorePull`), and the five-year plan reads it so (`fydpStoreFolder`). The box read only this browser's copy
  (`fydpStoreLocal`): controls weeks old beside the folder's current estimate, and with no copy here "Full Fund has no BES28
  position logged" while the folder held one.
- **The fix.** `fdcFolderRead()` reads each other appropriation as `fydpGather` does, `fydpWhen(fydpStoreFolder(k,
  fydpStoreLocal(k)), …)`, and holds the answers in `_fdcFold` (declared beside `let fdcOpen`). It is started when the box draws
  in folder mode with no answer held, and each opening starts afresh (`toggleFdc`). Until an appropriation has answered,
  `fdcStores` marks it `wait` and states nothing of it; `fdcState` says "Reading the shared folder for Full Fund and Initial
  Spares: each is read as its own board opens it, the folder’s copy when that is newer…" (a status line, no model, no table); the
  pickers keep the estimate and cycle picked meanwhile (a cycle only another appropriation logs is not lost while it is read).
  When every appropriation has answered the box redraws (`fdcSync`, never under a figure being typed). Export pressed while it
  reads (it is enabled for that, and only when reading is what stops the model) waits for the same answer and downloads once,
  and says so; called with no answer held it reads
  one itself. A folder that cannot be read is named in the note ("its controls cannot be read here (the shared folder could not be
  read (…), so its newest copy is unknown)") and its controls print —, never this browser's older copy.
- **Check.** audit-other "v2.10 review — FYDP Disconnects: in the shared folder, another appropriation is read as its own board
  opens it (A-3)": a Full Fund board writes the folder's copy (newer, also logging POM29) and this browser's (older), each by its
  own `livePayload()` with the data pack the folder save puts in first; O&M on screen in folder mode with a stand-in folder. The
  five-year plan's reader takes the folder's (a CONTROL); opened, the box is reading, draws no table and claims no missing
  position; Export pressed then downloads nothing, refuses nothing and says it waits; answered, the box draws the folder's
  controls, Discretionary and Mandatory for every year, and the waiting Export downloaded once with them; POM29, picked, survives
  the next opening's read; a newer folder save reaches the next opening; with no copy in this browser the folder is read all the
  same and nothing says Full Fund has no position; a folder that cannot be read is named and its controls print —. 8 checks fail
  on `4c531a0`.
- **Mutations.** `v210-rv-a-folder-not-read`, `v210-rv-a-reading-unsaid`, `v210-rv-a-folder-fail-falls-back`,
  `v210-rv-a-answer-not-drawn`, `v210-rv-a-export-not-waiting`, `v210-rv-a-read-once`, `v210-rv-a-pick-lost-reading`.

## Proved

- `proofs-RV-a.json`: the 9 new mutations and the 22 older v210 ones whose find sits in a function this changed (`FDC_GROUPS`,
  `fdcStores`, `fdcState`, `fdcHtml`, `fdcIntlSet`, `toggleFdc`, `exportFdc`), each with the caughtBy its own proofs file records.
  All 31 CAUGHT, none by a throw (`proved-RV-a.jsonl`), on the final board. mcount: 2,768 targets, each once. (One run of
  prove.py stopped on a UnicodeDecodeError in its own reading of a suite's output while audit-board ran beside it; it resumed
  from the lines it had kept and every verdict is from a whole run.)
- Run whole on the final board: audit-other and audit-board, ALL CHECKS PASSED; `npm run check`; keys (all 134), dialogs,
  panels, menus; money coverage 25/25; money map holds (unchanged).
- Guide (t-fydp): one clause -- with the team on the shared folder, controls are the folder's copy when newer; Full Fund's USMC-B
  is the STOVL sheet's.

## Left as it was, and why

- The Spruills (`spDefs`) and the Locks-by-appropriation table (`cycOverview`) read another appropriation the same storage-first
  way the box did (the skeptic's precedent note). They are not item 130's; the same treatment would fit them.
- A service renamed in Setup to a name in no group and no alias pair stays a Summary-only service; the box names it, the workbook
  does not. Unchanged here (the skeptic raised it as a question, not a defect).
- WB-1 (the indented lines print flush left in the workbook) is the workbook reviewer's, fixer b's.

## After the skeptics (integration, 27 Oct)

The A-3 skeptic confirmed the fix and found one route it did not cover, though these notes said it did: the folder reads, but
Full Fund's copy in it does not at that moment -- `getFile()` throws NotReadableError (mid-sync), the JSON is cut short (the
import check does not refuse it, so driveParse throws a plain SyntaxError), or it is not a board (no `store`).
`fydpStoreFolder` swallowed all three and handed back this browser's reading: with no copy here the box said "Full Fund has no
BES28 position logged" (A-3's own false claim), and with an older copy here it printed that copy with no note.

- **Fixed:** `fydpStoreFolder(k, got, strict)`. With `strict` -- FYDP Disconnects passes it from `fdcFolderRead` -- only
  NotFoundError means the folder has none, as `driveStoreRead` reads it; anything else names that appropriation ("the shared
  folder's copy could not be read (...)" / "... is not a saved board"), its controls print —, and nothing is guessed.
- **The five-year plan keeps its older reading** (strict unset): it shares `fydpStoreFolder`, and the same gap is there,
  older than v2.10 (since v1.85). Not changed here, as item 130's scope; logged for the owner.
- **Check:** the A-3 block's part 4 -- the three failures, each with and without a copy in this browser (six checks, all failing
  on e29f128's board), Initial Spares with no folder copy read as "none there" (never unreadable), and a CONTROL that the
  five-year plan's reading is unchanged.
- **Mutations:** `v210-rv-a-copy-unreadable-falls-back`, `v210-rv-a-strict-not-a-board-taken`, `v210-rv-a-strict-none-unreadable`
  (new); `v210-rv-a-folder-fail-falls-back` retargeted to the new call (`, true`). `proofs-RV-a2.json` /
  `proved-RV-a2.jsonl`: those four and the six other A-3 mutations.
- The guide's FYDP Disconnects paragraph: a copy in the folder that cannot be read is named and prints —.

The A-1 skeptic's residual -- a service renamed in Setup to a name in no group and no alias pair (or keyed `usmc-b`, `USMC STOVL`)
reaches the Summary only; the box names it, the workbook carries no note, so a service tab can print $0 controls with nothing to
say why -- is the owner's call, put to him with the ship notes. The WB-1 skeptic's note (the house style's indents carry no
horizontal alignment either, since v2.04) is older than v2.10 and is logged.

### The second skeptics (on 72b56db, `wf_0d3ccbac-c7a`)

Two skeptics re-checked the strict reading: one for the fix on every route (jsdom, Chromium with a stand-in folder and with a real
origin-private folder, 96 cases each way), one for what it could break (the five-year plan, ordinary folder mode, folder mode off,
the whole box in Chromium at 1366 and 1920). Both confirmed it; the five-year plan was identical in all 34 folder situations.
One minor problem, introduced by it, fixed:
- **With no readable appropriation logging a position, the box said "No PPBE position is logged for O&M, Full Fund or Initial
  Spares" of a Full Fund it had not read**, and named no unreadable copy (fdcState tested for no cycles before it looked at a
  store's `why`, and the notes that would name it run only once a model is built). Now an unreadable appropriation is left out of
  that list and named with why ("Full Fund’s controls cannot be read here (…)"). Check: part 5 of the A-3 block (two checks,
  failing on 72b56db). Mutations `v210-rv-a-unread-listed-as-none`, `v210-rv-a-unread-unsaid`.
- **The note's wording** nested the browser's and the parser's messages three brackets deep; it is said in a few words now
  ("could not be opened (it may be syncing)", "is cut short or damaged", "is not a saved board"). Part 4's patterns follow.
- Notes, not changed: a same-build copy with a future LIVE_VER and no `store` would read "is not a saved board" (it cannot arise:
  a newer build is refused first); and the workbook gives no reason for an appropriation's dashes (item 131).
- `proofs-RV-a3.json` / `proved-RV-a3.jsonl`: the two new mutations, the four strict ones, and fdcState's two older ones.
