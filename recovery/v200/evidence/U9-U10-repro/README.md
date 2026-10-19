# U9 and U10: bounded synthetic reproductions on main, WIP and the pinned tree

Written 11 Oct 2026, 22:4x UTC. These runs only reproduce and measure the findings. Nothing was fixed, and no code
change is proposed. Specification: `/home/user/orbit-board/recovery/v200/surviving/review-record-U9-U10-received-2026-10-11.md`.

## Result

| Finding | Tree | Commit | Board blob | Reproduced | Checks passed / failed | Failed checks by kind | Exit | Wall time |
|---|---|---|---|---|---|---|---|---|
| U9 | main (positive control) | f9b441365551cd691a20a8f0b08a374a92a12f0e | b160bc031c7f70a4492f64394893d9b74bb0f327 | **yes** | 54 / 6 | 6 defect, 0 control | 1 | 4.54 s |
| U9 | WIP | e635775ad1f33abe68af13bbae5557c6c3dd5543 | fd728f1ce84a5eef85cf33c6e2f2ca23374d3a3f | **yes** | 54 / 6 | 6 defect, 0 control | 1 | 4.55 s |
| U9 | **pinned** | a91402b3b7a93aa902a341a390748c3bd43f74e0 | 82c7f446b292af5a4c6f847170417eb9072df001 | **yes** | 54 / 6 | 6 defect, 0 control | 1 | 4.77 s |
| U10 | main (positive control) | f9b441365551cd691a20a8f0b08a374a92a12f0e | b160bc031c7f70a4492f64394893d9b74bb0f327 | **yes** | 22 / 4 | 4 defect, 0 control | 1 | 5.76 s |
| U10 | WIP | e635775ad1f33abe68af13bbae5557c6c3dd5543 | fd728f1ce84a5eef85cf33c6e2f2ca23374d3a3f | **yes** | 22 / 4 | 4 defect, 0 control | 1 | 5.20 s |
| U10 | **pinned** | a91402b3b7a93aa902a341a390748c3bd43f74e0 | 82c7f446b292af5a4c6f847170417eb9072df001 | **yes** | 22 / 4 | 4 defect, 0 control | 1 | 5.83 s |

Exit 1 means at least one check failed. It does not mean a crash. Every reported run finished, and every jsdom board
in it booted without script errors. Every failed check is one the record's defect predicts. Every control passed.

- **The positive control holds.** On main, both probes reproduce the record's own figures: $0/$1/$2 and $1/$3/$5 for U9,
  and 77777/AAAAA for U10. So the pinned results measure the findings and are meaningful.
- **Both findings reproduce on the pinned tree**, board blob 82c7f446…. Commits af892cb, 8e2dbe5, a91402b and 2b5b02b all
  have that same blob. The figures are the same on all three trees. In the U10 results the only difference is the
  combination key, which `rcnAdd()` derives from the clock.
- **Not measured:** the uncommitted working tree in `/home/user/orbit-board`. While these runs were under way, HEAD moved to
  2b5b02b, a ledger-only commit whose board blob is still 82c7f446…. The working tree also has staged and unstaged board
  edits (working-tree board blob 4d273c06… at the time of writing). Those edits touch only `flowMixWords`, `flowHtml`
  and `exportFlow`, none of the U9 or U10 code paths. They are someone else's, and nothing here verifies them.
- **The record's assertion counts are not reproduced, by design.** The record reports 29 passing checks and 5 failing for
  U9, and 44 and 9 for U10. These probes were written independently and group their checks differently: 54/6 and 22/4.
  What matches the record is every dollar figure, every code, the status text and every control outcome.

## Setup (read-only on the repository)

```
W=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L2/u9u10
git -C /home/user/orbit-board archive <sha> prioritization-board-grid.html tools package.json | tar -x -C $W/<tree>/copy
ln -s /home/user/orbit-board/node_modules $W/<tree>/copy/node_modules
cp /home/user/orbit-board/recovery/v200/probes/received-2026-10-11/runtime-encoding-shim.mjs $W/<tree>/copy/
git hash-object $W/<tree>/copy/prioritization-board-grid.html     # confirmed: b160bc03… main, fd728f1c… wip, 82c7f446… pinned
```

