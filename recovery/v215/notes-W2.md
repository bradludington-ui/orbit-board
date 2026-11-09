# v2.15 W2 — what opens, what Save records, two tabs (items 142, 143, 145; item 131's box; item 146's W2 bullets)

Branch `v215-w2`, from the slot commit `8c24ea2`.

## 142 — the design, written before the build

### What happens today (v2.14)
`DATA` is a `const` built at the top of the script (§01, ~line 3514): the consolidated payload (`APPNS[APPN]`), else **the data
pack of the plan browser storage holds**, else the file's slot (`PUBS[slug].dataPack`). Which copy of the plan goes on screen is
decided ~4,300 lines later (§13: `applyStore(storage)`, then the file's plan when it is newer, keeping unsaved work aside). So a
newer board file opened over another board's older copy shows the file's plan against storage's requirement list (60 of 115
requirements, wrong totals); with that copy unsaved and no room to keep it aside the file does not open at all.

### Which copy wins, and what is kept aside (today's rules for the plan decide)
The plan's rules are not changed: the newer of the file's plan and storage's opens; unsaved work behind a newer file is kept aside
first; kept work is never replaced ('occupied'); no room to keep it holds the file back; the stray rule (C17) is untouched. What
changes is that **the requirement list is decided by the same rule, before `DATA` is built**:

