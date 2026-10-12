# mkvar.py <before board> <out> : the SENSITIVITY VARIANT "entry check only" -- the earlier one-line proposal (rec/L2/u13codex
# var-refuse-busy): driveStorePull refuses at its entry while a save is under way, and checks nothing after its waits.
import sys
b = open(sys.argv[1], encoding='utf-8').read()
f = "async function driveStorePull(quiet){\n  if(!driveStoreOn()) return false;\n"
r = "async function driveStorePull(quiet){\n  if(!driveStoreOn() || _saveBusy) return false;\n"
assert b.count(f) == 1
open(sys.argv[2], 'w', encoding='utf-8').write(b.replace(f, r, 1)); print('written')
