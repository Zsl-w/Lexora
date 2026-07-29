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
  .lexora-term { margin:0; font-size:29px; line-height:1.18; letter-spacing:-.04em; overflow-wrap:anywhere; }
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

function runtimeMessage(request: RuntimeRequest): Promise<RuntimeResponse> {
  return new Promise((resolve) => {
    if (!chrome.runtime?.id) {
      resolve({ ok: false, error: '扩展刚刚重新加载，请刷新当前页面后重试。' });
      return;
    }
    chrome.runtime.sendMessage(request, (response: RuntimeResponse | undefined) => {
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
    return { term, context: active.value.slice(Math.max(0, start - 280), Math.min(active.value.length, end + 280)), rect: { left: box.left, top: box.top, right: box.right, bottom: box.bottom } };
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
  return { term, context, rect: { left: box.left, top: box.top, right: box.right, bottom: box.bottom } };
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
    let tab: Tab = 'oneLine';
    let preference: DomainPreference = 'auto';
    let pinned = false;
    let panelPosition: { left: number; top: number } | null = null;
    let selectionTimer = 0;

    const hide = () => { if (!pinned) { view = 'hidden'; draft = null; render(); } };
    const triggerPosition = (selection: SelectionDraft) => ({ left: clamp(selection.rect.right - 76, 8, window.innerWidth - 88), top: clamp(selection.rect.bottom + 7, 8, window.innerHeight - 40) });
    const panelStart = (selection: SelectionDraft) => ({ left: clamp(selection.rect.right + 12, 12, window.innerWidth - 402), top: clamp(selection.rect.bottom + 12, 12, window.innerHeight - 400) });

    async function lookup() {
      if (!draft) return;
      view = 'loading'; result = null; tab = 'oneLine'; panelPosition ??= panelStart(draft); render();
      const response = await runtimeMessage({ type: 'LOOKUP_CORE', draft, preference });
      if (!response.ok) { view = 'error'; render(response.error, response.code); return; }
      if (!('result' in response)) { view = 'error'; render('Lexora 后台返回了无效结果，请重试。'); return; }
      result = response.result; view = 'result'; render();
    }

    function showSelection() {
      const selection = textSelection();
      if (!selection) return;
      if (draft?.term === selection.term && view !== 'hidden') return;
      draft = selection;
      if (!pinned) panelPosition = null;
      view = 'trigger';
      render();
    }

    function render(errorMessage?: string, errorCode?: string) {
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
      const close = document.createElement('button'); close.className = 'lexora-icon'; close.type = 'button'; close.textContent = '×'; close.title = '关闭'; close.addEventListener('click', () => { pinned = false; view = 'hidden'; draft = null; panelPosition = null; render(); });
      actions.append(pin, close); header.append(select, actions); panel.append(header);
      let drag: { x: number; y: number; pointer: number } | null = null;
      header.addEventListener('pointerdown', (event) => { if (event.target instanceof HTMLSelectElement || event.target instanceof HTMLButtonElement) return; const rect = panel.getBoundingClientRect(); drag = { x: event.clientX - rect.left, y: event.clientY - rect.top, pointer: event.pointerId }; header.setPointerCapture(event.pointerId); });
      header.addEventListener('pointermove', (event) => { if (!drag || drag.pointer !== event.pointerId) return; panelPosition = { left: clamp(event.clientX - drag.x, 8, window.innerWidth - panel.offsetWidth - 8), top: clamp(event.clientY - drag.y, 8, window.innerHeight - panel.offsetHeight - 8) }; panel.style.left = `${panelPosition.left}px`; panel.style.top = `${panelPosition.top}px`; });
      header.addEventListener('pointerup', () => { drag = null; });
      const body = document.createElement('div'); body.className = 'lexora-body';
      const title = document.createElement('h1'); title.className = 'lexora-term'; title.textContent = draft.term; body.append(title);
      if (view === 'loading') {
        const loading = document.createElement('div'); loading.className = 'lexora-loading'; loading.innerHTML = '<span class="lexora-dots"><i></i><i></i><i></i></span><span>正在生成一句话与简明解释…</span>'; body.append(loading);
      } else if (view === 'error') {
        const error = document.createElement('div'); error.className = 'lexora-error'; error.textContent = errorMessage || '解读失败，请重试。';
        const retry = document.createElement('button'); retry.textContent = errorCode === 'CONFIG_MISSING' ? '打开设置' : '重新查询'; retry.addEventListener('click', () => errorCode === 'CONFIG_MISSING' ? chrome.runtime.openOptionsPage() : void lookup()); error.append(document.createElement('br'), retry); body.append(error);
      } else if (result) {
        if (result.canonicalNameZh || result.canonicalNameEn) { const canonical = document.createElement('p'); canonical.className = 'lexora-canonical'; canonical.textContent = result.canonicalNameZh && result.canonicalNameEn ? `${result.canonicalNameZh}（${result.canonicalNameEn}）` : result.canonicalNameZh || result.canonicalNameEn; body.append(canonical); }
        const tabs = document.createElement('nav'); tabs.className = 'lexora-tabs';
        const answers: Record<Tab, string> = { oneLine: result.oneLine, brief: result.briefIntro, deep: result.deepIntro };
        ([['oneLine', '一句话'], ['brief', '简明'], ['deep', '深入']] as const).forEach(([key, label]) => { const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.className = tab === key ? 'is-active' : ''; button.addEventListener('click', () => { tab = key; render(); }); tabs.append(button); });
        const answer = document.createElement('p'); answer.className = 'lexora-answer'; answer.textContent = answers[tab];
        const note = document.createElement('p'); note.className = 'lexora-note'; note.textContent = `ⓘ ${result.confidenceReason}`;
        body.append(tabs, answer, note);
        const composer = document.createElement('form'); composer.className = 'lexora-composer'; composer.innerHTML = '<input aria-label="继续向 AI 提问" placeholder="继续问 AI…" disabled><button type="submit" title="重建中">→</button>'; body.append(composer);
      }
      panel.append(body); root.append(panel); panel.focus({ preventScroll: true });
    }

    document.addEventListener('pointerup', () => window.clearTimeout(selectionTimer), true);
    document.addEventListener('selectionchange', () => { window.clearTimeout(selectionTimer); selectionTimer = window.setTimeout(showSelection, 130); }, true);
    document.addEventListener('pointerdown', (event) => { if (!host.contains(event.target as Node)) window.setTimeout(hide, 0); }, true);
    document.addEventListener('focusin', (event) => { if (!host.contains(event.target as Node) && document.activeElement !== document.body) window.setTimeout(hide, 0); }, true);
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { pinned = false; view = 'hidden'; draft = null; panelPosition = null; render(); } });
  },
});
