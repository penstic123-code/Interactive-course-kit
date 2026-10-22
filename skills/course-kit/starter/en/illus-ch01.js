/* Chapter 1 picture pack (starter template). new-course.mjs copies it to course/js/illus-ch01.js; chapter pages load it after kit/illus.js.
   Each picture: VL.illus.add(name, alt: what is in the picture, shape layer, text layer). Names start with c01- and are used once in the whole course.
   How to draw and the parameters: kit/README.md, "Picture slots". People rules (feet on the ground, hands really holding things, told apart by
   clothes and hair, no text over the drawing): `references/content-rules.md`, section 2.
   Names not drawn yet show on the page as dashed placeholder boxes with the name inside. That is a reminder, not an error, but none may be left at delivery. */

// Example: the chapter header. A standing person's feet rest on ground(); things held go between the hands via holding(); text goes in the 4th argument (outside the filter group, so it stays sharp)
VL.illus.add("c01-hero", "A person standing on the ground holding a book in both hands, with a question-mark bubble above",
  k => k.ground() + k.person(70, 63, { arms: "hold", face: "o", look: 1 }) + k.holding(70, 63, { look: 1 }, "book") + k.bubble(112, 14, 60, 34, [104, 50]),
  k => k.T(142, 38, 18, "?", "middle"));
