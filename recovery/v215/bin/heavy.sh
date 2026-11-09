#!/usr/bin/env bash
# v2.15: run one heavy command (a whole suite, a prove.py run, a browser check) under a machine-wide limit of TWO at a time.
# Four builders share one 15 GB, 4-core container; v2.14's fixers lost a dozen runs to the kernel's OOM killer (exit 137).
# Usage: recovery/v215/bin/heavy.sh node tools/export-audit/audit-import.mjs
#        recovery/v215/bin/heavy.sh env JOBS=1 python3 -I -B recovery/v208/bin/prove.py ids.json out.jsonl
# The heap is 6 GB unless HEAP says otherwise. An exit 137 is the container, never a verdict: run it again.
HEAP=${HEAP:-6144}
export NODE_OPTIONS="${NODE_OPTIONS:-} --max-old-space-size=$HEAP"
while :; do
  for slot in a b; do
    exec 9>"/tmp/orbit-heavy-$slot.lock"
    if flock -n 9; then "$@"; rc=$?; flock -u 9; exit $rc; fi
  done
  sleep 5
done
