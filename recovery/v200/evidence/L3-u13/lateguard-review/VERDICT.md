# U13 late guard — independent adversarial check of one property

**Property (Brad, 12 Oct 2026, 7:0x AM ET):** "U13: the late guard is the essential protection. Its reviewer should verify
that earlier steps do not change copies, storage, base records or dirty flags before that guard."

**Board checked:** `after/prioritization-board-grid.html` blob `a88a1e5b932b94225a29cdcfec0678f828847ddd` (copied from
`rec/L3/u13/after/` at 07:06 ET), against `before/` `1375b72b6707faa57c50d528e01ce9611f194998`. Work done 07:05–07:57 ET,
Monday 12 Oct 2026 (times from `TZ=America/New_York date`). **Note:** at 07:32 ET the builder's `rec/L3/u13/after/` board
changed to `98eed7e8…` (a "fix round"): only the guard's own message (and a `const lbl=…` inside the guard block); the
statements before the guard are byte-identical. The after/ matrix was re-run on that revision: same result (section 5).

## Verdict: **holds with listed non-copy side effects**

With a save under way (`_saveBusy` = 1, measured in every cell), nothing that runs before the late guard — in
`driveStorePull` or in the four callers' own steps on the way to it — changed MS, S, DIRTY, `_baseDirty`, `_saveGen`,
`_driveBase`, the stored base record, the kept slot, any other browser-storage key, the folder's copy or its history, or
made an IndexedDB put/delete: **346 of 346** measured cells with a save under way on `a88a1e5b` were clean (byte-for-byte
snapshots, plus logs of every storage write, folder mutation, IndexedDB operation and call to the board's own writers).
The only exception measured is not on the path to the guard: a Connect with no folder name stored opens the folder picker
and never calls the pull (X3, below). What does change before the guard is listed in section 2.3; none of it is a copy, a
storage key holding the board, a base record or a dirty flag. The base-record write that the not-newer branch makes is
itself guarded (`if(!_saveBusy)`) in the same synchronous segment, and it is the only protected write before the guard.

Controls: with no save under way the after/ board behaves exactly as before/ in every cell (66/66, plus 39/39 with the
📡 panel open and 26/26 with Live view on). With a save under way, after/ and before/ differ in exactly the two guarded
places — the not-newer/no-base row (base record) and the adoption row — and nowhere else, in every timing mode. A mutant
that moves the late guard to the very top lets the adoption through (MS, S, `.kept`, `.base`, `prio27om`,
`_baseDirty`) whenever the save starts during the refresh's own wait (9 cells), and the save then lands recording the
board saved against its own copy while the screen shows the loaded one — U13's shape. **Not refuted.** On the
builder's revision `98eed7e8` the same matrix gives 242/242 clean with a save under way (section 5).

Outside the property (no save is under way at the guard), one boundary is worth knowing: a save that starts **and
lands** while the refresh's read is already in flight lets the refresh adopt the copy it read before that save wrote —
screen and record on the older-but-ahead-stamped copy, the folder holding the save’s copy; by code, the next refresh says
"⛔ … after the copy you are working from". Identical on before/; section 4.

## 1. Every statement before the late guard, and every write it can make (code reading, after/ `a88a1e5b`)

`driveStorePull(quiet)` is lines 26674–26746 of `after/prioritization-board-grid.html`. It has exactly **two** `await`s
(L26677 `driveDir(false,'read')`, L26685 `driveStoreRead(...)`). Everything from the second one's resumption to the
guard at L26741, and from the guard to `ownUnsaved`/`keepAside`/`applyStore`/`driveBaseSet`/`persist` (L26749–26769), is
synchronous, so `_saveBusy` read at L26709 and at L26741 is the value at the moment of the change it guards. (`grep await`
on the function: 2 hits.)

Column "during a save": can this write happen while `_saveBusy>0`, before the guard returns?

| line | statement | what it calls (transitively) | writes | during a save? |
|---|---|---|---|---|
| 26675 | `if(!driveStoreOn()) return false;` | `liveCfg()`: reads `localStorage['spmtLive']` once and caches it in `_liveCfg` | memory cache `_liveCfg` only (when null) | yes; not a copy/storage/base/dirty write |
| 26677 | `dir=await driveDir(false,'read')` | `_driveDir.queryPermission({mode:'read'})`; if not granted: `driveGet()` → `driveIdb()` → `indexedDB.open('prio-fh',1)` (+ `onupgradeneeded` `createObjectStore('h')` when the database does not exist) → `get('spmt-live-dir')`; `h.queryPermission`; `ask` is false so no `requestPermission`; `note()` writes `_drivePerm` only for mode `'readwrite'` (not here) | `_driveDir=h` (memory handle). IndexedDB: an `open` that **creates the empty `prio-fh` database and its store** if absent; no `put`/`delete` | yes (only with `_driveDir` null or not granted). The IndexedDB effect is schema creation, no data; it is the same database the board's file-handle code (`_fhGet`/`_fhPut`) opens |
| 26679–26682 | catch: `LIVEDB.err=…; if(!quiet) setStat(…); render(); return false;` | `setStat`: `_statN++`, `diagNote` (DIAG.log, memory), DOM (`#shareStat`, `#statWrap`, `#saveState.title`), `statSync` (DOM). `render()`: see below | `LIVEDB.err`, `_statN`, `DIAG.log`, DOM | yes — listed non-copy effects |
| 26685 | `j=await driveStoreRead(dir, mySlug())` | `driveRead` → `dir.getFileHandle(name)` (**no** `create`) → `getFile().text()`; `driveParse` → `inboundCheck` (pure: `inWalk`, `inShapeWhy`, `JSON.parse`; `extractPacks` only for HTML text) → `JSON.parse` | `LIVEDB.err` when the copy is refused at the door; nothing else | yes (`LIVEDB.err`) |
| 26687–26690 | catch: `LIVEDB.err=…; if(!quiet) setStat(…); render(); return false;` | as above | `LIVEDB.err`, `_statN`, DIAG, DOM | yes, listed |
| 26692–26694 | `if(!j){ if(!quiet) setStat(…); return false; }` | `setStat`, `esc`, `APPN_LBL` | `_statN`, DOM (no `render`) | yes, listed |
| 26695–26699 | `if(liveTooNew(j)){ LIVEDB.err=…; setStat(liveTooNewMsg(…)); render(); return false; }` | `liveTooNew`, `liveTooNewMsg` (pure, `esc`, `BUILD`) | `LIVEDB.err`, `_statN` (**even when quiet**), DIAG, DOM | yes, listed |
| 26700–26701 | `theirs`, `ours`, `base=driveBaseOf(mySlug())` | `driveBaseOf` → `driveBaseKey` (reads `_driveBase`, `MS.cur`) | none | — |
| 26709 | `if(!base){ if(!_saveBusy) driveBaseSet(mySlug(), theirs); }` | `driveBaseSet` → `_driveBase[key]=…` + `baseSet` → `localStorage.setItem(_AP.key+'.base', …)` | **the base record** (memory and storage) | **no** — guarded by `_saveBusy` in the same synchronous segment. Without a save it writes, as before U13 |
| 26710 | `else if(theirs!==base){ driveClashSay(j, false); render(); }` | `driveClashSay` → `setStat` only | `_statN` (even when quiet), DIAG, DOM | yes, listed |
| 26713–26720 | `if(DIRTY){ setStat(…); render(); return false; }` | `setStat`, `liveAge`, `esc` | `_statN` (even when quiet), DIAG, DOM | yes, listed |
| 26727–26733 | `if(!_hasPack(j.store)){ setStat(…); render(); return false; }` | `_hasPack`/`_hasData` (pure const arrows) | `_statN` (even when quiet), DIAG, DOM | yes, listed |
| 26741–26746 | **the guard** `if(_saveBusy){ if(!quiet) setStat(…); render(); return false; }` | `setStat`, `render` | `_statN` (Connects only), DOM | yes, listed |

**`render()`** (called in six of the refusal returns before the guard -- not in the `!j` one -- and by the guard itself). By a static scan of the program
(`h/reach.py`: every `function` declaration, calls outside string literals, so `onclick` strings are not edges; it does
not see `const` arrow functions) 681 functions are reachable from `render`, 25 with a write-shaped statement. Read one by
one, each is one of: a closure that runs only on a click (`matBulk`'s setters, false edges); a local `bump` inside
`forecast` (false edge); `recomputeBuys(false)` from `applyState` (no save); or a **one-time migration / first-use
initialization** keyed on state the pull's earlier steps never set: `BANDS_LIST` → `bandsSyncStandard` (only when
`MS.stdVer<STD_VER`; then `MS.stdVer=…` and possibly `save()`), `rpBody` → `rpMigrate` (only until `MS.rpMigrated`),
`syncBtns` → `flowEnts` → `destMigrate` (only until `MS.flow` is stamped against `DESTDB.ents`), `syncBtns` →
`writerIsMe` → `writerKey` (only when no `prio27writerKey` is stored), `liveBody` (only with the 📡 panel open) →
`whoAmI` (prompts only with no stored name, writes only on the person's answer) and `driveProbePerm` (once; memory
`_drivePerm`; IndexedDB read when `_driveDir` is null), `aceBody` → `aceWithYear` (swaps `S`/`MS.cur` and restores them;
only with the estimate panel on another year). Each of these is already done by the render that followed the last change
to MS (boot, every edit, every load); the pull's earlier steps change nothing they key on, and the save in flight changes
only `MS.ts`, `MS.by`, `MS.dataPack` and, when it takes the pen, one `MS.jrnl` entry (none of them). Measured: `render()` in every refusal cell below wrote nothing (no
storage write, MS/S byte-identical), including with the 📡 panel open (run X1). These render paths are the same on
before/ (U13 does not touch render).

**`setStat` when quiet**: the liveTooNew, clash, DIRTY and no-requirement-data returns call `setStat` even on a quiet
(Live timer) refresh. During an **autosave** that a tick started, a second refresh reaching one of them moves `_statN`,
so that tick will not put "Saved automatically" over it (R08 rule). A message effect, not a write; unchanged by U13.

**The callers' own steps before the pull reaches its guard** (they are "earlier steps" of the refresh, outside
`driveStorePull`):
- `liveTick()` → (if `driveStoreOn && auto && _driveLive && DIRTY && !_autoBusy`) `driveStorePush(true)` → `saveSerial`
  (queued behind the save under way: says "⏳ A save is already under way…", `_autoBusy=true`, and the tick **waits** for
  it, so its pull runs only after both saves) → `livePoll(true)` → `drivePoll(true)` → `driveDir(false,'read')` →
  `driveClaimIfViewing` → **`driveHeartbeat` writes the lock file `spmt-<fy>-<ap>.lock.json`** (when `liveCfg().on`) →
  `driveStorePull(true)`. After the pull: `driveExecPull`/`driveRpPull`, the folder walk (`LIVEDB.locks`), then
  `livePoll` rebuilds `LIVEDB` (`ts`, `last`, `peers`, `err:''`).
