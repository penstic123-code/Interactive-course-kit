"""把一章 html 转成"读者视图"纯文本：给体验 / 审读 agent 用，省得啃整页 HTML。
用法：python readable.py <章节 html 路径> [--out 输出.txt]      （旧写法 readable.py <html> <输出.txt> 也认）
两个分支，按页面自动选：
- kit 分支（页面里有 vl- 类，即用 course-kit 搭的课，中英文页都行）：逻辑在同目录 readable_kit.py。按阅读顺序输出
  章标题、副标题、学习目标、各分节正文；概念卡 [概念卡：名字 — 定义 — 例子]；原理框、误区、要点、旁注等带类型标签；
  收起的发明故事 / 支线写成 [收起·类型：钩子 — 介绍] 再附"展开后"的内容；图写成 [图 N：aria-label / 插画 alt — 图注]，
  VL.diagram 图解读 data-diagram 的 JSON 或页面脚本里的配置；例子轮播每页都输出；互动写成 [互动：标题 — 试试看]；
  动手题、小游戏、练习（VL.quiz）从脚本里读出题目、选项、解析放回原位；荧光笔 vl-cn 用【】，着重 vl-em 用「」。
  注意：输出里标出了正确答案（正确选项带 ✓、估数题写出答案、排序题列出正确顺序），派审读 agent 时让它先闭卷自测、再看答案。
- 老分支（作者的 AI 课等老课程）：保留：标题、段落、列表、小比特台词、公式源码；图换成 [图：aria-label + 图注]，插画换成 [插画：alt]（从 js/illus-chNN.js 取），
  照片换成 [照片：alt]，实验室列出标题、白话注释和活参数，短片列出每步旁白（从 js/chNN.js 取），测验列出题目与解析。"""
import re, sys, os, html
from html.parser import HTMLParser

try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
_args = sys.argv[1:]
OUT = None
if "--out" in _args:
    _i = _args.index("--out"); OUT = _args[_i + 1]; del _args[_i:_i + 2]
elif len(_args) > 1: OUT = _args[1]
if not _args: sys.exit(__doc__)
path = _args[0]
src = open(path, encoding="utf-8").read()

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import readable_kit
if readable_kit.is_kit(src):          # kit 分支
    text = readable_kit.render(path, src)
    if OUT: open(OUT, "w", encoding="utf-8").write(text); print(f"写入 {OUT}，{len(text)} 字符")
    else: print(text)
    sys.exit(0)

# ======== 老分支（原逻辑，未改） ========
root = os.path.dirname(path)
m = re.match(r"ch(\d+)", os.path.basename(path))
nn = m.group(1) if m else ""

def readjs(p):
    p = os.path.join(root, p)
    return open(p, encoding="utf-8").read() if os.path.exists(p) else ""
illus_js = readjs(f"js/illus-ch{nn}.js")
page_js = readjs(f"js/ch{nn}.js") + "\n".join(re.findall(r"<script>(.*?)</script>", src, re.S))
STR = r'"((?:[^"\\]|\\.)*)"'
def js_str(t): return t.replace('\\"', '"').replace("\\\\", "\\")
ALT = {a: js_str(b) for a, b in re.findall(r'add\(\s*' + STR + r'\s*,\s*' + STR, illus_js)}

# 短片：按 GD.film("#id" 分段，取每段里的 say
FILMS = {}
for part in re.split(r'(?=GD\.film\()', page_js)[1:]:
    fm = re.match(r'GD\.film\(\s*["\']#?([\w-]+)', part)
    if fm: FILMS[fm.group(1)] = [js_str(x) for x in re.findall(r'say:\s*' + STR, part)]

