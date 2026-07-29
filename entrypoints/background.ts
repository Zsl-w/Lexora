import { defineBackground } from 'wxt/utils/define-background';
import { chatAboutTerm, defaultSettings, explainSelection } from '../src-rebuild/background/deepseek';
import { retrieveSources } from '../src-rebuild/background/source-search';
import type { LexoraSettings, RuntimeRequest, RuntimeResponse } from '../src-rebuild/shared/types';

const SETTINGS_KEY = 'lexora-settings';

async function getSettings(): Promise<LexoraSettings> {
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  return { ...defaultSettings(), ...(stored[SETTINGS_KEY] as Partial<LexoraSettings> | undefined) };
}

export default defineBackground(() => {
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
        if (request.type === 'LOOKUP_CORE') {
          const result = await explainSelection(request.draft, request.preference, await getSettings());
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
