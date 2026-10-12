# recovery/v200/bin: the lead's run scripts, with their blobs (git hash-object). Updated for RUNNER CORRECTION 2, 12 Oct.
# The final-tree queue is final-tree-v5.sh. It runs ONLY from a frozen (chattr -R +i, root included), task-local snapshot
# <outdir>/runner of this directory at a full commit SHA that is on origin's claude/v200-fixes-wip at launch (ls-remote; a failed
# read refuses). It checks the snapshot entry for entry (find) and blob for blob, and re-checks each helper, immediately before
# running it, against that commit. Every runner shell script starts with the same preamble (bash -p, re-exec under env -i, a
# fixed environment, provenance git without system/global config or replace refs, blob ids computed directly). run.sh waits
# with setsid -w and writes <log>.exit; gate.sh accepts only that record, an unchanged log and the verdict as the suite's last
# line. runner-selftest.sh holds the bounded refusal checks.

## The final-tree queue (v5) and what it runs
d78bb3301e44b7a9a18e528d40033ffc824f04ce  final-tree-v5.sh
8dbf1d622f21801d9064d3bb84789a0d352cf544  gate.sh
f540388631da9decae9dcb3318d60ec85a9ced27  run.sh
a800c817ae49089c598b219f927a4c593294153a  alone-run.sh
bffa326eaed13f3d9c28f13589826931e18eb645  sens-import.sh
fb616ebd2174bc471b9b08f9352507a1ad743c2b  sens.sh
f69a68e8f83254609d0024f4e087c494aae6be45  backup-run.sh
3a41d4d8ed0191fb74c99a2d8eb1028d508dd583  overlap-watch.sh
1fcbca06819a40388c4e8b34aa2758e1f750c071  mkmanifest.py
140b7b6a9c7d9d9b75f7bfdf6a0fe82d1912c8eb  mkmut.py
8e46e669ab4292a9dfd6243e14fb4e0463eef66e  mcread.py
852f06ec5a61a1c1393bae794f1c10362aa36cf9  mcount.py
a2a52bf4033328746abda425c3fdfcd9fd54f3c9  runner-selftest.sh

## Superseded, held, or used by earlier runs (not run by v5)
8d42c95384d487764d794a3290cae95ebb6d6733  final-tree-v4.sh  (runner correction 1, 40f7979: NOT APPROVED by its review -- M1, M2; superseded by v5)
a879738c333af7f8561405e16d019e8c537fabcc  final-tree-v3.sh
241d94b128bae86290330b75f9aa7a3765106de2  final-tree-v2.superseded-0701.sh
8cfa1060f3a279c5b9ef27849f27d1181cb856cf  final-tree.sh
2bea07b6b4c1e622561d5b378fb10a5aeb119591  sens-chain.sh
8b24d6861b28e5b94eb8e9446949abdad1f64858  ui-bundle.sh
c5e7edd8e572474e3806d21cd867c7b83f17c020  alone-u2.sh
8bd9ebfcc919f1d51d88c6c3d539cfe0d0715c61  alone-u2b.sh
d05592cd11196559199a0cb3bc5577e8e085a8d1  backup-sens.sh
a07bc8261675061ed4fb5371a4a00a47d52dfcd8  commitcheck.sh
47afb39e76dfa1d44e82725860c5c67fc4b50abd  mkcopy.sh
