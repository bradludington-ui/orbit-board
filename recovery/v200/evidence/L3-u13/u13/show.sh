#!/bin/bash
# show.sh <label> : the run's summary line(s) and every recorded check (verdict | place | claim | observed) -- from rec/L2/u2impl/show.sh
U=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L3/u13
grep -E "ALL CHECKS PASSED|FAILING CHECK|^# exit|threw" $U/logs/$1.log | cut -c1-300
python3 -I -c "
import json,sys
n=0;f=0
for l in open('$U/out/$1.checks.jsonl'):
    s,w,what,ok,got=json.loads(l); n+=1; f+= (not ok); print('PASS' if ok else 'FAIL', '|', s[6:22], '|', w[:60], '|', what[:90], '|', got[:160])
print('checks', n, 'failing', f)"
