# v2.15: the contract between the four builders (items 137, 138, 139, 142–146, and the small fixes of items 131 and 135 and the v2.13 handoff)

Brad's go of 3 Nov 2026: *"Let's push all of these"*, *"Three versions, data loss first"*, *"Accept all recommendations"*,
then *"Go"* (build straight through, taking each recommended answer and saying which). v2.14 shipped the data-loss version
(PR #34, `8413a7b`). v2.15 is the second: items 137–139, the small fixes, and items 142–146, found building and reviewing v2.14.
Item 133 is v2.16 and is **not** built here. Items 100 and 107 (Azure) are not built. The sweep runs only on Brad's named go.

Read whole before starting: `CLAUDE.md` (the v2.09–v2.14 sections above all), `AGENTS.md`, and in `NEXT-VERSION.md` › Open the
items named below. The handoff's recommendations Brad accepted are `recovery/v213/HANDOFF.md` §8 (items 16–20 for the small
fixes). v2.14's map (`recovery/v214/map.md`) and notes (`recovery/v214/notes-*.md`) are the evidence most items cite.

**This file decides.** Where it leaves a choice open, the builder decides, writes it under **Decided in the build** in its notes,
and the ship notes say Brad can reverse it. A choice that changes what a person sees in a way the item does not describe, or
moves a figure, is not the builder's: stop, write the question in the notes, and build the rest.

Base: the slot commit (the commit that adds this file). Each builder works in its own worktree on its own branch from it.
Nobody bumps `BUILD`, edits `package.json`'s version, pushes, merges, or edits another workstream's slot or functions it owns
(§2). `npm run` scripts a builder adds go in its notes under **npm script to add**; the lead adds them.

## 0. The rules every builder keeps

- **Data loss and math are the can't-fails.** No figure may move unless the item says it does (W4's Funded is a heading, not a
  figure). `tiers()`, every export's money and every printed figure stay as they are; the money map stays current.
- One self-contained file, `file://`, no dependency, no network, the CSP unchanged.
- Every rule in `AGENTS.md` › Do not. In particular: every storage write that carries work goes through `lsSet`/`lsAll`; a
  PMO copy and a locked view refuse writes as today; a box is a `body > .modal-bg`; a click handler only on a native control;
  `esc()` for text into HTML, `jsa()` for a value into a handler; a menu path names its group; no second home for an action.
- **A check that cannot fail is not a check.** Each new check fails on the slot commit unless it is labelled CONTROL, and a
  check that defends a rule, an order or a choice has a fixture where the alternatives disagree.
- **Mutations are text only** (`tools/export-audit/mutate.mjs`; never import it, never `npm run mutate` or `validate:math`).
  Each new mutation, and each one retargeted, is proved against its own check with `recovery/v208/bin/prove.py`, on the
  builder's own finished board. After the last change, `python3 -I -B recovery/v200/bin/mcount.py tools/export-audit/mutate.mjs
  prioritization-board-grid.html` reports every target matching once. A line this change rewrites that an older mutation
  searches for is retargeted to the line that now carries the same defect, and proved.
- **Run every suite whole once on the finished board**, not only the blocks you touched (v2.09, v2.10, v2.12 and v2.14 each
  found a moved expectation that way). A change of wording is a change to every suite that quotes it: grep the suites first.
- **Resources: four builders share one 15 GB, 4-core container.** Every whole suite, every `prove.py` run and every browser
  check goes through `recovery/v215/bin/heavy.sh` (two at a time, machine-wide). `prove.py` with `JOBS=1` under it. An exit
  137 is the container: run it again. Never two proof runs in one worktree at once (prove.py's suite copies collide).
- `git fetch --unshallow` once in your worktree if recon or import read old builds from git (`git show <sha>:…`).
- Never commit a populated board. Never push. Commit on your branch; report the SHA.

## 1. Who builds what

| | Scope | Slot (suites, `mutate.mjs`) | Mutation ids |
|---|---|---|---|
| **W1** | Items 137, 138, 139; item 146's "E2's own-appropriation line" | `v2.15 W1` | `v215-w1-*` |
| **W2** | Items 142, 143, 145; item 131's FYDP Disconnects box and Export across tabs; item 146's held ladder, `strayOther` vs `_bootStray`, the tie rule and `cycCarrySaved`'s guard mutations, the latched page that says nothing | `v2.15 W2` | `v215-w2-*` |
| **W3** | Item 144; item 146's Save, import and message findings and test gaps (§1.3) | `v2.15 W3` | `v215-w3-*` |
| **W4** | Item 131's folder reads and house indents; item 135's gaps; the CLIN request reported on opening; the guide's five-year text; the Priority Drill's narrow columns; the five-year workbook's Allocated → Funded; item 146's journal and edit-box findings (§1.4) | `v2.15 W4` | `v215-w4-*` |

Every new suite block's name starts `v2.15 Wn — ` and sits in that builder's slot in the suite. Each builder writes
`recovery/v215/notes-Wn.md` (What was built · Decided in the build · Checks — each new check "fails on the slot commit", or
CONTROL; each existing check changed on purpose with its `// v2.15 Wn:` comment · Mutations — new, retargeted, retired, with
their proofs · For the integration · npm script to add · Known gaps), `recovery/v215/proofs-Wn.json` and `proved-Wn.jsonl`
(`git add -f`: `*.json` is ignored).

