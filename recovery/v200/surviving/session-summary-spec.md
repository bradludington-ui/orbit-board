# Specifications carried in the session's working summary (unverified; for reimplementation)

Source: the working summary the ORBIT session kept, written before 13:49 UTC on 11 Oct 2026, together with the
session's later history. These are the specifications and code exactly as recorded there. Nothing here has been
re-verified. The lost SHAs are history only.

## Standing rules (Brad)

- **Release discipline:**
  - Log changes in NEXT-VERSION.md.
  - The can't-fails are data loss and math; every exportable product must be 100% correct.
  - Times are reported in Eastern.
  - Nothing merges or publishes without Brad's go.
- **Agent rules:**
  - One editor at a time (AGENTS.md).
  - A review finding is not permission to fix.
  - Never import `mutate.mjs`, never run `playwright install`, never commit a populated board.
- **Commit trailers:** commits end with the Co-Authored-By and Claude-Session lines. No model identifiers in commits or
  PRs. GitHub comments end with the Claude Code footer.
- **Scope limits:** the private findings annex stays outside the repo. Don't hand out exploit scripts. Don't make the
  import door refuse more than needed.

## R1–R5 (Codex review of main f9b4413; fixes approved by Brad on 11 Oct)

### R1: execution precedence by appropriation and effective FY

The fix (lost commit b2e5c66):
- `flowExecYears(sl, raw)` by effective year (`flowEffFy`);
- `flowIsMixed` / `flowMixLines`;
- saved-year chip retention.

Contract:
- **Variant B:**
  - FY25 reads its $300M plan.
  - FY26 reads $100M executed and $0 planned.
  - FY25 + FY26 = $400M, labelled planned + executed.
  - The export shows `US SERVICE FUNDING 400000000` and a NOTE: planned and executed money in one total.
- **Variant A:**
  - FY25 = $40M executed; FY26 = $100M.
  - Both = $140M executed, and the export agrees.
- **Also required:**
  - Raw execution history is preserved.
  - A saved FY25-only selection never silently becomes all years; the selection stays [2025].
  - The selectors, labels, disclosures and exports agree.
  - The "total unchanged" claim is replaced. Help says each row is counted once, in its effective year, and execution
    never also from plan.

The R1 test fixture (lost commit d963748): in audit-recon's `open`, `st.bm={disc:[P[y]], mand:[0], adds:[]};`. The
board keeps the per-year pot in S.bm, and applyState → applyBudget rebuilds discSvc from bm.

### R2: an EEIC is checked in the form it is stored (trimmed, upper-cased)

- Typed `ß×10`: upper-cased it is 20 characters, so it is refused. The list keeps AAAAA, the field is marked, and the
  status says the EEIC was not changed.
- Typed `ﬃ×4`: upper-cased it is 12 characters, so it is refused. The list keeps AAAAA, the field is marked.
- Controls:
  - " ab12c " is kept trimmed and upper-cased as AB12C, and the field is not marked.
  - ABCDEFGHIJ is kept.
  - A value that is exactly 10 characters when upper-cased (SSSSSSSSSS) is kept.

### R3: a locked view is never written to the working folder

`_driveStorePushRun` re-checks `cycBlock` after its read. Nothing is written to the main copy while a locked cycle is
on screen, and the folder stays byte-identical.

### R4: a save already waiting does not write past a mixed-import hold

`_saveInPlaceFileRun` re-checks the hold after the file read.

### R4b: a Save asked for during the mixed-import hold is refused before the file is touched

Brad's contract: "a Save requested while the mixed-import hold is already active must refuse immediately, before file
access. Clearing the hold later must not resume that refused request."
- The test expects `perm 0 · read 0 · open 0`.
- The board says Save is refused at once.
- After the hold is cleared during a held read, nothing is written and the board file keeps its bytes.

### R5: a restore during a save stays unsaved

`driveRestore` bumps `_saveGen` (`_saveGen++`). After the restore, the earlier copy is on screen (HISTORY) and the
board stays unsaved.

### Mutation anchors

`unsaved-flag-never-set` and `impmixed-file-unguarded` are anchored on their indent, because the R5 and R4 fixes
repeat the lines they target:

```
"\n  try{ if(!_baseDirty)…"
"\n  if(impMixedBlock('Saving to the board file')) return;\n"
```

## Reload safety (lost commits 6022c50 and 71f44a5): code as recorded

