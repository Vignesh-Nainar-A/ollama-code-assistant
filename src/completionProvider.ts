import * as vscode from 'vscode';
import { generateCode } from './ollamaClient';

let debounceTimer: NodeJS.Timeout | undefined;
const debounceDelay = 500; // ms

export class CodeCompletionProvider implements vscode.CompletionItemProvider {
    async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken,
        _context: vscode.CompletionContext
    ): Promise<vscode.CompletionItem[]> {
        
        // Get the current line
        const linePrefix = document.lineAt(position).text.substring(0, position.character);
        
        // Don't trigger on empty lines or just whitespace
        if (!linePrefix.trim()) {
            return [];
        }

        return new Promise((resolve) => {
            // Clear existing debounce timer
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }

            // Debounce the completion request
            debounceTimer = setTimeout(async () => {
                try {
                    // Get more context - previous lines for better suggestions
                    const startLine = Math.max(0, position.line - 10);
                    const range = new vscode.Range(startLine, 0, position.line, position.character);
                    const context = document.getText(range);

                    // Request completion from Ollama
                    const prompt = `You are a code completion assistant. Based on the code context below, suggest the next 1-2 lines of code. Return ONLY the code to complete, no explanations.\n\nContext:\n${context}`;
                    
                    const completion = await generateCode(prompt);

                    // Create completion items from the response
                    const items: vscode.CompletionItem[] = [];
                    
                    if (completion && completion.trim()) {
                        const item = new vscode.CompletionItem(
                            completion.trim().split('\n')[0],
                            vscode.CompletionItemKind.Snippet
                        );
                        item.detail = 'Ollama AI Suggestion';
                        item.insertText = completion.trim();
                        items.push(item);
                    }

                    resolve(items);
                } catch (error) {
                    console.error('Completion generation error:', error);
                    resolve([]);
                }
            }, debounceDelay);
        });
    }

    resolveCompletionItem?(
        item: vscode.CompletionItem,
        _token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.CompletionItem> {
        return item;
    }
}
