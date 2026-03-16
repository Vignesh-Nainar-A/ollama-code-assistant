import * as vscode from 'vscode';
import { CodeCompletionProvider } from './completionProvider';
import { ChatViewProvider } from './chatViewProvider';
import { ModelManager } from './modelManager';
import { autoDetectAndSetModel, getOllamaModel } from './ollamaClient';

export async function activate(context: vscode.ExtensionContext) {
    // Auto-detect installed model in background (non-blocking) to avoid hanging activation
    // This allows the extension UI to show even if Ollama connection is slow
    autoDetectAndSetModel().catch(err => {
        console.error('Failed to auto-detect model:', err);
    });

    // Register the WebView provider first so it's ready before any command opens it
    const chatProvider = new ChatViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            ChatViewProvider.viewType,
            chatProvider,
            { webviewOptions: { retainContextWhenHidden: true } }
        )
    );

    // Opens the Ollama sidebar panel (Activity Bar icon → panel)
    const openChatPanel = async (injectedMessage?: string) => {
        await vscode.commands.executeCommand('workbench.view.extension.ollama-sidebar');
        if (injectedMessage) {
            // Give the WebView time to mount before injecting
            setTimeout(() => chatProvider.injectAndSend(injectedMessage), 400);
        }
    };

    // Gets the currently selected code from the active editor
    const getCodeContext = (): { code: string; lang: string; file: string } | null => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.selection.isEmpty) return null;
        return {
            code: editor.document.getText(editor.selection),
            lang: editor.document.languageId,
            file: vscode.workspace.asRelativePath(editor.document.uri)
        };
    };

    context.subscriptions.push(

        vscode.commands.registerCommand('codeAssistant.openChat', () => openChatPanel()),

        vscode.commands.registerCommand('codeAssistant.selectModel', async () => {
            await ModelManager.selectAndStartModel();
            chatProvider.notifyModelChanged(getOllamaModel());
        }),

        vscode.commands.registerCommand('codeAssistant.showModels', () =>
            ModelManager.showAvailableModels()
        ),

        vscode.commands.registerCommand('codeAssistant.stopModel', () =>
            ModelManager.stopModel()
        ),

        vscode.commands.registerCommand('codeAssistant.generateCode', async () => {
            const ctx = getCodeContext();
            const prompt = await vscode.window.showInputBox({
                prompt: 'What code should I generate?',
                placeHolder: 'e.g., "Write a React component that shows a user list"'
            });
            if (!prompt) return;
            const msg = ctx
                ? `Generate code for: ${prompt}\n\nContext from \`${ctx.file}\`:\n\`\`\`${ctx.lang}\n${ctx.code}\n\`\`\``
                : prompt;
            await openChatPanel(msg);
        }),

        vscode.commands.registerCommand('codeAssistant.refactorCode', async () => {
            const ctx = getCodeContext();
            if (!ctx) {
                vscode.window.showWarningMessage('Please select code in the editor first.');
                return;
            }
            const prompt = await vscode.window.showInputBox({
                prompt: 'How should I refactor this code?',
                placeHolder: 'e.g., "Use async/await, improve readability, add error handling"'
            });
            if (!prompt) return;
            await openChatPanel(
                `Refactor this ${ctx.lang} code from \`${ctx.file}\`:\n\`\`\`${ctx.lang}\n${ctx.code}\n\`\`\`\n\n${prompt}`
            );
        }),

        vscode.commands.registerCommand('codeAssistant.explainCode', async () => {
            const ctx = getCodeContext();
            if (!ctx) {
                vscode.window.showWarningMessage('Please select code in the editor first.');
                return;
            }
            await openChatPanel(
                `Explain this ${ctx.lang} code from \`${ctx.file}\`:\n\`\`\`${ctx.lang}\n${ctx.code}\n\`\`\``
            );
        }),

        vscode.commands.registerCommand('codeAssistant.fixErrors', async () => {
            const ctx = getCodeContext();
            const errorDesc = await vscode.window.showInputBox({
                prompt: 'Describe the error or paste the error message',
                placeHolder: 'e.g., "TypeError: Cannot read property \'x\' of undefined"'
            });
            if (!errorDesc) return;
            const msg = ctx
                ? `Fix this ${ctx.lang} code from \`${ctx.file}\`:\n\`\`\`${ctx.lang}\n${ctx.code}\n\`\`\`\n\nError: ${errorDesc}`
                : `How do I fix this error: ${errorDesc}`;
            await openChatPanel(msg);
        })
    );

    // Single status bar button — opens the chat panel
    const chatBtn = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    chatBtn.command = 'codeAssistant.openChat';
    chatBtn.text = '$(comment-discussion) Ollama';
    chatBtn.tooltip = 'Open Ollama Chat';
    chatBtn.show();
    context.subscriptions.push(chatBtn);

    // Inline code completions
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            { scheme: 'file' },
            new CodeCompletionProvider(),
            ''
        )
    );

    console.log(`Ollama Code Assistant activated. Model: ${getOllamaModel()}`);
}

export function deactivate() {}

