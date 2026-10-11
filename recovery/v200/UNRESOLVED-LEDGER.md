# v2.00: unresolved ledger (opened 11 Oct 2026, 6:30 PM ET)

These findings and gaps are known but not fixed. U9 and U10 were restored on 11 Oct, at 6:29 PM ET, from the review record Brad
supplied. Each one stays here until Brad decides it or its fix is integrated with
fresh evidence. A review finding is not permission to fix.

Recorded at backup branch head `46b28b5b342e175fe099502e9f262dada3b2063a`. The board there is the board of
`af892cb12713dd22afd9a84c0ec604b30614f6ea`.

| # | Finding | Source | Evidence so far | Status |
|---|---|---|---|---|
| U1 | **Carried-row omission (money completeness).** With the carryover rule on, a row carried into a year that is neither a workbook year nor in the plan window is left out of ALL YEARS, out of every offered year and out of the export, with nothing stated. An explicit selection of that year is silently replaced by ALL YEARS. | Adversarial review of R1, 11 Oct; **predates R1** (main reproduces it) | **Reproduced** (11 Oct, 6:25–7:02 PM ET; `evidence/U1-carried-rows/SUMMARY.md`), with literal arithmetic. Fixture A shows $540,000,000 against $660,000,000, short exactly the carried $120M, the same on panel and export. Ownership is correct wherever the dollars are counted, and every explicit-year control passes. Reproduced identically on 46b28b5, 4a6f7c7 and main. The adversarial verifier reproduced it in general with a different fixture | **Separate finding; correction proposed, not built.** One line in `flowYears()`, plus a test (with the verifier's V4 layout to be added) and two mutations. **Needs Brad's decision.** Until it is fixed, the R1 follow-up's "counted in FY2026" wording is untrue in this configuration: land this fix next, or make that wording conditional first |
| U2 | **keptPutBack loses data.** Kept-aside work put back while a folder save is still writing ends marked saved. After a reopen it is in no copy at all. | Adversarial review of the R5 draft, 11 Oct; the same race as R5 | The reviewer's scratch run on the R5 draft board (`R5-verify/logs/scratch-kept2-patched.log`, in the scratch record) | Proposed to Brad at 6:20 PM ET: R5's two lines in `keptPutBack`, plus a test and two mutations. Awaiting his decision |
| U3 | **R4b contract gap: a queued Save.** Suppose a Save is asked for while the hold is on and another save is running. It is queued, not refused at once. If saving is allowed again before its turn, it runs and writes the mix. | R4 draft; confirmed by its adversarial review | Reviewer's `exp/queued.mjs` on the R4 draft board: perm 2 · read 2 · open 2 · writes 2 | Proposed: refuse at once in `saveInPlaceFile()` **and** `saveInPlace()` (the 💾 Save button, Take the pen), with a message that fits the path. Awaiting Brad |
| U4 | **The folder save's window for the hold.** `_driveStorePushRun` checks the hold only before its folder read. An import that stops part-way during that read does not stop the folder save, which writes and says "Saved". | R4 adversarial review | Reviewer's `exp/folder.mjs`: wrote and said Saved with the hold on; no imported data was shown in the copy | Not tested further. Awaiting Brad |
| U5 | **R3: a stale on-screen "unsaved" flag after a locked view.** A save lands under the view, and after leaving it the screen reads unsaved. The folder and the record both say saved. | Lead's bounded probe (corrected run) and the suite fixture | `evidence/L2-r1-r5/R3-late-window-8f22668/CORRECTION.md` | `PROPOSAL.md` item 2 (one line). Awaiting Brad |
| U6 | **R3: quiet-autosave wording.** When the re-check refuses an autosave, it replaces the locked-view banner with "the change was not kept", though no change was made. | R3 adversarial review (minor) | Review text | Message-only. To propose |
| U7 | **R2: the checked and stored forms are written twice.** `rcnSet` builds the trimmed, upper-cased EEIC for the check and again for the store; a later edit to one could break them apart. | R2 adversarial review (minor) | Review text | Robustness only. To propose |
| U8 | **R1: Help, the matching-rules sentence, the FY26 button, and net-zero execution.** The Help document's funds-flow section is not updated. The matching-rules sentence overstates for appropriations other than the board's own. The FY26 button does not say that rows stored under FY25 count in it. Execution netting to $0 is treated as no executed money, and no test covers it. | R1 and R1 follow-up adversarial reviews | Review texts | The FY25 tooltip and planned note were addressed by the R1 follow-up. The rest is wording within R1's approved scope, to follow |
| U9 | **P2: PMO split disagreement.**

**Fixture** (synthetic): USAF, O&M FY27, PRIME-3, $3 of discretionary funding. CLINs 0010, 0002 and 0008 carry weights 1:2:3 for MxS, AV and TSS.

**Expected:** independent BigInt largest-remainder arithmetic gives **$1/$1/$1**. The CLIN source workbook agrees.

**Actual:** the PMO parts, the forecast and the PMO Matrix export give **$0/$1/$2**. The total balances, but ownership disagrees.

**At $9:** expected $2/$3/$4, actual $1/$3/$5. Non-tie controls pass.

**Cause (per the record):** PMO weights are normalized by floating-point division before the exact split. | The review of `main` (Codex), as Brad supplied it at 6:28 PM ET, 11 Oct (`surviving/review-record-U9-U10-received-2026-10-11.md`) | **Reproduced per that record** on `main` `f9b4413` (board `b160bc03…`) and on WIP `e635775` (board `fd728f1c…`). Both board blobs were confirmed here against the repository. Two bounded whole-board runs completed: 29 checks passed and 5 ownership checks failed, with no crashes or timeouts. **Not verified at the current pinned tree** (`8e2dbe5`, board `82c7f446…`, the same board as `af892cb`). | **Unresolved**, **reproduced on the current tree** (11 Oct, 6:31–7:00 PM ET): bounded synthetic probes, `main` reproducing as the positive control, on pinned `a91402b` (board 82c7f446) and current head `4a6f7c7` (board 4d273c06), with an adversarial verifier rating it sound (`evidence/U9-U10-repro/SUMMARY.md`). Not fixed; awaiting Brad |
| U10 | **P2: refused edits change a locked-cycle export's codes.**

**Steps:**
1. Lock PB27 with RCN/EEIC 11111/AAAAA.
2. Change the working codes to 99999/ZZZZZ, save and reopen.
3. View PB27, open Setup → Codes and structure → RCN/EEIC, and enter 77777 in the enabled RCN field.
4. Export Excel.

**Expected:** USAF $900 and ANG $200 stay under 11111/AAAAA.

**Actual:** Save says "the change was not kept", but the RCN-EEIC by Month sheet exports those dollars under 77777/AAAAA, labelled LOCKED VIEW. The stored cycle and the working codes stay intact.

**Cause (per the record):** the setter changes the registry before the refusal, and the refusal restores only the year state. | The review of `main` (Codex), as Brad supplied it at 6:28 PM ET, 11 Oct (same file) | **Reproduced per that record** on `main` `f9b4413` and WIP `e635775` (blobs as for U9). Two bounded runs completed: 44 assertions passed and 9 failed. These were synthetic jsdom checks. **Not verified at the current pinned tree** (`8e2dbe5` / `af892cb`, board `82c7f446…`). Related: v1.99 item 88 (a locked cycle keeps its own RCN/EEIC list). | **Unresolved**, **reproduced on the current tree** (11 Oct, 6:31–7:00 PM ET): bounded synthetic probes, `main` reproducing as the positive control, on pinned `a91402b` (board 82c7f446) and current head `4a6f7c7` (board 4d273c06), with an adversarial verifier rating it sound (`evidence/U9-U10-repro/SUMMARY.md`). Not fixed; awaiting Brad |
| U11 | **Tracked from the morning: neighbouring writer and restore risks.** `takePen`, `driveExecPush`, `driveAcePush`, `driveAceReplace`, `aceRestore`, `driveRpPush`, `driveStorePull` load-theirs, and the hold message overwritten by the "Saved in place" status. | The 9:51 AM ET working summary ("tracked separately, not to implement") | None in this session | Tracked; not examined since the reset |
| U12 | **Documentation work C** (`orbit-docs`; its agent never reported) | 9:51 AM ET working summary | None | Tracked |

**Evidence gaps (not findings):**
- Committed-suite sensitivity for R3–R5 is running, one audit-import at a time, in a git clone of `af892cb`.
- The reviewer's re-check of the nine existing `driveRestore`-area mutations on the R5 board did not finish. That
  sensitivity sequence will cover it.
