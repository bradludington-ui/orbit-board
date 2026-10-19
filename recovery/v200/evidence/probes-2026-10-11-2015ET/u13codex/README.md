# U13, Codex's earlier case: no concurrent writer (read-only reproduction, no fix)

Run Sunday 11 Oct 2026. The final set ran from 21:23:59 to 21:26:44 ET: 27 bounded runs, one at a time. All exited 0 and none timed out. Earlier runs from 21:17:41 ET are superseded and kept (see "Superseded runs"). In total there were 58 runs, every one exit 0.

## Result
**U13 reproduces with nobody writing the folder during the save, on both boards, with identical observed values.** The boards are the current one (`4d273c06`) and main `f9b4413` (`b160bc03`).

1. The folder already holds REMOTE ($650). Its timestamp is **one hour ahead** of Brad's clock.
2. Brad's board adopts REMOTE, he edits WORKING ($700), and he reopens with WORKING unsaved.
3. A 💾 Save of WORKING is held at the close of its folder write.
4. A refresh during the hold reads the **same pre-existing REMOTE** and adopts it, because its ts is greater than the ts the save just stamped. It sets WORKING aside.
5. The save lands. The board is **recorded clean against the WORKING copy it wrote**, which is now the folder head, while the screen shows REMOTE/$650.
6. A later refresh says nothing, and so does a reopen.

During the save, the only folder writes were Brad's own: the history copy of REMOTE and the main write, then his lock heartbeat after release. The refresh wrote nothing.

The first half of the literal contract fails (K1, K2 and K3 FAIL). The second half holds: REMOTE is in the folder history and on screen, and WORKING is in the folder head and the kept slot.

**One part of the task's step 3 does not happen as written.** When the reopen runs **the opening's own connect** (`driveAutoConnect`, folder permission kept), that connect pulls REMOTE itself before any save. It sets WORKING aside and puts REMOTE on screen, recorded clean against REMOTE (S1auto, `premise` FAIL). After that, the held save and the refresh leave a consistent record.

U13 on this route therefore needs the opening's pull **not** to have run before the save. Three routes were reproduced:
- **S1harness / S1tick:** the harness connect. This is the folder handle assigned directly, as Codex's `races-probe.mjs` `connect()` does.
- **S1perm:** the browser did not keep the folder's edit permission, so the opening stops at "one click". 💾 Save asks for permission itself, and the bar's Connect click during the save is the pull.
- **S1open:** the save is already writing when the opening's own connect reads the folder.
- **S1pen** uses the harness reopen too. In it, REMOTE was written earlier by Bob (writer Bob), and Brad's held save is ✍ Take the pen. So the writer key is not a prerequisite either.

**Compared with the earlier concurrent-writer reproduction (`rec/L2/u13probe`):** the end state has the same signature and comes from the same code lines. The adoption happens at L26744–26746, and the save records clean at L26843–26849 with base = its written ts. **A concurrent writer is not required.** A future-dated folder copy is required instead (prerequisite P1 below). Unlike the concurrent case, nothing is lost from the folder: the adopted REMOTE survives in the folder history.

How likely this is was not measured here. It depends on how often a folder copy's ts runs ahead of the saving machine's clock, and on how often the opening's pull has not run first. Neither was measured. This report does not call U13 rare or common.

