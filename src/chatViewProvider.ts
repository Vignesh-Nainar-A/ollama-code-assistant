import * as vscode from 'vscode';
import { chatWithOllama, getAvailableModelNames, setOllamaModel, getOllamaModel } from './ollamaClient';

export class ChatViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'ollama-assistant.chatView';
    private view?: vscode.WebviewView;
    private history: Array<{ role: string; content: string }> = [];
    private pendingMessage?: string;

    constructor(private readonly extensionUri: vscode.Uri) {}

    async resolveWebviewView(
        webviewView: vscode.WebviewView,
        _ctx: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this.view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };

        webviewView.webview.onDidReceiveMessage(async (msg: any) => {
            switch (msg.type) {
                case 'ready':
                    if (this.pendingMessage) {
                        const p = this.pendingMessage;
                        this.pendingMessage = undefined;
                        setTimeout(() => this.injectAndSend(p), 300);
                    }
                    break;
                case 'send':
                    await this.handleChat(msg.text);
                    break;
                case 'changeModel':
                    setOllamaModel(msg.model);
                    break;
                case 'applyCode':
                    await this.applyToEditor(msg.code);
                    break;
                case 'clearHistory':
                    this.history = [];
                    break;
                case 'getFile': {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) {
                        this.post({ type: 'fileContext', error: 'No file is open in the editor. Open a file and try again.' });
                    } else {
                        const doc = editor.document;
                        let content = doc.getText();
                        const filename = vscode.workspace.asRelativePath(doc.uri);
                        const lang = doc.languageId;
                        const lines = content.split('\n').length;
                        // Truncate very large files to avoid exceeding model context
                        if (lines > 600) {
                            content = content.split('\n').slice(0, 600).join('\n') + '\n// ... (truncated at 600 lines)';
                        }
                        this.post({ type: 'fileContext', filename, lang, content, lines });
                    }
                    break;
                }
            }
        });

        // Fetch models first so they are baked into the HTML options
        let models: string[] = [];
        try {
            models = await getAvailableModelNames();
        } catch (error) {
            console.error('Failed to fetch models from Ollama:', error);
            vscode.window.showErrorMessage(
                'Unable to connect to Ollama. Make sure Ollama is running on http://localhost:11434'
            );
        }
        
        webviewView.webview.html = this.buildHtml(webviewView.webview, models, getOllamaModel());

        // Re-sync model list when panel is shown again
        webviewView.onDidChangeVisibility(async () => {
            if (webviewView.visible) {
                try {
                    const m = await getAvailableModelNames();
                    if (m.length > 0) {
                        this.post({ type: 'init', models: m, current: getOllamaModel() });
                    }
                } catch (error) {
                    console.error('Failed to fetch models on visibility change:', error);
                }
            }
        });
    }

    public injectAndSend(text: string) {
        if (!this.view) { this.pendingMessage = text; return; }
        this.post({ type: 'inject', text });
    }

    public notifyModelChanged(model: string) {
        this.post({ type: 'modelChanged', model });
    }

    private async handleChat(userText: string) {
        this.history.push({ role: 'user', content: userText });
        this.post({ type: 'thinking' });
        try {
            const reply = await chatWithOllama(this.history);
            this.history.push({ role: 'assistant', content: reply });
            this.post({ type: 'response', text: reply });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.post({ type: 'error', text: message });
            this.history.pop();
        }
    }

    private async applyToEditor(code: string) {
        const ed = vscode.window.activeTextEditor;
        if (!ed) { vscode.window.showWarningMessage('No active editor.'); return; }
        await ed.edit(eb => {
            ed.selection.isEmpty
                ? eb.insert(ed.selection.active, code)
                : eb.replace(ed.selection, code);
        });
        vscode.window.showInformationMessage('Code inserted into editor.');
    }

    private post(msg: any) { this.view?.webview.postMessage(msg); }

    private buildHtml(webview: vscode.Webview, models: string[], currentModel: string): string {
        // External JS file – loaded via webview resource URI, no nonce/escaping needed
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'media', 'chat.js')
        );

        // CSP: external scripts allowed via cspSource; inline styles allowed
        const csp = `default-src 'none'; style-src 'unsafe-inline'; script-src ${webview.cspSource};`;

        // Build model options – use string concatenation, no template literals around user data
        const opts = models.length > 0
            ? models.map(m => {
                const em = m.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
                const sel = m === currentModel ? ' selected' : '';
                return '<option value="' + em + '"' + sel + '>' + em + '</option>';
              }).join('')
            : '<option value="">No models found</option>';

        // HTML – template literal is safe here: no JS inside, only CSS + HTML + one scriptUri ref
        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{display:flex;flex-direction:column;height:100vh;overflow:hidden;
  font-family:var(--vscode-font-family,sans-serif);font-size:13px;
  background:var(--vscode-sideBar-background,#1e1e1e);color:var(--vscode-foreground,#ccc)}
#topbar{display:flex;align-items:center;gap:6px;padding:8px 10px;flex-shrink:0;
  border-bottom:1px solid var(--vscode-panel-border,#333);
  background:var(--vscode-sideBarSectionHeader-background,#252526)}
#brand{font-weight:600;font-size:13px;flex-shrink:0}
#model-select{flex:1;min-width:0;padding:3px 6px;font-size:12px;
  background:var(--vscode-dropdown-background,#3c3c3c);
  color:var(--vscode-dropdown-foreground,#ccc);
  border:1px solid var(--vscode-dropdown-border,#555);border-radius:3px;cursor:pointer;outline:none}
#new-chat-btn{padding:3px 8px;font-size:15px;
  background:var(--vscode-button-secondaryBackground,#3a3d41);
  color:var(--vscode-button-secondaryForeground,#ccc);border:none;border-radius:3px;cursor:pointer}
#messages{flex:1;overflow-y:auto;padding:12px 10px;display:flex;flex-direction:column;gap:2px}
#welcome{display:flex;flex-direction:column;align-items:center;justify-content:center;
  height:100%;text-align:center;gap:10px;padding:20px;
  color:var(--vscode-descriptionForeground,#888)}
#welcome-icon{font-size:36px}
#welcome-title{font-size:15px;font-weight:600;color:var(--vscode-foreground,#ccc)}
#welcome-tip{font-size:11px;padding:6px 10px;border-radius:4px;
  border-left:3px solid var(--vscode-focusBorder,#007acc);
  background:var(--vscode-editor-inactiveSelectionBackground,#2a2d2e);
  line-height:1.5;text-align:left;max-width:280px}
.hint-card{background:var(--vscode-editor-inactiveSelectionBackground,#2a2d2e);
  border:1px solid var(--vscode-panel-border,#333);border-radius:6px;
  padding:8px 12px;font-size:12px;text-align:left;width:100%;max-width:280px;
  cursor:pointer;transition:border-color 0.15s}
.hint-card:hover{border-color:var(--vscode-focusBorder,#007acc)}
.hint-card strong{display:block;margin-bottom:2px;color:var(--vscode-foreground,#ccc);font-size:12px}
.msg-group{display:flex;flex-direction:column;gap:4px;margin-bottom:12px;animation:fadeIn 0.2s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
.msg-group.user{align-items:flex-end}
.msg-group.assistant,.msg-group.error{align-items:flex-start}
.msg-label{font-size:11px;color:var(--vscode-descriptionForeground,#666);padding:0 4px;margin-bottom:2px}
.msg-bubble{padding:9px 12px;border-radius:8px;line-height:1.55;word-break:break-word;max-width:92%}
.user .msg-bubble{background:var(--vscode-button-background,#0e639c);
  color:var(--vscode-button-foreground,#fff);border-bottom-right-radius:3px}
.assistant .msg-bubble{background:var(--vscode-editor-inactiveSelectionBackground,#2a2d2e);
  color:var(--vscode-foreground,#ccc);border:1px solid var(--vscode-panel-border,#333);
  border-bottom-left-radius:3px;max-width:100%}
.error .msg-bubble{background:var(--vscode-inputValidation-errorBackground,#5a1d1d);
  color:var(--vscode-inputValidation-errorForeground,#f48771);
  border:1px solid var(--vscode-inputValidation-errorBorder,#be1100)}
.inline-code{background:var(--vscode-textCodeBlock-background,#1e1e1e);
  padding:1px 5px;border-radius:3px;
  font-family:var(--vscode-editor-font-family,monospace);font-size:0.9em}
.code-block{width:100%;border:1px solid var(--vscode-panel-border,#333);
  border-radius:6px;overflow:hidden;margin:4px 0;
  background:var(--vscode-editor-background,#1e1e1e)}
.code-header{display:flex;justify-content:space-between;align-items:center;
  padding:4px 10px;background:var(--vscode-tab-inactiveBackground,#2d2d2d);
  border-bottom:1px solid var(--vscode-panel-border,#333);font-size:11px}
.code-lang{color:var(--vscode-descriptionForeground,#888);text-transform:uppercase;letter-spacing:0.5px}
.code-btns{display:flex;gap:6px}
.code-btn{padding:2px 8px;font-size:11px;
  background:var(--vscode-button-secondaryBackground,#3a3d41);
  color:var(--vscode-button-secondaryForeground,#ccc);border:none;border-radius:3px;cursor:pointer}
pre.code-pre{padding:12px;overflow-x:auto;margin:0;
  font-family:var(--vscode-editor-font-family,monospace);
  font-size:12px;line-height:1.5;white-space:pre;
  color:var(--vscode-editor-foreground,#d4d4d4)}
#thinking{display:flex;align-items:center;gap:8px;
  color:var(--vscode-descriptionForeground,#888);font-size:12px;padding:4px 0}
.dot{width:7px;height:7px;border-radius:50%;
  background:var(--vscode-button-background,#007acc);
  animation:bounce 1.4s ease-in-out infinite}
.dot:nth-child(2){animation-delay:.2s}
.dot:nth-child(3){animation-delay:.4s}
@keyframes bounce{0%,80%,100%{transform:scale(.6);opacity:.4}40%{transform:scale(1);opacity:1}}
#input-area{flex-shrink:0;padding:8px 10px 6px;
  border-top:1px solid var(--vscode-panel-border,#333);
  background:var(--vscode-sideBar-background,#1e1e1e)}
#input-row{display:flex;gap:6px;align-items:flex-end}
#chat-input{flex:1;padding:8px 10px;
  background:var(--vscode-input-background,#3c3c3c);
  color:var(--vscode-input-foreground,#ccc);
  border:1px solid var(--vscode-input-border,#555);border-radius:6px;
  font-family:inherit;font-size:13px;line-height:1.4;
  resize:none;min-height:36px;max-height:120px;outline:none;transition:border-color .15s}
#chat-input:focus{border-color:var(--vscode-focusBorder,#007acc)}
#chat-input::placeholder{color:var(--vscode-input-placeholderForeground,#666)}
#send-btn{width:34px;height:34px;display:flex;align-items:center;justify-content:center;
  background:var(--vscode-button-background,#0e639c);
  color:var(--vscode-button-foreground,#fff);
  border:none;border-radius:6px;cursor:pointer;font-size:18px;flex-shrink:0}
#send-btn:hover{background:var(--vscode-button-hoverBackground,#1177bb)}
#hint-text{font-size:11px;color:var(--vscode-descriptionForeground,#555);margin-top:4px;text-align:center}
#file-chip-row{padding:0 0 5px;display:none}
#file-chip{display:inline-flex;align-items:center;gap:5px;
  background:var(--vscode-badge-background,#4d4d4d);
  color:var(--vscode-badge-foreground,#fff);
  padding:2px 8px 2px 6px;border-radius:10px;font-size:11px;max-width:100%}
#file-chip-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px}
#file-chip-remove{background:none;border:none;color:inherit;cursor:pointer;
  padding:0 0 0 2px;font-size:13px;line-height:1;opacity:0.7}
#file-chip-remove:hover{opacity:1}
#attach-btn{padding:0 8px;font-size:15px;
  background:var(--vscode-button-secondaryBackground,#3a3d41);
  color:var(--vscode-button-secondaryForeground,#ccc);
  border:none;border-radius:6px;cursor:pointer;
  align-self:flex-end;flex-shrink:0;height:34px;
  display:flex;align-items:center;justify-content:center}
#attach-btn:hover{opacity:0.8}
#attach-btn.active{background:var(--vscode-button-background,#0e639c);color:#fff}
</style>
</head>
<body>
<div id="topbar">
  <span id="brand">&#x1F999; Ollama</span>
  <select id="model-select">${opts}</select>
  <button id="new-chat-btn" title="New chat">+</button>
</div>
<div id="messages">
  <div id="welcome">
    <div id="welcome-icon">&#x1F999;</div>
    <div id="welcome-title">Ollama Code Assistant</div>
    <div id="welcome-tip">&#x23F3; First message may take 30&#8211;60s while the model loads into memory. Subsequent messages will be faster.</div>
    <div class="hint-card" data-msg="What can you help me with?">
      <strong>&#x1F4AC; Ask anything</strong>Ask questions, get explanations, discuss code
    </div>
    <div class="hint-card" data-msg="Generate a Python function that reads a JSON file and returns a list of records">
      <strong>&#x2728; Generate code</strong>Describe what you need and I'll write it
    </div>
    <div class="hint-card" data-msg="How do I fix a TypeError in Python?">
      <strong>&#x1F41B; Debug &amp; fix</strong>Paste your error and I'll help
    </div>
    <div class="hint-card" data-msg="Explain what async/await does in JavaScript">
      <strong>&#x1F4DA; Explain code</strong>Select code and run Explain command
    </div>
  </div>
</div>
<div id="input-area">
  <div id="file-chip-row"><div id="file-chip"><span>&#x1F4C4;</span><span id="file-chip-name"></span><button id="file-chip-remove" title="Remove file">&#x00D7;</button></div></div>
  <div id="input-row">
    <button id="attach-btn" title="Attach current editor file">&#x1F4CE;</button>
    <textarea id="chat-input" rows="1" placeholder="Ask me anything... (Enter to send, Shift+Enter for new line)"></textarea>
    <button id="send-btn" title="Send">&#x2191;</button>
  </div>
  <div id="hint-text">Enter &#x2192; send &bull; Shift+Enter &#x2192; new line &bull; &#x1F4CE; attach current file</div>
</div>
<script src="${scriptUri}"></script>
</body>
</html>`;
    }
}