- `driveConnectNow()`: `if(!liveCfg().folder) return await drivePick();` (the picker: `drivePut` = IndexedDB **put** of
  the handle and `liveSaveCfg` = `localStorage['spmtLive']`; it never reaches the pull) → `setStat('⏳ Asking…')` →
  `driveDir(true)` (may `requestPermission` = a browser prompt on a click; `_drivePerm`, `_driveDir`) → on failure
  `driveDir(true,'read')` → `_driveNeed=''` → the pull. After it: `driveExecPull`, `driveAcePull`, `driveRpPull`,
  `_driveLive=true`, `liveStart()` if Live view is on (a timer and an un-awaited `liveTick`), `driveBar`, `render`.
- `driveAutoConnect()`: `driveStoreOn` check (`_driveNeed`, `_driveLive`, `driveBar`) → `_driveDir||await driveGet()`
  (IndexedDB) → `queryPermission({mode:'readwrite'})` → `_drivePerm`, `_drivePermProbed`; not granted → `_driveNeed='click';
  _driveLive=false` and **return without pulling** → `_driveDir=h; _driveNeed=''` → the pull → the same tail as Connect.

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

## 3. Controls

### 3.1 No save under way: after/ behaves exactly as before/
`h/compare.py` compares each cell's normalized observation — returned value, change code, every protected and listed
field that changed, storage keys written, folder writes, lock writes, IndexedDB operations, board writers called, the
status text (digits and "N min ago" masked; a history copy's name and the header's "Saved h:mm" carry the clock and are
masked) and the landing.

