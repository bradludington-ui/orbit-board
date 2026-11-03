# v2.14 integration, sub-slot INT-B: INT-7 … INT-11 (the stray rule's two guards, the leave question, a refused cycle choice)

Branch `v214-intb`, from `5d5383c` (W1–W4 merged, the lead's fixes, `v213-rv-refused-reads-unsaved` and
`v213-136-refusal-reads-unsaved` retired). The board was not changed; every edit is inside the INT-B sub-slots of
`audit-import.mjs`, `audit-board.mjs` and `mutate.mjs`, plus the proof files and these notes. The slot board is
`git show ea412ca:prioritization-board-grid.html`.

## Step 0 (contract §11.1)

audit-recon "v2.00 (U32, U33) — an RCN / EEIC list that repeats a key …", slimmed (5 of 79 blocks kept, 1 scenario), 8 GB,
on `5d5383c`: **ALL CHECKS PASSED**, 2 min 48 s. It imports through the storage route and reopens the importing board file
(C17's case; 60 failing checks on the unguarded prototype). Nothing to stop for.

## The checks

audit-import, between `// ---- INT-B (INT-7, INT-8, INT-9, INT-10) ----` and its end; three helpers stand at the top of the
sub-slot: `intPlanOf(store, id)` (title, allocation and note length of one requirement in the year on screen),
`intKept(ev)` (every `.kept` key), `intLeave(ev)` (a cancelable `beforeunload` dispatched on the window: was it prevented?).

- **INT-7** `v2.14 INT — a full import that lands through browser storage, run from a populated board file, opens as the import
  when that file is reopened, and its next Save writes the import in every appropriation (items 140, 141)` (8 checks). w2Fx's
  OLD.html imports NEW through `fullImportText` (`w2Import(…, 'none')`), then `boot({html: OLD.html, ls: after})`. Expected from
  w2Ap's and w2Gen's literals: A titled `NEW O&M`, allocated 777, an empty note (OLD: 333 and a 15,000-character note); F
  `NEW FULL FUND`, 777, a 20,000-character note (OLD: 333, none). Reads: O&M on screen, Full Fund as `pkgStoreOf('ff')` reads it,
  `DATA.items`, `S.order` and `MS.cycle` (NEW's, from NEW.html's own pubState), no `.kept` key, and the next `buildSavedHtml()`
  (both appropriations' plans and `w2Saved`'s generation and locked cycles). CONTROL on the slot commit.
- **INT-8** `v2.14 INT — import into the program, save it, choose the cycle for every appropriation, open Full Fund: Full Fund
  shows the tag and nothing is kept aside (items 136, 141)` (7 checks). The attackers' `mainpath.mjs`, driven: the program in a
  browser holding nothing imports w2Fx's NEW through `fullImportText`; the program reopens and 💾 Save (`saveInPlaceFile()`) writes
  it in place through W1H's stand-in file holding the program's own bytes; that file reopened, BES28 picked from the context bar's
  rendered `#dd_cyc` list (`toggleMenu('cyc')`, the item clicked, as the v2.13 block picks one); Full Fund opened from the file
  (`appn: 'FULL FUND'`): on BES28, the bar reads `BES28 ▾`, the import's Full Fund (title, 777), nothing kept aside and the opening
  says nothing of it, and its next Save writes both appropriations on BES28. CONTROL on the slot commit.
- **INT-9** `v2.14 INT — blank work over a requirement list from another board never mixes the two when an older board file opens
  (items 140, 141)` (6 checks). The older file: W14SC's A, B, C, A allocated 500 with a note. Then, later, this browser: another
  board's list X1, X2 in its plan's data pack, X1 allocated 42 with a note, its record `{file:0, dirty:true, blank:true}`. Opening
  the file: `DATA.items`, `S.order`, `S.alloc`, `S.notes`, every ordered id on the list, nothing kept aside, and the next saved
  file's data pack, order and allocation — all storage's. CONTROL on the slot commit (v2.13 opens storage's board whole).
- **INT-10** `v2.14 INT — while the file route holds the only copy of a file it chose, leaving the page asks (item 141)`
  (12 checks), with W214's `fx`, `refuse`, `picker`, `downloads`, `press`, `box`, `settle` and `rel`: (a) after the refusal
  leaving does not ask (CONTROL); while the imported board is being written (the picker's close held on a gate) nothing is on
  screen only (`memOnlyNow()` false) and leaving asks; written and read back, the page reopens and leaving does not ask
  (CONTROL); (b) while the board as it was is being written (step 1 planted as W2's (g) plants it) leaving asks, and once it is
  saved it does not; (c) a failed close: both copies offered, leaving asks, still asks with one downloaded, not with both, and
  the downloads are the file imported byte for byte and the imported board as a board; (d) the board could not be built: the
  file imported alone, leaving asks until it is downloaded.

audit-board, between `// ---- INT-B (INT-11) ----` and its end:

- **INT-11** `v2.14 INT — a change refused before “put every appropriation on a cycle” stays on screen only, and leaving still
  asks (item 141 F)` (6 checks). W3's probe made a check, on the probe's own fixture, with two changes so that each step is the
  board's own path: the Full Fund package goes through **`pkgApply`** itself (its `lsSet` refused at `prio27ff`, then
  `PUBS.ff=next`), not the probe's hand-written `lsSet` + `PUBS.ff`; and PB28 is **picked from the context bar's rendered list**,
  not `cycApplyAll()` called. Checks: the package loaded, storage still holding the old Full Fund and PUBS the package (CONTROL);
  on screen only (`memOnlyNow()` true, `_lsRefused` `['prio27ff']`, leaving asks); the cycle question asked once, refused at OPN,
  `MS.cycle` unchanged and the message "Nothing was changed." (CONTROL); storage byte for byte as before the choice (CONTROL);
  then `memOnlyNow()` still true, `_lsRefused` still `['prio27ff']`, PUBS still the package, and leaving still asks.

The v2.13 block `v2.13 — one PPBE cycle for every appropriation, chosen at the top (item 136)`, slimmed: ALL CHECKS PASSED (28 s).

## On the slot board, and on each mutant (slimmed blocks, `SUITE_CHECKS` recording every check)

| Board | INT-7 | INT-8 | INT-9 | INT-10 | INT-11 |
|---|---|---|---|---|---|
| this board (`5d5383c` + INT-B) | 8/8 pass | 7/7 pass | 6/6 pass | 12/12 pass | 6/6 pass |
| slot (`ea412ca`) | pass (CONTROL) | pass (CONTROL) | pass (CONTROL) | **10 fail** (every check but its two CONTROLs) | **3 fail** |
| `v214-int-stray-unguarded` | **5 fail** | **3 fail** | **3 fail** | pass | — |
| `v214-w1-stray-over-pack` | pass | pass | **3 fail** | pass | — |
| `v214-int-cyc-erases-refusal` | — | — | — | — | **2 fail** |

What the unguarded mutant shows, read from the checks: INT-7 reopens on OLD's O&M (`OLD O&M`, 333, the 15,000-character note,
`POM|2027`), keeps the import aside in `prio27om.kept`, and its next Save writes OLD O&M with NEW Full Fund (`["OLD","NEW",…]`) —
the attackers' "om OLD, ff NEW". INT-8 opens Full Fund on `PB|2027` with the bar reading `⚠ Mixed ▾`, keeps the tagged copy aside
in `prio27ff.kept` and says so, and its next Save writes Full Fund on PB27. INT-9 (both mutants) shows DATA `[X1, X2]` with the
file's plan: allocation `{A: 500}`, note `{A: 'FILE note'}`, the blank work kept aside — the mix. (`S.order` reads `[X1, X2]`
even then: the order is reconciled against `DATA` on opening, so the mix shows in the allocation and the notes, which is why the
check reads all three.) On the slot board INT-11's first non-CONTROL check fails too: v2.13 had no `memOnlyNow` and its put-back
cleared the refusal itself.

## Mutations (`mutate.mjs`, INT-B slot)

- `v214-int-stray-unguarded` (area `opening`): `const _bootStray=_bootOwnRead && _bootBase.dirty===true && !(+_bootBase.file) &&
  _bootBase.blank===true && !_bootOwnPack;` → `const _bootStray=_bootOwnRead && _bootBase.dirty===true && !(+_bootBase.file);`
  (both of C17's guards).
- `v214-int-cyc-erases-refusal` (area `cycApplyAll`): `      if(res.back) _sideGen=g0;` → `      if(res.back){ _sideGen=g0;
  W.forEach(function(w){ delete _lsRefused[w[0]]; }); }`.

mcount after: `{"entries": 3384, "once": 3384}`. Each mutant parses (`node tools/check.mjs <mutant>`: "main script parses").

Proofs (`recovery/v214/proofs-INTB.json`, `JOBS=1 HEAP=8192 prove.py` → `proved-INTB.jsonl`, 36 s): both blocks clean on this
board, then **`v214-int-stray-unguarded` CAUGHT** (11 failing checks: INT-7, INT-8 and INT-9 together, none by a throw) and
**`v214-int-cyc-erases-refusal` CAUGHT** (2). W1's existing **`v214-w1-stray-over-pack` against INT-9 alone**, slimmed (a
scratch proof file, not committed): clean, then **CAUGHT** (3).

## Decided in the build

- **INT-8's Save on the slot board.** v2.13 does not write the program it ran in: its 💾 Save downloads the board instead (item
  141 D, which INT-1 and W1 hold). So that INT-8 stays a CONTROL there, a board whose Save wrote nothing takes the attackers' own
  stand-in (`buildSavedHtml()`, recorded as a Save in place records it: `LASTKNOWN`, `baseSet({file, dirty:false})`, `DIRTY=false`).
  On this board and on every mutant of it the real Save writes the stand-in file, and that file is what is reopened.
- **INT-8 picks BES28**, not PB27: w2Fx's NEW is already locked, and so tagged, on `PB|2027` in both appropriations, so a choice
  of PB27 would change nothing. BES28 is offered in the bar's list (a cycle after the latest).
- **INT-11 drives `pkgApply`** with a package object (`{spmtPkg:PKG_VER, ap:'ff', seq:1, by, ts, ms}`, an issued load, its
  preview confirmed) rather than the probe's direct `lsSet`; the store and refusal it leaves are the probe's.
- INT-10's two CONTROL checks are the states in which nothing is held (before Write; after a write that lands): they pass on the
  slot board as they must. Every other INT-10 check fails there.

## For the lead

- No board defect found. Every check passes on `5d5383c` as merged.
- Whole suites on this branch (8 GB, one at a time): **audit-board** ALL CHECKS PASSED, 6 min 24 s; **audit-import**: see the
  commit (run after these notes were written). `npm run check`: all checks passed. `boot-same`: identical either way.
- §11.5's integrated proof list should carry the two ids with the caughtBy lines in `proofs-INTB.json`.
- INT-8 reads the bar's text (`BES28 ▾`); a change to `cycBarSync`'s wording moves it.
