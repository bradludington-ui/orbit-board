# ORBIT v2.00: handoff to Codex (13 Oct 2026)

**From:** the lead on ORBIT v2.00 (Claude), for Brad to pass to Codex.
**Purpose:** take independent work off the critical path, in small batches that can be reordered, dropped or re-scoped at
any time. Each batch stands alone and ends in one report. Brad pastes the report back, and the lead decides what to adopt.

## Ground rules (Brad's standing rules; every batch)

1. **Read-only on our branches.** Do not push, commit, open a PR, or edit `claude/v200-fixes-wip`, `claude/v200-ui`, `main`
   or `claude/orbit-v2.00`. Work in your own sandbox. Return everything in the report, as text and unified diffs against
   the stated base. (Brad's rule is one editor at a time; the lead commits.)
2. **`tools/export-audit/mutate.mjs` is TEXT ONLY.** Never import, execute or run it, not even to count. To build a mutant
   board from its text use `recovery/v200/bin/mkmut.py`; to count each entry's find on a board use
   `recovery/v200/bin/mcount.py`. Run both with `python3 -I`.
3. **Never run `playwright install`.** Use Chromium only if your sandbox already has it.
4. **The board file stays the empty template.** Synthetic data exists only at run time. Never return a populated board
   file.
5. **Times are Eastern** and are never later than your clock.
6. **Expected values in tests are hand-written literals.** Every new check must FAIL on the base and PASS on the fix;
   show both runs.
7. **Bound every run** (for example `timeout 600`), and record the command, the exit code and the time taken.
8. **The can't-fails are data loss and money.** Every exportable product must be exactly right, and every word on screen
   must stay true.

## Where things are

- Repository `bradludington-ui/orbit-board`, branch `claude/v200-fixes-wip`. It holds the records and these inputs.
- **Base for every batch:** commit `7ee498a46507972f803cd48ce9f27d5d668acb63`. Its product is `d66dd60` and its board
  blob is `fce8a391`. The board is `prioritization-board-grid.html`. The suites are `tools/export-audit/*.mjs`, run
  with node; see `package.json` (`npm run check`, `audit:recon`, `audit:import`, …).
- Findings: `recovery/v200/UNRESOLVED-LEDGER.md`. Rows U36–U42 were added today from the registry-text investigation.
- Inputs for this handoff: `recovery/v200/codex-handoff/inputs/`.
  - `regtext/` holds the drafted rows U36–U42 (`LEDGER-draft-U36-U42.md`), the drafted limits (`MATRIX-limits.md`), the
    probes (`probe/regtext.mjs`, `probe/verifier/*.mjs`) and their logs (`logs/`).
  - The probes contain paths from our machine. Treat them as references and adapt the paths to your sandbox.
  - `u9-snapshot-<time>/` is a draft of one fix, as diffs that apply to the base. See `SNAPSHOT.txt` in it.
- **Suite-block style** for any proposed tests: follow the existing v2.00 blocks exactly.
  - Use the async wrapper and `bootMark()`/`bootRelease(__bm, keepBoards())`/`settleBoards()`.
  - Include the two-space `  const name = '...';` line.
  - Use the `// ==== <name>` and `// ==== end <name> ====` markers.
- **Mutation entries** for proposals are `{ id, area, what, find, repl }`. Insert them into the mutate.mjs TEXT before
  the line `  // v2.00 (R3, Brad 11 Oct): a save that lands under a locked view says it saved the working plan.`.
  - Each find must match its board exactly once.
  - Every existing entry must still match exactly once (check with mcount.py).

## Batches (start with A1–A4 and B1; the rest wait for Brad's go)

| ID | Size | What to do | Inputs |
|---|---|---|---|
| **A1** | small | **U35, your pending registry-text findings.** Give their exact text and a reproduction for each. Map each one to U36–U42: the same as, overlapping, or new. Draft a ledger row for each new one. | the ledger; `regtext/LEDGER-draft-U36-U42.md` |
| **A2** | medium | **U37 (P1, release blocker): a workbook part can hold characters XML 1.0 forbids.** The XLSX writer (`_xesc`) escapes only `& < > "`, so U+0000–U+0008, U+000B, U+000C and U+000E–U+001F go in raw. An ordinary paste can put them there. See the first list below. | `regtext/logs/probe-base-file.log`, `FR-vpaste-chromium.log`, `FR-vflow-*.log`; `probe/verifier/vpaste.mjs`, `vflow.mjs` |
| **A3** | medium | **U40 (data loss, release blocker): two destinations whose names the board's own rule calls the same can merge, and a requirement loses its destination.** See the second list below. | `regtext/logs/FR-vdest-*.log`; `probe/verifier/vdest.mjs`; row U40 |
| **A4** | small | **U41 and U42 (P2).** See the third list below. | `FR-vsi-*.log`, `FR-vflow-*.log`; `vsi.mjs`, `vflow.mjs`; rows U41, U42 |
| **B1** | medium | **U9 money literals: a second pair of eyes on the arithmetic.** See the fourth list below. | `u9-snapshot-<time>/` |

**A2 (U37), what to do:**
- Reproduce on the base.
- Propose the smallest fix in the workbook writer for **every** export. Choose between two approaches and say why:
  - write the OOXML `_xHHHH_` escape. A literal `_xHHHH_` in text then also needs escaping, the board's own reader must
    decode it, and round trips must stay exact;
  - refuse the export and name the cell, as the IDS export's `IDS_BADCH` does.
- Deliver a patch with these parts:
  - the board change;
  - a suite block that reads the actual XLSX bytes and checks that every part is well-formed XML and that the
    board-reader round trip is exact;
  - checks that fail on the base;
  - mutation entries (text).

**A3 (U40), what to do:**
- Reproduce on the base. Typing keeps "Alpha Depot" beside "ALPHA DEPOT"; a second person's newer list then folds the two
  into one; R2's $300 moves; a save keeps the merge.
- Propose the smallest fix:
  - refuse, in `flowSetEnt`, a typed name whose `destName` equals another destination's;
  - in `destFold`, keep both entries of a file that already holds two such names, and say so. Never merge silently.
- Deliver a patch, tests and mutations, as in A2.

**A4 (U41, U42), what to do:**
- Reproduce both.
- U41: propose keeping and listing an SI code outside LA/EN/OT/FL/AT that a file carried, as `pmoNorm` does for a PMO
  copy. Today it is dropped with nothing said.
- U42: propose a `tabName` cut that never splits a character and drops an apostrophe at either end.
- Deliver patches and tests.

**B1 (U9), what to do:**
- Apply the snapshot's three diffs to the base.
- Recompute **by hand** every expected figure in the blocks "v2.00 (U9)" and "v2.00 (U9, every export)", working from
  their fixtures.
- Confirm the tie rule matches `apportion()`: floor each share, give leftover dollars to the largest remainders, and break
  ties toward the earlier CLIN.
- Run the focused blocks on the base board (the defect checks fail) and on the draft (all pass).
- Report any figure you cannot derive, or any figure you derive differently.

**Later batches, which wait for Brad's go and for inputs the lead will publish:**
- **B2:** re-run your own two cycle-export cases (U32 duplicate `K1`; U33 entry named `__none__`) against our fix draft.
  Read the actual XLSX after import and after reopening, and check USAF $900 / ANG $200 against ordinary-key controls.
- **C1:** check that every sentence in each drafted NEXT-VERSION.md entry is true.
- **C2:** short decision memos for Brad's four open questions (the U9 two-lane split; the U19 reopen header; the U28 font
  setting; a locked cycle's registry list under U32/U33).
- **D1:** an independent full-suite and mutation-lane run on the pinned combined tree, after integration.

## Second round (13 Oct, 1:22 PM ET): B2 and C2 are ready to send on Brad's go

Your A1–A4 and B1 reports were read here, and the A2–A4 patches now seed three fix tracks (U37, U40, U41/U42). Thank you.
One gap was found in A2: the slide-deck writer goes through the same `_xesc` and is unchanged. Our U37 track covers it,
so A2 needs no further work from you.

**B2 (medium): your two cycle-export cases, against our U32/U33 draft.**
- Input: `inputs/cycreg-snapshot-20261013-1322/`. Its `SNAPSHOT.txt` gives the base, the three diffs, the blobs, and the
  draft in short.
- Re-run your duplicate-`K1` case and your `__none__` case on the snapshot. Read the actual XLSX after import and after
  reopening. Check USAF $900 / ANG $200 against ordinary-key controls, with your own hand-written literals.
- Look for any route that still doubles money, refuses an ordinary list, or says something untrue. The snapshot is under
  its round-3 review, so name the snapshot you used.

**C2 (small): four short decision memos for Brad.** Each memo gives about one page: the question, the options, what each
option does to money and to the person's work, and a recommendation with its reason. No code is needed. Sources: rows U9,
U19, U28, U32 and U33 in `UNRESOLVED-LEDGER.md`, and "For Brad to decide" in `STATUS-2026-10-13.md`.
1. **U9, the two lanes.** Apart from the exact-split case, an office's figures and the Spend Plan Source's CLIN lines
   still differ. This happens with two CLINs on one office, part funding, a CLIN added on the board, or incremental
   awards. Which figure is an office's money?
2. **U19, the reopen header.** After a put-back and a reopen before saving, the top bar says "Saved …" while the record
   says unsaved. What should it say?
3. **U28, the font setting.** Should the final validation's verify:grid run with this container's font substitution
   ('Segoe UI' mapped to Inter, 14.6% wider) bypassed, so that it measures what users see? The tools are never weakened.
4. **U32/U33, a locked cycle's registry list.** The draft refuses a repeated or reserved key in a file handed over. It
   keeps a person's own board as it is, and says what its lists hold. A locked cycle's list cannot be corrected, though.
   Should there be a way to correct it, and what would it cost the lock's guarantee?

**C1 and D1 still wait.** C1 needs the final NEXT-VERSION entries, and D1 needs the pinned combined tree. The lead
publishes both when they exist.

## Report format (one per batch)

```
BATCH <id>  |  base 7ee498a (and snapshot <name> if used)  |  started / finished <times ET>
FINDINGS: what you reproduced, the exact steps, and observed vs expected (literals)
PROPOSAL: unified diff against 7ee498a (board / suite / mutate.mjs TEXT), each change explained in one line
RUNS: command | exit | time taken | result (counts); base run and fixed run for every new check; mcount result
NOT DONE / LIMITS: anything not run or not covered, said plainly
QUESTIONS FOR BRAD: only if a decision is genuinely his
```

## How the lead uses your reports

- Reproductions and new findings go into the ledger, credited to Codex.
- An adopted patch is applied to a scratch copy here. It then goes through our usual path: two independent adversarial
  reviews (a data-loss and money lens, and a test-adequacy lens), fix rounds, the lead's own commit check, and its own
  commit.
- Nothing you send is committed as is.
- If a draft or a base changes, the lead publishes a new snapshot folder and names the batches it affects. Please state
  in each report the commit and snapshot you used.
