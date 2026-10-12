# verify/mkprobe.py : the builder's block-2 focused harness (b87c616b) with ONE added verifier scenario (g), inserted just
# before block 2's `} catch (e) {`: the folder's AUTOSAVE (liveTick, Live on) held at the close of its write of the folder's
# copy, which then THROWS (fold.failNext.main). Expected values are hand-written literals. Output: verify/c2v/tools/export-audit/probe-u2-g.mjs (v2: plus a header check after the refusal)
import os, sys
V = os.path.dirname(os.path.abspath(__file__)); D = os.path.dirname(V)
h = open(os.path.join(D, 'c2/tools/export-audit/focused-u2-block2.mjs'), encoding='utf-8').read()
ANCHOR = "    await afterFile(A, f, sc, ['K', 'S1']); }\n  } catch (e) {\n"
assert h.count(ANCHOR) == 1, h.count(ANCHOR)
G = """  // (g) VERIFIER PROBE. THE FOLDER'S AUTOSAVE THROWS: Live on, the refresh's autosave is held at the close of its write of the
  // folder's copy, which then fails. The autosave's error goes through the save queue as a thrown error, not a returned false.
  { const sc = '(g) PROBE the folder: put back while the autosave writes; the write throws';
    const { A, fold } = await inFolder();
    live(A.ev);
    const n0 = fold.hits.main || 0; fold.hold.main = gate(); fold.failNext.main = new Error('The shared folder is read-only');
    const r = await refused(A, () => (fold.hits.main || 0) > n0, fold.hold.main, A.ev('liveTick()'));
    chk(name, sc, RQ, J(r.v), J(REFUSED));
    chk(name, sc, 'after the refusal, the header still offers the kept work (↶ work kept aside), so the retry can be reached', /work kept aside/.test(header(A.ev)), true);
    chk(name, sc, 'once it throws: S1 on screen and unsaved, N still in the folder, the board says the automatic save failed, no save running (read from _saveBusy); the kept work byte for byte as it was',
      J([scr(A.ev), fold.note(2027, 'A'), ...unsaved(A.ev), /Automatic save to the shared folder failed/.test(status(A.ev)), A.ev('_saveBusy'), keptRaw(A.ev) === r.kr]),
      J(['S1', 'N', true, true, true, true, 0, true]));
    chk(name, sc, 'put back again: one question; K on screen, unsaved; S1 kept aside in its place',
      J(retry(A)), J([1, 'K', true, true, true, 'S1']));
    await afterFolder(A, fold, sc, 'N', ['K', 'S1']); }
"""
out = h.replace(ANCHOR, "    await afterFile(A, f, sc, ['K', 'S1']); }\n" + G + "  } catch (e) {\n")
out = out.replace('// FOCUSED harness (reuse review)', '// VERIFIER PROBE built by verify/mkprobe.py from the FOCUSED harness (reuse review)', 1)
p = os.path.join(V, 'c2v/tools/export-audit/probe-u2-g.mjs'); open(p, 'w', encoding='utf-8').write(out); print('written', p)
