# R3's later timing window: bounded probe at `8f2266839c8c814f357dc565aa196a5cf64aaabb` (11 Oct 2026, 5:47–5:49 PM ET)

**Brad, 11 Oct:** "Keep R3's later timing window explicitly tracked. Use a bounded probe to check captured file
contents, unsaved subsequent changes and the resulting status message. Propose any additional behavior change
separately."

`r3-late-window.mjs` is a lead-written observation probe, not one of the received probes and not a committed test. It
records what happens and asserts nothing. It runs on a synthetic board in a git-archive copy of `8f22668`, with a
simulated folder handle, one run per command under a 600 s cap. Each run goes through these steps:
1. Save once, so the folder holds WORKING.
2. Edit to WORKING2. The `clean` variant skips this edit.
3. Start a folder save, and hold it **after it has built its bytes**, at one of its writes.
4. Put the locked cycle PB27 on screen (`cycView`) during the hold.
5. Let the save land.
6. Leave the view (`cycLeave`).
7. Edit to AFTER, then Save.

Five runs:
- the hold at the main copy's close, twice: the first run and the instrumented run;
- the hold at the history copy's close;
- the hold at the lock file's close;
- the `clean` variant at the main copy's close and at the history copy's close.

Every run exited 0, with no script errors. Writes, in order: history copy, main copy, lock file.

| What Brad asked to check | Observed in every run |
|---|---|
| Captured file contents | The folder's main copy holds the **working plan** whose bytes were built before the view opened: WORKING2, or WORKING in the clean runs. It never holds the locked plan, and the copy it replaced is kept in history. |
| Unsaved state during and after | In the view after the save lands: DIRTY false, `_baseDirty` false, record false. After leaving the view: working plan back, DIRTY, `_baseDirty` and record all false. That is correct, because the folder holds exactly that plan. **No stale "unsaved" flag was seen.** |
| Subsequent changes | An edit after leaving the view reads unsaved (DIRTY, `_baseDirty` and record all true). The folder is unchanged until the next Save, which writes AFTER and keeps the previous copy in history. |
| The status message | **"🔒 Not kept — PB27 is a locked view. ✅ Saved O&M FY27 to the shared folder — 5 KB. Everyone sees it on their next refresh."** It contradicts itself ("Not kept" … "Saved"), and it does not say that what was saved is the working plan rather than the locked view on screen. |

**What this corrects:**
- The R3 draft's note said that after leaving the view the board shows unsaved until the next Save. That was not
  reproduced at any of these hold points, on an edited board or on a clean one.
- R3's NEXT-VERSION limit is narrowed to what this probe shows.

**Proposed separately, not built:** see `PROPOSAL.md`.
