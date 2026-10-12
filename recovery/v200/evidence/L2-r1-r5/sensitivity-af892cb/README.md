# Committed-suite sensitivity in audit-import at `af892cb12713dd22afd9a84c0ec604b30614f6ea`: PARTIAL backup (7:46 PM ET; reorganized 8:24 PM ET)

**Layout (Brad, 8:14 PM ET: "Preserve interrupted and completed runs separately"):**
- `completed/` holds only runs with an end line and an exit code.
- `interrupted/` holds the three runs cut off by container restarts, numbered in order. None of them counts.
- `mutants/` holds each mutant's diff and its mkmut record.
- `summary.txt` is the driver's own running record. Interrupted lines are marked INCOMPLETE there.
- `REUSE-JUSTIFICATION.md` says whether these results stand for `4a6f7c7`; it is pending its dynamic premise.

**Where it runs:** a git clone at af892cb (`scratchpad/rec/L2/wt-af892cb`), since audit-import's v1.86 block needs git.

| File | Blob |
|---|---|
| board | `82c7f446…` |
| audit-import.mjs | `28c04e49…` |
| mutate.mjs | `6c084989…` |
| boot.mjs | `9c4f49ad…` |

**How it runs:** the driver `bin/sens-import.sh` (sha256 `5c4ab31c…`) runs one audit-import at a time, at 900 s plus 20 s
grace. Each mutant is built from the clone's `mutate.mjs`, read as text by `bin/mkmut.py`, and applies exactly once. The
mutant boards themselves are not kept here; `mut-*.diff` and `mut-*.json` rebuild them.

**Results so far** (`summary.txt` is copied as it stood at 7:46 PM ET):

| Run | Result |
|---|---|
| BASELINE | ALL CHECKS PASSED, 534.5 s |
| `v200-r3-cycblock-gone`, `-falls-through`, `-says-saved`, `-landed-view-unsaid`, `-landed-view-prefix` | each caught by its own R3 block |
| `v200-r4-no-recheck` | caught: 3 failing. It was repeated after the first run was cut off |
| `v200-r4-held-quietly` | caught: 1 failing |
| `v200-r4-said-not-held` | caught: 3 failing |

**Incomplete runs.** Neither is a pass; the logs are kept as `INCOMPLETE-*`.
- `v200-r4-no-recheck`: cut off by the 7:15 PM ET container restart.
- `v200-r5-restore-gen`: cut off by the 7:44 PM ET container restart.

**Still to run:** the driver was restarted at 7:45 PM ET as PID 273. It runs `v200-r5-restore-gen`,
`v200-r5-restore-basedirty`, `unsaved-flag-never-set` and `impmixed-file-unguarded`, in that order.

**Applies to:** this is committed-suite sensitivity at af892cb.
- **4a6f7c7:** justified reuse. The R1 follow-up touched only funds-flow code, and audit-import calls no changed flow
  function.
- **The final tree:** if a save-path change lands (U2, U13, U3 or U5), these results do not carry over to the changed
  functions.
