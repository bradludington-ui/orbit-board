# U24 check: proposal notes (NOT applied; no product diff)

This check proposes **no new product change**. Nothing here was applied to any board. It amends the **tests and stated effects**
of the builder's proposals in `rec/L4/u24/PROPOSAL.md` (P1 to P4, whose diffs I did not run), using what this check measured.

## A1. P1 (refuse U24's paths while a save is under way): add to its tests
- **Exact diff:** none beyond the builder's `proposal/P1.diff` (`8adfbcbd`).
- **More cases P1 must refuse, then hold K1-K3 and REACH once the save lands:**
  - **SHc-fold-Whist:** the folder save held at the close of its history copy. On the base, it is falsely clean like SHc-fold-W.
  - **SHa-fold-Wlate:** a state file stamped at real time after the save began. On the base, it is falsely clean and persistent,
    with no clock skew needed.
  - **SHc-fold-Wauto:** the link clicked while Live view's autosave is writing. On the base, the board is falsely clean until the
    same tick's refresh, which then quietly puts BRAD-2 back under a "Shared state loaded" line.
- **Controls P1 must leave unchanged: SHc-fold-Wedit and SHc-file-Wedit.** An ordinary edit during a held save stays counted and
  unsaved at the end. This shows the test harness's hold does not itself mask or create the effect.
- **More behaviour changes than the PROPOSAL lists:**
  - SHc-fold-Wread and SHc-file-Wread (the link clicked while the save is still reading) are consistent on the base today. Under P1
    they become refusals.
  - The PROPOSAL names only SHa-file-Wread. Its tests should state these two as well.
- **The REACH leaves should include CAROL-F for BT-file-W**, at the reopen and after one edit.
  - On the base, CAROL-F is then only in the file's version history (x1).
  - The counterfactual BT-file-Wcf shows the cause. An honest record makes the same reopen hold the file back, and CAROL-F stays.
  - Under P1 the click is refused, so CAROL-F is never put on screen during the save. The test should assert that, and that
    nothing the person chose is silently dropped at the reopen.
- **Risk:** none beyond the builder's list. These are tests, not code.

## A2. P3 (`importBoards` marks this browser's record): add to its tests
- **Exact diff:** none beyond the builder's `proposal/P3.diff` (`6b268336`).
- **IB-fold-C1oldclean and IB-fold-C3clean** must keep IMPORT reachable at the reopen. Today, with no save during the import
  (measured here), the reopen loads the folder copy and keeps nothing aside, leaving IMPORT in no board copy.
  - C1oldclean: the imported board is older than the folder copy, with no save at all.
  - C3clean: a save landed before the import.
- **Severity context for O2 (Brad's decision):** the board has no unsaved-changes prompt on closing. `beforeunload` only releases
  the Live lock (L12688-12696). So importing an older board file, closing and reopening drops the import silently.
- **Risk:** as the builder states (the kept slot can be occupied, and the opening then refuses).

## A3. Not addressed by P1–P4 (for the ledger, no proposal)
- **The autosave route's status line.** In SHc-fold-Wauto, "Shared state loaded (published …)" stays on screen after the same
  tick's refresh has put BRAD-2 back. P1's refusal removes the path that leads there. Without P1, the line is false.
- **Path A's deployment condition.** It is reachable only when the page is served over http(s), or on `file://` with
  `localStorage.spmtSidecar==='1'`. That is a severity input, not a code change.
