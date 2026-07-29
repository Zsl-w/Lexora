export type DomainPreference = 'auto' | 'medicine' | 'ai' | 'general';

export interface SelectionDraft {
  term: string;
  context: string;
  rect: { left: number; top: number; right: number; bottom: number };
}

export interface ExplanationResult {
  canonicalNameZh: string;
  canonicalNameEn: string;
  domain: DomainPreference;
  oneLine: string;
  briefIntro: string;
  deepIntro: string;
  confidenceReason: string;
}

export interface LexoraSettings {
  apiKey: string;
  model: string;
}

export type RuntimeRequest =
  | { type: 'LOOKUP_CORE'; draft: SelectionDraft; preference: DomainPreference }
  | { type: 'GET_SETTINGS' }
  | { type: 'SAVE_SETTINGS'; settings: LexoraSettings };

export type RuntimeResponse =
  | { ok: true; result: ExplanationResult }
  | { ok: true; settings: LexoraSettings }
  | { ok: true }
  | { ok: false; error: string; code?: 'CONFIG_MISSING' | 'NETWORK' | 'INVALID_RESPONSE' };
