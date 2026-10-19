# mkmine2.py <after board> <outdir> : the verifier's own round-2 mutants of the after board (98eed7e8). Each is a list of
# (find, repl) pairs; every find must match the board exactly once (asserted) and is applied in order. Prints one line each.
import sys, os
src = open(sys.argv[1], encoding='utf-8').read(); out = sys.argv[2]
GUARD = ("  if(_saveBusy){\n    const lbl=esc(APPN_LBL[mySlug()]||mySlug())+' FY'+(MS.cur%100);\n"
  "    if(!quiet) setStat('⏳ The shared folder’s copy of '+lbl+' was <b>not loaded</b>: a save or Load theirs was under way, so '\n"
  "      +'this board kept its own copy of '+lbl+'. The folder’s copy is checked again on the next refresh once that has '\n"
  "      +'finished (📡 Live view → ↻ Refresh now, or on its own while Live view is on).');\n    render(); return false;\n  }\n")
ENTRY = "async function driveStorePull(quiet){\n  if(!driveStoreOn()) return false;\n"
BETWEEN = "  let j;\n  try{ j=await driveStoreRead(dir, mySlug()); }\n"
ADOPT = "  const own=ownUnsaved(MS, j.store, baseGet());\n  const ka=own? keepAside(MS, {why:'folder', by:j.by||'', ts:theirs}, baseGet()) : true;\n"
BASEG = "    if(!base){ if(!_saveBusy) driveBaseSet(mySlug(), theirs); }\n"
WORDS1 = "a save or Load theirs was under way, so '"
LBL = "    const lbl=esc(APPN_LBL[mySlug()]||mySlug())+' FY'+(MS.cur%100);\n"
CONN_REST = "  _driveNeed='';\n  await driveStorePull(false);\n  try{ await driveExecPull(true); }catch(e){}\n"
AUTO_REST = "  _driveDir=h; _driveNeed='';\n  await driveStorePull(false);\n  try{ await driveExecPull(true); }catch(e){}\n"
RESOLVE = "  return saveSerial(function(){ return _driveResolveRun(which); });\n"
GUARD_NOSTAT = GUARD.replace("    if(!quiet) setStat(", "    if(false) setStat(")
M = {
 # placement: the check only at entry (before any wait), with the new words; the after-wait check removed (base guard kept)
 'm2-entry-only': [(GUARD, ''), (ENTRY, ENTRY + GUARD)],
 # the check between the two waits (after driveDir, before driveStoreRead); the after-wait check removed
 'm2-between-waits': [(GUARD, ''), (BETWEEN, GUARD + BETWEEN)],
 # the check after ownUnsaved (pure) but before keepAside: should be equivalent (an equivalent mutant; escape is expected)
 'm2-after-ownunsaved': [(GUARD, ''), (ADOPT, ADOPT.split('\n')[0] + '\n' + GUARD + ADOPT.split('\n')[1] + '\n')],
 # words: name the save only (Load theirs dropped)
 'm2-words-save-only': [(WORDS1, "a save was under way, so '")],
 # words: the old false claim appended
 'm2-words-nothing-changed': [("finished (📡 Live view → ↻ Refresh now, or on its own while Live view is on).');\n    render(); return false;",
                               "finished (📡 Live view → ↻ Refresh now, or on its own while Live view is on). Nothing was changed.');\n    render(); return false;")],
 # words: the year written in full (FY2027)
 'm2-words-full-year': [(LBL, "    const lbl=esc(APPN_LBL[mySlug()]||mySlug())+' FY'+(MS.cur);\n")],
 # words: label not escaped (O&M renders the same; an equivalent mutant on these fixed labels)
 'm2-lbl-no-esc': [(LBL, "    const lbl=(APPN_LBL[mySlug()]||mySlug())+' FY'+(MS.cur%100);\n")],
 # a quiet refresh speaks too
 'm2-quiet-says': [("    if(!quiet) setStat('⏳ The shared folder’s copy of '", "    setStat('⏳ The shared folder’s copy of '")],
 # a Connect refuses silently (nothing said)
 'm2-connect-silent': [(GUARD, GUARD_NOSTAT)],
 # the Connect, after the refused pull, says it connected (the refusal's words overwritten)
 'm2-connect-overwrites': [(CONN_REST, "  _driveNeed='';\n  if(!(await driveStorePull(false)) && _saveBusy) setStat('✓ Connected to the shared folder.');\n  try{ await driveExecPull(true); }catch(e){}\n"),
                           (AUTO_REST, "  _driveDir=h; _driveNeed='';\n  if(!(await driveStorePull(false)) && _saveBusy) setStat('✓ Connected to the shared folder.');\n  try{ await driveExecPull(true); }catch(e){}\n")],
 # the Connect stops after a refused pull (execution data, estimates and the log not loaded during a save) -- a design
 # alternative, not a defect: shows whether (6a) pins the pre-existing behaviour
 'm2-connect-stops': [(CONN_REST, "  _driveNeed='';\n  await driveStorePull(false); if(_saveBusy){ driveBar(); render(); return true; }\n  try{ await driveExecPull(true); }catch(e){}\n"),
                      (AUTO_REST, "  _driveDir=h; _driveNeed='';\n  await driveStorePull(false); if(_saveBusy){ driveBar(); render(); return true; }\n  try{ await driveExecPull(true); }catch(e){}\n")],
 # Load theirs no longer waits in the save queue (not counted): (6b)'s premise
 'm2-resolve-unqueued': [(RESOLVE, "  return _driveResolveRun(which);\n")],
 # silent narrowing: refuse only when this browser holds no work that no saved copy has
 'm2-refuse-only-clean': [("  if(_saveBusy){\n    const lbl=", "  if(_saveBusy && !ownUnsaved(MS, j.store, baseGet())){\n    const lbl=")],
 # silent narrowing: refuse only when the folder's copy was written by somebody else
 'm2-refuse-only-others': [("  if(_saveBusy){\n    const lbl=", "  if(_saveBusy && j.by!==whoAmI()){\n    const lbl=")],
 # the refusal records the folder's time as the base (a flag changed on refusal)
 'm2-refuse-sets-base': [("    render(); return false;\n  }\n  // WORK THIS BROWSER HOLDS", "    driveBaseSet(mySlug(), theirs); render(); return false;\n  }\n  // WORK THIS BROWSER HOLDS")],
 # the refusal marks LIVEDB as refreshed (Live view's "Loaded" time moves) -- outside state(); expected to escape
 'm2-refuse-touches-livedb': [("    render(); return false;\n  }\n  // WORK THIS BROWSER HOLDS", "    LIVEDB.last=Date.now(); render(); return false;\n  }\n  // WORK THIS BROWSER HOLDS")],
}
for k, pairs in M.items():
    b = src
    for f, r in pairs:
        n = b.count(f)
        assert n == 1, (k, n, f[:80])
        b = b.replace(f, r, 1)
    assert b != src, k
    open(os.path.join(out, k + '.html'), 'w', encoding='utf-8').write(b)
    print(k, 'written,', len(pairs), 'edit(s), each find matched once')
