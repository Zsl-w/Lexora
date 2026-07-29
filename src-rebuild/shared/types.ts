export type DomainPreference = 'auto' | 'medicine' | 'ai' | 'general';
export type SelectionMode = 'term' | 'sentence' | 'multi';
export type SourceProvider = 'pubmed' | 'arxiv' | 'crossref';

export interface SelectionDraft {
  term: string;
  context: string;
  rect: { left: number; top: number; right: number; bottom: number };
  selectionMode: SelectionMode;
}

export interface AcademicSource {
  id: number;
  provider: SourceProvider;
  identifier: string;
  title: string;
  authors: string[];
  year: number | null;
  venue: string | null;
  url: string;
  abstract: string | null;
}

export interface ExplanationResult {
  canonicalNameZh: string;
  canonicalNameEn: string;
  domain: DomainPreference;
  oneLine: string;
  briefIntro: string;
  deepIntro: string;
  confidence: 'high' | 'medium' | 'insufficient';
  confidenceReason: string;
  safetyClass: 'education' | 'medical_high_risk';
  keyConcepts: Array<{ term: string; explanation: string }>;
  relationshipSummary: string | null;
  alternativeMeanings: Array<{ label: string; domain: string; reason: string }>;
  sources: AcademicSource[];
}

export interface LexoraSettings {
  apiKey: string;
  model: string;
  chineseVoiceName?: string | null;
  englishVoiceName?: string | null;
}

export type RuntimeRequest = { requestId?: string } & (
  | { type: 'LOOKUP_CORE'; draft: SelectionDraft; preference: DomainPreference }
  | { type: 'LOOKUP_DEEP'; draft: SelectionDraft; preference: DomainPreference; searchTerm?: string }
  | { type: 'TERM_CHAT'; draft: SelectionDraft; preference: DomainPreference; sources: AcademicSource[]; conversation: Array<{ role: 'user' | 'assistant'; content: string }> }
  | { type: 'VERIFY_API_KEY'; apiKey: string }
  | { type: 'DELETE_API_KEY' }
  | { type: 'OPEN_OPTIONS' }
  | { type: 'GET_SETTINGS' }
  | { type: 'SAVE_SETTINGS'; settings: LexoraSettings }
  | { type: 'CANCEL_REQUEST' }
);

export type RuntimeResponse =
  | { ok: true; result: ExplanationResult }
  | { ok: true; reply: string }
  | { ok: true; settings: LexoraSettings }
  | { ok: true }
  | { ok: false; error: string; code?: 'CONFIG_MISSING' | 'NETWORK' | 'INVALID_RESPONSE' };
