import { defineContentScript } from 'wxt/utils/define-content-script';
import type { DomainPreference, ExplanationResult, RuntimeRequest, RuntimeResponse, SelectionDraft } from '../src-rebuild/shared/types';

type View = 'hidden' | 'trigger' | 'loading' | 'result' | 'error';
type Tab = 'oneLine' | 'brief' | 'deep';

const css = `
  :host { all: initial; }
  *, *::before, *::after { box-sizing: border-box; }
  .lexora-trigger, .lexora-panel { position: fixed; z-index: 2147483647; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1b1d23; }
  .lexora-trigger { display:flex; align-items:center; gap:5px; height:32px; padding:0 10px 0 7px; border:1px solid #dfe2eb; border-radius:10px; background:#fff; box-shadow:0 8px 24px rgba(25,31,48,.14); font-size:13px; font-weight:650; cursor:pointer; }
  .lexora-trigger span { display:grid; width:18px; height:18px; place-items:center; border-radius:6px; background:#eef0ff; color:#5363c8; font-size:12px; font-weight:800; }
  .lexora-panel { width:min(390px, calc(100vw - 24px)); max-height:min(650px, calc(100vh - 24px)); overflow:auto; border:1px solid #e1e3e8; border-radius:18px; background:#fff; box-shadow:0 20px 60px rgba(19,25,43,.18); }
  .lexora-header { display:flex; height:56px; align-items:center; justify-content:space-between; padding:0 12px 0 16px; border-bottom:1px solid #eceef3; cursor:grab; user-select:none; }
  .lexora-header:active { cursor:grabbing; }
  .lexora-domain { border:0; background:transparent; color:#696e7a; font:inherit; font-size:14px; outline:none; cursor:pointer; }
  .lexora-actions { display:flex; align-items:center; gap:6px; }
  .lexora-icon { display:grid; width:34px; height:34px; place-items:center; border:0; border-radius:10px; background:transparent; color:#696e7a; font-size:20px; cursor:pointer; }
  .lexora-icon:hover { background:#f3f4f8; } .lexora-icon.is-pinned { background:#eef0ff; color:#5363c8; }
  .lexora-body { padding:20px 22px 18px; }
  .lexora-term-row { display:flex; align-items:flex-start; gap:8px; }.lexora-term { flex:1; margin:0; font-size:29px; line-height:1.18; letter-spacing:-.04em; overflow-wrap:anywhere; }.lexora-speech{display:grid;width:32px;height:32px;place-items:center;border:1px solid #e2e5ed;border-radius:9px;background:#fff;color:#626978;cursor:pointer}.lexora-speech:hover,.lexora-speech.is-speaking{background:#eef0ff;color:#5363c8;border-color:#d9dcf8}
  .lexora-canonical { margin:10px 0 18px; color:#717684; font-size:16px; line-height:1.5; }
  .lexora-tabs { display:grid; grid-template-columns:repeat(3, 1fr); margin:0 -22px 18px; border-top:1px solid #eceef3; border-bottom:1px solid #eceef3; }
  .lexora-tabs button { padding:13px 0 11px; border:0; border-bottom:3px solid transparent; background:transparent; color:#737887; font:inherit; font-weight:650; cursor:pointer; }
  .lexora-tabs button.is-active { border-bottom-color:#5a67d8; color:#20232b; }
  .lexora-answer { min-height:68px; margin:0; color:#282b34; font-size:16px; line-height:1.75; white-space:pre-wrap; }
  .lexora-note { display:flex; gap:8px; margin:18px 0 0; padding-top:16px; border-top:1px solid #eceef3; color:#707684; font-size:13px; line-height:1.55; }
  .lexora-composer { display:flex; gap:8px; margin-top:17px; padding-top:15px; border-top:1px solid #eceef3; }
  .lexora-composer input { min-width:0; flex:1; padding:10px 12px; border:1px solid #dde1e9; border-radius:10px; outline:none; font:inherit; font-size:14px; }
  .lexora-composer button { width:38px; border:0; border-radius:10px; background:#20232b; color:#fff; font-size:20px; cursor:pointer; }
  .lexora-loading { display:flex; align-items:center; gap:7px; min-height:106px; color:#747988; font-size:14px; } .lexora-dots { display:flex; gap:4px; } .lexora-dots i { width:6px; height:6px; border-radius:50%; background:#5a67d8; animation:lexora-pulse 1s infinite alternate; } .lexora-dots i:nth-child(2){animation-delay:.15s}.lexora-dots i:nth-child(3){animation-delay:.3s}@keyframes lexora-pulse{to{opacity:.28;transform:translateY(-3px)}}
  .lexora-error { margin:4px 0 0; color:#b42318; font-size:14px; line-height:1.55; }.lexora-error button{margin-top:10px;padding:8px 11px;border:0;border-radius:8px;background:#fbe9e7;color:#9c241b;font:inherit;cursor:pointer}
`;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

