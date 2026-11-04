# v2.14 review round 2 — fixer RV2-B (other appropriations, cycles and packages)

Worktree `/home/user/orbit-wt/v214-rv2b`, branch `v214-rv2b`, from `74a6aec`. The reviewers' probes were copied into
`scratchpad/v214rev2/rv2-B/` (`seams/` from r2a-seams, `packages/` from r2a-packages, `journeys/` from r2a-journeys, each pointed at
this worktree's board) and re-run there before anything changed. The pre-fix board for the checks is
`git show 74a6aec:prioritization-board-grid.html`. Every check is in audit-board's RV2-B slot; every mutation in mutate.mjs's.

## 1. carry-and-held-lost-on-next-write / carry-then-held-misfire (one defect; the lead: real)

**Reproduced** on 74a6aec's tree, by every route the reviewers named:
- `seams/p2-carry-then-held.mjs` (ladder, and `VIA=issue`): after the carry `held ff false`; after one ladder copy or ⬆ Issue that
  storage refused, `apStoreOf(ff).held true`; the second cycle "Full Fund — NOT changed: this browser holds Full Fund work the saved
  file does not have"; Issue refused "…the file's copy is newer"; after Save ff record `{"file":0,"dirty":true}`; Full Fund's opening
  kept a copy aside, and in a full browser opened untagged with "this browser holds work that is in no saved copy".
- `packages/p3-carry-issue.mjs`: one Issue of Initial Spares → held, the second choice skips it, the bar Mixed, the second Issue refused,
  the record dirty after Save, the full-browser opening off the cycle with no ledger.

**Fixed.** The carry's identity now survives this page's own writes:
- `apPut(k, st, what, raw, fromPage)` (new, beside apStoreOf) is the one write of another appropriation's plan by this page:
  `pkgPut` (⬆ Issue, ⬆ Push baselines), `bandCopyAll`'s peer write and `pkgApply`'s other-appropriation write all go through it.
- `apCarryRaw(k)` (new), read before the writer stamps or changes its copy: storage's text when the copy about to be written holds
  storage's copy as it stands — this page's copy was carried from it (`cycCarryHas`), or storage's is the newer and is what was read.
- After the write, whether storage took it or refused it, what this page holds holds storage's copy as it stands, so `_cycCarry[k]`
  is set to `{ts: the copy written, raw: storage's text now, gen}`: refused, storage's untouched copy; taken, the copy just written.
  `apStoreOf` and `cycApplyAll`'s skip then read it as not held, and `cycCarrySaved` records it saved once 💾 Save has written it.
  A refused write not built from storage's copy (the file's newer copy over an older, clean stored one) is remembered as nothing.
- This also mends the pre-existing no-cycle variant the skeptics measured on v2.13 and 44aa984 (the post-import record, Q6, then a
  refused ⬆ Issue): the second Issue goes out, and Save records the plan saved.

