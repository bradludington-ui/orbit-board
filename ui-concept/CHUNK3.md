# ORBIT v2.00 UI — chunk 3

Branch `claude/v200-ui`, local only, not pushed. Chunk 2 ended at `eba613f` (its review); its board commit is `f95fee2` (board `9f61d32b…`). Base product `4a6f7c7` (board `4d273c06…`).

Chunk 3 is done in parts, each a separate fix with its own tests and its own review. Brad, 12 Oct, 6:00 AM ET: *"Fix UI M1 in chunk 3, with cancellation and failed-rollback tests."* 6:11 AM ET: *"Continue M1 and U13 as separate fixes with their focused tests and independent reviews."* Part 2 is the review items Brad approved at 6:11 AM ET (S1–S5); see "Part 2" at the end.

| Part | What | Board commit | Board blob |
|---|---|---|---|
| 1 | M1: "All submissions at once" is all or nothing | `aac8574` | `ba8d020431afc0ead32cc6ee6fa66d6b301ce583` |
| 1, fix round | M1's tests, after its independent review: the cases the review found no test could see | `fc01792` (tests only) | unchanged: `ba8d0204…` |
| 1, fix round 2 | M1 after its second review: a batch refused before it takes anything says only what is true of it; then tests for the save state taken after the reads, the other storage keys, and the saved file and reopening after a failed put-back | `58803c9` (board and its tests), then `e439683`, `b418340`, `775903f`, `5a298b7` (tests only) | `2d1d855edda98f9179d7254ef0d4c5ff7f46b26f` |
| 2 | The chunk 2 review's S1–S5, each its own commit: the posture strip wraps (S1); "Last recorded edit" and board-wide journal lines (S2); the refused-batch check and the note at `pmoTake` (S3); Reports clear of the sidebar (S5); the Import box's opener and the browser tools (S4) | `2916f0a`, `088acf8`, `cb86178`, `8f331a8`, `8325909` (board and its tests or tools), then `0af09b6`, `df05821`, `2ce11b6` (tools only) | `5e9e5a5e383e0553342f822050b36da7d23e9eab` |

**Integration stays pending** until each part has been reviewed.

---

## Part 1 — M1: "All submissions at once" is all or nothing

Every check, screenshot and result below was taken at `aac8574` (board `ba8d0204…`), except those in the fix round section at the end, taken at `fc01792` (the same board). The board file is still an empty template: "Synthetic", "SYN-" and "Depot Zulu" occur 0 times in it. Synthetic data is made at run time only.

