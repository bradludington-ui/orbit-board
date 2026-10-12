# relabel.py <audit-import.mjs> : (fix round) the four (4a)-(4d) checks labelled "(a CONTROL)" that fail on the board before
# U13 are preconditions, not controls: the defect changes the state they describe. Each label is replaced exactly once.
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
PRE = ' (a precondition, not a control: before U13 the refresh during the save has already loaded the folder’s copy)'
for old in ["'the save landed (WORKING, saved); then Brad’s other browser loaded WORKING and saved NEWER over it (a CONTROL)'",
            "'the save failed and says so: REMOTE still the folder’s copy; WORKING on screen, unsaved; no save under way (read from _saveBusy) (a CONTROL)'",
            "'the save is refused and says so: nothing written, NEWER still the folder’s copy; WORKING on screen, unsaved; no save under way (a CONTROL)'",
            "'the save asked once and was canceled: nothing written, REMOTE still the folder’s copy; WORKING on screen, unsaved; no save under way (a CONTROL)'"]:
    assert s.count(old) == 1, old
    s = s.replace(old, old.replace(' (a CONTROL)', PRE), 1)
open(p, 'w', encoding='utf-8').write(s); print('relabelled 4')
