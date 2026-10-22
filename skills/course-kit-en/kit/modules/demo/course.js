/* 演示小课的课程配置（假数据）：三章"怎样记住东西"。真实课程写在 js/course.js，放在 </main> 之后、vl.js 之前。 */
window.VL_COURSE = {
  id: "vlmod",
  home: "demo-modules.html",
  mapHref: "map.html",
  enReady: false,
  chapters: [
    { zh: "忘掉的速度", en: "How Fast We Forget", file: "demo-ch01.html" },
    { zh: "考一考自己", en: "Testing Yourself", file: "demo-ch02.html" },
    { zh: "隔几天再看", en: "Come Back Later", file: "demo-ch03.html" },
  ],
  parts: [
    { zh: "一、记忆怎么丢", en: "I. How Memories Fade", from: 1, to: 2 },
    { zh: "二、怎么留住", en: "II. Making Them Stay", from: 3, to: 3 },
  ],
  // 可选模块的开关（不写 = 用默认：collect、related 开，companion 要给配置才出现，sound 默认静音）
  modules: {
    collect: { title: "集邮册" },
    related: true,
    sound: true,
    companion: {
      name: "小格",
      label: "小格，点一下听它说话",
      art: "demo-buddy",
      // 关键时刻主动冒一句（每章最多 3 次）；没写的事件就不说话
      lines: {
        try: ["我也试了一下，真的不一样。"],
        perfect: ["这一章我也全答对了，盖个章。"],
      },
    },
  },
};
