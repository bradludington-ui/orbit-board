# v2.14: the contract between the four builders (items 140, 141, 129, 124; ledger U63, U64, U35)

Brad's go: *"Let's push all of these"*, then *"Three versions, data loss first"* and *"Accept all recommendations"* (3 Nov
2026). v2.14 is the data-loss version. The decided requirements are `NEXT-VERSION.md` › Open › "Brad's go of 3 Nov 2026",
items 140, 141, 129 and 124, and the ledger's rows U63, U64 and U35 (`recovery/v200/UNRESOLVED-LEDGER.md`); the handoff's
decisions 11–15 and 21 (`recovery/v213/HANDOFF.md` §8), which Brad accepted. Read them whole first.

The code map every builder starts from is `recovery/v214/map.md` (four read-only mappers, 3 Nov, on `c863dc2`): line numbers
there are as of `c863dc2`, so find code by symbol. **This file decides.** Where the map and this file differ, this file wins;
§4 lists every place (C1–C16 from writing it, C17–C30 from its review, §13). Where this file says **Decided in the contract**,
the choice is reversible by Brad and the ship notes say so. Where a builder decides something this file leaves open, report it in
the notes under **Decided in the build**.

Base: the slot commit (§2; the commit that adds this file to the branch). Branches `v214-w1` … `v214-w4`, each from it, each in
its own worktree. Nobody bumps `BUILD`, edits `package.json`, pushes, merges, or touches another workstream's functions or slots.
Integration is the lead's (§11). Nothing is built in the board until the lead has approved this file.

## 0. Brad's decisions this contract keeps

- **Data loss and math are the can't-fails.** No figure may move: `tiers()`, every export and every printed figure are
  untouched; the file route is proved equal to the storage route on every appropriation (W2).