```js
const IMP_MIXED_KEY='prio27impMixed';
let _impPend=null;
function impPendBegin(W, file, kind){
  _impPend=null;
  let raw=null; try{ raw=localStorage.getItem(IMP_MIXED_KEY); }catch(e){ return false; }
  let prev=null, unknown=false;
  if(raw!==null){ try{ prev=JSON.parse(raw); }catch(e){ prev=null; } if(!prev || !Array.isArray(prev.keys)) unknown=true; }
  const keys=W.map(function(w){ return w[0]; });
  if(prev && Array.isArray(prev.keys)) prev.keys.forEach(function(k){ if(keys.indexOf(k)<0) keys.push(k); });
  const m=JSON.stringify({t:Date.now(), file:String(file||''), kind:String(kind||''), pending:true, keys:keys, unknown:unknown||!!(prev&&prev.unknown)});
  let back=null;
  try{ localStorage.setItem(IMP_MIXED_KEY, m); back=localStorage.getItem(IMP_MIXED_KEY); }catch(e){ back=null; }
  if(back!==m){ try{ if(raw===null) localStorage.removeItem(IMP_MIXED_KEY); else localStorage.setItem(IMP_MIXED_KEY, raw); }catch(e){} return false; }
  _impPend={prev:raw}; return true;
}
function impPendDone(W){ const ok=W.every(function(w){ try{ return localStorage.getItem(w[0])===w[1]; }catch(e){ return false; } }); _impPend=null; if(ok) impMixedLift(W.map(function(w){ return w[0]; })); return ok; }
function impPendUndo(){ const p=_impPend; _impPend=null; if(!p) return; try{ if(p.prev===null) localStorage.removeItem(IMP_MIXED_KEY); else localStorage.setItem(IMP_MIXED_KEY, p.prev); }catch(e){} }
function impPendPrev(){ if(_impPend) return _impPend.prev; try{ return localStorage.getItem(IMP_MIXED_KEY); }catch(e){ return null; } }
function impPendRefused(fname){ /* alert + */ setStat('⛔ <b>Nothing was imported</b> — browser storage could not first record that an import was under way, so no list was changed; this board is exactly as it was. Free some browser storage and import again.'); return false; }
```

The later session history shows the full text of `impPendRefused`'s alert, of `impMixedLift` and of the opening guard
lines.

Other parts of the same change:
- **impMixedLift** refuses `m.unknown || !Array.isArray(m.keys)`. The partial-keys test is on its own line.
- **impMixedOn** treats a mark it cannot read as a hold (its catch returns true).
- **fullImportUndone**, in the `done.back` branch, calls `impPendUndo()`.
- **Full import:**
  - `if(!impPendBegin(W, fname, 'full')) return impPendRefused(fname);`
  - then `lsAll`, then `impPendDone(W)`.
- **One appropriation:**
  - `if(!impPendBegin(W, fname, 'one')){ impMemRestore(mem); return impPendRefused(fname); }`
  - and `impPendDone(W)` after.
- **importBoards:**
  - `impPendBegin` before `lsAll`, refusing if it fails;
  - on a full putting-back, `{ impPendUndo(); return none(...); }`;
  - on success, `if(W.length) impPendDone(W);`.
- **fullImportUndone and batchImportUndone** merge `impPendPrev()`, not the current pending mark.
- **destMigrate:** the opening's writes are guarded by `_destHoldOpen=impMixedOn()`:
  - declaration: `var … _destOpening=false, _destHoldOpen=false;`
  - the cycles' `lsSet`, and the dest write under `if(keep && !(_destOpening && _destHoldOpen))`.
- **persist()**'s refusal message uses `impMixedMsg('')` when `impMixedOn()`.

### Limits recorded in NEXT-VERSION

- Mixtures made before v2.00, where the mark was refused, cannot be identified.
- Recovery guidance: don't save from that browser until the board on screen has been checked against the board file.
- The rescue copies live only in the page.

## Later layers

See the session-record extract for the exact text:
- the key-counting helper `w2ImportK` and its ledgers;
- the scenario-ran guard indent fix;
- the mark-contents requirement (`w2MarkSays`, `W2_MARK_WANT`);
- the storage-full ledger checks;
- the full-import message change (`impDoneText` and `impMixedMsg`'s unsure branch);
- the notes texts;
- the expectation change to "An import stopped part-way in this browser and could not be put back";
- the case 18(a) synthetic label;
- the catalog repair diff for `impmixed-never-lifted` and `impmixed-lift-partial`;
- the mutation diffs for `impmixed-file-unguarded`, M4 and M11.

Lost entirely, with no full text surviving: the agent-written test blocks (reload cases 1–18, 10b, 15, 16–18), the
retarget diff for the five position-aimed checks, and the one-appropriation / several-board notice board diff.
