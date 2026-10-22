/* 第 1 章插画包（起步模板）。new-course.mjs 把它复制成 课程/js/illus-ch01.js；章节页在 kit/illus.js 之后加载。
   每张图：VL.illus.add(名字, alt：画面里有什么, 图形层, 文字层)。名字用 c01- 前缀，全课只用一次。
   画法和参数见 kit/README.md“插画位”；人物规范（脚落地、手握物、靠服饰区分、文字不压图）见 content-rules.md 第二节。
   还没画的名字在页面上显示成虚线占位框（写着名字），不报错——交付前一个都不能剩。 */

// 示例：题头。站着的人脚落在 ground() 上；拿东西用 holding() 画在两手之间；文字放第 4 个参数（滤镜组外，保持清晰）
VL.illus.add("c01-hero", "一个人站在地上，双手捧着一本书，头上冒出一个问号气泡",
  k => k.ground() + k.person(70, 63, { arms: "hold", face: "o", look: 1 }) + k.holding(70, 63, { look: 1 }, "book") + k.bubble(112, 14, 60, 34, [104, 50]),
  k => k.T(142, 38, 18, "?", "middle"));
