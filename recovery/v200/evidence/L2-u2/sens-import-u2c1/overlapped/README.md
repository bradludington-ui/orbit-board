# U2 commit 1 (`4e90af4`): BASELINE that did NOT run alone

- **Run:** full `audit-import` on the clone `rec/L2/wt-u2c1` at `4e90af4` (board `c08c6d2c`, audit-import `e63768bf`),
  started 10:17:48 PM ET, ended 10:26:43 PM ET, exit 0, 534.8 s, **ALL CHECKS PASSED**. Lock set.
- **Overlap:** from about 10:19 PM ET to its end, the UI chunk-2 workflow ran two bounded Playwright sweeps in
  `/home/user/orbit-ui` (process groups 30554 and 30555). Brad's rule is that audit-import runs alone, so this run is
  kept as evidence but is **not** the alone run. It is repeated alone.
- The cause was my instruction to the UI workflow: it applied the lock to suite runs only, not to Playwright.
