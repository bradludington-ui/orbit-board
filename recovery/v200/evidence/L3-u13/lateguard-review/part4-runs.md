
## 5. The builder's revision `98eed7e8` (appeared in `rec/L3/u13/after/` at 07:32 ET)
`diff` against `a88a1e5b`: 11 lines, all inside the late guard's comment and block — the message now reads "⏳ The shared
folder’s copy of O&M FY27 was **not loaded**: a save or Load theirs was under way, so this board kept its own copy …"
and a `const lbl=esc(APPN_LBL[mySlug()]||mySlug())+' FY'+(MS.cur%100);` (pure) is computed inside the guard. Nothing
before the guard changed. Copied to `rev2/board-98eed7e8.html` and run through the same matrix (R1: N/H1/H2, R2: WR/WA;
308 cells, all invariants held): **all 242 cells with a save under way clean**; N identical to before/ (66/66) and to
`a88a1e5b` (66/66); held and W cells identical to `a88a1e5b` except the B10 non-quiet cells (p0, cn, ac), whose status
text is the new message and which now also add one `DIAG.log` entry (the new words contain "not loaded", which
`diagIsWarn` counts as a warning — memory only, kept for 🩺 Save diagnostics). **The verdict holds for `98eed7e8` too.**
If the builder's board changes again, this verdict is for these two blobs only.

## 6. Runs (all node runs bounded `setsid -w timeout -k 10 600`, the AUDIT_IMPORT_RUNNING lock checked first — it was
never present —, one at a time, PIDs in `pids.txt`; none timed out, none skipped; all exit 0)

| label | start–end (ET) | board | modes / condition | cells | with a save | not clean with a save |
|---|---|---|---|---|---|---|
| trial1-after | 07:17:56–07:19:01 | a88a1e5b | all, B06+B10 only (harness `10595950`, before a report-format fix) | 50 | 40 | 0 |
| A1-after-NH | 07:19:46–07:24:05 | a88a1e5b | N, H1, H2 | 198 | 132 | 0 |
| A2-after-W | 07:24:05–07:26:14 | a88a1e5b | WR, WA | 110 | 110 | 0 |
| B1-before-NH | 07:26:14–07:29:54 | 1375b72b | N, H1, H2 | 198 | 132 | 20 (B06, B10) |
| B2-before-W | 07:29:54–07:31:32 | 1375b72b | WR, WA | 110 | 110 | 20 (B06, B10) |
| M1-top-H | 07:31:32–07:33:40 | 00deacda (M1) | H1, H2 | 132 | 132 | 0 |
| M1-top-W | 07:33:40–07:35:25 | 00deacda (M1) | WR, WA | 110 | 110 | 9 (B10) |
| M2-entry-W | 07:35:25–07:37:05 | 31ffb6ea (M2) | WR, WA | 110 | 110 | 18 (B06, B10) |
| X1-after-LP / X1-before-LP | 07:37:05–07:39:10 / –07:42:03 | a88a1e5b / 1375b72b | 📡 panel open; N, H1, H2; p1 p0 tk | 117 / 117 | 78 / 78 | 0 / 12 |
| X2-after-ON / X2-before-ON | 07:42:03–07:44:12 / –07:45:51 | a88a1e5b / 1375b72b | Live view on; N, H1; cn ac | 52 / 52 | 26 / 26 | 0 / 6 |
| X3-after-PK | 07:45:51–07:46:07 | a88a1e5b | no folder name; N, H1; cn, B10 | 2 | 1 | 1 (the picker; never reaches the pull) |
| X4-after-WF / X4-before-WF | 07:46:07–07:46:24 / –07:46:40 | both | a save lands before the refresh's read | 4 / 4 | 0 | — |
| X5-after-WS / X5-before-WS | 07:47:30–07:47:39 / –07:47:49 | both | a save lands while the read is in flight | 4 / 4 | 0 | — |
| R1-rev2-NH | 07:49:57–07:53:45 | 98eed7e8 | N, H1, H2 | 198 | 132 | 0 |
| R2-rev2-W | 07:53:45–07:55:40 | 98eed7e8 | WR, WA | 110 | 110 | 0 |

Other bounded commands (`logs/runs.txt`): `node --check` of both harnesses (07:17, 07:26, 07:47), `mkmut` (07:19, the
first attempt exited 1 on an assertion — the guard block is 6 lines, not 5 — and wrote nothing; the second built both
mutants), `reach.py` (07:20, 07:22), `lp-sanity.mjs` (07:48), and the `summarize`/`compare`/`heldcheck` text tools.
**Not bounded (said plainly):** a handful of short `python3 -I` text edits and inspections of my own files (patching the
harness, the drafts and the summarizer; reading jsonl lines), and `grep`/`sed`/`diff`/`git hash-object`/`git status`
commands, each finished in well under a second; none was node. The one process I stopped was my own `tail -F | grep`
monitor of `logs/runs.txt` (TaskStop). Nothing else was killed.

**Rules kept:** `tools/export-audit/mutate.mjs` was never imported, executed or run (my copies have none; the mutants
were made by `h/mkmut.py` from the board text). No playwright, no chromium. Nothing in `/home/user/orbit-board` or
`/home/user/orbit-ui` was edited, staged, committed or pushed (`git status` in orbit-board: only its untracked
`node_modules`). The builder's files were only read and copied (`cp -a` at 07:06 ET); my copies keep the
`node_modules` symlink. The board file stays the empty template (only my copies were booted; fixtures live in jsdom
storage and in-memory folders). The full audit-import and audit-board were not run.

## 7. Files (all under `rec/L3/verify-U13-lateguard/`)
- `VERDICT.md` (this), `pids.txt`, `logs/runs.txt` and one log per run, `out/<run>.jsonl` (every cell: snapshots' diffs,
  every storage write with its caller, folder operations, IndexedDB operations, writer calls with `_saveBusy`, landing),
  `out/tables-all.txt` (every table, every run, including the before-the-wait parts), `out/tables-main.txt`.
- `h/lateguard.mjs` (`064ddd22`), `h/lateguard-x.mjs` (`f66282d9`; X1–X4 ran `c52dbcfe`, the same without WS),
  `h/summarize.py` (`fa2b84b5`), `h/compare.py` (`265a307b`), `h/heldcheck.py` (`7cca017b`),
  `h/reach.py` (`d80f7b32`), `h/mkmut.py` (`e095aa57`), `h/lp-sanity.mjs` (`aa761c1e`), `runw.sh`, `brun.sh`.
- `after/` (`a88a1e5b`), `before/` (`1375b72b`), `mut/M1-guard-at-top.html` (`00deacda`), `mut/M2-entry-only.html`
  (`31ffb6ea`), `rev2/board-98eed7e8.html`.
- Drafts merged here: `part0-head.md` … `part4-runs.md`.
