# v2.23 review RV-C — item 159's C findings (Allocate and mandatory off)

Fixer RV-C, branch `v223-rvc` from `56aa6c6` (the review's four fixer slots). Every finding below was reproduced on `56aa6c6` by a
reviewer and a skeptic (probes in the session scratchpad: rv3/p7–p11, b1, b2; sk3a/q1, q3, q5, q7, q8; sk3b/c78), re-run here
against the fixed board.

## What was fixed

**C1 (data loss): a board replaced under Allocate's draft.** Three layers, each closing a different route:
- `avSave` reads the board again before it writes (`avMovedUnder`, in the RV-C slot: v2.08's erSave rule). Each change carries the
  figure stored when it was typed (`AV.was`); where the stored figure (`avBase(id, tiers())`) differs now -- a change-journal Put
  back, or any route that edits a split under the view -- nothing is written, each moved figure is named (requirement, service, lane,
  now, typed against, held) in a message kept unread (`statKeep`), and the draft is kept, read against the board as it now is (its
  `was` moved to the figure stored now; a figure the draft now agrees with leaves it). **Save again then writes it**: the person has
  been told by name, so the second Save is a deliberate choice (decided in the fix; see below).
- `avSync` remembers the plan's identity (`AV.ms === MS`) beside the year, appropriation and cycle. A load that replaces `MS` --
  Put back work kept aside, `adoptShared`, the folder's Load theirs (`_driveResolveRun`), a package for the board on screen, a full
  import -- drops the draft and says so, kept unread. Its words were corrected for one change ("was dropped").
- The automatic loads leave the board alone while Allocate holds a draft: `sharedArrived` and `driveStorePull` test
  `DIRTY || avHeld()` (`avHeld()`: changes plus boxes holding unreadable typing), and their messages name Allocate.
- Checked and left as they are: `beforeunload` already asks (`avUnload`); `unsavedNow()` drives the save indicator and the
  as-it-was file's list, which read the board and its lists -- the draft is not in the board, and keeping it aside would keep
  nothing of it; `screenUnsaved()` decides what is kept aside, same reason; the Live autosave writes the board, not the draft.

**C2: the mandatory switch's journal line.** `jrnlUndoable` refuses a line whose path is `['mandOff']` (`jrnlMandOffLine`), the
journal shows *not put back here* with the reason on hover (`jrnlNotMandOff()`: the switch in Allocate says what happens to the
money first), and `jrnlUndo` called on it says that reason before anything is asked. `JRNL_NAMES.mandOff` = 'mandatory funding
(on or off)'; `jrnlShow` reads that line's values as *on* / *off* (it read "not set" / "yes").

**C3: mandatory in a year where it is off.**
- `yearCopy` sets a split's mandatory to $0 when the target year has mandatory off (`yrMandOffCarry`, in the RV-C slot) and returns
  `mandZero`; Copy / Move to year and Roll requirements forward say how much went across as $0 and into which years. Its
  discretionary goes as it is.
- `jrnlUndo` refuses, before asking, to put back a funding-source line that would give a requirement more mandatory than it holds now
  in a year with mandatory off (`jrnlMandBack`: the line's value laid over a copy of the requirement's funding source; the year read
  from the line, so FY27's line put back from FY28 is judged by FY27). The same rule as `setFsrcSvc`. **This reverses W3's decision 6**
  ("Put back from the journal still puts a cleared figure back"), as the review asked; W3's check now expects the refusal, and then
  the put back once mandatory is on again (`// v2.23 review RV-C (C3)` in audit-board's W3 block).
- `drewWhy(drawnV, capV, offFy)`: given a year, it says "mandatory funding is off in FYxx". `drewLine` and `drewTip` pass it through;
  the RECORD card's mandatory cell passes it (its column is hidden while off, so this is for completeness). `ndData`'s reason for a
  mandatory line while off is "USAF mandatory: mandatory funding is off in FY27" -- it said the lane ran out above this rank.

**C9: a switch that does not happen keeps the draft.** `avLeave` only asks now; `avDraftDrop()` discards where each switch is
certain: `uiSetMode` after the question, `switchYear` once every refusal and question is past (just before the year changes),
`cycView` once the cycle is known to hold a year, `switchAppn` just before `reopenPage()`.

**C10: a pasted figure with cents** is said, each one ("“10.6” as $11"), as a typed box says it; `avPasteGrid` also returns
`rounded`.

**C7 (Chromium): the keyboard after a redraw.** Every control `avDraw` redraws carries a `data-k` its focus restore already finds:
the view and Edit/Present switches (`ui:sheet`, `ui:lane`, `ui:edit`, `ui:present`), the mandatory switch (`ui:mand`), Review,
Discard and Save, the service tabs (`ui:svc:N`), the lane switch (`ui:lk:d|m`), each row's checkbox (`ui:sel|<id>`), Full and $0
(`ui:full|<id>`, `ui:zero|<id>`), the bulk buttons and Move. The box keys (`id|d|i`) are unchanged.

**C8 (Chromium): the mandatory-off box.** `mandBoxDraw` notes what holds the keyboard inside the box -- a radio by its name and
value, anything else by its id (`#mandAll`, `#mandMore`, `#mandKeep`, `#mandGo` given ids) -- and puts the keyboard back on it after
the body is drawn anew; *list them all* gone, the keyboard goes to the list.

## Decided in the fix (Brad can reverse)
1. A refused Save re-reads the draft against the board as it now is, so a second Save writes it. The alternative -- refuse until
   Discard -- would make every other change in the draft unsavable without retyping all of it.
2. A draft dropped by a load is dropped, not offered back: it was typed against figures the new plan may not hold.
3. `jrnlMandBack` refuses only what would RAISE a service's mandatory above $0 (and above what it holds now), so lines that put back
   discretionary, or lower mandatory, still go back in a year with mandatory off.
4. `yrMandOffCarry` handles a per-service split (`mv`) and a legacy scalar split (`mnd`). A legacy Force Mand (`m:'mand'`) is carried
   as it is: it states where money comes from, not how much, and draws nothing while mandatory is off.

## Checks
Each fails on `56aa6c6` unless labelled CONTROL (run there with `BOARD=`: 20 failing checks, every CONTROL passing).
- audit-board, `// ==== v2.23 review RV-C ====`, three blocks:
  - "v2.23 review RV-C — Allocate’s draft and a board replaced under it: …" -- (1) the rendered journal's Put back, then Allocate's
    rendered Save: refused, named, kept, rebased; Save again writes; (2) Put back work kept aside from the left menu's item: draft
    dropped and said, Save writes nothing; (3) `sharedArrived` newer, DIRTY false: nothing replaced, said; (4) `driveStorePull` with a
    stand-in folder (its four helpers replaced in the page) returning a newer copy: nothing loaded, said.
  - "v2.23 review RV-C — mandatory off: its switch is not put back from the journal, and no mandatory dollar is carried or put back
    into a year where it is off" -- the switch through Allocate's header and the box's button; the rendered journal row (name, on, off,
    no button, *not put back here*); `jrnlUndo` on it; FY27's mandatory line put back from FY28 refused before asking; Copy to year
    (`xferYear`) into FY27 off, and its message; `ndData`'s reason.
  - "v2.23 review RV-C — Allocate: a switch that does not happen keeps the draft; a pasted figure rounded to the dollar is said" --
    FY30 not started (OK, Cancel, Cancel), a cycle holding no year, another appropriation refused by storage (`Storage.prototype`
    throwing for `prio27appn`), a CONTROL that a mode switch still discards, and a paste with cents.
- audit-board W3's mandatory-off box block, changed on purpose (`// v2.23 review RV-C (C3)`): put back while off is refused; on again,
  it is put back.
- tools/alloc-view.mjs G (Chromium): Enter on One lane, Space on a row checkbox, Enter on a short row's Full, Enter on a service tab --
  each keeps the keyboard on that control; ArrowDown and ArrowUp in the box's radios keep it on the radio checked. **Fails on
  56aa6c6** (see Run), passes here.

## Mutations
21 new (`v223-rvc-*`, mutate.mjs's RV-C slot) and 6 retargeted to the lines RV-C changed: `drew-line-silent`, `drew-echoes-directed`
(DREW_LINE_FIND/ECHO), `why-always-lane`, `why-always-alloc` (DREW_WHY_FIND), `sidecar-typed-replaced`, `v200-u13-pull-unchecked`.
The discard is named `avDraftDrop` (not `avLeave…`) so that `v223-w3-leave-no-ask` and `v223-w3-year-no-ask` still `mcount`: 3,543 entries, each matching once. Proofs: `recovery/v223/proofs-RVC.json` → `recovery/v223/proved-RVC.jsonl`.
Not in mutate.mjs (browser only; the sweep's suites are jsdom): C7 and C8 -- proved by hand on their mutants against alloc-view G
(see Run). `v223-rvc-mode-keeps-draft` is caught by a check labelled CONTROL (it passes on `56aa6c6`, whose `avLeave` discarded
on its own): it guards where the discard moved to.

## For the integration
- `avLeave` no longer discards: any new caller must call `avDraftDrop()` where its switch is certain.
- `drewWhy`/`drewLine`/`drewTip` take an optional fourth argument (a fiscal year) for a mandatory cell in a year with mandatory off;
  W2's Across the FYDP hides such cells and is untouched.
- RV-D owns the mandatory-off wording elsewhere; nothing of theirs was touched.

## Known gaps
- An explicit load (Put back work kept aside, Load theirs, adoptShared) drops the draft after the person asked for the load, rather
  than asking about the draft first; the message says so, kept unread.
- `cycView`, `switchYear` after the switch: if `avDraftDrop` were ever skipped, `avSync` would still drop the draft (with a message),
  so `switchYear`'s and `cycView`'s placement is not covered by a mutation (it could only change the wording).

## Run (on the finished tree)
- Proofs: **27 of 27 CAUGHT** (21 new, 6 retargeted), none by a block that threw (`proved-RVC.jsonl`).
- Browser-only, by hand: alloc-view on a mutant with the view switches' `data-k` taken out fails G's One lane check (1 FAILING); on a
  mutant with `mandBoxDraw`'s restore turned off, G's two box checks fail (2 FAILING). On `56aa6c6`, G fails 6 of its 7.
- The three new audit-board blocks on `56aa6c6`: 20 failing checks, every CONTROL passing.
- `npm run check` passes; `npm run alloc` (45 checks), `keys`, `dialogs` pass; `standards`: 0 findings, nothing new.
- audit-other, audit-import and audit-inject whole: ALL CHECKS PASSED.
- audit-board whole: 4 failing checks, **all four also failing on `56aa6c6`** (run there on those two blocks alone: the same 4) --
  v2.22 W3's RECORD card bar (the integration's *Open full page*) and v2.23 W1's tab list (W2's *Across the FYDP* tab). Not RV-C's;
  left for the lead. Every other block passes, the RV-C and W3 blocks included.
