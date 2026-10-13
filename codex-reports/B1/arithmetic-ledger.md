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
