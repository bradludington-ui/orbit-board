# PROPOSAL from the U20 checker (not applied, not run): O4, record the folder's copy as the base only when it is on screen

**Status: a proposal only, for Brad to decide.** It is not part of U20, and it changes a deliberate v1.89 behaviour
("the folder's copy is taken as the base, as it always was"). Nothing in `/home/user/orbit-board` or `/home/user/orbit-ui`
was edited, staged, committed or pushed. `../base` and this directory's `b63/` are unchanged: both boards are still
`98eed7e8`, checked at 11:55 AM ET. No patched copy of the board was made. The diff was only checked with
`git apply --check`, which writes nothing.

## Why (measured by this check, on `98eed7e8`)

The builder reported O4 (`../u20/README.md`). Its trigger there was "a refresh that comes before the first Save". This check
found that O4 is wider than that, and that it undoes the U20 correction's protection.

1. **The Live timer alone triggers it, in one tab, with no lock and no button** (`x/u20x.mjs` O4-tick and O4-tickh; passes
   xc2 and xc3 are identical).
   - Tick 1's autosave is refused: "⛔ Alice saved O&M FY27 … after the copy you are working from. **Nothing was written.**
     Load theirs · Save yours over theirs".
   - The same tick's refresh then records the folder's copy F0 as the base.
   - Tick 2's autosave writes B-EDIT over F0 **without asking**, and says "✓ Saved to the shared folder automatically".
   - With a spaced history copy under ten minutes old (O4-tickh), F0 is kept only as `-recent`. One more Save prunes it, so
     **F0-BASE ends in no copy** this board can reach.
2. **"Nothing recorded" is not only a pre-v1.89 board.** It is a v2.00 board whose opening `driveAutoConnect` found no copy
   for this appropriation and year (first use of the folder), after which another machine saved first. The code comment
   assumes "a board last opened before v1.89".
3. **The U20 correction alone does not keep F0** (BR-Wrealtickcount). There, B's waiting save is counted by a harness wrapper
   that stands in for `../u20/PROPOSAL.md`.
   - B's Save is refused, as intended.
   - Tick 1's own refresh, which runs right after its refused autosave, then records F0.
   - The next Save writes over F0 unasked.

## The diff (exact text)

File: `proposal/O4-record-base-only-when-on-screen.diff`. It is against `63bd8b0:prioritization-board-grid.html`
(`98eed7e8`). `git apply --check` passes for it on its own, and together with `../u20/proposal/U20-count-waiting-save.diff`.

```diff
--- a/prioritization-board-grid.html
+++ b/prioritization-board-grid.html
@@ -26706,7 +26706,10 @@
     // v1.89) there is no telling, and the folder's copy is taken as the base, as it always was.
     // v2.00 (U13): BUT NOT WHILE A SAVE IS UNDER WAY. A save still to read the folder would find this copy recorded as the one
     // the work came from, and write over it without asking; a save past its read records the copy it writes, once it lands.
-    if(!base){ if(!_saveBusy) driveBaseSet(mySlug(), theirs); }
+    // PROPOSED (U20 check, O4): AND ONLY WHEN THAT COPY IS WHAT IS ON SCREEN (the same stamp). Taken as the base while the
+    // screen held later work, it let the next Save -- or the Live timer's autosave, one tick after it had said "Nothing was
+    // written" and offered the choice -- write over it without asking. Otherwise there is no telling, and Save asks.
+    if(!base){ if(!_saveBusy && theirs===ours) driveBaseSet(mySlug(), theirs); }
     else if(theirs!==base){ driveClashSay(j, false); render(); }
     return false;
   }
```

**Why the same stamp is enough.** `save()` stamps `MS.ts=Date.now()` on every change (L6772). So `theirs===ours` means that
what is on screen is that saved copy, with nothing changed since. The legacy case (a pre-v1.89 board showing exactly the
folder's copy) is still recorded. A screen with later work is no longer recorded, so the push's own rule ("With nothing
recorded there is no telling, so that asks too") decides, and Save asks.

## Risks

1. **More questions.** A board with nothing recorded and later work on screen now gets the ⛔ choice on every Save, and on
   every autosave tick, until Load theirs or Save yours over theirs is chosen. Today it writes over without asking. This is
   intended, but autosave users will see the refusal repeat once per tick.
2. **The wording is not exact here.** The ⛔ line says "after the copy you are working from", but nothing is recorded. The
   choice it offers is still correct. Rewording is a separate, optional edit.
3. **A clock-skewed folder copy stamped exactly at `MS.ts`** would be recorded, as today. A coincidence to the millisecond.
4. **The board's recorded source and the template or part hashes change**, as with any board edit. The usual refresh applies.
5. **It does not touch U20.** With only this diff, BR-W\* stop at the next refresh as well, because the refresh no longer
   records F0 while B-EDIT is on screen, so the waiting save refuses. That would also close U20's (ii-b) route **by code**
   (not measured). The U20 diff is still needed for U2's put back and U13's adoption refusal to see a waiting save.

## Tests it would need

1. **The O4 scenarios as a committed block**, with literals: tick 2's autosave refused, F0 still the folder's copy, and no
   `-recent` pruning of F0.
   - O4-tick and O4-tickh;
   - BR-C2a/C2ah (refresh then Save);
   - BR-C2b/C2bh (Save, then refresh, then Save);
   - BR-Wrealtickcount (the U20 diff together with this one).
2. **A legacy control.** Nothing recorded and the screen exactly the folder's copy (same stamp): the refresh records it,
   and Save writes without a question.
3. **The U13 block** (the base-record guard still does not record under `_saveBusy`) and the U2 block. Then the full
   `audit-import` and `audit-board`, each run alone, as Brad's process requires.
4. **Mutation entries:** `theirs===ours` removed (must be caught by O4-tick), and the condition inverted (must be caught by
   the legacy control).
