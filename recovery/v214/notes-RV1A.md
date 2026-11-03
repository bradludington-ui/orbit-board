# v2.14 review round 1 — RV1-A (the file route)

Worktree `/home/user/orbit-wt/v214-rv1a`, branch `v214-rv1a`, from 44aa984. Every finding was reproduced on my board (byte-identical
to the review board 5d5383c at 44aa984) with the reviewers' probes, copied into
`scratchpad/v214rev/rv1-A/` and pointed at this worktree, before anything was changed; each was run again after the fix.

The checks are five audit-import blocks in the RV1-A slot, all named `v2.14 RV1-A — …`. Slimmed together they run 66 checks; on
44aa984 (`git show 44aa984:prioritization-board-grid.html`) **33 fail**, and no check labelled a CONTROL fails there; on the fixed
board all pass (re-run on the final blocks: 33 fail on 44aa984, none a CONTROL). Per part on 44aa984: the as-it-was block (a) 1, (b) 1, (c) 1, (d) 1, (e) 2, (f) 0 (a CONTROL); the latch block downloaded 3, ✕ at the pause 3, raced 3; the own-file block (a) 3, (b) 2, (c) 2; the held block (a) 1, (b) edits 2, (b) saves 3; the room block (a) 1, (b) 3, (c) 1. Mutations are in mutate.mjs's RV1-A slot (22 new, `v214-rv1-a-*`) plus one retarget; `proofs-RV1A.json`,
`proved-RV1A.jsonl` (see the end).

## Finishing round: what the independent check found in the first fix

The check (`scratchpad/v214rev/rv1-A-check/`) re-ran every original probe on 6b9ced8: all clean. Each check failed on 44aa984
and passed on the fix. It found three problems with the fixes. Each one was reproduced on 6b9ced8 with the check's own probes,
copied to `scratchpad/v214rev/rv1-A/fin/` (`a3c-flowaddent.mjs`, `a2-occupied-ff.mjs`, `a4-list-left.mjs`), before anything changed.

### 1. impFileWasMiss held Write back for nothing (w2-step1-…, aswas-file-misses-named-work) — reproduced, fixed

Reproduced with a3c. The real "add a destination" control (`flowAddEnt`) writes the destination list. The locked-cycle store
carries the same list (`CYCDB.ents` is `DESTDB.ents`) but stays in storage as the board file's own copy. Step 1 rightly names
it, because this page's copy is unsaved, and the as-it-was file holds this page's copy. But impFileWasMiss counted storage's
copy as missing. The box said "It does not hold the locked cycles for O&M … another ORBIT tab’s work", and Write waited.
44aa984 gave ✓ there; 6b9ced8 did not.

Fix (impFileWasMiss, one line): a stored copy of one of this page's lists that is the board file's own (`impFileSameAsFile`) is
counted as held. The board file this page was opened from already has it, so Write clearing it loses nothing. This is the
check's own suggestion. a3c now gives "✓ true | Write disabled false".

Check: the as-it-was block, new part **(g) a destination added here**. It adds a destination with flowAddEnt, then refuses
the import, then saves as it was. It then requires three things: the as-it-was file holds the new destination in both the list
and the cycle store; the box says ✓ and names nothing as not held; and Write is offered. The part fails once on 6b9ced8. It
passes on 44aa984, as the check measured. This also closes the check's gap 3: no part covered this page's own unsaved list.

### 2. A copy left in front of the import's file still reached it unasked (left-copy-saved-into-import-file) — reproduced, fixed

Reproduced with both of the check's routes. a2: the Full Fund kept slot already holds other work, so the changed Full Fund is
left; the first Save asked nothing and wrote "FF CHANGED AFTER THE WRITE" into the import's file. a4: an older tab re-imported
the cost estimates after the write; Save asked 0 questions and the file then held "OLDER TAB RE-IMPORT".

Fix (`_saveInPlaceFileRun` and a new `impLeftAsk`; `impSlotOf` split out of impFileWasMiss; `sideKeyName` split out of
sideBootSay): Save now asks before it writes such a copy into the import's own file. It asks only while two things hold:
- The file on disk is still exactly as the import wrote it. Its pubState carries the import's stamp, the same one this page
  opened (read from `impSrc0()`, because PUB is narrowed while the board opens). The first save drops the stamp.
