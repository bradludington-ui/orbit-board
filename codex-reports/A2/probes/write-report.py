from pathlib import Path
import json,datetime,re,hashlib
from zoneinfo import ZoneInfo
r=Path('/workspace/orbit-codex-batches-20261013-1205ET/A2'); clock=datetime.datetime.now(ZoneInfo('America/New_York')).strftime('%-I:%M:%S %p ET, 13 Oct 2026')
ids=json.loads((r/'source-identities.json').read_text()); mids=json.loads((r/'mutation-ids.json').read_text())
rows=[]
for mid in mids:
 m=json.loads((r/(mid+'-snapshots-meta.json')).read_text());t=(r/(mid+'-snapshots.log')).read_text();n=re.search(r'(\d+) FAILING CHECK',t).group(1)
 assert m['exit']==1 and not m['timed_out'] and 'block threw' not in t and 'never ran' not in t
 rows.append(f"| {mid} | 1 | {m['duration_seconds']:.3f} s | {n} named failures |")
runs=[]
for label,file in [('Base focused','refusal-base-final-snapshots-meta.json'),('Fixed focused','refusal-fix-final-snapshots-meta.json'),('Fixed full audit-recon','refusal-audit-recon-final-snapshots-meta.json'),('Fixed full audit-other','refusal-audit-other-meta.json'),('Fixed full audit-ppt','refusal-audit-ppt-meta.json'),('Fixed full audit (Excel)','refusal-audit-excel-meta.json'),('Original catalog mcount','mcount-base-meta.json'),('Proposed catalog mcount','refusal-mcount-accepted-meta.json')]:
 m=json.loads((r/file).read_text());result=('51 named failures / 53 checks (2 controls pass)' if label=='Base focused' else '53/53, ALL CHECKS PASSED' if label=='Fixed focused' else '1,328 / 1,328 exactly once' if label=='Original catalog mcount' else '1,339 / 1,339 exactly once' if label=='Proposed catalog mcount' else 'ALL CHECKS PASSED')
 runs.append(f"| {label} | `{ ' '.join(m['command']) }` | {m['exit']} | {m['duration_seconds']:.3f} s / cap {m['cap_seconds']:.0f} | {result} |")