- `_bootPre` (a `var`, computed right before `DATA`, reading only raw text and function declarations): it applies when `DATA`
  would otherwise take storage's data pack (no consolidated payload; storage's plan carries a pack), the file holds a plan
  (`years` or `order`), **the file's plan is newer than storage's** (`ts`), and the two data packs differ (as JSON text; a file
  plan with no pack differs from one with a pack). Then, by the plan's own rule:
  - storage's copy holds no work a saved copy lacks (`ownUnsaved`, the record's `dirty`, else the journal) → it is left where it
    is (v2.09's third review: storage holds a save, not unsaved work), and the file opens;
  - it holds unsaved work → it is **kept aside now**, whole, as storage holds it (the raw text: `keepAside`'s format, meta `why:'file'`,
    the file's saver and time, the record), because this is the last moment before `DATA` is fixed. Kept → the file opens.
    `'occupied'` or no room → the file is held back exactly as today, and `DATA` takes storage's pack (the plan on screen is
    storage's, so its list is too).
  - The file opens → `DATA` takes **the file's plan's pack** (none, an empty board, when the file's plan carries none).
- In the plan restore (§13), when `_bootPre.follow`: storage's plan is **not put on screen first** (it would be checked against
  the file's services, and a reorder would ask a question about a copy that is not going to open); the keep-aside already done is
  used (no second keep); the file's plan is applied; storage then takes what is on screen where this opening kept unsaved work
  aside (v2.09's rule, unchanged); a saved copy of another board is left in storage, the record set to the file's save.
- **⇢ Open the file anyway** (`bootTakeFile`, offered when the file was held back): `DATA` is storage's pack there, so putting the
  file's plan on screen in place would mix the two again. Where the packs differ it now removes storage's copy (its confirm
  already says this browser's work is not kept), writes the file's plan in its place where there is room, records it, and reopens
  the page, which then opens the file with its own list. Where the packs agree it does what it did.

### Everything that reads `DATA`, or the stores beside it, while the board opens
- Derived from `DATA` and so following it with no change: `SVC`, `SVC_FROM_DATA`, `IS_SHELL`, `BASE_ITEMS`, the buy lines, the
  base asks, the CLINs, `pmoSync`'s homed offices, every `applyStore`/`applyState` refit.
- The plan restore: as above.
- `EXDB`, `ACEDB`, `BUDDB`, `RPDB`, `DESTDB` (board-wide lists, not per plan) and `CYCDB` (this appropriation's locked cycles): each
  already picks the newer of the file's and storage's by its own time, `sideBootNote`/`sideBootCheck` (v1.99 item 95) flag a list
  storage held that a save would write over a different one, and 💾 Save's `saveDrops` (v2.14 C24) asks before writing over a list
  the file holds and the board does not carry. Not changed: none of them is tied to a requirement list.
- `_bootOwnPack` and `_bootStray` (C17): read storage's pack; unchanged — the stray rule never fires over a plan carrying a pack.
  (Built later in this branch, item 146: `_bootOwnPack` became the pack test inside the one `strayRule`; the rule is the same.)
- `_impOpen` (the import's own file) runs before all of it, as before.

### R1's same-ids case
Two boards built from one program, same appropriation, same requirement ids, different content. The packs differ as text, so the
rule above applies: the newer file's own list opens. For the other appropriations `pubsFor` takes storage's copy only where it is
newer than the file's (the plan's rule, and what that appropriation's own board opens), so see Known gaps.

## What was built

All in `prioritization-board-grid.html`; every new line carries a `v2.15 W2` comment.

- **142 — the requirement list follows the copy that opens.** `_bootPre` (right before `DATA`), `DATA`'s new branch, the plan
  restore's three uses of it (§13: storage's plan not applied first; `own`/`ka` taken from `_bootPre`; storage then takes what is on
  screen where unsaved work was kept aside), and `bootTakeFile` reopening where the lists differ (`_bootPre.diff`). As designed above.
- **143 — 💾 Save records every appropriation it wrote.** `apSavedSnap()` with the bytes (each other appropriation whose copy in
  them is, as text, the copy browser storage holds), `apRecordSaved(snap, wrote)` after the write (each whose stored copy is still that
  text: `{file: this save, dirty:false}`), and `apBaseSaved(k, wrote)`, the one record write, which `cycCarrySaved` now shares.
  `cycCarrySaved`'s generation guard (`c.gen>at`) has its fixture: a cycle carried while the save writes, from a copy another tab
  wrote meanwhile (`v215-w2-carry-guard`). Without the guard that carried copy -- not in the bytes -- was recorded saved.
- **145 — two tabs on one appropriation.** A general `storage` listener (`tabWrote`): when another tab writes the plan of an
  appropriation this page holds its own refused copy of (`_pubsOwn`: a package, a ladder copy, a carried cycle), the clash is marked
  (`_tabClash[k] = {theirs: the text}`; `apClash(k)` holds while storage still holds exactly that text) and said at once, naming
  both (`apClashWhy`). While it stands: `pubsFor` keeps this page's copy; `apStoreOf` answers held (`clash:true`), so the ladder copy,
  ⬆ Issue, ⬆ Send back, ⬆ Push and a package for it refuse, saying both (`apHeldWhy` → `apClashWhy`); `fydpStoreLocal` answers
  `why` (the cycle chosen for every appropriation skips it and says why; the five-year plan, FYDP Disconnects and the cycle bar name it
  as not read). 💾 Save asks first, before anything is read or written (`pubsClashAsk`, first thing in `_saveInPlaceFileRun`): OK writes
  this page's copy, stamped one past the other tab's, so that appropriation's own board keeps the other tab's copy aside when it
  opens (its record says unsaved); Cancel writes nothing and says how to carry on from the other tab's copy instead.
- **131 — FYDP Disconnects across tabs.** The listener calls `fdcSync(true)`: drawn again at once, or, under a figure being typed,
  marked (`_fdcStale`) and drawn once that figure is in (`fdcIntlSet`). The box keeps the model it drew (`_fdcSig`, `fdcSigOf`: the
  model as JSON, the footer's month aside; an International figure typed counts as drawn at once). `exportFdc` refuses a model that
  differs, draws the box again, and says the figures moved.
- **146 — the held ladder.** `bandsAdoptPending` waits while the board opens (`_bandsHold`, set before the opening's first, empty
  `applyStore`); at the end of the script (after the opening's own `DIRTY` reset) the ladder is taken into whatever plan opened, saved
  (unsaved, in browser storage) and said. Not in a PMO copy or a locked view. The held ladder's write is `{quiet:true}`: lsSet's "Use
  💾 Save to write it into the file" was untrue of it; `bandCopyAll`'s closing line already names what was not held.
- **146 — one stray rule.** `strayRule(ls, fb, b)` (pure); `strayOther` reads it with the appropriation's record; `_bootStray` reads it
  with storage's plan as it stands, the file's plan and this plan's record. `_bootOwnPack` is gone (it was the rule's pack test).
- **146 — the latched page says so at once.** The hand-over hold's storage listener says `impHandMsg('')` (kept unread) the moment it
  latches, once.
- **146 — the tie rule.** Not changed: storage wins a tie of `ts` in `pubsFor`, `apStoreOf` and `fydpStoreLocal`. Given a fixture
  (the same time, different content) and three mutations.

## Decided in the build
Brad can reverse each.
1. **142: a saved copy of another board is left in browser storage**, not kept aside (the contract: today's rules for the plan decide;
   v2.09's third review). Only unsaved work is kept aside. The item's check wording "kept aside, or left only where it is the same
   board" is read through that rule: a saved copy is in its own file, and keeping it aside would fill the one kept slot.
2. **142: the rule applies only where `DATA` would otherwise take storage's pack** (no consolidated payload; storage's plan carries a
   pack that differs from the file's; the file's plan newer) **and both packs list the same services in the same order.** Everywhere
   else the opening is v2.14's: a newer file built for another service list is refused by `applyStore`'s guard exactly as before (the
   v2.09 second review's check, "a newer file, the older one", holds it -- the first cut followed such a file, and the proof run's clean
   pass caught it), and a file plan with no pack is not followed.
3. **142: ⇢ Open the file anyway reopens the page** where the two lists differ, after removing storage's copy and writing the file's
   plan in its place where there is room (its question already said this browser's work is not kept). In place, the file's plan would
   stand against storage's list.
4. **143: the record is written straight to storage** (`apBaseSaved`), as `cycCarrySaved` wrote; W3 routes record writes (item 144).
5. **145: the question offers this page's copy or nothing.** OK writes this page's copy (stamped one past the other tab's, so the other
   tab's is kept aside by that board's opening and not lost); Cancel writes nothing, and the line says how to carry on from the other
   tab's copy instead (⬇ Save a copy of this page, then open that appropriation). No "write the other tab's" button: it would drop this
   page's work.
6. **145: while two copies stand, every writer of that appropriation refuses and every reader names it as not read** (`fydpStoreLocal`'s
   `why`), rather than reading either copy as the one.
7. **145: the downloads and the PMO copy keep this page's copy without asking** (`pubsFor`'s default): nothing is written over the
   board file there, and the other tab's copy stays in storage.
8. **131: Export compares the whole model but the footer's month**, and a figure typed in the box counts as drawn at once (an Export
   clicked straight after typing writes: a CONTROL in the check).
9. **146: the held ladder is taken at the end of the opening, saved and said**; not in a PMO copy (a copy's opening consumed the key the
   portfolio board's appropriation was waiting for) and not in a locked view.

## Checks
Each fails on the slot commit `8c24ea2` unless it says CONTROL (run on both boards through `recovery/v208/bin/slim.py`).
- audit-import **"v2.15 W2 — a newer board file opened over another board’s older copy shows its own requirement list (item 142)"**:
  1 the measured case, storage's copy saved (list, titles, asks, order, note; storage left; the next Save one board); 2 unsaved (kept
  aside whole, said, storage takes the screen); 3 unsaved with no room (held back, storage's plan on its own list — CONTROLs) and ⇢ Open
  the file anyway (never the file's plan against storage's list; reopens on the file's own list); 3b the kept slot in use (CONTROLs);
  4 R1's same ids (the file's titles and asks; the next Save); 5 the same board, storage newer (CONTROL). 7 fail on the slot commit.
- audit-import **"v2.15 W2 — 💾 Save records every appropriation it wrote exactly as this browser held it, and no copy changed while it
  wrote (item 143)"**: 1 INT-1's shape (import, Save, Full Fund recorded saved; its ladder copied from O&M; Full Fund's own first Save
  asks nothing — on the slot commit it asks "⚠ HOLD ON — this file was last saved by …"); 2 two appropriations, Full Fund changed in
  another tab while the save wrote (O&M recorded; Full Fund keeps its record and opens on that tab's work — CONTROLs on the slot commit,
  the guard's check); 3 the record write refused (left; Full Fund opens on the import, nothing lost — CONTROLs); 4 `cycCarrySaved`'s
  guard (a cycle carried while writing, from another tab's copy: not called saved, the carry kept — passes on the slot commit, where
  nothing else records it; `v215-w2-carry-guard` bites). 2 fail on the slot commit.
- audit-import **"v2.15 W2 — two tabs on one appropriation: a copy this page holds that storage refused is never replaced by another
  tab’s, and Save asks, naming both (item 145)"**: the fixture (CONTROL); the message at once; the ladder copy, a package, the cycle for
  every appropriation (each refused, said, both copies standing, leaving still asks); a plain Save (asks first, naming both; Cancel reads
  and writes nothing; OK writes this page's copy stamped newer; Full Fund's board then keeps the other tab's aside, whole); one tab alone
  (CONTROL). 11 fail on the slot commit.
- audit-other **"v2.15 W2 — FYDP Disconnects follows another tab’s save, never under a figure being typed, and Export refuses figures
  that moved (item 131)"**: drawn again; Export writes; typing — nothing drawn under it, Export refuses and says so, Export again
  writes; one tab alone, a figure typed and Export at once (CONTROL). 3 fail on the slot commit.
- audit-import **"v2.15 W2 — the held ladder reaches the plan that opens, one stray rule, the tie rule, and a page latched by another tab
  says so (item 146)"**: the held ladder taken by Initial Spares' board opening from its file, once, unsaved, said, kept in storage; the
  held ladder refused — named (CONTROL), and nothing says Save writes it; latched — says so at once; the tie (CONTROLs: the fixture
  the three tie mutations need); one stray rule — the opening and `strayOther` agree on blank work and an import's record, each with
  and without a pack (CONTROL; the retargeted W1/INT stray mutations bite through their own checks). 5 fail on the slot commit.

Existing checks changed on purpose, each with a `// v2.15 W2` comment:
- audit-import **"v2.14 W1 — Save asks, naming them … (item 140 b)"**, part (9): it reached C24's shorter list through R1 itself (an older
  stored copy of another board opening its list under the file's plan). 142 closes that, so the stored one-requirement copy is now the
  NEWER one (it opens on its own list) and its record names the file's save; the check -- Save names B and C and Cancel writes nothing
  -- is unchanged and still guards `v214-w1-drops-reqs-blind`.
- audit-import **"v2.14 W2 — the file route where the browser cannot write a file …"**, the fixture: its R1 control now reads that the
  file opened over the stale copy shows the file's own list (was: the stale copy's).
- audit-board **"v2.14 RV2-B — a carried plan whose record 💾 Save cannot write stays carried …"**: its first 💾 Save wrote Initial
  Spares exactly as this browser held it, so 143 now records that save saved -- and a carry forgotten on a refused record then no longer
  read as held, so `v214-rv2-b-carrysaved-drops-entry` survived. The fixture puts the record back to unsaved after that Save (as an
  edit there would); every assertion is as it was.

## Mutations
29 new (`v215-w2-*`, in the slot) and 12 retargeted in place (each the same defect, on the line that now carries it):
`boot-no-keep-aside` (the keep where the list does not move), `v209-rv2-save-boot-no-write`, `v209-rv2-save-boot-writes-unread`,
`v209-rv3-save-look-writes-storage`, `v209-rv3-save-look-record-left` (the opening's write and `held`), `v210-a-redraw-under-typing`
(`fdcSync`), `v214-w2-hold-no-storage-event` (the latch listener), `v214-rv2-b-pubsown-kept-after-save` and
`v214-rv2-b-carrysaved-drops-entry` (`cycCarrySaved`), `v214-w1-stray-any-record`, `v214-w1-stray-over-pack` and
`v214-int-stray-unguarded` (the opening's call of the one stray rule: a forced blank mark, storage's pack dropped, both). None retired.
`kept-replaced`'s find came to match a second line (`_bootPre`'s); the new line's variable was renamed instead. mcount: every target
once (3,636 entries).
Proofs: `recovery/v215/proofs-W2.json` → `proved-W2.jsonl` (run with `JOBS=1` under heavy.sh on `fc59d6b`, whose board is the final
board: the later commits move checks only, and one board change made and taken back). **41 of the 41 listed: 40 CAUGHT by their own checks, 1 SURVIVED (below)**, plus `v214-w1-drops-reqs-blind` re-proved CAUGHT after its fixture moved. `v214-rv2-b-carrysaved-drops-entry` was NOT CLEAN in the full run (143 had changed its fixture's premise); its fixture now sets the record back to unsaved after the first Save, and it is CAUGHT (its line appended to `proved-W2.jsonl`).

- **`v209-rv3-save-look-record-left` SURVIVED** -- and survives on the slot commit too (its slot-board mutant, the same line as the slot
  spells it, passes "v2.09 third review — a newer file opened only to look" whole: measured). Its check stopped biting before v2.15 (by
  v2.14's own changes to the record); retargeted here because the line moved, not because of it. For the integration: a check (or an
  `equivalent:` with backing) is owed.
- The first proof run found a regression of the first cut: "v2.09 second review — a newer file, the older one" was NOT CLEAN -- a newer
  file built for another service list was followed instead of refused. `_bootPre` now follows only a file with the same services.
- The first run's survivors `v215-w2-clash-pubsfor-silent` (OK on the question bumps the time, so `pubsFor`'s guard never mattered on that
  path) and `v215-w2-tie-apstore`/`-tie-fydp` (the tie check read after a Save had put storage's copy in PUBS) were answered by a new part
  (a board file built while two copies stand) and by reading the tie before any Save; both re-proved CAUGHT.

## For the integration
- **`_saveInPlaceFileRun`** (no owner named in §2; W3 owns `fh*`): W2 added three lines — `if(!pubsClashAsk()) return;` at the top,
  `const apSnap=apSavedSnap();` with the bytes, `apRecordSaved(apSnap, wrote);` after `cycCarrySaved`.
- **W3 (item 144)**: `apBaseSaved(k, wrote)` is now the one record write for another appropriation (`apRecordSaved` and
  `cycCarrySaved` both call it). Route it through `lsSet` there, once; a refusal must still return false (`cycCarrySaved` keeps its
  entry on false) and must not make the page "on screen only" (the record is not work).
- **W1 (cycle parts of `pkgApply`, `consTakeApply`, `importBoards`)**: `apStoreOf(k)` can now answer `{held:true, clash:true}`;
  `apHeldWhy(k)` then says both copies and ends "💾 Save asks which goes into the file". The callers' own trailing advice ("Open Full
  Fund once (its opening keeps that work aside)") reads oddly after it in that case: harmless, but worth one line at merge.
- **`cycApplyAll`** (the lead's): not changed. A clash makes `fydpStoreLocal` answer `why`, which its existing skip names.
- **Ladder adoption moved to the end of the opening** (`setTimeout`, after the opening's `DIRTY` reset): a check that reads a held
  ladder straight after `boot()` must wait one turn (none does today).

## npm script to add
None.

## Known gaps
- **142, R1's other appropriations.** `pubsFor` still takes another board's newer copy of another appropriation from storage (the plan's
  rule: newer wins, and that appropriation's own board opens it too). `saveDrops` (C24) asks when that drops requirements; the same ids
  with other content are written without a question, as in v2.14.
- **142, a file plan refused by `applyStore` while following** (services that disagree with its own pack): the default board is on
  screen, storage's work kept aside or left; nothing lost, nothing mixed.
- **142, a copy kept aside by v2.14** (the normalised plan) and the same work read raw by `_bootPre` read as different work: the
  file is held back as 'occupied'; nothing lost.
- **145 needs the storage event.** A copy another tab wrote before this page made its own is not a clash (this page's copy was built
  over it, or read it). A plan this page wrote to storage successfully and another tab then overwrote is last-writer-wins, as before:
  only a copy storage refused (on this page alone) is protected.
- **145, the shared folder's save** writes the board on screen only and is not asked about.
- **131**: the shared folder's answer is still read once per opening of the box.

## Results (the final tree; the board is byte for byte `fc59d6b`'s, every later commit moves a check or a note)
- **Whole suites** (each through heavy.sh, `HEAP=8192`): audit-recon, audit-other, audit-hostile, audit-inject, audit-ui, audit.mjs,
  legacy-fsrc and boot-same pass on `fc59d6b`; audit-import passes whole on `92517ed`, audit-board whole on the final tree (both after
  their moved checks). The first whole run of audit-board died at the 6 GB default heap (exit 134); run at 8 GB.
- **Browser checks:** savetarget, fileimport, storagefull, pmosave, panels, dialogs, standards (0 findings, nothing new), keys and
  leftmenu pass; savetarget, fileimport and storagefull again on `fc59d6b`.
- **Fuzz:** nothing lost, seed 926666896. `npm run coverage:money` 27/27. `npm run check` passes. mcount: 3,636 targets, each once.