- Some copy this opening found in front of the file's own differs between the file and the bytes about to be written. These
  copies are `sideBootNote.keys`: what browser storage held before opening, newer than the file's and different from it.
The question names each copy. If it is declined, nothing is written and the file keeps the import whole. Because sideBootCheck
runs on every opening, every opening of the file asks, until a Save is let through. After that the file is an ordinary board
file. The plan on screen is not included, because the HOLD ON already asks about it (its record names the file it came from).
impOwnRep now says "💾 Save asks before it writes it into this file".

Decided: this adds a question to C22/D24. It does not change what is kept or left. Lists still have no kept slot; a list is
left as C22 decided and asked about at Save. The check left this open ("needs a decision"). I chose the question because it is
the smallest change that keeps the person's choice and loses nothing either way. OK writes this browser's copy, as the board
shows it. Cancel writes nothing, and the import stays whole in the file. For the lead: confirm, or choose the other design. In
that design, the page reads and saves the file's own copy of a left plan, and that plan's own board takes the left copy up.

Checks (the own-file block, all parts new except where noted):
- **(d) another plan, kept slot held.** The first Save asks, naming the Full Fund plan. Declined, it writes nothing and the file
  keeps the import. The file opened again asks again. Let through, Save writes this browser's Full Fund. The next Save asks
  nothing about a copy left (a CONTROL).
- **(e) a list left.** The first Save asks, naming the cost estimates; declined, it writes nothing.
- **(f) an ordinary board file** opened with a newer plan in this browser. Save asks no such question (a CONTROL: the question
  belongs to the import's own file).
- **(b)** now also requires that nothing is asked when nothing was left (a CONTROL).
- **(c)** requires the new wording. It also checks the report's claim that Save asks first for the plan on screen: declined,
  nothing is written (a CONTROL).

Measured on the two blocks slimmed together, at a387532:
- **On 44aa984: 17 checks fail, and none is a CONTROL.** The as-it-was block fails (a) to (d) once each and (e) twice; (g)
  passes there. The own-file block fails (a) 3, (b) 2, (c) 2, (d) 3 and (e) 1.
- **On 6b9ced8, RV1-A's first fix: 6 fail.** These are (g) 1, (c) 1 for the wording, (d) 3 and (e) 1.
- **On a387532 all pass.** (f) and every other CONTROL pass on all three boards.

### Runs, finishing round (board a387532)

- `npm run check`: all checks passed.
- `node tools/export-audit/boot-same.mjs`: identical either way.
- mcount: 3,412 entries, each found once.
- **Whole, at 8 GB, one at a time: audit-import, audit-board, audit-recon, audit-other and audit-inject. Each printed ALL CHECKS
  PASSED.**
- Browser: `npm run fileimport`, `keys`, `dialogs` and `panels` pass, and `standards` reports 0 findings, nothing new.
  `savetarget` and `storagefull` each failed once on the storage seam (see "Left, and why") and passed on re-run.

### 3. The rest of the check

- The check's gap 3 was that no part covered this page's own unsaved list. Part (g) above closes it.
- The other findings held on 6b9ced8: w2-writer-page-not-latched, w2-own-file-report-swallowed, impown-left-advice-false,
  held-page-false-unsaved, held-program-reads-unsaved and step1-only-onscreen-plan-checked. The check proved two of my
  step-1 mutants itself, and both were caught.
- The verdict reached me cut off part way through held-program-reads-unsaved. What I could read held. I could not see the rest of
  that item, or room-threshold-untrue. Room-threshold-untrue's block ran clean, and its mutation was CAUGHT again (below).

### Mutations added, and the proof

There are five new mutations in the RV1-A slot. mcount reports 3,412 entries, each found once, and each mutant passes
`node tools/check.mjs`.
- `v214-rv1-a-wasmiss-file-own` puts the false "does not hold" back.
- `v214-rv1-a-left-unasked` removes the question.
- `v214-rv1-a-left-decline-writes`: Cancel still writes.
- `v214-rv1-a-left-any-file`: every board file asks, not just the import's own.
- `v214-rv1-a-left-report-says-writes` puts back the report that says "Save writes it".

`proved-RV1A.jsonl` was proved again from scratch on a387532, for all 28 ids. **28 of 28 were CAUGHT, each by a failed check
and none by a throw.** The first fix's record of 23 is in a7d3a4c.

## The findings, most severe first

### aswas-file-misses-named-work / w2-step1-as-it-was-omits-what-it-names (data loss) — reproduced, fixed

Reproduced: probe-aswas-ff (AGE=older), -list, -cyc and p1/p4/p6 all printed the named work missing from the "✓ Saved" as-it-was
file and gone after Write. Cause: step 1 named keys by one rule (impUnsavedList: a dirty record, storage differing from memory or
from CYC_FILE, what is on screen) and the file was built by another (fullImportPreHtml: by clock, lists from memory, `o.newest`
replacing an unsaved screen).

Fix (fullImportPreHtml, impUnsavedList, impFileSaveWas, new impFileWasMiss / impFileMissSay / impFileOf / impFileSameAsFile):
- impUnsavedList records, beside each name, the key it stands for (`out.key`, '' for what is on screen). One rule, read twice.
- fullImportPreHtml takes `o.named`: another appropriation's plan or locked cycles step 1 names goes in as browser storage holds it,
  whatever its clock; a list step 1 names because storage holds a copy this page does not show goes in as storage holds it.
- What is on screen, unsaved, is never traded for another tab's newer save of the same plan (`o.newest` applies only when the
  screen is not named), and this page's own unsaved copy of a list is never traded for another tab's.
