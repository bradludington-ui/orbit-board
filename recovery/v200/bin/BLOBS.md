# recovery/v200/bin: the lead's run scripts, with their blobs (git hash-object). Updated 10:08 AM ET, 12 Oct (runner correction).
# The final-tree queue is final-tree-v4.sh. It runs ONLY from a frozen (chattr +i), task-local snapshot of this directory
# at a full backup commit SHA, verifies the snapshot file for file and blob for blob, and re-checks each helper's blob
# against that commit immediately before running it. runner-selftest.sh holds the bounded refusal checks.

## The final-tree queue (v4) and what it runs
8d42c95384d487764d794a3290cae95ebb6d6733  final-tree-v4.sh
a18f2a073d31a1317d6daec203e24f45f53b3fb4  gate.sh
1fcbca06819a40388c4e8b34aa2758e1f750c071  mkmanifest.py
1133a0a769861492eeba2c7d2dfbceb3410d6884  alone-run.sh
5a79b216dd9c55daa61fb0d37b21c0eba93c54a3  sens-import.sh
72e810f272fef0d7b60db7d1b2287c21afbf8032  overlap-watch.sh
b7a4b2925768164890a2d6797d74cbb8d75121ab  backup-run.sh
7734a8e424ada94618aa1ba1422b2c05a2b82601  sens.sh
92f49af20cde2c746447c585ab99c188cb30ed08  run.sh
140b7b6a9c7d9d9b75f7bfdf6a0fe82d1912c8eb  mkmut.py
8e46e669ab4292a9dfd6243e14fb4e0463eef66e  mcread.py
852f06ec5a61a1c1393bae794f1c10362aa36cf9  mcount.py
154236e1f501cffe1062eb5f8e4cb53aa719d986  runner-selftest.sh

## Superseded, held, or used by earlier runs (not run by v4)
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
