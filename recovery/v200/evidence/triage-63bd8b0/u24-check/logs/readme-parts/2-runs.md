
## Every run (from `logs/runs.txt`; each through q.sh; output in `logs/<label>.log`)
Non-zero exits are all harness slips, explained in `logs/deviations.txt`:
- ls-lock 2: the lock file was absent.
- xcheck-y2-fails 1: grep over a filtered log.
- end-ob-head 128: `--short` with a tree path.
- xtable-y4 1: `grep -c` counted 0 mismatches.

| label | start (ET) | exit | wall s |
|---|---|---|---|
