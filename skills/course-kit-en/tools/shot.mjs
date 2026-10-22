// 元素截图工具：用 Edge 无头模式打开页面，等插图/脚本加载完，把指定元素（或整页）截成 PNG。
// 用法：node tools/shot.mjs <html 文件绝对路径> <输出.png> [选择器[@序号]] [视口宽度=1000] [等待毫秒=1500]
//   选择器省略或为 "page" → 整页；"选择器@2" 取第 3 个匹配元素（从 0 开始）；例：".sec@2"、".egcar@0"、"svg@5"
//   额外：选择器后可加 "|点击:另一个选择器" 先点击再截图，如 ".egcar@0|点击:.egtab@3"
// 依赖：Node 22+、Windows 的 Edge。
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [file, out, selArg = "page", wArg = "1000", waitArg = "1500"] = process.argv.slice(2);
if (!file || !out) { console.error("用法见文件头注释"); process.exit(1); }
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORT = 9800 + Math.floor(Math.random() * 400);
const udd = path.join(process.env.TEMP || "C:/Windows/Temp", "shot-edge-" + PORT);
const proc = spawn(EDGE, ["--headless=new", "--disable-gpu", "--remote-debugging-port=" + PORT, "--user-data-dir=" + udd, "--no-first-run", "about:blank"], { stdio: "ignore" });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let wsUrl;
for (let i = 0; i < 60 && !wsUrl; i++) { try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const p = l.find(t => t.type === "page"); if (p) wsUrl = p.webSocketDebuggerUrl; } catch (e) {} await sleep(300); }
const ws = new WebSocket(wsUrl); await new Promise(r => (ws.onopen = r));
let id = 0; const pend = new Map();
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
const send = (method, params = {}) => new Promise(res => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Page.enable"); await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: +wArg, height: 900, deviceScaleFactor: 1, mobile: +wArg < 600 });
await send("Page.navigate", { url: "file:///" + file.replace(/\\/g, "/") });
await sleep(+waitArg);
const [sel, clickPart] = selArg.split("|点击:");
const pick = s => { const [q, n] = s.split("@"); return `document.querySelectorAll(${JSON.stringify(q)})[${+n || 0}]`; };
if (clickPart) { await send("Runtime.evaluate", { expression: `(${pick(clickPart)}).click()` }); await sleep(600); }
let clip;
if (sel === "page") {
  const r = await send("Runtime.evaluate", { expression: "JSON.stringify({w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight})", returnByValue: true });
  const d = JSON.parse(r.result.result.value); clip = { x: 0, y: 0, width: d.w, height: Math.min(d.h, 16000), scale: 1 };
} else {
  const r = await send("Runtime.evaluate", { expression: `(()=>{const e=${pick(sel)};if(!e)return null;const b=e.getBoundingClientRect();return JSON.stringify({x:b.left+scrollX,y:b.top+scrollY,w:b.width,h:b.height})})()`, returnByValue: true });
  if (!r.result.result.value) { console.error("没找到元素", sel); proc.kill(); process.exit(2); }
  const b = JSON.parse(r.result.result.value); const pad = 12;
  clip = { x: Math.max(0, b.x - pad), y: Math.max(0, b.y - pad), width: b.w + pad * 2, height: b.h + pad * 2, scale: 1 };
}
const shot = await send("Page.captureScreenshot", { format: "png", clip, captureBeyondViewport: true });
fs.writeFileSync(out, Buffer.from(shot.result.data, "base64"));
console.log("已保存", out, Math.round(clip.width) + "×" + Math.round(clip.height));
ws.close(); proc.kill(); process.exit(0);