- impFileWasMiss reads the written bytes back and checks each copy step 1 named is in them (timestamps aside; this appropriation's
  plan is held by the screen where storage's copy is this page's own save or older). Step 1 is done only when nothing is missing;
  otherwise the box says "Saved as … ⚠ It does not hold <names> …" and Write waits for "Carry on without a copy of it" (D7: saved
  or explicitly declined). The download path says the same in its status line.
- The board-file list lookup that step 1 already did is one reader now (impFileOf), used by the naming and the build.

Decided: case (c) — the screen and another tab's newer save of the same plan both unsaved — cannot be held in one file, so the
file keeps the screen and names the other as not held. This changes design 12/17's `newest` only where it lost the screen.

Check: block "the as-it-was file holds every copy step 1 names…", parts (a) another plan recorded unsaved and OLDER than the
file's (the two-person shape), (b) another plan with no record and a journal line the file lacks, (c) another appropriation's
locked cycles older than the file's, (d) a list another tab wrote after the page opened, each as the only unsaved thing; (e) both
the screen and another tab's newer O&M; (f) the screen alone, a CONTROL (a check too strict to pass the commonest case).

### step1-only-onscreen-plan-checked (test gap) — reproduced, closed

Reproduced with the reviewer's mutant: removing the dirty-record branch passed every W2/W3 import block. The block above makes
each branch the only unsaved thing; four mutations, one per branch (`v214-rv1-a-step1-dirty-record`, `-no-record`,
`-other-cycles`, `-other-tab-list`).

### left-copy-saved-into-import-file (data loss, critic) — reproduced, fixed
### w2-own-file-report-swallowed, impown-left-advice-false (untrue message) — reproduced, fixed

Reproduced: pB (the first Save wrote the old tab's Full Fund into the import's file, asking nothing), p8 (the report never said),
p9 (the advice "close every other ORBIT tab and open this file again" cannot work).

Fix (_impOpen, impFileMarkOf, impOwnRep, the opening chain):
- The note names which of its keys are plans (`pk`: key → appropriation), because _impOpen runs before _SLUGMAP exists.
- _impOpen keeps a plan that changed after the write aside in THAT plan's own kept slot (`<key>.kept`, the keepAside format,
  with its record, so ↶ work kept aside puts it back and Save then asks), and removes it and its record from storage, so the
  import opens and the first Save writes the import's copy. A slot holding other work, or no room: left, as before.
