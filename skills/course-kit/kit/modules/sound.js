/* course-kit · modules/sound.js —— 提示音。默认静音；顶栏一个喇叭开关（存档 <id>-sound）；WebAudio 现场合成，不带音频文件。
   音色归皮肤：皮肤在 CSS 里写 :root{--vl-snd:paper|sine|square|triangle}（笔记本 = paper：纸和铅笔声；像素 = square）。
   只跟操作和"读懂"事件响（试试看完成、答对、答错、全对、盖章），不跟滚动响。课程配置 modules.sound:false 时整个模块不出现。 */
(function () {
  "use strict";
  const VL = window.VL, doc = document;
  if (!VL) return;
  const C = window.VL_COURSE || {};
  const M = C.modules || {};
  const T = (k, zh, en, ...a) => { const X = window.VL_I18N || {}; const s = X[VL.lang] && X[VL.lang][k] != null ? X[VL.lang][k] : (VL.lang === "en" ? en : zh); return String(s).replace(/\{(\d+)\}/g, (m, i) => (a[+i] != null ? a[+i] : m)); };
  if (M.sound === false) { VL.sound = { play() {}, on: () => false, set() {}, enabled: false }; return; }

  const esc = VL.esc;
  let ctx = null, on = VL.store.get("sound") === "1";
  const timbre = () => { try { return (getComputedStyle(doc.documentElement).getPropertyValue("--vl-snd") || "").trim().replace(/["']/g, "") || "sine"; } catch (e) { return "sine"; } };
  function ac() {
    if (!ctx) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; try { ctx = new A(); } catch (e) { return null; } }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }
  // 一个音：频率（可滑到 f2）、起始偏移、时长、音量
  function tone(a, f, t0, dur, vol, wave, f2) {
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + t0;
    o.type = wave === "paper" ? "triangle" : wave; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  // 一段滤过的噪声：纸声、盖章的"噗"
  function noise(a, t0, dur, vol, type, freq) {
    const n = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    const s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime + t0;
    s.buffer = buf; fl.type = type; fl.frequency.value = freq; g.gain.value = vol;
    s.connect(fl).connect(g).connect(a.destination); s.start(t);
  }
  const SOUNDS = {
    click: (a, w) => (w === "paper" ? noise(a, 0, 0.04, 0.25, "highpass", 2500) : tone(a, 1200, 0, 0.04, 0.08, w)),
    flip: (a, w) => (w === "paper" ? noise(a, 0, 0.09, 0.3, "bandpass", 1800) : tone(a, 500, 0, 0.07, 0.07, w, 800)),
    pop: (a, w) => tone(a, 600, 0, 0.09, 0.12, w, 900),
    ok: (a, w) => { tone(a, 660, 0, 0.1, 0.11, w); tone(a, 880, 0.08, 0.14, 0.11, w); },
    wrong: (a, w) => tone(a, 240, 0, 0.16, 0.1, w === "square" ? "square" : "triangle", 170),
    coin: (a, w) => { tone(a, 988, 0, 0.07, 0.1, w); tone(a, 1319, 0.06, 0.2, 0.1, w); },
    clear: (a, w) => [523, 659, 784, 1047].forEach((f, i) => tone(a, f, i * 0.09, 0.18, 0.1, w)),
    stamp: (a, w) => { noise(a, 0, 0.12, 0.5, "lowpass", 500); tone(a, 140, 0, 0.12, 0.18, "sine", 70); if (w !== "paper") tone(a, 880, 0.1, 0.12, 0.06, w); },
  };
  function play(name) {
    if (!on || !SOUNDS[name]) return;
    const a = ac(); if (!a) return;
    try { SOUNDS[name](a, timbre()); } catch (e) {}
  }

  /* ---------- 顶栏喇叭：插在"显示"按钮前 ---------- */
  const ICON_ON = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9c1.5 1.5 1.5 4.5 0 6M19 6c3 3 3 9 0 12"/></svg>';
  const ICON_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
  let btn = null;
  function sync() {
    if (!btn) return;
    btn.setAttribute("aria-pressed", String(on));
    btn.innerHTML = (on ? ICON_ON : ICON_OFF) + '<span class="vl-tb-txt">' + esc(on ? T("snd.on", "声音开", "Sound on") : T("snd.off", "静音", "Muted")) + "</span>";
    btn.setAttribute("aria-label", on ? T("snd.ariaOn", "声音：开着，点一下静音", "Sound is on; press to mute") : T("snd.ariaOff", "声音：静音，点一下打开", "Sound is muted; press to turn on"));
  }
  function set(v) { on = !!v; VL.store.set("sound", on ? "1" : "0"); sync(); if (on) { ac(); play("pop"); } doc.dispatchEvent(new CustomEvent("vl:sound", { detail: { on } })); }
  const bar = doc.querySelector(".vl-topbar");
  if (bar) {
    btn = VL.el("button", { type: "button", class: "vl-tb-btn vl-tb-sound" });
    const prefs = bar.querySelector(".vl-tb-prefs");
    if (prefs) { prefs.before(btn); if (prefs.style.marginLeft === "auto") { prefs.style.marginLeft = ""; btn.style.marginLeft = "auto"; } } else bar.appendChild(btn);
    btn.addEventListener("click", () => set(!on));
    sync();
  }

  /* ---------- 自动挂钩：只跟操作和读懂事件 ---------- */
  doc.addEventListener("vl:try", () => play("ok"));
  doc.addEventListener("vl:answer", () => play("ok"));
  doc.addEventListener("vl:quiz-perfect", () => setTimeout(() => play("clear"), 200));
  doc.addEventListener("vl:guess", e => { const d = e.detail || {}; if (d.right === true) play("ok"); else if (d.right === false) play("wrong"); });
  doc.addEventListener("click", e => { const o = e.target.closest && e.target.closest(".vl-qopt.no"); if (o && o === e.target.closest(".vl-qopt")) play("wrong"); });

  VL.sound = { play, on: () => on, set, enabled: true, names: Object.keys(SOUNDS) };
})();
