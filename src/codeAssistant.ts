import { generateCode, chatWithOllama } from './ollamaClient';

export class CodeAssistant {
    static async generateCode(prompt: string): Promise<string> {
        try {
            const response = await generateCode(prompt);
            return response;
        } catch (error) {
            console.error('Failed to generate code:', error);
            throw error;
        }
    }

    static async chat(messages: Array<{role: string, content: string}>): Promise<string> {
        try {
            const response = await chatWithOllama(messages);
            return response;
        } catch (error) {
            console.error('Failed to chat with Ollama:', error);
            throw error;
        }
    }
}
