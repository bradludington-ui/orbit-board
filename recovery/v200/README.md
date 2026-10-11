# v2.00 fix work: loss record and reimplementation plan (11 Oct 2026)

This directory is a **backup on the private `claude/v200-fixes-wip` branch**. It is not part of any release. No pull
request, merge, change to `main` or update to `claude/orbit-v2.00` is authorized.

## What happened

- **About 19:10 UTC (3:10 PM ET):** the cloud environment of the ORBIT session was replaced by a fresh machine. Uptime
  read 0 min at 19:11 UTC.
- **What went with it:** the session's clones (`orbit-board`, `orbit-docs`, `orbit-review-kit`), its scratch area and
  the local branch `v200-fixes-local`.
- **What was never on GitHub:** that branch's 17 commits, `4073d3e` → `c7f8750`. Push had been paused, so none of them
  was ever pushed. GitHub reports "No commit found" for `c7f8750`, `b2e5c66` and `6022c50`.
- **Backups checked, about 4 minutes:**
  - GitHub branches and commits (none hold the work);
  - Dropbox search (nothing);
  - the account's other Claude Code sessions (none hold the work).
  - No owned backup or snapshot exists.

## Status of everything below

**This is a REIMPLEMENTATION**, starting from `1c945375335ba4251a0f900fbdb68381350a0adb` (`claude/orbit-v2.00`). It is
not a restoration.
- **New SHAs:** every recovery commit gets a new SHA. Lost SHAs are named only as history.
- **Lost results are never reinstated as verified passes.** A check counts only when it has been run again, fresh,
  against a replacement SHA, with that run's own log and blobs.
- **`surviving/`** holds what could be recovered. All of it is unverified at any surviving SHA:
  - `session-record-1349-1929-UTC.md`: an extract of the session record after 13:49 UTC. It has every command and its
    result, every file written, and every message to Brad. It includes exact text for some later changes: the
    key-counting helper and diff, the full-import message change, the guard and mark-content fixes, the
    expectation change, the case 18(a) label, notes edits, the catalog repair diff and mutation diffs.
  - `session-summary-spec.md`: the specifications carried in the session's working summary. These cover the
    approvals, the R1–R5 contracts, the reload-safety functions as written, and the commit list with what each held.

## Lost local commits (history only; none exists anywhere)

| Lost SHA | What it held |
|---|---|
| 4073d3e | Correction A: audit-hostile v1.88 check direction and lookalike guard; K1 assertions (order, pmoChars); validation-note corrections |
| b2e5c66 | B: the R1–R5 fixes, tests in audit-import, audit-board and audit-recon, 15 v200-r1…r5 mutations, re-anchored v199-rcn-cut, unsaved-flag-never-set and impmixed-file-unguarded anchored on indent |
| e54f124 | R4b test block (Save under the hold is refused before file access) |
| eb43cfb | CLAUDE.md notes for B |
| d963748 | R1 fixture: per-year pot in `st.bm` in audit-recon `open` |
| 6022c50 | Reload safety: pending-import mark written and read back before the first list |
| 71f44a5 | impPendPrev precision fix |
| e709c7a | Reload test block and NEXT-VERSION reload notes |
| 4a582e8 | Import tests counted by key; ledgers |
| f3f78cd | Notes: the opening's storage writes as measured |
| 9fc5fa0 | Scenario-ran guard; mark contents; storage-full ledgers; reload cases 10–14; notes |
| fee7336 | Board: full-import messages (three situations), text only |
| bae506e | Five checks retargeted by key; message assertions for cases 8, 11 and 13 |
| 822f768 | Cases 10b (unreadable mark at startup) and 15 (no-mark control); notes |
| 83bfeaf | Board: one-appropriation, several-board and opening notices, text only |
| 5b76b64 | Cases 16–18 (both import paths' notices, controls) |
| c7f8750 | Expectation "An import stopped part-way…"; case 18(a) labelled synthetic |

## Rebuild plan: small layers, each a separate commit pushed to this branch

Each layer gets its own focused fail-before/pass-after evidence against its new SHA. Every command is capped at
600 s, and each chunk is checkpointed.

1. **Correction A:** the audit-hostile check direction and the K1 assertions, with notes.
2. **R1–R5 fixes,** one finding per commit, each with its tests. The R1 contract is the Variant A/B arithmetic in the
   summary spec. Mutations are re-added and their applicability counted from source text.
3. **Reload safety:** the pending mark protocol, the precision fix and the opening guard, with the reload tests.
4. **Test layers:** key-counting, scenario-ran guard, mark contents, storage-full ledgers, reload cases 1–18.
5. **Message-only board layers:** full import first, then one appropriation, several boards and opening notices,
   with their assertions.
6. **Catalog repairs:** `impmixed-never-lifted` and `impmixed-lift-partial`, after their disposable-copy evidence.
7. **Sensitivity runs** again, against the new SHAs: R1–R5, folder guard, partial lift, M4, M11, R4b, R3–R5.

UI work is separate and not part of this branch.