BLOCK = {"p", "li", "h1", "h2", "h3", "h4", "figcaption", "blockquote", "summary", "tr", "div"}
class R(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.out = []; s.buf = ""; s.skip = 0; s.svg = 0; s.stack = []
    def flush(s, pre=""):
        t = re.sub(r"\s+", " ", s.buf).strip()
        if t: s.out.append(pre + t)
        s.buf = ""
    def handle_starttag(s, tag, a):
        a = dict(a); cls = a.get("class", "") or ""
        s.stack.append((tag, cls))
        if tag in ("script", "style"): s.skip += 1; return
        if s.skip: return
        if tag == "svg":
            s.svg += 1
            if s.svg == 1 and a.get("aria-label"): s.flush(); s.out.append(f"[图：{a['aria-label']}]")
            return
        if s.svg: return
        if tag in BLOCK or tag == "br": s.flush()
        if tag in ("h1", "h2"): s.buf = "\n## "
        elif tag in ("h3", "h4"): s.buf = "### "
        elif tag == "li": s.buf = "- "
        if "sec" == cls: s.out.append("\n" + "=" * 30)
        if a.get("data-illus"): s.out.append(f"[插画 {a['data-illus']}：{ALT.get(a['data-illus'], '?')}]")
        if tag == "img": s.out.append(f"[照片：{a.get('alt', '')}]")
        if "npc" in cls.split(): s.out.append("（小比特）")
        if "term" in cls.split() and a.get("data-def"): s.pending_def = a["data-def"]
        if tag == "textarea" and a.get("data-save"): s.out.append("[你的思考 文本框]"); s.skip += 1
        if "lab" in cls.split():
            s.out.append(f"[代码实验室：{a.get('data-title', '')}]")
        if tag == "textarea" and any("lab" in c.split() for _, c in s.stack[:-1]):
            s.skip += 1; s.in_lab = True
        if "film" in cls.split() and a.get("id"):
            s.out.append(f"[动画短片 {a['id']}]")
            for i, say in enumerate(FILMS.get(a["id"], []), 1): s.out.append(f"  第{i}步旁白：{say}")
        if a.get("data-reveal") is not None and tag == "button": s.buf += "[按钮：揭晓] "
        if "ans" in cls.split(): s.flush(); s.out.append("（揭晓后显示↓）")
        if "deep" in cls.split() and tag == "details": s.out.append("[进阶抽屉，默认收起↓]")
        if "guess" in cls.split(): s.out.append(f"[先猜后看：滑块 {a.get('data-min')}–{a.get('data-max')}，答案 {a.get('data-answer')}{a.get('data-unit', '')}]")
        if tag == "input" and a.get("type") == "range": s.buf += "[滑块] "
        if tag == "button" and a.get("data-reveal") is None: s.buf += "[按钮："
        if "try" in cls.split(): s.buf += "★"
        if "philo" in cls.split(): s.out.append("[哲学时刻↓]")
        if "why-box" in cls.split(): s.out.append("[原理框↓]")
    def handle_endtag(s, tag):
        if s.stack:
            t, cls = s.stack.pop()
        if tag in ("script", "style"): s.skip -= 1; return
        if tag == "textarea" and s.skip:
            s.skip -= 1; return
        if s.skip: return
        if tag == "svg": s.svg -= 1; return
        if s.svg: return
        if tag == "button" and s.buf.count("[按钮：") > s.buf.count("[按钮：揭晓]") and not s.buf.rstrip().endswith("]"): s.buf += "]"
        if tag == "span" and getattr(s, "pending_def", None):
            s.buf += f"〔术语：{s.pending_def}〕"; s.pending_def = None
        if tag in BLOCK: s.flush()
    def handle_data(s, d):
        if s.skip:
            if getattr(s, "in_lab", False):
                for line in d.splitlines():
                    c = re.search(r"//\s*(.*)", line)
                    if c and (c.group(1).startswith("@") or "@" in c.group(1) or line.strip().startswith("//")):
                        s.out.append("  代码注释/控件：" + c.group(1).strip())
                s.in_lab = False
            return
        if s.svg: return
        s.buf += d

body = src.split("<main", 1)[-1].split("</main>")[0]
r = R(); r.feed("<main" + body); r.flush()
text = "\n".join(r.out)

# 测验：GD.mountQuiz 里的 q / opts / why
quiz = re.findall(r'q:\s*' + STR + r'.*?opts:\s*\[(.*?)\]\s*,\s*a:\s*(\d+).*?why:\s*' + STR, page_js, re.S)
if quiz:
    text += "\n\n" + "=" * 30 + "\n## 测验（脚本里）\n"
    for i, (q, opts, a, why) in enumerate(quiz, 1):
        q, why = js_str(q), js_str(why)
        os_ = re.findall(STR, opts)
        text += f"\n{i}. {q}\n" + "\n".join(f"   {'ABCDEF'[j]}. {o}" for j, o in enumerate(os_)) + f"\n   答案：{'ABCDEF'[int(a)] if int(a) < 6 else a}　解析：{why}\n"
text = html.unescape(text)
text = re.sub(r"\n{3,}", "\n\n", text)
if OUT:
    open(OUT, "w", encoding="utf-8").write(text); print(f"写入 {OUT}，{len(text)} 字符")
else:
    print(text)
