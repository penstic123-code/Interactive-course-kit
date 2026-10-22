"""readable.py 的 kit 分支：把用 course-kit（vl- 类名）搭的一章 HTML 转成"读者看到的纯文本"。
由 readable.py 在页面里出现 vl- 类时自动调用；也可单独用：python readable_kit.py <html路径> [--out 输出.txt]
只用标准库。按阅读顺序输出正文；脚本生成的内容（VL.diagram / VL.quiz / VL.task / VL.review / VL.game、
概念卡数据 VL_CONCEPTS、插画 alt）从页面引用的课程脚本和页内 <script> 里读出，放回它们在页面上的位置。"""
import os, re, sys, json, html
from html.parser import HTMLParser


# ======================== 宽松的 JS 字面量解析 ========================
class Raw:
    """解析不了的表达式（函数、变量、运算）"""
    def __init__(s, src=""): s.src = src
    def __repr__(s): return "Raw(%r)" % s.src[:30]


class JS:
    ESC = {"n": "\n", "t": "\t", "r": "", "b": "", "f": "", "v": "", "0": ""}

    def __init__(s, t): s.t = t; s.n = len(t)

    def ws(s, i):
        t, n = s.t, s.n
        while i < n:
            c = t[i]
            if c.isspace(): i += 1
            elif t.startswith("//", i):
                j = t.find("\n", i); i = n if j < 0 else j + 1
            elif t.startswith("/*", i):
                j = t.find("*/", i + 2); i = n if j < 0 else j + 2
            else: break
        return i

    def string(s, i):
        t, n, q = s.t, s.n, s.t[i]
        j, buf = i + 1, []
        while j < n:
            c = t[j]
            if c == "\\" and j + 1 < n:
                e = t[j + 1]
                if e == "u" and re.match(r"[0-9a-fA-F]{4}", t[j + 2:j + 6]):
                    buf.append(chr(int(t[j + 2:j + 6], 16))); j += 6; continue
                if e == "x" and re.match(r"[0-9a-fA-F]{2}", t[j + 2:j + 4]):
                    buf.append(chr(int(t[j + 2:j + 4], 16))); j += 4; continue
                if e == "\n": j += 2; continue
                buf.append(s.ESC.get(e, e)); j += 2; continue
            if c == q: return "".join(buf), j + 1
            if q == "`" and t.startswith("${", j):
                k = s.skip_bal(j + 1); buf.append("…"); j = k; continue
            buf.append(c); j += 1
        return "".join(buf), n

    def skip_bal(s, i):
        """t[i] 是 ( [ {，返回配对括号之后的位置"""
        t, n, d = s.t, s.n, 0
        while i < n:
            c = t[i]
            if c in "\"'`": _, i = s.string(i); continue
            if t.startswith("//", i) or t.startswith("/*", i): i = s.ws(i); continue
            if c in "([{": d += 1
            elif c in ")]}":
                d -= 1
                if d == 0: return i + 1
            i += 1
        return n

    def skip_expr(s, i):
        """跳过一个表达式，停在同层的 , } ] ) 上"""
        t, n = s.t, s.n
        while i < n:
            c = t[i]
            if c in "\"'`": _, i = s.string(i); continue
            if t.startswith("//", i) or t.startswith("/*", i): i = s.ws(i); continue
            if c in "([{": i = s.skip_bal(i); continue
            if c in ",)]}": return i
            i += 1
        return n

    def value(s, i):
        t = s.t
        i = s.ws(i)
        if i >= s.n: return Raw(), i
        st = i
        c = t[i]
        if c == "{": v, i = s.obj(i)
        elif c == "[": v, i = s.arr(i)
        elif c in "\"'`":
            v, i = s.string(i)
            while True:   # "a" + "b" 拼接
                j = s.ws(i)
                if j < s.n and t[j] == "+":
                    k = s.ws(j + 1)
                    if k < s.n and t[k] in "\"'`":
                        v2, i = s.string(k); v += v2; continue
                break
        else:
            m = re.compile(r"-?\d+(?:\.\d+)?(?:e[-+]?\d+)?").match(t, i)
            kw = re.compile(r"(true|false|null|undefined)\b").match(t, i)
            if m: v, i = (float(m.group()) if re.search(r"[.e]", m.group()) else int(m.group())), m.end()
            elif kw: v, i = {"true": True, "false": False}.get(kw.group(1)), kw.end()
            else:
                i = s.skip_expr(i); return Raw(t[st:i]), i
        j = s.ws(i)
        if j < s.n and t[j] in "+-*/%?.&|<>=([^":   # 后面还跟着运算：整体当成 Raw
            i = s.skip_expr(j); return Raw(t[st:i]), i
        return v, i

    def obj(s, i):
        t, n = s.t, s.n
        d = {}; i += 1
        while True:
            i = s.ws(i)
            if i >= n: return d, n
            if t[i] == "}": return d, i + 1
            if t[i] == ",": i += 1; continue
            if t.startswith("...", i): i = s.skip_expr(i + 3); continue
            if t[i] in "\"'`": k, i = s.string(i)
            elif t[i] == "[": j = s.skip_bal(i); k = t[i + 1:j - 1]; i = j
            else:
                m = re.compile(r"[\w$]+").match(t, i)
                if not m: i = s.skip_expr(i + 1); continue
                k, i = m.group(), m.end()
                if k in ("async", "get", "set") and re.match(r"\s+[\w$]+\s*\(", t[i:]):
                    m = re.compile(r"\s+([\w$]+)").match(t, i); k, i = m.group(1), m.end()
            i = s.ws(i)
            if i < n and t[i] == ":": v, i = s.value(i + 1)
            elif i < n and t[i] == "(":
                j = s.skip_bal(i); j = s.ws(j)
                if j < n and t[j] == "{": j = s.skip_bal(j)
                v, i = Raw(t[i:j]), j
            else: v = Raw(k)
            d[k] = v

    def arr(s, i):
        t, n = s.t, s.n
        a = []; i += 1
        while True:
            i = s.ws(i)
            if i >= n: return a, n
            if t[i] == "]": return a, i + 1
            if t[i] == ",": i += 1; continue
            v, i = s.value(i); a.append(v)


def find_calls(js_text, fn_regex):
    """找 fn(arg1, {配置}) 调用：返回 [(匹配, arg1值, arg1原文, 配置, 第三参)]"""
    P = JS(js_text); res = []
    for m in re.finditer(fn_regex, js_text):
        i = m.end()
        a1, j = P.value(i)
        raw1 = js_text[i:j].strip()
        j = P.ws(j)
        cfg, opt = None, None
        if j < P.n and js_text[j] == ",":
            cfg, j = P.value(j + 1)
            j = P.ws(j)
            if j < P.n and js_text[j] == ",": opt, j = P.value(j + 1)
        res.append((m, a1, raw1, cfg, opt))
    return res


def resolve_target(a1, raw1, js_text):
    """第一个参数 → 元素 id"""
    if isinstance(a1, str):
        m = re.match(r"\s*#([\w-]+)\s*$", a1)
        return m.group(1) if m else None
    m = re.match(r"([\w$]+)$", raw1)
    if m:
        v = re.escape(m.group(1))
        mm = re.search(v + r"""\s*=\s*document\.(?:getElementById\(\s*["']([\w-]+)|querySelector\(\s*["']#([\w-]+))""", js_text)
        if mm: return mm.group(1) or mm.group(2)
    m = re.search(r"""getElementById\(\s*["']([\w-]+)|querySelector\(\s*["']#([\w-]+)""", raw1)
    if m: return m.group(1) or m.group(2)
    return None


