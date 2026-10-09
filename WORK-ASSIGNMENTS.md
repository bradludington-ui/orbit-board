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

- Task and approved scope: v2.00 (item 99), the security version: the security review's injection holes, the structural
  guards and the reviewability cleanup (Brad, 7 Oct); and, confirmed by Brad on 9 Oct, every hole the final review and the
  full sweep of the board found, plus the built-in-name key class (an id, name, title or key such as __proto__,
  constructor or toString).
- Owner and outgoing owner's explicit stopped status: Claude (Claude Code session on claude/orbit-v2.00), confirmed by Brad
  on 9 Oct. No outgoing owner: Claude has held v2.00 since 7 Oct.
- Allowed files and excluded scope: prioritization-board-grid.html, tools/**, package.json, NEXT-VERSION.md, CLAUDE.md and
  this entry. Excluded: AGENTS.md, .agents/**, item 100 (DoD standards, waiting on the security team) and item 101 (next
  version).
- Isolated branch and base commit SHA: claude/orbit-v2.00, based on v1.99 (6388472), main merged in at f9b4413.
- Status: editing.
- Required bounded checks and designated gate owner: tools/check.mjs, npm run audit:suites, audit-inject against v1.99 and
  the candidate, a presweep of every new mutation; gate owner Claude (npm run validate:math, run as the restart-proof
  batch runner).
- Handoff commit SHA and changed files: given at the PR.
- Known risks, blocked checks and reviewer findings: listed in NEXT-VERSION.md under v2.00 at the PR.
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
