# v2.14 review round 1, fixer RV1-D: held findings and older files

Branch `v214-rv1d`, from `44aa984` (the merged, integrated v2.14 tree with the four fixers' slots). Probes copied into
the scratch folder `scratchpad/v214rev/rv1-D/` and pointed at this worktree's board. The board at `44aa984` is byte-identical
to the review worktree's (`cmp`). Every check below was run on `44aa984`'s board (`git show 44aa984:… > pre.html`, slimmed,
`BOARD=pre.html`) and on the fixed board.

## The findings, most severe first

### u35-place-key-misplaces-typing (data loss): reproduced, fixed

- **Reproduced** with the reviewer's `p1-rcn-keyless.mjs` on this board. After the load, `NOKEY-ONE holds 99999`. Stored after
  leaving: `[["KEYED","11111"],["NOKEY-NEW","44444"],["NOKEY-ONE","99999"],["NOKEY-TWO","33333"]]`. Nothing was said.
- **Fixed** in `rcnDraw`. A row with no text key, or one that repeats an earlier row's key, is no longer held by `'#'+i`, its
  place. It is held by `rcnRowSig(L, i)`: its stored key, code, EEIC, title and services, plus how many earlier rows hold
  exactly the same. The typing follows the row wherever a load moves it. A row the load changed or removed takes the typing
  with it: the typing is put on no other row, and `rcnBody` says so. For a row with no key of its own the sentence reads "has no
  key of its own, and the list as loaded no longer holds that row as it was". It never claims "no longer on the list" while the
  row is still there.
  - Keyed rows keep `data-rk` = their key, so W4's check 6 and keyboard-reach W are unchanged.
  - Same probe after the fix: `NOKEY-TWO holds 99999`; stored `…["NOKEY-ONE","22222"],["NOKEY-TWO","99999"]`.
- **Check:** audit-board `v2.14 RV1-D — the RCN / EEIC list holds typing in a row with no key of its own by what the row holds,
  never by its place (u35-place-key-misplaces-typing)`. Its parts:
  - (a) keyless rows, with a keyless row loaded above them;
  - (b) a repeated key, with a colleague's ✕ on the keyed row above;
  - (c) a keyless row that only moved;
  - (d) a keyless row the load changed: nothing kept, and the words;
  - (e) two identical keyless rows: typing in the second stays in the second.

  On `44aa984`: 7 failing checks, in (a) ×2, (b), (c) ×2 and (d) ×2; (e) passes there, as stated in the block. On the fix:
  passes.
- **Mutations:** `v214-rv1-d-rcn-place-again`, `v214-rv1-d-rcn-sig-no-count`, `v214-rv1-d-rcn-lost-words`.

### si-false-conflict-v213-copy and si-false-conflict-old-copy (untrue message): one defect, reproduced, fixed

- **Reproduced** with `p2-si-v213copy.mjs`. The v2.14 board gives `conflict true` and "the review box shows CONFLICT — changed
  here too". Apply asks "⚠ 1 of them overwrite a field THIS BOARD changed since the copy went out." The v2.13 board shows no
  conflict.
- **Fixed** in `pmoRows`. For `si`, a package without the new mark `siHand` came from a copy that could not record a "no SI
  code" chosen by hand. Its `null` baseline is read as the board's `''`, which is v2.13's own reading. `pmoSubmit` puts
  `pkg.siHand=1` on every package a v2.14 copy writes. Such a package is compared as it stands: its `null` is a change, and the
  real conflict is still flagged.
  - A marker was chosen over `pkg.build` because BUILD still reads `v2.13 (2 Nov 2026)` until the lead bumps it, so a v2.14
    copy's package cannot yet be told from v2.13's by its build.
  - As both skeptics measured, an old copy's null cannot tell "the board held none by hand" from "the board set none after the
    copy went out". The second case is read as no conflict, exactly as v2.13 read it. That is no worse than v2.13; a copy
    published by v2.14 tells the two apart.
- **Check:** audit-import `v2.14 RV1-D — a copy published before v2.14 is not read as a conflict over a “no SI code” the board
  held when it went out (si-false-conflict-v213-copy, si-false-conflict-old-copy)`.
  - The copy is v2.13's own: `git show c863dc2`, published and submitted by its own code, with A set through `setSi('A','')`
    on an office (PP) whose rules give EN.
  - (a) The review row, the review box, the change report's Conflict cell (read from the workbook's bytes) and Apply's
    question.
  - (b) CONTROL: a v2.14 copy, with B set to none by hand on the board after it went out, is still a conflict everywhere.
  - On `44aa984`: 5 failing checks: (a) ×4 (the row, the review box, the change report's cell, Apply's question) and (b) the
    package (no siHand). On the fix: passes.
- **Mutations:** `v214-rv1-d-si-old-conflict`, `v214-rv1-d-si-mark-unsent`, `v214-rv1-d-si-mark-ignored`.

### d28-writes-false-journal-line (untrue message): reproduced; what v2.14 can do, done

