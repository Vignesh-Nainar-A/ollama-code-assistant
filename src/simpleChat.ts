import * as vscode from 'vscode';
import { chatWithOllama } from './ollamaClient';
import { getOllamaModel } from './ollamaClient';

export class SimpleChat {
    private static conversationHistory: Array<{ role: string; content: string }> = [];

    static async openChat() {
        try {
            // Show an info message with the current model
            const currentModel = getOllamaModel();
            vscode.window.showInformationMessage(`Opening chat with ${currentModel}...`);

            let continueChat = true;

            while (continueChat) {
                // Get user input
                const userMessage = await vscode.window.showInputBox({
                    prompt: 'Chat with Ollama',
                    placeHolder: 'Type your message (or press Escape to exit)',
                    title: `Chat (Model: ${currentModel})`
                });

                // User cancelled
                if (userMessage === undefined) {
                    continueChat = false;
                    break;
                }

                // Empty message
                if (!userMessage.trim()) {
                    continue;
                }

                // Add to history
                this.conversationHistory.push({
                    role: 'user',
                    content: userMessage
                });

                // Show thinking indicator
                const progressMessage = vscode.window.setStatusBarMessage(`🤔 Thinking...`);

                try {
                    // Get response from Ollama
                    const response = await chatWithOllama(this.conversationHistory);

                    // Add to history
                    this.conversationHistory.push({
                        role: 'assistant',
                        content: response
                    });

                    // Clear progress
                    progressMessage.dispose();

                    // Show response in output
                    this.showResponse(response);
                } catch (error) {
                    progressMessage.dispose();
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    vscode.window.showErrorMessage(`Chat error: ${errorMsg}`);
                }
            }

            vscode.window.showInformationMessage('Chat ended. Conversation saved.');
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to open chat: ${errorMsg}`);
        }
    }

    private static showResponse(response: string) {
        // Show response in a scrollable message
        vscode.window.showInformationMessage(
            response.length > 100 ? response.substring(0, 100) + '...' : response,
            { modal: false }
        );

        // Also log full response
        console.log('AI Response:', response);
    }

    static clearHistory() {
        this.conversationHistory = [];
        vscode.window.showInformationMessage('Chat history cleared');
    }

    static getHistory() {
        return this.conversationHistory;
    }
}
