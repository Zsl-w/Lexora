import type { LexoraSettings, RuntimeRequest, RuntimeResponse } from '../shared/types';

const style = document.createElement('style');
style.textContent = `
  :root { color:#20232b; background:#f7f8fb; font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; } *{box-sizing:border-box} body{margin:0} main{display:grid;min-height:100vh;place-items:center;padding:28px}.card{width:min(520px,100%);padding:34px;border:1px solid #e0e3ec;border-radius:20px;background:#fff;box-shadow:0 18px 50px rgba(28,34,54,.08)}.brand{display:flex;align-items:center;gap:9px;font-size:19px}.brand span{display:grid;width:29px;height:29px;place-items:center;border-radius:9px;background:#eef0ff;color:#5665ce;font-weight:800}h1{margin:28px 0 9px;font-size:28px;letter-spacing:-.04em}.intro,.boundary{color:#707684;font-size:14px;line-height:1.65}.boundary{margin:24px 0 0;padding-top:18px;border-top:1px solid #edf0f4}form{display:grid;gap:16px;margin-top:27px}label{display:grid;gap:8px;font-size:14px;font-weight:650}input,select{height:43px;padding:0 12px;border:1px solid #d9dde7;border-radius:10px;background:#fff;font:inherit;font-weight:400;outline:none}input:focus,select:focus{border-color:#5a67d8;box-shadow:0 0 0 3px #eef0ff}button{height:43px;border:0;border-radius:10px;background:#20232b;color:#fff;font:inherit;font-weight:650;cursor:pointer}#status{min-height:20px;margin:0;color:#5363c8;font-size:14px}`;
document.head.append(style);

function message(request: RuntimeRequest): Promise<RuntimeResponse> {
  return new Promise((resolve) => chrome.runtime.sendMessage(request, (response: RuntimeResponse) => resolve(response)));
}

const key = document.querySelector<HTMLInputElement>('#api-key')!;
const model = document.querySelector<HTMLInputElement>('#model')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;
const chineseVoice = document.querySelector<HTMLSelectElement>('#chinese-voice')!;
const englishVoice = document.querySelector<HTMLSelectElement>('#english-voice')!;

function fillVoices() {
  const voices = speechSynthesis.getVoices();
  const fill = (select: HTMLSelectElement, prefix: string) => voices.filter((voice) => voice.lang.toLowerCase().startsWith(prefix)).forEach((voice) => { const option = document.createElement('option'); option.value = voice.name; option.textContent = `${voice.name} · ${voice.lang}`; select.append(option); });
  fill(chineseVoice, 'zh'); fill(englishVoice, 'en');
}
fillVoices(); speechSynthesis.addEventListener('voiceschanged', fillVoices, { once: true });

void message({ type: 'GET_SETTINGS' }).then((response) => {
  if (response.ok && 'settings' in response) { key.value = response.settings.apiKey; model.value = response.settings.model; chineseVoice.value = response.settings.chineseVoiceName || ''; englishVoice.value = response.settings.englishVoiceName || ''; }
});

document.querySelector<HTMLFormElement>('#settings-form')!.addEventListener('submit', async (event) => {
  event.preventDefault();
  const settings: LexoraSettings = { apiKey: key.value.trim(), model: model.value.trim() || 'deepseek-v4-flash', chineseVoiceName: chineseVoice.value || null, englishVoiceName: englishVoice.value || null };
  const response = await message({ type: 'SAVE_SETTINGS', settings });
  status.textContent = response.ok ? '已保存。返回阅读页面后即可使用。' : '保存失败，请重试。';
});
