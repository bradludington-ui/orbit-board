# A2 independent review — final refusal proposal

Base `7ee498a46507972f803cd48ce9f27d5d668acb63`, base board `fce8a391bd8a248d5185e199d22190c1687eaea0`.
First saved review snapshot 2026-10-13T12:19:28.647335-04:00; completed 2026-10-13T12:48:46.254413-04:00.

**Verdict: no must-fix identified in the final refusal proposal's reviewed scope.** This is a scoped sandbox proposal review, not a full gate, native Office acceptance, or permission to ship.

Final board blob `aa8f441f6b8d1d91ff213a57a025fdf608969801`; final proposed audit-recon blob `7be8b6e5aa19000b547ed2aa4ab76e5f471e3300`; mutate TEXT `db7a7a28b98cfd758bdd7008a3369cdeb691b92d`; boot `9c4f49ad8cec537097bdf485458cfd2a09b06594`. Product copied into my own `A2-review/refusal/`, source identities verified before accepting evidence.

## Reviewed behavior

The common preflight rejects XML 1.0-forbidden C0 units, U+FFFE/U+FFFF, lone high/low UTF-16 surrogates, and literal `_xHHHH_` spellings before ZIP construction. It names the workbook sheet/cell or metadata field and the offending unit/token. Valid surrogate pairs remain accepted. Workbook-only decimal character references preserve TAB/LF/CR in XML text and attributes.

The existing `_xunesc` and ordinary `_xesc` are byte-identical to base. No PPT code or decoder-format protocol was introduced. The first encoding proposal was superseded because old ORBIT `_x0041_` workbooks would silently read as `A`; final refusal preserves the old reader behavior and refuses new ambiguous output instead.

Source inspection verified all **16 buildXlsx call sites** immediately return on null before Blob/download/success status. IDS returns before persisting the chosen ORG. Runtime operation coverage is **four** exports: exportExcel, exportCSV, exportSrc and exportFlow. The remaining twelve caller routes were reviewed in source and were not each independently operated with refusal fixtures.

The notice now says no workbook was created and original text is kept. A cold exportFlow can still initialize the inherited `MS.flow.pseudo` and `MS.flow.subs` defaults. The final block separately documents that exact default-only delta and tests the displayed-panel path with raw full-state equality. It does not claim every cold export changes no internal key.

## Fresh independent checks

- `node --import ../runtime-encoding-shim.mjs refusal-probe.mjs`, cap120, 12:32:54–12:32:55 PM ET, **exit0, 1.118 s: 19 checks passed**. Literal expectations include $900/$200/$1100, valid astral extremes/pairs, mixed whitespace, C1/PUA, XML entity-looking text, invalid units/lone surrogates, overlapping escape spellings, and actual old-writer→final-reader `_x0041_` compatibility. Rejected values produced no ZIP/bytes, named the exact cell/reason and retained raw model state.
- `python3 -I refusal-parse-xml.py`, cap30, 12:33:29 PM ET, **exit0, 0.065 s**. Python zipfile + ElementTree independently parsed **60 XML/rels parts in 10 actual accepted workbooks** and verified parsed cell text/sheet name/custom-format text against literal originals, including TAB/LF/CR. No parser errors.
- `node --import ../runtime-encoding-shim.mjs operated-refusals.mjs`, cap120, 12:45:02–12:45:04 PM ET, **exit0, 2.096 s**. Four actual operated exports produced zero ZIPs, Blobs, anchor clicks or storage writes; their messages named the sheet/cell and U+000B; MS/S, DIRTY, save generation, base-dirty state and all localStorage values stayed equal; zero page errors. The fixture uses the real displayed funds-flow surface before exportFlow, which initializes its known defaults explicitly.

Task-local environment: Node v24.19.0, jsdom 27.0.0; the encoding shim supplies native TextEncoder/TextDecoder in jsdom. This differs from the lead's earlier Node22/jsdom27.4 environment and is not native Chromium/Office evidence.

## Inspected final builder evidence

Current 53-check block uses required async wrapper, two-space name, bootMark/bootRelease/settleBoards and explicit end marker. It parses actual ZIP XML/rels parts, counts six parts for its accepted one-sheet control and checks actual operated refusals. Expected money and text values are literals.

At the final strengthened suite: base **51 failures of 53** (the ordinary/no-page-error controls pass); fix **53/53 passed**, no harness exceptions. Raw focused logs/metadata are `A2/refusal-base-final-snapshots.*` and `A2/refusal-fix-final-snapshots.*`. Full audit-recon passed at the same final suite: cap240, 12:44:53–12:46:43 PM ET, **exit0, 110.357 s** (`refusal-audit-recon-final-snapshots.*`). Builder's affected other/PPT/Excel full-suite results are separate inspected artifacts, not my fresh executions.

All **11 final refusal mutants** have raw focused logs with exit1, protection-specific assertion counts **48,42,6,1,1,46,3,1,1,1,2**, no block-threw/never-ran/timeout. The exact per-ID ledger is `inspected-final-sensitivity.json`. Source inventory artifact reports **1,339/1,339 targets match once**; applicability is separate from those eleven observed catches. No mutate.mjs execution/import occurred.

## Limits and superseded evidence

- No full gate, full mutation sweep, native Chromium, Excel or PowerPoint application run. No held batch was started.
- Every old workbook's pre-existing external-OOXML decoding behavior remains unchanged. Refusing new literal escapes avoids adding ambiguity; it does not repair historical exports already interpreted differently by Office.
- Native workbook acceptance beyond XML well-formedness and exact board-reader/standards-parser strings is unproven. Existing sheet-name limits and spreadsheet format-language rules were not redesigned here.
- The 12 other refusal caller routes have source proof, not dedicated runtime refusal or mutation cases.
- Superseded encoding/reader draft runs are not acceptance evidence for this final variant. Initial independent encoding diagnostic had one reviewer empty-cell oracle error, corrected before its superseded rerun.
- Two extra operated diagnostics exited1 only because I closed jsdom before queued UI callbacks settled. They are retained as cleanup-failed, not passes. Flushing the callbacks while the page remained alive then closing it produced the passing final run with unchanged assertions. No product/tool change was made for that cleanup correction.
- The earlier parser-regex concern was a tool-output escaping misread, withdrawn after checking actual source bytes. Final tests now also assert the parsed part count.

All owned process groups have exited. No repository branches, commits, pushes, posts or external destinations were changed. No populated board file is returned.
