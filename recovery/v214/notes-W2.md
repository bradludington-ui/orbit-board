# v2.14 W2 — a full import too big for browser storage goes into a new file (item 141 A, B, C, E; the room check; the `.base` records)

Builder W2, worktree `/home/user/orbit-wt/v214-w2`, branch `v214-w2`, from the slot commit `ea412ca`. The contract (§6) decides;
the map's `file-route` area is the design. Status at the top of each section says where the build stands.

## Reproduced on the slot commit (v2.13 behaviour), before building

Board: `git show ea412ca:prioritization-board-grid.html` (the slot is v2.13 plus inert seams).

- **Brad's alert, no file route** (`recovery/v214/proto/file-route-chromium.mjs`, paths pointed at this worktree, Chromium 153):
  a board built in 0.7 s (8,457,889 characters, a cost estimate padded past storage), imported into the program in 0.8 s:
  `alert: Nothing was imported from “ORBIT Live.html” — browser storage refused the cost estimates (QuotaExceededError).\n\nThis
  board is exactly as it was.` — Brad's exact text; storage byte-identical; `unsavedNow()` true after the refusal (item 140 c, W3's);
  **no "Write the imported board into a new file" offered — FAIL**.
- **E, the empty-board door** (`proto/file-route-shell-door.mjs`, jsdom): `IS_SHELL` true; Import one appropriation of a board
  holding O&M and Full Fund, storage refusing `prio27ff`: status `🧩 Loaded O&M, Full Fund — reopening…`, reloaded, `prio27om`
  stored, `prio27ff` absent — **the defect** (part of a board landed while saying it took all of it).
- **D** (same script; W1's, recorded only): Save into a remembered program file writes 0 times and downloads once ("💾 Saved —
  updated board downloaded…").
