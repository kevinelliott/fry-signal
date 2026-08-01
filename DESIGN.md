---
name: Fry Signal
description: A worn Mile 42 roadside signal desk where the route is the game.
colors:
  asphalt: "#11161a"
  night-road: "#20272b"
  night-road-soft: "#2f383d"
  fryer-paper: "#f4e2be"
  paper-dim: "#d6c19b"
  marquee-yellow: "#f2c94c"
  pepper-red: "#a93a27"
  pickle-green: "#496b36"
  soda-blue: "#27647c"
  taillight-rose: "#c64c5d"
  steel: "#7c8790"
  steel-dark: "#3c474d"
  ink: "#16191d"
  cream-text: "#fff2d1"
  focus: "#91d8ff"
typography:
  display:
    fontFamily: "Big Shoulders Variable, Arial Narrow, sans-serif"
    fontSize: "clamp(2.2rem, 3.7vw, 4.25rem)"
    fontWeight: 700
    lineHeight: 0.72
    letterSpacing: "-0.025em"
    fontVariation: "\"opsz\" 72"
  headline:
    fontFamily: "Big Shoulders Variable, Arial Narrow, sans-serif"
    fontSize: "1.1rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "0.035em"
    fontVariation: "\"opsz\" 72"
  title:
    fontFamily: "Big Shoulders Variable, Arial Narrow, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "0.035em"
    fontVariation: "\"opsz\" 72"
  body:
    fontFamily: "Atkinson Hyperlegible Next Variable, Atkinson Hyperlegible Next, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "normal"
  label:
    fontFamily: "Atkinson Hyperlegible Next Variable, Atkinson Hyperlegible Next, sans-serif"
    fontSize: "0.67rem"
    fontWeight: 800
    lineHeight: 1.35
    letterSpacing: "0.06em"
  readout:
    fontFamily: "Atkinson Hyperlegible Next Variable, Atkinson Hyperlegible Next, sans-serif"
    fontSize: "1.45rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "normal"
    fontFeature: "tabular-nums"
rounded:
  ticket: "2px"
  badge: "3px"
  control: "4px"
  panel: "5px"
  shell: "8px"
  lamp: "50%"
spacing:
  xxs: "4px"
  xs: "6px"
  sm: "8px"
  md: "10px"
  lg: "14px"
  xl: "18px"
components:
  wave-ticket:
    backgroundColor: "#e5d0a6"
    textColor: "{colors.ink}"
    rounded: "{rounded.ticket}"
    padding: "14px 12px 12px 52px"
  wave-ticket-active:
    backgroundColor: "#e5d0a6"
    textColor: "{colors.ink}"
    rounded: "{rounded.ticket}"
    padding: "14px 12px 12px 52px"
  route-gate:
    backgroundColor: "#4c4840"
    textColor: "{colors.cream-text}"
    rounded: "{rounded.control}"
    width: "86px"
    height: "74px"
  route-gate-selected:
    backgroundColor: "#67583b"
    textColor: "{colors.cream-text}"
    rounded: "{rounded.control}"
    width: "86px"
    height: "74px"
  recovery-action-green:
    backgroundColor: "{colors.pickle-green}"
    textColor: "{colors.cream-text}"
    rounded: "{rounded.control}"
    padding: "8px"
    height: "64px"
  recovery-action-blue:
    backgroundColor: "{colors.soda-blue}"
    textColor: "{colors.cream-text}"
    rounded: "{rounded.control}"
    padding: "8px"
    height: "64px"
  batch-commit:
    backgroundColor: "{colors.marquee-yellow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "58px"
  shift-progress-action:
    backgroundColor: "#caa62f"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
    height: "48px"
  shift-reset:
    backgroundColor: "#d8c194"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
    height: "48px"
  house-book:
    backgroundColor: "#dcc69a"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "16px"
---

# Design System: Fry Signal

## Overview

**Creative North Star: "The Roadside Signal Desk"**

Fry Signal is a cheerful 1960s drive-through control room rebuilt as a late-night electromechanical routing instrument. The interface is one bolted machine: dark steel casing, fryer-paper tickets, enamel plates, lamps, switches, rails, and compact operator labels all belong to the same physical object. It must feel handled and dependable, not nostalgic for its own sake.