- **One self-contained file, file://, no dependencies, no network.** Nothing here adds a request, a library or a second file.
- **Every storage write that carries work goes through `lsSet` / `lsAll`, so refusals are counted.** The named exceptions are in
  §9 (persist's own write, a probe, removals).
- **A PMO copy and a locked view refuse writes as today.** Every new writer starts with the same refusals.
- **Scope, v2.14:** item 140 (a, b, c), item 141 (the file route as the main path — Brad's 💾 Save writes into the file on his
  work computer — plus D, E, F, G), item 129's four findings, item 124's two, U63, U64, U35. **Not** item 129's "seal a copy's
  plan key per office file" (handoff decision 12: "Not now"). **Not** items 133 and 137–139 (later versions), 100 and 107
  (Azure, left until hosting is chosen), E1's hardening list ("Not needed this week").
- **Handoff decisions applied here:** 11 (build item 129's four), 13 (item 124 by id), 14 (U63/U64: keep work aside by U19's
  rule; U64 names where Save writes), 15 (U35: extend F2's hold), 21 (the ledger rows go to Brad as one grouped list, U19's
  one-slot trade-off among them: §12 Q4), 27 (the sweep's first batch of about 100, named: §11.8).
- **The older "your call" behaviours stay as built** (a kept PPBE cycle freezes its services; the ACE alignment breakout shows
  the allocation; the RCN-EEIC tab prorates a split prime's ask by the CLIN allocation; FYDP Disconnects prints —).
- **The sweep runs only on Brad's named go**; `mutate.mjs` is text only; never `npm run mutate` or `validate:math`.
- **The version merges on Brad's word.**

## 1. Who builds what

| | Scope | Slot (suites, `mutate.mjs`) | Mutation ids | Browser check it adds |
|---|---|---|---|---|
| **W1** | Save writes only to the file it was saved to, and asks before writing over what it does not carry: item 140 (a) and (b), the boot's record rules (case 3, the blank mark and the stray rule), item 141 D | `v2.14 W1` | `v214-w1-*` (33) | `tools/save-target.mjs` (`savetarget`) |
| **W2** | A full import too big for browser storage goes into a new file: item 141 A, B, C (the hand-over hold), E, the room check; the `.base` records an import writes | `v2.14 W2` | `v214-w2-*` (51) | `tools/import-file.mjs` (`fileimport`, `fileimport:gtk`) |
| **W3** | Browser storage refused or full: counted, nothing on screen lost unasked, and a refused import leaves the board as saved as it was: item 141 F and G, item 140 (c) | `v2.14 W3` | `v214-w3-*` (34) | `tools/storage-full.mjs` (`storagefull`) |
| **W4** | The held findings: item 129 (two tabs; the twin rule; the chain walk; the rolled added requirement), item 124 (Put back by id; "no SI code" in a copy), U63, U64, U35 | `v2.14 W4` | `v214-w4-*` (40) | `tools/keyboard-reach.mjs` section W |
| **INT** | The lead's integration checks (§11.3) | `v2.14 integration` | `v214-int-*` (1) | — |

Map areas: W1 reads `save-target`, W2 `file-route`, W3 `storage-full` (and save-target's (c)), W4 `held`.

Each builder writes `recovery/v214/notes-Wn.md` (What was built · Decided in the build · Checks — each new check "fails on the
slot commit", or labelled CONTROL; each existing check changed on purpose, with its `// v2.14 Wn:` comment · Mutations — new,
retargeted, retired, with their proofs · For the integration · npm script to add · Known gaps), and
`recovery/v214/proofs-Wn.json` and `proved-Wn.jsonl` (`git add -f`: `*.json` is ignored).

Every new suite block's name starts `v2.14 Wn — ` (the lead's: `v2.14 INT — `), so `slim.py` selects it and the self-check hears
it. The rest of each name is the map's. (audit-inject has no such self-check and slim.py cannot cut it; S8 gives it one.)

## 2. The slot commit: the seams the builders share (the lead builds it, inert, before any branch)

Four functions need lines from two workstreams, and four helpers are needed by two. Rather than let two branches edit one
function, the slot commit writes those lines once, inert, and each builder fills only a stub it owns. **No builder edits a seam
line**; a builder that finds one wrong says so in its notes and the lead changes it.

**A var's initializer runs where it stands.** A `var` the opening sets must be declared ABOVE the opening, and one a function
running at line N sets must be declared above line N: declared below, its `=false` / `=null` puts back the default after the
opening set it (found while prototyping S10's blank mark; it is also why S2's `_impHand` sits above `_impOpen`, §6).

**S1. `var _lsAllRun=0;`** beside `let _lsCapture=null;` (2964), with a comment: how many all-or-nothing writes (`lsAll`,
`lsPutBack`) are running; a var, because lsSet runs while the board opens. Inert while 0. W3 counts it; lsSet's warning and the
hold read it.

**S2. The hand-over hold** (W2 owns the bodies). Just above `function lsSet` (after `var _cycSwap=null;`):
```js
// v2.14 (slot; W2 owns both bodies): THE HAND-OVER HOLD. While an import's new file has not been opened in this browser, no write may
// put back a list the import cleared (item 141). Inert until W2 fills them. Neither may throw, and both may run while the board
// opens, before any let or const below them exists.
function impHandKey(key){ return false; }
function impHandRefuse(key, what){ return false; }
```
Three call sites:
- `lsSet`: after the `if(_lsCapture){…}` block, before `const fk=fileKeyOf(key);`:
  `  if(impHandKey(key)) return impHandRefuse(key, what);`
- `persist`: after `  MS.years[MS.cur]=S;` (NOT after the CYCVIEW line: `pmo-persist-blocked` and `view-persist-not-refused` find
  those two lines together): `  if(impHandKey(_AP.key)){ _persistFail=true; return impHandRefuse(_AP.key, 'Keeping changes in browser storage'); }`
  — a held edit is on screen only, so W3's `memOnlyNow` and its prompt cover it.
- The boot keep-aside write (7461) becomes
  `      if(own && _bootOwnRead){ try{ if(impHandKey(_AP.key)) throw new Error('held'); MS.years[MS.cur]=S; localStorage.setItem(_AP.key, JSON.stringify(MS)); held=true; }catch(e){ held=false; } }`.
  **Retarget `v209-rv2-save-boot-no-write` in place** (find: the new line; repl `      if(own && _bootOwnRead){ held=true; }`),
  proved against "v2.09 second review — a newer file, the older one" (audit-import). `v209-rv2-save-boot-writes-unread` and
  `v209-rv3-save-look-writes-storage` (find `      if(own && _bootOwnRead){ try{`) still match.

**S3. One way to reopen the page** (W3 adds the prompt that reads `_leaving`). After
`try{ window.addEventListener('beforeunload', liveLeaving); }catch(e){}` (15895):
```js
// v2.14 (slot): EVERY DELIBERATE REOPENING GOES THROUGH HERE, so a reopen the board has already asked about never meets the
// browser's own "Leave site?" question too (item 141 F). npm run check holds that it is the only one.
var _leaving=false;
function reopenPage(){ _leaving=true; try{ location.reload(); }catch(e){} }
```
The eight reloads become `reopenPage()`: 3204 (switchAppn), 11665 (consTakeApply), 12528 (fullImportText), 12900, 12931,
12941 (importState), 33030 (driveStorePull's shell branch), 36755 (clearComputer) — a `try{ location.reload(); }catch(e){}`
becomes `reopenPage();`. `tools/check.mjs` gains the rule **"reopen"**: in the program script `location.reload(` occurs exactly
once, inside `function reopenPage(` (fail: "a page reopen bypasses reopenPage() (it would not set _leaving): lines …"); no comment
may spell the call. No mutation find contains those eight lines (checked).

**S4. The on-screen-only guard at the import doors** (W3 owns the body). Beside `reopenPage`:
```js
// v2.14 (slot; W3 owns the body): may the page be reopened, or a whole board loaded over it, now? True when it stopped, having said
// why: while a change is on screen only (browser storage refused it), nothing reopens the page unasked (item 141 F).
function memOnlyBlock(head, act){ return false; }
```
Three guard lines:
- fullImportText, after `  if(pmoCopyRefuse(fname, txt)) return false;     // v2.09 …`:
  `  if(memOnlyBlock('Not imported', 'a full import reopens the page')) return false;`
- consTakePick, after `  if(pmoCopyRefuse(fname, txt)) return;          // v2.09 …`:
  `  if(memOnlyBlock('Not imported', 'taking an appropriation from a file reopens the page')) return;`
- importState, directly before `      if(!confirm('Import '+(fromBoard?`:
  `      if(memOnlyBlock('Not imported', 'loading this file reopens the page')){ inp.value=''; return; }`
(`v209-w3-door-full` and `v209-w3-door-cons` find the pmoCopyRefuse lines with their newline; an inserted line after them leaves
both matching.)

**S5. The writer key held in the page** (W3 sets it). Above `function writerKey(){` (2806):
```js
// v2.14 (slot; W3 sets it): the writer key this page made when browser storage would not keep it ('' while storage holds this
// browser's key). A var: writerKey can run while the board opens.
var _wkMem='';
// What a save that claims or takes the pen says when that key lives in this page alone (item 141 F). One sentence, two saves.
function wkMemSay(may){ return (_wkMem && (may==='claim'||may==='take'))? ' Browser storage would not keep this browser’s writer key: once this page is closed, 💾 Save here will refuse and name you as the writer — Audit › Take the pen… then takes it back.' : ''; }
```
In `_saveInPlaceFileRun`'s success `setStat`, the line
`      +(may==='claim'? ' You are now this board’s <b>writer</b>: only you save it in place.' : may==='take'? ' You now <b>hold the pen</b> for this board.' : '')`
gains `+wkMemSay(may)` at its end. W1 owns the function but not that line.

**S6. `pageAddr()`** beside `let FH=null;` (8220):
```js
// v2.14 (slot): this page's own address without its #… or ?…, for a file:, http: or https: page; '' for anything else (the FYDP
// frames' about:srcdoc, a blob:). W1 keys the remembered save file by it; W2 matches an import's file to the page that wrote it.
function pageAddr(){ try{ const u=String(location.href).replace(/[#?].*$/, ''); return /^(file|https?):/i.test(u)? u : ''; }catch(e){ return ''; } }
```

**S7. `boot.mjs`** (C30): `boot({…, url = 'https://example.invalid/board.html', idb = null, quota = undefined})`.
- `url` is passed to JSDOM as `url`. The default is today's.
- `idb: {store, log}` installs, in `beforeParse` (before the program runs, so the board's opening reads reach it), a stand-in for
  this browser's handle store: `window.indexedDB.open()` → a request whose `result` has `createObjectStore()` and
  `transaction()` → `objectStore()` with `get(k)`, `put(v, k)` and `delete(k)`, each pushed to `log` (`'get k'`, `'put k'`,
  `'delete k'`) and kept in `store` (a `Map` the caller shares between boots, as one browser does); every `onsuccess` and the
  transaction's `oncomplete` called by `setTimeout(0)` after its operation. It is audit-import's `i127idb` with `oncomplete`
  added, moved into boot.mjs; `i127idb` itself is left as it is.
- `quota` is passed to JSDOM as `storageQuota` (jsdom's default is 5,000,000 code units). Unset, nothing changes.
The defaults leave every boot as today's: `boot-same` holds it.

**S8. Slots.** In `audit-board.mjs`, `audit-import.mjs`, `audit-other.mjs`, `audit-recon.mjs` and `audit.mjs`, last, just before
the self-check block, five empty pairs:
`// ==== v2.14 W1 (item 140; item 141 D): Save writes only to its own file, and asks before writing over what it does not carry ====`
/ `// ==== end v2.14 W1 ====`; `// ==== v2.14 W2 (item 141): a full import too big for browser storage goes into a new file ====`;
`// ==== v2.14 W3 (item 141 F, G; item 140 c): browser storage refused or full ====`;
`// ==== v2.14 W4 (items 129, 124; ledger U63, U64, U35): the held findings ====`; `// ==== v2.14 integration (the lead) ====`,
each with its `end`. In `audit-inject.mjs`, before the W2 and integration pairs (which go before `// ---- report`):
`const INJ_EXPECT = [];   // v2.14 (slot): every block below names its finding here first, so a block that never runs fails`
and, after the pairs and before `// ---- report`:
`for (const id of INJ_EXPECT) if (!SEEN.has(id) && !FID.has(id)) failures.push({ finding: id, what: 'this block never ran — is it after the report, or in a .then the exit beat?', got: 'never ran', want: 'ran' });`
In `mutate.mjs`, the same five pairs (two-space indent) after `// ==== end v2.13 item 136 ====`, before `];`.

**S9. `recovery/v214/`:** this file, `map.md` and `proto/` (text only).

**S10. The blank mark** (C17; W1 sets the flag and owns the function's body, W4's record writer reads it).
- Directly above `let _bootRestoreErr='';` (7396), ABOVE the opening:
```js
// v2.14 (slot; W1 sets it while the board opens): the board on screen came from no saved copy -- no board in this file and nothing of
// this appropriation's in browser storage, or storage's copy written by such a page. Declared here, above the opening: a var's
// initializer runs where it stands, and one declared below would put back false after the opening set it.
var _pageBlank=false;
```
- Beside `pageAddr` (S6):
```js
// v2.14 (slot; W1 owns the body; W4's baseMarkDirty reads it): is the work on screen work never saved to any file, typed on a page
// whose board came from no saved copy? The record then says blank:true, and only such a record is "stray work" that a board file
// opened later keeps aside instead of opening (the stray rule). Never throws; false until W1 fills it.
function pageBlankNow(){ return false; }
```

**S11. What the file route holds** (C23; W2 owns the body, W3's `memOnlyLeave` reads it). Directly after S2's two stubs:
```js
// v2.14 (slot; W2 owns the body; W3's leave prompt reads it): does the file route hold the only copy of something right now -- a
// file being written (the browser emptied it when it was chosen), a rescue offered and not yet saved, the as-it-was file being
// written? Leaving the page then asks first. Never throws; false until W2 fills it.
function impFileHolds(){ return false; }
```

**Proof the slot is inert** (the lead, before any branch): `npm run check` (the "reopen" rule holds); `node
tools/export-audit/boot-same.mjs`; mcount `3220` entries, all once; the S2 retarget proved; every suite whole (board, import and
recon at 8 GB), audit-inject included (its INJ_EXPECT is empty, so the never-ran loop says nothing). That run is also the
baseline every builder's "fails on the slot commit" is measured against. **The lead records the slot commit's sha here** once it
exists; W2's check 9 reads the slot's board by it.

## 3. One owner per function

| Function or file | Owner | Others rely on |
|---|---|---|
| `_fhGet`, `_fhPut`, `fhPageKey`, `fhLegacyRelease`, `fhOwnName`, `fhNewName`, `fhSaveNew`, `fhRepick`, `_fhKnown` | W1 | W2: `_fhPut(h)` keeps "this page's file" (W2's save-over-self adoption calls it) |
| `_saveInPlaceFileRun`, `saveInPlaceFile`, `saveDrops`, `saveDropsAsk`, `fileKindOf` (if written) | W1 (not the S5 line) | — |
| The boot PUB block (`_bootFile`, `_bootStray`, case 3, the `_pageBlank` sets) — not the S2 line; `pageBlankNow`'s body | W1 | W4: `pageBlankNow()` says whether a record is blank work |
| `diagReport`'s "Save writes to" line | W1 | — |
| `lsSet` (not the S2 line), `lsAll`, `lsPutBack`, `lsMarks`, `lsMarksBack`, importBoards' late refusal | W3 | W2: `{quiet:true}` and `_lsAllRun`; W1 and W2: a refused all-or-nothing write leaves the marks as they were |
| `persist` (not the S2 line), `memOnlyNow`, `memOnlyBlock` (body), `memOnlyLeave`, `_sideBootGen` | W3 | W2: a held write sets `_persistFail` (S2), so it counts as on screen only; `impFileHolds()` (S11) is read by `memOnlyLeave` |
| `writerKey`, `writerKeyHeld`, `uiPenOther`, `whoIs`, `whoAmI`, `_whoMem` | W3 | W2: `writerKey()` is stable within the page |
| `switchAppn`, `cycGoAppn`, `clearComputer`, `diagLsKinds`, `diagReport`'s by-kind lines, `_driveStorePushRun`'s `penNote` | W3 | — |
| `fullImportText`, `fullImportUndone`, `fullImportPreHtml`, `savedHtmlOf`, `boardPubOf`, `impFile*`, `impHand*` (bodies), `impFileHolds` (body), `IMP_FILE_KEY`, `_impOpen`, `_impRep`'s own-file branch, the opening chain's report and hold lines, `impRoomSay`, `importState` (not the S4 line), `#impFilePanel`, guide `t-full` | W2 | W3: the S4 guard lines in these functions stay |
| `baseMarkDirty`, `save()`'s record line, `loadCounted`, `driveRestore`, `driveStorePull`, `keepAside`, `keptOccupiedMsg`, `saveStateShow` | W4 | W1: one record writer, reading the record fresh and writing the blank mark from `pageBlankNow()` (W1's case 3 sets `LASTKNOWN=0`, which it writes) |
| `yearHas`, `yearLinkOf`, `naFromHere`, `pmoPriorHere`, `pmoStampApart`, `pmoLinkApart`, `pmoChainApart`, `yrCopySame` | W4 | — |
| `jrnlWalk`, `jrnlSet`, `jrnlUndoable`, `jrnlUndo`, `jrnlBody`, `jrnlById`, `jrnlCustomPlace`, `jrnlCustomHere` | W4 | — |
| `pmoVal`, `pmoNorm`, `pmoFmtVal`, `pmoProposalOf`, `pmoTake`, `pmoAcceptProposal` (SI) | W4 | — |
| `rcnBody`/`rcnDraw`, `inspHeld`, `inspHeldBack`, `inspHeldSame`, `heldRedraw`, the new input listener | W4 | — |
| `tools/check.mjs` | slot ("reopen"), W1 ("the save-file handle store") | — |
| `tools/pmo-save.mjs` | W1 | — |
| `tools/panels-render.mjs`, `tools/standards-check.mjs`, `tools/export-audit/hostile.mjs` | W2 | — |
| `tools/keyboard-reach.mjs`, `math-defects.json` | W4 | — |
| `tools/export-audit/boot.mjs`, `package.json`, audit-inject's `INJ_EXPECT` and never-ran loop | the lead | — |

Two functions are edited by two workstreams on lines apart, and only on the lines named: `diagReport` (W1 the "Save writes to"
line; W3 the block after "Browser storage:", ten lines below it) and `_saveInPlaceFileRun`/`_driveStorePushRun` (W1 owns the
first; its success line's `wkMemSay` tail is the slot's; W3 adds the same tail to the second's `penNote`). Every seam line (§2)
belongs to the slot commit.

An existing check outside the slots belongs to the workstream whose behaviour moves it. If two must change one existing block,
each changes only its own lines, with its `// v2.14 Wn:` comment, and names them in its notes; the lead settles the merge.

## 4. Where the four maps disagreed, and what this contract decides

C1–C16 were settled when the contract was written; C17–C30 by its review (§13). Each overrides the map where they differ.

| # | The maps | Decided |
|---|---|---|
| C1 | save-target's `baseMark` and held's `baseMarkDirty` are one record writer | **W4's `baseMarkDirty`** (it also keeps the folder map, and writes the blank mark: C17). save-target's `record-no-file` and `record-cached` are dropped as duplicates of `v214-w4-base-file-kept` and `-base-cache`. The four retargets on that line are W4's. |
| C2 | Three ways to put the save marks back after a refused all-or-nothing write (save-target's `lsMarks`, file-route's `lsCounters`, storage-full's `delete _lsRefused`) | **W3's `lsMarks`/`lsMarksBack`**, restoring `_saveGen`, `DIRTY`, `_dlOnly`, `_sideGen` and `_lsRefused` from the snapshot (which covers storage-full's need) when every key is back. file-route's `counters-kept` is dropped. |
| C3 | Item 140 (c) sat in save-target | **W3's**, with its block and five mutations (`marks-not-restored`, `marks-dirty-kept`, `marks-side-kept`, `import-says-save`, `batch-marks`, as `v214-w3-*`). storage-full's check part A(h) moves into that block. |
| C4 | D in both save-target and file-route | **W1's**, with save-target's bare/baked rule and (b)'s baked wording. file-route's D, its block and its two mutations are dropped. |
| C5 | `writerKey` in save-target and storage-full | **W3's** `writerKeyHeld`/`_wkMem`. W2 re-stores the stamped key after its clear, through `lsSet(…, {quiet:true})`, or in the marker's lsAll (C13, C20). |
| C6 | The `.base` records in the import's W (save-target) | **W2 builds them** (it owns fullImportText), written whole: `{file:0, folder:{}, dirty:true}`, never a `blank` mark. Where else they go, and where they never go: C19. New mutation `v214-w2-import-base-unrecorded`. |
| C7 | The hold's call sites in lsSet, persist and the boot write; `reopenPage`; `memOnlyBlock`'s door lines; the S8 tail; `pageAddr`; boot.mjs `url` | **Slot seams** (§2). |
| C8 | The two-tab check in save-target (iii) and in held | **W4's block.** W1 keeps parts (i) and (ii) of its record block, with (i) asserting only `LASTKNOWN===0` and `_baseDirty===false` at opening; the record after a change, and `savetarget` E, are integration checks (INT-3), since they need W1's case 3 and W4's writer together. |
| C9 | file-route's main block asserted `unsavedNow()` false after the refusal | **Not in W2's block** (it fails without W3's restore); W3's (c) block holds it, and INT-2 holds both together. |
| C10 | storage-full recommended that driveStorePull's shell branch reopen only if `persist()` landed | **Not built.** Nothing is lost there (the folder keeps its copy); logged in W4's Known gaps. |
| C11 | The guide: W1 adds a sentence, W2 replaces `t-full`'s third paragraph | Measured at `c863dc2`: **70,815 of the 72,000** audit-import allows. Allowances: W1 +450 net (in `t-board`'s saving paragraph), W2 +200 net (`t-full`), W3 +150 net (only if it adds a sentence), W4 0. The budget is not raised; the lead measures in a booted board after integration. |
| C12 | file-route's "the picker before any await" against AGENTS.md's "write a save outside `saveSerial()`" | **The file route's write is not a board save** (it writes a new file and never marks this page saved), so it does not go through `saveSerial`, which would put a promise between the click and the window. It refuses while a save is under way (`_saveBusy`), saying `⏳ <b>Nothing was written yet</b>: a save is under way. Press <b>Write the imported board into a new file…</b> again once it has finished.` W1's `fhSaveNew` goes through `saveSerial`. |
| C13 | file-route wrote the marker with `lsSet` and the writer key directly | **Both through one `lsAll`** (AGENTS.md: an import writes storage only through `lsAll`). Refused and put back → the in-memory hold (`_impHand`), no reload, as file-route's 5(g). When it is written: C20. |
| C14 | Every browser stand-in installed only the picker it needed | **Every new browser tool and jsdom block that drives a Save installs both `showOpenFilePicker` and `showSaveFilePicker`** stand-ins (W1 makes the first Save use the Open window, where it exists), **except** W1's check 1 and the part of W1's check 2 named in §5, which deliberately install only `showSaveFilePicker` to reach the no-Open-window fallback (C30). Every new Save-window stand-in empties an existing file on pick, as Chromium does; older blocks' stand-ins are left as they are unless C16 moves them. |
| C15 | E1 moves expectations of existing blocks that import a board .html on an empty board | **W2 greps first** (audit-import w1import ~5540–5700, audit-recon's `importState` callers) and moves each with a `// v2.14 W2:` comment. With E1 narrowed (C18), only those whose browser holds nothing move. |
| C16 | W1's (b) can add a question to an existing test that saves over a stand-in file holding more than its board | **The lead, after merging W1**, runs every audit-import block that saves to a stand-in (W1H, i127, w2) and adjusts the fixture, never the rule. W1 runs audit-import whole on its branch and does the same for what it finds. |
| C17 | save-target's stray rule (Functions 10.3) fires on any record `{file:0, dirty:true}` | **Only on blank work, and never over storage's data pack.** `_bootStray = _bootOwnRead && _bootBase.dirty===true && !(+_bootBase.file) && _bootBase.blank===true && !<storage's plan carries a data pack DATA would take>`. The mark `blank:true` is written by W4's `baseMarkDirty` from `pageBlankNow()` (S10), explicitly `true` or `false` on every write it makes (`baseSet` merges, so a mark left out would survive), and by nothing else; C6's records are written whole without it. The data-pack test is DATA's own (`_hasData(ms && ms.dataPack)` on storage's plan, read again in a try; unreadable counts as carrying one): DATA has already taken storage's pack (R1) by the time the opening decides, so the file's plan over it would be a mix. Without both guards a landed storage-route import reopened in an older board file shows the old plan over the import, and the next Save writes old O&M with the imported Full Fund (three attackers measured it; §13). |
| C18 | file-route's E1 (Functions 16, Design 15) sends every v1.80+ board .html on an empty board to `fullImportText` | **Only a whole-board file into an empty browser.** E1's gate: `IS_SHELL`, a board .html saved by v1.80 or later, **not** a one-appropriation file (its pubState has no `only`), and `impShellEmpty()`: no appropriation's plan key holds a plan with any requirement (any year's `order` or `custom`), and every board-wide list W would write (execution data, cost estimates, BAE list, reprogramming log, destination list, every `-cyc` store) is absent or `sideEmpty`. Anything else on the empty board goes through E2 (v2.13's `importStores` merge, captured and committed through one lsAll), so nothing this browser holds is replaced whole. |
| C19 | C6, and file-route Design 4–11, put the `.base` records in the hashes, the marker, the clear and (by fullImportUndone) the mixed mark | **The `.base` records are in W and nowhere else in the file route**: not in `impFileMoved`, the hashes, the marker's `keys` or `says`, the "left" list, `impUnsavedList`, `boardPubOf`, `fullImportUndone`'s mixed mark (`IMP_MIXED_KEY`'s keys) or its lists of what was and was not put back; `impMixedLift` ignores a `.base` key. **Each is removed whenever its plan is removed** (Finish's clear, the opening's clear, the lift, C22). The hold never guards a `.base` (baseSet is a direct write, D17), so a held page rewriting its record is no "change after the import". |
| C20 | file-route Design 4, 5, 8: the marker is written at Finish, after the name-match pause and after the clear | **The marker is written straight after the verified read-back**, in the same synchronous run (after `impFileMoved` and the counters, C29), before the name-match pause and before any key is cleared: `how:'file'`, the hashes of what storage held at the click, `keys`/`says` without `.base` (C19), with the stamped writer key, through one lsAll (C13). Then the name-match step or Finish; Finish clears and writes no marker. If that lsAll is refused, Finish clears first and tries the marker again after (design 5's order); refused again → `_impHand=m` (5(g)). So a tab closed at the pause, or a crash before the clear, still leaves the marker, and opening the file clears this browser's unchanged old copies before DATA reads them. |
| C21 | file-route Design 10, 11: opening the import's file lifts the hold everywhere | **A page that has seen the marker stays held for its life.** `_impHand` is taken: in `_impOpen` when the marker names another file (the page booted held); at any write whose `impHandKey` finds the marker; and on a `storage` event whose `key` is `IMP_FILE_KEY` and `newValue` is not null (another tab wrote it). Opening the import's file removes the marker from storage, so pages opened after that are not held; a page already held stays held until it is closed or "lift the hold…" is chosen in it. `_impHand` and `_impHandSaid` are declared ABOVE `_impOpen` (§2's var rule). |
| C22 | file-route Design 11: "lift the hold…" removes the marker | **Lifting the hold also removes this browser's copies that still hold what they held when the import was written** (each key whose value hashes to `m.h[key]`, with its `.base`), names any that changed and leaves them, then removes the marker and `_impHand`. Those copies are the ones that would stand in front of the new file here (R1); step 1 has already saved or explicitly declined the work they held. The confirm says so (§6). |
| C23 | file-route Design 3–6 and 17; storage-full's `memOnlyLeave` arms only on a refused storage write | **Leaving the page asks while the file route holds the only copy** (S11): while `_impFile.busy`, while the as-it-was file is being written, and while a rescue is offered and not yet downloaded (both rescues; just the second when the build failed). W3's `memOnlyLeave` asks when `memOnlyNow() || impFileHolds()`. Closing the box with a rescue not yet downloaded asks first (one confirm). |
| C24 | save-target Design (b): saveDrops counts an appropriation as carried when the outgoing plan has one requirement | **saveDrops also names the requirements**: for each appropriation and year both sides hold, the ids the file holds there (that year's `order`, `removed` and the ids in its `custom`, with the appropriation's data pack `items`) that the outgoing bytes do not hold there by the same reading, one line each: `O&M FY27 — 2 requirements the board on screen does not carry: B, C` (at most 6 ids, then `and N more`). An ordinary Save asks nothing (the ids agree); a deletion on purpose asks once (D3). This is the Save-side guard on R1: a board that opened with a shorter requirement list cannot write it over the file unasked. |
| C25 | save-target Functions 7 step 8: a Save-window pick is remembered under the page's key | **"Save as a new file…" is not remembered under the page it was pressed in.** For a `fresh` save, `FH=h` in memory only (later Saves in this page write the new file, as a Save As does); nothing is put under `'page|'+pageAddr()`. Its success line adds: `From now on 💾 Save in this page writes “<new>”. Opened again, “<own>” asks which file to save to.` The no-Open-window fallback (not fresh) is remembered as mapped. |
| C26 | save-target Functions 7 step 4 tightens `if(p===undefined){` to `if(p===undefined || (p!==null && typeof p!=='object')){` | **The line stays as it is**; the non-object test goes on a line of its own just before it: `if(p!==undefined && p!==null && typeof p!=='object') p=undefined;`. `guard-not-a-board-writes` (find `      if(p===undefined){\n        FH=null;`) keeps matching once. |
| C27 | file-route Functions 10: six mutations' finds span `savedHtmlOf`'s JSON line | **Eight**: also `handoff-copy-drops-exec` (`execDb:EXDB,`) and `handoff-copy-drops-ace` (`aceDb:ACEDB,`), since W2 takes execDb and aceDb from `lists` too. W2 retargets all eight in place (or confirms by mcount that one still matches) and proves each against its own block. |
| C28 | file-route's `picker-after-await`: `await Promise.resolve();` before the picker | **Rewritten so the board still parses.** `impFileWrite` is synchronous up to the picker (it ends `return pick.then(…)`), so an `await` there is a SyntaxError and the mutant fails because nothing opens. The mutation replaces the picker call with `pick=Promise.resolve().then(function(){ return window.showSaveFilePicker({suggestedName:R.name, types:[…]}); });` (only the timing moves), proved against check 1(c)'s `__inClick`. Rule for every builder: §10 (a mutant must parse). |
| C29 | file-route Design 4 and 5 both say the race is re-checked; which function does it? | **`impFileWriteTo` re-checks after its last await**: storage (`impFileMoved`) and this page's counters (`_saveGen`, `_sideGen` against the click). `impFileCarryOn` re-checks both before calling Finish (the name step is a human pause). `impFileFinish` does not re-check. Mutations: `race-unchecked` removes WriteTo's storage re-check; `race-page-unchecked` removes its counters re-check; each has its own part of check 2. |
| C30 | Fixture rules the review found missing | (a) W1's check 1 takes the no-Open-window fallback on purpose (only `showSaveFilePicker` installed; C14's exception), and check 2 has a part with `showOpenFilePicker` deleted. (b) W3's k3 imports a **JSON state file** (it reaches importState's own S4 guard before and after E1). (c) W3's `switch-box-stays` parts drive `#appnSel` as a person does (`value` then a `change` event), never `switchAppn()` directly; `storagefull` B asserts `#appnSel`'s value, not `APPN`. (d) W2's room check boots the reopened board with S7's `quota`. (e) W2's check 1(c) states the cleared set from the fixture's own literals, with controls that must survive byte for byte. (f) W2's audit-inject block uses top-level `await` and pushes its finding to `INJ_EXPECT` first (S8). (g) W2's check 1(d) boots the written file twice, at the importing page's url and at another, with S7's `idb` store. |

## 5. W1 — Save writes only to its own file, and asks before writing over what it does not carry

**Scope.** Item 140 (a): the remembered save file is this page's own (`prio-fh` under `'page|'+pageAddr()`), never `FNAME`; the
first Save of a file in a browser goes through an Open window, reads the file and runs every check before write access is asked;
"Save as a new file…" (not remembered under the page it was pressed in, C25); the `FNAME` entry released when it names the file
just written. Item 140 (b): Save asks, naming them, before writing over an appropriation, a year, a requirement, a locked cycle
or a list the file holds and the bytes do not (C24). Item 141 D: a program with no board is written in place, claimed like a new
file; a baked program is asked about. The boot's record rules: case 3 (`LASTKNOWN=0`, `_baseDirty=false` when the board came
from no saved copy), the blank mark's flag (`_pageBlank`, `pageBlankNow`) and the stray rule with its two guards (C17). Save
diagnostics' "Save writes to".

**Functions** (map.md › save-target › Functions 1–8, 10, 14 and 15's check.mjs, pmo-save and audit-import parts; not 9, the
record writer, which is W4's; not 11–13, which are W3's and W2's; not 15's boot.mjs `url`, which is the slot's): `fhPageKey` returns
`pageAddr()? 'page|'+pageAddr() : ''` (S6); `_fhPut`, `_fhGet`, `fhLegacyRelease`, `fhOwnName`, `fhNewName`, `fhSaveNew`,
`fhRepick`, `_saveInPlaceFileRun` steps 1–11 (leave the S5 line; step 4 as C26; step 8 as C25), `saveDrops` (with C24's
requirement lines), `saveDropsAsk`, the boot PUB block (leave the S2 line), `diagReport`'s "Save writes to":
`(FH || _fhKnown)? 'a file this browser remembers for this page'` in place of `FH? 'this file, in place'`, and
`'asks which file, the first time'` in place of `'asks where, the first time'`, with `var _fhKnown=false;` and
`try{ _fhGet(function(h){ _fhKnown=!!h; }); }catch(e){}` beside `let FH=null;`.

**The record's rules at opening** (map save-target Functions 10, with C17):
1. `let _bootFile=false;` with the other `_boot` lets; `_bootFile=true;` right after each `LASTKNOWN=PUB_FILE_TS;` (7462, 7467).
2. The stray rule, before the PUB block:
   `const _bootStray=_bootOwnRead && _bootBase.dirty===true && !(+_bootBase.file) && _bootBase.blank===true && !_bootOwnPack;`
   where `_bootOwnPack` is DATA's own test on storage's plan, read again in a try (`const ms=JSON.parse(localStorage.getItem(_AP.key)||'null'); _hasData(ms&&ms.dataPack)`;
   a throw counts as `true`). The first condition becomes `if(fileTs > ours || (_bootStray && fileTs < ours)){`; the existing
   branch keeps that work aside (`ownUnsaved`, `keepAside`, `_bootKept`, `_bootHeld` on `'occupied'` or no room).
3. After the PUB block, before `if(SANDBOX) pmoAdopt();`:
   `if(!_bootOwnRead && !_bootFile){ LASTKNOWN=0; _baseDirty=false; _pageBlank=true; } else if(_bootOwnRead && !_bootFile && _bootBase.blank===true) _pageBlank=true;`
   (the second clause: storage's copy is on screen, the file did not open, and that copy is a blank page's work).
4. `pageBlankNow()`'s body (S10): true while `_pageBlank===true`, `LASTKNOWN` is 0 and no shared-folder copy has been taken
   (`_driveBase` holds nothing, read in a try: it is a `let` declared below); false otherwise, and false on any throw. Once this
   page has written a file or taken a saved copy, its work is no longer blank.
Measured on a prototype of exactly this (`proto/revise-stray-patch.py`, `revise-stray-blank.mjs`, `revise-stray-carried.mjs`;
§13): a storage-route import into a board file, reopened, shows the import (attackers' `stray-import.mjs`); Brad's main path shows
Full Fund tagged (`mainpath.mjs`); a blank page's change, then an older board file: the file opens and the blank work is kept
aside; a blank record over a plan carrying a data pack: storage's plan opens whole (no mix).

**Behaviour and sentences:** map.md › save-target › Design (a), (b), the record's case 3 and stray rule, and D, verbatim —
FIRST_SAY, NEW_SAY, the no-Open-window fallback, the cancelled line, PICK_BLOCKED_SAY, LATER_SAY, DENIED_SAY, the (b) question,
the baked question, CANCEL_SAY, and saveDrops' lines — plus C24's requirement line and C25's success sentence. Write "requirement"
and "year" singular for one, plural otherwise (`1 requirement, 1 year`; `40 requirements, 5 years`). The guide sentence, in
`t-board`'s saving paragraph, within +450 characters net: *"The first 💾 Save of a file in a browser asks which file: pick the
board file you opened, which ORBIT reads and checks before writing anything, or save it as a new file. Save asks, naming them,
before writing over an appropriation, a requirement, a locked cycle or a list the board on screen does not carry."* Every name in
markup through `esc()`; `confirm()` text never escaped.

**Checks** (audit-import, W1 slot), each failing on the slot commit unless a CONTROL:
1. `v2.14 W1 — Save writes only to the file this page was saved to; another file is never reached through the shared entry (item 140 a)` — map check 1 (two pages by `boot({url})`, one shared S7 `idb` store), installing **only** `showSaveFilePicker` (C14's exception, C30a), so Y's window suggests `'new.html'` (`own-name-lost`). Plus: a page booted with `idb` whose store holds a handle under its key prints "a file this browser remembers for this page" in Save diagnostics, and one with none prints "asks which file, the first time" (`known-unread`).
2. `v2.14 W1 — the first Save of a file opens it to check it before anything is written (item 140 a)` — map check 2, plus: with `showOpenFilePicker` deleted, the Save window suggests `fhOwnName()` and the line is the fallback's text (C30a); after `fhSaveNew()`, nothing is stored under the page's key, a second Save in the same page writes the new file with no window, and a reboot at the same url with the same store has no handle (C25, `fresh-remembered`).
3. `v2.14 W1 — Save asks, naming them, before it writes over what the file holds and the board on screen does not carry (item 140 b)` — map check 3, parts (1)–(8), every expected line derived in Node from the fixture's pubState; plus (9) R1's shape (`proto/` and the attackers' `r1.mjs`): this browser holds an older one-requirement plan, the newer file holds A, B, C; Save asks, naming `B, C` under the appropriation and year, and Cancel writes nothing (`drops-reqs-blind`; v2.13 writes the cut list with no question).
4. `v2.14 W1 — Save into an ORBIT program with no board writes it in place (item 141 D)` — map check 4.
5. `v2.14 W1 — a page whose board came from no saved copy takes no other file’s save as its own, and a board file keeps such work aside (item 140)` —
   (i) at opening `LASTKNOWN===0`, `_baseDirty===false` (v2.13: X);
   (ii) the stray rule: record seeded `{file:0, dirty:true, blank:true}` and a blank page's plan (no data pack) newer than an older board file: the file's requirements on screen, that work kept aside, `LASTKNOWN===PUB_FILE_TS`, record `{file:PUB_FILE_TS, dirty:false}` (v2.13 opens the blank plan);
   (iii) CONTROL: the same with the record an import writes (`{file:0, folder:{}, dirty:true}`, no mark): storage's plan opens, nothing kept aside (`stray-any-record`);
   (iv) CONTROL: `blank:true`, but storage's plan carries a data pack with another requirement list: storage's plan opens, and `DATA.items`, `S.order`, `S.notes` and the next `buildSavedHtml()` are all that one board's (`stray-over-pack`; without the guard the prototype showed DATA from storage and the plan from the file);
   (v) `pageBlankNow()`: true on a blank page; true on a page reopened over storage's blank-marked copy; false on a board file; false once `LASTKNOWN` is set (`blank-never`, `blank-not-carried`, `blank-after-save`).
- Existing checks moved: audit-import v2.09 W3 at 14809/14813 read `X.store.get('page|https://example.invalid/board.html')`;
  `tools/pmo-save.mjs` E re-pointed to the board page's key (re-recorded, saying why); any diagnostics check quoting "this file,
  in place" or "asks where, the first time".
- `npm run check` "the save-file handle store" (map check 8), proved by planting `.put(h, FNAME)` back.
- `tools/save-target.mjs` (map check 7) sections A, B, C, D, F, each failing on the slot commit; section E written but labelled
  INT (it needs W4's record writer). Install both pickers (C14).
- By hand, recorded in the notes: the headed Open-window proof (map check 10), **logging what `queryPermission` answered and
  whether `requestPermission` threw** after the real pick (§12 Q1 is worded from it).

**Mutations (33):** `v214-w1-` + `fname-get`, `fname-put`, `key-shared`, `own-name-lost`, `save-window-first`,
`picked-remembered-early`, `picked-denied-kept`, `drops-unasked`, `drops-cancel-writes`, `drops-appns-blind`,
`drops-empty-carried`, `drops-years-blind`, `drops-cycles-blind`, `drops-ace-blind`, `drops-exec-blind`, `drops-bae-blind`,
`drops-rp-blind`, `cancel-pen-moved`, `null-writer-throws`, `program-not-fresh`, `baked-unasked`, `release-skipped`,
`release-any-file`, `boot-lastknown-inherited`, `stray-opens` — each as map.md lists, caught by the block named there — and, from
the review: `stray-any-record` (`_bootBase.blank===true &&` removed → 5(iii)), `stray-over-pack` (`&& !_bootOwnPack` removed →
5(iv)), `drops-reqs-blind` (C24's lines not computed → 3(9)), `fresh-remembered` (a fresh pick put under the page key → 2),
`known-unread` (the opening's `_fhGet` removed → 1), `blank-never` (`pageBlankNow` returns false → 5(v)), `blank-not-carried`
(the second clause of step 3 removed → 5(v)), `blank-after-save` (`pageBlankNow` ignores `LASTKNOWN` → 5(v)). W1 may add
`v214-w1-*` ids for lines of its own the list does not reach (`fhRepick`), saying so. Expected retargets: none;
`guard-fails-open` (`let p;`), `guard-not-a-board-writes` (kept by C26), `v209-w3-board-save-over-copy`,
`v209-w3-board-save-keeps-handle`, `v209-rv-save-board-moved-handle-kept`, `guard-later-only`, `v209-w3-hold-on-skipped` must
still match once — mcount says.

**May touch:** the board (the functions above, `t-board`), `audit-import.mjs` (its slot; the two v2.09 W3 lines), `check.mjs` (its
rule), `pmo-save.mjs` (E), `tools/save-target.mjs` (new), `mutate.mjs` (its slot), its notes and proofs.
**Must not change:** the S2, S5, S6, S10 lines (it fills `pageBlankNow`'s body only); lsAll/lsSet; the record writer (`save()`,
`loadCounted`, `baseMarkDirty` are W4's); the PMO copy's own save (`_pfh*`, `pmoSave*`); `writerKey`; DATA (R1 stays as it is:
the stray rule keeps out of its way, C17).

## 6. W2 — a full import too big for browser storage goes into a new file

**Scope.** Item 141: when the full import's all-or-nothing write is refused and everything is put back, the box offers "Write
the imported board into a new file…" (written, read back, the marker at once (C20), then only the import's own keys cleared, the
new file opened); the as-it-was step; rescues on any failure after a pick, and leaving the page asks while one is held (C23); the
name-match pause; the download route; the opening clear by the id stamped in the file's pubState; the hand-over hold (fills S2's
stubs; latched for a page's life, C21; lifted by hand with this browser's unchanged old copies removed, C22); the room check after
a storage-route landing; E (the empty-board import door, all or nothing; E1 narrowed, C18); the `.base` records in W (C6, C19).

**Functions:** map.md › file-route › Functions 1, 2, 7–16, 18, 19 (not 3, 4–6 as written there: S2's call sites are the slot's;
W2 writes `impHandKey`, `impHandRefuse` and `impFileHolds`' bodies, where the slot put them, and `impHandOf`, `impHandMsg`,
`impHandClear`, `_impHand`, `_impHandSaid` beside them — those two vars ABOVE `_impOpen` (C21); not 17: D is W1's).
- `impHandRefuse(key, what)` does what file-route's lsSet branch does — count as not kept (`fileMark`/`fileStored(key, fk,
  false)`, skipping `fileMark` for `_AP.key`, which save() already counted), push `DIAG.refused` with why `'HandOverHold'`, say
  `impHandMsg(what)` once per page and never while `_lsAllRun`, return false.
- `impHandKey(key)` is true when `_impHand` (latched) or the marker read from storage at call time lists `key`; reading the marker
  from storage latches it (C21). It never throws, and returns false while `IMP_FILE_KEY` is not yet assigned. One `storage` event
  listener latches it when another tab writes the marker (C21).
- `impFileHolds()` (S11): true while `_impFile` is writing the imported board (`busy`) or the as-it-was file, or holds a rescue
  (C23) not yet downloaded; false otherwise and on any throw. W2 keeps whatever it needs on `_impFile` to say so.
- `impHref()` is `pageAddr()` (S6).
- In fullImportText's W, right after each plan, the record
  `[_SLUGMAP[k].key+'.base', JSON.stringify({file:0, folder:{}, dirty:true}), 'This browser’s record of the '+_SLUGMAP[k].t+' plan', 'the record of the '+_SLUGMAP[k].t+' plan']`
  (C6), used as C19 says. E2's captured commit carries the same record for every plan it writes.
- `_impOpen` and everything it calls read nothing declared with `let`/`const` below line 2948 (AGENTS.md).

**Behaviour and sentences:** map.md › file-route › Design 0–12 and 15–18, verbatim, with these changes: C12 (refuse while a save
is under way, the sentence there); C13 and C20 (the marker and, when storage lacks it, the stamped writer key, through one
`lsAll`, written straight after the verified read-back); C18 (E1's gate); C19 (the `.base` records); C21 (the hold latched for a
page's life: `impHandMsg` adds, in a page held that way, ` This page stays held until it is closed: carry on in “{m.name}”.`);
C22 (the lift: `impHandClear`'s confirm adds, before `OK — lift the hold.`, `Lifting it also removes this browser’s copies of {lists} that are unchanged since the import was written — the copies that would stand in front of “{name}” when it is opened here. Your board files are not touched.\n\n`,
and its status line names any copy that changed and was left); C23 (leaving the page asks; the box's ✕ with a rescue not yet
downloaded asks `The two copies are not saved yet. If “{h.name}” already existed, the browser emptied it when you chose it, and these copies are all there is of it. Close anyway?`);
C29 (which function re-checks the race); the gate (`W.full`, `done.back`, `done.at>=0`). Every name drawn through `esc()`; every
handler value through `jsa()`; the marker holds plain text only. The guide paragraph (design 18) within +200 characters net.

**Checks** (audit-import, W2 slot, unless noted), each failing on the slot commit unless a CONTROL:
1. `v2.14 W2 — a full import browser storage cannot hold is written into a new file, read back whole, and opens as the import would have (item 141)` — map check 1 without `unsavedNow()` (C9); stand-in pickers per C14 (`fiPicker` empties an existing file on pick); with:
   (c) the cleared set stated from the fixture's literals (C30e): `W2_KEYS` less `prio27impRep`, plus `prio27om.base` and `prio27ff.base`, all gone; and byte for byte, as CONTROLS: `prio27sp.base` (an appropriation the import does not write), `prio27om.kept`, `prio27appn`, a planted PMO-copy key and `prio27writerKey` (`clears-others` re-aimed: it removes every `<key>.base` and `.kept`);
   (d) the written file booted twice with one S7 `idb` store holding `'import|'+n` (C30g): at the importing page's url, the handle is adopted under `'page|'+url` and `import|n` is gone; at another url (`boot({url})`), FH is null, nothing is stored under that page's key, and `import|n` is gone (`adopt-any-page`);
   (e) each failure after the pick also holds `impFileHolds()===true` until both rescues have been downloaded, then false; ✕ with one not yet downloaded asks, and Cancel keeps the box (`holds-unsaid`, `rescue-close-unasked`);
   (i) the stuck case's mixed mark (`IMP_MIXED_KEY`'s keys) names no `.base` key, and an import that later lands lifts it (`mixed-marks-base`);
   (k) at the name-match pause the marker already stands with the click's hashes; booting the written file then (the tab closed at the pause) removes the unchanged copies before DATA reads them (`marker-after-pause`).
2. `v2.14 W2 — the file route keeps what browser storage held: work no saved file has is saved first, a list another tab changed is never cleared, and nothing here stands in front of the new file (item 141)` — map check 2, with:
   the race in two parts (C29): (1) prio27ff changed in storage during the held write (`race-unchecked`); (2) an edit on the page during the held write whose storage write is refused (storage unchanged, `_saveGen` moved): `impFileRaced` and its "still on screen" sentence (`race-page-unchecked`);
   (h) extended (C21): the importing page reopened is held; the written file opened in a second boot; then an edit in the importing page is still held (not in storage) and the written file, reopened, shows the imported board — once with the importing page the program and once with it a populated board file (`hold-unlatched`); a page open before the marker was written latches on the `storage` event (dispatched in jsdom where the browser fires it) and stays held after the written file opens (`hold-no-storage-event`);
   the held importing page's own boot rewrites its plan's record; opening the written file names nothing as changed and the marker's keys hold no `.base` (`base-in-marker`).
3. `v2.14 W2 — the file route where the browser cannot write a file: downloaded, and this browser’s old copies cleared when it opens (item 141)` — map check 3, plus the lift (C22): before the downloaded file is opened, "lift the hold…" OK removes the unchanged copies and leaves (and names) one changed meanwhile; booting the downloaded file then shows its own requirement list (`lift-leaves-copies`).
4. `v2.14 W2 — the file route gives what the storage route gives, on files from v1.80, v1.83, v1.85, v1.87, v2.11 and a partial file (item 141)` — map check 4 (`git fetch --unshallow` first).
5. `v2.14 W2 — on an empty board, Import one appropriation takes a board file whole or not at all (item 141 E)` — map check 5, with E1's gate (C18): (a), (b) as mapped in an empty browser; (c) a browser holding a cost estimate no file has and execution data for another appropriation: the same door goes through E2, and the estimate and that execution data are still there after it lands (merged as v2.13 merges them), all or nothing (`e1-takes-lists`); (d) a one-appropriation file (`only`) into an empty appropriation: E2, and the other appropriations' execution data and BAE rows are kept (`e1-takes-one`); (e) after an E2 landing each plan it wrote is recorded `{file:0, dirty:true}` with no blank mark (`e2-base-unrecorded`).
6. `v2.14 W2 — a full import that only just fits says browser storage is almost full (item 141)` — map check 7, the reopened board booted with S7's `quota` set to what storage holds after the landing plus 1,000 (C30d): the sentence is in the reopened board's `#shareStat`; a CONTROL at plus 200,000 does not say it (`room-unsaid`, and `room-not-on-opening`: `+impRoomSay()` dropped from the opening chain).
7. `v2.14 W2 — after a full import that lands, the board reads unsaved, in no saved file (item 140)` — the storage route lands, the importing page reopens with storage after: the save state reads unsaved, `LASTKNOWN===0`, each imported plan's record `{file:0, folder:{}, dirty:true}` with no `blank`; a plan the import did not write keeps its record (CONTROL). v2.13: "Saved", `LASTKNOWN` another file's save.
8. audit-inject, W2 slot: `v2.14 W2 — the file route’s box and marker draw file names as text (item 141)` (map check 8), in
   audit-inject's own form (a finding id, `fid`/finding checks), through the board's own renderers; the block first pushes its
   finding to `INJ_EXPECT` and awaits every async draw with top-level `await` (C30f).
9. `v2.14 W2 — an ordinary save writes what the slot commit’s board writes, and carries no impFile (item 141)` — the same fixture
   on this board and on the slot's (`git show <slot sha>:prioritization-board-grid.html`, §2): the pubState of an ordinary
   `buildSavedHtml()`, `ts`/`log[].ts`/`jrnl[].t` zeroed by name, equal; no ordinary save, nor the first own save of the
   import's file, contains `"impFile"` (T9 in §13).
- Existing checks moved: the v1.95 W2 block (`W2_KEYS`, `W2_SAY`, the n loop) for the `.base` records and the box in place of
  the alert; E1's expectations (C15). Each with `// v2.14 W2:`.
- `tools/import-file.mjs` (map check 9) A–F, each failing on the slot commit; D also closes the page with
  `page.close({runBeforeUnload:true})` while the write is held by a gate, and requires the `beforeunload` dialog (C23).
  `--gtk` (map check 10) written and run by hand, with `tools/xkeys.py`. `tools/panels-render.mjs` drives `#impFilePanel`
  (fullImportUndone with a one-entry W carrying `.full`); `tools/standards-check.mjs` opens it in its drive. `npm run check`'s box
  rule holds the new box.

**Mutations (51):** `v214-w2-` + `not-offered`, `ungated`, `mixed-offered`, `click-unchecked`, `picker-after-await` (written as
C28), `no-readback`, `readback-length`, `clear-before-write`, `clears-others` (re-aimed, check 1(c)), `race-unchecked`,
`reload-unmarked`, `rescue-missing`, `rescue-swapped`, `lists-from-memory`, `drops-cycles`, `own-plan-dropped`, `unstamped`,
`match-inverted`, `opens-clears-changed`, `opens-clears-nothing`, `hold-lsset-off`, `hold-persist-off`, `hold-boot-off` (each
removes its S2 line, its find written to match once), `hold-lift-unasked`, `hold-import-offers-file`, `as-it-was-skipped`,
`as-it-was-not-blocking`, `as-it-was-stale-screen`, `name-match-rushes`, `download-clears-now`, `download-unmarked`,
`marker-raw` (caught in audit-inject), `writer-unclaimed`, `adopt-any-page`, `shell-per-slot`, `shell-uncaptured`,
`room-unsaid`, `import-base-unrecorded` (the `.base` records left out of W → check 7), and, from the review: `hold-unlatched`,
`hold-no-storage-event`, `marker-after-pause`, `lift-leaves-copies`, `holds-unsaid`, `rescue-close-unasked`, `base-in-marker`,
`mixed-marks-base`, `e1-takes-lists`, `e1-takes-one`, `e2-base-unrecorded`, `room-not-on-opening`, `race-page-unchecked` — each
caught by the part named above. **Retargets (8, C27):** `handoff-copy-drops-store`, `handoff-copy-drops-exec`,
`handoff-copy-drops-ace`, `save-no-lt-escape`, `cycle-file-drops-store`, `bud-not-saved`, `dest-file-no-list`,
`writer-not-in-file` — the same defect each on `savedHtmlOf`'s new JSON line, each re-proved against the block that caught it (one
that still matches as it stands is left, and said).

**May touch:** the board (the functions above, `#impFilePanel`, `t-full`), `audit-import.mjs` (its slot; the v1.95 W2 block; E1's
expectations), `audit-recon.mjs` (E1's expectations only), `audit-inject.mjs` (its slot), `tools/import-file.mjs` and
`tools/xkeys.py` (new), `panels-render.mjs`, `standards-check.mjs`, `hostile.mjs`, `mutate.mjs` (its slot and the eight retargets
in place), its notes and proofs.
**Must not change:** the S2 and S11 call sites and stubs' names and signatures, S3, S4; lsAll/lsSet/persist; `_saveInPlaceFileRun`;
R1 (DATA's storage-first data pack); the saved format beyond `impFile` (written only when asked) and `savedHtmlOf`'s optional
third argument (every ordinary save as the slot commit's: check 9).

## 7. W3 — browser storage refused or full: counted, nothing on screen lost unasked

**Scope.** Item 141 F: persist() refusals counted; `memOnlyNow()`; the browser asks before the page is left while work is on
screen only, or while the file route holds the only copy of something (`impFileHolds()`, S11, C23); nothing reopens the page over
it unasked (switchAppn, cycGoAppn, and the three import doors through S4); switchAppn never reopens after a refused write; the
writer key and the editor name kept for the page; Clear this computer's wording. Item 141 G: Save diagnostics' storage by kind.
Item 140 (c): a refused all-or-nothing write leaves the board as saved as it was, and lsSet's warning is not said inside one.

**Functions:** map.md › storage-full › Functions 1–6, 8–13, 18, 19, and `penNote` in `_driveStorePushRun` (`+wkMemSay(may)`);
the S3/S4/S5 seams are the slot's (W3 writes `memOnlyLeave` and its `addEventListener` after `reopenPage`, fills
`memOnlyBlock`'s body, and sets `_wkMem` in `writerKey`). `memOnlyLeave` asks when `!_leaving && (memOnlyNow() || impFileHolds())`.
From save-target: `lsMarks`, `lsMarksBack`, `_lsAllRun++`/`--` in lsAll and lsPutBack (try/finally), the `if(!_lsAllRun)` guard
on lsSet's warning, and importBoards' late refusal (map.md › save-target › Functions 11). lsSet's fourth argument `o` and
`if(o && o.quiet) return false;` directly after the `DIAG.refused.push` line.

**Behaviour and sentences:** map.md › storage-full › Design 1–10 (S1, S2 and its `_dlOnly` confirm, S3, S6, S7, the by-kind
lines; S8 is the slot's `wkMemSay`), and save-target › Design (c), verbatim. A held write (S2) is on screen only by the same rule:
`_persistFail` for the plan, `_lsRefused` for a list.

**Checks**, each failing on the slot commit unless a CONTROL:
1. audit-board `v2.14 W3 — storage full: a change browser storage refuses is counted, and nothing reopens the page over it unasked (item 141 F)` — map check 1, parts (a)–(g2), (i), (k1)–(k3), with: (c) and every switching part driving `#appnSel` as a person does (`value='FULL FUND'`, then a `change` event) and asserting it reads O&M again (C30c); (k3) importing a **JSON state file** through importState (C30b: it meets S4's guard before and after W2's E1); (l) with `impFileHolds` stood in as true (`impFileHolds=function(){ return true; }`) and nothing on screen only, `memOnlyLeave` sets the event's `returnValue`; with `_leaving` set it does not (`leave-ignores-file`).
2. audit-board `v2.14 W3 — storage full: the writer key and the editor name are kept for the page (item 141 F)` — map check 2.
3. audit-board `v2.14 W3 — storage full: switching appropriation never reopens the page after a refused write (item 141 F)` — map check 3, driving `#appnSel` (C30c).
4. audit-other `v2.14 W3 — Save diagnostics counts browser storage by kind and names no key that is not ORBIT’s (item 141 G)` — map check 4.
5. audit-import `v2.14 W3 — a refused import leaves the board as saved as it was, and never says to Save (item 140 c)` —
   save-target's check 5, plus storage-full's A(h) (an lsAll refused at room 200 and put back: `memOnlyNow()` false). It asserts
   the status line and STAT_LOG, **never the alert** (W2 replaces the alert with the box), and closes any box it opens.
- Existing check moved: audit-board ~5315 (v2.05 item 116 "go to"): the stub returns true
  (`switchAppn=function(a){ window.__sw.push(a); return true; };`), with `// v2.14 W3:`.
- `tools/storage-full.mjs` (map check 5) A, B, B2, W, each failing on the slot commit; both pickers stood in (C14); B asserts
  `$('#appnSel').value`, never `APPN` (C30c).

**Mutations (34):** `v214-w3-` + `persist-uncounted`, `memonly-persist-ignored`, `memonly-counts-opening`,
`memonly-side-ignored`, `boot-gen-unset`, `beforeunload-off`, `leaving-ignored`, `reopen-not-leaving` (on S3's line),
`switch-unguarded`, `switch-reloads-refused`, `switch-box-stays`, `quiet-uncounted`, `dl-no-question`, `cycgo-mark-first`,
`cycgo-mark-left`, `writerkey-remade`, `writerkey-retries`, `pen-reads-storage`, `name-not-kept`, `name-storage-first`,
`import-full-unguarded`, `import-take-unguarded`, `import-state-unguarded` (on S4's lines), `clear-onscreen-unsaid`,
`diag-foreign-as-orbit`, `diag-copy-precedence`, `diag-stamps-uncounted`, `diag-kinds-missing`, from save-target
`marks-not-restored`, `marks-dirty-kept`, `marks-side-kept`, `import-says-save`, `batch-marks`, and from the review
`leave-ignores-file` (`|| impFileHolds()` removed → 1(l)). **Retarget (1):** `v205-116-go-no-mark` (cycGoAppn rewritten; find
`  lsSet(CYC_GO_KEY, k, 'Which board opens PPBE cycles next', {quiet:true});\n`, repl ''), proved against v2.05 item 116 "go to"
once its stub returns true.

**May touch:** the board (the functions above), `audit-board.mjs`, `audit-import.mjs`, `audit-other.mjs` (their slots; the
5315 stub; audit-other's diagnostics block only if the by-kind lines move it), `tools/storage-full.mjs` (new), `mutate.mjs` (its
slot and the retarget in place), its notes and proofs.
**Must not change:** the S2, S3, S4, S5, S11 lines; `cycApplyAll`'s own restore (left in place, redundant); the other direct
storage writes (§9 D17); `fileMark`, `fileStored`, `sideWrote`; the import functions W2 owns.

## 8. W4 — the held findings

**Scope.** Item 129: two tabs (the record read fresh: `baseMarkDirty`, which also writes the blank mark, C17); the twin rule, the
chain walk and the copy stamp; the rolled added requirement. Item 124: Put back by id; a hand-chosen "no SI code" in a PMO copy
travels through submit and accept. U63 and U64: a shared-folder copy that replaces work saved only in the board file keeps it
aside (U19's rule), and Put this back says where 💾 Save writes. U35: the RCN / EEIC list keeps typing across a redraw, by its row.

**Functions:** map.md › held › Functions 1–30, exactly as written there, except `baseMarkDirty`'s body (C17): the map's body, with
`const bl=pageBlankNow()===true;` read inside its try, `(b.blank===true)!==bl` added to the conditions that rewrite the record,
and `blank:bl` in the record it writes (always written, `true` or `false`: `baseSet` merges, so a mark left out would survive).
`baseMarkDirty` is the one record writer (C1).

**Behaviour and sentences:** map.md › held › Design A–G, verbatim (the "Not put back" line, the two hover titles and "not put back
here", the SI words, every U63/U64 sentence, the U35 sentence). No guide text.

**Checks**, each failing on the slot commit unless a CONTROL:
1. audit-import `v2.14 W4 — two tabs: work typed in one after the other opened a newer file stays unsaved, and Save asks (item 129)` — map check 1, (a)–(f), plus (g): with `pageBlankNow` stood in as true, an edit records `blank:true`; stood in as false (the stub), an edit over a record holding `{file:0, dirty:true, blank:true}` records `blank:false` (`base-blank-ignored`, `base-blank-sticky`; the slot's save line leaves the stale mark).
2. audit-import `v2.14 W4 — two copies out at once: each copy’s continuation is its own work, and a rolled added requirement is the same work (item 129)` — map check 2, (a)–(g).
3. audit-board `v2.14 W4 — Put back finds an added requirement by its id, and refuses once it is gone (item 124)` — map check 3, (a)–(h).
4. audit-import `v2.14 W4 — a hand-chosen “no SI code” in a PMO copy is sent, reviewed and accepted, apart from “follows the rules” (item 124)` — map check 4.
5. audit-import `v2.14 W4 — a shared-folder copy that replaces work saved only in the board file keeps it aside, and Put this back says where Save writes (ledger U63, U64)` — map check 5.
6. audit-board `v2.14 W4 — the RCN / EEIC list keeps what is typed across a redraw, by its row (ledger U35)` — map check 6.
- `tools/keyboard-reach.mjs` section W (map check 7), failing on the slot commit.
- Existing checks moved, each with `// v2.14 W4:`: audit-board "v1.97 W4 — a figure journalled before the list changed …"
  (`'custom.'+id+'.ask.0'`); audit-import "v2.09 review — Apply into a year it starts …" (the added line under `['custom', nid]`,
  not offered); "v2.09 review — a link to another of the office’s proposals …" (the id path); and the 18 checks U63's keep meets
  (map check 8): start their fixtures from the folder's own copy (`driveStorePush`, or `driveBaseSet(ap, MS.ts)`) with
  `// v2.14 (ledger U63)`, except U30 (5d), whose expectation changes because it is exactly the newly kept case.
- `math-defects.json`: entries for the two money defects this fixes, written as the person saw them, each naming its check and
  mutations — `put-back-lands-on-the-next-added-requirement` (check 3; `v214-w4-jrnl-by-place`, `-jrnlset-gone`) and
  `roll-forward-skips-or-doubles-a-continuation` (check 2; `v214-w4-twin-yearhas`, `-rolled-hit`). `npm run defects` passes.
- `npm run fuzz` twice (two seeds, printed): the journal now files added requirements by id.
- For the ship notes (D28): an ORBIT older than v2.14 open on the same browser should not put back a line v2.14 journalled by id
  (`['custom','NEW-2', …]`): v2.13's `jrnlSet` walks a string into the list, reports it put back, and changes nothing.

**Mutations (40):** `v214-w4-` + `base-cache`, `base-file-kept`, `base-folder-kept`, `base-file-unread`, `twin-yearhas`,
`twin-linkof`, `linkof-self-other-year`, `twin-nafrom`, `chain-stamp`, `stamp-pub-blind`, `stamp-unknown-apart`, `rolled-hit`,
`rolled-any`, `jrnl-by-place`, `jrnl-ids-dup`, `jrnlset-gone`, `jrnl-whole-offered`, `jrnl-old-place-offered`,
`jrnl-gone-silent`, `si-none-absent`, `si-door-refused`, `si-fmt-none`, `si-fmt-rules`, `si-proposal-unsent`,
`si-proposal-unaccepted`, `si-proposal-unshown`, `pull-keeps-nothing-saved`, `pull-not-said`, `pull-occupied-words`,
`kept-saved-unmarked`, `restore-keeps-nothing-saved`, `restore-says-folder`, `rcn-not-marked`, `rcn-no-hold`, `rcn-by-place`,
`rcn-dlgpend`, `rcn-lost-silent`, `rcn-change-in-draw` — finds and repls as map.md gives them (those on `baseMarkDirty`'s body
re-written to its C17 text) — and, from the review, `base-blank-sticky` (`blank:bl` left out of the record written → 1(g)) and
`base-blank-ignored` (`bl` always false → 1(g)). **Retargets (7):** `unsaved-flag-never-set`, `v202-e7-u24-load-uncounted`,
`v202-e7-u24-load-session-only`, `v200-r5-restore-gen`, `v200-r5-restore-basedirty`, `restore-no-keep-aside`, `restore-own-stale`,
as map.md gives them, each re-proved. No retirement.

**May touch:** the board (the functions above), `audit-board.mjs`, `audit-import.mjs` (their slots; the moved checks above),
`tools/keyboard-reach.mjs` (W), `math-defects.json`, `mutate.mjs` (its slot and the seven retargets in place), its notes and
proofs. The sketch (`proto/held-sketch.diff`) is the reference.
**Must not change:** the boot PUB block (W1's), the S10 lines, `_saveInPlaceFileRun`, persist, lsSet/lsAll; the RECORD panel's
and the rows' F2 hold behaviour (no data-rk there); the kept slot's one-copy rule.

## 9. Decided in the contract (the maps' open questions, answered; reversible by Brad)

- D1. The first Save of each file in each browser goes through an Open window (save-target Q1; also put to Brad, §12 Q1).
- D2. v2.14 never adopts the shared `FNAME` entry (Q2). Each file's first Save in each browser asks once.
- D3. Save asks after a deliberate deletion too, once (Q3): it cannot tell a deletion from work never on screen. That includes a
  deleted added requirement (C24).
- D4. A board file opened over **blank work** — work typed on a page whose board came from no saved copy, marked `blank:true`, and
  carrying no data pack DATA would take — opens its own file and keeps that work aside (Q4, the stray rule, C17). Any other newer
  copy in storage opens as in v2.13 (and Save's HOLD ON and (b) ask before it writes).
- D5. v2.14 releases an `FNAME` entry only when it names the file just written (Q5).
- D6. E1: on an empty board in an **empty browser** a whole board file goes through the full import (file-route Q1); with anything
  in the browser, or a one-appropriation file, it goes through E2, which merges the lists as v2.13 does, all or nothing (C18).
- D7. The as-it-was step is saved or explicitly declined before Write (Q2).
- D8. The new file records the importing browser as its writer (Q3).
- D9. The suggested name is "<imported file's name> (ORBIT v2.14).html"; the box warns never to choose the imported file (Q4).
- D10. After a storage-route landing with less than 64,000 characters free: say so, trim nothing (Q5).
- D11. The real-dialog check runs by hand, once per version, recorded in the notes (Q7).
- D12. A full import while the hold stands is refused (Q9). Storage that cannot be read at all gets no file route (Q10).
- D13. Imports that reopen the page are refused while a change is on screen only, until 💾 Save (storage-full Q1).
- D14. After a downloaded copy, switching or importing asks once (Q2).
- D15. persist() stays a direct write and counts its refusal with lsSet's entry (Q3): through lsSet it would count the edit twice
  and an import's capture would take it.
- D16. S8 is said at the claim (Q4). Save diagnostics prints counts only, no limit (Q5).
- D17. The other direct storage writes (baseSet, keepAside's `.kept`, jrnlMarkSeen, pmoMineSet, uiPrefWrite, the stopped-import
  marks, `SIDE_OPEN_KEY`, the menu groups) stay as they are in v2.14; logged for later. baseSet's refused clean mark after a
  file Save is not changed: its outcome (hazard C) is conservative and loses nothing.
- D18. Exceptions to "every write through lsSet/lsAll": persist (D15); impRoomSay's probe (a probe, not work — counting it would
  put a false refusal in diagnostics); removals (`removeItem` cannot be refused for room).
- D19. Whole added-requirement journal lines, and lines filed by place before v2.14, are not offered for Put back (held Q2, Q3).
- D20. A folder copy replacing work saved only in the board file does not clear LASTKNOWN (held Q4): the work is kept aside.
- D21. Two tabs of one browser still write one storage key (last writer wins); a general `storage` listener is logged for later
  (held Q5). The one listener v2.14 adds is the hand-over hold's (C21).
- D22. driveStorePull's shell branch is unchanged (C10).
- D23. The file route's write is not a board save (C12); the marker and writer key go through one lsAll (C13), written straight
  after the verified read-back (C20).
- D24. Lifting the hand-over hold removes this browser's copies that are unchanged since the import was written (C22).
- D25. A page that has seen the hold's marker stays held until it is closed or the hold is lifted in it (C21).
- D26. While the file route holds the only copy of something, leaving the page asks (C23).
- D27. "Save as a new file…" is remembered for the page it was pressed in only while that page is open (C25).
- D28. An ORBIT older than v2.14 putting back a v2.14 journal line for an added requirement reports success and changes nothing;
  the ship notes say so, and nothing is changed for it (§13 DL7).

## 10. Rules for every builder

- Read `CLAUDE.md`, `AGENTS.md` and `WORK-ASSIGNMENTS.md` first. The rules that bite here: escape where drawn (`esc`; `jsa` for
  every handler value; `confirm()`/`alert()` text never escaped); maps keyed by a value from a file are `Object.create(null)`
  or read by own key; a new box is `body > .modal-bg[id]` with `.modal`, `<h3>` and `h3 button.x`, and a field it saves only with
  its own button has `data-held="1"`; new storage keys start `prio27` and carry `SIDE_SFX`; nothing called from `render()` or
  while the board opens may throw or read a `let`/`const` declared below it; a `var` set while the board opens is declared above
  the line that sets it (§2); a whole-store adoption decides and keeps aside after its last wait; replace kept work only after
  asking.
- **Before building, reproduce your v2.13 failures** on the slot commit with the map's repro scripts (`recovery/v209/held/`,
  `recovery/v214/proto/`), and record each in the notes.
- **Checks:** each new check fails on the slot commit (name it in the notes) unless labelled a CONTROL. Fixtures make the
  alternatives disagree: a guard that tells two kinds of record apart is checked with both kinds (C17's (ii)–(iv)). Read exports
  and written files back from their bytes. A browser check seeds storage from a page of its own after load (`seedLs`), never
  from an init script, and installs both pickers (C14, with C30a's named exception). Fire a browser event jsdom does not fire
  where the browser fires it (a `storage` event, a `change` on a select). Drive a control as a person does (a select's value and
  its `change` event), never the function behind it. A check that needs a store the board reads while it opens (IndexedDB,
  storage room) installs it through S7's `idb` / `quota`, never after boot.
- **Mutations:** text only. Never import or run `mutate.mjs`, `npm run mutate` or `validate:math`. Ids single-quoted, in your
  slot, each find matching once. Build a mutant with `recovery/v200/bin/mkmut.py`. **A mutant must still parse**: before proving
  it, run `node tools/check.mjs <mutant.html>` and require its "the script parses" line to pass; one that does not parse is
  rewritten, never proved (C28). Prove each with
  `JOBS=1 HEAP=8192 python3 -I -B recovery/v208/bin/prove.py recovery/v214/proofs-Wn.json recovery/v214/proved-Wn.jsonl`
  against its own block; a retarget is a new mutation and needs its own proof. A catch counts only from a run where the block named
  failed a check, never from a boot that failed. After your last edit, mcount must report every target once: 3220 at the slot
  commit plus yours (W1 33, W2 51, W3 34, W4 40; 3378 after the four merge, 3379 with the lead's one).
- **Memory and the box:** at most two builders at once (W2 and W4 first, the largest; W1 and W3 as each finishes). One jsdom
  suite at a time each; `NODE_OPTIONS="$NODE_OPTIONS --max-old-space-size=8192"` for audit-board, audit-import and audit-recon,
  4096 otherwise; a suite that dies (exit 134/137) is rerun once, alone, before it means anything. Two `prove.py` runs never
  share a tree. If `git rev-parse --is-shallow-repository` says true, `git fetch --unshallow` first.
- **Before you stop:** `npm run check`; your blocks; every suite you touched, whole; the browser checks your change can move
  (`panels`, `dialogs`, `leftmenu`, `menus`, `keys`, `layout`, `standards`, `controls`, `editors`, `dropdowns`, `pmosave`,
  `pmoyears`, `pointer`, as relevant, and your own tool by `node tools/x.mjs` — no npm script yet); mcount; audit-inject whole;
  notes; one or more commits on your branch, each message ending with the attribution lines this session uses
  (`Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and the `Claude-Session:` line). Do not push.
- **The guide:** your allowance (C11), measured in a booted board (`helpDoc.innerHTML.length`).

## 11. Integration (the lead)

1. **Order:** W3, W4, W1, W2 when several are ready (the plumbing first, the largest last, so its whole-suite run sees everything);
   otherwise as each finishes. After each merge: `npm run check`; mcount (all once); audit-inject whole; the merged workstream's
   blocks and every earlier workstream's blocks (slimmed). **Once W1 and W2 are both in**, before anything else: audit-recon's
   "v2.00 (U32, U33) — an RCN / EEIC list that repeats a key …" whole (it imports through the storage route and reopens the
   importing board file — the case C17 settles: on the unguarded rule it failed 60 checks), and INT-7, INT-8, INT-9.
2. **package.json:** scripts `savetarget`, `fileimport`, `fileimport:gtk`, `storagefull`; `verify:grid` gains `savetarget` and
   `fileimport` after `pmosave`, and `storagefull`.
3. **Integration checks** (the lead writes them in the integration slots; each fails on the slot commit unless labelled, and each
   labelled one has a mutation that makes it fail):
   - INT-1 audit-import `v2.14 INT — after a full import that lands, the board reads unsaved, takes no other file’s save as its own, and its first Save writes the program it ran in without a question (items 140, 141)` (W2's records, W1's case 3 and D, W4's writer).
   - INT-2 audit-import `v2.14 INT — a refused full import leaves the board as saved as it was and offers the new file (items 140 c, 141)` (W3's restore with W2's box: `unsavedNow()` false, the box open, no lsSet warning).
   - INT-3 audit-import `v2.14 INT — a page with no saved board records its work as blank, so an older board asks before writing it over its file and a v2.14 board file keeps it aside (item 140)` (W1's case 3 and flag with W4's writer): (a) a blank page's switchYear records `{file:0, dirty:true, blank:true}`; (b) that page reopened, an edit keeps `blank:true`; (c) after it saves in place (D), an edit records the file and `blank:false`; (d) the v2.13 board from `git show c863dc2` on (a)'s storage asks HOLD ON before its Save; (e) a v2.14 board file on (a)'s storage keeps the blank work aside. Also `savetarget` E in Chromium. (W1's `blank-*` and W4's `base-blank-*` are re-proved here in §11.5.)
   - INT-4 audit-board `v2.14 INT — a tab held by the hand-over has its change on screen only, and leaving it asks (item 141 C, F)` (W2's hold with W3's prompt).
   - INT-5 audit-import `v2.14 INT — a full import is refused while a change is on screen only, before the file route is offered (item 141)`.
   - INT-6 audit-import `v2.14 INT — the import’s new file saves in place twice, asking nothing (items 140, 141)` (W2's file with W1's first Save and (b)).
   - INT-7 audit-import `v2.14 INT — a full import that lands through browser storage, run from a populated board file, opens as the import when that file is reopened, and its next Save writes the import in every appropriation (items 140, 141)` — w2Fx's OLD.html imports NEW through `fullImportText`, then `boot({html: OLD, ls: after})`: NEW's plans, notes and allocations in every appropriation, `DATA.items` NEW's, nothing kept aside, and the next `buildSavedHtml()` carries NEW in every appropriation. CONTROL on the slot commit (v2.13 lands it); fails with C17's two guards removed (`v214-int-stray-unguarded`; the attackers measured om OLD, ff NEW).
   - INT-8 audit-import `v2.14 INT — import into the program, save it, choose the cycle for every appropriation, open Full Fund: Full Fund shows the tag and nothing is kept aside (items 136, 141)` — Brad's main path (the attackers' `mainpath.mjs`). CONTROL on the slot commit; fails with `v214-int-stray-unguarded`.
   - INT-9 audit-import `v2.14 INT — blank work over a requirement list from another board never mixes the two when an older board file opens (items 140, 141)` — a record marked blank over a plan whose data pack holds another board's requirements, then an older board file: `DATA.items`, `S.order`, `S.alloc` and the next saved file are all one board's (storage's). CONTROL on the slot commit (v2.13 opens storage's board whole); fails with W1's `stray-over-pack` and with `v214-int-stray-unguarded`.
   - INT-10 audit-import `v2.14 INT — while the file route holds the only copy of a file it chose, leaving the page asks (item 141)` (W2's `impFileHolds` with W3's `memOnlyLeave`): during a gate-held write, after a failure until both rescues are downloaded, and not after.
4. **Then, whole:** every jsdom suite (`npm run audit`; board, import and recon at 8 GB); `boot-same`; the browser checks:
   `verify:grid` (it stops at layout's carried D ×8), then `keys`, `dropdowns`, `dialogs`, `leftmenu`, `menus`, `panels`,
   `pmosave`, `pmoyears`, `pointer`, `standards` (nothing new), `savetarget`, `fileimport`, `storagefull` one by one;
   `fileimport:gtk` and the Open-window proof by hand. C16's sweep of stand-in Save blocks.
5. **Every v2.14 mutation and retarget proved together on the merged board** (`recovery/v214/proofs-INT.json`,
   `proved-INT.jsonl`): 159 new (W1 33, W2 51, W3 34, W4 40, INT 1) and 17 retargets (W2 8, W3 1, W4 7, the slot's 1). A mutation a
   later workstream put out of its own check's reach is fixed in the check, not dropped. mcount 3379, all once.
6. **The rest of the gate stages:** `coverage:money`, `money-map --check`, `defects`, `trace`, `fuzz` (two seeds), `verify:file
   --selftest`; the guide's size (C11).
7. **Review with skeptics** (two rounds, each finding re-run by two skeptics trying to refute it), fixes as `v214-rv*` mutations
   proved the same way. Then `BUILD='v2.14 (<date>)'` once; the CLAUDE.md v2.14 section; NEXT-VERSION.md: items 140, 141, 129,
   124 to Shipped, with what was built differently from the log and every "Decided" (D24–D28 among them, and D28's sentence about
   older versions); the ledger rows U35, U63 and U64 marked built in v2.14; R1, D17/D21 and §12 Q6 logged as their own items;
   `WORK-ASSIGNMENTS.md`'s status; `npm run validate:nightly` on the final tree.
8. **The sweep's first batch** (handoff decision 27, accepted: "about 100, v2.12's retargets and the newest ids"), on the
   committed final tree with nothing else running, through `sweep-shards.mjs`, in saved batches: v2.12's 14 retargets, v2.13's
   6, v2.14's 17, and 63 of v2.14's new ids — the data-loss paths first (W1's write and ask and the stray rule's two guards, W2's
   verify, marker, clear and hold, W4's journal and twin). It reports and changes nothing.
9. **PR**, with the attribution line. The merge is Brad's word.

## 12. Questions for Brad (each with a recommended answer; the build does not wait for them)

**Answered under Brad's go (3 Nov 2026: "Go" — build straight through, taking each recommended answer, and say which):**
Q1 yes (the first Save goes through an Open window; the question's wording is checked against the by-hand proof before it reaches
him); Q2 is his to do and is put on his list before merge; Q3 yes (R1 logged as item 142, for v2.15); Q4 accepted; Q5 yes (a
second sweep batch after the first reports; both run only on a committed tree with nothing else running); Q6 yes (fixed in v2.15).
The slot commit's sha: see §2's proof line once it exists.

1. **The first 💾 Save of each board file, in each browser, asks you to pick the file you opened** (an Open window: picking it
   changes nothing; ORBIT reads and checks it, then the browser asks once whether ORBIT may edit it). After that once, Save
   writes straight to it. OK? *Recommended: yes* — the Save window empties the file you choose the moment you choose it, so
   nothing could be checked, and that is how one ORBIT file wrote over another. (Whether the browser asks on that first press or
   needs a second press of 💾 Save is recorded by the by-hand Chromium proof, §5; the question is reworded from it before it goes
   to you.)
2. **A Windows check before merge, which only you (or someone you name) can do:** on your work machine, with synthetic disposable
   boards we provide, (a) import a board too big for browser storage, write it into a new file, open it and Save twice; (b) make
   the first Save of a file through the Open window. And tell us: Chrome or Edge, and its version; whether it is managed by
   policy (if file writing is blocked, everything goes by download); whether the save window asks "replace?" for an existing
   file; and whether your board files open from a drive letter or a \\server address. *Recommended: yes, before merge.*
3. **Log R1 as item 142 for v2.15?** A newer board file opened in a browser that holds an older copy of a different board shows
   that copy's requirement list (measured: 60 of 115, wrong totals). v2.14 closes the import's own routes to it (the marker is
   written before any pause or clear, and lifting the hold removes this browser's unchanged old copies), keeps the board's own
   opening from mixing two boards (the stray rule never fires over storage's list), and makes 💾 Save ask, naming the requirements,
   before it writes a shorter list over the file. The opening itself still shows the stored copy's list. *Recommended: yes, in
   v2.15.*
4. **The one kept slot, accepted knowingly** (U19, now U63/U64 too): work saved only in the board file is kept aside when a
   shared-folder copy replaces it; while it is kept, a newer folder copy over unsaved work waits ("not loaded", nothing lost)
   until the kept copy is put back, saved as a file or discarded. *Recommended: accept* — nobody works out of a shared folder
   today.
5. **Name a second sweep batch** for the v2.14 mutations the first batch of 100 does not hold (about 95, roughly seven hours),
   to run after the first reports? *Recommended: yes.*
6. **After a full import lands and you save, the first Save of another appropriation you changed asks "HOLD ON — this browser
   cannot tell…"** (measured on v2.13 and on the v2.14 prototype alike: Full Fund's record names no file, because the import's
   Save recorded only the appropriation on screen). Nothing is lost; you press OK. Fix it in v2.15 by having 💾 Save record every
   appropriation it wrote exactly as this browser held it? *Recommended: yes, in v2.15* — it is a false alarm on your main path,
   and v2.14 is about losing nothing.

## 13. Review of the contract (3 Nov 2026)

Three attackers read this file against the board at `c863dc2` (lenses: data loss, tests, feasibility), each building scratch boards
and running them. Every must-fix and should-fix is fixed above; every note is answered. The three must-fixes were one defect seen
three ways; it was re-measured on a prototype of the fix before it was written in (`proto/revise-stray-patch.py` builds the boards:
C6's record, S10's flag above the opening, W4's writer with the mark, W1's case 3 and stray rule; variants drop each guard):

| Prototype | attackers' `stray-import.mjs` (old board imports new, reopened) | `mainpath.mjs` (Brad's path, Full Fund) | `revise-stray-blank.mjs` case 1 (blank work, older board file) | case 2 (blank mark over another board's data pack) |
|---|---|---|---|---|
| v2.13 | NEW on screen; Save NEW/NEW | tagged | blank plan opens over the file | storage's board, whole |
| C17 (both guards) | NEW; Save NEW/NEW | tagged | file opens, blank work kept aside | storage's board, whole |
| no blank test | NEW (the pack guard holds here) | tagged | kept aside | storage's board, whole |
| no pack guard | — | — | kept aside | **mix**: DATA from storage, plan from the file |
| neither guard (the contract as reviewed) | **OLD om, NEW ff**, import kept aside | **untagged**, kept aside | kept aside | **mix** |

`revise-stray-carried.mjs`: the blank mark survives a reopen of the blank page and is written `false` once the page has a file.
Writing the prototype found the var trap (§2): `var _pageBlank=false;` beside `let FH` reset the flag the opening had set.

| # | Lens | Severity | Finding | Done |
|---|---|---|---|---|
| DL1 | data loss | must-fix | The stray rule fires on C6's import records (and on cycApplyAll's copies of them): a landed storage-route import reopened in a board file shows the old plan, and the next Save writes a mix; Brad's main path opens Full Fund untagged | C17: a positive `blank` mark from a page whose board came from no saved copy (S10, W1's flag, W4's writer), plus DATA's own data-pack test; INT-7, INT-8; W1 5(ii)–(v); W4 1(g); mutations `stray-any-record`, `stray-over-pack`, `blank-*`, `base-blank-*`, `int-stray-unguarded`. Measured above. |
| DL2 | data loss | should-fix | The hold lifts the moment the new file opens, so the importing page (left open by design) writes an older plan over it | C21: a page that has seen the marker stays held for its life (boot, a write, the `storage` event); W2 check 2(h) extended both ways; `hold-unlatched`, `hold-no-storage-event` |
| DL3 | data loss | should-fix | R1 still reachable through the import: the tab closed at the name-match pause, a crash before the clear, "lift the hold…" after a download | C20 (the marker straight after the read-back), C22 (the lift removes the unchanged copies), C24 (Save names the requirements a shorter list would drop); Q3 reworded; `marker-after-pause`, `lift-leaves-copies`, `drops-reqs-blind` |
| DL4 | data loss | should-fix | No "Leave site?" while the file route holds the only copy of a file the picker emptied | C23, S11: `impFileHolds()` read by W3's `memOnlyLeave`; ✕ with a rescue pending asks; W2 1(e), W3 1(l), INT-10, `fileimport` D with `runBeforeUnload`; `holds-unsaid`, `rescue-close-unasked`, `leave-ignores-file` |
| DL5 | data loss | should-fix | E1 replaces execution data and cost estimates whole where v2.13's door merged them | C18 (E1 only in an empty browser and for a whole board; E2 keeps the merge); W2 5(c)–(e); `e1-takes-lists`, `e1-takes-one`, `e2-base-unrecorded` |
| DL6 | data loss | note | The `.base` records in the marker's hashes give a false "another tab changed it" on the common path | C19: `.base` only in W, removed with its plan; `base-in-marker` |
| DL7 | data loss | note | A v2.13 tab's Put back of a by-id line reports success and changes nothing | D28: the ship notes say so (§8, §11.7). Nothing is lost; refusing it in v2.13 would need a path form v2.13 rejects, which is a `(`-prefixed line v2.14's own rules treat as unrecordable |
| DL8 | data loss | note | "Save as a new file…" binds the opened page's address to the dated copy | C25: a fresh pick is held in memory only; the success line says where later Saves go; `fresh-remembered` |
| T1 | tests | must-fix | The same collision (DL1), with R1 making it a mix of two requirement lists; no check reached it before integration | C17, INT-7, INT-9, W1 5(iv) |
| T2 | tests | should-fix | jsdom has no IndexedDB at opening, so the import file's adoption and `_fhKnown` were untestable; check 1(d) could not tell the two urls apart | S7 `idb`; W2 1(d) at two urls; W1 1 "Save writes to"; `known-unread` |
| T3 | tests | should-fix | W1's check 1 needs the no-Open-window fallback, which C14 forbade | C14's named exception, C30a; W2 check 2 part with `showOpenFilePicker` deleted |
| T4 | tests | should-fix | `switch-box-stays`' check called `switchAppn()` directly, so `#appnSel` never moved | C30c: drive the select; `storagefull` B asserts `#appnSel` |
| T5 | tests | should-fix | `picker-after-await` inserted `await` into a non-async function: the mutant would not parse | C28 (the timing moved without `await`); §10: a mutant must parse before it is proved |
| T6 | tests | should-fix | The room check runs in a reopened jsdom window with its own 5,000,000 quota | S7 `quota`; W2 check 6; `room-not-on-opening` |
| T7 | tests | should-fix | Check 1(c) required the `.base` records the design clears to stay byte-identical | C30e: the cleared set from the fixture's literals, `prio27sp.base`/`.kept`/`appn`/a copy key/the writer key as controls; `clears-others` re-aimed |
| T8 | tests | should-fix | audit-inject has no never-ran check and no `await`; an async W2 block would run after `process.exit` and pass | S8: `INJ_EXPECT` and its loop; C30f top-level `await` |
| T9 | tests | note | "Every ordinary save byte-identical to the slot commit's" had no check | W2 check 9 (pubState against the slot's board, no `impFile`) |
| T10 | tests | note | The Open window's permission branch is only ever stood in for | §5's by-hand proof logs `queryPermission`/`requestPermission`; Q1 is worded from it |
| T11 | tests | note | Which function re-checks the race was ambiguous, making `race-unchecked` possibly equivalent | C29; W2 check 2's race in two parts; `race-page-unchecked` |
| F1 | feasibility | must-fix | The same collision (DL1); audit-recon's U32/U33 block failed 60 checks on the merged prototype | C17; §11.1 runs that block first once W1 and W2 are in; INT-7 |
| F2 | feasibility | must-fix | E1 on a one-appropriation file wipes the other appropriations' execution data and BAE rows | C18 (the `only` file and any held list go through E2); W2 5(d) |
| F3 | feasibility | should-fix | Eight mutation finds on `savedHtmlOf`'s line, not six | C27; W2 retargets 8; §11.5 counts 17 |
| F4 | feasibility | should-fix | W1's tightened guard line unmatches `guard-not-a-board-writes` | C26: the line kept, the test on its own line |
| F5 | feasibility | should-fix | After E1, W3's k3 (another board through importState on an empty board) no longer meets importState's own guard | C30b: k3 imports a JSON state file |
| F6 | feasibility | note | The hold cannot guard `.base`; `.base` in the mixed mark would keep the stopped-import hold from lifting | C19 (as DL6), `mixed-marks-base` |

Counts after the review: 159 new mutations (W1 33, W2 51, W3 34, W4 40, INT 1), 17 retargets, mcount 3379 after integration; ten
INT checks; three new seams (S10, S11, and S7/S8's additions).
