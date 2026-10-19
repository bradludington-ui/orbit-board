# U13 probe: adversarial verification

**Verdict: sound, with issues.** The defect reproduces exactly as reported. No shortcut in the harness creates it, and the controls are sensitive. The issues below concern the scope statement, and two checks that would misjudge a fix if this probe were reused to test one. None of them changes the finding.

Runs: Sunday 11 Oct 2026, 20:34:45 to 20:41:01 ET. There were 21 bounded runs, one at a time (`setsid -w timeout -k 10 600`). All exited 0 and none timed out. PIDs are in `verify/pids.txt` and the per-run lines in `verify/logs/runs.txt`. Nothing was written in `/home/user/orbit-board`, in `u1fix/before`, in `u1fix/after`, or in any builder file; their blobs are unchanged.

## Identities
| what | blob |
|---|---|
| board re-run (`verify/board`, a cp -r of `u1fix/before`) | `4d273c0680132caafc4cbc8ca09c1533735c86de` |
| boot.mjs / shim | `9c4f49ad…` / `6e2ce2e6…` (identical to the builder's copy) |
| builder probe `u13-probe.mjs`, run unchanged | `a957682e9279509904cd9d14079cd7f81da1c9e1` |
| verifier probe `verify/u13-refute.mjs` (the builder's code plus scenarios V1–V5) | `1a54cc12a812ceb92a1e95406c263592fd21c045` |
| mutants `verify/m-*/` (one line each; diffs in `verify/m-*.diff`) | listed in section 4 |

- **orbit-board HEAD has moved since the build.** It went from 4a6f7c7 to c1a1330, d5ed05b and now 8216bc1.
  - Only `NEXT-VERSION.md` and `recovery/` changed.
  - `HEAD:prioritization-board-grid.html` is still `4d273c06` and `HEAD:boot.mjs` is still `9c4f49ad`, so the identity holds.
  - The README's label "current head 4a6f7c7" is stale.
- **The W1H block is verbatim.** Probe lines 37–105 match `audit-import.mjs` lines 3745–3813 (blob `fc3117a0`) byte for byte, checked with diff.

## 1. Re-run, unchanged
| scenario | builder | verifier | logs, ignoring timestamps and the board path |
|---|---|---|---|
| S1pull | 9 pass, 5 fail | 9 pass, 5 fail | identical |
| S1tick | 9 pass, 5 fail | 9 pass, 5 fail | identical |
| C1 | 5 pass, 0 fail | 5 pass, 0 fail | identical |
| C2 | 5 pass, 0 fail | 5 pass, 0 fail | identical |
| C3 | 4 pass, 0 fail | 4 pass, 0 fail | identical |

All observed values reproduce, including:
- `[true,"bob","brad",false]`
- `["BOB-2",650,true,"BRAD-1",700]`
- K2 and K3 both read "screen BOB-2/$650, head BRAD-1/$700, clean, nothing said"
- `whereNow`

## 2. Are the expected values literal?
Mostly. No ORBIT helper computes any expectation: `baseGet`, `driveBaseOf` and `_saveGen` are only read as observed values, and `whose()` is the probe's own classifier over the literal fixture pairs. Three exceptions:
- **`S1.store` is relational.** Its expected value is the observed screen value (`aft.screen.whose`), not the literal `'bob'`.
- **K1 and K1-literal take observed values when unclean.** If the board turned out not clean, their expected arrays would contain observed values, so the check would pass whatever the screen showed. That fits the contract ("not recorded as saved"), but it is not literal.
- **K1 and K1-literal are too narrow when clean.** See issue 1.

## 3. Is the scenario realistic?
These are the same shortcuts the audit suite uses. I tried each one to see whether it creates or hides the effect.
- **Direct `driveStorePull(true)` with Live off.** V3 sets Live on (`on:true`, `every:10`, `_driveLive=true`, `liveStart()`). Its real `setInterval` tick adopted Bob's copy about 9 s after his save, during the held save (`_saveBusy` 1). K1 failed the same way, and a later timer tick 12 s on said nothing. V5 uses **↻ Refresh now** (`livePoll(false)`), which also reproduces. **Neither the shortcut nor the direct call creates the effect.**
- **`confirm` always answered OK.** There is no `confirm(` anywhere in L26666–26860, which covers `driveStorePull` and `_driveStorePushRun`, and Brad's `writerMay` returns `'me'` without asking. The auto-OK only answers Bob's Take-the-pen. **It hides no question on Brad's side.**
- **`setNote`/`setAlloc` in place of DOM events.** `setNote` is the handler the note column binds (`set:'setNote'`, L18755). **This is not on the defect path.**
- **The hold, a gate on the main write's close after the history copy is written.**
  - It does not create the effect. C3 (hold, no newer copy) and V1 (hold, DIRTY true) both end consistent.
  - It does make a narrow real window deterministic. In the product, Bob's take-the-pen save **and** Brad's refresh read must both fall between Brad's save building its bytes (L26814–26815) and his folder write closing. Bob's clock-stamped ts must also exceed Brad's built `MS.ts`; with a slower clock on Bob's machine, Brad is told through `driveClashSay` instead.
  - The README does not say how narrow this is (issue 4).
- **The pen precondition is accurate.** `driveRestore` puts a copy on screen as unsaved work and never writes the folder head. A second tab in Brad's own browser is serialized by Web Locks. So a newer head during Brad's save really does need another writer to take the pen.

## 4. Are the controls sensitive? (one-line mutants, builder probe unchanged)
| mutant (board blob) | change | result |
|---|---|---|
| `m-c1-never-adopt` (`0f688f90`) | L26694 `if(theirs<=ours){` → `if(true){` | **C1 FAIL** `[false,"BRAD-1",700,false,…]` |
| `m-c2-no-dirty-guard` (`5bd994ef`) | L26703 `if(DIRTY){` → `if(false){` | **C2 FAIL** `[true,"BOB-2",650,true,false,false,"bob",false]` |
| `m-c3-held-base-replaced` (`47715f5b`) | L26844 records `kept? theirs : wroteTs` | **C3 FAIL** (base = head ts false); fixtures pass |
| `m-c3-clean-false` (`a81b7abd`), `m-c3-base-theirs` (`187d29ce`) | L26843 / L26844, every save | C3 run FAILS, but through the fixtures (the first save is broken too) |
| `m-c3-held-unclean` (`6e388129`) | L26843 `clean=(_saveGen===gen) && !kept` | **C3 PASSES.** It is blind to this: see issue 3 |
| `m-fix-refuse-busy` (`26eea611`) | L26667 `if(!driveStoreOn() \|\| _saveBusy) return false;` | K2 and K3 **pass**; C1, C2 and C3 pass; bobKeptInFolder still fails. **K1 and K1-literal FAIL a correct board:** see issue 1 |
| `m-fix-bump-gen` (`52ed4998`) | L26744 `applyStore(j.store); _saveGen++;` | K1, K1-literal, K2 and K3 all still FAIL; see the note below |

**The fix NEXT-VERSION.md implies does not work on its own.** NEXT-VERSION.md describes U13 as "adopts a newer copy without counting it as a change". Counting it (`_saveGen++`) is not enough:
- `driveBaseSet(ap, wroteTs, false)` never marks the record dirty, and DIRTY stays false.
- So the board is still recorded clean against Brad's copy while it shows BOB-2/$650.
- It also says "A change made while it was saving is not in the folder yet — it is saved next time", but the autosave needs DIRTY and will not run.

The probe correctly rejects this partial fix.

## 5. Do the README claims match the logs?
They do: every table value, timestamp (1791764812017 = 20:26:52.017 ET, and so on), status string, `whereNow` row, run time window (20:26:28–20:27:24 ET) and sequential start time. The pruned `-recent` copy is visible in `out/S1pull.json`: it is there at step `S1.bob` and gone at `afterSave`.

**The two claims the README marks as code-reading only were run in V4, and both hold:**
- **Brad's next 💾 Save:** no question asked. The head becomes BOB-2/$650, by Brad, writer Brad. BRAD-1/$700 is kept in history at Brad's written ts.
- **Bob's next Save:** refused with "Nothing was written", and the head is unchanged.

**The README's claim that the after board is not on this path holds.** The only executable change in `b4c55e38` is in `flowYears()`. That function is reached only from the funds-flow panel (rendered only when `flowOpen`), its export and its download, and it reads year lists only.

## 6. Refutation attempts on the defect
- **V1dirty, an edit made this session (DIRTY true) and then the held Save:** the refresh **refuses** ("Nothing was replaced"). The save lands with screen = head = BRAD-3/$700 recorded clean. 8 pass, 0 fail. **U13 does not occur.** The DIRTY guard protects the ordinary edit-then-save case.
- **V2reopen, a reopen carrying unsaved work** (DIRTY false this session, record dirty true), then 💾 Save held: **U13 occurs with real work.**
  - The refresh keeps BRAD-R aside, then adopts Bob's copy; its "kept aside" message is overwritten by "✅ Saved".
  - The board ends recorded clean: screen `["BOB-2",650,true,"BRAD-R",700]` against a base copy holding BRAD-R/$700.
  - BRAD-R/$700 is both in the folder head and in the kept slot.
- **V3timer and V5now:** both reproduce, as shown in section 3.

**The defect stands.**

## Issues
1. **(should-fix) K1 and K1-literal are narrower than the contract they state.**
   - When clean, they require the screen to be Bob's (`[true,"bob","bob",true]` and `["BOB-2",650,true,"BOB-2",650]`).
   - Under the "refuse while a save runs" mutant, the board ends `["BRAD-1",700,true,"BRAD-1",700]`, which satisfies "never recorded as saved with a base it did not come from". Both checks still FAIL.
   - The README describes K1-literal as "must not be recorded clean against a copy holding BRAD-1/$700", but the code checks something stricter.
   - The FAIL observations in this reproduction are still valid. Before the probe judges a fix, accept either literal pair, as `ckAny` does in `verify/u13-refute.mjs`.
2. **(should-fix) The precondition is incomplete in both directions.**
   - U13 also needs **DIRTY to be false while the save is in flight.** An ordinary edit-then-save is protected (V1).
   - But "with nothing unsaved" understates the reach. The first save after a reopen with work carried in browser storage also triggers it (V2), and then Brad's own work is kept aside even though it is in the folder.
3. **(minor) C3 cannot tell "lands clean" from "lands not clean" when nothing was unsaved.** The `m-c3-held-unclean` mutant passes C3, because DIRTY and the record were already false and `/✅ Saved/` matches only the prefix of "… not in the folder yet". Before C3 is used as a fix's regression control, check the exact status, or that "not in the folder yet" is absent.
4. **(minor) The README does not say how narrow the real window is.** Bob's take-the-pen save and Brad's refresh must both fall inside Brad's in-flight write, and Bob's ts must be later on the clock. The hold makes this deterministic, so per-save likelihood is low. Severity should be argued with that in mind.
5. **(minor) Stale and relational labels.**
   - The README says "current head 4a6f7c7"; HEAD is now 8216bc1, with the same board blob.
   - `S1.store` and the unclean branches of K1 are relational, not literal (section 2).

## Files
- `verify/logs/*.log`, `verify/logs/runs.txt`, `verify/pids.txt` and `verify/out/*.json`: every run.
- `verify/m-*/` and `verify/m-*.diff`: the mutants, made by `verify/mkmut.py`, which refuses unless the target line matches exactly.
- `verify/u13-refute.mjs`: scenarios V1dirty, V2reopen, V3timer, V4next and V5now.
- `verify/vrun.sh`: the bounded runner.
