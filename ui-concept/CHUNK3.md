# ORBIT v2.00 UI — chunk 3

Branch `claude/v200-ui`, local only, not pushed. Chunk 2 ended at `eba613f` (its review); its board commit is `f95fee2` (board `9f61d32b…`). Base product `4a6f7c7` (board `4d273c06…`).

Chunk 3 is done in parts, each a separate fix with its own tests and its own review. Brad, 12 Oct, 6:00 AM ET: *"Fix UI M1 in chunk 3, with cancellation and failed-rollback tests."* 6:11 AM ET: *"Continue M1 and U13 as separate fixes with their focused tests and independent reviews."*

| Part | What | Board commit | Board blob |
|---|---|---|---|
| 1 | M1: "All submissions at once" is all or nothing | `aac8574` | `ba8d020431afc0ead32cc6ee6fa66d6b301ce583` |

**Integration stays pending** until each part has been reviewed.

---

## Part 1 — M1: "All submissions at once" is all or nothing

Every check, screenshot and result below was taken at `aac8574` (board `ba8d0204…`). The board file is still an empty template: "Synthetic", "SYN-" and "Depot Zulu" occur 0 times in it. Synthetic data is made at run time only.

Against base the board diff is still **insertions only**: 993 lines added, 0 removed. Against chunk 2 (`f95fee2`): 181 added, 20 removed, all inside chunk 2's own UI code.

### What was wrong (the chunk 2 review, M1)

The batch's dry run answered OK to every question `pmoTake` asks; the real run then asked the person. If a later file's question was answered **Cancel**, the batch put `PMOSUBS` and `PMOPICK` back, but the earlier files had already been through `pmoTake → destPkgIn → destFold → persistDest`. Their destinations stayed in `DESTDB`, in `prio27destdb` and in the saved file's `destDb`, while the alert said *"nothing on the board was changed"*.

### The choice: refuse the batch up front, naming the files that would ask

Brad's two options were: refuse the batch before anything loads, naming the file(s) that would ask (to be loaded on their own); or ask every question first, then load with those answers. **Chunk 3 refuses up front.** The reasons:

