BATCH B1 | base 7ee498a46507972f803cd48ce9f27d5d668acb63 (snapshot u9-snapshot-20261013-1202, inputs bbe728556dc394c50d84ad9a09facc5fa163e42b) | started 13 Oct 2026 12:15:27 PM ET / finished 12:21:30 PM ET

FINDINGS: All expected money in both snapshot blocks derives correctly from its typed fixtures, using exact integer quotient/remainder arithmetic and the stated existing sequential lane rule. No figure was unaccounted for or derived differently. The tie rule agrees with apportion(): floor shares, largest exact remainder first, equal remainders to the earlier index. First occurrence of each office in the CLIN list supplies that index; multiple CLIN asks belonging to one office are added up.

Reproduced all 51 defect assertions on the base and all 89 passing assertions on the snapshot. The first block has 65 checks: 36 fail before, all 65 pass after, and 29 controls pass both. The every-export block has 24: 15 fail before, all 24 pass after, and 9 controls pass both. No crash, timeout or scenario-never-ran was counted. Examples: base USAF $3 at1:2:3 gives MxS/AV/TSS $0/$1/$2 instead of literal$1/$1/$1; STOVL $250000000 gives624983/100624981/148750036 instead of624982/100624982/148750036; budget-half case gives440918277/287699461/50535683 instead of440918277/287699462/50535682. The draft matches every literal.

The full hand derivation, every office/service/lane total, Source amount, plan amount and formatting expectation is in [arithmetic-ledger.md](arithmetic-ledger.md). [check-ledger.md](check-ledger.md) maps all89 assertions to those derivations and both observed outcomes. [arithmetic.json](logs/arithmetic.json.txt) records the independent exact divisions; [oracle.py](probes/oracle.py) imports no board or ORBIT helper.

PROPOSAL: No corrective patch is needed for B1's arithmetic remit. The supplied three-diff snapshot is reproduced unchanged in [snapshot-against-base.patch](snapshot-against-base.diff), a unified diff against the specified base.

- Board: pass raw office CLIN weights to integer apportioning; retain fractions only for fractional modelled-plan scaling.
- audit-recon: append the two source-identical, literal-based blocks,65+24checks, covering A–G.
- mutate.mjs TEXT: append21 U9 targets; no catalog execution/import.

Confirmed applied blobs: board46e522a8370f05971c8ef0558c3c666b0953b0ac; audit-recon755647cc1340cd2d9ed2b8a78b58f29df4b98b34; catalog8fd34e940548e009efb812021792d8667c91fc54. All match SNAPSHOT.txt exactly. Source changes are confined to own disposable B1 copies; all branches are read-only.

RUNS: Node24.19.0/jsdom27.0.0, native TextEncoder/TextDecoder supplied by the task-local encoding adapter. The original product/tool source is unmodified; the focused driver copies the exact two blocks, helper definitions and scenario-ran guard. [extraction-receipt.json](logs/extraction-receipt.json.txt) records exact-block identity. All run records are Eastern and every recorded process group exited.

| Command (from batch root unless stated) | Exit | Time | Cap | Result |
|---|---:|---:|---:|---|
| `python3 runner.py --cap 60 --cwd B1/draft --log B1/apply.log --meta B1/apply-meta.json -- git apply ../../inputs/u9-snapshot-20261013-1202/board.diff ../../inputs/u9-snapshot-20261013-1202/audit-recon.diff ../../inputs/u9-snapshot-20261013-1202/mutate.TEXT.diff` |0|0.033s|60s|three diffs apply; exact declared hashes|
| `python3 runner.py --cap 180 --cwd B1/draft --log B1/base-focused.log --meta B1/base-focused-meta.json -- env BOARD=<B1/base/prioritization-board-grid.html> SUITE_CHECKS=<B1/base-checks.jsonl> node --import <batch-root/runtime-encoding-shim.mjs> tools/export-audit/focused-u9.mjs` |1|2.844s|180s|89ran;51defect fails;38controls pass|
| Same focused command, `BOARD=<B1/draft/prioritization-board-grid.html>` and `SUITE_CHECKS=<B1/draft-checks.jsonl>`; draft log/meta |0|4.698s|180s|89/89pass; ALL CHECKS PASSED|
| `python3 runner.py --cap 60 --cwd B1/draft --log B1/mcount.log --meta B1/mcount-meta.json -- python3 -I ../../helpers/mcount.py tools/export-audit/mutate.mjs prioritization-board-grid.html` |0|1.374s|60s|1349entries;1349matchonce;0missing/multiple/unparsed|
| `python3 runner.py --cap 30 --cwd B1 --log B1/oracle.log --meta B1/oracle-meta.json -- python3 -I oracle.py` |0|0.033s|30s|all independently transcribed literals verified|

Exact absolute commands, start/end clocks, caps, logs and exits are in the corresponding `*-meta.json` files. Base-focused ran12:16:21–12:16:24PM ET; draft12:16:48–12:16:53PM ET; mcount12:16:53–12:16:54PM ET. The templates remain empty; synthetic requirements existed only at runtime. No populated board is returned.

NOT DONE / LIMITS: Focused blocks only; no full audit-recon, other suites, mutation runs, native Chromium/Excel/PowerPoint acceptance or release gate. Workbook checks read generated XLSX bytes back through the board reader. Deck assertions capture the actual generated Funding-by-PMO table rows before XML generation; they do not inspect PPTX bytes or native PowerPoint. Applicability1349/1349 is not evidence that1349mutants are caught. The existing discrepancy between separately apportioned Spend Plan Source lane/CLIN lines and sequential by-office ask/lane allocations remains outside B1; source/office totals agree for the selected control fixtures, not all possible fixtures. No new policy choice was made, no full gate pass or release readiness claimed. B2/C1/C2/D1 were not started.

QUESTIONS FOR BRAD: None for B1. All arithmetic follows the snapshot's declared rule; no expected literal requires a policy decision.

DELIVERY APPENDIX — self-contained arithmetic and snapshot text

These are the same completed B1 derivations and unchanged supplied patches; no additional test or held batch was run.

Hand arithmetic ledger:

Independent arithmetic for snapshot u9-snapshot-20261013-1202

All expected money in both focused source blocks was recomputed from the fixture inputs before judging the observed board values. Python integer quotient/remainder calculations independently cross-checked the hand calculations; they never import or call an ORBIT helper. `arithmetic.json` contains every division's integer numerator-derived quotient, exact remainder, denominator and awarded index. `check-ledger.md` maps all 89 assertions to the fixture/surface below.

The whole-dollar rule is q_i = floor(T*w_i / sum(w)); r_i = (T*w_i) mod sum(w). Allocate T - sum(q_i) single dollars to descending r_i, breaking equal remainders toward the earlier index. By source inspection, apportion() sorts ties by a.i-b.i; pmoSharesOf's office object retains first-CLIN insertion order. An office holding several CLINs weighs their asks added up and ranks by its first CLIN. The snapshot changes weights, not apportion(). In the sequential lane rule, first divide the full ask, then discretionary by the remaining office ask, then mandatory by the remaining office ask; unfunded is what remains. The $3/$3/$3 example below explicitly uses that existing rule, not independent lane splitting.

A: office order MxS / AV / TSS / PRIMES. Every draw is discretionary.

| Service | Draw | Weights | Floors | Exact remainder numerators / denominator | Dollar(s) added | Expected |
|---|---:|---|---|---|---|---|
| USAF | 3 | 1,2,3,0 | 0,1,1,0 | 3,0,3,0 / 6 | MxS | 1,1,1,0 |
| ANG | 9 | 1,2,3,0 | 1,3,4,0 | 3,0,3,0 / 6 | MxS | 2,3,4,0 |
| AFRC | 999999999 | 1,2,3,0 | 166666666,333333333,499999999,0 | 3,0,3,0 / 6 | MxS | 166666667,333333333,499999999,0 |
| STOVL | 250000000 | 1499958,241499956,357000087,0 | 624982,100624981,148750036,0 | 299375018,299375019,1249964,0 / 600000001 | AV, remainder larger by 1 | 624982,100624982,148750036,0 |
| USMC-C | 3 | 1,1,1,3 | 0,0,0,1 | 3,3,3,3 / 6 | MxS, then AV | 1,1,0,1 |
| USN | 3 | 1,0,2,3 | 0,0,1,1 | 3,0,0,3 / 6 | MxS | 1,0,1,1 |
| CV | 5 | Uncovered; own office PRIMES | 0,0,0,5 | 0 | none | 0,0,0,5 |

Office vectors in service order USAF, ANG, AFRC, STOVL, USMC-C, USN, CV:

- MxS: [1,2,166666667,624982,1,1,0], sum 167291654.
- AV: [1,3,333333333,100624982,1,0,0], sum 433958320.
- TSS: [1,4,499999999,148750036,0,1,0], sum 648750041.
- PRIMES: [0,0,0,0,1,1,5], sum 7.

All mandatory/unfunded amounts are zero. Ask equals discretionary in each office; portfolio sum = 1250000022. With no awards, each forecast month is zero, UNSCHEDULED and TOTAL both equal the office sum. CR windows are zero and No date equals the same sum. Panel row amounts render `$n`, zero per-service cells `—`, total mandatory `$0`, unstarred MC `—`. PMO report rows are [office sum, office sum,0] followed by each office's discretionary vector and seven mandatory zeroes. Source totals by CLIN are 0010=167291654, 0002=433958320, 0008=648750041, 0001=2 (USMC-C1 + USN1); no CLIN=5 for CV. These cover checks 1–34.

B: order TSS / AV / MxS / PRIMES; weights 1,2,3,0 on covered services.

- USAF ask3, disc3: [1,1,1,0]; mandatory/unfunded zero.
- ANG ask5, disc5: exact shares 5/6,10/6,15/6; floors[0,1,2,0], remainders[5,4,3,0]/6; two spare dollars to TSS then AV -> [1,2,2,0].
- AFRC ask9: [2,3,4,0]. Disc3 over remaining asks2,3,4,0: floors[0,1,1,0], remainders[6,0,3,0]/9, spare to TSS -> [1,1,1,0]. Remaining[1,2,3,0]. Mand3 over that: floors[0,1,1,0], remainders[3,0,3,0]/6, spare to TSS -> [1,1,1,0]. Unfunded[0,1,2,0]; MC short=ask-disc=[1,2,3,0].
- STOVL no CLIN covers ask7: PRIMES7 discretionary; all other parts zero.
- USMC-C ask100, disc100: floors[16,33,50,0], remainders[4,2,0,0]/6; spare to TSS -> [17,33,50,0].

| Office | Disc service vector (USAF,ANG,AFRC,STOVL,USMC-C) | Mand vector | Ask | Disc | Mand | Funded | Unfunded | MC short |
|---|---|---|---:|---:|---:|---:|---:|---:|
| TSS | 1,1,1,0,17 | 0,0,1,0,0 | 21 | 20 | 1 | 21 | 0 | 1 |
| AV | 1,2,1,0,33 | 0,0,1,0,0 | 39 | 37 | 1 | 38 | 1 | 2 |
| MxS | 1,2,1,0,50 | 0,0,1,0,0 | 57 | 54 | 1 | 55 | 2 | 3 |
| PRIMES | 0,0,0,7,0 | 0,0,0,0,0 | 7 | 7 | 0 | 7 | 0 | 0 |

Portfolio ask124 = disc118 + mand3 + unfunded3. Panel/matrix service cells come from these vectors, with their literal formatting. Matrix MC requirement is Ask and MC short is the final column. Report rows are [Ask,Disc,Unfunded]+disc vector+mand vector. Forecast per service = disc+mand; whole forecast and exported UNSCHEDULED/TOTAL are 21,38,55,7 with 12 zero months. CR has zero windows, No date same funded totals. The Source separately divides the actual disc and mand lane amounts by CLIN weights; here the lane results coincide: 0008=21,0002=38,0010=55,no CLIN=7. These cover checks 35–62.

C: modelled fractional control, not the stored money model. Base fixture ask12, disc12, CLIN weights1,2,3. Plan amount10.50 =21/2; fractions1/6,2/6,3/6 yield7/4=1.75,7/2=3.50,21/4=5.25 for MxS/AV/TSS. Mandatory zero; unplaced forecast carries those same amounts. Check values use cents and strings 1.75,3.5,5.25. Checks 63–65 all controls.

D: MxS / AV / TSS; weights1,2,3 on all three services. USAF disc3 ->[1,1,1]; ANG disc9->[2,3,4]; AFRC mand3->[1,1,1], with zero discretionary. These repeat A's exact divisions. Disc vectors MxS[1,2,0],AV[1,3,0],TSS[1,4,0]; mandatory all[0,0,1].

