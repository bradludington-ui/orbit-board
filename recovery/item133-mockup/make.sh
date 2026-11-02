#!/bin/sh
# Item 133 mock-up: builds the workbook, saves it once through LibreOffice so it carries computed values (a phone or mail
# preview then shows figures, not blanks; the formulas stay live), and checks the saved file.
#   sh make.sh
set -e
D=$(cd "$(dirname "$0")" && pwd); T=${TMPDIR:-/tmp}/item133-mockup; rm -rf "$T"; mkdir -p "$T/out"
python3 -I "$D/xlsx.py" "$D" "$T/raw.xlsx"
soffice --headless --calc --convert-to xlsx --outdir "$T/out" "$T/raw.xlsx" >/dev/null 2>&1
cp "$T/out/raw.xlsx" "$D/ORBIT Service Share mock-up.xlsx"
python3 -I "$D/check.py" "$D" "$D/ORBIT Service Share mock-up.xlsx" "$T/check"
rm -rf "$D/__pycache__"
