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
