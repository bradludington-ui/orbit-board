# Independent review probes as received (11 Oct 2026, 4:16 PM ET)

Brad pasted these four files into the session at 20:16:55 UTC (4:16 PM ET). They were extracted byte-for-byte from that
message in the session record, not retyped, and saved as UTF-8 with LF line endings and a final newline. Each matches
the SHA256 Brad gave (see `SHA256SUMS`).

| File | Probes | Bytes |
|---|---|---|
| `money-runtime-probe.mjs` | R1 | 7,374 |
| `code-runtime-probe.mjs` | R2 | 2,498 |
| `runtime-encoding-shim.mjs` | encoding shim | 477 |
| `races-probe.mjs` | R3, R4 and R5 | 7,816 |

The races probe was originally named `probe.mjs`; its contents are unchanged.

What these files are, in Brad's words:
- They are **surviving independent review probes from `main` `f9b441365551cd691a20a8f0b08a374a92a12f0e`**. They are not
  restored candidate fixes.
- **Their hardcoded `main` identifiers are historical provenance.** Each new run records its actual rebuilt commit,
  board and tool blobs, and adapted-script hashes separately.
- **They are kept unchanged:** every fixture, assertion and expected value.
- **Only these may be adapted:** imports, board selection, dependencies and private output locations.
- **For R1,** the HTML the script reads must be identical to the board `boot()` selects through `BOARD`.
- **R2** exercises the real setter with a DOM field. It does not establish coverage of the editor's `onchange` or of
  reopening.
- **All probes use synthetic data and simulated file handles.**

These files are kept here as received. Any adapted copy used for a run is stored with that run's evidence, with its own
hash and a diff against the file here.
