# Correction to the first R3 later-window probe (11 Oct 2026, 6:00 PM ET)

**What the first five runs (5:47–5:49 PM ET) concluded, wrongly:** that "after leaving the view, the board read saved",
and that the R3 draft's "shows unsaved until the next Save" did not reproduce.

**Why it was wrong:**
- The probe connected the folder straight after boot.
- The board's opening timers then fired during the held save: the 0 ms timer that clears `DIRTY`, and the 60 ms folder
  auto-connect. They cleared the unsaved flag before the locked view was put on screen, as the `atHold` state in those
  logs shows (DIRTY false).
- The new audit-import block (suite fixture) then showed the stale flag.

**The rerun, at 6:00 PM ET** (`*-edited-wait80-*.log`): the probe now waits 80 ms after boot so those timers run first, as
the suite's R5 fixture does. With the hold at the main copy's close and at the history copy's close:

| Stage | note | DIRTY | `_baseDirty` | record |
|---|---|---|---|---|
| before the held save | WORKING2 | true | true | true |
| in the view (the save held) | LOCKED | true | true | true |
| the save landed, still in the view | LOCKED | false | false | false |
| **after leaving the view** | WORKING2 | **true** | false | false |

The folder holds WORKING2, history kept the copy it replaced, and a later edit and the next Save behave correctly.

**Finding:**
- After leaving the view, **the screen reads unsaved although the folder and this browser's record hold the working plan
  as saved.** `cycView` keeps `DIRTY` as it was when the view opened, and `cycLeave` puts it back. The save that landed
  meanwhile cleared only the view's flag.
- Only the screen flag is stale. The next Save writes the same plan again.
- This is **tracked, and a fix is proposed to Brad separately (`PROPOSAL.md`, item 2). It is not built.**

**What still holds from the first runs:** the folder contents, the history, the subsequent-change behaviour, and the
contradictory status line. The status line was fixed by `af892cb`, which Brad approved.
