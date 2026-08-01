# Game Design Specification

## Product thesis

Fry Signal is a traffic-routing game with restaurant consequences. The player is the signal lead at Mile 42, a dependable fried-chicken stop where city, farm, freight, and coast roads meet after dark. The fantasy is to turn an unpredictable road into a place people can count on.

The emotional rule is:

> A mistake should bend the route, not end the shift. A great save should light the whole building.

The canonical playable verbs are **read → commit → switch → recover**:

- **Read** an announced traffic wave and its bounded uncertainty.
- **Commit** a safe batch posture and opening topology.
- **Switch** chunky route gates as demand becomes concrete.
- **Recover** a wrong turn or bottleneck at a visible cost.

Batch cooking, ordinary packout, and dispatch are consequences of those decisions. They animate the route and create exceptions; they are not three extra repetitive minigames. Manual pack/send input is reserved for substitutions, mismatches, holds, and recovery.

## Distinct identity

Fry Signal owns simultaneous queue topology, forecast risk, freshness, and visible recovery. It does not inherit Dos Esposas's ingredient transformation, Samurai Sushi's guest-by-guest craft sequence, or The Tender Baron's slow thermal and table-synchronization play.

The recognizable screen is a roadside signal desk: approaching cars, a dominant physical route board, and a dispatch rail. Its signature interaction is the **Light Run**: a one-beat ghost pulse previews a path; committing the switch sends a bag through the route; a clean dispatch answers through the chicken marquee's **BATCH / PACK / GO** lamps.

## First walletless vertical: Midnight Merge

Target one five-to-seven-minute night with:

- three announced waves and short player-controlled replanning windows;
- two lanes, two fryers, hot/cold/drink paths, one automatic packout, one window, and one pull-ahead or loopback route;
- three meal families with overlapping components;
- one focal regular, one teaching crew voice, and background crew silhouettes;
- one announced forecast constraint such as rain diversion or lane paint;
- Loopback Save and one additional bounded recovery;
- a Service Signal debrief, House Book, and one local Shift Postcard.

The broader cast, full menu, bus bay, dessert spur, chain ownership, multiple restaurants, and procedural customers are deferred until the board is replayably fun.

### Suggested rhythm

1. **Read and plan (45s):** inspect three forecast cards, commit an opening batch posture, and set the initial route.
2. **Wave 1 (60–75s):** learn forecast, commitment, switching, and automatic dispatch without a scored failure.
3. **Replan (15–20s):** retire aging stock and adjust one batch or gate.
4. **Wave 2 (75–90s):** an announced topology constraint creates the recovery lesson. It must be either unscored tutorial play or a predictable consequence of the disclosed rules—not a surprise equipment failure.
5. **Replan (15–20s):** choose freshness or volume.
6. **Wave 3 (90–105s):** apply the full loop without forced sabotage.
7. **Final recovery and debrief (60–80s):** finish existing orders, settle truthfully, and choose a next-shift topology side-grade.

No mandatory idle interval may exceed five seconds. Time can pause outside committed action resolution. Slow Shift stretches decision time without changing progression or making the result lesser.

## Traffic and state contract

Every wave is authored, deterministic, and versioned. It declares an arrival range, dominant order shapes, lane bias, forecast confidence, and any topology/event modifier. Exact arrival order may vary only inside those bounds. There is no opaque rubber-banding or unannounced order family.

Recommended phase flow:

`DORMANT → FORECAST → PLAN → WAVE_ACTIVE → REPLAN → WAVE_ACTIVE → REPLAN → WAVE_ACTIVE → FINAL_RECOVERY → SETTLED → DEBRIEF`

Only `SETTLED` produces a completed result. Reload resumes the same seed, content/rules versions, ordered inputs, and state; it never rerolls a poor decision.

Core invariants:

- a route switch affects new trays; in-flight trays keep identity until arrival or explicit recall;
- an order, tray, component, pack, and dispatch are never duplicated or silently deleted;
- batch quantity is conserved across cooking, allocation, holding, retirement, and waste;
- automatic packout occurs only when routed components match; exceptions stop visibly and offer bounded choices;
- a bag can be reopened and corrected without a hidden penalty;
- freshness bands are a game abstraction, never real food-safety advice or permission to serve unsafe food.

