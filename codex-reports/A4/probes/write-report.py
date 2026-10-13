from pathlib import Path
from zoneinfo import ZoneInfo
import json,datetime,shlex,hashlib
r=Path('/workspace/orbit-codex-batches-20261013-1205ET');a=r/'A4';ev=json.loads((a/'EVIDENCE.json').read_text());start=json.loads((a/'START.json').read_text())['started_ET'];now=datetime.datetime.now(ZoneInfo('America/New_York')).isoformat()
parts=[f'BATCH A4  |  base 7ee498a46507972f803cd48ce9f27d5d668acb63  |  started {start} / finished {now} ET\n',
'''FINDINGS:

U41 reproduced on the base with a real synthetic saved-file payload carrying `S.si={R1:'at',R2:'EN'}`. Opening discarded `R1:'at'`, gave the ordinary opening message, and saving/reopening retained only `R2:'EN'`. The expected stored map is the literal original map. The independent proposal test also makes R1 otherwise derive LA; the base then silently files its $900 Navy / $200 USMC CV under LA. The fix keeps raw `at`, explicitly lists it and counts those dollars under no recognized SI code, without guessing LA or uppercasing to AT.

The final literal fixture has Navy $1,500 = 900 + 300 + 50 + 60 + 70 + 80 + 40, USMC CV $390 = 200 + 100 + 90, STOVL $0, total $1,890. In actual emitted/read XLSX, USMC CV EN is $100 and no-code $290; Navy LA $50, EN $340, OT $60, FL $70, AT $80, no-code $900. The screen's no-code share is 63.0% = 1,190 / 1,890; the valid EN/OT/FL/AT shares are 23.3% / 3.2% / 3.7% / 4.2%. All expectations are written literals; no ORBIT helper computes them. The same checks run after saving and reopening. Raw `LA `, `la`, `ZZ` and `__proto__` are also retained and listed without normalization. Empty and all five valid codes plus an ordinary derived EN control retain their previous meaning.

U42 reproduced from actual XLSX bytes: a destination `D` repeated 27 times followed by 😀 and `tail` produces a sheet name with U+FFFD on the base; `'Quoted depot'` keeps forbidden apostrophes. The final tests additionally exercise a collision whose 26-unit repeat cut bisects 😀, and an apostrophe exposed by the first 28-unit cut. Expected names are literal `DDDDDDDDDDDDDDDDDDDDDDDDDDD`, `Quoted depot`, `EEEEEEEEEEEEEEEEEEEEEEEEE😀A`, `EEEEEEEEEEEEEEEEEEEEEEEEE 2` and `FFFFFFFFFFFFFFFFFFFFFFFFFFF`. Interior `O'Brien` remains unchanged. Actual workbook XML parses, names remain unique, and the $900 USAF + $200 ANG = $1,100 destination detail and grand total agree before and after reopening; the original full destination names remain uncut in saved data.

Input receipt: handoff branch pinned at `bbe728556dc394c50d84ad9a09facc5fa163e42b`; probes/rows were inspected from its regtext inputs. Base board blob is `fce8a391bd8a248d5185e199d22190c1687eaea0`. Proposed empty-template board blob is `5053534a287c100341af8e4fd2a5752ba04def0f`.

The independent review found a completeness defect in the first proposal: an unsupported SI on a non-Navy O&M requirement had no correction field. That is corrected in this final diff by a narrow stored-unsupported-code eligibility branch and a selected raw option. New tests use actual DOM change events to clear or select AT on USAF $900 / ANG $200, reopen the saved result, verify no unrelated blank requirement gains an SI editor, retain money/office ownership, and retain the existing locked-cycle refusal for a known EN code.

PROPOSAL:

- U41 board: retain unsupported raw SI values on opening; list them under dedicated Needs attention/Pre-flight repair items; use no recognized code while held raw, with explicit wording, rather than silently deriving a different classification.
- U42 board: retain existing UTF-16 bounds while dropping a trailing high surrogate exposed by either cut; remove edge apostrophes before and after cuts, including repeat names; preserve interior apostrophes and all source names.
- Suite: add two existing-style asynchronous audit-recon blocks before its scenario guard, including actual non-Navy correction controls; all original suite bytes remain exactly present, with no existing check or expectation changed.
- Catalog TEXT: add six focused mutations before the prescribed R3 marker; do not execute/import the catalog.

''']
for label in ['prioritization-board-grid.html','audit-recon.mjs','mutate.mjs']:
 parts+=['```diff\n'+(a/(label+'.diff')).read_text()+'```\n\n']
parts+=['RUNS:\n\nThe supervised runner starts an owned process group, caps each test at 180 s (mcount 60 s), terminates only that group, and records command, exit, duration and Eastern timestamps. No timeout occurred. Node v24.19.0 / jsdom 27.0.0; the task-local native TextEncoder/TextDecoder adapter is `runtime-encoding-shim.mjs` (SHA-256 `e689710a2895d6843a66207d18ec886688b16f3c166b6ddada296e40a51c7981`). `MUT_FIRST_FAIL`, `NODE_OPTIONS` and `BOOT_PARSE` were unset. This is synthetic jsdom execution, not native-browser acceptance.\n\n']
commands=[]
for stem,desc in [('focused-base-final-r2','63 checks; 40/40 defect checks fail, 23/23 controls pass'),('focused-fix-final-r2','63/63 pass'),('full-recon-base-r2','40 failures, all and only the proposed defect checks; every old scenario passes'),('full-recon-fix-r2','ALL CHECKS PASSED; unchanged original checks plus the 63 new checks')]:
 m=json.loads((a/(stem+'.meta.json')).read_text());board=r/'base/prioritization-board-grid.html' if 'base' in stem else None
 cmd=(f'BOARD={board} ' if board else '')+'python3 '+str(r/'runner.py')+f' --cap 180 --cwd {m["cwd"]} --log {m["log"]} --meta {a/(stem+".meta.json")} -- '+' '.join(shlex.quote(v) for v in m['command'])
 commands.append((stem,cmd,m,desc))
