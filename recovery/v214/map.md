# v2.14: the code map (items 140, 141, 129, 124; ledger U63, U64, U35)

Four read-only mappers, 3 Nov 2026, on `c863dc2` (main, `BUILD='v2.13 …'`). Line numbers are as of `c863dc2`: find code by
symbol. Nothing in the board or the tools was changed. `mutate.mjs` was read as text only (`mut-json.py`, `mcount.py`); at
`c863dc2` mcount reports `{"entries": 3220, "once": 3220}`.

**This file is the mappers' record. `recovery/v214/contract.md` decides.** Where the contract moves a function, a check or a
mutation to another workstream, drops a duplicate or answers an open question, the contract wins; its §4 lists every such
place. Each area below begins with a line saying what the contract changed in it.

Areas and the workstream that builds each (contract §1):

| Area (below) | What it covers | Built by |
|---|---|---|
| `save-target` | item 140 (a) the remembered save file per page, (b) Save's content check, the boot's record rules; item 141 D | W1 (its (c) goes to W3; its record writer `baseMark` is W4's `baseMarkDirty`) |
| `file-route` | item 141 A, B, C (the hand-over hold), E, the room check | W2 (its D goes to W1; its counters restore goes to W3) |
| `storage-full` | item 141 F (storage-full survival) and G (Save diagnostics by kind) | W3 |
| `held` | item 129 (four findings), item 124 (two), ledger U63, U64, U35 | W4 |

**Prototypes and repro scripts** the mappers and the 2 Nov investigation ran are copied, text only, into
`recovery/v214/proto/` (their paths inside still point at the session's scratch folder, which may be gone; each is a
reference, not a tool to run as is). The most useful:

| File | What it is |
|---|---|
| `proto/held-sketch.diff` | W4's whole design applied to a scratch copy of v2.13 (`board-p5`): fixes every repro; mcount 3213/3220, the 7 misses are the retargets |
| `proto/storage-full-patch.py` | W3's design applied to a scratch copy (`proto2.html`); every probe passes on it |
| `proto/save-target-m140.mjs` | the measured item 140 case in Chromium with a real IndexedDB (token stand-in handles installed from page code) |
| `proto/save-target-c-refused-import.mjs`, `-d-program-save.mjs` | (c) and D measured in jsdom |
| `proto/file-route-chromium.mjs`, `file-route-shell-door.mjs` | Brad's alert reproduced in Chromium from a board built in 1 s; E measured in jsdom |
| `proto/storage-full-probe*.mjs`, `-hazards*.mjs`, `-switchloss.mjs` | F's hazards in jsdom and Chromium |
| `proto/held-*.mjs` | U63, U64, U35, item 124's Put back and SI repros |
| `proto/q141-*` | the 2 Nov investigation: tabcheck (item 140's measurement), design-file-first (e2e, equiv, trap, hazard), verify-fix-0 (`picker4.mjs`, `xkeys.py`: the real GTK save dialog under Xvfb), the critic's headroom run and the size limit of every release |

Item 129's own repros are already in git: `recovery/v209/held/` (two-tabs `skeptic/k2-jsdom.mjs`, `k3-copy.mjs`; years
`js/t1..t5`, `skeptic-*/sk*.mjs`). `s2-two-tabs.mjs` and `s3-two-tabs-board.mjs` import a `./lib.mjs` that is not in their
folder and cannot run as kept; `k2` and `k3` reproduce the same finding and are self-contained.

---

## save-target

# Item 140, and item 141's parts on the same path: the remembered save file, Save's content check, the false "unsaved" after a refused import, the record another file wrote; item 141 D (Save into an ORBIT program with no board)

**Contract review (§13, C17, C24–C26, C30a):** the stray rule fires only on a record marked `blank:true` and never over a
storage plan carrying a data pack (S10's `pageBlankNow`, W4's writer); saveDrops also names requirements; "Save as a new file…"
is not remembered under the page; the `p===undefined` line is kept; check 1 takes the no-Open-window fallback on purpose.
**Contract changes here:** (c) — `lsMarks`/`lsMarksBack`, `_lsAllRun`, lsSet's warning guard, importBoards' late refusal,
their checks and five mutations — is W3's. `baseMark` is replaced by W4's `baseMarkDirty` (one record writer; the two
mutations `record-no-file` and `record-cached` are dropped as duplicates of W4's). `writerKey` is W3's. The `fullImportText`
`.base` records are W2's. The check part (iii) (two tabs) is W4's block. Part (i)'s record-after-change assertion and
`savetarget` E are integration checks. Everything else here is W1's.

### Measured on v2.13 before any design (throwaways outside the tree)
- **The measured case, with a real IndexedDB.** Script `…/m140/m140.mjs` (copy: `proto/save-target-m140.mjs`).
  - Setup: Chromium 153. The real `prio-fh` store and the board's own `_fhGet`/`_fhPut`. Stand-in handles are kept in the
    store as tokens and turned back into handles on read; they read and write real files through exposed Node functions;
    all of it is installed from page code after load.
  - A v2.12 board saved in place: `FNAME` → "ORBIT Live.html", 8,781,027 chars.
  - Then the v2.13 program in another folder: its full import is refused, it reads "Unsaved changes" (DIRTY true, record
    `{file:<old file's save>, dirty:false}`), and 💾 Save is pressed.
  - Result: the IDB log shows `B get FY27 Consolidated Prioritization Board.html`. With no window and no question it wrote
    3,878,541 chars into ORBIT Live.html: v2.13, O&M only, `cycDb {om:[]}`, no cost estimate, no execution data, no BAE rows.
  - The O&M it wrote is the old board's full O&M (115 requirements, 5 years, 600 journal entries). The old board's Save had
    persisted its plan into the shared storage key, so the v2.13 tab showed this browser's copy (case 2 below), and its
    LASTKNOWN rightly named the old file's save. The HOLD ON cannot catch this case; only (a) and (b) can.
  - The same script against a minimal prototype keying `_fhGet`/`_fhPut` by page address (`proto-a.html`): no write, the
    window offered, PASS.
- **(c).** `proto/save-target-c-refused-import.mjs` (jsdom, the repo's boot.mjs read only).
  - Before the refused import: DIRTY false, unsaved false, "not saved to a file yet".
  - After: DIRTY true, `_sideGen` 1→5, `_lsRefused` `['prio27acedb']`, "Unsaved changes".
  - STAT_LOG holds an UNREAD "⚠ The cost estimates could not be kept in browser storage … It is still loaded and correct
    here. Use 💾 Save to write it into the file". The board tells the person to press the Save that wrote over the old board.
- **D.** `proto/save-target-d-program-save.mjs`. Save to a stand-in holding the v2.13 program (pubState null, extractPacks
  null) gives "⚠ In-place save failed (Cannot read properties of null (reading 'writer')) — downloading a copy instead.":
  0 writes, 1 download.
- **The window empties the file.** Chromium empties an existing file the moment it is chosen in `showSaveFilePicker`
  (`verify-fix-0/picker4.out.json`: 8,793,759 → 0). So no check can read a file just chosen in the Save window. That is why
  the first save below goes through an Open window. A headed attempt at an Open-window proof (`opfs/openpick.mjs`) aborted
  the dialog before a choice; it remains to be proved by hand.
- **No real handle for tests.** OPFS (`navigator.storage.getDirectory`) is refused on file:// (SecurityError), so a real
  handle cannot be made for a test. The token stand-in above is the way.

### Functions (line numbers at c863dc2)
1. **`fhPageKey` (new), ~8220.** The key this page's save file is kept under in `prio-fh`. New, beside `FNAME` and `FH`.
   Returns `'page|' + location.href` with any `#…` and `?…` cut off, for a `file:`, `http:` or `https:` page. Any other page
   (`about:srcdoc` in the FYDP frames, `blob:`) gets `''`, which remembers nothing, so it always asks. The comment says why:
   every ORBIT file a browser opens shares `prio-fh`, and the `FNAME` key is the same in every version.
2. **`_fhPut`, 8221.** Body becomes `const k=fhPageKey(); if(k) _pfhPut(k, h);`. A null `h` deletes the entry, as `_pfhPut`
   already does. It never writes `FNAME`. The call sites keep their text (`FH=h; _fhPut(h);` and
   `FH=null; try{ _fhPut(null); }catch(e){}`), so the v209 mutation finds still match.
3. **`_fhGet`, 8222.** Body becomes `const k=fhPageKey(); if(!k){ cb(null); return; } _pfhGet(k, cb);`. It never reads
   `FNAME`. `takePen` (33323) and `_saveInPlaceFileRun` (10290) both go through it, so neither can reach another file's handle.
4. **`_pfhPut` / `_pfhGet`, 10446.** Unchanged and not renamed (mutation at mutate.mjs:7977 finds `_pfhPut(k, h)`). Add a
   comment that the board's own save file now goes through them under `fhPageKey()`.
5. **`fhLegacyRelease` (new), ~8223.** Releases the shared `FNAME` entry that versions before v2.14 save through, only when it
   names the file this page has just written:
   `_pfhGet(FNAME, old => { if(old && h && typeof old.isSameEntry==='function') Promise.resolve(old.isSameEntry(h)).then(same => { if(same) _pfhPut(FNAME, null); }, ()=>{}); });`
   wrapped in try. Called once, after `await w.close()`, in `_saveInPlaceFileRun`. It never writes `FNAME`, and leaves an
   `FNAME` entry that names any other file. Effect: an older ORBIT opened afterwards asks which file to write, and cannot
   write its old program over a file v2.14 has written (the item 141 review's case).
6. **`fhOwnName` / `fhNewName` / `fhSaveNew` / `fhRepick` (new), ~8224.**
   - `fhOwnName()`: `decodeURIComponent` of the last segment of `location.pathname` when it ends `.html` or `.htm`, else
     `FNAME` (in try/catch).
   - `fhNewName()`: `fhOwnName()` without its extension + `' — ' + new Date().toISOString().slice(0,10) + '.html'`.
   - `fhSaveNew()`: the same three refusals as `saveInPlaceFile` (`sandboxBlock`, `cycBlock`, `impMixedBlock` with the same
     words), then `saveSerial(function(){ return _saveInPlaceFileRun({fresh:true}); })`.
   - `fhRepick()`: `FH=null; try{ _fhPut(null); }catch(e){} return saveInPlace();` (the click is a fresh user gesture).
7. **`_saveInPlaceFileRun`, 10280.** 💾 Save into the board file. Signature becomes `(o)`.
   1. The handle: `let h=(o&&o.fresh)? null : (FH || await new Promise(res=>_fhGet(res)));`. The permission block is
      unchanged. Add `let picked='';`.
   2. No handle and not fresh, with `window.showOpenFilePicker` present: say FIRST_SAY, then
      `const hs=await window.showOpenFilePicker({multiple:false, types:[{description:'ORBIT board', accept:{'text/html':['.html','.htm']}}]}); h=hs&&hs[0]; picked='open';`.
      Otherwise (fresh, or no Open window): say NEW_SAY when fresh, or the fallback line when not, then
      `h=await window.showSaveFilePicker({suggestedName:(o&&o.fresh)? fhNewName() : fhOwnName(), …})` with the same types,
      and `picked='save'`.
   3. Line 10298 `FH=h; _fhPut(h);` runs only when `!picked`. A picked handle is remembered only once accepted (step 8).
   4. The read, the not-a-board refusal and the PMO-copy refusal keep their text. Tighten the not-a-board test to
      `if(p===undefined || (p!==null && typeof p!=='object'))`.
   5. D, after the copy check: `let bare=false, baked=null; if(p===null){ baked=extractPacks(txt); bare=!baked; }`. Line
      10345 becomes `const fw0=p? writerShape(p.writer) : null;`. `fileTsOf(null)` is 0, so a null p asks no HOLD ON.
   6. Line 10364 becomes `may=writerMay(fw, !txt.length || bare, false, 'this board file')`, so a program with no board is
      claimed like a new file.
   7. The content check (b), after `const sideAt=_sideGen;` and before `createWritable`:
      `if(txt.length && !bare){ let q=null; try{ const mm=html.match(PUBSTATE); q=mm? JSON.parse(mm[1]) : null; }catch(e){ q=null; } const lost=saveDrops(txt, p, q, baked); if(lost.length && !confirm(saveDropsAsk(h.name||FNAME, lost, baked))){ if(penLine){ WRITER=prevWriter; writerJournalUndo(penLine); } setStat(CANCEL_SAY); return; } }`.
      If q cannot be parsed, lost is `['the board on screen could not be read back to compare']` and the question asks.
   8. Write permission for an Open-window pick:
      `let ok=''; try{ ok=await h.queryPermission({mode:'readwrite'}); if(ok!=='granted') ok=await h.requestPermission({mode:'readwrite'}); }catch(e){ ok='later'; }`.
      `'granted'`: remember and write. `'later'` (no user gesture left): `FH=h; _fhPut(h);`, put the pen back as in step 7,
      say LATER_SAY, return. Anything else: put the pen back, do not remember, say DENIED_SAY, return. For `picked==='save'`
      the window already gives write access: remember (`FH=h; _fhPut(h);`) and write.
   9. After `await w.close()`: `fhLegacyRelease(h);`.
   10. In the catch, before the existing branches: when `picked==='open'` and the error is AbortError, say
       "Save canceled — nothing written." plus the Save-as-a-new-file link. When `picked==='open'` and the error is
       SecurityError or NotAllowedError, say PICK_BLOCKED_SAY. Every other branch is unchanged.
   11. Lines 10294-10297 (`if(!h){ setStat('💾 First save: pick THIS board file …'); h=await window.showSaveFilePicker({suggestedName:FNAME…}) }`)
       are rewritten by step 2. The old text stays only in the no-Open-window fallback, in the new wording.
8. **`saveDrops` / `saveDropsAsk` (new), ~10399.** What the file on disk holds that the bytes about to be written do not; and
   the question naming it. Pure, beside `_saveInPlaceFileRun`. Inputs: the file's text (for a one-appropriation file's slug
   via `_slugOfTitle`, else `mySlug()`), its parsed state p, the parsed state q of the bytes, and `baked` (extractPacks'
   result when p is null). Returns plain-text lines. `saveDropsAsk` builds the confirm text. Neither escapes: `confirm()` is
   not HTML (CLAUDE.md v2.00). CANCEL_SAY escapes the name.
9. **`baseMark` (new); save; loadCounted; driveRestore, 7786.** *(Contract: replaced by W4's `baseMarkDirty`.)*
   `function baseMark(){ try{ const b=baseGet(); if(b.dirty!==true || (+b.file||0)!==(+LASTKNOWN||0)) baseSet({file:+LASTKNOWN||0, dirty:true}); _baseDirty=true; }catch(e){} }`.
   Reads the record fresh, never the cached `_baseDirty`; writes `file` too, so the record names where the plan this page
   has just put in storage came from. Replaces `try{ if(!_baseDirty){ _baseDirty=true; baseSet({dirty:true}); } }catch(e){}`
   in save() (7793), in loadCounted (7786, which becomes `function loadCounted(){ _saveGen++; DIRTY=true; baseMark(); }`)
   and in driveRestore (33453). Shared with item 129 (two tabs) and U64.
10. **Boot: the copy that opens and what Save checks against, 7425.**
    1. Declare `let _bootFile=false;` with the other `_boot` lets. Set `_bootFile=true;` right after each
       `LASTKNOWN=PUB_FILE_TS;` (7462 and 7467).
    2. After the PUB block, before `if(SANDBOX) pmoAdopt();`: `if(!_bootOwnRead && !_bootFile){ LASTKNOWN=0; _baseDirty=false; }`.
       The board on screen then came from neither this file nor this browser's copy (a program with no board, or a file this
       board refused). Nothing is written: the record is left as another page wrote it until this page's first save()
       rewrites it.
    3. The stray rule. Before the PUB block, `const _bootStray=_bootOwnRead && _bootBase.dirty===true && !(+_bootBase.file);`.
       The first condition becomes `if(fileTs > ours || (_bootStray && fileTs < ours)){`. Storage then holds work never saved
       to any file (typed on a page with no board, or the leftovers of an import) that is newer than this file. The file
       opens and that work is kept aside, through the existing branch: `ownUnsaved` reads `base.dirty`, `keepAside`,
       `_bootKept` and its message. `'occupied'` or no room goes to `_bootHeld`, unchanged.
11. **`lsAll`; `lsPutBack`; `lsSet`; `lsMarks` / `lsMarksBack` (new), 3040.** *(Contract: W3's.)*
    - New `var _lsAllRun=0;` beside `let _lsCapture=null;` (2964). A var, because lsSet runs while the board opens.
    - New `lsMarks()` returns `{gen:_saveGen, dirty:DIRTY, dl:_dlOnly, side:_sideGen, ref:Object.assign({}, _lsRefused)}`,
      or null (try/catch: null before those lets exist). New `lsMarksBack(m)` sets each back, sets `_cycAllMemo=null` and
      calls `saveStateShow()`; nothing for a null m.
    - lsAll: `const mk=lsMarks();` after the read of `held`, and `_lsAllRun++` around the writes and the put-back
      (try/finally). Just before its final `return {ok:false, …}` (3057, text unchanged):
      `if(now.every(function(s){ return s==='was'; })) lsMarksBack(mk);`.
    - lsPutBack: `_lsAllRun++` / `--` around its writes.
    - lsSet (3026): the warning setStat runs only `if(!_lsAllRun)`. `DIAG.refused`, `fileMark` and `fileStored` unchanged.
      The caller always says the refusal itself (fullImportUndone, importBoards via fullImportUndone, consTakeApply,
      cycApplyAll).
    - importBoards' late refusal (10744-10750): `const mk=lsMarks();` before lsAll, and `lsMarksBack(mk)` in the all-'was'
      branch before `none(…)`.
    - cycApplyAll's own `_sideGen=g0; delete _lsRefused[…]` (23815) is now redundant; leave it.
12. **`writerKey` (overlap), 2806.** *(Contract: W3's `writerKeyHeld`/`_wkMem`.)* Keep the key in memory for the life of the
    page. A refused setItem then no longer makes a new key on each Save (the second Save was refused "unknown holds the
    pen"). The writer key stays per browser: it identifies a person's browser, not a file.
13. **`fullImportText` (overlap with 141), 12495.** *(Contract: W2 builds it.)* In W, right after each plan:
    `[_SLUGMAP[k].key+'.base', JSON.stringify({file:0, folder:{}, dirty:true}), 'This browser’s record of the '+_SLUGMAP[k].t+' plan', 'the record of the '+_SLUGMAP[k].t+' plan']`.
    Each imported plan is then recorded as in no saved file: after the reload the board reads Unsaved changes, not "Saved",
    and LASTKNOWN is 0. The v1.95 W2 block's ten-key expectations (`W2_KEYS`, `W2_SAY`, the n loop) move with it.
14. **Save diagnostics "Save writes to" (optional), 34470.** At the end of opening, `_fhGet(function(h){ _fhKnown=!!h; })`
    (`var _fhKnown=false`). The line reads "a file this browser remembers for this page" when `FH` or `_fhKnown`, and "asks
    which file, the first time" otherwise. It prints no file name.
15. **Tools.** `boot.mjs`: `boot({…, url='https://example.invalid/board.html'})` passes url to JSDOM, so two pages can have two
    addresses *(contract: in the slot commit)*. `check.mjs` "the save-file handle store": fails when the board writes the
    `FNAME` key (`put(…, FNAME)`) or reads it anywhere except `fhLegacyRelease`. `pmo-save.mjs` E: its fixture
    `_fhPut({name:'THE BOARD FILE'})` now lands under the board page's key, so the "under the board's file name" check and
    the later `before[FNAME]` reads are re-pointed to `'page|'+the board's file:// address` (re-record and say why).
    `audit-import` 14809/14813 ("the board's first Save … keeps the handle", "… the handle is forgotten") read
    `X.store.get('page|https://example.invalid/board.html')`, not `I127FNAME`; 14813 would otherwise pass vacuously.

### Design
**(a) The remembered save file is this page's own.**
- Where it is kept: `_fhGet`/`_fhPut` keep it under `fhPageKey()` = `'page|'` + the page's address without `#`/`?`. v2.14 never
  writes the `FNAME` key and reads it only in `fhLegacyRelease`. Versions before v2.14 keep reading and writing `FNAME`; their
  remembered file stays theirs. Clear this computer still deletes the whole store.
- Migration: v2.14 never adopts the `FNAME` handle. Nothing on the handle says which file it is; only the content could, and
  matching content would hand an identical copy elsewhere the same handle. Adopting it is the measured bug. So the first 💾
  Save from each file in each browser asks once.
- The first Save (no handle for this page): where the browser has `showOpenFilePicker`, an Open window, because choosing a
  file there changes nothing. The file is read and goes through every check a remembered file gets: not a board, a PMO copy,
  the writer, the HOLD ON, (b) and D. Write access is then asked for (`queryPermission`, then
  `requestPermission({mode:'readwrite'})`). The handle is remembered only once accepted. Without an Open window, the Save
  window as today, suggesting `fhOwnName()`, not `FNAME`.
- "Save as a new file…" (`fhSaveNew`) is the Save window, suggesting `fhNewName()`, with a warning that a chosen file is
  replaced at once.
- Release: after every write, `fhLegacyRelease` deletes the `FNAME` entry if it names the file just written, so an older ORBIT
  asks instead of writing its program over it.

What a person sees (exact text):
- **FIRST_SAY** (setStat while the Open window is up):
  `'💾 <b>First save of this file in this browser.</b> In the window that opened, pick the board file you opened — <b>'+esc(fhOwnName())+'</b>. Picking it changes nothing: ORBIT reads it first, and asks before writing over anything the board on screen does not carry. To keep this board in a new file instead: <button type="button" class="nb lnk" onclick="fhSaveNew()">Save as a new file…</button>'`
- **NEW_SAY** (fresh, the Save window up):
  `'💾 In the window that opened, give this board a <b>new</b> file name. A file you choose there is replaced the moment you choose it, so never choose another board’s file.'`
- **Fallback with no Open window** (replaces "💾 First save: pick THIS board file …"):
  `'💾 First save of this file in this browser: pick <b>'+esc(fhOwnName())+'</b> — the file you opened — or give a new name. A file you choose there is replaced the moment you choose it, so never choose another board’s file. After this once, Save writes straight to it.'`
- **The Open window cancelled:**
  `'Save canceled — nothing written. <button type="button" class="nb lnk" onclick="fhSaveNew()">Save as a new file…</button>'`
- **PICK_BLOCKED_SAY** (the Open window refused by the browser: SecurityError or NotAllowedError):
  `'⛔ <b>Not saved</b> — this browser did not let ORBIT open a file to check it ('+esc(e.name)+'). Nothing was written, and your work is still here, unsaved. <button type="button" class="nb lnk" onclick="fhSaveNew()">Save as a new file…</button> · <button type="button" class="nb lnk" onclick="publishState()">⬇ Save a copy</button>'`
- **LATER_SAY** (picked and checked, but write access could not be asked for without a fresh click):
  `'💾 <b>“'+esc(h.name)+'” is now this board’s file</b> — nothing is written yet. Press 💾 Save once more to write it; the browser asks first whether ORBIT may edit it.'`
- **DENIED_SAY:**
  `'⛔ <b>Not saved</b> — this browser did not let ORBIT write “'+esc(h.name)+'”. Nothing was written, and your work is still here, unsaved. <button type="button" class="nb lnk" onclick="publishState()">⬇ Save a copy</button>'`.
  The handle is not remembered.
- Every existing refusal is unchanged: not a board, a PMO copy, no longer where it was saved, could not be read, the pen held
  by someone else, the HOLD ON, read-only, the mixed hold. For a picked handle, their `_fhPut(null)` deletes nothing that exists.

**(b) Save asks, naming them, before writing over what the file holds and the board on screen does not carry.**
- When it runs: after the bytes are built (the bytes are what is compared), when the target held anything (`txt.length`) and
  is not a bare program. It runs for a remembered handle and for an Open-window pick. A Save-window pick was emptied and holds
  nothing to compare.
- `saveDrops(txt, p, q, baked)` returns, in this order:
  - Appropriations. `apOf(st)` is `st.appns`, or, for a file saved for one appropriation (years or order at the top),
    `{slug: st}`, the slug from `_slugOfTitle(txt)` or `mySlug()`. `ids(plan)` is the union over every year of `order` and
    the ids in `custom`. For each slug k whose file plan has ≥1 id: if the outgoing plan has 0 ids or is absent:
    `<Name> — <n> requirement(s), <y> year(s)`, Name `_SLUGMAP[k].t`; else, for years the file's plan holds that the
    outgoing does not: `<Name> FY28, FY29`.
  - Locked cycles. For `p.cycDb.byAp[k].cycles` keys absent from q's: one line, `Locked PPBE cycle(s): ` + `cycApTxt(key, k)`
    joined by `', '` (e.g. "O&M PB27, Full Fund PB27").
  - Cost estimates. `p.aceDb.sets` keys absent from q's: `Cost estimate(s): a, b, c and N more`.
  - Execution data. `p.execDb.all` keys absent from q's: `Execution data for O&M, Full Fund`.
  - BAE list: `The BAE list (<n> rows)` when the file has rows and q has none.
  - Reprogramming log: `The reprogramming log (<n> entries)`, the same rule.
  - Destinations: `The destination list` when q has no `ents` at all.
  - Every read is guarded (a non-object reads as empty).
  - Baked (p null, extractPacks non-null): always one line per pack, `<Name> (<n> requirements)`, and the baked wording.
- What it names on the measured files: Full Fund — 40 requirements, 5 years; Initial Spares — 20 requirements, 5 years; OPN —
  10 requirements, 5 years; Locked PPBE cycles: O&M PB27, Full Fund PB27, Initial Spares PB27, OPN PB27; Cost estimate:
  2026ACE; Execution data for O&M, Full Fund, Initial Spares, OPN; The BAE list (447 rows).
- **The question** (confirm, plain text; at most 12 bullet lines, then `'  • … and N more'`):
  `'⚠ HOLD ON — “<name>” holds what the board on screen does not carry:\n\n'` + lines as `'  • …'` +
  `'\n\nSaving now writes the board on screen over the file, and these are gone from it.\n\nOK — save anyway (only if you removed them on purpose).\nCancel — don’t save. Nothing is written.'`
- **Baked:** `'⚠ HOLD ON — “<name>” holds a board built into its program — <O&M (60 requirements), …> — and no saved board state, so ORBIT cannot tell what of it the board on screen carries.\n\nSaving now writes the board on screen over the file, and that board is gone from it.\n\nOK — save anyway.\nCancel — don’t save. Nothing is written.'`
- **CANCEL_SAY:** `'Save canceled — nothing written. “'+esc(name)+'” still holds '+n+' thing'+(n===1?'':'s')+' the board on screen does not carry. If it is not this board’s file: <button type="button" class="nb lnk" onclick="fhRepick()">choose another file…</button> · <button type="button" class="nb lnk" onclick="publishState()">⬇ Save a copy</button>'`.
  A picked handle is not remembered, so the next Save asks again. A remembered one stays until `fhRepick`.
- The pen on Cancel: a writer claim or take made just before is put back (`WRITER=prevWriter; writerJournalUndo(penLine)`).
- An ordinary Save asks nothing: the board on screen carries every appropriation (`pubsFor`), every cycle (`cycByAp`) and every list.
- A deletion on purpose asks once, on the next Save (a cycle unlocked and deleted, an estimate removed). OK writes it.

**(c) A refused import leaves the board as saved as it was.** *(Contract: W3.)*
- lsAll snapshots the marks (`lsMarks`) before writing. When every key is back (`'was'` for all), it restores `_saveGen`,
  `DIRTY`, `_dlOnly`, `_sideGen` and `_lsRefused` (`lsMarksBack`), so the save state reads exactly as before the import and
  the alert's "This board is exactly as it was" is true. A run that could not be put back keeps today's behaviour (the mixed
  hold refuses Save).
- lsSet's warning ("… could not be kept in browser storage — It is still loaded and correct here. Use 💾 Save …") is not said
  while lsAll or lsPutBack runs (`_lsAllRun`). The value was never loaded, and each caller states its own refusal.
  `DIAG.refused` still records it.
- importBoards' late refusal (applyStore refused after lsAll landed, everything put back) restores the marks the same way.
- Every door this reaches: fullImportText, importBoards, consTakeApply and cycApplyAll, all through lsAll.

**The record (the `<key>.base` another page wrote).**
- Every page opened from file:// shares `<key>.base` and the plan key.
- At opening there are three cases: (1) the file's state is on screen: `LASTKNOWN=PUB_FILE_TS`, as today. (2) This browser's
  copy is on screen (`_bootOwnRead`): `LASTKNOWN = record.file`, as today, since the record describes storage's copy (the
  measured case). (3) Neither (a program with no board and nothing in storage, or a refused file): today LASTKNOWN takes
  another file's save from the record. In v2.14 it is 0 and `_baseDirty` false, in memory.
- save(), loadCounted() and driveRestore call the record writer *(contract: W4's `baseMarkDirty`)*. It reads the record fresh
  and writes `{file:LASTKNOWN, dirty:true}` whenever the record does not already say so, so whichever page puts its plan into
  storage last leaves the record naming where that plan came from.
- Consequences: a blank v2.14 page's first change records `{file:0, dirty:true}`, so an older ORBIT (v1.89–v2.13) that then
  opens storage's newer copy asks HOLD ON ("this browser cannot tell…") before its Save writes (today it writes silently).
  Two tabs record the tab that wrote last (item 129). A v2.14 board file that finds such work in storage (record dirty with no
  file, newer than the file) opens its own file and keeps that work aside (the stray rule), with the existing "📦 Opened with
  the saved board state … kept aside, not lost: put it back" message.
- `persist()` is not suppressed for a blank board. Typing there must survive a reload; the record carries the warning instead.

**D, Save into an ORBIT program with no board.**
- A target whose pubState is the literal null and whose `extractPacks` is null is written in place with no question, and the
  writer is claimed as for a new file ("You are now this board’s writer").
- pubState null with packs (requirements baked into the program) is a board and is asked about with the baked wording.
- A shared classification on the same tests: empty (length 0); notboard (no pubState tag, unparsable, or not an object or
  null); copy (`pmoCopyOfText`); program (null, no packs); baked (null, with packs); board (an object). Save does not need it
  as a separate function. *(Contract: W2 does not need it either; W1 may write `fileKindOf(txt)` for its own use.)*

**The guide** (one sentence in the saving paragraph): "The first 💾 Save of a file in a browser asks which file: pick the board
file you opened, which ORBIT reads and checks before writing anything, or save it as a new file. Save asks, naming them, before
writing over an appropriation, a locked cycle or a list the board on screen does not carry."

BUILD bumps once (v2.14).

### Data-loss paths
1. MEASURED: another ORBIT file's remembered handle (`prio-fh` under `FNAME`) lets Save in a v2.13 program tab write over the
   old board file with no window or question: 8,781,027 → 3,878,541 chars. STOPPED BY (a): `_fhGet`/`_fhPut` read and write
   only `fhPageKey()`, and v2.14 never reads or writes `FNAME` (check.mjs rule).
2. The first Save picks a file in the Save window, and Chromium empties it the moment it is chosen, so no check can read it;
   picking the old board there loses Full Fund, Initial Spares, OPN, the cycles and the lists. STOPPED BY: the first Save goes
   through an Open window; the file is read and checked by HOLD ON, (b) and D before write access is asked for. Residual, said
   in the window's own line: "Save as a new file…" and browsers without an Open window still use the Save window, which
   replaces a chosen file at once. On Windows the native window is inferred to ask "replace?" first.
3. The board on screen carries less than the file (the measured case; appropriations or lists storage could not hold; years
   dropped). STOPPED BY (b). Cancel writes nothing and puts the pen back.
4. MEASURED: a refused import marks the tab "Unsaved changes" and keeps an unread "… Use 💾 Save to write it into the file".
   STOPPED BY (c).
5. LASTKNOWN taken at boot from another file's record when the board on screen came from no saved copy, so a HOLD ON that
   should fire does not. STOPPED BY case 3.
6. MEASURED (`tab.mjs` "year"): a blank tab's change puts a near-empty plan in shared storage while the record still names the
   old board's save; the old board reopens it as this browser's copy and its Save writes it over its file. MITIGATED: the
   record writer writes `{file:0, dirty:true}`, so v1.89–v2.13 boards ask HOLD ON; v2.14+ boards keep that work aside (the
   stray rule). Residual: an older board still SHOWS the near-empty copy on opening (its own behaviour).
7. Two tabs: work typed in one after the other opened a newer file stays recorded as saved, or from the wrong save. STOPPED BY
   the fresh-read record writer (item 129; build once).
8. After a migration, an older ORBIT saves through an `FNAME` entry naming the new file and writes the old program over it.
   STOPPED BY: v2.14 never writes `FNAME`, and `fhLegacyRelease` deletes an `FNAME` entry naming a file v2.14 has just written.
9. MEASURED D: Save into the program with no board throws on `null.writer` and downloads instead. STOPPED BY
   `p? writerShape(p.writer) : null` and the bare-program rule; a baked program is asked about.
10. A picked handle is remembered before its checks (today line 10298), so a wrong pick stays this page's file; after D failed,
    every later Save downloaded. STOPPED BY: remembered only once accepted; a cancelled question or refused permission leaves
    nothing remembered.
11. Write permission after an Open-window pick may need a fresh gesture. HANDLED: nothing written, the checked handle
    remembered, LATER_SAY asks for one more press; that press re-reads the file and re-runs every check.
12. The storage-route import's plans carry a stale record from another file, so the reloaded program reads "Saved" over a board
    in no file of its own. STOPPED BY (W2): fullImportText's W writes each plan's `.base` as `{file:0, folder:{}, dirty:true}`.
13. Not changed: the writer key stays per browser. Nothing a person saved is moved or deleted: `FNAME` entries are only released
    when they name the file just written, and Clear this computer is unchanged.

### Checks (as mapped)
1. audit-import "v2.14 — Save writes only to the file this page was saved to; another file is never reached through the shared
   entry (item 140 a)". boot.mjs gains `url`. One shared `i127idb` store; its disk stand-ins gain `isSameEntry`.
   - X = a board at `https://example.invalid/old.html`. Its first Save (jsdom: no Open window, so the Save-window fallback)
     writes dA once. The store holds exactly `['page|https://example.invalid/old.html']`; the log shows no `FNAME` get or put.
   - `store.set(FNAME, dA.h)`, as an older version leaves it.
   - Y = the program with no board at `…/new.html`, same store. Its Save reads only `'page|…/new.html'`, opens the window once
     suggesting `'new.html'`, and leaves `dA.writes` and `FNAME→dA.h` unchanged.
   - X's second Save: no window, written (CONTROL).
   - Release: `FNAME→dA.h`, X saves, after a tick `FNAME` is gone. `FNAME→dB.h`, X saves, `FNAME` is still `dB.h`.
   - Fails on v2.13: X's handle is under `FNAME`, and Y writes dA.
2. audit-import "v2.14 — the first Save of a file opens it to check it before anything is written (item 140 a)".
   `showOpenFilePicker` stubbed in jsdom. The page's own saved file picked: read, no question, permission asked, written,
   remembered under the page key. `requestPermission` throwing: nothing written, remembered, the line says press 💾 Save once
   more; the next Save writes with no window. `'denied'`: nothing written, not remembered, DENIED_SAY. Cancel of the Open
   window: "Save canceled — nothing written." plus the link. `fhSaveNew()`: the Save window suggesting `fhNewName()`, the empty
   file written. Fails on v2.13: `showSaveFilePicker` is called, and the picked file is remembered before it is read.
3. audit-import "v2.14 — Save asks, naming them, before it writes over what the file holds and the board on screen does not
   carry (item 140 b)". Fixture: `w2Fx`'s NEW.html (O&M and Full Fund, their locked cycles, the BAE list, execution data, cost
   estimates, the reprogramming log and destinations). Every expected line derived in Node from NEW's own pubState, never from
   `saveDrops`.
   - (1) A program page whose storage holds only NEW's O&M plan, FH = NEW.html, Cancel: one question naming exactly Full Fund
     (n requirements, y years), the locked cycles, the cost estimates, the execution data, the BAE list and the reprogramming
     log, and not O&M. Nothing written. WRITER unchanged, no `(writer)` journal line. CANCEL_SAY.
   - (2) The same, OK: written once. (3) A blank program page: O&M named too, with its count. (4) A file whose O&M holds
     FY27–FY29 against a board holding FY27 only: "O&M FY28, FY29". (5) Ordinary Save of a board opened from that same file:
     no question (CONTROL). (6) A cycle deleted, then Save: "Locked PPBE cycle: O&M <key>" asked once; OK writes; the next Save
     asks nothing. (7) A target with no writer recorded (pre-v1.95): claim asked, OK, then (b) Cancel: WRITER back to null, no
     `(writer)` line. (8) The Open-window pick of NEW from a program page, Cancel: the page key absent, and the next Save opens
     the window again.
   - Fails on v2.13: no question, written.
4. audit-import "v2.14 — Save into an ORBIT program with no board writes it in place (item 141 D)". FH = a stand-in holding the
   program's own text (pubState null; extractPacks null asserted as a CONTROL): written once, no question, no download, the
   writer claimed, "💾 Saved in place …". FH = a pubState-null file with an APPNS pack baked in: the baked question; Cancel
   writes nothing. Fails on v2.13 (measured): "In-place save failed (Cannot read properties of null (reading 'writer'))",
   0 writes, 1 download.
5. audit-import "v2.14 — a refused import leaves the board as saved as it was, and never says to Save (item 140 c)"
   *(contract: W3's)*. Reuses `w2Fx` and `w2Import`. For "once" n=1..10 on a clean board: DIRTY, `_baseDirty`,
   `unsavedNow()`, `_dlOnly`, the keys of `_lsRefused` and the save-state text identical before and after. STAT_LOG gains no
   entry matching `/could not be kept in browser storage/`. The "⛔ Nothing was imported …" line is still on the line, kept
   unread. The same on a board with an unsaved edit (stays unsaved) and on a downloaded-only board (stays "downloaded — not on
   the shared file yet"). consTakeApply and importBoards refused once each: the same. A "stuck" run that cannot be put back
   keeps today's mixed hold (CONTROL). Fails on v2.13 (measured): DIRTY false→true, "Unsaved changes", and an unread "… Use
   💾 Save to write it into the file".
6. audit-import "v2.14 — a page whose board came from no saved copy records none, and a board file keeps such work aside (item
   140)". (i) The program page booted with ls `{'prio27om.base': {file:X, dirty:false}}` and no plan: `LASTKNOWN===0`,
   `_baseDirty` false; after switchYear the record is `{file:0, dirty:true}` *(contract: this half is an integration check)*.
   v2.13: `LASTKNOWN===X`, record `{file:X, dirty:true}`. (ii) Then a board file whose plan is older, booted with that storage:
   the file's requirements on screen; `keptCopy().raw` equals the blank page's MS; the kept-aside opening line;
   `LASTKNOWN===PUB_FILE_TS`; record `{file:PUB_FILE_TS, dirty:false}`. v2.13 opens the blank page's plan. (iii) Two tabs
   *(contract: W4's block)*.
7. `tools/save-target.mjs` (`npm run savetarget`, in verify:grid after pmosave). Built from m140.mjs: a real IndexedDB
   `prio-fh`; token stand-ins installed from page code after load, never an init script; exposed Node functions read and write
   real files; window stubs record calls. The old board is the v2.12 program (`git show d630240:prioritization-board-grid.html`;
   unshallow first), with O&M, Full Fund, Initial Spares and OPN, each with a locked PB27, plus a cost estimate, execution data
   and a BAE list, built by the tool in jsdom and never committed. The refusal is forced from page code (setItem refuses
   `prio27acedb`) through the same lsAll path. Sections: A the measured case (old file byte-identical, the Open window offered
   once, the IDB log never reads `FNAME`; on v2.13 it writes 3.88M chars over it); B the Open window returns the old board:
   (b)'s question names the seven lines; Cancel; nothing written; C the Open window returns the program's own file: written in
   place, no question (D); D a board file's first Save picks itself: no question, written; the second Save writes with no
   window; E the blank v2.14 tab's switchYear, then the v2.12 old board's Save: asked (HOLD ON), not written when cancelled (on
   v2.13: written silently) *(contract: integration)*; F an `FNAME` entry naming the new file (set by a v2.13 page's `_fhPut`):
   after a v2.14 save of that file it is gone, and the v2.12 board's next Save opens its window instead.
8. `npm run check` "the save-file handle store": fails when the board writes the IndexedDB key `FNAME`, or reads it anywhere but
   `fhLegacyRelease`. Proved by planting `.put(h, FNAME)` back in `_fhPut`.
9. Re-recorded with the reason: `pmo-save.mjs` E and audit-import v2.09 W3 at 14809/14813. Run pmosave, keys, dialogs, leftmenu
   and standards by hand: verify:grid stops at layout's carried D ×8.
10. By hand: a headed Chromium proof under Xvfb with the real GTK dialog (adapt `proto/q141-verify-fix-0-picker4.mjs`):
    choosing the 8.79 MB board in `showOpenFilePicker` leaves it byte-identical, against the Save window's 8,793,759 → 0.
    Record Chromium's version.

### Mutations (as mapped; contract ids replace `v214-save-target-` with `v214-w1-`, except where noted)
- `fname-get`: `_fhGet` reads `FNAME` instead of `fhPageKey()` → "Save writes only…" (Y writes dA) and savetarget A.
- `fname-put`: `_fhPut` writes under `FNAME` → the same block (the store holds `FNAME` after X's first Save).
- `key-shared`: `fhPageKey` returns `'page|'` for every page → the same block.
- `own-name-lost`: the Save-window fallback suggests `FNAME`, not `fhOwnName()` → the same block.
- `save-window-first`: the first Save calls `showSaveFilePicker` even when `showOpenFilePicker` exists → "the first Save…" and savetarget B.
- `picked-remembered-early`: `FH=h; _fhPut(h);` runs for a picked handle before the read → "Save asks…" (8).
- `picked-denied-kept`: a `'denied'` permission still remembers the handle → "the first Save…" (denied).
- `drops-unasked`: the (b) confirm skipped once lost is computed → "Save asks…" (1).
- `drops-cancel-writes`: (b) Cancel goes on to write → (1).
- `drops-appns-blind`: saveDrops skips the appropriations loop → (1).
- `drops-empty-carried`: an appropriation counts as carried when the outgoing plan exists with 0 requirements → (3).
- `drops-years-blind`: dropped years not named → (4).
- `drops-cycles-blind`: the locked-cycle line omitted → (1) and (6).
- `drops-ace-blind`, `drops-exec-blind`, `drops-bae-blind`, `drops-rp-blind`: that list not compared → (1).
- `cancel-pen-moved`: (b) Cancel does not put WRITER and the `(writer)` line back → (7).
- `null-writer-throws`: line 10345 back to `writerShape(p.writer)` → "Save into an ORBIT program with no board…".
- `program-not-fresh`: writerMay without `|| bare` → the same block.
- `baked-unasked`: a baked target treated as a bare program → the same block.
- `release-skipped`: the `fhLegacyRelease` call removed → "Save writes only…" (release) and savetarget F.
- `release-any-file`: release deletes `FNAME` without `isSameEntry` → "Save writes only…" (`FNAME→dB.h` must survive).
- `marks-not-restored`, `marks-dirty-kept`, `marks-side-kept`, `import-says-save`, `batch-marks` → *contract: W3's, as
  `v214-w3-*`*.
- `boot-lastknown-inherited`: the case-3 line removed → "a page whose board came from no saved copy…" (i).
- `record-no-file`, `record-cached` → *contract: dropped, duplicates of W4's `base-file-kept`, `base-cache`*.
- `stray-opens`: the stray clause removed from the boot condition → (ii).
- RETARGETED by the record writer (*contract: W4's*): `unsaved-flag-never-set` (save()'s base line, 7793);
  `v202-e7-u24-load-uncounted` and `v202-e7-u24-load-session-only` (loadCounted, 7786); `v200-r5-restore-basedirty`
  (driveRestore, 33453). Every other save-path find (`v209-w3-*`, `v209-rv-save-board-moved-handle-kept`, `v200-r4-*`,
  `fullimp-*`, `v197w2-refusal-uncounted`, `diag-refusal-not-kept`) keeps its text: run mcount after the build.

### Overlaps (as mapped)
- Item 141 (file route, storage route): fullImportText and fullImportUndone; (c) lands in lsAll; the import's W should carry each
  plan's `.base`; a shared target classification; no silent adoption of an `import|<ts>` handle (the import's file gets the same
  first-Save check); the v1.95 W2 test churn; one Help sentence against the guide budget.
- Item 129 (two tabs): the record writer is the same change. Build it once; one block owns the two-tab check.
- U63/U64: driveRestore's base line (33453, mutation `v200-r5-restore-basedirty`) moves to the record writer. Their keep-aside
  may change LASTKNOWN on folder loads. The record's folder map is left alone by `baseMark`; the fullImportText record clears
  it to `{}`.
- Item 141 F: `writerKey` kept in memory; lsSet's catch (the `_lsAllRun` guard; persist refusals into `DIAG.refused`);
  switchAppn refusals; diagnostics lines.
- v2.13 `cycApplyAll` (23812-23816): its own restore after a put-back-whole refusal becomes redundant; left in place.
- Harness: boot.mjs `url`; check.mjs rule; pmo-save.mjs E and audit-import v2.09 W3 re-pointed to the page key. Any area that
  stands in the board's handle store must use the page key.

### Open questions (as mapped; the contract answers each in §9 or §12)
1. The first Save: (A) an Open window, or (B) today's Save window, which empties the chosen file. Recommended: A.
2. Reuse the file an older version remembered (the shared entry)? Recommended: never.
3. Ask after a deliberate deletion too? Recommended: yes, once.
4. A board file opened over work never saved to any file: open its own file and keep that work aside? Recommended: yes.
5. Release the shared entry naming the file just written? Recommended: yes.
6. Does 💾 Save write in place on Brad's work computer, Chrome or Edge, managed by policy? (Brad: Save writes into the file.)

---

## file-route

# Item 141's file route and its corrections: the refused full import offers "Write the imported board into a new file…"; verified write and read-back; the as-it-was step; rescues on any failure after a pick; the marker, the id stamped in pubState and the opening clear; the hand-over hold by key; the download route; the room check after a storage-route landing; the empty-board import door (E); Save over a program with no board (D)

**Contract review (§13, C18–C23, C27–C30):** E1 only for a whole board in an empty browser; the `.base` records only in W,
removed with their plans; the marker written straight after the read-back; the hold latched for a page's life and lifted with
the unchanged copies; leaving asks while a copy is held (S11); eight retargets; `picker-after-await` rewritten; the race; fixtures.
**Contract changes here:** D (its `_saveInPlaceFileRun` change, its block and its two mutations `null-pubstate-throws`,
`baked-unasked`) is W1's. The counters restore (`lsCounters`/`lsCountersPut`, mutation `counters-kept`) is W3's
`lsMarks`/`lsMarksBack`; W2's main block does not assert `unsavedNow()` (W3's block does). The hold's call sites in `lsSet`,
`persist` and the boot keep-aside write are seams in the slot commit (contract §2); W2 fills `impHandKey` and `impHandRefuse`.
The `memOnlyBlock` guard and `reopenPage()` in fullImportText and importState are seams too. Everything else here is W2's,
plus the `.base` records in W (from save-target).

Measured on v2.13 here: Chromium reproduces Brad's exact alert from a board built in 1 s (import 1.1 s), storage
byte-identical, `unsavedNow()` true after the refusal, and no file route offered (FAIL); jsdom: E lands O&M, drops Full Fund,
says "🧩 Loaded O&M, Full Fund — reopening…" and reloads; D writes 0 times and downloads once. Throwaways:
`proto/file-route-chromium.mjs`, `proto/file-route-shell-door.mjs`.

### Functions (line numbers at c863dc2)
1. **`fullImportText`, 12386.** One new line between the `W.push` of `'prio27impRep'` (12515) and `const done=lsAll(W);`
   (12516): `W.full={rep:rep};` — an own property on the array, which lsAll, map and forEach ignore. It is the gate: only this
   call offers the file route (importBoards 10733 and consTakeApply 11660 call fullImportUndone without it). `destOwnFix`
   (19243) reaches the file route through it unchanged. The mutation finds `fullimp-memory-before-check`,
   `fullimp-report-outside` and the impMixedLift line (~2879) still match because the line goes BEFORE `const done=lsAll(W);`.
2. **`fullImportUndone`, 12536.** In the `done.back` branch (12539), first: (1) `if(done.why==='HandOverHold')` → alert and
   setStat of the hold (design 11) and return false; (2) `if(W.full && done.at>=0) return impFileOffer(done, W, txt, fname);`
   — impFileOffer sets the SAME status line as today, opens the box instead of the alert, and returns false. The not-back
   (mixed) branch is unchanged and never offers the file route.
3. **`lsAll`, 3040.** *(Contract: W3's `lsMarks`.)* Snapshot the save counters before the first write and, when the run is
   refused and `back` is true, put them back and call `saveStateShow()`.
4. **`lsSet`, 3010.** *(Contract: the slot commit's seam line, W2's `impHandRefuse` body.)* After the `_lsCapture` block and
   before `const fk=fileKeyOf(key);`:
   `if(impHandKey(key)){ const fk0=fileKeyOf(key); if(fk0){ fileMark(fk0); fileStored(key, fk0, false); } try{ DIAG.refused.push({t:Date.now(), what:diagClean(what, false), why:'HandOverHold'}); }catch(e){} if(!_impHandSaid){ _impHandSaid=true; try{ setStat(impHandMsg(what)); }catch(e){} } return false; }`
   — a held write counts as not kept, exactly as a refusal does; said once per page. The `_cycSwap` line is untouched.
5. **`persist`, 7514.** *(Contract: slot seam.)* `if(impHandKey(_AP.key)){ _persistFail=true; if(!_impHandSaid){ _impHandSaid=true; try{ setStat(impHandMsg('Keeping changes in browser storage')); }catch(e){} } return false; }`
   — persist writes past lsSet (`localStorage.setItem` at 7518), so it needs its own check.
6. **Boot plan restore, the keep-aside write, 7461.** *(Contract: slot seam.)* Inside its try, first statement:
   `if(impHandKey(_AP.key)) throw new Error('held');` — held, the write is not made and `held` stays false, so the record keeps
   describing what storage holds. This rewrites the line `v209-rv2-save-boot-no-write`'s find spans whole: retarget it.
   `v209-rv2-save-boot-writes-unread` and `v209-rv3-save-look-writes-storage` (find `      if(own && _bootOwnRead){ try{`)
   still match.
7. **`IMP_FILE_KEY` and `_impOpen` (new), 2948.** Right after the `EXDB_KEY` line (2888):
   `var IMP_FILE_KEY='prio27impFile'+SIDE_SFX;` (sealed like `IMP_MIXED_KEY`, so a PMO copy never reads the board's).
   Immediately before `let EXDB = (function(){` (2948) — the first read of any key a full import writes, so before
   EXDB/ACEDB/BUDDB/DESTDB/RPDB (2948-3136), CYCDB (3214), DATA (3274) and the plan restore (7401):
   `var _impOpen=(function(){...})();` reads the marker; if `PUB` (parsed at 2784, not yet narrowed) carries
   `PUB.impFile.n===m.n`, this page IS the import's file: for each key in `m.keys` whose storage value still hashes
   (`sideHash`) to `m.h[key]`, `removeItem`; a key whose value differs is kept and listed in `left`; the marker is removed;
   returns `{own:true, m, left}`. Otherwise `{own:false, m}`. No marker: null.
8. **`_impRep` (startup read), 3128.** Unchanged for `prio27impRep`. When it holds nothing and `_impOpen && _impOpen.own`, it
   returns the own-file report (design 10), built from the marker's plain-text fields through `esc()`.
9. **The opening chain, 39481.** `statKeep(_impRep+impRoomSay())` (design 12). After the whole chain (beside destOwnKeep's
   call): `try{ if(impHandOf()) statKeep(impHandMsg('')); }catch(e){}` so a held page always says it. At the end of the boot,
   after FH exists: when `_impOpen && _impOpen.own`, read the IDB handle `'import|'+n` (`_pfhGet`); adopt it as FH and store it
   under this page's own entry (item 140's keyed `_fhPut`) ONLY when `m.href===impHref()`; in every case delete
   `'import|'+n` (`_pfhPut(k, null)`).
10. **`savedHtmlOf`, 8215.** `savedHtmlOf(appns, cycDb, lists)`: optional third argument; each of destDb, execDb, aceDb, rpDb,
    budDb and writer is taken from `lists` when it has that own property, else from the page's globals as now;
    `impFile:(lists&&lists.impFile)||undefined` is written last (JSON.stringify drops undefined, so every ordinary save is
    byte-identical to v2.13's). The JSON line is rewritten, so retarget the six mutations whose finds span it:
    `handoff-copy-drops-store` (mutate.mjs 424), `save-no-lt-escape` (605), `cycle-file-drops-store` (1197), `bud-not-saved`
    (1331), `dest-file-no-list` (1589), `writer-not-in-file` (2530) — same defect each, re-proved against its own block.
11. **`boardPubOf(W)` (new), beside fullImportPreHtml.** The board the storage route would have left, as parts for
    savedHtmlOf. `by` = W's values by key. appns: each appropriation W writes, `JSON.parse` of W's text; this page's own
    appropriation when W does not write it and `MS.ts>0`, as a copy (`ms=Object.assign({},MS); ms.years=Object.assign({},MS.years); ms.years[MS.cur]=S`);
    every other appropriation W does not write from `pubsFor(MS)`'s newer-of rule (never assigning into PUBS, never calling
    save() or buildSavedHtml). cycDb: `{ts:CYCDB.ts||0, byAp:cycByAp()}` with W's `'-cyc'` entries parsed over it. Lists: W's
    parsed value for DEST_KEY, `'prio27execdb'`, `'prio27acedb'`, `'prio27reprog'`, `'prio27buddb'` when W writes it, else the
    page's memory. Returns `{appns, cycDb, lists}`. *(Contract: skips `.base` and `prio27impRep` entries.)*
12. **`fullImportPreHtml`, 12578.** Optional second argument `o`; with `o.newest`, this appropriation's plan is storage's copy
    when storage's plan ts > MS.ts (another tab saved it), else memory, as now. The mixed rescue and destOwnFix call it as
    before. The find of `fullimp-before-from-storage` (the `rd` line) is untouched.
13. **New, after fullImportPreHtml:** `impFileOffer`, `impFileDraw`, `impFileClose`, `impFileWrite`, `impFileWriteTo`,
    `impFileFinish`, `impFileRaced`, `impFileFailed`, `impFileRescue`, `impFileDownload`, `impFileSaveWas`, `impFileCarryOn`,
    `impFileMoved`, `impUnsavedList`, `impFileName`, `impFileNeed`, `impFileId`, `impHref` — holding one record `_impFile`
    (var, beside `_impRescue` at 12535): `{W, held:done.held, at, why, txt, fname, rep:W.full.rep, name:impFileName(fname), need, step1:null, skip:false, busy:false, html, n, wk, rescue}`.
    None writes storage before the verified write; every handler value through `jsa()`; every name drawn through `esc()`.
14. **New, just above lsSet (`var`):** `impHandOf`, `impHandKey`, `impHandMsg`, `impHandClear`, `_impHand`, `_impHandSaid` —
    the hand-over hold (design 11). `impHandOf()`: the marker read from storage at call time (so a tab opened before the import
    is held too), else the in-memory `_impHand`. `impHandKey(key)`: the marker lists key. `impHandClear()`: the confirm, then
    removes the marker and clears `_impHand`.
15. **`impRoomSay` (new).** One probe write of 65,536 characters under `'prio27roomProbe'` (direct setItem/removeItem in
    try/catch — a probe, not work, never counted), removed at once; returns `''` when it fits, else the warning sentence.
16. **`importState`, 12802.** E1 after `fromBoard=true;` (12844): on an empty board (`(typeof IS_SHELL!=='undefined') && IS_SHELL`)
    a board .html saved by v1.80 or later (`fullBuildOf` vs `FULL_MIN`) goes to `fullImportText(txt, f.name)` (`inp.value`
    cleared first) and returns. E2 for what is left on the shell (an older html, a JSON state): every write from
    `const carried=importStores(fullSt || st);` (12881) to the shell branches' ends is captured (`_lsCapture=[]` in a
    try/finally that always resets it), memory snapshot by `impMemSnap()` and `const _ms0=MS`; the direct
    `localStorage.setItem(_AP.key, ...)` at 12939 becomes `lsSet(_AP.key, JSON.stringify(MS), 'the '+_AP.t+' plan')`; each
    branch commits through `const done=lsAll(cap)`; refused → `impMemRestore`, `MS=_ms0`, `syncSvc()`, `render()`,
    `return fullImportUndone(done, cap, txt, f.name)` (no W.full: the alert as today, no reload); landed → `impMixedLift`, then
    the `prio27appn` write (12930) and the existing message and reload. The "no requirement data" alert path also restores
    memory and releases the capture. The populated-board paths are not captured.
17. **`_saveInPlaceFileRun`, 10280.** *(Contract: W1's D.)* `let prog=false;` after `let p;`; `if(p===null){ if(extractPacks(txt) && !confirm(...)){ setStat('Save canceled — nothing written.'); return; } prog=true; }`;
    10345 `const fw0=p? writerShape(p.writer) : null;`; 10364 `if(!may) may=writerMay(fw, !txt.length || prog, false, 'this board file');`.
18. **Markup `#impFilePanel`, beside `#uiImpPanel` (~2633).**
    `<div class="modal-bg" id="impFilePanel"><div class="modal" style="width:640px;max-width:98vw"><h3>The imported board is too big for browser storage <button type="button" class="x" onclick="impFileClose()">✕ Close</button></h3><div id="impFileBody"></div></div></div>`
    — no backdrop click handler (closing must not be a stray click while a file is being written). Opened by className
    `'modal-bg open'`; the v1.93 box controller names it, inerts the rest and gives Esc to the ✕.
19. **Guide `t-full`, 2268.** Its third paragraph ("It is all or nothing…", 456 characters) is replaced by the 493-character
    paragraph in design 18 (+37).
20. **Read, not changed:** `pubsFor` (8207) and `cycByAp` (3246) feed boardPubOf; `extractPacks` (10819); CYCDB (3214) and
    DATA (3274) are protected by `_impOpen` running before them (R1, DATA's storage-first data pack, is NOT changed);
    `clearComputerKeys` (36725) reaches the marker by its prio27 prefix and the `import|n` handle by deleting `prio-fh`;
    `writerKey` (2806) is read at the build and its key re-stored after the clear.

### Design
0. **Gates.** The storage route is unchanged whenever it fits. The file route is offered only when (a) fullImportText made the
   call (`W.full`), (b) lsAll put every key back (`done.back`) and (c) a write was refused (`done.at>=0`). Not offered:
   importBoards and consTakeApply refusals, the mixed (not put back) case, storage unreadable at all (`done.at` -1), a refusal
   caused by the hand-over hold, a PMO copy or a locked view (both refused before the file is read). `impFileWrite`,
   `impFileSaveWas` and `impFileDownload` also return at once if SANDBOX or CYCVIEW.
1. **The refusal.** fullImportUndone's `done.back` branch with the gates met calls `impFileOffer(done, W, txt, fname)`, which:
   sets the status line to exactly today's text — `'⛔ <b>Nothing was imported</b> — '+esc(what)+'; this board is exactly as it was.'`
   (what = `'browser storage refused '+W[at][3]+' ('+why+')'`), so the v1.95 W2 checks stay green; does NOT show the alert
   (the box says the same); keeps `_impFile`; computes need = Σ(key.length+value.length) over W, in millions to one decimal;
   computes nothing else (no file text, no as-it-was, no snapshot: those are taken at the click); opens `#impFilePanel`;
   returns false. Storage and memory are untouched.
2. **The box** (`impFileDraw`, redrawn on every state change; every name through `esc()`, every handler without values).
   - P1: `Nothing was imported from “{fname}”: browser storage refused {W[at][3]} ({why}). This board is exactly as it was.`
   - P2: `A full import puts the whole board into this browser’s storage before the board reopens on it. This board needs about {need} million characters there at once; a browser keeps about 5.2 million, for every ORBIT file and web page opened from a drive together. A board file has no such limit, so ORBIT can write the imported board into a new board file instead: every appropriation, year, locked cycle and list, as the import would have brought them. You then open that file and carry on in it.`
   - STEP 1, only when `impUnsavedList(W)` (recomputed on every draw and at every click) is not empty:
     `<b>1. This browser holds work no saved board file has</b>: {list}. Writing the new file clears this browser’s copies of what the import replaces, so save that work first.`
     Buttons: [💾 Save this board as it was…] (`impFileSaveWas`) and a checkbox [ ] `Carry on without a copy of it` (sets
     `R.skip`). Once saved: `✓ Saved as “{name}” and read back whole.` The list items: "what is on screen" when
     `unsavedNow()`; for each W key (prio27impRep excepted) whose storage value is not null: this appropriation's plan when
     `unsavedNow() || baseGet().dirty`; another appropriation's plan when its own `'<key>.base'` says dirty, or (no dirty flag
     recorded) when `pkgMineSince(storage copy, PUBS[k]).length>0` or `PUBS[k]` is absent; a cycle store or list when
     `!sideEmpty(key, value)` and `sideText(value)` differs from the board file's copy (`sideBootNote.file[key].text` for this
     page's own keys, `sideText(CYC_FILE[k])` for another appropriation's cycles, missing copy = differs). Each named by its
     `W[i][3]`.
   - STEP 2 ("2." when step 1 shows, else unnumbered):
     `<b>Write the imported board into a new file.</b> The browser empties the file you choose the moment you choose it, so choose a <b>new</b> name — never “{fname}”, the file you are importing, nor any other board file. ORBIT suggests “{name}”. Close every other ORBIT tab first: an older one can write over what this one clears.`
     Button [Write the imported board into a new file…] (`impFileWrite`); disabled (attribute, and title
     `Save this board as it was first, or tick Carry on without a copy of it.`) while step 1 shows and neither `R.step1` (for
     the current counters) nor `R.skip`. Button [Cancel] = `impFileClose`.
   - While writing: `Writing “{h.name}”… Keep this page open until it says it is done.`; both buttons disabled.
     `impFileClose` while `R.busy` refuses: `setStat('⏳ A file is being written — wait for it to finish.')`.
   - `impFileClose` otherwise: `_impFile=null`; box closed; status left as it is.
   - `impFileName(fname)`: stem = fname without `.html`/`.htm` when it has one, else FNAME's stem (destOwnFix passes "this
     board as it stands"); any trailing ` (ORBIT vX.Y)` removed; + `' (ORBIT '+BUILD.split(' ')[0]+').html'` — e.g. "ORBIT
     Live (ORBIT v2.14).html".
3. **The write click** (`impFileWrite`), synchronous up to the picker, which is called BEFORE any await:
   (i) `R=_impFile`; nothing or `R.busy`: return. (ii) `impFileMoved(R)`: every W key (prio27impRep excepted) read again; any
   whose value is not `R.held[i]` → refuse:
   `setStat('⛔ <b>Nothing was written</b>: {list} changed in this browser after the import was refused — in another ORBIT tab, or this one. Import “{fname}” again, so ORBIT can ask about that work first.')`,
   close the box, `_impFile=null`. (iii) step 1 still needed and neither saved nor skipped: return. (iv)
   `typeof window.showSaveFilePicker!=='function'` → `impFileDownload(R, null)`. (v)
   `pick=window.showSaveFilePicker({suggestedName:R.name, types:[{description:'ORBIT board', accept:{'text/html':['.html']}}]})`
   in a try: a synchronous throw → `impFileDownload(R, e)`. (vi) `R.busy=true`; redraw;
   `return pick.then(h=>impFileWriteTo(R,h), e=>…)`: AbortError → `R.busy=false`,
   `setStat('No file was chosen — nothing was imported, and this board is exactly as it was.')`, redraw (box stays);
   SecurityError or NotAllowedError → `impFileDownload(R, e)`; anything else → `R.busy=false`,
   `setStat('⛔ The save window could not be opened ('+esc(e.name)+'). Nothing was imported, and this board is exactly as it was.')`, redraw.
4. **After the pick** (`impFileWriteTo`, async). The chosen file may already have been emptied, so from here every failure goes
   to `impFileFailed`. In one try: `n=impFileId()` (`'i'+Date.now().toString(36)+'-'+16 hex from crypto.getRandomValues`,
   Math.random if refused); `P=boardPubOf(R.W)`; `wk=writerKey()`;
   `html=savedHtmlOf(P.appns, P.cycDb, Object.assign({}, P.lists, {writer:{by:whoIs()||'unknown', fp:pkgSig('orbit-writer|'+wk), t:Date.now()}, impFile:{n:n, at:Date.now(), from:String(R.fname||'')}}))`
   (whoIs never asks: a prompt here would spend the click); keep `R.html`, `R.n`, `R.wk`;
   `w=await h.createWritable(); await w.write(html); await w.close();` then `back=await (await h.getFile()).text()` (a throw =
   null); `back!==html` → throw `{name:'ReadBack', message: back===null? 'it could not be read back' : 'it did not read back as written'}`.
   Then, with no await after this point: `impFileMoved(R)` again, and this page's counters (`_saveGen`, `_sideGen`) against
   those taken at the click → anything moved → `impFileRaced`; `h.name` equals `R.fname` (trimmed, case-insensitive) and the
   step is not yet done → `impFileNameStep`; else `impFileFinish`.
5. **Finish** (`impFileFinish`, synchronous; `impFileCarryOn` calls it after the name step and it re-runs `impFileMoved`
   first): (a) the hash map `h_[key]=sideHash(R.held[i])` for every W key that held a value; (b) `localStorage.removeItem`
   every W key except `'prio27impRep'` (removing needs no room; a removal that throws is listed); (c) if storage's
   `'prio27writerKey'` is not `R.wk`, write it, so the file's writer is this browser after the reload; (d) marker
   `m={n, at, name:h.name, from:R.fname, href:impHref(), keys, says:(their W[i][3]), h:h_, rep:diagPlain(R.rep), how:'file'}`
   via `lsSet(IMP_FILE_KEY, JSON.stringify(m), 'The note of where the imported board was written')` — plain text only, no
   markup; (e) the handle put under `'import|'+n` in `prio-fh` (a promise version of `_pfhPut`, resolved on transaction
   complete, 3 s cap); (f) marker stored →
   `setStat('⬅ <b>Full board imported into “'+esc(h.name)+'”</b> — written and read back whole. This browser’s older copies of what it replaces were cleared. Reopening…')`,
   close the box, then reload when the handle put settles; (g) marker refused → `_impHand=m`, no reload, box closed,
   `statKeep('⚠ <b>The imported board is in “'+esc(h.name)+'”</b>, written and read back whole, and this browser’s older copies of it were cleared — but browser storage refused the note that tells the next page which file holds the board, so this page stays open instead of reopening. Open “'+esc(h.name)+'” to carry on. Until you close this page, it writes none of '+esc(says)+' to browser storage.')`.
6. **Any failure after a pick** (`impFileFailed`: createWritable, write or close throwing, the read-back missing or different,
   the build throwing, any other throw): nothing cleared, no marker, no reload, `R.busy=false`, W/txt/html kept.
   `R.rescue = {html:{text:R.html, name:h.name||R.name} (absent when the build itself failed), inc:{text:R.txt, name:R.fname}}`.
   The box shows the rescues and the Write button again ("Try again with a new name").
   `statKeep('⛔ <b>Nothing was imported</b> — the imported board could not be written into “'+esc(h.name)+'” ('+esc(reason)+'). This browser and this board are exactly as they were. If “'+esc(h.name)+'” was a file that already existed, the browser emptied it when you chose it: save both copies now — <button …onclick="impFileRescue('html')">💾 the imported board (new version)</button> and <button …onclick="impFileRescue('inc')">💾 the file you imported</button> — then try again with a new name.')`
   (when the build failed, the first button is replaced by "(the imported board could not be built)"). `impFileRescue(which)`
   downloads that text through a Blob, as fullImportRescue does.
7. **A list changed while it was written** (`impFileRaced`): nothing cleared; marker as in 5(d) with `how:'file-raced'` (its
   hashes are of what storage held at the click, so opening the file clears only what has not changed since); `_impHand=m`
   when the marker is refused; no reload; box closed;
   `statKeep('⚠ <b>The imported board is in “'+esc(h.name)+'”</b>, written and read back whole, but '+esc(list)+' changed in this browser while it was being written — in another ORBIT tab, or this one — so nothing was cleared from browser storage. Open “'+esc(h.name)+'” to carry on: when it opens, ORBIT clears this browser’s copies that have not changed since, and names any that have.'+(screen moved? ' What you changed here since is still on screen: 💾 Save keeps it in this page’s own file.' : ''))`.
8. **The chosen file has the imported file's name** (`impFileNameStep`): no clearing yet; the box shows
   `“{h.name}” has the name of the file you imported, so it may be that file: the browser emptied it when you chose it, and ORBIT has written the imported board into it, read back whole. Before this browser’s older copies are cleared, save the file you imported as it was:`
   [💾 the file you imported] (`impFileRescue('inc')`) then [Carry on] (`impFileCarryOn` → `impFileFinish`). ✕ here keeps the
   record and says `The imported board is in “{h.name}”; nothing in this browser was cleared. Open it to carry on.` with the
   marker written as in 7.
9. **No picker, or a policy that blocks it** (`impFileDownload`): the same build (stamp included); download as `R.name`; marker
   `how:'download'` (keys, says, h = hashes of what storage holds now, which `impFileMoved` has just shown equal `R.held`);
   `_impHand=m` when refused; nothing cleared; no reload; box closed;
   `statKeep('⬇ <b>The imported board was downloaded</b> as “'+esc(R.name)+'” — this browser does not let ORBIT write a file where you choose'+(e? ' ('+esc(e.name)+')' : '')+'. Open it from your Downloads folder (move it to where you keep the board first, if you like). When it opens in this browser, ORBIT clears this browser’s older copies of what it replaces, so they cannot stand in front of it; until then this page writes none of '+esc(says)+' to browser storage. Nothing else on this board changed.')`.
   Step 1 gates it exactly as it gates the write.
10. **Opening a file** (`_impOpen`, before the first read of any key a full import writes). Marker present and
    `PUB.impFile.n === m.n`: the import's own file. Keys still holding what `m.h` recorded are removed (the download route's and
    the raced route's old copies; the verified route's are already gone); a key holding anything else is left and named; the
    marker is removed. The report (via `_impRep`):
    `'⬅ <b>Full board imported</b> into this file, “'+esc(m.name)+'” — written '+esc(fmtTs(m.at))+' from “'+esc(m.from)+'” and read back whole. '+esc(m.rep)+(left.length? ' ⚠ This browser’s copy of '+esc(leftSays)+' changed after the import was written, so it was left as it is — it may be another ORBIT tab’s work. If what opened is not the imported board, close every other ORBIT tab and open this file again.' : '')+impRoomSay()`.
    The handle `'import|n'` is adopted as FH only when `m.href` is this page's own address (the import was written over the page
    that ran it, which then reloaded straight into the board); otherwise it is deleted and the first Save asks where the file
    is. Marker present and the file is any other: this page is held and says, after the opening line, `statKeep(impHandMsg(''))`.
    The stamp is not written again: savedHtmlOf writes impFile only when asked, so the file's first own Save drops it. The
    import check leaves it alone (an unknown field; its fields are n, at, from — none in `IN_VAL_KEYS`).
11. **The hand-over hold.** While a marker stands (read from storage at each write, or `_impHand`), lsSet refuses any key it
    lists (counted as not kept, DIAG why `'HandOverHold'`), persist() refuses this appropriation's plan when listed, and the
    boot keep-aside write (7461) is skipped when listed. That covers every writer of those keys: persistExdb/Ace/Bud/Rp/Dest/Cyc,
    cycApplyAll, pkgApply, consTakeApply, importBoards, a new full import, the band push.
    `impHandMsg(what)`: `'⏸ '+(what? '<b>'+esc(what)+' is held.</b> ' : '')+'ORBIT wrote the imported board into <b>“'+esc(m.name)+'”</b> '+esc(fmtTs(m.at))+', and that file has not been opened in this browser since. Until it is, nothing here writes '+esc(m.says.join(', '))+' to browser storage, so an older copy cannot stand in front of it. What is on screen is unchanged; 💾 Save still writes it into this page’s own file. Open “'+esc(m.name)+'” to carry on — or, if it has been opened on another computer or in another browser, <button type="button" class="nb lnk" onclick="impHandClear()">lift the hold…</button>'`.
    `impHandClear`: `confirm('Lift the hold?\n\nORBIT wrote the imported board into “{name}” {date}, and it has not been opened in this browser since. While the hold stands, nothing here writes {lists} to browser storage, so an older copy cannot stand in front of that file.\n\nLift it only if “{name}” has been opened on another computer or in another browser, or you no longer need it.\n\nOK — lift the hold.\nCancel — keep it.')`;
    OK removes the marker (direct removeItem) and `_impHand`,
    `setStat('The hold is lifted: changes here go into browser storage again.')`; Cancel changes nothing. A full import refused
    by the hold:
    `alert('Nothing was imported from “{fname}” — this browser is holding the lists an earlier import wrote into “{m.name}” until that file is opened here.\n\nOpen “{m.name}” first, or lift the hold from the message line. This board is exactly as it was.')`
    and `setStat(impHandMsg('Importing “'+fname+'”'))`. Opening the import's file lifts it; Clear this computer lifts it
    (prio27 prefix). A newer marker replaces an older one: only the latest import's file lifts it. ORBIT tabs older than v2.14
    are not held (residual).
12. **Room after a storage-route landing** (`impRoomSay`, appended to the reopened board's report): probe 65,536 characters
    under `'prio27roomProbe'`, removed at once. Fits: `''`. Refused:
    `' ⚠ <b>Browser storage is almost full now</b>: less than 64,000 characters are free after this import, so most changes from here cannot be kept in browser storage. 💾 Save writes the board into its file, which has no such limit — save now, and after the changes you mean to keep.'`
    (measured: with 370 characters free the second edit is refused). Nothing is trimmed.
13. **A refused import leaves the board as saved as it was** (item 140 (c), built in lsAll). *(Contract: W3.)*
14. **D, Save over a program with no board.** *(Contract: W1, with W1's baked wording.)* As mapped:
    `confirm('“{name}” holds a board whose requirements are built into its program.\n\nSaving now writes this board over it.\n\nOK — write over it.\nCancel — don’t save.')`.
    On v2.13 it throws, and the catch downloads a copy whose message says "💾 Saved — updated board downloaded…" (measured).
15. **E, the empty-board import door.** E1: on an empty board a board .html from v1.80 on goes to fullImportText (its own
    conflict question, its one confirm "Import everything from …", all or nothing, every list and every appropriation's locked
    cycles, the file route when storage cannot hold it). E2: an older html or a JSON state on the empty board is captured and
    committed through one lsAll; refused → fullImportUndone's alert
    ("Nothing was imported from “{fname}” — browser storage refused {Full Fund board data} (QuotaExceededError).\n\nThis board is exactly as it was."),
    memory and MS put back, no reload. Measured on v2.13: Full Fund refused, "🧩 Loaded O&M, Full Fund — reopening…", reloaded,
    Full Fund in neither storage nor any file.
16. **Figures.** The file carries W's own strings parsed (what the storage route writes, byte for byte as values) and, for
    everything W does not write, what the reloaded board would read (pubsFor, cycByAp, memory). No figure is recomputed;
    `tiers()`, every export and the saved format are untouched; the only new saved field is `impFile`, on the import's file only.
17. **The as-it-was file** (`impFileSaveWas`, its own click, picker before any await): suggestedName
    `expName(FNAME stem+' — as it was before the import.html')`; after the pick `html=fullImportPreHtml({}, {newest:true})`,
    write, read back. Verified → `R.step1={name, gens:[_saveGen,_sideGen]}` (a later change on this page needs it again),
    `✓ Saved as “{name}” and read back whole.` Any failure after the pick →
    `statKeep('⛔ This board as it was could not be written into “{name}” ({reason}). If it already existed, the browser emptied it when you chose it: <button …>💾 this board as it was</button> downloads it instead.')`
    and the step stays open (after downloading, tick Carry on). Cancel → `No file was chosen — nothing was written.`
18. **Help, t-full third paragraph**, replaced by:
    `<p>It is all or nothing. If this browser’s storage refuses any part of it (it is full), nothing is imported and the board stays as it was; it then offers to <b>write the imported board into a new board file</b> instead. Save any work it names, choose a <b>new</b> name (the browser empties the file you choose), and open that file. If storage also refuses putting the old board back, it says which lists hold what and offers this board as it was and the file you imported: save both first.</p>`
    (+37 characters).
19. **Not built, on purpose:** a pre-flight size test (the browser's own refusal decides); compression; reading the source
    through showOpenFilePicker for isSameEntry (name match is used instead); the file route for importBoards/consTakeApply;
    R1 (DATA's storage-first data pack) — reached now only by a key the opening had to leave; trimming storage after a Save;
    the folder mode's own behaviour after a file-route import (nobody works out of the folder).

### Data-loss paths
1. Chromium empties an existing file the moment it is chosen (8,793,759 → 0 bytes, real GTK dialog), so a target check through
   the picker is impossible and the source itself can be emptied: every failure after a pick keeps W, txt and html in memory,
   clears nothing, writes no marker, does not reload, and offers both downloads at once; the box suggests a new name and says
   not to choose the imported file or any board file.
2. Clearing the import's keys loses work no saved file has: the as-it-was step must be saved (verified) or explicitly declined
   by a tick before Write is enabled; recomputed at the click and again if this page changes after it was saved.
3. A list changed between the refusal and the click (another tab): the click refuses, writes nothing and closes the box.
4. A list changed while the file was being written: after the last await, every import key is re-read synchronously against
   what storage held at the click, and this page's counters too; anything moved → nothing cleared, no reload, marker with
   hashes so the opening clears only unchanged copies and names the rest.
5. Shadowing (`trap.mjs`, measured): an edit in the reloaded empty program writes a near-empty plan newer than the import's
   file, which then opens "this browser's copy" and Save offers it over the file → the hand-over hold refuses every write to
   the import's keys in lsSet, persist and the boot keep-aside write, read from storage at write time.
6. Residual: an ORBIT tab older than v2.14 left open is not held → the box says to close every other ORBIT tab before Write;
   the opening names a copy it had to leave, and Save's HOLD ON asks.
7. The download route cannot clear at once, and stale copies would override the downloaded file (DATA storage-first: 60 of 115
   requirements and wrong totals, measured; a dirty stale copy with no room to keep it aside stops the file opening at all) →
   the marker's hashes let the downloaded file's opening remove the unchanged copies before EXDB, ACEDB, BUDDB, DESTDB, RPDB,
   CYCDB, DATA and the plan restore read them; until it is opened, the hold stands.
8. Reloading without the marker would lose the hold and the report → reload only when the marker was stored.
9. Picking the imported file itself and the write succeeding replaces the old program and data with the new version (data
   intact): after the verified write the name-match step pauses before any clearing and offers the imported file's bytes.
10. A refused import marked the board "Unsaved changes" → lsAll puts the counters back (W3).
11. Import one appropriation on an empty board landed part of a board while saying it took all of it (measured) → E1, E2.
12. Save onto a remembered program file threw on `p.writer` and downloaded (measured) → D (W1).
13. A storage-route landing with almost no room leaves most later edits refused → the room sentence.
14. The `import|n` handle adopted on a copy opened from another folder would make Save write silently to the original →
    adopted only when the marker's page address equals this page's.
15. The writer key regenerated when storage refuses it would make the new file's second Save refused → the key the file was
    stamped with is written back after the clear when storage does not hold it.
16. Crash windows: after the write and before the clear → the file is complete and newer, storage untouched; after the clear and
    before the marker → both files hold everything, no hold; the marker refused → no reload, in-memory hold.
17. The marker is in storage every file:// page shares, so its text is never trusted as markup: plain text only (rep via
    `diagPlain`), every field drawn through `esc()`.
18. The import's file opened only where this storage area cannot see the marker (another computer, another browser, a UNC path
    against a drive letter, inferred) leaves the hold standing until lifted by hand, behind a confirm saying when that is safe.

### Checks (as mapped)
1. audit-import "v2.14 — a full import browser storage cannot hold is written into a new file, read back whole, and opens as the
   import would have (item 141)". Fixture: W2's NEW over OLD (`w2Fx`), storage refusing by the "quota" stand-in at the cost
   estimates; a picker stand-in (new helper `fiPicker`) holding files by name that EMPTIES an existing file on pick, with knobs
   `failOpen/failWrite/failClose/readBack:'throw'|'differ'|'oneChar'/hold.close` (gate). Asserts: (a) refusal → returns false,
   no reload, status text exactly today's, `#impFilePanel` open with the Write button, storage byte-identical (`w2Diff ''`),
   `impMemSnap` identical, ~~`unsavedNow()` false~~ *(contract: W3's block)*, no picker called; (b) Cancel in the picker →
   nothing changed, box open; (c) a pick → the stand-in called inside the click (a `__inClick` flag set around
   `button.click()`), the written html passes `inboundCheck`, carries pubState `impFile.n` equal to the stored marker's n,
   storage: every import key gone and every other key byte-identical (`.base`, `.kept`, `prio27appn`, a planted PMO-copy key,
   `prio27writerKey`), marker has keys/says/h and no `<` anywhere, a reload attempted; (d) `boot({html: written, ls: storage after})`:
   marker gone, report said (statKeep, names the file), no hold, figures equal; its first Save through the written file as a
   remembered handle asks nothing; (e) each failure after the pick (open, write, close, read-back throw, differ, one character
   different, build throwing) → storage and memory unchanged, no marker, no reload, both rescue buttons whose Blobs equal html
   and txt byte for byte, the Write button offered again; (i) importBoards and consTakeApply refused by the same quota → no box;
   the not-put-back ("stuck") case → no box; (k) a pick named like the imported file → written and verified, nothing cleared
   until Carry on, the "inc" rescue offered. Fails on v2.13: there is no `#impFilePanel`.
2. audit-import "v2.14 — the file route keeps what browser storage held: work no saved file has is saved first, a list another
   tab changed is never cleared, and nothing here stands in front of the new file (item 141)". (g) OLD's storage marked dirty →
   step 1 lists "the O&M plan", Write disabled; ticking Carry on enables it; saving as-it-was writes
   `fullImportPreHtml({}, {newest:true})` verified, and with another tab's newer O&M in storage the as-it-was file carries that
   newer copy; a failure after its pick offers its download. Changed between refusal and click (direct setItem of prio27ff) →
   nothing written, box closed, message names the Full Fund plan. Race: the close held by a gate, prio27ff changed meanwhile →
   nothing cleared, marker how "file-raced", no reload, message names it; opening the written file then removes the unchanged
   keys and leaves prio27ff, naming it. (h) the trap (`trap.mjs`): after the verified route, the importing page reopened with
   storage after and edited (setNote) → prio27om absent from storage, status says held, DIAG why "HandOverHold"; opening the
   written file shows the imported board; lift the hold → confirm asked, Cancel keeps it, OK removes the marker and the next
   edit persists; a full import while held → the hold alert, no box; a newer board file opened over this browser's unsaved copy
   while held → kept aside and storage not written (the 7461 guard). Marker write refused (stand-in refusing `IMP_FILE_KEY`) →
   no reload, in-memory hold in that page. Fails on v2.13: no file route, no hold.
3. audit-import "v2.14 — the file route where the browser cannot write a file: downloaded, and this browser’s old copies
   cleared when it opens (item 141)". Storage holding ANOTHER, older board under the same keys (built with older clocks, as
   `hazard.mjs` does), the import refused, `window.showSaveFilePicker` deleted (and a second run where it throws
   SecurityError). One download (Blob captured) equal to the picker route's html with n masked; nothing cleared; marker how
   "download" with hashes of what storage holds; booting the downloaded file with that storage removes those keys before DATA
   (`DATA.items` is the file's list), every appropriation's figures equal the engine on the file's state, and its first
   buildSavedHtml carries the file's data pack. Fails on v2.13 (no download offered; a newer file over the older copy shows
   the older requirement list, measured 60 of 115).
4. audit-import "v2.14 — the file route gives what the storage route gives, on files from v1.80, v1.83, v1.85, v1.87, v2.11
   and a partial file (item 141)" (`equiv.mjs` as a block; reuses `v14Old/v14Rich/v14Figures/v14Cyc/v14Stores`; the
   v1.80–v1.87 files come from git history: `git fetch --unshallow` first). Route A = the import with nothing refused,
   reopened; route B = the same import refused at its last write (the report), Write through the stand-in, the written file
   booted with storage after. For every appropriation: v14Figures, v14Cyc, v14Stores and the canonical saved state (pubState
   with ts, `log[].ts` and `jrnl[].t` zeroed by name, writer and impFile removed) equal. Fails on v2.13 (no route B).
5. audit-import "v2.14 — on an empty board, Import one appropriation takes a board file whole or not at all (item 141)". The
   shell and a consolidated board saved from O&M with Full Fund; storage refusing prio27ff. On v2.14: the file goes through the
   full import (its "Import everything" confirm), nothing written, no reload, "Nothing was imported …" (or the box), no "🧩
   Loaded"; a control with nothing refused lands every appropriation, the lists and the cycles; E2: a JSON state with appns on
   the shell, refused → storage byte-identical, MS put back, no reload. On v2.13: "🧩 Loaded O&M, Full Fund — reopening…",
   reloaded, prio27om stored, prio27ff absent. Before the run grep for `importState()` on boards booted with no data pack given
   a board .html (audit-import w1import ~5540-5700, audit-recon's importState callers).
6. audit-import "v2.14 — Save into a program file with no board writes in place (item 141)" *(contract: W1's D block)*.
7. audit-import "v2.14 — a full import that only just fits says browser storage is almost full (item 141)". The quota stand-in
   at the import's total + 1,000 characters: the reopened board's report contains "Browser storage is almost full now"; a
   control at total + 200,000 does not. Fails on v2.13.
8. audit-inject "v2.14 — the file route’s box and marker draw file names as text (item 141)": a refusal with fname carrying
   markup and a picked name carrying markup, and a planted marker whose name/from/says/rep carry markup; `impFileDraw`,
   `impHandMsg` and the opening report rendered through the board's own functions; no planted element, attribute or `__pw`
   token appears. Fails on v2.13 (the functions do not exist).
9. `tools/import-file.mjs` (new; `npm run fileimport`; in verify:grid). Builds its board every run: a small board saved by the
   board's own code (boot+seed, two appropriations, a locked cycle) with a cost estimate padded past 5,242,880 characters in
   pieces under the 200,000-character text limit (as `file-route-chromium.mjs` does). Storage seeded from a page of its own
   after load (`seedLs`, never an init script; the run refuses an init script that touches storage). The stand-in picker
   installed from page code after load, holds files on disk through exposeFunction, EMPTIES an existing file on pick, and
   records `navigator.userActivation.isActive` at the call. Sections: A Brad's exact alert no longer appears; the box offers
   Write (v2.13: alert, no offer → FAIL); B Write with the suggested name: verified, keys cleared, marker, reload; the page then
   says the hold; the written file opened in a second tab: every appropriation's figures equal the source file opened directly
   in a fresh context; an edit, 💾 Save (picker once), Save again (no picker), reopen, Full Fund; C save-over-self: choosing the
   program's own file → the reload opens straight into the board, report says "into this file", Save writes without a picker;
   D a failure after pick (close rejects) → both rescues download with the exact bytes; E the two-tab trap: the held tab's edit
   is not in storage, the written file opens the imported board; F the download route (showSaveFilePicker deleted): a
   download, then that file opened over another board's older storage copy shows the full requirement list and the engine's
   totals. Also by hand: keys, dialogs, panels (drive the box from page code: fullImportUndone with a one-entry W carrying
   `.full`), leftmenu, standards (open the box in its drive), menus.
10. `tools/import-file.mjs --gtk` (`npm run fileimport:gtk`; by hand): the real GTK save dialog, headed Chromium under Xvfb
    (starts `Xvfb :97 -screen 0 1280x900x24` when DISPLAY is unset and fails naming the harness if Xvfb or libXtst is
    missing), keys sent by a new `tools/xkeys.py` (ctypes XTest, `python3 -I`; `proto/q141-verify-fix-0-xkeys.py` shows how).
    `FileSystemFileHandle.prototype.createWritable` wrapped from page code to reject after the real pick. Moves: click Write,
    Control+a, type the full path of the source "ORBIT Live.html", Escape, Return. Asserts: the picker called with user
    activation; the source on disk is 0 bytes (a CONTROL: Chromium emptied it); storage byte-identical; no reload; no marker;
    "💾 the file you imported" downloads bytes whose sha256 equals the original source's; "💾 the imported board (new version)"
    downloads html that passes inboundCheck and carries impFile. Fails on v2.13 (no box).

### Mutations (as mapped; contract ids replace `v214-file-route-` with `v214-w2-`, except where noted)
`not-offered` (the impFileOffer line removed → main (a); fileimport A) · `ungated` (`W.full &&` dropped → main (i)) ·
`mixed-offered` (offer also in the not-put-back branch → main (i)) · `counters-kept` *(contract: dropped; W3's
`marks-not-restored`)* · `click-unchecked` (no impFileMoved at the click → keeps block) · `picker-after-await`
(`await Promise.resolve();` before the picker → main (c) `__inClick`; fileimport B) · `no-readback` (the `back!==html` throw
removed → main (e) differ) · `readback-length` (compared on length only → main (e) oneChar) · `clear-before-write` (removal
before createWritable → main (e)) · `clears-others` (removes every prio27 key, or .base/.kept → main (c)) · `race-unchecked`
(impFileMoved after the last await skipped → keeps, race) · `reload-unmarked` (reload when the marker was refused → keeps) ·
`rescue-missing` (no rescue buttons → main (e)) · `rescue-swapped` (`impFileRescue('inc')` downloads R.html → main (e)) ·
`lists-from-memory` (boardPubOf takes ACEDB where W writes the estimates → equivalence) · `drops-cycles` (W's `-cyc` ignored
→ equivalence) · `own-plan-dropped` (this page's own plan left out → equivalence, partial file) · `unstamped` (impFile not
passed → main (d)) · `match-inverted` (`_impOpen`'s own test n!== → main (d), keeps (h)) · `opens-clears-changed` (a key whose
hash differs removed → keeps, race opening) · `opens-clears-nothing` (no key removed → download block) · `hold-lsset-off`,
`hold-persist-off`, `hold-boot-off` (each seam line removed → keeps) · `hold-lift-unasked` (impHandClear's confirm removed →
keeps) · `hold-import-offers-file` (the HandOverHold branch removed → keeps) · `as-it-was-skipped` (impUnsavedList returns []
→ keeps (g)) · `as-it-was-not-blocking` (Write's disabled condition removed → keeps (g)) · `as-it-was-stale-screen`
(fullImportPreHtml ignores o.newest → keeps (g)) · `name-match-rushes` (the name-match step skipped → main (k)) ·
`download-clears-now` (impFileDownload removes the keys at once → download block) · `download-unmarked` (no marker → download
block) · `marker-raw` (the opening report draws m.rep/m.name without esc() → audit-inject) · `writer-unclaimed` (the writer
omitted from the file's lists → main (d)) · `adopt-any-page` (the href test removed → main (d)) · `shell-per-slot` (E1 routing
removed → the empty-board block) · `shell-uncaptured` (E2's capture skipped → the same block, JSON state) ·
`null-pubstate-throws`, `baked-unasked` *(contract: dropped; W1's)* · `room-unsaid` (impRoomSay always '' → the room block).
Retargets: `handoff-copy-drops-store`, `save-no-lt-escape`, `cycle-file-drops-store`, `bud-not-saved`, `dest-file-no-list`,
`writer-not-in-file` (savedHtmlOf's JSON line); `v209-rv2-save-boot-no-write` (the 7461 line; *contract: the slot commit*).
Checked to still match: `fullimp-memory-before-check`, `fullimp-report-outside`, the impMixedLift line (~2879),
`full-report-lost`, `v209-rv2-save-boot-writes-unread`, `v209-rv3-save-look-writes-storage`, the `let p;` mutation (~1872).

### Overlaps (as mapped)
- Item 140 (c) built once in lsAll (W3). It also changes importBoards' and consTakeApply's refusals.
- Item 140 (a): the file route stores its handle under `'import|n'` with the existing keyed helpers and, on save-over-self,
  adopts it through item 140's keyed `_fhPut`.
- Item 140 (b) and D share `_saveInPlaceFileRun` (10322-10364); D's pubState-null branch runs before (b)'s comparison.
- Storage-full survival: persist (7514) and lsSet (3010), where the hold adds a branch; writerKey (2806), whose key the file route
  writes back after the clear.
- Item 129: the §13 restore block (7401-7470) where the 7461 guard goes; impUnsavedList reads `baseGet().dirty` fresh.
- U63/U64: no shared lines; both read keepAside/ownUnsaved and add opening messages.
- The guide's character budget; savedHtmlOf's line (retargets); importState (E1/E2 change the empty-board branches only).
- The new box joins `npm run check`'s box rule, panels-render's explicit drivers, dialogs-keyboard and standards' drive.

### Open questions (as mapped; the contract answers each)
1. On an empty board, Import one appropriation given a whole board file takes everything at once through the full import?
   Recommended: yes (E1).
2. The as-it-was step must be saved or explicitly declined before Write? Recommended: yes.
3. The new file records the importing browser as its writer? Recommended: yes.
4. Suggested name "<imported file's name> (ORBIT v2.14).html", warning never to choose the imported file? Recommended: as specified.
5. After a storage-route import that only just fits: say so, trim nothing? Recommended: say only.
6. R1 (a newer board file opened over another board's older browser copy takes that copy's requirement list; 60 of 115): log it
   as its own item for v2.15? Recommended: yes.
7. The real-dialog check in verify:grid, or by hand once per version? Recommended: by hand.
8. Windows acceptance (only Brad or a designated person can): on his work machine, with a synthetic disposable board over the
   limit, import, Write to a new name, open it, Save twice; does the picker ask "replace?", and does Chrome or Edge block file
   writing by policy? Recommended: before merge.
9. A full import while the hand-over hold stands is refused until the file is opened or the hold lifted? Recommended: yes.
10. Storage that cannot be read at all: no file route? Recommended: leave as is.

---

## storage-full

# Item 141 F and G: persist refusals counted, `memOnlyNow()`, a beforeunload prompt, the guards on switchAppn and cycGoAppn and on the imports that reopen the page, writerKey and whoAmI kept in memory for the page, and Save diagnostics' size per key family

**Contract review (§13, C23, C30b, C30c):** `memOnlyLeave` also asks when `impFileHolds()` (S11); k3 imports a JSON state file;
every switching part drives `#appnSel` with a `change` event.
**Contract changes here:** `reopenPage`/`_leaving`, the eight `location.reload()` replacements, the check.mjs "reopen" rule,
the stub `memOnlyBlock` with its three guard lines (fullImportText, consTakePick, importState), `var _wkMem`, `wkMemSay` and the
S8 tail on the file save's success line are in the slot commit (contract §2); W3 fills `memOnlyBlock`, `writerKey` and the
rest. lsAll's `delete _lsRefused[…]` on a full put-back is not built: W3's `lsMarksBack` (from save-target's (c), now W3's)
restores `_lsRefused` from its snapshot, which is the same and more. Part (h) of check A moves to W3's (c) block. Everything
else here is W3's.

Every hazard was measured on v2.13, in Chromium with the investigation's scripts and in jsdom with throwaway probes. A
throwaway prototype of this spec (`proto/storage-full-patch.py` → `proto2.html`) passes all of them and audit-other whole;
audit-board whole has one failure, an expected expectation change (see checks).

### Functions (line numbers at c863dc2)
1. **`lsSet`, 3010.** Gains a 4th argument `o`: `function lsSet(key, val, what, o)`. One new line directly AFTER the existing
   `DIAG.refused.push` line in the catch: `    if(o && o.quiet) return false;`. A quiet write is counted in `DIAG.refused`, and its
   caller says in its own words what the refusal means; lsSet's "Use 💾 Save to write it into the file" sentence is wrong for a
   setting the file never carries (the uiPrefWrite comment at 39665 gives the same reason). The push line, and the fileMark and
   setItem lines that existing mutations target, stay byte-identical.
2. **Declaration beside `_sideGen`, 2978.** After `let _sideGen=0, _sideSaved=0, _lsRefused={};`:
   `var _sideBootGen=Infinity;   // v2.14 (item 141 F): _sideGen when the board finished opening; a list refused at or before it was refused by the opening`.
   A var: memOnlyNow can run from a beforeunload fired while the script is still being read.
3. **End of opening, 39585.** Directly after the unchanged `try{ _sideSaved=_sideGen; }catch(e){}` (mutation v197w2 targets
   that line): `try{ _sideBootGen=_sideGen; }catch(e){}`.
4. **`persist`, 7514.** In the catch, after `_persistFail=true;`, in lsSet's words:
   `    try{ DIAG.refused.push({t:Date.now(), what:diagClean(_AP.t+' board data', false), why:String((e&&e.name)||'error').replace(/[^A-Za-z]/g,'')}); }catch(e2){}`.
   Measured on v2.13: `DIAG.refused` stayed `[]` while every edit was refused, and Save diagnostics said "none this session".
   The refusal message gains one sentence at its end:
   `+' Until it is saved, closing or reloading this page asks first'+(SANDBOX? '.' : ', and switching appropriation waits.')`.
   persist stays a direct setItem: through lsSet it would count the edit twice (`fileMark('board')` after save()'s own
   `_saveGen++`), and an import's `_lsCapture` would capture it. Comment: what was measured, and why it is direct.
5. **`memOnlyNow` (new), after `unsavedNow()` (32035).**
   `function memOnlyNow(){ try{ if(DIRTY && _persistFail) return true; for(const k in _lsRefused) if(_lsRefused[k]>_sideBootGen) return true; }catch(e){} return false; }`.
   A locked view leaves DIRTY as it was (cycView 24937 stashes it without resetting it, and save() refuses in a view), so DIRTY
   in a view is the working plan's flag. A refusal made while OPENING is not counted (gen ≤ `_sideBootGen`). It depends on lsAll
   restoring `_lsRefused` when everything was put back.
6. **`memOnlyBlock` (new), 32036.** `function memOnlyBlock(head, act)`; returns true when it stopped, having said why. If
   `!memOnlyNow()`: return false. If `_dlOnly`: ask with confirm (text in design); OK returns false; Cancel does
   `setStat(esc(head)+' — nothing changed.')` and returns true. Otherwise setStat the refusal and return true. SANDBOX words it
   as "your office’s own file". When `impMixedOn()` it adds the Save a copy sentence.
7. **`memOnlyLeave`, `_leaving`, `reopenPage` (new), after the liveLeaving listener (15895).**
   `var _leaving=false;` · `function memOnlyLeave(ev){ try{ if(_leaving || !memOnlyNow()) return; ev.preventDefault(); ev.returnValue=''; return ''; }catch(e){} }` ·
   `try{ window.addEventListener('beforeunload', memOnlyLeave); }catch(e){}` ·
   `function reopenPage(){ _leaving=true; try{ location.reload(); }catch(e){} }`. Every `location.reload()` becomes
   `reopenPage()`: 3204 (switchAppn), 11665 (consTakeApply), 12528 (fullImportText), 12900, 12931 and 12941 (importState), 33030
   (driveStorePull's shell branch) and 36755 (clearComputer). No existing mutation find contains those lines. clearComputer keeps
   its `window.onbeforeunload=null` line.
8. **`switchAppn`, 3195.** New signature `switchAppn(a, asked)`; returns true only when it reopens. The sandbox branch unchanged
   but returns false. `if(!(a&&a!==APPN&&APPNS[a])) return false;` ·
   `const back=function(){ try{ const _as=document.getElementById('appnSel'); if(_as) _as.value=APPN; }catch(e){} try{ render(); }catch(e){} };` ·
   `if(!asked && memOnlyBlock('Not switched', 'switching appropriation reopens the page')){ back(); return false; }` ·
   `if(!lsSet('prio27appn', a, 'Which appropriation this browser opens', {quiet:true})){ back(); setStat(<S3>); return false; }` ·
   `try{ liveLeaving(); }catch(e){}` then `reopenPage(); return true;`. liveLeaving moves after the write, so a refused switch
   keeps the folder lock. The render() in back() redraws the chart-of-accounts `.cesel` select (13382) as well.
9. **`cycGoAppn`, 23449.** After the existing first line:
   `if(memOnlyBlock('Not opened', 'opening '+_SLUGMAP[k].t+' reopens the page')){ try{ render(); }catch(e){} return; }` ·
   `lsSet(CYC_GO_KEY, k, 'Which board opens PPBE cycles next', {quiet:true});` ·
   `if(!switchAppn(APPN_LBL[k], true)){ try{ localStorage.removeItem(CYC_GO_KEY); }catch(e){} }`. The question is asked before
   the mark is written, and the mark is taken back when the switch does not happen (left behind, it opened PPBE cycles unasked
   the next time). A refused mark write still switches; only the panel does not open there.
10. **`writerKey`, `writerKeyHeld` (new), `_wkMem` (new), 2806.** `var _wkMem='';` holds the key this page made when storage
    refused it ('' while storage holds this browser's key).
    `function writerKeyHeld(){ if(_wkMem) return _wkMem; let k=''; try{ k=localStorage.getItem('prio27writerKey')||''; }catch(e){} return /^[0-9a-f]{32}$/.test(k)? k : ''; }`.
    writerKey: `let k=writerKeyHeld(); if(!k){ <make k exactly as today>; if(!lsSet('prio27writerKey', k, 'This browser’s writer key', {quiet:true})) _wkMem=k; } return k;`.
    One refusal per page. Storage is still read first while `_wkMem` is '', which keeps every existing check that sets
    `prio27writerKey` mid-page meaning what it did. Measured on v2.13: the key was remade on every call, so the second Save was
    refused with "unknown holds the pen".
11. **`uiPenOther`, 39740.** Replace the two lines that read storage with `const k=writerKeyHeld(); if(k && writerIsMe(WRITER)) return '';`.
    On v2.13 in a full browser it named this browser's own pen as someone else's ("unknown").
12. **`whoIs`, `whoAmI`, `_whoMem` (new), 7953.** `var _whoMem='';` set only when storage refuses the name. whoIs:
    `let w=''; try{ w=localStorage.getItem('prio27who')||''; }catch(e){} return _whoMem||w;`. whoAmI: `let w=whoIs()||null;`;
    in the prompt callback `const kept=lsSet('prio27who', nv, 'Your editor name', {quiet:true}); _whoMem=kept? '' : nv;`, then
    setStat S6; after the prompt `w=whoIs()||null;`. Measured on v2.13: the prompt fired twice per edit (save() and the
    journal), six times for three edits, and every save was stamped "unknown".
13. **`clearComputer`, 36738.** When `memOnlyNow()` holds, the unsaved-changes warning reads S7 instead of today's text.
    Mutation `v204-106-unsaved-unsaid` still targets `const unsaved=...`. `try{ location.reload(); }catch(e){}` becomes
    `reopenPage();`, so the browser does not ask a third question.
14. **`fullImportText`, 12386.** After `if(pmoCopyRefuse(fname, txt)) return false;`:
    `if(memOnlyBlock('Not imported', 'a full import reopens the page')) return false;`. Its reload at 12528 becomes reopenPage().
15. **`consTakePick`, 11579.** After `if(pmoCopyRefuse(fname, txt)) return;`:
    `if(memOnlyBlock('Not imported', 'taking an appropriation from a file reopens the page')) return;`. The reload at 11665
    becomes reopenPage().
16. **`importState`, 12802.** Directly before the `if(!confirm('Import '+(fromBoard?...` question (~12865):
    `if(memOnlyBlock('Not imported', 'loading this file reopens the page')){ inp.value=''; return; }`. Submittals and packages
    are routed earlier. The three reloads become reopenPage(). If item 141 E rewrites this branch, the rule moves with it: before
    the first write of any branch that reopens.
17. **`lsAll`, 3040.** *(Contract: replaced by `lsMarksBack`'s restore of `_lsRefused`.)* In the refusal branch, when `back`,
    remove each W key from `_lsRefused`. Measured on v2.13 (probe2): after a refused, fully put-back lsAll, `_lsRefused` names
    the refused key and `unsavedNow()` is true, so memOnlyNow would arm falsely after Brad's refused import.
18. **`diagLsKinds` (new), before diagStoreOf (34433).** Walks every localStorage key, reads only key.length plus value.length,
    and sorts by the NAME alone, first match wins: (1) not `CLR_PREFIX` (`/^(prio27|spmt)/`) → "Not ORBIT"; (2) `/-pmo(\d+)/` →
    "PMO copies" (distinct stamps counted); (3) `/\.kept$/` → "Work kept aside"; (4) `/\.base$/` → "Save records";
    (5) `^prio27(<APPN_SLUGS>)-cyc$` → "Locked cycles"; (6) `^prio27(<APPN_SLUGS>)$` → "Boards";
    (7) `^prio27(execdb|acedb|buddb|reprog|destdb)$` → "Lists"; (8) anything else → "Settings". Returns
    `{rows:[{k,label,n,c}], stamps}`. It never returns a key name.
19. **`diagReport`, 34482.** After the unchanged "Browser storage:" line, and only when `keys>=0`, the "Storage by kind" header
    and one line per kind. On error: `'  Storage by kind:    could not be read'`. "Writes refused" now counts persist() and the
    four quiet writes too.
20. **`_saveInPlaceFileRun` (message) and the folder push (message), 10384 and 33208.** When
    `_wkMem && (may==='claim'||may==='take')`, append S8 to the success line at 10384 and to `penNote` at 33208.
    *(Contract: the file save's tail is a slot seam, `wkMemSay(may)`; W3 adds it to `penNote`.)*
21. **`tools/check.mjs`, rule "reopen".** In the program script, `location.reload(` occurs exactly once, inside
    `function reopenPage(`. Fail message: "a page reopen bypasses reopenPage() (it would not set _leaving): lines …". On v2.13
    there are 8 occurrences and no reopenPage, so it fails. *(Contract: in the slot commit.)*

### Design
**The rule.** Work is ON SCREEN ONLY when this board holds a change browser storage refused (`DIRTY && _persistFail`), or when a
list was refused after the board opened. While that holds, the browser asks before the page is left, and nothing in ORBIT
reopens the page without saying why and naming Save. A file save ends the state: DIRTY goes false and `sideWrote` clears
`_lsRefused`.

Measured on v2.13 (each re-run 3 Nov):
- `design-resilience/p2/hazards.mjs` (copy `proto/storage-full-hazards.mjs`) on the e-v213 board (200,000 characters free):
  A: an edit is refused, `DIAG.refused` is `[]`, closing the tab asks nothing, and the edit is gone on reopen. B:
  `switchAppn('FULL FUND')` reloads, and the edit is gone.
- `switchloss.mjs` (0 free): the prio27appn write is refused, the page reopens on O&M, the edit is gone, no dialog.
- design-file-first e2e-full: the second Save is refused "unknown holds the pen", and the name is asked 5 times.
- jsdom probes (`proto/storage-full-probe*.mjs`): probe: `DIAG.refused []` after a refused persist; switch and Go to reload;
  the prio27appn refusal is uncounted; `writerKey()` differs call to call; the name is asked 6 times for 3 edits and stamped
  "unknown". probe3: the first Save writes and the second is refused. probe2: a refused, put-back lsAll leaves `_lsRefused`
  set. probe6: after a download, switching asks nothing and reloads; Save diagnostics has no by-kind lines.

The prototype passes every probe: refused "O&M board data — QuotaExceededError"; beforeunload prevented, in Chromium too
(hazards2: a "beforeunload" dialog); switch refused with the edit kept, in Chromium as well; the writer key stable, two Saves
both written, the name asked once and stamped "BL"; by-kind lines with no foreign key name. check.mjs passes; audit-other passes
whole; audit-board whole has one failure, the expected expectation change.

1. **persist() counts its refusal**: one `DIAG.refused` entry per refused write, what `'<appropriation> board data'`.
   **S1** is today's text plus one sentence:
   `'⚠ <b>This change is not in browser storage</b> — it was refused (QuotaExceededError). Your work is still on screen and still correct. Use 💾 <b>Save</b> now to write it into the file, which does not use browser storage. Until it is saved, closing or reloading this page asks first, and switching appropriation waits.'`
   In a PMO copy: `'…to keep it in your office’s own file, which does not use browser storage. Until it is saved, closing or reloading this page asks first.'`
2. `memOnlyNow()` as in functions.
3. **beforeunload.** While `memOnlyNow()` holds and `_leaving` is false, the browser shows its own question ("Leave site? Changes
   you made may not be saved."). Every deliberate reopening goes through `reopenPage()`, which sets `_leaving` first; each has
   already asked. A PMO copy is armed too. A locked view is not armed by edits typed on it (discarded by design).
4. **memOnlyBlock(head, act) refusal, S2:**
   `'⛔ <b>{head}.</b> Your latest changes are on screen only: browser storage refused them, so no saved copy holds them, and {act}, which would lose them. 💾 <b>Save</b> writes them into the board file, then try again.'`
   A copy reads "keeps them in your office’s own file". With `impMixedOn()`:
   `' 💾 Save is held while the stopped import is sorted out: ⬇ <b>Save a copy</b> (▾ beside 💾 Save → ⬇ Save a copy…) keeps them in a new file.'`
   After a downloaded copy (`_dlOnly`), confirm instead:
   `'Your latest changes are in the copy you downloaded, but not in the board file, and browser storage could not keep them.\n\n{Act}: afterwards only the downloaded copy holds them.\n\nOK — go on.\nCancel — stay here.'`
   Cancel says `'{head} — nothing changed.'`. This is the only way out where policy blocks in-place writing and Save can only
   download. Callers (head / act): switchAppn "Not switched" / "switching appropriation reopens the page"; cycGoAppn "Not opened"
   / "opening Full Fund reopens the page"; fullImportText "Not imported" / "a full import reopens the page"; consTakePick "Not
   imported" / "taking an appropriation from a file reopens the page"; importState "Not imported" / "loading this file reopens
   the page".
5. **switchAppn never reopens after a refused write.** **S3:**
   `'⛔ <b>Not switched.</b> Browser storage is full, so this browser cannot note which appropriation to open, and the page would reopen on {_AP.t} again. Nothing changed. Setup › Save diagnostics… shows what fills it; Setup › Clear this computer… frees what ORBIT keeps there, after asking (the board file is not touched).'`
   A same-length name (O&M to OPN) still replaces in place and switches in a full browser.
6. **cycGoAppn**: the guard first, then the mark (quiet), then `switchAppn(…, true)`; the mark removed when no switch happens.
7. **writerKey** kept for the page; **S8** appended after a Save that claims or takes the pen with a key storage would not keep:
   `' Browser storage would not keep this browser’s writer key: once this page is closed, 💾 Save here will refuse and name you as the writer — Audit › Take the pen… then takes it back.'`
8. **whoAmI** kept for the page, asked once. **S6:**
   `'👤 Editor name set to <b>{name}</b> — stamped on future saves. Browser storage would not keep it, so this page remembers it until it is closed, and asks again next time.'`
   (the last sentence only when the write was refused).
9. **Clear this computer**, when `memOnlyNow()` holds, **S7:**
   `'\n\n⚠ This board has changes ON SCREEN ONLY: browser storage refused them, so neither this browser nor the file holds them. They will be lost. Cancel and 💾 Save first to keep them.'`
10. **Save diagnostics (G)**, read only, after the unchanged "Browser storage:" line:
    `'  Storage by kind:    characters, keys and values together, as browser storage counts them'`, then one line per kind,
    label padded to 18, in this order: Boards, Locked cycles, Lists, Work kept aside, Save records, PMO copies, Settings, Not
    ORBIT. Each `'N entr(y|ies), C characters'` or `'none'`; PMO copies adds `' (S publish date(s))'`. It names no key, reads no
    value beyond its length, quotes no limit, and the kinds add up to the entries on the line above.

Not built here, deliberately: the post-landing room check (141 A/B); the clean-point hash, hazard C (rejected by the judge); an
"on screen only" save-state label; routing the other direct writes through lsSet (open question 6).

### Data-loss paths
1. An edit storage refuses, then the tab is closed, reloaded or crashes (hazard A). Fix: memOnlyLeave asks; persist's message
   says so. A crash cannot be guarded; the message tells the person to Save now.
2. An edit storage refuses, then the appropriation is switched while there is room for prio27appn (hazard B, probe B3 with 40
   characters free): the page reopened and the edit was gone. Fix: memOnlyBlock before any write.
3. The same edit with storage full to the last character (switchloss): prio27appn refused, the page reopens on the same
   appropriation, the edit gone, the switch silently undone. Fix: memOnlyBlock first; never reopen after a refused write.
4. Go to under PPBE cycles: the same loss, plus a stray prio27cycGo mark. Fix: guard before the mark; mark taken back.
5. An import that reopens the page while work is on screen only (consTakeApply, importState's slot branches, a full import of a
   file without the open appropriation — "Kept as this board has it" while the reload loses the edit). Fix: memOnlyBlock at each
   reopening door, before any question or write.
6. False arming after an all-or-nothing write that lsAll put back (probe2). Stopped by lsAll restoring `_lsRefused` (W3's
   `lsMarksBack`).
7. A download is the only save (policy blocks in-place writing): a refusal-only guard would hold the page forever. Fix: after a
   downloaded copy with no later change (`_dlOnly`), ask once. Residual: a download cancelled in a Save As dialog is invisible
   to the page; the question says to check that it is there.
8. The writer key regenerated with every call: the second Save refused (measured). Fix: kept for the page. Residual: next
   session, Save names this person as the pen holder; S8 says so at the claim. Two tabs where another later stores a different
   key: this page keeps its own, consistent with the WRITER it claimed.
9. The editor name asked on every save and stamped "unknown" (measured). Fix: kept for the page.
10. Clear this computer while work is on screen only: lost by design after two questions; the wording says on screen only;
    reopenPage sets `_leaving` so the browser does not add a third question.
11. `_leaving` set by a reopen that does not happen (jsdom; a blocked reload) would disarm the prompt: reopenPage sets it on the
    line directly before `location.reload()`. The checks use fresh boards.
12. liveLeaving (the folder lock release) also runs on beforeunload even when the person cancels the leave: pre-existing; the
    folder is unused and the 3-minute expiry re-arms. Noted, not changed.
13. Item 141 C's hold, refusing persist() by key, makes the work on screen only too: stopped only if the hold leaves
    `_persistFail` true *(contract: the slot's persist seam sets it)*.
14. Save diagnostics reads storage and never writes; it never prints a key name or a value.
15. Not covered: a refused `.base` clean mark after a verified file Save (hazard C at the next opening; conservative). Owned by
    item 140 *(contract: not changed in v2.14)*.

### Checks (as mapped)
1. audit-board "v2.14 — storage full: a change browser storage refuses is counted, and nothing reopens the page over it unasked
   (item 141 F)". boot(); seed two requirements (USAF, ANG); sync BASE_ITEMS; save(); render(); then DIRTY=false and
   `_persistFail=false`. A counted quota stand-in, as in audit-import's w2Import "quota" mode: `Storage.prototype.setItem` throws
   QuotaExceededError when used − old + key + new > (used now + room). room 40 lets prio27appn and prio27cycGo fit but not the
   edit (`S.notes.A` = 80 characters; save()). Navigation counted as jsdom's "navigation" errors. (a) `_persistFail` true;
   `DIAG.refused` gains exactly `['O&M board data — QuotaExceededError']`; diagReport says "Writes refused:     1 this session";
   memOnlyNow() true. (b) a cancelable "beforeunload" Event dispatched on window is defaultPrevented; CONTROL: on a board with
   nothing on screen only it is not. (c) `switchAppn('FULL FUND')` does not navigate; `#appnSel` reads O&M; the status starts
   "⛔ Not switched. Your latest changes are on screen only"; `S.notes.A` still the typed text; prio27appn not written. (d)
   `cycGoAppn('ff')` does not navigate, and prio27cycGo is absent. (e) after `publishState()` (createObjectURL stubbed),
   switchAppn asks exactly one confirm starting "Your latest changes are in the copy you downloaded"; Cancel: no navigation and
   "— nothing changed"; on a fresh board in the same state, OK navigates. (f) a stand-in FH file Save makes memOnlyNow() false
   and beforeunload not prevented, and switchAppn then navigates. (g1) `_lsRefused[DEST_KEY]=_sideBootGen` does not arm (an
   opening refusal). (g2) `persistAce()` refused after opening arms it, and beforeunload is prevented. (h) lsAll refused at room
   200 and put back: memOnlyNow() false *(contract: in W3's (c) block)*. (i) clearComputer with (g2)'s state: the first question
   contains "ON SCREEN ONLY"; afterwards beforeunload is not prevented (`_leaving`). (k1) `fullImportText(another board's
   buildSavedHtml)` while on screen only: returns false; no confirm asked; storage byte-identical; status starts "⛔ Not
   imported." (k2) the same through `consTakePick({appns:{ff:…}}, txt, 'x.html')`: no prompt. (k3) the same through
   importState, driven by audit-hostile's `drive()` pattern. Fails on v2.13: memOnlyNow is undefined and the block throws;
   independently, `DIAG.refused` is `[]`, the switch and Go to navigate, and after a download nothing is asked and the page
   reloads.
2. audit-board "v2.14 — storage full: the writer key and the editor name are kept for the page (item 141 F)". room 0;
   prio27writerKey and prio27who removed first; window.prompt counts calls and returns "BL"; window.confirm true; FH a stand-in
   empty file. (a) `writerKey()===writerKey()`; `writerFp()` stable; prio27writerKey absent; `DIAG.refused` holds exactly one
   "This browser’s writer key — QuotaExceededError" after 10 calls. (b) two `saveInPlaceFile()` calls after two edits: the file
   written twice; the second status starts "💾 Saved in place by BL"; `uiPenOther()===''`. (c) the first status contains
   "would not keep this browser’s writer key". (d) three edits ask the name once; `MS.by==='BL'`; `whoIs()==='BL'`. (d2) with
   "Ann" stored, storage then refusing, `whoAmI(true)` typing "Bob" gives `MS.by` "Bob" after the next save. (e) CONTROL:
   storage accepting stores both keys, sets no `_wkMem` or `_whoMem`, and adds no "would not keep" sentence. Fails on v2.13: the
   keys differ; the file written once and the second Save refused "unknown holds the pen"; uiPenOther gives "unknown"; the name
   asked 6 times and stamped "unknown".
3. audit-board "v2.14 — storage full: switching appropriation never reopens the page after a refused write (item 141 F)". A
   clean board (memOnlyNow false), prio27appn removed, room 0: `switchAppn('FULL FUND')` does not navigate; `#appnSel` reads O&M;
   status starts "⛔ Not switched. Browser storage is full"; `DIAG.refused` holds "Which appropriation this browser opens —
   QuotaExceededError". C2: room 15 (fits "prio27cycGo"+"ff", not "prio27appn"+"FULL FUND"): `cycGoAppn('ff')` does not navigate
   and leaves no prio27cycGo. CONTROL: prio27appn "O&M" stored, room 0: `switchAppn('OPN')` navigates. Fails on v2.13 (probe B2):
   it navigates and the refusal is uncounted.
4. audit-other "v2.14 — Save diagnostics counts browser storage by kind and names no key that is not ORBIT’s (item 141 G)".
   Planted keys `prio27om-cyc` (100), `prio27acedb` (50), `prio27om.kept` (30), `prio27om-pmo1790000000000` (70),
   `prio27om-pmo1790000000000.base`, `prio27execdb-pmo1791111111111`, `prio27appn` and `spmtTheme`, and two foreign keys
   `'vellichor-<img src=x>'` and `'zanzibar-secret-token'` whose value is "Brunhilde Okonkwo". Each kind's entries and characters
   equal sums the harness computes from the keys it reads itself, never from diagLsKinds; the kinds add up to the "Browser
   storage:" entries; PMO copies reads "(2 publish dates)" and carries the copy's .base; Not ORBIT reads 2 entries; neither
   foreign name, the value, nor `<img` appears anywhere in the report. Fails on v2.13: no "Storage by kind" line.
5. `tools/storage-full.mjs` (new; `npm run storagefull`; appended to verify:grid). Chromium via tools/chrome.mjs; the board
   built by the tool; storage seeded and filled from a blank page with a filler key, never an init script. A: the edit typed for
   real into `#erNote`, Save clicked in the edit box; `page.close({runBeforeUnload:true})` raises a "beforeunload" dialog;
   dismissed, the page stays and the note is on screen. B: `selectOption('#appnSel','FULL FUND')` gives no load within 5 s; APPN
   is O&M; the note still there; the message starts "⛔ Not switched." B2: a clean board with 0 room gives "Not switched.
   Browser storage is full". W: two Saves through a page-code picker stand-in both write. Built from hazards.mjs A and B and
   switchloss.mjs. On v2.13: A no dialog, the note lost; B navigated, the note lost.
6. `tools/check.mjs` rule "reopen" *(contract: slot)*. Fails on v2.13 (8 bare reloads).
7. Moved expectation: audit-board line 5315 (v2.05 item 116, "go to"). The switchAppn stub must say a switch happened:
   `switchAppn=function(a){ window.__sw.push(a); return true; };`. On the prototype the unchanged check fails, got
   `[['FULL FUND'],null]` (mark taken back because the stub returned undefined): the only audit-board failure in a whole run.
8. Re-run, expected unchanged: audit-import "v1.95 — a refused write of the cost estimates or the reprogramming log is in Save
   diagnostics" (a fresh boot, so the count stays 2); audit-other's diagnostics block ("Writes refused:     1"); `npm run menus`
   (S3 and S8 name "Setup › Save diagnostics…", "Setup › Clear this computer…" and "Audit › Take the pen…"); keys, dialogs,
   panels, leftmenu and standards; audit-hostile; every suite whole, with recon, import and board at 8 GB.

### Mutations (as mapped; contract ids replace `v214-storage-full-` with `v214-w3-`)
- `persist-uncounted`: persist's new DIAG push → '' (A(a)).
- `memonly-persist-ignored`: `if(DIRTY && _persistFail) return true;` → `if(false) return true;` (A(a), (b), (c)).
- `memonly-counts-opening`: `if(_lsRefused[k]>_sideBootGen) return true;` → `>=` (A(g1)).
- `memonly-side-ignored`: the `for(const k in _lsRefused)…` line in memOnlyNow → '' (A(g2)).
- `boot-gen-unset`: `try{ _sideBootGen=_sideGen; }catch(e){}\n` → '' (A(g2)).
- `beforeunload-off`: `try{ window.addEventListener('beforeunload', memOnlyLeave); }catch(e){}` → '' (A(b)).
- `leaving-ignored`: `if(_leaving || !memOnlyNow()) return;` → `if(!memOnlyNow()) return;` (A(i)).
- `reopen-not-leaving`: `function reopenPage(){ _leaving=true; try{` → `function reopenPage(){ try{` (A(i)).
- `switch-unguarded`: the switchAppn memOnlyBlock line → '' (A(c)).
- `switch-reloads-refused`: `if(!lsSet('prio27appn', a, 'Which appropriation this browser opens', {quiet:true})){` → the same
  with `&& false` (block C).
- `switch-box-stays`: the refused-write branch's `back();` dropped (block C).
- `quiet-uncounted`: in lsSet, the push line and `if(o && o.quiet) return false;` swapped (block C and B(a)); shares its find's
  first line with `diag-refusal-not-kept`; both still match once.
- `dl-no-question`: in memOnlyBlock, `if(_dlOnly){` → `if(_dlOnly){ return false;` (A(e)).
- `cycgo-mark-first`: the memOnlyBlock line and the `lsSet(CYC_GO_KEY, …)` line in cycGoAppn swapped (A(d)).
- `cycgo-mark-left`: `if(!switchAppn(APPN_LBL[k], true)){ try{ localStorage.removeItem(CYC_GO_KEY); }catch(e){} }` →
  `switchAppn(APPN_LBL[k], true);` (block C2).
- `writerkey-remade`: `if(!lsSet('prio27writerKey', …, {quiet:true})) _wkMem=k;` → the lsSet without the assignment (B(a), (b)).
- `writerkey-retries`: in writerKeyHeld, `if(_wkMem) return _wkMem; ` → '' (B(a)).
- `pen-reads-storage`: uiPenOther's `const k=writerKeyHeld();` → a storage read (B(b)).
- `name-not-kept`: `_whoMem=kept? '' : nv;` → `_whoMem='';` (B(d)).
- `name-storage-first`: whoIs `return _whoMem||w;` → `return w||_whoMem;` (B(d2)).
- `import-full-unguarded`, `import-take-unguarded`, `import-state-unguarded`: each import door's memOnlyBlock line → '' (A(k1),
  (k2), (k3)) *(contract: the lines are slot seams; W3 owns the mutations)*.
- `clear-onscreen-unsaid`: `(only? '\n\n⚠ This board has changes ON SCREEN ONLY` → `(false? …` (A(i)).
- `diag-foreign-as-orbit`: `if(!CLR_PREFIX.test(k)) f='other';` → `if(false) f='other';` (block D).
- `diag-copy-precedence`: `/-pmo(\d+)/` → `/-pmo(\d+)$/` (block D).
- `diag-stamps-uncounted`: `f='copy'; stamps[m[1]]=1;` → `f='copy';` (block D).
- `diag-kinds-missing`: `  if(keys>=0) try{ const LK=diagLsKinds();` → `  if(false) try{ …` (block D).
- RETARGET `v205-116-go-no-mark` (cycGoAppn rewritten): find `  lsSet(CYC_GO_KEY, k, 'Which board opens PPBE cycles next', {quiet:true});\n`
  → ''. Stays caught by audit-board v2.05 item 116 "go to", once that check's stub returns true.

### Overlaps (as mapped)
- lsSet: the quiet argument; item 141 C's hold is enforced by key inside lsSet and lsAll; merge by line; the hold applies to
  quiet writes too.
- lsAll: memOnlyNow needs `_lsRefused` cleared when every key is back (item 140 (c), which must also undo the `_sideGen` and
  `_saveGen` moves). Check A(h) shared with 140 (c).
- persist(): the DIAG push and the message tail; item 141 C's hold must leave `_persistFail` true; item 129 changes save()
  (adjacent, textual only).
- fullImportText and its reload (141 A/B); importState's reloading branches and the shell import (141 E); consTakePick and
  consTakeApply; driveStorePull's IS_SHELL branch (U63/U64's function; recommended there: reload only if persist() returned
  true) *(contract: not built; no work is lost, the folder keeps its copy)*.
- `_saveInPlaceFileRun` (10384) and the folder push (33208): the S8 tail; item 140 (b), D and U63/U64 edit the same functions.
- diagReport: the by-kind lines; item 140 may correct the "Save writes to" line.
- clearComputer: S7 and reopenPage; item 140 (a) moves the remembered file per page address in `prio-fh`, which clearComputerRun
  deletes.
- switchAppn and cycGoAppn: retarget `v205-116-go-no-mark`; audit-board's "go to" stub at 5315 must return true.
- The `.base` clean mark refused after a verified file save: item 140's area, not built here.
- The post-landing room check belongs to 141 A/B.
- Item 129 (two tabs): memOnlyNow is per tab, by design.

### Open questions (as mapped; the contract answers each)
1. Imports that reopen the page while a change is on screen only: refuse until 💾 Save, or go on after their own questions?
   Recommended: refuse.
2. After a downloaded copy: ask once, or refuse until an in-place Save? Recommended: ask once (the browser's default button in
   that question is OK).
3. persist() stays a direct write, counting its refusal with lsSet's entry? Recommended: yes.
4. When storage will not keep the writer key, say so at the claim (S8)? Recommended: yes.
5. Print the measured limit (5,242,880, Linux only) in Save diagnostics? Recommended: no, counts only.
6. Other direct storage writes (baseSet, keepAside's .kept, jrnlMarkSeen, pmoMineSet, uiPrefWrite, the stopped-import marks,
   SIDE_OPEN_KEY, the menu groups): bring them under lsSet in v2.14 or later? Recommended: later, except baseSet's refused clean
   mark after a file Save, which item 140 should decide.

---

## held

# Item 129 (all four findings), item 124 (both findings), and ledger U63, U64 and U35

**Contract review (§13, C17):** `baseMarkDirty` writes `blank` (`true` or `false`, from `pageBlankNow()`) on every record it writes.
**Contract changes here:** none in scope; W4 builds all of it. W4's `baseMarkDirty` is the one record writer (it replaces
save-target's `baseMark`). The driveStorePull shell-branch change storage-full recommended is not built (contract §9).

Every repro was re-run on v2.13 (`c863dc2`, built with `git show` into the scratch folder), and every one still reproduces.
Each design was tried as a throwaway on a scratch copy of the board (`board-p5.html`; the diff is `proto/held-sketch.diff`).
That sketch fixes every repro. On it: check.mjs passes; audit-recon, audit-other, audit-inject and audit-hostile pass;
audit-board fails 1 check and audit-import fails 20, all named under Checks; mcount gives 3213 of 3220 targets matching once,
and the 7 that miss are the retargets listed under Mutations.

### Functions (line numbers at c863dc2)
1. **`baseMarkDirty` (new), directly above loadCounted (7786).** The one place this page marks this browser's record
   (`<key>.base`) as unsaved; reads the record fresh from storage, never the cached `_baseDirty`. Exact body:
   `function baseMarkDirty(){ _baseDirty=true; let fo; try{ fo=_driveBase; }catch(e){ fo=undefined; } try{ const b=baseGet(); if(!b.dirty || (+b.file||0)!==(+LASTKNOWN||0) || (fo && JSON.stringify(b.folder||{})!==JSON.stringify(fo))){ const p={file:+LASTKNOWN||0, dirty:true}; if(fo) p.folder=fo; baseSet(p); } }catch(e){} }`.
   The try around `_driveBase` matters: that let is declared at 32892, and a save() made while the script is still being read
   would otherwise hit its temporal dead zone. Comment: two tabs share one record, and the record must name the save THIS
   page's work came from.
2. **`loadCounted`, 7786.** Becomes exactly `function loadCounted(){ _saveGen++; DIRTY=true; baseMarkDirty(); }`.
3. **`save`, 7787.** Line 7793, `  try{ if(!_baseDirty){ _baseDirty=true; baseSet({dirty:true}); } }catch(e){}`, becomes
   `  baseMarkDirty();` (2-space indent). Nothing else in save() changes.
4. **`driveRestore`, 33377.** (1) Line 33453, the same cached-record line, becomes `    baseMarkDirty();` (4-space indent).
   (2) The keep rule (33435-33437) becomes: `    const own=ownUnsaved(MS, j.store, baseGet());` (unchanged), then
   `    const keep=own || !driveStoreOn() || (+MS.ts||0)!==driveBaseOf(pinAp);`, then
   `    const ka=keep? keepAside(MS, {why:'folder', by:j.by||'', ts:+((j.store&&j.store.ts)||j.ts||0), saved:!own}, baseGet()) : true;`,
   then `    if(ka==='occupied' && !own){ setStat(keptOccupiedMsg(j.by, 0, 'the folder’s history', false, true)); render(); return; }`,
   then the existing occupied line, unchanged. (3) The no-room refusal splits: `!own` gets its own sentence (design E). (4) The
   status line names where 💾 Save writes, and says when saved work was kept aside (design E).
5. **`pmoStampApart`, `pmoLinkApart`, `pmoChainApart`, `yrCopySame` (new), directly above pmoProvId (8820).** Exact text in
   design B.
6. **`yearHas`, 6976.** Line 6988, `    if(!x) return false;`, becomes `    if(!x || pmoLinkApart(it, x)) return false;`. No other
   line changes; mutations `v207-rv-yearhas-prior-twin`, `v207-rv2-*` and `v207-rv3-*` find those lines.
7. **`yearLinkOf`, 7003.** After the inT line (7007), add `  const me=(T===S || (y!==undefined && +y===cur));`. In the `hit`
   filter (7008) and the `twin` filter (7015), `x.id!==id` becomes `(!me || x.id!==id)`. At the end of the twin filter,
   `+x.prior.fy===+p.fy; })[0];` becomes `+x.prior.fy===+p.fy && !pmoLinkApart(it, x); })[0];`. Why `me`: an added
   requirement's id belongs to its own year. Once the twin fix lets the right twin through, a Bravo numbered NEW-2 in both FY29
   and FY30 was skipped as "itself", and Copy to year then made a second copy without asking (measured with sk1: v2.13 asked
   about the wrong copy; the twin fix alone asked nothing; with `me`, it asks about the right one).
8. **`naFromHere`, 35520.** Line 35532 becomes
   `       && (!/^NEW-/.test(String(src.prior.id)) || +x.prior.fy===+src.prior.fy) && !pmoLinkApart(src, x)) return true;`.
   Leave line 35531 untouched: `v206-fix2-chain-by-office` finds it.
9. **`pmoPriorHere`, 8772.** (1) In the x filter at line 8797, insert `!pmoChainApart(p, from, i) && ` right after
   `i.prior && `. Leave line 8798 untouched: `v206-fix2-proposal-year` finds it. (2) After line 8796
   (`if(!/^NEW-/.test(id) && on.indexOf(id)>=0) return id;`), insert:
   `    if(/^NEW-\d+$/.test(id) && on.indexOf(id)>=0){ const PT=(+p.fy===+MS.cur)? S : (MS.years||{})[p.fy], s0=PT? yrItemOf(PT, id) : null,`
   and on the next line
   `      x0=items.filter(function(i){ return i && i.id===id; })[0]; if(s0 && x0 && (x0===s0 || yrCopySame(x0, T, s0, PT))) return id; }`.
10. **`jrnlWalk`, 7584.** In the array branch, before `const n=Math.max(...)`, add:
    `if(path.length===2 && path[1]==='custom' && jrnlById(a) && jrnlById(b)){ const ids=[]; a.concat(b).forEach(function(x){ if(ids.indexOf(x.id)<0) ids.push(x.id); }); const of=function(L, id){ return L.filter(function(x){ return x.id===id; })[0]; }; ids.forEach(function(id){ jrnlWalk(of(a, id), of(b, id), path.concat(id), out); }); return; }`.
11. **`jrnlById`, `jrnlCustomPlace`, `jrnlCustomHere` (new), above jrnlCapture (7602).**
    `function jrnlById(L){ const seen=Object.create(null); return L.every(function(x){ if(!x || typeof x!=='object' || typeof x.id!=='string' || !x.id || seen[x.id]) return false; seen[x.id]=1; return true; }); }`
    `function jrnlCustomPlace(e){ return e.p[0]==='custom' && (e.p.length<3 || typeof e.p[1]!=='string'); }`
    `function jrnlCustomHere(e){ const T=(MS.years||{})[e.fy||MS.cur]; return !!T && (T.custom||[]).filter(function(x){ return x && x.id===e.p[1]; }).length===1; }`
12. **`jrnlSet`, 7624.** First statement inside the for loop:
    `if(Array.isArray(node) && typeof k==='string'){ const el=node.filter(function(x){ return x && typeof x==='object' && x.id===k; }); if(el.length!==1) return false; node=el[0]; continue; }`.
    Before the final write (after `const k=path[path.length-1];`), add `if(Array.isArray(node) && typeof k==='string') return false;`.
13. **`jrnlUndoable`, 7642.** After the line `  && !jrnlBySvcPlace(e)`, add a line `  && !jrnlCustomPlace(e)`. Keep the
    existing line intact: `v197w4-journal-put-back-by-place` finds it.
14. **`jrnlUndo`, 7654.** After line 7660 (the `if(!jrnlUndoable(e)){ ... }` line, which stays byte for byte because mutations at
    mutate.mjs:4756 and 4759 find it), insert
    `  if(e.p[0]==='custom' && !jrnlCustomHere(e)){ setStat('⚠ <b>Not put back</b>: '+jrnlLabel(e)+' — that added requirement is no longer in FY'+((e.fy||MS.cur)%100)+'. Nothing was changed.'); return; }`.
15. **`jrnlBody`, 7729.** The last cell gets an else-branch: if `jrnlCustomPlace(e)` and the path does not start with `(`, it shows
    `<span class="hint" style="margin:0" title="…">not put back here</span>`, each kind with its own title (design C).
16. **`pmoVal`, 8280.** After `    if(c && c.event) v=String(c.event); }`, add `  if(key==='si' && v==='') return '';`.
17. **`pmoNorm`, 8309.** Line 8321 becomes
    `    case 'si':    return (v==='' || SI_CODES.some(function(x){ return x[0]===v; }))? [true, v] : [false];`.
18. **`pmoFmtVal`, 9251.** After the `if(k==='mc')` line, add
    `  if(k==='si' && (v===null||v===undefined)) return 'follows the PMO and prime rules';` and
    `  if(k==='si' && v==='') return 'none (chosen by hand)';`. Leave line 9262 untouched (v200 mutations at mutate.mjs:4908-4914
    find it). In the `'__new'` branch, after `if(v.costElem) parts.push(v.costElem);`, add
    `if(v.siNone===true) parts.push(FL('si')+' none (chosen by hand)'); else if(v.si) parts.push(FL('si')+' '+pmoFmtVal('si', v.si));`.
19. **`pmoProposalOf`, 8744.** Line 8755: after `si:(S.si||{})[id]||'',`, add `siNone:(S.si||{})[id]==='',`.
20. **`pmoTake`, 9753.** After `    a.mc=!!a.mc;` (9915), add `    a.siNone=(a.siNone===true && !a.si);`.
21. **`pmoAcceptProposal`, 8895.** Line 8939 becomes `  if(a.siNone===true && !a.si){ if(!S.si) S.si={}; S.si[id]=''; }`
    followed by `  else if(a.si){ if(!S.si) S.si={}; S.si[id]=a.si; }`.
22. **`keepAside`, 8004.** After the `const m={...}` line (8013), add `    if(meta.saved) m.saved=true;`.
23. **`keptOccupiedMsg`, 8020.** Gains a fifth parameter `inFile`. The words ` and holds new work besides` become
    `(inFile? ', and what is on screen is saved only in the board file, which the shared folder does not keep' : ' and holds new work besides')`.
    Without inFile, every caller and audit-import:11676 read exactly as today.
24. **`saveStateShow`, 32049.** The title at 32071 gains a branch: swap first, as today; then `_keptMeta.saved===true` gives
    "Work saved only in the board file, which the shared folder’s copy replaced on screen"; anything else "Work this browser held
    that no saved copy had", as today.
25. **`driveStorePull`, 32923.** Lines 33015-33017 become: own as today;
    `  const keep=own || !driveStoreOn() || (+MS.ts||0)!==driveBaseOf(mySlug());` (operands in this order so that
    `v200-u19-putback-store-at-putback` still matches once);
    `  const ka=keep? keepAside(MS, {why:'folder', by:j.by||'', ts:theirs, saved:!own}, baseGet()) : true;`;
    `  if(ka==='occupied' && !own){ setStat(keptOccupiedMsg(j.by, theirs, 'the shared folder', false, true)); render(); return false; }`;
    then the existing occupied line, byte for byte (`kept-folder-wrong-word` finds it). The no-room refusal gets a `!own`
    sentence. At 33036, `if(!quiet || own) setStat(` becomes `if(!quiet || keep) setStat(`, and the loaded line adds the
    saved-work sentence when `keep && !own` (design E).
26. **`inspHeld`, 38539.** Each record gains `rk` (the data-rk of its closest `[data-rk]` row, or null), `rf` (its data-rf) and
    `dp` (`!!i.__dlgPend`).
27. **`inspHeldBack`, 38546.** Keep `function inspHeldBack(el, held){\n  held.forEach(function(x){\n    const i=` intact
    (`v208-rv2-f2-hold-dropped` finds it). The filter becomes `function(n){ return inspHeldSame(n, x); }`. After `if(!i) return;`,
    add `    x.back=true; if(x.dp) i.__dlgPend=true;` ahead of the existing `    i.value=x.v; i.__pend=true; i.__held=x.v;` line,
    which stays as it is.
28. **`inspHeldSame`, `heldRedraw` (new), after inspHeldBack.**
    `function inspHeldSame(n, x){ if(x.rk===null || x.rk===undefined) return n.getAttribute('onchange')===x.h; const r=n.closest? n.closest('[data-rk]') : null; return !!r && r.getAttribute('data-rk')===x.rk && n.getAttribute('data-rf')===x.rf; }`
    `function heldRedraw(el, draw){ const hs=inspHeld(el); hs.forEach(function(h){ try{ h.el.removeAttribute('onchange'); }catch(e){} }); try{ draw(el); } finally { hs.forEach(function(h){ try{ if(h.el.isConnected) h.el.setAttribute('onchange', h.h); }catch(e){} }); if(hs.length) inspHeldBack(el, hs); } return hs.filter(function(h){ return !h.back; }); }`.
    Name the variable h, not x: `v208-rv2-f2-change-commits-in-redraw` finds inspectorBody's `held.forEach(function(x){ ... })`
    line, and a second copy would make it match twice.
29. **`rcnBody` / `rcnDraw` (split), 5930.** Rename the existing body to `function rcnDraw(el)` (it reads bg itself). The new
    rcnBody: `function rcnBody(){ const el=document.getElementById('rcnBody'); if(!el) return rcnDraw(el); const lost=heldRedraw(el, rcnDraw); if(lost.length) setStat(<design F sentence>); }`.
    In rcnDraw, each row is `<tr data-rk="'+esc(rk)+'">`, where `const rk=(typeof e.k==='string' && rep===i)? e.k : '#'+i;`. The
    three text inputs get `data-rf="rcn"`, `data-rf="eeic"` and `data-rf="t"`. The handlers keep their index-based text
    (`v200-regtext-*` and `v200-cycreg-repeat-row-unsaid` find around them).
30. **Input listener (new line), 38510.** Leave line 38510 byte for byte (`v208-f2-typing-not-marked` and
    `v209-w1-row-typing-not-marked` find it). Add a separate line after it:
    `document.addEventListener('input', function(e){ const t=e.target; if(t && t.tagName==='INPUT' && t.closest && t.closest('#rcnBody')) t.__pend=true; }, true);`.

### Design
**Repro status on v2.13 (c863dc2).** Every finding still reproduces.
- Two tabs: `recovery/v209/held/two-tabs/skeptic/k2-jsdom.mjs` and `k3-copy.mjs` pointed at v2.13. Variant A: after tab 1
  types ANN-2, the record reads `{file:<Kim's F1>, dirty:false}`; opening Kim's newer file then shows no ANN-2, and nothing is
  kept aside; ANN-2 survives only in prio27om until the next edit. Variant B: reopening F1 and pressing Save asks nothing and
  writes tab 1's work over F1, so Kim's KIM-1 is lost. The copy variant fails the same way, under `prio27om-pmo<ts>`.
- Years: `years/js/t1, t2, t3, t5`, and the three skeptic scripts, with BOARD set to v2.13; output the same as on d3ce17d. t1:
  Roll forward reports "1 copy created … 1 already there and left alone", and Bravo is missing from FY30. t2: Bravo's rows say
  "FY29 ALREADY HOLDS NEW-1" and "FY30 ALREADY HOLDS NEW-1", but NEW-1 is Alpha, copy A's. t3: Cancel leaves Bravo out of
  FY30. t5 and sk.mjs (apply and handroll): nothing flagged, and FY31 (FY30 in sk) holds Delta (Gamma) twice.
- Item 124 Put back (`proto/held-124-putback*.mjs`): NEW-2's value 250 is put back after NEW-1 is deleted and lands on NEW-3,
  whose 300 becomes 200. Put back of a value of the deleted NEW-3 throws a TypeError inside applyState and leaves `{ask, fy26}`
  with no id in `S.custom`; the next edit saves it. Put back of the "added requirements" line also throws and leaves
  `S.custom` as `[null]`.
- SI (`proto/held-124-si.mjs`): in a PMO copy for PP, A set to none by hand and B back to the rules. Submit says "Nothing to
  send yet."
- U63 and U64 (`proto/held-u63.mjs`, `held-u64.mjs`, with W1H's file and folder stand-ins): S1 saved into the board file; a
  quiet refresh loads Bob's newer folder copy and keeps nothing; the next file Save asks nothing; S1 is then in no copy the
  board can reach. Put this back while Live view is watching does the same, and its status says Save writes "to the folder"
  when Save writes the board file.
- U35 (`proto/held-u35*.mjs`): 88888 typed into the RCN list, then one render(): the field shows 11111 again, and Esc no longer
  asks. After a load that adds a row above, the typing is gone.

**A. Item 129, finding 4: two tabs.** Rule: whenever this page writes its own work into storage as unsaved, this browser's
record says so, read fresh from storage, and it names the save this page's work came from (LASTKNOWN) and the folder copies it
was read against (`_driveBase`). Write `baseMarkDirty` exactly as given, and route loadCounted, save() and driveRestore's line
through it. Nothing else changes: persist(), the boot's own writes of the record, and every write that marks the record clean
(the file save, the folder save, bootTakeFile, pmoTakeFile, keptPutBack, driveBaseSet). With one tab, every write of LASTKNOWN
is already paired with a baseSet, so the record is what it was before and only an extra small write is added. No new sentence.
What a person sees changes in two places: in variant A, the next newer file keeps the typed work aside (if other work is already
kept, the board does not open the newer file and says so in keptOccupiedMsg's existing words); in variant B, Save asks the
existing HOLD ON. Measured on k2 and k3. Not built: two tabs still write one storage key, so the last writer wins; Brad's
earlier answer on sealing the plan key per office file was "Not now".

**B. Item 129, findings 1-3: the copy stamp and the rolled added requirement.** Above pmoProvId:
```js
// v2.14 (item 129): TWO LINKS TO ONE PROVISIONAL ID ARE APART when both say which copy minted it and the copies differ. Two copies out at once number their proposals alike, so copy A's NEW-PSM-1 and copy B's NEW-PSM-1 are two proposals, and each one's continuation is its own work. A link that does not say which copy minted its id is read as before.
function pmoStampApart(a, b){ return !!(a && b && a.pmo && b.pmo && +a.pub && +b.pub && (a.pmo!==b.pmo || +a.pub!==+b.pub)); }
function pmoLinkApart(a, b){ const pa=a && a.prior, pb=b && b.prior; if(!pa || !pb || String(pa.id)!==String(pb.id) || +pa.fy!==+pb.fy || !pmoProvId(String(pa.id))) return false; return pmoStampApart(pmoLinkStamp(a), pmoLinkStamp(b)); }
function pmoChainApart(p, from, i){ return !!(p && i && i.prior && pmoProvId(String(p.id)) && String(i.prior.id)===String(p.id) && +i.prior.fy===+p.fy && pmoStampApart(from, pmoLinkStamp(i))); }
// v2.14 (item 129): THE SAME ADDED REQUIREMENT IN TWO YEARS, ONE A WHOLE-YEAR COPY OF THE OTHER: the same id, the same link or none, and the same plan event, title, office and CCaR record. This is yearHas's second-review rule, stated here for the duplicate walk, so that a different requirement numbered alike in another year is never taken for it.
function yrCopySame(x, T, src, PT){ const lk=function(c){ return (c && c.prior)? +c.prior.fy+'|'+String(c.prior.id) : ''; }; return !!(x && src && x.id===src.id && lk(x)===lk(src) && x.event===src.event && x.title===src.title && grpOf(x, T)===grpOf(src, PT) && ccarOf(x, T)===ccarOf(src, PT)); }
```
`pmoLinkStamp(c)` already falls back to `c.from {pmo, pub}` when the link carries no stamp, so a requirement accepted from copy B
is stamped B. Make the edits to yearHas, yearLinkOf (including `me`), naFromHere and pmoPriorHere exactly as given. No new
sentence. The existing words now name the right requirement, or nothing: "🗓 Rolled forward — 2 copies created across FY30";
Copy to year asks "FY30 already carries "Bravo (copy B)" as NEW-2, linked to it." about Bravo's own copy, and asks nothing when
FY30 holds only Alpha's; the review rows read "ROLLED FORWARD FROM FY30, FY31 WOULD HOLD NEW-1 — accepting adds it again" and
"FY30 ALREADY HOLDS NEW-1 — accepting adds it again" for a requirement the board added and rolled. Measured with t1, t2, t3, t5,
sk1, sk3 and sk.mjs (apply, handroll, other-new1 and control-A).

**C. Item 124: Put back by id.** The journal files a year's added requirements by their id, never by their place. A field edit
is recorded as `['custom', 'NEW-2', 'ask', 0]`. A whole requirement being added or deleted is one line, `['custom', 'NEW-2']`
with a=null and b={…}, or the reverse (before v2.14, deleting one above it wrote a cascade of shifted fields). Two cases fall back
to place, both as v2.13 records them: a year whose added requirements repeat an id, and one with an element with no string id
(`jrnlById`). Put back finds the requirement by id. When it is gone, Put back refuses before asking anything:
`'⚠ <b>Not put back</b>: {jrnlLabel(e)} — that added requirement is no longer in FY27. Nothing was changed.'` jrnlSet itself also
refuses, so a direct call cannot create an element without an id. Two kinds of line are not offered for Put back
(`jrnlCustomPlace`); the journal panel's last cell shows "not put back here" for each, with its own hover title:
(i) a whole added requirement: "An added requirement as a whole — added or removed — is not put back from the change journal. To
take one out, use Remove on its row’s ⋯ menu; to bring one back, put back an earlier saved copy from History & recovery."
(ii) a line filed by place (numeric p[1], written before v2.14): "Recorded before v2.14 by its place in the list of added
requirements. Put back now, it could land on another requirement, so it is not offered."
jrnlLabel needs no change: p[1] is now an id, so it names the requirement ("added requirements — EY (ask › 0)"). A side effect,
and a correct one: cycWho and pmoOutChanged now see edits to added requirements, because the id is in the path.

**D. Item 124: "no SI code" in a PMO copy.** `''` (none, chosen by hand) and absent (follows the PMO and prime rules) stay two
values from the copy through the review to the board. pmoVal returns `''` for an si of `''` (the baseline, Submit and pmoNow all
see it); pmoNorm takes `''` at the door; pmoApply's generic `jrnlSet(MS.cur, ['si', id], prop)` already writes `''` and deletes on
null. Proposals carry `siNone:true` when `S.si[id]===''` and si stays `''`; the door normalises it to a boolean true only when si
is empty; accepting writes `S.si[nid]=''`. A proposal from a copy before v2.14 carries `si:''` and no siNone, and is read as
today: it follows the rules. Words: in the review and the change report, an SI of null reads "follows the PMO and prime rules"
and `''` reads "none (chosen by hand)". A proposal's line reads "Navy SI code none (chosen by hand)", or "Navy SI code EN —
Engine" when one is set (before v2.14 the proposal line did not show the SI code). Forward compatibility: the v2.09 newer-build
rule already refuses a v2.14 package on a v2.13 board.

**E. Ledger U63 and U64: U19's rule.** When a shared-folder copy replaces what is on screen (driveStorePull's load, or
driveRestore's Put this back), what is on screen is kept aside unless it is the folder's own copy and 💾 Save writes to the
folder: `keep = own || !driveStoreOn() || (+MS.ts||0)!==driveBaseOf(ap)`. A copy kept this way that holds no unsaved work
carries `meta.saved=true`. If other work is already kept, nothing is loaded or put back; if there is no room, nothing is loaded
or put back. Sentences:
- Refresh, loaded, with saved work kept aside (said also on a quiet refresh):
  `'⬇ Loaded O&M FY27 from the shared folder — saved by <b>Bob</b> {age}. What was on screen is saved only in the board file, which the shared folder does not keep, so it is <b>kept aside</b>: [put it back] (or from History &amp; recovery, any time).'`
  When the kept work is unsaved, the line keeps today's words.
- Refresh, refused because other work is kept: keptOccupiedMsg with inFile:
  `'⚠ <b>Bob</b> saved a newer copy to the shared folder ({ts}), but this browser already keeps earlier work aside (kept {t}), and what is on screen is saved only in the board file, which the shared folder does not keep. Kept work is never replaced, so the newer copy was <b>not loaded</b> and nothing was lost. Deal with the kept work first: put it back · save it as a file · discard it.'`
- Refresh, refused for lack of room, saved work:
  `'⚠ <b>Bob</b> saved O&M to the shared folder {age}, but what is on screen is saved only in the board file, which the shared folder does not keep, and there is no room to keep it aside — so their copy was <b>not loaded</b>. Save a copy of yours first (▾ beside 💾 Save → ⬇ Save a copy…), then [load theirs without keeping yours here].'`
- Put this back, status: `'↶ Put back the copy from <b>{pretty}</b>. It is on screen and in this '` + one of two endings. When
  `driveStoreOn()`: `'browser; press 💾 Save to write it back to the folder for everyone.'` (as today). Otherwise:
  `'browser. 💾 Save writes it into the board file, not the shared folder, because 📡 Live view is just watching: switch Live view to ● Working out of this folder first to put it back in the folder for everyone.'`
  Then, if keep && !own: `' What was on screen is saved only in the board file, which the shared folder does not keep, so it is <b>kept aside</b>: [put it back] (or from History &amp; recovery, any time).'`
  If own, today's sentence: "What was on screen, in no saved copy, is kept aside".
- Put this back, refused because other work is kept: `keptOccupiedMsg(j.by, 0, 'the folder’s history', false, true)`.
- Put this back, no room, saved work:
  `'⚠ <b>Nothing was put back.</b> What is on screen is saved only in the board file, which the shared folder does not keep, and there is no room to keep it aside. Save a copy of yours first (▾ beside 💾 Save → ⬇ Save a copy…), then put the earlier copy back.'`
- The ↶ work kept aside button's title for such a copy: `'Work saved only in the board file, which the shared folder’s copy replaced on screen, kept aside {t}. Put it back.'`
No change to LASTKNOWN: the work is kept aside rather than the next Save being made to ask.

**F. Ledger U35: the F2 hold for the RCN / EEIC list.** What has been typed into the list and not committed survives any redraw:
a Live tick, a status line, a load. It is held by its ROW and its FIELD (data-rk, data-rf), never by the handler, because the
handler names a row by its place. The keyboard and the caret come back with it, and its pending marks (`__pend`, and
`__dlgPend`, so Esc still asks). Chromium's change event as the old field is removed commits nothing (the handler is detached
during the draw). If the row is gone after a load, the typing is not put on any other row, and the board says:
`'⚠ What you were typing in the RCN / EEIC list (“88888”) was not kept: the row it was in is no longer on the list. Nothing was changed.'`
The RECORD panel and the rows draw no data-rk, so their F2 hold is unchanged.

**G. What else moves in the tree.** Retarget 7 mutations (listed below). Change expectations in 3 places, each with a `// v2.14`
comment: audit-board "v1.97 W4 — a figure journalled before the list changed …" looks up `'custom.'+id+'.ask.0'` instead of
`'custom.0.ask.0'`; audit-import "v2.09 review — Apply into a year it starts …" expects the added line under `['custom', nid]`
and not offered (e.u false); audit-import "v2.09 review — a link to another of the office’s proposals …" looks up the path
`['custom', <Q's FY31 id>, 'prior', 'id']`. Re-base the fixtures of 18 audit-import checks that U63's rule now meets. No change
to the guide: every sentence in it stays true.

### Data-loss paths
1. Two tabs, the board: work typed in tab 1 after tab 2 opened a newer file was recorded as saved; the next newer file replaced
   it with nothing kept aside; reopening the other tab's file let Save write tab 1's work over that colleague's save asking
   nothing. STOPPED BY baseMarkDirty (two-tabs (a), (b), (c), (c2), (e); `base-*` mutations).
2. Two tabs, a PMO copy: the same (two-tabs (d)).
3. Roll forward with two copies out at once: the second copy's continuation skipped as "already there", its value missing from
   the next year. STOPPED BY pmoLinkApart in yearHas (years (a)).
4. Copy to year asked about the wrong twin; with the twin fix alone it would have asked nothing and put the same work in twice.
   STOPPED BY pmoLinkApart and `me` in yearLinkOf (years (c)).
5. Apply's duplicate question, Cancel: could leave another copy's requirement out of the year. STOPPED BY pmoChainApart (years (d)).
6. Apply rolling a year forward, and a year rolled by hand: a board-added requirement went in twice, unnamed. STOPPED BY the
   rolled direct hit through yrCopySame (years (e), (g)).
7. Put back after an added requirement above has been deleted: the value written onto the next requirement. STOPPED BY
   journalling by id (journal (b)).
8. Put back of an added requirement that is gone: threw and left an element with no id (or a null), which the next save stored.
   STOPPED BY jrnlSet, jrnlUndo and jrnlCustomPlace (journal (c), (d)).
9. Entries recorded by place before v2.14: not offered (journal (e)).
10. A hand-chosen "no SI code" in a PMO copy never sent; the board went on deriving a code (the SI block).
11. U63 (the U63 parts). 12. U64 (the U64 parts). 13. U35 (the U35 block and keyboard-reach W).
14. Introduced by the U63 keep and stopped by design: the one kept slot. A board opened from its file has its file copy kept
    aside at the first refresh; after that, a newer copy over unsaved work is refused as "occupied" until the kept copy is dealt
    with. Nothing is lost, but a newer copy waits.

### Checks (as mapped)
1. audit-import "v2.14 — two tabs: work typed in one after the other opened a newer file stays unsaved, and Save asks (item
   129)". Built from W1H (baseFile, disk, folder, connect, lsOf) plus one lsLoad helper (clear storage, then set every key),
   k2-jsdom.mjs's method. Fixture: Kim saves F0; Ann's T1 opens F0 and types R1 "ANN-1"; Kim saves F1 (R3 "KIM-1"); T2 opens F1
   on T1's storage, which keeps ANN-1 aside; lsLoad(T1, T2's storage); T1 types R2 "ANN-2". (a) the record reads dirty:true and
   file === T1's LASTKNOWN (F0's save time); v2.13 `{file:F1, dirty:false}`. (b) Kim saves F2; opening F2 on that storage leaves
   ANN-2 on screen or kept aside, never only in the main key (here the board refuses as occupied, because ANN-1 is kept; the
   status matches keptOccupiedMsg); v2.13 FAIL. (c) Variant B: opening F1 and pressing 💾 Save asks exactly one HOLD ON naming
   Kim, and Cancel leaves KIM-1 in the file; v2.13 asks nothing. (c2) As (a), but T2 also types after opening F1, so the record
   is `{file:F1, dirty:true}`; after T1 types, the record names F0, and Save over F1 asks; v2.13 FAIL. (d) PMO copy, as
   k3-copy.mjs, under `prio27om-pmo<ts>`; v2.13 FAIL. (e) Folder: T1 works out of the stand-in folder and types; T2 loads Kim's
   newer folder copy (record folder F1); lsLoad; T1 types; T3 opens on that storage, connects, and 💾 Save is refused with the
   choice ("Nothing was written … Save yours over theirs"), Kim's change still the folder's copy; v2.13 writes it silently.
   (f) CONTROL: in one tab, save() and loadCounted() leave the record's file and folder exactly as v2.13 left them, with
   dirty:true.
2. audit-import "v2.14 — two copies out at once: each copy’s continuation is its own work, and a rolled added requirement is the
   same work (item 129)". Built from the w209 helpers already in the suite (`w209rvBoard32`, `v184Publish`, `w209rvCopy`,
   `w209add`, `w209rv2From`, `v184Submit`, `take`, `w209rv2Tick`, `w209rv2Plan`, `w209rv2Cust`). (a) t1: both FY29 continuations
   (Alpha from copy A, Bravo from copy B, both prior {2028, NEW-PSM-1}) rolled into FY30: "2 copies created", FY30 holds both
   events; v2.13 "1 copy created … 1 already there". (b) with only Alpha rolled, `naFromRows(2029,'PSM')` read from FY30 shows
   Bravo as not here; v2.13 shows it here. (c) with both rolled (FY30 Bravo is NEW-2, the same number as its FY29 source), Copy
   to year of FY29 Bravo asks one "already carries … as NEW-2" question; with only Alpha in FY30, it asks none; v2.13 names
   NEW-1. (d) t2 and t3: Bravo's FY29 and FY30 review rows carry no ALREADY HOLDS NEW-1; Apply with the duplicate question
   answered Cancel puts Bravo into FY30; v2.13 FAIL. (e) t5: a board-added FY30 NEW-1 (Delta) continued by a proposal for an
   unstarted FY31: the row says "ROLLED FORWARD FROM FY30, FY31 WOULD HOLD NEW-1 — accepting adds it again"; Apply's roll
   question lists it and asks the duplicate question; Cancel leaves FY31 holding NEW-1 once; with FY31 rolled by hand first
   (sk.mjs handroll), "FY31 ALREADY HOLDS NEW-1"; v2.13 FAIL. (f) CONTROL: a continuation from the same copy as the one FY30
   holds is still flagged; a link from before the stamp (`from.pub` 0) is the same work as before. (g) CONTROL, sk.mjs
   other-new1: FY30 holds an unrelated NEW-1 under another plan event; a proposal continuing FY29's NEW-1 into an FY31 rolled
   from FY30 is not flagged.
3. audit-board "v2.14 — Put back finds an added requirement by its id, and refuses once it is gone (item 124)". The board's A,
   plus X, Y, Z added through reqCreate on AV, values [100,0,0], [200,0,0], [300,0,0]; between edits the window clock moved on
   61 s (as U19 part (l) does). (a) `setAsk(Y,0,'250')` journalled at `['custom', Y, 'ask', 0]`; v2.13 `['custom', 1, …]`.
   (b) removeReq(X), then Put back of that line: Y reads 200 and Z reads 300; v2.13 makes Z 200 and leaves Y at 250. (c) Z's value
   changed, then Z removed: Put back asks nothing and says "⚠ Not put back: … that added requirement is no longer in FY27.
   Nothing was changed."; every `S.custom` element still has a string id; a reopen from storage has every order id resolving and
   no page error; v2.13 throws a TypeError and leaves `{ask,fy26}`. (d) the added and removed lines each appear once, at
   `['custom', id]`; jrnlUndoable false for both; the panel's cell reads "not put back here"; v2.13 offers `['custom',0]`. (e) a
   planted v2.13-style line `{p:['custom',0,'ask',0]}` is not offered. (f) CONTROL: `['desc','A']` and `['titles', id]` are put
   back as before. (g) jrnlLabel of (a)'s line names Y's plan event. (h) a year whose added requirements repeat an id is
   journalled by place, and its lines are not offered.
4. audit-import "v2.14 — a hand-chosen “no SI code” in a PMO copy is sent, reviewed and accepted, apart from “follows the rules”
   (item 124)". O&M board, services USAF and USN. A (PP, nothing stored, the rules give EN), B (PP, stored ''), C (PP, stored
   'OT'). Published, opened as a copy for PP. In the copy: `setSi('A','')`; B back to the rules through the edit box's `'\u0004'`
   (erSave); C set to none; a proposal added through the Add box then set to none through the edit box. (a) the package carries
   A `{si:''}`, B `{si:null}`, C `{si:''}`, the proposal siNone true; v2.13 "Nothing to send yet". (b) the door takes all three.
   (c) the review (`#subBody`) and pmoReport's cells: A "follows the PMO and prime rules" → "none (chosen by hand)"; B "none
   (chosen by hand)" → "follows the PMO and prime rules"; C "OT — Other Government Costs" → "none (chosen by hand)"; the proposal
   line contains "Navy SI code none (chosen by hand)". (d) Apply all: `S.si.A===''`, `S.si.C===''`; B absent, so siOf(B) is
   "EN"; the accepted proposal's `S.si` is ''; each si journal line has Put back. (e) CONTROL: a code changed from LA to EN travels
   as before. (f) CONTROL: a v2.13-style proposal with `si:''` and no siNone is accepted as following the rules.
5. audit-import "v2.14 — a shared-folder copy that replaces work saved only in the board file keeps it aside, and Put this back
   says where Save writes (ledger U63, U64)". Built from W1H (baseFile, disk, folder, connect, liveSwitchOff, clickSave,
   keptTitle). U63: (a) Bob pushes F0, then F; Alice's board file holds S1, saved through 💾 Save; connected and working out of the
   folder, a quiet refresh (`driveStorePull(true)`) loads F; S1 is kept aside (why "folder", meta.saved true); the status says
   "… What was on screen is saved only in the board file, which the shared folder does not keep, so it is kept aside"; the save
   state's title begins "Work saved only in the board file, which the shared folder’s copy replaced on screen"; v2.13 nothing
   kept. (b) Live view switched to just watching; 💾 Save writes F into the file; S1 still kept aside; ↶ Put back brings S1 back,
   after which 💾 Save asks one HOLD ON; OK writes S1; v2.13 S1 is nowhere. (c) other work already kept: not loaded, S1 still on
   screen, keptOccupiedMsg's inFile words; v2.13 loads F. (d) no room (`Storage.setItem` throws for '.kept'): not loaded, the
   no-room sentence for saved work. (e) CONTROL: the screen is the folder's own copy: loads with nothing kept. (f) CONTROL:
   unsaved work kept with today's words. U64: (a) S1 saved in the file; Live view watching; 🕓 Show what the folder kept; Put this
   back keeps S1 aside, saved, and the status contains "💾 Save writes it into the board file, not the shared folder, because 📡
   Live view is just watching"; v2.13 nothing kept, "to the folder". (b) 💾 Save writes the earlier copy into the file; after a
   reopen, S1 is in the kept slot. (c) CONTROL: working out of the folder with the folder's own copy on screen: nothing kept,
   today's status. (d) CONTROL: an edit typed during the history write (NR01's route) kept aside, "What was on screen, in no
   saved copy, is kept aside"; passes on v2.13. (e) no room, saved work: "Nothing was put back" with the saved sentence.
6. audit-board "v2.14 — the RCN / EEIC list keeps what is typed across a redraw, by its row (ledger U35)". `MS.rcn = [rA 11111
   AAAAA 'ORIGINAL TITLE', rB 22222 BBBBB 'SECOND']`; `rcnOpen=true`; render(); dlgSync(). (1) focus rA's RCN input, set it to
   '88888', fire input only; after two render() calls the field reads '88888', has the keyboard and `__pend`; `MS.rcn[0].rcn` is
   still '11111'; v2.13 shows '11111'. (2) wrap rcnDraw so that it fires change on the old field first, as "redraw holds" does
   for inspectorDraw: nothing committed (v2.13 has no rcnDraw; the block fails it by name). (3) `dlgDirty(top)` true after the
   redraw, so Esc asks. (4) applyStore a copy whose list has rZ 99999 unshifted on top, then render(): the typing sits on rA's row
   (now second), rZ reads 99999. (5) blur commits '88888' to rA; rZ and rB unchanged. (6) the same for EEIC ('QQQQQ') and the
   title ('HELD NEW TITLE'). (7) a load that removes rA: no row holds the typing, `MS.rcn` unchanged, and the status reads the
   design F sentence. (8) CONTROL: a committed value shows the stored text after a redraw, and the RECORD panel's existing F2 and
   "redraw holds" parts still pass.
7. `tools/keyboard-reach.mjs` section W, "the RCN / EEIC list holds typing across a redraw, in Chromium (v2.14, ledger U35)", in
   verify:grid. Two RCN rows; open the list (`mRun(toggleRcn)`); Tab to row 1's RCN field and type '8888'; `render()` twice; type
   '9'; the field reads '88889' and the stored value is unchanged; Tab away: stored '88889', the second row untouched; Esc after
   typing, before committing, asks. Fails on v2.13.
8. The existing suites, whole, on the sketch: audit-board fails 1 ("v1.97 W4 — a figure journalled before the list changed …",
   which looks up 'custom.0.ask.0'). audit-import fails 20: two are the planned journal-path changes ("v2.09 review — Apply into
   a year it starts …" (journal) and "v2.09 review — a link to another of the office’s proposals …" (Put back)); 18 are U63's
   keep meeting the one kept slot: "v2.00 (U13) — a refresh during a save loads nothing" parts (1)×2, (3a), (3b), (4a), (4b),
   (4c), (4d), (5) Ca, (5) Cc and (6b); "v2.00 (U30) …" (5d) CONTROL; and "v1.89 — saving never silently overwrites somebody’s
   work" part "folder, the other side". Recommended: start those fixtures from the folder's own copy (one driveStorePush, or
   `driveBaseSet(ap, MS.ts)`, before the scenario), with a `// v2.14 (ledger U63)` comment, so they keep testing the race; change
   U30 (5d)'s expectation instead, because it is exactly the newly kept case. audit-recon, audit-other, audit-inject,
   audit-hostile and check.mjs pass.

### Mutations (as mapped; contract ids replace `v214-held-` with `v214-w4-`)
- `base-cache`: find `  _baseDirty=true;\n  let fo; try{ fo=_driveBase; }`, repl `  if(_baseDirty) return;\n  _baseDirty=true;\n  let fo; try{ fo=_driveBase; }` (two-tabs (a), (b)).
- `base-file-kept`: find `      const p={file:+LASTKNOWN||0, dirty:true}; if(fo) p.folder=fo; baseSet(p); } }catch(e){}`, repl `      const p={dirty:true}; if(fo) p.folder=fo; baseSet(p); } }catch(e){}` (two-tabs (c)).
- `base-folder-kept`: the same find, repl `      const p={file:+LASTKNOWN||0, dirty:true}; baseSet(p); } }catch(e){}` (two-tabs (e)).
- `base-file-unread`: find `    if(!b.dirty || (+b.file||0)!==(+LASTKNOWN||0) || `, repl `    if(!b.dirty || ` (two-tabs (c2)).
- `twin-yearhas`: find `    if(!x || pmoLinkApart(it, x)) return false;`, repl `    if(!x) return false;` (years (a)).
- `twin-linkof`: find `+x.prior.fy===+p.fy && !pmoLinkApart(it, x); })[0];`, repl `+x.prior.fy===+p.fy; })[0];` (years (c)).
- `linkof-self-other-year`: find `return inT(x) && (!me || x.id!==id) && x.prior\n`, repl `return inT(x) && x.id!==id && x.prior\n` (years (c)).
- `twin-nafrom`: find `+x.prior.fy===+src.prior.fy) && !pmoLinkApart(src, x)) return true;`, repl `+x.prior.fy===+src.prior.fy)) return true;` (years (b)).
- `chain-stamp`: find `i.prior && !pmoChainApart(p, from, i) && (String(i.prior.id)===id`, repl `i.prior && (String(i.prior.id)===id` (years (d)).
- `stamp-pub-blind`: find `(a.pmo!==b.pmo || +a.pub!==+b.pub)`, repl `a.pmo!==b.pmo` (years (a)).
- `stamp-unknown-apart`: find `a.pmo && b.pmo && +a.pub && +b.pub &&`, repl `a.pmo && b.pmo &&` (years (f)).
- `rolled-hit`: find `    if(/^NEW-\\d+$/.test(id) && on.indexOf(id)>=0){`, repl `    if(false){` (years (e)).
- `rolled-any`: find `if(s0 && x0 && (x0===s0 || yrCopySame(x0, T, s0, PT))) return id; }`, repl `if(x0) return id; }` (years (g)).
- `jrnl-by-place`: find `    if(path.length===2 && path[1]==='custom' && jrnlById(a) && jrnlById(b)){`, repl `    if(false){` (journal (a), (b)).
- `jrnl-ids-dup`: find `|| seen[x.id]) return false;`, repl `) return false;` (journal (h)).
- `jrnlset-gone`: find `      if(el.length!==1) return false;`, repl `      if(el.length!==1){ node.push({}); node=node[node.length-1]; continue; }` (journal (c)).
- `jrnl-whole-offered`: jrnlCustomPlace → `return e.p[0]==='custom' && typeof e.p[1]!=='string';` (journal (d)).
- `jrnl-old-place-offered`: jrnlCustomPlace → `return e.p[0]==='custom' && e.p.length<3;` (journal (e)).
- `jrnl-gone-silent`: find `  if(e.p[0]==='custom' && !jrnlCustomHere(e)){`, repl `  if(false){` (journal (c)).
- `si-none-absent`: find `  if(key==='si' && v==='') return '';\n`, repl '' (SI (a)).
- `si-door-refused`: find `(v==='' || SI_CODES.some(`, repl `(SI_CODES.some(` (SI (b), (d)).
- `si-fmt-none`: find `  if(k==='si' && v==='') return 'none (chosen by hand)';\n`, repl '' (SI (c)).
- `si-fmt-rules`: find `  if(k==='si' && (v===null||v===undefined)) return 'follows the PMO and prime rules';\n`, repl '' (SI (c)).
- `si-proposal-unsent`: find `siNone:(S.si||{})[id]==='', `, repl '' (SI (a), (d)).
- `si-proposal-unaccepted`: find `  if(a.siNone===true && !a.si){ if(!S.si) S.si={}; S.si[id]=''; }\n  else if`, repl `  if` (SI (d)).
- `si-proposal-unshown`: find `if(v.siNone===true) parts.push(FL('si')+' none (chosen by hand)'); else `, repl '' (SI (c)).
- `pull-keeps-nothing-saved`: find `  const keep=own || !driveStoreOn() || (+MS.ts||0)!==driveBaseOf(mySlug());`, repl `  const keep=own;` (U63 (a), (b)).
- `pull-not-said`: find `  if(!quiet || keep) setStat(`, repl `  if(!quiet || own) setStat(` (U63 (a)).
- `pull-occupied-words`: find the `if(ka==='occupied' && !own){ … 'the shared folder', false, true)); render(); return false; }\n` line, repl '' (U63 (c)).
- `kept-saved-unmarked`: find `    if(meta.saved) m.saved=true;\n`, repl '' (U63 (a), the title).
- `restore-keeps-nothing-saved`: find `    const keep=own || !driveStoreOn() || (+MS.ts||0)!==driveBaseOf(pinAp);`, repl `    const keep=own;` (U64 (a), (b)).
- `restore-says-folder`: find `      +(driveStoreOn()? 'browser; press`, repl `      +(true? 'browser; press` (U64 (a)).
- `rcn-not-marked`: find `t.closest('#rcnBody')) t.__pend=true; }, true);`, repl `t.closest('#rcnBodyX')) t.__pend=true; }, true);` (U35 (1)).
- `rcn-no-hold`: find `  const lost=heldRedraw(el, rcnDraw);`, repl `  rcnDraw(el); const lost=[];` (U35 (1), (4)).
- `rcn-by-place`: find `  if(x.rk===null || x.rk===undefined) return n.getAttribute('onchange')===x.h;`, repl `  return n.getAttribute('onchange')===x.h;` (U35 (4)).
- `rcn-dlgpend`: find `    x.back=true; if(x.dp) i.__dlgPend=true;`, repl `    x.back=true;` (U35 (3)).
- `rcn-lost-silent`: find `  if(lost.length) setStat(`, repl `  if(false) setStat(` (U35 (7)).
- `rcn-change-in-draw`: find `  hs.forEach(function(h){ try{ h.el.removeAttribute('onchange'); }catch(e){} });\n`, repl '' (U35 (2)).
- RETARGETS, each the same defect on its new text (mcount on the sketch lists exactly these 7 as missing):
  `unsaved-flag-never-set`: find `\n  baseMarkDirty();\n`, repl `\n`. `v202-e7-u24-load-uncounted`: find
  `function loadCounted(){ _saveGen++; DIRTY=true; baseMarkDirty(); }`, repl `function loadCounted(){}`.
  `v202-e7-u24-load-session-only`: the same find, repl `function loadCounted(){ _saveGen++; DIRTY=true; }`.
  `v200-r5-restore-gen`: find `    _saveGen++; DIRTY=true;\n    baseMarkDirty();`, repl `    DIRTY=true;\n    baseMarkDirty();`.
  `v200-r5-restore-basedirty`: find `    _saveGen++; DIRTY=true;\n    baseMarkDirty();\n`, repl `    _saveGen++; DIRTY=true;\n`.
  `restore-no-keep-aside`: find the driveRestore `const ka=keep? keepAside(MS, {why:'folder', …, saved:!own}, baseGet()) : true;`
  line, repl `    const ka=true;`. `restore-own-stale`: find `    const own=ownUnsaved(MS, j.store, baseGet());\n    const keep=own`,
  repl `    const own=false;\n    const keep=own` (with U19's rule the work is still kept, but its words now say "saved", so U64
  (d)'s words catch it). Prove each with prove.py against its check. No mutation is retired.

### Overlaps (as mapped)
- Item 140: save(), loadCounted(), baseGet/baseSet and the shared `<key>.base`. Its (c) changes when import paths call
  loadCounted. Its (a) and any re-keying of `<key>.base` happen beneath baseMarkDirty. Its (b) adds a question in
  `_saveInPlaceFileRun`, whose HOLD ON U63 and U64 rely on. Whichever lands second keeps the single call to baseMarkDirty in
  save() and loadCounted.
- Item 141: baseSet and keepAside write localStorage directly; if routed through lsSet later, this area follows unchanged. The
  kept slot, the hand-over hold, persist()'s storage-full path. A refused small write in baseMarkDirty is acceptable: persist()
  reports the refusal.
- The kept slot is shared by U19's put-back, the boot's keep, driveStorePull, driveRestore, driveResolve('theirs'),
  sharedKeepMine and pmoTakeFile; U63 and U64 add saved:true copies, so every "occupied" refusal is reached more often.
- v2.08 F2 and v2.09 item 125: inspHeld and inspHeldBack are shared; the new fields are inert where no data-rk is drawn. The
  finds at mutate.mjs:7510, 7657, 7661, `v208-rv2-f2-hold-dropped` and `v208-rv2-f2-change-commits-in-redraw` stay matching once.
- The change journal's consumers: jrnlLabel, cycWho, pmoOutChanged, the journal search, and the three expectations named above;
  pkgMineSince compares whole entries and is unaffected.
- PMO packages: pmoVal feeds pmoBaseline, pmoSubmitBuild, pmoNow and pmoRows.
- The year/link rules carry many v2.06–v2.09 mutation finds; the edits are placed so each still matches once.

### Open questions (as mapped; the contract answers each)
1. U63/U64 and the one kept slot: keep aside at the replacement (U19's rule, as decided), re-basing the 18 fixtures; or keep the
   board file's copy aside only when a board-file Save would write over it (edits item 140's function). Recommended: as decided.
2. Whole added-requirement journal lines: not offered for Put back, the cell says why. Recommended: yes (on v2.13 Put back of
   that line throws and leaves `S.custom` as `[null]`).
3. Lines filed by place before v2.14: not offered. Recommended: yes.
4. After a folder copy replaces work saved only in the board file, also clear LASTKNOWN so the next file Save asks?
   Recommended: no.
5. Two tabs still write one storage key; a `storage` listener later? Recommended: later, not v2.14.
