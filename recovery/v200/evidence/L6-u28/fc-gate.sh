#!/bin/bash
# fc-gate.sh <dir> -- <command...> : runs <command> with FONTCONFIG_FILE=<dir>/fonts.conf (written by fc-nosegoe.sh), but
# only after font-env.mjs, under the same setting, says this machine draws the board's 'Segoe UI', Arial, sans-serif in
# Arial's widths at every weight. Otherwise it REFUSES and the command is not run (exit 3). Run from the repository root.
# U28 proposal, not adopted (Brad's decision); for example:
#   fc-gate.sh <dir> -- npm run verify:grid
#   fc-gate.sh <dir> -- node tools/layout-fits.mjs --board <the board with the Segoe stand-in at +6%, standin-template.mjs>
# The second line is the Windows-margin pass layout-fits has no pass of its own for; run it every time the first is run.
set -u
[ $# -ge 3 ] && [ "$2" = "--" ] || { echo "usage: fc-gate.sh <dir> -- <command...>" >&2; exit 2; }
D=$(realpath -m -- "$1"); shift 2
H=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
[ -f "$D/fonts.conf" ] || { echo "fc-gate: REFUSED: no $D/fonts.conf (write it with fc-nosegoe.sh); not run: $*" >&2; exit 3; }
FONTCONFIG_FILE="$D/fonts.conf" node "$H/font-env.mjs"; rc=$?
[ $rc = 0 ] || { echo "fc-gate: REFUSED: font-env.mjs said exit $rc under FONTCONFIG_FILE=$D/fonts.conf; not run: $*" >&2; exit 3; }
echo "fc-gate: font-env OK; running with FONTCONFIG_FILE=$D/fonts.conf: $*"
FONTCONFIG_FILE="$D/fonts.conf" exec "$@"
