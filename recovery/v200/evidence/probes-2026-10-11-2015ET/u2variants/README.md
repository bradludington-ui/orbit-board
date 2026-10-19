# U2: the counter repair and the busy-save refusal, tested separately

These are draft checks on disposable board copies, run Sunday 11 Oct 2026 between 20:35 and 20:37 ET. Nothing in `/home/user/orbit-board` was edited, staged, committed or pushed. `u1fix/before` and `u1fix/after` were only read and copied; their blobs are still `4d273c06…` and `b4c55e38…`. The `after` (U1) board was not used.

## The finding

`keptPutBack()` puts kept work back on screen and marks it unsaved. It does not move `_saveGen`. A save already writing when that happens compares its saved `gen` with `_saveGen`, finds them equal, and marks the board clean:

- folder save: `_driveStorePushRun` around L26843–26846
- file save: `_saveInPlaceFileRun` around L8387–8388

## Boards

Each board is a `cp -r` of `u1fix/before`. Only `prioritization-board-grid.html` was replaced; `node_modules` is still the symlink.

| variant | edit | find count | board blob |
|---|---|---|---|
| BASE | none | – | `4d273c0680132caafc4cbc8ca09c1533735c86de` |
| U2a COUNTER | `  persist(); DIRTY=true; render();` becomes `  persist(); _saveGen++; DIRTY=true; render();   // v2.00 (U2): …` | 1 | `5e43f9e8418f72acbc7fed15fca8d2ffd253bcc9` |
| U2b REFUSAL | after the first two lines of `keptPutBack` (anchored on `function keptPutBack(){\n  const k=keptCopy();\n  if(!k){…}\n`), insert `  if(_saveBusy){ setStat('⏳ A save is under way — …unchanged.'); render(); return; }   // v2.00 (U2)` | 1 | `4e303ff3abebe75d59031ae6ff817f496f6ca582` |
| U2ab (optional, both) | both edits | 1 + 1 | `5b7a863ee125f61016e0cffb973d6916d25dabac` |

- The diffs are in `diffs/U2a.diff`, `diffs/U2b.diff` and `diffs/U2ab.diff`. Each is one line, or one line per edit.
- The `if(!k)` line appears twice in the file; it is also in `keptSaveFile`. That is why the U2b edit is anchored on the function header.
- `mkvariants.mjs` builds the variants and fails unless every find count is 1. Its log is `logs/mkvariants.log`.

Tool identities, the same in every run:

| file | blob |
|---|---|
| `boot.mjs` (the copy's own) | `9c4f49ad8cec537097bdf485458cfd2a09b06594` |
| `runtime-encoding-shim.mjs` | `6e2ce2e6beda9e7526527530500f254d877d0320` |
| `u2probe.mjs` | `363beee755d233a1c35ce873bce168c0dda351c2` |
| `check.mjs` | `52522b105aeddb787ab252a3f15752ecbc5a2ad2` |

In each run, `BOARD` was unset and boot.mjs's `BOARD` was checked to be that copy's own board.

## Runs

Each run was bounded and the runs went one at a time: `run.sh` → `setsid -w timeout -k 10 600 node u2probe.mjs <board> <variant> <out>`. PIDs are in `pids.txt`, logs in `logs/<label>.log`, and exit codes and times in `logs/runs.txt`.

| run | exit | wall time |
|---|---|---|
| BASE-1 | 0 | 15.2 s (first pass, superseded) |
| BASE-2 | 0 | 16.8 s |
| U2a-2 | 0 | 12.8 s |
| U2b-2 | 0 | 13.6 s |
| U2ab-2 | 0 | 15.1 s |

None timed out. Results are in `out/<variant>-2.json`. The judged checks are in `out/checks.json` and `logs/check.log`, produced by `node check.mjs`, which runs no board code.

## Fixture

The fixture is synthetic: the note on requirement A tells the copies apart. The expected values are literals written by hand in `check.mjs`.

| note | what it is |
|---|---|
| `F0-BASE` | the first folder copy Alice saved |
| `K-KEPTWORK` | K: Alice's unsaved work, displaced by a newer copy |
| `N-NEWER` | the newer copy, saved from Alice's other browser |
| `S1-ONSCREEN` | S1: the unsaved work on screen when its save starts |

**R-folder.** K is put aside through product paths, not by calling `keepAside` directly:

1. Alice saves F0.
2. She types K and leaves it unsaved.
3. Her other browser pulls, types N, and saves to the folder.
4. Alice presses 💾 Save (`saveInPlace`). It is refused: "saved … after the copy you are working from. Nothing was written."
5. She chooses **Load theirs** (`driveResolve('theirs')`). K is kept with `why:'folder'`, and the kept slot records K's own checkpoint (`folder om|2027 = t0`, `file = F1`).
6. N is loaded, and Alice types S1.
7. The folder save of S1 (`driveStorePush(false)`) is held at the close of its write. `keptPutBack()` runs there with confirm = OK, then the save is released.

**R-file.** K is kept by the opening's own keep-aside:

1. Alice types K in this browser and leaves it unsaved.
2. Her other browser saves N into the board file.
3. Alice reopens the file. The opening keeps K with `why:'file'` and checkpoint `file = F1`, and opens N.
4. She types S1. The board-file save (`saveInPlaceFile`, using a file-handle mock) is held at its write, and `keptPutBack()` runs there.

## Results: expected vs observed

`[D,b,r]` means `[DIRTY, _baseDirty, baseGet().dirty]`. Results are the same for the folder and the file unless a row says otherwise.

### BASE (should reproduce the defect)

| check | expected | observed | result |
|---|---|---|---|
| during the held save | put-back happens (S1→K, 1 confirm); `_saveGen` does not move | S1→K, 1 confirm, gen 3→3 (file 2→2) | as expected |
| D1: after the save lands | K on screen, `[false,false,false]` (marked saved), head S1, kept S1 | exactly that. Status "✅ Saved … to the shared folder" (file: "💾 Saved in place …"). Header "Saved 12:36 AM · ↶ work kept aside" | defect reproduced |
| D2: reopen | K in no copy the person can reach | Folder: screen/browser/kept/folder all S1, history [F0, N], K in nothing. File: screen/kept/file S1; K's bytes remain only in the raw `prio27om` storage key, offered nowhere, and gone after one ordinary edit | defect reproduced |

### U2a (counter)

| check | expected | observed | result |
|---|---|---|---|
| during the held save | put-back happens; gen +1 | S1→K, gen 3→4 (file 2→3) | pass |
| A2: after the save lands | K on screen, `[true,true,true]`, head S1, kept S1; status says the change is "not in the folder/file yet" | exactly that. Header "Unsaved changes · ↶ work kept aside" | pass |
| A3: reopen | K on screen or kept, recorded unsaved | K stays on screen and the record is dirty. The newer copy (S1) is refused because the kept slot already holds S1: "⚠ Alice saved a newer copy … newer copy was not loaded and nothing was lost". Header reads "Saved …" (see notes) | pass |
| A4: next Save | writes K | head becomes K | pass |
| ASK: does that Save ask before writing over the copy? | yes, as the put-back's own status promises ("💾 Save will ask before it writes over …") | **no** (no confirm, no clash) | **fails the promise** |

Why U2a breaks the promise: the save that lands records its own copy as the checkpoint, unconditionally. In the folder, `driveBaseSet(ap, wroteTs, …)` overwrites K's restored base (t0 → S1's write time). In the file, `LASTKNOWN=wrote` (F1 → S1's file time). The next Save then sees no clash.

Where S1 survives after U2a's unasked Save:
- folder: the folder history and the kept slot
- file: the kept slot only (the mock has no Teams version history)

### U2b (refusal)

| check | expected | observed | result |
|---|---|---|---|
| B1: during the held save | refused: screen still S1, no confirm, kept slot byte-identical, MS JSON byte-identical, status says so | screen S1, 0 confirms, kept identical (sha1 unchanged), MS identical, status is exactly the inserted text | pass |
| B2: after the save lands | S1 on screen, `[false,false,false]`, head S1, kept K byte-identical to before the refused call | exactly that | pass |
| B3: reopen | K kept, S1 on screen and in the folder/file | kept K, screen S1, head S1 (survives one edit too) | pass |
| B4: retry after landing | 1 confirm, K on screen, `[true,true,true]` | confirm: "…still in the shared folder it came from, and 💾 Save will ask before writing over that."; K on screen; `[true,true,true]`; kept slot emptied | pass |
| B5 and ASK: then Save | asks, then K is written | Folder: refused with choices ("⛔ … Nothing was written. Load theirs · Save yours over theirs"); "Save yours over theirs" asked one confirm; head K. File: "⚠ HOLD ON — Alice saved this file …" confirm; OK; file holds K | pass |
| B6: reopen after that Save | K on screen and in the folder/file | yes | pass |

### U2ab (both edits)

Every check gives the same result as U2b: 24 of 24 pass. The refusal fires first, so the counter changes nothing observable in these scenarios.

### No-race control

With no save running (`_saveBusy=0`), a put-back gives the same result on all four boards, for the folder and for the file. Compared fields: screen, `DIRTY`, `_baseDirty`, record, checkpoint, kept slot after the swap (note, why, by, ts, base), status, confirm text and header.

Timestamps are rendered symbolically before comparing. The normalized sha1s are:
- folder: `ed833515…` on all four boards
- file: `b02a0431…` on all four boards

Result: K on screen; `[true,true,true]`; checkpoint restored to K's own (folder `t0`, or file `F1`); S1 kept with `why:'swap'`; status "↶ Put back … 💾 Save will ask before it writes over …"; header "Unsaved changes · ↶ work kept aside".

### Totals

| board | pass | fail |
|---|---|---|
| BASE | 16 | 2 |
| U2a | 20 | 2 |
| U2b | 24 | 0 |
| U2ab | 24 | 0 |

The four failures are all the ASK check (folder and file, on BASE and U2a). On BASE, "pass" means the defect reproduced as expected.

## Caveats and other observations

- **jsdom and mocks.** The folder and the file handle are in-memory mocks taken from audit-import's W1H helpers. The "reopen" is a fresh jsdom board booted from this browser's localStorage and the same F1 file or folder. For the folder, the refresh is an explicit `driveStorePull(false)`; for the file, the opening's own boot logic decides. Times inside the board are UTC; jsdom has no TZ.
- **U2b's refusal message does not stay on screen.** Once the save lands, its "✅ Saved …" status replaces the refusal. Afterwards only the header ("↶ work kept aside") reminds the person to put the work back.
- **The retry can overwrite S1 in the file.** In U2b's retry, S1 is already saved, so the put-back does not keep it. The file Save's HOLD ON confirm then writes K over S1, and S1 is left in no copy within the mock; the product's prompt points to Teams version history, which is outside the mock. In the folder, S1 is kept in history (it appears twice: once from the forced keep of "Save yours over theirs" and once from the save's own keep).
- **The header on reopen uses only `DIRTY`.** `DIRTY` lasts only for the session, so after U2a's reopen the header says "Saved …" while the record says unsaved and the status warns. This is how every reopen behaves, not something U2 introduced.
- **Not tested: a save waiting for a Web Lock from another tab.** Such a save does not count in `_saveBusy` until it starts.
- **Scope.** Each variant was run once (BASE twice; BASE-1 used an earlier probe revision, blob `3191bb66…` per `logs/BASE-1.log`, without the per-scenario timestamps and the edit after reopen; its observed values matched BASE-2). No full suite, gate or mutate run was made.
