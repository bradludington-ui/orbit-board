# mkmine.py <before board> <after board> <outdir> : the verifier's own mutants of U13 (text replacements, each find asserted
# to match exactly once). Nothing from mutate.mjs is read or run. Each mutant is written as <outdir>/<id>.html.
import sys, os
before = open(sys.argv[1], encoding='utf-8').read()
after = open(sys.argv[2], encoding='utf-8').read()
out = sys.argv[3]
G_HEAD = "  if(_saveBusy){\n    if(!quiet) setStat('⏳ <b>Nothing was loaded</b> from the shared folder: a save was under way. Nothing was changed: what is on '\n      +'screen is as it was. The folder’s copy is checked again on the next refresh once the save has finished '\n      +'(📡 Live view → ↻ Refresh now, or on its own while Live view is on).');\n    render(); return false;\n  }\n"
BASE_G = "    if(!base){ if(!_saveBusy) driveBaseSet(mySlug(), theirs); }\n"
BASE_OLD = "    if(!base) driveBaseSet(mySlug(), theirs);\n"
ENTRY = "async function driveStorePull(quiet){\n  if(!driveStoreOn()) return false;\n"
MSG = "if(!quiet) setStat('⏳ <b>Nothing was loaded</b> from the shared folder: a save was under way. Nothing was changed: what is on '\n      +'screen is as it was. The folder’s copy is checked again on the next refresh once the save has finished '\n      +'(📡 Live view → ↻ Refresh now, or on its own while Live view is on).');"
KA = "  const own=ownUnsaved(MS, j.store, baseGet());\n  const ka=own? keepAside(MS, {why:'folder', by:j.by||'', ts:theirs}, baseGet()) : true;\n  if(ka==='occupied'){ setStat(keptOccupiedMsg(j.by, theirs, 'the shared folder')); render(); return false; }\n"
APPLY = "  applyStore(j.store);\n  driveBaseSet(mySlug(), theirs, true);\n  persist(); render();\n"
DIRTYG = "  if(DIRTY){\n    // UNSAVED WORK BEATS A NEWER FOLDER COPY."
NOTNEWER = "  if(theirs<=ours){\n    // NOT NEWER THAN WHAT IS ON SCREEN"
def once(s, f):
    n = s.count(f)
    assert n == 1, (f[:80], n)
def rep(s, pairs):
    for f, r in pairs:
        once(s, f); s = s.replace(f, r, 1)
    return s
G_ENTRY = "async function driveStorePull(quiet){\n  if(!driveStoreOn()) return false;\n  if(_saveBusy){\n    " + MSG + "\n    render(); return false;\n  }\n"
M = {}
# The check made only BEFORE the waits (at entry, with the same words), both after-wait checks removed.
M['mine-entry-only'] = rep(after, [(G_HEAD, ''), (BASE_G, BASE_OLD), (ENTRY, G_ENTRY)])
# The check at entry AND the base guard; the adoption re-check after the waits removed.
M['mine-entry-plus-base'] = rep(after, [(G_HEAD, ''), (ENTRY, G_ENTRY)])
# The re-check placed after the work is kept aside (keepAside runs, then the pull is refused).
M['mine-after-keepaside'] = rep(after, [(G_HEAD, ''), (KA, KA + G_HEAD)])
# The re-check placed after applyStore + driveBaseSet + persist (the copy is loaded, then "refused").
M['mine-after-apply'] = rep(after, [(G_HEAD, ''), (APPLY, APPLY + G_HEAD.replace("render(); return false;", "return false;"))])
# Refused only when quiet (a Connect still loads).
M['mine-quiet-only'] = rep(after, [("  if(_saveBusy){\n    if(!quiet)", "  if(_saveBusy && quiet){\n    if(!quiet)")])
# Refused only when not quiet (the Live timer still loads).
M['mine-loud-only'] = rep(after, [("  if(_saveBusy){\n    if(!quiet)", "  if(_saveBusy && !quiet){\n    if(!quiet)")])
# Said even by the quiet Live timer.
M['mine-said-quiet'] = rep(after, [("  if(_saveBusy){\n    if(!quiet) setStat('⏳", "  if(_saveBusy){\n    if(true) setStat('⏳")])
# A Connect refuses silently.
M['mine-silent'] = rep(after, [("  if(_saveBusy){\n    if(!quiet) setStat('⏳", "  if(_saveBusy){\n    if(false) setStat('⏳")])
# The refusal answers true (as if it had loaded).
M['mine-returns-true'] = rep(after, [("+'(📡 Live view → ↻ Refresh now, or on its own while Live view is on).');\n    render(); return false;", "+'(📡 Live view → ↻ Refresh now, or on its own while Live view is on).');\n    render(); return true;")])
# Counts only a second save (off by one).
M['mine-busy-gt1'] = rep(after, [("  if(_saveBusy){\n    if(!quiet)", "  if(_saveBusy>1){\n    if(!quiet)")])
# The other flag (_autoBusy, the Live autosave only).
M['mine-autobusy'] = rep(after, [("  if(_saveBusy){\n    if(!quiet)", "  if(_autoBusy){\n    if(!quiet)")])
# Instead of refusing, COUNT the adoption (_saveGen++) and adopt (the ledger's "counting alone does not fix it").
M['mine-count-instead'] = rep(after, [(G_HEAD, "  if(_saveBusy) _saveGen++;\n")])
# Refused, but the copy seen is recorded as the base.
M['mine-refuse-records-base'] = rep(after, [("  if(_saveBusy){\n    if(!quiet)", "  if(_saveBusy){ driveBaseSet(mySlug(), theirs);\n    if(!quiet)")])
# Refused, but browser storage written (persist) on the way out.
M['mine-refuse-persists'] = rep(after, [("  if(_saveBusy){\n    if(!quiet)", "  if(_saveBusy){ persist();\n    if(!quiet)")])
# The words lose their "once the save has finished" (the said() check's last clause).
M['mine-words-no-when'] = rep(after, [("The folder’s copy is checked again on the next refresh once the save has finished '", "The folder’s copy is checked again on the next refresh '")])
# No render() in the refusal.
M['mine-no-render'] = rep(after, [("+'(📡 Live view → ↻ Refresh now, or on its own while Live view is on).');\n    render(); return false;", "+'(📡 Live view → ↻ Refresh now, or on its own while Live view is on).');\n    return false;")])
# The base guard folded into the condition: during a save with nothing recorded, a false clash is said instead.
M['mine-base-else-clash'] = rep(after, [(BASE_G, "    if(!base && !_saveBusy) driveBaseSet(mySlug(), theirs);\n")])
# The re-check moved up to just after the waits, before the DIRTY guard (silences Cb's words).
M['mine-before-dirty'] = rep(after, [(G_HEAD, ''), (DIRTYG, G_HEAD + DIRTYG)])
# The re-check moved up before the not-newer branch (after the waits): silences Cb and the clash said during a save.
M['mine-before-notnewer'] = rep(after, [(G_HEAD, ''), (BASE_G, BASE_OLD), (NOTNEWER, G_HEAD + NOTNEWER)])
# The base guard dropped, the adoption guard kept (= the builder's v200-u13-base-while-saving; a cross-check).
M['mine-no-base-guard'] = rep(after, [(BASE_G, BASE_OLD)])
os.makedirs(out, exist_ok=True)
for k, v in M.items():
    open(os.path.join(out, k + '.html'), 'w', encoding='utf-8').write(v)
    print(k, len(v))
