#!/bin/bash
# build_evidence.sh <head-sha> <evidence-dir-on-disk>: the OCIO evidence package (POA&M P-05, due 6 Nov 2026).
# Text and git only; nothing is executed from the repository. Output: $OUT/ORBIT-evidence-<sha7>/ and a .zip of it.
set -e
SP=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad
R=/home/user/orbit-board; H=$1; H7=${H:0:7}; EV=$2
OUT=$SP/rec/L8/ocio/evidence; D=$OUT/ORBIT-evidence-$H7; mkdir -p $D/source $D/results
git -C $R cat-file -e $H^{commit}
# 1. source: a git bundle of the PR head (full history from main), and the delivered file's digest
git -C $R update-ref refs/heads/evidence-$H7 $H
git -C $R bundle create -q $D/source/orbit-board-$H7.bundle main refs/heads/evidence-$H7
git -C $R bundle verify -q $D/source/orbit-board-$H7.bundle
git -C $R show $H:prioritization-board-grid.html > $D/source/prioritization-board-grid.html
( cd $D/source && sha256sum prioritization-board-grid.html orbit-board-$H7.bundle > SHA256SUMS.txt )
# 2. dependencies
{ echo "ORBIT dependencies at $H7"; echo
  echo "The delivered file (prioritization-board-grid.html) has no dependencies: it loads nothing outside itself,"
  echo "and tools/check.mjs fails if it references anything external."
  echo; echo "The repository's package.json declares two packages, used only by its test suites:"
  git -C $R show $H:package.json | python3 -I -c "import json,sys; d=json.load(sys.stdin); [print('  %-16s %s  (%s)'%(k,v,s)) for s,dd in (('dependencies',d.get('dependencies',{})),('devDependencies',d.get('devDependencies',{}))) for k,v in dd.items()]"
  echo; echo "Installed versions used for the recorded results:"; (cd $R && npm ls --depth=0 2>/dev/null | tail -n +2)
  echo; echo "Runtime: Node $(node --version), npm $(npm --version); Chromium for the browser checks (playwright-core)."
  echo; echo "Gap (POA&M P-05): there is no package-lock.json yet, so versions are not pinned by the repository."
} > $D/DEPENDENCIES.txt
# 3. how to run the checks (there is no build step)
{ echo "ORBIT: build and test instructions at $H7"; echo
  echo "There is no build step. The delivered artifact is prioritization-board-grid.html as committed. The original"
  echo "generator, build_prio_board.py, was lost and retired on 11 Sep 2026 (commit 09cf071); the HTML in git is the source."
  echo; echo "To run the checks: Node 22, then in a clone: npm install; npm run check; then each suite (npm run <name>):"
  git -C $R show $H:package.json | python3 -I -c "import json,sys; [print('  %-14s %s'%(k,v)) for k,v in json.load(sys.stdin)['scripts'].items()]"
  echo; echo "audit:import is run alone (nothing else running). npm run mutate is not part of these results."
} > $D/BUILD-AND-TEST.txt
# 4. results at the tested tree
cp -r $EV/. $D/results/
git -C $R log --format='%h %ad %s' --date=short main..$H | grep -v -i 'records only\|no product change' > $D/results/PRODUCT-COMMITS.txt || true
( cd $OUT && zip -qr -FS ORBIT-evidence-$H7.zip ORBIT-evidence-$H7 )
ls -la $OUT/ORBIT-evidence-$H7.zip
