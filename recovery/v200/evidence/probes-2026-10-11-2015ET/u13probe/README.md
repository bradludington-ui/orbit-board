# U13 probe: a folder pull during a held folder save (read-only reproduction, no fix)

Run Sunday 11 Oct 2026, 20:26:28 to 20:27:24 ET. There were five bounded runs, one at a time. All exited 0 and none timed out.

The defect is reproduced on the current board. The refresh runs while Brad's save is held at its write, and it adopts Bob's newer copy. When the save lands, the board records itself as clean. Its recorded base is the copy Brad wrote (BRAD-1, $700). The screen and browser storage hold Bob's copy (BOB-2, $650). A later refresh says nothing, and so does a reopen. All three controls behave as they do today.

## Boards and identities
| what | path | blob |
|---|---|---|
| board run (the only one) | `board/prioritization-board-grid.html`, a cp -r of `rec/L2/u1fix/before` (head 4a6f7c7) | `4d273c0680132caafc4cbc8ca09c1533735c86de` |
| its boot.mjs | `board/tools/export-audit/boot.mjs` | `9c4f49ad8cec537097bdf485458cfd2a09b06594` |
| its runtime-encoding-shim.mjs | `board/runtime-encoding-shim.mjs` | `6e2ce2e6beda9e7526527530500f254d877d0320` |
| probe | `u13-probe.mjs` | `a957682e9279509904cd9d14079cd7f81da1c9e1` |
| W1H helpers copied verbatim from | `/home/user/orbit-board/tools/export-audit/audit-import.mjs` lines 3745-3813 | `fc3117a075176879bedaab66a586b2c7a23be498` |

- BOARD was unset before boot.mjs was imported, and the probe asserts that it resolves to `board/prioritization-board-grid.html`.
- The shim is imported first.
- `node_modules` is the symlink that the copy already carries.
- The `after` board (`b4c55e38`) was not run. That follows "no variant boards", and its only change (flowYears) is not on this path.
- `u1fix/before` and `u1fix/after` still hash to `4d273c06` and `b4c55e38`. Nothing was written in `/home/user/orbit-board`.

## How to run
```
run.sh <label> -- node u13-probe.mjs board out/<label>.json <S1pull|S1tick|C1|C2|C3>
```
- `run.sh` wraps each run as `setsid -w timeout -k 10 600 ...`.
- The timeout PID and its node child, with the command, go to `pids.txt`.
- The full output goes to `logs/<label>.log`, and one line per run goes to `logs/runs.txt`.
- The observed values for every step are in `out/<label>.json`.

## Fixture (literal, written by hand in the probe)
- **Board file F1 (W1H `baseFile('Brad', …)`):**
  - Services: USAF/ANG/AFRC.
  - Requirement A: ask 900/200/100. Requirement B: ask 400/100/50.
  - Writer: Brad. FY27.
- **Brad's content:** requirement A's note is `BRAD-1` and its allocation total is **$700**. Brad saves it once with 💾 Save (`saveInPlace()`). That creates the folder's first copy (v1), and Brad becomes its writer. The held save has nothing unsaved, so it writes the same content again with a new ts.
- **Bob's content:** note `BOB-2`, allocation **$650**.
  - Bob's board opens F1, connects to the same folder and loads v1 (`driveStorePull(false)`).
  - He edits A with `setNote` and `setAlloc`, then takes the pen (`takePen()`, confirm answered OK), which saves at once.
- **C2 only:** Brad's unsaved note `BRAD-UNSAVED`. The allocation stays at $700.

## Precondition (stated plainly)
S1 needs a second writer whose save lands between Brad's save reading the folder and Brad's write landing.

- **Without a second writer, S1 cannot happen.** During Brad's save, the folder holds his own earlier copy, which is not newer, so the pull adopts nothing (shown in C3).
- **Bob needs the pen.** Brad holds it, so a plain Save by Bob is refused (`writerMay`, L2119). The product lets Bob take the pen with ✍ Take the pen… (L26932) after one confirm. That confirm warns: "If it has not [been handed over], this is cooperative only: while two people can both write the file, two Saves can still overwrite each other." Nothing the product refuses was needed.
- **Brad's board is not told.** Brad's held save had already passed its writer check (`'me'`) before Bob took the pen.
- **Brad's write erases Bob's pen.** When Brad's write lands, the folder head's writer is Brad again.
- **The refresh does not check for a running save.** `driveStorePull` never checks `_saveBusy`; it was 1 during the pull.

## Mechanism (verified on this board; line numbers checked)
1. **The pull adopts and moves no save generation.** `driveStorePull` adopts at L26744-26746 (`applyStore`; `driveBaseSet(mySlug(), theirs, true)`; `persist()`; `render()`). It moves no `_saveGen`: observed 2 before and 2 after the pull.
   - Its guards are `DIRTY` (L26703) and `ownUnsaved` / `keepAside` (L26726-26729).
   - It is called from `drivePoll` (L26577) through `livePoll` and `liveTick` (L26367), and from the connect paths (L12768, L12797).
