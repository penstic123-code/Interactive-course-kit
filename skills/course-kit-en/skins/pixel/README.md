# Skin pixel: handheld pixel

Purpose: this skin's style, variables, illustration style and what it suits. Source: the style and pixel illustration library of the AI course's first part (the handheld world). Status: in the library (approval page `gallery.html`); sample chapter in `examples/pixel-binary-search/`. This is the English translation of the Chinese README, which remains the source of truth.

**In one line**: the whole page is a handheld console, with the body text on a light green LCD screen. Four greens plus one magenta A button, notched pixel frames, whole-pixel hard shadows and stepped motion; illustrations are 2px-grid pixel people.

## Files

| File | Contents |
|---|---|
| `skin.css` | Variables (three colour schemes + five part colours) + component looks + the console shell + level-select styles for the contents page + intro styles |
| `skin.js` | `window.VL_SKIN` (VT323 web font, illustration palette); the pixel drawing kit (attached to `VL.illus.kit`); the READY! level intro and header animation pause |
| `interact.css` `modules.css` `diagrams.css` | Looks for the interactive components, optional modules and the later seven diagrams (square corners, whole-pixel shadows) |
| `img/gb-dpad.svg` `img/gb-ab.svg` | The D-pad and A/B buttons on the console body (on both sides at wide widths; drawn for the AI course) |
| `fonts/fusion-pixel-12px-zh_hans.woff2` | Fusion Pixel 12px proportional, v2026.10.16, full Simplified Chinese set (about 0.9MB), local |
| `fonts/OFL.txt` `fonts/LICENSES/` | Font licences (SIL OFL 1.1; including the licences of its upstreams Ark Pixel, Cubic 11 and Galmuri) |

## What courses it suits

- Suits: computing, programming, algorithms and gamified courses; middle school to adult; the opening part of a course whose chapters feel like "levels".
- Doesn't suit: serious history, medicine, humanities fieldwork; courses based mainly on real photos; courses needing lots of fine illustration (pixel people have limited expression and detail).

## Fonts

| Variable | Used for | Font |
|---|---|---|
| `--font-display` | **only** h1, chapter badge, big chapter-number corner mark, intro title | Fusion Pixel 12px (local) → system sans-serif. Keep sizes at integer multiples of 12 (36 / 24 / 96) |
| `--font-body` = `--font-label` = `--font-hand` | body text, subheadings, buttons, labels, text in figures | PingFang / Microsoft YaHei / Noto Sans SC (system sans-serif, clear) |
| `--font-mono` | numeric readouts, code, reading time, counters | VT323 (Google Fonts web font, OFL) → Consolas |
| English pages | body Segoe UI or similar sans-serif | |

## Variables

| Group | Light | Dark | Sepia |
|---|---|---|---|
| `--ink` `--ink2` `--muted` | #122412 / #2b3f25 / #3a4d33 | #dcebb4 / #c3d69a / #b3c78c | #2a2614 / #433c22 / #4f472c |
| `--page` (console body) `--panel` (LCD) `--edge` `--sunk` | part body colour / #eef3d4 / #f7faea / #e3ebc4 | #1d2024 / #162416 / #1f321f / #122012 | #cfc3a8 / #f3ead0 / #f9f3df / #ebe0c0 |
| `--accent` (light, for fills) `--accent2` (dark, for fills with `--on2` text) `--deep` (for text) | part light colour / part dark colour / part dark colour darkened | light colour blended into dark / part light colour (with dark text) / part light colour | desaturated |
| `--focus` | #9b2257 magenta dashed | #ff7fb5 | #9b2257 |
| `--plate` `--plate-ink` | #f5f8e3 / #0f380f | same as light | #fbf6e4 / #0f380f |
| Constants | four greens `--gb0…gb3` #0f380f #306230 #8bac0f #9bbc0f; A button `--gbA` #9b2257 | | |
| Shape | `--stroke` 3px, `--radius` 0, `--px-f` / `--px-f3` (a notched outline made of four whole-pixel shadows), `--shadow-obj` 8px 8px 0 | | |
| Motion | `--ease: steps(4)`, `--steps: 4`, `--dur-fb` .2s | | |

Part colours: `--p1…p5`, each with a (light) / b (dark) / s (console body): lime, mint, amber, berry pink, grey-blue; the light colour's hue varies ±18° within a part (`--vl-dh`). The LCD dot pattern rotates by `data-pat`: fine grid / dots / horizontal scan lines / coarse grid.

## Contrast (measured by script, minimum across the three schemes)

