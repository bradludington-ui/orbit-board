BATCH C2  |  base 7ee498a  |  started 1:33 PM ET / finished 7:45:54 PM ET, 13 Oct 2026

Input pin: `3e38ac8323fa984fe0612fd00475f07c0495219c` on `claude/v200-fixes-wip`. Exact base: `7ee498a46507972f803cd48ce9f27d5d668acb63`, board blob `fce8a391bd8a248d5185e199d22190c1687eaea0`. Initial drafting and source receipts were saved before the pause; finalization resumed at 7:43 PM ET. The intervening elapsed time is not execution time. No draft snapshot is used by C2.

FINDINGS:

Four decision memos are complete. They distinguish source inspection and supplied findings from fresh runtime evidence. No new defect was reproduced for C2.

- [U9 — office money](U9-office-money.md): recommend one canonical funded CLIN attribution, by service/lane/award, rolled up to office. Current Source's PMO column is requirement home; it cannot simply be summed as CLIN ownership. A literal policy example—requirement ask $2, equally weighted CLIN owners, discretionary $1 and mandatory $1—can give funded office $2/$0 rather than capacity-first $1/$1. That tradeoff needs explicit approval and truthful above-ask/variance labels; no hidden negative unfunded, clamping or changed entered asks. The previously verified $3 → $1/$1/$1 and $9 → $2/$3/$4 arithmetic is distinct from this policy.
- [U19 — reopen header](U19-reopen-header.md): recommend current unsaved/restored state as the primary status, with last confirmed file save as a separately labelled timestamp. No automatic write or clean flag is justified by a presentation correction. The underlying displaced-copy loss remains open.
- [U28 — font validation](U28-font-validation.md): recommend a documented host-alias bypass with every checker and `tools/font-standin.mjs` unchanged. Retain the substituted lane's failures; record actual font/browser/configuration for the corrected lane. The reported 14.6% is not freshly measured here, and a Linux fallback does not prove native Windows rendering.
- [U32/U33 — locked registries](U32-U33-locked-registry.md): recommend immutable originals, refusal of invalid partial handovers, and truthful preservation of a whole own-board recovery import. A future corrected revision must be visibly new and traceable. Defer that feature for this release unless needed for recovery; never silently edit the locked historical object. The $900 USAF / $200 ANG literals are supplied expectations, not a C2 export result.

The [independent policy review](review/independent-policy-review.md) is preserved with its source-only scope, and the [author response](review/author-response.md) records final clarifications.

PROPOSAL:

No code or unified product diff. C2 is four policy memos only. No product file, catalog, stored state, board copy, source branch or ledger was changed by this batch.

RUNS:

| Command / activity | Exit | Time taken | Result |
|---|---:|---:|---|
| `timeout 30 python3 -I C2/logs/verify_source_identities.py` (from the task root) | 0 | 0.007946 s | 4/4 pinned input/base blob identities match; one unchanged font-stand-in contract inspected as text; 0 fresh application tests |
| Original four-file identity receipt, 1:35:39 PM ET | 0 | 0.008218 s | 4 file receipts preserved; original literal command was not stored, so this is metadata rather than an additional claimed runtime check |
| Manual source/policy inspection, including independent review | N/A | No duration claimed | `pmoPartsOf`, `srcRowsOf`, Put back/dirty generation, save header, cycle lock/view, supplied U9/U19/U28/U32/U33/U43 and decision questions inspected |

Receipts: [final source identities](logs/final-source-receipts.json.txt), [initial receipt](logs/source-receipts.json.txt). Pinned source texts are archived in [logs/source-inputs/](logs/source-inputs/). Their source pin is the input commit above. No suite, `mcount`, mutation run, browser or export was needed or run for C2; `mutate.mjs` was neither imported nor executed.

NOT DONE / LIMITS:

No fresh application runtime, XLSX/PPTX, saved-file, font measurement, native-browser, full suite or gate validation. B2 has its own report and result; nothing from B2 is implied here. No findings are closed and no release readiness is asserted. U43 completeness, U19 data loss and all other open ledger items retain their status. Proposed acceptance checks inside the memos are future criteria, not passing results. No real budget file or shared folder was accessed and no populated board is returned. C1 and D1 remain held until Brad's separate go and the required final inputs.

QUESTIONS FOR BRAD:

1. For funded office money, approve canonical CLIN ownership with an explicit capacity tradeoff, or retain capacity-first ownership and require a different shared source-allocation policy? Recommend canonical funded ownership with separate ask/variance labels.
2. Approve a truthful unsaved-primary reopen header and separate last-file-save timestamp? Recommend yes, separately from the data-loss fix.
3. Approve the documented host-font-alias bypass with unchanged tools, retained failures and native acceptance pending? Recommend yes; no gate waiver is requested or implied.
4. Keep locked originals immutable and defer a new corrected-revision workflow? Recommend yes for this release, retaining refusal and preservation rules; any correction feature needs separate provenance and compatibility review.
