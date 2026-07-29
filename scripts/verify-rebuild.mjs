import { readFile } from 'node:fs/promises';

const root = new URL('..', import.meta.url);
const text = async (path) => readFile(new URL(path, root), 'utf8');
const fail = (message) => { throw new Error(`Rebuild verification failed: ${message}`); };

const manifest = JSON.parse(await text('.output/chrome-mv3/manifest.json'));
if (manifest.manifest_version !== 3) fail('manifest is not V3');
if (manifest.version !== '0.9.0') fail('unexpected rebuilt version');
if (!manifest.action?.default_popup || !manifest.options_ui?.page || !manifest.background?.service_worker) fail('missing popup, options, or background entrypoint');
if (!manifest.content_scripts?.length) fail('missing content script');
for (const permission of ['storage', 'contextMenus']) if (!manifest.permissions?.includes(permission)) fail(`missing ${permission} permission`);
for (const host of ['https://api.deepseek.com/*', 'https://export.arxiv.org/*', 'https://api.crossref.org/*', 'https://eutils.ncbi.nlm.nih.gov/*']) if (!manifest.host_permissions?.includes(host)) fail(`missing ${host} host permission`);

const [content, background, sources, settings] = await Promise.all([
  text('entrypoints/content.ts'), text('entrypoints/background.ts'), text('src-rebuild/background/source-search.ts'), text('src-rebuild/options/main.ts'),
]);
for (const token of ['selectionMode', 'queuedDraft', 'LOOKUP_CORE', 'LOOKUP_DEEP', 'TERM_CHAT', 'CANCEL_REQUEST', 'markdownFragment', 'speechSynthesis']) if (!content.includes(token)) fail(`content interaction missing ${token}`);
for (const token of ['VERIFY_API_KEY', 'DELETE_API_KEY', 'contextMenus', 'CORE_CACHE_KEY', 'TRUSTED_CONTEXTS']) if (!background.includes(token)) fail(`background capability missing ${token}`);
for (const token of ['searchArxiv', 'searchPubMed', 'searchCrossref']) if (!sources.includes(token)) fail(`source provider missing ${token}`);
for (const token of ['preview-chinese', 'preview-english', 'VERIFY_API_KEY']) if (!settings.includes(token)) fail(`settings capability missing ${token}`);

console.log('Verified Lexora rebuild surface and required runtime capabilities.');
