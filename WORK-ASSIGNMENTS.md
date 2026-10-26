# ORBIT work assignments

Brad controls assignments and release scope. Read this file and AGENTS.md before starting. Share each assignment with both sessions: this file does not provide a live communication channel or locking mechanism. Update assignments only in an authorized interactive task; scheduled monitors never write here.

## Standing lanes

| Role | Default owner | Boundary |
|---|---|---|
| Release implementation and integration | Claude | Board edits only on Brad's go and approved release scope |
| Independent review | Codex | Read-only review of exact main and all relevant PR head SHAs |
| Assigned fixes or tests | Agent explicitly named by Brad | Exclusive editing window; outgoing editor must stop first |
| Release gate | One owner explicitly named by Brad | No duplicate long gates; retain pinned evidence |
| Windows and native export acceptance | Brad or designated human operator | Synthetic disposable files; record versions and tested SHA |
| Merge and publication | Brad-authorized operator | Review completion alone does not authorize either action |

## Current implementation assignment

- Task and approved scope: v2.08 -- item 122 (edit the whole record in one box, Brad's decisions D1-D12 of 26 Oct, D9:
  retire the rename), the defects F1-F7 of `recovery/v208/ITEM-122-BRIEF.md` §5 (F6: lock the drill) and the shortfall
  absorber refused in a PMO copy (Brad, 26 Oct: "build them with 122 in v2.08", "Go on v2.08"); item 123 (the security
  review kit, "Go on 123").
- Owner and outgoing owner's explicit stopped status: Claude (Claude Code session on ccr-0b15d8d5-ypf61n), named by Brad's go
  of 26 Oct. The v2.07 lead stopped at the handoff commit (PR #25, d920ea0).
- Allowed files and excluded scope: prioritization-board-grid.html, tools/**, review/**, SECURITY-REVIEW.md, package.json,
  .gitignore, NEXT-VERSION.md, CLAUDE.md, AGENTS.md (the rules item 122 changes), recovery/v208/** and this entry.
  Excluded: the sweep (no named go), U63/U64 and the rest of the handoff's §6 lists, items 100 and 107.
- Isolated branch and base commit SHA: ccr-0b15d8d5-ypf61n, based on main ddf6b4b (v2.07 f508fdb plus records).
- Status: editing.
- Required bounded checks and designated gate owner: npm run check; every suite; the browser checks (verify:grid, keys,
  dropdowns, dialogs, leftmenu, standards); each new mutation proved with recovery/v208/bin/prove.py; mcount; review with
  skeptics; validate:nightly on the final tree. Gate owner Claude. No sweep.
- Handoff commit SHA and changed files: given at the PR (#27).
- Known risks, blocked checks and reviewer findings: listed in NEXT-VERSION.md under v2.08 at the PR.
- Brad's integration/merge/publication authorization, if given: not given. Nothing merges without Brad's go.

The four recurring monitors retain read-only scope.

## Assignment template

- Task and approved scope:
- Owner and outgoing owner's explicit stopped status:
- Allowed files and excluded scope:
- Isolated branch and base commit SHA:
- Status: assigned / editing / ready for review / returned for fixes / accepted / closed
- Required bounded checks and designated gate owner:
- Handoff commit SHA and changed files:
- Commands, seeds, durations, exit statuses and results:
- Known risks, blocked checks and reviewer findings:
- Brad's integration/merge/publication authorization, if given:

## Message to paste into both sessions

> Read AGENTS.md, CLAUDE.md and WORK-ASSIGNMENTS.md. Work only on Brad's explicitly assigned scope in an isolated branch. One editing agent at a time, including tests. Do not assume another session has stopped. Hand off an exact commit SHA, changes, actual validation results and unresolved risks. If ownership is unclear, continue read-only work and ask Brad before edits. Recurring monitors remain read-only.
