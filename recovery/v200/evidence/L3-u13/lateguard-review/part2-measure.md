
## 2. Measured

### 2.1 How
Harness `h/lateguard.mjs` (blob `064ddd22…`; extras `h/lateguard-x.mjs`, `c52dbcfe…`, then `f66282d9…` once the WS mode
was added). It boots each board exactly as the suites do (the copy's `runtime-encoding-shim.mjs`, then its
`tools/export-audit/boot.mjs`; `BOARD` set only for a variant) and builds the U13 block's fixture **through the product**:
F1 = W1H `baseFile('Brad',…)`; REMOTE ($650) saved by Brad's other machine whose `Date.now` runs one hour ahead; REMOTE0
the same at real time; Brad's opening loads it, he types WORKING ($700) and closes unsaved (browser storage `LS_M` —
base = REMOTE's time — and `LS_C` — base = REMOTE0's). `LS_Cn` is `LS_C` with the folder base record emptied.

The folder mock is the W1H one (copied) with every mutation logged by path (`create:`, `write:`, `remove:`, `mkdir:`),
a settable permission answer, and three gates: the save's or refresh's read of the copy (`getFileHandle`, a FIFO), the
first `queryPermission({mode:'read'})`, and (WS only) after the bytes are taken. In each page: `Storage.prototype`
`setItem/removeItem/clear` logged with the caller; a logging IndexedDB (jsdom has none) for `open`/database creation/
`put`/`delete`/`get`; and the board's writers wrapped (their global bindings): `driveBaseSet baseSet persist applyStore
applyState keepAside save lsSet lsAll persistExdb persistRp snapKeep snapPrune fileMark keptPutBack driveWrite` (plus
`driveHeartbeat driveClashSay driveStorePush saveSerial`, logged but not counted as writers), each call with `_saveBusy`
at that moment.

**Snapshot, byte for byte, before and after each call** (then compared field by field): `JSON.stringify(MS)`,
`JSON.stringify(S)`, `DATA.items`, `DIRTY`, `_baseDirty`, `_saveGen`, `_dlOnly`, `LASTKNOWN`, `_sideGen`, `_keptMeta`,
`_driveBase`, `baseGet()` (the stored record), `WRITER`, `EXDB`, `ACEDB`, `RPDB`, `CYCVIEW`, **every localStorage key**
(so `prio27om`, `prio27om.base`, `prio27om.kept` and the rest), **every file and directory in the folder**; and, listed
(allowed if they change): status text, `_statN`, `DIAG.log` length, `LIVEDB`, `_drivePerm`, `_drivePermProbed`,
`_driveNeed`, `_driveLive`, `_driveDir` (which handle), `_liveCfg`, `liveTimer`, `_autoBusy`, `_saveBusy`, the header's
save-state text. A cell is **clean** when no protected field changed AND no storage write was made (even a same-value
one), no folder write except the lock file, no IndexedDB put/delete, and no wrapped writer was called.

**Branches** (the refresh's every return before or at the guard; how each is reached):

| id | branch (line) | fixture |
|---|---|---|
| B01 | `driveDir` fails, permission (26678) | `LS_M`, folder REMOTE; then `queryPermission` → `'denied'` (`requestPermission` still grants) |
| B01b | `driveDir` fails, no handle (26678) | `_driveDir=null`, IndexedDB empty |
| B02 | read throws (26686) | the copy's `getFile` throws once (`NotReadableError`, "the folder is syncing") |
| B02b | read refused at the door (26686, `LIVEDB.err` in `driveStoreRead`) | REMOTE with a top-level `toString` key |
| B02c | not a saved board (26686) | `{"v":1,"ts":1,"by":"x"}` |
| B03 | nothing in the folder (26692) | the copy removed |
| B04 | written by a newer board (26695) | REMOTE with `v:2` |
| B05 | not newer, base equal (26702, nothing) | `LS_C`, folder REMOTE0 |
| B06 | not newer, **no base** (26709, the guarded `driveBaseSet`) | `LS_Cn`; folder REMOTE0 (H1: empty when the save reads, REMOTE0 put in once it is held) |
| B07 | not newer, clash (26710) | `LS_C`; folder: REMOTE0 re-stamped +1 ms, by Bob |
| B08 | DIRTY (26713) | `LS_M`, `setNote('A','TYPED')` this session |
| B09 | no requirement data (26727) | REMOTE without `store.dataPack` (same time) |
| B10 | **the late guard** (26741) | `LS_M`, folder REMOTE (stamped ahead: newer than the save's own copy) |

**Calls:** p1 `driveStorePull(true)`, p0 `driveStorePull(false)`, cn `driveConnectNow()`, ac `driveAutoConnect()`, tk
`liveTick()` with Live view on (`on`, `auto`, `_driveLive` true, as working out of the folder sets them); tkx the tick
with `auto` off (B08 only: with `auto` on, a DIRTY tick queues its own autosave and waits for it).

**Timing modes:** N no save. H1 💾 Save (`saveInPlace`) held at the close of its write of the copy (it has read the
folder, kept history, built its bytes, set `MS.ts`). H2 the save held at its read of the copy. WR the refresh starts with
no save under way and is held at its read; a save starts and is held (at its write, or at its read where the save would
otherwise be refused at once: B06, B07); the refresh is let go. WA the same with the refresh held at its first wait (the
first `queryPermission({mode:'read'})`). In every non-N cell the harness checked: the save was held, `_saveBusy` was 1 at
the hold and at both ends of the measured window, and (W) `_saveBusy` was 0 when the call started; then the save was
released and its landing recorded. All 1,324 cells of all 16 runs passed those checks (`h/heldcheck.py`); none threw.

### 2.2 Results on after/ `a88a1e5b` (runs A1, A2; every cell, all 5 calls)

Legend: return value T/F, u = `liveTick` (returns nothing), pend = still waiting (its queued autosave) when measured.
**ok** = clean. Letters = listed (non-copy) changes: **S** status line / `_statN` / `DIAG.log`; **L** `LIVEDB` (`err`,
or the tick's rebuild); **K** the lock file `spmt-2027-om.lock.json` written (heartbeat); **P** `_drivePerm` /
`_drivePermProbed`; **D** `_driveNeed` / `_driveLive`; **I** IndexedDB `prio-fh` database created by `open` (no data);
**Q** a browser permission prompt (`requestPermission`); **A** an autosave queued behind the save (`driveStorePush` →
`saveSerial`, "⏳ A save is already under way…", `_autoBusy`); **V** the header's "Saved h:mm" redrawn by `render`
(it shows the `MS.ts` the save in flight had already set).

#### H1 — the save held at the close of its write (132 cells with tk/tkx; all clean)

| branch | p1 | p0 | cn | ac | tk | tkx |
|---|---|---|---|---|---|---|
| B01-dirfail-perm | F · ok LV | F · ok LSV | T · ok DLQSV | F · ok DP | u · ok LV | — |
| B01b-dirfail-nohandle | F · ok ILV | F · ok ILSV | F · ok ISV | F · ok DI | u · ok ILV | — |
| B02-read-throws | F · ok LV | F · ok LSV | T · ok DLSV | T · ok DLPSV | u · ok KLV | — |
| B02b-read-refused | F · ok LV | F · ok LSV | T · ok DLSV | T · ok DLPSV | u · ok KLV | — |
| B02c-not-a-board | F · ok LV | F · ok LSV | T · ok DLSV | T · ok DLPSV | u · ok KLV | — |
| B03-nothing | F · ok . | F · ok S | T · ok DSV | T · ok DPSV | u · ok KLV | — |
| B04-toonew | F · ok LSV | F · ok LSV | T · ok DLSV | T · ok DLPSV | u · ok KLSV | — |
| B05-notnewer-base | F · ok . | F · ok . | T · ok DSV | T · ok DPV | u · ok KLV | — |
| B06-notnewer-nobase | F · ok . | F · ok . | T · ok DSV | T · ok DPV | u · ok KLV | — |
| B07-notnewer-clash | F · ok SV | F · ok SV | T · ok DSV | T · ok DPSV | u · ok KLSV | — |
| B08-dirty | F · ok S | F · ok S | T · ok DS | T · ok DPS | pend · ok AS | u · ok KLS |
| B09-nopack | F · ok SV | F · ok SV | T · ok DSV | T · ok DPSV | u · ok KLSV | — |
| B10-lateguard | F · ok V | F · ok SV | T · ok DSV | T · ok DPSV | u · ok KLV | — |

#### H2 — the save held at its read (all clean)

| branch | p1 | p0 | cn | ac | tk | tkx |
|---|---|---|---|---|---|---|
| B01-dirfail-perm | F · ok L | F · ok LS | T · ok DLQS | F · ok DP | u · ok L | — |
| B01b-dirfail-nohandle | F · ok IL | F · ok ILS | F · ok IS | F · ok DI | u · ok IL | — |
| B02-read-throws | F · ok L | F · ok LS | T · ok DLS | T · ok DLPS | u · ok KL | — |
| B02b-read-refused | F · ok L | F · ok LS | T · ok DLS | T · ok DLPS | u · ok KL | — |
| B02c-not-a-board | F · ok L | F · ok LS | T · ok DLS | T · ok DLPS | u · ok KL | — |
| B03-nothing | F · ok . | F · ok S | T · ok DS | T · ok DPS | u · ok KL | — |
| B04-toonew | F · ok LS | F · ok LS | T · ok DLS | T · ok DLPS | u · ok KLS | — |
| B05-notnewer-base | F · ok . | F · ok . | T · ok DS | T · ok DP | u · ok KL | — |
| B06-notnewer-nobase | F · ok . | F · ok . | T · ok DS | T · ok DP | u · ok KL | — |
| B07-notnewer-clash | F · ok S | F · ok S | T · ok DS | T · ok DPS | u · ok KLS | — |
| B08-dirty | F · ok S | F · ok S | T · ok DS | T · ok DPS | pend · ok AS | u · ok KLS |
| B09-nopack | F · ok S | F · ok S | T · ok DS | T · ok DPS | u · ok KLS | — |
| B10-lateguard | F · ok . | F · ok S | T · ok DS | T · ok DPS | u · ok KL | — |

#### WR — the save starts while the refresh waits at its read (all clean)

| branch | p1 | p0 | cn | ac | tk | tkx |
|---|---|---|---|---|---|---|
| B02-read-throws | F · ok L | F · ok LS | T · ok DLS | T · ok DLS | u · ok L | — |
| B02b-read-refused | F · ok L | F · ok LS | T · ok DLS | T · ok DLS | u · ok L | — |
| B02c-not-a-board | F · ok L | F · ok LS | T · ok DLS | T · ok DLS | u · ok L | — |
| B03-nothing ¹ | F · ok L | F · ok LS | T · ok DLS | T · ok DLS | u · ok L | — |
| B04-toonew | F · ok LS | F · ok LS | T · ok DLS | T · ok DLS | u · ok LS | — |
| B05-notnewer-base | F · ok . | F · ok . | T · ok D | T · ok D | u · ok L | — |
| B06-notnewer-nobase | F · ok . | F · ok . | T · ok D | T · ok D | u · ok L | — |
| B07-notnewer-clash | F · ok S | F · ok S | T · ok DS | T · ok DS | u · ok LS | — |
| B08-dirty | F · ok S | F · ok S | T · ok DS | T · ok DS | — | u · ok LS |
| B09-nopack | F · ok SV | F · ok SV | T · ok DSV | T · ok DSV | u · ok LSV | — |
| B10-lateguard | F · ok V | F · ok SV | T · ok DSV | T · ok DSV | u · ok LV | — |

#### WA — the save starts while the refresh waits at its first permission ask (all clean)

| branch | p1 | p0 | cn | ac | tk | tkx |
|---|---|---|---|---|---|---|
| B02-read-throws | F · ok LV | F · ok LSV | T · ok DLSV | T · ok DLSV | u · ok KLV | — |
| B02b-read-refused | F · ok LV | F · ok LSV | T · ok DLSV | T · ok DLSV | u · ok KLV | — |
| B02c-not-a-board | F · ok LV | F · ok LSV | T · ok DLSV | T · ok DLSV | u · ok KLV | — |
| B03-nothing ¹ | F · ok LV | F · ok LSV | T · ok DLSV | T · ok DLSV | u · ok KLV | — |
| B04-toonew | F · ok LSV | F · ok LSV | T · ok DLSV | T · ok DLSV | u · ok KLSV | — |
| B05-notnewer-base | F · ok . | F · ok . | T · ok DV | T · ok DV | u · ok KLV | — |
| B06-notnewer-nobase | F · ok . | F · ok . | T · ok D | T · ok D | u · ok KL | — |
| B07-notnewer-clash | F · ok S | F · ok S | T · ok DS | T · ok DS | u · ok KLS | — |
| B08-dirty | F · ok S | F · ok S | T · ok DS | T · ok DS | — | u · ok KLS |
| B09-nopack | F · ok SV | F · ok SV | T · ok DSV | T · ok DSV | u · ok KLSV | — |
| B10-lateguard | F · ok V | F · ok SV | T · ok DSV | T · ok DSV | u · ok KLV | — |

¹ In WR/WA the save under way had already created the copy's file empty (`getFileHandle(…,{create:true})`, its bytes
held at close), so the refresh read an empty file: the B02 return ("Unexpected end of JSON input"), not `!j`. `!j` itself
is covered in H1/H2/N. The part of each W-mode call **before** its wait (no save under way yet) is tabled separately in
`out/tables-all.txt` (Connect's "⏳ Asking…" and `_drivePerm`; the tick's heartbeat) and is identical on before/.
B01/B01b have no W rows: they return at the first wait.

**Extra conditions on after/** (run X1–X3, same instruments):
- **X1, 📡 Live view panel open** (`liveOpen=true`, `_drivePermProbed=false`, so `render` draws `liveBody`: `whoAmI`,
  `driveProbePerm`; checked by `h/lp-sanity.mjs`: the panel draws 5,852 characters and probes once). p1/p0/tk × all
  branches × N/H1/H2: **78/78 cells with a save under way clean**.
- **X2, Live view on for the Connects** (they then call `liveStart()`: a 30 s timer and an un-awaited `liveTick`, whose
  own pull runs during the save): cn/ac × all branches × N/H1: **26/26 with a save clean** (K, T, L listed). On before/
  the same tick's pull adopted REMOTE in the B02, B06 and B10 rows (6 cells).
- **X3, no folder name stored** (`_liveCfg.folder=''`, the picker stubbed to hand back the folder): Connect calls
  `drivePick` and **returns without calling the pull**. During a save it wrote `localStorage['spmtLive']` (the Live view
  settings, via `lsSet`; not a board key: `DIRTY`/`_saveGen` unchanged) and IndexedDB `put prio-fh/h/spmt-live-dir` (the
  folder handle). Not a copy, a base record or a dirty flag, and not a step before the pull's guard; listed.

### 2.3 What changes before the guard while a save is under way (the complete list measured)
In `driveStorePull`: `LIVEDB.err` (B01, B02, B02b, B02c, B04; `LIVEDB` is rebuilt by `livePoll` after a tick anyway —
the builder's N3); the status line, `_statN` and `DIAG.log` (Connects in every branch; quiet refreshes too in B04, B07,
B08, B09 — `setStat` there ignores `quiet`); `render()` (DOM only); the IndexedDB database `prio-fh` created empty when
there is no handle (B01b, no data). In the callers, before they reach the pull: the tick's **heartbeat writes the lock
file** (K; the save writes the same file with the same holder when it lands); the tick with unsaved work **queues an
autosave** behind the save and waits for it (A; its pull then runs after both saves); Connect/AutoConnect set
`_drivePerm`, `_drivePermProbed`, `_driveNeed`, `_driveLive`, and Connect may ask the browser for permission (Q). After the
pull returns (outside the property): `driveExecPull`/`driveAcePull`/`driveRpPull` (no such files in these folders: no
effect), `_driveLive=true`, `liveStart()` when Live view is on. None of these is a copy, storage holding the board, a
base record or a dirty flag; all are identical on before/ (section 3).
