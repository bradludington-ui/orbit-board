# U17: proposal (not applied, not run)

This proposal comes from the U17 re-measurement in `README.md` (this directory). It is a draft for Brad to decide on.

- Nothing here was applied to `rec/L4/base`, to `/home/user/orbit-board` or to `/home/user/orbit-ui`.
- The diff text was produced on a scratch copy, `prop/prioritization-board-grid.proposed.html` (blob `f2e47609`). That copy was built by `prop/mkprop.py` from b63's board (`98eed7e8`). The scratch copy was **never booted, tested or run**.
- No mutation or test was written.

## P1. Refuse the three U24 loads while a save is under way

**Why.** On `63bd8b0`, U13's refusal closes every measured route to U17. Two other paths still put another copy on screen during a save without refusing it or counting it as a change:

- `adoptShared`, the "load the shared one" link;
- `sharedArrived`, the automatic load of the shared state file.

`bootTakeFile` ("open the file's version") does the same.

When the save lands, it records the copy it wrote and marks the board saved, while the screen shows the loaded copy. The next 💾 Save then writes the loaded copy over the save's copy without asking. These runs measured it, with no-save controls that stay consistent:

| run | mode | what happened |
|---|---|---|
| SHd, SHdk | folder | U17's state and its V3next |
| FSHd | file | U17's state, its V3next, and the false put-back question (V4) |
| FBT | file | the next Save wrote over the copy the held save had written, and **BRAD-2 ended in no copy the board can reach** |

This applies U13's own pattern to those three loads. The check is made immediately before anything changes: after the confirm in `bootTakeFile`, and before the kept slot is written in `adoptShared`.

**Exact diff** (`prop/proposal-P1.diff`, blob `60e00bee`, against `98eed7e8`):

```diff
--- a/prioritization-board-grid.html
+++ b/prioritization-board-grid.html
@@ -7026,6 +7026,12 @@
   if(!(PUB && (PUB.years||Array.isArray(PUB.order)))) return;
   if(!confirm('Open the saved file’s version and replace what is on screen?\n\n'
     +'This browser’s own work is NOT kept — only in a copy you saved yourself.')) return;
+  // PROPOSAL (U17 via U24, rec/L4/u17): NOT WHILE A SAVE IS UNDER WAY, as U13 refuses the folder's copy and U2 refuses
+  // ↶ Put back. A save that lands records the copy IT wrote as the one the work on screen came from and marks the board
+  // saved, while the screen shows the copy loaded here; the next 💾 Save then writes that over the save's copy unasked.
+  // Checked after the question, immediately before anything is changed.
+  if(_saveBusy){ setStat('⏳ The saved file’s version was <b>not opened</b>: a save was under way. Nothing was changed. '
+    +'Open it once the save has finished.'); render(); return; }
   if(applyStore(PUB)===false) return;
   LASTKNOWN=PUB_FILE_TS; _baseDirty=false; baseSet({file:LASTKNOWN, dirty:false});
   persist(); DIRTY=false; render();
@@ -8452,6 +8458,11 @@
 }
 function adoptShared(){
   if(!SHARED) return;
+  // PROPOSAL (U17 via U24, rec/L4/u17): NOT WHILE A SAVE IS UNDER WAY, as U13 refuses the folder's copy and U2 refuses
+  // ↶ Put back. A save that lands records the copy IT wrote as the one the work on screen came from and marks the board
+  // saved, while the screen shows the copy loaded here; the next 💾 Save then writes that over the save's copy unasked.
+  if(_saveBusy){ setStat('⏳ The shared state file was <b>not loaded</b>: a save was under way. Nothing was changed. '
+    +'<button type="button" class="nb lnk" onclick="adoptShared()">Load the shared one</button> once it has finished.'); render(); return; }
   if(!sharedKeepMine(SHARED)) return;
   // A refused load leaves the board untouched, so there is nothing to persist and nothing to
   // report as loaded. Saying so beats a status line claiming a load that did not happen.
@@ -31598,6 +31609,11 @@
     return;
   }
   if((st.ts||0)>=(MS.ts||0)){
+    // PROPOSAL (U17 via U24, rec/L4/u17): NOT WHILE A SAVE IS UNDER WAY, as U13 refuses the folder's copy and U2 refuses
+    // ↶ Put back. A save that lands records the copy IT wrote as the one the work on screen came from and marks the board
+    // saved, while the screen shows the copy loaded here; the next 💾 Save then writes that over the save's copy unasked.
+    if(_saveBusy){ setStat('⏳ The shared state file ('+esc(fmtTs(st.ts))+') was <b>not loaded</b>: a save was under way. '
+      +'Nothing was changed. <button type="button" class="nb lnk" onclick="adoptShared()">Load the shared one</button> once it has finished.'); return; }
     if(!sharedKeepMine(st)) return;
     if(applyStore(st)===false) return;
     persist(); render();
```