- **The question decides where money goes.** The year a submittal is held for is the only year `pmoApply` writes into. The board asks it about one file, with that file in hand. Asked as a run of questions before anything is on screen (and the board's questions do not name the file), a wrong year is easy to accept for the wrong office.
- **Nothing is replayed into `pmoTake`.** Asking first means recording answers and feeding them back into `pmoTake`'s `confirm` calls during the real run, matched by their wording and order. That ties the batch to `pmoTake`'s text, which is exactly the coupling the review's S3 warns about.
- **Nothing new is swapped during the real run.** The real run stays exactly what ⬅ Load a submittal file does with each file.
- **Nothing is lost.** The file that asks is loaded with **One submission**, where its own question is put; the other files load together. A batch of FY28 submittals on an FY27 board is refused with each file named; switching the board to FY28 first makes them need no answer.

### What the batch does now

1. **Read and checked**, as in chunk 2 (the board's door: `inTooBig`, `inboundCheck`, recognised as a submittal; one per office).
2. **The dry run** of `pmoTake` on a copy of each file, as in chunk 2, now keeping apart what `pmoTake` *says* (`alert`) and what it *asks* (`confirm`).
   - A file it would not take refuses the batch (as before).
   - **A file it would ask about refuses the batch before anything loads.** Every such file is named, in the order picked, with its question, and the person is told to load it on its own. No question is put while a batch runs.
3. **The real run**, in pick order, through `pmoTake` itself.
4. **If the real run still fails part-way** (a file not taken, a question answered Cancel, an error thrown), everything `pmoTake` can change is **put back exactly** to what it was the moment before the dry run:

   | What | How it is put back |
   |---|---|
   | `PMOSUBS` | the same array, refilled with the same submittals in the same order |
   | `PMOPICK` | the same object, with the same ticks |
   | `subOpen` | its value |
   | `DESTDB` | **in place**: every object and array reachable from it gets back exactly its own entries, in order. `MS.flow.ents` and `CYCDB.ents` are the same array as `DESTDB.ents`, so replacing it would cut them loose |
   | browser storage | every key that differs from before: written back, or removed if the batch added it. **A key that did not change is not written** |
   | the save state | `_sideGen`, `_sideSaved`, `_dlOnly`, `DIRTY`, `_saveGen`, `_lsRefused` (a stored list counts as unsaved; that count goes back), then the header is redrawn |

   **Not put back: Save diagnostics' list (`DIAG`).** It records what happened (for example, that the browser refused a write), lives in memory only and is never saved. Taking an entry out would remove a true record.

### The message is checked when it is said

Before any refusal message, the batch compares what it can change with what it held before:

- the review (the same `PMOSUBS` and `PMOPICK` objects, their contents, `subOpen`);
- the destination list (the same objects holding the same entries, and its text);
- the plan (`MS`, as text);
- the save state;
- **every key** in browser storage.

"…and nothing on the board was changed" is said **only when all of them match**. Otherwise the message says *"⚠ NOT EVERYTHING IS AS IT WAS"*, names each part that is not as before (with the browser's reason when the put-back was refused), and lists the parts that are. The status line says the same.

If the destination list kept in this browser could not be put back, the message also says what that means: it holds what the batch wrote there, and opening the board again in this browser would read it instead of the list on screen. The test proves both halves of that sentence.

The status line keeps chunk 2's words for the refusals chunk 3 did not change: same office twice, malformed, not a submittal, would not be taken, PMO copy. Those messages are byte-identical to chunk 2's, and audit-ui's literal checks of them pass on `f95fee2` too.

In every new refusal message, what the board holds comes right after the headline. Chromium shows about nine lines of an alert and scrolls the rest (the screenshots show this), so the state line had to come before the list of files.

### The exact messages (recorded from the real browser; audit-ui asserts them word for word)

**One file would ask** (`AV.json`, `PSM-no-year.json`):

```
⚠ None of the 2 submittal files was loaded: “PSM-no-year.json” would ask a question before it could be loaded, and a batch loads only files that need no answer

The submittal review is exactly as it was before (1 held), and nothing on the board was changed.

  • “PSM-no-year.json” — That submittal does not say which fiscal year it was written for.

Load it on its own (PMO Import › One submission), where its question is asked about that file alone; then load the rest.
```

**Three would ask** (no year, another year, no office): the same, naming all three in the order picked:

```
  • “PSM-no-year.json” — That submittal does not say which fiscal year it was written for.
  • “ATL-FY28.json” — That submittal was written for FY28, and this board is on FY27.
  • “no-office.json” — That submittal does not say which programme office it is from.
```

**A failure part-way, put back** (fault injected: Cancel on PSM's question after AV was taken):

```
⚠ None of the 2 submittal files was loaded: “PSM-no-year.json” was not taken, so the 1 taken before it was taken back out of the review

The submittal review is exactly as it was before (1 held), and nothing on the board was changed.
```

**A put-back storage refused** (fault injected):

```
⚠ None of the 2 submittal files was loaded: “PSM-no-year.json” was not taken, so the 1 taken before it was taken back out of the review

⚠ NOT EVERYTHING IS AS IT WAS. Checked just now, this is not as before the batch:
  • the destination list kept in this browser — it could not be put back (QuotaExceededError). It holds what the batch wrote there, and opening the board again in this browser would read it instead of the destination list on screen.

Checked just now and exactly as before: the submittal review, the destination list on this board, the plan on screen, whether the board reads as saved.
```

Status line: `⚠ Nothing loaded — “PSM-no-year.json” was not taken. Not as before the batch: the destination list kept in this browser.`

### Tests: `tools/export-audit/audit-ui.mjs` (new)

The suite is wired like the others: `npm run audit:ui`, last in `audit:suites`, and last in the mutation sweep's `SUITES`. It uses jsdom, the real board, and synthetic data made at run time. Expected values are hand-written literals: the questions word for word, the messages, the eight seeded destination names, the storage keys and every write. The board is only asked what *is*.

**The fixture.** The files carry **destination lists**: AV's adds "Depot Zulu", no-year's "Depot Yankee", FY28's "Depot Xray", no-office's "Depot Whiskey". Before every batch, the review holds TSS's submittal with one row ticked. Browser storage is instrumented: every `setItem` and `removeItem` is logged, and either can be made to refuse, or reading made to throw.

**What "exactly as before" proves**, in every refused or put-back case (`asBefore`):

- the review: same contents, TSS alone, its one tick, open;
- the same objects: `PMOSUBS`, `PMOPICK`, `DESTDB`, its `ents`, `lmap` and first entry, plus `alert`, `confirm`, `setStat`, `subOpenReview` and `destPkgIn`, all by identity;
- the destination list: same text, the eight seeded names, unstamped, still `MS.flow.ents`;
- the plan (`MS`), as text;
- the saved payload, byte for byte, with no destination from the batch;
- browser storage: every key and value, and exactly the three keys it held;
- the save state and the header;
- the review reopened: the same HTML;
- the board reopened from its saved file in the same browser: the eight seeded destinations, no errors;
- no page errors.

| Scenario | Cases | What it proves beyond `asBefore` |
|---|---|---|
| A batch with a file that would ask is refused before anything loads | AV + no year; AV + another year; AV + no office; all three with AV; the same with storage refusing every write; the file loaded on its own afterwards | `asks` names the file and its question; **no question is put**; **no storage write of any kind**; the message and status line, literally. One submission still asks its question and holds the file for FY27. |
| A batch that fails part-way is put back whole | **Cancel** in the real run for **each question** (no year; another year, both its questions; no office, asked after its own list was folded in and stored); Cancel on the **first** file; an **error** thrown while the second file is taken; storage refusing every write, then Cancel; **a board opened from its saved file** | `back` and `same` are true; the questions were asked word for word; storage writes are **exactly** the load's own plus one put-back write (`set prio27destdb` ×2, ×3 for no office); with storage refusing, nothing is written back; a board that read *Saved* reads Saved again after reading *Unsaved changes* part-way, and the list it held none of is removed (`set`, then `remove prio27destdb`). |
| **A put-back that cannot finish** says exactly what it could not put back | (a) storage takes AV's list, then refuses to take the old one back; (b) storage cannot even be read at the put-back | `back` and `same` false; `left` names the part; the message literally, and **never** "nothing on the board was changed"; the board on screen *is* put back (review, list, plan, payload, save state, identities); every other key as before. **The reported partial state is exactly true:** the copy in this browser holds the seeded eight plus Depot Zulu, stamped by the batch, and the board reopened in this browser reads it. In (b), nothing is written blind. |
| Refused batches leave everything as it was, and a good batch loads as one by one | same office twice, differing; same office twice, identical; a good file then a malformed one; a good file then one of the wrong width (refused only by the dry run); a good batch, with storage working and with storage refusing every write | Refusals: nothing asked, no write, `asBefore`. Good batch: held in pick order after TSS, nothing ticked, Depot Zulu in the list; the review, list, plan, payload, every storage key and the save state equal to the same files loaded one by one (`importState`). With storage refusing, storage is untouched. |

**289 checks, all passing at `aac8574`.**

**Against the chunk 2 board (`f95fee2`): 131 of the 289 fail.** Every failure is in the three M1 scenarios. All 14 M1 cases fail, the first scenario's five without any fault injected: with Cancel as the answer, the old real run asks and leaves Depot Zulu in `DESTDB`, the payload and `prio27destdb` under "nothing on the board was changed". The fourth scenario (duplicates, malformed, wrong width, good batches) passes on `f95fee2`, as it should: those were not defects.

**How a Cancel part-way is reached now.** The dry run no longer misses a question, so the tests make it miss one: `uiTakeDry` is wrapped to drop its `asks`. Each such case says so in its name, and the screenshots of it say "fault" in their names.

### Mutations (`v200-ui3-*`, one group at the end of `MUTATIONS`)

Each find matches the board exactly once, and all 1,305 existing entries still match exactly once (`mcount.py`, text only; 1,316 entries). On `f95fee2` the eleven new ones match nothing. Each mutant was built from the mutate.mjs text with `mkmut.py` (nothing from mutate.mjs is run) and run through audit-ui:

| Mutation | What it breaks | audit-ui |
|---|---|---|
| `v200-ui3-asks-loaded` | a batch with a file that would ask is loaded anyway | caught: 20 failing checks |
| `v200-ui3-dry-asks-unheard` | the dry run does not keep the questions | caught: 20 failing checks |
| `v200-ui3-no-putback` | nothing put back (chunk 2's M1) | caught: 94 failing checks |
| `v200-ui3-putback-no-dest` | the review put back, the destination list not | caught: 54 failing checks |
| `v200-ui3-putback-dest-copy` | the list put back as a copy, not in place | caught: 54 failing checks |
| `v200-ui3-putback-no-storage` | browser storage not put back | caught: 35 failing checks |
| `v200-ui3-putback-no-save-state` | the save state not put back | caught: 30 failing checks |
| `v200-ui3-putback-writes-all` | every storage key written back, changed or not | caught: 9 failing checks |
| `v200-ui3-pick-lost` | the ticks cleared, not restored | caught: 48 failing checks |
| `v200-ui3-claim-unchecked` | "nothing changed" said whatever the check found | caught: 3 failing checks |
| `v200-ui3-check-blind-storage` | the check never compares storage | caught: 4 failing checks |

**All 11 caught** by real checks, not by a block throwing.

### Every check and its result (at `aac8574`)

Every command was bounded with `setsid -w timeout -k 10 600` (300 or 120 for the small ones) and run with BOARD unset, except the runs against another board. The AUDIT_IMPORT lock was checked before every node and Chromium run. PIDs are in the scratchpad `uichunk3/m1/pids.txt`, and every run's log is in `uichunk3/m1/logs/`.

| Run | Start (ET) | Exit | Wall (s) | Result | Log |
|---|---|---|---|---|---|
| `audit-ui@aac8574` | 06:53:09 | 0 | 21.6 | ALL CHECKS PASSED | `audit-ui-aac8574.log` |
| `shoot-m1@aac8574` | 06:53:15 | 0 | 29.0 | superseded: its PNGs were deleted and retaken by the next run, which adds the status-line shots | `shoot-m1-aac8574.log` |
| `audit-ui-on-f95fee2@aac8574` | 06:53:30 | 1 | 20.7 | 131 FAILING CHECK(S) | `audit-ui-on-f95fee2-aac8574.log` |
| `audit-ui-count@aac8574` | 06:53:51 | 0 | 23.2 | 289 checks run; ALL CHECKS PASSED | `audit-ui-count-aac8574.log` |
| `shoot-m1@aac8574-2` | 06:54:03 | 0 | 27.5 | 19 PNGs (the committed screenshots) and shots.json, no page errors | `shoot-m1-aac8574-2.log` |
| `audit-ui-count-on-f95fee2@aac8574` | 06:54:14 | 1 | 22.3 | 289 checks run; 131 FAILING CHECK(S) | `audit-ui-count-on-f95fee2-aac8574.log` |
| `mut-v200-ui3-asks-loaded@aac8574` | 06:54:42 | 1 | 21.0 | 20 FAILING CHECK(S) | `mut-v200-ui3-asks-loaded-aac8574.log` |
| `mut-v200-ui3-dry-asks-unheard@aac8574` | 06:55:04 | 1 | 21.6 | 20 FAILING CHECK(S) | `mut-v200-ui3-dry-asks-unheard-aac8574.log` |
| `mut-v200-ui3-no-putback@aac8574` | 06:55:25 | 1 | 21.8 | 94 FAILING CHECK(S) | `mut-v200-ui3-no-putback-aac8574.log` |
| `mut-v200-ui3-putback-no-dest@aac8574` | 06:55:47 | 1 | 22.7 | 54 FAILING CHECK(S) | `mut-v200-ui3-putback-no-dest-aac8574.log` |
| `mut-v200-ui3-putback-dest-copy@aac8574` | 06:56:10 | 1 | 23.5 | 54 FAILING CHECK(S) | `mut-v200-ui3-putback-dest-copy-aac8574.log` |
| `mut-v200-ui3-putback-no-storage@aac8574` | 06:56:34 | 1 | 26.1 | 35 FAILING CHECK(S) | `mut-v200-ui3-putback-no-storage-aac8574.log` |
| `mut-v200-ui3-putback-no-save-state@aac8574` | 06:57:00 | 1 | 21.4 | 30 FAILING CHECK(S) | `mut-v200-ui3-putback-no-save-state-aac8574.log` |
| `mut-v200-ui3-putback-writes-all@aac8574` | 06:57:22 | 1 | 23.0 | 9 FAILING CHECK(S) | `mut-v200-ui3-putback-writes-all-aac8574.log` |
| `mut-v200-ui3-pick-lost@aac8574` | 06:57:45 | 1 | 23.3 | 48 FAILING CHECK(S) | `mut-v200-ui3-pick-lost-aac8574.log` |
| `mut-v200-ui3-claim-unchecked@aac8574` | 06:58:08 | 1 | 22.5 | 3 FAILING CHECK(S) | `mut-v200-ui3-claim-unchecked-aac8574.log` |
| `mut-v200-ui3-check-blind-storage@aac8574` | 06:58:31 | 1 | 23.3 | 4 FAILING CHECK(S) | `mut-v200-ui3-check-blind-storage-aac8574.log` |
| `boot-same@aac8574` | 06:58:54 | 0 | 8.6 | same: every page, source, save and error list is identical either way | `boot-same-aac8574.log` |
| `audit-other@aac8574` | 06:59:03 | 0 | 28.7 | ALL CHECKS PASSED | `audit-other-aac8574.log` |
| `audit@aac8574` | 06:59:32 | 0 | 6.8 | ALL CHECKS PASSED | `audit-aac8574.log` |
| `audit-recon@aac8574` | 06:59:38 | 0 | 43.8 | ALL CHECKS PASSED | `audit-recon-aac8574.log` |
| `check@aac8574` | 07:00:22 | 1 | 2.6 | 1 check failed: the inline-handler jsa() rule (pre-existing since chunk 1; base passes) | `check-aac8574.log` |
| `rv-smoke@aac8574` | 07:00:25 | 0 | 10.6 | 0 fails | `rv-smoke-aac8574.log` |
| `rv2-probe@aac8574` | 07:00:35 | 0 | 31.1 | 129 PASS, 1 FAIL (S2) | `rv2-probe-aac8574.log` |
| `rv2-m1@aac8574` | 07:01:07 | 0 | 2.6 | refused before anything loads; Depot Zulu in neither list nor payload | `rv2-m1-aac8574.log` |
| `openwrites@aac8574` | 07:01:09 | 0 | 7.2 | identical write lists | `openwrites-aac8574.log` |

Not run, as instructed: `audit-import.mjs` and `audit-board.mjs`, and the final-tree queue, presweep and full gate (held until the selected changes are integrated). Also not run: `npm run verify:grid` (S4 belongs to a later part) and the mutation sweep itself (`mutate.mjs` is never run here).

### Preservation

- **Saved payload byte-identical to base** on the same seed and clock. The chunk-1 reviewer's `rv-smoke.mjs` reports 0 fails. It also confirms: the saved file is SRC0 plus the payload, driving the new controls leaves it unchanged, and the KPI cards equal the totals.
- **Storage at opening unchanged.** Every `setItem` and `removeItem` while the board opens: base `remove prio27bands_om`, `set prio27destdb (752 chars)`; `aac8574` the same, in the same order (`openwrites`). No `prio27ui*` key is written at opening.
- **The chunk 2 reviewer's probe** (`rv2/probe.mjs`, pointed at this board): **129 PASS, 1 FAIL**, against 127 and 3 at `f95fee2`. Both M1 failures now pass ("D cancel mid-run": destination list unchanged; saved payload unchanged). The one left is S2 (the last-edit line across years), which belongs to a later part.
- **The reviewer's `m1.mjs`** at this board: refused before anything loads, `asks` names PSM-no-year.json, Depot Zulu is in neither the list nor the payload.
- **Money, import, save and persistence functions are untouched.** `pmoTake` is byte-identical to base, and no base function changed in this part. The functions that changed are chunk 2's own `uiImpDraw`, `uiTakeDry` and `uiSubMany`, plus the comment above `uiFileText`.

### Screenshots (`ui-concept/preview-chunk3/`, the actual board at `ba8d0204…`)

Taken by `shoot-chunk3-m1.mjs` in a real, headed Chromium under Xvfb, with chunk 2's synthetic seed. The batch's messages are the browser's own alert and confirm boxes, which a page screenshot cannot see, so each was photographed off the X display while it was up. The address bar shows the scratch copy of the board, extracted from the commit. Every dialog's exact text, and what the board held before and after each case, are in `shots.json`. The repo's `.gitignore` keeps `*.json` out, as it did chunk 2's, so the file is not committed. It is kept in the scratchpad at `uichunk3/m1/shots.json`, and its dialog texts are quoted above. No page errors.

| File | What it shows |
|---|---|
| `m1-1440-import-box-all-submissions.png` | The Import box, PMO Import › All submissions at once, with the new wording: a file that would ask a question first refuses the batch, to be loaded on its own |
| `m1-1440-refused-one-would-ask-message-1.png` | The alert: refused, nothing on the board changed, PSM-no-year.json and its question named |
| `m1-1440-refused-three-would-ask-message-1.png` | The same for three files. The alert box scrolls after about nine lines; all three are in the text quoted above |
| `…-after-review.png` | The submittal review afterwards: TSS alone, its row still ticked |
| `…-after-board.png`, `…-after-status.png` | The board afterwards, its status line on one line and opened with More |
| `m1-1440-fault-cancel-part-way-put-back-question-1.png`, `…-message-2.png` | **Fault injected.** The question the real run asks (only because the dry run was made to miss it), answered Cancel, then the alert: AV taken back out, nothing on the board changed |
| `m1-1440-fault-put-back-refused-by-storage-message-2.png`, `…-after-status.png` | **Fault injected.** The put-back storage refused: the alert names the destination list kept in this browser, the reason and what it means; the status line says *Not as before the batch*. `shots.json`: the board's list has the eight seeded names, the stored copy nine, the last being Depot Zulu |

### Existing functions and checks touched

- **Base functions:** none in this part. `pmoTake`, `destPkgIn`, `destFold`, `persistDest`, `lsSet`, `subOpenReview` and every import, save and money function are unchanged.
- **Chunk 2's functions:** `uiTakeDry` keeps questions apart from what it says. `uiSubMany` refuses a batch that would ask, puts everything back after a failure part-way, and says only what it has checked. `uiImpDraw` has the new wording.
- **New functions:** `uiGraphSnap`, `uiGraphPut`, `uiGraphSame`, `uiLsAll`, `uiLsName`, `uiSaveState`, `uiJson`, `uiBatchSnap`, `uiBatchPut`, `uiBatchDiff`, `uiAskLine`. None of these names occurs in base or chunk 2.
- **`UI_BATCH`** gains `asks`, `back`, `same` and `left`. The board itself still reads nothing from it.
- **Existing checks:** none edited; every existing fixture, assertion and expected value is as it was. Additions only:
  - `package.json`: `audit:ui`, and `&& npm run audit:ui` at the end of `audit:suites`;
  - `mutate.mjs`: `['ui', …audit-ui.mjs]` appended to `SUITES`, and the eleven `v200-ui3-*` entries at the end of `MUTATIONS`.
- **Not added:** a `FIRST_BY_PREFIX` route for `v200-ui3-`, which would send them to audit-ui first. They match `v200-` and so go to audit-inject first; the verdict is the same, only slower. It is left to whoever owns `mutate.mjs`'s ordering.

### Not done, and open

- **`npm run check` fails at this commit, and at chunk 1 and chunk 2; base passes.** The failure is the inline-handler rule: *"10 value(s) reach inline handler code without jsa()"*. The ten are in chunk 1's UI code: `uiColSet('…')`, `uiSetDensity('…')`, the flyout's `getElementById('…')` and `uiMenuSoon('…')`, and `uiDTab('…')`. Every value is a constant of the program's own (a column key, a density name, an element id), so none is a person's data. The rule still fails, and neither chunk review reported it. It is not part of M1, and it was not changed here.
- **S1–S5, m1–m7 and U13** are later parts. S3's suite check is covered in substance here: every refused batch is checked for storage (every key, no writes), `MS` and `DESTDB` unchanged. The one-line note at `pmoTake` is S3's, and is not added here.
- **An edge, by design.** A batch refused *while its files are still being read* is checked against the board as it was when the batch began. If the shared folder's live refresh changed the board in those milliseconds, the message names what changed. At that stage the batch itself has changed nothing.
- **Other lists in memory are not compared.** The execution data, cost estimates, reprogramming log and BAE list are not compared in memory: `pmoTake` has no path to them, and any change to them that is kept reaches browser storage, which is compared key by key.
- **The alert box scrolls.** Chromium shows about nine lines of an alert and scrolls the rest. In every new message the state line comes first, and the full texts are quoted above, kept in `shots.json` and asserted in audit-ui's literals.
