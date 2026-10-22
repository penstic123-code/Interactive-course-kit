/* 皮肤 notebook（手绘笔记本）的脚本部分：放在 <head> 里、kit/vl-head.js 之前。
   只做声明，不做事：vl-head.js 按 fonts 异步插网络字体，vl.js 把 defs 里的滤镜放进页面，illus.js 用 palette 画插画。
   滤镜规则：feDisplacementMap 必须写 in="SourceGraphic"（写错一个词全图变噪点）；文字永远不进滤镜组。 */
window.VL_SKIN = {
  name: "notebook",
  // 正文霞鹜文楷、大标题马善政：网络字体，离线时退到楷体（KaiTi / STKaiti）。Patrick Hand 在 skin.css 里用本地文件
  fonts: [
    "https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.css",
    "https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap",
  ],
  defs: '<filter id="vl-rough" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="n"/>' +
    '<feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G"/></filter>',
  // 插画配色（图板上画，暗色 / 护眼配色下不变）
  palette: {
    ink: "#2b2b3a", skin: "#fffbea", paper: "#fffdf3",
    yellow: "#ffe58a", pink: "#ffb3c6", blue: "#a8dcf0", green: "#b6e8a8", orange: "#ffc078", purple: "#d8c8ff",
    red: "#e5484d", gold: "#ffd34d", wood: "#c98f5a", cap: "#ff8fab", beanie: "#5b8def", wizard: "#8f6cf5", dark: "#3b3f4f", grey: "#cfd3dc",
  },
};
