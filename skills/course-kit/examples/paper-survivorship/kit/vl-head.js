/* course-kit · vl-head.js —— 放在 <head> 里、皮肤的 skin.js 之后。
   做两件必须在首屏绘制前完成的事：
   1. 按读者保存的偏好，给 <html> 加 data-scheme（light / dark / sepia）和动效档位类 vl-fx-*，避免先亮后暗的闪烁；
   2. 异步插入皮肤声明的网络字体 <link>（window.VL_SKIN.fonts），网慢或离线时用系统字体兜底，不阻塞页面脚本。
   偏好键不带课程前缀（vl-scheme、vl-fx）：读者的配色和动效偏好跨课程通用。 */
(function () {
  var root = document.documentElement;
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  var SCHEMES = ["light", "dark", "sepia"];
  var th = get("vl-scheme");
  var qs = /[?&]scheme=(light|dark|sepia)/.exec(location.search); if (qs) th = qs[1]; // 网址带 ?scheme= 时临时用它（截图验收三套配色），不存档
  if (SCHEMES.indexOf(th) < 0) th = "light";
  root.setAttribute("data-scheme", th);

  // 动效档位：手动选择（full / lite / off）优先；"auto" 或没选时自动判定
  function mq(s) { try { return !!(window.matchMedia && matchMedia(s).matches); } catch (e) { return false; } }
  var headless = /Headless/i.test(navigator.userAgent) || !!navigator.webdriver;
  var q = "";
  try { q = new URLSearchParams(location.search).get("fx") || ""; } catch (e) {}
  function autoLevel() {
    if (mq("(prefers-reduced-motion: reduce)")) return "off";
    if (headless && q !== "1") return "off";
    if (mq("(max-width: 700px)") || mq("(pointer: coarse)")) return "lite";
    return "full";
  }
  var pick = get("vl-fx");
  var lv = (pick === "full" || pick === "lite" || pick === "off") ? pick : autoLevel();
  if (mq("(prefers-reduced-motion: reduce)")) lv = "off";   // 系统"减少动态"永远优先
  root.classList.remove("vl-fx-full", "vl-fx-lite", "vl-fx-off");
  root.classList.add("vl-fx-" + lv);
  window.__VL_FX_AUTO = autoLevel;

  // 网络字体：异步插 <link>，失败就算了（皮肤 CSS 里有系统字体兜底）
  var skin = window.VL_SKIN || {};
  (skin.fonts || []).forEach(function (href) {
    var l = document.createElement("link");
    l.rel = "stylesheet"; l.href = href; l.media = "print";
    l.onload = function () { l.media = "all"; };
    l.onerror = function () { if (l.parentNode) l.parentNode.removeChild(l); };
    document.head.appendChild(l);
  });
})();
