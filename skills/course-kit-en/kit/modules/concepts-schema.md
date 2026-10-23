# Unified concept data (js/concepts.js)

Purpose: one data set serves concept cards, the concept map, the chapter mini map, related chapters, the stamp album / field guide, the glossary and flashcards, so the places never disagree. Example: `demo/concepts.js`. This is the English translation of the Chinese file of the same name, which remains the source of truth.

```js
window.VL_CONCEPTS = {
  items: [ /* core concepts (including worldview principles) */ ],
  links: [ /* optional: relation edges written in one place, merged and deduplicated with items[].links */ ],
  terms: [ /* ordinary terms: go into the glossary and flashcards, not the concept map or album */ ],
};
```

## items[]: concepts

| Field | Required | Description | Used by |
|---|---|---|---|
| `id` | yes | English kebab-case, unique across the course; if you change it, update `data-concept` in every chapter | everything |
| `ch` | yes | Chapter number (the chapter that first teaches it fully) | map columns, related chapters, album grouping, flashcards (only chapters already understood) |
| `zh` / `en` | yes | Chinese and English names | concept cards, nodes, glossary |
| `def` / `defEn` | yes | One-sentence definition (≤60 Chinese characters; for English about 40 words at most) | concept card `.vl-cc-def`, glossary, back of flashcards |
| `plain` / `plainEn` | recommended | One sentence in plain words | the "In plain words" line on the concept card, stamp-album definition, back of flashcards |
| `illus` | recommended | Illustration name (registered with `VL.illus.add`) | concept card picture slot, stamp, album cell, back of flashcards |
| `by` / `byEn` | no | Source: who · which book · year | concept card `.vl-cc-by` |
| `aka` | no | Array of alternative names (Chinese or English) | search; build-concepts uses it to recognise terms |
| `kind` | no | `"concept"` (default) or `"principle"` (worldview principle, content-rules.md 1D) | nodes and album cells get a double border; the tag reads "Worldview principle" |
| `badge` | no | `true` = this chapter's stamp uses its picture; omitted = the chapter's first concept | stamp album |
| `links` | no | `[{to, type}]`, edges leaving this concept | concept map, related chapters |

## Relation edges

`{from, to, type}`, written in `items[i].links` (from = this concept) or in the top-level `links`.

| type | Meaning | What the direction means | Wording in the info panel (for from / for to) |
|---|---|---|---|
| `prereq` | prerequisite | understand from before you can understand to | then you can understand / needs first |
| `explains` | explains | from gives the principle behind to | it can explain / the principle behind it |
| `applies` | applies | from is used on to (to is an application of from) | used in / makes use of |
| `contrast` | contrast | no direction; the two contrast or are in tension | contrasts with |

The Chinese names `前置 / 解释 / 应用 / 对照` are also accepted. An edge pointing to an id that doesn't exist triggers a console warning and is dropped, and `build-concepts.mjs` reports ✗.

## terms[]: ordinary terms

`{id, ch, zh, en?, def, defEn?, aka?, anchor?}`. `anchor` is the id of the term's element in the chapter page, which the glossary link jumps to. Write them by hand, or let `build-concepts.mjs --write` collect them from each chapter's `.vl-term[data-def]` and `<dfn title>` (words that are already core concepts are not collected twice).

## Using it in chapter pages

| Markup | Effect |
|---|---|
| `<aside class="vl-cc" data-concept="spacing"></aside>` | The whole concept card is generated from the data (name, English name, source, plain words, definition, picture slot) |
| `<aside class="vl-cc" data-concept="spacing"><p class="vl-cc-eg">…</p></aside>` | Write only this chapter's own example; the other fields come from the data |
| `<p class="vl-try" data-try="t1" data-concept="spacing">` | The first time the Try it is completed, the stamp album adds this concept to the album (if omitted, the first `.vl-cc[data-concept]` in the same section is used) |
| `<div class="vl-minimap" data-ch="3"></div>` | This chapter's concept mini map |
| `<nav class="vl-related"></nav>` | Where the related chapters go; if omitted, they are inserted before the pager automatically |

## Maintenance

- After changing chapters or data, run `node kit/modules/build-concepts.mjs <absolute course path>`. It checks for `data-concept` values that can't be found, cards that disagree with the data, one term with two definitions, edges pointing to ids that don't exist, and missing pictures.
- English edition: just fill in `en`, `defEn`, `plainEn` and `byEn`. It is the same file, and English pages pick the English fields automatically.
