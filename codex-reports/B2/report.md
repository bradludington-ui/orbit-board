BATCH B2  |  base 7ee498a46507972f803cd48ce9f27d5d668acb63  |  snapshot cycreg-snapshot-20261013-1322  |  started 13 Oct 2026, 1:34 PM ET / finished 7:48:59 PM ET

Work paused after the 1:38 PM ET runs and resumed at 7:43 PM ET. All times below are Eastern and come from recorded clocks.

## FINDINGS

**The named draft passes the two original cycle-export cases and the ordinary-key controls. A separate review found one P2 false statement for an own-board import with a nontext locked-cycle key.** No tested duplicate-K1 or `__none__` route still doubles money, and the ordinary lists are accepted. The false wording needs correction; the 208 passing primary checks do not erase it. This is draft evidence, not acceptance of a merged or integrated release.

The immutable input is `claude/v200-fixes-wip` commit `3e38ac8323fa984fe0612fd00475f07c0495219c`. All four `MANIFEST.sha256` entries were checked before the snapshot was used, and rechecked at completion. The three supplied diffs applied to separate disposable copies of the exact base. The resulting identities are:

| File | Base/snapshot identity |
| --- | --- |
| Base board | `fce8a391bd8a248d5185e199d22190c1687eaea0` |
| Snapshot board | `59cff8f34a04d656604c352909966b27998f7384` |
| Snapshot audit-recon | `03b7fda90c0a3dd6f90e02b19d731ebc6d7bd16d` |
| Snapshot mutate.mjs, text only | `755c298941d34f83c52ee765d931f6345cd8d652` |
| Unchanged boot.mjs | `9c4f49ad8cec537097bdf485458cfd2a09b06594` |

The empty source templates retain their original exact blobs after the tests. Synthetic data, saved HTML, browser storage and emitted XLSX existed only at run time. No full source copy, populated HTML or spreadsheet binary is returned.

### Exact reproduction and independent expectations

1. Start an empty O&M board. Seed one requirement R1 with literal asks/allocation of **USAF $900, ANG $200, AFRC $0**, enough funding in each service, and one December award. Expected all-services money is the hand-written literal **$1,100**.
2. Lock **PB27** using the board's actual cycle-lock function. Give its frozen RCN/EEIC list either two identical entries keyed `K1`, or a single entry keyed `__none__`. The two `__none__` variants have the requirement assigned to that key or unassigned.
3. The ordinary controls use unique textual `K1` and `K2` entries, with the requirement assigned to K1 or unassigned.
4. Exercise actual one-appropriation import, actual several-board import, and actual full-board import. Cancel the full-board confirmation once before accepting it, comparing every browser-storage key byte-for-byte.
5. Export the actual XLSX after import and after browser-storage or saved-file reopen. Also open the saved incoming file directly and save/reopen it. Select the actual locked PB27 view for each export.
6. Capture the emitted XLSX bytes, rather than treating a simulated table or helper-produced expected result as the workbook. Read them first with the application's reader as an agreement check, then independently with Python ZIP/XML/Decimal code. The second reader uses no ORBIT reader, money helper or existing decoded JSON as its oracle.

Expected rows are literal: K1 is `11111 / AAAAA`; assigned `__none__` is `22222 / BBBBB`; unassigned money is `— no RCN/EEIC assigned —`. Each funded service must have one combination row, the month is December, every other month and UNSCHEDULED are $0, and service totals must be **900 / 200 / 0**, all-services **1100**.

| Fixture | Base actual RCN-EEIC totals | Snapshot actual totals | Routes exported per board |
| --- | --- | --- | ---: |
| Duplicate K1 | USAF **1800**, ANG **400**, all **2200** | USAF **900**, ANG **200**, all **1100** | 4 |
| Reserved `__none__`, assigned | **1800 / 400 / 2200**; also creates a false not-assigned row | **900 / 200 / 1100**, one assigned combination | 4 |
| Reserved `__none__`, unassigned | **1800 / 400 / 2200**; creates an extra named combination | **900 / 200 / 1100**, one not-assigned combination | 4 |
| Ordinary K1/K2, assigned | **900 / 200 / 1100** | **900 / 200 / 1100** | 8 |
| Ordinary K1/K2, unassigned | **900 / 200 / 1100** | **900 / 200 / 1100** | 8 |

For the three bad-list fixtures, one-appropriation and several-board imports are refused on the snapshot **before any browser-storage key changes**. The notice names `cycles.PB|2027.rcn` and the offending key, and acknowledges that an earlier board could have accepted it. Those refused routes produce no workbook and are not counted as an exported-money pass. On the base those files are accepted.

