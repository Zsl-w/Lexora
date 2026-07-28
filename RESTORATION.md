# Lexora 源码恢复记录

恢复日期：2026-07-28

## 已恢复内容

- `extension-baseline/` 是从 Lexora v0.8.7 的完整 Chrome 构建产物恢复出的可运行基线。
- `npm run build` 会把该基线复制到 `.output/recovered-chrome-mv3/`，不会覆盖原有的发布产物。
- `npm run verify` 会校验 Manifest V3、版本号和扩展关键入口。
- `recovered-extension-v0.8.7/` 是可直接在 Chrome 开发者模式加载的解压版。

## 恢复边界

原 WXT/TypeScript/React 源文件已从磁盘删除，废纸篓与本地 Time Machine 快照均没有可用于原样还原的副本。因此 `extension-baseline/` 中保留的是发布版 JavaScript，而不是原始 TSX 文件。

这份基线确保 v0.8.7 的现有功能仍可重新构建和验证。后续迭代将采用渐进式重构：先为设置、后台服务、划词浮层和结果窗口建立可读模块，再逐步替换基线代码；每一步都对照 v0.8.7 行为验证，避免功能回退。

## 当前可用命令

```bash
npm run verify
npm run build
```

生成目录 `.output/recovered-chrome-mv3/` 可通过 Chrome 的“加载已解压的扩展程序”进行测试。
