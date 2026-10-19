  - **R2: an EEIC is checked in the form it is stored (outside review of `f9b4413`).** The RCN / EEIC list keeps an
    EEIC trimmed and upper-cased, but item 91's limit (v1.99: a code over its limit is refused, never cut) measured it
    as typed. Upper-casing can make text longer: ß becomes SS, and the ligature ﬃ becomes FFI. Ten ß passed the
    10-character check and were stored as 20 S. That is a code over its limit, written by the board itself. Four ﬃ
    were stored as 12 characters in the same way.
    - **The fix:** `rcnSet` checks the EEIC trimmed and upper-cased, the same expression it stores. An EEIC that is
      too long in that form is refused like any other over-limit code. The list keeps what it had, the field keeps
      what was typed and is marked, and the status says the EEIC was not changed. The RCN is stored trimmed only,
      which is the form it was already checked in, so the RCN is unchanged. No other typed code had this gap: every
      other `codeTake` caller stores the value it checked.
    - **Test:** `audit-board.mjs`, "v2.00 (R2) — an EEIC is checked in the form it is stored". Each case types into a
      field of its own while the list holds AAAAA, and every expected value is a literal.
      - ß×10 and ﬃ×4 are refused. These two checks fail on `1c94537`.
      - The CONTROLs pass before and after: ABCDEFGHIJK (11 as typed) is refused; " ab12c " is kept as AB12C;
        ABCDEFGHIJ is kept; ß×5 (exactly 10 once upper-cased) is kept as SSSSSSSSSS.
    - **Probe:** The outside review's `code-runtime-probe.mjs` passed 4 of 6 checks before the fix and passes 6 of 6
      after it.
    - **Mutations:** `v200-r2-eeic-checked-raw` (the check reads the text as typed) and `v200-r2-eeic-not-upper` (the
      check trims but does not upper-case). `audit-board` catches each on both refusal checks. For typed text the
      two behave the same; they are different edits. `v199-rcn-cut` still matches once and is still caught, so it
      needs no re-anchor here.
    - **Limits:**
      - The refusal message shows the stored form. Ten ß are reported as "SSSSSSSSSSSSSSSSSSSS" is 20 characters,
        and the message does not say the text was upper-cased.
      - Length is counted as before, in UTF-16 code units (`String.length`), the same count `codeIssues` uses.
      - An EEIC that arrives in a file is stored as it arrives, without upper-casing. `codeIssues` therefore already
        measures the stored form, and it is still kept whole and listed, as in item 91.