## Boards, tools and identities
| what | path (under this directory) | blob |
|---|---|---|
| current board (`git archive` of orbit-board HEAD `3df5fcd` at 21:10 ET) | `cur/prioritization-board-grid.html` | `4d273c0680132caafc4cbc8ca09c1533735c86de` |
| main board (`git archive` of `f9b441365551cd691a20a8f0b08a374a92a12f0e`) | `main/prioritization-board-grid.html` | `b160bc031c7f70a4492f64394893d9b74bb0f327` |
| boot.mjs (cur, main and var; identical) | `*/tools/export-audit/boot.mjs` | `9c4f49ad8cec537097bdf485458cfd2a09b06594` |
| tools tree / package.json, cur | `cur/tools`, `cur/package.json` | tree `b4d06979…` / `7cf8186f…` |
| tools tree / package.json, main | `main/tools`, `main/package.json` | tree `a15858c2…` / `54670335…` |
| shim (a copy of `recovery/v200/probes/received-2026-10-11/runtime-encoding-shim.mjs`) | `*/runtime-encoding-shim.mjs` | `6e2ce2e6beda9e7526527530500f254d877d0320` |
| sensitivity variant board (one line; `var-refuse-busy.diff`) | `var-refuse-busy/prioritization-board-grid.html` | `26eea61134b956ef457f47642b78261eb3ea7d7c` |
| probe (final, used by every reported run) | `u13codex-probe.mjs` = `src/head.mjs` + `w1h-block.txt` + `src/body.mjs` | `1d10ccdb139a92c99ecbc97831628cb209f3ff86` |
| W1H block, verbatim from `tools/export-audit/audit-import.mjs` (blob `fc3117a0`) L3745–3813 | `w1h-block.txt` (diffed against the probe: identical) | `e771578d5d28c538c8e8ba05ca712718c1e8333b` |
| runner | `run.sh` | `67ae439d8b62dec6727ab6eb5a0b2d765aaa2e0e` |
| dump helper (reads out/*.json only) | `dump.cjs` | `885af74957e80b97f9be26fe088dd9763ae9e97d` |

- **orbit-board HEAD moved during this work.** It went from `3df5fcd` to `17701c2` (`d0eb705`, `0e7836a`, `17701c2`; recovery documents only).
  - `HEAD:prioritization-board-grid.html` is still `4d273c06`.
  - The tools tree is still `b4d06979`, and boot.mjs and audit-import.mjs are unchanged.
  - So "current board" is the same board at both commits.
- **Booting.** BOARD was unset before each copy's own boot.mjs was imported, and the probe asserts that BOARD resolves to `<copyRoot>/prioritization-board-grid.html`. The shim is imported first. `node_modules` is a symlink to `/home/user/orbit-board/node_modules`.
- **The variant was run the same way**, with `var-refuse-busy` as its copy root. BOARD was not set.
- **Nothing was written in `/home/user/orbit-board`** (git status clean) or in `/home/user/orbit-ui`. `u1fix/before` and `u1fix/after` still hash to `4d273c06` and `b4c55e38`.
- **What was not run:** mutate.mjs, any full suite, the gate, verify:grid, standards and playwright install.

## How to run
```
run.sh <label> -- node u13codex-probe.mjs <cur|main|var-refuse-busy> out/<label>.json <scenario>
```
- `run.sh` wraps each run as `setsid -w timeout -k 10 600 …`.
- The timeout PID and its node child, with the command, go to `pids.txt` (116 lines).
- The full output goes to `logs/<label>.log`, and one line per run goes to `logs/runs.txt`.
- The observed values for every step are in `out/<label>.json`: screen, DIRTY, `_baseDirty`, the record (`baseGet()`), `driveBaseOf`, `_saveGen`, `_saveBusy`, browser storage, the kept slot, status and header, the folder head, history and write log.
- Labels are `cur-*`, `main-*` and `var-*`.

## The fixture (literal, written by hand in the probe)
- **Board file F1:** W1H `baseFile('Brad', …)`.
  - Services: USAF/ANG/AFRC.
  - Requirement A: ask 900/200/100. Requirement B: ask 400/100/50.
  - Writer: Brad. FY27.
- **REMOTE:** requirement A's note is `REMOTE` and its allocation total is **$650**.
  - It is written **through the product** (`setNote`, `setAlloc`, 💾 `saveInPlace()`) into the empty folder, before Brad's board opens. It is the folder's first copy: no history, and its writer is recorded.
  - The board that writes it has **its `Date.now()` replaced to return real time + 3,600,000 ms**. That is its own jsdom window; Node's clock and every other board are untouched.
  - That board is then disconnected (`_driveDir=null`, `store` off) and never touches the folder again.
- **REMOTE's writer:**
  - In every scenario except S1pen it uses Brad's writer key (`prio27writerKey` b000…1, name Brad). Brad's later save is therefore `'me'` with no question.
  - The writer key is per browser storage (`writerKey()`, L2104). In practice that means **this same browser profile, saving while its clock was an hour fast** (corrected later).
  - In **S1pen**, REMOTE is written by **Bob** (key c000…3), and Brad's held save is ✍ Take the pen (one confirm, answered OK).
- **WORKING:** note `WORKING`, allocation total **$700**, entered on Brad's board after it adopted REMOTE.
- **PREREQUISITE, stated as asked: the REMOTE timestamp is one hour ahead.**
  - In every run except Ca, REMOTE's `store.ts` and payload `ts` were 3,599,687–3,599,845 ms ahead of real time just after the write. That is 3,600,000 ms less the write's own duration.
  - REMOTE ts minus the held save's built `MS.ts` was 3,597,667–3,598,753 ms. The save was built about 1.2–2.3 s (real) after REMOTE was written.
  - In **Ca**, REMOTE was written at real time: its ts was 175–244 ms before real time just after its write, and 1,757–2,343 ms before the save's build.
  - Fixture check `fixture.remoteClock` asserts this in every run.

## The steps (as asked) and how each scenario differs
1. **Folder has REMOTE; Brad's board opens and adopts it.**
   - Brad's board boots F1, the harness connects it, and the opening's own connect runs (`driveAutoConnect()`, which calls `driveStorePull(false)`).
   - Recorded: screen REMOTE; record `{dirty:false, folder:{om|2027: REMOTE ts}}`; `driveBaseOf` = REMOTE ts; `MS.ts` = REMOTE ts; kept slot empty.
2. **Edit:** `setNote('A','WORKING')` and `setAlloc('A','700')`.
   - Result: DIRTY true; record dirty true; base still REMOTE ts.
   - The edit's `save()` sets `MS.ts=Date.now()` (L6772), which is **an hour earlier than REMOTE ts**.
3. **Reopen:** a fresh board boots F1 with Brad's browser storage (`lsOf`), and the harness connects it to the same folder.
   - **S1auto** then runs `driveAutoConnect()`, the opening's own connect.
   - **S1harness, S1tick, S1open, S1pen, Ca and Cc** do not. This stands in for "the opening's pull has not run".
   - **S1perm:** the folder mock answers `queryPermission` with `'prompt'` until `requestPermission` is called. `driveAutoConnect()` runs and stops at "one click" (`_driveNeed='click'`, returns false, no pull).
   - **Cb** does not reopen; DIRTY stays true.
4. **Hold:** 💾 Save (`saveInPlace()`; in S1pen `takePen()`) is held at the close of its write of `spmt-2027-om.json`, using the W1H folder mock `hold.main`. By then it has read the folder, kept REMOTE in `history/` and built its bytes. In **Cc** nothing is held and there is no save.
5. **Refresh while held:** the folder head is still the pre-existing REMOTE. The refresh is:
   - `driveStorePull(true)` in S1auto, S1harness, S1pen, Ca, Cb and Cc;
   - `liveTick()`, the Live timer's function, in S1tick;
   - `driveConnectNow()`, the bar's one-click Connect, in S1perm;
   - `driveAutoConnect()`, the opening's own connect, in S1open.
6. **Release** the close and settle. Record everything.
7. **A later refresh** (`liveTick()` in S1tick, `driveStorePull(true)` otherwise).
8. **A reopen:** a fresh board from this browser storage, the harness connect, `driveAutoConnect()`, then `driveStorePull(true)`.

## Checks: expected vs observed (current board; main's observed values are identical in every check of every scenario)
The contract, stated literally: **"the board must never be recorded clean (saved) while what is on screen differs from the copy its record names as base; and REMOTE/WORKING content must each remain in some reachable copy."**

- **K1:** checked after the save lands.
- **K2:** checked after a later refresh. It is also met if the board says the copies differ ("after the copy you are working from" or "does not have their changes").
- **K3:** checked after a reopen and a refresh, with the same allowance as K2.
- **What K1–K3 compare:** `[screen note, screen $, recorded clean (DIRTY, _baseDirty and record dirty all false), note of the copy whose ts the record names, its $]`.
- **What K1–K3 allow:** a consistent clean pair (REMOTE/REMOTE or WORKING/WORKING), or an unclean record. The third, unclean alternative in the table copies the observed screen and base, so it is relational, not literal; it accepts any unclean state.
- **reach:** REMOTE/$650 and WORKING/$700 are each found in the folder head, the folder history, or the reopened board's screen, storage or kept slot.


#### S1auto
| check | kind | expected | observed (current = main) | result |
|---|---|---|---|---|
| fixture.remote | fixture | `["REMOTE",650,"Brad","Brad",0]` | `["REMOTE",650,"Brad","Brad",0]` | PASS |
| fixture.remoteClock | fixture | `[true,true]` | `[true,true]` | PASS |
| fixture.adopt | fixture | `[true,"remote",false,false,false,true,true,true,null]` | `[true,"remote",false,false,false,true,true,true,null]` | PASS |
| fixture.edit | fixture | `["working",true,true,true,true]` | `["working",true,true,true,true]` | PASS |
| S1auto.premise | premise | `[true,"working",false,true,null]` | `[true,"remote",false,false,"working"]` | **FAIL** |
| S1auto.held | observed | `[true,false,false,1,true,"remote",true]` | `[true,false,false,1,true,"remote",true]` | PASS |
| S1auto.head | record | `["REMOTE",650,"Brad","Brad",true]` | `["REMOTE",650,"Brad","Brad",true]` | PASS |
| S1auto.K1 | contract | `["REMOTE",650,true,"REMOTE",650] or ["WORKING",700,true,"WORKING",700] or ["REMOTE",650,false,"REMOTE",650]` | `["REMOTE",650,true,"REMOTE",650]` | PASS |
| S1auto.K2 | contract | `["REMOTE",650,true,"REMOTE",650] or ["WORKING",700,true,"WORKING",700] or ["REMOTE",650,false,"REMOTE",650]` | `["REMOTE",650,true,"REMOTE",650]` | PASS |
| S1auto.K3 | contract | `["REMOTE",650,true,"REMOTE",650] or ["WORKING",700,true,"WORKING",700] or ["REMOTE",650,false,"REMOTE",650]` | `["REMOTE",650,true,"REMOTE",650]` | PASS |
| S1auto.reach | contract | `[true,true]` | `[true,true]` | PASS |

#### S1harness
| check | kind | expected | observed (current = main) | result |
|---|---|---|---|---|
| fixture.remote | fixture | `["REMOTE",650,"Brad","Brad",0]` | `["REMOTE",650,"Brad","Brad",0]` | PASS |
| fixture.remoteClock | fixture | `[true,true]` | `[true,true]` | PASS |
| fixture.adopt | fixture | `[true,"remote",false,false,false,true,true,true,null]` | `[true,"remote",false,false,false,true,true,true,null]` | PASS |
| fixture.edit | fixture | `["working",true,true,true,true]` | `["working",true,true,true,true]` | PASS |
| S1harness.reopened | fixture | `["working",false,true,true,null]` | `["working",false,true,true,null]` | PASS |
| S1harness.held | fixture | `[true,false,true,1,true,"remote",true]` | `[true,false,true,1,true,"remote",true]` | PASS |
| S1harness.adopt | mechanism | `[true,1,"remote",true,true,"working",0]` | `[true,1,"remote",true,true,"working",0]` | PASS |
| S1harness.head | record | `["WORKING",700,"Brad","Brad",true]` | `["WORKING",700,"Brad","Brad",true]` | PASS |
| S1harness.K1 | contract | `["REMOTE",650,true,"REMOTE",650] or ["WORKING",700,true,"WORKING",700] or ["REMOTE",650,false,"WORKING",700]` | `["REMOTE",650,true,"WORKING",700]` | **FAIL** |
| S1harness.K2 | contract | `["REMOTE",650,true,"REMOTE",650] or ["WORKING",700,true,"WORKING",700] or ["REMOTE",650,false,"WORKING",700]` | `["REMOTE",650,true,"WORKING",700]` | **FAIL** |
| S1harness.K3 | contract | `["REMOTE",650,true,"REMOTE",650] or ["WORKING",700,true,"WORKING",700] or ["REMOTE",650,false,"WORKING",700]` | `["REMOTE",650,true,"WORKING",700]` | **FAIL** |
| S1harness.reach | contract | `[true,true]` | `[true,true]` | PASS |

#### S1tick
| check | kind | expected | observed (current = main) | result |
|---|---|---|---|---|
| fixture.remote | fixture | `["REMOTE",650,"Brad","Brad",0]` | `["REMOTE",650,"Brad","Brad",0]` | PASS |
| fixture.remoteClock | fixture | `[true,true]` | `[true,true]` | PASS |
| fixture.adopt | fixture | `[true,"remote",false,false,false,true,true,true,null]` | `[true,"remote",false,false,false,true,true,true,null]` | PASS |
| fixture.edit | fixture | `["working",true,true,true,true]` | `["working",true,true,true,true]` | PASS |
| S1tick.reopened | fixture | `["working",false,true,true,null]` | `["working",false,true,true,null]` | PASS |
| S1tick.held | fixture | `[true,false,true,1,true,"remote",true]` | `[true,false,true,1,true,"remote",true]` | PASS |
| S1tick.adopt | mechanism | `["(liveTick returns nothing)",1,"remote",true,true,"working",0]` | `["(liveTick returns nothing)",1,"remote",true,true,"working",0]` | PASS |
| S1tick.head | record | `["WORKING",700,"Brad","Brad",true]` | `["WORKING",700,"Brad","Brad",true]` | PASS |
| S1tick.K1 | contract | `["REMOTE",650,true,"REMOTE",650] or ["WORKING",700,true,"WORKING",700] or ["REMOTE",650,false,"WORKING",700]` | `["REMOTE",650,true,"WORKING",700]` | **FAIL** |
| S1tick.K2 | contract | `["REMOTE",650,true,"REMOTE",650] or ["WORKING",700,true,"WORKING",700] or ["REMOTE",650,false,"WORKING",700]` | `["REMOTE",650,true,"WORKING",700]` | **FAIL** |
| S1tick.K3 | contract | `["REMOTE",650,true,"REMOTE",650] or ["WORKING",700,true,"WORKING",700] or ["REMOTE",650,false,"WORKING",700]` | `["REMOTE",650,true,"WORKING",700]` | **FAIL** |
| S1tick.reach | contract | `[true,true]` | `[true,true]` | PASS |

#### S1perm
| check | kind | expected | observed (current = main) | result |
|---|---|---|---|---|
| fixture.remote | fixture | `["REMOTE",650,"Brad","Brad",0]` | `["REMOTE",650,"Brad","Brad",0]` | PASS |
| fixture.remoteClock | fixture | `[true,true]` | `[true,true]` | PASS |
| fixture.adopt | fixture | `[true,"remote",false,false,false,true,true,true,null]` | `[true,"remote",false,false,false,true,true,true,null]` | PASS |
| fixture.edit | fixture | `["working",true,true,true,true]` | `["working",true,true,true,true]` | PASS |
| S1perm.reopened | fixture | `["working",false,true,true,null,false,"click","prompt"]` | `["working",false,true,true,null,false,"click","prompt"]` | PASS |
| S1perm.held | fixture | `[true,false,true,1,true,"remote",true]` | `[true,false,true,1,true,"remote",true]` | PASS |
| S1perm.adopt | mechanism | `[true,1,"remote",true,true,"working",0]` | `[true,1,"remote",true,true,"working",0]` | PASS |
| S1perm.head | record | `["WORKING",700,"Brad","Brad",true]` | `["WORKING",700,"Brad","Brad",true]` | PASS |
| S1perm.K1 | contract | `["REMOTE",650,true,"REMOTE",650] or ["WORKING",700,true,"WORKING",700] or ["REMOTE",650,false,"WORKING",700]` | `["REMOTE",650,true,"WORKING",700]` | **FAIL** |
| S1perm.K2 | contract | `["REMOTE",650,true,"REMOTE",650] or ["WORKING",700,true,"WORKING",700] or ["REMOTE",650,false,"WORKING",700]` | `["REMOTE",650,true,"WORKING",700]` | **FAIL** |
| S1perm.K3 | contract | `["REMOTE",650,true,"REMOTE",650] or ["WORKING",700,true,"WORKING",700] or ["REMOTE",650,false,"WORKING",700]` | `["REMOTE",650,true,"WORKING",700]` | **FAIL** |
| S1perm.reach | contract | `[true,true]` | `[true,true]` | PASS |

#### S1open
| check | kind | expected | observed (current = main) | result |
|---|---|---|---|---|
| fixture.remote | fixture | `["REMOTE",650,"Brad","Brad",0]` | `["REMOTE",650,"Brad","Brad",0]` | PASS |
| fixture.remoteClock | fixture | `[true,true]` | `[true,true]` | PASS |
| fixture.adopt | fixture | `[true,"remote",false,false,false,true,true,true,null]` | `[true,"remote",false,false,false,true,true,true,null]` | PASS |
| fixture.edit | fixture | `["working",true,true,true,true]` | `["working",true,true,true,true]` | PASS |
| S1open.reopened | fixture | `["working",false,true,true,null]` | `["working",false,true,true,null]` | PASS |
| S1open.held | fixture | `[true,false,true,1,true,"remote",true]` | `[true,false,true,1,true,"remote",true]` | PASS |
| S1open.adopt | mechanism | `[true,1,"remote",true,true,"working",0]` | `[true,1,"remote",true,true,"working",0]` | PASS |
| S1open.head | record | `["WORKING",700,"Brad","Brad",true]` | `["WORKING",700,"Brad","Brad",true]` | PASS |
| S1open.K1 | contract | `["REMOTE",650,true,"REMOTE",650] or ["WORKING",700,true,"WORKING",700] or ["REMOTE",650,false,"WORKING",700]` | `["REMOTE",650,true,"WORKING",700]` | **FAIL** |
| S1open.K2 | contract | `["REMOTE",650,true,"REMOTE",650] or ["WORKING",700,true,"WORKING",700] or ["REMOTE",650,false,"WORKING",700]` | `["REMOTE",650,true,"WORKING",700]` | **FAIL** |
| S1open.K3 | contract | `["REMOTE",650,true,"REMOTE",650] or ["WORKING",700,true,"WORKING",700] or ["REMOTE",650,false,"WORKING",700]` | `["REMOTE",650,true,"WORKING",700]` | **FAIL** |
| S1open.reach | contract | `[true,true]` | `[true,true]` | PASS |

#### S1pen
| check | kind | expected | observed (current = main) | result |
|---|---|---|---|---|
| fixture.remote | fixture | `["REMOTE",650,"Bob","Bob",0]` | `["REMOTE",650,"Bob","Bob",0]` | PASS |
| fixture.remoteClock | fixture | `[true,true]` | `[true,true]` | PASS |
| fixture.adopt | fixture | `[true,"remote",false,false,false,true,true,true,null]` | `[true,"remote",false,false,false,true,true,true,null]` | PASS |
| fixture.edit | fixture | `["working",true,true,true,true]` | `["working",true,true,true,true]` | PASS |
| S1pen.reopened | fixture | `["working",false,true,true,null]` | `["working",false,true,true,null]` | PASS |
| S1pen.held | fixture | `[true,false,true,1,true,"remote",true]` | `[true,false,true,1,true,"remote",true]` | PASS |
| S1pen.adopt | mechanism | `[true,1,"remote",true,true,"working",0]` | `[true,1,"remote",true,true,"working",0]` | PASS |
| S1pen.head | record | `["WORKING",700,"Brad","Brad",true]` | `["WORKING",700,"Brad","Brad",true]` | PASS |
| S1pen.K1 | contract | `["REMOTE",650,true,"REMOTE",650] or ["WORKING",700,true,"WORKING",700] or ["REMOTE",650,false,"WORKING",700]` | `["REMOTE",650,true,"WORKING",700]` | **FAIL** |
| S1pen.K2 | contract | `["REMOTE",650,true,"REMOTE",650] or ["WORKING",700,true,"WORKING",700] or ["REMOTE",650,false,"WORKING",700]` | `["REMOTE",650,true,"WORKING",700]` | **FAIL** |
| S1pen.K3 | contract | `["REMOTE",650,true,"REMOTE",650] or ["WORKING",700,true,"WORKING",700] or ["REMOTE",650,false,"WORKING",700]` | `["REMOTE",650,true,"WORKING",700]` | **FAIL** |
| S1pen.reach | contract | `[true,true]` | `[true,true]` | PASS |

#### Ca
| check | kind | expected | observed (current = main) | result |
|---|---|---|---|---|
| fixture.remote | fixture | `["REMOTE",650,"Brad","Brad",0]` | `["REMOTE",650,"Brad","Brad",0]` | PASS |
| fixture.remoteClock | fixture | `[true,true]` | `[true,true]` | PASS |
| fixture.adopt | fixture | `[true,"remote",false,false,false,true,true,true,null]` | `[true,"remote",false,false,false,true,true,true,null]` | PASS |
| fixture.edit | fixture | `["working",true,true,true,false]` | `["working",true,true,true,false]` | PASS |
| Ca.reopened | fixture | `["working",false,true,true,null]` | `["working",false,true,true,null]` | PASS |
| Ca.held | fixture | `[true,false,true,1,true,"remote",false]` | `[true,false,true,1,true,"remote",false]` | PASS |
| Ca.pull | control | `[false,"working",true,null]` | `[false,"working",true,null]` | PASS |
| Ca.landed | control | `["WORKING",700,"WORKING",700,"Brad",true,true,true,false]` | `["WORKING",700,"WORKING",700,"Brad",true,true,true,false]` | PASS |
| Ca.K1 | contract | `["REMOTE",650,true,"REMOTE",650] or ["WORKING",700,true,"WORKING",700] or ["WORKING",700,false,"WORKING",700]` | `["WORKING",700,true,"WORKING",700]` | PASS |
| Ca.K2 | contract | `["REMOTE",650,true,"REMOTE",650] or ["WORKING",700,true,"WORKING",700] or ["WORKING",700,false,"WORKING",700]` | `["WORKING",700,true,"WORKING",700]` | PASS |
| Ca.K3 | contract | `["REMOTE",650,true,"REMOTE",650] or ["WORKING",700,true,"WORKING",700] or ["WORKING",700,false,"WORKING",700]` | `["WORKING",700,true,"WORKING",700]` | PASS |
| Ca.reach | contract | `[true,true]` | `[true,true]` | PASS |

#### Cb
| check | kind | expected | observed (current = main) | result |
|---|---|---|---|---|
| fixture.remote | fixture | `["REMOTE",650,"Brad","Brad",0]` | `["REMOTE",650,"Brad","Brad",0]` | PASS |
| fixture.remoteClock | fixture | `[true,true]` | `[true,true]` | PASS |
| fixture.adopt | fixture | `[true,"remote",false,false,false,true,true,true,null]` | `[true,"remote",false,false,false,true,true,true,null]` | PASS |
| fixture.edit | fixture | `["working",true,true,true,true]` | `["working",true,true,true,true]` | PASS |
| Cb.held | fixture | `[true,true,true,1,true,"remote",true]` | `[true,true,true,1,true,"remote",true]` | PASS |
| Cb.pull | control | `[false,"working",true,true]` | `[false,"working",true,true]` | PASS |
| Cb.landed | control | `["WORKING",700,"WORKING",700,"Brad",true,true,true,false]` | `["WORKING",700,"WORKING",700,"Brad",true,true,true,false]` | PASS |
| Cb.K1 | contract | `["REMOTE",650,true,"REMOTE",650] or ["WORKING",700,true,"WORKING",700] or ["WORKING",700,false,"WORKING",700]` | `["WORKING",700,true,"WORKING",700]` | PASS |
| Cb.K2 | contract | `["REMOTE",650,true,"REMOTE",650] or ["WORKING",700,true,"WORKING",700] or ["WORKING",700,false,"WORKING",700]` | `["WORKING",700,true,"WORKING",700]` | PASS |
| Cb.K3 | contract | `["REMOTE",650,true,"REMOTE",650] or ["WORKING",700,true,"WORKING",700] or ["WORKING",700,false,"WORKING",700]` | `["WORKING",700,true,"WORKING",700]` | PASS |
| Cb.reach | contract | `[true,true]` | `[true,true]` | PASS |

#### Cc
| check | kind | expected | observed (current = main) | result |
|---|---|---|---|---|
| fixture.remote | fixture | `["REMOTE",650,"Brad","Brad",0]` | `["REMOTE",650,"Brad","Brad",0]` | PASS |
| fixture.remoteClock | fixture | `[true,true]` | `[true,true]` | PASS |
| fixture.adopt | fixture | `[true,"remote",false,false,false,true,true,true,null]` | `[true,"remote",false,false,false,true,true,true,null]` | PASS |
| fixture.edit | fixture | `["working",true,true,true,true]` | `["working",true,true,true,true]` | PASS |
| Cc.reopened | fixture | `["working",false,true,true,null]` | `["working",false,true,true,null]` | PASS |
| Cc.pull | control | `[true,"REMOTE",650,true,false,false,"WORKING",700,true]` | `[true,"REMOTE",650,true,false,false,"WORKING",700,true]` | PASS |
| Cc.K1 | contract | `["REMOTE",650,true,"REMOTE",650] or ["WORKING",700,true,"WORKING",700] or ["REMOTE",650,false,"REMOTE",650]` | `["REMOTE",650,true,"REMOTE",650]` | PASS |
| Cc.K2 | contract | `["REMOTE",650,true,"REMOTE",650] or ["WORKING",700,true,"WORKING",700] or ["REMOTE",650,false,"REMOTE",650]` | `["REMOTE",650,true,"REMOTE",650]` | PASS |
| Cc.K3 | contract | `["REMOTE",650,true,"REMOTE",650] or ["WORKING",700,true,"WORKING",700] or ["REMOTE",650,false,"REMOTE",650]` | `["REMOTE",650,true,"REMOTE",650]` | PASS |
| Cc.reach | contract | `[true,true]` | `[true,true]` | PASS |

## State after the save lands (S1harness, current board, run 21:24:05 ET; main is identical apart from timestamps)
Timestamps are identities read from the folder bytes:
- REMOTE ts is `1791771848015` (22:24:08 ET, one hour ahead).
- The save's written ts is `1791768250074` (21:24:10 ET).
- The history file is `spmt-2027-om-20261012-012410.json`, holding REMOTE at `1791771848015`.
- The per-step dump is `node dump.cjs ./out/cur-S1harness.json`.

**Steps before the landing:**
- **Before the save:** screen WORKING/$700; DIRTY false (this session); `_baseDirty` true; record `{dirty:true, folder:{om|2027: REMOTE ts}}`; kept slot empty.
- **Held:**
  - `_saveBusy` 1, and the head is still REMOTE.
  - History holds REMOTE: the save kept it before writing.
  - `MS.ts` is the save's build time, an hour earlier than REMOTE ts.
- **The refresh (returned true):**
  - Screen REMOTE/$650 and `MS.ts` = REMOTE ts.
  - Record `{dirty:false, folder: REMOTE ts}`; `_baseDirty` false; `_saveGen` unchanged (0).
  - Kept slot: WORKING/$700 (why `folder`, base `{dirty:true, folder: REMOTE ts}`).
  - Status: "⬇ Loaded O&M FY27 from the shared folder — saved by Brad just now. This browser held work no saved copy had; it is kept aside: put it back …"
  - Folder writes during the refresh: none.

**After the landing:**
- **Screen:** REMOTE/$650, `MS.ts` = REMOTE ts, by Brad.
- **DIRTY:** false.
- **`_baseDirty`:** false.
- **Record:** `{file:1791768246712, dirty:false, folder:{om|2027:1791768250074}}`, the save's written ts. `driveBaseOf('om')` = `1791768250074`.
- **Browser storage:** REMOTE/$650.
- **Kept slot:** WORKING/$700.
- **Status:** "✅ Saved O&M FY27 to the shared folder — 5 KB. Everyone sees it on their next refresh."
- **Header:** "Saved 2:24 AM · ↶ work kept aside" (UTC clock). This is the only visible sign; it does not say that the screen differs from the folder copy.
- **Folder head:** WORKING/$700, ts = the save's written ts, by Brad, writer Brad.
- **Folder history:** one file, holding REMOTE/$650 at REMOTE ts.
- **Folder writes after the hold:** Brad's lock heartbeat only.

**Afterwards:**
- **Later refresh:** returned false and changed nothing. The status still reads "✅ Saved …".
- **Reopen and refresh:** `driveAutoConnect()` returned true and the refresh returned false. The result is the same: screen REMOTE/$650, recorded clean against the WORKING/$700 head, and nothing is said about the folder.
  - The status shows only the board-file line "Opened with this browser's copy of the board — it has changes made after this file was last saved …".
  - That line is about the HTML file F1, not the folder copy.

**Where each content lives now:**
| content | folder head | folder history | reopened screen | its storage | its kept slot |
|---|---|---|---|---|---|
| REMOTE/$650 | no | yes (REMOTE ts) | yes (recorded saved, base = WORKING's ts) | yes | no |
| WORKING/$700 | yes | no | no | no | yes |

**S1tick, S1perm, S1open and S1pen end the same way**, with the same content in every place (`whereNow` in each log).
- S1pen's head writer is Brad, and its status adds "You now hold the pen for it."
- S1perm's permission mock went from `prompt` (1 query at the opening, no request) to `granted` (1 request, made by the Save).

**S1auto (the opening's own connect):**
- The reopen's `driveAutoConnect()` returned true and **adopted REMOTE itself**: screen REMOTE/$650, record `{dirty:false, folder: REMOTE ts}`, kept slot WORKING/$700, status "⬇ Loaded … kept aside: put it back".
- The held save then wrote **REMOTE's content** (head REMOTE/$650 at the save's ts), and the refresh during the hold re-adopted the identical REMOTE.
- The board lands recorded clean against a REMOTE-content head. That is consistent, so K1–K3 PASS.
- WORKING survives only in the kept slot; it is not in the folder.

## Prerequisites (stated exactly) and whether a concurrent writer is needed
- **P1. A future-dated folder copy.** The folder head's `store.ts` must be greater than the `MS.ts` the held save stamps when it builds its bytes (`MS.ts=Date.now()`, L26813 cur / L26601 main). The pull then compares `theirs` with that `ours` (L26692–26694 / L26483–26485) and treats the pre-existing head as newer.
  - Here the head was one hour ahead of Brad's clock. REMOTE's writing board's clock was +3,600,000 ms; the measured margins are under "The fixture".
  - **Ca** (REMOTE at real time, 1.8–2.3 s before the save's build): nothing is adopted and the contract holds.
  - With a skew of X, the condition holds only while the save is built less than X (real time) after that copy was written.
- **P2. Brad's record names that copy as base.** This follows from adopting it. Without it, the save's clash check (L26798 / L26586) refuses before writing.
- **P3. The save is permitted.** One of the following:
  - The copy carries Brad's own writer key, which is per browser storage, so in practice it was saved from this same browser profile with its clock fast.
  - Or Brad takes the pen from its writer (**S1pen**: REMOTE written by Bob, one confirm).
  - Or the copy has no writer (not run).
  - **Codex's fixture writer is not known to me.**
- **P4. DIRTY is false during the save while the screen differs from the head.** That is, unsaved work carried into a new session (a reopen; record dirty true, DIRTY false).
  - **Cb** (same session, DIRTY true): the refresh refuses ("Nothing was replaced"), the save lands WORKING = head, and the contract holds.
  - A save with nothing unsaved writes REMOTE's own content, so a re-adoption of REMOTE leaves a consistent record. That case was not run separately; S1auto lands in exactly that state.
- **P5. The reopen's own folder pull has not run before the save.**
  - **S1auto** shows that if it runs first, it adopts REMOTE itself and sets WORKING aside, and U13 does not arise.
  - **By code:** the edit's `MS.ts` (L6772) precedes the save's (L26813). So whenever P1 holds for the save, REMOTE ts also exceeds the edit's ts, and an opening pull that runs first always adopts.
  - **Routes reproduced where it had not run:**
    - the harness connect: S1harness, S1tick, S1pen, Ca and Cc (a state-level stand-in);
    - **edit permission not kept** across the reopen: S1perm. The board's own comment says a page load starts with no folder access, and the permission "may or may not be" kept;
    - **the save already writing when the opening connect reads:** S1open.
- **P6. A refresh lands inside the save's write window.** The window runs after the save's read and build (L26786–26815) and before its folder write closes. Four refreshes reproduced it:
  - `driveStorePull(true)`;
  - `liveTick()`;
  - the bar's Connect, `driveConnectNow()`;
  - the opening's `driveAutoConnect()`.
  The hold makes the window deterministic. In the product it lasts as long as the folder write takes.
- **No concurrent writer is needed.** Nobody else wrote the folder at any point after REMOTE.
  - The folder write log during the hold shows only Brad's history copy and main write. The refresh wrote nothing. Afterwards only Brad's lock heartbeat was written.
  - REMOTE's board was disconnected before Brad's board opened.
  - In S1pen, Bob wrote REMOTE *before* Brad opened and never again.

## Comparison with the earlier concurrent-writer reproduction (`rec/L2/u13probe`, S1 and the verifier's V2reopen)
| | u13probe S1 (V2reopen) | this probe, S1harness (and S1tick/S1perm/S1open/S1pen) |
|---|---|---|
| who changed the folder head during Brad's save | Bob, take-the-pen save | **nobody** |
| copy adopted mid-save | Bob's new copy, newer by the clock | the **pre-existing** REMOTE, "newer" only because its ts is an hour ahead |
| DIRTY / record dirty during the save | false / false (V2: false / true) | false / true (reopen) |
| set aside at adoption | nothing (V2: BRAD-R) | WORKING/$700 |
| end state | screen BOB-2/$650 recorded clean against BRAD-1/$700 | screen REMOTE/$650 recorded clean against WORKING/$700 |
| later refresh / reopen | silent / silent | silent / silent |
| adopted content still in the folder | no: Bob's copy overwritten, kept nowhere in the folder | yes: REMOTE in history (the save kept it before writing) |
| code path | L26744–26746 adopt; L26843–26849 record clean | identical |
| boards | current only | current **and** main f9b4413: identical observed values |

**What this changes.** "Needs another writer" is not a prerequisite of U13; P1 and P5 are the alternatives that stand in for it. The earlier ledger wording ("narrow window / needs another writer") was already withdrawn at `d0eb705`. This comparison supports that withdrawal.

## Controls
| control | expected | observed | result |
|---|---|---|---|
| Ca: REMOTE not ahead, written at real time, earlier than the save's build | the refresh during the hold adopts nothing: `[false,"working",true,null]`. Lands as today: WORKING on screen and in the head, clean, base = head ts, "✅ Saved", no "not in the folder yet". K1–K3 and reach PASS | identical | PASS (both boards) |
| Cb: no reopen (DIRTY true this session) | the refresh refuses: `[false,"working",true,"Nothing was replaced" said]`. The save lands as today; K1–K3 and reach PASS | identical | PASS (both boards) |
| Cc: no held save | the refresh adopts REMOTE as today and keeps WORKING aside: `[true,"REMOTE",650,base=REMOTE ts,false,false,"WORKING",700,"kept aside" said]`. K1–K3 and reach PASS | identical | PASS (both boards) |

## Sensitivity variant (not a fix proposal; nothing built in any tree)
`var-refuse-busy` is the current board with one line changed:
- **L26667:** `if(!driveStoreOn()) return false;` becomes `if(!driveStoreOn() || _saveBusy) return false;`.
- **Board blob:** `26eea611`. This is the same blob as the earlier verifier's `m-fix-refuse-busy`, and the line the ledger proposes. Brad has not selected a U13 fix.
- **Why it was run:** to show that the contract checks pass on a board that keeps a consistent record, and are not blind.

Results (all 9 scenarios, final probe, 21:25:48–21:26:44 ET):
- **S1harness, S1tick, S1perm, S1open and S1pen:**
  - K1, K2, K3 and reach **PASS**, with `["WORKING",700,true,"WORKING",700]`.
  - The `adopt` (mechanism) check **FAILS** as it should: the refresh is refused silently and the screen stays WORKING.
- **S1auto:** the same as the unmodified board (`premise` FAIL, contract PASS). The opening's pull is not during a save.
- **Ca and Cc:** PASS.
- **Cb:** `Cb.pull` FAILS on its message element only. Observed `[false,"working",true,false]`: the refusal now returns before the DIRTY message is set, so nothing is said, and the stale "⬇ Loaded …" line stays. Nothing was replaced, and K1–K3 PASS. So Cb is sensitive to that ordering.

## Related observations (not U13; clock-skew behaviour of the same comparison; recorded, not judged)
- **S1auto.** With REMOTE future-dated and also the record's base (`theirs === base`), the reopened board's own connect **sets the unsaved WORKING aside and loads REMOTE**. It says "saved by Brad just now", although REMOTE is the copy the work came from. The cause is that the pull compares `theirs` with the screen's `MS.ts` (L26692–26694), not with the base. Nothing is lost (kept slot).
- **Cb.** In the same session, with DIRTY true, the refresh warns "⚠ Brad saved O&M to the shared folder just now, and you have unsaved changes. Nothing was replaced." That is about the same base copy.
- **`liveAge`.** It prints "just now" for a future ts (L27767–27770).
- **Next steps not run (code reading only).** Brad's next 💾 Save from the U13 end state:
  - The head ts equals the record's base, and the writer is 'me'.
  - So it would write REMOTE/$650 over WORKING/$700 with no question, keeping WORKING in history.
  - "Put it back" would restore WORKING with base = REMOTE ts, so the next Save would then meet the clash message.

## Caveats: shortcuts and what was not run
- **The folder connection is state assignment.** W1H `connect()` sets `_liveCfg={store:true, mode:'drive', on:false}` and `_driveDir`, with no picker and no IndexedDB. This applies to every board.
  - Where a scenario says the opening's connect runs, the product's `driveAutoConnect()` is called explicitly after it. The boot's own 60 ms opening timer finds the folder store off and does nothing.
  - **In S1harness, S1tick, S1pen, Ca and Cc, the reopen deliberately does not run the opening's connect.** That is a state-level shortcut standing in for "the opening's pull did not run first". S1perm and S1open are the product-path routes to that condition.
- **I did not have Codex's U13 fixture.** It is not among the received probes; `races-probe.mjs` holds R3–R5 only. Its exact steps, writer and connect are not known to me. The shape here follows Brad's description, and Codex's `connect()` style (assignment, no pull).
- **S1perm's permission is a mock.** `queryPermission` answers `'prompt'` until `requestPermission`, then `'granted'`. jsdom has no user activation, so the Save click's gesture is assumed. `_liveCfg.folder='shared'` was assigned: it is the folder name the original pick stores, and `driveConnectNow` needs it.
- **REMOTE's fast clock.** Only `Date.now` in that board's window was replaced. `new Date()` with no argument was not shifted; it was not used for any value checked here, since REMOTE was the folder's first copy and no history name was made on that board.
- **`wire()`.** It writes `prio27who` and `prio27writerKey`, and replaces `confirm` (answered OK) and `alert`.
  - Questions asked during the held save: 0 in every scenario, except S1pen's single take-the-pen confirm.
  - No `confirm` lies on the defect path.
- **Edits** go through `setNote` and `setAlloc`, not DOM events.
- **The hold** is the mock's gate on the close of the main write.
- **The Live timer was not running** (Live off). S1tick calls `liveTick()` directly. `↻ Refresh now` (`livePoll(false)`) was not run here; the earlier verifier ran it in the concurrent case (V5now).
- **jsdom gaps.** jsdom has no `navigator.locks` and no IndexedDB.
- **Clocks shown.** The header and the board-file status show UTC (the process clock), for example "1:19:27 AM". All other times in this README are ET.
- **The first tab's storage is not counted.** The first tab (board A) keeps its own jsdom storage; in a real browser, the reopened board replaces that tab. It is not counted as reachable.
- **Scope.** Only U13 was covered. The other items in the relayed request were not addressed here: UI chunk 1 and 2, U2's commits, U14, the queue, presweep and gate. No fix was made, and nothing was committed.

## Superseded runs (kept, not reported as results)
- **Probe v1 `46084be6`** (`superseded/u13codex-probe.v1.mjs`): 7 cur runs, 21:17:41–21:18:24 ET, logs and out in `superseded/`.
  - `S1tick.adopt` expected `liveTick()` to return true. It returns nothing (`await livePoll(true)` without a return, L26367), so the check was a harness error. The observed adoption was the same.
  - Fixed by comparing to the literal `'(liveTick returns nothing)'`.
- **Probe v2 `cc35f586`** (`superseded/u13codex-probe.v2-cc35f586.mjs`): 24 runs (cur, main and var × 8), 21:19:20–21:22:38 ET, in `superseded/v2/`.
  - These were superseded only because S1pen was added (v3 `1d10ccdb`).
  - For every v2 scenario, every check's id, observed value and result is identical in the v3 runs (compared programmatically).
- **`logs/runs.txt`** lists all 58 runs in order. A separator line marks where the superseded runs end.

## Files
- `u13codex-probe.mjs` (built from `src/head.mjs`, `w1h-block.txt` and `src/body.mjs`), `run.sh`, `dump.cjs`.
- `cur/`, `main/` and `var-refuse-busy/` (with `var-refuse-busy.diff`): the board copies.
- `out/<board>-<scenario>.json` (27), `logs/<board>-<scenario>.log` (27), `logs/runs.txt`, `pids.txt`.
- `superseded/`.