- Matrix service lane pairs are [[1,0],[2,0],[0,1]], [[1,0],[3,0],[0,1]], [[1,0],[4,0],[0,1]].
- CE and deck [Ask,Disc,Mand,U] are [4,3,1,0], [5,4,1,0], [6,5,1,0]; deck zero U prints `—`.
- Disc portion rows [amount,USAF,ANG,AFRC]: [3,1,2,0],[4,1,3,0],[5,1,4,0]. All Mand portion rows [1,0,0,1].
- Two-Plan totals [A discretionary-only,B both]: [3,4],[4,5],[5,6]. Whole portfolio A12/B15.
- Source0010=4,0002=5,0008=6.

These cover checks 66–75.

E: CLIN order0002[1],0010[1],0102[1],0008[3],0110[0]. AV weighs2 and ranks first, MxS1 second, TSS3 third. Ask/disc3 gives floors[1,0,1], remainders[0,3,3]/6; spare to MxS ->[1,1,1]. Source CLIN weights1,1,1,3,0 give floors0,0,0,1,0 and remainders3,3,3,3,0 /6; two spare dollars go0002 then0010 ->[1,1,0,1,0]. Positive source rows0010=1,0002=1,0008=1, with0102/0110 omitted because zero. The office groups therefore coincide in this fixture. Checks 76–79.

F: MxS / AV / TSS, starred. USAF ask9 gives[2,3,4]. Disc3 by those capacities gives[1,1,1], then Mand3 by remaining[1,2,3] gives[1,1,1], leavingU[0,1,2]. ANG ask3 gives[1,1,1] with no draw, all U. All totals:

| Office | Ask per service | Unfunded per service | Ask/MC req | Disc | Mand | Unfunded | MC short |
|---|---|---|---:|---:|---:|---:|---:|
| MxS | 2,1 | 0,1 | 3 | 1 | 1 | 1 | 2 |
| AV | 3,1 | 1,1 | 4 | 1 | 1 | 2 | 3 |
| TSS | 4,1 | 2,1 | 5 | 1 | 1 | 3 | 4 |

PMO tab memo/U rows [total,USAF,ANG] are [[3,2,1],[1,0,1]], [[4,3,1],[2,1,1]], [[5,4,1],[3,2,1]]. CE [Ask,MC req,MC short,U] are[3,3,2,1],[4,4,3,2],[5,5,4,3]. Deck [U,MC req,MC short] is[1,3,2],[2,4,3],[3,5,4], printed whole dollars. Matrix [Disc,Mand,MC req,MC short] is[1,1,3,2],[1,1,4,3],[1,1,5,4]. Panel [USAFDisc,USAFMand,ANGDisc,ANGMand,totalDisc,totalMand,MC] is[1,1,0,0,1,1,2], [1,1,0,0,1,1,3], [1,1,0,0,1,1,4], with zero service cells `—`. Checks 80–85.

G: weights881836554,575398923,101071365 sum1558306842; total779153421 is half. Exact shares440918277,287699461.5,50535682.5. Floors440918277,287699461,50535682; remainders0,779153421,779153421 /1558306842; one dollar to earlier AV. Expected MxS440918277,AV287699462,TSS50535682, sum779153421. Matrix, forecast and Source positive CLIN rows0010/0002/0008 all use these. Checks86–89.

Every assertion's monetary figure is accounted for above. Non-money assertions (`true`, CLIN order, workbook sheets present, `ok`, own-office list and formatting) follow fixture setup or healthy artifact controls. None required guessing. No alternate arithmetic found; no expected value changed.


Assertion-by-assertion ledger:

| Check | Fixture / operated surface | Control | Base | Draft | Arithmetic source |
|---|---|---|---|---|---|
| 1 | A · fixture | yes | pass | pass | Fixture identity / data directly typed |
| 2 | A · the rule | yes | pass | pass | Arithmetic ledger A |
| 3 | A · the PMO panel · USAF | no | fail | pass | Arithmetic ledger A |
| 4 | A · the PMO panel · ANG | no | fail | pass | Arithmetic ledger A |
| 5 | A · the PMO panel · AFRC | no | fail | pass | Arithmetic ledger A |
| 6 | A · the PMO panel · STOVL | no | fail | pass | Arithmetic ledger A |
| 7 | A · the PMO panel · USMC-C | no | fail | pass | Arithmetic ledger A |
| 8 | A · the PMO panel · USN | no | fail | pass | Arithmetic ledger A |
| 9 | A · the PMO panel · CV | yes | pass | pass | Arithmetic ledger A |
| 10 | A · the PMO panel · TOTAL | no | fail | pass | Arithmetic ledger A |
| 11 | A · the PMO panel · TOTAL | yes | pass | pass | Arithmetic ledger A |
| 12 | A · the forecast · USAF alone | no | fail | pass | Arithmetic ledger A |
| 13 | A · the forecast · ANG alone | no | fail | pass | Arithmetic ledger A |
| 14 | A · the forecast · AFRC alone | no | fail | pass | Arithmetic ledger A |
| 15 | A · the forecast · STOVL alone | no | fail | pass | Arithmetic ledger A |
| 16 | A · the forecast · USMC-C alone | no | fail | pass | Arithmetic ledger A |
| 17 | A · the forecast · USN alone | no | fail | pass | Arithmetic ledger A |
| 18 | A · the forecast · CV alone | yes | pass | pass | Arithmetic ledger A |
| 19 | A · the forecast · whole portfolio | no | fail | pass | Arithmetic ledger A |
| 20 | A · the exported forecast | yes | pass | pass | Build/read-back control |
| 21 | A · the exported forecast | no | fail | pass | Arithmetic ledger A |
| 22 | A · the PMO Matrix | yes | pass | pass | Build/read-back control |
| 23 | A · the PMO Matrix · USAF | no | fail | pass | Arithmetic ledger A |
| 24 | A · the PMO Matrix · ANG | no | fail | pass | Arithmetic ledger A |
| 25 | A · the PMO Matrix · AFRC | no | fail | pass | Arithmetic ledger A |
| 26 | A · the PMO Matrix · STOVL | no | fail | pass | Arithmetic ledger A |
| 27 | A · the PMO Matrix · USMC-C | no | fail | pass | Arithmetic ledger A |
| 28 | A · the PMO Matrix · USN | no | fail | pass | Arithmetic ledger A |
| 29 | A · the PMO Matrix · CV | yes | pass | pass | Arithmetic ledger A |
| 30 | A · the PMO Matrix · TOTAL | no | fail | pass | Arithmetic ledger A |
| 31 | A · the PMO tabs | no | fail | pass | Arithmetic ledger A |
| 32 | A · the CR view by PMO | no | fail | pass | Arithmetic ledger A |
| 33 | A · the Spend Plan Source | yes | pass | pass | Build/read-back control |
| 34 | A · the Spend Plan Source | yes | pass | pass | Arithmetic ledger A |
| 35 | B · fixture | yes | pass | pass | Fixture identity / data directly typed |
| 36 | B · the rule | yes | pass | pass | Arithmetic ledger B |
| 37 | B · the rule | yes | pass | pass | Arithmetic ledger B |
| 38 | B · the PMO panel · USAF | no | fail | pass | Arithmetic ledger B |
| 39 | B · the PMO panel · ANG | yes | pass | pass | Arithmetic ledger B |
| 40 | B · the PMO panel · AFRC | no | fail | pass | Arithmetic ledger B |
| 41 | B · the PMO panel · STOVL | yes | pass | pass | Arithmetic ledger B |
| 42 | B · the PMO panel · USMC-C | yes | pass | pass | Arithmetic ledger B |
| 43 | B · the PMO panel · TOTAL | no | fail | pass | Arithmetic ledger B |
| 44 | B · the forecast · USAF alone | no | fail | pass | Arithmetic ledger B |
| 45 | B · the forecast · ANG alone | yes | pass | pass | Arithmetic ledger B |
| 46 | B · the forecast · AFRC alone | no | fail | pass | Arithmetic ledger B |
| 47 | B · the forecast · STOVL alone | yes | pass | pass | Arithmetic ledger B |
| 48 | B · the forecast · USMC-C alone | yes | pass | pass | Arithmetic ledger B |
| 49 | B · the forecast · whole portfolio | no | fail | pass | Arithmetic ledger B |
| 50 | B · the exported forecast | yes | pass | pass | Build/read-back control |
| 51 | B · the exported forecast | no | fail | pass | Arithmetic ledger B |
| 52 | B · the PMO Matrix | yes | pass | pass | Build/read-back control |
| 53 | B · the PMO Matrix · USAF | no | fail | pass | Arithmetic ledger B |
| 54 | B · the PMO Matrix · ANG | yes | pass | pass | Arithmetic ledger B |
| 55 | B · the PMO Matrix · AFRC | no | fail | pass | Arithmetic ledger B |
| 56 | B · the PMO Matrix · STOVL | yes | pass | pass | Arithmetic ledger B |
| 57 | B · the PMO Matrix · USMC-C | yes | pass | pass | Arithmetic ledger B |
| 58 | B · the PMO Matrix · TOTAL and MC | no | fail | pass | Arithmetic ledger B |
| 59 | B · the PMO tabs | no | fail | pass | Arithmetic ledger B |
| 60 | B · the CR view by PMO | no | fail | pass | Arithmetic ledger B |
| 61 | B · the Spend Plan Source | yes | pass | pass | Build/read-back control |
| 62 | B · the Spend Plan Source | yes | pass | pass | Arithmetic ledger B |
| 63 | C · fixture | yes | pass | pass | Fixture identity / data directly typed |
| 64 | C · the forecast of a modelled plan | yes | pass | pass | Arithmetic ledger C |
| 65 | C · each office’s part of a modelled plan | yes | pass | pass | Arithmetic ledger C |
| 66 | D · fixture | yes | pass | pass | Fixture identity / data directly typed |
| 67 | D · the rule | yes | pass | pass | Arithmetic ledger D |
| 68 | D · the workbook | yes | pass | pass | Build/read-back control |
| 69 | D · the PMO Matrix | no | fail | pass | Arithmetic ledger D |
| 70 | D · CE by PMO | no | fail | pass | Arithmetic ledger D |
| 71 | D · the PMO tabs by portion | no | fail | pass | Arithmetic ledger D |
| 72 | D · the PMO tabs by portion | no | fail | pass | Arithmetic ledger D |
| 73 | D · the Two-Plan Forecast · BY PMO | no | fail | pass | Arithmetic ledger D |
| 74 | D · the deck · Funding by PMO | no | fail | pass | Arithmetic ledger D |
| 75 | D · the Spend Plan Source | yes | pass | pass | Arithmetic ledger D |
| 76 | E · fixture | yes | pass | pass | Fixture identity / data directly typed |
| 77 | E · the PMO Matrix | no | fail | pass | Arithmetic ledger E |
| 78 | E · the forecast | no | fail | pass | Arithmetic ledger E |
| 79 | E · the Spend Plan Source | yes | pass | pass | Arithmetic ledger E |
| 80 | F · fixture | yes | pass | pass | Fixture identity / data directly typed |
| 81 | F · the PMO tabs by portion | no | fail | pass | Arithmetic ledger F |
| 82 | F · CE by PMO | no | fail | pass | Arithmetic ledger F |
| 83 | F · the deck · Funding by PMO | no | fail | pass | Arithmetic ledger F |
| 84 | F · the PMO Matrix | no | fail | pass | Arithmetic ledger F |
| 85 | F · the PMO panel | no | fail | pass | Arithmetic ledger F |
| 86 | G · fixture | yes | pass | pass | Fixture identity / data directly typed |
| 87 | G · the PMO Matrix | no | fail | pass | Arithmetic ledger G |
| 88 | G · the forecast | no | fail | pass | Arithmetic ledger G |
| 89 | G · the Spend Plan Source | yes | pass | pass | Arithmetic ledger G |


Literal executed commands (bounded metadata records):

