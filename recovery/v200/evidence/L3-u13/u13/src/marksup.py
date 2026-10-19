# marksup.py <README.md> : (fix round) marks the round-1 headings the fix round replaces, each exactly once; fixes one line ref.
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
R = [
 ("## The change, and why there\n", "## The change, and why there (round 1; the guards stand; **the words in \"What a refused pull says\" are SUPERSEDED** by the Fix round)\n"),
 ("## Exact board diff (`diffs/board.diff`, blob `6c10f1e04d25f148d8fbef50d9e88a807847b364`)\n", "## Exact board diff, round 1 (**SUPERSEDED**: now `diffs/board.diff` `28ee403e`; round 1's is `superseded-r1/diffs/board.diff` `6c10f1e04d25f148d8fbef50d9e88a807847b364`)\n"),
 ("## The test block (audit-import; `diffs/audit-import.diff`, blob `b318236ccf86fe2fcdf4faedaede09286b696f52`)\n", "## The test block, round 1 (**SUPERSEDED** in part: 71 checks now, see the Fix round; round 1's diff is `superseded-r1/diffs/audit-import.diff` `b318236ccf86fe2fcdf4faedaede09286b696f52`)\n"),
 ("## Mutations (the mutate.mjs TEXT copy; `diffs/mutate.diff`, blob `5bf2624b6f01ca27e04e994def5f6bef4cfd328e`)\n", "## Mutations, round 1 (**SUPERSEDED**: five entries now, see the Fix round; round 1's diff is `superseded-r1/diffs/mutate.diff` `5bf2624b6f01ca27e04e994def5f6bef4cfd328e`)\n"),
 ("## Runs (all bounded `setsid -w timeout -k 10 600`; one at a time; lock checked first; none timed out; none skipped)\n", "## Runs, round 1 (**SUPERSEDED** by the Fix round's runs; kept as the record. All bounded `setsid -w timeout -k 10 600` except the two node invocations disclosed below; one at a time; lock checked first; none timed out; none skipped)\n"),
 ("### NEXT-VERSION.md entry (after the two U2 entries, before \"Unresolved after R1–R5\")\n", "### NEXT-VERSION.md entry, round 1 (**SUPERSEDED** by the Fix round's draft)\n"),
 ("### Replacement for the U13 line in NEXT-VERSION's \"Unresolved after R1–R5\" list\n", "### Replacement for the U13 line in NEXT-VERSION's \"Unresolved after R1–R5\" list, round 1 (**SUPERSEDED** in part by the Fix round's draft)\n"),
 ("### Ledger (`recovery/v200/UNRESOLVED-LEDGER.md`)\n", "### Ledger (`recovery/v200/UNRESOLVED-LEDGER.md`), round 1 (**SUPERSEDED** by the Fix round's draft)\n"),
 ("## Appendix: the other two exact diffs\n", "## Appendix: the other two exact diffs, round 1 (**SUPERSEDED**: now `diffs/mutate.diff` `02b8fe25` and `diffs/audit-import.diff` `bc619202`)\n"),
 ("EXDB and RPDB are set the way the v1.95 W2 fixture sets them (audit-import L4182–4183)", "EXDB and RPDB are set the way the v1.95 W2 fixture sets them (audit-import L4182 and L4184)"),
]
for a, b in R:
    assert s.count(a) == 1, a
    s = s.replace(a, b, 1)
open(p, 'w', encoding='utf-8').write(s); print('marked', len(R))
