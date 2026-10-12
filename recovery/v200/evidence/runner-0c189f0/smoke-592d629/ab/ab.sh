#!/bin/bash
# A/B for the verify:grid layout failure under the runner's fixed environment: layout-fits.mjs alone at 592d629, three ways.
AB=$(cd "$(dirname "$0")" && pwd -P); C=$AB/../clone; RB=$AB/../../../bin
cd $C
setsid -w timeout -k 10 600 node tools/layout-fits.mjs > $AB/A-inherited-noLANG.log 2>&1 & echo "$! A" >> $AB/pids.txt; wait $!; echo "A exit $?" >> $AB/exits.txt
setsid -w env LANG=C.UTF-8 timeout -k 10 600 node tools/layout-fits.mjs > $AB/B-inherited-LANG.log 2>&1 & echo "$! B" >> $AB/pids.txt; wait $!; echo "B exit $?" >> $AB/exits.txt
RUNNER_PIDS=$AB/pids-runner.txt $RB/run.sh $AB/C-runner-env.log 600 X=1 -- node tools/layout-fits.mjs > /dev/null; echo "C exit $(awk '$1=="exit"{print $2}' $AB/C-runner-env.log.exit)" >> $AB/exits.txt