### 1.1 W1 — the PPBE cycle: the bar, packages, retag (items 137, 138, 139)
- **137.** The context bar stays one line at every width above the phone layout: `fitTop()`'s steps, measured, never a guessed
  breakpoint: (1) labels go (`tight1`); (2) the cycle figure shortens (no "FY27 ·", signs for "unallocated"/"over", the whole
  sentence in its tooltip); (3) the figure leaves the bar for the top of the PPBE cycle list, and the button carries a ⚠ when
  anything is over. Checks: layout S held to one line at every width it measures, Mixed and with a warning unread, both fonts;
  toolbar-fits on a tagged board; keys V reaching the figure in the list when it has moved there.
- **138.** As logged, points 1–4: an incoming plan (`pkgApply`, `consTakeApply`, `importBoards`) comes in under the cycle this
  board has identified for that appropriation (its own tag and deltas reference; else the bar's one cycle; else untagged), only
  that cycle's PPBE position is taken, every other cycle's position on this board stays, and the preview and the result say
  what was not taken. Not changed: a full import; a board holding nothing; a PMO submittal; `cycTake` for locked cycles.
- **139.** As logged: the three retag buttons move every appropriation on the cycle being left that has locked it, through
  `cycApplyAll`'s writer, naming those that have not; the button says how many; Lock refuses a plan tagged with another cycle,
  naming both and the way out; an untagged plan is still tagged by its lock.
- **146:** E2's own-appropriation line names the appropriation ("O&M: 1 locked PPBE cycle came across (PB27).").

### 1.2 W2 — what opens, what Save records, two tabs (items 142, 143, 145; 131's box)
- **142.** The requirement list follows the copy that opens. **Design first, in the notes, before building:** which copy wins and
  what is kept aside when they disagree (today's rules for the plan decide; DATA must take the data pack of the plan the opening
  chooses, not storage's first); everything that reads DATA or the stores beside it while the board opens; R1's same-ids case.
  Checks as logged (the measured case; unsaved with no room; same ids; every v2.14 stray-rule and file-route check unchanged).
- **143.** 💾 Save records every appropriation it wrote exactly as this browser held it (`<key>.base` → `{file: this save,
  dirty:false}`), with a generation guard; a copy changed while the save wrote keeps its record. Give `cycCarrySaved`'s guard a
  fixture and a mutation here. W2 calls `baseSet`; **W3 owns `baseSet` and `baseMarkDirty`'s bodies** (§2).
- **145.** A general `storage` listener that marks what another tab changed (never redrawing under a figure being typed), and
  `pubsFor` asking, naming both, when this page holds a copy storage refused and storage now holds a newer one from another tab;
  nothing written until the person chooses. Checks through each door (a package, a ladder copy, a plain Save, a carried cycle),
  and a CONTROL of one tab alone.
- **131 (the box):** FYDP Disconnects' open box redraws on another tab's write (never under a figure being typed, through the
  listener above), and Export refuses a model that differs from the one last drawn, saying the figures moved.
- **146:** a ladder held for an appropriation not yet opened survives that board's opening (`BAND_PEND_KEY`, `applyStore`'s first
  call), and its refusal no longer says Save writes it into the file; `strayOther` and the boot's `_bootStray` become one rule
  (one function both read); mutations that make the tie rule (storage wins a tie of `ts` in `apStoreOf`, `pubsFor`,
  `fydpStoreLocal`) matter, with a fixture that reaches them; a page latched by another tab's `storage` event says so at once.

### 1.3 W3 — storage writes, Save and import wording, test gaps (item 144; item 146)
- **144.** As logged: route `baseSet`, `keepAside`'s `.kept`, `jrnlMarkSeen`, `pmoMineSet`, `uiPrefWrite`, the stopped-import
  marks, `SIDE_OPEN_KEY`, the menu groups and `cycCarrySaved`'s record write through `lsSet`, deciding per key whether a refusal
  leaves work on screen only (`.kept` does; `uiPrefWrite` and the menu groups do not); `baseSet` and `baseMarkDirty` write no
  record where the plan's own write was refused. Checks: each write refused in turn — counted in Save diagnostics, the right
  sentence, leaving asks only where work is on screen only, no record left claiming a state storage does not hold.
- **146, Save and the file route:** `impHandMsg`, `impHandClear` and `fullImportUndone`'s alert read the note's fields safely; a
  Save stopped while storage was full leaves no pen line; `fhRepick` and `fhSaveNew` on the left menu's `dd_save` (the leftmenu
  map with them); Save as a new file does not claim the pen when the board already names this browser; the refusals do not
  `_fhPut(null)` the page's own entry when the failing handle is `_fhMem`; the file route's write calls `fhLegacyRelease`;
  `impFileBuild`'s writer key survives a refused key; `impFileFailed`'s sentence true when the file chosen was this board's own;
  switching to an appropriation the file holds no plan for does not ask a false HOLD ON; a pubState that is a JSON array is
  refused as not a board.
