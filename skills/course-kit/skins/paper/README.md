# 皮肤 paper · 纸片（剪纸）

用途：本皮肤的风格、变量、插画画法和适用场合。状态：已入库；样板章见 `examples/paper-survivorship/`。

**一句话**：蓝天草地前立着一张暖白卡纸，正文直接印在卡纸上；图、互动台、概念卡都是剪下来的彩色卡纸，带一圈白裁边和柔和投影，最重的底下再垫一层牛皮纸。目录页是一座纸塔，第 1 章在底层，往上爬。

## 文件

| 文件 | 内容 |
|---|---|
| `skin.css` | 变量（五篇主色、天空带、塔墙）+ 组件外观 + 目录页纸塔 + 题头天空带 |
| `skin.js` | `window.VL_SKIN`（网络字体、剪纸滤镜 `#pp-cut1…3`、纤维纹 `#pp-fiber`、插画配色）+ 剪纸绘制工具（经 kit 的换画法钩子 `VL_SKIN.illus` 换掉 `VL.illus.kit` 的画法）+ 题头动画暂停 / 冻结 |
| `interact.css` `modules.css` `diagrams.css` | 互动组件、可选模块、后七种图解的外观（由 notebook 同名文件改成卡纸画法） |
| `img/` | 纤维纹 `fiber.png` `fiber-soft.png`、背景纸云 `clouds.svg`、草地 `hills.svg` |
| `gallery.html` | 验收页 |

## 字体

| 变量 | 用在 | 字体 |
|---|---|---|
| `--font-display` = `--font-label` = `--font-hand` | h1–h4、按钮、标签、纸签 | 站酷快乐体 ZCOOL KuaiLe（网络，OFL）→ 霞鹜文楷 → 微软雅黑 |
| `--font-body` | 正文 17.5px / 1.85 | 霞鹜文楷 LXGW WenKai（网络，OFL）→ 楷体 |
| `--font-fig` | 插画、图解里的字 | 系统黑体加粗（快乐体小字号难读） |
| 英文页 | 正文 Segoe UI 等；标题 Fredoka（网络，OFL） | |

不带本地字体：按某门课用字裁过的 woff2 换课会缺字。离线时退到系统字体，版面不乱。

## 变量

| 组 | 值 |
|---|---|
| `--ink --ink2 --muted` | #1f2638 / #3b4358 / #4d566c |
| `--page --panel --edge --sunk --kraft` | 天空 #cdeafa / 卡纸 #fbf6ea / 白裁边 #fffdf7 / #f3ecdc / 牛皮纸 #dcc9a2 |
| `--accent --accent2 --deep` | 篇色（浅，只做底）/ 副色 / 篇深色写字 |
| `--plate --plate-ink` | #fdfaf1 / #1f2638 |
| `--shadow-c` | 一种投影色 rgba(40,60,90,.22) |
| `--shadow-obj` | 白边 5px + 牛皮纸垫层 + 远投影（互动台、编号图、徽章） |
| `--shadow-mid` `--shadow-soft` | 白边 4px + 中投影（概念卡、轮播）/ 白边 3px + 软影（试试看、收束块） |
| `--dg-*` | 色块天蓝 草绿 珊瑚 淡紫 浅黄 蜜桃；选中 #c8364f；框加剪纸滤镜 `--dg-filter:url(#pp-cut1)`，线不加 |
| `--q1…q6` | 同 notebook（卡纸上 ≥4.5:1） |

篇章：`--p{n}a/b/d` 五套（天蓝 + 草绿、薄荷 + 蜜桃、淡紫 + 浅黄、珊瑚 + 云灰、杏黄 + 浅蓝），另有每篇的天空带 `--pp-sky-n`、窗外小景 `--pp-art-n`（清晨风车 → 午后风筝 → 黄昏星月 → 黎明云海）和塔墙 `--pp-wall-n`。同篇各章色相 ±18°。

