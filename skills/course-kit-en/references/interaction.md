# Interaction and motion

Purpose: the interaction types to choose from, how to design an interaction that is fun without being hard, keyboard and touch, and the timing and switch rules for the four kinds of motion. The baseline is in `SKILL.md` sections 3 and 4; each component's structure is in `components.md`. **`kit/README.md` is the API reference**: the code for G6–G10, M1 cards (`.vl-flip`), M2 hotspots, K5 voting, E2 drag-divider and `.vl-pad` in the tables below is in `kit/vl-interact.js`, and G11 live plots are in `kit/vl-plot.js`; both are documented in `kit/README.md` section 7 (互动组件 / interactive components). G1–G5 are only the `.vl-board` shell and control classes, with the stage written per chapter; M1 draw and then-run are not in the kit yet.

## 1. Interaction types

### 1 Teaching interactions

| Interaction | Trigger → feedback | Component | Keyboard |
|---|---|---|---|
| Click a button / chip | Click → colour change + reading + feedback sentence | G1 | native |
| Drag a slider | Drag / arrow keys → live chart updates instantly | G2 | native |
| Segmented switch / toggle | Click → change view, switch an effect | G1 | `aria-pressed` |
| Drag onto axes / drag a point | Drag → drop point, reference circle, reading | G4 | arrow keys (must add) |
| Tap cells | Click → cross out / hit / highlight | G10 | arrow keys move between cells + Enter |
| Take apart / assemble / slots | Click a part, then a slot → consequence for the whole | G5 | click-select |
| Sort / order / pair / judge | Drag or click-select → right/wrong + reason + graded hints | G6 | click-select, ↑↓ |
| Think first / pick first / estimate / sketch a prediction / flip cards / guess then run | Commit first → reveal + the gap | M1 | see M1 |
| Click a hotspot / a layer | Click → highlight + info box changes | M2 | tabindex + Enter |
| Vote on a stance | Click a position → remembered, shown again on the stance cards | K5 | `aria-pressed` |
| Swipe sideways (examples, stances, quiz, timeline) | Tabs / ◀▶ / ←→ / swipe | E1 K5 P1 T5 | ←→ |
| Drag a divider to compare | Drag → uncover the other picture | E2 | `role=slider` |
| Run a simulation | Click → accumulated results + statistics | G3 | buttons |
| Step / slow motion / short clip | ◀▶ / drag the step bar / ▶⏸ | G8 | ←→ |
| Linked formula parts | Hover / focus / click to pin | G9 | `li[tabindex]` |
| Mini-game | Arrow keys / on-screen arrows / custom controls | G7 | `keys` map |
| Answer a quiz | Click-select / drag a card into the answer slot | P1 | click-select + Enter |
| Notes that save themselves | Type → saved | P3 | native |
| Term definitions | Hover / focus / tap | K7 | tabindex |
| Folding, table-of-contents jumps | Click heading / summary / TOC button | N3 N4 P4 | Enter / Space / Esc |

Candidate interactions (edit-and-run code, paint a grid, fill a form to generate, mark a timeline by dragging, colour picker / key mapping / listening / reaction timing) are in `components.md` section 9.

### 2 Companion and fun interactions (all optional modules, see `modules.md`)

| Interaction | Trigger → feedback |
|---|---|
| Click the companion to hear it | Click → one line about the current section |
| Guide dialogue in the text | Static dialogue box |
| Avatar walks along reading progress | Scroll → walks to the current section; shows position only, never triggers a reward |
| Open the collection | Click in the top bar → album / backpack |
| Page transitions, intros | Click a link → transition → navigate; part of the skin's atmosphere, can be turned off or skipped |
| Hover micro-reactions | hover → slight lift or tilt; belongs to the skin |
| Easter eggs on illustrations or the header | Don't add, unless tied to the companion module |

## 2. Interaction design rules

A good interaction has a **clear purpose and is easy to start**. Every rule below serves that.

