# Lexora v0.8.7 重建对照表

这份表以 `extension-baseline/` 的发布产物为行为依据。它不是发布说明；只有在代码、构建产物和浏览器实测三项证据齐全时，某项才算完成。

| v0.8.7 行为 | 重建位置 | 当前证据 | 浏览器回归 |
| --- | --- | --- | --- |
| Manifest V3、后台、内容脚本、设置页、弹窗 | `wxt.config.ts`、`entrypoints/` | `npm run build` 生成全部入口 | 待测 |
| 网页和输入框划词 | `entrypoints/content.ts` 的 `textSelection` | TypeScript 构建通过 | 待测 |
| 单术语、句子、多概念模式 | `selectionMode`、提示词、`keyConcepts` | TypeScript 构建通过 | 待测 |
| 划词末尾下方 L 解读入口 | `triggerPosition` | TypeScript 构建通过 | 待测 |
| 浮窗右下侧出现、拖动、固定、关闭、失焦隐藏 | `panelStart`、拖动状态、`pinned` | TypeScript 构建通过 | 待测 |
| 固定窗口后可继续划词 | `queuedDraft` | TypeScript 构建通过 | 待测 |
| 一句话与简明快速返回 | `LOOKUP_CORE`、快速提示词、12 小时缓存 | TypeScript 构建通过 | 待测 |
| 点击 L 解读后并行检索来源，打开“深入”时优先展示结果 | `LOOKUP_DEEP`、`lookupDeep`、`retrieveSources` | TypeScript 构建通过 | 待测 |
| 医学 PubMed、AI arXiv、Crossref 回退 | `source-search.ts` | PubMed/Crossref GET 实测 200；arXiv 有回退逻辑 | 待测 |
| 文内 `[[n]]` 与来源链接 | `markdownFragment`、来源列表 | TypeScript 构建通过 | 待测 |
| 在浮窗内继续追问 | `TERM_CHAT`、`sendChat` | TypeScript 构建通过 | 待测 |
| 浏览器本地朗读、中文/英文音色、试听 | 内容脚本与设置页 | TypeScript 构建通过 | 待测 |
| DeepSeek Key 验证、知情确认、删除 | `VERIFY_API_KEY`、设置页 | TypeScript 构建通过 | 待测（需用户 Key） |
| 右键“用 Lexora 解读”与弹窗直接查询 | `contextMenus`、`popup` | Manifest 包含权限及入口 | 待测 |
| 扩展重载后的安全失败提示 | `runtimeMessage` | 静态代码检查 | 待测 |

## 必要验证命令

```bash
npm run typecheck
npm run build
npm run verify
npm run verify:rebuild
```

浏览器回归必须加载 `.output/chrome-mv3/`，并在普通网页、搜索框输入框、医学术语和 AI 术语上完成验证。未完成这些测试前，不应把重建版标为可发布版本。
