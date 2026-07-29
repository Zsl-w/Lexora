<p align="center">
  <img src="extension-baseline/icon/128.png" width="76" alt="Lexora logo" />
</p>

<h1 align="center">Lexora</h1>

<p align="center"><strong>不离开当前页面，读懂一个专业名词。</strong></p>

<p align="center">
  医学与 AI 论文阅读时的划词解读工具：结合上下文，而不只是翻译。
</p>

<p align="center">
  <a href="https://github.com/Zsl-w/Lexora/releases/tag/v0.8.7"><img src="https://img.shields.io/github/v/release/Zsl-w/Lexora?display_name=tag&label=release&color=5A67D8" alt="release" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-4F8A10" alt="license Apache-2.0" /></a>
  <img src="https://img.shields.io/badge/platform-Chrome-4285F4?logo=googlechrome&logoColor=white" alt="platform Chrome" />
</p>

<p align="center">
  <a href="https://github.com/Zsl-w/Lexora/releases/download/v0.8.7/lexora-extension-0.8.7-chrome.zip"><img src="https://img.shields.io/badge/%E2%AC%87%20%E4%B8%8B%E8%BD%BD%20Lexora-v0.8.7-5A67D8?style=for-the-badge" alt="下载 Lexora v0.8.7" /></a>
</p>

<p align="center">
  简体中文 · <a href="README.en.md">English</a> · <a href="https://temporalsync.online/lexora">产品介绍页</a>
</p>

<p align="center">
  <img src="docs/images/lexora-hero.svg" width="100%" alt="Lexora 在论文阅读中的划词解读界面" />
</p>

---

## 为什么是 Lexora？

读论文时，你遇到的往往不是一个需要翻译的单词，而是一个需要放回上下文里理解的概念：缩写 `AD` 指的是哪一种疾病？一段话中的 `transformer` 是架构、模型，还是某篇论文里的特定方法？

Lexora 在划词后给出**上下文解读**：先让你快速明白，再由你决定是否继续深入或查看来源。

## 核心体验

| 划词即解读 | 先快后深 | 保留中英对应 |
| :---: | :---: | :---: |
| 选择术语、缩写、词组、句子或多个关键词，点击 **L 解读**。 | 一句话与简要解释优先出现；需要时再点开深入解读。 | 英文原词和中文名称一起显示，避免“知道中文却不知道对应哪个词”。 |

| 继续追问 | 按需查来源 | 专注阅读 |
| :---: | :---: | :---: |
| 直接在紧凑窗口中追问，不丢失原术语和上下文。 | 深入解读按主题检索 PubMed、arXiv 与 Crossref。 | 窗口可拖动、可固定；未固定时会在失焦后自动收起。 |

## 看看它如何工作

<p align="center">
  <img src="docs/images/selection.jpg" alt="划选文本后出现 Lexora L 解读入口" width="780" />
</p>

<p align="center">
  <img src="docs/images/ai-result.jpg" alt="Lexora AI 术语解读" width="47%" />
  <img src="docs/images/medical-result.jpg" alt="Lexora 医学术语解读" width="47%" />
</p>

## 开始使用

这是一个 Chrome 浏览器扩展。下载后即可在网页和 HTML 论文阅读中使用。

<p align="center">
  <a href="https://github.com/Zsl-w/Lexora/releases/download/v0.8.7/lexora-extension-0.8.7-chrome.zip"><strong>↓ 下载当前版本 v0.8.7</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/Zsl-w/Lexora/releases/tag/v0.8.7">查看 Release 说明</a>
</p>

## 模型、费用与隐私边界

Lexora 使用用户自行配置的 DeepSeek API Key。密钥保存在浏览器扩展的本地存储中，普通网页无法读取；模型请求由扩展后台发出。

当前版本使用 `deepseek-v4-flash`。常规阅读路径会先请求快速答案；只有你点击 **深入** 后，才会开始检索来源并生成更完整的解读，以减少等待时间和 API 消耗。

## 医学内容边界

Lexora 用于专业术语的阅读与学习辅助，不提供疾病诊断、治疗建议、处方或个体化用药剂量建议。医学解释可能不完整，也可能存在不确定性，不能替代临床专业人员的判断。

## 开发与恢复状态

原始 WXT/TypeScript 源码曾被误删。现在的 `entrypoints/` 与 `src-rebuild/` 是从 v0.9.0 开始重建的可维护源码；`extension-baseline/` 则保留 v0.8.7 的可运行恢复基线，用于对照行为。

```text
extension-baseline/       可运行的扩展恢复基线
entrypoints/              重建版的 WXT 扩展入口
src-rebuild/              重建版的业务逻辑与共享类型
scripts/                  构建与校验脚本
docs/images/              README 展示图片
```

```bash
npm run typecheck
npm run build
npm run verify
```

重建版扩展输出到 `.output/chrome-mv3/`；v0.8.7 的恢复产物仍保留在独立目录，不会被覆盖。后续会继续以 v0.8.7 行为作为验证基线，逐个补回来源检索、追问、朗读等功能。

## 参与与反馈

Lexora 目前处于公开测试阶段。如果缩写被错误理解、某个网页没有出现划词入口，或深入解读不够有用，欢迎[提交 Issue](https://github.com/Zsl-w/Lexora/issues)。

由 [十月七 · TemporalSync](https://temporalsync.online/) 制作。

## 开源许可证

本仓库中属于 Lexora 的源码与文档采用 [Apache License 2.0](LICENSE) 发布。第三方组件仍遵循各自的许可证。
