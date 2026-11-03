# v2.14 W1 — Save writes only to its own file, and asks before writing over what it does not carry

Builder W1, worktree `/home/user/orbit-wt/v214-w1`, branch `v214-w1`, from the slot commit `ea412ca`. Scope: contract §5 (item
140 (a) and (b), the boot's record rules — case 3, the blank mark's flag and the stray rule — and item 141 D). This file is kept
current as the work goes; the stage-2 agent picks up from it.

## Reproduced on the slot commit (v2.13 behaviour), before building

`recovery/v214/proto/w1-repro.mjs` (jsdom, the repo's `boot.mjs` with S7's `url` and `idb`), run with `BOARD=<slot board>`
(`git show ea412ca:prioritization-board-grid.html`):

| Case | On the slot board |
|---|---|
| (a) X, a board at `…/old.html`, saves in place once; Y, the program at `…/new.html`, same browser (storage and handle store), presses 💾 Save | X stores its handle under `FNAME` (log `get FNAME`, `put FNAME`). Y reads `get FNAME`, gets X's file, and **writes over old.html with no window and no question** ("💾 Saved in place … "old.html" now carries this state"): dA.writes 1 → 2. |
| (b) A program page whose storage holds only the O&M plan; FH = a file holding O&M + Full Fund, a locked Full Fund cycle and a BAE row | Only the "No writer is recorded" question (answered OK); written: the file now holds `appns: ['om']`, no Full Fund, no BAE rows. **No question named what was lost.** |
| D: 💾 Save into the program's own text (pubState null) | "⚠ In-place save failed (Cannot read properties of null (reading 'writer')) — downloading a copy instead." 0 writes, 1 download. |
| case 3: the program page booted with `prio27om.base = {file:1700000000123, dirty:false}` and no plan | `LASTKNOWN === 1700000000123` (another file's save taken as its own); after `switchYear` the record is `{"file":1700000000123,"dirty":true}`. |
| stray: a blank program page's change (record `{"dirty":true}`), then an older board file in that browser | The blank plan opens over the file: `S.notes = {Z:'BLANK note'}`, nothing kept aside, `LASTKNOWN !== PUB_FILE_TS`. |

## What was built

(in progress)

## Decided in the build

(in progress)

## Checks

(in progress)

## Mutations

(in progress)

## For the integration

(in progress)

## npm script to add

- `"savetarget": "node tools/save-target.mjs"` (contract §11.2: in `verify:grid` after `pmosave`).

## Known gaps

(in progress)