| # | Rule | How to check | Good / bad example |
|---|---|---|---|
| 1 | Before it appears, one sentence says what question it answers | The board's title *is* the question; a reader who skips the text after it still knows what playing it will settle | Good: bomber diagram — the question is "where should the armour go?" and clicking a part is the answer. Bad: titles like "Lab" or "Simulator" |
| 2 | Few controls; obvious how to play within 3 seconds | By default ≤3 groups of main controls (more and the first glance can't tell what to move); at a glance you see "drag this / click this"; no manual needed; every control can be said to help the reader understand something, and decorative controls are deleted (fog, health bars, timers and easter-egg buttons unrelated to the concept; a health bar that itself represents the loss is fine); the interface itself must not be harder to grasp than the concept | Good: take the house apart — click a piece, remove it. Bad: a row of five or six sliders all live at once; a board that needs fog, a health bar or a 2-D map understood before it can be played, so the interface becomes something to learn first |
| 3 | At key points, predict first, then see | Guess first at the key points (M1 then-run: you can't run until you've picked a prediction); a prediction question must expose a wrong intuition, and is skipped if it only asks for mental arithmetic; "hit the wall, then reveal" is the same kind: let the reader try first and fail (limited attempts, numbers only), then introduce the method, so the method is felt to be needed | Good: simulations that ask for a guess before running; three hand-tried attempts that cannot find it, then the systematic method |
| 4 | Every action has a visible consequence | After each click or drag at least one of the chart, a reading or the feedback sentence changes; the consequence is the *concept's* consequence (the tower falls, the curve bends), not just a colour change; a board starts from the data the text has just worked out: the numbers the reader calculated in the text are the ones the board shows when it opens, so the reader can check it against the hand calculation at once | Good: core-loop ring — click a stage to weaken or remove it and the loop breaks |
| 5 | Undo and restart | Every board has "Start again"; multi-step boards have "undo one step" | — |
| 6 | "Try it" gives an observable goal, checked by JS, with feedback on completion | The goal is a checkable state using only new words the prose has already named; the default state must not already satisfy it; the goal makes the reader discover a conclusion (for example "find a learning rate at which a step raises the loss"), not merely drag a slider to a value | Bad: "have a play" with no completion condition |
| 7 | Output is a picture or a sentence, not a stream of numbers | Keep 1–3 key readings; draw the rest | Bad: a code lab that prints a stream of numbers nobody can interpret |
| 8 | One interaction serves one concept | Deletion test: remove it — what would the reader understand less? If you can't say, delete it; two interactions on the same point get merged (one board, two modes); one object keeps one kind of picture through a chapter, and one small widget is reused (a one-dimensional curve first for the slope, then for stepping, then for the step size), because every new kind of picture makes the reader adapt again; this is "make it solid before building on it" (content-rules.md section 1, item 4) applied to the interface | — |
| 9 | Test understanding, not hand speed or memory | When a mini-game is lost, diagnose the reader's actual mistake; don't decide by reaction speed (unless reaction speed is the concept) | Good: a mini-game debrief that describes meaning instead of reporting numbers |
| 10 | Hard modes go in the advanced drawer | The main-line interaction is the simplest version; extra parameters, free mode and round 2+ go in a P4 side path "Play more", whose summary says "how many rounds, about how many minutes, skippable"; add one new dimension at a time, one before two: versions with several parameters or contour plots go in a drawer or a later section of their own, never mixed into a concept's first appearance | — |
| 11 | The reader runs into the concept themselves, not watches a machine do it | The reader's action is the action in the concept (the reader picks people → creates selection bias themselves); "take the house apart" is a ready pattern: a toggle removes one part and the reader sees what breaks, which shows what the part does | Good: casting a net in the pond — the reader chooses to cast near the bank and so creates the "yellow fish everywhere" bias with their own hands |
| 12 | Multiple choice only in practice questions | In the main text, "pick one" is only for M1 predictions, and each option has its own feedback | — |
| 13 | An interaction is never the only explanation | The text tells readers who don't play what playing would show | A mini-game's text explains what happens in the game |
| 14 | By default ≤5 big interactions per chapter (more tires the reader) | Keep signature interactions for the key moments of core concepts of difficulty ≥ 2 (content-rules.md 1A); at least a stretch of text and a static picture between two big interactions | — |
| 15 | Test with a context-free reader before release | How: see reader review in `content-rules.md` section 8 | — |

**Before designing an interaction, write these three lines** (into the chapter outline's element table, content-rules.md section 4; if you can't, don't build it):
1. The question it answers: ____?
2. The reader's action: drag / click / take apart ____.
3. What the reader will see, and what that shows: ____.

## 3. Keyboard and touch

| Case | Keyboard | Touch |
|---|---|---|
| Anything clickable | A `button` / `a`, or `tabindex=0` + `role=button` + Enter / Space | Targets ≥44×44px, ≥8px between neighbouring targets |
| Focus | `:focus-visible` has a clear outline (the skin styles it; never remove it) | — |
| Pop-ups, panels | Esc closes; focus returns to the trigger; clicking outside closes | Tap outside closes |
| Sideways swiping | ←→ turns; only while the component has focus, never hijacking the page | Swipe >50px turns; only the tab strip scrolls, not the page |
| Dragging | Tab selects the object, arrow keys move it, Shift for big steps, Enter drops | pointer events + `setPointerCapture` + `touch-action:none`; no separate mouse and touch code |
| Sketching a curve (M1 draw) | ↑↓ sets the height of each segment, or replace with a few sliders | Draw with a finger; redraw allowed |
| Sliders | Native range (arrow keys, Home, End) | Thumb ≥28px |
| Mini-games | `keys` map; the stage is focusable and arrow keys don't scroll the page while it has focus | On-screen arrows `.vl-pad` 3×3 |
| Sort / pair | Select a card → click the target ("Put here") | Same; drag-and-drop optional |
| Status announcements | Readings and feedback sentences use `aria-live=polite` | — |
| Beyond colour | Right/wrong, type and state also get ✓ ✗, dashed lines, strike-through or text | — |

Acceptance: `node <skill>/tools/check.mjs <absolute course path> chNN` (step 5 calls `qa.mjs`) clicks every button and drags every slider at 420px and 1100px; then Tab by hand from the top of the page to the bottom — every interaction must let you complete its "Try it". Dragging and sketching a predicted curve are the interactions most likely to miss keyboard support, so test them for real.

## 4. Motion rules

### 1 Four kinds

| Kind | What it is | Duration | Easing | With motion off / reduced | Who writes it |
|---|---|---|---|---|---|
| Aids understanding | The motion itself teaches: collapse, falling balls, step changes, cells lighting up in turn, bars growing | step change ≤350ms; bar growth 200–400ms; collapse ≤600ms; simulations as needed | `--ease` | **Skip the process and show the final state**; switch to manual stepping if needed; no information lost | component / chapter |
| Feedback on actions | Answers the reader's hand: press, switch, reveal, a shake | press 100–150ms; switch and reveal ≤300ms; failure shake 280ms | `--ease`; pixel skins `steps(n)` | Colour / text change only, no movement | component; movement amounts belong to the skin |
| Reading rewards | Celebrating understanding: a stamp, lighting up, adding to the album | ≤1.2s once, no loop | set by skin | Not played, but the state is still recorded | rewards module + skin look |
| Atmosphere | Life outside the text: header clouds, intros, transitions, backgrounds | loops ≥8s period (slow); intros ≤1.2s | set by skin | Still or absent | skin |

**Atmosphere only outside the text** (header, background, margins, transitions). Elements in the text area have no constant animation and no entrance effects other than scroll-reveal.

**Reading rewards only after understanding**: "Try it" completed, quiz all correct, end-of-part review cleared. Never triggered by scroll percentage or time spent (bad: firing confetti at 98.5% scrolled and flew a paper plane after 1.5s on a concept card). Each event plays once.

### 2 Durations and easing

| Motion | Recommended |
|---|---|
| Button hover / press | 100–150ms |
| Fold arrow | ≤200ms; no height animation when showing / hiding content |
| TOC panel opening | ≤250ms |
| Reveal, example switch | ≤300ms (a .42s paper page turn must be cut to 300ms) |
| Failure shake | 280ms, `VL.shake(el)` |
| Hotspot highlight, formula linking | ≤200ms, opacity / outline only |
| 3D card flip | about 400ms (aids understanding, so not bound by 300ms) |
| Rewards (badge, stamp) | ≤1.2s, once (a 2s duel animation is too long) |

`--ease` defaults to `cubic-bezier(.2,.8,.3,1)`; `--dur-fb` defaults to 200ms; pixel skins use `--steps` (`steps(3)`–`steps(6)`) instead of smooth easing. The skin supplies the values as variables (see `skin-contract.md`); components only reference the variables.

### 3 The three-level switch

- The level class sits on `<html>`: `html.vl-fx-full` / `.vl-fx-lite` / `.vl-fx-off` (`kit/vl-head.js` writes it before first paint; `vl.js` updates it when the level changes and fires `vl:fx {level}`).
- **Automatic choice** (the code is in `kit/vl-head.js`): system "reduce motion" or a headless browser → off; width ≤700px or `pointer:coarse` → lite; otherwise full.
- **Manual in the top bar**: the "Display" pop-up offers Motion: Auto / Full / Light / Off. The reader's choice overrides the automatic one and is saved (key `vl-fx`, no course prefix, shared across courses and both languages). When the system asks for reduced motion it is **always off**; manual choices have no effect and the pop-up says why ("Your system asks for reduced motion, so motion stays off.").
- What each level allows:

  | | full | lite | off |
  |---|---|---|---|
  | Aids understanding | plays | plays | shows the final state |
  | Feedback | plays | plays | colour only |
  | Reading rewards | plays | plays (half the particles) | not played, still recorded |
  | Atmosphere | plays | still (intro only, shortened) | absent |
  | Page transitions | plays (≤0.9s) | shortened (≤0.55s) | navigate directly |

- Global fallback:
  ```css
  @media (prefers-reduced-motion: reduce){
    *{animation:none!important;transition:none!important;scroll-behavior:auto!important}
  }
  ```
  The kit's `vl.css` already includes this, plus `html.vl-fx-off *{animation:none!important;transition:none!important}`. JS-driven animation (rAF, Web Animations, particles) is not covered by these rules and must read the level itself: `if (!VL.motion()) { draw the final state; return; }` (`VL.fx()` returns full / lite / off).
- Screenshots and tests: headless browsers default to off; add `?fx=1` to the URL so headless runs pick the normal level (already in the kit); `?scheme=dark|sepia` switches the colour scheme temporarily without saving it (already in the kit); `?freeze=seconds` stops at a given frame (not in the kit yet; the paper and pixel skins support it).

### 4 What belongs to the skin

| Component (skin-independent) | Skin |
|---|---|
| Duration caps, when it triggers, level logic, what shows when off | Easing curves, movement amounts, whether to use `steps()` |
| Failure shake, reveal, switch, bar growth transition, step change | Paper page turn, pixel pop, how a button "presses into the paper" |
| Reward events (`vl:try`, `vl:quiz-perfect`, `vl:answer`, `vl:guess`) | Reward look (stamp, lights, coins) |
| — | Header ambient animation, intros, page transitions, background parallax, scan lines |
| — | Hand-drawn wobble, tilted placement (these are static, not animation) |

Big chapter-specific animations (such as a collapse animation or a juice bench) are written by the chapter, but they must read the level and follow the four kinds above.
