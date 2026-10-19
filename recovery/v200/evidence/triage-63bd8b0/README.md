# Raw triage logs on 63bd8b0 (U17, U20, U24 and the rows they opened: U29, U30, U31)

Brad, 12 Oct 2026: "Provide their raw reproduction, recovery and control logs alongside the final matrix; the status
summary alone doesn't establish independent verification."

These are the working folders of the four triage runs that measured U20, U29, U30 and U31, copied from the lead's
scratch area (`rec/L4/<name>`) on 12 Oct. Every probe, run script, log, output and PID record is here as written.
Nothing was re-run or edited for this copy.

| Folder | What it is | Rows it supports |
|---|---|---|
| `u20/` | U20 probe: the Web Lock mock with its 19 self-tests, the scenarios, logs and outputs; observation O4 | U20, U30 |
| `u20-check/` | The independent checker of U20: CHECK.md, its own runs (`logs/`, `rerun/`, `x/`), the O4 proposal | U20, U30 |
| `u17/` | U17 probe on the U13 commit (63bd8b0) and the U2 head (a8891e1), every route and control | U17, U29 |
| `u17-check/` | The independent checker of U17: CHECK.md, its own probe and runs | U17, U29 |
| `u24/` | U24 probe: the four entry points; observation O2 | U24, U31 |
| `u24-check/` | The independent checker of U24: CHECK.md, its own runs (`probe-copy/`, `x/`) | U24, U31 |

In each folder, README.md is the runner's account (identities, runs, PIDs, tables, what was not done). CHECK.md is the
checker's verdict, and PROPOSAL.md is a drafted correction. No proposal was applied to the product. The proposed
copies under `proposal/` were never booted ("NEVER-RUN" in their names). `pids.txt` records every process each run
started.

These rows stay **open**. The logs reproduce the defects and show the controls. They are not fixes.

## What was left out, and how to check it

- **Board files (`*.html`, 16 files).** They are left out because a populated board is never committed. Some were
  copies of a commit's board. Others were boards a run saved, or proposed patched copies. `EXCLUDED.txt` lists each
  one with its sha256 and size.
- **Symlinks (8).** These were `node_modules` links. They are listed in `EXCLUDED.txt` and were not followed.
- **Working copies of a commit (`b63/` = 63bd8b0, `c137/` = a8891e1).** Each held 51 files that are byte-identical
  to that commit, and the git blob ids were checked. They are replaced by `TREE.txt`, which lists every file with its
  blob id and says "same" for each. `git show <commit>:<path>` gives a file back. The one file not in the commit,
  `runtime-encoding-shim.mjs`, is stored.
- **JSON outputs.** These are stored with `.txt` added (`x.json` → `x.json.txt`), as in `L3-u1-u14/commit-check/`. The
  content is unchanged.

`MANIFEST.sha256` covers every stored file. Run `sha256sum -c MANIFEST.sha256` in this folder to check it.
