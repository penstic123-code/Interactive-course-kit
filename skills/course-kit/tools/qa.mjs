// 课程页面自动化测试：用 Edge / Chrome 无头模式 + CDP 逐页加载、点击所有按钮、拖所有滑块、触发键盘/指针事件，检查 JS 报错、横向溢出，以及图内文字出界 / 压边框 / 互相重叠。
// 用法：node tools/qa.mjs <课程文件夹绝对路径> [章节前缀,逗号分隔，如 ch01,ch05]
// 依赖：Node 22+（自带 WebSocket/fetch）、Edge 或 Chrome（自动查找，或用环境变量 EDGE_PATH 指定，见 browser.mjs）。
// 能抓运行时错误，不能判断画面好不好看（那要截图人工看）。中文页在课程根目录、英文页在 en/，两处都测。
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { findBrowser, tmpDir } from "./browser.mjs";

const ROOT = process.argv[2];
const ONLY = process.argv[3] ? process.argv[3].split(",") : null;
if (!ROOT || !path.isAbsolute(ROOT) || !fs.existsSync(ROOT)) { console.error("用法：node qa.mjs <课程文件夹绝对路径> [ch01,ch05]（必须是存在的绝对路径）"); process.exit(1); }
const files = ["", "en"].flatMap(d => fs.existsSync(path.join(ROOT, d)) ? fs.readdirSync(path.join(ROOT, d)).filter(f => /^(?!_).*\.html$/.test(f)).sort().filter(f => !ONLY || ONLY.some(o => f.startsWith(o))).map(f => d ? d + "/" + f : f) : []);
if (!files.length) { console.log("· 没有要测的页面（" + ROOT + " 和 en/ 下没有 .html）"); process.exit(0); }
let EDGE;
try { EDGE = findBrowser(); } catch (e) { console.error("✗ " + e.message); process.exit(2); }
const PORT = 9333 + Math.floor(Math.random() * 500);
const udd = path.join(tmpDir(), "qa-edge-" + PORT);
const proc = spawn(EDGE, ["--headless=new", "--disable-gpu", "--remote-debugging-port=" + PORT, "--user-data-dir=" + udd, "--no-first-run", "about:blank"], { stdio: "ignore" });
proc.on("error", e => { console.error("✗ 浏览器启动失败（" + EDGE + "）：" + e.message + "。可用环境变量 EDGE_PATH 指定浏览器路径。"); process.exit(2); });
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getWs() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const pg = list.find(t => t.type === "page");
      if (pg) return pg.webSocketDebuggerUrl;
    } catch (e) {}
    await sleep(300);
  }
  proc.kill(); console.error("✗ 浏览器没有响应调试端口（" + EDGE + "）"); process.exit(2);
}
const ws = new WebSocket(await getWs());
await new Promise(r => (ws.onopen = r));
let id = 0; const pending = new Map(); let events = [];
ws.onmessage = m => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
  else if (d.method) events.push(d);
};
const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Page.enable"); await send("Runtime.enable"); await send("Log.enable");
await send("Page.addScriptToEvaluateOnNewDocument", { source: "window.alert=()=>{};window.confirm=()=>true;window.prompt=()=>'';window.print=()=>{};window.open=()=>null;" });

