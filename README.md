# Luau LSP WASM Template

A template for running [luau-lsp](https://github.com/JohnnyMorganz/luau-lsp) compiled to WebAssembly in the browser. Provides Luau autocomplete, hover, and type information entirely client-side.

Based on [kylerudy-imvu/luau-lsp](https://github.com/kylerudy-imvu/luau-lsp) with build fixes for CMake 4.x.

## Setup

1. Click **Use this template** on GitHub to create your own repo.
2. Edit `web/demoprepend.js` and replace `Zennokaidy/luau-lsp-template` with your username and repo name.
3. Replace `web/public/demo.defs.luau` with your own API declarations.
4. Replace `web/public/demo.docs.json` with your own documentation strings.
5. Go to **Actions → Build Luau LSP WASM → Run workflow**.
6. Wait ~14 minutes.
7. Download the `luau-lsp-wasm` artifact.
8. Upload `Luau.LanguageServer.Web.js` and `Luau.LanguageServer.Web.wasm` back to `web/public/`.

## Browser Usage

```js
const LSP_CDN = 'https://raw.githubusercontent.com/YOUR_USER/YOUR_REPO/main/web/public';

const response = await fetch(LSP_CDN + '/Luau.LanguageServer.Web.js');
const rawText = await response.text();
const workerScript = rawText
  .replace(/^\s*export\s+default\s+[^\n;]*;?\s*$/m, '')
  .replace(/https:\/\/cdn\.jsdelivr\.net\/gh\/[^/]+\/[^/]+@[^/]+\/web\/public\//g, LSP_CDN + '/');

const blob = new Blob([workerScript], { type: 'application/javascript' });
const blobUrl = URL.createObjectURL(blob);
const worker = new Worker(blobUrl);
URL.revokeObjectURL(blobUrl);

worker.postMessage(JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {}
}));

worker.onmessage = (e) => console.log('LSP:', e.data);
