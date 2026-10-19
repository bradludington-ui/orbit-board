# v2.00 final tree, pinned 7:27:34 AM ET, 19 Oct 2026 (lean gate, Brad 5:35 AM ET: no UI-C1 re-check agent, no G22 reviews, no per-commit check agents)
pin: e2d0bc64640adfa02fccbd1c930f95bb67427864 (claude/v200-integration)
tree: 06d26c853950414793396a74e50a97f13e4423bb
parents: 3cb3e378b6bca2175e085d7324da2faa1a8a55f9 139853710a61c6ca27f7b59793a7e65c4c725f03
100644 blob 6255966f334bc4353786df4b40812982141a7b02	package.json
100644 blob 7fef189a0d0a48c531cb7f7ac3360af2dab159ca	prioritization-board-grid.html
100644 blob 7045beaa7ebb21c868c10f01800ded63dd829b71	tools/a11y-baseline.json
100644 blob b8e0ee7a82d87b9945f212b0e5eaab91188abe49	tools/check.mjs
100644 blob d0fbdb8a6b7a5d6588743957a4c92d21ad556843	tools/chrome.mjs
100644 blob bf232c085d59b3419f3b7ea8199dd80fcca69b05	tools/colour-check.mjs
100644 blob 0ba0f8d00a9683bcdf42cdd4f820e1a11728c2cb	tools/dialogs-keyboard.mjs
100644 blob 894e8cdcbb1d35855b984ddbf554ecb69acfc4e2	tools/dropdowns-visible.mjs
100644 blob 887a3a596731ae4d1df443ddadcd886a9d8fad7e	tools/editors-reachable.mjs
100644 blob a7c575e5f98452be88f8d0d7f352fd805350e3d7	tools/export-audit/audit-board.mjs
100644 blob d8cbc873d592924802aaea48ced1eb44ac3c7eeb	tools/export-audit/audit-hostile.mjs
100644 blob 193b76b60a5b933bbe1fe1b574d5d6208a05c38b	tools/export-audit/audit-import.mjs
100644 blob 8ab05a681fdab03b37197dddef93439df0ba377b	tools/export-audit/audit-inject.mjs
100644 blob d89396b0cbf7c4b2ea2110acc0a663a23de62760	tools/export-audit/audit-other.mjs
100644 blob 415c470abd4da972228fd1db44701e4871a440a0	tools/export-audit/audit-ppt.mjs
100644 blob 367e26917be96c263dc564a24abb15220317cba0	tools/export-audit/audit-recon.mjs
100644 blob c77133f8c1964873b59dd1ff1282d7fc42d9df91	tools/export-audit/audit-ui.mjs
100644 blob cc5af0beb2dee8222d8d95c380713250654ceff1	tools/export-audit/audit.mjs
100644 blob 0c890eb5ce02d57cea7b2dedb84e008ac86361ec	tools/export-audit/boot-same.mjs
100644 blob 9c4f49ad8cec537097bdf485458cfd2a09b06594	tools/export-audit/boot.mjs
100644 blob aaf6ad78b3e1b41680204769f91aea46879cf89f	tools/export-audit/hostile.mjs
100644 blob 507399207af903e668a603af895b46e24acaab0c	tools/export-audit/legacy-fsrc.mjs
100644 blob 3c6d19a04cfb4004b3645e1a0b4cc6ead67562e7	tools/export-audit/mutate.mjs
100644 blob 2017d8e566a5644723cf4f84f881df7247cf6825	tools/export-audit/shoot.mjs
100644 blob 2a626d890d4d9a8c98bc7d8ac096d9a5d59ac6b4	tools/export-delta.mjs
100644 blob fd27b0f12b9dc1805eabe4bf75ed535049154af0	tools/font-standin.mjs
100644 blob a39c422b80e99597f03da4f8274aca8c5b198674	tools/fydp-frames.mjs
100644 blob 555d844358680f17575870409f72cf77b8d50258	tools/hostile-render.mjs
100644 blob e2940362ccc9179d05aea9f2bd9775c7e11ad1ea	tools/ia-census.mjs
100644 blob 064f1edc667f928dba9990b792b9f7be15d341d6	tools/ia-fixture.mjs
100644 blob b0584dcec6797ad3a7ddb6d9005eb2f788031878	tools/ia-shots.mjs
100644 blob 3eb3b8888b4e703f42fa38e02b52765808b4730c	tools/inspector-agrees.mjs
100644 blob 632b31ac15b2d21654cd518f0848d204a9db61c8	tools/keyboard-reach.mjs
100644 blob 2ee21034c11f2be8fda404fbb49e2caa3ee7afe0	tools/layout-fits.mjs
100644 blob af2c7c675d69421fca99b70965395a0244e283fc	tools/math-defects.mjs
100644 blob 04db18a1fcb5834e2f255b30e8aa12cfa4223070	tools/menu-paths.mjs
100644 blob 237b157b7b6e22ab8483d7d44035f6b41e7d5c9c	tools/money-coverage.mjs
100644 blob 73e1c770fb3239476f172619115c1f05c2ca674f	tools/money-map.json
100644 blob 18cb93aafc9723b92cc89d417b41b221eaf5b8e8	tools/money-map.md
100644 blob 3cc96091cc1a9a524477e0005ead856830fb9f1b	tools/money-map.mjs
100644 blob d074c690e3ba70a3acb65b462e815d4926d694ef	tools/panels-render.mjs
100644 blob 0d9461140c48c358ca677a392ceeedc29eb954cc	tools/roundtrip-fuzz.mjs
100644 blob 4a17dcf11d7973cb2f016aa1e06fa6f20afb3d25	tools/row-controls.json
100644 blob d2bb1938cc6ea1eb10b39cf2b8edd7645a5f8d24	tools/row-controls.mjs
100644 blob 0ace8f03127740c5c7627ff742367b5c4039acad	tools/standards-check.mjs
100644 blob 36682c7e7bcc9154368510df22e650683516ed33	tools/toolbar-fits.mjs
100644 blob a654efb37454a87fb1b24d4b37c59926f4fe7c5c	tools/tpl-parts.sha256
100644 blob cd03d59dc76680caa55cfcd8c940133e686a8576	tools/trace-lib.mjs
100644 blob 3bf5e4124939d6caa5c7e71b2bb1f5322adfe435	tools/trace-matrix.mjs
100644 blob bceddf28f94f64e5dc98084169232f3e5bfbaf01	tools/trace-stated.json
100644 blob ad674b6e9b87c2ac69ebe6d708c83f594b1361c6	tools/validate-math.mjs
100644 blob 3f6defd7cdd38965620f2fc68c4d9b28ad8b3cef	tools/vendor/validate_palette.mjs
100644 blob 4bcecba94bb62862ab24089268cd97635243a9f1	tools/verify-file.mjs

mcount: {"entries": 2015, "once": 2015, "missing": [], "multiple": [], "unparsed": []}
manifest: mutation-manifest-e2d0bc6.tsv
    270 held | first-catch chain
      5 new | audit-import
     16 new | audit-recon
     37 new | audit-ui
    515 reimpl | ?
      3 reimpl | audit-board
     14 reimpl | audit-import
     18 reimpl | audit-recon
bundle: integration-backup/claude-v200-integration-e2d0bc6.bundle
runner: 2bfb59022ec74e1abe36a7cfd6a13ce5aabd9aed
consistency checks: no line printed
