# verify/mkmut.py : DISPOSABLE one-line sensitivity mutants of the commit-2 board (c2, 8a0d23b6), TEXT ONLY; each find must
# match exactly once. Written to verify/mut/. Nothing here touches the builder's files or orbit-board.
import hashlib, os, sys
V = os.path.dirname(os.path.abspath(__file__)); D = os.path.dirname(V)
c2 = open(os.path.join(D, 'c2/prioritization-board-grid.html'), encoding='utf-8').read()
REF = "  if(_saveBusy){ setStat('⏳ A save is under way — put the kept work back once it finishes. Nothing was changed: the kept work is still kept, and what is on screen is unchanged.'); render(); return; }\n"
CONF_END = " : 'What is on screen now is still in '+keptWhere(k.meta)+' it came from, and 💾 Save will ask before writing over that.'))) return;\n"
def once(s, f, r, what):
    n = s.count(f)
    if n != 1: sys.exit(f'FAIL {what}: find matched {n}')
    return s.replace(f, r)
M = {
 # the folder checkpoint the put-back brings back is not restored in memory (U2-b's mechanism by another route)
 'V1-folder-ckpt-not-restored': [("  try{ _driveBase=Object.assign({}, b.folder||{}); }catch(e){}\n", "")],
 # the file checkpoint the put-back brings back is not restored
 'V2-file-ckpt-not-restored': [("  LASTKNOWN=+b.file||0;\n", "")],
 # the refusal also touches the kept slot (one trailing space: still parses)
 'V3-refusal-touches-kept': [(REF, REF.replace("if(_saveBusy){ ", "if(_saveBusy){ try{ localStorage.setItem(_AP.key+'.kept', localStorage.getItem(_AP.key+'.kept')+' '); }catch(e){} "))],
 # the refusal moves what is on screen by one millisecond
 'V4-refusal-touches-screen': [(REF, REF.replace("if(_saveBusy){ ", "if(_saveBusy){ MS.ts=(+MS.ts||0)+1; "))],
 # the refusal comes only after the question is asked
 'V5-refusal-after-confirm': [(REF, ""), (CONF_END, CONF_END + REF)],
 # the refusal says nothing
 'V6-refusal-silent': [(REF, "  if(_saveBusy){ render(); return; }\n")],
 # a save that THROWS leaves the busy count up (only a save that resolves brings it down)
 'V7-busy-leaks-on-throw': [("Promise.resolve().then(fn).finally(function(){ _saveBusy--; });", "Promise.resolve().then(fn).then(function(r){ _saveBusy--; return r; });")],
}
for k, edits in M.items():
    s = c2
    for f, r in edits: s = once(s, f, r, k)
    p = os.path.join(V, 'mut', k + '.html'); open(p, 'w', encoding='utf-8').write(s)
    b = s.encode('utf-8'); print(k, hashlib.sha1(b'blob %d\0' % len(b) + b).hexdigest())
# V8 (added after the first seven ran): the refusal forgets the kept work's menu/header entry (_keptMeta), though the slot stays
s = once(c2, REF, REF.replace("if(_saveBusy){ ", "if(_saveBusy){ _keptMeta=null; "), 'V8')
p = os.path.join(V, 'mut', 'V8-refusal-hides-kept-entry.html'); open(p, 'w', encoding='utf-8').write(s)
b = s.encode('utf-8'); print('V8-refusal-hides-kept-entry', hashlib.sha1(b'blob %d\0' % len(b) + b).hexdigest())
