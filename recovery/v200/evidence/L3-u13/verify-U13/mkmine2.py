# mkmine2.py <after board> <outdir> : two more verifier mutants (text, each find asserted once).
import sys, os
after = open(sys.argv[1], encoding='utf-8').read(); out = sys.argv[2]
G_HEAD = "  if(_saveBusy){\n    if(!quiet) setStat('⏳ <b>Nothing was loaded</b> from the shared folder: a save was under way. Nothing was changed: what is on '\n      +'screen is as it was. The folder’s copy is checked again on the next refresh once the save has finished '\n      +'(📡 Live view → ↻ Refresh now, or on its own while Live view is on).');\n    render(); return false;\n  }\n"
READ = "  let j;\n  try{ j=await driveStoreRead(dir, mySlug()); }\n"
SHELL = "  if(IS_SHELL){\n    applyStore(j.store);\n"
def rep(s, pairs):
    for f, r in pairs:
        assert s.count(f) == 1, (f[:60], s.count(f)); s = s.replace(f, r, 1)
    return s
M = {}
# The re-check placed BETWEEN the two waits (after the folder handle, before the read of the copy).
M['mine-between-waits'] = rep(after, [(G_HEAD, ''), (READ, G_HEAD + READ)])
# The re-check made only on the template shell's branch.
M['mine-shell-only'] = rep(after, [(G_HEAD, ''), (SHELL, "  if(IS_SHELL){\n" + G_HEAD.replace('  ', '    ', 1) + "    applyStore(j.store);\n")])
for k, v in M.items():
    open(os.path.join(out, k + '.html'), 'w', encoding='utf-8').write(v); print(k)
