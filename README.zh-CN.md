# Lexora

[English](README.md)

> 不离开当前页面，读懂一个专业名词。

Lexora 是一个轻量的 Chrome 浏览器扩展。阅读网页或论文时，划选一个单词、缩写、词组或句子，点击 **L 解读**，即可获得结合上下文的解释，而不只是孤立翻译。

它从医学与 AI 阅读场景起步，但并非医疗服务；后续会随着真实阅读场景逐步扩展。

## 下载

**[下载 Lexora v0.8.7](https://github.com/Zsl-w/Lexora/releases/download/v0.8.7/lexora-extension-0.8.7-chrome.zip)**

当前公开测试包的说明见 [v0.8.7 Release](https://github.com/Zsl-w/Lexora/releases/tag/v0.8.7)。

想进一步了解产品，请访问 [Lexora 介绍页](https://temporalsync.online/lexora)。

## 能做什么

- **划词即解读**：在网页中选择术语、缩写、词组、句子或多个关键词。
- **保留上下文**：解释会结合划选内容与附近文字，像 `AD` 这样的缩写不会被当作固定词典释义。
- **先快后深**：优先给出一句话和简要解释；需要时再点开深入解读。
- **中英对照映射**：原始英文术语与中文名称会一起呈现，清楚对应正在解释的对象。
- **继续追问**：直接在紧凑的阅读窗口中继续问 AI，不必另开对话。
- **按需查来源**：进入深入解读时，Lexora 会按主题检索公开学术来源：医学优先 PubMed，AI 优先 arXiv，Crossref 作为补充。

## 使用展示

<p align="center">
  <img src="docs/images/selection.jpg" alt="Lexora 划词入口" width="760" />
</p>

<p align="center">
  <img src="docs/images/ai-result.jpg" alt="Lexora AI 术语解读" width="520" />
  <img src="docs/images/medical-result.jpg" alt="Lexora 医学术语解读" width="520" />
</p>

## 阅读流程

1. 在网页或 HTML 论文中划选想弄懂的内容。
2. 点击划选末尾下方出现的 **L 解读** 入口。
3. 先读一句话解释；有需要再打开 **简明** 或 **深入**。
4. 保留原术语和上下文，继续提问。

悬浮窗口支持拖动和固定。未固定时，它会在你把焦点移开后自动隐藏，等待下一次划词。

## 模型与费用边界

Lexora 使用用户自行配置的 DeepSeek API Key。密钥保存在浏览器扩展的本地存储中，普通网页无法读取；模型请求由扩展后台发出。

当前版本使用 `deepseek-v4-flash`。常规阅读路径会先请求快速答案；只有读者点击 **深入** 后，才会开始检索来源并生成更完整的解读，以减少等待时间和 API 消耗。

## 医学内容边界

Lexora 用于专业术语的阅读和学习辅助，不提供疾病诊断、治疗建议、处方或个体化用药剂量建议。医学解释可能不完整，也可能存在不确定性，不能替代临床专业人员的判断。

## 恢复状态与本地开发

原始 WXT/TypeScript 源码曾被误删。当前仓库保留的是可用的 v0.8.7 恢复基线：

```text
extension-baseline/       可运行的扩展恢复基线
scripts/                  构建与校验脚本
docs/images/              README 展示图片
```

在仓库根目录运行：

```bash
npm run verify
npm run build
```

重新构建的扩展将输出到 `.output/recovered-chrome-mv3/`，不会覆盖原始 Release 包。后续会逐步将恢复包重建为可读模块，同时持续以 v0.8.7 的行为作为验证基线。

## 反馈

Lexora 目前处于公开测试阶段。如果缩写被错误理解、某个网页没有出现划词入口，或深入解读不够有用，欢迎[提交 Issue](https://github.com/Zsl-w/Lexora/issues)。

由 [十月七 · TemporalSync](https://temporalsync.online/) 制作。

## 开源许可证

本仓库中属于 Lexora 的源码与文档采用 [Apache License 2.0](LICENSE) 发布。第三方组件仍遵循各自的许可证。