| comparison | identical | differ |
|---|---|---|
| N, all branches × p1 p0 cn ac tk tkx (A1 vs B1) | **66** | 0 |
| N with the 📡 panel open, p1 p0 tk (X1) | **39** | 0 |
| N with Live view on, cn ac (X2) | **26** | 0 |
| WF / WS boundary cells (X4, X5; no save under way at the guard) | **8** | 0 |
| W modes, the call's part before its wait (no save yet), every cell's observation | same as below | landing only |

With no save, the expected writes happen on both boards alike: B06 records the base (`_driveBase`, `prio27om.base`);
B10 adopts REMOTE (`keepAside`, `applyStore`, `driveBaseSet(…, true)`, `persist`: MS, S, `.kept`, `.base`, `prio27om`,
`prio27bands_om` removed, `_baseDirty`); B08's tick (auto on) runs its own autosave (writes the copy and history).

### 3.2 A save under way: after/ and before/ differ in exactly the two guarded places

| mode | identical | differ | the differing cells |
|---|---|---|---|
| H1 (A1 vs B1) | 56 | 10 | B06 × 5 calls, B10 × 5 calls |
| H2 | 56 | 10 | B06 × 5, B10 × 5 |
| WR (A2 vs B2) | 45 | 10 | B06 × 5, B10 × 5 |
| WA | 45 | 10 | B06 × 5, B10 × 5 |
| H1/H2 with the 📡 panel open (X1) | 33 + 33 | 6 + 6 | B06 × 3, B10 × 3 each |
| H1 with Live view on (X2) | 20 | 6 | B02, B06, B10 × cn, ac (on before/: B06/B10 the Connect's own pull wrote; B02 its read failed and the un-awaited tick `liveStart` fired then adopted REMOTE) |

On before/ (`1375b72b`) those cells wrote **during the save**: B06 → `driveBaseSet` (`_driveBase`, `prio27om.base`); B10 →
`keepAside`, `applyStore`, `applyState`, `driveBaseSet`, `baseSet`, `persist` (MS, S, `_baseDirty`, `_keptMeta`,
`.kept`, `.base`, `prio27om`). Landing on before/: B10 — screen REMOTE, the folder's copy WORKING, all three dirty flags
clear and the record naming the folder's copy (U13's false-clean shape), WORKING in the kept slot; B06 held at the
save's read (H2/WR/WA) — the save then found the copy recorded and wrote WORKING over REMOTE without asking. On after/
the same cells change nothing and land as: B10 WORKING saved against its own copy; B06 at the read — "⛔ … Nothing was
written", WORKING unsaved (the (3c) behaviour).