| Item | Light | Dark | Sepia |
|---|---|---|---|
| Body / secondary / notes (on panel, edge, sunk, Try-it ground) | ≥9.15 / — / ≥7.35 | ≥8.28 / — / ≥7.08 | ≥8.33 / — / ≥7.00 |
| Selected state (light text on dark green / dark text on the part's light colour in dark) | 6.39 | ≥10.1 | — |
| White text on the A button / disabled button | 7.61 / 5.05 | same | same |
| `--on2` text on the part's dark colour (chapter number, section number, small tags) | ≥6.56 | ≥10.1 | ≥7.26 |
| Text in figures plate-ink / captions | 12.19 / 10.36 | same | same |
| `--q1…q6` on panel / plate | ≥4.75 | — | ≥4.75 |
| `--focus` on page / panel (≥3 required) | ≥4.28 | ≥6.9 | ≥4.36 |

## What is heavy and what is light

| Heavy (notched pixel frame + whole-pixel shadow) | Medium (3px square frame) | Light |
|---|---|---|
| Interaction boards (with an extra inner frame in the part colour, a screen inside the screen), numbered figures and concept diagrams, concept cards (12px block of the part colour on the left), quiz cards, A-button buttons, pager | Example cards, misconceptions, two-column comparison, document props, flip cards | Why-it-works box (a column of pixel vertical rules + small tag), side paths / invention stories (dashed save slot, solid when open), key points (dashed), guess-then-reveal (dashed) |

## Illustration style (the pixel drawing kit in skin.js)

- The interface follows section 3 of `references/skin-contract.md`: `person / hands / holding / feetY / ground / item / bubble / T / arrow / eye / C / reset`, plus `R F L sprite icon chair desk ICONS`.
- **Geometry matches the kit's stick figures**: x,y = head centre, feet = y + 64·s, `ground()` defaults to 126. Illustration coordinates written for notebook work unchanged (the pictures on the approval page are notebook's own, with no coordinate changes).
- People: block head + cylinder body + outlined arms + trousers and shoes. Within one picture the k-th person changes outfit in turn: short hair → baseball cap → long hair → beanie → top hat, and clothing colours rotate too. Sitting comes with a stool whose legs reach the ground; `look:-1` mirrors the whole person (facial features not flipped); `glasses` draw a thin frame with the eyes inside it.
- `holding()` draws the object first, then presses the two hands on either side of it. Objects are book box cup phone die star coin, plus pixel icons such as robot doc bulb cat dog.
- Speech bubbles are pixel-outlined boxes with a stepped, narrowing tail, the tip aimed at the speaker. The tail is drawn from outside the box and never covers text inside it. A tip below or above the box comes out of the bottom or top edge; a tip at the left or right (the speaker standing beside it) comes out of that edge. Text is written with `T` in the text layer (clear sans-serif, ≥12).
- The illustration group has a default ink 3.5 stroke (pixel blocks themselves are `stroke="none"`), so a `<circle>` or `<path>` written by hand in the page also gets a line.

## Own motion (all controlled by `vl-fx-full / lite / off`)

| Motion | Rule |
|---|---|
| Level intro: a full-screen light green "Chapter N · chapter name · READY!" that shrinks in steps | Once per chapter per session; click or press any key to skip; 0.6s at lite, 1.4s at full; not played at off, under reduced motion, in headless browsers, or with `?freeze=` |
| Header illustration hops two frames up and down `steps(2)` | Full level only; pauses when the header leaves the viewport |
| Buttons sink a whole pixel when pressed; popovers / reveals / badges pop in with `steps(3–5)`; Try it blinks twice on completion | Feedback motion ≤300ms; cleared globally by the kit at the off level |
| `?freeze=seconds` | Pauses all animation (for screenshots) |

## Known issues

- Dark has variables only and is not fine-tuned (the user put dark on hold); in dark the console frame and LCD have rather low contrast.
- The contents page only turns chapter cards into "level blocks + dot-matrix dividers"; it is not drawn as a true level-select map route.
- The full Simplified Chinese Fusion Pixel is about 0.9MB; the whole course uses it only for h1, so it can be subset to the course's characters (see "Font rules" in section 1 of `skin-contract.md`).
- VT323 is a web font; offline, digits fall back to Consolas.
- `tools/illus-overlap.mjs` reports "an object held in hand in front of the body" as an overlap (in the pixel style, drawing the object in front of the torso is deliberate); ignore these.
- Pixel people's eyes are one cell wide, and the thin `glasses` frame is a little cramped at small sizes; when you need a clearly bespectacled character, set `s` above 1.2.

## Differences from the original AI course

- Removed the Little Bit character, WORLD numbering, coins, stars and the little runner on the progress bar (these belong to the companion and rewards modules).
- Removed the console nameplate text "DOT MATRIX · AI POCKET" and the small pixel objects at the end of sections.
- Subheadings, buttons and labels changed from pixel font to clear sans-serif; the pixel font is kept only for h1 and chapter numbers.
- All colours became variables; the sepia and dark schemes are new.
