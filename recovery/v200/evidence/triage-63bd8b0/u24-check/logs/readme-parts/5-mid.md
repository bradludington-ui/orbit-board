
### Leaf positions behind problem 1 (`reach.mjs`, read from the runs)
BT-file-W (x1, the builder's probe), where CAROL-F is the content the person last chose:
- end: CAROL-F in screen and storage; BRAD-2 in the file; KEPT-0 kept. Recorded clean against BRAD-2, so falsely clean. Status
  "💾 Saved in place by Carol".
- reopened: BRAD-2 opened from the file, and CAROL-F not kept aside: it is in storage only until the next write.
- reopened + one edit: **CAROL-F only `outside:versionHistory`**.

BT-file-Wcf (y4, the counterfactual: the record marked unsaved before the reopen):
- reopened: the file is held back ("… already keeps earlier work aside … not loaded"). CAROL-F stays on screen and in storage.
- reopened + one edit: CAROL-F still in screen and storage.

### Added scenarios: expected (hand-written in `x/xcheck.mjs` before each was first run) vs observed, pass y4