- `tools/export-audit/boot.mjs` has blob 9c4f49ad8cec537097bdf485458cfd2a09b06594 at all three commits. It was imported
  unmodified, and so was every other existing tool.
- The shim's sha256 is e689710a…c7981, which matches `SHA256SUMS` for the received file.
- Runtime: Node v22.22.0 and jsdom 27.4.0, from the repository's `node_modules`.
- Each probe computes its board's blob itself and confirms that `boot.mjs`'s `BOARD` resolves to that copy's board
  (`bootSelectsThisBoard: true` in every result). `BOARD`, `MUT_FIRST_FAIL` and `BOOT_PARSE` were unset for every run.
- `mutate.mjs` was never imported. No suite, gate, `verify:grid`, standards check, Playwright install or `validate:math` was run.

Every run went through `run.sh` (in this folder) as `env -u BOARD -u MUT_FIRST_FAIL -u BOOT_PARSE setsid timeout -k 10 600 node <probe> <copy root> <results json> <tree>`.
Runs went one at a time, each in under 6 s. PIDs are in `logs/pids.txt`, and exit codes and durations in `logs/*.meta`.

| Run tag | PID | Exit | Seconds | Note |
|---|---|---|---|---|
| u9-main-try1 (log kept as `u9-main.log`) | 28122 | 1 | 4.54 | The only main run of U9. The label is from before the run, when a retry was thought possible. |
| u9-wip | 28215 | 1 | 4.55 | |
| u9-pinned | 28283 | 1 | 4.77 | |
| u10-main-try1 (`u10-main-try1-crashed.*`) | 28510 | 1 | 3.01 | **A probe bug, not a finding.** `blLblTxt` does not exist on main and threw `ReferenceError`. The probe was changed to fall back to `blLbl`, and that one-line change is the only one. This crashed run is not used. |
| u10-main | 28542 | 1 | 5.76 | |
| u10-wip | 28587 | 1 | 5.20 | |
| u10-pinned | 28615 | 1 | 5.83 | |

After the runs, every PID listed was checked: none was alive, and no process from either probe remained. Final probe
hashes (sha256): `u9-probe.mjs` d8490cb3…d232b and `u10-probe.mjs` a9b4fa15…7fbfe5. All three reported U10 runs used the
final `u10-probe.mjs`.

## U9: PMO split disagreement

**Fixture.** The probe builds it through the board's own structures, following audit-recon W7 F4 and F6:
- An O&M board for FY27 with one service, USAF.
- PRIME-3, owned by PRIMES, is marked PRIME (`S.ptype`). Its ask equals its discretionary funding, $A, with no mandatory.
- `CLINS['PRIME-3']` holds CLINs 0010, 0002 and 0008, asking 1, 2 and 3. `DATA.clins` is set to that same object;
  `DATA.clins` was absent at boot.
- The board's CLIN-number rule in `pmoSharesOf` makes 0010 MxS, 0002 AV and 0008 TSS, so the weights are 1:2:3.

**Expected values** are worked out in the probe, with BigInt largest remainder over the integer weights 1:2:3. Each exact
share A·w/6 is floored. The dollars left over go one at a time to the largest remainders. Equal remainders go to the
lower index, which in list order is MxS, then AV, then TSS.

That tie rule is the one the CLIN source workbook uses. `srcRowsOf` calls `clinSplit(pid, i, amt)`, which calls
`apportion(amt, per)` with the CLIN grid's integer weights. `apportion` orders remainders with
`(a.r<b.r)? 1 : (a.r>b.r)? -1 : (a.i-b.i)`: largest remainder first, ties to the first index. No board helper is used for
any expectation.