# ======================== HTML 树 ========================
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr", "param"}


class Node:
    __slots__ = ("tag", "a", "kids", "parent")

    def __init__(s, tag, a, parent):
        s.tag, s.a, s.kids, s.parent = tag, a, [], parent

    @property
    def cls(s): return (s.a.get("class") or "").split()

    def has(s, c): return c in s.cls

    def els(s): return [k for k in s.kids if isinstance(k, Node)]

    def walk(s):
        for k in s.kids:
            if isinstance(k, Node):
                yield k
                yield from k.walk()

    def find(s, pred):
        for k in s.walk():
            if pred(k): return k
        return None

    def findall(s, pred): return [k for k in s.walk() if pred(k)]

    def text(s):
        return "".join(k if isinstance(k, str) else k.text() for k in s.kids)


class TreeBuilder(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True)
        s.root = Node("#root", {}, None); s.cur = s.root

    def handle_starttag(s, tag, attrs):
        a = {k: ("" if v is None else v) for k, v in attrs}
        if tag in ("p", "li") and s.cur.tag == tag: s.cur = s.cur.parent
        n = Node(tag, a, s.cur); s.cur.kids.append(n)
        if tag not in VOID: s.cur = n

    def handle_startendtag(s, tag, attrs):
        a = {k: ("" if v is None else v) for k, v in attrs}
        s.cur.kids.append(Node(tag, a, s.cur))

    def handle_endtag(s, tag):
        n = s.cur
        while n is not None and n.tag != tag: n = n.parent
        if n is not None and n.parent is not None: s.cur = n.parent

    def handle_data(s, d): s.cur.kids.append(d)


def parse_html(src):
    b = TreeBuilder(); b.feed(src); b.close(); return b.root


# ======================== 渲染 ========================
BLOCK = {"p", "div", "li", "ul", "ol", "h1", "h2", "h3", "h4", "h5", "h6", "figure", "figcaption", "aside", "details",
         "summary", "section", "article", "table", "thead", "tbody", "tr", "blockquote", "header", "footer", "nav", "main",
         "textarea", "svg", "canvas", "dl", "dt", "dd", "pre", "hr", "form", "fieldset", "legend"}
SKIP_TAGS = {"script", "style", "noscript", "template", "head", "link", "meta", "title"}
SKIP_CLS = {"vl-topbar", "vl-pager", "vl-fab", "vl-navpanel", "vl-readbar", "vl-minimap", "vl-related", "vl-n", "vl-badge",
            "vl-illus-miss"}
KIT_JS = {"vl.js", "diagrams.js", "illus.js", "vl-interact.js", "vl-head.js", "skin.js", "sound.js", "collect.js",
          "companion.js", "graph.js", "terms.js", "vl-concepts.js"}


INLINE = {"span", "b", "strong", "i", "em", "a", "small", "code", "kbd", "mark", "abbr", "q", "sup", "sub", "output", "button",
          "img", "input", "br", "select", "u", "s", "time", "cite", "dfn", "var", "label"}


def ws(t): return re.sub(r"\s+", " ", t).strip()