**Checks** (audit-board):
- `v2.14 RV2-B — a plan carried on this page stays carried through ⬆ Issue and the ladder copy browser storage refuses: …` — the storage
  route with both plans refused: carry (CONTROL), ⬆ Issue, the ladder, a second cycle, a second Issue and ⬆ Send back, Save (both
  records `{file: the save, dirty:false}`), and Initial Spares opened in a full browser (BES28, package #2, nothing kept aside).
- `v2.14 RV2-B — a write browser storage refuses, built from storage’s own copy, is not read as this browser’s unsaved work behind a
  newer copy (carry-then-held-misfire, no cycle)`.

## 2. held-ladder-promise-never-kept

**Reproduced**: `packages/p2-held-ladder.mjs` — "held for Full Fund too … the ladder goes on when that board opens", pend true; Full
Fund opened on its old ladder, pend gone, nothing said. `p5-held-ladder-silent.mjs` — with Initial Spares refused, the line was only
lsSet's refusal, `mentionsFullFund=false`.

**Fixed** in `bandPeers` / `bandCopyAll`: `bandPeers` marks a peer `unsaved` (apStoreOf's held). Such a peer is left out of the
question's list and named "NOT copied to Full Fund — <apHeldWhy>. Open Full Fund once (its opening keeps that work aside), then copy
the ladder again", as RV1-C's stray wording does; no `BAND_PEND_KEY` is written for it (the pend write now comes after the held test in
the loop, which stays as a second gate for a state that changed while the question was open). The closing line is always written: it
names every refused write ("Browser storage refused Full Fund, Initial Spares: the ladder is there on this page only until it is
saved" — also-noticed 4), a ladder that could not be held for an appropriation not yet opened, and the not-copied ones.

**Check**: `v2.14 RV2-B — ⚖ copying the ladder holds nothing for an appropriation whose unsaved work is behind a newer copy, …` — the
question, the line, nothing held, a record that turns unsaved while the question is open (the loop's gate), the line with a refused
write, then the way forward: Save, Full Fund opens (keeps the work aside), O&M copies again and the ladder lands on the file's Full Fund.
RV1-B's own check (d) asserted the promise (pend written, "held for Full Fund too"); it is changed with a `// v2.14 RV2-B:` comment.

## 3. spruills-bydband-read-older-copy

**Reproduced**: `seams/p3-spruills-copy.mjs` — spDefs `["F","G"]` against pubsFor/fydpStoreLocal/pkgStoreOf `["F","G","NEW-1"]`,
Spruills Full Fund FY27 `$0`, by-band "Full Fund … 2".

**Fixed**: `spDefs` and `exportCSV`'s by-band loop read `strayOr(k, apStoreOf(k).st)` (the RV1-C strayOr lines are unchanged, so their
mutations still aim at them). The by-band row for the board on screen is read as it always was. Re-run: Spruills $5,000,000, by-band 3.

Other readers of another appropriation's plan from browser storage (`localStorage.getItem(_SLUGMAP[`), each left as it is:
`strayHeld` (the stray test itself), `pubsFor`, `apStoreOf`, `fydpStoreLocal`, `diagStoreOf` (the newer-copy rule already),
`apCarryRaw` and `cycCarryHas` (the carry), `cycApplyAll`'s held skip (the held test), `impShellEmpty` (does any stored plan hold a
requirement — not which copy), `budSrc` (the legacy BAE list, newest by its own time across every copy), `destOwnLists` (reads storage's
copy beside the newer one on purpose, RV1-B), and the by-band row for the board on screen.

**Check**: `v2.14 RV2-B — the Spruills and the Priority Drill’s requirements by band read another appropriation as 💾 Save writes it` —
the order, the FY27 figure (the added requirement's $5,000,000), the by-band count (3), and held work behind the file's newer copy.

## 4. sideboot-names-stray-as-saved-by-save

**Reproduced**: `seams/p4-stray-sideboot.mjs` — "Unsaved changes … the Full Fund plan … 💾 Save writes them into the file", keys
`["prio27ff"]`, Saved after Save, and the claim back on reopening.

**Fixed**: `sideBootCheck`'s loop over the other appropriations skips a plan that is stray work (`strayOther` on the copy storage held
before opening, against `PUBS[k]`), so it is not among the plans Save writes. It is named apart, live, by `sideStraySay()` in the save
state's tooltip ("This browser also holds Full Fund work typed on a page with no board file. 💾 Save does not write it: the file keeps
its own Full Fund. Open Full Fund once (Appropriation, at the top) to keep that work aside."), from `sideStrays()` (the record is read
first, so a browser with no such work parses no plan on a redraw). **One line outside my functions, named:** `clearComputer` names the
stray work in its question and its last check ("…No file has it, and 💾 Save does not write it: it will be lost…"), where it used to
say "Cancel and 💾 Save first to keep them" of work Save never keeps (skeptic 1's point: skipping alone would have made Clear silent).

**Check**: `v2.14 RV2-B — another appropriation’s work typed on a page with no board file is not said to be Save’s to write: …` —
opening, the tooltip, Clear this computer's question, reopening after a Save, and a CONTROL (ordinary unsaved Full Fund work is
still Save's, and said so).

## Also-noticed

1. **cycCarrySaved deleted the entry when its record write was refused.** Reproduced (`packages/q1-carrysaved-refused.mjs`): after Save
   with the record refused, entry gone, held true, Issue refused, the next cycle skipped it, the next Save with room left it dirty.
   Fixed: the entry is deleted only once its record is written. Check `v2.14 RV2-B — a carried plan whose record 💾 Save cannot write
   stays carried, and the next Save records it saved`.
2. **pkgApply, bandCopyAll and pkgIssue left another appropriation's record saying saved.** Reproduced (`seams/q2-other-write-record.mjs
   issue|ladder|apply`): Full Fund's opening of a newer file replaced the issue ledger, the ladder, the package's note, nothing kept
   aside. Fixed in `apPut`: once storage holds the write, the record is `{…, dirty:true, blank:false}` (and `file: _pubsFileTs` where the
   copy was built from this page's, as cycApplyAll's record does). If the record itself cannot be written, the plan is put back as it
   was and held on this page alone (counted as refused, as lsSet counts one) — never left in storage under a record that calls it saved.
   Because the write is also remembered as carried (finding 1), 💾 Save records it saved again, so the board does not open thinking its own
   saved copy is unsaved work. That is a slice of §12 Q6 (v2.15): only what this page itself wrote; records left by an import are as
   before. Check `v2.14 RV2-B — another appropriation this page writes into browser storage is recorded unsaved, …` (three writers, then
   a CONTROL Save and opening).
3. **Two tabs: B's Save after OK at the HOLD ON wrote Initial Spares back to PB27.** Reproduced (`journeys/p3.mjs b2 t2` on a written file
   regenerated from this board): the file's sp went from BES|2028 to PB|2027. **Decided:** the HOLD ON is TRUE (another save of the file
   is not on B's screen) and its OK loses a cycle tag nobody chose to drop, and it names nothing — not accepted. B's page cannot know
   the other tab's carried copy, and taking the file's newer copy unasked at Save could take another board's appropriation from a
   wrongly picked file, so the fix names it rather than merging. **A line outside my functions, named:** `saveDrops` (what Save asks
   about before it writes over what the file holds) gains one line per other appropriation the file holds NEWER than the copy the bytes
   carry: "Initial Spares: the file holds a newer copy (saved … by Brad) than the one this board would write over it — the file’s is on
   BES28, this board’s on PB27". The board on screen is left out (its copy is the one just saved). An ordinary Save asks nothing (after a
   save of its own, the file never holds a newer copy than the page). Re-run: B's Save asks the HOLD ON, then that question; Cancel
   writes nothing. Check `v2.14 RV2-B — 💾 Save names another appropriation the file holds newer than the copy it would write over it, …`.
4. **bandCopyAll with two refused writes named only the last.** Fixed with item 2 of the findings (the closing line names each).
5. **apHeldWhy said "the file's copy is newer" of this page's own copy.** After the carry fix the reported route no longer reaches held.
   Fixed anyway for any route that does: `_pubsOwn` (beside `_cycCarry`) remembers the appropriations whose copy on this page this page
   made and has not saved (a refused `apPut`, a carried cycle), cleared by `cycCarrySaved` up to the bytes a file save built;
   `apHeldWhy` then says "a newer Full Fund made on this page is not in the file yet (💾 Save writes it there)". `pkgPushAll`'s closing
   line, which repeated the old sentence, now reads apHeldWhy (RV1-B's push check moved with a `// v2.14 RV2-B:` comment). Check
   `v2.14 RV2-B — a refusal for unsaved work behind a newer copy says which copy is the newer: …`.


## Existing checks changed with the behaviour (each with a `// v2.14 RV2-B:` comment)

- audit-board `v2.14 RV1-B — a package held on this page alone, …` (d): it asserted the ladder held for Full Fund (pend written) and the
  line "held for Full Fund too, which is not written now" — the promise this round finds is never kept. Now: no ladder held, and
  "Not copied to Full Fund — this browser holds Full Fund work the saved file does not have".
- audit-board `v2.14 RV1-B — pushing baselines and sending back …`: the closing line's reason is apHeldWhy's one sentence now
  ("this browser holds Full Fund work the saved file does not have, and the file’s copy is newer").

## Mutations

New (17, `v214-rv2-b-*`): `carry-not-kept`, `carry-raw-carried-only`, `record-not-marked`, `issue-bypasses-apput`,
`ladder-bypasses-apput`, `apply-bypasses-apput`, `carrysaved-drops-entry`, `held-ladder-promised`, `ladder-refused-last-only`,
`spdefs-storage-first`, `byband-storage-first`, `sideboot-stray-counted`, `stray-unsaid`, `clear-stray-unwarned`,
`savedrops-newer-unnamed`, `heldwhy-always-file`, `pubsown-kept-after-save`.
Retargeted in place (their lines moved): `v199-boot-other-appns` (sideBootCheck's call now follows the stray test: `else look(…)` →
`else {}`), `v204-106-no-second-ask` (the last check's condition now names stray work: `(unsaved || kept || strays.length)`).
Re-proved because the code around them changed: `v214-rv1-b-ladder-writes-held` (the loop's second gate, now caught by the new
"turned unsaved while asked" part as well as RV1-B's block), `v214-rv1-b-ladder-storage-first`, `v214-rv1-b-pushall-held-blamed`,
`v214-rv1-b-carry-record-dirty`, `v214-rv1-c-ladder-copies-stray`, `v214-rv1-c-spdefs-reads-blank`, `v214-rv1-c-byband-reads-blank`.
`mcount`: 3,526 entries, every one once; every mutant in `proofs-RV2B.json` built with `mkmut.py` and passes `tools/check.mjs`.

**Proof** (`recovery/v214/proofs-RV2B.json` → `proved-RV2B.jsonl`, `prove.py` JOBS=1 HEAP=8192, on fa5b44d's board): **26 of 26
CAUGHT**, each by a failed check, none by a throw. The failing-check counts: carry-not-kept 7, carry-raw-carried-only 3,
record-not-marked 6, issue-bypasses-apput 10, ladder-bypasses-apput 5, apply-bypasses-apput 2, carrysaved-drops-entry 2,
held-ladder-promised 1, ladder-refused-last-only 1, spdefs-storage-first 3, byband-storage-first 1, sideboot-stray-counted 2,
stray-unsaid 2, clear-stray-unwarned 1, savedrops-newer-unnamed 2, heldwhy-always-file 1, pubsown-kept-after-save 1;
v199-boot-other-appns 1 (import, item 95), v204-106-no-second-ask 1 (other, item 106); v214-rv1-b-ladder-writes-held 1,
-ladder-storage-first 3, -pushall-held-blamed 1, -carry-record-dirty 2; v214-rv1-c-ladder-copies-stray 3, -spdefs-reads-blank 1,
-byband-reads-blank 1.

## The checks on 74a6aec

(fa5b44d's commit message says "10 blocks; 34 failing checks": it was counted before the ladder block's mid-question part was
added, and the tenth block slim.py keeps is the suite's prelude. These are the figures.)


All nine RV2-B blocks, slimmed (`slim.py … "v2.14 RV2-B"`), on `git show 74a6aec:prioritization-board-grid.html`: **35 failing
checks**, every block failing at least one -- the carry 7, the record refused 2, the record 7, the ladder 5, the Spruills 4, the stray
work 4, two tabs 2, no cycle 3, apHeldWhy 1. On this board all pass.

## Left, and why

- **The queued `apStoreOf`-is-not-stray-aware item** (v2.15): untouched. Every reader this round moved to apStoreOf also goes through
  `strayOr`, as RV1-C's did.
- **Two tabs and a plan on this page only** (RV1-B's Left): the other tab's carried copy cannot reach this tab; Save now names the
  newer copy it would write over instead of writing it unasked, and does not merge it in (a merge at Save could take another board's
  appropriation from a wrongly picked file). Whether Save should take the file's newer copy of an appropriation this page never
  touched is for the lead (it would remove the question, and the loss, in the two-tab case).
- **§12 Q6** (v2.15): records an import left dirty are as before; only writes this page made itself (apPut) and carried cycles are
  recorded saved by 💾 Save.
- **Noticed, not changed: ⚖ Copy to the other appropriations in a PMO copy.** `bandCopyAll` has no `sandboxBlock`, and a copy's other
  appropriations' storage keys are the board's own (`prio27ff`, unsealed), so in a browser holding the portfolio board a copy's ladder
  copy can write the board's stored Full Fund (and now its record). Pre-existing (the write was there before this round), not among
  my findings, and not reproduced in a real copy; one line (`if(sandboxBlock('Copying the band ladder')) return;`) if the lead wants it.

## Runs at the end (on fa5b44d's board; the commits after it touch only recovery/)

- `npm run check`: all checks passed. `node tools/export-audit/boot-same.mjs`: every page, source, save and error list identical.
- `mcount`: 3,526 entries, every one once. `npm run coverage:money`: 27/27. `npm run defects`: the register holds (15, 47 mutations).
- Whole suites, one heavy run at a time (8 GB heap where the suite needs it), each ALL CHECKS PASSED: audit-board, audit-other,
  audit-inject, audit-hostile, audit-import (21 min) and audit-recon (14 min; its first try was killed
  by the machine's OOM killer, exit 137, while three other fixers' suites ran, and it passed when rerun).
- Browser checks, all passed: `npm run storagefull`, `savetarget`, `fileimport`, `panels`, `dialogs`, `keys`, `menus`.
- The reviewers' probes, re-run on the fixed board (`scratchpad/v214rev2/rv2-B/`): p2-carry-then-held (both routes), p3-carry-issue,
  p4-carry-issue-quota, p1-carry-broken, q1-carrysaved-refused, p2-held-ladder, p5-held-ladder-silent, p3-spruills-copy,
  p4-stray-sideboot, q2-other-write-record (three writers) and journeys p3 b2 t2 (regenerated on this board) -- each now shows the
  fixed behaviour quoted in the sections above.
- Not run, by the rules: the sweep, `validate:math`, `validate:nightly`.
