BATCH A1  |  base 7ee498a46507972f803cd48ce9f27d5d668acb63  |  started 13 Oct 2026 12:08:23 PM ET / finished 13 Oct 2026 12:19:02 PM ET

FINDINGS:
P2 — **U35: uncommitted RCN/EEIC/title input is lost during a background Live refresh.** Exact base board blob fce8a391bd8a248d5185e199d22190c1687eaea0. Handoff/ledger inputs pinned at bbe728556dc394c50d84ad9a09facc5fa163e42b; README edd2ffd74fa05da37443c55c7069bdc660853460.

Minimal reproduction shared by four variants:
1. Open a synthetic board with one ordinary K1 registry entry: RCN11111, EEICAAAAA, title ORIGINAL TITLE.
2. Start actual `liveTick()` with its synthetic GET reply held; open the actual RCN/EEIC dialog.
3. Focus the field, type the literal below, dispatch input without change or blur. The actual `__dlgPend` marker becomes true.
4. Release the GET; read the actual replacement input, pending marker, focus, prompt ledger and raw model.

| Variant | Literal entered / expected after refresh | Actual after refresh | Expected / actual pending |
| --- | --- | --- | --- |
| successful GET, RCN | 88888 | 11111 | true / false |
| successful GET, EEIC | QQQQQ | AAAAA | true / false |
| successful GET, title | HELD NEW TITLE | ORIGINAL TITLE | true / false |
| failed GET (503), RCN | 88888 | 11111 | true / false |

No discard question is asked; focus returns to the replacement field, which looks usable but holds the old text. The raw registry model does not change. Controls: no refresh retains pending88888; committed88888 survives successful refresh. Each control passes all nine checks.

The four variants are one underlying finding, already reserved as U35. Relative to the seven published regtext findings:

| Published row | Mapping |
| --- | --- |
| U36 | new; ordinary short ASCII title is lost before commit; no length cut |
| U37 | new; no workbook or illegal XML character is involved |
| U38 | new; no file normalization, long imported code or charset mismatch is involved |
| U39 | new; one ordinary K1 registry entry, no duplicate labels |
| U40 | new; no destination-name fold or imported newer list is involved |
| U41 | new; no SI code is involved |
| U42 | new; no sheet name, apostrophe or Unicode cut is involved |

PROPOSAL:
One ledger row, not a code fix. Append U35 to the stated base ledger; when applying to the current lead branch, replace its broad U35 placeholder with this exact row rather than duplicating the ID. Leave U36–U42 separate. The diff below is against7ee498a, not the newer input branch. No board/suite/mutation change is proposed in A1.

