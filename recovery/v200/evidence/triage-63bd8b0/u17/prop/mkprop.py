# mkprop.py : builds prop/prioritization-board-grid.proposed.html from a COPY of b63's board (98eed7e8) and writes the
# proposal's diff. TEXT ONLY: the result is never run, never copied anywhere else; the base and orbit-board are untouched.
import shutil, subprocess
U='/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u17'
src=U+'/b63/prioritization-board-grid.html'; dst=U+'/prop/prioritization-board-grid.proposed.html'
s=open(src, encoding='utf-8').read()
def rep(old, new):
    global s
    assert s.count(old)==1, old[:80]
    s=s.replace(old, new)
REFUSE_NOTE = ("  // PROPOSAL (U17 via U24, rec/L4/u17): NOT WHILE A SAVE IS UNDER WAY, as U13 refuses the folder's copy and U2 refuses\n"
               "  // ↶ Put back. A save that lands records the copy IT wrote as the one the work on screen came from and marks the board\n"
               "  // saved, while the screen shows the copy loaded here; the next 💾 Save then writes that over the save's copy unasked.\n")
rep("""function adoptShared(){
  if(!SHARED) return;
""", """function adoptShared(){
  if(!SHARED) return;
""" + REFUSE_NOTE + """  if(_saveBusy){ setStat('\\u23f3 The shared state file was <b>not loaded</b>: a save was under way. Nothing was changed. '
    +'<button type="button" class="nb lnk" onclick="adoptShared()">Load the shared one</button> once it has finished.'); render(); return; }
""")
rep("""  if((st.ts||0)>=(MS.ts||0)){
    if(!sharedKeepMine(st)) return;""", """  if((st.ts||0)>=(MS.ts||0)){
""" + REFUSE_NOTE.replace('  //', '    //') + """    if(_saveBusy){ setStat('\\u23f3 The shared state file ('+esc(fmtTs(st.ts))+') was <b>not loaded</b>: a save was under way. '
      +'Nothing was changed. <button type="button" class="nb lnk" onclick="adoptShared()">Load the shared one</button> once it has finished.'); return; }
    if(!sharedKeepMine(st)) return;""")
rep("""    +'This browser\\u2019s own work is NOT kept \\u2014 only in a copy you saved yourself.')) return;
  if(applyStore(PUB)===false) return;""", """    +'This browser\\u2019s own work is NOT kept \\u2014 only in a copy you saved yourself.')) return;
""" + REFUSE_NOTE + """  // Checked after the question, immediately before anything is changed.
  if(_saveBusy){ setStat('\\u23f3 The saved file\\u2019s version was <b>not opened</b>: a save was under way. Nothing was changed. '
    +'Open it once the save has finished.'); render(); return; }
  if(applyStore(PUB)===false) return;""")
open(dst, 'w', encoding='utf-8').write(s)
d=subprocess.run(['diff','-u','--label','a/prioritization-board-grid.html','--label','b/prioritization-board-grid.html',src,dst],capture_output=True,text=True).stdout
open(U+'/prop/proposal-P1.diff','w',encoding='utf-8').write(d)
print(d)
