import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Lexora',
    description: 'Context-aware explanations for specialised terms while reading.',
    version: '0.9.0',
    permissions: ['storage'],
    host_permissions: [
      'https://api.deepseek.com/*',
      'https://export.arxiv.org/*',
      'https://api.crossref.org/*',
      'https://eutils.ncbi.nlm.nih.gov/*',
    ],
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      96: 'icon/96.png',
      128: 'icon/128.png',
    },
    action: { default_title: 'Lexora', default_popup: 'popup.html' },
    options_ui: { page: 'options.html', open_in_tab: true },
  },
});
