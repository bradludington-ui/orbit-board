# Review record for U9 and U10, as Brad supplied it (verbatim)

Received in this session at 2026-10-11T22:28:32.146Z UTC. It is extracted byte-for-byte from the message in the session record.
sha256 of the message text: b3044099fb7aa903ee963b2e222a5e2d3f01fe2e2c9e1a44aa506ae6eda60a46.

The text holds the characters U+2060, U+FFFD after "division", "refusal" and "year state". They look like citation markers that were stripped in transit, and are kept exactly as received.

Brad describes this as an independently verified review record. It verifies nothing at `af892cb…` or `8e2dbe5…`.

---

Restore U9 and U10 from this independently verified review record.
Both findings reproduced on main f9b441365551cd691a20a8f0b08a374a92a12f0e and WIP e635775ad1f33abe68af13bbae5557c6c3dd5543. Their board blobs were respectively b160bc031c7f70a4492f64394893d9b74bb0f327 and fd728f1ce84a5eef85cf33c6e2f2ca23374d3a3f.
U9 — P2: PMO split disagreement. Synthetic fixture: USAF, O&M FY27, PRIME-3, $3 discretionary funding; CLINs 0010/0002/0008 have weights 1:2:3 for MxS/AV/TSS. Independent BigInt largest-remainder arithmetic expects $1/$1/$1, and the actual CLIN source workbook agrees. PMO parts, forecast and PMO Matrix export instead give $0/$1/$2. The total balances while ownership disagrees. At $9, expected $2/$3/$4 becomes $1/$3/$5; non-tie controls pass.
Cause: PMO weights are normalized through floating-point division⁠� before exact splitting. Both bounded whole-board runs completed with 29 passing checks and five ownership failures, without crashes or timeouts.
U10 — P2: refused edits change a locked-cycle export’s codes. Lock PB27 with RCN/EEIC 11111/AAAAA; change working codes to 99999/ZZZZZ; save and reopen. View PB27, open Setup → Codes and structure → RCN/EEIC, enter 77777 in the enabled RCN field, then export Excel.
Expected: USAF $900 and ANG $200 remain under 11111/AAAAA. Actual: Save says “the change was not kept,” but the RCN-EEIC by Month sheet exports those dollars under 77777/AAAAA, labelled LOCKED VIEW.
The setter mutates the registry before refusal⁠�; refusal restores only the year state⁠�. Both bounded runs completed with 44 passing and nine failing assertions. Stored cycle and working codes remain intact. These were synthetic jsdom checks.
Keep both findings unresolved pending reproduction on the current pinned tree. This record supplies no verification at af892cb… or 8e2dbe5….