```diff
--- a/recovery/v200/UNRESOLVED-LEDGER.md
+++ b/recovery/v200/UNRESOLVED-LEDGER.md
@@ -62,6 +62,7 @@
 | U29 | **"load the shared one" (adoptShared) on a clean board leaves the record falsely clean, with no save at all.** The next Save writes the shared copy over the person's own without asking; in file mode the person's copy is then in no copy the board can reach (XFSHn). Related, also with no save: the shared state file's automatic load (SHaC) and `bootTakeFile` in folder mode (BTC) record clean against a copy that differs from the screen. | U17 checker (12 Oct, `rec/L4/u17-check`); the U17 builder's P2 | Measured on 63bd8b0 and 1375b72b alike (pre-existing) | Open, P1 shape (the person chose to load the shared copy); fix P3 (count the load as a change) drafted, not applied |
 | U30 | **A refresh that records the folder's copy as the base before a Save lets that Save write over it without asking** (the v1.89 "taken as the base, as it always was" path); with a history copy under ten minutes old, the folder's copy is then in no copy the board can reach after one more Save. No second tab is needed (BR-C2a, BR-C2ah); U20 is its two-tab form. | U20 probe, observation O4 (12 Oct, `rec/L4/u20`); U20 checker | Measured on 63bd8b0 | Open, P1 shape; the U20 checker drafted an O4 proposal (`rec/L4/u20-check/PROPOSAL.md`), checked only with git apply --check |
 | U31 | **Import several boards at once never marks this browser's record dirty.** A reopen is then falsely clean with no save; in folder mode, when the folder holds a newer copy, the reopen loads it and keeps nothing aside, leaving the import only in the person's own file. | U24 probe, observation O2 (12 Oct, `rec/L4/u24`); U24 checker (IB-fold-C3clean, IB-fold-C1oldclean) | Measured on 63bd8b0 | Open, P2 provisional (the import survives in the person's file) |
+| U35 | **P2: a background Live refresh silently replaces uncommitted registry input.** Open the actual RCN/EEIC registry during a held liveTick GET. Type RCN `88888`, EEIC `QQQQQ` or title `HELD NEW TITLE`, dispatch input without change/blur, then release the successful peer reply. The typed input and its pending marker must remain until commit/discard. Actual input becomes `11111`/`AAAAA`/`ORIGINAL TITLE`, its pending marker clears, no discard question is asked, and the registry model is unchanged. A failed GET also loses pending RCN. | Codex batch A1, base `7ee498a46507972f803cd48ce9f27d5d668acb63`, board `fce8a391bd8a248d5185e199d22190c1687eaea0` | Fresh full-board jsdom, 13 Oct 2026, 12:16:02–12:16:05 PM ET: 46 checks pass, eight protection checks fail, no crash/timeout/missing scenario. No-refresh pending-input and committed-input refresh controls pass. `A1/live-held-text.mjs`, `live-held-results.json`, `live-held.log`. | **Open. New relative to U36–U42; retain U35 rather than opening a duplicate ID.** This is pending-editor redraw loss, not title-length/charset/XML/key-fold/SI/sheet-name work. No fix proposed or run in A1. Native Chromium/real peer/shared-folder paths not established. |
 
 **U15–U20 triage (12 Oct, for Brad's 7:10 AM ET checkpoint).** Priority: **P1** = a copy of someone's work can end in no
 copy the board can reach, or money or a record is misstated; **P2** = misleading state or wording with nothing lost (or
```

RUNS:
| Command | Exit | Time taken | Result |
| --- | ---: | ---: | --- |
| `python3 runner.py --cap 120 --cwd /workspace/orbit-codex-batches-20261013-1205ET/A1 --log A1/live-held.log --meta A1/live-held-meta.json -- node --import ./runtime-encoding-shim.mjs live-held-text.mjs` | 1 | 3.499 s | six scenarios,46 pass/eight meaningful protection failures; no incomplete/crash/timeout |
| `python3 runner.py --cap 60 --cwd /workspace/orbit-codex-batches-20261013-1205ET --log A1/mcount-base.log --meta A1/mcount-base-meta.json -- python3 -I helpers/mcount.py A1/base/tools/export-audit/mutate.mjs A1/base/prioritization-board-grid.html` | 0 | 3.338 s | 1328 entries/1328 once; missing0, multiple0, unparsed0 |

Reproduction started2026-10-13T12:16:02.256980-04:00, finished2026-10-13T12:16:05.756159-04:00; cap120seconds. Node24.19.0/jsdom27.0.0. The task-local adapter supplies missing native encoders; ASCII-only CSS.escape adapter is recorded in the existing probe. Only import/output paths, testedSHA and Eastern metadata were adapted from the existing prior probe; all54 expected checks are unchanged. Actual liveTick/livePoll, actual input guard and literal expected input are exercised; no extracted arithmetic helper supplies an expectation. The fake network peer is local to the fixture and never contacts a real URL.

NOT DONE / LIMITS:
A1 requests exact findings, mapping and a ledger draft; it does not request a U35 implementation. Consequently there is no fixed run, no new committed suite block and no mutant catch claim. The deliberate base diagnostic exits1 for protection failures, not infrastructure failures. A2/A3/A4 handle the separate assigned fixes. No native Chromium, real two-machine/shared-folder acceptance, real budgets, branch edits, commits, pushes, PRs, full audit/gate or mutate.mjs execution occurred. No populated board is returned. B2,C1,C2,D1 remain held. All owned process groups exited.

QUESTIONS FOR BRAD:
None. This restores the exact U35 brief that was missing from the lead's registry-text investigation.
