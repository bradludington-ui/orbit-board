#!/bin/bash
# mkh.sh : the focused harnesses, cut VERBATIM by the U18 builder's own harness builder (rec/L6/u18/bin/mkfocused-multi.py, copied
# byte for byte to bin/) with the builder's own specs (rec/L6/u18/bin/rebuild-fr4.sh), from the COMMITTED audit-import
# (after/tools/export-audit/audit-import.mjs = a4881ec's) into harness/after/; the hold and U2/U13 sets also from the PARENT's
# suite into harness/before/ (to show those blocks are unchanged). Then copied into h/<copy>/tools/export-audit/ beside a link
# to that copy's own boot.mjs. Text only: python3 -I and git hash-object.
set -e
F=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/a4881ec
M=$F/bin/mkfocused-multi.py
for c in after before; do
  S=$F/$c/tools/export-audit/audit-import.mjs; H=$F/harness/$c; mkdir -p $H
  if [ $c = after ]; then
    python3 -I $M $S $H/h-u18.mjs "marker:// ==== v2.00 (U18): a copy saved while a folder save is under way is never written over ====|// ==== end v2.00 (U18) ===="
  fi
  python3 -I $M $S $H/h-hold.mjs \
    "marker:// ==== v2.00 (R3): a locked view is never written to the working folder ====|// ==== end v2.00 (R3) ====" \
    "marker:// ==== v2.00 (R3, Brad 11 Oct): a save that lands under a locked view says it saved the working plan ====|// ==== end v2.00 (R3) message ====" \
    "marker:// ==== v2.00 R4: Save and the mixed-import hold (R4, R4b) ====|// ==== end v2.00 R4 ====" \
    "marker:// ==== v2.00 (U3): a Save asked for during the mixed-import hold is refused at once, never queued ====|// ==== end v2.00 (U3) ====" \
    "marker:// ==== v2.00 (U4): the folder save checks the mixed-import hold after its read and before its write ====|// ==== end v2.00 (U4) ====" \
    "marker:// ==== v2.00 (R5): a restore during a save stays unsaved ====|// ==== end v2.00 (R5) ===="
  python3 -I $M $S $H/h-u2u13.mjs \
    "marker:// ==== v2.00 (U2): work put back during a save stays unsaved ====|// ==== end v2.00 (U2) put back waits ====" \
    "marker:// ==== v2.00 (U13): a refresh during a save loads nothing ====|// ==== end v2.00 (U13) ===="
done
for c in after before; do
  D=$F/h/$c/tools/export-audit; mkdir -p $D
  [ -e $F/h/$c/node_modules ] || ln -s /home/user/orbit-board/node_modules $F/h/$c/node_modules
  [ -e $D/boot.mjs ] || ln -s $F/$c/tools/export-audit/boot.mjs $D/boot.mjs
  cp $F/harness/after/h-*.mjs $D/      # the COMMITTED suite's cut runs on both boards
done
git hash-object $F/harness/after/*.mjs $F/harness/before/*.mjs