- impOwnRep says what was kept aside and where it is put back, and says what a copy LEFT does ("Where it is newer than this
  file's copy, this board reads it in place of the import's, and 💾 Save writes it into this file") — never the advice that could
  not help.
- The import's own report is said after whichever opening line wins (beside the hold's own line), not as one branch of the chain.

Decided: C22/D24 said the opening "names any that changed and leaves them". A plan is now kept aside rather than left, because
leaving it lost the import's plan to the first Save; nothing is removed that is not kept. Lists are left as before (no kept slot).

Check: block "the import's own file keeps a plan that changed after the write aside…": (a) the plan on screen — the import opens,
the changed copy is kept whole with its record, the report says so and names no impossible remedy, ↶ puts it back; (b) another
appropriation — kept in its own slot, and the first Save writes the import's Full Fund; (c) a slot already holding other work —
left, and the report is said after the "Opened this browser's copy" line, truthfully.

### w2-writer-page-not-latched (wrong figure) — reproduced, fixed

Reproduced: p2 (download), p2b (✕ at the pause, raced): "latched false"; the old tab's edit landed in storage and the file
reopened on the old O&M.

Fix: impFileMarkWrite latches the page whenever it writes the note, stored or refused (C21: a page that has seen the note).

Check: block "the page that writes the note is held for its life…", for the download route, ✕ at the name-match pause and the
raced route: the latch read from `_impHand` (never impHandOf(), which latches a page that merely reads the note), then the file
opened in another boot, an edit here, and the file reopened — the edit not in storage, the import's O&M on screen.

### held-page-false-unsaved, held-program-reads-unsaved (untrue message) — reproduced, fixed

Reproduced: jr/p6 and door/p5 — the program reopened held read "Unsaved changes", `_lsRefused` {prio27destdb}.

Fix (impHandRefuse): while the board is still opening (`_sideBootGen` not yet set), a held write of a list that holds nothing
(sideEmpty: the seeded destinations) is kept in Save diagnostics and counted nowhere else — every opening makes it again. A held
write after opening is counted as before.

Check: block "the program reopened held…" (a): held and the refusal in diagnostics (CONTROL); not unsaved, nothing in
`_lsRefused`, the save state and button not dirty; a change after opening is held and counted (CONTROL).

### Critic gap 2 — a held page's record writes (reproduced: a wrong question and a loss) — fixed

Probe `fr/g2-held-record.mjs` (modes none / edit / save). The import's file opened in tab B and edited, unsaved; then the held
importing page:
- edits: its baseMarkDirty rewrote O&M's record with the OLD file's time — reopening the import's file said "The file has been
  saved since then as well — by unknown" and 💾 Save asked HOLD ON over its own file;
- saves its own file in place: the record became `{file: that save, dirty:false}` over B's unsaved work — reopened, B's work read
  "with no changes since", and a newer board file opened later replaced it with nothing kept aside (the work was gone after one
  edit).

Fix (baseSet, one line): a page held for its own plan writes no record of it — the record describes what storage holds, and a held
page writes none of it. This changes D17/C19 ("the hold never guards a .base") because that lost work. The page's own memory
(LASTKNOWN, _baseDirty) is as before. After: both modes leave B's record as B wrote it, the file reopens with no false line and no
question, and a newer file keeps B's work aside.

Check: block "the program reopened held…" (b), for an edit and for a Save of the held page's own file.

### room-threshold-untrue (minor) — reproduced, fixed

Reproduced: room.mjs said "less than 64,000" at 65,000 and 64,500 free. Fix: the probe is `64000-'prio27roomProbe'.length`
characters, key and value making exactly the 64,000 D10 names. Check: block "the room left is said…" (a) — the free space set
exactly by a filler key: 64,500 and exactly 64,000 free say nothing, 63,999 says it.

## Also noticed (the file route)

- **A failed as-it-was write not counted by impFileHolds** — reproduced by reading and by the check's first run on 44aa984
  (impFileHolds() false after the failure). Fixed: `R.was.fail` is set on a failure after the pick, impFileHolds counts it until
  impFileWasDl downloads it (impFileWasHeld), and the box's ✕ asks first, naming it. Check: "the room left is said…" (b).