- **Reproduced** with `old/p4-d28.mjs`. v2.13 writes `{"p":["custom","NEW-2","ask",1],"a":55,"b":50,"f":1}` and changes
  nothing. v2.14's panel shows "Colleague … EV-2 (ask › 1) $55 $50 ↶ Put back", and `jrnlUndoable` is true.
- **The v2.13 program cannot be changed, so it cannot be made to refuse.** Its `jrnlUndoable` refuses a line only on a path
  starting `(`, a path through `__proto__`/`constructor`/`prototype`, a `(services)` line after it, or a value carrying `_b`.
  - Each of these would mean re-shaping every line v2.14 journals by id (`['(custom)', …]` or a wrapped value).
  - That would change map design C's line format, and every reader of it: `jrnlWalk`, `jrnlSet`, `jrnlCustomPlace`, `cycWho`,
    `pmoOutChanged` and the checks that pin `['custom', nid]`. That is not the smallest change, so it was not done.
- **v2.14 now recognises the line instead.**
  - v2.14's own `jrnlUndo` marks the reversal it writes for a by-id line (`byId:1`). It is set on the line `jrnlAdd` just
    pushed, so the original `jrnlAdd(…)` line, which `jrnl-reversal-unrecorded` targets, is untouched.
  - Only this build's Put back writes a forced line by id in the list of added requirements. A forced by-id `custom` line
    without the mark (`jrnlOlderLine`) can therefore only be an older ORBIT's reversal of a v2.14 line, and that older ORBIT
    changed nothing.
  - Such a line is not undoable. Its journal row says "recorded by an ORBIT older than v2.14, which tried to put this change
    back and could not: nothing changed on the board." `cycWho` does not count it. `cycWho` is outside the code I own:
    one condition was added to its filter, named here.
  - Pressed anyway, `jrnlUndo` says so before anything is asked. That refusal is ahead of the `cycBlock` line, as W4's
    gone-requirement refusal is, so the two v2.00 finds spanning that line still match.
- **Not covered:** an ORBIT older than v1.95 wrote its reversal unforced (no `f`), so such a line would read as a genuine
  edit. No version that old can open a v2.14 board's storage in practice.
- **For the ship notes (contract §11.7):** D28's sentence must not say an older ORBIT "changes nothing". Proposed wording:
  > An ORBIT older than v2.14, open on the same browser, can put back a change v2.14 journalled to an added requirement. It
  > changes no figure, but it writes a journal line saying the value went back (or, for a whole requirement, that it was
  > removed). v2.14 shows such a line as recorded by an older ORBIT, with nothing changed, and never offers it for Put back.
- **Check:** audit-import `v2.14 RV1-D — a line an ORBIT older than v2.14 wrote putting back a line journalled by id reads as
  recorded and never done (d28-writes-false-journal-line)`. This is D28's own route: the v2.13 program (`git show c863dc2`)
  booted on this build's browser storage, putting back Pat's by-id ask line and NEW-1's add line, then this build reopened in
  that browser.
  - (a) neither line is offered for Put back;
  - (b) the panel's words, with no ↶ button;
  - (c) `cycWho` names Pat;
  - (d) Put back pressed anyway asks nothing, changes nothing, writes no line, and says why;
  - (e) CONTROL: this build's own Put back by id is real, and its marked reversal is offered and works.

  On `44aa984`: 4 failing checks, one each in (a), (b), (c) and (d). On the fix: passes.
- **Mutations:** `v214-rv1-d-jrnl-older-offered`, `v214-rv1-d-jrnl-own-unmarked`, `v214-rv1-d-jrnl-older-unsaid`,
  `v214-rv1-d-cycwho-older`, `v214-rv1-d-jrnl-older-undo-generic`.

### u64-working-out-of-folder-unchecked (test gap): reproduced as a gap, check added, and a rule change from the also-noticed item

- **Reproduced** with the reviewer's `probe-u64-folder-on.mjs` on this board: S1 kept aside, and found afterwards.
- **Check:** audit-import `v2.14 RV1-D — Put this back keeps work saved only in the board file aside while working out of the
  folder, never the folder’s own copy, and says what happened (u64-working-out-of-folder-unchecked)`, part (a). The route:
  1. Connect and work out of the folder. S1 is saved only in the board file, and `MS.ts≠driveBase`.
  2. Put this back.
  3. Switch Live view to just watching.
  4. 💾 Save, then reopen.

  S1 is kept aside, marked saved, with the right words, and is still kept after the reopen. (a) passes on `44aa984`, as a test
  gap's check does.
- **The term's mutation:** after the rule change below, dropping the third term *is* `keep=own`, so
  `v214-w4-restore-keeps-nothing-saved` is that mutation. It was retargeted to the new line and is proved by this block.

## The also-noticed items

### A board file damaged by v2.13's own Put back: reproduced, fixed (mended on opening and at a full import)

- **Reproduced** with `old/p8b.mjs`.
  - A null element: the boot throws "Cannot read properties of null (reading 'ask')".
  - An element with no id: "…undefined (reading 'slice')".
  - The full import refuses both at the door.