const probe = `(async()=>{
  const out={clicked:0,ranges:0,overflow:0,svgNoRough:0,secs:document.querySelectorAll('.vl-sec,.sec').length,svgs:document.querySelectorAll('main svg').length,inter:0};
  out.overflow=document.documentElement.scrollWidth-document.documentElement.clientWidth;
  const skip=b=>/print|location|href/.test((b.getAttribute('onclick')||''))||b.closest('.navpanel,.vl-navpanel,.vl-topbar,.vl-toc,.vl-tocpanel')||b.classList.contains('navfab')||b.classList.contains('vl-fab');
  const btns=[...document.querySelectorAll('main button, main .chip, main .opt, main [role=button]:not(.sec):not(.vl-sec)')].filter(b=>!skip(b));
  for(const b of btns){try{if(typeof b.click==='function')b.click();else b.dispatchEvent(new MouseEvent('click',{bubbles:true}));out.clicked++}catch(e){out.err=(out.err||'')+e.message+';'}}
  await new Promise(r=>setTimeout(r,200));
  const rs=[...document.querySelectorAll('main input[type=range]')];
  for(const r of rs){for(const f of [0,.5,1]){const mn=+r.min||0,mx=+r.max||100;r.value=mn+(mx-mn)*f;r.dispatchEvent(new Event('input',{bubbles:true}));r.dispatchEvent(new Event('change',{bubbles:true}));}out.ranges++}
  for(const s of document.querySelectorAll('main select')){for(const o of s.options){s.value=o.value;s.dispatchEvent(new Event('change',{bubbles:true}))}}
  for(const c of document.querySelectorAll('main canvas')){const r=c.getBoundingClientRect();for(const t of ['pointerdown','pointermove','pointerup']){c.dispatchEvent(new PointerEvent(t,{bubbles:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2,pointerId:1}))}out.inter++}
  for(const k of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Enter']){document.dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true}));document.dispatchEvent(new KeyboardEvent('keyup',{key:k,bubbles:true}))}
  await new Promise(r=>setTimeout(r,500));
  out.overflowAfter=document.documentElement.scrollWidth-document.documentElement.clientWidth;
  const wide=[...document.querySelectorAll('main *')].filter(e=>e.getBoundingClientRect().right>window.innerWidth+2&&getComputedStyle(e).position!=='fixed'&&!e.closest('svg')&&!e.closest('pre')&&!e.closest('.navpanel,.vl-navpanel')&&!e.closest('table')).slice(0,3).map(e=>e.tagName+'.'+(e.className&&e.className.baseVal===undefined?e.className:'')+'#'+e.id);
  out.wide=wide;

  // ---- 插画没画出来（名字写错、插画脚本没跑完）：data-illus 里没有 svg
  out.noIllus=[...document.querySelectorAll('main [data-illus]')].filter(e=>!e.querySelector('svg,img,canvas')).map(e=>e.getAttribute('data-illus'));

  // ---- 图内文字检查：出界 / 压在形状边框上 / 文字互相重叠 ----
  out.layout = [];
  document.querySelectorAll('main svg').forEach((svg, si) => {
    if (svg.getAttribute('aria-hidden') === 'true' || svg.closest('.hero,.vl-hero')) return;
    const sr = svg.getBoundingClientRect(); if (!sr.width) return;
    const texts = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && getComputedStyle(t).display !== 'none' && t.getBoundingClientRect().width > 0);
    const shapes = [...svg.querySelectorAll('rect,ellipse,circle')].filter(s => !s.closest('defs,marker,clipPath') && getComputedStyle(s).stroke !== 'none' && s.getBoundingClientRect().width > 0);
    const lines = [...svg.querySelectorAll('path,line,polyline')].filter(s => !s.closest('defs,marker,clipPath,text') && getComputedStyle(s).stroke !== 'none' && s.getBoundingClientRect().width + s.getBoundingClientRect().height > 0 && !s.closest('.illus,.vl-illus'));
    const rects = texts.map(t => t.getBoundingClientRect());
    texts.forEach((t, i) => {
      const b = rects[i], lab = t.textContent.trim().slice(0, 14);
      if (b.left < sr.left - 2 || b.right > sr.right + 2 || b.top < sr.top - 2 || b.bottom > sr.bottom + 2) out.layout.push('图' + (si + 1) + ' 出界：' + lab);
      for (const s of shapes) {
        if (s.contains(t)) continue;
        const r = s.getBoundingClientRect();
        if (r.width < b.width * 0.5 || r.height < b.height * 0.5) continue;           // 形状远小于文字：不是容器
        if (r.width * r.height > sr.width * sr.height * 0.8) continue;                 // 整页背景框
        { const cx = (b.left + b.right) / 2, cy = (b.top + b.bottom) / 2;   // 文字中心在框里，但文字比框宽/高：超出框
          if (s.tagName === 'rect' && cx > r.left && cx < r.right && cy > r.top && cy < r.bottom && (b.left < r.left - 1 || b.right > r.right + 1 || b.top < r.top - 1 || b.bottom > r.bottom + 1)) { out.layout.push('图' + (si + 1) + ' 文字超出框：' + lab); break; } }
        const pts = [[b.left, b.top], [b.right, b.top], [b.left, b.bottom], [b.right, b.bottom]];
        let inside = 0;
        if (s.tagName === 'ellipse' || s.tagName === 'circle') { const cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2, a = r.width / 2, c = r.height / 2; pts.forEach(([x, y]) => { if (((x - cx) / a) ** 2 + ((y - cy) / c) ** 2 <= 1) inside++; }); }
        else pts.forEach(([x, y]) => { if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) inside++; });
        if (inside > 0 && inside < 4) { out.layout.push('图' + (si + 1) + ' 文字压边框：' + lab); break; }
      }
      // 挤：文字离图边缘、容器边框、线条太近（<4px，且已排除"压边框"）
      if (b.left < sr.left + 3 || b.right > sr.right - 3 || b.top < sr.top + 3 || b.bottom > sr.bottom - 3) out.layout.push('图' + (si + 1) + ' 文字贴图边缘：' + lab);
      for (const s of shapes) {
        if (!s.contains(t)) continue;
        const r = s.getBoundingClientRect();
        if (r.width * r.height > sr.width * sr.height * 0.8) continue;
        const m = Math.min(b.left - r.left, r.right - b.right, b.top - r.top, r.bottom - b.bottom);
        if (m >= 0 && m < 4 && s.tagName === 'rect') { out.layout.push('图' + (si + 1) + ' 文字贴框：' + lab); break; }
      }
      let near = false;
      for (const l of lines) {
        if (near) break; if (l.contains(t) || t.contains(l)) continue;
        const lr = l.getBoundingClientRect();
        if (lr.right < b.left - 3 || lr.left > b.right + 3 || lr.bottom < b.top - 3 || lr.top > b.bottom + 3) continue;
        if (l.tagName === 'line') { const q = l.getBBox(), m = l.getScreenCTM(); const pts = [[q.x, q.y], [q.x + q.width, q.y + q.height]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]); for (let k = 0; k <= 20; k++) { const x = pts[0][0] + (pts[1][0] - pts[0][0]) * k / 20, y = pts[0][1] + (pts[1][1] - pts[0][1]) * k / 20; if (x > b.left - 2 && x < b.right + 2 && y > b.top - 2 && y < b.bottom + 2) { near = true; break; } } }
        else if (l.getTotalLength) { const L = l.getTotalLength(), m = l.getScreenCTM(); for (let k = 0; k <= 60; k++) { const pt = l.getPointAtLength(L * k / 60), x = m.a * pt.x + m.c * pt.y + m.e, y = m.b * pt.x + m.d * pt.y + m.f; if (x > b.left - 2 && x < b.right + 2 && y > b.top - 2 && y < b.bottom + 2) { near = true; break; } } }
      }
      if (near) out.layout.push('图' + (si + 1) + ' 文字挤线：' + lab);
      for (let j = i + 1; j < texts.length; j++) {
        const o = rects[j], w = Math.min(b.right, o.right) - Math.max(b.left, o.left), h = Math.min(b.bottom, o.bottom) - Math.max(b.top, o.top);
        if (w > 3 && h > 3 && w * h > 0.3 * Math.min(b.width * b.height, o.width * o.height)) out.layout.push('图' + (si + 1) + ' 文字重叠：' + lab + ' / ' + texts[j].textContent.trim().slice(0, 10));
      }
    });
  });
  return JSON.stringify(out);
})()`;