The route is the game. A forecast sits at the left edge, the continuous side-on track network owns the center, and an exception rail occupies the right. BATCH / PACK / GO is the fixed marquee grammar above that instrument. Operational state is communicated with position, route geometry, shape, label, lamp count, and motion together; color adds character but never carries meaning alone.

The raster materials are authored finish layers, while all words, controls, icons, paths, bags, vehicles, and order marks remain semantic HTML, CSS, or SVG. The six shipped materials have fixed roles: `riveted-steel.webp` frames the shell, dark panels, and shift-progress row; `aged-ticket-paper.webp` skins forecasts, bags, the exception rail, commit drawer, reset control, service summaries, and House Book; `marquee-enamel.webp` gives painted signs, state plates, recovery actions, and deterministic progress their worn coating; `indicator-lamp.webp` supplies lamp glass and hardware; `dimensional-track.webp` forms the rail fill; and `route-switch.webp` makes gates read as physical levers.

**Key Characteristics:**

- One monolithic instrument rather than a collection of floating dashboard cards.
- Worn steel, aged paper, painted enamel, inset rails, visible fasteners, and restrained grime.
- A dominant route topology with forecast and exception context held at its edges.
- Condensed roadside display type paired with highly legible operator text.
- Shape-plus-label signals, crisp vehicle silhouettes, fixed marquee stages, and explicit costs.
- Tactile state changes with bounded motion and complete reduced-motion equivalents.
- Deterministic local progress, versioned save truth, and a settlement-only House Book.

## Colors

The palette combines midnight road neutrals and warm paper with a small set of faded roadside-sign accents.

### Primary

- **Marquee Yellow:** the active signal, primary commit action, selected-route outline, decision timer, and scarce attention color.
- **Pepper Red:** the Fry Signal wordmark, ticket tabs, fryer source, bag/order identity, and warm alert marks.

### Secondary

- **Pickle Green:** loopback recovery, resolved state, positive service condition, and the Mile 42 badge.
- **Soda Blue:** Rescue Spur, route/readout arrows, accuracy, cold/drink context, and cool informational surfaces.
- **Taillight Rose:** a defined reserve token not yet assigned to a live component; keep it for future taillight-energy or related road cues.

### Neutral

- **Asphalt:** page field, inset wells, and the deepest control surfaces.
- **Night Road:** dark panel bodies and intermediate structural layers. **Night Road Soft** is defined but not yet assigned to a live component.
- **Steel / Steel Dark:** framing, headers, hardware, dividers, and disabled machinery.
- **Fryer Paper / Paper Dim:** primary light surface and subdued copy on dark panels.
- **Ink / Cream Text:** the reciprocal dark-on-paper and light-on-steel text pair.
- **Focus Blue:** keyboard focus only; it stays visibly distinct from ordinary soda-blue state.

**The Scarce Lamp Rule.** Marquee yellow marks the current decision or active stage; it is not a generic decoration or background wash.

**The Redundant Signal Rule.** Every status color must travel with a stable label, shape, position, pattern, or route change.

## Typography

**Display Font:** Big Shoulders Variable (with Arial Narrow and sans-serif fallbacks)
**Body Font:** Atkinson Hyperlegible Next Variable (with Atkinson Hyperlegible Next and sans-serif fallbacks)

**Character:** Big Shoulders gives the instrument its compressed highway-sign authority. Atkinson Hyperlegible Next keeps dense operational copy, costs, timing, and recovery consequences readable at small sizes. Both are locally packaged font dependencies imported in the root layout, so the interface does not depend on a remote font request.

### Hierarchy

- **Display** (700, fluid 2.2rem–4.25rem, 0.72 line-height): the Fry Signal wordmark only; tightly stacked and uppercase.
- **Headline** (700, 1.1rem, 0.035em tracking): panel titles, drawer headings, marquee labels, and the service rule.
- **Title** (700, 1.15rem, 0.035em tracking): forecast ticket titles and similarly emphatic operator labels.
- **Body** (400, 1rem, 1.35 line-height): default readable copy and accessible control text.
- **Label** (800, 0.67rem, 0.06em tracking): uppercase stamps, costs, statuses, timing labels, and compact instructions.
- **Readout** (700, 1.45rem, tabular numerals): countdowns and instrument-like numeric state.