- **How such a board reaches v2.14.** A board file runs its own program, so v2.14 reaches a v2.13 board two ways:
  - the same browser: v2.13 persisted the damage, and the v2.14 program opens browser storage's board;
  - the full import, which is the upgrade route.

  The check builds the damage with v2.13's own Put back: the add of NEW-1 put back by its place leaves `null`, and NEW-3's value
  put back after NEW-3 was deleted leaves `{ask:[300,0,0], fy26:[0,0,0]}` with no id.
- **Fixed:**
  - `customMend(T, fy, quiet)` runs in `applyStore` for every year before anything reads one.
    - An empty entry (null) holds nothing and is taken out.
    - Any other entry with no usable requirement id is moved, as it was found (`{i, v}`), into the year's `customAside`, where
      nothing reads or counts it. Given an id, its figures would join the portfolio as a requirement nobody added.
  - What was mended is said once the board is open (`customMendSay`, kept unread).
  - No ORBIT could lock a cycle holding such a list (v2.13's lock throws on it), so `applyStore` is the one place needed. A
    defensive second call in `applyState` was taken out because no route reaches it.
- **Outside my code** (named here, as asked; the smallest change):
  - **The door** (`inShapeWhy`, one line): in the user's own board (`_inRcnOwn==='board'`, the full import only), an entry
    `customMendable` names does not refuse the board. This follows the precedent of the own board's RCN / EEIC and destination
    lists.
    - Every entry that is a requirement is still checked by `itemWhy`, so the hostile suite's `N"1` id is still refused.
    - Every other door still refuses such a file (v1.95 R09).
  - **`fullImportText`** (a few lines, after `destOwnRight`) mends each appropriation's years as they come across, so no
    reader of another appropriation's raw store meets the damage. It also adds a line to the question and to the report the
    reopened board gives.
- `door-custom` was retargeted to the door's new line. It is proved by audit-hostile, which still refuses the double-quoted id.
- **Check:** audit-import `v2.14 RV1-D — a board whose list of added requirements an older ORBIT damaged opens, mended and said,
  and counts nothing it set aside (oldfiles)`.
  - (a) The v2.14 program on v2.13's browser storage opens with no page error, holds only NEW-2, and keeps the no-id element
    aside as found. It counts nothing from it ($1,400 = A + NEW-2) and says so, kept unread. The shell's own opening line can
    take the status line after it, so the check reads the session's messages.
  - (b) A full import of v2.13's file is taken, its question names the mend, and the reopened board is the same and its
    report says so.
  - (c) Saved, the file carries the mended list and the aside.

  On `44aa984`: 8 failing checks, every part: on browser storage the page error and every read after it; the full import
  refused at the door. On the fix: passes.
- **Mutations:** `v214-rv1-d-custom-unmended`, `v214-rv1-d-custom-aside-dropped`, `v214-rv1-d-custom-unsaid`,
  `v214-rv1-d-door-refuses-mendable`, `v214-rv1-d-import-unmended`.
- **Left:** the other doors (import one appropriation, the several-boards import, the shared folder's copy, packages) still
  refuse such a list, per R09. A full import is the route for a whole board.

### driveRestore keeps the folder's own copy aside as "saved only in the board file": reproduced, fixed (the contract's rule changed)

- **Reproduced** with `probe-also-restore.mjs` R1. Just watching, with the folder's own copy on screen (loaded from it, nothing
  saved since):
  - Put this back kept R1-F1 aside as `saved:true` and said "saved only in the board file", which is untrue.
  - With the one slot already holding work, it refused the earlier copy outright: "Bob saved a newer copy to the folder’s
    history … what is on screen is saved only in the board file … the newer copy was not loaded".
- **Fixed:** `keep = own || (+MS.ts||0)!==driveBaseOf(pinAp)`. The watching term is gone.
  - What is on screen equals the folder's base only when it is the copy last read from or written to the folder, with nothing
    saved since. A file Save calls `save()`, which moves `MS.ts`. That copy is in the folder: the standing copy was just kept in
    the history above, and a copy a colleague replaced was kept in history by their save.
  - **This changes map design E's three-term rule** (U19's rule as written into driveRestore). It is allowed because the term
    misled ("saved only in the board file") and needlessly took the one kept slot (§12 Q4), refusing the restore when the slot
    was taken. Work that is not the folder's own copy is still kept whatever Live view does: part (a), and U64 (a), (b), (e).
  - `keptPutBack` keeps U19's own rule unchanged. It swaps into the slot it frees, so it never fills an empty one, and its
    words there are true.
- **Check:** the same restore block. (b) Nothing kept, and no "saved only in the board file" or "kept aside". (c) With the slot
  taken, the earlier copy is put back all the same. On `44aa984` the block fails 6 checks: (b) ×2, (c), and (d) and (e)
  below; (a) passes there, as a test gap's check does.
- **Mutation:** `v214-rv1-d-restore-keeps-folder-copy`, which puts the watching term back.

### driveRestore's occupied refusal said "saved a newer copy": fixed (the skeptic's note on u64)

- **Fixed:** `keptOccupiedRestoreMsg(own)` says "Nothing was put back … the earlier copy was not put back and nothing was
  lost", with the same three buttons. It no longer speaks of somebody's newer copy, which was not loaded.