const report = [];
for (const vp of [{ w: 420, h: 900, m: true }, { w: 1100, h: 900, m: false }]) {
  await send("Emulation.setDeviceMetricsOverride", { width: vp.w, height: vp.h, deviceScaleFactor: 1, mobile: vp.m });
  for (const f of files) {
    events = [];
    await send("Page.navigate", { url: pathToFileURL(path.join(ROOT, f)).href });
    await sleep(1400);
    // 有公式的页面等 KaTeX 渲染完再测（否则未断行的 TeX 源码会被误报成横向溢出）
    await send("Runtime.evaluate", { expression: `new Promise(r=>{const m=document.querySelector("main");if(document.querySelector(".katex")||!m||!/\\\\\\(|\\$\\$|\\\\\\[/.test(m.innerHTML))return r();document.addEventListener("mathready",()=>r(),{once:true});setTimeout(r,4000)})`, awaitPromise: true });
    const r = await send("Runtime.evaluate", { expression: probe, awaitPromise: true, returnByValue: true });
    await sleep(300);
    let info = {};
    try { info = JSON.parse(r.result?.result?.value || "{}"); } catch (e) { info = { evalFail: JSON.stringify(r.result).slice(0, 200) }; }
    const errs = events.filter(e => e.method === "Runtime.exceptionThrown").map(e => (e.params.exceptionDetails.exception?.description || e.params.exceptionDetails.text || "").split("\n")[0].slice(0, 160));
    const logs = events.filter(e => e.method === "Log.entryAdded" && e.params.entry.level === "error" && !/fonts|googleapis|jsdelivr|ERR_INTERNET|ERR_NAME|ERR_CONNECTION|net::ERR/.test(e.params.entry.text + (e.params.entry.url || ""))).map(e => (e.params.entry.text + " " + (e.params.entry.url || "")).slice(0, 140));
    report.push({ vp: vp.w, f, errs: [...new Set(errs)], logs: [...new Set(logs)], ...info });
  }
}
ws.close(); proc.kill();
for (const r of report) {
  const bad = r.errs.length || r.logs.length || r.overflowAfter > 2 || r.evalFail || (r.layout && r.layout.length) || (r.noIllus && r.noIllus.length);
  console.log(`${bad ? "✗" : "✓"} ${String(r.vp).padEnd(5)}${r.f.padEnd(34)} secs=${r.secs} svg=${r.svgs} clicked=${r.clicked} ranges=${r.ranges} overflow=${r.overflow}/${r.overflowAfter}${r.wide && r.wide.length ? " wide=" + r.wide.join("|") : ""}`);
  if (r.layout && r.layout.length) { console.log("     图内文字问题 " + r.layout.length + " 处："); [...new Set(r.layout)].slice(0, +(process.env.QA_LAYOUT_MAX || 6)).forEach(x => console.log("       ·", x)); }
  if (r.noIllus && r.noIllus.length) console.log("     插画没画出来 " + r.noIllus.length + " 张：" + [...new Set(r.noIllus)].slice(0, 8).join("、"));
  r.errs.forEach(e => console.log("     JS错误:", e));
  r.logs.forEach(e => console.log("     日志:", e));
  if (r.evalFail) console.log("     evalFail", r.evalFail);
}
process.exit(0);