class Kit:
    def __init__(s, path, src):
        s.path, s.src = path, src
        s.root_dir = os.path.dirname(os.path.abspath(path))
        s.tree = parse_html(src)
        htm = s.tree.find(lambda n: n.tag == "html")
        s.en = bool(htm and (htm.a.get("lang") or "").lower().startswith("en"))
        s.body = s.tree.find(lambda n: n.tag == "body") or s.tree
        s.main = s.body.find(lambda n: n.tag == "main") or s.body
        s.out = []
        s.sec_n = 0
        s.used_quiz = set()
        s.load_js()
        s.figno = {}
        for i, f in enumerate(s.main.findall(lambda n: n.tag == "figure" and n.has("vl-fig")), 1): s.figno[id(f)] = i
        s.figid = {f.a["id"]: s.figno[id(f)] for f in s.main.findall(lambda n: n.tag == "figure" and n.has("vl-fig") and n.a.get("id"))}

    def T(s, zh, en): return en if s.en else zh

    # ---------- 脚本 ----------
    def load_js(s):
        parts = []
        for sc in s.tree.findall(lambda n: n.tag == "script"):
            src = sc.a.get("src")
            if src:
                if re.match(r"(https?:)?//", src) or os.path.basename(src.split("?")[0]) in KIT_JS: continue
                p = os.path.normpath(os.path.join(s.root_dir, src.split("?")[0]))
                if os.path.exists(p):
                    try: parts.append(open(p, encoding="utf-8").read())
                    except Exception: pass
            elif (sc.a.get("type") or "text/javascript").lower() in ("text/javascript", "module", "application/javascript"):
                parts.append(sc.text())
        js = s.js = "\n;\n".join(parts)
        P = JS(js)
        # 插画 alt：任何 f("名字", "alt", …) 形式的调用（VL.illus.add、illusAdd、别名 A(…)）
        s.alt = {}
        for m in re.finditer(r"""[\w$.]+\(\s*(?=["'`])""", js):
            name, j = P.string(m.end())
            j = P.ws(j)
            if j < P.n and js[j] == ",":
                k = P.ws(j + 1)
                if k < P.n and js[k] in "\"'`":
                    alt, _ = P.string(k)
                    if re.match(r"^[\w-]+$", name): s.alt[name] = alt
        # 概念数据
        s.concepts = {}
        m = re.search(r"VL_CONCEPTS\s*=\s*", js)
        if m:
            data, _ = P.value(m.end())
            if isinstance(data, dict):
                for c in (data.get("items") or []) + (data.get("terms") or []):
                    if isinstance(c, dict) and isinstance(c.get("id"), str): s.concepts.setdefault(c["id"], c)
        # 图解、测验、动手题、综合关、小游戏
        s.diagrams, s.quizzes, s.tasks, s.games = {}, {}, {}, {}
        for m, a1, raw1, cfg, opt in find_calls(js, r"VL\.diagram\.(\w+)\(\s*"):
            tid = resolve_target(a1, raw1, js)
            if tid and isinstance(cfg, dict): s.diagrams[tid] = (m.group(1), cfg)
        for m, a1, raw1, cfg, opt in find_calls(js, r"VL\.quiz\(\s*"):
            tid = resolve_target(a1, raw1, js)
            if isinstance(cfg, list): s.quizzes.setdefault(tid or "#?%d" % len(s.quizzes), []).append((cfg, opt if isinstance(opt, dict) else {}))
        for m, a1, raw1, cfg, opt in find_calls(js, r"VL\.(task|review)\(\s*"):
            tid = resolve_target(a1, raw1, js)
            if tid and isinstance(cfg, dict): s.tasks[tid] = (m.group(1), cfg)
        for m, a1, raw1, cfg, opt in find_calls(js, r"VL\.game\(\s*"):
            tid = resolve_target(a1, raw1, js)
            if tid and isinstance(cfg, dict): s.games[tid] = cfg

    # ---------- 输出 ----------
    def emit(s, ind, t, pre=""):
        t = ws(t)
        if t: s.out.append("  " * ind + pre + t)

    def h2t(s, frag):
        """配置里的 HTML 字符串 → 文本（保留荧光笔、着重等标记）"""
        if not isinstance(frag, str): return ""
        if "<" not in frag and "&" not in frag: return ws(frag)
        return ws(s.inline(parse_html(frag)))

    # ---------- 行内 ----------
    def hidden(s, n):
        return "hidden" in n.a or n.a.get("aria-hidden") == "true" or any(c in SKIP_CLS for c in n.cls)

    def illus(s, name):
        a = s.alt.get(name)
        return "[%s：%s]" % (s.T("插画", "Picture"), a) if a else "[%s %s：%s]" % (s.T("插画", "Picture"), name, s.T("（没找到 alt）", "(alt not found)"))

    def inline(s, n):
        if isinstance(n, str): return n
        if n.tag in SKIP_TAGS: return ""
        if n.tag != "#root" and s.hidden(n): return ""
        a = n.a
        if a.get("data-illus"): return " " + s.illus(a["data-illus"]) + " "
        if n.tag == "br": return " "
        if n.tag == "img": return " [%s：%s] " % (s.T("图片", "Image"), a.get("alt", ""))
        if n.tag in ("svg", "canvas"):
            lab = a.get("aria-label")
            return " [%s：%s] " % (s.T("图", "Figure"), lab) if lab else ""
        if n.tag == "input":
            if a.get("type") == "range": return " [%s] " % s.T("滑块", "slider")
            if a.get("type") in ("checkbox", "radio"): return " [□] "
            return " [%s] " % s.T("输入框", "input")
        if n.tag == "textarea": return " [%s] " % s.T("文本框", "text box")
        if n.tag == "select": return " [%s：%s] " % (s.T("下拉框", "dropdown"), "｜".join(ws(o.text()) for o in n.findall(lambda x: x.tag == "option")))
        inner = "".join(s.inline(k) for k in n.kids)
        if n.tag == "button": return " [%s：%s] " % (s.T("按钮", "button"), ws(inner))
        if a.get("data-figref"):
            k = s.figid.get(a["data-figref"])
            return s.T("图 %s" % k, "Figure %s" % k) if k else inner
        if n.has("vl-stamp"): return " [%s：%s] " % (s.T("印章", "stamp"), ws(inner))
        if n.has("vl-cn"): return "【" + ws(inner) + "】"
        if n.has("vl-em"): return "「" + ws(inner) + "」"
        if n.has("vl-term") and a.get("data-def"):
            return inner + "〔%s：%s〕" % (s.T("释义", "gloss"), a["data-def"])
        if n.tag == "sup": return "^" + inner
        if n.tag == "sub": return "_" + inner
        return inner

    def is_block(s, n):
        if isinstance(n, str): return False
        if n.tag in INLINE and not (n.tag == "label" and n.find(lambda x: x.tag in BLOCK and x.tag != "label")): return False
        if n.tag in BLOCK: return True
        return any(c.startswith("vl-") for c in n.cls) and not (n.has("vl-cn") or n.has("vl-em") or n.has("vl-term") or n.has("vl-illus"))

    # ---------- 块 ----------
    def children(s, n, ind, pre="", skip=()):
        buf = []
        state = {"pre": pre}

        def flush():
            t = ws("".join(buf)); buf.clear()
            if t: s.emit(ind, t, state["pre"]); state["pre"] = ""
        kids = n.kids
        i = 0
        while i < len(kids):
            k = kids[i]
            if isinstance(k, Node) and (k in skip or k.tag in SKIP_TAGS):
                i += 1; continue
            if isinstance(k, Node) and k.has("vl-eg") and not s.hidden(k):
                flush()
                run = []
                j = i
                while j < len(kids):
                    kk = kids[j]
                    if isinstance(kk, str) and not kk.strip(): j += 1; continue
                    if isinstance(kk, Node) and kk.has("vl-eg"): run.append(kk); j += 1; continue
                    break
                s.eg_run(run, ind)
                i = j; continue
            if s.is_block(k):
                flush()
                s.block(k, ind, state["pre"]); state["pre"] = ""
            else:
                buf.append(s.inline(k))
            i += 1
        flush()

    def block(s, n, ind, lead=""):
        if n.tag in SKIP_TAGS or s.hidden(n): return
        if lead and not (n.tag in ("div", "p", "section", "article") and not any(c.startswith("vl-") for c in n.cls)):
            s.out.append("  " * ind + lead.rstrip()); lead = ""
        c, a, T = n.cls, n.a, s.T
        # ---- 按组件 ----
        if "vl-sec" in c: return s.sec(n, ind)
        if "vl-goals" in c: return s.goals(n, ind)
        if "vl-cc" in c: return s.cc(n, ind)
        if "vl-why" in c:
            h = n.find(lambda x: x.tag in ("h3", "h4"))
            s.emit(ind, "[%s：%s]" % (a.get("data-tag") or T("原理框", "Why it works"), ws(s.inline(h)) if h else ""))
            return s.children(n, ind + 1, skip=(h,))
        if n.tag == "details" and ("vl-story" in c or "vl-side" in c): return s.side(n, ind)
        if "vl-chain" in c:
            items = [ws(s.inline(li)) for li in n.els() if li.tag == "li" and not li.has("vl-chain-ar")]
            return s.emit(ind, " → ".join(x for x in items if x), "[%s] " % T("演化链", "Chain"))
        if "vl-timeline" in c:
            s.emit(ind, "[%s]" % T("时间线", "Timeline"))
            for ev in n.els():
                if not s.hidden(ev): s.emit(ind + 1, s.inline(ev), "- ")
            return
        if n.tag == "figure" and "vl-hot" in c: return s.hot(n, ind)
        if n.tag == "figure" and "vl-fig" in c: return s.figure(n, ind)
        if "vl-task" in c or "vl-review" in c: return s.task(n, ind)
        if a.get("id") in s.games: return s.game(n, ind)
        if "vl-steps" in c: return s.steps(n, ind)
        if "vl-anat" in c: return s.anat(n, ind)
        if "vl-guess" in c: return s.guess(n, ind)
        if "vl-try" in c: return s.tri(n, ind)
        if "vl-board" in c: return s.board(n, ind)
        if "vl-compare" in c: return s.compare(n, ind)
        if "vl-flip" in c: return s.flip(n, ind)
        if "vl-comic" in c: return s.comic(n, ind)
        if "vl-doc" in c: return s.doc(n, ind)
        if "vl-philo" in c: return s.philo(n, ind)
        if "vl-vote" in c:
            return s.emit(ind, "[%s：%s]" % (T("投票", "Vote"), (a.get("data-options") or "").replace("|", "｜")))
        if "vl-misc" in c or "vl-key" in c:
            lab, first = None, None
            for k in n.els():
                if k.tag == "p" and len(k.els()) == 1 and k.els()[0].tag in ("b", "strong") and ws(k.text()) == ws(k.els()[0].text()):
                    lab, first = ws(k.text()), k
                break
            lab = lab or (T("常见误区", "Misconceptions") if "vl-misc" in c else T("要点", "Key points"))
            s.emit(ind, "[%s]" % lab)
            return s.children(n, ind + 1, skip=(first,) if first else ())
        if "vl-tldr" in c:
            b = n.els()[0] if n.els() and n.els()[0].tag in ("b", "strong") else None
            lab = ws(b.text()) if b else T("一句话", "In one line")
            return s.children(n, ind, pre="[%s] " % lab, skip=(b,) if b else ())
        if n.tag == "textarea":
            if "vl-note" in c: return s.emit(ind, "[%s：%s]" % (T("笔记框，自动保存", "Notes box, autosaved"), a.get("placeholder", "")))
            return s.emit(ind, "[%s：%s]" % (T("文本框", "Text box"), a.get("placeholder", "")))
        if a.get("id") in s.quizzes: s.children(n, ind); return s.quiz(a["id"], ind)
        # ---- 按标签 ----
        t = n.tag
        if t == "h1":
            badge = s.main.find(lambda x: x.has("vl-badge"))
            chap = ws(badge.text()) if badge else s.chap_label()
            return s.emit(ind, ws(s.inline(n)), "# " + (chap + " " if chap else ""))
        if t in ("h2", "h3", "h4", "h5", "h6"): return s.emit(ind, ws(s.inline(n)), "#" * int(t[1]) + " ")
        if t in ("ul", "ol"):
            k = 0
            for li in n.els():
                if li.tag == "li" and not s.hidden(li):
                    k += 1; s.children(li, ind, pre=("%d. " % k) if t == "ol" else "- ")
            return
        if t == "li": return s.children(n, ind, pre="- ")
        if t in ("svg", "canvas"):
            lab = a.get("aria-label")
            return s.emit(ind, "[%s：%s]" % (T("图", "Figure"), lab)) if lab else None
        if t == "table":
            for tr in n.findall(lambda x: x.tag == "tr"):
                cells = [ws(s.inline(td)) for td in tr.els() if td.tag in ("td", "th")]
                s.emit(ind, "| " + " | ".join(cells) + " |")
            return
        if t == "pre":
            for line in n.text().splitlines():
                if line.strip(): s.out.append("  " * ind + "    " + line.rstrip())
            return
        if t == "hr": return
        if t == "details":
            sm = next((k for k in n.els() if k.tag == "summary"), None)
            s.emit(ind, "[%s：%s]" % (T("收起", "Collapsed"), ws(s.inline(sm)) if sm else ""))
            s.emit(ind + 1, T("（展开后）", "(when opened)"))
            return s.children(n, ind + 1, skip=(sm,) if sm else ())
        pre = ""
        if "vl-sub" in c: pre = T("副标题：", "Subtitle: ")
        elif "vl-src" in c: pre = T("（注）", "(Note) ")
        elif "vl-msg" in c: pre = T("反馈句：", "Feedback line: ")
        elif "vl-doc-meta" in c: pre = T("（抬头）", "(Header) ")
        elif "vl-doc-sign" in c: pre = T("（落款）", "(Signed) ")
        elif "vl-stamp" in c: pre = T("（印章）", "(Stamp) ")
        elif "vl-philo-q" in c: pre = T("问题：", "Question: ")
        elif "vl-time" in c: pre = T("用时：", "Time: ")
        elif t == "figcaption": pre = T("图注：", "Caption: ")
        elif t == "blockquote": pre = "> "
        return s.children(n, ind, pre=lead + pre)

    def chap_label(s):
        ch = s.body.a.get("data-ch")
        if not ch:
            m = re.match(r"ch(\d+)", os.path.basename(s.path))
            ch = str(int(m.group(1))) if m else None
        return (s.T("第%s章" % ch, "Chapter %s" % ch)) if ch else ""

    def sec(s, n, ind):
        s.sec_n += 1
        h = n.find(lambda x: x.tag in ("h2", "h3"))
        s.out.append("")
        s.emit(0, ws(s.inline(h)) if h else "", "## %d. " % s.sec_n)
        lines = n.a.get("data-lines-en" if s.en and n.a.get("data-lines-en") else "data-lines")
        if lines: s.emit(1, lines.replace("|", "｜"), "[%s] " % s.T("陪伴角色台词（点角色时说）", "Companion lines (on click)"))
        s.children(n, ind, skip=(h,) if h else ())

    def goals(s, n, ind):
        h = n.find(lambda x: x.tag in ("h3", "h4"))
        tm = n.find(lambda x: x.has("vl-time"))
        lab = ws(s.inline(h)) if h else s.T("读完你能", "By the end you can")
        s.emit(ind, "[%s：%s%s]" % (s.T("学习目标", "Goals"), lab, ("｜" + ws(tm.text())) if tm else ""))
        s.children(n, ind + 1, skip=tuple(x for x in (h, tm) if x))

    def cc(s, n, ind):
        T = s.T
        f = lambda k: n.find(lambda x: x.has("vl-cc-" + k))
        data = s.concepts.get(n.a.get("data-concept"), {})

        def pick(k, cls):
            el = f(cls)
            if el is not None and ws(el.text()): return ws(s.inline(el))
            if s.en: v = data.get(k + "En") or (data.get("en") if k == "zh" else None)
            else: v = data.get(k)
            if k == "zh" and s.en: v = data.get("en") or data.get("zh")
            return s.h2t(v) if isinstance(v, str) else ""
        name = pick("zh", "name")
        other = (ws(s.inline(f("en"))) if f("en") is not None else "") or s.h2t(data.get("zh" if s.en else "en"))
        df, eg, plain, by = pick("def", "def"), pick("eg", "eg"), pick("plain", "plain"), pick("by", "by")
        head = name + ("（%s）" % other if other and other != name else "")
        s.emit(ind, "[%s：%s — %s — %s%s]" % (n.a.get("data-tag") or T("概念卡", "Concept card"), head, df or T("（未写）", "(none)"), T("例子：", "Example: "), eg or T("（未写）", "(none)")))
        if plain: s.emit(ind + 1, plain, T("通俗地说：", "In plain words: "))
        by = re.sub(r"^(出处|Source)\s*[：:]\s*", "", by)
        if by: s.emit(ind + 1, by, T("出处：", "Source: "))
        fig = f("fig")
        if fig is not None: s.children(fig, ind + 1)
        elif data.get("illus"): s.emit(ind + 1, s.illus(data["illus"]))
        else: s.emit(ind + 1, T("[缺概念图]", "[concept picture missing]"))
        done = {id(x) for x in (f("name"), f("en"), f("def"), f("eg"), f("plain"), f("by"), fig) if x is not None}
        rest = [k for k in n.els() if id(k) not in done]
        for k in rest: s.block(k, ind + 1) if s.is_block(k) else s.emit(ind + 1, s.inline(k))

    def side(s, n, ind):
        T = s.T
        KIND = {"story": ("发明故事", "Invention story"), "history": ("历史", "History"), "math": ("数学", "Maths"),
                "play": ("多玩一会儿", "Play more"), "debate": ("争议", "Debate"), "source": ("原始文献", "Original source"),
                "extra": ("加练", "Extra practice"), "more": ("延伸", "Going further")}
        kind = "story" if n.has("vl-story") else n.a.get("data-kind", "")
        lab = n.a.get("data-tag") or (T(*KIND[kind]) if kind in KIND else T("选读", "Optional"))
        sm = next((k for k in n.els() if k.tag == "summary"), None)
        hook = intro = ""
        if sm is not None:
            b = sm.find(lambda x: x.tag in ("b", "strong"))
            sml = sm.find(lambda x: x.tag == "small")
            hook = ws(s.inline(b)) if b else ws(s.inline(sm))
            intro = ws(s.inline(sml)) if sml else ""
        s.emit(ind, "[%s·%s：%s%s]" % (T("收起", "Collapsed"), lab, hook, (" — " + intro) if intro else ""))
        s.emit(ind + 1, T("（展开后）", "(when opened)"))
        s.children(n, ind + 1, skip=(sm,) if sm else ())

    def eg_run(s, run, ind):
        T = s.T
        K = len(run)
        if K > 1: s.emit(ind, "[%s]" % T("例子轮播：共 %d 个，横向切换" % K, "Example carousel: %d, side by side" % K))
        for i, e in enumerate(run, 1):
            tab = e.a.get("data-t")
            if not tab:
                b = e.find(lambda x: x.tag in ("b", "strong")); tab = ws(b.text())[:14] if b else ""
            kind = T("反例", "Counterexample") if e.has("bad") else T("例子", "Example")
            s.emit(ind, "[%s %d/%d：%s]" % (kind, i, K, tab))
            s.children(e, ind + 1)

    # ---------- 图 ----------
    def figure(s, n, ind):
        T = s.T
        no = s.figno.get(id(n))
        lab = T("图 %s" % no, "Figure %s" % no) if no else T("图", "Figure")
        cap = next((k for k in n.els() if k.tag == "figcaption"), None)
        capt = ws(s.inline(cap)) if cap is not None else ""
        dtype, cfg = n.a.get("data-diagram"), None
        if dtype:
            sc = next((k for k in n.els() if k.tag == "script"), None)
            try: cfg = json.loads(sc.text()) if sc is not None else None
            except Exception: cfg = None
        elif n.a.get("id") in s.diagrams:
            dtype, cfg = s.diagrams[n.a["id"]]
        if dtype:
            if not capt and isinstance(cfg, dict): capt = s.h2t(cfg.get("caption"))
            s.emit(ind, "[%s·%s（%s）%s]" % (lab, T("图解", "Diagram"), dtype, ("：" + capt) if capt else ""))
            if isinstance(cfg, dict): s.diagram_body(dtype, cfg, ind + 1)
            else: s.emit(ind + 1, T("（数据读不到）", "(data not readable)"))
            return
        kids = [k for k in n.kids if not (isinstance(k, str) and not k.strip()) and k is not cap]
        media = []

        def only_media(k):
            if isinstance(k, str): return False
            if k.tag in SKIP_TAGS or s.hidden(k): return True
            if k.a.get("data-illus"):
                media.append(s.illus(k.a["data-illus"])); return True
            if k.tag in ("svg", "canvas"):
                media.append("[%s]" % (k.a.get("aria-label") or T("无 aria-label 的图", "unlabelled graphic"))); return True
            if k.tag == "img":
                media.append("[%s：%s]" % (T("图片", "Image"), k.a.get("alt", ""))); return True
            if k.tag in ("div", "span", "a", "picture") and not any(c.startswith("vl-") and c not in ("vl-illus", "vl-scroll") for c in k.cls):
                return all(only_media(x) or (isinstance(x, str) and not x.strip()) for x in k.kids)
            return False
        if kids and all(only_media(k) for k in kids):
            s.emit(ind, "[%s：%s%s]" % (lab, " ".join(media), (" — " + T("图注：", "caption: ") + capt) if capt else ""))
            return
        s.emit(ind, "[%s]" % lab)
        s.children(n, ind + 1, skip=(cap,) if cap is not None else ())
        if capt: s.emit(ind + 1, capt, T("图注：", "Caption: "))

    def diagram_body(s, dtype, cfg, ind):
        T = s.T
        if cfg.get("demo"): s.emit(ind, T("（示意）", "(illustrative)"))
        if cfg.get("label"): s.emit(ind, s.h2t(cfg["label"]), T("读屏说明：", "Screen-reader label: "))
        if isinstance(cfg.get("legend"), str): s.emit(ind, s.h2t(cfg["legend"]), T("图例：", "Legend: "))
        for ax in ("x", "y"):
            v = cfg.get(ax)
            if isinstance(v, dict):
                bits = [s.h2t(v.get("name"))] + ["%s ↔ %s" % (s.h2t(v.get("lo")), s.h2t(v.get("hi")))] if (v.get("lo") or v.get("hi")) else [s.h2t(v.get("name"))]
                s.emit(ind, T("，", ", ").join(b for b in bits if b), T("%s 轴：" % ax, "%s axis: " % ax))
        if isinstance(cfg.get("name"), str) and dtype == "spectrum": s.emit(ind, s.h2t(cfg["name"]), T("轴：", "Axis: "))
        if isinstance(cfg.get("center"), str): s.emit(ind, s.h2t(cfg["center"]), T("中心：", "Centre: "))
        names = {}

        def ent(d):
            nm, eg = s.h2t(d.get("name")), s.h2t(d.get("eg"))
            t = nm + ("（%s）" % eg if eg and nm else eg)
            if isinstance(d.get("edge"), str): t = "〔%s〕" % s.h2t(d["edge"]) + t
            if isinstance(d.get("value"), (int, float)): t += " = %s%s" % (d["value"], cfg.get("unit") or "")
            if isinstance(d.get("weights"), list): t += T("；砝码：", "; weights: ") + T("、", ", ").join(s.h2t(w) for w in d["weights"] if isinstance(w, str))
            if isinstance(d.get("in"), list): t += T("〔在第 %s 个圈里〕" % "、".join(str(x + 1) for x in d["in"] if isinstance(x, int)), " [in circle %s]" % ", ".join(str(x + 1) for x in d["in"] if isinstance(x, int)))
            if isinstance(d.get("at"), (int, float)) and dtype in ("spectrum", "timeline"): t += " @%s" % d["at"]
            if isinstance(d.get("info"), str): t += T("｜点开：", " | on click: ") + s.h2t(d["info"])
            return t

        def walk(v, depth, key="", top=False):
            if isinstance(v, list):
                for qi, x in enumerate(v): walk(x, depth, "quad%d" % qi if key == "quads" else key)
            elif isinstance(v, dict):
                if isinstance(v.get("k"), str) and ("a" in v or "b" in v):
                    s.emit(ind + depth, "%s：%s ／ %s%s" % (s.h2t(v["k"]), s.h2t(v.get("a")), s.h2t(v.get("b")),
                                                       (T("｜点开：", " | on click: ") + s.h2t(v["info"])) if isinstance(v.get("info"), str) else ""), "- ")
                    return
                if "from" in v and "to" in v:
                    arrow = {"link": " — ", "both": " ↔ "}.get(v.get("kind"), " → ")
                    s.emit(ind + depth, names.get(v["from"], str(v["from"])) + arrow + names.get(v["to"], str(v["to"])) + (("：" + s.h2t(v["label"])) if isinstance(v.get("label"), str) else ""), "- ")
                    return
                if not top and isinstance(v.get("name"), str) or (not top and isinstance(v.get("eg"), str) and key in ("regions", "items", "quads")) or (isinstance(v.get("label"), str) and key == "points"):
                    if isinstance(v.get("id"), str): names[v["id"]] = s.h2t(v.get("name"))
                    t = ent(v) if (v.get("name") or v.get("eg")) else s.h2t(v.get("label"))
                    pre = {"a": "A ", "b": "B ", "left": T("左：", "Left: "), "right": T("右：", "Right: "), "pivot": T("支点：", "Pivot: "),
                           "lo": T("低端：", "Low end: "), "hi": T("高端：", "High end: "), "root": "", "total": T("合计：", "Total: "),
                           "quad0": T("左上：", "Top left: "), "quad1": T("右上：", "Top right: "), "quad2": T("左下：", "Bottom left: "), "quad3": T("右下：", "Bottom right: ")}.get(key, "")
                    s.emit(ind + depth, pre + t, "- ")
                    if isinstance(v.get("children"), list): walk(v["children"], depth + 1, "children")
                    return
                for k2, x in v.items():
                    if k2 in ("caption", "label", "legend", "x", "y", "center", "info", "hint", "name", "unit", "slider", "aspect", "dots", "hits", "curve", "c"): continue
                    if dtype == "spectrum" and k2 in ("lo", "hi") or isinstance(x, (dict, list)): walk(x, depth, k2)
                    elif isinstance(x, str) and k2 == "total": s.emit(ind + depth, T("合计：", "Total: ") + s.h2t(x), "- ")
        # 网络图先登记节点名
        for nd in cfg.get("nodes") or []:
            if isinstance(nd, dict) and isinstance(nd.get("id"), str): names[nd["id"]] = s.h2t(nd.get("name"))
        walk(cfg, 0, top=True)
        sl = cfg.get("slider")
        if isinstance(sl, dict): s.emit(ind, "%s %s–%s%s" % (s.h2t(sl.get("label")), sl.get("min"), sl.get("max"), sl.get("unit") or ""), "[%s] " % T("滑块", "Slider"))

    def hot(s, n, ind):
        T = s.T
        no = s.figno.get(id(n))
        svg = n.find(lambda x: x.tag == "svg")
        s.emit(ind, "[%s·%s：%s]" % (T("图 %s" % no, "Figure %s" % no), T("热区图，点一块看解释", "Hotspot figure, tap a part"), (svg.a.get("aria-label") if svg is not None else "") or ""))
        if n.a.get("data-hint"): s.emit(ind + 1, n.a["data-hint"], T("提示：", "Hint: "))
        texts = {k.a.get("data-for"): k for k in n.findall(lambda x: x.has("vl-hot-text"))}
        for h in n.findall(lambda x: x.a.get("data-hot")):
            key = h.a["data-hot"]
            nm = h.a.get("data-name") or ws(h.text())
            tx = ws(s.inline(texts[key])) if key in texts else s.h2t(h.a.get("data-info"))
            s.emit(ind + 1, "%s：%s" % (nm, tx), "- ")
        img = n.find(lambda x: x.tag == "img")
        if img is not None: s.emit(ind + 1, "[%s：%s]" % (T("图片", "Image"), img.a.get("alt", "")))
        cap = next((k for k in n.els() if k.tag == "figcaption"), None)
        if cap is not None: s.emit(ind + 1, ws(s.inline(cap)), T("图注：", "Caption: "))

    # ---------- 互动 ----------
    def try_text(s, t):
        return ws(s.inline(t))

    def tri(s, n, ind):
        s.emit(ind, "[%s：%s]" % (s.T("试试看", "Try it"), s.try_text(n)))
        if n.a.get("data-done"): s.emit(ind + 1, n.a["data-done"], s.T("（完成时显示）", "(shown when done) "))

    def board(s, n, ind):
        T = s.T
        h = next((k for k in n.els() if k.tag in ("h3", "h4")), None)
        tries = n.findall(lambda x: x.has("vl-try"))
        title = ws(s.inline(h)) if h else (n.a.get("aria-label") or T("（无标题）", "(untitled)"))
        tt = T("；", "; ").join(s.try_text(t) for t in tries)
        s.emit(ind, "[%s：%s — %s]" % (T("互动", "Interactive"), title, (T("试试看：", "Try it: ") + tt) if tt else T("（无试试看任务）", "(no Try-it task)")))
        for t in tries:
            if t.a.get("data-done"): s.emit(ind + 1, t.a["data-done"], T("（完成时显示）", "(shown when done) "))
        s.children(n, ind + 1, skip=tuple([h] + tries) if h else tuple(tries))

    def tryid_text(s, tid):
        if not isinstance(tid, str): return ""
        t = s.main.find(lambda x: x.has("vl-try") and x.a.get("data-try") == tid)
        return s.try_text(t) if t is not None else ""

    def task(s, n, ind):
        T = s.T
        kind, cfg = s.tasks.get(n.a.get("id"), (None, None))
        if cfg is None:
            sc = next((k for k in n.els() if k.tag == "script"), None)
            try: cfg = json.loads(sc.text()) if sc is not None else None
            except Exception: cfg = None
            kind = "review" if n.has("vl-review") else "task"
        lab = T("篇末综合关", "Part review") if kind == "review" else T("动手题", "Hands-on task")
        cfg = cfg if isinstance(cfg, dict) else {}
        title = s.h2t(cfg.get("title")) or n.a.get("aria-label") or ""
        tt = s.tryid_text(cfg.get("tryId"))
        s.emit(ind, "[%s·%s：%s — %s]" % (T("互动", "Interactive"), lab, title, (T("试试看：", "Try it: ") + tt) if tt else T("（无试试看任务）", "(no Try-it task)")))
        if cfg.get("intro"): s.emit(ind + 1, s.h2t(cfg["intro"]))
        if isinstance(cfg.get("can"), list):
            s.emit(ind + 1, T("；", "; ").join(s.h2t(x) for x in cfg["can"]), T("你现在能看懂：", "You can now make sense of: "))
        TY = {"sort": ("分拣", "sort"), "order": ("排序", "order"), "pair": ("配对", "pair"), "range": ("调到区间", "range"), "judge": ("逐条判定", "judge")}
        for i, r in enumerate(cfg.get("rounds") or [], 1):
            if not isinstance(r, dict): continue
            ty = r.get("type")
            s.emit(ind + 1, s.h2t(r.get("prompt")), T("第 %d 题（%s）：" % (i, T(*TY.get(ty, (ty, ty)))), "Task %d (%s): " % (i, T(*TY.get(ty, (ty, ty))))))
            d = ind + 2
            if r.get("claim"): s.emit(d, s.h2t(r["claim"]), T("要划掉的错误论断：", "Claim to strike out: "))
            if ty == "sort":
                bins = [s.h2t(b) for b in r.get("bins") or []]
                s.emit(d, "｜".join(bins), T("框：", "Bins: "))
                for it in r.get("items") or []:
                    if isinstance(it, dict):
                        b = it.get("bin")
                        s.emit(d, "%s → %s%s" % (s.h2t(it.get("t")), bins[b] if isinstance(b, int) and b < len(bins) else b, ("（%s）" % s.h2t(it.get("why"))) if it.get("why") else ""), "- ")
            elif ty == "order":
                s.emit(d, T("正确顺序：", "Correct order:"))
                for k, it in enumerate(r.get("items") or [], 1):
                    if isinstance(it, dict): s.emit(d, "%s%s" % (s.h2t(it.get("t")), ("（%s）" % s.h2t(it.get("why"))) if it.get("why") else ""), "%d. " % k)
            elif ty == "pair":
                for it in r.get("pairs") or []:
                    if isinstance(it, dict): s.emit(d, "%s ↔ %s%s" % (s.h2t(it.get("l")), s.h2t(it.get("r")), ("（%s）" % s.h2t(it.get("why"))) if it.get("why") else ""), "- ")
            elif ty == "range":
                tg = r.get("target") or ["?", "?"]
                u = r.get("unit") or ""
                s.emit(d, "%s %s–%s%s，%s %s–%s%s" % (s.h2t(r.get("label")), r.get("min"), r.get("max"), u, T("目标", "target"), tg[0], tg[1] if len(tg) > 1 else "?", u), "[%s] " % T("滑块", "Slider"))
                if isinstance(r.get("ends"), list): s.emit(d, " ↔ ".join(s.h2t(x) for x in r["ends"]), T("两端：", "Ends: "))
                if r.get("low"): s.emit(d, s.h2t(r["low"]), T("偏小时：", "Too low: "))
                if r.get("high"): s.emit(d, s.h2t(r["high"]), T("偏大时：", "Too high: "))
            elif ty == "judge":
                vs = [s.h2t(v) for v in r.get("verdicts") or []]
                s.emit(d, "｜".join(vs), T("判断选项：", "Verdicts: "))
                for it in r.get("cards") or []:
                    if isinstance(it, dict):
                        a = it.get("a")
                        s.emit(d, "%s → %s%s%s" % (s.h2t(it.get("t")), T("本书判断：", "our verdict: "), vs[a] if isinstance(a, int) and a < len(vs) else a,
                                                  ("（%s）" % s.h2t(it.get("why"))) if it.get("why") else ""), "- ")
                        if it.get("hint"): s.emit(d + 1, s.h2t(it["hint"]), T("判错时提示：", "Hint when wrong: "))
            if isinstance(r.get("hints"), list): s.emit(d, " → ".join(s.h2t(h) for h in r["hints"]), T("提示：", "Hints: "))
            if r.get("ok"): s.emit(d, s.h2t(r["ok"]), T("做对后：", "When right: "))
            if r.get("miss"): s.emit(d, s.h2t(r["miss"]), T("答错时：", "When wrong: "))
        if cfg.get("done"): s.emit(ind + 1, s.h2t(cfg["done"]), T("全部做完：", "When all done: "))
        s.children(n, ind + 1, skip=tuple(k for k in n.els() if k.tag == "script"))

    def game(s, n, ind):
        T = s.T
        cfg = s.games[n.a["id"]]
        tt = s.tryid_text(cfg.get("tryId"))
        fold = cfg.get("fold")
        if fold:
            f = fold if isinstance(fold, dict) else {"t": fold}
            ft = re.sub(r"^(多玩一会儿|Play more)\s*[：:]\s*", "", s.h2t(f.get("t")))
            s.emit(ind, "[%s·%s：%s%s]" % (T("收起", "Collapsed"), T("多玩一会儿", "Play more"), ft, (" — " + s.h2t(f.get("d"))) if f.get("d") else ""))
            s.emit(ind + 1, T("（展开后）", "(when opened)")); ind += 1
        s.emit(ind, "[%s·%s：%s — %s]" % (T("互动", "Interactive"), T("小游戏", "Mini-game"), s.h2t(cfg.get("title")), (T("试试看：", "Try it: ") + tt) if tt else T("（无试试看任务）", "(no Try-it task)")))
        if cfg.get("rules"): s.emit(ind + 1, s.h2t(cfg["rules"]), T("规则：", "Rules: "))
        if cfg.get("vs"): s.emit(ind + 1, s.h2t(cfg["vs"]), T("对手：", "Opponent: "))
        if isinstance(cfg.get("hud"), list):
            s.emit(ind + 1, T("、", ", ").join(s.h2t(h[1]) for h in cfg["hud"] if isinstance(h, list) and len(h) > 1), T("读数：", "Readouts: "))
        for i, r in enumerate(cfg.get("rounds") or [], 1):
            if isinstance(r, dict): s.emit(ind + 1, "%s：%s" % (s.h2t(r.get("name")), s.h2t(r.get("goal"))), T("第 %d 局 " % i, "Round %d " % i))
        if cfg.get("keysLabel"): s.emit(ind + 1, s.h2t(cfg["keysLabel"]), T("键盘：", "Keys: "))
        if isinstance(cfg.get("review"), Raw): s.emit(ind + 1, T("（通关后有复盘，由脚本生成）", "(a debrief appears after the last round; generated by script)"))
        s.children(n, ind + 1)

    def steps(s, n, ind):
        T = s.T
        svg = n.find(lambda x: x.tag in ("svg", "canvas") and x.a.get("aria-label"))
        s.emit(ind, "[%s·%s：%s]" % (T("互动", "Interactive"), T("逐步演示，可播放、可一步步翻", "Step-through, play or step"), svg.a["aria-label"] if svg is not None else ""))
        lst = n.find(lambda x: x.has("vl-steps-list"))
        stage = n.find(lambda x: x.has("vl-steps-stage"))
        if lst is not None:
            for i, li in enumerate([k for k in lst.els() if k.tag == "li"], 1): s.children(li, ind + 1, pre=T("第 %d 步：" % i, "Step %d: " % i))
        if stage is not None:
            for il in stage.findall(lambda x: x.a.get("data-illus")): s.emit(ind + 1, s.illus(il.a["data-illus"]))
        s.children(n, ind + 1, skip=tuple(x for x in (lst, stage) if x is not None))

    def anat(s, n, ind):
        T = s.T
        f = n.find(lambda x: x.has("vl-anat-f"))
        key = n.find(lambda x: x.has("vl-anat-key"))
        s.emit(ind, "[%s：%s]" % (T("公式拆解，片段与解释同色联动", "Formula anatomy, parts and notes linked by colour"), ws(s.inline(f)) if f is not None else ""))
        if key is not None:
            for li in key.els():
                if li.tag == "li": s.children(li, ind + 1, pre="- ")
        s.children(n, ind + 1, skip=tuple(x for x in (f, key) if x is not None))

    def guess(s, n, ind):
        T = s.T
        mode = n.a.get("data-mode") or "think"
        q = n.find(lambda x: x.has("vl-q"))
        ans = n.find(lambda x: x.has("vl-ans"))
        opts = n.find(lambda x: x.has("vl-opts"))
        qt = ws(s.inline(q)) if q is not None else ""
        ML = {"think": ("想一想", "think"), "pick": ("选一个", "pick one"), "estimate": ("估一估", "estimate")}
        extra = ""
        if mode == "estimate":
            a = n.a
            extra = T("（滑块 %s–%s%s%s，答案 %s%s）" % (a.get("data-min"), a.get("data-max"), a.get("data-unit", ""), "，对数刻度" if a.get("data-scale") == "log" else "", a.get("data-answer"), a.get("data-unit", "")),
                      " (slider %s–%s%s%s, answer %s%s)" % (a.get("data-min"), a.get("data-max"), a.get("data-unit", ""), ", log scale" if a.get("data-scale") == "log" else "", a.get("data-answer"), a.get("data-unit", "")))
        s.emit(ind, "[%s·%s：%s]%s" % (T("先猜后揭晓", "Guess, then reveal"), T(*ML.get(mode, (mode, mode))), qt, extra))
        if opts is not None:
            for li in opts.els():
                if li.tag != "li": continue
                fb = li.find(lambda x: x.has("vl-fb"))
                main = ws("".join(s.inline(k) for k in li.kids if k is not fb))
                mark = " ✓" if "data-right" in li.a else ""
                s.emit(ind + 1, main + mark + ((T("｜反馈：", " | feedback: ") + ws(s.inline(fb))) if fb is not None else ""), "- ")
        if ans is not None:
            s.emit(ind + 1, T("（揭晓后）", "(after reveal)"))
            s.children(ans, ind + 2)
        s.children(n, ind + 1, skip=tuple(x for x in (q, ans, opts) if x is not None))

    def compare(s, n, ind):
        T = s.T
        mode = n.a.get("data-mode") or "cols"
        ML = {"cols": ("左右并排", "side by side"), "toggle": ("一键切换前后", "toggle before/after"), "slider": ("拖分隔线揭开", "drag the divider")}
        s.emit(ind, "[%s（%s）]" % (T("对比", "Compare"), T(*ML.get(mode, (mode, mode)))))
        sides = [k for k in n.els() if k.has("vl-cmp-a") or k.has("vl-cmp-b")]
        anybad = any(k.has("bad") for k in sides)
        for k in sides:
            mark = ("✗ " if k.has("bad") else "✓ ") if anybad else ""
            s.emit(ind + 1, "%s%s：" % (mark, k.a.get("data-label") or ("A" if k.has("vl-cmp-a") else "B")))
            s.children(k, ind + 2)
        s.children(n, ind + 1, skip=tuple(sides))

    def flip(s, n, ind):
        T = s.T
        cards = [k for k in n.els() if k.has("vl-flip-c")]
        s.emit(ind, "[%s]" % T("翻牌：共 %d 张，点一张翻面" % len(cards), "Flip cards: %d, tap to flip" % len(cards)))
        for c in cards:
            f = c.find(lambda x: x.has("vl-flip-f")); b = c.find(lambda x: x.has("vl-flip-b"))
            s.emit(ind + 1, "%s%s ／ %s%s" % (T("正面：", "Front: "), ws(s.inline(f)) if f is not None else "", T("背面：", "Back: "), ws(s.inline(b)) if b is not None else ""), "- ")

    def comic(s, n, ind):
        T = s.T
        s.emit(ind, "[%s：%s]" % (T("漫画分镜", "Comic strip"), n.a.get("aria-label", "")))
        for i, p in enumerate([k for k in n.els() if k.has("vl-panel")], 1):
            bub = [ws(s.inline(b)) for b in p.findall(lambda x: x.has("vl-bub"))]
            cap = p.find(lambda x: x.has("vl-cap"))
            ill = [s.illus(x.a["data-illus"]) for x in p.findall(lambda x: x.a.get("data-illus"))]
            t = T("第 %d 格：" % i, "Panel %d: " % i)
            if bub: t += T("气泡", "bubble ") + "「" + "」「".join(bub) + "」 "
            t += " ".join(ill)
            if cap is not None: t += T(" 旁白：", " caption: ") + ws(s.inline(cap))
            s.emit(ind + 1, t)

    def doc(s, n, ind):
        T = s.T
        K = {"file": ("案卷", "case file"), "news": ("报纸", "newspaper"), "diary": ("日记", "diary"), "letter": ("信", "letter"),
             "lab": ("实验笔记", "lab notebook"), "notebook": ("实验笔记", "lab notebook")}
        k = n.a.get("data-kind", "")
        s.emit(ind, "[%s·%s]" % (T("文档道具", "Document"), T(*K.get(k, (k or "文档", k or "document")))))
        s.children(n, ind + 1)

    def philo(s, n, ind):
        T = s.T
        sl = [k for k in n.els() if k.has("vl-philo-slide")]
        s.emit(ind, "[%s]" % T("立场卡：共 %d 张，一次看一张" % len(sl), "Viewpoint cards: %d, one at a time" % len(sl)))
        for i, k in enumerate(sl, 1):
            s.emit(ind + 1, "── %d. %s ──" % (i, k.a.get("data-t", "")))
            s.children(k, ind + 2)

    def quiz(s, qid, ind):
        T = s.T
        s.used_quiz.add(qid)
        for qs, opt in s.quizzes[qid]:
            mode = T("（拖答案卡作答）", " (drag the answer card)") if opt.get("mode") == "drag" else ""
            s.emit(ind, "[%s：%d %s%s]" % (T("练习", "Practice"), len(qs), T("题，一次一题，选项会打乱", "question%s, one at a time, options shuffled" % ("" if len(qs) == 1 else "s")), mode))
            for i, q in enumerate(qs, 1):
                if not isinstance(q, dict): continue
                s.emit(ind + 1, s.h2t(q.get("q")), "%d. " % i)
                if isinstance(q.get("img"), str): s.emit(ind + 2, s.h2t(q["img"]) or "[%s]" % T("题图", "question image"))
                for j, o in enumerate(q.get("opts") or []):
                    mark = " ✓" if q.get("a") == j else ""
                    s.emit(ind + 2, (s.h2t(o) if isinstance(o, str) else "?") + mark, "%s. " % "ABCDEFGH"[j % 8])
                if q.get("why"): s.emit(ind + 2, s.h2t(q["why"]), T("解析：", "Explanation: "))

    # ---------- 主流程 ----------
    def run(s):
        s.children(s.main, 0)
        left = [k for k in s.quizzes if k not in s.used_quiz]
        if left:
            s.out.append("")
            s.out.append("## " + s.T("练习（脚本里，页面上没找到挂载点）", "Practice (in script; host element not found)"))
            for k in left: s.quiz(k, 0)
        text = "\n".join(s.out)
        text = html.unescape(text)
        if s.en:   # 英文页：标签里的全角标点换成半角
            for a, b in (("：", ": "), ("（", " ("), ("）", ")"), ("｜", " | "), ("／", " / ")):
                text = text.replace(a, b)
            text = re.sub(r"(?<=\S) {2,}", " ", text).replace("( ", "(").replace(" )", ")")
        text = re.sub(r"[ \t]+\n", "\n", text)
        text = re.sub(r"\n{3,}", "\n\n", text).strip() + "\n"
        return text


def render(path, src=None):
    if src is None: src = open(path, encoding="utf-8").read()
    return Kit(path, src).run()


def is_kit(src):
    return re.search(r"""class\s*=\s*["'][^"']*\bvl-""", src) is not None


if __name__ == "__main__":
    try: sys.stdout.reconfigure(encoding="utf-8")
    except Exception: pass
    args = sys.argv[1:]
    out = None
    if "--out" in args:
        i = args.index("--out"); out = args[i + 1]; del args[i:i + 2]
    t = render(args[0])
    if out: open(out, "w", encoding="utf-8").write(t); print("写入 %s，%d 字符" % (out, len(t)))
    else: print(t)
