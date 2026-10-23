# Skin notebook: hand-drawn notebook

Purpose: this skin's style, variables, illustration style and what it suits. This is the English translation of the Chinese README, which remains the source of truth.

**In one line**: an open grid- or ruled-paper notebook, with stick figures and macaron colour blocks drawn by hand on the page, highlighter for the key points, and thick ink lines and hard shadows kept for diagrams, interaction boards and concept cards.

## Files

| File | Contents |
|---|---|
| `skin.css` | Variables (three colour schemes + five part colours) + component looks |
| `skin.js` | `window.VL_SKIN`: web font addresses, the hand-drawn wobble filter `#vl-rough`, the illustration palette |
| `interact.css` `modules.css` `diagrams.css` | Looks for the interactive components, the optional modules and the later seven diagrams (the other three skins were made by redrawing these) |
| `gallery.html` | Approval page |
| `fonts/PatrickHand-Regular.ttf` | Patrick Hand (handwriting for letters and digits), local, works offline |
| `fonts/OFL.txt` | Font licence (SIL OFL 1.1) |

## Fonts

| Variable | Used for | Font (with fallbacks, in order) |
|---|---|---|
| `--font-display` | h1, big chapter number | Patrick Hand (letters and digits) → Ma Shan Zheng (web) → LXGW WenKai → KaiTi |
| `--font-hand` = `--font-label` | h2–h4, buttons, labels, text in figures | Patrick Hand (only 0–9 A–Z a–z, via `unicode-range`) → LXGW WenKai → KaiTi |
| `--font-body` | body text | LXGW WenKai (web) → KaiTi → Microsoft YaHei |
| English pages | body Segoe UI or similar sans-serif; headings / buttons Patrick Hand | |

Ma Shan Zheng is a calligraphic display face and is used only for h1. Subheadings and buttons use LXGW WenKai, which is clearer than a calligraphic face. Web fonts are inserted asynchronously by `vl-head.js`; offline, they fall back to the system KaiTi and the layout stays intact.

## Variables

| Group | Variables | Light | Dark | Sepia |
|---|---|---|---|---|
| Text | `--ink` `--ink2` `--muted` | #2b2b3a / #4b4b5e / #52526a | #ece6d6 / #cfc8b8 / #bdb6a6 | #3b3123 / #54473a / #5c4f3f |
| Ground | `--page` (= the part's paper colour) `--line` (grid lines) `--panel` `--edge` (physical objects) `--sunk` (control wells) | part paper colour / part grid colour / = page / #fff / #fffdf3 | #1d1d26 / #30303f / = page / #272733 / #22222c | #f3e9d2 / #e0d1ae / = page / #fbf4e3 / #f7eedb |
| Main colour | `--accent` `--accent2` (fills only) `--deep` (for text) | part colour (hue within a part ±18°) | part colour blended into a dark ground | part colour, desaturated |
| Emphasis | `--hl` highlighter, `--focus` | = accent / #2b6cff | dark highlighter / #7aa7ff | light highlighter / #2b6cff |
| State | `--ok --okbg --no --nobg --warnbg` | dark green, light green, dark red, light red, apricot | bright green text on a dark ground | warm version |
| Skin-specific | `--note` (Try-it sticky note) `--egbg / --egbad` (example / counterexample ground) `--whybg` (why-it-works gradient) `--sidebg` (folded page) | | | |
| Plate | `--plate` `--plate-ink` | #fff / #2b2b3a | same as light (light plate) | #fffaf0 / #2b2b3a |
| Diagrams | `--dg-c1…c6` (yellow, blue, pink, green, purple, orange) `--dg-ink --dg-ink2 --dg-hi` (selected #d6336c) `--dg-filter` | unchanged in all three schemes (they sit on the plate) | | |
| Illustrations | `--il-filter`; colours in `palette` in `skin.js` | unchanged | | |
| Quantity encoding | `--q1…q6` | blue, orange, green, purple, red, teal (≥4.5:1 on white) | | |
| Shape | `--stroke` 3px, `--radius` / `--radius-alt` (asymmetric hand-drawn corners), `--shadow-obj` 5px 6px 0 ink, `--shadow-soft` | | shadows become near-black | |
| Motion | `--ease`, `--dur-fb` .22s | | | |

Part colours: `--p1a…p5a` (main), `--p1b…p5b` (accent), `--p1p…p5p` (paper), `--p1l…p5l` (grid lines), for five parts in yellow / blue / green / pink / purple. From part 6 on the colours wrap back to part 1's; add `body[data-part="6"]` in skin.css if you need more.

Paper: `body[data-pat]` rotates by chapter number through grid / dots / ruled / diagonal. The chapter opening has a large hollow chapter number at the top right (`--vl-chnum`).

## What is thick and what is thin

| Thick 3px ink line + hard shadow (the stars) | Thin line / dashed / no frame (supporting cast) |
|---|---|
| Numbered figures and concept diagrams `.vl-fig`, interaction boards `.vl-board`, concept cards `.vl-cc` (12px thick left edge in the part colour + shadow in the part colour, tilted −0.35°), quiz cards, popovers | Why-it-works box (a vertical rule at the margin + small tag), folded pages (dashed frame, solid when open), example cards (2.5px), learning goals, wrap-up blocks, Try-it sticky notes (soft shadow) |

## Illustration style
- Stick figures: round head + ink-line torso and limbs + two-dot eyes + curved mouth, `viewBox 200×140`, line width 3.5, wobbled by `#vl-rough`; text goes in the extra layer and does not wobble.
- Flat macaron colour blocks (`palette`), one visual focus per picture; people are told apart by hat, hair, glasses and beard (`illus.js` changes outfits automatically).
- Standing people have their feet on `ground()` (y=126); seated people come with a chair; objects held in hand use `holding()` and sit between the two hands; a pointing hand points at something in the picture.
- Speech bubbles use `bubble()`, with short text that never covers a person; font size ≥12.
- In dark and sepia the illustrations sit on a light plate and their colours don't change; don't draw separate versions for dark.

## When it fits
- Suits: introductory to intermediate concept courses where readers want an easy read and are willing to get hands-on (game design, psychology, product, education, writing…); illustrations mostly of people and everyday scenes.
- Doesn't suit: courses heavy on data charts and precise figures (the hand-drawn wobble makes data charts look imprecise; for data charts remove every filter except on `.vl-dg-box`, or leave `filter` off the data SVG in the page); serious history or medicine (macaron colours and stick figures feel flippant); courses that rely mainly on real photos (`.vl-fig.photo` taped photos work, but for many photos choose another skin).
