# mkpatch.py <base board> <outdir> -- writes one PATCHED COPY per proposal (P1..P4) under <outdir>/<P>/prioritization-board-grid.html.
# Text replacements only, each anchor asserted to occur exactly once. The base is read, never written. The copies are NEVER RUN
# by this probe (see PROPOSAL.md): they exist so each diff is exact and can be applied and tested by whoever builds it.
import sys, os
base, outdir = sys.argv[1], sys.argv[2]
src = open(base, encoding='utf-8').read()

P = {}
# ---- P1: U24's three paths refuse while a save is under way (as driveStorePull since U13) ----
P['P1'] = [
 ("function adoptShared(){\n  if(!SHARED) return;\n  if(!sharedKeepMine(SHARED)) return;\n",
  "function adoptShared(){\n  if(!SHARED) return;\n"
  "  // U24 (proposed): NOT WHILE A SAVE IS UNDER WAY, as driveStorePull since U13. A save landing afterwards records the copy IT\n"
  "  // wrote as the one the work came from and marks the board saved, while the screen would show this one. Nothing is changed:\n"
  "  // what is on screen, the work kept aside and this browser's record stay as they were.\n"
  "  if(_saveBusy){\n"
  "    setStat('\\u23f3 The shared state file was <b>not loaded</b>: a save was under way, so nothing was replaced. '\n"
  "      +'Once it has finished, reopen the board to be offered the shared state file again.');\n"
  "    return;\n"
  "  }\n"
  "  if(!sharedKeepMine(SHARED)) return;\n"),
 ("  // aside first, or nothing is loaded.\n  if(DIRTY){\n",
  "  // aside first, or nothing is loaded.\n"
  "  // U24 (proposed): AN ANSWER THAT ARRIVES WHILE A SAVE IS UNDER WAY replaces nothing (see adoptShared); it is offered instead.\n"
  "  if(_saveBusy){\n"
  "    setStat('\\u23f3 The shared state file ('+esc(fmtTs(st.ts))+') arrived while a save was under way, so <b>nothing was replaced</b>. '\n"
  "      +'Once the save has finished: <button type=\"button\" class=\"nb lnk\" onclick=\"adoptShared()\">load the shared one</button> '\n"
  "      +'(what you have is kept aside first).');\n"
  "    return;\n"
  "  }\n"
  "  if(DIRTY){\n"),
 ("    +'This browser\\u2019s own work is NOT kept \\u2014 only in a copy you saved yourself.')) return;\n  if(applyStore(PUB)===false) return;\n",
  "    +'This browser\\u2019s own work is NOT kept \\u2014 only in a copy you saved yourself.')) return;\n"
  "  // U24 (proposed): NOT WHILE A SAVE IS UNDER WAY (see adoptShared). Checked after the question, immediately before the load.\n"
  "  if(_saveBusy){\n"
  "    setStat('\\u23f3 The saved file\\u2019s version was <b>not opened</b>: a save was under way, so nothing was replaced. '\n"
  "      +'Once it has finished, reopen the file to see what it holds.');\n"
  "    return;\n"
  "  }\n"
  "  if(applyStore(PUB)===false) return;\n"),
]
# ---- P2 (outside U24): bootTakeFile in folder mode leaves the board unsaved with respect to the folder ----
P['P2'] = [
 ("  if(applyStore(PUB)===false) return;\n  LASTKNOWN=PUB_FILE_TS; _baseDirty=false; baseSet({file:LASTKNOWN, dirty:false});\n  persist(); DIRTY=false; render();\n",
  "  if(applyStore(PUB)===false) return;\n"
  "  // (proposed, outside U24) WORKING OUT OF THE SHARED FOLDER, the file's version is not the folder's copy: it stays unsaved, so a\n"
  "  // reopen keeps it aside before a folder copy replaces it, and the header does not say Saved. The file's time is still recorded.\n"
  "  const fold=driveStoreOn();\n"
  "  LASTKNOWN=PUB_FILE_TS; _baseDirty=fold; baseSet({file:LASTKNOWN, dirty:fold});\n"
  "  persist(); DIRTY=fold; render();\n"),
]
# ---- P3 (outside U24): importBoards marks this browser's record when the board on screen took an import ----
P['P3'] = [
 ("    if(applied){ persist(); render(); }\n",
  "    // (proposed, outside U24) THE BOARD ON SCREEN TOOK AN IMPORT, and this browser's record says so. It said nothing: a reopen in a\n"
  "    // new session took the imported board as saved, and a newer folder copy then replaced it with nothing kept aside.\n"
  "    if(applied){ try{ if(!_baseDirty){ _baseDirty=true; baseSet({dirty:true}); } }catch(e){} persist(); render(); }\n"),
]
# ---- P4 (wording, outside U24): the in-place save names who wrote the bytes, not whoever's copy is on screen when it lands ----
P['P4'] = [
 ("    const gen=_saveGen, wrote=fileTsOf({appns:PUBS});\n",
  "    const gen=_saveGen, wrote=fileTsOf({appns:PUBS}), byWrote=MS.by||whoAmI();   // (proposed) who these bytes say saved them\n"),
 ("    setStat('💾 Saved in place by <b>'+esc(MS.by||whoAmI())+'</b>",
  "    setStat('💾 Saved in place by <b>'+esc(byWrote)+'</b>"),
]
for name, reps in P.items():
    t = src
    for old, new in reps:
        n = t.count(old)
        if n != 1:
            raise SystemExit(f'{name}: anchor found {n} times: {old[:80]!r}')
        t = t.replace(old, new)
    d = os.path.join(outdir, name)
    os.makedirs(d, exist_ok=True)
    open(os.path.join(d, 'prioritization-board-grid.html'), 'w', encoding='utf-8').write(t)
    print(name, 'written', len(t) - len(src), 'chars added')