function runtimeMessage(request: RuntimeRequest, requestId = request.requestId || crypto.randomUUID()): Promise<RuntimeResponse> {
  return new Promise((resolve) => {
    if (!chrome.runtime?.id) {
      resolve({ ok: false, error: '扩展刚刚重新加载，请刷新当前页面后重试。' });
      return;
    }
    chrome.runtime.sendMessage({ ...request, requestId } satisfies RuntimeRequest, (response: RuntimeResponse | undefined) => {
      const error = chrome.runtime.lastError;
      if (error || !response) resolve({ ok: false, error: error?.message || '无法连接 Lexora 后台，请刷新页面后重试。' });
      else resolve(response);
    });
  });
}

function textSelection(): SelectionDraft | null {
  const active = document.activeElement;
  if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
    const start = active.selectionStart ?? 0;
    const end = active.selectionEnd ?? 0;
    const term = active.value.slice(start, end).trim();
    if (!term) return null;
    const box = active.getBoundingClientRect();
    return { term, context: active.value.slice(Math.max(0, start - 280), Math.min(active.value.length, end + 280)), rect: { left: box.left, top: box.top, right: box.right, bottom: box.bottom }, selectionMode: selectionMode(term) };
  }
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return null;
  const term = selection.toString().replace(/\s+/g, ' ').trim();
  if (!term || term.length > 600) return null;
  const range = selection.getRangeAt(0);
  const rects = [...range.getClientRects()];
  const box = rects.at(-1) || range.getBoundingClientRect();
  if (!box.width && !box.height) return null;
  const pageText = document.body?.innerText || '';
  const needle = pageText.indexOf(term);
  const context = needle >= 0 ? pageText.slice(Math.max(0, needle - 320), Math.min(pageText.length, needle + term.length + 320)) : term;
  return { term, context, rect: { left: box.left, top: box.top, right: box.right, bottom: box.bottom }, selectionMode: selectionMode(term) };
}

function selectionMode(term: string): 'term' | 'sentence' | 'multi' {
  if (/[;；\n]|(?:\s*,\s*){2,}|(?:、).+(?:、)/.test(term)) return 'multi';
  if (term.length > 90 || /[。！？.!?]$/.test(term)) return 'sentence';
  return 'term';
}

function markdownFragment(text: string, sources: Array<{ id: number; url: string }>): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const byId = new Map(sources.map((source) => [source.id, source]));
  const appendInline = (target: HTMLElement, value: string) => {
    value.split(/(\[\[\d+\]\]|\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean).forEach((part) => {
      const citation = part.match(/^\[\[(\d+)\]\]$/); const strong = part.match(/^\*\*([\s\S]+)\*\*$/); const code = part.match(/^`([\s\S]+)`$/);
      if (citation && byId.has(Number(citation[1]))) { const link = document.createElement('a'); link.href = `#lexora-source-${citation[1]}`; link.textContent = `[${citation[1]}]`; link.title = '跳转到来源'; target.append(link); }
      else if (strong) { const node = document.createElement('strong'); node.textContent = strong[1]; target.append(node); }
      else if (code) { const node = document.createElement('code'); node.textContent = code[1]; target.append(node); }
      else target.append(document.createTextNode(part));
    });
  };
  text.split(/\n{2,}/).filter(Boolean).forEach((block) => {
    if (/^(?:[-*] )/m.test(block)) { const list = document.createElement('ul'); block.split('\n').filter(Boolean).forEach((line) => { const item = document.createElement('li'); appendInline(item, line.replace(/^[-*] /, '')); list.append(item); }); fragment.append(list); }
    else { const paragraph = document.createElement('p'); appendInline(paragraph, block.replace(/\n/g, ' ')); fragment.append(paragraph); }
  });
  return fragment;
}

