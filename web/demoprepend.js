var tempDouble, tempI64;
const PACKAGE_NAME = '@demo';
const deployDirectory = 'https://raw.githubusercontent.com/Zennokaidy/luau-lsp-template/main/web/public/';
const docsJsonFile = 'demo.docs.json';
const defsLuauFile = 'demo.defs.luau';
const wasmFile = 'Luau.LanguageServer.Web.wasm';
var initiationOutput = '';

const initiateWasm = async function() {
    const wasmRetrieval = fetch(deployDirectory + wasmFile);
    const docsRetrieval = fetch(deployDirectory + docsJsonFile);
    const declRetrieval = fetch(deployDirectory + defsLuauFile);
    const wasmResponse = await wasmRetrieval;
    const wasmBuffer = await wasmResponse.arrayBuffer();
    const module = {
        wasm: wasmBuffer
    };
    await LuauLanguageServerWeb(module);
    const docsResponse = await docsRetrieval;
    const declResponse = await declRetrieval;
    const docsContent = await docsResponse.arrayBuffer();
    const declContent = await declResponse.arrayBuffer();
    module.FS.createPath('/', 'workspace', true, true);
    module.FS.writeFile('/workspace/empty', '');
    module.FS.createDataFile('/', docsJsonFile, new Uint8Array(docsContent), true, true, true);
    module.FS.createDataFile('/', defsLuauFile, new Uint8Array(declContent), true, true, true);
    initiationOutput = `Webworker module initialization is complete. Created wasm module with wasm: ${wasmResponse.status}-${wasmBuffer.byteLength}, docs: ${docsResponse.status}-${docsContent.byteLength}, defs: ${declResponse.status}-${declContent.byteLength}`;
    return module;
}

const initiationPromise = initiateWasm();

const suspended = [];
self.onmessage = x => {
    suspended.push(x.data);
};
function handleInput(module, languageServer, input) {
    if(typeof input == 'string') {
        languageServer.processInput(input);
    } else if(input?.type == 'update') {
        module.FS.writeFile('/workspace/1', input.data);
    }
}
initiationPromise.then(wasmModule => {
    try
    {
        self.postMessage({type:'info', msg:initiationOutput});
        const writeCallback = function(x) {
        self.postMessage({type: 'output', msg: x});
        }
        const languageServer = wasmModule.createWasmLanguageServer(
            writeCallback,
            PACKAGE_NAME,
            [defsLuauFile],
            [docsJsonFile]
        );
        while(suspended.length > 0) {
            const msg = suspended.shift();
            handleInput(wasmModule, languageServer, msg);
        }
        self.onmessage = function (e) {
            handleInput(wasmModule, languageServer, e.data);
        }
        while(suspended.length > 0) {
            const msg = suspended.shift();
            handleInput(wasmModule, languageServer, msg);
        }
    }
    catch(e)
    {
    self.postMessage({type:'error', exc:e});
    }
});