for mid in json.loads((a/'mutation-ids.json').read_text()):
 m=json.loads((a/(mid+'.meta.json')).read_text());d=json.loads((a/(mid+'.log')).read_text())
 cmd=f'BOARD={a/"mutants"/(mid+".html")} python3 {r/"runner.py"} --cap 180 --cwd {m["cwd"]} --log {m["log"]} --meta {a/(mid+".meta.json")} -- '+' '.join(shlex.quote(v) for v in m['command'])
 desc=f'{len(d["failures"])} protection failures in the appropriate block; 63 checks executed; no crash or never-ran'
 commands.append((mid,cmd,m,desc))
for stem,cmd,m,desc in commands:
 parts+=[f'- `{cmd}` | exit {m["exit"]} | {m["duration_seconds"]} s | {desc}. {m["started_ET"]} → {m["finished_ET"]}; log `{Path(m["log"]).name}`.\n']
for stem in ['probe-vsi-base','probe-vflow-base']:
 m=json.loads((a/(stem+'.meta.json')).read_text())
 cmd='python3 '+str(r/'runner.py')+f' --cap 120 --cwd {m["cwd"]} --log {m["log"]} --meta {a/(stem+".meta.json")} -- '+' '.join(shlex.quote(v) for v in m['command'])
 parts+=[f'- `{cmd}` | exit {m["exit"]} | {m["duration_seconds"]} s | reference diagnostic reproduced the reported defects; {m["started_ET"]} → {m["finished_ET"]}.\n']
m=json.loads((a/'mcount-fixed-r2.meta.json').read_text())
cmd=f'python3 {r/"runner.py"} --cap 60 --cwd {a} --log {a/"mcount-fixed-r2.log"} --meta {a/"mcount-fixed-r2.meta.json"} -- python3 -I {r/"helpers/mcount.py"} {a/"fix/tools/export-audit/mutate.mjs"} {a/"fix/prioritization-board-grid.html"}'
parts+=[f'- `{cmd}` | exit {m["exit"]} | {m["duration_seconds"]} s | **1,334 entries, 1,334 exactly once, zero missing/multiple/unparsed**; includes every one of the 1,328 existing entries. Applicability is not catch evidence.\n']
parts+=[f'''- Each disposable mutant was built from catalog TEXT by `python3 -I {r}/helpers/mkmut.py {a}/fix/tools/export-audit/mutate.mjs {a}/fix/prioritization-board-grid.html <id> {a}/mutants/<id>.html`; each find matched exactly once. Exact decoded find/repl and applicability are in each `<id>.apply.log`. These were individual focused-block sensitivity runs, not a full catalog sweep.
- Reference probe commands and results are recorded below. These print observations rather than fail assertions; their exit 0 is not a defect-check pass. Their observed defects are independently asserted in the final 63-check block runs above.
- Raw primary log hashes, exact commands/timestamps/durations, source blob receipts and the unchanged-original-suite proof are saved in `EVIDENCE.json`, `identities.json` and `runtime.json`. All this task's recorded process groups have exited.

NOT DONE / LIMITS:

No repository branch/file was edited, committed or pushed; these are proposals in this batch's private disposable copy. No populated board file is returned: saved HTML fixtures existed only in memory. Nothing ran/imported mutate.mjs, no playwright install, no sweeps, no full gate and no later batch.

The final counted runs are separate from early draft harness errors (wrong preflight/ZIP/UI helper assumptions and initial fixture bookkeeping), and the superseded first proposal before the independent correction-reachability repair; those early logs remain labelled by filename and are not pass evidence. The original input vflow probe also contains a control-character name from U37; A4 does not repair XML control characters (A2 owns that).

No Excel/LibreOffice or native Chromium run was made. No saved-file PMO/cycle/one-appropriation import matrix, real budget/shared-folder experiment or complete audit set ran. Whole grapheme clusters (joined emoji/combining marks) are not promised: U42 prevents splitting UTF-16 surrogate pairs while preserving the old size bounds. U41 deliberately preserves unsupported raw values but does not normalize or adopt them as new SI classifications; its repair notice explicitly explains no-code accounting. A4 exercised O&M only: unsupported SI data on other appropriations is not a tested correction route and the existing board-wide SI restriction remains. New dynamic UI repair controls still require the lead's applicable UI/accessibility acceptance. Existing unrelated findings remain open.

QUESTIONS FOR BRAD: none for this assigned proposal; adoption remains with the lead's independent reviews and integration process.
''']
(a/'REPORT.md').write_text(''.join(parts));print(a/'REPORT.md');print('report bytes',(a/'REPORT.md').stat().st_size)
