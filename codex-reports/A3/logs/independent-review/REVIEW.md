# Independent A3 final review

Base: `7ee498a46507972f803cd48ce9f27d5d668acb63`, board `fce8a391bd8a248d5185e199d22190c1687eaea0`.
Final proposal board: `2419366b6af4417a64ebc294479721e29ed1706b`.
Final suite: `f68e4a54b5471fd67e82071213b99045b1f8242d`.
Final catalog TEXT: `5a4d934ad4327dc69f11d351185d8632de80c6ae`.
Review started 12:22 PM ET on 13 Oct 2026; completed 2026-10-13T12:44:58.387412-04:00.

**Scoped verdict: no remaining must-fix or should-fix found in the reviewed A3 ownership, migration and refused-field paths.** This is an independent scratch-proposal review, not a whole-suite, integrated-tree or release verdict.

## Resolved findings

The initial proposal could still collapse a legacy list through an existing `DESTDB.lmap` entry mapping `x1: Alpha Depot` and `x2: ALPHA DEPOT` to the same local key A. Actual file opening with newer cached storage moved both requirements to A, put $900 + $300 = $1,200 there, lost the second destination entry, and gave no disclosure. Actual save/reopen retained that merge. The corrected claimed-key guard prevents consuming a cached target twice for distinct source identities; the original list still carries enough information to preserve both entries.

The subsequent typed-field display inconsistency is also resolved: the refused draft remains available for correction, but it is now explicitly marked invalid in red, the tooltip says it was not saved and names the actual stored value, focus remains on the field, and successful correction clears the marker and tooltip through ordinary rendering.

## Fresh final-board field evidence

`python3 -I ../runner.py --cap 120 ... -- node field-final.mjs final`, own process group, 12:34:39.552–12:34:41.233 PM ET: **13/13 passed**, exit 0, 1.681 s.

Same independent probe on the base, 12:43:30.803–12:43:32.174 PM ET: **7 protection failures, 6 healthy controls pass**, exit 1, 1.372 s. No timeout, crash, or skipped scenario.

This exercises the real generated `#entBody` input and its `change` handler. It verifies literal `ALPHA DEPOT` stays as a visibly invalid draft, model `Bravo Yard` remains intact, focus stays, requirements/counters/flags and stored key/value snapshots stay unchanged, a legitimate `Charlie Yard` correction is stored, and its new field has no invalid marker or stale refusal tooltip. No expected dollar value is derived from an ORBIT helper.

## Justified ownership evidence reuse

The earlier corrected-board independent reproduction passed **17/17** at board `6e29aa8c10c168027da67d1970034cd931b89e09` (12:27:49.005–12:27:51.338 PM ET, exit 0, 2.333 s). Base failed 12 protections and passed 5 controls (12:27:33.590–12:27:37.036 PM ET, exit 1, 3.446 s).

Its scope includes cached legacy-map handling through actual saved-file opening with newer destination storage, actual save/reopen, separate R1/R2 destination ownership with literal $900/$300 and unchanged $1,200 total, uncached legacy duplicates, repeated-fold stability, legitimate unambiguous v1.86 cross-copy merges, and disclosure available in the editor after export.

Those ownership results are **reused, not freshly rerun on the final board**. `ownership-reuse.json` establishes byte identity for `destFold`, `destRemap`, `destMigrate`, `destJoin` and `destNotice` between the earlier corrected proposal and the final proposal. The intervening board diff only changes the refused-input UI path; it leaves these ownership functions and save/reopen paths unchanged. Boot blob is still `9c4f49ad8cec537097bdf485458cfd2a09b06594`, and the task-local adapter/dependency environment is unchanged.

## Inspected builder artifacts, separate from my execution

I inspected the final focused logs: **116/116 fixed checks**, base **82 protection failures / 34 controls passing**. Final text-only count: **1,338 entries, each matches once**, with no missing/multiple/unparsed entries. The final results file records **10 mutants caught** by named checks and no harness failures. The final report also identifies 40 passing inherited destination checks; these are builder evidence, not fresh independent full-suite execution.

## Disclosure and evidence limits

A later export/save/status message can replace the opening notice in `shareStat`; the destination editor retains the recomputed duplicate notice. Actual key-remap notice history is session-local and does not add a new saved-format field. A saved file that has already discarded its original distinct entries cannot reconstruct that lost ownership.

All fresh runtime checks here are bounded synthetic JSDOM probes on isolated copies. No native Chromium visual, native FSA, real two-machine shared-folder, complete audit-import suite, integrated-tree or full gate acceptance is claimed. No branch changes, commits, pushes, posts, real budget/shared-folder access, mutation-script import/execution, installs or held B2/C1/C2/D1 batches occurred. All recorded owned process groups exited.

Detailed source identities, independent scripts, raw logs and bounded metadata are beside this report. Earlier pre-field-marker review and superseded evidence are preserved separately.
