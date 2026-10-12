# U13, Codex's no-concurrent-writer case: adversarial verification

**Verdict: sound, with issues.**

The builder's central claim reproduces exactly, on the current board (`4d273c06`) and on main `f9b4413` (`b160bc03`). With **nobody writing the folder during the save**, the board ends with REMOTE/$650 on screen. It is recorded clean against the WORKING/$700 copy that it wrote and that is now the folder head. A later refresh says nothing, and neither does a reopen. The fixture prerequisite is real and stated correctly: REMOTE's ts is one hour ahead of Brad's clock.

- The controls are sensitive. Each one fails under a one-line mutant.
- The disclosed shortcuts do not create the effect. Three routes closer to the product reproduce it on both boards:
  - a single browser profile;
  - permission not kept;
  - the opening's own connect with the **real Live timer**.
- The issues concern how one prerequisite is worded (P5), how realistic S1open is, and some minor labelling.
- **None of the issues changes the finding.** "Needs a concurrent writer" is not a prerequisite of U13. Nothing here measures how likely it is, and this verdict does not call it rare or common.

All runs were on Sunday 11 Oct 2026, 21:33:51–21:45:01 ET. There were 43 bounded runs, one at a time (`setsid -w timeout -k 10 600`). All exited 0 and none timed out. PIDs are in `verify/pids.txt` (86 lines), and the per-run lines are in `verify/logs/runs.txt`.