text=f'''BATCH A2  |  base 7ee498a46507972f803cd48ce9f27d5d668acb63  |  started / finished first recorded clock 12:10:48 PM ET / {clock}

FINDINGS:

U37 is reproduced from the empty base board (`fce8a391bd8a248d5185e199d22190c1687eaea0`), using synthetic state only at runtime. The pinned handoff inputs are from `bbe728556dc394c50d84ad9a09facc5fa163e42b`.

1. Build a one-sheet workbook whose C1 holds each literal XML-forbidden C0 unit (U+0000–U+0008, U+000B, U+000C, U+000E–U+001F), U+FFFE/U+FFFF, or an isolated surrogate. The base emits ZIP bytes instead of refusing. Expect no workbook, exact offending unit and `cell C1` in the refusal, original text/model/storage/flags retained. Actual base export operations emit ZIP/Blob files with those values, while the proposed writer refuses them.
2. Seed one requirement: USAF $900, ANG $200, total $1,100. Put `bad\\u0001char\\u000Bvt` in its RCN/EEIC title and `Title\\u000B` in its requirement title. Run actual `exportExcel`, `exportCSV`, and `exportSrc`. Add a destination named `Ctl\\u000B` and run actual `exportFlow`. Base produces files; fix produces zero ZIP/Blob/download bytes and names the affected sheet/cell or name. This is a fresh jsdom runtime reproduction; the Chromium paste log is inspected historical evidence, not a fresh native-browser test.
3. Literal `_x0041_` is ambiguous in OOXML. The first codec draft conformed to OOXML but changed an older ORBIT workbook's reader result from literal `_x0041_` to `A`. That is a material preservation issue. There is no existing reliable producer/version marker to disambiguate old literal text from standard escapes. The codec draft and all its passing logs are superseded; they are not acceptance evidence for this proposal.
4. Legal TAB/LF/CR text must also stay exact under a standards XML parser. Raw attribute whitespace normalizes, and raw CR text normalizes to LF. The workbook-only escaper writes decimal references, which the existing reader already understands. Hand-written expectations assert original cell text, sheet name, and custom format under DOMParser and xlsxRead.
5. Cold `exportFlow` already adds the lazy `MS.flow.pseudo` and `MS.flow.subs` defaults before its writer call on the base. The test explicitly records that exact two-key delta and proves all entered containers, DIRTY, generations, base-dirty flag and browser storage are otherwise unchanged. A separate displayed-panel setup (`flowHtml()`) then proves complete snapshot identity across the refused export. The notice makes the narrower true claim: no workbook was created and original text is kept.

PROPOSAL:

Choose **refusal**, rather than OOXML string escapes, to preserve the current reader and old ORBIT-generated text without inventing a stored protocol/version marker.

- Board: central `_xlsxRefused` checks every sheet name, string cell and custom format before any ZIP bytes exist, names its precise field/unit, and returns null on refusal.
- Board: all 16 existing `buildXlsx` callers return immediately on that sentinel, before Blob/download or success status. Four representative operated routes are runtime-tested; all 16 guard positions are source-reviewed.
- Board: refuse literal `_xHHHH_` spellings too. Merely writing them raw would let Office interpret literal text as a character; refusing is explicit and leaves original data intact.
- Board: `_xlXml` adds legal whitespace references at the three workbook string sites. `_xesc` and the entire existing `xlsxRead`/`_xunesc` region remain byte-identical, preserving PPT behavior and existing workbook-reader compatibility.
- Suite: append the wrapped 53-check U37 block, keeping every original audit-recon line byte-identical. It includes bootMark/release/settle, the two-space name marker, actual ZIP-byte parsing, explicit six-part XML count and board-reader checks.
- Catalog TEXT: append 11 focused entries at the exact README marker. No old entry needs retargeting; each original and proposed find matches exactly once. No mutate.mjs import or execution occurred.

Exact proposed blobs: board `{ids['prioritization-board-grid.html']['proposal_blob']}`, audit-recon `{ids['tools/export-audit/audit-recon.mjs']['proposal_blob']}`, catalog TEXT `{ids['tools/export-audit/mutate.mjs']['proposal_blob']}`.

Unified diff against the exact stated base (all three files; no populated HTML):

```diff
{(r/'PROPOSAL.patch').read_text().rstrip()}
```

RUNS:

Environment: Node v24.19.0, jsdom 27.0.0, playwright-core 1.63.0. The task-local encoding shim supplies TextEncoder/TextDecoder to jsdom; product and original boot/tool code are unchanged. Every command used the task-local supervised runner with the recorded cap, owned process group, termination cleanup, Eastern start/finish and exit metadata; no command timed out. All processes recorded by this batch have exited.

| Run | Command | Exit | Duration / cap | Result |
| --- | --- | --- | --- | --- |
{chr(10).join(runs)}

Every one of the 51 new protection checks fails on the base and passes on the fix. The two explicitly labelled controls pass on both. The focused harness is the exact appended suite block, with only its boot/chk/fixture bindings and summary around it. Fresh full audit-recon at the final suite blob passes. The other three full suites ran earlier on this same final board/tool blobs; only audit-recon's later snapshot assertions changed, and those suites do not read that file.

Mutants were constructed ONLY with `python3 -I helpers/mkmut.py <catalog-TEXT> <empty-proposal-board> <id> <empty-mutant-board>`, each with a 60-second cap and one match. Then each used `BOARD=<mutant> node --import ../../runtime-encoding-shim.mjs tools/export-audit/focus-u37.mjs`, supervised with cap60. All use the final strengthened suite. No catch is a crash, timeout or scenario-never-ran.

| Proposed mutation | Exit | Duration | Result |
| --- | --- | --- | --- |
{chr(10).join(rows)}

Independent refusal review in `A2-review/`: 19 edge/preservation checks pass; Python zipfile/ElementTree independently parses 60 XML/rels parts in 10 accepted workbooks and checks exact cell/name/format values; four actual operated refusal routes record zero ZIP, Blob, anchor-click and storage-write counts. The old-writer literal `_x0041_` stays literal under the final reader. These are separate from the superseded codec review and its 90-part results. Native Office was not run.

Artifacts: this report, `PROPOSAL.patch`, `source-identities.json`, `mutation-ids.json`, `refusal-*-meta.json`, corresponding raw logs, and `A2-review/REVIEW.md`. Superseded encoder implementation and earlier diagnostic logs remain preserved separately. The preliminary refusal mutant-generator anchoring failure and the cold-flow harness mismatch are not counted as acceptance runs.

NOT DONE / LIMITS:

No branch/repository/editor checkout changes, commits, pushes, PRs or GitHub posts. No mutation sweep, full gate, full import suite, playwright install, populated-board return or real-budget/shared-folder access. B2/C1/C2/D1 were not started.

This is a sandbox proposal, not an integrated fix or release pass. XML well-formedness and exact board-reader/native XML parsing do not establish Excel/LibreOffice acceptance or real two-machine save behavior. The other 12 operated writer refusal routes were source-reviewed, not each dynamically driven with a bad string; all are reached through the same preflight and have immediate null guards. The new refusal deliberately blocks a workbook containing an OOXML-looking literal until that text is changed; nothing is silently normalized or discarded. Existing invalid older files are not repaired automatically. Other sheet-naming restrictions and truncation issues belong to A4/U42 and are not represented as fixed here.

QUESTIONS FOR BRAD:

None required to review this proposal. Adoption remains the lead's separate integration/review decision under the handoff rules.
'''
(r/'REPORT.md').write_text(text)
print('REPORT.md written',len(text),'characters',clock)
