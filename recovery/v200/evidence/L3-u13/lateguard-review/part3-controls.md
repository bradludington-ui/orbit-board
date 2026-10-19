
## 3. Controls

### 3.1 No save under way: after/ behaves exactly as before/
`h/compare.py` compares each cell's normalized observation — returned value, change code, every protected and listed
field that changed, storage keys written, folder writes, lock writes, IndexedDB operations, board writers called, the
status text (digits and "N min ago" masked; a history copy's name and the header's "Saved h:mm" carry the clock and are
masked) and the landing.

| comparison | identical | differ |
|---|---|---|
| N, all branches × p1 p0 cn ac tk tkx (A1 vs B1) | **66** | 0 |
| N with the 📡 panel open, p1 p0 tk (X1) | **39** | 0 |
| N with Live view on, cn ac (X2) | **26** | 0 |
| WF / WS boundary cells (X4, X5; no save under way at the guard) | **8** | 0 |
| W modes, the call's part before its wait (no save yet), every cell's observation | same as below | landing only |

With no save, the expected writes happen on both boards alike: B06 records the base (`_driveBase`, `prio27om.base`);
B10 adopts REMOTE (`keepAside`, `applyStore`, `driveBaseSet(…, true)`, `persist`: MS, S, `.kept`, `.base`, `prio27om`,
`prio27bands_om` removed, `_baseDirty`); B08's tick (auto on) runs its own autosave (writes the copy and history).

### 3.2 A save under way: after/ and before/ differ in exactly the two guarded places

| mode | identical | differ | the differing cells |
|---|---|---|---|
| H1 (A1 vs B1) | 56 | 10 | B06 × 5 calls, B10 × 5 calls |
| H2 | 56 | 10 | B06 × 5, B10 × 5 |
| WR (A2 vs B2) | 45 | 10 | B06 × 5, B10 × 5 |
| WA | 45 | 10 | B06 × 5, B10 × 5 |
| H1/H2 with the 📡 panel open (X1) | 33 + 33 | 6 + 6 | B06 × 3, B10 × 3 each |
| H1 with Live view on (X2) | 20 | 6 | B02, B06, B10 × cn, ac (on before/: B06/B10 the Connect's own pull wrote; B02 its read failed and the un-awaited tick `liveStart` fired then adopted REMOTE) |

On before/ (`1375b72b`) those cells wrote **during the save**: B06 → `driveBaseSet` (`_driveBase`, `prio27om.base`); B10 →
`keepAside`, `applyStore`, `applyState`, `driveBaseSet`, `baseSet`, `persist` (MS, S, `_baseDirty`, `_keptMeta`,
`.kept`, `.base`, `prio27om`). Landing on before/: B10 — screen REMOTE, the folder's copy WORKING, all three dirty flags
clear and the record naming the folder's copy (U13's false-clean shape), WORKING in the kept slot; B06 held at the
save's read (H2/WR/WA) — the save then found the copy recorded and wrote WORKING over REMOTE without asking. On after/
the same cells change nothing and land as: B10 WORKING saved against its own copy; B06 at the read — "⛔ … Nothing was
written", WORKING unsaved (the (3c) behaviour).

### 3.3 Mutants: the guard moved to the very top
Text-only variants of after/ (`h/mkmut.py`, `mut/`):
- **M1** `00deacda…` — the late `if(_saveBusy){…}` block **moved** to right after `if(!driveStoreOn()) return false;`;
  the not-newer branch's `if(!_saveBusy)` kept.
- **M2** `31ffb6ea…` — entry only: the same, and the not-newer branch back to `if(!base) driveBaseSet(mySlug(), theirs);`.

| run | cells | writes during a save |
|---|---|---|
| M1, H1 + H2 (the save already under way when the refresh starts) | 132 | **none** — the entry check catches it |
| M1, WR (the save starts while the refresh waits at its read) | 55 | **B10 × p1 p0 cn ac tk**: `keepAside`, `applyStore`, `applyState`, `driveBaseSet`, `baseSet`, `persist` → MS, S, `_baseDirty`, `_keptMeta`, `prio27om`, `prio27om.base`, `prio27om.kept`, `prio27bands_om` |
| M1, WA (… at its first permission ask) | 55 | **B10 × p1 p0 cn ac** (tk: its first ask is `drivePoll`'s, before the pull's entry, so the entry check sees the save) |
| M2, WR | 55 | B10 × 5 as M1, **and B06 × 5**: `driveBaseSet` → `_driveBase`, `prio27om.base` |
| M2, WA | 55 | B10 × 4, B06 × 4 (not tk, as above) |

Landing (M1 WR B10 p1, `out/M1-top-W.jsonl`): screen REMOTE $650, the folder's copy WORKING $700, `DIRTY`/`_baseDirty`/
record all clean, the record naming the folder's copy, WORKING in the kept slot — the board says saved while it shows a
copy the folder does not hold. M2 WR B06: the save then wrote WORKING over REMOTE without asking ("✅ Saved"). After/
in the same cells: no write, correct landing. So the late position is what protects, for both guards.

## 4. Boundaries and observations (not refutations; for the record)
1. **A save that starts and finishes inside the refresh's wait is not "under way" at the guard** (by design: the guard
   reads `_saveBusy` at that instant). Measured both ways, identical on before/ and after/:
   - WF (X4) — held before the read: the refresh then reads the save's own copy; B10 loads nothing; B06 records the
     copy's time as the base with no save under way (as designed).
   - **WS (X5) — the read already in flight, its bytes taken before the save wrote:** B10 then **adopts the stale
     REMOTE** at the guard (`_saveBusy` 0): screen REMOTE, recorded against REMOTE's time, all flags clean; the folder
     holds the save's WORKING. Nothing is lost (WORKING is the folder's copy), and by code the next refresh finds the
     folder's copy (≤ what is on screen, ≠ the record) and says "⛔ … after the copy you are working from", and Save is refused with the choice
     — but until then a quiet refresh leaves "✅ Saved" on the line while REMOTE is on screen (a Connect says "⬇ Loaded"). Requires a read slower than a whole save. Pre-existing
     and outside this property; flagged for whoever owns U16/U17.
2. **Cross-tab saves (U20):** with Web Locks a save waiting for another tab's lock is not counted in `_saveBusy`; jsdom
   has no `navigator.locks`, so not measured. Such a save has not read or built anything yet.
3. **Quiet refreshes still speak** in the liveTooNew, clash, DIRTY and no-requirement-data returns (`setStat` without
   `if(!quiet)`), moving `_statN`; during an autosave started by a tick this keeps "Saved automatically" off (R08 rule).
   A message effect, unchanged by U13.
4. **`render()` is not write-free in principle** (section 1: one-time migrations and first-use keys reachable from it),
   but nothing the refresh does before its guard can trigger them; measured nil in every cell, panel open or not.
5. **The tick's heartbeat writes the lock file during a save** (K), before its pull — the same holder the save writes
   when it lands; not a copy. Pre-existing.
6. **Connect with no folder name** writes the Live view settings and the IndexedDB folder handle during a save, and never
   reaches the pull (X3). Choosing a folder; not a copy, base record or dirty flag.