2. **The save records clean against the copy it wrote.**
   - `_driveStorePushRun` captures `gen=_saveGen` when it builds its bytes (L26815).
   - After the write it computes `clean=(_saveGen===gen)` (L26843) and calls `driveBaseSet(ap, wroteTs, clean, fy)` (L26844).
   - It then calls `persist()` and, because clean is true, sets `DIRTY=false` (L26849).

## Steps of S1 (two runs: S1pull refreshes with `driveStorePull(true)`; S1tick with `liveTick()`, which is `livePoll(true)` → `drivePoll(true)` → `driveStorePull(true)`)
1. Brad has saved once and is clean. He presses 💾 Save (`saveInPlace()`) with nothing unsaved.
   - The save is held at the close of its write of `spmt-2027-om.json` (mock `fold.hold.main`).
   - By then it has read the folder, kept v1 in `history/` and built its bytes.
2. Bob's save lands in the folder as the current copy (BOB-2/$650, by Bob, writer Bob, ts later than Brad's built ts).
3. Brad's refresh runs.
4. The write is released and everything settles.
5. A later refresh runs.
6. Reopen: a fresh board boots from F1 with Brad's localStorage and connects to the same folder (the opening's `driveAutoConnect()`). A refresh follows.
7. Bob's board refreshes.

## Observed timestamps (S1pull), used as identities only (read from the folder bytes)
- v1, Brad's first copy: `1791764812017` (20:26:52.017 ET).
- The copy Brad's held save wrote: `1791764812787` (20:26:52.787 ET).
- Bob's copy: `1791764813051` (20:26:53.051 ET).
- S1tick has the same shape, with different times.

## Checks: expected vs observed
The contract, stated literally: **"a copy adopted during a save is never recorded as saved with a base it did not come from."**

| check | kind | expected | observed (S1pull, and S1tick identical) | result |
|---|---|---|---|---|
| fixture.v1 | fixture | folder copy v1 = brad's content, by Brad, writer Brad | brad, Brad, Brad | PASS |
| fixture.bradClean | fixture | screen brad; DIRTY false; _baseDirty false; record dirty false; base = v1 ts | as expected | PASS |
| fixture.bobBase | fixture | bob loaded v1; his base = v1 ts | as expected | PASS |
| S1.held | fixture | save reached its write and is held; DIRTY false; record dirty false; `_saveBusy` 1; folder still v1 | [true,false,false,1,true] | PASS |
| S1.bob.bobCopy | fixture | folder head = BOB-2/$650 by Bob, writer Bob; bob clean | as expected | PASS |
| S1.bobNewer | fixture | bob's ts > the MS.ts Brad's save built | true | PASS |
| S1.adopt | mechanism | refresh during the save (`_saveBusy` 1) adopts bob: screen bob, base = bob ts, `_saveGen` unchanged, nothing kept aside | [1,"bob",true,true,null] | PASS (the mechanism as described) |
| **S1.K1** | **contract** | if recorded clean, the copy its base names holds the content on screen: [clean, screen, base-copy content, base = bob ts] = [true,"bob","bob",true] | **[true,"bob","brad",false]** | **FAIL** |
| **S1.K1-literal** | **contract** | screen BOB-2/$650 must not be recorded clean against a copy holding BRAD-1/$700: [BOB-2, 650, true, BOB-2, 650] | **[BOB-2, 650, true, BRAD-1, 700]** | **FAIL** |
| S1.store | record | browser storage = screen content | bob (BOB-2/$650, ts = bob's) | PASS |
| S1.head | record | folder head after the save lands = Brad's built bytes: BRAD-1/$700, by Brad, writer Brad | as expected | PASS |
| **S1.K2** | **contract** | after a later refresh: screen = head, or board unclean, or it says the copies differ | **screen BOB-2/$650, head BRAD-1/$700, clean, nothing said** (pull returned false; status still "✅ Saved O&M FY27 to the shared folder — 5 KB. Everyone sees it on their next refresh.") | **FAIL** |
| **S1.K3** | **contract** | after reopen + connect + refresh: the same | **screen BOB-2/$650, head BRAD-1/$700, clean (DIRTY false, record dirty false, base = Brad's written ts), nothing said about the folder** | **FAIL** |
| S1.bobKeptInFolder | related, not U13 | bob's copy is in the folder, head or history | false | FAIL (the documented concurrent-writer race; see below) |

### State of Brad's board after the save lands (S1pull)
- **Screen:** note BOB-2, allocation $650, MS.ts = bob's, MS.by = Bob. The DOM holds "BOB-2" and not "BRAD-1".
- **DIRTY:** false.
- **`_baseDirty`:** false.
- **`baseGet()`:** `{file:1791764811119, dirty:false, folder:{"om|2027":1791764812787}}`. That is Brad's written ts, not Bob's.
- **`driveBaseOf('om')`:** 1791764812787.
- **Kept-aside slot:** empty. The pull found `ownUnsaved` false (record dirty false), so it kept nothing aside.
- **Status line:** "✅ Saved O&M FY27 to the shared folder — 5 KB. Everyone sees it on their next refresh."
- **Folder head:** BRAD-1/$700, ts 1791764812787, by Brad, writer Brad.
- **Folder history:** only `spmt-2027-om-20261012-002652.json` (v1, BRAD-1/$700).
  - While the save was held, Bob's save had kept a `-recent` copy of v1.
  - Brad's `snapPrune` removed it when his write landed.
  - Bob's own copy was never kept in history.

### Later refresh, reopen and Bob's board
- **Later refresh:** returned false and changed nothing.
- **Reopen:** `driveAutoConnect()` returned true; the refresh returned false. The status says only "Opened with this browser’s copy of the board — it has changes made after this file was last saved (… by unknown). 💾 Save writes them into the file." That line is about the HTML board file F1, not the folder copy.
- **Bob's board:** its refresh said "⛔ Brad saved O&M FY27 to the shared folder just now, after the copy you are working from. …". Bob is told; Brad is not.

### Where every copy now lives (both S1 runs)
| content | Brad screen | Brad browser storage | Brad kept slot | folder head | folder history | Bob screen | Bob storage |
|---|---|---|---|---|---|---|---|
| Bob's (BOB-2/$650) | yes (recorded saved, base = Brad's copy) | yes | no | **no** | **no** | yes | yes |
| Brad's (BRAD-1/$700) | no | no | no | yes (ts = Brad's written) | yes (v1) | no | no |

