<p align="center">
  <img src="public/icon/128.png" width="76" alt="Lexora logo" />
</p>

<h1 align="center">Lexora</h1>

<p align="center"><strong>不离开当前页面，读懂一个专业名词。</strong></p>

<p align="center">
  面向论文与专业阅读的划词解读浏览器扩展：结合上下文，而不只是翻译。
</p>

<p align="center">
  <a href="https://github.com/Zsl-w/Lexora/releases/tag/v0.9.0"><img src="https://img.shields.io/github/v/release/Zsl-w/Lexora?display_name=tag&label=release&color=5A67D8" alt="release" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-4F8A10" alt="license Apache-2.0" /></a>
  <img src="https://img.shields.io/badge/platform-Chrome-4285F4?logo=googlechrome&logoColor=white" alt="platform Chrome" />
</p>

<p align="center">
  <a href="https://github.com/Zsl-w/Lexora/releases/download/v0.9.0/lexora-0.9.0-chrome.zip"><img src="https://img.shields.io/badge/%E2%AC%87%20%E4%B8%8B%E8%BD%BD%20Lexora-v0.9.0-5A67D8?style=for-the-badge" alt="下载 Lexora v0.9.0" /></a>
</p>

<p align="center">
  简体中文 · <a href="README.en.md">English</a> · <a href="https://temporalsync.online/lexora">产品介绍页</a>
</p>

<p align="center">
  <img src="docs/images/lexora-hero.svg" width="100%" alt="Lexora 在论文阅读中的划词解读界面" />
</p>

---

## 为什么是 Lexora？

读论文时，难的往往不是翻译一个词，而是理解它在这一段里究竟指什么：缩写 `AD` 指哪一种疾病？`transformer` 是通用架构、特定模型，还是某篇论文中的方法名？

Lexora 在划词后给出**上下文解读**：先让你快速明白，再由你决定是否深入、追问或查看来源。

## 核心体验

| 划词即解读 | 先快后深 | 保留中英对应 |
| :---: | :---: | :---: |
| 选择术语、缩写、词组、句子或多个关键词，点击 **L 解读**。 | 一句话与简要解释优先出现；深入解读与来源检索并行准备。 | 英文原词和中文名称一起显示，避免“知道中文却不知道对应哪个词”。 |

| 继续追问 | 按主题查来源 | 专注阅读 |
| :---: | :---: | :---: |
| 直接在紧凑窗口中追问，不丢失原术语和上下文。 | AI 主题优先检索 arXiv；医学主题优先检索 PubMed，必要时补充 Crossref。 | 窗口可拖动、可固定；未固定时会在失焦后自动收起。 |

## 看看它如何工作

<p align="center">
  <img src="docs/images/selection.jpg" alt="划选文本后出现 Lexora L 解读入口" width="780" />
</p>

<p align="center">
  <img src="docs/images/ai-result.jpg" alt="Lexora AI 术语解读" width="47%" />
  <img src="docs/images/medical-result.jpg" alt="Lexora 医学术语解读" width="47%" />
</p>

## 下载

Lexora 是适用于 Chrome 及 Chromium 内核浏览器的扩展，可用于网页和 HTML 论文阅读。

<p align="center">
  <a href="https://github.com/Zsl-w/Lexora/releases/download/v0.9.0/lexora-0.9.0-chrome.zip"><strong>↓ 下载当前版本 v0.9.0</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/Zsl-w/Lexora/releases/tag/v0.9.0">查看 Release 说明</a>
</p>

## 模型、费用与隐私边界

Lexora 使用读者自行配置的 DeepSeek API Key。密钥保存在浏览器扩展的本地存储中，普通网页无法读取；模型请求由扩展后台发出。

当前版本使用 `deepseek-v4-flash`，以平衡论文阅读中的响应速度与成本。一句话和简要解读优先返回；深入解读会在后台检索并整理来源，供你按需打开查看。

## 医学内容边界

Lexora 用于专业术语的阅读与学习辅助，不提供疾病诊断、治疗建议、处方或个体化用药剂量建议。医学解释可能不完整，也可能存在不确定性，不能替代临床专业人员的判断。

## 本地开发

```text
entrypoints/              WXT 扩展入口
src-rebuild/              业务逻辑与共享类型
public/icon/              扩展图标
scripts/                  构建与校验脚本
docs/images/              README 展示图片
```

```bash
npm run typecheck
npm run build
npm run verify
npm run verify:rebuild
```

构建产物位于 `.output/chrome-mv3/`；使用 `npx wxt zip` 可生成可分发的 ZIP 包。

## 参与与反馈

Lexora 目前处于公开测试阶段。如果缩写被错误理解、某个网页没有出现划词入口，或深入解读不够有用，欢迎[提交 Issue](https://github.com/Zsl-w/Lexora/issues)。

由 [十月七 · TemporalSync](https://temporalsync.online/) 制作。

## 开源许可证

本仓库中属于 Lexora 的源码与文档采用 [Apache License 2.0](LICENSE) 发布。第三方组件仍遵循各自的许可证。
