import * as vscode from 'vscode';
import { getAvailableModelNames, setOllamaModel, getOllamaModel } from './ollamaClient';

export class ModelManager {
    private static terminal: vscode.Terminal | undefined;
    private static currentRunningModel: string | undefined;

    /**
     * Show model selection dialog and start the selected model
     */
    static async selectAndStartModel() {
        try {
            // Fetch available models
            const models = await getAvailableModelNames();
            
            if (models.length === 0) {
                vscode.window.showErrorMessage('No models found. Please pull a model first using: ollama pull llama3');
                return;
            }

            // Show quick pick with available models
            const selectedModel = await vscode.window.showQuickPick(models, {
                placeHolder: `Current model: ${getOllamaModel()}. Select a model to start...`,
                title: 'Ollama Models'
            });

            if (!selectedModel) {
                return; // User cancelled
            }

            // Start the selected model
            await this.startModel(selectedModel);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to select model: ${errorMsg}`);
        }
    }

    /**
     * Start a specific model by running 'ollama run <model>'
     */
    static async startModel(modelName: string) {
        try {
            // Create or reuse terminal
            if (!this.terminal || this.terminal.exitStatus !== undefined) {
                this.terminal = vscode.window.createTerminal({
                    name: 'Ollama',
                    hideFromUser: false
                });
            }

            // Show the terminal
            this.terminal.show();

            // Run the ollama command
            this.terminal.sendText(`ollama run ${modelName}`, true);

            // Update the current running model
            this.currentRunningModel = modelName;
            setOllamaModel(modelName);

            // Show confirmation
            vscode.window.showInformationMessage(`Starting Ollama model: ${modelName}`);

            console.log(`Model ${modelName} started in terminal`);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to start model: ${errorMsg}`);
        }
    }

    /**
     * Get the currently running model
     */
    static getCurrentRunningModel(): string | undefined {
        return this.currentRunningModel || getOllamaModel();
    }

    /**
     * Kill the terminal running ollama
     */
    static stopModel() {
        if (this.terminal) {
            this.terminal.dispose();
            this.terminal = undefined;
            this.currentRunningModel = undefined;
            vscode.window.showInformationMessage('Ollama model stopped');
        }
    }

    /**
     * Show available models in a message
     */
    static async showAvailableModels() {
        try {
            const models = await getAvailableModelNames();
            
            if (models.length === 0) {
                vscode.window.showInformationMessage('No models available. Pull one using: ollama pull llama3');
                return;
            }

            const modelList = models.join('\n');
            vscode.window.showInformationMessage(`Available Models:\n${modelList}`, { modal: true });
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to fetch models: ${errorMsg}`);
        }
    }
}