**The Two-Voice Rule.** Big Shoulders names the machine and its stations; Atkinson explains what is happening and what an action costs.

**The Operator Copy Rule.** Small text may be compact, but never vague: action, consequence, duration, and status remain explicit.

## Layout

The shell is a single framed instrument, capped at 1880px and inset from the viewport. Desktop uses the approved asymmetric composition: forecast / route board / exception rail at approximately 20 / 56 / 24, with 6px seams and a route network that remains at least 510px tall. The masthead mirrors that hierarchy with wordmark, fixed three-stage marquee, and shift controls. Batch posture, deterministic shift progress, service condition, and the settlement-only House Book remain attached below the playfield rather than floating as separate widgets.

At 1180px and below, the playfield becomes a 25 / 75 forecast-and-board grid. The exception rail becomes a fixed bottom-right sheet no wider than 380px and no taller than 54svh; the commit drawer, shift progress, service strip, and House Book reserve a 402px right margin so they do not hide beneath it. The House Book collapses from its three-part desktop row to a single column.

At 820px and below, the forecast panel collapses into a next-wave summary and an explicit three-wave drawer, while the route board stays continuously visible. The masthead becomes two rows, the exception rail anchors across the safe-area-aware bottom edge, whatever recovery actions the current offer contains sit side by side, the commit and shift-progress panels stack, the desktop service strip becomes a compact 2 × 2 service summary, and the House Book becomes a one-column receipt with a 110px service-signal block. At 480px and below, the spark and Mile 42 badge yield to the wordmark, the route sources, gates, bags, and windows compact, progress buttons grow to 52px, and the exception sheet removes redundant detail. The page holds a 320px minimum and uses bottom padding plus `env(safe-area-inset-bottom)` so the anchored rail never covers required controls.

**The Continuous Board Rule.** Responsive adaptation may compress context into drawers or sheets, but it never replaces the route board with hidden task pages.

**The No-Drag Rule.** Every essential route choice is a button reachable by keyboard, touch, or pointer; route operation never depends on dragging.

## Elevation & Depth

Depth is structural, not glossy. Inset highlights, dark recesses, hard 2–5px borders, fastener details, short downward control shadows, and broad low-opacity shell shadows make the screen read as layered metal and mounted plates. Materials are blended with `multiply`, `soft-light`, or `screen` to preserve the authored colors beneath them; glassmorphism and translucent floating cards do not belong.

### Shadow Vocabulary

- **Instrument shell** (`inset 0 0 0 2px #697278, inset 0 0 48px rgb(0 0 0 / 72%), 0 16px 34px rgb(0 0 0 / 60%)`): the outer machine frame.
- **Mounted panel** (`inset 0 0 0 1px rgb(255 255 255 / 13%), 0 8px 14px rgb(0 0 0 / 46%)`): masthead, major panels, commit drawer, and service strip.
- **Physical control** (`inset 0 0 0 1px rgb(255 255 255 / 16%), 0 4px 0 rgb(0 0 0 / 38%)`): buttons that should feel depressible.
- **Active gate** (`inset 0 0 0 1px #b99645, 0 0 13px rgb(242 201 76 / 42%), 0 7px 11px rgb(0 0 0 / 58%)`): selected physical switch only.
- **Lit lamp** (`inset 0 0 14px rgb(255 244 188 / 42%), 0 0 19px rgb(255 183 57 / 55%)`): an energized marquee stage.

**The Mounted-Plate Rule.** Elevation expresses how a piece is fastened to the instrument; nothing floats without a mechanical reason.

## Shapes

The form language is compact and machined. Major panels use nearly square 5px corners, physical controls use 4px corners, tags use 3px corners, and paper tickets use 2px corners. The outer shell alone softens to 8px. Circular forms are reserved for lamps, indicator dots, fasteners, wheels, and circle order markers.

Directional silhouettes do semantic work: the wordmark and wave-number tabs use clipped arrow/notch geometry, meters use chevron-ended segments, tracks bend with square caps and rounded joins, and bags, vehicles, windows, and switches retain recognizable physical shapes. Four-pixel-scale notches and crisp-edged SVG silhouettes are preferable to generic rounded pills.