### Risk

- **Behaviour change.** Each of the three loads now refuses during a save, where it used to proceed. In `sharedArrived` the refusal leaves `SHARED` set and offers the link (`adoptShared`). That link is refused again only if a save is still under way.
- **The wording is not reviewed.** The words follow U13's and U2's refusals: past tense, "Nothing was changed", and still true once the save has landed.
- **The `sharedArrived` branch does not call `render()`.** Its other messages do not either, so the line is drawn at the next render. Check this on screen.
- **Not covered.** It does not cover the cases below, where no save is involved (see P2):
  - `sharedArrived`'s automatic load (SHaC);
  - `bootTakeFile` in folder mode (BTC).
- **Not covered.** It does not cover U20, a save waiting for another tab's lock. That save is not counted in `_saveBusy`, and L20 here shows it to be consistent anyway.
- **`importBoards` needs nothing.** It is already counted: `lsAll` → `lsSet` → `fileMark('board')`, measured in IB.

### Tests it would need

The tests would go in the `audit-import` U13 block, with the W1H folder and disk mocks. Expected values must be literal.

1. **Held folder save.** For each of `adoptShared` (with the kept slot occupied and with it empty), `sharedArrived` (automatic branch) and `bootTakeFile` (confirm answered OK):
   - **While the save is held:** the screen, `MS.ts`, `_saveGen`, `DIRTY`, the `.kept` slot, `baseGet()` and browser storage are byte-identical before and after the call, and the refusal words are on the status line.
   - **When the save lands:** the board is clean against the copy it wrote, and that copy is on screen.
2. **Held file save** (`disk()` held at `close`). The same three loads, with the same assertions, against `LASTKNOWN` / `baseGet().file`.
3. **Retry.** Once the save has landed, `adoptShared()` and `bootTakeFile()` load as they do today, with the same words, the same kept-aside behaviour and the same record. These are the SHdC / BTC / FSHdC / FBTC controls of this probe.
4. **The U17 consequences do not occur:**
   - after the landing, the next 💾 Save asks, or has nothing different to write;
   - in file mode, the copy the held save wrote (BRAD-2) is still in the file or the kept slot after the next Save.
   These are FBT's `reachY` and FSHd's V4 question.
5. **Mutations.** One per guard (`if(_saveBusy)` → `if(false)`), three in all. Each must be caught by test 1 or test 2.
6. **Sensitivity.** Run the full audit-import alone, as for U13.

## P2. A decision for Brad, with no code proposed: a falsely clean record with no save involved

Two loads leave the board recorded clean against a copy that does not hold what is on screen, **with no save under way**. This was measured identically on both boards:

| run | load | record clean against | screen |
|---|---|---|---|
| SHaC | `sharedArrived` automatic load (folder mode; the record was clean before) | BRAD-1 | SHARED |
| BTC | `bootTakeFile` in folder mode | BRAD-1 (it sets only `baseSet({file:…, dirty:false})`, and the folder base stays BRAD-1) | F1 |

In both, the next 💾 Save writes the screen copy over the folder head and asks nothing. Nothing is lost: BRAD-1 goes to the folder's history. In BTC, BRAD-2 was given up by the person's own confirm. A later refresh replaces F1 on screen with BRAD-1 silently (BTC K2).

The options, by code only:

| option | what it changes | risk |
|---|---|---|
| (a) | Count the load as a change: `_saveGen++; DIRTY=true; _baseDirty=true; baseSet({dirty:true})` | With Live autosave on, the loaded copy would then be written to the folder automatically. |
| (b) | Working out of the shared folder (`driveStoreOn()`): do not load the shared state file automatically, and only offer the link | The board's own comment says the folder replaced the sidecar. |
| (c) | In folder mode, make `bootTakeFile` clear this appropriation's folder base, so that Save asks | — |

None of these is drafted as code. Each would need its own controls, starting from SHaC and BTC in this probe.