export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  main() {
    const host = document.createElement('div');
    host.dataset.lexoraHost = 'true';
    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = css;
    const root = document.createElement('div');
    shadow.append(style, root);
    document.documentElement.append(host);

    let view: View = 'hidden';
    let draft: SelectionDraft | null = null;
    let result: ExplanationResult | null = null;
    let deepResult: ExplanationResult | null = null;
    let deepLoading = false;
    let deepError: string | null = null;
    let lookupError: { message: string; code?: string } | null = null;
    let chatMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    let chatPending = false;
    let speaking = false;
    let tab: Tab = 'oneLine';
    let preference: DomainPreference = 'auto';
    let pinned = false;
    let panelPosition: { left: number; top: number } | null = null;
    let queuedDraft: SelectionDraft | null = null;
    let coreRequestId: string | null = null;
    let deepRequestId: string | null = null;
    let deepPreference: DomainPreference | null = null;
    let selectionTimer = 0;

    const cancelRequest = (requestId: string | null) => { if (requestId) void runtimeMessage({ type: 'CANCEL_REQUEST', requestId }, requestId); };
    const cancelActive = () => { cancelRequest(coreRequestId); cancelRequest(deepRequestId); coreRequestId = null; deepRequestId = null; deepLoading = false; };
    const hide = () => { if (!pinned) { cancelActive(); view = 'hidden'; draft = null; render(); } };
    const triggerPosition = (selection: SelectionDraft) => ({ left: clamp(selection.rect.right - 76, 8, window.innerWidth - 88), top: clamp(selection.rect.bottom + 7, 8, window.innerHeight - 40) });
    const panelStart = (selection: SelectionDraft) => ({ left: clamp(selection.rect.right + 12, 12, window.innerWidth - 402), top: clamp(selection.rect.bottom + 12, 12, window.innerHeight - 400) });

    async function lookup() {
      if (!draft) return;
      cancelActive(); const requestId = crypto.randomUUID(); coreRequestId = requestId;
      view = 'loading'; result = null; deepResult = null; deepError = null; deepPreference = null; lookupError = null; chatMessages = []; tab = 'oneLine'; panelPosition ??= panelStart(draft); render();
      void lookupDeep(inferSourcePreference(draft));
      const response = await runtimeMessage({ type: 'LOOKUP_CORE', draft, preference }, requestId);
      if (coreRequestId !== requestId) return; coreRequestId = null;
      if (!response.ok) { lookupError = { message: response.error, code: response.code }; view = 'error'; render(); return; }
      if (!('result' in response)) { lookupError = { message: 'Lexora 后台返回了无效结果，请重试。' }; view = 'error'; render(); return; }
      result = response.result; view = 'result'; render();
      const resolvedPreference = inferSourcePreference(draft, result);
      if (deepPreference !== resolvedPreference) void lookupDeep(resolvedPreference);
    }

    function inferSourcePreference(selection: SelectionDraft, explanation?: ExplanationResult | null): DomainPreference {
      if (preference !== 'auto') return preference;
      if (explanation?.domain === 'medicine' || explanation?.domain === 'ai') return explanation.domain;
      const value = `${selection.term} ${selection.context}`.toLowerCase();
      if (/\b(transformer|bert|gpt|llm|rag|diffusion|attention|neural network|machine learning|deep learning)\b/.test(value)) return 'ai';
      if (/\b(rsv|antibody|antiviral|vaccine|disease|syndrome|clinical|patient|treatment|therapy|protein|virus|infection)\b|[\u4e00-\u9fff]{2,}(?:炎|症|病|抗体|疫苗|药物)/.test(value)) return 'medicine';
      return 'auto';
    }

    async function lookupDeep(sourcePreference = inferSourcePreference(draft!, result)) {
      if (!draft) return;
      if (deepLoading && deepPreference === sourcePreference) return;
      cancelRequest(deepRequestId);
      const requestId = crypto.randomUUID(); deepRequestId = requestId;
      deepPreference = sourcePreference; deepLoading = true; deepError = null; render();
      const response = await runtimeMessage({ type: 'LOOKUP_DEEP', draft, preference: sourcePreference, searchTerm: result?.canonicalNameEn || draft.term }, requestId);
      if (deepRequestId !== requestId) return; deepRequestId = null;
      deepLoading = false;
      if (!response.ok) { deepError = response.error; render(); return; }
      if ('result' in response) deepResult = response.result;
      render();
    }

    async function sendChat(form: HTMLFormElement) {
      if (!draft || !result || chatPending) return;
      const input = form.querySelector<HTMLInputElement>('input'); const question = input?.value.trim();
      if (!question) return;
      cancelActive(); const requestId = crypto.randomUUID(); coreRequestId = requestId;
      chatMessages = [...chatMessages, { role: 'user' as const, content: question }].slice(-10); chatPending = true; if (input) input.value = ''; render();
      const response = await runtimeMessage({ type: 'TERM_CHAT', draft, preference, sources: (deepResult || result).sources, conversation: chatMessages }, requestId);
      if (coreRequestId !== requestId) return; coreRequestId = null;
      chatPending = false;
      if (response.ok && 'reply' in response) chatMessages = [...chatMessages, { role: 'assistant' as const, content: response.reply }];
      else if (!response.ok) chatMessages = [...chatMessages, { role: 'assistant' as const, content: `暂时无法回答：${response.error}` }];
      render();
    }

    async function speakTerm() {
      if (!draft || !('speechSynthesis' in window)) return;
      if (speaking) { speechSynthesis.cancel(); speaking = false; render(); return; }
      const response = await runtimeMessage({ type: 'GET_SETTINGS' });
      const settings = response.ok && 'settings' in response ? response.settings : null;
      const isChinese = /[\u3400-\u9fff]/.test(draft.term);
      const preferred = isChinese ? settings?.chineseVoiceName : settings?.englishVoiceName;
      const voices = speechSynthesis.getVoices();
      const voice = voices.find((item) => item.name === preferred) || voices.find((item) => item.lang.toLowerCase().startsWith(isChinese ? 'zh' : 'en')) || null;
      const utterance = new SpeechSynthesisUtterance(draft.term);
      utterance.lang = isChinese ? 'zh-CN' : 'en-US'; utterance.rate = isChinese ? 0.94 : 0.9; if (voice) utterance.voice = voice;
      speaking = true; utterance.onend = utterance.onerror = () => { speaking = false; render(); }; speechSynthesis.cancel(); speechSynthesis.speak(utterance); render();
    }

    function showSelection() {
      const selection = textSelection();
      if (!selection) return;
      if (draft?.term === selection.term && view !== 'hidden') return;
      if (pinned && view !== 'hidden') { queuedDraft = selection; render(); return; }
      draft = selection;
      if (!pinned) panelPosition = null;
      view = 'trigger';
      render();
    }

    function render() {
      root.replaceChildren();
      if (view === 'hidden' || !draft) return;
      if (view === 'trigger') {
        const button = document.createElement('button');
        button.className = 'lexora-trigger'; button.type = 'button';
        const pos = triggerPosition(draft); button.style.left = `${pos.left}px`; button.style.top = `${pos.top}px`;
        button.innerHTML = '<span>L</span>解读'; button.title = `用 Lexora 解读 ${draft.term}`;
        button.addEventListener('click', () => void lookup()); root.append(button); return;
      }
      const panel = document.createElement('section');
      panel.className = 'lexora-panel'; panel.tabIndex = -1;
      const pos = panelPosition || panelStart(draft); panel.style.left = `${pos.left}px`; panel.style.top = `${pos.top}px`;
      const header = document.createElement('header'); header.className = 'lexora-header';
      const select = document.createElement('select'); select.className = 'lexora-domain'; select.innerHTML = '<option value="auto">自动识别</option><option value="medicine">医学</option><option value="ai">AI</option><option value="general">通用</option>'; select.value = preference;
      select.addEventListener('change', () => { preference = select.value as DomainPreference; if (view === 'result') void lookup(); });
      const actions = document.createElement('div'); actions.className = 'lexora-actions';
      const pin = document.createElement('button'); pin.className = `lexora-icon${pinned ? ' is-pinned' : ''}`; pin.type = 'button'; pin.textContent = '⚑'; pin.title = pinned ? '取消固定' : '固定在页面上'; pin.setAttribute('aria-pressed', String(pinned));
      pin.addEventListener('click', () => { pinned = !pinned; render(); });
      const close = document.createElement('button'); close.className = 'lexora-icon'; close.type = 'button'; close.textContent = '×'; close.title = '关闭'; close.addEventListener('click', () => { cancelActive(); pinned = false; view = 'hidden'; draft = null; panelPosition = null; render(); });
      actions.append(pin, close); header.append(select, actions); panel.append(header);
      let drag: { x: number; y: number; pointer: number } | null = null;
      header.addEventListener('pointerdown', (event) => { if (event.target instanceof HTMLSelectElement || event.target instanceof HTMLButtonElement) return; const rect = panel.getBoundingClientRect(); drag = { x: event.clientX - rect.left, y: event.clientY - rect.top, pointer: event.pointerId }; header.setPointerCapture(event.pointerId); });
      header.addEventListener('pointermove', (event) => { if (!drag || drag.pointer !== event.pointerId) return; panelPosition = { left: clamp(event.clientX - drag.x, 8, window.innerWidth - panel.offsetWidth - 8), top: clamp(event.clientY - drag.y, 8, window.innerHeight - panel.offsetHeight - 8) }; panel.style.left = `${panelPosition.left}px`; panel.style.top = `${panelPosition.top}px`; });
      header.addEventListener('pointerup', () => { drag = null; });
      const body = document.createElement('div'); body.className = 'lexora-body';
      const titleRow = document.createElement('div'); titleRow.className = 'lexora-term-row';
      const title = document.createElement('h1'); title.className = 'lexora-term'; title.textContent = draft.term;
      const speech = document.createElement('button'); speech.className = `lexora-speech${speaking ? ' is-speaking' : ''}`; speech.type = 'button'; speech.textContent = speaking ? '■' : '♬'; speech.title = speaking ? '停止朗读' : '朗读术语'; speech.addEventListener('click', () => void speakTerm()); titleRow.append(title, speech); body.append(titleRow);
      if (view === 'loading') {
        const loading = document.createElement('div'); loading.className = 'lexora-loading'; loading.innerHTML = '<span class="lexora-dots"><i></i><i></i><i></i></span><span>正在生成一句话与简明解释…</span>'; body.append(loading);
      } else if (view === 'error') {
        const error = document.createElement('div'); error.className = 'lexora-error'; error.textContent = lookupError?.message || '解读失败，请重试。';
        const retry = document.createElement('button'); retry.textContent = lookupError?.code === 'CONFIG_MISSING' ? '打开设置' : '重新查询'; retry.addEventListener('click', () => lookupError?.code === 'CONFIG_MISSING' ? chrome.runtime.openOptionsPage() : void lookup()); error.append(document.createElement('br'), retry); body.append(error);
      } else if (result) {
        if (result.canonicalNameZh || result.canonicalNameEn) { const canonical = document.createElement('p'); canonical.className = 'lexora-canonical'; canonical.textContent = result.canonicalNameZh && result.canonicalNameEn ? `${result.canonicalNameZh}（${result.canonicalNameEn}）` : result.canonicalNameZh || result.canonicalNameEn; body.append(canonical); }
        const tabs = document.createElement('nav'); tabs.className = 'lexora-tabs';
        const activeResult = tab === 'deep' && deepResult ? deepResult : result;
        const answers: Record<Tab, string> = { oneLine: result.oneLine, brief: result.briefIntro, deep: activeResult.deepIntro };
        ([['oneLine', '一句话'], ['brief', '简明'], ['deep', '深入']] as const).forEach(([key, label]) => { const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.className = tab === key ? 'is-active' : ''; button.addEventListener('click', () => { tab = key; if (key === 'deep' && !deepResult) void lookupDeep(); else render(); }); tabs.append(button); });
        if (tab === 'deep' && deepLoading) { const loading = document.createElement('div'); loading.className = 'lexora-loading'; loading.innerHTML = '<span class="lexora-dots"><i></i><i></i><i></i></span><span>正在检索文献并生成深入解读…</span>'; body.append(tabs, loading); }
        else {
          const answer = document.createElement('div'); answer.className = 'lexora-answer'; answer.append(markdownFragment(answers[tab], activeResult.sources));
          const confidenceLabel = activeResult.confidence === 'high' ? '高置信' : activeResult.confidence === 'medium' ? '中等置信' : '信息不足';
          const note = document.createElement('p'); note.className = 'lexora-note'; note.textContent = `ⓘ ${confidenceLabel}：${activeResult.confidenceReason}`;
          body.append(tabs, answer, note);
          if (tab !== 'oneLine' && activeResult.relationshipSummary) { const relationship = document.createElement('p'); relationship.className = 'lexora-note'; relationship.textContent = `概念关系：${activeResult.relationshipSummary}`; body.append(relationship); }
          if (draft.selectionMode !== 'term' && activeResult.keyConcepts.length) { const mapping = document.createElement('div'); mapping.className = 'lexora-note'; const heading = document.createElement('strong'); heading.textContent = '原文对应'; mapping.append(heading); activeResult.keyConcepts.forEach((item) => { const line = document.createElement('div'); const term = document.createElement('code'); term.textContent = item.term; line.append(document.createElement('br'), term, document.createTextNode(`：${item.explanation}`)); mapping.append(line); }); body.append(mapping); }
          if (activeResult.alternativeMeanings.length) { const alternatives = document.createElement('details'); alternatives.className = 'lexora-note'; const summary = document.createElement('summary'); summary.textContent = '其他可能含义'; alternatives.append(summary); const list = document.createElement('ul'); activeResult.alternativeMeanings.forEach((item) => { const line = document.createElement('li'); line.textContent = `${item.label} · ${item.domain}：${item.reason}`; list.append(line); }); alternatives.append(list); body.append(alternatives); }
          if (activeResult.domain === 'medicine') { const safety = document.createElement('p'); safety.className = 'lexora-note'; safety.textContent = activeResult.safetyClass === 'medical_high_risk' ? '医学文献理解辅助：此处可能涉及高风险医疗信息；请勿据此自行诊断、治疗或调整用药。' : '医学文献理解辅助：不用于诊断、治疗或个体化用药建议。'; body.append(safety); }
          if (tab === 'deep') {
            if (deepError) { const failed = document.createElement('p'); failed.className = 'lexora-note'; failed.textContent = `文献增强暂时不可用，先显示基础解释。${deepError}`; body.append(failed); }
            else if (activeResult.sources.length) { const sources = document.createElement('details'); sources.className = 'lexora-note'; sources.open = true; sources.innerHTML = `<summary>来源 ${activeResult.sources.length}</summary>`; const list = document.createElement('ol'); activeResult.sources.forEach((source) => { const item = document.createElement('li'); item.id = `lexora-source-${source.id}`; const link = document.createElement('a'); link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = source.title; item.append(link, document.createTextNode(` · ${[source.authors[0], source.venue, source.year].filter(Boolean).join(' · ')}`)); list.append(item); }); sources.append(list); body.append(sources); }
            else { const noSources = document.createElement('p'); noSources.className = 'lexora-note'; noSources.textContent = '暂未检索到足够相关的可信来源，本次深入解读未添加引文。'; body.append(noSources); }
          }
          if (chatMessages.length) { const chat = document.createElement('div'); chat.className = 'lexora-note'; chatMessages.forEach((message) => { const line = document.createElement('div'); const author = document.createElement('strong'); author.textContent = `${message.role === 'user' ? '你' : 'Lexora'}：`; line.append(author, markdownFragment(message.content, activeResult.sources)); chat.append(line); }); if (chatPending) chat.insertAdjacentHTML('beforeend', '<p><strong>Lexora：</strong>正在思考…</p>'); body.append(chat); }
          const composer = document.createElement('form'); composer.className = 'lexora-composer'; composer.innerHTML = `<input aria-label="继续向 AI 提问" placeholder="继续问 AI…" ${chatPending ? 'disabled' : ''}><button type="submit">→</button>`; composer.addEventListener('submit', (event) => { event.preventDefault(); void sendChat(composer); }); body.append(composer);
        }
      }
      panel.append(body); root.append(panel); panel.focus({ preventScroll: true });
      if (pinned && queuedDraft) {
        const next = document.createElement('button'); next.className = 'lexora-trigger'; next.type = 'button'; const queuedPos = triggerPosition(queuedDraft); next.style.left = `${queuedPos.left}px`; next.style.top = `${queuedPos.top}px`; next.innerHTML = '<span>L</span>解读'; next.title = `用 Lexora 解读 ${queuedDraft.term}`;
        next.addEventListener('click', () => { const nextDraft = queuedDraft; if (!nextDraft) return; draft = nextDraft; queuedDraft = null; result = null; deepResult = null; chatMessages = []; panelPosition = panelStart(nextDraft); void lookup(); }); root.append(next);
      }
    }

    const scheduleSelection = (delay: number) => { window.clearTimeout(selectionTimer); selectionTimer = window.setTimeout(showSelection, delay); };
    document.addEventListener('pointerup', () => scheduleSelection(80), true);
    document.addEventListener('keyup', (event) => { if (event.key === 'Shift' || event.shiftKey) scheduleSelection(90); }, true);
    document.addEventListener('selectionchange', () => scheduleSelection(150), true);
    document.addEventListener('pointerdown', (event) => { if (!host.contains(event.target as Node)) window.setTimeout(hide, 0); }, true);
    document.addEventListener('focusin', (event) => { if (!host.contains(event.target as Node) && document.activeElement !== document.body) window.setTimeout(hide, 0); }, true);
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { cancelActive(); pinned = false; view = 'hidden'; draft = null; panelPosition = null; render(); } });
  },
});
