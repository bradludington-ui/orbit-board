
## Expected (literal) vs observed

### x1: the builder's 38 scenarios with the builder's literals (`probe-copy/check.mjs`)
The 25 rows that differ are below. All are CONTRACT rows, and each is the same in r2 and r3. The other 497 non-RUN rows are
equal; all 522 are in `logs/table-x1.md`, and per-scenario counts are in `logs/check-x1.log`. How to read them:
- On a W scenario, a CONTRACT ≠ is a reproduction.
- On a control, it means the control is unhealthy, and the builder does not attribute that path (O1, O2, O4).
- IB-fold-Wclean's REACH ≠ is O2. My IB-fold-C3clean and IB-fold-C1oldclean show the same loss with no save.

