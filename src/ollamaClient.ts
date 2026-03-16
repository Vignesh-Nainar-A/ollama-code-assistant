import fetch from 'node-fetch';

const OLLAMA_BASE_URL = 'http://localhost:11434';
const OLLAMA_GENERATE_URL = `${OLLAMA_BASE_URL}/api/generate`;
const OLLAMA_CHAT_URL = `${OLLAMA_BASE_URL}/api/chat`;
const OLLAMA_TAGS_URL = `${OLLAMA_BASE_URL}/api/tags`;

// Model configuration - Change this to use any Ollama model
// Available models: llama3, mistral, neural-chat, codellama, llama2, orca-mini, phi, etc.
// To use a different model, change the line below and recompile with 'npm run compile'
let OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';

export interface OllamaResponse {
    response: string;
    done: boolean;
}

export interface OllamaModel {
    name: string;
    size: number;
    digest: string;
}

export function initializeOllamaClient() {
    console.log(`Ollama client initialized with model: ${OLLAMA_MODEL}`);
}

// Initialize and auto-detect available model if llama3 is not available
export async function autoDetectAndSetModel() {
    const TIMEOUT_MS = 3000; // 3 second timeout for model detection
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    try {
        const availableModels = await Promise.race([
            getAvailableModelNames(),
            new Promise<string[]>((_, reject) => 
                setTimeout(() => reject(new Error('Model detection timeout')), TIMEOUT_MS)
            )
        ]);
        
        if (availableModels.length === 0) {
            console.warn('No models available in Ollama. Please install a model first.');
            return;
        }
        
        // Check if llama3 (or env var model) is available
        if (!availableModels.includes(OLLAMA_MODEL)) {
            console.warn(`Model "${OLLAMA_MODEL}" not found. Using first available model: "${availableModels[0]}"`);
            OLLAMA_MODEL = availableModels[0];
        } else {
            console.log(`Model "${OLLAMA_MODEL}" is available`);
        }
    } catch (error) {
        console.error('Failed to auto-detect model:', error);
    } finally {
        clearTimeout(timeout);
    }
}

// Allow dynamic model switching
export function setOllamaModel(model: string) {
    OLLAMA_MODEL = model;
    console.log(`Switched to Ollama model: ${OLLAMA_MODEL}`);
}

// Get the current model
export function getOllamaModel(): string {
    return OLLAMA_MODEL;
}

// Fetch all available models from Ollama
export async function getAvailableModels(): Promise<OllamaModel[]> {
    const TIMEOUT_MS = 5000; // 5 second timeout for model discovery
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    try {
        const response = await fetch(OLLAMA_TAGS_URL, {
            signal: controller.signal
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: any = await response.json();
        return data.models || [];
    } catch (error) {
        console.error('Failed to fetch models:', error);
        return [];
    } finally {
        clearTimeout(timer);
    }
}

// Get model names only
export async function getAvailableModelNames(): Promise<string[]> {
    try {
        const models = await getAvailableModels();
        return models.map(m => m.name);
    } catch (error) {
        console.error('Failed to get model names:', error);
        return [];
    }
}

export async function generateCode(prompt: string): Promise<string> {
    try {
        const response = await fetch(OLLAMA_GENERATE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: prompt,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json() as any;
        return data.response || '';
    } catch (error) {
        console.error('Ollama generate error:', error);
        throw error;
    }
}

// Uses /api/chat which properly supports multi-turn message history
export async function chatWithOllama(messages: Array<{role: string, content: string}>): Promise<string> {
    const TIMEOUT_MS = 120_000; // 2 minutes — enough for cold model load
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const response = await fetch(OLLAMA_CHAT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                messages: messages,
                stream: false
            }),
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json() as any;
        // /api/chat returns { message: { role, content } }
        return data.message?.content || '';
    } catch (error: any) {
        if (error?.name === 'AbortError') {
            throw new Error('Request timed out after 2 minutes. The model may still be loading — try again.');
        }
        console.error('Ollama chat error:', error);
        throw error;
    } finally {
        clearTimeout(timer);
    }
}
