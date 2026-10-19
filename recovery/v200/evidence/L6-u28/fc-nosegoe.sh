#!/bin/bash
# fc-nosegoe.sh <dir> -- writes <dir>/fonts.conf: this image's own fontconfig (/etc/fonts/fonts.conf and every file in
# /etc/fonts/conf.d) with ONE line left out, the alias that makes 'Segoe UI' resolve to Inter in
# /etc/fonts/conf.d/56-prefer-inter.conf. Nothing in /etc is changed. With FONTCONFIG_FILE=<dir>/fonts.conf, Chromium
# finds no 'Segoe UI' and draws the board's 'Segoe UI', Arial, sans-serif in Arial's metric twin, Liberation Sans --
# the font the browser checks say they measure in. Every other alias (sans-serif, system-ui ... -> Inter) is kept.
# U28 proposal, not adopted: whether verify:grid runs this way is Brad's decision. Use it only through fc-gate.sh,
# which refuses to run anything unless font-env.mjs says this machine draws the board in Arial's widths.
#
# Fix round (13 Oct): <dir> is made absolute first (a relative one wrote a config whose include did not resolve, so
# fontconfig loaded no conf.d and drew everything in FreeSerif); <dir> must be new or empty and not under /etc (a
# symlink left in it was written through, and <dir>=/etc/fonts would have truncated fonts.conf); a machine without
# 56-prefer-inter.conf is told there is nothing to leave out, instead of "the alias is still there".
set -eu
[ $# = 1 ] || { echo "usage: fc-nosegoe.sh <dir>   (a new or empty directory)" >&2; exit 2; }
D=$(realpath -m -- "$1")
case "$D" in /etc|/etc/*) echo "fc-nosegoe: $D is under /etc; give a new directory elsewhere (nothing in /etc is ever written)" >&2; exit 2;; esac
case "$D" in *[!A-Za-z0-9_./-]*) echo "fc-nosegoe: $D has characters this script does not quote; use letters, digits, _ . / - only" >&2; exit 2;; esac
if [ -e "$D" ] && [ -n "$(ls -A "$D")" ]; then echo "fc-nosegoe: $D is not empty; give a new or empty directory" >&2; exit 2; fi
SRC=/etc/fonts/conf.d/56-prefer-inter.conf
if [ ! -f "$SRC" ]; then
  echo "fc-nosegoe: this machine has no $SRC, so there is no 'Segoe UI' -> Inter alias to leave out; nothing written." >&2
  echo "fc-nosegoe: check the machine as it is with font-env.mjs (no FONTCONFIG_FILE); if it says OK, no setting is needed." >&2
  exit 3
fi
mkdir -p "$D/conf.d"
for f in /etc/fonts/conf.d/*.conf; do
  n=$(basename "$f")
  if [ "$n" = 56-prefer-inter.conf ]; then grep -v '<family>Segoe UI</family>' "$f" > "$D/conf.d/$n"
  else ln -sn "$(readlink -f "$f")" "$D/conf.d/$n"; fi
done
sed "s#<include ignore_missing=\"yes\">conf.d</include>#<include ignore_missing=\"yes\">$D/conf.d</include>#" /etc/fonts/fonts.conf > "$D/fonts.conf"
grep -q "<include ignore_missing=\"yes\">$D/conf.d</include>" "$D/fonts.conf" || { echo "fc-nosegoe: /etc/fonts/fonts.conf has no conf.d include to redirect" >&2; exit 1; }
[ "$(grep -c '<family>Segoe UI</family>' "$D/conf.d/56-prefer-inter.conf")" = 0 ] || { echo "fc-nosegoe: the Segoe UI alias is still there" >&2; exit 1; }
[ "$(grep -c '<family>Segoe UI</family>' "$SRC")" -ge 1 ] || echo "fc-nosegoe: note: $SRC had no 'Segoe UI' line, so the copy is the same as the machine's" >&2
echo "FONTCONFIG_FILE=$D/fonts.conf  ($(ls "$D/conf.d" | wc -l) files in conf.d; /etc/fonts/conf.d has $(ls /etc/fonts/conf.d/*.conf | wc -l))"
