# v2.14 review round 1 — fixer RV1-B (cycles, packages, storage)

Worktree `/home/user/orbit-wt/v214-rv1b`, branch `v214-rv1b`, from `44aa984`. Probes copied into
`scratchpad/v214rev/rv1-B/` (r1a-storagefull, r1a-savetarget, r1b-critic, r1a-critic, r1a-journeys) and pointed at this
worktree's board; every finding was reproduced there before anything changed.

## The findings, in order of severity

### 1. own-package-refused-not-on-screen-only (data loss)

**Reproduced.** `p3.mjs` (room) on 44aa984's board: the O&M return merged, on screen, not stored; `_persistFail` false,
`memOnlyNow()` false, beforeunload not cancelled; picking FULL FUND reopened the page (navs 1) and the reopened O&M had no note.
`p6.mjs` (the hand-over hold, after a file save): on screen, not stored, DIRTY false, memOnly false, the save state "Saved 1:39 PM".

**Fixed** in `pkgApply`'s own-board branch: the merge is a load, counted as one (`loadCounted()`: `_saveGen++`, DIRTY, and this
browser's record marked unsaved -- what the other load paths have done since v2.02), and `_persistFail=!wrote`, so a refusal
(room, or the hold) is on screen only exactly as persist() counts one, and a stored merge is not. The write itself is unchanged
(lsSet of the package's own `next`), so the stored copy keeps the package's own data pack and `by`; routing through save() would
have replaced the package's data pack with this page's (dataPackOf) and stamped the importer as its author. Re-run: p3 memOnly
true, leaving asks, the box refuses and reads O&M; p6 DIRTY true, memOnly true, "Unsaved changes".

One behaviour beyond the finding, said here: a merge storage TAKES now marks this browser's record dirty (it did not), so a newer
board file opened later keeps the merged return aside instead of replacing it unasked -- the rule every edit already had.

**Check** audit-board `v2.14 RV1-B — a package for the board on screen that browser storage refuses, or the hand-over hold holds,
is on screen only, and nothing leaves it unasked`: (a) CONTROL stored; (b) refused for room -- counted, leaving asks, the box
(driven by a change event) reopens nothing and reads O&M; (b2) 💾 Save ends it; (c) the hold, after a file save -- unsaved, on
screen only, not "Saved"; (d) stored after a file save -- the record dirty against the same save.

### 2. other-appn-package-erased-by-older-copy (data loss)

**Reproduced.** `p5.mjs '' ladder` and `'' issue`: after the refused Full Fund package, PUBS.ff held it, memOnly true, leaving
asked, `_lsRefused` ["prio27ff"]; after bandCopyAll (or pkgIssue('ff')) PUBS.ff no longer held it, memOnly false, leaving did not
ask, `_lsRefused` [], and buildSavedHtml() carried no package.

**Fixed.** `apStoreOf(k)` (new, beside pkgStoreOf): another appropriation's plan as Save writes it -- the newer of storage's copy
and PUBS by `ts`, storage on a tie (pubsFor's rule, fydpStoreLocal's). `pkgStoreOf`, `bandPeers` and `bandCopyAll` read it.
Re-run: the package survives both, memOnly true until saved, the saved file carries it, the issued package carries it.

Decided while fixing (not in the finding): **where the copy passed over is this browser's unsaved work** (storage's copy older
than PUBS, and `ownUnsaved` -- cycApplyAll's test -- says it holds work no saved copy has), either reading loses something: the
old order put storage's work over the file's newer copy, the new order would put the file's copy over storage's unsaved work.
So the three WRITERS leave that appropriation alone and say why: `bandCopyAll` writes neither copy (the ladder held for it under
BAND_PEND_KEY, written for every peer as before, goes on when that board opens, after its own opening keeps the work aside);
`pkgIssue` issues nothing ("Full Fund was not issued — this browser holds Full Fund work the saved file does not have…");
`pkgApply` takes nothing ("NOT IMPORTED — …"). `apHeldWhy(k)` is the one sentence. Before v2.14 RV1-B, pkgApply asked its
conflict question about storage's work and silently dropped the file's newer copy from PUBS; it now refuses until Full Fund's own
board has settled it. Rare (it needs two machines saving one file, or this browser's unsaved Full Fund work plus a newer copy on
this page), and nothing is lost either way.

**Check** audit-board `v2.14 RV1-B — a package held on this page alone, or a newer file copy, survives copying a ladder and
issuing; unsaved work in storage is left alone`: (a) ladder, (b) issue, after the refused package; (c) nothing refused, the
file's newer Full Fund wins over this browser's older clean one (skeptic 1's sk3); (d) this browser's unsaved Full Fund, older
than PUBS: the ladder, the issue and a package each leave both copies byte-identical and say why.

### 3. cyc-record-stale-file-ts (wrong question)

**Reproduced.** `p3-cycle-stale.mjs`: after two Saves, cycApplyAll wrote Full Fund's record `{"dirty":true,"file":<PUB_FILE_TS>}`
while LASTKNOWN and the file held the later save; Full Fund opened with "…The file has been saved since then as well — by unknown
… ⬅ Import the file", and its Save asked HOLD ON about Brad's own O&M save.

**Fixed** with the skeptics' refinement, not bare LASTKNOWN: `_pubsFileTs` (a var beside PUBS) is the save of the board file
PUBS was read from or last written as -- PUB_FILE_TS at opening, then `wrote` after each successful write in
`_saveInPlaceFileRun` (beside `LASTKNOWN=wrote`). cycApplyAll records it for a plan it took from PUBS. A page that opened this
browser's own copy and never wrote the file keeps PUB_FILE_TS, which is still the save PUBS came from. Re-run: record file =
the file's save; Full Fund opens "Opened with this browser’s copy … 💾 Save writes them into the file", its Save asks nothing
and writes. The PMO copy's save (`pmoSaveCopy`) does not move it: a copy cannot choose the cycle for every appropriation.

**Check** audit-board `v2.14 RV1-B — after this page saves the file, putting every appropriation on a cycle records that save
for each one it takes from the file` -- the probe's path made a check, from a two-appropriation file built in the block.

### 4. critic/cyc-all-refused-on-file-route-board and cycle-for-all-refused-on-big-board (one defect)

**Reproduced** both: `pA-cyc-bigplans.mjs` (four plans of ~1.29M characters, each fits, all four do not): the file route, the
new file opened, Save twice, then cycApplyAll('BES|2028') -> false, "⚠ The PPBE cycle was not changed — browser storage refused
OPN board data (QuotaExceededError). Nothing was changed.", the file still untagged; the same file on Full Fund -> true. `p2.mjs`
the same at small size.

**Fixed** as the critic proposed. In cycApplyAll, when lsAll is refused, put back whole (`res.back`), the refusal is for room
(`/quota/i` on the browser's reason), and every other plan was read from the file (`p.fromFile`), the plans are carried on this
page instead of refusing: `PUBS[k]` takes each tagged copy (with its `(cycle)` journal line, as before), each key is counted as
a refused list exactly as lsSet counts one (`fileMark('side')`, `fileStored(k,'side',false)`), so memOnlyNow is true, leaving asks
and switching waits; the board on screen is tagged and saved as before; the line says "Browser storage cannot hold the other
appropriations’ plans: … are on BES28 on this page only, and 💾 Save writes them into the file. Until it is saved, closing or
reloading this page asks first, and switching appropriation waits". Storage is left exactly as lsAll put it back: nothing
half-lands; no `.base` record is written for them. 💾 Save (pubsFor takes the newer PUBS copy) writes every tag, and sideWrote
ends the marks. A plan read from storage, the hand-over hold, or a put-back that was not whole, is refused as before (INT-B's
check still holds). The INT-11 line `if(res.back) _sideGen=g0;` (contract §7: must not change) is kept as it was. Re-run: pA
-> true, every appropriation BES28 on the page, memOnly true, Save writes all four tagged, Full Fund opens on BES28; p2 -> true.

**Check** audit-board `v2.14 RV1-B — on a board whose plans live in its file, putting every appropriation on a cycle tags them on
this page, and Save writes them` -- room for this plan and its growth, not another's, so the board's own change is stored and
the on-screen-only count is the carried plans' alone.

## Critic gap 6 (RV1-A owns that opening): reported, not changed

Probed (`rv1-B/r1a-critic/gap6.mjs`, the journeys fixture rebuilt on this board): with the opening clear's LEFT Full Fund copy
(written by a v2.13 tab after the import's file was written) in storage, choosing the cycle on the import's file asks
"Full Fund — POM27 → BES28" (the old board's tag), tags storage's OLD Full Fund (`fydpStoreLocal` takes it: it is newer than the
file's), writes it with a new stamp and the record `{"dirty":true}`; Full Fund then opens that old plan ("OLD TAB FF EDIT"),
tagged BES28, as unsaved work, and its Save writes it into the import's file. cycApplyAll does not create the hazard -- without
it Full Fund's opening and O&M's Save (pubsFor) take the left copy the same way -- but it stamps it newer than any later file
save. Whatever RV1-A decides about a left copy has to reach every reader of "the newer of storage and PUBS": pubsFor,
fydpStoreLocal, cycOtherOf/cycApplyAll, and now apStoreOf (pkgStoreOf, bandPeers, bandCopyAll), which follows the same rule.

## Mutations

15 new (`v214-rv1-b-*`) and 4 retargeted in place: `v213-136-not-recorded-unsaved`, `v213-136-record-replaced` and
`v213-rv-record-names-old-file` (their finds named `{file:PUB_FILE_TS}` in cycApplyAll's record line, now `{file:_pubsFileTs}`;
the same defects), and `v200-u44-say-no-packages` (below). `recovery/v214/proofs-RV1B.json`, proved into `proved-RV1B.jsonl`. mcount: 3,400 targets, each once.

## A change outside the functions I own (named, as the task asks)

- `destOwnLists` (v2.00 U44): it read each other appropriation through `pkgStoreOf`, which used to be storage's copy first. With
  pkgStoreOf now the newer copy (apStoreOf), audit-recon's T9 ("this browser's Full Fund holds “unassigned”, the board file's newer
  Full Fund does not") lost its warning. One added read, `ls` (this browser's own copy), so the list it checks is the same union as
  before: P[k] (pubsFor's newer), the newer, and storage's own. Mutation `v200-u44-say-no-packages` retargeted in place to
  `[P[k], st, ls]` -> `[P[k]]`, the same defect.
- Other readers of `pkgStoreOf` change with it, by design, to the copy Save writes: the import doors' conflict reads
  (consTakeApply, fullImportText's "work of this board's own" and its ledger carry), destMigrate's fold of other appropriations'
  lists, and the destination-in-use map. Before, each read storage's copy whatever its age; now each reads the copy 💾 Save would
  write. No check of theirs moved (the whole suites below).

## What I left, and why

- **The held ladder's refusal wording** (r1a storagefull, also-noticed, pre-existing): when browser storage refuses the ladder held
  for an appropriation not yet opened (BAND_PEND_KEY), lsSet says "Use 💾 Save to write it into the file", but a held ladder is not
  in the file. A wording fix with nothing lost (the ladder can be copied again); left for the lead to schedule.
- **Critic gap 6**: reported above; RV1-A owns that opening.
- **The tie rule** (storage wins a tie of `ts`, as pubsFor and fydpStoreLocal): no fixture makes the two equal and different, so no
  mutation aims at it.
- **cycApplyAll under the hand-over hold** (`why` HandOverHold, not room) is refused as before, and a plan read from storage is
  refused as before (INT-B's check holds that; `v214-rv1-b-cyc-carry-from-storage` is caught there).

## Proof runs, honestly

The first prove.py run (18 ids, JOBS=1, HEAP=8192): all CAUGHT by a failed check, none by a throw alone. The retarget
`v200-u44-say-no-packages` (audit-recon's U44 block, ~6.3 GB RSS, ~10 min) came back CRASHED and then NOT CLEAN: both were
the kernel's memory-cgroup OOM killer (dmesg: "Killed process … (node)"), with three other fixers' suites on the same 16 GB. Run
directly on its mutant, the block fails its T9 check (1 FAILING CHECK, exit 1); on the fixed board it passes. Two more tries
(clean passed each time, the mutant run killed each time: at ~6 GB it is the largest process, so the OOM killer takes it first).

So the reach destOwnLists keeps has a check of its own, light enough to prove here: audit-board `v2.14 RV1-B — a copy this
browser holds of another appropriation is still read by the destination list rule` (one board: this browser's older Full Fund
holds "unassigned", this page's newer Full Fund is clean; the rule names Full Fund's plan and ⬆ Issue is refused). Its two rule
checks pass on 44aa984 too (a guard for the reach kept, not a finding's check); its first line is the other-appn finding's and
fails there. `v200-u44-say-no-packages` is proved against it (CAUGHT, 2 failing checks), and recon's T9 still catches it (above).
All 19 were then proved again together on the final board, into a fresh `proved-RV1B.jsonl` (the first run's record is kept in
the scratchpad as `proved-RV1B.first.jsonl`).

## The runs at the end (on the final tree)

- `npm run check`: all checks passed. `node tools/export-audit/boot-same.mjs`: every page, source, save and error list identical.
- `mcount`: 3,400 targets, each matching once. prove.py on the final board: 19 of 19 CAUGHT, each by a failed check, none by a throw. `npm run defects`: register holds (15 defects, 47 mutations). Money coverage: 27/27.
- Whole suites, each ALL CHECKS PASSED, one heavy run at a time: audit-other; audit-board (run again after the guard block was
  added: its first try was OOM-killed, the second passed); audit-import (its first three attempts
  were killed by the OOM killer while three other fixers' suites ran, exit 137; the fourth ran whole and passed); audit-recon (T9
  included, so the destOwnLists read holds).
- Browser checks: `npm run storagefull` (all storage-full checks passed), `savetarget` (passed), `fileimport` (ALL CHECKS PASSED),
  `keys` (passed, section V drives the PPBE cycle at the top), `menus` (every menu path a message names is in that menu). Not run:
  dialogs, panels, standards -- no box, control or focus path changed (the new words are status lines and one native alert).
