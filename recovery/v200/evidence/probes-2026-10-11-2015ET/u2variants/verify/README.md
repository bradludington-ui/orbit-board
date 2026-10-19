# U2 verification: what the verifier ran

Adversarial check of the builder's U2 probe in `..` (`u2variants/`). All runs were on Sunday 11 Oct 2026 between 20:48 and 20:55 ET, one at a time and bounded (`setsid -w timeout -k 10 600 node …`, through `verify/run.sh`). PIDs are in `verify/pids.txt`; exit codes, wall times and end times are in `verify/logs/runs.txt`; full output is in `verify/logs/<label>.log`. All 11 runs exited 0 and none timed out.

The verifier never wrote to the builder's files or boards. A sha1 snapshot of all 240 builder files was taken before the first run, and the same snapshot taken afterwards matches it (`builder-files.before.sha1`). Other checks:
- `u1fix/before` and `u1fix/after` still hash to `4d273c06…` and `b4c55e38…`.
- `/home/user/orbit-board` was only read. `git status` is clean, and the product board is still blob `4d273c06…` at commit 4a6f7c7.
- Nothing ran a suite, the gate, mutate.mjs or the standards check.

## Runs

| label | probe (blob) | board (blob) | result |
|---|---|---|---|
| RERUN-BASE | builder `u2probe.mjs` 363beee7, unchanged | builder `boards/BASE` 4d273c06 | 15.8 s, exit 0 |
| RERUN-U2a | same | `boards/U2a` 5e43f9e8 | 16.0 s, exit 0 |
| RERUN-U2b | same | `boards/U2b` 4e303ff3 | 17.1 s, exit 0 |
| RERUN-U2ab | same | `boards/U2ab` 5b7a863e | 17.0 s, exit 0 |
| MUT-M1-keptTouch | same | `mut/boards/M1-keptTouch` 93ea11d3 | 15.9 s, exit 0 |
| MUT-M2-msTouch | same | `mut/boards/M2-msTouch` 8ea4762c | 15.0 s, exit 0 |
| MUT-M3-alwaysRefuse | same | `mut/boards/M3-alwaysRefuse` 6bc2da82 | 15.4 s, exit 0 |
| MUT-M5-noCheckpointOverwrite | same | `mut/boards/M5-noCheckpointOverwrite` c8dfc867 | 15.1 s, exit 0 |
| EXT-BASE | verifier `u2ext.mjs` 602f047f | `boards/BASE` 4d273c06 | 10.9 s, exit 0 |
| EXT-U2a | same | `boards/U2a` 5e43f9e8 | 11.1 s, exit 0 |
| EXT-U2b | same | `boards/U2b` 4e303ff3 | 10.7 s, exit 0 |

Every run booted through its board's own `tools/export-audit/boot.mjs` (9c4f49ad), with `runtime-encoding-shim.mjs` (6e2ce2e6) imported first and `BOARD` deleted. The probe asserts that `BOARD` resolves to that board's own copy. Each output's `IDS` records the board blob.

Each mutant board is a `cp -r` of `u1fix/before`, with `node_modules` kept as a symlink and only `prioritization-board-grid.html` replaced by `mkmut.mjs`. Every find matched once (`logs/mkmut.log`), and the one-line diffs are in `mut/<M>.diff`. The mutants are disposable sensitivity probes, never proposed repairs:
- **M1**: U2b, plus the refusal rewrites the kept slot with one trailing space.
- **M2**: U2b, plus the refusal moves `MS.ts` by 1 ms.
- **M3**: U2b with `if(_saveBusy>=0)`, so it always refuses.
- **M5**: U2a, plus the landing records the copy it wrote as the checkpoint only when the count has not moved: `if(clean) driveBaseSet(…)`, and `if(clean) LASTKNOWN=wrote`. This is a causal test of the builder's explanation, not a repair, because it would make an ordinary edit typed during a write clash with the person's own save.

`u2ext.mjs` is the builder's probe verbatim, minus its scenario loop, plus three new scenarios. It is assembled by `mkext.mjs` from `u2ext.tail.txt`:
- **E1**: the race exactly as the builder's folder race, then one live tick (`liveTick()`) in the same session, with no reopen.
- **E2**: no save running; put back, then one live tick.
- **E3**: no save running; put back, then 💾 Save.

For these, live view is switched on at state level (`_liveCfg.on=true; auto=true; _driveLive=true`). That matches what the product does when it works out of the folder: L26324 sets `on=true` and calls `liveStart()`, `auto` defaults to true, and the tick runs every 30 s.

