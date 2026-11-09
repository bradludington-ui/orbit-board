# v2.15 review RV-A — kept work on another requirement list; a stopped Save over another tab's copy; layout S's storage island

Branch `v215-rv-a`, from `dbfc7c4`. Both board findings were reproduced on `dbfc7c4` first (the skeptics' repros `sk-a/a1c.mjs` and
`sk-a/a2.mjs` with `Q=1`), and the new check fails there on every non-CONTROL line (run on `git show dbfc7c4:prioritization-board-grid.html`
through a slimmed audit-import: 6 FAILING CHECK(S) — the offer, the refusal (two), the file (two), A2).

## What changed

### A1 — kept work on another requirement list is never put back on this page (a v2.15 regression from item 142)
- **`keptOtherList(st)`** (beside `keptPutBack`): true when the kept copy carries a requirement list of its own (`_hasData(st.dataPack)`),
  this page's list is not the consolidated payload's (`!_hasData(APPNS[APPN])`), and the SET of requirement ids differs from this page's
  (`BASE_ITEMS`, which is what `dataPackOf()` writes). Never throws. `keptOtherListNow()` reads the kept slot.
- **`keptPutBack` refuses first**, after the locked-view gate and before the save-busy check, the question or anything else: nothing is
  asked, the kept slot, browser storage and the screen stay as they were, and the line says the kept work belongs to another
  requirement list, offering *Save it as a file* (`keptSaveFile`) and *discard it*. Every route to `keptPutBack` (the opening, the
  save state's button, the History & recovery item, `keptOccupiedMsg`, the swap's "put that back", the Put this back and folder
  messages) meets it.
- **`keptOfferHtml()`**: the opening's "kept aside" line (`_bootKept`) and `bootKeptNote()` offer *save it as a file* and *discard it*
  for such a copy, *put it back* otherwise. The other messages that name `keptPutBack` keep their wording (the refusal covers them).
- **`keptSaveFile` needed no change**: it already writes `savedHtmlOf(pubsFor(st), …)` with the kept copy `st` as this appropriation's
  slot, carrying its own `dataPack`; a fresh browser opens it on that list (checked: B's list, order C,A,B,NEW-1, the note, the added
  requirement, the allocation).

### A2 — a Save stopped before it writes, whose own save() storage refused, leaves another tab's copy
- In `_saveInPlaceFileRun`, the stop mark's `raw1` is taken only when this save's `save()` actually wrote storage: `_persistFail` is
  false after `buildSavedHtml()` and storage differs from `raw0`. Otherwise `raw1` stays undefined, so `saveStopBack`'s `ours` cannot
  read another tab's copy (`raw1===raw0`) as this page's and `persist()` over it.
- W3's item-146 case (save() wrote the pen line, a later edit refused) is unchanged: there save() wrote, `raw1` is set, and the
  W3 block's (b) still passes (whole audit-import).
- **Not in scope, as the skeptic said:** the general two-tab overwrite by an ordinary `save()` (this page's `persist()` writing over a
  copy another tab saved) predates v2.15 and happens whenever storage is not full; nothing here changes it.

### layout-fits S — one retry for Chromium's storage island (tests only)
- A case whose first attempt reports the harness's own "this tab cannot see what the seed page wrote" is run once more in a fresh
  context, re-seeded, and the run prints which cases were retried (a fact line). Every finding of an attempt that saw the seed
  stands; a second attempt that cannot see it fails as before. Nothing else in S changed.

## Decisions a person could reverse
- **Compared by the set of requirement ids**, not the data pack's JSON (`_bootPre` compares JSON). An older copy of the SAME board whose
  pack differs only in a title or an ask is still put back (as before v2.15); one whose list gained or lost a requirement is refused
  and offered as a file. JSON would refuse more.
- The refusal also stands where this page is a shell (empty list) and the kept copy carries one: put back, its requirements would have
  no list to stand on.
- A kept copy with no list of its own, or a page whose list comes from the consolidated payload (`APPNS`), is never refused.
- Only the opening's line and `bootKeptNote` change their offer; the other messages naming *put it back* rely on the refusal.

## Checks
- audit-import, slot `// ==== v2.15 review RV-A ====`: "v2.15 review RV-A — kept work on another requirement list is saved as a file,
  never put back here; a stopped Save leaves another tab’s copy (A1, A2)". A1: the offer; the refusal (no question, storage, kept slot
  and screen byte-identical, the line); the file, opened in a fresh boot, is B whole; CONTROL: kept work on the board's own list is
  offered back and put back. A2: r1-stop-writes-over-tab's shape (a quota that refuses save()'s longer write and takes persist()'s,
  the browser refusing write access): storage still holds the other tab's copy.

## Mutations (`v215-rv-a-*`, mutate.mjs's RV-A slot) and retargets
| id | caught |
|---|---|
| v215-rv-a-putback-other-list | CAUGHT (4 checks) |
| v215-rv-a-otherlist-never | CAUGHT (5) |
| v215-rv-a-otherlist-any | CAUGHT (control) |
| v215-rv-a-offer-putback | CAUGHT |
| v215-rv-a-file-screen | CAUGHT |
| v215-rv-a-raw1-any | CAUGHT |
| v200-u10-kept-gate-after-question (retargeted: its find/repl carry the new refusal) | CAUGHT by audit-recon "v2.00 (U10) — “↶ work kept aside” pressed in a locked view" |
| v214-rv1-c-stop-after-unset (retargeted: the line now reads into `r1`) | CAUGHT by audit-import "v2.14 RV1-C — a Save that stops before it writes" |

`recovery/v215/proofs-RV-A.json`, `proved-RV-A.jsonl`: 8 of 8 CAUGHT. mcount: 3,765 entries, each once.

## Results
- The new block fails on `dbfc7c4` (6 FAILING CHECK(S): the offer, the refusal x2, the file x2, A2) and passes here.
- `npm run check`: all checks passed.
- Whole, one at a time through heavy.sh (HEAP=8192): audit-import, audit-board, audit-other: ALL CHECKS PASSED each. No older
  expectation needed moving.
- Browser (HEAP=4096): savetarget, storagefull, fileimport pass; layout fails only on its carried D x8, and S holds (14 states read; no
  case needed the island retry this run, so the retry line did not print).
- Not run: the sweep, validate:math (rules).
