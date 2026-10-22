// 找一个能用无头模式的 Chromium 系浏览器（Edge 或 Chrome），给 qa.mjs、shot.mjs、illus-overlap.mjs 共用。
// 查找顺序：环境变量 EDGE_PATH（或 CHROME_PATH）→ Windows 常见安装路径 → macOS 应用目录 → Linux 的 PATH 里的命令。
// 都找不到就抛出一条说明怎么设置 EDGE_PATH 的错误。
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

export function findBrowser() {
  for (const v of [process.env.EDGE_PATH, process.env.CHROME_PATH]) if (v && fs.existsSync(v)) return v;
  const pf = [process.env["PROGRAMFILES(X86)"], process.env.PROGRAMFILES, process.env.LOCALAPPDATA, "C:/Program Files (x86)", "C:/Program Files"].filter(Boolean);
  const cands = [];
  if (process.platform === "win32") {
    for (const d of pf) cands.push(path.join(d, "Microsoft/Edge/Application/msedge.exe"), path.join(d, "Google/Chrome/Application/chrome.exe"));
  } else if (process.platform === "darwin") {
    cands.push("/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium");
  }
  for (const c of cands) if (fs.existsSync(c)) return c;
  if (process.platform !== "win32") {
    for (const cmd of ["microsoft-edge", "microsoft-edge-stable", "google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]) {
      const r = spawnSync("which", [cmd], { encoding: "utf8" });
      if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
    }
  }
  throw new Error("找不到 Edge 或 Chrome。请安装其一，或把浏览器可执行文件的完整路径写进环境变量 EDGE_PATH 再运行。");
}

export const tmpDir = () => process.env.TEMP || process.env.TMPDIR || (process.platform === "win32" ? "C:/Windows/Temp" : "/tmp");
