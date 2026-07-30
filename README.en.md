<p align="center">
  <img src="public/icon/128.png" width="76" alt="Lexora logo" />
</p>

<h1 align="center">Lexora</h1>

<p align="center"><strong>Read a technical term in context — without leaving the page.</strong></p>

<p align="center">
  A select-to-explain browser extension for papers and professional reading: contextual interpretation, not bare translation.
</p>

<p align="center">
  <a href="https://github.com/Zsl-w/Lexora/releases/tag/v0.9.0"><img src="https://img.shields.io/github/v/release/Zsl-w/Lexora?display_name=tag&label=release&color=5A67D8" alt="release" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-4F8A10" alt="license Apache-2.0" /></a>
  <img src="https://img.shields.io/badge/platform-Chrome-4285F4?logo=googlechrome&logoColor=white" alt="platform Chrome" />
</p>

<p align="center">
  <a href="https://github.com/Zsl-w/Lexora/releases/download/v0.9.0/lexora-0.9.0-chrome.zip"><img src="https://img.shields.io/badge/%E2%AC%87%20Download%20Lexora-v0.9.0-5A67D8?style=for-the-badge" alt="Download Lexora v0.9.0" /></a>
</p>

<p align="center">
  <a href="README.md">简体中文</a> · English · <a href="https://temporalsync.online/lexora">Product page</a>
</p>

<p align="center">
  <img src="docs/images/lexora-hero.svg" width="100%" alt="Lexora selection-to-explanation interface" />
</p>

---

## Why Lexora?

When reading a paper, the difficult part is often not translating a word but understanding what it means *here*. Does `AD` refer to a disease in this paragraph? Is `transformer` an architecture, a specific model, or the name of a method in a paper?

Lexora gives a **contextual explanation** after selection: understand the essentials quickly, then decide whether to go deeper, ask a follow-up question, or inspect sources.

## Core experience

| Select and explain | Fast first, deep when ready | Bilingual mapping |
| :---: | :---: | :---: |
| Select a term, acronym, phrase, sentence, or several keywords, then click **L 解读**. | A one-line answer and concise explanation appear first; deep interpretation and source retrieval are prepared in parallel. | Keep the original English term and Chinese name together. |

| Continue the conversation | Topic-aware sources | Stay in the reading flow |
| :---: | :---: | :---: |
| Ask follow-up questions in the compact window without losing selection context. | AI topics look to arXiv first; medical topics look to PubMed first, with Crossref when useful. | Drag or pin the window; when unpinned, it gets out of the way after focus leaves it. |

## See it in use

<p align="center">
  <img src="docs/images/selection.jpg" alt="Lexora selection entry" width="780" />
</p>

<p align="center">
  <img src="docs/images/ai-result.jpg" alt="Lexora AI term explanation" width="47%" />
  <img src="docs/images/medical-result.jpg" alt="Lexora medical term explanation" width="47%" />
</p>

## Download

Lexora is an extension for Chrome and Chromium-based browsers, designed for webpages and HTML papers.

<p align="center">
  <a href="https://github.com/Zsl-w/Lexora/releases/download/v0.9.0/lexora-0.9.0-chrome.zip"><strong>↓ Download v0.9.0</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/Zsl-w/Lexora/releases/tag/v0.9.0">Release notes</a>
</p>

## Model, cost, and privacy boundary

Lexora uses the reader's own DeepSeek API key. The key is stored in browser extension storage and is not exposed to ordinary webpages; requests are sent by the extension background process.

The current build uses `deepseek-v4-flash`, balancing response speed and cost for reading. A one-line answer and concise explanation arrive first; deep interpretation retrieves and organizes sources in the background for readers who choose to open it.

## Medical-content boundary

Lexora supports terminology reading and learning. It does **not** diagnose conditions, recommend treatment, prescribe medication, or give individual dosing advice. Medical explanations may be incomplete or uncertain and must not replace clinical judgement.

## Local development

```text
entrypoints/              WXT extension entrypoints
src-rebuild/              Domain logic and shared types
public/icon/              Extension icons
scripts/                  Build and verification scripts
docs/images/              README product screenshots
```

```bash
npm run typecheck
npm run build
npm run verify
npm run verify:rebuild
```

The build output is written to `.output/chrome-mv3/`; run `npx wxt zip` to create a distributable ZIP package.

## Feedback

Lexora is in public beta. If an abbreviation is interpreted incorrectly, a site does not show the selection entry, or a deeper explanation is not useful, please [open an issue](https://github.com/Zsl-w/Lexora/issues).

Built by [十月七 · TemporalSync](https://temporalsync.online/).

## License

Lexora-owned source and documentation in this repository are licensed under the [Apache License 2.0](LICENSE). Third-party components remain subject to their own licenses.
