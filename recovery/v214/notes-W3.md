# v2.14 W3 — browser storage refused or full (item 141 F, G; item 140 c)

Builder W3, worktree `/home/user/orbit-wt/v214-w3`, branch `v214-w3`, from the slot commit
`ea412ca296e2d66b1bbbbc0780f336e8dd8d1691`. Contract §7 decides; map.md › storage-full and save-target (c).

## Reproduced on the slot commit (v2.13 behaviour), before any build

The map's probes (`recovery/v214/proto/storage-full-probe*.mjs`, `save-target-c-refused-import.mjs`), copied to the scratch
folder with their `boot.mjs` import pointed at this worktree, run with `BOARD=<slot board>` (the slot's board is
`git show ea412ca:prioritization-board-grid.html`). jsdom, a counted quota stand-in.

- **probe (A, B, B2, B3, W, G):**
  - A — an edit storage refuses: `_persistFail` true, `DIRTY` true, `DIAG.refused` **`[]`**, `memOnlyNow` undefined, Save
    diagnostics "Writes refused: none this session"; a cancelable `beforeunload` is **not** prevented.
  - B — `switchAppn('FULL FUND')` with that edit on screen only: **navigated** (the edit gone on reopen); `cycGoAppn('ff')`:
    **navigated** too.
  - B3 — room for `prio27appn` but not the edit: navigated, `prio27appn` written "FULL FUND".
  - B2 — a clean board, storage refusing `prio27appn`: **navigated**, the refusal **uncounted** (`DIAG.refused.length` 0).
  - W — writer key and editor name with storage refusing them: `writerKey()` differs call to call, `writerFp()` differs; the
    name asked **6 times** for 3 edits, stamped **"unknown"**.
  - G — Save diagnostics: only "Browser storage: 4 entries…" and "Writes refused"; no by-kind lines.
- **probe2 (item 140 c's shape):** a refused, fully put-back `lsAll` → `back:true` yet `unsavedNow()` **true**,
  `_lsRefused` names `prio27acedb`, `_sideGen` moved.
- **probe3 (two Saves, storage full):** the first writes ("Saved in place by unknown"); the second is **refused** "⛔ Not
  saved. unknown holds the pen for this board file"; `uiPenOther()` → **"unknown"** (this browser's own pen).
- **probe6:** `_sideBootGen`/`memOnlyNow` undefined (throws); Clear this computer's question reads the ordinary "UNSAVED
  CHANGES" text; after a downloaded copy, `switchAppn` **asks nothing** and navigates on Cancel and on OK; Save diagnostics
  has no "Storage by kind" block.
- **save-target-c-refused-import (item 140 c):** before the refused full import `DIRTY` false, "not saved to a file yet";
  after it `DIRTY` **true**, `_sideGen` 1→5, `_lsRefused` `['prio27acedb']`, save state **"Unsaved changes"**, and
  STAT_LOG holds an UNREAD "⚠ The cost estimates could not be kept in browser storage … Use 💾 Save to write it into the
  file" beside the "⛔ Nothing was imported" line.

The Chromium repros (`storage-full-hazards*.mjs`, `storage-full-switchloss.mjs`) are re-expressed in
`tools/storage-full.mjs` (sections A, B, B2, W), which fails on the slot board (see Checks).
