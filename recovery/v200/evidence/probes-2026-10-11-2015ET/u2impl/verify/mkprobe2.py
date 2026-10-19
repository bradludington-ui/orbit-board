# verify/mkprobe2.py : the builder's block-2 focused harness (b87c616b) with ONE added verifier scenario (h): the folder's
# AUTOSAVE (liveTick, Live on) held at the close of its write of the folder's copy, the put-back refused there, then the
# autosave lands (it succeeds). What does the status line say once it has landed? Hand-written literal expectations; the
# status expectation is what a person would need (no "save under way" once none is). Output: verify/c2v/tools/export-audit/probe-u2-h.mjs
import os
V = os.path.dirname(os.path.abspath(__file__)); D = os.path.dirname(V)
h = open(os.path.join(D, 'c2/tools/export-audit/focused-u2-block2.mjs'), encoding='utf-8').read()
ANCHOR = "    await afterFile(A, f, sc, ['K', 'S1']); }\n  } catch (e) {\n"
assert h.count(ANCHOR) == 1
H = """  // (h) VERIFIER PROBE. THE FOLDER'S AUTOSAVE LANDS AFTER THE REFUSAL: what the status line says once no save is under way.
  { const sc = '(h) PROBE the folder: put back while the autosave writes; the autosave goes in';
    const { A, fold } = await inFolder();
    live(A.ev);
    const n0 = fold.hits.main || 0; fold.hold.main = gate();
    const r = await refused(A, () => (fold.hits.main || 0) > n0, fold.hold.main, A.ev('liveTick()'));
    chk(name, sc, RQ, J(r.v), J(REFUSED));
    const st = status(A.ev);
    chk(name, sc, 'once the autosave has landed: S1 in the folder and saved, no save running (read from _saveBusy)',
      J([scr(A.ev), fold.note(2027, 'A'), ...unsaved(A.ev), A.ev('_saveBusy')]), J(['S1', 'S1', false, false, false, 0]));
    chk(name, sc, 'once the autosave has landed, the status line no longer says a save is under way (observed text recorded)',
      J([/A save is under way/.test(st), st.slice(0, 120)]), J([false, '(any text not saying a save is under way)'])); }
"""
out = h.replace(ANCHOR, "    await afterFile(A, f, sc, ['K', 'S1']); }\n" + H + "  } catch (e) {\n")
out = out.replace('// FOCUSED harness (reuse review)', '// VERIFIER PROBE built by verify/mkprobe2.py from the FOCUSED harness (reuse review)', 1)
p = os.path.join(V, 'c2v/tools/export-audit/probe-u2-h.mjs'); open(p, 'w', encoding='utf-8').write(out); print('written', p)