## Identities
| what | blob |
|---|---|
| current board: fresh `git archive HEAD` into `verify/cur` (orbit-board HEAD `17701c2`) | `4d273c0680132caafc4cbc8ca09c1533735c86de` |
| main board: fresh `git archive f9b44136…` into `verify/main` (`main` = `origin/main` = `f9b4413`) | `b160bc031c7f70a4492f64394893d9b74bb0f327` |
| boot.mjs / shim (both copies) | `9c4f49ad…` / `6e2ce2e6…` |
| builder probe `u13codex-probe.mjs`, re-run **unchanged** (= `src/head.mjs` + `w1h-block.txt` + `src/body.mjs`, checked with `cmp`) | `1d10ccdb139a92c99ecbc97831628cb209f3ff86` |
| W1H block (diffed against `audit-import.mjs` `fc3117a0` L3745–3813: identical) | `e771578d…` |
| variant `verify/var-refuse-busy` (rebuilt by me from `verify/cur`; same blob as the builder's and the earlier verifier's) | `26eea61134b956ef457f47642b78261eb3ea7d7c` |
| mutants: `m-ca-adopt-older` / `m-cb-no-dirty-guard` / `m-cc-no-keep` / `m-k-bump-gen` | `d9536efc…` / `5bd994ef…` / `853a5f8a…` / `52ed4998…` |
| verifier probe `verify/u13codex-refute.mjs` (= builder head + W1H + `verify/refute-body.mjs`, which is the builder's body plus V1–V4) | `f4ef4110e557d4dc7a0d7af7e8e2dd49bd17a6c8` |
| `verify/run.sh` / `mkmut.cjs` / `cmp.cjs` / `margins.cjs` | `27dc30f1…` / `0f86a492…` / `8bc5fb22…` / `ee7a50b5…` |

- The builder's `cur/` and `main/` copies are byte-identical to my fresh archives: same board, same `tools/` tree (`diff -r`).
- No builder file was modified; nothing in the builder's directory outside `verify/` is newer than my first file.
- `/home/user/orbit-board`: `git status` is clean, and nothing was written there.
- `u1fix/before` and `u1fix/after` still hash to `4d273c06` and `b4c55e38`.
- **Disclosure.** Around 21:36 ET I ran one read-only `git status --short` in `/home/user/orbit-ui`, to confirm the builder had not touched it.
  - That command can refresh git's index stat cache. The orbit-ui worktree's index mtime is 21:36:24 ET, which may or may not be mine.
  - No file there was edited, staged or committed. I did nothing else there.
- I did not run mutate.mjs, any full suite, the gate, verify:grid, standards or playwright install.

## 1. Re-run, unchanged (builder probe, 18 runs + 9 variant runs)
I compared every check's `[id, kind, expected, observed, pass]` with `verify/cmp.cjs`. The results are identical to the builder's `out/*.json` in all 27 cases. Current and main are also identical to each other in all 9 scenarios.

| scenario | cur | main | var-refuse-busy |
|---|---|---|---|
| S1auto | 10 pass, 1 fail (`premise`) | same | 10/1 (`premise`) |
| S1harness, S1tick, S1perm, S1open, S1pen | 9 pass, 3 fail (K1, K2, K3) each | same | 11/1 each (`adopt` only; K1–K3 pass) |
| Ca | 12/0 | same | 12/0 |
| Cb | 11/0 | same | 10/1 (`Cb.pull` message element) |
| Cc | 10/0 | same | 10/0 |

The README's numbers match the outputs:
- REMOTE ts minus real time after its write: 3,599,687–3,599,845 ms.
- REMOTE ts minus the held save's built `MS.ts`: 3,597,667–3,598,753 ms.
- Ca: −175 to −244 ms after its write, and −1,757 to −2,343 ms against the save's build.
- The final runs fell between 21:23:59 and 21:26:44 ET.
- There were 58 runs: 7 (v1) + 24 (v2) + 27. `pids.txt` has 116 lines.

The superseded v2 claim also holds. In all 24 v2 outputs, every check's `[id, observed, pass]` is identical in v3.

My own re-runs gave the same margins:
- 3,599,747–3,599,839 ms after the write;
- 3,597,974–3,598,726 ms against the save's build;
- Ca: −177 to −196 ms and −1,558 to −1,713 ms.

All the cited line numbers are correct in both boards:
- **cur:** L26667, L26692–26694, L26744–26746, L26798, L26813, L26843/26844/26849, L6772, L26367 and L27767–27770.
- **main:** L26601, L26483–26485 and L26586.
- Between the two boards, `driveStorePull` and `_driveStorePushRun` differ only by v2.00's R3 `CYCVIEW` additions, which are not on this path.

## 2. Are the expected values literal?
Yes, with the exceptions the builder disclosed.
- No ORBIT helper computes an expected value. Expected values are hand-written literals, or derive only from the scenario's own config: `CFG.reopen`, `!!CFG.ahead` and the REMOTE writer name. Timestamps are compared only as identities read from the raw folder bytes.
- **The third alternative in K1–K3 is relational:** it copies the observed screen and base when the record is unclean. The README says so.
- **The K2/K3 "said" escape** (`/after the copy you are working from|does not have their changes/`) matches the actual `driveClashSay` text (L26874–26875). It never fired in a failing scenario.
- **`domHas` (not used in any check) is polluted.** "WORKING" matches the board's own `<script>` comments ("WORKING OUT OF THE FOLDER…"), so `domHas.working` is true on every board.
  - My DOM scan (`domWhere` step, V-runs) shows that the only *rendered* note is `REMOTE <span.x>` on the landed board and on the reopened one.
  - So "screen REMOTE" is right. `domHas` should not be cited as evidence.

## 3. Realism: shortcuts, and whether one creates or hides the effect
**The hold.** A gate on the main write's `close()` stands in for File System Access semantics: the head is replaced only at close. It does not create the effect, because Ca (hold, REMOTE not ahead) and Cb (hold, DIRTY true) both end consistent.

**The harness reopen (no opening pull; S1harness, S1tick, S1pen, Ca and Cc)** is a state-level stand-in, as disclosed. To test whether it creates the effect, I ran routes closer to the product (verifier probe; each on cur **and** main; observed values identical on the two boards):

| run | what differs from the builder's S1 | result (cur = main) |
|---|---|---|
| **V1same** | **One browser profile.** Brad's own board saved REMOTE while its clock was +1 h. Board A is that same browser storage reopened with the clock correct (`lsOf(R0)`); there is no second adopting board. Then edit, harness reopen, held Save, `driveStorePull(true)`. | U13 reproduces: K1–K3 FAIL `["REMOTE",650,true,"WORKING",700]`; reach PASS; the adopt mechanism PASSES. 9 pass, 3 fail |
| **V1sameperm** | V1same, by the S1perm product route: permission not kept, Save asks, the bar's Connect during the save | same: 9 pass, 3 fail |
| **V2live** | **The opening's own connect runs, with permission kept and Live on** (`on:true`, `every:10`). The folder copy cannot be read twice: once at the opening's pull ("could not be read — the file is being synced. Nothing was loaded"), and once at Live's immediate first tick. Then a held Save. **The refresh is the real `setInterval` tick**, which adopted REMOTE 10 s in. | U13 reproduces: K1–K3 FAIL; reach PASS. The tick's only folder write was Brad's own heartbeat lock. 9 pass, 3 fail |

So the builder's inference that REMOTE's writer key "in practice means the same browser profile" is now evidence. A single profile whose clock was an hour fast for one save is enough; no second machine or person is involved.

**V2live also shows a route with no user action during the save.** The product's own opening connect ran, its read failed, the board went live, and the automatic timer did the pull.

**S1open** is product functions in a forced order. The save is already writing when the opening's `driveAutoConnect` reads the folder. In the product, that connect fires 60 ms after load, after an IndexedDB handle read and a permission query, so Save would have to be pressed in that first moment. The README calls S1open a "product-path route" and does not say the order is harness-forced (issue 2). S1perm, V1sameperm and V2live are the stronger product routes.

**S1perm** is realistic in one respect I checked. After Save's `driveDir(true)` gets the permission, `_driveNeed` stays `'click'` and `_driveLive` stays false, so `driveBarHtml()` still shows the one-click Connect bar during and after the save. Clicking it is the bar's own call to action. In the product `_driveDir` would come from IndexedDB, not from assignment; `driveDir()` ends at the same handle either way.

**`confirm` answered OK** hides nothing on the defect path:
- No question was asked during any held save (`asked` is `[]`), except S1pen's single take-the-pen confirm (n = 1).
- No `confirm(` appears in `driveStorePull` or `_driveStorePushRun`.

**Fast clock.** REMOTE's clock is `Date.now` replaced in its own jsdom window only. The fixture check passes with about +3,599,8xx ms against Node's clock, which proves that the replacement did not leak into Node or into the other boards.

## 4. Are the controls sensitive? (one-line mutants, builder probe unchanged)
| mutant (blob) | line changed (verify/cur) | scenario | result |
|---|---|---|---|
| `m-ca-adopt-older` (`d9536efc`) | L26694 `if(theirs<=ours){` → `if(false){` | Ca | **Ca.pull FAIL** `[true,"remote",true,{kept WORKING}]`; Ca.landed FAIL; **Ca.K1 FAIL** `["REMOTE",650,true,"WORKING",700]`. 9/3 |
| `m-cb-no-dirty-guard` (`5bd994ef`) | L26703 `if(DIRTY){` → `if(false){` | Cb | **Cb.pull FAIL** `[true,"remote",true,false]`; Cb.landed, K1, K2 and K3 FAIL. 6/5. *Without the DIRTY guard, U13 happens in the same session with no reopen: P4 is exactly that guard being bypassed.* |
| `m-cc-no-keep` (`853a5f8a`) | L26726 `const own=ownUnsaved(…)` → `const own=false;` | Cc | **Cc.pull FAIL** (kept null, "kept aside" absent); **Cc.reach FAIL** `[true,false]`: WORKING lost. 8/2 |
| `m-k-bump-gen` (`52ed4998`) | L26744 `applyStore(j.store); _saveGen++;` | S1harness, S1perm | K1, K2 and K3 **still FAIL** `["REMOTE",650,true,"WORKING",700]`. Only `adopt` changes (`_saveGen` moved). Counting the adoption alone leaves the record clean against WORKING, as the earlier verifier found for the concurrent case. |
| `var-refuse-busy` (`26eea611`) | L26667 `\|\| _saveBusy` | all 9 | Builder's results reproduced: K1–K3 and reach PASS on all five S1 routes; `adopt` FAILS as designed; Cb.pull FAILS on its message element only (the refusal is now silent). |

**All three controls and the contract checks discriminate.** The K checks reject a board that keeps the record clean against the wrong copy, including after a counter-only change. They accept a board that refuses adoption while a save runs.

## 5. Claims marked "code reading only" by the builder, now run (verifier probe, cur = main)
**V3next: Brad's next 💾 Save from the U13 end state.**
- **Result: no question asked.** The head becomes REMOTE/$650, by Brad, with the status "✅ Saved", recorded clean.
- WORKING/$700 is kept in folder history as a **`-recent`** copy (`…-014414-recent.json`).
- **Confirmed.** By `snapPrune` (code reading, not run), a later save's history step removes earlier `-recent` copies. WORKING would then remain only in the kept slot, so reach still holds.

**V4putback: "put it back", then 💾 Save.**
- **The clash message is met, as the builder predicted:** "⛔ Brad saved O&M FY27 to the shared folder just now, after the copy you are working from. Nothing was written." The head stays WORKING/$700.
- **New: the put-back question is false.** Because the record is falsely clean, it says *"What is on screen now is still in the shared folder it came from"*. In fact REMOTE is only in folder history.
- REMOTE is also **not** kept aside (`nowUnsaved` false, so no swap; kept slot null). After the put-back, REMOTE is gone from browser storage and survives only in the folder's history, as a spaced copy.

## 6. Refutation attempts on "no concurrent writer is needed"
In every reproducing run, the folder write log during the hold has only Brad's history copy and main write. V2live adds Brad's own heartbeat lock. The REMOTE-writing board was disconnected before Brad's board opened, and in V1same that board *is* Brad's own browser profile. **I could not refute the claim.** The prerequisite that replaces the second writer is P1: a folder head whose ts exceeds the save's `MS.ts`, which with a pre-existing copy means a clock running ahead.

Comparison with the earlier main-head description ("left REMOTE falsely clean against a WORKING folder file"): main `f9b4413` gives exactly that end state, `["REMOTE",650,true,"WORKING",700]`. Current gives the same.

## Issues
1. **(should-fix) P5 is worded too narrowly, and "an opening pull that runs first always adopts" is too strong.**
   - V2live: the opening's own connect *ran* (permission kept, Live on) and its read failed, so it did not adopt. The automatic Live timer then reproduced U13 during the save, with no user action during the save.
   - P5 should read: "the reopen's pull has not **adopted** REMOTE before the save (not run, permission not kept, or the read failed)".
   - This matters when likelihood is discussed: a route exists that goes through the product's own opening connect and the timer.
2. **(minor) S1open's order is forced by the harness, but the README presents it as a product-path route without saying so.** In the product, Save would have to start before the 60 ms opening connect reads the folder. Better product routes are S1perm, V1sameperm and V2live.
3. **(minor) "In practice the same browser profile" was an inference.** The builder's fixture used a second storage that shared Brad's key. V1same and V1sameperm now show the literal single-profile route reproduces on both boards.
4. **(minor) The header time is REMOTE's future ts, not the save time.** The README quotes "Saved 2:24 AM … (UTC clock)" for a run at 01:24 UTC, and does not say this is an hour in the future. It is itself a visible sign of the skew.
5. **(minor) Wording elsewhere still assumes a second writer.** The ledger's U13 description column (HEAD `17701c2`) still says "someone else's newer copy arrives". The earlier verifier's statement (u13probe VERDICT §3) says "a newer head during Brad's save really does need another writer". The builder rightly says only the likelihood sentence was withdrawn at `d0eb705`. Both statements are superseded by this result for any future-dated head and should be updated when the ledger is next edited; that is outside this item.
6. **(minor) The relational parts are disclosed.** These are the K1–K3 unclean alternative and `domHas` (§2). `domHas` is polluted by the board's own script text and should not be cited.

## Files
- `verify/logs/*.log`, `verify/logs/runs.txt`, `verify/pids.txt` and `verify/out/*.json`: every run (cur-*, main-*, var-*, m-*, rf-*).
- `verify/cur`, `verify/main`: fresh archives.
- `verify/var-refuse-busy`, `verify/m-*` and `verify/*.diff`: one-line copies made by `verify/mkmut.cjs`, which refuses unless the target line matches exactly.
- `verify/u13codex-refute.mjs` and `verify/refute-body.mjs`: V1same, V1sameperm, V2live, V3next and V4putback, plus a DOM scan.
- `verify/cmp.cjs`, `verify/margins.cjs` and `verify/run.sh`.