- CWD `B1/draft`; `git apply ../../inputs/u9-snapshot-20261013-1202/board.diff ../../inputs/u9-snapshot-20261013-1202/audit-recon.diff ../../inputs/u9-snapshot-20261013-1202/mutate.TEXT.diff`; exit 0; 0.033 s; cap 60.0 s; 2026-10-13T12:15:27.869733-04:00 to 2026-10-13T12:15:27.902087-04:00.
- CWD `B1/draft`; `env BOARD=/workspace/orbit-codex-batches-20261013-1205ET/B1/base/prioritization-board-grid.html SUITE_CHECKS=/workspace/orbit-codex-batches-20261013-1205ET/B1/base-checks.jsonl node --import /workspace/orbit-codex-batches-20261013-1205ET/runtime-encoding-shim.mjs tools/export-audit/focused-u9.mjs`; exit 1; 2.844 s; cap 180.0 s; 2026-10-13T12:16:21.210212-04:00 to 2026-10-13T12:16:24.054030-04:00.
- CWD `B1/draft`; `env BOARD=/workspace/orbit-codex-batches-20261013-1205ET/B1/draft/prioritization-board-grid.html SUITE_CHECKS=/workspace/orbit-codex-batches-20261013-1205ET/B1/draft-checks.jsonl node --import /workspace/orbit-codex-batches-20261013-1205ET/runtime-encoding-shim.mjs tools/export-audit/focused-u9.mjs`; exit 0; 4.698 s; cap 180.0 s; 2026-10-13T12:16:48.650582-04:00 to 2026-10-13T12:16:53.347850-04:00.
- CWD `B1/draft`; `python3 -I ../../helpers/mcount.py tools/export-audit/mutate.mjs prioritization-board-grid.html`; exit 0; 1.374 s; cap 60.0 s; 2026-10-13T12:16:53.380601-04:00 to 2026-10-13T12:16:54.754034-04:00.
- CWD `B1`; `python3 -I oracle.py`; exit 0; 0.033 s; cap 30.0 s; 2026-10-13T12:18:21.528972-04:00 to 2026-10-13T12:18:21.561375-04:00.

Unchanged supplied unified diff against the stated base:

