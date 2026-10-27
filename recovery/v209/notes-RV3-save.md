# v2.09 third review — the boot's opening rule, once more (fixer RV3-save)

One regression the second review's save fix introduced, found by the third independent review of v2.09 (the board read at
`d3ce17d`) and confirmed by its skeptic: `open-to-look-now-rewrites-what-your-own-file-opens` (should-fix, introduced by the fix).
Branch `v209-rv3-save`, on `d3ce17d`. Brad's decision of 27 Oct is binding: fix only the regressions the last fixes introduced,
keep the fix small and safe, and hold the rest for v2.10 -- so `two-tabs-unsaved-work-recorded-clean` (a blocker, older than
v2.09) is held, and this fix is checked not to make it worse than `ba3c294`.

## What was wrong

The second review's fix (`shared-key-second-open-replaces-unsaved-work`, notes-RV2-save.md) made the boot's `fileTs > ours`
branch write the file it had just opened into browser storage before recording the board clean. It did so on every opening where
storage held this board's copy -- including where nothing was kept aside, because storage held no unsaved work. So a newer file
opened only to look at it replaced this browser's copy, which was a save already in a file, and the person's own older file opened
next showed that other save (the newer of the two opens, v1.89):
- the board: Brad's file opened the lead's draft, its line said it was another save, and 💾 Save asked a HOLD ON naming Brad
  himself, whose OK wrote the lead's draft over his file (his own change then in no copy);
- a copy: Ann's own AV file (and the copy as published) opened on PSM's work under PSM, and ✉ Submit sent PSM's package under her
  name with no question -- against Brad's item 127 rule that reopening adopts the office the file was saved for;
- the kept slot: the way out the line offered (open the file's version) kept the other office's saved work aside, and her next
  opening of a newer file over unsaved work was then refused as occupied;
- the rollout: a v2.09 file opened once made the v2.08 file open on the v2.09 save, under v2.08's "has changes made since it was
  last saved".
On `ba3c294` and on v2.08 each of these reopenings shows the file's own work.

## The fix (one rule, one place: §13, the boot's `fileTs > ours` branch)

**The boot writes browser storage at that opening only where it has just kept this browser's unsaved work aside** (`own`, and
the copy in storage the board took up, `_bootOwnRead`, as before). That is the case the second review's blocker needs -- storage
still held the work just kept aside under a record about to say "clean" -- and there the write, the refusal on a full browser and
the guard for a copy the board could not take up are unchanged. Where nothing was kept aside, storage holds a save and no unsaved
work, so it is left exactly as it is, as v2.08 left it, and the record is set as v2.08 set it: clean, from the file now on screen
(`held=!_bootOwn || (!own && _bootOwnRead)`). Two lines change; the comment above them says why.

**Why the record is still set where nothing was written** (and not left naming the save storage holds, as the review's own fix
proposed). The page on screen is the newer file's work, with `LASTKNOWN` naming it. Left naming the older save, the record would
mislead the first time the page writes storage: Brad types on the lead's draft (storage now holds it, the record "dirty, from
Brad's file"), reopens his own file -- this browser's copy is newer, so it opens, with `LASTKNOWN` read from the record as his own
file -- and 💾 Save writes the lead's draft over his file without a question. Leaving the record would need `save()`,
`loadCounted()` and every `persist()` writer to carry the page's own checkpoint into it (the reviewer's and the two-tabs skeptic's
"the record follows the page" rule), which is the two-tabs finding's fix, held for v2.10. Set as v2.08 set it, the record makes
that Save ask (HOLD ON), and the mutation `v209-rv3-save-look-record-left` proves the check sees the difference.

## What it does now (`d3ce17d` / this fix / `ba3c294`)

