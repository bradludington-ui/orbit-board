# U9 and U10: bounded synthetic reproductions on the current tree (11 Oct 2026, 6:31–7:00 PM ET)

These runs establish what Brad's review record could not: that both findings hold on the current tree. They are checks
only: nothing was fixed, and no code change was proposed. The probes are synthetic jsdom runs on whole boards, each under a
600 s cap, run one at a time.

| Tree | Board blob | U9 (passed / failed) | U10 (passed / failed) |
|---|---|---|---|
| `main` `f9b4413` (**positive control**) | b160bc03… | 54 / 6, all 6 defect | 22 / 4, all 4 defect |
| WIP `e635775` | fd728f1c… | 54 / 6 | 22 / 4 |
| pinned `a91402b` (the same board as `af892cb`, `8e2dbe5` and `2b5b02b`) | 82c7f446… | 54 / 6, 0 control failures | 22 / 4, 0 control failures |
| **current head `4a6f7c7`** (run at 7:00 PM ET, in a gap of the audit-import driver) | 4d273c06… | 54 / 6, 0 control failures | 22 / 4, 0 control failures |

## U9

- **Expected:** MxS/AV/TSS $1/$1/$1 at $3, and $2/$3/$4 at $9. These are computed in the probe by BigInt largest remainder,
  with ties going to the lower index, the rule the CLIN source workbook's `clinSplit` → `apportion` applies.
- **The CLIN source workbook** (Spend Plan Source) agrees with the expected figures.
- **PMO parts, the forecast and the PMO Matrix export** give $0/$1/$2 and $1/$3/$5. Totals balance.
- **Controls:** $5, $7 and $100 pass on all four surfaces.
- **Cause, as located in code:** `pmoSharesOf` turns the CLIN weights into fractions by floating-point division (`v/tot[i]`).
  `apExact` reads 1/6, 2/6 and 3/6 as 6004799503160661 : 12009599006321322 : 18014398509481984 (scale 2^-55), which is
  not 1:2:3, so the exact tie is broken before the exact split runs.
- **Limits, from the verifier:**
  - It depends on the order the CLINs are listed in. Listed as 0008/0002/0010, all surfaces agree.
  - In the record's order, only amounts that are 3 more than a multiple of 6 disagree.
  - The Spend Plan Source prints PRIMES as its PMO column, so ownership there is inferred from the CLIN.
- **Extra consequence (the verifier):** at $3 the workbook has no "PMO MxS" tab.

## U10

- **The run:** after typing 77777 in the RCN field while viewing PB27, the status says the change was not kept. But
  RCN-EEIC by Month exports USAF $900 and ANG $200 under 77777 / AAAAA, with a title that includes PB27 LOCKED VIEW.
- **What stays intact:** the stored cycle, CYCDB and browser storage. The working codes are 99999/ZZZZZ after leaving the
  view, and viewing PB27 again reads 11111. The no-edit control exports 11111 / AAAAA.
- **The verifier's checks:**
  - Diffing all 11 sheets, the refused edit changes exactly 4 cells.
  - Opening the panel through the real Setup menu reproduces it the same way.
- **Cause, as located in code:** `rcnSet` writes `e.rcn` into the view's registry copy before `save()` refuses.
  `cycRefuse` → `cycReapply` restores only the year state.
- **Also seen, not asserted:** the Spend Plan Source in the same view prints 77777, and the redrawn field shows 77777
  beside the "not kept" status.

## Checks against Brad's record

Every figure, code, status text and control outcome matches. The assertion counts differ (54/6 and 22/4, against the
record's 29/5 and 44/9), because the probes were written independently and group their checks differently.

**Status:** reproduced on the current tree. **Unresolved, not fixed**, pending Brad's decision.
