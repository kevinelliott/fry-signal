# Gate 1 Moderated Playtest Protocol

## Purpose and evidence boundary

This protocol determines whether the walletless first vertical has earned Gate 2. It measures whether first-run players understand Fry Signal as a game about shaping flow and voluntarily replay to try a different approach.

A completed worksheet is usability evidence for one exact source commit and fixture version. It is not deployment, production traffic, account, wallet, token, contract, Localnet, Shadownet, Mainnet, or physical-device evidence unless those facts are separately verified and named.

Do not begin Gate 2 breadth or Gate 4 chain work from an informal demo, internal opinion, automated journey, or partial cohort.

## Cohort

- Recruit at least 10 valid first-run participants who have not watched another Fry Signal session and have not read its design documents.
- Use at least four compact/mobile touch sessions, four desktop pointer sessions, and two keyboard-only sessions. A keyboard-only session may also count toward its viewport group. Record actual viewport, device, browser, input method, reduced-motion setting, zoom, and any requested accommodation.
- Do not recruit only crypto players, restaurant-game experts, or members of the implementation team.
- A returning participant may test a repair, but never counts again as first-run evidence.
- Use anonymous study IDs such as `P01`; do not collect names, wallet addresses, account identifiers, or demographic details that are unnecessary to this gate.

## Candidate declaration

Before the first session, freeze and record:

- repository and exact commit SHA;
- clean or dirty worktree state;
- fixture and rules versions shown by the application;
- local production-build command and browser version;
- network-disabled evidence boundary;
- facilitator and independent response coder;
- session dates and the empty worksheet template;
- confirmation that the candidate does not tell players to replay for a route, gate, batch, score, reward, or other scored motive.

Every participant must use the same declared candidate. If source, fixture, rules, or outcome-affecting configuration changes, close the cohort and start a new one.

## Facilitation rules

Before opening the game, ask: “May I take anonymous notes about what happens and what you say during this session?” If the participant declines, thank them, collect nothing, and recruit a replacement.

Use the same neutral introduction:

> This is an unfinished game test, not a test of you. Please play as you normally would and say aloud what you notice or expect. I may help if the interface prevents you from continuing, but I will not tell you which strategy to choose. You can pause or stop at any time.

Then:

1. Open a fresh local state with no saved shift.
2. Give the player control without explaining forecast meaning, the Rain Detour answer, scoring, recovery, profit, replay, or crypto.
3. If the player asks what to do, reply once: “Use the information and controls on the desk to run the shift in the way that makes sense to you.”
4. After 90 seconds without progress, offer only: “You may use any visible control, and you may pause.” Record the exact assist and tick. Never name Gate B, the safe route, the desired strategy, or a test target.
5. Let natural mistakes resolve through the visible recovery system. Do not manufacture a mistake during the scored first run.
6. When the House Book appears, remain silent for 30 seconds and record whether the player independently starts another shift.
7. After the silent replay window—or when the player cannot continue—ask the scored core-job prompt.

Do not praise or correct an answer before both scored prompts are complete.

## Scored prompts

### Voluntary route replay

Do not announce a replay choice. During the 30-second silent window, record whether the player independently activates `Run Midnight Merge again`.

If the player starts another shift, ask:

> What were you hoping to do in this next run?

This measure passes only when the player independently starts another shift and names a path, gate, crossover, switch timing, or recovery-route experiment. A batch-posture-only answer does not pass the existing different-route target. Replaying to claim a reward, increase a number, obey the interface or facilitator, or repeat the same actions does not pass.

If the player does not start another shift during the silent window, record a replay failure. After all scored responses are recorded, “What, if anything, would you do next?” may provide diagnostic context, but any replay after that prompt cannot enter the numerator.

### Core-job understanding

Ask:

> In your own words, what was your job in this game?

Record the response verbatim without follow-up first. Afterward, a neutral clarification such as “What made you think that?” may be recorded but cannot replace the first response.

The response passes when its primary idea is anticipating demand and shaping movement through batches, gates, routes, or recovery. It fails when the primary idea is only cooking faster, clicking on time, maximizing money, earning a token/reward, or following unexplained instructions.

