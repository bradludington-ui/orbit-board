# mkentries2.py <after board> <mutate.before.mjs.txt> <out mutate.after.mjs.txt> : (fix round) writes the FIVE v2.00 (U13)
# mutation entries into a fresh copy of the base mutate.mjs TEXT, before the R3 landed-view line. The first three are the
# earlier three with their finds re-taken from the fixed board (the refusal's words changed); two are new: the refusal saying
# "nothing was loaded" again, and the base-record guard folded into its condition (a false clash said during a save).
# Finds are taken from the after board as text; nothing from mutate.mjs is run.
import sys, json
board, base, out = sys.argv[1], sys.argv[2], sys.argv[3]
b = open(board, encoding='utf-8').read(); m = open(base, encoding='utf-8').read()
S1 = "    if(!base){ if(!_saveBusy) driveBaseSet(mySlug(), theirs); }\n"
S1o = "    if(!base) driveBaseSet(mySlug(), theirs);\n"
S1c = "    if(!base && !_saveBusy) driveBaseSet(mySlug(), theirs);\n"
S2 = ("  if(_saveBusy){\n    const lbl=esc(APPN_LBL[mySlug()]||mySlug())+' FY'+(MS.cur%100);\n"
      "    if(!quiet) setStat('⏳ The shared folder’s copy of '+lbl+' was <b>not loaded</b>")
S2o = "  if(false){" + S2[len("  if(_saveBusy){"):]
W = ("    if(!quiet) setStat('⏳ The shared folder’s copy of '+lbl+' was <b>not loaded</b>: a save or Load theirs was under way, so '\n"
     "      +'this board kept its own copy of '+lbl+'. The folder’s copy is checked again on the next refresh once that has '\n"
     "      +'finished (📡 Live view → ↻ Refresh now, or on its own while Live view is on).');\n")
Wo = ("    if(!quiet) setStat('⏳ <b>Nothing was loaded</b> from the shared folder: a save was under way. Nothing was changed: what is on '\n"
      "      +'screen is as it was. The folder’s copy is checked again on the next refresh once the save has finished '\n"
      "      +'(📡 Live view → ↻ Refresh now, or on its own while Live view is on).');\n")
for s in (S1, S2, W): assert b.count(s) == 1, s
i1 = b.index(S1); i2 = b.index(S2) + len(S2)
span = b[i1:i2]
spanR = S1o + span[len(S1):-len(S2)] + S2o
q = lambda s: json.dumps(s, ensure_ascii=False)
E = ("  // v2.00 (U13, Brad 12 Oct): a refresh during a save loads nothing.\n"
  '  { id: "v200-u13-pull-while-saving", area: "driveStorePull", what: "the folder\'s refresh no longer checks, after its last wait, for a save under way: a newer copy -- one already in the folder stamped ahead of this clock, or another writer\'s -- is loaded while a save writes, and the save, landing, records the board saved against its own copy while the screen shows the copy loaded; a refresh that began before the save started loads it too",\n'
  '    find: ' + q(S2) + ',\n'
  '    repl: ' + q(S2o) + ' },\n'
  '  { id: "v200-u13-base-while-saving", area: "driveStorePull", what: "with nothing recorded for the folder, a refresh during a save records the folder\'s copy as the one the work came from, so a save still to read the folder writes over that copy without asking",\n'
  '    find: ' + q(S1) + ',\n'
  '    repl: ' + q(S1o) + ' },\n'
  '  { id: "v200-u13-pull-unchecked", area: "driveStorePull", what: "every v2.00 (U13) check removed: the refresh loads a newer copy while a save writes (and records a copy as the base) as before U13, and the save lands recording the board saved against its own copy while the screen shows the copy loaded",\n'
  '    find: ' + q(span) + ',\n'
  '    repl: ' + q(spanR) + ' },\n'
  '  { id: "v200-u13-said-nothing-loaded", area: "driveStorePull", what: "a Connect during a save says nothing was loaded from the shared folder and nothing was changed, while the same Connect goes on to load the execution data, the reprogramming log and cost estimates from the folder; and it says a save was under way when it was Load theirs",\n'
  '    find: ' + q(W) + ',\n'
  '    repl: ' + q(Wo) + ' },\n'
  '  { id: "v200-u13-clash-while-saving", area: "driveStorePull", what: "with nothing recorded for the folder, a refresh during a save says the folder\'s copy was saved after the copy being worked from -- a clash nobody can know of -- and offers to load it or save over it",\n'
  '    find: ' + q(S1) + ',\n'
  '    repl: ' + q(S1c) + ' },\n')
R3 = "  // v2.00 (R3, Brad 11 Oct): a save that lands under a locked view says it saved the working plan.\n"
assert m.count(R3) == 1
m = m.replace(R3, E + R3, 1)
open(out, 'w', encoding='utf-8').write(m)
print('5 entries written; unchecked span', len(span), 'chars,', span.count('\n'), 'lines')
