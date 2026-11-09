# v2.15 review RV-C — item 139: the retag and the lock (findings C1–C5)

Fixer RV-C, branch `v215-rv-c` from `dbfc7c4`. Every finding was skeptic-confirmed; its repro is in the session scratchpad
(`rv1-c/r1–r3.mjs`) and reproduces on `dbfc7c4` and no longer on this branch.

## Changes (prioritization-board-grid.html, each commented `// v2.15 review RV-C (Cn)`)

- **C2 — the count is what OK writes.** `cycApplyAll`'s per-row decision before the question (skip / none / same / leave / other /
  set / later, the reads of the plan and its record) moved verbatim into `cycApplyPlanOf(key, rt)`, a read-only helper.
  `cycApplyAll` calls it and is otherwise unchanged; with no `opt` its behaviour is byte for byte the bar's (the v2.13 path).
  `cycRetagPlan` now finds the candidates (on the cycle being left and locked: `cand`) and `cycRetagCount(P)` puts them through
  `cycApplyPlanOf`: `move` = those it would write; `skip` (unsaved work behind a newer file, an unreadable plan) and `later` (the
  shared folder: moved on its own board) are counted apart. `cycRetagGo` hands the writer every candidate (`only: cand`), so the
  question still names each skip and each folder row. "Retag N of M": N is what OK writes, M the appropriations on the cycle.
- **C1 — no button that moves nothing.** `cycRetagLbl` returns '' when nothing would move; single-appropriation words only when
  exactly one moves and it is the only one on the cycle. `cycRetagWhy(P)` says why where the button would be ("Nothing to retag as
  BES28 yet — O&M has not locked PB27: lock it, then retag", "… has reopened PB27: lock it again, then retag", a skip's reason, the
  folder). `cycRetagOffer` draws one or the other. All four sites use it: after a lock, Locks by appropriation, PPBE cycles' "Retag
  as …" (still shown whenever `MS.cycle===MS.cycleRef`, now as the reason after a reopen) and the opening offer. v2.14's "move the
  board on screen anyway" is NOT restored; the context bar's "Put every appropriation on …" stays the way to move an unlocked board
  (and is still offered beside the reason).
- **Reopened is told apart from never locked.** `cycRetagCount` records each left row's state (`P.st`: 'open' / 'none');
  `cycRetagGo` passes it (`opt.st`) and writes the row reason accordingly; `cycLeftSay(L, from, html)` is the one sentence for the
  question's line, the result and the button's reason ("OPN has not locked PB27, and Initial Spares has reopened it: lock each on its
  own board, then retag.").
- **C3 — the lock is read again after the question.** With `rt.from`, each other appropriation still to be written has its cycle store
  read again (`cycStoreOf`, the reader its board opens with — storage, or the file's when newer); one whose `from` lock is no longer
  `locked` becomes a named leave (`st:'tab'`: "Full Fund had its PB27 lock reopened in another tab while the question was open: lock
  it again on its own board, then retag"). If that leaves nothing to write, "Nothing was changed" names it.
- **C4 — Lock's default.** `blBody` sets `blCyc`/`blYr` from `MS.cycle` when `blYr` is still unset and the tag is a cycle (else PB of
  the year on screen, as before). The refusal adds "Or choose BES28 above to lock the cycle the plan is on." (non-copy only; the
  retag-back route stays first).
- **C5 —** "lock it on its own board" (in `cycLeftSay`).

## Decisions
1. The board on screen alone left: "lock it, then retag" (no "on its own board"); another appropriation: "on its own board".
2. Folder rows are counted apart from N and named in the reason when nothing else moves ("… in the shared folder, is retagged on its
   own board").
3. C3 reads the lock for the other appropriations only: the board on screen's lock is in this page's memory and cannot change during
   the synchronous question.
4. The splice after the re-read now also drops leaves (`act==='skip' || act==='leave'`); with no `opt` there are no leaves, so the
   bar's path is unchanged.
5. `cycRetagLbl`'s branch for one moving appropriation that is not the board on screen ("Retag Full Fund as …") is defensive: every
   caller passes the board's own cycle, so it is not reachable today and has no mutation.

## Checks
audit-board "v2.15 review RV-C — a retag button only where something moves, its count what OK writes, and the lock’s default the
plan’s cycle (item 139)": C1 behind (Locks by appropriation, the opening offer), C1 reopened (PPBE cycles), C1 the question (reopened
vs never locked), C5, C2 unsaved (newer file + unsaved work), C2 shared folder, C3 (reopened in another tab; CONTROL: rewritten but
still locked moves), C4 (default, lock taken, the refusal's way out; CONTROL: untagged). On `dbfc7c4` the block fails 16 checks; every
CONTROL passes there. W1's item 139 block: two expectations moved, each with a `// v2.15 review RV-C` comment (Initial Spares reopened
is now told so).

## Mutations
13 new (`v215-rv-c-*`), 3 retargeted (`v215-w1-retag-moves-all-on`, `v215-w1-retag-own-only`, `v215-w1-retag-label-count`), none
retired. mcount: 3,772 entries, each matching once. `proved-RV-C.jsonl`: **16 of 16 CAUGHT** by a failed check, none by a throw.

Older expectation moved: audit-board "v2.05 — each appropriation is locked on its own board …" › opening. Its Initial Spares reopened
PB27, so item 139's retag moves nothing there; it now expects no button and "Nothing to retag as BES28 yet — Initial Spares has
reopened PB27: lock it again, then retag" (`// v2.15 review RV-C (C1)`).

## Results (this branch, every heavy run through recovery/v215/bin/heavy.sh)
- `npm run check`: all checks passed. mcount: 3,772 entries, each once.
- audit-board whole (8 GB): one failure, the v2.05 opening expectation above; moved, and that block re-run: ALL CHECKS PASSED.
- audit-import whole (8 GB): first run one failure in "v1.89 — the change journal … › 240 edits in one save" (pkgMineSince's
  same-millisecond cut, unrelated to the cycle code; the block alone passed); the whole suite re-run: ALL CHECKS PASSED.
- audit-other, audit-recon whole (8 GB): ALL CHECKS PASSED.
- Browser: keys pass, panels pass, layout only the carried D ×8.
- prove.py (JOBS=1): 16 of 16 CAUGHT.