- **Check:** (d), which fails on `44aa984`.
- **Mutation:** `v214-rv1-d-restore-occupied-newer`.

### keptPutBack's folder wording after U64's Put this back: reproduced, fixed

- **Reproduced** with `probe-also-restore.mjs` R2. While just watching, putting S1 back said "💾 Save will ask before it writes
  over the shared folder, which Bob saved; …". Save writes the board file, and Bob saved the earlier copy before S1.
- **Fixed:**
  - `driveRestore` keeps with `put:true`, and `keepAside` records `m.put`.
  - `keptPutBack` says the rule Save follows, as for a copy kept at a put-back: "💾 Save will ask before it writes over a copy
    saved after the one this work came from." That is true wherever Save writes. A separate branch keeps the two v2.00 U19
    finds matching.
- **Check:** (e), which fails on `44aa984`.
- **Mutations:** `v214-rv1-d-kept-put-unmarked`, `v214-rv1-d-kept-put-words`.

### Put back of a purge line recreates an orphan entry: reproduced, fixed

- **Reproduced** with `probe-purge.mjs`: `S.desc {"NEW-1":"the description"}` after NEW-1 was deleted, and "↶ Put back:
  description — NEW-1 — recorded in the journal".
- **Fixed:** `jrnlFieldGone(e)` refuses Put back of a line naming an added requirement that has left its year:
  - the line is in a per-requirement container (`REQ_MAPS`; the UPL mark `r|<id>`; the what-if levels);
  - the id is an added one (`NEW-…`);
  - the year holds the id in none of its added list, order or removed list.

  The refusal sits ahead of the `cycBlock` line, beside W4's ['custom', …] refusal, with the same words: "that added
  requirement is no longer in FY27. Nothing was changed."
- **Check:** audit-board `v2.14 RV1-D — Put back of a field of an added requirement that has left its year is refused, never
  written under an id nothing carries (held, also noticed)`.
  - (a) The purge line.
  - (b) An earlier line that set the gone requirement's note.
  - (c) CONTROL: a board-data requirement, removed, still has its description put back.
  - (d) CONTROL: an added requirement still in the year still has its description put back.

  On `44aa984`: 3 failing checks, (a) ×2 and (b). On the fix: passes.
- **Mutations:** `v214-rv1-d-jrnl-field-gone-silent`, `v214-rv1-d-jrnl-field-gone-any`.

### Not changed

- `jrnlCustomHere` requires exactly one match. In a year whose added ids repeat, a by-id line is refused saying "no longer in
  FY…" though it is there twice. By-id lines are written only while ids are unique (`jrnlById`), so this needs ids that repeat
  *later*. It was not asked for, it loses nothing, and it is left to the lead.

## Mutations

22 new (`v214-rv1-d-*`, in the RV1-D slot of `mutate.mjs`, ids single-quoted) and 3 retargeted in place, each with a
`// v2.14 RV1-D` comment:

- `restore-no-keep-aside`: the keep line now carries `put:true`;
- `v214-w4-restore-keeps-nothing-saved`: the keep line without the watching term;
- `door-custom`: the door's line with the own-board clause.

`mcount`: 3407 entries, 3407 once. Every mutant was built with `mkmut.py` and parses (`node tools/check.mjs`: `ok    main script
parses`, 25/25). The proofs file is `recovery/v214/proofs-RV1D.json`, and the records are `recovery/v214/proved-RV1D.jsonl`.

**Proofs** (`JOBS=1 HEAP=8192 python3 -I -B recovery/v208/bin/prove.py recovery/v214/proofs-RV1D.json recovery/v214/proved-RV1D.jsonl`):
every named check was clean on the fixed board first, then **25 of 25 CAUGHT** by failed checks; none SURVIVED, CRASHED or
NOT APPLIED. The first run of `v214-w4-restore-keeps-nothing-saved` was caught by 6 failing checks, with the block then
throwing at (e) (`keptCopy().meta` on no kept copy). That read was made null-safe, the record was dropped and it was proved
again: 8 failing checks, no throw.

