# PROPOSAL (not applied, not run): U20, count a save from the moment it asks for the lock

**Status: a proposal only.** Nothing in `/home/user/orbit-board` or `/home/user/orbit-ui` was edited, staged,
committed or pushed. `../base` and `b63/` are unchanged: `b63`'s board is still `98eed7e8`.

The diff below was made on a copy kept only for this purpose: `proposal/patched-copy-NEVER-RUN/` (blob `b00af156…`).
That copy was never booted, tested or run. The patched behaviour described here was worked out by reading the code, and
was **not measured**. Brad decides whether this goes any further.

## The diff (exact text)

File: `proposal/U20-count-waiting-save.diff`, blob `b3a5ff25de60426031c5c00efb5d822b79e04ed6`. It is against
`63bd8b0:prioritization-board-grid.html` (`98eed7e8`).

```diff
--- a/prioritization-board-grid.html
+++ b/prioritization-board-grid.html
@@ -6490,11 +6490,18 @@
 //   wait captures its own target and bytes when it starts, and re-reads everything it checks.
 let _saveGen=0, _saveChain=Promise.resolve(), _saveBusy=0;
 function saveSerial(fn){
-  const go=function(){ _saveBusy++; return Promise.resolve().then(fn).finally(function(){ _saveBusy--; }); };
+  const go=function(){ return Promise.resolve().then(fn); };
+  // v2.00 (U20): COUNTED FROM THE MOMENT IT ASKS FOR THE LOCK, not from the moment it gets it. A save waiting for another
+  // tab's save (Web Locks) was not counted, so ↶ Put back (U2) and the folder's refresh (U13) took it for no save at all: a
+  // refresh then recorded the folder's copy as the one the work came from, and the waiting save wrote over that copy
+  // without asking. It is under way from here until its lock is released, as a save waiting in this tab's own queue is.
   const run=function(){
+    _saveBusy++;
+    let p=null;
     try{ if(typeof navigator!=='undefined' && navigator.locks && typeof navigator.locks.request==='function')
-      return navigator.locks.request('orbit-save', {mode:'exclusive'}, go); }catch(e){}
-    return go();
+      p=navigator.locks.request('orbit-save', {mode:'exclusive'}, go); }catch(e){ p=null; }
+    if(!p) p=go();
+    return Promise.resolve(p).finally(function(){ _saveBusy--; });
   };
   if(_saveBusy){ try{ setStat('⏳ A save is already under way — this one runs as soon as it finishes.'); }catch(e){} }
   const p=_saveChain.then(run, run);
```

## What it changes, by code (not run)

- **Today:** `_saveBusy` goes up only when Web Locks calls back with the lock. **With the diff:** it goes up when this tab's
  queue reaches the save and it asks for the lock. It comes back down once that lock request settles, which is after the
  lock is released.
- **What sees it:** `keptPutBack` (U2) and both of U13's guards in `driveStorePull` would then see a save that is waiting for
  another tab:
  - the base-record guard (`if(!base){ if(!_saveBusy) driveBaseSet(...) }`);
  - the late adoption refusal (`if(_saveBusy){ … not loaded … }`).
- **Expected effect on this probe's trigger scenarios (by code, not measured).** Each W scenario should then behave like its
  counted control, C1, which was measured:

  | scenario | measured on `98eed7e8` | expected with the diff (= the C1 measurement) |
  |---|---|---|
  | PB-W, PB-Wtick | ↶ Put back goes ahead. The waiting save then refuses and offers the choice. Nothing is lost. | ↶ Put back is refused ("Not put back: a save was under way"). S1's save then lands, and K stays kept aside. |
  | AD-W, AD-Wtick | The refresh adopts N2 and keeps WORKING aside. The Save that was asked for WORKING writes N2 and says "✅ Saved". | The refresh is refused ("was not loaded"). The save then refuses and offers the choice, with WORKING still on screen. |
  | BR-W, -Wtick, -Wperm | B-EDIT is written over F0 without asking. F0 goes to history. | The base is not recorded. The save refuses and offers the choice ("Nothing was written"). |
  | BR-Wh, -Wpermh | As above. Then the next Save prunes F0, which was kept only as a `-recent` copy, so F0 ends in no copy. | As above: nothing is written, and F0 stays the folder's copy. |
  | PF-W | ↶ Put back goes ahead. The file save asks HOLD ON. | ↶ Put back is refused. S1's file save lands. |