- **✕ at the name-match pause says "The two copies"** — reproduced (the pause offers one copy). Fixed: impFileCloseAsk names what
  is offered and not saved; "the two copies" only when two are. Check (c); the W2 (e) "build threw" case, which asserted the old
  wording where one copy is offered, now expects "The file you imported is not saved yet" (`// v2.14 RV1-A:` there).
- **uiBatchPut putting storage back past the hold** — not reproduced. The snapshot and the put-back run in one synchronous run
  ("from here to the end nothing waits"); a browser delivers another tab's storage changes between tasks, so the put-back can only
  restore a key this page changed during the batch, and a held key's write is refused by the hold, so it never differs. Left.
- **Critic gap 2** — see above (reproduced, fixed).

## Existing checks changed with the behaviour

- audit-import W2 "the file route keeps what browser storage held" (race 1): Full Fund, changed during the write, is now kept aside
  in `prio27ff.kept` (whole, byte for byte) and named as kept, not left in storage. `// v2.14 RV1-A:` there.
- audit-import W2 "a full import browser storage cannot hold…" (e) "the build threw": the close question names the one copy.

## Mutations

22 new in the RV1-A slot and one retarget, each find matching exactly once (mcount: 3,407 entries, all once) and each mutant
parsing (`node tools/check.mjs <mutant>`):
`v214-rv1-a-aswas-plan-by-clock`, `-aswas-cyc-by-clock`, `-aswas-lists-from-memory`, `-aswas-screen-traded`, `-aswas-unchecked`,
`-step1-dirty-record`, `-step1-no-record`, `-step1-other-cycles`, `-step1-other-tab-list`, `-writer-unlatched`, `-left-not-kept`,
`-note-names-no-plans`, `-kept-without-record`, `-own-report-swallowed`, `-left-advice-false`, `-held-seed-counted`,
`-held-record-written`, `-room-65536`, `-was-fail-unheld`, `-was-close-unasked`, `-was-dl-not-counted`, `-close-two-copies`.
Retargeted in place: `v214-w2-opens-clears-changed` (its line now carries keepLeft; the same defect is the changed copy removed
outright). One older mutation, `kept-replaced` (`    if(had!==null){`), matched my new code too; the variable in _impOpen was
renamed (`prev`) so it matches once, as before.

## Left, and why

