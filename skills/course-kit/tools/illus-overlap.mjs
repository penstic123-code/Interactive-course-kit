// 插画重叠检查：找出人物（illus.js 的 person()，带 class="px-person"）和其他物件、文字重叠的插画。
// 用法：node tools/illus-overlap.mjs <章节 html 绝对路径> [更多路径…]
// 输出"插画名 (人数): 元素@x,y#第几个人"。坐着的人和自己的桌椅、手碰到的物件属于正常重叠；其余要截图确认后改掉。
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { findBrowser, tmpDir } from "./browser.mjs";

const files = process.argv.slice(2);
if (!files.length) { console.error("用法：node tools/illus-overlap.mjs <html绝对路径> [...]"); process.exit(1); }
const CHECK = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "illus-overlap.check.js"), "utf8");
let EDGE;
try { EDGE = findBrowser(); } catch (e) { console.error(e.message); process.exit(2); }
const PORT = 9400 + Math.floor(Math.random() * 400);
const udd = path.join(tmpDir(), "ovl-edge-" + PORT);
const proc = spawn(EDGE, ["--headless=new", "--disable-gpu", "--remote-debugging-port=" + PORT, "--user-data-dir=" + udd, "--no-first-run", "about:blank"], { stdio: "ignore" });
proc.on("error", e => { console.error("浏览器启动失败（" + EDGE + "）：" + e.message + "。可用环境变量 EDGE_PATH 指定浏览器路径。"); process.exit(2); });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let wsUrl;
for (let i = 0; i < 60 && !wsUrl; i++) { try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const p = l.find(t => t.type === "page"); if (p) wsUrl = p.webSocketDebuggerUrl; } catch (e) {} await sleep(300); }
if (!wsUrl) { console.error("浏览器没有响应调试端口（" + EDGE + "）"); proc.kill(); process.exit(1); }
const ws = new WebSocket(wsUrl); await new Promise(r => (ws.onopen = r));
let id = 0; const pend = new Map();
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
const send = (method, params = {}) => new Promise(res => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Page.enable"); await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1100, height: 900, deviceScaleFactor: 1, mobile: false });
for (const file of files) {
  await send("Page.navigate", { url: pathToFileURL(path.resolve(file)).href });
  await sleep(5000);
  const r = await send("Runtime.evaluate", { expression: CHECK, returnByValue: true });
  console.log("=== " + path.basename(file) + "\n" + (r.result?.result?.value || "（没有发现重叠）"));
}
ws.close(); proc.kill();
