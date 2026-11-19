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

- Task and approved scope: v2.16 -- item 148 alone, on Brad's "Go" of 19 Nov 2026: the five-year spend plan joined the years by
  requirement number, so an added requirement's dollars printed under another requirement's name (his GEX/GATES and LM Option Year
  photos). Item 133 moves to v2.17. v2.15 shipped (PR #36, merged e3804cf, 9 Nov 2026).
- Owner and outgoing owner's explicit stopped status: Claude (Claude Code session on ccr-aef4e698-poiml3), no helpers. Claude stops
  edits at the handoff commit.
- Allowed files and excluded scope: prioritization-board-grid.html, tools/export-audit/audit-recon.mjs, tools/export-audit/mutate.mjs,
  NEXT-VERSION.md, CLAUDE.md, recovery/v215/{proofs,proved}-v216.*, this entry. Excluded: item 133 (v2.17), everything else open.
- Isolated branch and base commit SHA: ccr-aef4e698-poiml3, from main 3486997.
- Status: ready for review. Awaiting Brad's merge. Not merged.
- Required bounded checks and designated gate owner: npm run check; mcount; the new block failing on main and passing here; each new
  and retargeted mutation proved against its own check; every suite whole; validate:nightly on the final tree. Gate owner Claude.
  No sweep without Brad's named go.
- Handoff commit SHA and changed files: the commit that carries this entry (the PR names the head). The board (BUILD
  'v2.16 (19 Nov 2026)': cycProjOf, fydpProjAdded, fydpLineKeys, fydpSameIn, fydpBookApp, aiRequestText, the AI read-back);
  audit-recon's v2.16 block; mutate.mjs's v2.16 slot and v204-112-years-window retargeted; NEXT-VERSION.md, CLAUDE.md, this entry.
- Commands, seeds, durations, exit statuses and results: the new block on main 3486997 fails (Brad's case, a lock before v2.16, the
  workbook, the AI review) and passes here; 7 of 7 mutations CAUGHT (recovery/v215/proved-v216.jsonl); 3,806 targets, each once.
  **The gate:** every suite whole on the final tree (8 banners + the legacy line, boot-same); `npm run validate:nightly`: every stage holds but the browser stage, which fails on layout's carried D x8 alone, as on main (defect register 20 known, 55 mutations; coverage 27/27; money map 322 cells, 119 proven, 202 n/a, 1 open; fuzz seed 587323430; verify-file self-test held; suites 33.4 min). Its trace line read "? populated cells" (the stage's captured output came back empty, the stage ok); `npm run trace` on the same tree: 77 populated cells, every link holds.
- Known risks, blocked checks and reviewer findings: an added requirement entered separately in two years with no link prints as two
  lines (by design: "From another year" joins them). Locks taken before v2.16 join added requirements by the rolled-year rule only.
- Brad's integration/merge/publication authorization, if given: not given for v2.16. Each version merges on Brad's word.

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
