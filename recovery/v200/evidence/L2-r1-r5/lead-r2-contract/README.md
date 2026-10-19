# The lead's own R2 cross-check: the full written contract (not one of the received probes)

`r2-contract.mjs` is a synthetic check I wrote, separate from the received probes. It calls the real `rcnSet` with a
real input field. Each case starts from a stored EEIC of `AAAAA`.

**The cases:**

| Typed | Expected |
|---|---|
| ß×10 (upper-cases to 20 characters) | refused: AAAAA kept, field marked, "EEIC not changed" |
| ﬃ×4 (upper-cases to 12 characters) | refused, the same way |
| " ab12c " | AB12C kept, nothing marked |
| ABCDEFGHIJ | kept |
| ssssssssss | SSSSSSSSSS (10 characters once upper-cased) kept |

The expected values are literal.

**Base `9b27e80` (board the same as `1c94537`), run at 4:31 PM ET:** exit 1, 2 failing, both the R2 defect:
- ß×10 is stored as `SSSSSSSSSSSSSSSSSSSS` (20 characters), unmarked and with no message;
- ﬃ×4 is stored as `FFIFFIFFIFFI` (12 characters), unmarked and with no message.

The three controls pass, and there are no script errors.

**Limit:** this drives the setter directly, like the received R2 probe. It does not cover the editor's `onchange`
wiring, or reopening the board.
