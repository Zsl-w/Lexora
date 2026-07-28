import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const baseline = resolve(root, 'extension-baseline');
const manifest = JSON.parse(await readFile(resolve(baseline, 'manifest.json'), 'utf8'));

if (manifest.manifest_version !== 3 || manifest.version !== '0.8.7') {
  throw new Error('Recovered manifest is not Lexora v0.8.7 Manifest V3.');
}

for (const file of ['background.js', 'content-scripts/content.js', 'popup.html', 'options.html']) {
  await access(resolve(baseline, file));
}

console.log(`Verified ${manifest.name} ${manifest.version} recovery baseline.`);