**The Hardware Radius Rule.** Keep corners tight enough to read as enamel plate, ticket, or chassis; large soft card radii break the instrument illusion.

## Components

### Instrument Frame and Panel

- **Structure:** one outer riveted shell containing attached header, playfield, commit, and service modules.
- **Surface:** steel texture with multiplied dark color, 2–5px structural borders, inset highlights, and visible fastener pseudo-elements.
- **Header:** a steel title plate always carries condensed uppercase typography and may pair with one compact stamped status.

### BATCH / PACK / GO Marquee

- **Structure:** three fixed equal stages; each stage combines a circular lamp, a distinct line icon, and an uppercase label.
- **State:** lit stages retain all three cues and add glow; hue differences between stages are decorative reinforcement only.
- **Motion:** stage progression moves from initial batch readiness to committed pack state to live-arrival go state; it never becomes a generic progress bar.

### Forecast Ticket

- **Shape:** a 2px paper ticket with a clipped numbered tab and strong inset active outline.
- **Content:** wave name, ETA, vehicle range, meal mix, shape markers, countable vehicle silhouettes, and a cue stay grouped as one read action.
- **States:** hover brightens the paper; active uses a marquee-yellow inset outline; `aria-pressed` exposes selection.

### Route Board

- **Structure:** four source plates feed one continuous responsive SVG track map, two physical gate buttons, traveling order bags, recovery features, and two labeled windows.
- **Signal:** the pale dashed ghost route previews consequence; a committed path becomes a yellow Light Run. The text readout repeats route, destination, and cost in an `aria-live` region.
- **Gate:** an 86 × 74px switch uses the authored lever material, a hard frame, explicit name, selected outline/glow, and `aria-pressed`; disabled gates remain visible.
- **Route features:** the Loopback plate states its live reducer term as `+5 ticks · −3 freshness`; Rescue Spur remains a named physical destination. Never revert the Loopback label to seconds or warmth.

### Exception Rail and Recovery Actions

- **Structure:** one latest exception with vehicle/order identity, reducer-derived cause, segmented freshness/time cost, and an empty state when the line is clear.
- **Dynamic offer:** render `RecoveryOffer.actions` in order and match each action to its entry in `RecoveryOffer.costs`. The available labels are Loopback Save, Pull Forward, and Short Batch, but no cause is assumed to expose all three or a universal fixed pair.
- **Terms:** every offered button carries its reducer-derived help, time ticks, freshness loss, and ledger cost. Route-blocked and waiting-component causes can expose different actions and costs.
- **State:** an offered recovery reads “Choice open”; applying one preserves the resolved action and costs, disables the fieldset, and changes the stamp to “Resolved.”
- **Responsive behavior:** a right rail on desktop, anchored sheet on tablet/mobile; routine HOLD/LOOP/SEND controls never repeat on every order.

**The Reducer Terms Rule.** Recovery names, availability, and costs come from the current `RecoveryOffer`; never hard-code a universal pair or stale consequence copy in the interface.

### Batch Posture and Commit

- **Posture buttons:** paired light-paper options with 2px borders; the selected option gains a cool enamel field and soda-blue border.
- **Commit:** marquee-yellow, 58px tall, uppercase, and paired with the batch icon; committed state turns pickle green and remains truthful about completion.

### Service Strip

- **Structure:** a yellow “Service cares first” plate leads warmth, accuracy, flow, and crew condition in that order.
- **Live signal:** before settlement, each condition combines a geometric symbol, label, causal detail, and reducer state: recovered-order count, automatic dispatch count, open recovery count, and fixed protected-shift care.
- **Settled signal:** once `shift.result` exists, the same four positions show numeric warmth, accuracy, flow, and care from the settled reducer result. On mobile they remain a 2 × 2 paper summary.

### Local Shift Progress

