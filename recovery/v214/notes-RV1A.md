# v2.14 review round 1 — RV1-A (the file route)

Worktree `/home/user/orbit-wt/v214-rv1a`, branch `v214-rv1a`, from 44aa984. Every finding was reproduced on my board (byte-identical
to the review board 5d5383c at 44aa984) with the reviewers' probes, copied into
`scratchpad/v214rev/rv1-A/` and pointed at this worktree, before anything was changed; each was run again after the fix.

The checks are five audit-import blocks in the RV1-A slot, all named `v2.14 RV1-A — …`. Slimmed together they run 66 checks; on
44aa984 (`git show 44aa984:prioritization-board-grid.html`) **33 fail**, and no check labelled a CONTROL fails there; on the fixed
board all pass (re-run on the final blocks: 33 fail on 44aa984, none a CONTROL). Per part on 44aa984: the as-it-was block (a) 1, (b) 1, (c) 1, (d) 1, (e) 2, (f) 0 (a CONTROL); the latch block downloaded 3, ✕ at the pause 3, raced 3; the own-file block (a) 3, (b) 2, (c) 2; the held block (a) 1, (b) edits 2, (b) saves 3; the room block (a) 1, (b) 3, (c) 1. Mutations are in mutate.mjs's RV1-A slot (22 new, `v214-rv1-a-*`) plus one retarget; `proofs-RV1A.json`,
`proved-RV1A.jsonl` (see the end).

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
- A plan left because its kept slot already holds other work (or there is no room) still stands in front of the import's file:
  the report now says so truthfully ("this board reads it in place of the import's, and 💾 Save writes it into this file"), and
  the import is still whole in the file imported. Keeping a second copy would replace kept work, which the board never does (v1.95).
- Lists that changed after the write are left, as C22 decided (no kept slot for a list); the report says what that does.

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

