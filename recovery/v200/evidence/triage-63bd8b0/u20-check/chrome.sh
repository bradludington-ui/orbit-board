#!/bin/bash
# chrome.sh <pass> : the builder's chromium-locks.mjs (byte-identical copy in rerun/) and the checker's chromium-file.mjs,
# each ONE bounded q.sh call (setsid -w timeout -k 10 600; the AUDIT_IMPORT_RUNNING lock checked first). Chromium is
# /opt/pw-browsers/chromium through b63/tools/chrome.mjs; playwright install is never run.
U=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u20-check
P=$1
unset CHROME_BIN
bash $U/q.sh chromium-locks-$P node $U/rerun/chromium-locks.mjs $U/b63 $U/rerun/out/chromium.$P.json > /dev/null
bash $U/q.sh chromium-file-$P node $U/x/chromium-file.mjs $U/b63 $U/x/out/chromium-file.$P.json > /dev/null
echo "chrome $P done $(TZ=America/New_York date '+%T %Z')"