*(Fix round 2 changes the board, to `2d1d855e…` at `58803c9`, inside `uiSubMany` only; its checks are in its own section at the end. No message quoted below changes: audit-ui's literal checks of every one of them pass at the new board.)*

*(The screenshots in `preview-chunk3/` were retaken at `90ccabf` (board `2d1d855e…`) after the M1 review's third round asked for them at the exact board commit; see "Screenshots retaken at the final board" at the end. Every dialog text and before-and-after state is unchanged.)*

Against base the board diff is still **insertions only**: 993 lines added, 0 removed. Against chunk 2 (`f95fee2`): 181 added, 20 removed, all inside chunk 2's own UI code. *(At fix round 2: 1,010 added and 0 removed against base; 203 added and 25 removed against chunk 2, still all inside chunk 2's and chunk 3's own UI code.)*

### What was wrong (the chunk 2 review, M1)

The batch's dry run answered OK to every question `pmoTake` asks; the real run then asked the person. If a later file's question was answered **Cancel**, the batch put `PMOSUBS` and `PMOPICK` back, but the earlier files had already been through `pmoTake → destPkgIn → destFold → persistDest`. Their destinations stayed in `DESTDB`, in `prio27destdb` and in the saved file's `destDb`, while the alert said *"nothing on the board was changed"*.

### The choice: refuse the batch up front, naming the files that would ask

The chunk 2 review's fix for M1 names two ways: refuse the batch before anything loads, naming the file(s) that would ask (to be loaded on their own); or ask every question first, then load with those answers. Those two are the review's words, not Brad's: Brad's instruction was to fix M1, with cancellation and failed-rollback tests. *(Corrected in the fix round: this line first said "Brad's two options were".)* **Chunk 3 refuses up front.** The reasons:

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

If the destination list kept in this browser could not be put back, the message also says what that means: it holds what the batch wrote there, and opening the board again in this browser would read it instead of the list on screen. The test proves both halves of that sentence. *(Fix round 2: each half is now said only when it is checked true at that moment. "It holds what the batch wrote there" needs the real run to have written that list and storage to hold exactly that write still; "would read it instead of the destination list on screen" needs the stored list to be the newer and to differ from the one on screen.)*

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

**289 checks, all passing at `aac8574`.** *(The fix round adds 98: 387 checks at `fc01792`, the 289 unchanged. See "Fix round" below.)*

**Against the chunk 2 board (`f95fee2`): 131 of the 289 fail.** Every failure is in the three M1 scenarios. All 14 M1 cases fail, the first scenario's five without any fault injected: with Cancel as the answer, the old real run asks and leaves Depot Zulu in `DESTDB`, the payload and `prio27destdb` under "nothing on the board was changed". The fourth scenario (duplicates, malformed, wrong width, good batches) passes on `f95fee2`, as it should: those were not defects.

**How a Cancel part-way is reached now.** The dry run no longer misses a question, so the tests make it miss one: `uiTakeDry` is wrapped to drop its `asks`. Each such case says so in its name, and the screenshots of it say "fault" in their names.

### Mutations (`v200-ui3-*`, one group at the end of `MUTATIONS`)

Each find matches the board exactly once, and all 1,305 existing entries still match exactly once (`mcount.py`, text only; 1,316 entries at `aac8574`; the fix round adds eight more to the same group, 1,324). On `f95fee2` the eleven new ones match nothing. Each mutant was built from the mutate.mjs text with `mkmut.py` (nothing from mutate.mjs is run) and run through audit-ui:

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
- **S1–S5, m1–m7 and U13** are later parts. **S3 is not done here.** *(Corrected in the fix round: this line first said S3's suite check was "covered in substance", which overstated it.)* What the M1 tests do cover: every refused batch is checked for storage (every key, no writes), `MS` and `DESTDB` unchanged, so a dry run that writes storage, writes into `MS` or folds the list for real is caught (the M1 reviewer's mutants v14, v16 and v17: 48, 91 and 80 failing checks at `fc01792`). What they do not: every refused-batch case starts from a board that already reads *Unsaved changes*, so a dry run that marks the board unsaved (v15) is caught only incidentally, by the saved-board cases' CONTROL lines (4 failing checks at `fc01792`). S3's part should start a refused case from a board that reads *Saved*, and add the one-line note at `pmoTake`.
- **An edge, fixed in fix round 2.** A batch refused *while its files are still being read* is now measured against the board as it is when the refusal is said, so a change made meanwhile is not reported as the batch's. *(Corrected in fix round 2. This line first said: "An edge, by design. A batch refused while its files are still being read is checked against the board as it was when the batch began. If the shared folder's live refresh changed the board in those milliseconds, the message names what changed. At that stage the batch itself has changed nothing." That was wrong. The message did not only name what changed: it said the batch had stopped part-way, could not put the review back and had written the stored destination list. The M1 verifier reproduced it through the product alone: a single load landing while the batch read its files.)*
- **Other lists in memory are not compared.** The execution data, cost estimates, reprogramming log and BAE list are not compared in memory: `pmoTake` has no path to them, and any change to them that is kept reaches browser storage, which is compared key by key.
- **The alert box scrolls.** Chromium shows about nine lines of an alert and scrolls the rest. In every new message the state line comes first, and the full texts are quoted above, kept in `shots.json` and asserted in audit-ui's literals.
- **For S4 (found by the M1 reviewer; not M1's).** The chunk 2 review's §5b table leaves out two `verify:grid` failures that are already there on chunk 2's board: row-controls ("3 controls not recorded": `mRun(showLog)`, `mRun(toggleJrnl)`, and `uiDTab('…')` three times) and panels-render ("uiImpPanel opens: display:none"). The reviewer ran all 14 tools on the M1 board and on chunk 2's: the same exit code and the same output for every tool, timings masked. M1 changes nothing in the browser gate. S4's part must account for both.

---

### Fix round, after M1's independent review (`fc01792`; tests only, no board change)

The review's verdict was *sound, with issues*: the fix held in every case it tried, but some of what the fix promises no test could see. Eight of its mutants passed all 289 checks:

| Reviewer's mutant | What it breaks | Why no check saw it |
|---|---|---|
| v12 | no snapshot after the files are read: the batch is put back to the board as it was *before* the reads | no case changed the board while the files were read. With it, a destination added in that moment is erased from `DESTDB` and `prio27destdb` under "nothing on the board was changed": data loss under a false statement |
| v01 | the list put back by cutting it to its length and restoring its stamp, not entry by entry | every fixture only *added* destinations. A PMO copy's list naming an existing destination under another key goes through `destJoin`, which changes that entry in place and records a conflict |
| v02, v03, v04, v05, v07 | the check made blind to the destination list, the plan, the save state, the review, or the storage keys the batch added | the failed put-back tests covered browser storage only, so those comparisons never met a difference |
| v13 | only the destination list's storage key put back | "every key" was proved for `prio27destdb` alone |

**What was added** (`audit-ui.mjs`, a new marked section after the first; nothing above it changed, no fixture or expected value edited). Every fault is the test's own. The cases of the last two scenarios name theirs "(fault injected)"; as in every Cancel case above, a Cancel part-way is reached by making the dry run miss the question (`missAsks`), and the error case by making the review's drawing throw. An error or value the test makes says "(test)"; in case (c) the error is the engine's own `TypeError`. Every expected value is written out by hand.

| Scenario | Cases | What it proves |
|---|---|---|
| What changes while the files are read is kept when the batch is put back | a destination folded in by the board's own `destPkgIn` once the second file is read; the review's tick taken off then. Each then Cancel part-way | the change survives, on screen, in the copy kept in this browser, in the saved payload and on reopening; the message is the plain one; the writes are exactly the change's, the load's and one put-back |
| A destination the load changed in place is put back as it was | CONTROL: `MxS-lm.json` loaded on its own gives Lockheed Martin the match term *Fort Worth* and a kind conflict; then Cancel after it, and an error while it is the file being taken | Lockheed Martin exactly as seeded (`{k:'lm', kind:'prime', t:'LM, LOCKHEED'}`), no conflict, the whole list, the plan, storage, the payload and the identities as before (`asBefore`); *Fort Worth* in neither the payload nor storage |
| The check names each part that is not as before | (a) the list cannot be put back (`uiGraphPut` throws); (b) the plan changed during the batch; (c) the save state cannot be put back (`_lsRefused` made unable to take back the count it held); (d) the review cannot be put back (its array refuses its submittals); (e) a storage key the batch added cannot be removed, on a board opened from its saved file | each message and status line word for word: the part named, with the browser's reason when a step failed, every other part listed as checked and as before; never "nothing on the board was changed". And what it says is true of the board: (a) the list on screen still holds Depot Zulu; (b) the plan holds the change; (c) the refused list is no longer counted unsaved; (d) the review lost TSS and its tick, and the headline says the review could not be put back; (e) storage holds the key with Depot Zulu, and the board reopened in this browser reads it |
| The put-back gives back every storage key the batch changed, and writes no other | while the question is up, `prio27om` is changed, `prio27test` added and `prio27om.base` removed | the added key removed, the three that differ written back, the untouched key not written; `asBefore` |

**387 checks at `fc01792`, all passing** (289 before, 98 added). **Against chunk 2's board, 200 of the 387 fail**, all in M1's cases: the 131 as before, plus 69 spread over all ten new cases. The CONTROL passes there, as it should.

The messages the new cases assert, for example (a):

```
⚠ None of the 2 submittal files was loaded: “PSM-no-year.json” was not taken, so the 1 taken before it was taken back out of the review

⚠ NOT EVERYTHING IS AS IT WAS. Checked just now, these are not as before the batch:
  • the destination list on this board — it could not be put back (Error)
  • the plan on screen.

Checked just now and exactly as before: the submittal review, whether the board reads as saved, browser storage.
```

and (d), where the review itself could not be put back:

```
⚠ The batch stopped part-way, and the submittal review could not be put back as it was: “PSM-no-year.json” was not taken

⚠ NOT EVERYTHING IS AS IT WAS. Checked just now, this is not as before the batch:
  • the submittal review (the submittals it holds, its ticks, whether it is open) — it could not be put back (Error).

Checked just now and exactly as before: the destination list on this board, the plan on screen, whether the board reads as saved, browser storage.
```

**Mutations.** Eight entries are appended to the `v200-ui3` group, one per escaped mutant, each byte-identical to the reviewer's mutant (sha1 compared). All 1,324 entries match exactly once (text count); the 19 `v200-ui3-*` match nothing on `f95fee2` or base. Every mutant was built as text and run through audit-ui at the fix round's tests:

| Mutation | audit-ui at `fc01792` (387 checks) | at `aac8574` (289) |
|---|---|---|
| `v200-ui3-putback-shallow-dest` (v01) | caught: 18 | escaped |
| `v200-ui3-snapshot-before-reads` (v12) | caught: 5 | escaped |
| `v200-ui3-check-blind-dest` (v02) | caught: 3 | escaped |
| `v200-ui3-check-blind-plan` (v03) | caught: 5 | escaped |
| `v200-ui3-check-blind-save` (v04) | caught: 2 | escaped |
| `v200-ui3-check-blind-review` (v05) | caught: 3 | escaped |
| `v200-ui3-check-blind-added-keys` (v07) | caught: 2 | escaped |
| `v200-ui3-putback-dest-key-only` (v13) | caught: 5 | escaped |
| the eleven from `aac8574` | caught: 20, 20, 174, 102, 101, 80, 59, 15, 84, 8, 6 | caught: 20, 20, 94, 54, 54, 35, 30, 9, 48, 3, 4 |
| the reviewer's other ten (v06, v08–v11, v14–v18) | caught: 11, 2, 3, 54, 147, 48, 4, 91, 80, 5 | caught: 3, 1, 3, 28, 83, 35, 2, 64, 69, 3 |

The eleven are, in order: asks-loaded, dry-asks-unheard, no-putback, putback-no-dest, putback-dest-copy, putback-no-storage, putback-no-save-state, putback-writes-all, pick-lost, claim-unchecked, check-blind-storage. No mutant run had a harness error.

**Where the entries sit.** The review asked for the `v200-ui3` group to be moved above the line `// v2.00 (R3, Brad 11 Oct): a save that lands under a locked view says it saved the working plan.`, the rule for the safety branch's entries. **It stays at the end of `MUTATIONS`**, as the UI track's own rule says (one contiguous group at the end, headed by a "v2.00 UI chunk 3" comment). The reason is integration: the safety branch (`claude/v200-fixes-wip`) inserts its own entries directly above that R3 line. Tried in a scratch clone, the UI branch with this round's `mutate.mjs` merges with the safety branch with no conflict in any file; the same group moved above the R3 line conflicts in `mutate.mjs` (the scratchpad's `uichunk3/m1/fix/logs/mergetest.log`). The placement has no effect on how the sweep runs.

**Runs at `fc01792`** (each through `run.sh`: the AUDIT_IMPORT lock checked first, never present; `setsid -w timeout -k 10`; PIDs recorded; BOARD unset unless named):

| Run | Start (ET) | Exit | Wall (s) | Result |
|---|---|---|---|---|
| `audit-ui` | 08:29:48 | 0 | 31.5 | ALL CHECKS PASSED |
| `audit-ui`, counted | 08:30:20 | 0 | 32.0 | 387 checks, 0 failed |
| `audit-ui`, counted, on `f95fee2` | 08:30:52 | 1 | 33.0 | 387 checks, 200 failed |
| `mcount` on the board / on `f95fee2` / on base | 08:31:25–08:31:30 | 0 | 2.5–3.0 | 1,324 entries: 1,324 once / 1,305 once and the 19 `v200-ui3-*` missing / the same |
| `boot-same` | 08:31:33 | 0 | 7.8 | same |
| `audit-other` | 08:31:53 | 0 | 29.1 | ALL CHECKS PASSED |
| `audit` | 08:32:22 | 0 | 8.1 | ALL CHECKS PASSED |
| `audit-recon` | 08:32:30 | 0 | 46.4 | ALL CHECKS PASSED |
| `check` | 08:33:16 | 1 | 2.6 | the jsa() rule, the same 10 values; output identical to `aac8574`'s |
| `rv-smoke` (chunk 1 reviewer's) | 08:33:19 | 0 | 11.9 | `fails: []`; output identical to `aac8574`'s |
| `rv2/probe.mjs` (chunk 2 reviewer's) | 08:33:31 | 0 | 30.5 | 129 PASS, 1 FAIL (S2); identical to `aac8574`'s |
| `rv2/m1.mjs` | 08:34:02 | 0 | 3.1 | refused before anything loads; identical to `aac8574`'s |
| `openwrites` | 08:34:05 | 0 | 7.4 | identical write lists at opening |

The 29 mutant runs ran from 08:12:00 to 08:27:49 on files byte-identical to the commit's. The board is unchanged (`ba8d0204…`), so the screenshots and `shots.json` stand as taken. Not run, as before: `audit-import.mjs`, `audit-board.mjs`, `mutate.mjs` itself, `verify:grid`, the final-tree queue, the presweep and the full gate.

**Still open from the review (minor, not changed):** ~~a refusal made while the files are still being read is measured against the board as it was when the batch began (disclosed above, not reproduced);~~ *(corrected in fix round 2: the M1 verifier reproduced it, and it is fixed; see "Fix round 2")* a put-back step that fails with an ordinary exception gives its reason as "(Error)"; the storage-refused message explains but gives no remedy; One submission's own Cancel on the no-office question leaves that file's list folded in (base behaviour).

---

### Fix round 2, after M1's second independent review (`58803c9` board; `e439683`, `b418340`, `775903f`, `5a298b7` tests only)

The second review's verdict was again *sound, with issues*: every number of the fix round reproduced, and its tests bite. It found two things that must be fixed, and three that should.

**1. A batch refused before it takes anything said false things about itself (board).** The batch waits only while its files are read. A refusal in that window (a file too big, unreadable, refused at the door or not a submittal; two files from one office) was measured against the board as it was *before* the reads. When something else changed the board meanwhile, the message blamed the batch: *"⚠ The batch stopped part-way, and the submittal review could not be put back as it was"*, and *"It holds what the batch wrote there, and opening the board again in this browser would read it instead of the destination list on screen"*. None of that was true: nothing had been loaded, put back or written by the batch, and storage equalled the screen. The verifier reproduced it through the product alone: ⬅ Load a submittal file started, then All submissions at once started before that file's read landed. The chunk 2 reviewer's own probe shows the same thing in passing: at `4c1890c`, its refused malformed batch reports `same:false, left:["whether the board reads as saved"]`, because the save state moved during the reads, after the controls it had just driven; at `58803c9` it reports `same:true, left:[]`.

**What changed in the board** (`uiSubMany` only; no base function, and nothing in money, import, save or persistence):

- A refusal while the files are read, or for two files from one office, now takes the snapshot again and is measured against the board **as it is when it is said**. The batch has taken nothing at that point, and a change made meanwhile is not its own.
- *"The batch stopped part-way, and the submittal review could not be put back"* (and the status line's *"The batch stopped part-way"*) is said **only after the real run has begun**. A refusal before it, however the review compares, says *"None of the N submittal files was loaded"*.
- The sentence about the stored destination list is said in two halves, **each only when it is checked true**:
  - *"It holds what the batch wrote there"*: the real run wrote that list (read just before the put-back: it differs from what storage held once the files were read, and it is exactly the list the batch left on the board, as `persistDest` writes it), and storage still holds exactly that write;
  - *"opening the board again in this browser would read it instead of the destination list on screen"*: the stored list is the newer, and it differs from the one on screen. When only this half is true (someone else's write), the message says *"Opening the board again in this browser would read it instead of the destination list on screen."* on its own.

Every message quoted earlier in this file is unchanged: audit-ui's literal checks of all of them pass at the new board.

The messages the new cases assert, for example a single load (ATL) landing while the batch reads AV.json and AV-copy.json:

```
⚠ None of the 2 submittal files was loaded: “AV.json” and “AV-copy.json” are both from AV. A batch takes one submittal per office — load the one you mean

The submittal review is exactly as it was before (2 held), and nothing on the board was changed.
```

Another hand writes the stored list while the question is up, and storage refuses the put-back (fault injected):

```
⚠ None of the 2 submittal files was loaded: “PSM-no-year.json” was not taken, so the 1 taken before it was taken back out of the review

⚠ NOT EVERYTHING IS AS IT WAS. Checked just now, this is not as before the batch:
  • the destination list kept in this browser — it could not be put back (QuotaExceededError). Opening the board again in this browser would read it instead of the destination list on screen.

Checked just now and exactly as before: the submittal review, the destination list on this board, the plan on screen, whether the board reads as saved.
```

**2. The save state taken after the reads was not tested.** Every case that changed the board during the reads started from a board already reading *Unsaved changes*, so the verifier's w06 (the post-read snapshot keeping the save state from before the reads) passed. On a board opened from its saved file, w06 leaves the header reading *Saved* over a destination that is in no saved file. Now tested; the board was already right.

**Should-fix, done:** the check's storage comparison for keys other than the destination list's (the verifier's C4 and C5, its w11 and w10); and the saved payload and reopening after each failed put-back (a)–(d), which the M1 test spec asks of every failed-rollback case. **CHUNK3.md corrected:** the "edge, by design" line and the "Still open" line above, each marked in place.

**Tests** (`audit-ui.mjs`, a new marked section after the fix round's; nothing above it changed, no fixture or expected value edited; every expected value written out by hand):

| Scenario | Cases | What it proves |
|---|---|---|
| A batch refused before it takes anything says only what is true of it (`58803c9`) | for two files from one office, and for a malformed second file: Depot Mid folded in by the board's own `destPkgIn` once the second file is read; the review's tick taken off then; **ATL loaded by ⬅ Load a submittal file**, landing while the files are read (the product's own path, nothing wrapped). Then: the dry run takes the tick off (fault injected) and a file that would ask refuses the batch; another hand writes the stored list while the question is up and storage refuses the put-back; neither the list on screen nor the stored list can be put back | the message and the status line literally: the plain ones, never "stopped part-way", "put back" or "what the batch wrote" where untrue; the batch writes nothing; the change made meanwhile is kept on screen, in storage, in the saved payload and on reopening. The two halves of the stored-list sentence each said only when true, and the board reopened reads what the message says it would |
| The save state put back is the one taken after the files were read (`e439683`) | a board opened from its saved file; Depot Mid folded in while the files are read; then Cancel part-way | the header reads *Unsaved changes* and `unsavedNow()` is true; the save state is the one taken once the files were read; Depot Mid kept, also on reopening |
| The check names any storage key that is not as before, not only the destination list's (`b418340`) | `prio27om` changed and its write-back refused; `prio27test` added and its removal refused (fault injected) | the key named, with the browser's reason, literally; never "browser storage" among what is as before; storage holds what the message says |
| After a put-back that cannot finish, the saved file and the board reopened hold what was reported (`775903f`) | the fix round's (a)–(d) again: the list, the plan, the save state, the review cannot be put back | the saved payload's destination list is the one on screen; the payload carries what the message said is not as before, or is byte for byte as before; the review reopened; the board reopened from its saved file reads the list reported |

**510 checks, all passing** (387 before; 68, 11, 18 and 26 added). `5a298b7` changes no check: run against the mutants, two of them took the stored list away and the Saved-board case then threw on reading it, so its last checks never ran; the new section now reads the stored list through one helper that never throws. Against the board at `4c1890c`, 23 fail, all in the first new scenario's nine cases (the false messages, reproduced). Against chunk 2's board, 254 fail.

**Mutations.** Seven entries are appended to the `v200-ui3` group at the end of `MUTATIONS`, under three "fix round 2" comments; the group stays one block at the end, as the UI track's rule says (the second review withdrew its request to move it). All 1,331 entries match the board exactly once (text count). On the board at `4c1890c`, the four new entries written against `58803c9`'s own code match nothing and the other 1,327 match once (the three others mutate code that `58803c9` did not change); on `f95fee2` and on base, the 26 `v200-ui3-*` match nothing and the other 1,305 match once.

| Mutation | What it breaks | audit-ui at the fix-round-2 tests (510 checks) |
|---|---|---|
| `v200-ui3-early-measured-before-reads` | a refusal while the files are read measured against the board before the reads (the defect) | caught: 18 |
| `v200-ui3-partway-before-run` | "stopped part-way" said before the real run | caught: 3 |
| `v200-ui3-wrote-anyones` | whatever the stored list holds taken for the batch's own write | caught: 1 |
| `v200-ui3-reads-same-list` | "instead of the destination list on screen" when the two are the same | caught: 1 |
| `v200-ui3-snapshot-keeps-old-save` (the verifier's w06) | the post-read snapshot keeps the save state from before the reads | caught: 2 |
| `v200-ui3-check-ls-dest-only` (w11) | the check compares the destination list's key alone | caught: 8 |
| `v200-ui3-check-added-dest-only` (w10) | the check notices an added key only when it is the destination list's | caught: 4 |

All 26 `v200-ui3-*` were built as text and run through audit-ui at the new board, and all 26 are caught by real checks. *(At `775903f`'s tests, `v200-ui3-snapshot-before-reads` was caught by 8 checks and one block throwing; at `5a298b7`'s, by 10 checks and none.)* So are the first review's other ten mutants, and 14 of the second review's 19; none of the 55 runs had a block throw. The five that still pass every check change no message: w12 and w14 (the put-back skips `DIRTY` or `_saveGen`) are S3's saved-board case; w02 (properties added to an existing object are kept), w16 (the check ignores whether the review is open) and w18 (only `prio27*` keys are put back) are the second review's minors.

**Runs at `5a298b7`** (board `2d1d855e…`, every test as committed; 12 Oct, 15:08–15:49 ET; each through `run.sh`: the AUDIT_IMPORT lock checked first, never present; `setsid -w timeout -k 10`; PIDs recorded; BOARD unset unless named; the blobs of what the runs read recorded with them). They supersede the round's earlier runs, which an interruption cut short. The full list, with every mutant run, is in the scratchpad's `uichunk3/m1/README.md`.

| Run | Result |
|---|---|
| `audit-ui` | ALL CHECKS PASSED; counted, 510 checks, 0 failed |
| `audit-ui`, counted, on the board at `4c1890c` / on `f95fee2` | 23 failed (all in the first new scenario) / 254 failed |
| `mcount` (text only) | 1,331 of 1,331 once; on `4c1890c` 1,327 once and the four entries written against `58803c9`'s code missing; on `f95fee2` and on base 1,305 once and the 26 `v200-ui3-*` missing |
| `boot-same`, `audit-other`, `audit`, `audit-recon` | all pass; output identical to the fix round's at `fc01792` |
| `check` | fails on the same 10 jsa() values as before (pre-existing since chunk 1); only the line counts differ |
| `rv-smoke`, `rv2/probe.mjs`, `rv2/m1.mjs`, `openwrites` (after every commit) | `fails: []`; 129 PASS and 1 FAIL (S2); refused before anything loads; identical write lists at opening. The probe's one changed line is its refused malformed batch, now `same:true` (see above) |
| the M1 verifier's own probes (`probe-land`, `probe-edge`, `probe-land2`, `probe-r2`) on the new board | 18/18, 16/16, 6/6 pass; `probe-r2` 15 pass and 1 fail: its C3, which expects a refusal after Depot Mid landed *not* to say "nothing on the board was changed". See "Still open" |
| the 55 mutants (the 26 `v200-ui3-*`, the first review's other ten, the second review's 19), each built as text and run through the counted audit-ui | as in the table and paragraph above |
| `verify:grid`, all 14 tools, one by one (in a scratch clone at `5a298b7`) | the same exit code for every tool as in the M1 verifier's run at `4c1890c`: 0 for chrome, colour-check, menu-paths, fydp-frames and hostile-render; 1 for the other nine, which fail as they did on chunk 2's board (see the S4 note above). Output identical to the verifier's line for line, timings and paths masked |
| the screenshots' own script (`shoot-chunk3-m1.mjs`), run again on the new board into the scratchpad | every dialog's text and every before-and-after state it records are identical to `shots.json` at `aac8574`, in all four cases; no page errors |

**Still open, said plainly:**

- **"Nothing on the board was changed" is measured from once the files were read**, in both paths: a refusal while they are read (now) and a part-way failure (since the fix round). A change made by something else in that time is kept, and is not named; the message's "(N held)" counts it. The second review accepted that for the part-way path (its `probe-land2` and its minor on "(2 held)"), and asked for the same measure here ("measure it against the board as it is at that moment"); its earlier probe C3 asks the opposite. If Brad wants such a change named ("the batch changed nothing; while its files were read, …"), the wording `SAME` changes, and it is asserted word for word in many existing checks, so it is his call, not made here.
- **A double full stop in one status line nobody reaches:** a dry-run refusal whose reason ends in a full stop, *and* a difference found by the check, would read "(S01).. Not as before the batch". A difference after a dry-run refusal needs the dry run to change the board, which it does not; not changed.
- The first and second reviews' other minors are unchanged: "(Error)" as a reason; no remedy in the storage-refused message; the alert box scrolls; One submission's own Cancel (base behaviour); no `FIRST_BY_PREFIX` route for `v200-ui3-`; `npm run check`'s jsa() rule (chunk 1's).
- **Not run here:** `audit-import.mjs` and `audit-board.mjs` (the lead's), `mutate.mjs` itself (read only as text), the final-tree queue, the presweep and the full gate. The committed screenshots were not retaken: the messages and states in them are unchanged at the new board (the last row above).

## Screenshots retaken at the final board (12 Oct 2026, lead)

The M1 review's third round (verdict "sound, with issues") had one must-fix, about evidence, not the product: the committed
screenshots were taken at `aac8574` (board `ba8d0204…`), while fix round 2 changed the board to `2d1d855e…`, so Brad's "actual-
program screenshots of the M1 messages at the exact board commit" was not met at the final board.

- **Retaken** with the committed `shoot-chunk3-m1.mjs`, unchanged, on the board of `90ccabf` (`git show`, blob
  `2d1d855edda98f9179d7254ef0d4c5ff7f46b26f`), in headed Chromium under Xvfb: start 4:40:21 PM ET, exit 0, about 21 s,
  `{"errors":[]}`, all four cases, 19 PNGs and `shots.json`. They replace the files in `preview-chunk3/`.
- **Compared with the set taken at `aac8574`, and with the reviewer's own retake at the same board:** `shots.json` is identical to
  both once the board path and clock times are masked (every dialog's exact text and every before-and-after state). 13 of the 19
  PNGs are byte-identical to both. The other 6 (the alert and confirm photographs) differ only in the window title strip at the
  top, which shows the board file's name: 0 differing pixels below y = 90 in each (ImageMagick `compare`).
- No message quoted in this file changes.


---

## Part 2 — the chunk 2 review's S1–S5

Brad, 12 Oct, 6:11 AM ET, verbatim: *"S1: fix wrapping and verify every posture control is visible and usable across the reported widths, including 1440. S2: consider board-wide journal events before filtering by year; suppress a misleading 'Last recorded edit.' S3: add the refused-batch test and note. Verify storage, MS and DESTDB remain unchanged, including no unintended writes. S5: make every affected Reports item visible and clickable at 760 and 1000. S4: update tools for relocated controls and the slide-over default, retaining docked coverage. Preserve meaningful keyboard, focus, visibility and interaction assertions. Fix the Import dialog's opener/return-focus mapping. For the 1152 context-bar wrap, show that all controls remain usable; do not simply waive the failure."* (6:00 AM: *"Update layout tests for the slide-over default while retaining checks for optional docking."*)

Started from `670c467` (M1, board `2d1d855e…`). Each item is its own commit; S4 is four (one product fix, three tool groups). Every check, screenshot and result below was taken at the commit it names; the final board is **`5e9e5a5e383e0553342f822050b36da7d23e9eab`** (commits `8325909` to `2ce11b6` and after). The board file is still an empty template: "Synthetic", "SYN-", "Depot Zulu", "Depot Mid" and "probe note" occur 0 times in it. Against base the board diff is still **insertions only** (1,056 added, 0 removed); against `670c467`, 51 added and 5 removed, all five in chunk 1's and chunk 2's own UI code.

| Commit | Item | What | Board blob |
|---|---|---|---|
| `2916f0a` | S1 | the posture strip wraps in Funding and Brief at every width; `checks/sweep3.mjs` (posture) | `80457192…` |
| `088acf8` | S2 | board-wide journal lines read before the year filter; audit-ui S2 section; 5 mutations | `832e8384…` |
| `cb86178` | S3 | the comment at `pmoTake`; audit-ui S3 section; 4 mutations | `e0a90736…` |
| `8f331a8` | S5 | a toolbar menu stays clear of the sidebar; `sweep3.mjs` (reports) | `773c5af3…` |
| `8325909` | S4 | the Import box gives the keyboard back to its opener; dialogs-keyboard and panels-render know its opener | `5e9e5a5e…` |
| `0af09b6` | S4 | inspector-agrees, editors-reachable, keyboard-reach D/D2: a slide-over pass and a docked pass | unchanged |
| `df05821` | S4 | keyboard-reach A, F, L re-pointed to where chunk 1 moved the controls | unchanged |
| `2ce11b6` | S4 | toolbar-fits: every control at the top on screen, whole and clickable | unchanged |
| `83c589f` | — | screenshots at `2ce11b6` (board `5e9e5a5e…`) and the script that took them | unchanged |

### S1. The posture strip wraps; every control in it is on screen and clickable

**What was wrong.** chunk 2 wrapped the strip only where the room was under 1100px, and in Brief under 1400px. In Funding at a room of 1101–1400 (1440 among the windows, with the sidebar open) and in Brief wider than that, Needs attention's last entries and **Funding detail** sat past the right edge inside the strip's scroller.

**The fix (CSS only).** `html.ui-on .posture{flex-wrap:wrap;overflow:visible}`: the strip wraps wherever its items do not fit on one line; where they fit it is one line, as before. The strip shows only in Funding and Brief, so this is those two.

**Checked** by `ui-concept/preview-chunk3/checks/sweep3.mjs posture` (committed): every control in the strip, in Funding and Brief, at every width 700–1900 in steps of 20 (1440 among them), with the sidebar open, as the rail, docked, and docked with the rail, set as a person sets them. A control passes when it is inside the strip and the window, the strip does not scroll, and the control is the element under its own centre (`elementFromPoint`). The rows are checked at each width too. Its seed is the chunk 2 review's (nine-digit figures), plus one requirement without a CCaR record so Needs attention carries one entry more.

| Board | Widths with a control cut off or covered (of 61, per mode and setting) |
|---|---|
| `f95fee2` (chunk 2) and `670c467` (M1) | **111**: sidebar open Funding 1340–1800 (24), Brief 1640–1860 (12); rail Funding 1180–1620 (23), Brief 1480–1700 (12); docked Funding 1340–1400 (4), Brief 1640–1860 (12); docked + rail Funding 1180–1400 (12), Brief 1480–1700 (12) |
| `2ce11b6` (final) | **0**, in all eight; no row problem and no page error |

Screenshots at 1440: `part2/f-1440-funding-posture-strip-{sidebar-open,rail,docked}.png` and `part2/b-1440-brief-posture-strip-{sidebar-open,rail,docked}.png`. The strip wraps to two lines (99px in Funding, 110px in Brief, sidebar open), Funding detail on the second at the right.

### S2. A board-wide journal line recorded under another year suppresses "Last recorded edit"

**What was wrong.** `uiLastEdit` filtered the journal by the year on screen before it looked for a board-wide line, so a service-list change made while FY28 was on screen left FY27's record saying "Last recorded edit … note" over figures it had moved.

**The board-wide kinds, found by reading every `jrnlAdd` and `jrnlSync` in the board:**

| Kind | Written by | Board-wide? |
|---|---|---|
| `(load)` | `jrnlSync(note)` — only the folder restore ("restored the copy from …") | yes: a whole copy |
| `(services)` | `svcSaveList` | yes: every year's figures move with their service |
| `(more)` | `jrnlCapture`, past 200 changes in one save | yes: the uncounted changes can be in any year |
| `(unrecorded)` | `jrnlCapture`, when the walk fails | yes: the same |
| `(writer)` | `writerJournal` — the pen changing hands | no: it changes no field and no figure |
| `[]` (empty path) | `jrnlCapture` — a whole fiscal year created, removed or replaced | no: that year's own |
| `removed` | `jrnlCapture` — the year's removed list | no: that year's own |

**The fix** (`uiLastEdit` only): every kind in brackets except `(writer)` is read **before** the year filter; a kind in brackets this does not know is taken as board-wide too. The whole year and `removed` stay after the filter, as before.

**Tests** (`audit-ui.mjs`, a new marked section; nothing above it changed). Each case is the board's own calls: a note on S03 in FY27 (`setNote`), FY28 opened (`switchYear`, rolled forward), something done there, FY27 opened again; then `uiLastEdit('S03')` and the RECORD panel's Overview and History, read after the board's own `setCur`.

| Case (all while FY28 is on screen unless said) | FY27's record |
|---|---|
| CONTROL: nothing done in FY28 | names the note, exactly |
| `svcSaveList(['USAF','ANG'])` (as the chunk 2 review's `svcline.mjs`); S03's FY27 value becomes `[7,000,000, 2,000,000]` | **no line** |
| `jrnlSync('restored the copy from probe')` — the board's own call the folder restore makes (the folder cannot be reached in jsdom) | **no line** |
| 201 notes written at once (the test's write), then the board's own `save()`: it records 200 and `(more)` | **no line** |
| a save whose journal walk throws once (fault injected): `(unrecorded)` | **no line** |
| the service list changed while FY27 is on screen | no line (as before) |
| the pen changed hands (`writerJournal`) | names the note |
| a note on S03 in FY28 | names FY27's note; FY28 names FY28's |
| S05 removed in FY28 (`removeReq`) | names the note |

44 checks; on the board before S2 (`2916f0a`, and `670c467`), 8 fail, all in the four board-wide cases. The chunk 2 review's `rv2/probe.mjs` goes from 129 PASS, 1 FAIL (S2) to **130 PASS, 0 FAIL**.

**Mutations** (appended to the `v200-ui3` group at the end of `MUTATIONS`):

| Mutation | What it breaks | audit-ui at `2ce11b6` (604 checks) |
|---|---|---|
| `v200-ui3-lastedit-year-first` | the year filter before the board-wide check (chunk 2's S2) | caught: 8 |
| `v200-ui3-lastedit-services-only` | only the service list taken as board-wide | caught: 6 |
| `v200-ui3-lastedit-writer-wide` | the pen's line taken as board-wide | caught: 2 |
| `v200-ui3-lastedit-removed-wide` | another year's removal taken as board-wide | caught: 2 |
| `v200-ui3-lastedit-no-year-filter` | the year filter dropped | caught: 7 |

### S3. A refused batch from a board that reads Saved changes nothing and writes nothing; the note at `pmoTake`

**The note** (comment only; `pmoTake` is otherwise byte-identical to base), one line above it:
`// v2.00 (UI S3): uiTakeDry dry-runs this on a copy, holding back only alert, confirm, setStat, subOpenReview, destPkgIn, PMOSUBS and PMOPICK -- anything else this comes to change must be held back there too.`

**Tests** (`audit-ui.mjs`, a new marked section). Every M1 case starts from a board already reading *Unsaved changes*, where a dry run that marked the board unsaved shows nothing. These start from a board opened from its saved file (reads *Saved*; storage holds the plan's base only), TSS held, storage instrumented (every `setItem` and `removeItem` logged). Five refusals: a good file then a malformed one (the chunk 2 review's D(a)); the same office twice; a good file then one of the wrong width (refused by the dry run, which ran `pmoTake` on both); a good file then one that would ask; a good file then one with no office (asked after its own list is folded in). Each: refused, nothing taken, nothing asked, the message literally; **`setItem` and `removeItem` never called**; every storage key and value as before, and the one key it held; `MS` the same object with the same journal, as text as before; `DESTDB`, its `ents` and `lmap` the same objects, as text as before, the eight seeded; the review the same objects, as before; the save state as before, the header *Saved*, nothing unsaved. 50 checks, all passing at `670c467` too: the behaviour was already right; this is the check the review asked for.

| Mutation | What it breaks | audit-ui at `2ce11b6` (604 checks) |
|---|---|---|
| `v200-ui3-dry-marks-unsaved` | the dry run marks the board unsaved | caught: 6, all in this section; it passes all 510 M1 checks (a focused harness of the M1 sections alone) |
| `v200-ui3-dry-writes-journal` | the dry run writes a journal line | caught: 119 |
| `v200-ui3-dry-writes-storage` | the dry run writes a storage key | caught: 69 |
| `v200-ui3-dry-folds-dest` | `destPkgIn` no longer held back | caught: 114 |

### S5. Every Reports item is on screen and clickable at 760, 761 and 1000

**What was wrong.** Reports & exports hangs from its button's right edge. With Five years & PPBE or CCaR & accounting files unfolded it is wider than the room to the button's left, and the board's own `fitMenus()` moved it to 8px (760, 761) or 191px (1000) from the window's edge, under the sidebar.

**The fix.** The UI wraps `fitMenus()` — its body unchanged — as the board wraps `render()`: after it places a toolbar menu, the new `uiMenuFit()` moves it right to the sidebar's edge plus 8px, and holds a menu wider than the room right of the sidebar to that room, scrolling, as `fitMenus()` does at the window's edge. A menu in the rows or a box (`fitMenus`' fixed-position branch) is left as it places it.

**Checked** by `sweep3.mjs reports`: Reports and each of its groups unfolded from its heading, at 760, 761, 1000 and every width 700–1900 in steps of 20 (and every other toolbar menu at 760, 761 and 1000), sidebar open (at 900 and narrower, opened over the page; the click on Reports closes it, as any click outside it does) and as the rail. 479 menus judged per setting: the menu inside the window and clear of the sidebar, every item scrolled into view inside the window and the element under its own centre.

| Board | Problems |
|---|---|
| `f95fee2` (chunk 2) and `cb86178` (before S5) | 612 each (sidebar open: 366 at 17 widths; rail: 246 at 10), Filter at 1000 included |
| `2ce11b6` (final) | **0**; no menu scrolls sideways. Five years & PPBE at 760: 72–676px; at 1000 with the sidebar open: 240–844px |

`tools/dropdowns-visible.mjs` (unchanged) **passes**: 408 drop-downs at 8 window sizes, in both fonts (at `2ce11b6`; the fix round below adds a docked pass). Screenshots: `part2/r-{760,1000}-{sidebar-open,rail}-reports-{five-years-ppbe,ccar-accounting}-unfolded.png`.

### S4. The browser tools, and the Import box's opener

**The product fix.** The board's own box controller hands the keyboard back to the last control it was on before a box opened. Opened by keyboard it already returned to Import (checked before the change, 8 of 8). But a browser whose buttons take no focus from a click (Safari; Firefox on a Mac) left it on the search box, or wherever it last was. Emulated in Chromium (the press on the opener held back), 12 of 12 closings landed on `#q`. `uiImpOpen(from)` now gives the keyboard to the control that opened it first; `#uiImpBtn` passes `this`, the sidebar's Imports passes its button. After: 12 of 12 on the opener, at 1440 and at 800 (the sidebar over the page).

**The tools.** No assertion was deleted or loosened; each change is listed with the line it replaces (`670c467` line numbers).

| Tool | Old | New | Why |
|---|---|---|---|
| `dialogs-keyboard.mjs:39` | `KNOWN` had no entry for `uiImpClose` ("uiImpPanel: did not open") | `uiImpClose: 'uiImpOpen('`; plus 16 checks: two openers (Import, Imports) × by key and by a focus-less click × Esc, ✕ Close, Cancel, a click outside — the keyboard on the opener | the tool reads a box's opener off its backdrop's close call, which named none. On `8f331a8`'s board the new checks fail 8 of 16 (the click cases); at `8325909`, 16 of 16 |
| `panels-render.mjs:51` | no `SPECIAL` entry; it ran `uiImpClose()` to open ("uiImpPanel opens: display:none") | `uiImpPanel: 'uiImpOpen();'` | the same; opened, it passes all four of its checks |
| `inspector-agrees.mjs:31` | every row clicked straight from the table, the panel docked at 1700 | two passes: sliding over (Esc between rows; that the drawer opened and closed is checked) and docked (`prio27uiDock='1'`, picked straight from the table, as before) | at 1700 the open drawer's scrim takes the click meant for the next row |
| `editors-reachable.mjs:128` | `wantDocked = w > 1400` | every check in two passes: docked, `w > 1400` beside the rows with no scrim and a drawer at 1400 and below (the old rules word for word); sliding over, a drawer at every width; and the setting must take | the panel slides over by default; docked is View's choice |
| `keyboard-reach.mjs:116,134,145` (D, D2) | one pass, re-clicking the row with the drawer open | two passes; sliding over, Esc before the row is picked again; the panel's placement checked | the scrim, as above |
| `keyboard-reach.mjs:72` (A) | "the Message button is reached with Tab from the search box" (`tabTo('#q', …)`) | "… from the control before it in the context bar" (`#b_pmo`, found on the page) | the search box moved to the toolbar, after the message in the tab order |
| `keyboard-reach.mjs:189` (F) | Tab `#tab_review` → `#tab_fund` | Tab `#uiNav_req` → `#uiNav_fund` in the sidebar; the board's pressed button **and** the sidebar's current section must follow. Added: Review → Rank on the task bar's own pair | the mode switch is the sidebar's; the task bar keeps Review / Rank |
| `keyboard-reach.mjs:311,314` (L) | Review, Tab from `#q` | Funding, Tab from `#b_share`; twice, sliding over and docked | the strip shows only in Funding and Brief, and the search box moved below it |
| `toolbar-fits.mjs:39` | one line above 1100px, nothing past the edge | the same, **and** every control in the context bar, task bar, posture strip and the page's heading and toolbar inside the window, not cut by an ancestor that clips, and the element under its own centre | Brad: show that all controls remain usable at 1152 |

**Corrected in the fix round:** this table left docked coverage out of layout-fits (C, D, E, F and I), dropdowns-visible and dialogs-keyboard, which on base ran beside the docked panel above 1400px; after S4 they ran with the panel sliding over only. The fix round below adds those passes.

**1152, said plainly.** The one-line rule is kept exactly as it was, and **it still fails at 1152** (review and fund): beside the open sidebar the context bar has 920px, under the board's own 1100px wrap point, and it wraps to two lines (77px). On the same lines the new check finds all 22 (review) and 18 (fund) controls on screen, whole and clickable; and at every other width. A negative control (the context bar forced onto one clipped line, in a scratch copy) passes the one-line rule and fails the new check by name: `#b_share` at 1152, and `#saveBtn`, `#helpBtn`, `#b_share` at 1024. Screenshots: `part2/t-1152-{review,funding}-context-bar-wraps-every-control-usable.png`.

### `npm run verify:grid`, on base, chunk 2 and the final commit

Each in a scratch copy of the commit (`git archive`, `node_modules` linked), BOARD unset: the npm chain as a whole (it stops at the first tool that fails), then every one of its 14 tools on its own. Base's and chunk 2's tools are base's (unchanged until part 2); the final commit's are this part's.

| Tool | Base `4a6f7c7` | Chunk 2 `f95fee2` | Final `2ce11b6` | Final against base |
|---|---|---|---|---|
| `npm run verify:grid` | 1 (stops at layout-fits, 274 s) | 1 (stops at row-controls) | 1 (stops at row-controls) | see the rows below |
| chrome | 0 | 0 | 0 | same |
| row-controls | 0 | 1: 3 entries not recorded, 5 controls (corrected in the fix round: this said "3 controls") | 1: the same 3 entries | **differs**: chunk 1's RECORD panel History and tabs (`mRun(showLog)`, `mRun(toggleJrnl)`, `uiDTab('…')` ×3); not in part 2's scope |
| inspector-agrees | 0 | 1: the scrim takes row B's click | 0 (both passes) | same |
| toolbar-fits | 0 | 1: 1152 wraps | 1: 1152 wraps; every control usable | **differs**: the one-line rule at 1152, above |
| editors-reachable | 0 | 1: "drawer, not beside the rows" | 0 (both passes) | same |
| colour-check | 0 | 0 | 0 | same |
| menu-paths | 0 | 0 | 0 | same |
| panels-render | 0 | 1: "uiImpPanel opens: display:none" | 0 | same |
| fydp-frames | 0 | 0 | 0 | same |
| hostile-render | 0 | 0 | 0 | same |
| layout-fits | 1: J × 6 (this container) | 1: D × 4 | 1: D × 4 | **differs**: base fails J (the known container difference, U28), the UI passes J and fails D (the first row starts at 323px, 453px at 1024: chunk 1's heading and cards, m7, Brad's call on the look) |
| keyboard-reach | 0 | 1: 10 checks | 0 (91 checks) | same |
| dropdowns-visible | 0 | 1: 100 problems | 0 | same |
| dialogs-keyboard | 0 | 1: "uiImpPanel: did not open" | 0 (and 16 of 16 Import focus checks) | same |

So the final commit differs from base in three tools: row-controls and layout-fits D, both from chunk 1 and outside the five items Brad approved, and toolbar-fits' one-line rule at 1152, kept and failing. The gate does not pass.

### Every check and its result (at `2ce11b6`, board `5e9e5a5e…`)

Every command went through `run.sh`: the AUDIT_IMPORT lock checked first (never present), `setsid -w timeout -k 10 600` (300 or 180 for the small ones), the PIDs recorded, BOARD unset unless named. Logs, PIDs and every run are in the scratchpad's `uichunk3/p2/`.

| Run | Start (ET) | Exit | Wall (s) | Result |
|---|---|---|---|---|
| `audit-ui` | 17:54:50 | 0 | 56.3 | ALL CHECKS PASSED |
| `audit-ui`, counted | 17:55:46 | 0 | 56.9 | 604 checks (510 + 44 + 50), 0 failed |
| `audit-ui`, counted, on the board at `670c467` | 17:56:43 | 1 | 55.0 | 604 checks, 8 failed: all S2's |
| `audit-ui`, counted, on `f95fee2` | 17:57:38 | 1 | 55.0 | 604 checks, 278 failed (254 in M1's sections, as at `5a298b7`; 8 in S2's; 16 in S3's: the two would-ask cases, 8 checks each, all but page errors, because chunk 2 loaded the first file, asked about the second, and left the Cancel's effects in storage, MS, DESTDB, the review and the save state: M1's defect itself. Corrected in the fix round: this said the 16 were M1's literal messages) |
| `mcount` (text only; python, not through run.sh) | 17:58:33–17:58:41 | 0 | — | 1,340 entries, 1,340 once; on `670c467` 1,335 once, the five `lastedit` entries missing; on `f95fee2` 1,309 once, 31 `v200-ui3-*` missing (the four `dry-*` of S3 match chunk 2's `uiTakeDry`); on base 1,305 once, the 35 `v200-ui3-*` missing |
| `boot-same` | 17:58:41 | 0 | 6.8 | same, in all four cases |
| `audit-other` | 17:58:48 | 0 | 22.9 | ALL CHECKS PASSED |
| `audit` | 17:59:11 | 0 | 7.0 | ALL CHECKS PASSED |
| `audit-recon` | 17:59:18 | 0 | 46.5 | ALL CHECKS PASSED |
| `check` | 18:00:05 | 1 | 3.1 | the same 10 `jsa()` values as before (chunk 1's) |
| the 35 `v200-ui3-*` mutants, each built as text and run through the counted audit-ui | 18:00:08–18:33:38 | 1 each | 49.3–79.7 each | **all 35 caught** by real checks; no block threw (the table is in the scratchpad's README) |
| `sweep3.mjs posture` / on `f95fee2` | 17:55:20 / 17:56:42 | 0 / 1 | 82.6 / 81.9 | 0 widths with a problem / 111 |
| `sweep3.mjs reports` / on `f95fee2` | 17:58:04 / 18:03:09 | 0 / 1 | 305.3 / 301.1 | 0 problems / 612 |
| `shoot-chunk3-p2.mjs` | 17:53:12 | 0 | 75.7 | 37 PNGs, no page errors |
| verify:grid, three lanes (base, chunk 2, final) | 17:40:36–17:53:02 | as in the table above | | |

### Preservation, after every commit

The chunk 1 reviewer's `rv-smoke.mjs` and the chunk 2 reviewer's `probe.mjs`, `m1.mjs` and `openwrites.mjs` were run after each of the eight commits (`pres.sh`):

- **Saved payload byte-identical to base** on the same seed and clock (`savedPayloadSame: true`), `fails: []`, SRC0 the same as base's apart from the static UI blocks, every time.
- **Storage at opening unchanged**: base and every commit write `remove prio27bands_om`, `set prio27destdb`, in that order (`IDENTICAL WRITE LISTS: true`). No `prio27ui*` key is written at opening; the UI's keys are written only by the person's clicks (the screenshots' `shots.json` records them: `prio27uiRail=1` after ‹, `prio27uiDock=1` after Docked).
- `probe.mjs`: 129 PASS and 1 FAIL (S2) at `2916f0a`; **130 PASS, 0 FAIL** from `088acf8` on.
- `m1.mjs`: refused before anything loads, every time.

### Existing functions and checks touched

- **Base functions:** `pmoTake` — one comment line above it (Brad's S3 note); its body is byte-identical to base. `fitMenus` — its body unchanged; the UI wraps it (`fitMenus=(function(own){ … })(fitMenus)`), as the board wraps `render()`, and the wrapper does nothing while `html.ui-on` is not set. No money, import, save or persistence function changed.
- **The UI's own:** `uiLastEdit` (S2); `uiImpOpen(from)`, `uiGo`'s `imp` line and `#uiImpBtn`'s `onclick` (S4); one CSS rule (S1). New: `uiMenuFit` (S5).
- **Existing checks:** `audit-ui.mjs` and `mutate.mjs`: additions only (two new marked sections; nine entries at the end of the `v200-ui3` group). The verify:grid tools: the changes in the S4 table, none deleted or loosened.

### Screenshots (`ui-concept/preview-chunk3/part2/`, the actual board at `2ce11b6`, board `5e9e5a5e…`)

Taken by `ui-concept/preview-chunk3/shoot-chunk3-p2.mjs` (committed) with chunk 2's synthetic seed; every setting made by clicks. What each measured is in the scratchpad's `uichunk3/p2/shots/shots.json` (the repo keeps `*.json` out). No page errors.

| Files | What they show |
|---|---|
| `m-{1000,1050,1440,760}-sidebar-{open,collapsed}-drawer-{closed,open}.png` (16) | the width matrix: the drawer over the table; 0 rows over, 0 money inputs clipped, no sideways scroll in any |
| `d-1440-docked-sidebar-{open,collapsed}.png` | docked at 1440, a row picked |
| `f-1440-funding-posture-strip-*.png`, `b-1440-brief-posture-strip-*.png` (6) | S1: the strip wrapped, both controls on screen and clickable in each |
| `r-{760,1000}-*-reports-*-unfolded.png` (8) | S5: the menu right of the sidebar (left edge 72px at 760; 240px at 1000 with the sidebar open), every item clickable |
| `i-1440-import-box-open.png`, `i-1440-import-box-pmo-import.png`, `i-1440-import-box-closed-keyboard-back-on-import.png` | S4: the Import box; after Esc the keyboard is on Import (`keyboardOn: uiImpBtn`) |
| `t-1152-{review,funding}-context-bar-wraps-every-control-usable.png` | S4: the context bar on two lines at 1152; 22 and 20 controls at the top, all clickable |

### Not done, and open

- **`npm run verify:grid` does not pass at the final commit.** Three tools fail: row-controls (chunk 1's five RECORD-panel controls are not in `tools/row-controls.json`; the tool's own remedy is `--record`, which changes what the gate asserts and is not one of the five items, so it is Brad's call); layout-fits D (chunk 1's heading and cards, m7, Brad's call on the look; J passes, against base's container failure); toolbar-fits' one-line rule at 1152 (kept, and failing, as above).
- **No mutation entry for S1, S5 or the S4 product fix.** They are layout and focus, which the jsdom suites cannot see; they are held by `sweep3.mjs`, `dropdowns-visible.mjs` and `dialogs-keyboard.mjs` in Chromium.
- **`npm run check` fails as before**: the same 10 `jsa()` values from chunk 1; part 2 adds none (`onclick="uiImpOpen(this)"` passes no value).
- **The chunk 2 review's minors m1–m7 are unchanged**, and so are part 1's open items.
- **Not run:** `audit-import.mjs` and `audit-board.mjs` (the lead's), `mutate.mjs` itself (read as text only), the final-tree queue, the presweep and the full gate.

### Fix round, after S1–S5's independent review (tools and tests only; the board unchanged)

The review's verdict: sound, with issues. One must-fix, in the tools: docked coverage was not kept. Three should-fixes and seven minors. **The board is the same file at every commit of this round** (`5e9e5a5e…`); every change is in the browser tools, `audit-ui.mjs`, `mutate.mjs` and this file. Times are Eastern.

| Commit | Time | Item | What |
|---|---|---|---|
| `e950efe` | 19:57:11 | must-fix | layout-fits C, E and I: a pass sliding over and a pass docked, each checking where the panel is |
| `e7b7cbb` | 20:00:42 | must-fix | dropdowns-visible: every menu again, docked, at the four sizes above 1400px, in both fonts |
| `fe8ffa0` | 20:00:49 | should-fix 3 | keyboard-reach D2 and L check where the panel is in each pass, as D does |
| `7950a4f` | 20:02:19 | minor | keyboard-reach A starts its Tab from the context bar's first control, named |
| `147ef2a` | 20:02:28 | should-fix 2, minors | toolbar-fits checks each control whole; its summary names each cause; its header says where the posture strip is checked |
| `f2fa0ff` | 20:06:30 | should-fix 1 | audit-ui: the same-year half of S2's rules (12 checks; the commit message says 13, which is wrong); two mutations |
| `9519595` | 20:25:35 | must-fix, completed | layout-fits D and F docked as well |
| `8783a2d` | 20:29:40 | must-fix, completed | dialogs-keyboard: every box again with the panel docked |
| this commit | | minors | this section; three statements above corrected in place, each marked |

**Docked coverage (the must-fix).** Brad, S4: "update tools for … the slide-over default, retaining docked coverage"; at 6:00 AM, "while retaining checks for optional docking". On base the RECORD panel stood docked beside the rows at every width above 1400px, so every check made there was made beside it. After S4 only inspector-agrees, editors-reachable and keyboard-reach D, D2 and L had a docked pass; layout-fits, dropdowns-visible and dialogs-keyboard ran with the panel sliding over (closed, or open over the table), and nothing checked the narrowest grid the board has: docked beside the sidebar, 248–955px at 1401 and 248–982px at 1440. Part 2's S4 table did not list these three, and the builder's record said docked passes were added wherever a check depended on the panel being docked: for these three that was not so.

Each check below now runs twice: sliding over (the default) and docked, set as View › Record panel › Docked beside the table sets it (`prio27uiDock = '1'` in this browser). Each pass checks where the panel is, so a docked pass that ran with the panel sliding over fails by name. Nothing in the sliding-over pass changed.

| Tool | Checked docked now | Docked, at the final commit |
|---|---|---|
| layout-fits C (row controls inside the grid, 3 modes × 11 widths 1024–1920) | beside the grid at 1401–1920, a drawer at 1366 and below | passes; the grid at its narrowest 248–955px (1401) |
| layout-fits D (the first requirement on screen as the board opens) | 1920, 1440, 1366, 1024 | fails, as it does sliding over (chunk 1's heading and cards, m7, Brad's call on the look); docked at 1440 the first row is at 420px, against 323px sliding over |
| layout-fits E (Brief: no control on a row, no RECORD panel) | 1440 | passes |
| layout-fits F (Fund's columns are the RECORD panel's) | 1440 | passes, 19 rows |
| layout-fits I (every lane-short figure whole) | 1920 and 1440 beside the grid, 1024 a drawer; 3 densities | passes, 837 notes, the nine-digit figure whole 18 times |
| dropdowns-visible (every toolbar menu and group, the row ⋯ menus) | 1536 and 1920, at 730 and 960, in both fonts | passes: 608 drop-downs in all (408 as before, 200 docked) |
| dialogs-keyboard (every box takes, keeps and gives back the keyboard) | 1600 | passes: 44 boxes and 16 of 16 Import returns in each pass |

Left single-pass, and why: layout-fits A, B and G read figures, menu calls and data, not where anything is drawn; H reads two rows' styles; J's widths (761–1023) have the panel as a drawer docked or not. row-controls reads which controls the row and the panel hold, not where they are (the panel's content is the same docked; it fails on chunk 1's entries either way). colour-check reads the theme's colours; menu-paths, panels-render, hostile-render and fydp-frames open no RECORD panel; toolbar-fits measures the bars above the table.

**Each docked pass catches what only it can.** Mutants of the final board, built as text in the scratchpad (each find matching once; none committed), run through the final tools:

| Mutant | Sliding-over pass | Docked pass |
|---|---|---|
| the docked setting ignored (the verifier's `vDock-ignored`, the same text) | passes | fails by name: layout-fits C ×3, D, E, F and I ("the docked setting did not take"); dropdowns-visible at its 4 sizes in both fonts ("not docked beside the list"); keyboard-reach D2 and L ("position: fixed"; D times out, as before); dialogs-keyboard ("docked: the RECORD panel is not docked beside the table") |
| above 1400px, docked, the rows 1200px wide (wider than the docked grid) | passes | fails: layout-fits C in all three modes (38, 38 and 57 controls past the grid at 1920) |
| docked, the RECORD panel's lane-short notes cut to 30px | passes | fails: layout-fits I ("lane short $980,000" 48>30 at 1920) |
| docked, the lower half of a row's open ⋯ menu cut off (as the list's own edge cut v1.92's row menus) | passes | fails: dropdowns-visible, 96 problems, every one docked: the menu's last items covered by the rows under them, first and last row, whole list and short, 4 sizes, both fonts |
| docked, the RECORD panel drawn above the toolbar's menus (z-index 600) | ran through (what it found is not printed: the tool stopped later) | the tool stops: Reports' FYDP group heading cannot be clicked, the docked panel takes the click (exit 1, a crash rather than a named problem) |

Three more docked row-menu mutants change nothing on the screen, and dropdowns-visible rightly passes them: a row's open menu shifted 420px or a whole window to the right, or opened rightwards from its button. `fitMenus()` places every row menu itself (fixed, its left worked out from the button, and measured after placing, which takes in any shift on the menu itself): a probe at 1920 and 1536 docked finds each where it is on the final board (1044–1307px and 775–1039px), all 5 items on top. That is why the first attempt's 420px mutant passed; it was not a gap in the tool.

**S2, the same-year half (should-fix 1).** A new marked section in `audit-ui.mjs`, after S3's. S03's note in FY27, then in FY27, the year on screen: S05 removed (`removeReq`, the board's own call), and FY27's record names no last edit; and a whole-year line for FY27 at the end of the journal, with the board saved and reopened from that file in the same browser, and the reopened board's record names none either. No call on this board writes a whole-year line after a line in its own year: a year's plan comes into the file once, when the year is created, and none takes a year out. A journal carried in a saved file can hold one, so the test puts it there as such a file carries it (the shape `jrnlCapture` writes when a year's plan changes in one piece, read by `jrnlLabel` as "the FY27 plan — replaced"). A control first (the note stands when nothing else happens), and literal journal tails. 12 checks, passing on every board here: the same-year rules are chunk 1's, which S2 rewrote, and these hold them.

| Mutation | What it breaks | Caught |
|---|---|---|
| `v200-ui3-lastedit-removed-ignored` | a removal in the year on screen is not read as a line that may have changed S03 (the verifier's `vS2-removed-ignored`, byte for byte) | 2 checks: no last edit named; the record says none |
| `v200-ui3-lastedit-whole-year-ignored` | a whole-year line in the year on screen is not read so (the verifier's `vS2-empty-path-ignored`, byte for byte) | 2 checks: the same, in the board reopened |

**toolbar-fits (should-fix 2).** "Whole" now means the whole control: its left edge right of the sidebar's right edge (as `sweep3.mjs` judges the posture strip), and the control (or its own label, which passes a click on to it) under a point just inside each of its four sides, besides its centre. The context bar slid 60px under the sidebar (the verifier's `vTF-hdr-under-sidebar`, the same text) now fails at 14 of 20 width-and-mode pairs: `#uiCycBtn: under the sidebar (201 < 232), its left edge covered by #uiCollapse` from 1366 to 960, and at 900 and 820 under the rail (33 < 64). At 1440 and wider (the other 6 pairs) the tool finds the shifted button clear of the sidebar and whole. The final board: every control whole and clickable at every width; 1152 still fails the one-line rule, kept. The summary names each cause on its own (before, a width failing only for an unusable control read "wrap or overflow"), and the header says the posture strip is empty and not shown on the template this tool opens: `sweep3.mjs posture` checks it, on a populated board, outside the gate.

**keyboard-reach (should-fix 3 and a minor).** D2 and L check where the panel is once it is open, as D does: with the docked setting ignored they now fail on their own (`position: fixed`), not only through D. A starts its Tab from `#uiCycBtn`, written out, not from the control found just before the Message button (which made it one Tab by construction): 4 Tabs, across the appropriation, the fiscal year and the PMO menu.

**Old → new, for every changed assertion** (`7a71245` line numbers):

| Where | Old | New | Why |
|---|---|---|---|
| `layout-fits.mjs:163–182` (C) | one pass, the panel sliding over | two passes, sliding over and docked; plus "the RECORD panel was … " per mode and pass | docked coverage |
| `layout-fits.mjs:184–192` (D), `:194–204` (E), `:206–225` (F), `:264–292` (I) | one pass | two passes; plus where the panel was (E: whether the setting was on) | the same |
| `dropdowns-visible.mjs:55–106` | 8 sizes × 2 fonts | the same, then 4 sizes above 1400px × 2 fonts docked, the panel checked docked | the same |
| `dialogs-keyboard.mjs:23–211` | one pass | two passes; the panel's place checked first in each | the same |
| `keyboard-reach.mjs:157–179` (D2), `:337–369` (L) | the docked pass did not check the panel's place | it does | should-fix 3 |
| `keyboard-reach.mjs:75–83` (A) | from the control before the Message button, found on the page (`#b_pmo`, 1 Tab); base: from `#q` | from `#uiCycBtn`, written out (4 Tabs) | the start was derived from the answer |
| `toolbar-fits.mjs:40–53` | inside the window, not clipped, the control under its centre | the same, and clear of the sidebar, and itself or its label under a point inside each side | should-fix 2 |
| `toolbar-fits.mjs:72` | "N width(s) wrap or overflow" | "N width(s) failed: X wrap, overflow or miss a control; Y with a control not usable" | the summary blamed the wrong cause |

No assertion was deleted or loosened; every expected value is as it was. Labels: each check that now runs twice ends its label in "(sliding over)" or "(docked)", and a problem found docked by dropdowns-visible or dialogs-keyboard starts "docked:"; A's label now names its start ("from the context bar’s first control", was "from the control before it in the context bar"); the closing line of layout-fits, dropdowns-visible and dialogs-keyboard says both passes ran.

**Corrected in place above** (each marked "corrected in the fix round"): row-controls' failure is 3 entries for 5 controls, not 3 controls; S3's 16 failures on `f95fee2` are the two would-ask cases on every check but page errors, not M1's literal messages; and the S4 table's docked coverage.

**Every check and its result, this round.** Each run through the scratchpad's `uichunk3/p2/fix1/bin/run.sh`: the AUDIT_IMPORT lock checked first (never present), `setsid -w timeout -k 10 600` (300 or 120 for the small ones; 2400–3600 for the lanes that hold several runs), the PIDs recorded, BOARD unset unless named. The jsdom checks ran in a scratch copy of `f2fa0ff`, whose board, `audit-ui.mjs` and `mutate.mjs` are the final commit's; verify:grid in a copy of `8783a2d`, whose tools and board are the final commit's (both copies compared file by file with their commits). The round was stopped once by a usage limit, at 20:47, and resumed at 23:13 after the machine restarted: the two runs it cut off were run again, and the mutant loop was finished then. The machine was shared with other work through this round (load average 12–29), so wall times are long. fydp-frames (unchanged since base) failed once under that load, at 20:10:32 in `f2fa0ff`'s copy: "the board reopens as O&M with its own plan" and what follows, which reads as the board not yet reopened when the tool looked (it waits a fixed 700ms after a reload). With the same tool and board it passed at 20:32:57 in `8783a2d`'s copy, below, and 3 times of 3 again at 23:19 (load average about 12).

| Run | Start | Exit | Wall (s) | Result |
|---|---|---|---|---|
| `npm run verify:grid` | 20:29:54 | 1 | 8.3 | stops at row-controls, as before |
| chrome, inspector-agrees, editors-reachable, colour-check, menu-paths, panels-render, fydp-frames, hostile-render, keyboard-reach | 20:30:02–20:37:42 | 0 each | | pass; keyboard-reach 95 checks (91 before, and D2's and L's placement in each pass) |
| row-controls | 20:30:03 | 1 | 6.8 | the same 3 entries, chunk 1's (5 controls) |
| toolbar-fits | 20:30:23 | 1 | 30.0 | 1152 wraps (the one-line rule, kept); every control at every width whole and clickable |
| layout-fits | 20:33:50 | 1 | 231.8 | 72 checks pass; D fails ×4 in each pass (m7); C, E, F and I pass in both passes |
| dropdowns-visible | 20:38:36 | 0 | 176.4 | 608 drop-downs, both fonts, sliding over and docked |
| dialogs-keyboard | 20:41:33 | 0 | 170.6 | 44 boxes and 16 of 16 Import returns, in each pass |
| `audit-ui` | 20:07:40 | 0 | 189.6 | ALL CHECKS PASSED |
| `audit-ui`, counted | 20:10:50 | 0 | 192.7 | 616 checks (510 + 56 + 50), 0 failed |
| `audit-ui`, counted, on the board at `670c467` | 20:14:03 | 1 | 220.2 | 8 failed, all in S2's first section, as before; the fix-round section passes there |
| `audit-ui`, counted, on `f95fee2` | 20:17:43 | 1 | 276.8 | 278 failed, as before (254 M1, 8 S2, 16 S3); the fix-round section passes there |
| `mcount` (text only, through run.sh) | 20:22:20–20:22:32 | 0 | | 1,342 entries, 1,342 once on the final board; 1,335 on `670c467` (the 7 `lastedit` missing), 1,309 on `f95fee2` (33 `v200-ui3-*` missing; the four `dry-*` of S3 match chunk 2's `uiTakeDry`), 1,305 on base (the 37 `v200-ui3-*` missing); none twice, none unparsed |
| `boot-same` | 20:22:38 | 0 | 22.9 | same, in all four cases |
| `audit-other`, `audit`, `audit-recon` | 20:23:01, 20:23:58, 20:24:16 | 0 each | | ALL CHECKS PASSED |
| the 37 `v200-ui3-*` mutants through the counted audit-ui | 20:26:54–20:44:58; after the stop 23:18:57–00:02:38 | 1 each | 68–367 each | 37 of 37 caught, 616 checks run each, no block threw. Each of the 35 older ones fails as many checks as at `2ce11b6`, but for `lastedit-no-year-filter`: 9, against 7, because the new section's control fails too (with no year filter, FY28's whole-year line suppresses the note). The two new ones fail 2 each, the two of their own case |
| `check`, in a copy of `f2fa0ff` | 20:26:46 | 1 | 7.0 | the same 10 `jsa()` values, and the two git checks (a `git archive` copy is not a repository) |
| `check`, in the repository (`8783a2d`'s board and tools) | 23:23:48 | 1 | 7.8 | the same 10 `jsa()` values as at `2ce11b6`, none added; the two git checks pass |

**Preservation, after every commit of this round** (`fix1/bin/pres.sh`: the chunk 1 reviewer's `rv-smoke.mjs`, the chunk 2 reviewer's `probe.mjs`, `m1.mjs` and `openwrites.mjs`, on the board extracted from each commit): at `e950efe`, `e7b7cbb`, `fe8ffa0`, `7950a4f`, `147ef2a`, `f2fa0ff`, `9519595` and `8783a2d`, `fails: []`, `savedPayloadSame: true`, 130 PASS and 0 FAIL, the batch refused before anything loads, and `IDENTICAL WRITE LISTS: true`. Once (`e7b7cbb`), `m1.mjs` read its batch's result before the batch had finished (it waits a fixed 400ms, and the machine was loaded); run again, it was refused before anything loads. This commit changes this file only; preservation and the whole of verify:grid were run again at it, after it was made, and are in the builder's record (`uichunk3/p2/README.md`, "Fix round").

**Not done, and open** (as part 2's list above, plus): the verify:grid gate still fails, on the same three tools (row-controls, layout-fits D, toolbar-fits at 1152), now with D's failure shown docked too. The mutants of this round's browser checks are scratch only; the jsdom mutation sweep cannot see layout, so they have no `mutate.mjs` entry.