## Recovery design

The signature recovery is **Loopback Save**: before a misrouted bag crosses the window, the player can flip a crossover gate and send it through a visible U-turn. It preserves accuracy at the cost of time and freshness.

Additional first-vertical choices may include:

- pull a car into a waiting bay, adding visible wait and coordination cost;
- move a blocked order to a manual rescue spur, temporarily borrowing capacity;
- run a short basket or retire aging stock;
- reopen a mismatch, replace the component, and recheck.

Every recovery has a bounded visible cost and a terminal state. Recovery restores otherwise-lost service credit; it is not a bonus category. For identical demand and final service, intentionally creating a recoverable fault must never improve score, restaurant health, progression, Shift Postcard eligibility, or any later ownership eligibility.

There is no mid-shift game over, scarce-item destruction, sub-second timing gate, or ordinary mistake that mutates an owned asset.

## Results and progression

The first result is **Service Signal**, derived from accuracy, warmth, flow, guest care, and safe crew/equipment condition. Recovery affects the metric it rescued rather than adding farmable points.

The separate **House Book** computes fictional restaurant health:

`sales − ingredients − retired/remade food − make-goods − maintenance − fixed fair staffing = nightly surplus/shortfall`

Fair staffing, breaks, wages, and safe heat limits are fixed house commitments. A profitable but rough or unsafe shift cannot receive the top verdict. Surplus supports the restaurant fiction and visible reinvestment; it is never a player payout.

Progression adds decisions and expression, not percentage boosts: alternate lane topology, walk-up or cold spur, authored road events, menu programs, crew stories, marquee parts, radio layers, and roadside restoration. No streaks, battle pass, daily expiry, public ranking, loot box, raw speed upgrade, or paid pressure relief.

## Accessibility and feedback

Every forecast and critical state uses label, stable position, shape/pattern, and optional sound caption. Color, glow, and motion are supplemental. Essential actions support keyboard, touch, pointer, and select → preview → apply without drag.

Mobile keeps a continuously visible vertical route board and active bottleneck. Secondary forecast, batch, exception, and dispatch details open contextual sheets or an action rail; the game must not become five page hops that hide the network under pressure.

Reduced motion replaces travel and sweeps with a static committed path, discrete state hops, lamp counts, and text. The first shift must remain playable at 320, 390, 768, 1024, and 1440px, at 200% zoom, in grayscale, muted, keyboard-only, touch, and reduced motion, with 44px minimum targets.

## Acceptance gates

1. At least 80% of moderated first-run players describe their job as shaping flow, not cooking faster.
2. At least 60% choose another shift to try a different route, not to claim a reward.
3. No mandatory idle interval exceeds five seconds and no required decision is sub-second.
4. Every material hazard is announced in words and non-color form with enough time to plan.
5. Every bottleneck offers a one-move recovery with a legible, bounded cost.
6. Creating a fault intentionally cannot improve any result or eligibility.
7. The complete shift, debrief, progression, and replay hook work without network, wallet, or token language.
8. With art, story, and tokens stripped away, the gray-box run still proves: **see the wave, commit the batch, throw the switch, save the wrong turn, light the sign.**

## Evidence

- Shared brand boundary: `../../../PLANS/CRYPTO_RESTAURANT_GROUP_BRAND_DIRECTION.md`.
- Product foundation: `../PRODUCT.md`.
- Team convergence and final reconciliation: Buzz events `b3e47e6f53520341d1211f8243a08605ad18d826a1e9f4356fb698a2777746eb`, `19a4cde2d79a2cb2d40c97045aba49c687de5ca6f4e10cb1f2e761bcfdf3871e`, `4f6e36039800f33093cde571878ee7ac9f38d0f63aced2c883e180dc52b74314`, `82a2294fc3b4aca40515af3f0fa20331ac384e1a0483a324d91fdb2cff606b5b`, and `27ca0bd235c7e5af1856e3f57c0dce739d50c482e426ac7546aeeede232da3fb`.