### 3.3 Mutants: the guard moved to the very top
Text-only variants of after/ (`h/mkmut.py`, `mut/`):
- **M1** `00deacda…` — the late `if(_saveBusy){…}` block **moved** to right after `if(!driveStoreOn()) return false;`;
  the not-newer branch's `if(!_saveBusy)` kept.
- **M2** `31ffb6ea…` — entry only: the same, and the not-newer branch back to `if(!base) driveBaseSet(mySlug(), theirs);`.

| run | cells | writes during a save |
|---|---|---|
| M1, H1 + H2 (the save already under way when the refresh starts) | 132 | **none** — the entry check catches it |
| M1, WR (the save starts while the refresh waits at its read) | 55 | **B10 × p1 p0 cn ac tk**: `keepAside`, `applyStore`, `applyState`, `driveBaseSet`, `baseSet`, `persist` → MS, S, `_baseDirty`, `_keptMeta`, `prio27om`, `prio27om.base`, `prio27om.kept`, `prio27bands_om` |
| M1, WA (… at its first permission ask) | 55 | **B10 × p1 p0 cn ac** (tk: its first ask is `drivePoll`'s, before the pull's entry, so the entry check sees the save) |
| M2, WR | 55 | B10 × 5 as M1, **and B06 × 5**: `driveBaseSet` → `_driveBase`, `prio27om.base` |
| M2, WA | 55 | B10 × 4, B06 × 4 (not tk, as above) |

