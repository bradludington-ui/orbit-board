# Independent A4 final review

Base: `7ee498a46507972f803cd48ce9f27d5d668acb63`. Review started 13 Oct 2026, 12:28 ET; completion time is recorded in REVIEW.json. Verdict: **sound within the authorized U41/U42 proposal scope; no remaining must-fix found**.

Reviewed final empty-template board `5053534a287c100341af8e4fd2a5752ba04def0f`, audit-recon `2a5dff7fc642cfe9c09b2bac4c4808e36cd48819`, and catalog TEXT `d677e43673f821bc1f8ae8b6a4e5fe106ca52aa8`. My isolated final snapshot and the builder's final files match exactly and remained unchanged after testing. Removing the two proposed suite blocks leaves every original suite byte unchanged. The blocks use the required async wrapper, two-space name declaration, boot lifecycle, and scenario markers.

U41 preserves the raw unsupported SI value, lists it explicitly, and sends its dollars to the existing no-code category instead of deriving or guessing a recognized code. Independent fixture arithmetic confirms Navy $1,500, Marines $390, grand total $1,890; unknown dollars are $900 Navy and $200 Marines, plus $90 already blank Marines. Thus no-code is $1,190 (63.0%), with recognized EN $440 (23.3%), OT $60 (3.2%), FL $70 (3.7%) and AT $80 (4.2%). Actual emitted XLSX and screen shares agree before and after saved-file reopening. Valid stored codes, blank and derived EN controls remain intact.

The initial proposal had one real reachability defect: an O&M requirement funded only for USAF $900 and ANG $200 retained and listed raw `at`, but siEligible returned false, hiding its correction field. The final proposal's narrow own-entry/unsupported-code guard and selected raw option repair that route. Actual Requirement edit actions can clear it or select AT, and reopening preserves the correction with unchanged service/office ownership. Unrelated blank non-Navy requirements gain no field. The existing locked-cycle refusal control retains known EN.

One assertion in my first diagnostic looked for the field in the inspector read view rather than the Requirement edit modal. That assertion is invalid as a DOM reachability verdict and is retained as probe history, not a product finding. The original false siEligible result established the reachability defect independently. The corrected final test uses the actual #recBody select and passes.

U42 keeps whole UTF-16 surrogate pairs at both cuts, removes edge apostrophes including newly exposed ones, and preserves interior apostrophes and uncut source names. My separate actual-XLSX adversarial probe also covered an apostrophe exposed by the repeated 26-unit collision cut, quote-only fallback, a whole emoji with edge quotes, case-insensitive uniqueness, nonempty names no longer than 31 UTF-16 units, XML parsing, and literal USAF $900 / ANG $200 destination ownership after reopening. All 12 checks passed. U42 source is unchanged in the final repair; that independent evidence is reused with exact function identity rather than rerun.

## Fresh reviewer runs

All commands use the task runner, a fresh process group, bounded caps and own-process cleanup. Times are ET; runtime is Node v24.19.0 and jsdom 27.0.0 with the existing encoding adapter, with no installation.

| Command (from A4-review) | Cap | Exit | Seconds | Actual result |
|---|---:|---:|---:|---|
| `node --import ../runtime-encoding-shim.mjs adversarial.mjs` | 60 | 1 | 1.274 | Initial reachability defect: siEligible false; obsolete inspector assertion separately noted above |
| `node --import ../runtime-encoding-shim.mjs tab-adversarial.mjs` | 60 | 0 | 1.926 | 12/12 actual-XLSX checks, working and reopened |
| `node --import ../runtime-encoding-shim.mjs adversarial-final.mjs` | 60 | 0 | 8.651 | 4/4 final raw preservation/list/eligibility/actual Requirement edit field checks |
| `node --import ../runtime-encoding-shim.mjs focused-final.mjs` | 120 | 0 | 29.098 | Exact proposed blocks: 63/63 pass, including actual clear/AT repair, reopen and locked refusal |
| `python3 -I ../helpers/mcount.py final/tools/export-audit/mutate.mjs final/prioritization-board-grid.html` | 30 | 0 | 8.080 | 1,334 entries, all once; none missing, multiple or unparsed |

The first final diagnostic retained the obsolete inspector assertion and exited 1 (5.137 s). It is superseded by the actual-edit-surface run, not concealed or treated as a production failure. Raw logs and metadata for both remain here.

## Inspected builder evidence

Final focused base: 63 checks, all 40 defect checks fail, all 23 controls pass. Full final audit-recon: fixed board exit 0/ALL CHECKS PASSED in 139.148 s; base exit 1 in 137.113 s, exactly the 40 new-block failures and no exception or never-ran failure. Both were capped at 180 s. Six proposed mutants fail 30/10/8/6/4/6 protection checks respectively; all exit 1 with no harness crash or scenario omission. The raw logs and per-run metadata were inspected; these runs are builder execution, not fresh reviewer execution. REVIEW.json records their IDs and times.

## Limits

No native Chromium/Desktop Excel acceptance, browser layout/keyboard gate, full audit set, full mutation sweep, or release gate ran in this review. XLSX checks concern emitted bytes/XML and the application's reader, not native Excel. No non-O&M SI editing policy was changed or accepted. Full integration with other fixes requires fresh or justified source-scoped evidence. No repository branch was edited, committed or pushed; no external message or populated board was returned. Every recorded reviewer process group exited. B2, C1, C2 and D1 were not started.