## Judging

- **Unchanged builder checker.** `node ../check.mjs verify` judged the reruns; the log is `logs/check-rerun.log`.
- **Mutant judging.** For each mutant, `verify/judge/<name>/out/` holds the four reruns with the mutant's output in the slot it derives from. The unchanged `check.mjs` judged each one; logs are in `judge/<name>/check.log`.
- **Verifier literal checks.** `verify-check.mjs` checks against hand-written literals; its log is `logs/verify-check.log`. Fixture times are read only to name which copy a checkpoint points at: `F1` and `f2` are the board-file times, `t0` and `t1` the folder copies, and `s1Save` the write of S1.
- **Leaf comparison.** `normcmp.mjs` compares every output leaf after timestamps and timestamp-dependent hashes are rendered symbolically.

## Results

**Reproduction:**
- The unchanged checker on the reruns gives `{"BASE":[16,2],"U2a":[20,2],"U2b":[24,0],"U2ab":[24,0]}`. Every PASS/FAIL line and every `got` value is identical to the builder's `logs/check.log`.
- The normalized leaf comparison of builder vs rerun outputs shows 0 differing leaves of 652, 649, 691 and 691 (BASE, U2a, U2b, U2ab).
- The no-race sha1s are `ed833515` (folder) and `b02a0431` (file) on all four boards, in both the builder's outputs and the reruns.

**Sensitivity**, using the unchanged checker on mutant outputs:

| mutant | judged as | checker totals | what failed |
|---|---|---|---|
| M1 | U2b | 20/4 | B1 (`keptByteIdentical` false) and B2 (kept slot not identical) in folder and file. Everything else passed. |
| M2 | U2b | 22/2 | Only B1 (`msByteIdentical` false), folder and file |
| M3 | U2b | 14/10 | B4, B5, B6, ASK and NR, folder and file |
| M5 | U2a | 22/0 | Nothing: ASK now passes in folder and file. The next Save is refused with the choice (folder) or asks "⚠ HOLD ON" (file). |
| BASE output | BASE slot filled with U2a's output | 10/8 | P2, D1, D2 and ASK, folder and file |
| BASE output | U2b | — | `check.mjs` threw a TypeError at line 47 (`r.retry.putBack` undefined) instead of reporting FAIL. The verifier's own guarded check reports B1 and B3 failing on BASE output, 4 of 4 rows failed as expected. |

**Verifier literal checks** (`logs/verify-check.log`):

| check | result |
|---|---|
| NRL: the no-race result against literals (K on screen, `[true,true,true]`, checkpoint t0/F1, S1 kept as `swap`, 1 confirm, header, promise text, head N) | BASE, U2a, U2b, U2ab and M5 pass. M3 fails, folder and file. |
| CKP: the checkpoint after the race's landing | Folder `s1Save`, file `f2` on BASE, U2a, U2b and U2ab. M5 gives `t0` / `F1`. |
| E1 on BASE | After one tick in the same session, S1 is on screen and K is in no reachable copy. No confirm and no write; the status still reads "✅ Saved …". |
| E1 on U2a | The tick's autosave writes K over S1: 1 write, 0 confirms, status "✓ Saved to the shared folder automatically". S1 is kept in the kept slot and the folder history. |
| E1 on U2b | K is still kept and S1 is on screen and in the folder. Nothing is written. |
| E2 (all) | No save running: the tick's autosave is refused. 0 writes, head stays N. |
| E3 (all) | No save running: Save is refused with "Load theirs · Save yours over theirs". 0 writes, head N. |

**Other comparisons:**
- **U2b vs U2ab:** 9 leaves of 686 differ. All of them are `_saveGen` values in recorded flags, because U2ab's counter moves on the no-race and retry put-backs.
- **BASE-1 vs BASE-2:** only BASE-2's added after-edit step and the symbolic name of F1 in `cmp` differ.

## Caveats

- **Mocks and runtime.** Everything runs in jsdom with in-memory folder and file mocks; there is no real browser modal, Web Locks or Teams version history.
- **State-level wiring.** The builder's `connect()` and `wire()` set `_liveCfg`, `_driveDir`, `FH` and `confirm` directly. E1–E3 also set live on at state level, as described above.
- **E1 was run for the folder only.** A board file has no refresh tick.
- **Untested: two tabs of one board in one browser.** They share browser storage, so the `.base` record and the main key can be written by the other tab's save. U2a and U2b are per-tab.
