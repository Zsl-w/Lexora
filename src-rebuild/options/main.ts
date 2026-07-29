import type { LexoraSettings, RuntimeRequest, RuntimeResponse } from '../shared/types';

const style = document.createElement('style');
style.textContent = `
  :root{color:#1c1d22;background:#f7f7f8;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}*{box-sizing:border-box}body{margin:0}.settings-shell{width:min(680px,calc(100vw - 40px));margin:64px auto 72px;background:#fff;border:1px solid #e5e6ea;border-radius:18px;box-shadow:0 18px 54px rgba(24,28,40,.07);overflow:hidden}.settings-header{padding:34px 38px 31px;border-bottom:1px solid #ececf0}.brand{display:flex;align-items:center;gap:9px;font-size:17px;letter-spacing:-.02em}.brand img{width:27px;height:27px;border-radius:8px}.eyebrow,.section-kicker{margin:28px 0 7px;color:#858994;font-size:11px;font-weight:750;letter-spacing:.14em}.settings-header h1{margin:0;font-size:30px;letter-spacing:-.055em;line-height:1.15}.intro{max-width:485px;margin:12px 0 0;color:#686d78;font-size:14px;line-height:1.7}form{display:grid;gap:0}.settings-section{padding:29px 38px 31px;border-bottom:1px solid #ececf0}.section-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:22px}.section-kicker{margin:0 0 5px}.section-heading h2{margin:0;font-size:18px;letter-spacing:-.025em}.section-note{margin:0;color:#858994;font-size:12px}.local-badge{padding:5px 8px;border:1px solid #dedfe7;border-radius:999px;color:#656a76;font-size:12px;white-space:nowrap}.field{display:grid;gap:8px;margin-top:16px;color:#363943;font-size:13px;font-weight:700}.field:first-of-type{margin-top:0}input,select{width:100%;height:44px;padding:0 12px;border:1px solid #d9dbe2;border-radius:9px;background:#fff;color:#20222a;font:inherit;font-size:14px;font-weight:400;outline:none;transition:border-color .16s,box-shadow .16s}input:focus,select:focus{border-color:#6774d6;box-shadow:0 0 0 3px rgba(103,116,214,.12)}.consent{display:grid;grid-template-columns:18px 1fr;align-items:start;gap:9px;margin-top:19px;color:#6d727e;font-size:12px;font-weight:400;line-height:1.6}.consent input{width:16px;height:16px;margin:2px 0 0;accent-color:#5d6bd3}.voice-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}.voice-row button{min-width:58px;background:#f2f3f6;color:#555b67}.form-footer{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:23px 38px}.buttons{display:flex;gap:8px;flex-shrink:0}button{height:42px;border:0;border-radius:9px;padding:0 15px;background:#20222a;color:#fff;font:inherit;font-size:14px;font-weight:700;cursor:pointer;transition:transform .15s,background .15s}button:hover{background:#343742}button:active{transform:translateY(1px)}#delete-key{background:transparent;color:#656a76;border:1px solid #dfe1e7}#delete-key:hover{background:#f4f4f6}#status{min-height:19px;margin:0;color:#5968cf;font-size:13px;line-height:1.45}.boundary{display:grid;gap:6px;padding:20px 38px 23px;background:#fafafb;color:#737884;font-size:12px;line-height:1.6}.boundary strong{color:#4d525d;font-size:12px}@media(max-width:560px){.settings-shell{width:100%;margin:0;border:0;border-radius:0;box-shadow:none}.settings-header,.settings-section,.form-footer,.boundary{padding-left:22px;padding-right:22px}.form-footer{align-items:stretch;flex-direction:column}.buttons{display:grid;grid-template-columns:1fr auto}.section-heading{align-items:flex-start;flex-direction:column;gap:10px}}`;
document.head.append(style);

function message(request: RuntimeRequest): Promise<RuntimeResponse> {
  return new Promise((resolve) => chrome.runtime.sendMessage(request, (response: RuntimeResponse) => resolve(response)));
}

const key = document.querySelector<HTMLInputElement>('#api-key')!;
const model = document.querySelector<HTMLInputElement>('#model')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;
const chineseVoice = document.querySelector<HTMLSelectElement>('#chinese-voice')!;
const englishVoice = document.querySelector<HTMLSelectElement>('#english-voice')!;
const consent = document.querySelector<HTMLInputElement>('#consent')!;
let savedVoiceNames: { chinese: string; english: string } = { chinese: '', english: '' };

function fillVoices() {
  const voices = speechSynthesis.getVoices();
  const fill = (select: HTMLSelectElement, prefix: string, value: string) => { select.replaceChildren(new Option('自动选择', '')); voices.filter((voice) => voice.lang.toLowerCase().startsWith(prefix)).forEach((voice) => { const option = document.createElement('option'); option.value = voice.name; option.textContent = `${voice.name} · ${voice.lang}`; select.append(option); }); select.value = value; };
  fill(chineseVoice, 'zh', savedVoiceNames.chinese); fill(englishVoice, 'en', savedVoiceNames.english);
}
fillVoices(); speechSynthesis.addEventListener('voiceschanged', fillVoices, { once: true });

void message({ type: 'GET_SETTINGS' }).then((response) => {
  if (response.ok && 'settings' in response) { key.value = response.settings.apiKey; model.value = response.settings.model; savedVoiceNames = { chinese: response.settings.chineseVoiceName || '', english: response.settings.englishVoiceName || '' }; fillVoices(); }
});

document.querySelector<HTMLFormElement>('#settings-form')!.addEventListener('submit', async (event) => {
  event.preventDefault();
  const settings: LexoraSettings = { apiKey: key.value.trim(), model: model.value.trim() || 'deepseek-v4-flash', chineseVoiceName: chineseVoice.value || null, englishVoiceName: englishVoice.value || null };
  if (settings.apiKey && !consent.checked) { status.textContent = '请先确认数据发送范围。'; return; }
  status.textContent = settings.apiKey ? '正在验证…' : '正在保存音色…';
  if (settings.apiKey) { const verified = await message({ type: 'VERIFY_API_KEY', apiKey: settings.apiKey }); if (!verified.ok) { status.textContent = verified.error; return; } }
  const response = await message({ type: 'SAVE_SETTINGS', settings });
  status.textContent = response.ok ? (settings.apiKey ? '已连接 DeepSeek。' : '朗读音色已保存。') : '保存失败，请重试。';
});

document.querySelector<HTMLButtonElement>('#delete-key')!.addEventListener('click', async () => { const response = await message({ type: 'DELETE_API_KEY' }); if (response.ok) { key.value = ''; status.textContent = '已删除。'; } else status.textContent = '删除失败，请重新打开扩展后重试。'; });

function preview(select: HTMLSelectElement, text: string, lang: string) { speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = lang; const voice = speechSynthesis.getVoices().find((item) => item.name === select.value) || speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().startsWith(lang.slice(0, 2))); if (voice) utterance.voice = voice; speechSynthesis.speak(utterance); }
document.querySelector<HTMLButtonElement>('#preview-chinese')!.addEventListener('click', () => preview(chineseVoice, '你好，我是 Lexora。', 'zh-CN'));
document.querySelector<HTMLButtonElement>('#preview-english')!.addEventListener('click', () => preview(englishVoice, 'Hello, I am Lexora.', 'en-US'));
