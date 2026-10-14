# Independent B2 review (resumed)

Base `7ee498a46507972f803cd48ce9f27d5d668acb63`; snapshot `cycreg-snapshot-20261013-1322`.
Started **7:43:35 PM ET, 13 Oct 2026**; completed **7:49:38 PM ET, 13 Oct 2026**.

Reviewed board blob `59cff8f34a04d656604c352909966b27998f7384` against base board `fce8a391bd8a248d5185e199d22190c1687eaea0`. Snapshot suite blob `03b7fda90c0a3dd6f90e02b19d731ebc6d7bd16d` and catalog blob `755c298941d34f83c52ee765d931f6345cd8d652` are inventory identities, not suite/sweep passes. The catalog was not imported or executed. Input manifest and supplied post-patch identity receipts were inspected.

The duplicate-K1 and `__none__` money defects are fixed in the tested snapshot. Independent ZIP/XML reading of actual emitted XLSX artifacts confirms USAF **$900**, ANG **$200**, AFRC **$0**, all services **$1,100**, in December with **$0** undated. Both the summary and requirement-breakout service totals agree. No ordinary-list refusal or new money loss was found in the exercised cases. One newly added retention sentence is inaccurate for a retained locked-cycle entry with a non-text key; it needs narrower wording.

## Evidence and adequacy

**Fresh application runtime:** the independent adversarial probe exercises seven cases, each live and after reopening a saved HTML string. No populated HTML was written to disk. Cases are conflicting labels sharing K1; `__none__` assigned; `__none__` unassigned; ordinary keys named e0/e1; numeric 1 beside text "1" in the working plan; those aliases in a locked cycle with inherited non-text filtering; and distinct ordinary USAF/ANG assignments. Snapshot **35/35** passes. Base **17 pass / 18 fail**, no incomplete case. Fourteen actual XLSX emissions are captured per board. Expected rows use hand-written literals, not ORBIT-derived expectations. The arithmetic is simply **$900 + $200 + $0 = $1,100**; discretionary capacity is $5,000 per service and the award is one December award, so there is no lane shortage or apportionment in this fixture.

**Inspected application evidence:** B2's final focused-probe JSON records **208/208** on the snapshot and **151 pass / 57 fail** on the base, with **136 controls and zero control failures**. Its 28 actual workbooks per board cover full-import/browser-storage reopen and saved-file reopen; direct opening/saved-file reopen; and ordinary one-appropriation and several-board import/reopen controls. Bad handed-over lists are refused through actual import entry points with browser-key preservation checked. Earlier attempts containing expected jsdom navigation errors are superseded and are not passes.

**Fresh independent artifact inspection:** Python `zipfile` and `xml.etree.ElementTree`, without `xlsxRead`, ORBIT grouping helpers or ORBIT arithmetic, parse all **28 snapshot and 28 base XLSX files**. Each file has one literal top-row comparison and one literal summary/breakout-total comparison. Snapshot **56/56** passes; base **32 pass / 24 fail**. These are new checks of existing runtime artifacts, not 56 additional application executions.

**Source inspection:** private `e<first row index>` grouping separates `__none__` from the sheet's unassigned bucket and separates numeric/text aliases. Deduplication prints a repeated string key once. The grouping keeps the first matching registry entry's ownership. Full-board confirmation precedes writes; handed-over and own-board routes apply different registry policy. The one-check `_inRcnNext` value resets on entry to `inboundCheck`, so a completed own check does not exempt the next ordinary check.

## P2: retained numeric-key cycle contradicts first-entry wording

**Trigger:** retain an older locked PB27 list containing `{k:1, rcn:'99999', eeic:'ZZZZZ'}`, with requirement R1 pointing to numeric `1`; take the board whole with Full board import, then reopen and view PB27. Synthetic R1 asks remain USAF $900 / ANG $200.

**Expected:** say accurately which retained entries the locked view can read. Do not promise first-entry resolution for a key the cycle reader removes.

**Actual:** the new confirmation says **"Each requirement reads the first entry with its key"**. The imported/saved cycle still contains the numeric-key entry, but `cycRcnOf` filters it out; the view's registry is `[]`, `rcnEntry(1)` is `null`, and the label is empty. The independent adverse XLSX case shows that its $900 / $200 stays in the unassigned grouping. The ordinary string-key control resolves `K1` to `11111 / AAAAA` normally. The base has the same inherited filter and does **not** print the new blanket claim. This is a new wording overclaim, not a newly introduced total loss or changed filter.

The sentence is at [snapshot line 9824](/workspace/orbit-round2-20261013-1331ET/B2/snapshot/prioritization-board-grid.html:9824); the cycle filter is at [line 20247](/workspace/orbit-round2-20261013-1331ET/B2/snapshot/prioritization-board-grid.html:20247). Minimal probe: `probes/retention-wording.mjs`; actual retained list, view list and resolved entry are recorded in `logs/retention-wording-snapshot-results.json.txt`. A suitable scope for the lead is to distinguish working-plan first-match resolution from a locked cycle's legacy string-key-only reading. No product patch was made here.

## Actual bounded runs

| Command | Exit | Seconds | Result |
|---|---:|---:|---|
| `timeout -k 10 180 node probes/adversarial-registry.mjs` (snapshot, first run) | 0 | 5.293 | 35/35; detailed JSON later overwritten by the base's reused output name; repeat retained below |
| `BOARD=<exact base> timeout -k 10 180 node probes/adversarial-registry.mjs` | 1 | 5.392 | 17 pass / 18 fail; no incomplete |
| `timeout -k 10 180 node probes/adversarial-registry.mjs` (snapshot, evidence repeat) | 0 | 5.038 | 35/35; complete retained JSON |
| `timeout -k 10 90 node probes/retention-wording.mjs` (snapshot) | 0 | 1.994 | Two diagnostic records: numeric-key contradiction, ordinary control |
| `BOARD=<exact base> timeout -k 10 90 node probes/retention-wording.mjs` | 0 | 2.125 | Two diagnostic records: inherited filter, no new blanket wording |
| `timeout 30 python3 -I probes/inspect-xlsx-independent.py` | 0 | 0.149 | Snapshot56/56; base32 pass/24 fail; no ORBIT reader |

Full absolute commands and UTC start/finish timestamps are retained in each `logs/*-run.json.txt`; their Eastern conversion is the report's local time basis. No timeout, crash, scenario-never-ran failure or unattended child is reported. The wording probe is a diagnostic with two recorded records; its exit 0 is **not** a claim that the disputed wording passed an assertion.

## Limits and resume

No full audit suite, mutation sensitivity sweep, release gate, native Excel, real Chromium or two-machine/shared-folder acceptance was run. Runtime probes use the actual empty application in jsdom with synthetic state. Source review and bounded evidence establish these cases, not all registry shapes, all import failure modes or integration readiness. The snapshot is still a draft and future changes need new identity/scope checks. No automatic fix, repository edit, commit, push, merge, comment or external message was made by this reviewer.

Money chunk completed for these literal ownership/export cases. Preservation chunk completed for the exercised saved-payload retention and inspected focused refusal controls; broader concurrent-write/adoption preservation remains outside B2. Interaction review is scoped to grouping/retention policy and the importer messages; the P2 wording finding remains open. Exact next action: the lead narrows the first-entry statement for retained non-text keyed cycles, then reruns this diagnostic and the focused B2 cases at the changed snapshot. C1/D1 remain held.
