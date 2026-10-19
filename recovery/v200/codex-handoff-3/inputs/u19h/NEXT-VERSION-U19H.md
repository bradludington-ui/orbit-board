NEXT-VERSION.md -- the U19H entry, to go under v2.00 right after the U19 entry (the parent's, `rec/L6/u19/fr2/drafts/
NEXT-VERSION-U19.md`), in the style of the U13/U1/U14 entries. `<sha>` is the lead's.

```
- **U19H — after ↶ Put back and a reopen, the header says the restored work is unsaved** (Brad, 13 Oct, about 8:30 PM ET,
  on Codex's C2 memo: "a small separate fix"). After ↶ Put back (the work kept aside, K, put back over S1, which was saved
  into the board file), reopening the board before any Save showed "Saved <time> · ↶ work kept aside" in the top bar, and
  the time was K's own -- when K was last changed, which no file had. This browser's record said the work on screen was
  unsaved, the file still held S1, and the next opening and the next Save treated K as unsaved: only the header was wrong.
  It read DIRTY, which is this session's alone, and the side lists. Ordinary editing and a reopen before any Save did the
  same (ledger U15). Its tooltip began "Saved <time> by …" from the same time whenever the work was unsaved, before a
  reopen too. Now the header's state also reads this browser's record (`_baseDirty`): reopened before any Save, the work
  on screen reads unsaved. Work put back and not written since says so in the top bar: "Unsaved restored work — not written
  to the board file" ("… not written to the shared folder" while 💾 Save writes there). While the work is unsaved the
  tooltip says what is unsaved; that it is kept in this browser -- only while browser storage takes it; when storage
  refused a change it says "Browser storage refused a change: until 💾 Save writes it, it is on this page only." -- and,
  labelled apart, "Last file save: <time>": the last save the board file is known to hold (as it was opened, or a save of
  it that landed on this page). Words and what the header reads, nothing else: nothing is saved for this, the record is
  never made clean to match, and no kept copy or file is touched. "Saved <time>" is earned as before: once a save lands for
  the current changes (and, for the board file, for every list it carries) the board, the record and the header say
  saved. A clean opening with nothing restored says "Saved <time>", as before; a PMO copy's words are unchanged.
  - **What users may see:** after ↶ Put back, the top bar says "Unsaved restored work — not written to the board file
    · ↶ work kept aside" where it said "Unsaved changes", and after a reopen before any Save the same where it said "Saved
    <time>". It keeps saying so while a save of it is under way (the header has no "Saving …" state), after a save
    answered Cancel at its HOLD ON, refused (a read-only file, a refused folder save) or failed; a failed in-place save that
    downloads a copy instead says "downloaded — not on the shared file yet", as before. A save that lands with a change
    made while it wrote says "Unsaved changes": the file holds the work put back, not the change. The opening calls the
    work "restored" only when it was last changed before the put-back; changed after it, a reopen says "Unsaved changes".
    The board file's own save put back in its turn, unchanged, is that save: the top bar says "Unsaved changes", as before,
    and a reopen "Saved <time>". After ordinary editing, a reopen before any Save says "Unsaved changes" where it said
    "Saved <time>". While the work is unsaved the tooltip no longer begins "Saved <time> by …"; it says "The unsaved work
    is kept in this browser." (or that storage refused a change) and "Last file save: <time>." As before, a message on the
    status line replaces the tooltip until the top bar is next drawn.
  - **Test:** audit-import "v2.00 (U19H) — after ↶ Put back and a reopen, the header says the restored work is unsaved"
    (29 checks, 12 of them controls). Independently named copies with literal sentinel notes -- U19H-RESTORED-K (the work
    put back), U19H-OLDFILE-S1 (the board file's copy at the put-back), U19H-REPLACEMENT-N (the newer copy that displaced
    K) -- and a literal clock set on each page (2030), so every save's time is its own and the expected times are literals.
    It drives the page's own 💾 Save and ↶ work kept aside, and checks the top bar, its tooltip, 💾 Save's mark, this
    browser's record and the board file's bytes: (a) the board file, put back, reopened before any Save, then 💾 Save
    (HOLD ON, OK) and reopened again; (b) after the reopen, a Save answered Cancel, a Save refused (the file read-only),
    and a write that fails and downloads; (c) browser storage refusing the board at the put-back, then taking the next
    change; (d) a save that lands with a change made while it wrote, the header read during the write too; (e) CONTROL: a
    clean opening, a change saved and reopened with nothing restored; (f) ordinary editing reopened (the record's flag
    alone); (g) the shared folder: put back, reopened working out of the folder, 💾 Save refused, then Save yours over
    theirs; (h) the board file's own save put back in its turn; (i) the work put back changed before the reopen. 17
    checks fail on the board before (U19's, board `7a6e29cb`), none of them a control; all 29 pass after; all 12 controls
    pass on both.
  - **Existing expectations changed:** none. The blocks that read the header, unsavedNow() or the record around a save or
    a reopen pass unchanged (v1.89 item 23, v1.95 W1, v1.97 W2 and W3, v2.00 R3 to U13, U19).
  - **Mutations (13):** `v200-u19h-dirty-only` (the header reads DIRTY and the side lists only), `-time-as-status` (the
    work put back shown as "Saved <time>"), `-clean-on-reopen` (the opening makes the record clean to match), `-saved-
    after-failed` (a save refused read-only marks the board saved), `-boot-not-restored`, `-kept-despite-refusal`,
    `-last-save-ms-ts`, `-file-save-ts-stale`, `-saved-copy-not-written`, `-dest-file-only`, `-landing-keeps-words`,
    `-tooltip-saved` and `-putback-unmarked`; each caught by the block.
  - **Not covered:** the opening tells the work put back from other unsaved work by what browser storage holds (a copy
    kept aside at a put-back, newer than the work on screen's last change); nothing new is written to tell it. So after a
    put-back, an ⬅ Import of an older board without saving, and a reopen, the top bar would call the imported board
    "restored work" (it is unsaved and not in the board file, as said); read in the code, not run. After a put-back that
    keeps nothing in its place (working out of the shared folder, with the folder's own copy on screen), a reopen says
    "Unsaved changes", not "restored". A status message still replaces the tooltip until the top bar is next drawn (v1.90),
    so "Last file save" is in the tooltip whenever the top bar is drawn, not after every message. The header has no
    "Saving …" state and none was added. "Last file save" is the last save this page knows the board file holds: a save
    of the file from another browser after the opening is not known until the file is opened again or a Save reads it.
    Under the mixed-import hold (U3/U4), 💾 Save's tooltip still invites a Save the hold will refuse. A real browser
    (Chromium) was not run; the top bar's longer words were not measured for fit. If the hold track (U3/U4) lands too,
    its fix-round check that the tooltip still begins "Saved Jan 5 … by brad" after a stopped save, while the board is
    unsaved, has to read the board's stamp itself (`rec/L6/u19h/README.md` §10 gives the change).
```

Also, in the U19 entry (the parent's) "What users may see", the sentence

```
On a reopen the top bar says "Saved <time> · ↶ work kept aside" while the work on screen is unsaved by this browser's
record. That is the board's existing opening behaviour (U15 in the ledger), now reached on this route too.
```

is no longer true once U19H lands; replace it with

```
On a reopen before any Save the top bar says "Unsaved restored work — not written to the board file · ↶ work kept aside"
(U19H, below).
```
