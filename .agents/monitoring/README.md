# ORBIT monitoring agents

Four read-only roles review ORBIT independently of the implementation agent. Recurring ChatGPT tasks are configured separately; these files define how to perform each review and do not themselves install a scheduler or GitHub webhook.

## Roles and cadence

| Role | Review scope | Recurring task |
|---|---|---|
| [Money reviewer](money-reviewer.md) | Dollar ownership and independent expected arithmetic | Hourly watch for changed PR heads and main |
| [Data-preservation reviewer](data-preservation-reviewer.md) | Saved work, rollback, recovery and compatibility | Hourly watch for changed PR heads and main |
| [Regression monitor](regression-monitor.md) | Existing checks, mutation applicability and evidence provenance | Daily, approximately 8 AM America/New_York |
| [Environment acceptance reviewer](environment-acceptance-reviewer.md) | Real-platform acceptance evidence and human test steps | Daily watch for release/evidence changes |

An hourly watch polls GitHub; it is not an immediate PR-triggered check or a required merge check. Environment acceptance requires a human operator for actual Windows, shared-folder and native-application testing.

## Shared operating rules

- Read root AGENTS.md and relevant CLAUDE.md sections. Pin the reviewed PR head/main commit and the tested board/tool blobs.
- These roles are advisory and read-only. Never edit product or repository files, commit, push, merge, publish or post GitHub comments/issues. Return the report to the task owner only.
- Use synthetic fixtures in isolated disposable copies. Do not access or modify real budget files or shared folders. Do not use a checkout another agent is editing.
- Reading GitHub through a connector does not guarantee a shell checkout, dependencies or browser access. Mark unavailable checks blocked; never turn inspection or a stand-in test into an execution pass.
- Do not start the long math gate or full mutation sweep unattended. Inventory mutation targets without importing mutate.mjs: loading that module starts the sweep.
- Review all relevant changed PR heads, including further pushes to existing PRs. Record successful reviewed SHAs; an incomplete review does not establish coverage.
- Compare with the last report. Deliver a brief executive completion report every run; detail only material new findings or changed results. Establish a baseline on first use.
- Keep existing known risks distinct from new regressions. A passing gate does not close untested platform, compatibility or concurrent-writer risks.
- Do not make a grand-total-only money assertion: compare expected and actual by the owner and dimension at issue.

## Report format

State the exact reviewed commit and scope first. For each finding include priority, concrete trigger, expected and actual behavior, file/line permalink and a minimal reproduction. State whether the evidence came from a full runtime test, extracted-function fixture, source inspection or an existing artifact.

Summarize checks with command, tested SHA/blob, seed where applicable, exit status and meaningful result. Distinguish passed, failed, not run and blocked. Name material limitations. Never report a mutation as caught merely because its target matches.

## Fix handoff

Monitoring does not authorize implementation. Bring a reproducible finding to Brad; an approved fix is implemented by one editing agent in a separate PR and independently reviewed. These profiles do not change the board, release scope or BUILD.

