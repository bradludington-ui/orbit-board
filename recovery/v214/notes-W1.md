# v2.14 W1 — Save writes only to its own file, and asks before writing over what it does not carry

Builder W1, worktree `/home/user/orbit-wt/v214-w1`, branch `v214-w1`, from the slot commit `ea412ca`. Scope: contract §5 (item
140 (a) and (b), the boot's record rules — case 3, the blank mark's flag and the stray rule — and item 141 D). This file is kept
current as the work goes; the stage-2 agent picks up from it.

## Reproduced on the slot commit (v2.13 behaviour), before building

`recovery/v214/proto/w1-repro.mjs` (jsdom, the repo's `boot.mjs` with S7's `url` and `idb`), run with `BOARD=<slot board>`
(`git show ea412ca:prioritization-board-grid.html`), from its folder so its relative import resolves:

| Case | On the slot board |
|---|---|
| (a) X, a board at `…/old.html`, saves in place once; Y, the program at `…/new.html`, same browser (storage and handle store), presses 💾 Save | X stores its handle under `FNAME` (log `get FNAME`, `put FNAME`). Y reads `get FNAME`, gets X's file, and **writes over old.html with no window and no question** ("💾 Saved in place … "old.html" now carries this state"): dA.writes 1 → 2. |
| (b) A program page whose storage holds only the O&M plan; FH = a file holding O&M + Full Fund, a locked Full Fund cycle and a BAE row | Only the "No writer is recorded" question (answered OK); written: the file now holds `appns: ['om']`, no Full Fund, no BAE rows. **No question named what was lost.** |
| D: 💾 Save into the program's own text (pubState null) | "⚠ In-place save failed (Cannot read properties of null (reading 'writer')) — downloading a copy instead." 0 writes, 1 download. |
| case 3: the program page booted with `prio27om.base = {file:1700000000123, dirty:false}` and no plan | `LASTKNOWN === 1700000000123` (another file's save taken as its own); after `switchYear` the record is `{"file":1700000000123,"dirty":true}`. |
| stray: a blank program page's change (record `{"dirty":true}`), then an older board file in that browser | The blank plan opens over the file: `S.notes = {Z:'BLANK note'}`, nothing kept aside, `LASTKNOWN !== PUB_FILE_TS`. |

And in Chromium (`tools/save-target.mjs --board <slot board> --int`, below): 14 failing checks, every section — A the measured
case reproduced with a real IndexedDB (the program tab's Save read `FNAME` and wrote 2,947,936 characters over the 2,946,437 of the
old v2.12 board, no window, no question), B and C never offer the Open window, D the board file's first Save writes the old
board's file, F the shared entry is never released and the v2.12 board writes the new file silently, E (INT) the v2.12 board
writes a blank tab's near-empty plan over its file.

On the W1 board the same repro gives: (a) Y looks up only `page|…/new.html`, opens its window suggesting `new.html`, writes
nothing to old.html; (b) the question names `Full Fund — 3 requirements, 1 year`, `Locked PPBE cycle: Full Fund PB27`, `The BAE
list (1 row)` and Cancel writes nothing; D written in place, claimed; case 3 `LASTKNOWN 0`. (The record after a change and the
stray rule on a real blank page need W4's writer: INT-3.)

## What was built

All in `prioritization-board-grid.html`, as contract §5 and map.md › save-target › Functions 1–8, 10, 14 say; the sentences are
the map's Design, verbatim, with C24's requirement line and C25's success sentence.

- **The handle store, per page** (beside `let FH=null;`): `fhPageKey()` (`'page|'+pageAddr()` or `''`), `_fhPut(h)` /
  `_fhGet(cb)` through `_pfhPut` / `_pfhGet` under that key and never `FNAME`; `fhLegacyRelease(h)` (reads `FNAME`, deletes it only
  when `isSameEntry` says it names `h`); `fhOwnName()`, `fhNewName()`, `fhSaveNew()` (sandbox, cycle and mixed-hold refusals, then
  `saveSerial(… {fresh:true})`), `fhRepick()`. `var _fhKnown` with the opening's `_fhGet` read (Save diagnostics), `var _fhMem`
  (C25: the file "Save as a new file…" wrote, held in this page only).
- **`_saveInPlaceFileRun(o)`**, steps 1–11: the Open window first where the browser has one (FIRST_SAY), else the Save window
  suggesting `fhOwnName()` (the fallback line) or, fresh, `fhNewName()` (NEW_SAY); a picked handle remembered only once accepted;
  the not-an-object test on its own line (C26); D (`bare`, `baked`; `fw0=p? … : null`; `writerMay(fw, !txt.length || bare, …)`);
  (b) after the bytes are built (`saveDrops` → `confirm(saveDropsAsk(…))`, Cancel puts the pen back, CANCEL_SAY); write access for
  an Open-window pick (`queryPermission`, then `requestPermission`; `'later'` remembers and says LATER_SAY; anything else DENIED_SAY,
  not remembered); `fhLegacyRelease(h)` after `await w.close()`; the Open window's cancel and PICK_BLOCKED_SAY in the catch. The S5
  line (`+wkMemSay(may)`) is untouched; C25's sentence is a line of its own above it.
- **`saveDrops(txt, p, q, baked)` / `saveDropsAsk(name, lost, baked)`** beside `publishState`: appropriations (whole, years, and
  C24's per-year requirement lines, at most 6 ids then "and N more"), locked cycles (`cycApTxt`), cost estimates (3 then "and N
  more"), execution data, the BAE list, the reprogramming log, the destination list; singular for one ("1 requirement, 1 year");
  plain text for `confirm()`, at most 12 bullets.
- **The opening** (contract §5 "The record's rules"): `let _bootFile`, set after each `LASTKNOWN=PUB_FILE_TS;`; `_bootOwnPack` (DATA's
  own test on storage's plan, read again in a try, a throw counting as true) and `_bootStray` before the PUB block, the condition
  `fileTs > ours || (_bootStray && fileTs < ours)`; case 3 and the blank flag after it, on one line. `pageBlankNow()`'s body (S10):
  `_pageBlank===true`, `LASTKNOWN` 0, and no folder copy taken (`_driveBase`, read in a try; while it is in its dead zone nothing can
  have been taken).
- **Save diagnostics** "Save writes to": `(FH || _fhKnown)? 'a file this browser remembers for this page'`, `'asks which file, the
  first time'`.
- **The guide** (`t-board`'s saving paragraph): the contract's sentence, +307 characters in the source (allowance +450 net).
- **`tools/check.mjs` "the save-file handle store"**: fails on any handle-store call (`_pfhGet`, `_pfhPut`, `.put`, `.get`,
  `.delete`) naming `FNAME` outside `fhLegacyRelease()`, on one inside it that is not `_pfhGet(FNAME, …)` / `_pfhPut(FNAME, …)`, and
  when `fhLegacyRelease` is gone. Proved: planting `.put(h, FNAME)` back in `_fhPut` fails it ("8285: .put(h, FNAME"); the slot board
  fails it.
- **`tools/save-target.mjs`** (Chromium, real IndexedDB, token stand-ins installed from page code after load, both windows stood
  in, a Save-window pick empties the file): A–D and F, each failing on the slot commit (above) and passing here; E written and
  labelled INT — it runs when the board has `baseMarkDirty` (after integration) or with `--int`, and otherwise prints `skip`.
- **`tools/save-target-headed.mjs`** (by hand, no npm script): the headed Open-window proof under Xvfb (below).

## Decided in the build

- **`_fhPut` keeps `_fhKnown` in step** (`_fhKnown=!!(k && h)`), so Save diagnostics stops saying "remembers" once the handle is
  forgotten (a moved file, `fhRepick`). The contract gives `_fhPut`'s body as `const k=fhPageKey(); if(k) _pfhPut(k, h);`.
- **`_fhMem`** (C25): a remembered-handle Save (`!picked`) puts `FH` under the page key, which would have filed the dated copy under
  the opened file's address on the second Save in the page. `_fhMem` holds the fresh file and that line skips it
  (`if(h!==_fhMem) _fhPut(h)`).
- **`inWin`**: the Open window's own cancel and refusal are told apart from errors after the pick by a flag set only while the
  window is up (`picked` stays `'open'` afterwards, and a read-only file's NotAllowedError after the pick keeps its own message).
- **A Save-window pick is remembered just before the write**, after every check (the map: "remember and write"); the old line
  remembered it before the read.
- **`saveDrops`' requirement reading** takes the data pack from the plan's top and from every year (`packOfStore`'s places).
- **`let bare=false, baked=null;` is a line of its own** after `let p;`, so `guard-fails-open` (which ends at `let p;`) still matches.
- **`fhSaveNew`'s refusals are on one line**, so `impmixed-file-unguarded` (`\n  if(impMixedBlock('Saving to the board file')) return;\n`)
  still matches once.
- **`saveDrops`' list is named `lack`, not `miss`**: `v210-a-note-missing-year` finds `if(miss.length) out.push(`, which matched
  twice with `miss`.
- **pmo-save.mjs H** (the board's moved-file section) now stands in the Open window too (C14): this Chromium has one, and the
  board's first Save now opens it; its `key` for the board is `'page|'`.

Stage 2 (3 Nov 2026):
- **Six more mutation ids** (`repick-keeps`, `later-writes`, `later-unremembered`, `pick-blocked-misread`, `open-cancel-unoffered`,
  `state-not-object`), under §5's "W1 may add `v214-w1-*` ids for lines of its own the list does not reach (`fhRepick`), saying
  so". Stage 1 read §10's count of 33 as a cap; §5 allows them, and each line is on the save path this version exists to make
  safe. The counts the lead plans with move by six (For the integration).
- **Two check parts to reach them**: check 2 (h) and check 3 (10). (h) answers every question OK, so a board that took the
  number for a board state would claim the writer and write (the alternatives disagree: refused, read only, versus written);
  (10) clicks the rendered "choose another file…" button rather than calling `fhRepick()`, and starts from a file this browser
  remembers for the page (with nothing remembered, `repick-keeps` would change nothing and the part could not tell).
- **(10) waits for the click's own Save up to 5 s** (polling every 25 ms, stopping at the write): the click's promise is not the
  test's to await. The first cut waited 1 s; it passed, but the box runs two builders at once.

## Checks

audit-import, W1 slot (helpers prefixed `w14`/`W14`: `w1`/`W1` were taken by v1.88's helpers). Each block fails on the slot commit
(`BOARD=<slot board>`, slimmed to these blocks: 44 failing checks); every part marked CONTROL passes there.

1. `v2.14 W1 — Save writes only to the file this page was saved to; another file is never reached through the shared entry (item 140 a)`
   — X at `old.html`, Y the program at `new.html`, one S7 `idb` store, Y with X's browser storage; only `showSaveFilePicker` (C14's
   exception). X's first Save suggests `old.html`, store holds only `page|…old.html`, no `put FNAME`; Y looks up only its own key
   before writing, writes `new.html`, never old.html; the release both ways (FNAME→dA deleted after X writes dA; FNAME→dB kept); X's
   second Save (CONTROL); Save diagnostics both ways (`known-unread`).
2. `v2.14 W1 — the first Save of a file opens it to check it before anything is written (item 140 a)` — (a) the Open window, read →
   query → request → write, remembered under the page key; (b) `requestPermission` throws: nothing written, remembered, "Press 💾
   Save once more", the next Save writes with no window; (c) `'denied'`: not remembered, DENIED_SAY; (d) the window cancelled; (e)
   Save as a new file: dated name, nothing under the page key, the second Save writes it with no window, a reboot holds nothing
   (C25); (f) no Open window (C30a): `board.html` suggested, the fallback's words while the window is up; (g) PICK_BLOCKED_SAY;
   (h) *(stage 2)* a file whose saved state is a number, picked in the Open window, every question answered OK: refused as not a
   board, read only (`['read']`), nothing written or remembered (C26's own line, `state-not-object`).
3. `v2.14 W1 — Save asks, naming them, before it writes over what the file holds and the board on screen does not carry (item 140 b)`
   — w2Fx's NEW.html, every expected line worked out in the block from NEW's pubState: (1) the exact question, nothing written, the
   pen as it was, CANCEL_SAY; (2) OK writes; (3) a blank page names O&M whole first; (4) years; (5) ordinary Save asks nothing
   (CONTROL); (6) a cycle deleted asked once, then nothing; (7) no writer: claim OK then Cancel, WRITER back to null, no `(writer)`
   line; (8) the Open window's pick cancelled at (b) is not remembered and the window opens again; (9) R1's shape names `O&M FY27 — 2
   requirements the board on screen does not carry: B, C`; (10) *(stage 2)* a page whose browser remembers NEW.html for it, Cancel
   at (b), then the line's “choose another file…” button clicked as a person clicks it: the Open window opens, the file chosen there
   is written and remembered under the page's key, NEW.html is neither read again nor written, one question in all (`repick-keeps`).
4. `v2.14 W1 — Save into an ORBIT program with no board writes it in place (item 141 D)` — the program's own text (CONTROL: pubState
   null, `extractPacks` null): written once, no question, no download, claimed; a baked program (an O&M pack in `APPNS`): the baked
   question, exactly; Cancel writes nothing, the pen goes back.
5. `v2.14 W1 — a page whose board came from no saved copy takes no other file’s save as its own, and a board file keeps such work aside (item 140)`
   — (i) case 3; (ii) the stray rule (the file's requirements and notes, the blank work kept aside whole, `LASTKNOWN===PUB_FILE_TS`,
   record `{file:PUB_FILE_TS, dirty:false}`); (iii) CONTROL an import's record; (iv) CONTROL a blank mark over another board's data
   pack: one board, and the next saved file that one board's; (v) `pageBlankNow()` four ways.

Existing checks changed on purpose, each with its `// v2.14 W1:` comment:
- audit-import "v2.09 review — a file moved or renamed after its first Save …", the two board lines read
  `X.store.get('page|https://example.invalid/board.html')` (they read `I127FNAME`; the second would have passed vacuously). The
  first is labelled "(a CONTROL)" by v2.09; it now fails on the slot commit, as the board kept its handle under FNAME there.
- `tools/pmo-save.mjs` E: the board's handle is read under `'page|'+` the board page's own address (taken from `location.href`, not
  from `fhPageKey`), and must not be under FNAME; H: both windows stood in, the board's key `'page|'`.

The browser checks: `node tools/save-target.mjs` — all A–D, F pass here, 14 fail on the slot (with `--int`), E skipped here (INT).

The headed proof (by hand, `node tools/save-target-headed.mjs`; recorded in `recovery/v214/w1-headed-open-window.json`), 3 Nov
2026, Chromium **153.0.8010.12** headed under Xvfb, the real GTK file chooser driven by XTest (a click in the file list, the path
typed — a leading `/` opens GTK's location bar — then the chooser's Open button; Return in the location bar cancelled it):
- An 8,806,594-character board, opened from its file, a real click on 💾 Save: the Open window opened (FIRST_SAY on the line); the
  file chosen there was **byte-identical after the pick** (SHA unchanged).
- ORBIT read it and ran its checks (the only question: "No writer is recorded…", as the padded fixture had no writer), then
  **`queryPermission({mode:'readwrite'})` → `'prompt'`**, and **`requestPermission` did not throw**: Chromium showed its own
  question on that first press — "Save changes to ORBIT Live.html? file:/// will be able to edit ORBIT Live.html [Cancel] [Save
  changes]". Answered Save changes: `requestPermission` → `'granted'`, written (8,806,754 characters), "You are now this board’s
  writer".
- The second press: no window, no question, `requestPermission` → `'granted'` at once, written.
- So for §12 Q1: **the browser asks once, on the first press, after ORBIT has read and checked the file** ("Save changes to
  <file>?"); LATER_SAY's second press was not needed in Chromium 153 on file://.
- Seen on the way (W3's): the 8.8 MB board did not fit browser storage, and the board said "⚠ This change is not in browser storage
  — it was refused (QuotaExceededError) …" while it saved into the file.

## Mutations

**39 new**, in `mutate.mjs`'s W1 slot, ids single-quoted (`v214-w1-*`). None retargeted, none retired.

- **The contract's 33** (stage 1): `fname-get`, `fname-put`, `key-shared`, `own-name-lost`, `save-window-first`,
  `picked-remembered-early`, `picked-denied-kept`, `drops-unasked`, `drops-cancel-writes`, `drops-appns-blind`, `drops-empty-carried`,
  `drops-years-blind`, `drops-cycles-blind`, `drops-ace-blind`, `drops-exec-blind`, `drops-bae-blind`, `drops-rp-blind`,
  `cancel-pen-moved`, `null-writer-throws`, `program-not-fresh`, `baked-unasked`, `release-skipped`, `release-any-file`,
  `boot-lastknown-inherited`, `stray-opens`, `stray-any-record`, `stray-over-pack`, `drops-reqs-blind`, `fresh-remembered`,
  `known-unread`, `blank-never`, `blank-not-carried`, `blank-after-save`. `boot-lastknown-inherited` removes `LASTKNOWN=0;
  _baseDirty=false;` from case 3 and keeps the blank flag, so it reaches (i) alone.
- **Six more, stage 2** — contract §5: *"W1 may add `v214-w1-*` ids for lines of its own the list does not reach (`fhRepick`),
  saying so."* Stage 1 left these lines with a part of a check and no id proving the part bites (its Known gaps):
  - `repick-keeps` — `fhRepick` keeps this page's file, so "choose another file…" reads the same file again and the window never
    opens → check 3 (10).
  - `later-writes` — write access that could not be asked for (`requestPermission` threw) is taken as granted and the file written
    on that press → check 2 (b).
  - `later-unremembered` — the checked file is not remembered on LATER_SAY, so the next press opens the window again → check 2 (b).
  - `pick-blocked-misread` — PICK_BLOCKED_SAY's branch gone: the browser refusing the Open window reads as a read-only file →
    check 2 (g).
  - `open-cancel-unoffered` — the Open window's own cancel line gone: it no longer offers Save as a new file → check 2 (d).
  - `state-not-object` — C26's line removed: a file whose saved state is a number is taken for a board and written over once the
    writer is claimed → check 2 (h).
  **W1 therefore adds 39, not 33**: mcount is 3259 on this branch (3220 + 39), and 3384 after the four merge (3385 with the lead's
  one), not 3378/3379.

Proof, stage 2 (3 Nov 2026), on this branch's final board and suite:
- Every mutant built with `recovery/v200/bin/mkmut.py` (each find matches once) and run through `node tools/check.mjs <mutant>`:
  all 39 print `ok    main script parses`.
- `JOBS=1 HEAP=8192 python3 -I -B recovery/v208/bin/prove.py recovery/v214/proofs-W1.json recovery/v214/proved-W1.jsonl`, from a
  fresh `proved-W1.jsonl` (stage 1's 33 lines were replaced, because checks 2 and 3 gained parts): each of the five blocks clean
  on the board first, then **39 of 39 CAUGHT**, each by its own block, none by a throw (`threw: 0` on every line). Wall time about
  6 minutes for the run (the clean runs, then 39 slimmed block runs).
- mcount: `{"entries": 3259, "once": 3259, "missing": [], "multiple": [], "unparsed": []}`. The older finds the contract names
  (`guard-fails-open`, `guard-not-a-board-writes`, `guard-later-only`, `v209-w3-board-save-over-copy`,
  `v209-w3-board-save-keeps-handle`, `v209-rv-save-board-moved-handle-kept`, `v209-w3-hold-on-skipped`, `impmixed-file-unguarded`,
  `v200-r4-*`) still match once (the board is unchanged since stage 1).

## For the integration

- **INT-3 and `savetarget` E need W4's `baseMarkDirty`**: on W1 alone a blank page's change still records `{file:<other>, dirty:true}`
  (the v2.13 record line), so the stray rule only fires on a seeded record. E runs by itself once `baseMarkDirty` exists.
- **W2's adoption of the import's file** calls `_fhPut(h)`: it lands under `'page|'+pageAddr()` and sets `_fhKnown`.
- **`pageBlankNow()` reads `LASTKNOWN` and `_driveBase`** in tries; W4's writer calls it inside its own try.
- **C16**: audit-import was run whole on this branch (result below); blocks that save to a stand-in through the no-Open-window
  fallback now see `board.html` suggested (the default url) rather than `FNAME`.
- Every new jsdom block that drives a Save installs `showSaveFilePicker`; checks 2 and 3 also stand in `showOpenFilePicker` (C14);
  check 1 and part (f) of check 2 deliberately do not (C30a).
- The guide: +307 characters in the source; measure in a booted board after integration (C11).
- **The counts move by six** (stage 2, contract §5's allowance): W1 adds 39 mutations, so after the four merge mcount is 3384 (3385
  with the lead's `v214-int-*`), the new total 165 and §11.5's integrated proof list carries 39 W1 ids
  (`recovery/v214/proofs-W1.json`). §11.8's first sweep batch names W1's write-and-ask ids; the six are of that family
  (`later-writes`, `state-not-object` and `repick-keeps` first, if the batch has room).
- **Check 3 (10) clicks the status line's rendered button** and polls up to 5 s for the click's own Save to land (it is not
  returned to the test). A later workstream that changes CANCEL_SAY's button (`onclick="fhRepick()"`) or the status line's id
  (`#shareStat`) moves this part's selector with it.

## npm script to add

- `"savetarget": "node tools/save-target.mjs"` (contract §11.2: in `verify:grid` after `pmosave`). After integration it runs E
  too (it detects `baseMarkDirty`); `--int` forces E on a board without it.
- None for `tools/save-target-headed.mjs` (by hand, D11).

## Known gaps

- *(Closed in stage 2.)* Stage 1 left LATER_SAY's branch, PICK_BLOCKED_SAY, the Open window's cancel line, `fhRepick` and C26's
  not-an-object line with no id; each now has one (above), and `fhRepick` and C26 a part of a check of their own.
- **Neither new action is in the left menu**, as the contract places them: "choose another file…" (`fhRepick`) is offered only on
  CANCEL_SAY (Cancel at (b)), and "Save as a new file…" (`fhSaveNew`) only on the Save lines (FIRST_SAY, the Open window cancelled,
  PICK_BLOCKED_SAY). Once a page remembers a file, the only way to save that board elsewhere is ⬇ Save a copy (a download), or to
  cancel at (b). Nothing is lost by it; a `dd_save` entry for each would be a left-menu change (`syncBtns`, `npm run leftmenu`'s
  map), outside W1's functions -- for the lead or Brad.
- `saveDrops` reads a destination list only when the outgoing bytes carry no `ents` array; every board since v1.86 carries one, so
  that line can only fire for a file whose board is older than the bytes'.
- A Save-window pick (no Open window, or Save as a new file) still writes over whatever file is chosen: the browser empties it on
  pick, so nothing is there to compare. The lines say so; Windows' window is inferred to ask "replace?" first (§12 Q2).

## Run on this branch (stage 1, 3 Nov 2026)

- `npm run check`: all checks passed (with the new "the save-file handle store" rule). `node tools/export-audit/boot-same.mjs`: every
  page, source, save and error list identical either way.
- **audit-import whole** (8 GB): ALL CHECKS PASSED, exit 0 — C16 found nothing to adjust: no older block that saves to a stand-in
  meets (b)'s question or the Open window.
- **audit-inject whole**: ALL CHECKS PASSED.
- The guide, measured in a booted board (`helpDoc.innerHTML.length`): slot 70,815 → 71,123 (+308; allowance +450; budget 72,000).
- mcount 3253, all once. The 33 mutations proved, 33 CAUGHT (`proved-W1.jsonl`).
- Browser: `node tools/save-target.mjs` passes (E skipped: INT); on the slot board with `--int` 14 checks fail (every section).
  `node tools/pmo-save.mjs` passes here; on the slot it fails only E's three re-pointed checks (the handle under FNAME there).
  `npm run menus`, `panels`, `dialogs`, `leftmenu`, `keys`: pass.
- **Left for stage 2** (all run there, below): audit-board, audit-other, audit-recon, audit, audit-hostile, legacy-fsrc whole (none was edited; the board
  change is the save path, the opening's record rules and one guide sentence); `npm run standards`, `layout`, `controls`, `editors`,
  `dropdowns`, `pmoyears`, `pointer`; `node tools/save-target.mjs --int` after integration (E, with W4's writer).

## Run on this branch (stage 2, 3 Nov 2026)

Stage 2 changed no line of the board: two check parts in audit-import's W1 slot (check 2 (h), check 3 (10)), six ids in
`mutate.mjs`'s W1 slot, the proof files and these notes. W2 was building in its own worktree on the same box throughout (load about
4 on 4 cores); every jsdom run here was one at a time.

| Command | Time | Exit | Result |
|---|---|---|---|
| `npm run check` | 3 s | 0 | all checks passed, "the save-file handle store" among them |
| `node tools/export-audit/boot-same.mjs` | 9 s | 0 | every page, source, save and error list identical either way |
| `python3 -I -B recovery/v200/bin/mcount.py tools/export-audit/mutate.mjs prioritization-board-grid.html` | <1 s | 0 | `{"entries": 3259, "once": 3259, "missing": [], "multiple": [], "unparsed": []}` |
| `mkmut.py` + `node tools/check.mjs <mutant>`, all 39 | not timed | 0 | every mutant `ok    main script parses` |
| `JOBS=1 HEAP=8192 python3 -I -B recovery/v208/bin/prove.py recovery/v214/proofs-W1.json recovery/v214/proved-W1.jsonl` | ~6 min | 0 | the five blocks clean, then **39 / 39 CAUGHT**, none by a throw |
| the five W1 blocks (slim.py, `v2.14 W1 —`), `BOARD=` the slot board (`git show ea412ca:…`) | 26 s | 1 | **44 FAILING CHECK(S)**, every block, the two new parts (`not a board`, `(10) another file`) among them; no CONTROL fails |
| the same five blocks on this board | 21 s | 0 | ALL CHECKS PASSED |
| `node tools/export-audit/audit-import.mjs` whole, 8 GB | 1314 s | 0 | ALL CHECKS PASSED |
| `node tools/export-audit/audit-inject.mjs` whole, 4 GB | 13 s | 0 | ALL CHECKS PASSED |
| `node tools/export-audit/audit-other.mjs` whole, 4 GB | 156 s | 0 | ALL CHECKS PASSED |
| `node tools/export-audit/audit-board.mjs` whole, 8 GB | 339 s | 0 | ALL CHECKS PASSED |
| `node tools/export-audit/audit-recon.mjs` whole, 8 GB | 916 s | 0 | ALL CHECKS PASSED |
| `node tools/export-audit/audit.mjs` whole, 4 GB | 8 s | 0 | ALL CHECKS PASSED |
| `node tools/export-audit/audit-hostile.mjs` whole, 4 GB | 65 s | 0 | ALL CHECKS PASSED |
| `node tools/export-audit/legacy-fsrc.mjs` whole, 4 GB | 2 s | 0 | every legacy Force setting computes exactly as before |
| `node tools/export-audit/audit-ui.mjs` whole, 4 GB | 72 s | 0 | ALL CHECKS PASSED |
| `node tools/save-target.mjs` (W1's own tool) | 31 s | 0 | all save-target checks passed: A, B, C, D, F; E printed `skip` (INT: no `baseMarkDirty` on W1 alone) |
| `node tools/pmo-save.mjs` (`npm run pmosave`) | 46 s | 0 | 76 `ok`, none failing |
| `npm run panels` | 14 s | 0 | every panel and menu opens, no escaped entity, no clipped field, the keyboard reaches every control |
| `npm run dialogs` | 240 s | 0 | every box takes the keyboard, keeps it, gives it back, and asks before typing is lost |
| `npm run standards` | 88 s | 0 | conformance holds against the baseline: 0 known findings, nothing new |
| `npm run menus` | 9 s | 0 | every menu path a message names is really in that menu |
| `npm run leftmenu` | 54 s | 0 | every action has one home on the left menu |
| `npm run keys` | 109 s | 0 | the keyboard reaches everything the check names |
| `npm run dropdowns` | 209 s | 0 | every item of every drop-down is in the window and on top |
| `npm run pointer` | 257 s | 0 | the mouse reaches and edits every row and CLIN drill control, in every layout |
| `npm run pmoyears` | 24 s | 0 | a copy names the years it submits for, and the review reads each year under its own heading |
| `npm run controls` | 4 s | 0 | every recorded control is present, nothing unrecorded appeared |
| `npm run editors` | 61 s | 0 | every editor reachable at every width, in this machine's font and the Segoe stand-in |
| `npm run layout` | 471 s | 1 | **only the carried D ×8** (the first requirement's top at 323/420 px, sliding over and docked, four widths each); nothing else |

Not run, and why: `node tools/save-target.mjs --int` (E needs W4's `baseMarkDirty`: after integration it runs by itself, INT-3);
`tools/save-target-headed.mjs` (by hand, stage 1's run above stands: the board is unchanged since). No sweep, `npm run mutate` or
`validate:math` (contract §10). The guide's size was not measured again: no line of the board changed since stage 1's 71,123.
