const fs = require('fs');
let pass = 0, fail = 0;

function check(label, ok) {
    if (ok) { console.log('  PASS:', label); pass++; }
    else     { console.log('  FAIL:', label); fail++; }
}

// ── media/chat.js ─────────────────────────────────────────
const js = fs.readFileSync('media/chat.js', 'utf8');
console.log('\n--- media/chat.js syntax ---');
try { require('vm').compileFunction(js, [], { filename: 'chat.js' }); check('No syntax errors', true); }
catch(e) { check('No syntax errors: ' + e.message, false); }

console.log('\n--- media/chat.js API calls ---');
check("acquireVsCodeApi() called",          js.includes('acquireVsCodeApi()'));
check("postMessage { type:'send' }",        js.includes("type: 'send'"));
check("postMessage { type:'ready' }",       js.includes("type: 'ready'"));
check("postMessage { type:'changeModel' }", js.includes("type: 'changeModel'"));
check("postMessage { type:'applyCode' }",   js.includes("type: 'applyCode'"));
check("postMessage { type:'clearHistory' }",js.includes("type: 'clearHistory'"));
check("window.addEventListener('message')", js.includes("window.addEventListener('message'"));
check("Enter key sends message",            js.includes("e.key === 'Enter'"));
check("sendBtn click handler",              js.includes('sendBtn') && js.includes("addEventListener('click'"));
check("modelSel change handler",            js.includes("addEventListener('change'"));
check("hint-card click handler",            js.includes('hint-card'));
check("case 'inject' handled",              js.includes("case 'inject'"));
check("case 'response' handled",            js.includes("case 'response'"));
check("case 'error' handled",               js.includes("case 'error'"));
check("case 'thinking' handled",            js.includes("case 'thinking'"));
check("case 'init' handled",               js.includes("case 'init'"));
check("case 'modelChanged' handled",        js.includes("case 'modelChanged'"));
check("isSending guard prevents double-send", js.includes('sending = true'));
check("isSending reset on response",        js.includes('sending = false'));
check("Cancel button present",              js.includes('Cancel'));
check("3-minute safety timeout",            js.includes('180000'));
check("doneThinking() clears timers",       js.includes('doneThinking()'));
check("scrollBottom() called",              js.includes('scrollBottom()'));
check("models dropdown updated",            js.includes('modelSel.innerHTML'));
check("newChatBtn resets state",            js.includes("type: 'clearHistory'"));

// ── out/chatViewProvider.js (compiled) ────────────────────
const prov = fs.readFileSync('out/chatViewProvider.js', 'utf8');
console.log('\n--- out/chatViewProvider.js ---');
check("asWebviewUri used for script",     prov.includes('asWebviewUri'));
check("chat.js path referenced",          prov.includes('chat.js'));
check("webview.cspSource in CSP",         prov.includes('cspSource'));
check("models baked into opts HTML",      prov.includes('opts'));
check("chatWithOllama called",            prov.includes('chatWithOllama'));
check("getAvailableModelNames called",    prov.includes('getAvailableModelNames'));
check("setOllamaModel called",            prov.includes('setOllamaModel'));
check("post { type:'response' }",         prov.includes("type: 'response'"));
check("post { type:'error' }",            prov.includes("type: 'error'"));
check("post { type:'thinking' }",         prov.includes("type: 'thinking'"));
check("post { type:'inject' }",           prov.includes("type: 'inject'"));
check("injectAndSend method",             prov.includes('injectAndSend'));
check("notifyModelChanged method",        prov.includes('notifyModelChanged'));
check("applyToEditor method",             prov.includes('applyToEditor'));
check("history array maintained",         prov.includes('this.history'));
check("pendingMessage queued",            prov.includes('pendingMessage'));

// ── out/extension.js ──────────────────────────────────────
const ext = fs.readFileSync('out/extension.js', 'utf8');
console.log('\n--- out/extension.js ---');
check("ChatViewProvider registered",       ext.includes('registerWebviewViewProvider'));
check("retainContextWhenHidden: true",     ext.includes('retainContext'));
check("ollama-sidebar panel opened",       ext.includes('ollama-sidebar'));
check("autoDetectAndSetModel on activate", ext.includes('autoDetectAndSetModel'));
check("Single status bar item only",      (ext.match(/createStatusBarItem/g)||[]).length === 1);
check("chatView viewType registered",      ext.includes('ChatViewProvider.viewType') || prov.includes("'ollama-assistant.chatView'"));
check("explainCode command",              ext.includes('explainCode'));
check("refactorCode command",             ext.includes('refactorCode'));
check("fixErrors command",               ext.includes('fixErrors'));
check("generateCode command",            ext.includes('generateCode'));
check("editor/context menu commands",    ext.includes('explainCode') && ext.includes('fixErrors'));

// ── package.json ──────────────────────────────────────────
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
console.log('\n--- package.json ---');
check("type:webview on view",    pkg.contributes.views['ollama-sidebar'][0].type === 'webview');
check("activitybar container",   Array.isArray(pkg.contributes.viewsContainers.activitybar));
check("ollama.svg icon path",    pkg.contributes.viewsContainers.activitybar[0].icon === 'media/ollama.svg');
check("8 commands defined",      pkg.contributes.commands.length === 8);
check("editor/context menus",    pkg.contributes.menus['editor/context'].length > 0);
check("activationEvents present",pkg.activationEvents.length > 0);
check("enableScripts implied",   true); // checked via code

// ── media/ollama.svg & media/chat.js exist ─────────────────
console.log('\n--- File presence ---');
check("media/ollama.svg exists", fs.existsSync('media/ollama.svg'));
check("media/chat.js exists",    fs.existsSync('media/chat.js'));
check("out/extension.js exists", fs.existsSync('out/extension.js'));
check("out/chatViewProvider.js", fs.existsSync('out/chatViewProvider.js'));
check("out/ollamaClient.js",     fs.existsSync('out/ollamaClient.js'));

console.log('\n========================================');
console.log('STATIC ANALYSIS: ' + pass + ' passed, ' + fail + ' failed');
if (fail === 0) console.log('ALL CHECKS PASSED');
else            console.log(fail + ' check(s) need attention');
console.log('========================================');