**Surfaces read:**
1. The CLIN source workbook: the Spend Plan Source (`exportSrc`), read back from its bytes with `xlsxRead`. The Amount on
   each CLIN line is mapped to an office by its CLIN number.
2. `pmoPartsOf(it, tiers()[id])`, discretionary plus mandatory per office.
3. `forecast().byPMO[g].tot`.
4. The PMO Matrix sheet of `exportExcel`, read back from its bytes: TOTAL Disc plus TOTAL Mand per office.

Results are identical on main, WIP and pinned:

| Case | Expected MxS/AV/TSS | CLIN source workbook | PMO parts | Forecast | PMO Matrix export | Totals balance (all four) |
|---|---|---|---|---|---|---|
| $3 (tie) | $1/$1/$1 | $1/$1/$1 ✓ | **$0/$1/$2** ✗ | **$0/$1/$2** ✗ | **$0/$1/$2** ✗ | yes, $3 |
| $9 (tie) | $2/$3/$4 | $2/$3/$4 ✓ | **$1/$3/$5** ✗ | **$1/$3/$5** ✗ | **$1/$3/$5** ✗ | yes, $9 |
| $5 (non-tie control) | $1/$2/$2 | ✓ | ✓ | ✓ | ✓ | yes |
| $7 (non-tie control) | $1/$2/$4 | ✓ | ✓ | ✓ | ✓ | yes |
| $100 (non-tie control) | $17/$33/$50 | ✓ | ✓ | ✓ | ✓ | yes |

Totals balance on every surface, no dollars land on any other office, and the PMO Matrix TOTAL row agrees. Ownership
disagrees only on the tie cases. The fixture controls, workbook read-back and no-script-error checks all pass. The
six failures are those three surfaces on those two cases.

**Where the code shows the stated cause.** Line numbers are pinned / main / WIP:
- `pmoSharesOf`, 11415 / 11213 / 11406. The office weights are normalised by floating-point division:
  `Object.keys(bag).forEach(g=>out.push([g, bag[g].map((v,i)=>tot[i]>0? v/tot[i]:0)]));`
  The integers come from `c.ask.forEach((v,i)=>{ bag[g][i]+=v; tot[i]+=v; });` at 11412 / 11210 / 11403.
- `pmoPartsOf` hands those fractions on as the split's weights:
  `const wOf=i=> sh.map(function(x){ return x[1]? (+x[1][i]||0) : 1; });` at 11456 / 11254 / 11447,
  then `const X=pmoSplit(w, [d, m, a-d-m]);` at 11463 / 11261 / 11454.
- `pmoSplit` apportions the total by them: `const left=tgt? tgt.slice() : apportion(parts.reduce((a,b)=>a+b,0), w);`
  at 11447 / 11245 / 11438.
- `apportion` is exact, but `apExact` reads each fraction as the exact binary number it is (3096 / 3028 / 3096 onward):
  `if(w.every(function(x){ return Number.isSafeInteger(x); })) return w.map(...)`, and otherwise the mantissa and
  exponent are read from the bits. On a common 2^-55 scale, 1/6, 2/6 and 3/6 become
  **6004799503160661 : 12009599006321322 : 18014398509481984**. That is not 1:2:3, because 3 × 6004799503160661 =
  18014398509481983. The exact tie is gone before the exact split runs.
- The probe records the board's own `apExact` and `apportion` outputs as diagnostics only, never as expectations:
  `apportion(3, fractions) = [0,1,2]` against `apportion(3, [1,2,3]) = [1,1,1]`, and `[1,3,5]` against `[2,3,4]` at $9.
- An independent exact-rational check (Python `fractions`) agrees. At $3 the floors are [0,0,1] and the remainders over
  s = 36028797018963967 are [18014398509481983, 36028797018963966, 18014398509481985]. The two spare dollars go to AV,
  then to TSS, which beats MxS by 2 parts in 3.6e16. Result: [0,1,2].