- **Structure:** a riveted-steel 72px instrument row with current tick, fixture duration, reducer phase, one marquee-enamel progress action, a paper reset action, and a live local-save status.
- **Progress action:** its label advances through the next deterministic arrival, closes service to the fixture duration, then settles the shift and opens the House Book. It disables while the snapshot is restoring, the shift is paused or settled, an offer needs care, the forecast has not been read, or the opening batch is absent.
- **Save / resume:** on mount, the UI restores a serialized local snapshot keyed by fixture id, fixture version, and rules version. A valid restored state resumes automatically; an invalid snapshot is removed and replaced by a clean initial shift. After restore completes, every reducer state change is serialized back to local storage.
- **Reset:** “Reset local shift” removes the versioned snapshot, reinstates the initial reducer state, returns the forecast to wave one and posture to steady, and closes the mobile drawer.

**The Local Truth Rule.** State text distinguishes “Restoring local shift…” from “Saved locally” and displays both fixture and rules versions; local persistence is never described as account, server, or chain authority.

### House Book

- **Appearance:** settlement mounts a 4px framed aged-paper receipt below service condition. The heading names the reducer-derived health state; a marquee-yellow signal block carries the numeric Service Signal and dispatched / total order count.
- **Ledger:** a tabular definition list shows ticket sales, ingredients, recovery care, retired food, protected shift, and restaurant health margin from the settled ledger.
- **Behavior:** it does not render before `shift.result` exists. Settlement retires remaining inventory, freezes the shift, disables gameplay controls, and makes the Service Strip consume the same final result.
- **Truth:** margin is restaurant health, not a transferable reward; settlement presents service and care before economics.

**The Settlement Receipt Rule.** The House Book reports one immutable reducer result after the final recovery window; it never forecasts, animates, or implies external ownership.

### Motion and State Change

- **Ghost pulse:** a 1.1s linear repeating dash movement previews the selected route.
- **Light Run:** a single 0.55s `cubic-bezier(0.2, 0.8, 0.2, 1)` dash sweep confirms commitment.
- **Traveling bag:** a single 0.5s thunk moves the order 20px into its new state and settles without perpetual motion.
- **Reduced motion:** all transitions collapse to 0.001ms and one iteration; the route uses a static dash pattern and the bag lands directly in its final translated position.

### Accessibility Behavior

- **Focus:** interactive elements use a 3px Focus Blue outline with 3px offset.
- **Semantics:** landmarks, labelled groups, fieldsets, definition lists, `aria-pressed`, `aria-expanded`, `aria-controls`, disabled state, polite live route updates, and the local-save `role="status"` expose the instrument without relying on its appearance.
- **Targets:** primary controls are 48–74px tall and progress controls become 52px on compact mobile; essential state remains present at 320px, 200% zoom, keyboard-only, touch, and pointer use.
- **Forced colors:** routes become `CanvasText`, state fills become `CanvasText`, and controls receive a 2px `ButtonText` border.

## Do's and Don'ts

### Do:

- **Do** make every new surface look mounted into the same Mile 42 instrument through steel framing, paper or enamel plates, hard borders, and purposeful depth.
- **Do** keep the route topology primary and express decisions through named gates, visible paths, destinations, and explicit costs.
- **Do** pair color with shape, pattern, position, count, icon, and accessible text.
- **Do** use Big Shoulders for station-like display roles and Atkinson Hyperlegible Next for operational meaning.
- **Do** preserve the responsive forecast drawer, continuous route board, anchored exception sheet, safe-area clearance, reduced motion, and forced-colors behavior.
- **Do** render progress, recovery terms, service condition, and House Book values from the reducer state that owns them.
- **Do** keep local restore, saved, reset, final-recovery, and settled states explicit in control copy.

### Don't:

- **Don't** break the interface into generic floating dashboard cards, soft pills, glass panels, or interchangeable SaaS controls.
- **Don't** turn ordinary batching, packing, or dispatch into repeated minigames or repeat HOLD / LOOP / SEND controls on every bag.
- **Don't** present recovery as a score bonus, hide its cost, or use money-first status in the live service HUD.
- **Don't** assume every recovery is Loopback Save plus Pull Forward; render the current offer's action and cost arrays.
- **Don't** show the House Book before settlement or imply that its margin is transferable, remote, or chain-authoritative.
- **Don't** represent crew as capacity counters, collectible upgrades, or disposable production units.
- **Don't** use a mascot panel in the live HUD or let raster assets carry required text or state.
- **Don't** hide the route board on mobile or require drag, animation, or color perception to operate it.
