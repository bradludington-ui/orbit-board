#!/bin/bash
# ui-bundle.sh : backs up the LOCAL UI branch claude/v200-ui (never pushed) as a git bundle on claude/v200-fixes-wip, the
# only allowed push target, and PROVES it restores the exact branch: a fresh clone of the backup branch from the remote
# (which holds the bundle's prerequisite 4a6f7c7) fetches the branch from the bundle; the restored tip, tree and full
# commit list (4a6f7c7..tip) must equal the local branch's. Commits and pushes only the bundle and its manifest
# (recovery/v200/ui-backup/), and only when the tip changed. Refuses if any product file is staged.
set -e
R=/home/user/orbit-board; UI=/home/user/orbit-ui; BR=${1:-claude/v200-ui}; BASE=${2:-4a6f7c7}   # optional: another local UI branch
TAG=${BR//\//-}; D=$R/recovery/v200/ui-backup; mkdir -p $D
TIP=$(git -C $UI rev-parse $BR); TREE=$(git -C $UI rev-parse $BR^{tree}); S=$(git -C $UI rev-parse --short=7 $TIP)
et() { TZ=America/New_York date '+%I:%M:%S %p ET'; }
L=$D/LATEST; [ "$BR" = claude/v200-ui ] || L=$D/LATEST-$TAG
if [ -f $L ] && [ "$(cat $L)" = "$TIP" ]; then echo "UI branch unchanged at $TIP; bundle $D/$TAG-$S.bundle already backed up and verified"; exit 0; fi
W=$(mktemp -d /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uibundle.XXXX)
git -C $UI bundle create $W/ui.bundle $BASE..$BR 2>$W/create.log
SRC=https://github.com/bradludington-ui/orbit-board
timeout 300 git clone -q --branch claude/v200-fixes-wip --single-branch $SRC $W/restore 2>/dev/null || { SRC="$R (local; the remote clone failed)"; git clone -q --branch claude/v200-fixes-wip --single-branch $R $W/restore; }
git -C $W/restore cat-file -e $BASE^{commit}
git -C $W/restore bundle verify $W/ui.bundle > $W/verify.log 2>&1
git -C $W/restore fetch -q $W/ui.bundle "$BR:refs/heads/restored-ui"
RT=$(git -C $W/restore rev-parse restored-ui); RTR=$(git -C $W/restore rev-parse restored-ui^{tree})
diff <(git -C $UI rev-list $BASE..$BR) <(git -C $W/restore rev-list $BASE..restored-ui) > $W/revlist.diff
[ "$RT" = "$TIP" ] && [ "$RTR" = "$TREE" ] && [ ! -s $W/revlist.diff ] || { echo "RESTORE CHECK FAILED: tip $RT vs $TIP, tree $RTR vs $TREE"; exit 3; }
for old in $D/$TAG-*.bundle; do [ -e "$old" ] && git -C $R rm -q --cached "$old" 2>/dev/null; rm -f "$old"; done   # superseded bundles stay in history
cp $W/ui.bundle $D/$TAG-$S.bundle
{ echo "# $BR backup, made $(et) (12 Oct 2026)"
  echo "tip: $TIP"; echo "tree: $TREE"; echo "prerequisite (in claude/v200-fixes-wip's history): $(git -C $UI rev-parse $BASE)"
  echo "board blob at tip: $(git -C $UI rev-parse $BR:prioritization-board-grid.html)"
  echo "bundle: $TAG-$S.bundle  sha256 $(sha256sum $W/ui.bundle | cut -d' ' -f1)  bytes $(stat -c%s $W/ui.bundle)"
  echo "restore check: clone of claude/v200-fixes-wip from $SRC, git bundle verify OK, fetched tip = $RT, tree = $RTR, commit list identical ($(git -C $UI rev-list --count $BASE..$BR) commits)"
  echo "restore with: git clone -b claude/v200-fixes-wip <repo> r && cd r && git fetch recovery/v200/ui-backup/$TAG-$S.bundle $BR:$BR"
  echo; echo "commits ($BASE..$BR):"; git -C $UI log --format='%h %s' $BASE..$BR; } > $D/$TAG-$S.MANIFEST.txt
echo $TIP > $L; rm -rf $W
cd $R; git add $D
[ -z "$(git diff --cached --name-only -- prioritization-board-grid.html tools package.json NEXT-VERSION.md)" ] || { echo "REFUSED: product files staged"; exit 2; }
git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit -q -m "recovery/v200: UI branch backup, $BR at $S, restore verified (no product change)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01MqCBDiYHPZfnyapxhXKxBm"
for i in 1 2 3 4; do timeout 120 git push -q origin claude/v200-fixes-wip 2>&1 | tail -1 && break; sleep $((2**i)); done
echo "UI bundle backed up: $S ($TIP), restore verified, commit $(git rev-parse --short HEAD)"
