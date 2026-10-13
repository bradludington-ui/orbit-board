# Text backup of the lead's scratch records (fix tracks, reviews, restart tooling)

Taken before an expected usage-limit stop on 13 Oct, so that no finished work depends on the scratch disk alone.

- `rec-text-<stamp>.tar.gz` holds, from the lead's scratch folder `rec/`:
  - each track's top-level README, `drafts/`, `diffs/` and `wfstate/`;
  - each reviewer's README.md and VERDICT.md;
  - the restart tooling and notes (`L7/*.js|py|md|txt|sh`, `L7/restart/`);
  - the integration dry run's READMEs;
  - the text-only helpers in `bin/`.
- `rec-text-<stamp>.MANIFEST.sha256` lists every file in the archive with its sha256.
- No board file (`*.html`) is included, so there is no populated board. Logs, probes, copies and clones stay on the
  scratch disk: the copies can be rebuilt from `diffs/` against the base `7ee498a`.
- Restore: `tar -xzf rec-text-<stamp>.tar.gz -C <scratch>/rec`, then `sha256sum -c` the manifest from `<scratch>/rec`.
