# mkentries.py <after board> <mutate.after.mjs.txt> : writes the three v2.00 (U13) mutation entries into the mutate.mjs TEXT
# copy, before the R3 landed-view line. Finds are taken from the after board as text; nothing from mutate.mjs is run.
import sys, json
board, mut = sys.argv[1], sys.argv[2]
b = open(board, encoding='utf-8').read(); m = open(mut, encoding='utf-8').read()
S1 = "    if(!base){ if(!_saveBusy) driveBaseSet(mySlug(), theirs); }\n"
S1o = "    if(!base) driveBaseSet(mySlug(), theirs);\n"
S2 = "  if(_saveBusy){\n    if(!quiet) setStat('⏳ <b>Nothing was loaded</b> from the shared folder"
S2o = "  if(false){\n    if(!quiet) setStat('⏳ <b>Nothing was loaded</b> from the shared folder"
assert b.count(S1) == 1 and b.count(S2) == 1
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
  '    repl: ' + q(spanR) + ' },\n')
R3 = "  // v2.00 (R3, Brad 11 Oct): a save that lands under a locked view says it saved the working plan.\n"
assert m.count(R3) == 1
m = m.replace(R3, E + R3, 1)
open(mut, 'w', encoding='utf-8').write(m)
print('entries written; span', len(span), 'chars,', span.count('\n'), 'lines')