- uiBatchPut past the hold: not reproduced (above).
- A note planted with non-string fields making impHandMsg throw (r1a door's "also noticed"): not in this fixer's list; the board
  still opens held and nothing runs as code. Left for the lead.
- A plan left because its kept slot already holds other work (or there is no room) still stands in front of the import's file. So
  do lists that changed after the write (C22). **Finishing round:** Save now asks before it writes either into the import's own
  file, and the report says so (see the finishing section). Keeping a second copy would replace kept work, which the board never
  does (v1.95).
- The browser checks' storage seam. In this round one run of `npm run savetarget` failed E, and one run of `npm run storagefull`
  failed A's harness line. In the savetarget run the question shown was "No writer is recorded … / Your name or initials". In the
  storagefull run the harness reported "this tab shares its browser’s storage with the seed page … read null". Both are the
  seeded storage not reaching a tab, the v2.12 pmosave family. Each passed when re-run on this board, savetarget once and
  storagefull twice, and savetarget passed on 6b9ced8. storage-full detects the seam and names it; save-target E does not. Left
  for the lead: it is in the checks, not the board.

## Runs, on 63fbe76 (board) / a7d3a4c

- `npm run check`: all checks passed. `node tools/export-audit/boot-same.mjs`: every page, source, save and error list identical.
- **audit-import, audit-board and audit-recon were OOM-killed whole** (exit 137, the container's memory cgroup: four fixers'
  suites side by side on one 16 GB box; dmesg names the kill) — import three times, board and recon once each; a 4 GB heap cap
  ran import out of heap (it needs more). So each was run in parts that together hold every scenario block, with the same 8 GB
  heap, through `recovery/v208/bin/slim.py` with exact names (`=<name>`; blocks with no literal name — helpers, the self-check —
  are kept in every part):
  - audit-import: two halves split at "v2.00 (R3)" (every top-level `let` a block shares — V185W, V186L, V14, W2THEIRS, W3FILES —
    has its writer and readers in the same half): 92 + 93 = 185 scenarios, **ALL CHECKS PASSED** both.
  - audit-board: two halves, 53 + 53 = 106 named scenarios (the looped `'convert to split — ' + label` sits in a top-level
    function and runs in both), **ALL CHECKS PASSED** both.
  - audit-recon: thirds, the last cut in two again so its 6.5 GB block ran with room: 25 + 25 + 12 + 13 = 75 scenarios,
    **ALL CHECKS PASSED** all four.
  Then, in a quieter window, each ran WHOLE at 8 GB: **audit-import, audit-board and audit-recon — ALL CHECKS PASSED** each.
- Whole: audit-other, audit (Excel), legacy-fsrc, audit-hostile, audit-inject, audit-ui — ALL CHECKS PASSED each.
- Browser: `npm run fileimport`, `storagefull`, `savetarget`, `keys`, `dialogs`, `panels`, `standards` (0 findings, nothing new)
  — all pass.
- mcount: 3,407 entries, every find once.

## Proof

`JOBS=1 HEAP=8192 python3 -I -B recovery/v208/bin/prove.py recovery/v214/proofs-RV1A.json recovery/v214/proved-RV1A.jsonl`, on 63fbe76:
**23 of 23 CAUGHT**, each by a failed check and none by a throw. Each block ran clean on the board first.

- `v214-rv1-a-aswas-plan-by-clock` — CAUGHT by a failed check (fails 6, threw 0)
- `v214-rv1-a-aswas-cyc-by-clock` — CAUGHT by a failed check (fails 3, threw 0)
- `v214-rv1-a-aswas-lists-from-memory` — CAUGHT by a failed check (fails 3, threw 0)
- `v214-rv1-a-aswas-screen-traded` — CAUGHT by a failed check (fails 2, threw 0)
- `v214-rv1-a-aswas-unchecked` — CAUGHT by a failed check (fails 1, threw 0)
- `v214-rv1-a-step1-dirty-record` — CAUGHT by a failed check (fails 3, threw 0)
- `v214-rv1-a-step1-no-record` — CAUGHT by a failed check (fails 3, threw 0)
- `v214-rv1-a-step1-other-cycles` — CAUGHT by a failed check (fails 3, threw 0)
- `v214-rv1-a-step1-other-tab-list` — CAUGHT by a failed check (fails 3, threw 0)
- `v214-rv1-a-writer-unlatched` — CAUGHT by a failed check (fails 9, threw 0)
- `v214-rv1-a-left-not-kept` — CAUGHT by a failed check (fails 5, threw 0)
- `v214-rv1-a-note-names-no-plans` — CAUGHT by a failed check (fails 5, threw 0)
- `v214-rv1-a-kept-without-record` — CAUGHT by a failed check (fails 1, threw 0)
- `v214-rv1-a-own-report-swallowed` — CAUGHT by a failed check (fails 2, threw 0)
- `v214-rv1-a-left-advice-false` — CAUGHT by a failed check (fails 1, threw 0)
- `v214-rv1-a-held-seed-counted` — CAUGHT by a failed check (fails 1, threw 0)
- `v214-rv1-a-held-record-written` — CAUGHT by a failed check (fails 5, threw 0)
- `v214-rv1-a-room-65536` — CAUGHT by a failed check (fails 1, threw 0)
- `v214-rv1-a-was-fail-unheld` — CAUGHT by a failed check (fails 1, threw 0)
- `v214-rv1-a-was-close-unasked` — CAUGHT by a failed check (fails 2, threw 0)
- `v214-rv1-a-was-dl-not-counted` — CAUGHT by a failed check (fails 1, threw 0)
- `v214-rv1-a-close-two-copies` — CAUGHT by a failed check (fails 1, threw 0)
- `v214-w2-opens-clears-changed` — CAUGHT by a failed check (fails 1, threw 0)