Landing (M1 WR B10 p1, `out/M1-top-W.jsonl`): screen REMOTE $650, the folder's copy WORKING $700, `DIRTY`/`_baseDirty`/
record all clean, the record naming the folder's copy, WORKING in the kept slot — the board says saved while it shows a
copy the folder does not hold. M2 WR B06: the save then wrote WORKING over REMOTE without asking ("✅ Saved"). After/
in the same cells: no write, correct landing. So the late position is what protects, for both guards.

## 4. Boundaries and observations (not refutations; for the record)
1. **A save that starts and finishes inside the refresh's wait is not "under way" at the guard** (by design: the guard
   reads `_saveBusy` at that instant). Measured both ways, identical on before/ and after/:
   - WF (X4) — held before the read: the refresh then reads the save's own copy; B10 loads nothing; B06 records the
     copy's time as the base with no save under way (as designed).
   - **WS (X5) — the read already in flight, its bytes taken before the save wrote:** B10 then **adopts the stale
     REMOTE** at the guard (`_saveBusy` 0): screen REMOTE, recorded against REMOTE's time, all flags clean; the folder
     holds the save's WORKING. Nothing is lost (WORKING is the folder's copy), and by code the next refresh finds the
     folder's copy (≤ what is on screen, ≠ the record) and says "⛔ … after the copy you are working from", and Save is refused with the choice
     — but until then a quiet refresh leaves "✅ Saved" on the line while REMOTE is on screen (a Connect says "⬇ Loaded"). Requires a read slower than a whole save. Pre-existing
     and outside this property; flagged for whoever owns U16/U17.
2. **Cross-tab saves (U20):** with Web Locks a save waiting for another tab's lock is not counted in `_saveBusy`; jsdom
   has no `navigator.locks`, so not measured. Such a save has not read or built anything yet.
3. **Quiet refreshes still speak** in the liveTooNew, clash, DIRTY and no-requirement-data returns (`setStat` without
   `if(!quiet)`), moving `_statN`; during an autosave started by a tick this keeps "Saved automatically" off (R08 rule).
   A message effect, unchanged by U13.
4. **`render()` is not write-free in principle** (section 1: one-time migrations and first-use keys reachable from it),
   but nothing the refresh does before its guard can trigger them; measured nil in every cell, panel open or not.
5. **The tick's heartbeat writes the lock file during a save** (K), before its pull — the same holder the save writes
   when it lands; not a copy. Pre-existing.
6. **Connect with no folder name** writes the Live view settings and the IndexedDB folder handle during a save, and never
   reaches the pull (X3). Choosing a folder; not a copy, base record or dirty flag.

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

## 6. Runs
All node runs bounded (`setsid -w timeout -k 10 600`), the AUDIT_IMPORT_RUNNING lock checked first (it was never
present), one at a time, PIDs in `pids.txt`; none timed out, none skipped; all exited 0.

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