- **A second save asked in B** while B waits would now get the existing "⏳ A save is already under way" notice.
- **The first waiting save still says nothing.** That is P3 observation O1 in `README.md`, and this diff does not change it.

## What it does NOT fix

- **A refresh with nothing recorded, before a Save, in a single tab with no lock** (`BR-C2a`, `BR-C2ah`; also the second
  Save in `BR-C2b`/`BR-C2bh`). The refresh records the folder's copy as the base, and the next Save writes over it without
  asking. With a history copy less than ten minutes old, the copy that was written over is pruned by the save after that.
  - This is the v1.89 path ("taken as the base, as it always was").
  - U13 deliberately kept it for saves that are not under way.
  - It is outside U20 and needs its own decision. It is reported in README.md as observation O4. **No correction is proposed
    here.**
- **B gives no sign while its Save waits for another tab** (P3 observation O1).

## Risks

1. **A lock that is never released.** If the other tab's save hangs (for example, a network share that has stalled), this
   tab keeps counting its waiting save. Until the other save finishes, or that tab is closed (a browser releases a closed
   tab's locks), this tab:
   - refuses ↶ Put back;
   - loads nothing from the folder;
   - records no base.

   That errs on the safe side and loses nothing. But the refusal messages say "a save was under way", while the save is only
   waiting. A wording change ("a save was under way, or waiting for another tab") would be a separate, optional edit.
2. **Timing.** `_saveBusy` now goes back down a few microtasks later than it used to (after the release, not when `fn`
   settles). A put back or refresh landing in that gap is refused, and the next one goes ahead. That is harmless.
3. **The path without Web Locks behaves the same** (count up, run, count down). However, **the existing jsdom suites only
   exercise that path**, because jsdom has no `navigator.locks`. On their own they cannot catch a regression in the Web Locks
   path, so a test that uses the lock mock is needed (below).
4. **A lock request that rejects, rather than throws, still fails the save, as it does today.** The `finally` puts the count
   back.
5. **The board's recorded source and any template or part hashes change**, as with any edit to the board. The project's usual
   refresh applies.

## Tests it would need

1. **A committed U20 block** (audit-import or a new suite) built from this probe:
   - the shared lock mock (`locks-mock.mjs`), two tabs sharing one storage area, and the tagged folder mock;
   - PB-W, AD-W, BR-W, BR-Wperm and BR-Wh, with hand-written literals for the counted behaviour;
   - the controls C1, C2a and C2b, and the mock's own tests (`locktest.mjs`, 19 checks).

   It must fail on `98eed7e8` (measured here: 9 U20 checks fail, all in BR) and pass on the patched board.
2. **The existing U2 block** (block 2, 41 checks) and **the U13 block**, focused first, then the full `audit-import` and
   `audit-board`, each run alone, as Brad's process requires.
3. **`saveSerial` invariants**, each with `_saveBusy` back at 0 afterwards:
   - a save that throws;
   - a lock request that rejects;
   - the path with no Web Locks;
   - two saves queued in one tab;
   - autosave, Save, Load theirs, Save yours over theirs and ✍ Take the pen, each still one at a time.
4. **Mutation entries:**
   - `_saveBusy++` moved back into the callback (today's form) must be caught by the U20 block;
   - the `finally` decrement removed must be caught by a check that ↶ Put back works once the save has ended.
5. **A Chromium run with real Web Locks**, as in `chromium-locks.mjs` part 2: B's `_saveBusy` must be 1 while it waits, and
   ↶ Put back must be refused there. Part 2 passed 9/9 on `98eed7e8` (premise and controls). With the diff, check P1's put
   back expects `refused: true`.