Measured with the reviewer's and skeptic's own scripts (copies pointed at this board: `scratchpad/v209/rv3-save-work/sk-*.mjs`, and
the reviewer's `rev3/save/t/*.mjs` with `WHICH=<board path>`):
- **k.mjs board**: storage changed by the look -- true / false / false; Brad's file reopened -- the lead's draft, HOLD ON on Save,
  his C lost / his own work, Save asks nothing, his C kept / the same as this fix.
- **k.mjs copy** and **s1**: av.html reopened -- PSM, Submit sends PSM's package with Pat's edit / AV, Submit sends AV's with her
  edit / the same as this fix. **s1c** (the copy as published): PSM / AV / AV. **TAKE**: the kept slot holds Pat's work, then a
  newer file over unsaved work is refused / the kept slot empty, the same as `ba3c294`.
- **k2.mjs** (rollout): the v2.08 file opens on Kim's v2.09 save under "has changes made since" / on Brad's own v2.08 work,
  "Opened with the saved board state" / the same.
- **s4** and **s1b**: his own file, LASTKNOWN his file; ⬅ Import of it changes nothing / kept slot empty, the newer PSM file then
  opens and keeps the unsaved edit aside.
- **The second review's finding stays fixed** (`rev2/save/s9-shared-key-loss.mjs`): identical to `d3ce17d` -- the newer file over
  unsaved work keeps it aside and storage holds what is on screen, so the next opening never reads that work as saved.

## The two-tabs finding, held (`two-tabs-unsaved-work-recorded-clean`)

Not fixed here, by Brad's decision. What it does on each board, from the skeptic's three scripts (`sk-k1-chromium.mjs` in real
Chromium, `sk-k2-jsdom.mjs`, `sk-k3-copy.mjs`):
- **`d3ce17d`**: at the last opening the work typed in tab 1 after tab 2's opening (ANN-2) is gone from the screen AND from storage
  at once -- no key holds it (the second review's write wiped it).
- **`ba3c294`**: gone from the screen; still in storage (`prio27om`, or the copy's `prio27om-pmo…`) until the first edit or year
  switch, after which no key holds it.
- **This fix**: the same as `ba3c294`, at every step of all three scripts -- the last opening keeps nothing aside (the record says
  clean), writes nothing, and ANN-2 stays in storage until the first edit; the earlier opening in tab 2 (which did keep ANN-1
  aside) writes storage, as on `d3ce17d`, and tab 1's next change writes over that anyway, so step [c] is the same on all three.
  Variant B (reopening the unchanged Kim-1 file: no HOLD ON) is the same on all three boards.
So the fix brings the two-tabs finding back to where `ba3c294` and v2.08 leave it -- not worse -- and the finding is v2.10's.

## Checks

- **audit-import**, W3 slot, one new block, *"v2.09 third review — a newer file opened only to look leaves browser storage as it
  was: this browser’s own file opens on its own work (the board and a copy)"*. On `d3ce17d` (`BOARD=…/board-d3ce17d.html`) 9
  checks fail: storage changed by the look (board and copy); his own file opens the lead's draft, is said to be another save, and
  Save asks a HOLD ON and writes the lead's draft over his file; her own file and the copy as published open PSM's work under PSM
  and Submit sends PSM's package (two each). All pass on the fix. Its CONTROLs: the setup; nothing kept aside on a look; looked at,
  then typed on, his file opens this browser's copy and Save asks before writing it over his file, declined writing nothing (a
  CONTROL on `d3ce17d`, compared byte for byte so an earlier step cannot make it fail there; it is what catches
  `v209-rv3-save-look-record-left`); and the newer opening over unsaved work still keeping it aside with storage holding what is
  on screen (the second review's fix stands).
- **tools/pmo-save.mjs** (Chromium), new section **K**: in one real browser holding no unsaved work, PSM's newer file opened to
  look leaves browser storage byte for byte; ATL's own file and the copy as published then open on Ann's work under ATL and ✉ Submit
  sends ATL's package. 5 checks fail on `d3ce17d` (`--board`); all pass on the fix, with A–J.
- No existing check changed.

## Mutations

2 new (`v209-rv3-save-look-writes-storage`: storage written on every opening again; `v209-rv3-save-look-record-left`: the record
left naming the older save) and 2 retargeted in place (`v209-rv2-save-boot-no-write`, `v209-rv2-save-boot-writes-unread`: the
write now reads `if(own && _bootOwnRead)`; the same defects). Proved CAUGHT with every existing mutation whose find sits in the
boot's opening branch (`v209-rv2-save-boot-refused-clean`, `-refused-file-recorded`, `-refused-kept-left`, `v209-w3-adopt-skipped`,
v1.89's `boot-no-keep-aside`), their caughtBy reused: 9 in all, every one CAUGHT, none by a throw
(`recovery/v209/proofs-RV3-save.json`, `recovery/v209/proved-RV3-save.jsonl`). mcount: 2,644 of 2,644 targets match once.

## Proved with (27 Oct 2026)

- `npm run check`; mcount 2,644/2,644.
- Whole: audit-board, audit-other, audit.mjs, audit-hostile, audit-inject, audit-ui -- all pass, on the final tree.
- audit-import, every block (153 scenarios, the new one included), in four slimmed chunks each carrying the V185W/V186L/V14
  writers -- all pass, on the final tree.
- audit-recon, the blocks that reopen a board over browser storage or that the second review ran (W7 F1 ×2, U10 ×2, U32/U33, U37,
  U44, W4) -- at an 8 GB heap, on the final tree.
- Browser: pmosave (K new; 5 checks fail on `d3ce17d`; A–K pass), pmoyears -- pass.
- The round-trip fuzz (seed 52597600): nothing lost. `verify-file --selftest`: passed.
- The reviewers' and skeptics' repros, as above.

## Known gaps

- **Held for v2.10 with the two-tabs finding:** the record follows the page only the v2.08 way, so after a look the record names the
  newer file while storage still holds the older save. The copy as published, reopened after a look at another office's file, then
  asks a HOLD ON before its Save writes the office's own file ("not the save the copy you are working from came from") although the
  work on screen is that file's: a question too many, never a loss (`ba3c294` asks it too; `rev3/save/t/s1c` [3]). The fix for both
  is one rule -- whenever a page writes its own state into storage, the record describes that page's state -- in `save()`,
  `loadCounted()` and `persist()`.
- Everything in notes-RV2-save.md's known gaps stands; the shared plan key's consequence there ("after a newer file, the older one
  shows the newer save") is now only so where the opening kept unsaved work aside.
