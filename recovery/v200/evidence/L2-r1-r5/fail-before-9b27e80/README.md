# Layer 2: probe fail-before at the pinned pre-fix tree (11 Oct 2026, 4:18 PM ET)

- **Pinned commit:** `9b27e8006ddf336b9ebefde54c9c3c4154e52370` (layer 1). Its board blob, `42e8111810b11c0500adb2fd029194c0ccbd9780`, is identical to the v2.00 candidate `1c94537`.
- **Copy:** an isolated copy made by `git archive` of the pinned commit, built with `recovery/v200/bin/mkcopy.sh`. Per `provenance.txt`:
  - the money, code and shim probes sit in the copy's root, and the races probe in the sibling `races/`;
  - `node_modules` is linked to the single installation, and `boot.mjs` and the shim resolve the same `jsdom/lib/api.js`;
  - `BOARD` is unset, so R1's `readFileSync` and `boot()` read the same file;
  - all four probe files match the received SHA256s, **unchanged with no adaptation**.
- **Environment:** Node v22.22.0, jsdom 27.4.0, `NODE_OPTIONS=--max-old-space-size=8192`.
- **Commands** (each through `bin/run.sh`, 600 s cap, own process group):
  - `cd copy && node money-runtime-probe.mjs`: exit 1, 5.2 s, 10 passed, 3 failed;
  - `cd copy && node code-runtime-probe.mjs`: exit 1, 5.2 s, 4 passed, 2 failed;
  - `cd races && node --import ../copy/runtime-encoding-shim.mjs races-probe.mjs`: exit 1, 12.1 s, 3 passed, 3 failed.
- **Every failure is a `defect` case, and every control passes:**
  - **R1:** the carried FY25 execution is added to the FY26 plan instead of replacing it. Got
    [600000000, 100000000, 500000000]; want [100000000, 100000000, 0]. The exported TOTAL FUNDING and O&M follow, at
    600000000.
  - **R2:** ß×10 is accepted, and the stored EEIC is over 10 characters.
  - **R3:** the locked cycle's state is written to the main and history copies, and the status says "✅ Saved".
  - **R4:** the waiting save writes the partly imported board ("PARTIAL FF").
  - **R5:** after a restore during the earlier folder close, the board ends marked saved (dirty false, baseDirty false).

The probes' own `mainSHA` and `boardBlob` fields are historical provenance from `main` `f9b4413`. The actual tree for
this run is given above.