| Mutation | Check (suite / block) | Failing checks |
|---|---|---|
| `v214-rv1-d-rcn-place-again` | board / v2.14 RV1-D — the RCN / EEIC list holds typing | 7 |
| `v214-rv1-d-rcn-sig-no-count` | board / v2.14 RV1-D — the RCN / EEIC list holds typing | 1 |
| `v214-rv1-d-rcn-lost-words` | board / v2.14 RV1-D — the RCN / EEIC list holds typing | 1 |
| `v214-rv1-d-si-old-conflict` | import / v2.14 RV1-D — a copy published before v2.14 | 4 |
| `v214-rv1-d-si-mark-unsent` | import / v2.14 RV1-D — a copy published before v2.14 | 3 |
| `v214-rv1-d-si-mark-ignored` | import / v2.14 RV1-D — a copy published before v2.14 | 2 |
| `v214-rv1-d-jrnl-older-offered` | import / v2.14 RV1-D — a line an ORBIT older than v2.14 | 2 |
| `v214-rv1-d-jrnl-own-unmarked` | import / v2.14 RV1-D — a line an ORBIT older than v2.14 | 2 |
| `v214-rv1-d-jrnl-older-unsaid` | import / v2.14 RV1-D — a line an ORBIT older than v2.14 | 1 |
| `v214-rv1-d-cycwho-older` | import / v2.14 RV1-D — a line an ORBIT older than v2.14 | 1 |
| `v214-rv1-d-jrnl-older-undo-generic` | import / v2.14 RV1-D — a line an ORBIT older than v2.14 | 1 |
| `v214-rv1-d-custom-unmended` | import / v2.14 RV1-D — a board whose list of added requirements | 4 |
| `v214-rv1-d-custom-aside-dropped` | import / v2.14 RV1-D — a board whose list of added requirements | 5 |
| `v214-rv1-d-custom-unsaid` | import / v2.14 RV1-D — a board whose list of added requirements | 1 |
| `v214-rv1-d-door-refuses-mendable` | import / v2.14 RV1-D — a board whose list of added requirements | 4 |
| `v214-rv1-d-import-unmended` | import / v2.14 RV1-D — a board whose list of added requirements | 2 |
| `v214-rv1-d-restore-keeps-folder-copy` | import / v2.14 RV1-D — Put this back keeps work saved only | 3 |
| `v214-rv1-d-restore-occupied-newer` | import / v2.14 RV1-D — Put this back keeps work saved only | 1 |
| `v214-rv1-d-kept-put-unmarked` | import / v2.14 RV1-D — Put this back keeps work saved only | 2 |
| `v214-rv1-d-kept-put-words` | import / v2.14 RV1-D — Put this back keeps work saved only | 1 |
| `v214-rv1-d-jrnl-field-gone-silent` | board / v2.14 RV1-D — Put back of a field of an added requirement | 3 |
| `v214-rv1-d-jrnl-field-gone-any` | board / v2.14 RV1-D — Put back of a field of an added requirement | 1 |
| `restore-no-keep-aside` | import / v1.95 — ↶ Put this back keeps unsaved work aside first | 2 |
| `door-custom` | hostile / v1.88 — a file that could run code or change a figure is refused | 29 |
| `v214-w4-restore-keeps-nothing-saved` | import / v2.14 RV1-D — Put this back keeps work saved only | 8 |

## Runs

All on the committed board (`d3848ae`, unchanged since) and the suites as committed in `36e7a83`, one heavy run at a time,
8 GB heap for the jsdom suites. Durations are wall-clock on this shared 4-core box.

| Command | Duration | Exit | Result |
|---|---|---|---|
| `npm run check` | 3 s | 0 | all checks passed |
| `node tools/export-audit/boot-same.mjs` | 10 s | 0 | every page, source, save and error list is identical either way |
| `python3 -I -B recovery/v200/bin/mcount.py tools/export-audit/mutate.mjs prioritization-board-grid.html` | 5 s | 0 | 3407 entries, 3407 once |
| `npm run defects` | <1 s | 0 | REGISTER HOLDS: 15 known, 15 guarded by 47 mutations |
| `npm run coverage:money` | 1 s | 0 | 27/27 surfaces, 0 gaps |
| `node tools/export-audit/audit-board.mjs` | 513 s | 0 | ALL CHECKS PASSED |
| `node tools/export-audit/audit-import.mjs` | 1,517 s | 0 | ALL CHECKS PASSED (see below) |
| `node tools/export-audit/audit-recon.mjs` | 1,150 s | 0 | ALL CHECKS PASSED |
| `node tools/export-audit/audit-hostile.mjs` | 70 s | 0 | ALL CHECKS PASSED |
| `node tools/export-audit/audit-other.mjs` | 187 s | 0 | ALL CHECKS PASSED (see below) |
| `node tools/export-audit/audit-ui.mjs` | 98 s | 0 | ALL CHECKS PASSED |
| `node tools/export-audit/audit-inject.mjs` | 15 s | 0 | all clear across 45 findings and 4 text-fidelity guards |
| `node tools/export-audit/audit.mjs` | 11 s | 0 | ALL CHECKS PASSED |
| `node tools/export-audit/legacy-fsrc.mjs` | 3 s | 0 | every legacy Force setting computes exactly as before |
| `npm run fuzz` | 20 s | 0 | seed 854642964: nothing was lost, 3 randomized boards |
| `npm run keys` | 108 s | 0 | 0 FAIL, section W (the RCN / EEIC hold) included |
| `npm run panels` | 17 s | 0 | every panel and menu opens, no escaped entity, no field clips its value |
| `npm run fileimport` | 49 s | 0 | ALL CHECKS PASSED |
| `npm run dialogs` | 260 s | 0 | every box takes, keeps and gives back the keyboard, and asks before typing is lost |
| `npm run hostile` | 50 s | 0 | nothing a file can carry runs when the board draws it |
| `npm run standards` | 73 s | 0 | conformance holds: 0 known findings, nothing new |
| `npm run savetarget` | 38 s | 0 | all save-target checks passed |
| `npm run storagefull` | 30 s | 0 | all storage-full checks passed |

