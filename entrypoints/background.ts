import { defineBackground } from 'wxt/utils/define-background';
import { chatAboutTerm, defaultSettings, explainSelection } from '../src-rebuild/background/deepseek';
import { retrieveSources } from '../src-rebuild/background/source-search';
import type { ExplanationResult, LexoraSettings, RuntimeRequest, RuntimeResponse } from '../src-rebuild/shared/types';

const SETTINGS_KEY = 'lexora-settings';
const PENDING_TERM_KEY = 'lexora-pending-term';
const CORE_CACHE_KEY = 'lexora-core-cache';
const CORE_CACHE_TTL = 12 * 60 * 60 * 1000;
const coreCache = new Map<string, { expiresAt: number; result: ExplanationResult }>();

function cacheKey(term: string, context: string, preference: string) {
  return `${preference}\u0000${term}\u0000${context.slice(0, 1000)}`;
}

async function readPersistentCache(key: string): Promise<ExplanationResult | null> {
  const stored = await chrome.storage.local.get(CORE_CACHE_KEY);
  const items = Array.isArray(stored[CORE_CACHE_KEY]) ? stored[CORE_CACHE_KEY] as Array<{ key?: unknown; savedAt?: unknown; result?: unknown }> : [];
  const now = Date.now();
  for (const item of items) {
    if (item.key !== key || typeof item.savedAt !== 'number' || now - item.savedAt > CORE_CACHE_TTL || !item.result || typeof item.result !== 'object') continue;
    return item.result as ExplanationResult;
  }
  return null;
}

async function writePersistentCache(key: string, result: ExplanationResult) {
  const stored = await chrome.storage.local.get(CORE_CACHE_KEY);
  const now = Date.now();
  const prior = Array.isArray(stored[CORE_CACHE_KEY]) ? stored[CORE_CACHE_KEY] as Array<{ key?: unknown; savedAt?: unknown; result?: unknown }> : [];
  const items = [{ key, savedAt: now, result }, ...prior.filter((item) => item.key !== key && typeof item.savedAt === 'number' && now - item.savedAt <= CORE_CACHE_TTL)].slice(0, 12);
  await chrome.storage.local.set({ [CORE_CACHE_KEY]: items });
}

async function getSettings(): Promise<LexoraSettings> {
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  return { ...defaultSettings(), ...(stored[SETTINGS_KEY] as Partial<LexoraSettings> | undefined) };
}

export default defineBackground(() => {
  void chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' });
  chrome.runtime.onInstalled.addListener(() => {
    void (async () => {
      await chrome.contextMenus.removeAll();
      chrome.contextMenus.create({ id: 'lexora-explain-selection', title: '用 Lexora 解读“%s”', contexts: ['selection'] });
    })();
  });
  chrome.contextMenus.onClicked.addListener((info) => {
    const term = info.menuItemId === 'lexora-explain-selection' ? info.selectionText?.trim().slice(0, 500) : '';
    if (!term) return;
    void chrome.storage.local.set({ [PENDING_TERM_KEY]: term }).then(async () => {
      try { await chrome.action.openPopup(); }
      catch { await chrome.action.setBadgeText({ text: '1' }); await chrome.action.setBadgeBackgroundColor({ color: '#4F5FC7' }); }
    });
  });
  chrome.runtime.onMessage.addListener((request: RuntimeRequest, _sender, sendResponse) => {
    void (async () => {
      try {
        if (request.type === 'GET_SETTINGS') {
          sendResponse({ ok: true, settings: await getSettings() } satisfies RuntimeResponse);
          return;
        }
        if (request.type === 'SAVE_SETTINGS') {
          await chrome.storage.local.set({ [SETTINGS_KEY]: request.settings });
          sendResponse({ ok: true } satisfies RuntimeResponse);
          return;
        }
        if (request.type === 'VERIFY_API_KEY') {
          const response = await fetch('https://api.deepseek.com/models', { headers: { Authorization: `Bearer ${request.apiKey.trim()}` } });
          if (!response.ok) throw Object.assign(new Error(response.status === 401 ? 'DeepSeek API Key 无效。' : `DeepSeek 验证失败（${response.status}）。`), { code: 'NETWORK' });
          sendResponse({ ok: true } satisfies RuntimeResponse);
          return;
        }
        if (request.type === 'DELETE_API_KEY') {
          const settings = await getSettings(); settings.apiKey = ''; await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
          sendResponse({ ok: true } satisfies RuntimeResponse);
          return;
        }
        if (request.type === 'LOOKUP_CORE') {
          const key = cacheKey(request.draft.term, request.draft.context, request.preference);
          const cached = coreCache.get(key);
          const persistent = !cached || cached.expiresAt <= Date.now() ? await readPersistentCache(key) : null;
          const result = cached && cached.expiresAt > Date.now() ? cached.result : persistent || await explainSelection(request.draft, request.preference, await getSettings());
          if (!cached || cached.expiresAt <= Date.now()) { coreCache.set(key, { result, expiresAt: Date.now() + CORE_CACHE_TTL }); if (!persistent) await writePersistentCache(key, result); }
          sendResponse({ ok: true, result } satisfies RuntimeResponse);
          return;
        }
        if (request.type === 'LOOKUP_DEEP') {
          const sources = await retrieveSources(request.searchTerm || request.draft.term, request.draft.context, request.preference);
          const result = await explainSelection(request.draft, request.preference, await getSettings(), sources, true);
          sendResponse({ ok: true, result } satisfies RuntimeResponse);
          return;
        }
        if (request.type === 'TERM_CHAT') {
          const reply = await chatAboutTerm(request.draft, request.preference, await getSettings(), request.sources, request.conversation);
          sendResponse({ ok: true, reply } satisfies RuntimeResponse);
        }
      } catch (error) {
        const candidate = error as Error & { code?: RuntimeResponse extends { code?: infer C } ? C : never };
        sendResponse({ ok: false, error: candidate.message || '请求失败，请稍后重试。', code: candidate.code } satisfies RuntimeResponse);
      }
    })();
    return true;
  });
});