- The CLIN source workbook does not go through this path. It splits with the integer grid weights:
  `if(Number.isInteger(amt)){ const a=apportion(amt, per); ...` in `clinSplit`, at 23393 / 23209 / 23384, reached from
  `const parts=clinSplit(id, i, q[1]);` at 17175 / 16945 / 17166.
- The PMO Matrix (29671 / 29444 / 29652) and the other by-office writers all call `pmoPartsOf(it, p)`, as `forecast` does.

`apportion`, `apExact`, `pmoSharesOf`, `pmoSplit`, `pmoPartsOf` and `clinSplit` are byte-identical across the three trees.

## U10: a refused edit changes a locked cycle's exported codes

**Steps,** all through the board's own functions and fields:
1. **Board A.** An O&M board for FY27 with USAF, ANG and AFRC. The RCN-EEIC tab needs all three.
   - Requirement A asks and is funded USAF $900 and ANG $200, discretionary.
   - `rcnAdd()` creates the combination. 11111 and AAAAA are typed into the rendered RCN and EEIC `<input>`s of the
     Setup › Codes and structure › RCN / EEIC panel. `toggleRcn()` opens that panel; it is the function the menu item
     runs through `mRun`. Each field's own `onchange`, `rcnSet(0,"rcn",this.value,this)`, is fired by a change event.
   - `setRcnAsg` assigns the combination to A.
   - PB27 is locked (`blCyc='PB'; blYr=2027; cycLock()`).
   - 99999 and ZZZZZ are typed into the same fields. The board is saved with `buildSavedHtml()`.
2. **Control.** The file is reopened (`boot({html})`), `cycView('PB|2027')` is called, nothing is typed, and the Excel
   workbook is exported.
3. **The record's steps** on a second reopen of the same file:
   - `cycView('PB|2027')`, then a control export before anything is typed.
   - The panel is opened and 77777 is typed into the RCN field, which is present, enabled and not read-only.
   - The status is read and the Excel workbook exported (`exportExcel`, read back with `xlsxRead`).
   - The stored cycle, the cycle store and browser storage are read.
   - The view is left (`cycLeave`), the working codes are read, and PB27 is viewed again.

The expected values are literal. Results are the same on main, WIP and pinned:

| Check | Expected | Actual (all three trees) | |
|---|---|---|---|
| Control export: RCN-EEIC by Month, USAF | `11111 / AAAAA` $900 | `11111 / AAAAA` $900 | ✓ |
| Control export: ANG | `11111 / AAAAA` $200 | `11111 / AAAAA` $200 | ✓ |
| In the view, before the edit, the same export | as above | as above | ✓ |
| RCN field in the view | present and enabled, showing 11111 | present, enabled, not read-only, showing 11111 | ✓ |
| Status after typing 77777 | says the change was not kept | "🔒 Saving is off while PB27 is on screen. It is a locked cycle, read only — the change was not kept. ↩ Leave the view to work the plan." | ✓ |
| The view's registry after the refusal | 11111 / AAAAA | **77777 / AAAAA** | ✗ |
| Export after the refused edit, USAF | `11111 / AAAAA` $900 | **`77777 / AAAAA` $900** | ✗ |
| Export after the refused edit, ANG | `11111 / AAAAA` $200 | **`77777 / AAAAA` $200** | ✗ |
| Any cell on the sheet naming 77777 | none | **4 cells**: both rollup rows and both "(1 requirement)" subtotal rows | ✗ |
| Sheet title | labelled LOCKED VIEW | "FY27 O&M Prioritization Board (Consolidated) — PB27 LOCKED VIEW — RCN / EEIC allocations by service and month" | ✓ |
| Service totals | USAF $900, ANG $200, AFRC $0 | the same | ✓ |
| Stored PB27 cycle's codes; cycle store | 11111 / AAAAA; byte for byte unchanged | the same | ✓ |
| Browser storage of the working plan | untouched | untouched | ✓ |
| Working codes after `cycLeave()` | 99999 / ZZZZZ | 99999 / ZZZZZ | ✓ |
| PB27 viewed again after leaving | 11111 / AAAAA | 11111 / AAAAA | ✓ |

