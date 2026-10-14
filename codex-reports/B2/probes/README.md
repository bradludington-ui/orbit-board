# B2 replay notes

These probes exercise only synthetic data at run time. The uploaded report excludes all full application copies, saved HTML and XLSX binaries.

1. Create fresh disposable `base/` and `snapshot/` copies of exact commit `7ee498a46507972f803cd48ce9f27d5d668acb63` under the batch folder.
2. Verify the four input SHA256 entries in `../logs/snapshot-inputs/MANIFEST.sha256`, then apply the three reference diffs to `snapshot/` using `patch -p1`. Verify the full board, audit-recon and text-only mutation catalog blobs in the report.
3. Use the existing compatible dependencies. Do not run `playwright install`. The reported node version is v24.19.0 and jsdom is 27.0.0.
4. `cycle-export-independent.mjs` imports the unmodified snapshot boot helper but takes `BOARD` from the environment. Its expected rows are literal USAF $900, ANG $200, AFRC $0 and all services $1,100.
5. The actual commands, limits and exits are recorded in the `*-run.json` files. For a replay, adapt only the batch folder paths and the `--import` path to this folder's exact `runtime-encoding-shim.mjs`; preserve fixture literals, entry points and comparisons.
6. The runtime-only directory holds emitted XLSX bytes only locally. `xlsx-independent.py` reads them with Python ZIP/XML code and no ORBIT money or reader helper. Uploaded JSON captures include every worksheet row and each XLSX SHA256.
7. The two initial harness attempts are explicitly superseded/incomplete in the report. The corrected current probe handles only the single known jsdom navigation warning on successful full import, requires that warning once, and still rejects every other application error.

Never import or execute `mutate.mjs`. `mcount.py` is a literal source-text parser and must be invoked with `python3 -I`; applicability is not a catch verdict.
