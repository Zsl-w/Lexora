import type { DomainPreference, ExplanationResult, LexoraSettings, SelectionDraft } from '../shared/types';

const DEFAULT_MODEL = 'deepseek-v4-flash';

export const defaultSettings = (): LexoraSettings => ({ apiKey: '', model: DEFAULT_MODEL });

export async function explainSelection(
  draft: SelectionDraft,
  preference: DomainPreference,
  settings: LexoraSettings,
): Promise<ExplanationResult> {
  if (!settings.apiKey.trim()) {
    throw Object.assign(new Error('请先在 Lexora 设置中配置 DeepSeek API Key。'), { code: 'CONFIG_MISSING' });
  }

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${settings.apiKey.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: settings.model || DEFAULT_MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: '你是 Lexora，一个谨慎的专业术语阅读助手。仅返回合法 JSON，不要使用 Markdown。医学内容仅作术语解释，不给诊断、治疗或个体化用药建议。',
        },
        {
          role: 'user',
          content: `请结合上下文解释划选内容。领域偏好：${preference}。\n\n划选内容：${draft.term}\n\n附近上下文：${draft.context}\n\n返回此 JSON 结构：{"canonicalNameZh":"中文规范名或空字符串","canonicalNameEn":"英文规范名或原词","domain":"medicine|ai|general","oneLine":"不超过45字的一句话解释","briefIntro":"2到4句简明解释","deepIntro":"一段稍深入的解释，不引用未检索的论文","confidenceReason":"一句说明判断依据或不确定性"}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw Object.assign(new Error(`DeepSeek 请求失败（${response.status}）。`), { code: 'NETWORK' });
  }

  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw Object.assign(new Error('DeepSeek 没有返回可解析的内容。'), { code: 'INVALID_RESPONSE' });

  try {
    const parsed = JSON.parse(content) as Partial<ExplanationResult>;
    if (!parsed.oneLine || !parsed.briefIntro) throw new Error('missing fields');
    return {
      canonicalNameZh: parsed.canonicalNameZh ?? '',
      canonicalNameEn: parsed.canonicalNameEn ?? draft.term,
      domain: parsed.domain === 'medicine' || parsed.domain === 'ai' ? parsed.domain : 'general',
      oneLine: parsed.oneLine,
      briefIntro: parsed.briefIntro,
      deepIntro: parsed.deepIntro ?? parsed.briefIntro,
      confidenceReason: parsed.confidenceReason ?? '基于划选内容及其附近上下文生成。',
    };
  } catch {
    throw Object.assign(new Error('DeepSeek 返回格式异常，请重试。'), { code: 'INVALID_RESPONSE' });
  }
}
