# Proposal for Brad: the status message when a folder save lands while a locked view is on screen (not built)

**What happens now:**
- A folder save that had already built its bytes when a locked cycle was put on screen writes the working plan, which
  is correct.
- The board then says "🔒 Not kept — PB27 is a locked view. ✅ Saved O&M FY27 to the shared folder". The "Not kept"
  prefix comes from `setStat`'s locked-view rule, and it reads as if the save was refused. The message does not say
  that the plan saved is the working plan, not the plan on screen.
- No data is affected. The folder copy, the history and the unsaved flags are all correct (see `README.md`).

**Proposed change (message only):**
- When `_driveStorePushRun` reaches its success message with `CYCVIEW` set, say what was saved and that the view is
  untouched. For example: "✅ Saved the working plan of O&M FY27 to the shared folder (its bytes were built before PB27
  was put on screen). PB27 is a locked view: nothing in it is saved."
- That message would not take the "🔒 Not kept" prefix.
- No change to what is written, to the flags, or to R3's earlier refusal.

**A test for it:** the probe's sequence as an audit-import block, asserting the folder content, the flags and the new
message text, plus a mutation that restores the old message.

**Related, also not built:**
- An in-place file save in the same window refuses, because `buildSavedHtml` refuses during a view. The R3 draft
  reported that its status then names the fallback, "Downloading a …". That was not re-checked here.

---

**Status at 6:00 PM ET:**
- **Item 1, the message:** approved by Brad and built in `af892cb`.

## Item 2, proposed and not built: the stale on-screen "unsaved" flag after leaving a locked view

**What happens:** a folder save lands while a locked view is on screen, and the board was unsaved when the save began.
After leaving the view, the screen reads unsaved (`DIRTY` true). Yet the folder and this browser's record (`_baseDirty`,
the stored record) hold the working plan as saved (see `CORRECTION.md`).

**Cause:** `cycView` stashes `DIRTY`, and `cycLeave` restores the stash. The save that landed cleared only the view's flag.

**Proposed:**
- When a folder save lands clean under a view, also clear the stashed flag: `if(CYCVIEW && clean && _cycStash)
  _cycStash.dirty=false;` next to the save's `DIRTY=false`.
- Test it with the probe's sequence, using the suite fixture.
- Add a mutation that removes the line.
- Effect: after leaving the view, the screen agrees with the folder and the record. Nothing written changes.