Full-board import retains the list verbatim on both boards. On the snapshot its confirmation describes the PB27 list/key, first-entry reading and counting each key once. Cancellation leaves storage unchanged; accepting retains the list through browser and saved-file reopen, with the same notice at opening. The snapshot's retained older lists export the correct figures. Both ordinary control files pass the handed-over door, one/several/full imports and reopening with no false odd-list notice.

### Evidence and counts

The corrected fresh runtime probe has **208 checks**: snapshot **208 pass / 0 fail / 0 incomplete**; base **151 pass / 57 protection failures / 0 incomplete**. All **136 controls pass on both boards**. Each of the three bad fixtures supplies 19 base failures; both ordinary fixtures have zero failures.

The independent Python parser reads **56 actual XLSX workbooks**, 28 from each board, and parses **896 XML/rels parts**. It checks 44 literal outcomes per workbook, including RCN-EEIC monthly/detail totals, combination ownership, Funding Streams and PMO Matrix agreement:

| Board | Workbooks | Independent checks passed | Failed | Ordinary-control checks |
| --- | ---: | ---: | ---: | ---: |
| Base | 28 | 1040 | 192, in 12 bad-list workbooks | 704/704 pass |
| Snapshot | 28 | 1232 | 0 | 704/704 pass |

Each base bad-list workbook fails 16 independently read outcomes. The actual exported totals are 1800/400/2200, not a rounding or formatting discrepancy. Snapshot workbooks cross-foot to the literal 900/200/1100. Every workbook's filename, exact hash, XML sheets, raw read cells and assertion outcomes are retained in `logs/xlsx-independent-results.json.txt`; detailed reader methodology is in `logs/XLSX-INDEPENDENT-READ.md`.

### New P2 finding: full-board confirmation overstates retained nontext keys

**Trigger and minimal probe:** create the same literal-money PB27 cycle, but give the frozen registry an entry `{k: 1, rcn: '99999', eeic: 'ZZZZZ'}` and requirement R1 a numeric pointer `1`. Use the actual full-board import, accept it, reopen, and select PB27. An ordinary textual `K1` file is the control.

**Expected:** the notice truthfully distinguishes a raw list retained in the saved cycle from entries that the active locked view can read. It must not say that this numeric pointer reads its saved code entry.

**Actual at snapshot `59cff8f3...`:** the confirmation names the numeric key, then says **“Each requirement reads the first entry with its key, as the ORBIT that saved the file did”**. The raw frozen registry is retained exactly, but the active registry is `[]`, the entry resolves to `null`, and its label is `''`; `cycRcnOf()` filters out every entry whose key is not text. The ordinary K1 control resolves `11111 / AAAAA` correctly. Base behavior has the same active filtering but does **not** make this new blanket claim, so this is a new draft wording defect rather than a newly proven money-loss or raw-storage loss defect.