The money is right. What is wrong is the line of accounting it is exported under. Stored cycle and working codes stay
intact, as the record says.

**Observed but not asserted** (`observations` in the results; out of the record's scope):
- The Spend Plan Source exported in the same view after the refused edit also prints RCN 77777 and AF EEIC AAAAA, on
  both A lines ($900 and $200).
- After the refusal, the redrawn RCN field shows 77777. On screen the edit looks kept, next to a status saying it was not.

**Where the code shows the stated cause.** Line numbers are pinned / main / WIP:
- `rcnSet`, which starts at 10858 / 10662 / 10850, writes the registry entry first and saves after:
  `if(field==='rcn')  e.rcn=String(val||'').trim();` at 10866 / 10667 / 10857, then `save(); render();`.
  `e` is `rcnReg()[i]`, and `rcnReg` returns `MS.rcn`:
  `function rcnReg(){ if(!MS.rcn||!Array.isArray(MS.rcn)) MS.rcn=[]; return MS.rcn; }` at 10836 / 10647 / 10835.
- `save()` refuses in a view: `if(CYCVIEW) return cycRefuse('Saving');` at 6767 / 6665 / 6767.
- `cycRefuse()` calls `cycReapply();` at 20109 / 19875 / 20100. `cycReapply` puts back only the year:
  `applyState(JSON.parse(JSON.stringify(c.years[MS.cur]))); MS.years[MS.cur]=S;` at 20106 / 19872 / 20097. Its comment,
  "The pristine year, put back. A refused write must not leave its edit on screen looking kept.", is at
  20103 / 19869 / 20094.
- In the view, `MS` is a throwaway copy whose registry is the cycle's own list. See
  `const V=JSON.parse(JSON.stringify(_cycStash.MS));` with "MS-level edits die with it" at 20060 / 19826 / 20051, and
  `if(kept) V.rcn=kept;` at 20066 / 19832 / 20057. The refused write stays on `V.rcn` until the view is left.
- The block comment says every write "funnels through save() or persist(), which refuse and put the pristine year back"
  (20042 / 19807 / 20033). The registry is board-level state, not year state, so nothing puts it back.
- The RCN-EEIC by Month tab labels each row through `function(k){ return rcnLabel(k)||'(blank combo)'; },` at
  30296 / 30069 / 30277. `rcnLabel` reads `rcnEntry`, then `rcnReg()`, then the mutated `MS.rcn`.
- The Spend Plan Source reads the same registry: `const rk = clin? rcnOfClinSvc(id, clin.key, svc) : rcnAsgOf(id, svc);`
  then `rcnEntry(rk)`, at 17149 / 16919 / 17140.
- `rcnSet` differs across trees only in the EEIC check that WIP and pinned added (v2.00 R2). The RCN path is the same.
  `save`, `cycReapply` and `cycRefuse` are identical apart from escaping in the message text.

## Limits

- These are synthetic jsdom runs with `boot.mjs`'s standard non-math stubs (alert, confirm, prompt, the download click,
  object URLs) and the TextEncoder/TextDecoder shim. Nothing was run in Chromium.
- In U10 the Setup menu item was not clicked: its `mRun(toggleRcn)` defers through `setTimeout`, so `toggleRcn()` was
  called directly instead.
- U9 covers one service and one CLIN-split prime. `pmoSharesOf` special-cases the id `PRIME-3`.
- Not measured: whether other board-level setters edited inside a view behave the same way.

## Files

- `u9-probe.mjs` and `u10-probe.mjs`: the probes. The argument is the copy root.
- `run.sh`: the bounded runner.
- `results-<tree>-<finding>.json`: every check with its expected and actual values, the fixture readings, every case's
  per-surface figures, the U10 sheets, and the U9 diagnostics.
- `logs/`: each run's stdout and stderr, its meta (command, PID, exit, seconds), `pids.txt`, and the one crashed U10
  attempt, kept and labelled.
