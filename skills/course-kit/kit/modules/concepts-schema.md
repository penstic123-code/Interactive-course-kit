# 统一概念数据（js/concepts.js）

用途：一份数据同时供概念卡、关系图、本章概念小图、相关章节、集邮册 / 图鉴、术语表、闪卡使用，避免几处写得不一致。示例：`demo/concepts.js`。

```js
window.VL_CONCEPTS = {
  items: [ /* 核心概念（含世界观原理） */ ],
  links: [ /* 可选：集中写的关系边，和 items[].links 合并去重 */ ],
  terms: [ /* 普通术语：进术语表、闪卡，不进关系图和图鉴 */ ],
};
```

## items[]：概念

| 字段 | 必填 | 说明 | 谁用 |
|---|---|---|---|
| `id` | 是 | 英文短横线，全课唯一；改了要同步各章 `data-concept` | 全部 |
| `ch` | 是 | 所属章号（第一次讲透它的那一章） | 关系图分列、相关章节、图鉴分组、闪卡只出已读懂章 |
| `zh` / `en` | 是 | 中英名称 | 概念卡、节点、术语表 |
| `def` / `defEn` | 是 | 一句定义（≤60 字） | 概念卡 `.vl-cc-def`、术语表、闪卡背面 |
| `plain` / `plainEn` | 建议 | 通俗地说的一句 | 概念卡"通俗地说"、集邮册释义、闪卡背面 |
| `illus` | 建议 | 插画名（`VL.illus.add` 注册的） | 概念卡图位、邮票、图鉴格、闪卡背面 |
| `by` / `byEn` | 否 | 出处：谁 · 哪本书 · 年份 | 概念卡 `.vl-cc-by` |
| `aka` | 否 | 别名数组（中英都可） | 搜索、build-concepts 认术语 |
| `kind` | 否 | `"concept"`（默认）或 `"principle"`（世界观原理，content-rules.md 一D） | 节点、图鉴格用双线框；小签写"世界观原理" |
| `badge` | 否 | `true` = 这一章的邮票用它的图；不写就用本章第一个概念 | 集邮册 |
| `links` | 否 | `[{to, type}]`，从本概念出发的边 | 关系图、相关章节 |

## 关系边

`{from, to, type}`，写在 `items[i].links`（from = 这个概念）或顶层 `links`。

| type | 中文 | 方向的意思 | 信息栏里怎么说（对 from / 对 to） |
|---|---|---|---|
| `prereq` | 前置 | 先懂 from 才能懂 to | 接着能懂 / 先要懂 |
| `explains` | 解释 | from 给出 to 背后的原理 | 它能解释 / 背后的原理 |
| `applies` | 应用 | from 用在 to 上（to 是 from 的一个应用场景） | 用在 / 用到了 |
| `contrast` | 对照 | 不分方向，两者对照或有张力 | 对照 |

也认中文 `前置 / 解释 / 应用 / 对照`。指向不存在的 id 会在控制台警告并丢掉，`build-concepts.mjs` 报 ✗。

## terms[]：普通术语

`{id, ch, zh, en?, def, defEn?, aka?, anchor?}`。`anchor` 是章节页里那个术语元素的 id，术语表链接会跳到它。可以手写，也可以 `build-concepts.mjs --write` 从各章 `.vl-term[data-def]`、`<dfn title>` 汇进来（已经是核心概念的词不重复收）。

## 章节页里怎么用

| 写法 | 效果 |
|---|---|
| `<aside class="vl-cc" data-concept="spacing"></aside>` | 整张概念卡由数据生成（名称、英文、出处、通俗地说、定义、图位） |
| `<aside class="vl-cc" data-concept="spacing"><p class="vl-cc-eg">…</p></aside>` | 只写本章特有的例子，其余字段由数据补 |
| `<p class="vl-try" data-try="t1" data-concept="spacing">` | 试试看第一次完成时，集邮册把这个概念收进图鉴（不写就取同一节里第一张 `.vl-cc[data-concept]`） |
| `<div class="vl-minimap" data-ch="3"></div>` | 本章概念小图 |
| `<nav class="vl-related"></nav>` | 相关章节放这里；不写就自动插在翻页前面 |

## 维护

- 改完各章或数据，跑 `node kit/modules/build-concepts.mjs <课程绝对路径>`：查 data-concept 找不到、卡片和数据不一致、同一术语两种释义、边指向不存在的 id、缺图。
- 英文版：`en`、`defEn`、`plainEn`、`byEn` 补齐即可，同一个文件，英文页自动取英文字段。
