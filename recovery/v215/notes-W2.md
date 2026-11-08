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
- `_impOpen` (the import's own file) runs before all of it, as before.

### R1's same-ids case
Two boards built from one program, same appropriation, same requirement ids, different content. The packs differ as text, so the
rule above applies: the newer file's own list opens. For the other appropriations `pubsFor` takes storage's copy only where it is
newer than the file's (the plan's rule, and what that appropriation's own board opens), so see Known gaps.

## What was built
(filled in below as each part lands)

## Decided in the build

## Checks

## Mutations

## For the integration

## npm script to add

## Known gaps