- **146, wording:** `writerMay`'s "before v1.95" for a baked program and for a v2.13 file never saved in place; the full-import
  report's "(v2.9)"; `JRNL_NOT_WHOLE`'s menu names; the folder-mode S2 refusal; E2 refused for room pointing to ⬅ Import a full
  board; Save diagnostics' two prefixes made one; every `.nb.lnk` in the message line on `--edge` (1.4.11), with standards
  drawing a message that carries one.
- **146, the rest:** `writerKey`/`whoAmI` not captured into an import being prepared; `importState`'s direct `prio27appn`
  write through `lsSet`, reopening only when the plan landed; the dead `if(res.back) _sideGen=g0;` removed (or its mutation
  marked equivalent with backing); the unreachable `!driveStoreOn()` term removed; a cancelled download (the `_dlOnly`
  question's wording no longer claims the copy holds the changes).
- **146, test gaps:** a mutation dropping `lsMarksBack`'s `_dlOnly` restore; `W214.refuse()` no longer resetting the marks by
  hand; `import-file.mjs` A, D, `--gtk` comparing bytes; W2 check 5 through `impShellEmpty`'s `impPlanHasReqs` branch;
  audit-inject drawing the file route's other file-name sinks; `save-target.mjs` E seeding and naming the storage seam as
  storagefull does.

### 1.4 W4 — the small fixes (items 131, 135; handoff 18–20; item 146's journal and edit-box findings)
- **131:** `fydpGather` passes `strict` to `fydpStoreFolder`; the Spruills (`spDefs`) and Locks by appropriation (`cycOverview`)
  read another appropriation's folder copy the same way when newer; the house style's indents get `horizontal="left"` (every
  dressed workbook's style bytes move; their byte checks move with them, values unchanged).
- **135, the four gaps:** WBS from execution data does not propose a prime's requirement-level paragraph; a CLIN request that is a
  list of text figures sums as figures in `clinAskTot`; a re-import's fingerprint (decide: make `aceFingerprint` read the same
  whole-dollar figures, or say why not); another appropriation's stored budget cache (decide: read it live, or say so on the
  surfaces that read it). Leave its four "Brad's call" items as built.
- **v2.12 question 1:** a CLIN request that is not a list is reported on opening, once, naming the requirement and CLIN.
- **The guide's five-year text** (handoff 19) describes the v2.04 workbook; measure the guide in a booted board (budget 70,000).
- **The Priority Drill's narrow columns** (handoff 20): its unbanded and TOTAL columns widened so no figure shows ###.
- **The five-year workbook's "Allocated" renamed Funded** (handoff 18 a), on the panel too; every suite quoting it moves.
- **146:** the edit box offers "— follows the PMO and prime rules —" where a "no SI code" is stored; a by-id journal line in a
  year whose added ids repeat is not refused as "no longer in FY…" (and `JRNL_NOT_PLACE`'s title for such a year); a whole-year
  roll whose CCaR is set afterwards is still the same work to `yrCopySame`.

## 2. Who owns which function (no builder edits another's)

- W1: `fitTop` and the context bar (`cycMenuHtml`, `cycBarSync`, `cycFitOf` readers), `cycRetagNext`, `cycRetagLead`, the lock
  message, `cycLock`'s refusal, the cycle parts of `pkgApply`, `consTakeApply`, `importBoards`, `pkgDiff`, `cycTake`'s wording.
- W2: the boot's DATA / plan choice, `_bootStray`, `strayOther`, `pubsFor`, `apStoreOf`, `fydpStoreLocal`, `cycCarrySaved`, the
  new `storage` listener, the Save record writer it calls, `fdc*` box redraw and Export check, `BAND_PEND_KEY` handling.
- W3: `lsSet`, `baseSet`, `baseMarkDirty`, `keepAside`, `jrnlMarkSeen`, `pmoMineSet`, `uiPrefWrite`, the menu groups, the
  stopped-import marks, `SIDE_OPEN_KEY`, `fh*`, `impHand*`, `impFile*`, `writerMay`, `dd_save`, Save diagnostics.
- W4: `fydpGather`, `spDefs`, `cycOverview`'s read, `_houseBase`/`_housePlan`, `execWbsScan`, `clinAskTot`, `aceFingerprint`, the
  guide's `t-fydp`/five-year text, the Priority Drill export, `fydpBook*` headings, the edit box's SI option, `jrnlCustomHere`,
  `yrCopySame`.
- A function two builders must change: the one that does not own it writes the change in its notes under **For the
  integration** and the lead makes it. `cycApplyAll` is W1's to call and nobody's to change but through the lead.

## 3. Integration (the lead)

Merge W1–W4 in that order; fix what the merge shows (`v2.15 integration` slot, `v215-int-*`); mcount; every suite whole; every
browser check; prove every v2.15 mutation and retarget together on the merged board; review with skeptics; fix; bump `BUILD`
once; the ship notes (`CLAUDE.md`, `NEXT-VERSION.md` › Shipped › v2.15, `WORK-ASSIGNMENTS.md`); push; a draft PR. Merge on
Brad's word.