对比度实测（亮色，对卡纸 #fbf6ea）：ink 13.98、ink2 9.14、muted 6.80（对控件底 6.23）；deep 五篇 5.28–6.76；选中按钮（ink 压 accent）8.48–10.27；--ok 对 okbg 5.43；--q 4.52–6.00；focus 对天空 6.12、对卡纸 7.12。

## 谁重谁轻

| 最重（白边 5px + 牛皮纸垫层 + 远投影） | 中（白边 + 中投影） | 轻（无投影） |
|---|---|---|
| 互动台 `.vl-board`、编号图与概念图解 `.vl-fig`、测验徽章 | 概念卡（左边副色厚纸条）、照片（纸胶带）、例子轮播、试试看、收束块、文档道具 | 原理框（左边主色纸条 + 纸签）、立场卡、支线 / 发明故事（牛皮纸文件袋，展开后左边一道牛皮纸边） |

## 插画画法
- 剪纸纸偶：层叠彩色卡纸，整个物件外圈一道白裁边 + 投影（`cut()`），纸面有纤维纹和上亮下暗的纸面光，边缘像剪刀剪的略不规则。
- 接口照 kit：`VL.illus.add(...)` 里的 `k.person / hands / feetY / ground / item / holding / bubble / T / arrow` 都是剪纸画法，参数和 notebook 相同；`k.person` 的脚底仍在 `y + 64·s`，`k.ground()` 是一条纸草地。
- 物件：`k.item / k.holding` 支持 kit 的全部物件 book box cup phone die star coin，另有剪纸专属 doc photo card board chip plant。
- 自动规则：同一张图第 k 个人依次换装（短发 → 鸭舌帽 → 长发裙子 → 毛线帽围巾 → 礼帽西装领带）；传了 hat / hair / glasses / tie / shirt 等的人，指定的项用指定值，其余衣着照旧按出场顺序换（只指定发型时去掉那套的帽子）；`outfit:false` 关闭换装；`legs:"sit"` 自带木凳（`chair:false` 关）；`look:-1` 整个纸偶镜像、字不翻；`holding()` 把物件画在两手中点，再把两只手压在物件两侧。
- 描边：插画外层 `<g>` 默认带 3.5px 墨线（给作者手写的线条用）。`k.person` 等 kit 接口和 `k.paper` 里所有画东西的函数（rect、blob、cut、tag、stage……）输出都已包好 `stroke="none"`，直接拼即可，不用自己包；`k.paper.stage(o, inner)` 只给布景去描边，`inner` 原样放，里面手写的线仍继承墨线。
- 更多纸片 API 在 `k.paper`：`stage({back:"meadow|plain|hills|lab|night|city", ground:"grass|wood|cobble"})`、`cut / lay / rect / circle / blob / strip`、`paperPerson`（服饰更全：fedora、beret、白大褂、马甲……）、`desk / chair / lamp / plant / board / card / tag / sign / parrow`。
- 图中文字用 `k.T`，放在 `add()` 第 4 个参数（文字层）；字号 ≥12。

## 专属动效
- 题头天空带里一朵纸云慢慢飘（只在"全开"档；出视口暂停；`?freeze=秒` 冻结；轻量 / 关 / 减少动态时不出现）。
- 弹出面板轻落、按钮按下有纸片下沉感；关档全部去掉。
- 登楼过场、纸片翻页、滚动翻出不在皮肤里（依赖课程脚本），需要时另做。

## 何时适合用
- 适合：有叙事、有角色、偏轻快的课，初中到高中读者；插画以纸偶人物和小场景为主。
- 不太适合：严肃历史 / 医学题材；以照片为主的课。数据图请保持直边、不加剪纸滤镜。

## 已知问题
- `.vl-tb-dots` 第 6 篇以后回到第 1 篇颜色。
- 目录页纸塔只认 starter/index.html 的 `#ix-parts / .ix-part / .ix-ch` 结构；为了压过页内样式，选择器带 `body #ix-parts`。
- 插画替换靠 kit 的钩子 `window.VL_SKIN.illus`：必须在 kit/illus.js 之前加载 skin.js（starter 模板就是这个顺序）。