## Controls
| control | expected | observed | result |
|---|---|---|---|
| C1: no save running | refresh adopts bob as today: [returned true, screen BOB-2, $650, base = bob ts, DIRTY false, record dirty false, kept slot null] | identical | PASS |
| C2: unsaved edit on screen | refresh refuses and replaces nothing: [false, BRAD-UNSAVED, $700, DIRTY true, record dirty true, base = v1 ts, head bob's, says "Nothing was replaced"] | identical | PASS |
| C3: save held and released, no newer copy (a refresh run during the hold) | [reached true, refresh false, screen BRAD-1/$700, head BRAD-1/$700 by Brad, base = head ts, head ts ≠ v1 ts, DIRTY false, _baseDirty false, record dirty false, "✅ Saved"] | identical | PASS |

## Caveats
**Where the harness sets state directly rather than going through the product path (as the audit suite does):**
- The folder connection is set directly. `connect()` sets `_liveCfg={store:true, mode:'drive', on:false}` and `_driveDir` to the mock directory handle, with no picker and no IndexedDB. The reopen sets them the same way, then runs the product's own `driveAutoConnect()`.
- `wire()` writes `prio27who` and `prio27writerKey` and replaces confirm (OK) and alert.
- F1 is built by W1H `baseFile` (`seed()` plus `save()`, `WRITER` set, then `buildSavedHtml()`).
- Edits go through `setNote` and `setAlloc`, not through DOM events.
- The hold is the mock's gate on the close of the main write.

**The refresh is called directly.** It is not run by the timer, because Live is off in this setup, so the timer does not run. `↻ Refresh now` (`livePoll(false)`) was not run; inside, it calls the same `drivePoll` → `driveStorePull(true)`.

**jsdom has no `navigator.locks`.** `saveSerial` uses its in-page chain. Bob is a separate browser, so Web Locks would not serialize him anyway.

**The header clock is UTC.** The header shows the process's UTC time ("Saved 12:26 AM" = 20:26 ET). All other times in this report are ET.

**S1.bobKeptInFolder is a separate finding.** Bob's copy is gone from the folder because Brad's write had already started before Bob's landed. That is the file share's lack of an atomic compare-and-write, the race the takePen confirm and the writer comment (L2095-2098) warn of. It is not counted as U13. It does compound U13: afterwards, Bob's content survives only on Brad's screen and in his storage (recorded as saved against Brad's copy), and on Bob's own board.

**Not run (code reading only):**
- Brad's next 💾 Save would find the head ts equal to his base and the head writer equal to himself ('me'). It would then write BOB-2/$650 under Brad's name with no question, keeping BRAD-1/$700 in history.
- Bob's next save would be refused, because the head writer is Brad again and the head is not Bob's base.

**Scope.** This run covers U13 only. The other items in the relayed request were not part of this task and were not addressed here: U1's $300/$100/$400 demonstration, U2's counter and busy-save, the interrupted/completed preservation, reuse identities, and the 8:14 imminent-change timing. No fix was made, and no presweep, gate, mutate or full suite was run.
