# Independent XLSX read

Completed 13 Oct 2026, 7:45:16 PM ET. Only runtime-generated XLSX artifacts were
read. No board program, ORBIT decoder, decoded JSON, arithmetic helper or mutation
program was imported or executed. No XLSX or populated board is a deliverable.

The standalone Python standard-library probe resolves worksheet relationships
from `workbook.xml` and its relationship part, parses every XML/rels part using
`ElementTree`, and reads numeric cells using exact `Decimal`. A formula cell is
refused rather than treating a cached value as independent proof.

The expected amounts are hand-written literals: USAF 900, ANG 200, AFRC 0 and
all services 1,100. Combination-label literals are `11111 / AAAAA` for K1,
`22222 / BBBBB` for the assigned `__none__` fixture, and
`— no RCN/EEIC assigned —` for the unassigned fixtures. Nothing in the exported
amounts or existing decoded logs supplies the expected values.

## Result

56 actual XLSX workbooks, 896 XML/rels parts parsed, 44 checks per workbook:

| Board | Actual workbooks | Passing checks | Failed checks | Workbooks with failures |
| --- | ---: | ---: | ---: | ---: |
| Base | 28 | 1,040 | 192 | 12 |
| Snapshot | 28 | 1,232 | 0 | 0 |

Every snapshot workbook matches the literal amounts in both the monthly rollup
and the requirement-detail service totals. Each funded service has exactly one
correctly named combination row. The Funding Streams and PMO Matrix agree with
the same literals. All other months are zero; the money is in December.

On the base, all twelve bad-registry workbooks fail 16 checks each: USAF/ANG
monthly and detail totals become 1,800/400, and all services become 2,200.
The ordinary controls pass all 704 checks on each board (16 workbooks each).

| Fixture class | Workbooks per board | Base passing/failed | Snapshot passing/failed |
| --- | ---: | ---: | ---: |
| Duplicate K1 | 4 | 112 / 64 | 176 / 0 |
| Reserved `__none__`, assigned | 4 | 112 / 64 | 176 / 0 |
| Reserved `__none__`, unassigned | 4 | 112 / 64 | 176 / 0 |
| Ordinary K1 | 8 | 352 / 0 | 352 / 0 |
| Ordinary key, no assignment | 8 | 352 / 0 | 352 / 0 |

Bad-list specimens cover direct open, saved-file reopen, full-board import then
saved-file reopen, and full-board import then browser-storage reopen. Ordinary
controls additionally cover one-appropriation import and several-board import,
each live and after saved-file reopen. The malformed-list one/several routes
produce no XLSX when the door refuses them; refusal behavior belongs to the
separate runtime probe and is not established by this parser.

## Command and accounting

```
python3 -I ../runner.py --cap 120 --cwd /workspace/orbit-round2-20261013-1331ET/B2 --log /workspace/orbit-round2-20261013-1331ET/B2/logs/xlsx-independent.log --meta /workspace/orbit-round2-20261013-1331ET/B2/logs/xlsx-independent-run.json -- python3 -I /workspace/orbit-round2-20261013-1331ET/B2/probes/xlsx-independent.py --runtime /workspace/orbit-round2-20261013-1331ET/B2/runtime-only --output /workspace/orbit-round2-20261013-1331ET/B2/logs/xlsx-independent-results.json
```

Final counted run: 7:45:15.493–7:45:16.093 PM ET, 0.600 s, cap 120 s, exit 1,
no timeout. Exit 1 is the aggregate diagnostic result because the base defects
are included; the snapshot has zero failed checks. The wrapper itself exits 0
after recording the child's exit 1. Each XLSX's filename, hash, byte length,
sheet names and all literal check outcomes are in `xlsx-independent-results.json`.

An earlier 0.566-second attempt is preserved under `xlsx-parser-attempt1-*`.
It incorrectly classified the all-services row as an AFRC combination row,
creating one parser-only failure per workbook. The counted probe ends the AFRC
section at its service-total row. That correction changes no amount or label
expectation; the first attempt is superseded and is not product evidence.

Probe SHA256:
`064268aa9cfdd410fead03f7c8705350f116fa554e8ec9fa6617bb0ea975d396`.

## Limits

This independently reads XLSX bytes from the separate runtime producer; it does
not open native Microsoft Excel or prove real shared-folder/two-machine behavior.
No unsupported export route or unnamed snapshot is covered. A workbook that was
not produced by the runtime probe is not inferred to pass.
