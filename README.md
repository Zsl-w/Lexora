# Lexora

[中文说明](README.zh-CN.md)

> Read a technical term in context — without leaving the page.

Lexora is a lightweight Chrome browser extension for understanding specialised terms while reading. Select a word, acronym, phrase, or sentence on a page, then open **L 解读** to get a contextual explanation rather than a bare translation.

It starts with medical and AI reading, but the product is not a medical service and is intended to grow with real reading scenarios.

## Download

**[Download Lexora v0.8.7](https://github.com/Zsl-w/Lexora/releases/download/v0.8.7/lexora-extension-0.8.7-chrome.zip)**

See the [v0.8.7 release notes](https://github.com/Zsl-w/Lexora/releases/tag/v0.8.7) for the current public-beta package.

Learn more on the [Lexora product page](https://temporalsync.online/lexora).

## What it does

- **Select and explain** — highlight a term, acronym, phrase, sentence, or several keywords directly in a page.
- **Keep the context** — the explanation considers the selected text and nearby reading context, so an acronym such as `AD` is not treated as a fixed dictionary entry.
- **Start fast, then go deeper** — show a one-line answer and a concise explanation first; open deeper interpretation only when needed.
- **Bilingual mapping** — keep the original English term and its Chinese name together, so readers can see exactly what is being explained.
- **Continue the conversation** — ask follow-up questions inside the compact reading window instead of restarting in a separate chat.
- **Sources on demand** — for a deeper explanation, Lexora searches public scholarly sources by topic: PubMed for medicine, arXiv for AI, and Crossref as a fallback.

## In use

<p align="center">
  <img src="docs/images/selection.jpg" alt="Lexora selection entry" width="760" />
</p>

<p align="center">
  <img src="docs/images/ai-result.jpg" alt="Lexora AI term explanation" width="520" />
  <img src="docs/images/medical-result.jpg" alt="Lexora medical term explanation" width="520" />
</p>

## How the reading flow works

1. Select something you want to understand while reading a webpage or an HTML paper.
2. Click the small **L 解读** entry beneath the end of the selection.
3. Read the one-line answer first, then open **简明** or **深入** only when you need more.
4. Ask a follow-up question without losing the selected term and its context.

The floating window can be dragged and pinned. When it is not pinned, it stays out of the way and waits for the next selection.

## Model and cost boundary

Lexora uses the user's own DeepSeek API key. The key is kept in the browser's extension storage and is not exposed to ordinary webpages; model requests are sent by the extension background process.

The current build uses `deepseek-v4-flash`. A fast answer is requested first. Source searching and deeper interpretation only begin after the reader chooses **深入**, which keeps the normal reading path faster and helps limit API usage.

## Medical-content boundary

Lexora explains terminology for reading and learning. It does **not** diagnose conditions, recommend treatment, prescribe medication, or give individual dosing advice. Medical explanations may be incomplete or uncertain and should not replace a clinician's judgement.

## Recovery status and local development

The original WXT/TypeScript source tree was accidentally deleted. This repository therefore preserves a functional v0.8.7 recovery baseline:

```text
extension-baseline/       Functional recovered extension baseline
scripts/                  Build and verification scripts
docs/images/              README product screenshots
```

Run these commands from the repository root:

```bash
npm run verify
npm run build
```

The rebuilt extension is written to `.output/recovered-chrome-mv3/`; the original release artifact is never overwritten.

Future work will gradually replace the recovered bundle with readable modules while verifying behavior against v0.8.7.

## Feedback

Lexora is in public beta. If an abbreviation is interpreted incorrectly, a site fails to show the selection entry, or a deeper explanation is not useful, please [open an issue](https://github.com/Zsl-w/Lexora/issues).

Built by [十月七 · TemporalSync](https://temporalsync.online/).

## License

Licensed under the [Apache License 2.0](LICENSE). This license applies to Lexora-owned source and documentation in this repository; third-party components remain subject to their own licenses.