The first pass of the whole suites lost **audit-import** (after 1,605 s) and **audit-other** (after 138 s) to the kernel's OOM
killer. Both exited 137 with nothing written, and `dmesg` reads "Memory cgroup out of memory: Killed process … (node)". The cgroup
is shared with the other three fixers, whose own audit-import and audit-board runs held about 7 GB at the time. Neither was a
check failing. Each was run again alone, and passed as above. The board did not change between the runs.

## After the independent check (finishing round)

An independent check re-ran every probe on `1c4509d`. It found the original findings fixed (the SI pair, d28, u64) or fixed
on their own route (u35). It also found three new defects and one inaccurate comment:
- one defect the first cut introduced (the full import's door);
- two older ones the first cut left, which `44aa984` has as well (u35 by another route, and the reach of the mend).

Each is handled below. Every check was run on `44aa984` (`pre.html`), on the first cut `d3848ae` (`fix1.html`) and on
the board as it now stands.

### u35, the same defect by another route: the first row of a repeated key (data loss, on 44aa984 too)

- **Reproduced** with the check's `x1-first-of-repeat.mjs` on `1c4509d`, in both its forms (X1 and X1b with a keyed row above):
  1. type 99999 into K1-FIRST (22222);
  2. a colleague's ordinary ✕ removes that row, loaded through `applyStore` as a Live tick loads it;
  3. the repeat below becomes the first row with K1, drawn with the held key, and takes the typing;
  4. leaving the field writes 99999 over K1-REPEAT's 33333, with nothing said.

  `44aa984` does the same.
- **Writing the check found a third route, also on `44aa984`.** A key one row carries (K2-ONLY, 22222) is held by that key. A
  load adds a row with the same key above it, and the new row becomes the first with the key and takes the typing. Leaving the
  field overwrites the new row's 44444.
- **Fixed** in `rcnDraw` and `inspHeldSame`:
  - A row is held by its key only where no other row on the list carries that key. Every other row, the first of a repeated key
    included, is held by `rcnRowSig`.
  - Every row now also carries what it holds (`data-rs`). `inspHeld` records it, and `inspHeldSame` finds the field again by
    the row's key or by `data-rs`. A row whose key a load makes shared, or makes one row's alone, keeps the typing so long as the
    row itself is as it was.
  - At most one row can answer: a key one row carries is in no other row's `data-rs`, and the count in `rcnRowSig` makes
    `data-rs` one row's own.
- **The words** (`rcnBody`): typing lost from a row held by a key the loaded list still carries (now on several rows) is said
  in the "has no key of its own, and the list as loaded no longer holds that row as it was" sentence. It is never said to be
  "no longer on the list" while the key is there.
- **Check:** the audit-board block `v2.14 RV1-D — the RCN / EEIC list holds typing …` gains four parts:
  - (f) the first of a repeated key, with a colleague's ✕ on it: kept on no row, K1-REPEAT keeps 33333, and said;
  - (g) the second of a repeated key, whose key becomes its own: kept;
  - (h) a key one row carries, with a load adding the same key above: kept on K2-ONLY, and the new row keeps 44444;
  - (i) the same, with the load also renaming K2-ONLY: kept on no row, and never said to be off the list.

  It fails 16 checks on `44aa984` and 9 on `d3848ae`, and passes now.
- **Mutations:**
  - `v214-rv1-d-rcn-first-of-repeat` drops the uniqueness term;
  - `v214-rv1-d-rcn-held-no-sig` drops the `data-rs` match;
  - `v214-rv1-d-rcn-lost-key-shared` drops the shared-key words;
  - retargeted in place to the lines that now carry them: `v214-rv1-d-rcn-place-again` and `v214-rv1-d-rcn-lost-words`.

### The full import's door let the damage through in a locked cycle (introduced by the first cut)

- **Reproduced** with the check's `p-cyc-door.mjs`. On `1c4509d`, `door('board')` passed a board file whose O&M locked cycle's
  FY27 list held null and an element with no id. The full import took it, and `cycView('PB|2027')` on the reopened board threw.
  `44aa984` refused the file.
- **Fixed** in `inShapeWhy`. The own-board leave applies only where the full import mends:
  - a working plan's years under the file's `appns` (`the saved state.appns.<k>`, `….years.<y>`);
  - or at the file's top (a one-appropriation board: `the saved state`, `….years.<y>`).

  A locked cycle's year, or any other plan in the file, is refused as before. No ORBIT could lock such a list. The probe now
  refuses at every door, and the full import changes nothing.
- **Check:** part (e) of the audit-import block `v2.14 RV1-D — a board whose list of added requirements an older ORBIT damaged …`.
  This build's own board file, with one locked cycle on O&M, is given the damage in the cycle's year: the door names where and
  refuses, and the full import takes nothing (browser storage as it was). The same damage in the working plan's year passes the
  door.
  - It fails on `d3848ae`: the cycle's file is taken.
  - It also fails on `44aa984`, whose door refused the working plan's damage as well, so the "passes" half fails there.
- **Mutations:** `v214-rv1-d-door-mends-any-plan` puts the first cut back. `v214-rv1-d-door-refuses-mendable` and `door-custom`
  are retargeted in place to the door's line as it now reads.

### The mend covered only the appropriation on screen (not a regression; 44aa984 the same)

- **Reproduced** with the check's `p-other-sp.mjs`, in both its modes:
  - **file:** O&M's list damaged in the file;
  - **storage:** O&M's list damaged in this browser's copy, as v2.13's Put back persists it.

  The board was opened on Full Fund. Spruills threw "Cannot read properties of null (reading 'id')", and so did every later
  redraw while it was open. A broader probe (`rv1-D/check2/p-other.mjs`) found the PMO drill (`pmoDetail`), the chart of accounts
  (`coaRows`, `exportCoa`) and `spGather` throwing the same way. Every other reader of another appropriation it tried ran:
  - `diagReport`, `flowEntUseMap`, `destOwnLists`, `bandPeers`, `cycOverviewHtml`, `impShellEmpty`;
  - the FYDP panel (each appropriation in a frame opens its own board, through `applyStore`, and is mended there);
  - `flowCalc`, `exportFlow`, `exportExcel`, `oneAppnHtml`, `buildSavedHtml`, `cycApplyAll`.
- **Fixed** in `itemsOf`, the one reading of a year's requirement list that those throwing readers share. `itemsOf` is outside
  the code I own, as is the door's line above (`inShapeWhy`). Each is a one-line change, named here. An entry in the list of
  added requirements that is not one (`customMendable`) is left out and counts nowhere, as the mend sets it aside.
  - The year on screen is already mended before `applyState` reads it, so there the filter changes nothing.
  - That appropriation's own board mends the list, and says so, when it opens.
  - Nothing is written to the other appropriation's storage. The boot writes storage only where it keeps unsaved work aside.
- **Check:** part (d) of the same audit-import block, on v2.13's own damaged board opened on Full Fund, from the file and from
  this browser's storage. Spruills reads O&M's FY27 as $200, opens and closes; the PMO drill and the chart of accounts run; and
  there is no page error. The expectation is the same file with the two entries taken out by hand: NEW-2 alone, $200. A board
  with no consolidated payload reads only another appropriation's added requirements there.
  - It fails on `44aa984` and on `d3848ae`: every read throws.
  - It passes now.
- **Mutations:**
  - `v214-rv1-d-other-appn-unread` takes the filter out;
  - `v214-rv1-d-other-appn-counts-aside` filters only null, so the element with no id is counted as $300.

### The driveRestore comment

- The check's note was that the comment said the folder's own copy "is in the folder", which is not always so after the history
  thins itself. The comment now says the copy was written to the folder. The history thins its copies, but a copy can go only
  once a save built on it stands after it. No code changed.

### Not changed

- `cycMenuHtml()` threw "mi is not a function" in the check's `p-other-appn.mjs`. That is the probe calling a helper outside
  `syncBtns`, where `mi` is defined. It is not about the damaged list, and it throws the same way on a clean board.
- The check's own probe read `cycHasReqs(cycOtherOf('om'))` as false. It passes `cycOtherOf`'s summary rather than a store, so that
  reading is the probe's, not the board's.

### Mutations and proofs (finishing round)

There are 6 new mutations, in the RV1-D slot:
- `v214-rv1-d-rcn-first-of-repeat`
- `v214-rv1-d-rcn-held-no-sig`
- `v214-rv1-d-rcn-lost-key-shared`
- `v214-rv1-d-door-mends-any-plan`
- `v214-rv1-d-other-appn-unread`
- `v214-rv1-d-other-appn-counts-aside`

Four existing mutations were retargeted in place, each with a `// v2.14 RV1-D (check)` comment:
- `v214-rv1-d-rcn-place-again`
- `v214-rv1-d-rcn-lost-words`
- `v214-rv1-d-door-refuses-mendable`
- `door-custom`

`mcount` reports 3413 entries, each matching once. Every new or retargeted mutant was built with `mkmut.py` and parses.

The first cut's proof record is kept as `proved-RV1D-first.jsonl`. Every RV1-D mutation was then proved again on this board into
a fresh `proved-RV1D.jsonl`, with `JOBS=1 HEAP=8192`. Each check ran clean on the board first. The result: **31 of 31 CAUGHT**,
every one by a failed check and none by a throw.

| Mutation | Check (suite / block) | Failing checks |
|---|---|---|
| `v214-rv1-d-rcn-place-again` | board / the RCN / EEIC list holds typing | 11 |
| `v214-rv1-d-rcn-sig-no-count` | board / the RCN / EEIC list holds typing | 1 |
| `v214-rv1-d-rcn-lost-words` | board / the RCN / EEIC list holds typing | 3 |
| `v214-rv1-d-rcn-first-of-repeat` | board / the RCN / EEIC list holds typing | 7 |
| `v214-rv1-d-rcn-held-no-sig` | board / the RCN / EEIC list holds typing | 4 |
| `v214-rv1-d-rcn-lost-key-shared` | board / the RCN / EEIC list holds typing | 1 |
| `v214-rv1-d-si-old-conflict` | import / a copy published before v2.14 | 4 |
| `v214-rv1-d-si-mark-unsent` | import / a copy published before v2.14 | 3 |
| `v214-rv1-d-si-mark-ignored` | import / a copy published before v2.14 | 2 |
| `v214-rv1-d-jrnl-older-offered` | import / a line an ORBIT older than v2.14 | 2 |
| `v214-rv1-d-jrnl-own-unmarked` | import / a line an ORBIT older than v2.14 | 2 |
| `v214-rv1-d-jrnl-older-unsaid` | import / a line an ORBIT older than v2.14 | 1 |
| `v214-rv1-d-cycwho-older` | import / a line an ORBIT older than v2.14 | 1 |
| `v214-rv1-d-jrnl-older-undo-generic` | import / a line an ORBIT older than v2.14 | 1 |
| `v214-rv1-d-custom-unmended` | import / a board whose list of added requirements | 5 |
| `v214-rv1-d-custom-aside-dropped` | import / a board whose list of added requirements | 5 |
| `v214-rv1-d-custom-unsaid` | import / a board whose list of added requirements | 1 |
| `v214-rv1-d-door-refuses-mendable` | import / a board whose list of added requirements | 5 |
| `v214-rv1-d-import-unmended` | import / a board whose list of added requirements | 2 |
| `v214-rv1-d-door-mends-any-plan` | import / a board whose list of added requirements | 2 |
| `v214-rv1-d-other-appn-unread` | import / a board whose list of added requirements | 2 |
| `v214-rv1-d-other-appn-counts-aside` | import / a board whose list of added requirements | 2 |
| `v214-rv1-d-restore-keeps-folder-copy` | import / Put this back keeps work saved only | 3 |
| `v214-rv1-d-restore-occupied-newer` | import / Put this back keeps work saved only | 1 |
| `v214-rv1-d-kept-put-unmarked` | import / Put this back keeps work saved only | 2 |
| `v214-rv1-d-kept-put-words` | import / Put this back keeps work saved only | 1 |
| `v214-rv1-d-jrnl-field-gone-silent` | board / Put back of a field of an added requirement | 3 |
| `v214-rv1-d-jrnl-field-gone-any` | board / Put back of a field of an added requirement | 1 |
| `v214-w4-restore-keeps-nothing-saved` | import / Put this back keeps work saved only | 8 |
| `restore-no-keep-aside` | import / v1.95 — ↶ Put this back keeps unsaved work aside first | 2 |
| `door-custom` | hostile / (whole suite) | 29 |

### Runs (finishing round)

All runs were on the board committed in `646aeac`, which has not changed since, with an 8 GB heap for the jsdom suites. The
cgroup is shared with the other three fixers:
- The first whole runs of **audit-board** (after 305 s) and **audit-import** (after 1,515 s) were killed by the kernel's OOM
  killer: exit 137, and `dmesg` reads "Memory cgroup out of memory".
- Neither was a check failing. Each was run again, alone, and passed as below.

| Command | Duration | Exit | Result |
|---|---|---|---|
| `npm run check` | 3 s | 0 | all checks passed |
| `node tools/export-audit/boot-same.mjs` | 10 s | 0 | every page, source, save and error list is identical either way |
| `mcount.py` | 5 s | 0 | 3413 entries, 3413 once |
| `npm run defects` | <1 s | 0 | REGISTER HOLDS: 15 known, 15 guarded by 47 mutations |
| `npm run coverage:money` | 1 s | 0 | 27/27 surfaces, 0 gaps |
| `node tools/export-audit/audit-board.mjs` | 388 s | 0 | ALL CHECKS PASSED |
| `node tools/export-audit/audit-import.mjs` | 1,366 s | 0 | ALL CHECKS PASSED |
| `node tools/export-audit/audit-recon.mjs` | 997 s | 0 | ALL CHECKS PASSED |
| `node tools/export-audit/audit-other.mjs` | 136 s | 0 | ALL CHECKS PASSED |
| `node tools/export-audit/audit-hostile.mjs` | 54 s | 0 | ALL CHECKS PASSED |
| `node tools/export-audit/audit-ui.mjs` | — | 0 | ALL CHECKS PASSED |
| `node tools/export-audit/audit-inject.mjs` | — | 0 | ALL CHECKS PASSED |
| `node tools/export-audit/audit.mjs` | — | 0 | ALL CHECKS PASSED |
| `node tools/export-audit/legacy-fsrc.mjs` | — | 0 | every legacy Force setting computes exactly as before |
| `npm run fuzz` | — | 0 | seed 281662743: nothing was lost, 3 randomized boards |
| `npm run keys` | — | 0 | 0 FAIL, section W (the RCN / EEIC hold) included |
| `npm run hostile` | — | 0 | nothing a file can carry runs when the board draws it |
| `npm run panels` | — | 0 | every panel and menu opens, no escaped entity, no field clips its value |
| `npm run fileimport` | — | 0 | ALL CHECKS PASSED |
| `npm run dialogs` | — | 0 | every box takes, keeps and gives back the keyboard, and asks before typing is lost |
| `npm run standards` | — | 0 | conformance holds: 0 known findings, nothing new |
| `npm run savetarget` | — | 0 | all save-target checks passed |
| `npm run storagefull` | — | 0 | all storage-full checks passed |