The facilitator and an independent coder score the de-identified first response separately. Resolve disagreements by the written rule, retain both original codes, and report the disagreement count.

## Observation rubric

Record, but do not turn into hidden engagement scoring:

| Field | Allowed values |
|---|---|
| Completion | settled; stopped by participant; blocked by usability; technical abort; consent withdrawn |
| Rain decision | anticipated Pack B; missed then recovered; missed and remained blocked; not reached |
| Route explanation | accurate; partial; incorrect; not offered |
| Assistance | none; mechanical; strategic protocol violation |
| Core-job code | pass; fail; withdrawn |
| Replay behavior | unprompted route experiment; other replay; prompted replay; stopped; not offered due withdrawal |
| Critical issue | none; route truth; terminal recovery; accessibility; trust/economy; data loss; other |

Also capture concise notes for the first point of confusion, whether warning meaning was available without color, whether the board remained visible, and whether any mandatory idle period exceeded five seconds.

## Abort, withdrawal, and accessibility handling

- A participant may withdraw at any time. Delete that session's notes and exclude it from the denominator.
- A crash, corrupted fixture, wrong build, or facilitator protocol violation is a technical abort. Log it separately, exclude it, repair the setup, and recruit a replacement.
- A participant who cannot finish because the interface, copy, input, motion, contrast, zoom, or layout blocks them remains in the denominator if they consent to retaining the observation. Count the scored measures as failures and open an accessibility/usability blocker.
- Provide requested input, zoom, text, motion, audio, break, or pacing accommodations. Record the accommodation; never treat it as assistance.
- Stop immediately if a route or recovery can become permanently unfinishable, local progress corrupts, or the interface makes a false wallet/token/earnings claim. Mark the cohort `HOLD` until repaired.
- If the scored candidate primes a route-related replay motive in its outcome copy, stop and replace the candidate; do not reinterpret that replay as voluntary evidence.

## Gate calculation

Use all valid, consented first-run sessions as the denominator `n`, including sessions blocked by usability or accessibility.

- Core-job threshold: at least `ceil(0.80 × n)` passes.
- Route-replay threshold: at least `ceil(0.60 × n)` passes.
- For the minimum `n = 10`, this means at least 8 core-job passes and at least 6 route-replay passes.

Gate 1 passes only when both thresholds are met and there is no unresolved critical route-truth, terminal-recovery, accessibility, trust/economy, or data-loss issue. Do not average the two percentages, round down, exclude inconvenient sessions, or combine cohorts from different commits.

For the current first vertical, a route experiment may compare the disclosed clean Gate B path with the visible bounded recovery path, or test different switch timing. Repeating the only safe path or changing only batch posture does not pass. If the build cannot elicit the route-replay threshold under that rule, keep Gate 1 on hold and design another meaningful Gate 1 route choice; do not weaken the target or begin Gate 2 breadth.

If the gate holds, fix the smallest evidenced issue and run a new cohort of first-run participants on one new exact candidate. Keep the failed result in the evidence record.

## Evidence artifact

Create one dated report under `docs/playtests/` using this structure:

```text
Candidate SHA:
Fixture/rules version:
Worktree state:
Production-build evidence:
Network boundary:
Cohort dates:
Valid n / withdrawals / technical aborts:
Desktop-width / compact-width:
Core-job passes and percentage:
Route-replay passes and percentage:
Coder disagreements:
Critical issues:
Disposition: PASS or HOLD
```

Append the de-identified observation table, exact scored responses, assist log, issue list, and calculation. Link source/build/test evidence rather than restating it as usability proof.

Do not record audio, video, screen capture, keystrokes, analytics, account data, or wallet data for this gate. Keep de-identified raw worksheets only until the result and issue coding are independently checked, then delete them within 30 days. Retain the aggregate report and consent-safe de-identified quotes in the repository.

## After a pass

A Gate 1 pass authorizes product planning for Gate 2 breadth; it does not automatically authorize every Gate 2 feature. It does not authorize shared persistence, accounts, analytics, wallets, contracts, tokens, cross-title assets, Localnet, Shadownet, Mainnet, or deployment. Those remain separate decisions and evidence gates in [DELIVERY_PLAN.md](./DELIVERY_PLAN.md).