The new blanket text is pinned in the [snapshot input diff](https://github.com/bradludington-ui/orbit-board/blob/3e38ac8323fa984fe0612fd00475f07c0495219c/recovery/v200/codex-handoff/inputs/cycreg-snapshot-20261013-1322/prioritization-board-grid.html.diff#L123); the inherited filtering is at [cycRcnOf on the base](https://github.com/bradludington-ui/orbit-board/blob/7ee498a46507972f803cd48ce9f27d5d668acb63/prioritization-board-grid.html#L20171). The independent observer's actual imports, confirmation text, retained array, active array, pointer and resolution are in `logs/independent-review/retention-wording-snapshot-results.json.txt` and its base/control receipt. These were fresh bounded runtime observations, not source-only inference. The observer has no assertion exit: its exit 0 means it completed the capture, **not** that the misleading notice passed an acceptance check. A separate 35-check reviewer probe covers differing duplicate code definitions, working numeric/text keys, the inherited locked numeric-key filtering, private grouping-name collisions and per-service ownership; snapshot 35/35, base 17 pass/18 fail. It reads actual emitted bytes through ORBIT's reader and is separate from the Python byte-reader's 56-workbook matrix.

**Recommendation:** qualify the full-import notice: the raw lists are kept, repeated usable keys resolve to their first entry, and nontext locked-cycle entries are not active and have no resolved code. Do not remove the preserved raw entries or change the lock's semantics to make the old sentence true. A text-only correction and a failure-sensitive notice check belong in the lead's draft round. No product change was made here.

The original defect is pinned to the base's [monSheet grouping](https://github.com/bradludington-ui/orbit-board/blob/7ee498a46507972f803cd48ce9f27d5d668acb63/prioritization-board-grid.html#L30091). The draft is a diff input rather than a product commit: its complete source diffs and manifest are retained under `logs/snapshot-inputs/`.

## PROPOSAL

**No new product or suite diff proposed.** The supplied U32/U33 draft resolves the two original money reproductions in the exercised routes. The P2 notice correction above is a wording recommendation for the lead, not an applied fix. Its three exact input diffs are archived as provenance, not represented as a new Codex implementation. Adoption, the separate locked-cycle repair policy, other reviewer must-fixes, and integrated release acceptance remain with the lead and Brad.

## RUNS

All child processes ran under `python3 -I ../runner.py`, which creates a task-owned process group, enforces the stated cap and cleans up only that group. The wrapper records the child exit; its own successful bookkeeping exit is not mistaken for a test pass. No listed run timed out. Runtime: **Node v24.19.0, jsdom 27.0.0**, `NODE_OPTIONS=--max-old-space-size=4096`; the recorded encoding shim supplies this jsdom environment's Web TextEncoder/TextDecoder binding. Two independent B2 producer commands ran concurrently; no audit-import or full gate ran.

| Command / evidence | Child exit | Duration / cap | Result |
| --- | ---: | --- | --- |
| Fresh corrected base producer, 7:43:46–7:44:08 PM | 1 | 21.401 s / 180 s | 151 pass, 57 protection failures, 136/136 controls |
| Fresh corrected snapshot producer, 7:43:46–7:44:07 PM | 0 | 21.201 s / 180 s | 208/208, all controls pass |
| Independent XLSX parser, 7:45:15–7:45:16 PM | 1 | 0.600 s / 120 s | Snapshot 1232/1232; aggregate exit 1 includes the base's 192 failures |
| Text-only mcount, 7:43:57–7:43:59 PM | 0 | 2.639 s / 120 s | **1358 entries; all match exactly once**, no missing/multiple/unparsed target |
| Reverify snapshot manifest, 7:45:57 PM | 0 | 0.032 s / 30 s | 4/4 SHA256 entries match |
| Reviewer adversarial snapshot, 7:45:12–7:45:17 PM | 0 | 5.293 s / 180 s | 35/35; the following repeat retains its complete JSON |
| Reviewer adversarial base, 7:46:54–7:46:59 PM | 1 | 5.392 s / 180 s | 17 pass / 18 failures |
| Reviewer adversarial snapshot repeat, 7:47:10–7:47:15 PM | 0 | 5.038 s / 180 s | 35/35; repeat needed after the base run reused its output name |
| Reviewer nontext-retention observer, snapshot, 7:46:10–7:46:12 PM | 0 | 1.994 s / 90 s | Captured the P2 false claim and ordinary control; observation-only exit |
| Reviewer nontext-retention observer, base, 7:47:33–7:47:35 PM | 0 | 2.125 s / 90 s | Same inherited filtering, no new false claim; observation-only exit |

Exact commands (run from the B2 folder; full arguments and clock receipts are in the corresponding `logs/*-run.json.txt`):

```sh
python3 -I ../runner.py --cap 180 --cwd /workspace/orbit-round2-20261013-1331ET/B2 --log logs/independent-base.log --meta logs/independent-base-run.json -- env BOARD=/workspace/orbit-round2-20261013-1331ET/B2/base/prioritization-board-grid.html NODE_OPTIONS=--max-old-space-size=4096 node --import /workspace/orbit-codex-batches-20261013-1205ET/A1/runtime-encoding-shim.mjs probes/cycle-export-independent.mjs base
python3 -I ../runner.py --cap 180 --cwd /workspace/orbit-round2-20261013-1331ET/B2 --log logs/independent-snapshot.log --meta logs/independent-snapshot-run.json -- env BOARD=/workspace/orbit-round2-20261013-1331ET/B2/snapshot/prioritization-board-grid.html NODE_OPTIONS=--max-old-space-size=4096 node --import /workspace/orbit-codex-batches-20261013-1205ET/A1/runtime-encoding-shim.mjs probes/cycle-export-independent.mjs snapshot
python3 -I ../runner.py --cap 120 --cwd /workspace/orbit-round2-20261013-1331ET/B2 --log /workspace/orbit-round2-20261013-1331ET/B2/logs/xlsx-independent.log --meta /workspace/orbit-round2-20261013-1331ET/B2/logs/xlsx-independent-run.json -- python3 -I /workspace/orbit-round2-20261013-1331ET/B2/probes/xlsx-independent.py --runtime /workspace/orbit-round2-20261013-1331ET/B2/runtime-only --output /workspace/orbit-round2-20261013-1331ET/B2/logs/xlsx-independent-results.json
python3 -I ../runner.py --cap 120 --cwd /workspace/orbit-round2-20261013-1331ET/B2 --log logs/mcount.log --meta logs/mcount-run.json -- python3 -I ../helpers/mcount.py snapshot/tools/export-audit/mutate.mjs snapshot/prioritization-board-grid.html
python3 -I ../runner.py --cap 30 --cwd /workspace/orbit-round2-20261013-1331ET/B2 --log logs/manifest-reverified.log --meta logs/manifest-reverified-run.json -- python3 -I probes/verify-snapshot.py logs/snapshot-inputs
```

Reviewer commands (the environment and exact BOARD binding are recorded alongside each receipt):

```sh
timeout -k 10 180 node /workspace/orbit-round2-20261013-1331ET/B2-review/probes/adversarial-registry.mjs
BOARD=/workspace/orbit-round2-20261013-1331ET/B2/base/prioritization-board-grid.html timeout -k 10 180 node /workspace/orbit-round2-20261013-1331ET/B2-review/probes/adversarial-registry.mjs
timeout -k 10 90 node /workspace/orbit-round2-20261013-1331ET/B2-review/probes/retention-wording.mjs
BOARD=/workspace/orbit-round2-20261013-1331ET/B2/base/prioritization-board-grid.html timeout -k 10 90 node /workspace/orbit-round2-20261013-1331ET/B2-review/probes/retention-wording.mjs
```

### Superseded / incomplete harness attempts, kept separately

- At 1:37 PM the first producer attempt bound a fixture path incorrectly; both runs exit 1 in 3.157/3.156 s, each with five incomplete harness cases. These are not money or application failure verdicts. Receipts/results/logs are `logs/harness-attempt-1-*`.
- At 1:38 PM the corrected fixture binding produced all 56 XLSX, but the error assertion mistook jsdom's **“Not implemented: navigation to another Document”** on actual successful full import for a product error. Both boards had exactly five such control failures. Base: 141 pass/62 fail; snapshot: 198 pass/5 fail. Their receipts/results/logs and probe are preserved as `harness-attempt-2-*` and `probes/cycle-export-independent-attempt-2.mjs`.
- The final probe explicitly requires that known warning **once on the imported board T only**, and continues to require zero other application errors in every board and reopen. It does not suppress a generic error, skip a scenario, change a dollar expectation or bypass the actual import.
- The independent Python reader's first 0.566-second attempt mistakenly classified the all-services row as an AFRC combination row. Its logs and results are `xlsx-parser-attempt1-*`; the first parser source was not separately preserved. This attempt is superseded. The final parser ends each service section at its total row and retains every amount/label literal. The spurious AFRC failure is not attributed to the product.

## NOT DONE / LIMITS

- No native Microsoft Excel, Chromium rendering, full audit-recon, full audit-import, full-suite set, mutation sensitivity, presweep, gate, or combined-tree validation ran for B2. Existing Chromium was unnecessary for the requested actual XLSX-byte checks; no browser was installed.
- `mutate.mjs` was read only by the Python literal parser. **1358 single matches establish applicability, not observed catches or sweep completeness.** No mutation JS was imported or executed.
- This validates only `cycreg-snapshot-20261013-1322` at the exact identities above. A later snapshot, commit or changed reader/export path needs fresh coverage or justified identity reuse.
- Probes cover O&M PB27, the two original key defects, an additional assigned/unassigned sentinel distinction, ordinary K1/K2 controls and the specifically named reviewer variants. Nontext keys, mixed numeric/text duplicate keys and conflicting duplicate code definitions received targeted review probes, not exhaustive coverage. Every other registry-fed export and real two-machine shared folders were not exhaustively tested.
- Reopen means actual application boot from synthetic browser storage or generated saved HTML under jsdom. The automatic browser navigation itself cannot run in jsdom and is accounted for separately; no real browser navigation or Windows FSA behavior is inferred.
- Refused bad-list imports have no exported workbook. Their preservation/refusal checks pass; they do not prove a hypothetical accepted bad-file import is safe by that route.
- U32/U33 remain draft/integration findings. B2 does not close the ledger globally, decide whether locked registries should be editable, or claim release readiness. C1/D1 remain on hold.

## QUESTIONS FOR BRAD

No new policy decision is needed for the P2 truthful-notice correction. The locked-cycle correction policy belongs to the separate C2 memo; this batch verifies the supplied policy's money preservation/refusal/counting behavior for the literal cases and leaves the new notice defect open.