```diff
diff --git a/prioritization-board-grid.html b/prioritization-board-grid.html
index fce8a39..46e522a 100644
--- a/prioritization-board-grid.html
+++ b/prioritization-board-grid.html
@@ -11434,6 +11434,12 @@ function pmoSharesOf(it){
       if(row) gap.forEach((v,i)=>{ if(v) row[1][i]=1; });
       else out.push([own, gap]);
     }
+    // v2.00 (U9): AND THE WEIGHTS THEMSELVES, third: each office's own CLIN asks on a service the CLINs cover, and on one
+    // they do not, its fraction (1 for the requirement's own office, 0 for the rest). apportion() splits by these; the
+    // fractions only scale an amount that is not whole dollars. Split by the fractions, a tie went to the wrong office:
+    // 1/6, 2/6 and 3/6 in floating point are not exactly 1 : 2 : 3, so $3 at 1 : 2 : 3 was $0/$1/$2 on the panel, the
+    // forecast and the PMO Matrix, where the exact rule -- and the CLIN source workbook -- gives $1/$1/$1.
+    out.forEach(r=>r.push(r[1].map((f,i)=>(tot[i]>0 && bag[r[0]])? bag[r[0]][i] : f)));
     return out.length? out : [[grpOf(it),null]];
   }
   return [[grpOf(it),null]];
@@ -11463,16 +11469,19 @@ function pmoSplit(w, parts, tgt){
 function pmoPartsOf(it, p){
   const sh=pmoSharesOf(it), one=(sh.length===1 && !sh[0][1]);
   const P=sh.map(function(x){ return {g:x[0], frac:x[1], ask:[], d:[], m:[], u:[], mcs:[], land:null}; });
-  const wOf=i=> sh.map(function(x){ return x[1]? (+x[1][i]||0) : 1; });
+  // v2.00 (U9): wOf is what apportion() splits by -- the offices' own CLIN asks (pmoSharesOf's third entry), exact --
+  // and fOf the fraction an amount that is not whole dollars is scaled by
+  const wOf=i=> sh.map(function(x){ return x[2]? (+x[2][i]||0) : x[1]? (+x[1][i]||0) : 1; });
+  const fOf=i=> sh.map(function(x){ return x[1]? (+x[1][i]||0) : 1; });
   const lane=(i, k)=> (p && +p[k][i]) || 0;
   const whole=[];
   SVC.forEach(function(s, i){
-    const a=+((it.ask||[])[i])||0, d=lane(i,'d'), m=lane(i,'m'), w=wOf(i);
+    const a=+((it.ask||[])[i])||0, d=lane(i,'d'), m=lane(i,'m'), w=wOf(i), fr=fOf(i);
     whole[i]=!one && [a,d,m].every(Number.isInteger) && a>=d+m;
     if(whole[i]){
       const X=pmoSplit(w, [d, m, a-d-m]);
       P.forEach(function(o,k){ o.d[i]=X[0][k]; o.m[i]=X[1][k]; o.u[i]=X[2][k]; o.ask[i]=X[0][k]+X[1][k]+X[2][k]; o.mcs[i]=X[1][k]+X[2][k]; });
-    } else P.forEach(function(o,k){ const f=one? 1 : w[k];
+    } else P.forEach(function(o,k){ const f=one? 1 : fr[k];
       o.d[i]=d*f; o.m[i]=m*f; o.u[i]=Math.max(0, a-d-m)*f; o.ask[i]=a*f; o.mcs[i]=Math.max(0, a-d)*f; });
   });
   const memo={};
@@ -11484,7 +11493,7 @@ function pmoPartsOf(it, p){
     const L=landSvc(aw, i, d, m, literal), q=L.at.length;
     const dc=L.at.map(function(x){ return x.dv; }).concat([L.ud]), mc=L.at.map(function(x){ return x.mv; }).concat([L.um]);
     if(!whole[i] || !dc.concat(mc).every(Number.isInteger))
-      return (memo[key]=w.map(function(f){ return landSvc(aw, i, d, m, literal, f); }));
+      return (memo[key]=fOf(i).map(function(f){ return landSvc(aw, i, d, m, literal, f); }));
     const D=pmoSplit(w, dc, P.map(function(o){ return o.d[i]; })), M=pmoSplit(w, mc, P.map(function(o){ return o.m[i]; }));
     return (memo[key]=P.map(function(o,k){ return {
       at:L.at.map(function(x,j){ return {d:x.d, day:x.day, j:x.j, dv:D[j][k], mv:M[j][k]}; }).filter(function(x){ return x.dv>0 || x.mv>0; }),
diff --git a/tools/export-audit/audit-recon.mjs b/tools/export-audit/audit-recon.mjs
index 529e36f..755647c 100644
--- a/tools/export-audit/audit-recon.mjs
+++ b/tools/export-audit/audit-recon.mjs
@@ -5123,6 +5123,405 @@ await (async () => {
   await settleBoards();
 })();
 // ==== end v2.00 (U14) ====
+// ==== v2.00 (U9): the PMO split is exact, ties to the first office, and the same on the panel, the forecast and the PMO Matrix ====
+// A CLIN-split prime (PRIME-3) is shared, service by service and in whole dollars, across the offices that own its CLINs (…10
+// MxS, …2 AV, …8 TSS, anything else PRIMES); a service no CLIN covers stays with the requirement's own office (PRIMES). THE
+// RULE is the one the CLIN source workbook (the Spend Plan Source: srcRowsOf -> clinSplit -> apportion) splits by: largest
+// remainder, worked exactly in integers -- floor every share, then a dollar each to the largest remainders, EQUAL REMAINDERS
+// TO THE EARLIER ONE IN THE CLIN LIST (an office ranks by its first CLIN). Every figure below is worked by hand from that rule
+// and written here as it is; nothing asks the board what to expect.
+// BOARD A, CLINs 0010 / 0002 / 0008 / 0001 -- MxS, AV, TSS, PRIMES, in that order -- every dollar discretionary:
+//   USAF   $3 at 1 : 2 : 3 : 0 (the review's): .5 / 1 / 1.5 -> 0/1/1, the tied dollar to MxS                    = 1/1/1/0
+//   ANG    $9 at 1 : 2 : 3 : 0 (the review's): 1.5 / 3 / 4.5 -> 1/3/4, MxS                                      = 2/3/4/0
+//   AFRC   $999,999,999 at 1 : 2 : 3 : 0: 166,666,666.5 / 333,333,333 / 499,999,999.5, MxS  = 166,666,667 / 333,333,333 / 499,999,999 / 0
+//   STOVL  $250,000,000 at 1,499,958 : 241,499,956 : 357,000,087 : 0 (of 600,000,001): remainders 299,375,018 / 299,375,019 /
+//          1,249,964 -- one apart, not a tie -- so the one dollar left is AV's               = 624,982 / 100,624,982 / 148,750,036 / 0
+//   USMC-C $3 at 1 : 1 : 1 : 3, four offices: .5 / .5 / .5 / 1.5, two dollars left, MxS and AV                  = 1/1/0/1
+//   USN    $3 at 1 : 0 : 2 : 3, AV's share nothing: .5 / 0 / 1 / 1.5, MxS                                        = 1/0/1/1
+//   CV     $5, no CLIN covers it (CONTROL)                                                                    = 0/0/0/5
+// BOARD B, CLINs 0008 / 0002 / 0010 -- TSS, AV, MxS: a tie goes to TSS first, where the office list and the alphabet (AV, MxS,
+// TSS) would not put it; PRIME-3 is starred, so the PMO Matrix carries each office's ask and what it is short.
+//   USAF   $3 at 1 : 2 : 3: the tie of TSS's .5 and MxS's 1.5 is TSS's                                           = 1/1/1
+//   ANG    $5 at 1 : 2 : 3: .83 / 1.67 / 2.5 -> 0/1/2, TSS and AV (CONTROL: no tie)                               = 1/2/2
+//   AFRC   $9 asked, $3 discretionary, $3 mandatory, $3 unfunded, at 1 : 2 : 3: the asks 1.5 / 3 / 4.5 -> 2/3/4 (TSS);
+//          discretionary by what each still has to take, 3 at 2 : 3 : 4 = .67 / 1 / 1.33 -> 1/1/1 (TSS); mandatory 3 at
+//          1 : 2 : 3 -> 1/1/1 (TSS); unfunded 0/1/2
+//   STOVL  $7, no CLIN covers it: all PRIMES (CONTROL)
+//   USMC-C $100 at 1 : 2 : 3: 16.67 / 33.33 / 50 -> 16/33/50, TSS (CONTROL)                                        = 17/33/50
+//   Each office, all five: TSS 20 + 1 mandatory, ask 21, short 1; AV 37 + 1, ask 39, short 2; MxS 54 + 1, ask 57, short 3;
+//   PRIMES 7, ask 7, short 0.
+// BOARD C (CONTROL): an amount that is not whole dollars -- which only a modelled plan brings (the Two-Plan Forecast hands the
+// forecast its plan; the lane walk draws whole dollars) -- stays each office's fraction of it, as before: $10.50 at 1 : 2 : 3
+// (MxS, AV, TSS) is $1.75 / $3.50 / $5.25, placed by the forecast and as each office's own part of the plan.
+// Each is read where a person reads it: the PMO funding panel as drawn (every cell of every office, every service, both
+// lanes, the totals and the MC column), the forecast (each service alone, the whole portfolio, and the exported view), the
+// PMO Matrix read back from the workbook's bytes (every office, service and lane, the totals, and B's MC memo), each office's
+// own PMO tab in the same workbook (its report row for PRIME-3: the ask, the discretionary, the unfunded, every service's Disc
+// and Mand), the CR cash view by PMO (no award dates, so every funded dollar is in its No date), and the rule's own source,
+// the Spend Plan Source's CLIN lines, read back from its bytes.
+// FAILS ON 7ee498a (board fce8a391), except the CONTROLs: the offices were split by their fractions of each service, 1/6, 2/6
+// and 3/6, which floating point does not hold at exactly 1 : 2 : 3, so a tie went to the last office and STOVL's dollar to
+// MxS -- USAF 0/1/2, ANG 1/3/5, AFRC 166,666,666 / 333,333,333 / 500,000,000, STOVL 624,983 / 100,624,981 / 148,750,036,
+// USMC-C 1/0/0/2, USN 0/0/1/2; on B, USAF 0/1/2 and AFRC's discretionary 0/1/2 -- on the panel, the forecast, the PMO
+// Matrix, the PMO tabs and the CR view alike, while the Spend Plan Source split exactly and disagreed with all of them.
+await (async () => {
+  const name = 'v2.00 (U9) — the PMO split is exact, ties to the first office, and the same on the panel, the forecast and the PMO Matrix';
+  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
+  const __bm = bootMark();
+  try {
+    const J = JSON.stringify;
+    // PRIME-3 alone, office PRIMES, starred or not; its CLINs [number, ask by service] in the order given
+    const prime = (svcs, ask, disc, mand, clins, star) => {
+      const X = boot();
+      seed(X.ev, { services: svcs, items: [it('PRIME-3', 'PRIMES', ask)], disc, mand, order: ['PRIME-3'], mc: star ? { 'PRIME-3': true } : {} });
+      X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
+        if(!DATA.clins) DATA.clins=CLINS;
+        CLINS['PRIME-3']=${J(clins.map(([clin, a]) => ({ clin, desc: 'CLIN ' + clin, ccar: '', ask: a })))};
+        DATA.clins['PRIME-3']=CLINS['PRIME-3'];
+        S.ptype={'PRIME-3':'PRIME'};
+        MS.years[MS.cur]=S; applyState(S); save(); render(); 'ok'`);
+      return X;
+    };
+    const fixture = X => X.ev(`(function(){ var T=tiers()['PRIME-3']; return JSON.stringify([clinApplies('PRIME-3'), T.d, T.m,
+      clinList('PRIME-3').map(function(c){ return c.clin; })]); })()`);
+    // whole dollars as the panel prints them, written here: '—' for nothing
+    const pr = v => v ? '$' + String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '—';
+    const prT = v => '$' + String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
+    // the panel, as drawn: each row's label and every cell after it
+    const panel = X => JSON.parse(X.ev(`(function(){ render(); var o={}, el=document.getElementById('pmBody');
+      [].forEach.call(el? el.querySelectorAll('tr') : [], function(tr){ var td=tr.querySelectorAll('td'); if(td.length<3) return;
+        var t=[].filter.call(td[0].childNodes, function(n){ return n.nodeType===3 && n.textContent.trim(); })[0];
+        o[t? t.textContent.trim() : td[0].textContent.trim()]=[].slice.call(td, 1).map(function(c){ return c.textContent.trim(); }); });
+      return JSON.stringify(o); })()`));
+    // the forecast: one service alone, and the whole portfolio, office by office ([TOTAL, UNSCHEDULED])
+    const fcSvc = (X, i) => JSON.parse(X.ev(`(function(){ var F=forecast(null,{svc:${i}}).byPMO, o={};
+      Object.keys(F).forEach(function(g){ o[g]=F[g].tot; }); return JSON.stringify(o); })()`));
+    const fcAll = X => JSON.parse(X.ev(`(function(){ var F=forecast().byPMO, o={};
+      Object.keys(F).forEach(function(g){ o[g]=[F[g].tot, F[g].unsch]; }); return JSON.stringify(o); })()`));
+    // the exported forecast of the whole portfolio, by PMO: each office's twelve months, UNSCHEDULED and TOTAL
+    const fcBook = async X => { X.ev(`fcView=''; 'ok'`); const fb = JSON.parse(await w6Book(X.w, 'exportFcView'));
+      const rows = Object.values(fb).find(r => Array.isArray(r)) || [], hs = w6Hdrs(rows, 'UNSCHEDULED', 'TOTAL'), h = hs[hs.length - 1];
+      return { err: fb.__err || (rows.length ? 'ok' : 'empty'), row: g => { const r = rows.find((x, j) => j > h && w6Lbl(x) === g); return r ? r.slice(1, 15).map(num) : null; } }; };
+    // the PMO Matrix, read back from the workbook's bytes
+    const matrix = async X => { const bk = JSON.parse(await w6Book(X.w, 'exportExcel')), pm = bk['PMO Matrix'] || [], h = w6Hdrs(pm, 'PMO', 'TOTAL Disc')[0];
+      return { err: bk.__err || (h === undefined ? 'no PMO Matrix header' : 'ok'),
+        cell: (g, col) => { const r = pm.find((x, j) => j > h && w6Lbl(x) === g), c = w6Col(pm, h, col); return !r ? 'no row ' + g : c < 0 ? 'no column ' + col : num(r[c]); },
+        // the office's own PMO tab: PRIME-3's row in its report (the section headed Rank ... Total (Disc+Mand))
+        tab: (g, cols) => { const rows = bk['PMO ' + g] || [], th = w6Hdrs(rows, 'Rank', 'Total (Disc+Mand)')[0];
+          const r = th === undefined ? null : rows.slice(th + 1).find(x => (x || []).includes('Req PRIME-3'));
+          return !rows.length ? 'no tab PMO ' + g : !r ? 'no PRIME-3 row' : cols.map(c => { const k = w6Col(rows, th, c); return k < 0 ? 'no column ' + c : num(r[k]); }); } }; };
+    // the CR cash view by PMO: each office's dollars in the half-month windows, and with no date
+    const crPmo = X => JSON.parse(X.ev(`(function(){ var R=crBuckets(null,'pmo'), o={};
+      R.keys.forEach(function(k,i){ o[k]=[R.data[i].win.reduce(function(a,b){ return a+b; }, 0), R.data[i].nodate]; }); return JSON.stringify(o); })()`));
+    // the Spend Plan Source, read back from its bytes: dollars by CLIN number (a line with none: 'no CLIN')
+    const source = async X => { const sb = JSON.parse(await w6Book(X.w, 'exportSrc'));
+      const sh = Object.keys(sb).filter(k => !k.startsWith('__')).map(k => sb[k]).find(rs => (rs || []).length > 1) || [];
+      const hd = (sh[0] || []).map(c => String(c ?? '').trim()), cA = hd.indexOf('Amount'), cC = hd.indexOf('CLINs'), o = {};
+      sh.slice(1).forEach(r => { const k = String(r[cC] ?? '').trim() || 'no CLIN'; o[k] = (o[k] || 0) + (num(r[cA]) || 0); });
+      return { err: sb.__err || (cA < 0 || cC < 0 ? 'no Amount or CLINs column' : 'ok'), by: o }; };
+    const sum = a => a.reduce((x, y) => x + y, 0);
+
+    // ---- BOARD A: ties, a near tie at budget size, four offices, a zero share, and a service no CLIN covers
+    const SA = ['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC-C', 'USN', 'CV'], AA = [3, 9, 999999999, 250000000, 3, 3, 5];
+    const OA = ['MxS', 'AV', 'TSS', 'PRIMES'];
+    const A = { MxS: [1, 2, 166666667, 624982, 1, 1, 0], AV: [1, 3, 333333333, 100624982, 1, 0, 0],
+                TSS: [1, 4, 499999999, 148750036, 0, 1, 0], PRIMES: [0, 0, 0, 0, 1, 1, 5] };
+    const AT = { MxS: 167291654, AV: 433958320, TSS: 648750041, PRIMES: 7 };          // each office, all seven services
+    const CTL_A = ['CV'];
+    const XA = prime(SA, AA, AA, SA.map(() => 0), [['0010', [1, 1, 1, 1499958, 1, 1, 0]], ['0002', [2, 2, 2, 241499956, 1, 0, 0]],
+      ['0008', [3, 3, 3, 357000087, 1, 2, 0]], ['0001', [0, 0, 0, 0, 3, 3, 0]]], false);
+    w5Chk(name, 'A · fixture', 'CONTROL — PRIME-3 is a prime with CLINs 0010, 0002, 0008, 0001 and draws every dollar it asks, discretionary',
+      fixture(XA), J([true, AA, SA.map(() => 0), ['0010', '0002', '0008', '0001']]));
+    w5Chk(name, 'A · the rule', 'CONTROL — each service’s parts, as written, add up to what it draws',
+      J(SA.map((s, i) => sum(OA.map(g => A[g][i])))), J(AA));
+    const pA = panel(XA);
+    SA.forEach((s, i) => w5Chk(name, 'A · the PMO panel · ' + s, (CTL_A.includes(s) ? 'CONTROL — ' : '') + 'MxS / AV / TSS / PRIMES, Disc and Mand, as printed',
+      J(OA.map(g => pA[g] ? pA[g].slice(2 * i, 2 * i + 2) : null)), J(OA.map(g => [pr(A[g][i]), '—']))));
+    w5Chk(name, 'A · the PMO panel · TOTAL', 'each office’s TOTAL Disc, TOTAL Mand and MC, as printed',
+      J(OA.map(g => pA[g] ? pA[g].slice(2 * SA.length) : null)), J(OA.map(g => [prT(AT[g]), '$0', '—'])));
+    w5Chk(name, 'A · the PMO panel · TOTAL', 'CONTROL — the TOTAL row is each service’s draw, Disc and Mand',
+      J(pA.TOTAL ? pA.TOTAL.slice(0, 2 * SA.length) : null), J(AA.map(v => [prT(v), '—']).flat()));
+    SA.forEach((s, i) => { const F = fcSvc(XA, i);
+      w5Chk(name, 'A · the forecast · ' + s + ' alone', (CTL_A.includes(s) ? 'CONTROL — ' : '') + 'MxS / AV / TSS / PRIMES', J(OA.map(g => F[g] || 0)), J(OA.map(g => A[g][i]))); });
+    const fA = fcAll(XA);
+    w5Chk(name, 'A · the forecast · whole portfolio', 'each office’s TOTAL, all of it UNSCHEDULED (no award dates)', J(OA.map(g => fA[g] || null)), J(OA.map(g => [AT[g], AT[g]])));
+    const eA = await fcBook(XA);
+    w5Chk(name, 'A · the exported forecast', 'CONTROL — the view builds and reads back', eA.err, 'ok');
+    w5Chk(name, 'A · the exported forecast', 'each office\u2019s months, UNSCHEDULED and TOTAL: MxS / AV / TSS / PRIMES', J(OA.map(g => eA.row(g))),
+      J(OA.map(g => Array(12).fill(0).concat([AT[g], AT[g]]))));
+    const mA = await matrix(XA);
+    w5Chk(name, 'A · the PMO Matrix', 'CONTROL — the workbook builds and reads back', mA.err, 'ok');
+    SA.forEach((s, i) => w5Chk(name, 'A · the PMO Matrix · ' + s, (CTL_A.includes(s) ? 'CONTROL — ' : '') + 'MxS / AV / TSS / PRIMES, ' + s + ' Disc and ' + s + ' Mand',
+      J(OA.map(g => [mA.cell(g, s + ' Disc'), mA.cell(g, s + ' Mand')])), J(OA.map(g => [A[g][i], 0]))));
+    w5Chk(name, 'A · the PMO Matrix · TOTAL', 'each office’s TOTAL Disc and TOTAL Mand', J(OA.map(g => [mA.cell(g, 'TOTAL Disc'), mA.cell(g, 'TOTAL Mand')])), J(OA.map(g => [AT[g], 0])));
+    const FYA = XA.ev('FYL()'), colsA = [FYA + ' Ask', 'Disc allocated', 'UFR (Unfunded Requirement)'].concat(SA.map(s => s + ' Disc'), SA.map(s => s + ' Mand'));
+    w5Chk(name, 'A · the PMO tabs', 'each office’s tab, MxS / AV / TSS / PRIMES: PRIME-3’s ' + FYA + ' Ask, Disc allocated, UFR, then each service’s Disc and Mand',
+      J(OA.map(g => mA.tab(g, colsA))), J(OA.map(g => [AT[g], AT[g], 0].concat(A[g], SA.map(() => 0)))));
+    const cA = crPmo(XA);
+    w5Chk(name, 'A · the CR view by PMO', 'each office’s dollars in a window, and with no date: MxS / AV / TSS / PRIMES', J(OA.map(g => cA[g] || null)), J(OA.map(g => [0, AT[g]])));
+    const sA = await source(XA);
+    w5Chk(name, 'A · the Spend Plan Source', 'CONTROL — the file builds and reads back', sA.err, 'ok');
+    w5Chk(name, 'A · the Spend Plan Source', 'CONTROL — its CLIN lines carry each office’s dollars: 0010 MxS, 0002 AV, 0008 TSS, 0001 and the uncovered CV PRIMES',
+      J(sA.by), J({ '0010': AT.MxS, '0002': AT.AV, '0008': AT.TSS, '0001': 2, 'no CLIN': 5 }));
+
+    // ---- BOARD B: the CLIN list decides a tie, and every lane
+    const SB = ['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC-C'], BA = [3, 5, 9, 7, 100], BD = [3, 5, 3, 7, 100], BM = [0, 0, 3, 0, 0];
+    const OB = ['TSS', 'AV', 'MxS', 'PRIMES'];
+    // and each office's totals, written out: discretionary, mandatory, funded, unfunded
+    const B = { TSS: { d: [1, 1, 1, 0, 17], m: [0, 0, 1, 0, 0], ask: 21, short: 1, dT: 20, mT: 1, fT: 21, uT: 0 },
+                AV: { d: [1, 2, 1, 0, 33], m: [0, 0, 1, 0, 0], ask: 39, short: 2, dT: 37, mT: 1, fT: 38, uT: 1 },
+                MxS: { d: [1, 2, 1, 0, 50], m: [0, 0, 1, 0, 0], ask: 57, short: 3, dT: 54, mT: 1, fT: 55, uT: 2 },
+                PRIMES: { d: [0, 0, 0, 7, 0], m: [0, 0, 0, 0, 0], ask: 7, short: 0, dT: 7, mT: 0, fT: 7, uT: 0 } };
+    const CTL_B = ['ANG', 'STOVL', 'USMC-C'];
+    const XB = prime(SB, BA, BD, BM, [['0008', [1, 1, 1, 0, 1]], ['0002', [2, 2, 2, 0, 2]], ['0010', [3, 3, 3, 0, 3]]], true);
+    w5Chk(name, 'B · fixture', 'CONTROL — PRIME-3, starred, with CLINs 0008, 0002, 0010 in that order; AFRC draws $3 discretionary and $3 mandatory of $9',
+      fixture(XB), J([true, BD, BM, ['0008', '0002', '0010']]));
+    w5Chk(name, 'B · the rule', 'CONTROL — each service’s parts, as written, add up to its discretionary and its mandatory',
+      J(SB.map((s, i) => [sum(OB.map(g => B[g].d[i])), sum(OB.map(g => B[g].m[i]))])), J(SB.map((s, i) => [BD[i], BM[i]])));
+    w5Chk(name, 'B · the rule', 'CONTROL — each office’s totals, as written, are its parts added up; funded and unfunded make its ask, and its short is its ask less Disc',
+      J(OB.map(g => [sum(B[g].d), sum(B[g].m), B[g].dT + B[g].mT, B[g].fT + B[g].uT, B[g].ask - B[g].dT])), J(OB.map(g => [B[g].dT, B[g].mT, B[g].fT, B[g].ask, B[g].short])));
+    const pB = panel(XB);
+    SB.forEach((s, i) => w5Chk(name, 'B · the PMO panel · ' + s, (CTL_B.includes(s) ? 'CONTROL — ' : '') + 'TSS / AV / MxS / PRIMES, Disc and Mand, as printed',
+      J(OB.map(g => pB[g] ? pB[g].slice(2 * i, 2 * i + 2) : null)), J(OB.map(g => [pr(B[g].d[i]), pr(B[g].m[i])]))));
+    w5Chk(name, 'B · the PMO panel · TOTAL', 'each office’s TOTAL Disc, TOTAL Mand and MC, as printed',
+      J(OB.map(g => pB[g] ? pB[g].slice(2 * SB.length) : null)), J(OB.map(g => [prT(B[g].dT), prT(B[g].mT), pr(B[g].short)])));
+    SB.forEach((s, i) => { const F = fcSvc(XB, i);
+      w5Chk(name, 'B · the forecast · ' + s + ' alone', (CTL_B.includes(s) ? 'CONTROL — ' : '') + 'TSS / AV / MxS / PRIMES', J(OB.map(g => F[g] || 0)), J(OB.map(g => B[g].d[i] + B[g].m[i]))); });
+    const fB = fcAll(XB);
+    w5Chk(name, 'B · the forecast · whole portfolio', 'each office’s TOTAL, all of it UNSCHEDULED', J(OB.map(g => fB[g] || null)),
+      J(OB.map(g => [B[g].fT, B[g].fT])));
+    const eB = await fcBook(XB);
+    w5Chk(name, 'B · the exported forecast', 'CONTROL — the view builds and reads back', eB.err, 'ok');
+    w5Chk(name, 'B · the exported forecast', 'each office\u2019s months, UNSCHEDULED and TOTAL: TSS / AV / MxS / PRIMES', J(OB.map(g => eB.row(g))),
+      J(OB.map(g => Array(12).fill(0).concat([B[g].fT, B[g].fT]))));
+    const mB = await matrix(XB);
+    w5Chk(name, 'B · the PMO Matrix', 'CONTROL — the workbook builds and reads back', mB.err, 'ok');
+    SB.forEach((s, i) => w5Chk(name, 'B · the PMO Matrix · ' + s, (CTL_B.includes(s) ? 'CONTROL — ' : '') + 'TSS / AV / MxS / PRIMES, ' + s + ' Disc and ' + s + ' Mand',
+      J(OB.map(g => [mB.cell(g, s + ' Disc'), mB.cell(g, s + ' Mand')])), J(OB.map(g => [B[g].d[i], B[g].m[i]]))));
+    w5Chk(name, 'B · the PMO Matrix · TOTAL and MC', 'each office’s TOTAL Disc, TOTAL Mand, ★ MC requirement and ★ MC short',
+      J(OB.map(g => ['TOTAL Disc', 'TOTAL Mand', '★ MC requirement (memo)', '★ MC short vs Disc'].map(c => mB.cell(g, c)))),
+      J(OB.map(g => [B[g].dT, B[g].mT, B[g].ask, B[g].short])));
+    const FYB = XB.ev('FYL()'), colsB = [FYB + ' Ask', 'Disc allocated', 'UFR (Unfunded Requirement)'].concat(SB.map(s => s + ' Disc'), SB.map(s => s + ' Mand'));
+    w5Chk(name, 'B · the PMO tabs', 'each office’s tab, TSS / AV / MxS / PRIMES: PRIME-3’s ' + FYB + ' Ask, Disc allocated, UFR, then each service’s Disc and Mand',
+      J(OB.map(g => mB.tab(g, colsB))), J(OB.map(g => [B[g].ask, B[g].dT, B[g].uT].concat(B[g].d, B[g].m))));
+    const cB = crPmo(XB);
+    w5Chk(name, 'B · the CR view by PMO', 'each office’s dollars in a window, and with no date: TSS / AV / MxS / PRIMES', J(OB.map(g => cB[g] || null)),
+      J(OB.map(g => [0, B[g].fT])));
+    const sB = await source(XB);
+    w5Chk(name, 'B · the Spend Plan Source', 'CONTROL — the file builds and reads back', sB.err, 'ok');
+    w5Chk(name, 'B · the Spend Plan Source', 'CONTROL — its CLIN lines carry each office’s dollars, both lanes: 0008 TSS, 0002 AV, 0010 MxS; the uncovered STOVL on no CLIN',
+      J(sB.by), J({ '0008': 21, '0002': 38, '0010': 55, 'no CLIN': 7 }));
+
+    // ---- BOARD C (CONTROL): a modelled plan's $10.50, not whole dollars, stays each office's fraction of it
+    const XC = prime(['USAF'], [12], [12], [0], [['0010', [1]], ['0002', [2]], ['0008', [3]]], false);
+    const OC = ['MxS', 'AV', 'TSS'];
+    w5Chk(name, 'C · fixture', 'CONTROL — PRIME-3 draws its $12, discretionary', fixture(XC), J([true, [12], [0], ['0010', '0002', '0008']]));
+    const PLAN = `{d:[10.5], m:[0], dT:10.5, mT:0}`;
+    const fC = JSON.parse(XC.ev(`(function(){ var F=forecast(function(id){ return id==='PRIME-3'? ${PLAN} : null; }).byPMO, o={};
+      Object.keys(F).forEach(function(g){ o[g]=F[g].tot; }); return JSON.stringify(o); })()`));
+    w5Chk(name, 'C · the forecast of a modelled plan', 'CONTROL — MxS / AV / TSS of $10.50, placed, to the cent', J(OC.map(g => money(fC[g] || 0))), J(['1.75', '3.5', '5.25']));
+    // and each office's own part of that plan, as every by-office view takes it (pmoPartsOf: read, never an expectation)
+    const oC = JSON.parse(XC.ev(`JSON.stringify(pmoPartsOf(itemById('PRIME-3'), ${PLAN}).map(function(o){ return [o.g, o.d[0]]; }))`));
+    w5Chk(name, 'C · each office\u2019s part of a modelled plan', 'CONTROL — MxS / AV / TSS of $10.50, to the cent', J(oC.map(x => [x[0], money(x[1])])), J([['MxS', '1.75'], ['AV', '3.5'], ['TSS', '5.25']]));
+  } catch (e) {
+    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
+  }
+  bootRelease(__bm, []);
+  await settleBoards();
+})();
+// ==== end v2.00 (U9) ====
+// ==== v2.00 (U9, every export): CE by PMO, the PMO tabs by portion, the Two-Plan Forecast and the deck carry the same parts; an office that holds two CLINs ====
+// The block above reads the panel, the forecast, the PMO Matrix, each PMO tab's report row and the CR view. Four more exports
+// carry each office's part, from the same pmoPartsOf: the workbook's CE by PMO sheet, each office's PMO tab by portion, the
+// Two-Plan Forecast's BY PMO rows and the deck's Funding by PMO slide. They are held here to the same hand-worked dollars,
+// with the mandatory lane's own tie. And the rest of the tie rule: an office that holds more than one CLIN weighs its CLINs'
+// asks added up and ranks by its FIRST CLIN in the list.
+// BOARD D, CLINs 0010 / 0002 / 0008 (MxS, AV, TSS) asking 1 : 2 : 3 on every service, cost elements on (Airframe PGSE):
+//   USAF  $3 discretionary: .5 / 1 / 1.5, the tied dollar to MxS                                            = 1/1/1
+//   ANG   $9 discretionary: 1.5 / 3 / 4.5, MxS                                                               = 2/3/4
+//   AFRC  $3, every dollar mandatory (no discretionary there): the same tie, on the mandatory lane          = 1/1/1
+//   So MxS asks 4 (3 discretionary + 1 mandatory), AV 5 (4 + 1), TSS 6 (5 + 1), and nothing is unfunded. The Two-Plan
+//   Forecast's plan A (discretionary only) funds USAF and ANG, 3 / 4 / 5; plan B (both pots) all three, 4 / 5 / 6.
+//   CONTROL: the Spend Plan Source's CLIN lines. Each service here is drawn from one lane, so they agree with the offices:
+//   0010 $4, 0002 $5, 0008 $6.
+// BOARD E, USAF $3 discretionary over CLINs 0002 [1], 0010 [1], 0102 [1], 0008 [3], 0110 [0]: AV holds 0002 and 0102, MxS
+//   0010 and 0110, so the offices weigh AV 2 : MxS 1 : TSS 3 and rank AV, MxS, TSS: 1 / .5 / 1.5, the tie of MxS and TSS
+//   is MxS's = AV 1 / MxS 1 / TSS 1, as the Spend Plan Source's CLIN lines give it (CONTROL: 0002, 0010 and 0008 a dollar
+//   each). An office weighed by its first CLIN alone (AV 1), or ranked by its last (TSS before MxS), gives 1 / 0 / 2.
+// BOARD F, the same CLINs at 1 : 2 : 3, starred: USAF asks $9 and draws $3 discretionary and $3 mandatory, ANG asks $3 and
+//   draws nothing. Its unfunded and ★ figures are not shared evenly (ANG's $3 short is .5 / 1 / 1.5), so they are read
+//   where they print: the panel's MC column, the PMO Matrix's ★ columns, each PMO tab's MC memo and Unfunded rows, CE by
+//   PMO's ★ and Unfunded columns and the deck's: asks 3 / 4 / 5, unfunded 1 / 2 / 3, ★ MC short 2 / 3 / 4.
+// BOARD G, an exact tie at budget size: USAF draws $779,153,421, exactly half of CLIN asks 881,836,554 / 575,398,923 /
+//   101,071,365, so AV's and TSS's parts both end in .5 and the dollar is AV's = 440,918,277 / 287,699,462 / 50,535,682,
+//   as the Spend Plan Source's CLIN lines give it (CONTROL). Weights rebuilt from the fractions give it to TSS.
+// FAILS ON 7ee498a (board fce8a391), except the CONTROLs: the offices were split by their fractions, so D was 0/1/2, 1/3/5
+// and, on the mandatory lane, 0/1/2 -- MxS asking 1, AV 5, TSS 9 -- on every one of these exports, and E was 1 / 0 / 2.
+// F's offices asked 1 / 4 / 7 there, with unfunded 0 / 2 / 4 (no Unfunded row on MxS's tab) and ★ MC short 1 / 3 / 5,
+// and G was 440,918,277 / 287,699,461 / 50,535,683.
+await (async () => {
+  const name = 'v2.00 (U9, every export) — CE by PMO, the PMO tabs by portion, the Two-Plan Forecast and the deck carry the same parts; an office with two CLINs';
+  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
+  const __bm = bootMark();
+  try {
+    const J = JSON.stringify;
+    // PRIME-3 alone, office PRIMES; its CLINs [number, ask by service] in the order given; cost elements on or not
+    const prime = (svcs, ask, disc, mand, clins, ce) => {
+      const X = boot();
+      seed(X.ev, { services: svcs, items: [it('PRIME-3', 'PRIMES', ask)], disc, mand, order: ['PRIME-3'], mc: {} });
+      X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
+        if(!DATA.clins) DATA.clins=CLINS;
+        CLINS['PRIME-3']=${J(clins.map(([clin, a]) => ({ clin, desc: 'CLIN ' + clin, ccar: '', ask: a })))};
+        DATA.clins['PRIME-3']=CLINS['PRIME-3'];
+        S.ptype={'PRIME-3':'PRIME'};
+        ${ce ? "DATA.costElems=true; S.costElem={'PRIME-3':'Airframe PGSE'};" : ''}
+        MS.years[MS.cur]=S; applyState(S); save(); render(); 'ok'`);
+      return X;
+    };
+    const fixture = X => X.ev(`(function(){ var T=tiers()['PRIME-3']; return JSON.stringify([clinApplies('PRIME-3'), T.d, T.m,
+      clinList('PRIME-3').map(function(c){ return c.clin; })]); })()`);
+    // the Spend Plan Source, read back from its bytes: dollars by CLIN number, the lines that carry any
+    const source = async X => { const sb = JSON.parse(await w6Book(X.w, 'exportSrc'));
+      const sh = Object.keys(sb).filter(k => !k.startsWith('__')).map(k => sb[k]).find(rs => (rs || []).length > 1) || [];
+      const hd = (sh[0] || []).map(c => String(c ?? '').trim()), cA = hd.indexOf('Amount'), cC = hd.indexOf('CLINs'), o = {};
+      sh.slice(1).forEach(r => { const k = String(r[cC] ?? '').trim() || 'no CLIN'; if (num(r[cA])) o[k] = (o[k] || 0) + num(r[cA]); });
+      return { err: sb.__err || (cA < 0 || cC < 0 ? 'no Amount or CLINs column' : 'ok'), by: o }; };
+    const sum = a => a.reduce((x, y) => x + y, 0);
+    const ct = c => String((c && typeof c === 'object') ? (c.t ?? c.v ?? '') : (c ?? '')).trim();
+
+    // ---- BOARD D: the four exports, at $3, at $9 and on the mandatory lane
+    const SD = ['USAF', 'ANG', 'AFRC'], OD = ['MxS', 'AV', 'TSS'];
+    // each office's discretionary and mandatory, service by service, and its totals: ask, discretionary, mandatory
+    const DD = { MxS: [1, 2, 0], AV: [1, 3, 0], TSS: [1, 4, 0] }, DM = { MxS: [0, 0, 1], AV: [0, 0, 1], TSS: [0, 0, 1] };
+    const DT = { MxS: [4, 3, 1], AV: [5, 4, 1], TSS: [6, 5, 1] };
+    const XD = prime(SD, [3, 9, 3], [3, 9, 0], [0, 0, 3], [['0010', [1, 1, 1]], ['0002', [2, 2, 2]], ['0008', [3, 3, 3]]], true);
+    w5Chk(name, 'D · fixture', 'CONTROL — PRIME-3, with CLINs 0010, 0002, 0008, draws USAF $3 and ANG $9 discretionary and AFRC $3 mandatory',
+      fixture(XD), J([true, [3, 9, 0], [0, 0, 3], ['0010', '0002', '0008']]));
+    w5Chk(name, 'D · the rule', 'CONTROL — each service’s parts, as written, add up to its discretionary and its mandatory; each office’s to its totals',
+      J([SD.map((s, i) => [sum(OD.map(g => DD[g][i])), sum(OD.map(g => DM[g][i]))]), OD.map(g => [sum(DD[g]) + sum(DM[g]), sum(DD[g]), sum(DM[g])])]),
+      J([[[3, 0], [9, 0], [0, 3]], OD.map(g => DT[g])]));
+    const bk = JSON.parse(await w6Book(XD.w, 'exportExcel')), FY = XD.ev('FYL()');
+    w5Chk(name, 'D · the workbook', 'CONTROL — it builds and reads back, with a CE by PMO sheet and a PMO tab for each office',
+      J([bk.__err || 'ok', !!bk['CE by PMO']].concat(OD.map(g => !!bk['PMO ' + g]))), J(['ok', true, true, true, true]));
+    const pm = bk['PMO Matrix'] || [], h = w6Hdrs(pm, 'PMO', 'TOTAL Disc')[0];
+    const cell = (g, col) => { const r = pm.find((x, j) => j > h && w6Lbl(x) === g), c = w6Col(pm, h, col); return !r ? 'no row ' + g : c < 0 ? 'no column ' + col : num(r[c]); };
+    w5Chk(name, 'D · the PMO Matrix', 'MxS / AV / TSS: USAF, ANG and AFRC, Disc and Mand (AFRC’s tie is on the mandatory lane)',
+      J(OD.map(g => SD.map(s => [cell(g, s + ' Disc'), cell(g, s + ' Mand')]))), J(OD.map(g => SD.map((s, i) => [DD[g][i], DM[g][i]]))));
+    const ce = bk['CE by PMO'] || [], ch = w6Hdrs(ce, 'PMO / Cost Element', 'Disc portion')[0];
+    w5Chk(name, 'D · CE by PMO', 'MxS / AV / TSS: ' + FY + ' Ask, Disc portion, Mand portion and Unfunded (incl delta)',
+      J(OD.map(g => { const r = ce.find((x, j) => j > ch && w6Lbl(x) === g);
+        return r ? [FY + ' Ask', 'Disc portion', 'Mand portion', 'Unfunded (incl delta)'].map(c => num(r[w6Col(ce, ch, c)])) : null; })),
+      J(OD.map(g => DT[g].concat([0]))));
+    // each office's own PMO tab: PRIME-3's row under a portion's header -- the amount, then each service
+    const tabRow = (g, lbl) => { const rows = bk['PMO ' + g] || [], th = w6Hdrs(rows, 'Rank', lbl)[0];
+      const r = th === undefined ? null : rows.slice(th + 1).find(x => (x || []).includes('Req PRIME-3'));
+      return !rows.length ? 'no tab PMO ' + g : !r ? 'no PRIME-3 row under ' + lbl : [lbl].concat(SD).map(c => num(r[w6Col(rows, th, c)])); };
+    w5Chk(name, 'D · the PMO tabs by portion', 'MxS / AV / TSS: PRIME-3’s Disc portion row, the amount then USAF, ANG and AFRC',
+      J(OD.map(g => tabRow(g, 'Disc portion'))), J(OD.map(g => [DT[g][1]].concat(DD[g]))));
+    w5Chk(name, 'D · the PMO tabs by portion', 'MxS / AV / TSS: PRIME-3’s Mand portion row, the amount then USAF, ANG and AFRC',
+      J(OD.map(g => tabRow(g, 'Mand portion'))), J(OD.map(g => [DT[g][2]].concat(DM[g]))));
+    const tp = bk[Object.keys(bk).find(k => / Two-Plan Forecast$/.test(k))] || [];
+    w5Chk(name, 'D · the Two-Plan Forecast · BY PMO', 'MxS / AV / TSS: TOTAL, in whole dollars, plan A (discretionary only) then plan B (both pots)',
+      J(OD.map(g => tp.filter(r => w6Lbl(r) === g).map(r => w5Dol(num(r[r.length - 1]))))), J([[3, 4], [4, 5], [5, 6]]));
+    // the deck: the tables exportPPT builds, captured as rows instead of the XML they turn into
+    XD.ev(`globalThis.__u9t=[]; if(!globalThis.__u9oT) globalThis.__u9oT=_pTbl; if(!globalThis.__u9oB) globalThis.__u9oB=buildPptx;
+      _pTbl=function(){ var a=arguments; globalThis.__u9t.push(a[a.length-1]); return ''; }; buildPptx=function(){ return new Uint8Array(0); };
+      try{ exportPPT(); } finally { _pTbl=globalThis.__u9oT; buildPptx=globalThis.__u9oB; } 'ok'`);
+    const pt = JSON.parse(XD.ev('JSON.stringify(globalThis.__u9t)')).find(t => { const h0 = ((t || [])[0] || []).map(ct); return h0[0] === 'PMO' && h0.includes('★ MC req'); }) || [];
+    const at = k => ((pt[0] || []).map(ct)).indexOf(k);
+    w5Chk(name, 'D · the deck · Funding by PMO', 'MxS / AV / TSS: ' + FY + ' Ask, Discretionary, Mandatory and Unfunded, as printed',
+      J(OD.map(g => { const r = pt.find(x => ct((x || [])[0]) === g); return r ? [FY + ' Ask', 'Discretionary', 'Mandatory', 'Unfunded'].map(k => ct(r[at(k)])) : null; })),
+      J([['$4', '$3', '$1', '—'], ['$5', '$4', '$1', '—'], ['$6', '$5', '$1', '—']]));
+    const sD = await source(XD);
+    w5Chk(name, 'D · the Spend Plan Source', 'CONTROL — its CLIN lines, one lane a service: 0010 MxS, 0002 AV, 0008 TSS', J([sD.err, sD.by]), J(['ok', { '0010': 4, '0002': 5, '0008': 6 }]));
+
+    // ---- BOARD E: an office that holds two CLINs weighs them added up and ranks by the first
+    const OE = ['AV', 'MxS', 'TSS'];
+    const XE = prime(['USAF'], [3], [3], [0], [['0002', [1]], ['0010', [1]], ['0102', [1]], ['0008', [3]], ['0110', [0]]], false);
+    w5Chk(name, 'E · fixture', 'CONTROL — PRIME-3 draws its $3, discretionary, with CLINs 0002, 0010, 0102, 0008, 0110 in that order',
+      fixture(XE), J([true, [3], [0], ['0002', '0010', '0102', '0008', '0110']]));
+    const be = JSON.parse(await w6Book(XE.w, 'exportExcel')), pe = be['PMO Matrix'] || [], he = w6Hdrs(pe, 'PMO', 'TOTAL Disc')[0];
+    w5Chk(name, 'E · the PMO Matrix', 'AV / MxS / TSS, USAF Disc: AV’s two CLINs weigh 2, MxS’s 1 (its 0110 asks nothing), TSS’s 3; the tie of MxS and TSS is MxS’s, its first CLIN (0010) before 0008',
+      J(OE.map(g => { const r = pe.find((x, j) => j > he && w6Lbl(x) === g); return r ? num(r[w6Col(pe, he, 'USAF Disc')]) : null; })), J([1, 1, 1]));
+    const fE = JSON.parse(XE.ev(`(function(){ var F=forecast().byPMO, o={}; Object.keys(F).forEach(function(g){ o[g]=F[g].tot; }); return JSON.stringify(o); })()`));
+    w5Chk(name, 'E · the forecast', 'AV / MxS / TSS, the whole portfolio', J(OE.map(g => fE[g] || 0)), J([1, 1, 1]));
+    const sE = await source(XE);
+    w5Chk(name, 'E · the Spend Plan Source', 'CONTROL — its CLIN lines: 0002 AV, 0010 MxS and 0008 TSS a dollar each; 0102 and 0110 nothing',
+      J([sE.err, sE.by]), J(['ok', { '0002': 1, '0010': 1, '0008': 1 }]));
+
+    // ---- BOARD F: a starred requirement drawn from both lanes and short -- each PMO tab's MC memo and Unfunded rows, the
+    // deck's ★ columns and CE by PMO's ★ columns carry the same parts. CLINs 0010 / 0002 / 0008 at 1 : 2 : 3, starred:
+    //   USAF asks $9, draws $3 discretionary + $3 mandatory: asks 1.5 / 3 / 4.5 -> 2/3/4 (MxS); Disc 3 by 2 : 3 : 4 -> 1/1/1
+    //        (MxS); Mand 3 by what is left, 1 : 2 : 3 -> 1/1/1 (MxS); unfunded 0/1/2
+    //   ANG  asks $3, draws nothing: asks .5 / 1 / 1.5 -> 1/1/1 (MxS), all of it unfunded
+    //   So MxS asks 3, AV 4, TSS 5; each takes $1 Disc and $1 Mand; unfunded 1/2/3; MC short (ask less Disc) 2/3/4.
+    const SF = ['USAF', 'ANG'];
+    const XF = prime(SF, [9, 3], [3, 0], [3, 0], [['0010', [1, 1]], ['0002', [2, 2]], ['0008', [3, 3]]], true);
+    XF.ev(`S.mc={'PRIME-3':true}; render(); 'ok'`);
+    w5Chk(name, 'F · fixture', 'CONTROL — PRIME-3, starred, asks USAF $9 and ANG $3 and draws USAF $3 discretionary and $3 mandatory',
+      fixture(XF) + XF.ev(`JSON.stringify(!!S.mc['PRIME-3'])`), J([true, [3, 0], [3, 0], ['0010', '0002', '0008']]) + 'true');
+    const bf = JSON.parse(await w6Book(XF.w, 'exportExcel'));
+    const tabF = (g, lbl) => { const rows = bf['PMO ' + g] || [], th = w6Hdrs(rows, 'Rank', lbl)[0];
+      const r = th === undefined ? null : rows.slice(th + 1).find(x => (x || []).includes('Req PRIME-3'));
+      return !rows.length ? 'no tab PMO ' + g : !r ? 'no PRIME-3 row under ' + lbl : [lbl].concat(SF).map(c => num(r[w6Col(rows, th, c)])); };
+    w5Chk(name, 'F · the PMO tabs by portion', 'MxS / AV / TSS: PRIME-3’s MC memo row and its Unfunded row, each the amount then USAF and ANG',
+      J(OD.map(g => [tabF(g, 'MC requirement (memo — not additive)'), tabF(g, 'Total Unfunded (delta + beyond lanes)')])),
+      J([[[3, 2, 1], [1, 0, 1]], [[4, 3, 1], [2, 1, 1]], [[5, 4, 1], [3, 2, 1]]]));
+    const cf = bf['CE by PMO'] || [], cfh = w6Hdrs(cf, 'PMO / Cost Element', 'Disc portion')[0];
+    w5Chk(name, 'F · CE by PMO', 'MxS / AV / TSS: Ask, ★ MC requirement, ★ MC short vs Disc and Unfunded (incl delta)',
+      J(OD.map(g => { const r = cf.find((x, j) => j > cfh && w6Lbl(x) === g);
+        return r ? [XF.ev('FYL()') + ' Ask', '★ MC requirement (memo)', '★ MC short vs Disc', 'Unfunded (incl delta)'].map(c => num(r[w6Col(cf, cfh, c)])) : null; })),
+      J([[3, 3, 2, 1], [4, 4, 3, 2], [5, 5, 4, 3]]));
+    XF.ev(`globalThis.__u9t=[]; if(!globalThis.__u9oT) globalThis.__u9oT=_pTbl; if(!globalThis.__u9oB) globalThis.__u9oB=buildPptx;
+      _pTbl=function(){ var a=arguments; globalThis.__u9t.push(a[a.length-1]); return ''; }; buildPptx=function(){ return new Uint8Array(0); };
+      try{ exportPPT(); } finally { _pTbl=globalThis.__u9oT; buildPptx=globalThis.__u9oB; } 'ok'`);
+    const pf = JSON.parse(XF.ev('JSON.stringify(globalThis.__u9t)')).find(t => { const h0 = ((t || [])[0] || []).map(ct); return h0[0] === 'PMO' && h0.includes('★ MC req'); }) || [];
+    const atF = k => ((pf[0] || []).map(ct)).indexOf(k);
+    w5Chk(name, 'F · the deck · Funding by PMO', 'MxS / AV / TSS: Unfunded, ★ MC req and ★ MC short, as printed',
+      J(OD.map(g => { const r = pf.find(x => ct((x || [])[0]) === g); return r ? ['Unfunded', '★ MC req', '★ MC short'].map(k => ct(r[atF(k)])) : null; })),
+      J([['$1', '$3', '$2'], ['$2', '$4', '$3'], ['$3', '$5', '$4']]));
+    // board F on the PMO Matrix and the panel too. Its offices' ★ figures are not shared evenly ($3 of ANG at 1 : 2 : 3 is
+    // .5 / 1 / 1.5), so an office's ★ MC short rounded on its own reads MxS 2 / AV 3 / TSS 5 there, where its part is
+    // 2 / 3 / 4.
+    const pmF = bf['PMO Matrix'] || [], pfh = w6Hdrs(pmF, 'PMO', 'TOTAL Disc')[0];
+    w5Chk(name, 'F · the PMO Matrix', 'MxS / AV / TSS: TOTAL Disc, TOTAL Mand, ★ MC requirement and ★ MC short',
+      J(OD.map(g => { const r = pmF.find((x, j) => j > pfh && w6Lbl(x) === g);
+        return r ? ['TOTAL Disc', 'TOTAL Mand', '★ MC requirement (memo)', '★ MC short vs Disc'].map(c => num(r[w6Col(pmF, pfh, c)])) : null; })),
+      J([[1, 1, 3, 2], [1, 1, 4, 3], [1, 1, 5, 4]]));
+    const pnF = JSON.parse(XF.ev(`(function(){ render(); var o={}, el=document.getElementById('pmBody');
+      [].forEach.call(el? el.querySelectorAll('tr') : [], function(tr){ var td=tr.querySelectorAll('td'); if(td.length<3) return;
+        var t=[].filter.call(td[0].childNodes, function(n){ return n.nodeType===3 && n.textContent.trim(); })[0];
+        o[t? t.textContent.trim() : td[0].textContent.trim()]=[].slice.call(td, 1).map(function(c){ return c.textContent.trim(); }); });
+      return JSON.stringify(o); })()`));
+    w5Chk(name, 'F · the PMO panel', 'MxS / AV / TSS: USAF Disc and Mand, ANG Disc and Mand, TOTAL Disc, TOTAL Mand and MC, as printed',
+      J(OD.map(g => pnF[g] || null)),
+      J([['$1', '$1', '—', '—', '$1', '$1', '$2'], ['$1', '$1', '—', '—', '$1', '$1', '$3'], ['$1', '$1', '—', '—', '$1', '$1', '$4']]));
+
+    // ---- BOARD G: an exact tie at budget size, over CLIN asks whose fractions floating point cannot hold. CLINs 0010 / 0002 /
+    // 0008 (MxS, AV, TSS) ask 881,836,554 / 575,398,923 / 101,071,365 (1,558,306,842 in all) on USAF, which draws exactly
+    // half, $779,153,421, discretionary: 440,918,277 / 287,699,461.5 / 50,535,682.5 -> 440,918,277 / 287,699,461 / 50,535,682,
+    // one dollar left, the tie of AV and TSS is AV's = 440,918,277 / 287,699,462 / 50,535,682. The Spend Plan Source's CLIN
+    // lines are the same (CONTROL). Weights rebuilt from the fractions (fraction x total, in floating point) are not exactly
+    // these asks, and the dollar goes to TSS: 287,699,461 / 50,535,683, which is what the board gave before this change.
+    const XG = prime(['USAF'], [779153421], [779153421], [0], [['0010', [881836554]], ['0002', [575398923]], ['0008', [101071365]]], false);
+    w5Chk(name, 'G · fixture', 'CONTROL — PRIME-3 draws its $779,153,421, discretionary, with CLINs 0010, 0002, 0008',
+      fixture(XG), J([true, [779153421], [0], ['0010', '0002', '0008']]));
+    const bg = JSON.parse(await w6Book(XG.w, 'exportExcel')), pg = bg['PMO Matrix'] || [], hg = w6Hdrs(pg, 'PMO', 'TOTAL Disc')[0];
+    w5Chk(name, 'G · the PMO Matrix', 'MxS / AV / TSS, USAF Disc: the tie of AV and TSS is AV’s',
+      J(OD.map(g => { const r = pg.find((x, j) => j > hg && w6Lbl(x) === g); return r ? num(r[w6Col(pg, hg, 'USAF Disc')]) : null; })),
+      J([440918277, 287699462, 50535682]));
+    const fG = JSON.parse(XG.ev(`(function(){ var F=forecast().byPMO, o={}; Object.keys(F).forEach(function(g){ o[g]=F[g].tot; }); return JSON.stringify(o); })()`));
+    w5Chk(name, 'G · the forecast', 'MxS / AV / TSS, the whole portfolio', J(OD.map(g => fG[g] || 0)), J([440918277, 287699462, 50535682]));
+    const sG = await source(XG);
+    w5Chk(name, 'G · the Spend Plan Source', 'CONTROL — its CLIN lines: 0010 MxS, 0002 AV, 0008 TSS',
+      J([sG.err, sG.by]), J(['ok', { '0010': 440918277, '0002': 287699462, '0008': 50535682 }]));
+  } catch (e) {
+    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
+  }
+  bootRelease(__bm, []);
+  await settleBoards();
+})();
+// ==== end v2.00 (U9, every export) ====
 
 {
   const src = _selfRead(_selfPath(import.meta.url), 'utf8');
diff --git a/tools/export-audit/mutate.mjs b/tools/export-audit/mutate.mjs
index cbc6def..8fd34e9 100644
--- a/tools/export-audit/mutate.mjs
+++ b/tools/export-audit/mutate.mjs
@@ -4285,6 +4285,77 @@ const MUTATIONS = [
   { id: "v200-u14-notice-plural-it", area: "flowHtml", what: "the panel's notice says \"keeps it\" however many saved years the board cannot answer for: FY24 and FY26 \"stay in the saved selection\", and switching a year \"keeps it\"",
     find: "switching a year on or off keeps '+(F.unavail.length===1?'it':'them')+'.</div>'",
     repl: "switching a year on or off keeps it.</div>'" },
+  // v2.00 (U9): the PMO split is exact, ties to the first office in the CLIN list, and the same on the panel, the forecast and
+  // the PMO Matrix (audit-recon "v2.00 (U9) — ...").
+  { id: "v200-u9-split-by-fraction", area: "pmoPartsOf", what: "the offices are split by their fractions of each service again: $3 at 1 : 2 : 3 is $0/$1/$2 on the panel, the forecast and the PMO Matrix, where the exact rule and the Spend Plan Source give $1/$1/$1",
+    find: "  const wOf=i=> sh.map(function(x){ return x[2]? (+x[2][i]||0) : x[1]? (+x[1][i]||0) : 1; });",
+    repl: "  const wOf=i=> sh.map(function(x){ return x[1]? (+x[1][i]||0) : 1; });" },
+  { id: "v200-u9-weights-are-fractions", area: "pmoSharesOf", what: "the weights pmoSharesOf hands on are the fractions 1/6 : 2/6 : 3/6, which floating point does not hold at 1 : 2 : 3: the tied dollar goes to the last office",
+    find: "    out.forEach(r=>r.push(r[1].map((f,i)=>(tot[i]>0 && bag[r[0]])? bag[r[0]][i] : f)));",
+    repl: "    out.forEach(r=>r.push(r[1].slice()));" },
+  { id: "v200-u9-per-part-rounding", area: "pmoPartsOf", what: "each office's part is rounded on its own: $3 at 1 : 2 : 3 is $1/$1/$2, $4 of a $3 requirement",
+    find: "      const X=pmoSplit(w, [d, m, a-d-m]);",
+    repl: "      const X=[d, m, a-d-m].map(function(v){ return fr.map(function(f){ return Math.round(v*f); }); });" },
+  { id: "v200-u9-ties-by-name", area: "pmoSharesOf", what: "the offices are taken in name order, not the CLIN list's: a tie between TSS (listed first) and MxS goes to MxS",
+    find: "    return out.length? out : [[grpOf(it),null]];",
+    repl: "    out.sort(function(a,b){ return a[0]<b[0]? -1 : 1; });\n    return out.length? out : [[grpOf(it),null]];" },
+  { id: "v200-u9-uncovered-weight-dropped", area: "pmoSharesOf", what: "on a service no CLIN covers, the requirement's own office weighs what its CLINs ask there, nothing, so that service's money is spread evenly across every office",
+    find: "    out.forEach(r=>r.push(r[1].map((f,i)=>(tot[i]>0 && bag[r[0]])? bag[r[0]][i] : f)));",
+    repl: "    out.forEach(r=>r.push(r[1].map((f,i)=>bag[r[0]]? bag[r[0]][i] : f)));" },
+  { id: "v200-u9-plan-part-by-weight", area: "pmoPartsOf", what: "an amount that is not whole dollars (a modelled plan's) is multiplied by each office's CLIN asks, not its fraction: $10.50 at 1 : 2 : 3 is $10.50 / $21 / $31.50",
+    find: "    } else P.forEach(function(o,k){ const f=one? 1 : fr[k];",
+    repl: "    } else P.forEach(function(o,k){ const f=one? 1 : w[k];" },
+  { id: "v200-u9-plan-placed-by-weight", area: "pmoPartsOf", what: "a modelled plan's dollars that are not whole are placed by each office's CLIN asks, not its fraction: the forecast of $10.50 at 1 : 2 : 3 is $10.50 / $21 / $31.50",
+    find: "      return (memo[key]=fOf(i).map(function(f){ return landSvc(aw, i, d, m, literal, f); }));",
+    repl: "      return (memo[key]=w.map(function(f){ return landSvc(aw, i, d, m, literal, f); }));" },
+  // v2.00 (U9, every export): CE by PMO, the PMO tabs by portion and the deck carry the same parts as every other by-office
+  // view, and an office holding two CLINs weighs them added up and ranks by the first (audit-recon "v2.00 (U9, every export) — ...").
+  { id: "v200-u9-cebypmo-float-split", area: "exportExcel (CE by PMO)", what: "the CE by PMO sheet splits each lane itself by the offices' fractions: $3 at 1 : 2 : 3 is $0/$1/$2 there while every other by-office view says $1/$1/$1",
+    find: "        const g=o.g, tot=k=>o[k].reduce((x,y)=>x+y,0);",
+    repl: "        const g=o.g, tot=k=>{ if(!o.frac) return o[k].reduce((x,y)=>x+y,0); const sh=pmoSharesOf(it), K=sh.findIndex(r=>r[0]===o.g);\n          const V={ask:it.ask, d:p.d, m:p.m, u:SVC.map((s,i)=>Math.max(0,(+it.ask[i]||0)-(p.d[i]||0)-(p.m[i]||0))), mcs:SVC.map((s,i)=>Math.max(0,(+it.ask[i]||0)-(p.d[i]||0)))}[k];\n          return SVC.reduce((x,s,i)=>x+apportion(+V[i]||0, sh.map(r=>r[1]? r[1][i] : 1))[K],0); };" },
+  { id: "v200-u9-cebypmo-own-rounding", area: "exportExcel (CE by PMO)", what: "the CE by PMO sheet rounds each office's fraction of the discretionary draw itself: $3 at 1 : 2 : 3 is $1/$1/$2 there, $4 of a $3 requirement",
+    find: "        const dv =tot('d');",
+    repl: "        const dv =o.frac? SVC.reduce((x,s,i)=>x+Math.round((p.d[i]||0)*o.frac[i]),0) : tot('d');" },
+  { id: "v200-u9-tab-portions-float-split", area: "exportExcel (PMO tabs, by portion)", what: "each PMO tab's by-portion rows split each portion by the offices' fractions: $3 at 1 : 2 : 3 is MxS $0 / AV $1 / TSS $2 there (and an office left with $0 gets no tab)",
+    find: "        const v=o[PART[t]].slice();",
+    repl: "        const v=o.frac? SVC.map(function(s,i){ var sh=SHARES[id], K=sh.findIndex(function(r){ return r[0]===g; }), q=T[id];\n          var V={d:q.d, m:q.m, ask:it.ask, u:SVC.map(function(x,j){ return Math.max(0,(+it.ask[j]||0)-(q.d[j]||0)-(q.m[j]||0)); })}[PART[t]];\n          return apportion(+V[i]||0, sh.map(function(r){ return r[1]? r[1][i] : 1; }))[K]; }) : o[PART[t]].slice();" },
+  { id: "v200-u9-deck-rollup-float-split", area: "exportPPT (Funding by PMO)", what: "the deck's Funding by PMO slide splits each lane itself by the offices' fractions: $3 at 1 : 2 : 3 prints $0/$1/$2",
+    find: "          a.ask+=o.ask[i]; a.d+=o.d[i]; a.m+=o.m[i]; a.u+=o.u[i];",
+    repl: "          const F=(k,v)=>{ if(!o.frac) return o[k][i]; const sh=pmoSharesOf(it), K=sh.findIndex(r=>r[0]===o.g); return apportion(+v||0, sh.map(r=>r[1]? r[1][i] : 1))[K]; };\n          a.ask+=F('ask', it.ask[i]); a.d+=F('d', p.d[i]); a.m+=F('m', p.m[i]); a.u+=F('u', Math.max(0,(+it.ask[i]||0)-(p.d[i]||0)-(p.m[i]||0)));" },
+  { id: "v200-u9-deck-own-rounding", area: "exportPPT (Funding by PMO)", what: "the deck's Funding by PMO slide rounds each office's fraction of the discretionary draw itself: $3 at 1 : 2 : 3 prints $1/$1/$2, $4 of a $3 requirement",
+    find: "          a.ask+=o.ask[i]; a.d+=o.d[i]; a.m+=o.m[i]; a.u+=o.u[i];",
+    repl: "          a.ask+=o.ask[i]; a.d+=(o.frac? Math.round((p.d[i]||0)*o.frac[i]) : o.d[i]); a.m+=o.m[i]; a.u+=o.u[i];" },
+  { id: "v200-u9-weights-first-clin", area: "pmoSharesOf", what: "an office weighs its first CLIN's ask, not its CLINs' asks added up: AV holding 0002 [1] and 0102 [1] weighs 1, and $3 goes AV 1 / MxS 0 / TSS 2",
+    find: "    out.forEach(r=>r.push(r[1].map((f,i)=>(tot[i]>0 && bag[r[0]])? bag[r[0]][i] : f)));",
+    repl: "    const first={}; DATA.clins['PRIME-3'].forEach(c=>{ const s=(''+c.clin).replace(/\\D/g,'');\n      const g=/10$/.test(s)?'MxS':(/8$/.test(s)?'TSS':(/2$/.test(s)?'AV':'PRIMES')); if(!first[g]) first[g]=c.ask; });\n    out.forEach(r=>r.push(r[1].map((f,i)=>(tot[i]>0 && bag[r[0]])? (+first[r[0]][i]||0) : f)));" },
+  { id: "v200-u9-office-ranks-by-last-clin", area: "pmoSharesOf", what: "an office ranks by its last CLIN in the list, not its first: the tie of MxS (0010, then 0110 last) and TSS (0008) goes to TSS",
+    find: "      if(!bag[g]) bag[g]=SVC.map(_=>0);",
+    repl: "      { const prev=bag[g]||SVC.map(_=>0); delete bag[g]; bag[g]=prev; }" },
+  // v2.00 (U9, every export): the figures by office that are not shared evenly carry the same parts too -- each PMO tab's
+  // MC memo and Unfunded rows, CE by PMO's ★ MC short, the deck's ★ MC req, the PMO Matrix's ★ MC short and the panel's MC
+  // column -- and the offices weigh their CLIN asks themselves, not fractions times the total (audit-recon
+  // "v2.00 (U9, every export) — ...", boards F and G).
+  { id: "v200-u9-tab-memo-float-split", area: "exportExcel (PMO tabs, by portion)", what: "each PMO tab's MC memo row splits a starred requirement's ask by the offices' fractions: $9 at 1 : 2 : 3 reads MxS $1 / AV $3 / TSS $5 there while every other by-office view says $2/$3/$4",
+    find: "        const v=o[PART[t]].slice();",
+    repl: "        const v=(t==='mc' && o.frac)? SVC.map(function(s,i){ var sh=SHARES[id], K=sh.findIndex(function(r){ return r[0]===g; }); return apportion(+it.ask[i]||0, sh.map(function(r){ return r[1]? r[1][i] : 1; }))[K]; }) : o[PART[t]].slice();" },
+  { id: "v200-u9-tab-unf-float-split", area: "exportExcel (PMO tabs, by portion)", what: "each PMO tab's Unfunded row splits the unfunded dollars by the offices' fractions: $3 asked and not drawn, at 1 : 2 : 3, reads $0/$1/$2 there where every other by-office view says $1/$1/$1",
+    find: "        const v=o[PART[t]].slice();",
+    repl: "        const v=(t==='unf' && o.frac)? SVC.map(function(s,i){ var sh=SHARES[id], K=sh.findIndex(function(r){ return r[0]===g; }), q=T[id]; return apportion(Math.max(0,(+it.ask[i]||0)-(q.d[i]||0)-(q.m[i]||0)), sh.map(function(r){ return r[1]? r[1][i] : 1; }))[K]; }) : o[PART[t]].slice();" },
+  { id: "v200-u9-deck-mc-float-split", area: "exportPPT (Funding by PMO)", what: "the deck's Funding by PMO splits a starred requirement's ask by the offices' fractions in its ★ MC req column: $9 at 1 : 2 : 3 prints $1/$3/$5 where its own Ask column prints $2/$3/$4",
+    find: "          if(S.mc[id]){ a.mc+=o.ask[i]; a.mcs+=o.mcs[i]; }",
+    repl: "          if(S.mc[id]){ const sh=pmoSharesOf(it), K=sh.findIndex(r=>r[0]===o.g); a.mc+=(o.frac? apportion(+it.ask[i]||0, sh.map(r=>r[1]? r[1][i] : 1))[K] : o.ask[i]); a.mcs+=o.mcs[i]; }" },
+  { id: "v200-u9-cebypmo-mcs-float-split", area: "exportExcel (CE by PMO)", what: "the CE by PMO sheet's ★ MC short splits what discretionary left short by the offices' fractions: $3 asked and not drawn, at 1 : 2 : 3, is $0/$1/$2 there where every other by-office view says $1/$1/$1",
+    find: "        const mcs=S.mc[id]? tot('mcs') : 0;",
+    repl: "        const mcs=S.mc[id]? (o.frac? SVC.reduce((x,s,i)=>{ const sh=pmoSharesOf(it); return x+apportion(Math.max(0,(+it.ask[i]||0)-(p.d[i]||0)), sh.map(r=>r[1]? r[1][i] : 1))[sh.findIndex(r=>r[0]===o.g)]; },0) : tot('mcs')) : 0;" },
+  { id: "v200-u9-matrix-mcs-own-rounding", area: "exportExcel (PMO Matrix)", what: "the PMO Matrix's ★ MC short rounds each office's fraction of what discretionary left short itself: $3 of ANG asked and not drawn, at 1 : 2 : 3, adds MxS $1 / AV $1 / TSS $2 there, $4 of $3, and TSS reads $5 short where its part is $4",
+    find: "        a.mcs+=SVC.reduce((x,s,i)=>x+o.mcs[i],0);",
+    repl: "        a.mcs+=SVC.reduce((x,s,i)=>x+(o.frac? Math.round(Math.max(0,(+it.ask[i]||0)-(p.d[i]||0))*o.frac[i]) : o.mcs[i]),0);" },
+  { id: "v200-u9-panel-mc-own-rounding", area: "pmoMatrix (PMO funding panel, MC column)", what: "the PMO funding panel's MC column rounds each office's fraction of what discretionary left short itself: TSS reads $5 short where its part is $4",
+    find: "      if(S.mc[id]) SVC.forEach((s,i)=>{ a.mc+=o.mcs[i]; });",
+    repl: "      if(S.mc[id]) SVC.forEach((s,i)=>{ a.mc+=(frac? Math.round(Math.max(0,(+it.ask[i]||0)-(p.d[i]||0))*frac[i]) : o.mcs[i]); });" },
+  { id: "v200-u9-weights-frac-times-tot", area: "pmoSharesOf", what: "the offices' weights are rebuilt from their fractions (fraction x the CLINs' total, in floating point), not read from their CLIN asks: an exact tie at $779,153,421 over asks of 881,836,554 / 575,398,923 / 101,071,365 goes to TSS, not AV",
+    find: "    out.forEach(r=>r.push(r[1].map((f,i)=>(tot[i]>0 && bag[r[0]])? bag[r[0]][i] : f)));",
+    repl: "    out.forEach(r=>r.push(r[1].map((f,i)=>(tot[i]>0 && bag[r[0]])? f*tot[i] : f)));" },
   // v2.00 (R3, Brad 11 Oct): a save that lands under a locked view says it saved the working plan.
   { id: "v200-r3-landed-view-unsaid", area: "_driveStorePushRun", what: "a folder save that lands while a locked view is on screen says “🔒 Not kept — PB27 is a locked view. ✅ Saved …” again, naming no plan (or, quiet, leaves persist's refusal on screen)",
     find: "  if(CYCVIEW){ _cycRefusedAt=0; setStat('✅ <b>Saved the working plan</b> of '+esc(APPN_LBL[ap]||ap)+' FY'+(fy%100)+' to the shared folder — '\n    +Math.round(body.length/1024)+' KB, built before '+blLbl(CYCVIEW)+' was put on screen. '+blLbl(CYCVIEW)+' is a locked view: nothing in it '\n    +'is saved. Everyone sees the working plan on their next refresh.'+penNote+lateNote); render(); return true; }\n",
```
