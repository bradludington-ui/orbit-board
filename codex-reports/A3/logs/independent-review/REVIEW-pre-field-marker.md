# Independent A3 review

Base: `7ee498a46507972f803cd48ce9f27d5d668acb63`, board `fce8a391bd8a248d5185e199d22190c1687eaea0`.
Reviewed corrected proposal board: `6e29aa8c10c168027da67d1970034cd931b89e09`.
Own review started 12:22 PM ET on 13 Oct 2026; evidence below finished 12:27:51 PM ET. No repository branch was changed.

Scoped verdict: the cached-map data-loss must-fix found during this independent review is corrected. No remaining money/data-loss must-fix found in the reviewed A3 paths. One P2 display consistency should-fix remains: the refused name is left in the edited input while the model remains unchanged. Native-browser acceptance and a full-suite pass are not established by this review.

## Corrected must-fix

The first proposal checked duplicate names only after a name lookup. A pre-v1.86 list containing `x1: Alpha Depot` and `x2: ALPHA DEPOT`, paired with an existing map `{x1:'A',x2:'A'}`, instead used its cached map and bypassed the new guard. On the first proposal, R1's $900 and R2's $300 both moved to A, $1,200 appeared under Alpha Depot, the second entry disappeared, and the notice was empty. The same result occurred through actual saved-file opening with newer destination storage, then saving and reopening. The source file still carried both distinct entries, so they were recoverable.

The corrected proposal tracks board keys claimed while reading one source list. That prevents two distinct source identities from consuming the same cached target. My unchanged independent reproduction now retains separate R1/R2 destinations through actual opening, save and reopen, with the literal $1,200 total unchanged. Both unambiguous v1.86 cross-copy merging and repeat-fold stability controls continue to pass.

## Actual runs

All commands used `python3 -I ../runner.py --cap 120 ... -- node adversarial.mjs <copy>`, supervised in their own process group. Boot blob `9c4f49ad8cec537097bdf485458cfd2a09b06594` and the task-local encoding adapter were identical in both copies. There was no mutation-script import or execution.

| Copy | Run | Time ET | Duration | Exit | Actual outcome |
|---|---|---|---:|---:|---|
| First proposal `de7f2d6a` | adversarial-fix-v2 | 12:25:58–12:26:02 | 4.286 s | 1 | 17 checks; 7 ownership/duplicate-notice failures |
| Corrected proposal `6e29aa8c` | adversarial-fix2 | 12:26:43–12:26:46 | 3.382 s | 0 | 17/17 checks passed |
| Base `fce8a391` | adversarial-base-final | 12:27:33–12:27:37 | 3.446 s | 1 | 17 checks; 12 protection failures, 5 controls pass |
| Corrected proposal `6e29aa8c` | adversarial-fix2-final | 12:27:49–12:27:51 | 2.333 s | 0 | 17/17 checks passed |

Raw logs and metadata are in this directory. The initial direct-fold run had a destination-count oracle that included ordinary seeded destinations; it is preserved, superseded by v2/final runs using a literal two-Alpha-entry expectation. Its valid ownership failure was reproduced through actual saved-file opening before being reported.

## Display consistency should-fix

I exercised the generated destination input's real `onchange` handler in JSDOM. Setting Bravo Yard's input to `ALPHA DEPOT` on the corrected proposal produced:

- Visible input: `ALPHA DEPOT`.
- Stored/model name: `Bravo Yard`.
- Status: `Destination name not changed...`.

The guard returns without restoring/re-rendering the edited field. Restoring the rejected input value while retaining the refusal notice would make the screen agree with the unchanged model. This is a display inconsistency, not a failed ownership or storage-refusal test. It was sent to the builder.

## Disclosure scope

The duplicate-preservation notice appears at opening and remains available in `flowEntEditor()` after export. Export overwrites `shareStat` with its ordinary success message. A name merge later in the session is recorded in the editor's notice but does not immediately replace the current status. Do not report the warning as permanently present in the status bar or as a persistent saved merge history.

## Inspected builder evidence, separate from my runs

The corrected proposal's 108-check focused block passes, while the base fails 78 checks. The text-only count reports 1,337 entries, each applying exactly once. Nine proposed mutants fail focused protection checks with no harness failures. These are inspected builder artifacts, not independent full-suite or native-browser execution.

## Limits

No native Chromium check or full audit-import run was performed by this independent reviewer. No real budget files, shared folders, or real two-machine FSA behavior were tested. No B2/C1/C2/D1 work was started. The proposal remains a scratch diff for the lead to adopt and review at a resulting committed/integrated tree.
