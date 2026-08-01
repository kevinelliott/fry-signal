# Gate 1 Evidence Kit

This kit supports the moderated protocol in [GATE_1_PLAYTEST_PROTOCOL.md](../GATE_1_PLAYTEST_PROTOCOL.md). It does not automate, simulate, or replace human first-run evidence.

## Before session one

1. Freeze one clean commit and create an annotated Git tag that points to it before session one. The tag message must contain exactly one `planned-valid-sessions:`, `cohort-started-on:`, `recruitment-closes-on:`, `facilitator-code:`, `independent-coder-code:`, `adjudicator-code:`, and `deletion-owner-code:` line with the frozen values. Record the immutable tag object as `git-tag:<40-hex-tag-object-id>` in `predeclarationEvidence`; the validator parses and binds the tag object to the candidate. Publish that object ID in a signed, timestamped Buzz event before session one and record `buzz:<64-hex-event-id>` as `predeclarationAnchor`. The human signers must verify that anchor before accepting the report. Do not move the tag or extend the target or window after seeing results.
2. Run `pnpm install --frozen-lockfile` and `pnpm test:all` on that commit. The full gate builds the production application and runs its browser journeys through `next start`; record the production browser, exact build command, and either the exact GitHub Actions run (`github-actions:<url>`) or a local build-artifact digest (`local-sha256:<64-hex-digest>`). The validator format-checks this build reference; the three human signers must verify the linked evidence before signing the report.
3. Copy [gate1-cohort.template.json](./templates/gate1-cohort.template.json) to `.playtests-private/<cohort-id>.json`. Completed worksheets, recruiter linkage, and raw responses must stay in this ignored, access-restricted local directory or an equivalent encrypted location outside Git.
4. Replace every placeholder. Duplicate the session object until it equals the predeclared number of valid sessions; add withdrawn or technical-abort records without removing valid usability failures.
5. Confirm that the facilitator, independent coder, and disagreement adjudicator are three different people and that neither participant recruitment nor coding uses agents as evidence. Name the facilitator or coder as `deletionOwnerCode`; record a non-sensitive private-store code and limit `rawNotesAccessCodes` to the facilitator and coder.

Use a new browser profile or the visible `Reset local shift` control before every session. Keep the server loopback-only and the game network-free.

## Validate and report

Run:

```bash
pnpm gate1:validate -- .playtests-private/<cohort-id>.json
```

The command verifies the current clean Git checkout and neutral candidate copy against the exact SHA, reads the annotated predeclaration tag, and rejects mixed candidates, duplicate participants, unfixed stopping rules, invalid exclusions, missing independent codes, insufficient input coverage, and prompted replay counted as a pass. It prints an aggregate Markdown report and exits nonzero for invalid input or `HOLD`. External build evidence remains a human-verified reference rather than an automated deployment claim.

Save the reviewed aggregate report under `docs/playtests/reports/YYYY-MM-DD_<cohort-id>.md`. Add consent-safe paraphrases, issue summaries, assist logs, and separately authorized de-identified quotes manually. Never copy raw responses, names, contact details, recruiter linkage, wallet/account data, or private worksheet paths into Git.

Keep the contact-to-study-ID recruiter linkage in a separate recruiter-only encrypted store. Give the independent coder only the de-identified responses and observation fields. After coding is checked, delete raw worksheets and recruiter linkage within 30 days and record the deletion date in the aggregate report.
