# The lead's own R1 cross-check: Brad's Variants A and B (not one of the received probes)

`r1-variants.mjs` is a synthetic whole-board jsdom check I wrote. It is **separate from the received probes**, and none
of its figures came from them. Its expected values are literal fixture arithmetic, taken from Brad's approved R1 semantics.

**The fixture:**
- **FY26:** plans $350M USAF and $150M ANG, $500M in all.
- **FY25:** plans $300M, USAF only.
- **Carryover:** one FY25 O&M row of $100M is carried to FY26 by the carryover (OBBBA) rule.
- **Variant A** also gives FY25 $40M of its own execution.

**Expected [total, executed, planned]:**

| Variant | FY25 | FY26 | Both years |
|---|---|---|---|
| B | [300M, 0, 300M] | [100M, 100M, 0] | [400M, 100M, 300M] |
| A | [40M, 40M, 0] | [100M, 100M, 0] | [140M, 140M, 0] |

In both variants, the raw execution history must stay unchanged.

**Base `9b27e80` (board `42e81118…`, the same as `1c94537`), run at 4:30 PM ET:** exit 1, 5 failing. Each failure is the R1 defect:

| Case | Got [total, executed, planned] |
|---|---|
| Variant B, FY25 | [0, 0, 0]: the FY25 plan is lost, because FY25 counts as "executed" by its raw workbook year |
| Variant B, FY26 | [600M, 100M, 500M]: the plan is counted as well as the carried execution |
| Variant B, both years | [600M, 100M, 500M] |
| Variant A, FY26 | [600M, 100M, 500M] |
| Variant A, both years | [640M, 140M, 500M] |

These cases passed: Variant A FY25 ($40M executed), and raw history unchanged in both variants. There were no script errors.

**How to run it:** `node r1-variants.mjs <copy root>`. The copy root needs the shim and `tools/`; `BOARD` is unset, so the
copy's own board is read.
