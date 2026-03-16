<div align="center">

# 🦙 Ollama Code Assistant

**A VS Code extension that brings local AI to your editor — powered by [Ollama](https://ollama.com).**  
No cloud. No API keys. No subscriptions. Everything runs on your machine.

[![VS Code Engine](https://img.shields.io/badge/VS%20Code-%5E1.70.0-blue?logo=visualstudiocode)](https://code.visualstudio.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Ollama](https://img.shields.io/badge/Powered%20by-Ollama-orange)](https://ollama.com)

</div>

---

A VS Code extension that integrates **Ollama** (local LLM inference) to provide AI-powered code assistance right in your editor. No cloud APIs, no subscriptions — everything runs locally on your machine.

## Features

✨ **Inline Code Completions** - Get AI-powered code suggestions as you type  
💬 **Interactive Chat Sidebar** - Have real-time conversations with an AI assistant while coding  
🔧 **Code Generation** - Generate code from natural language prompts  
📝 **Code Refactoring** - Improve existing code with one click  
💡 **Code Explanation** - Understand what code does  
🐛 **Error Fixing** - Debug and fix code issues  
🚀 **Live Code Editing** - Apply AI suggestions directly to your code  
🎯 **Automatic Model Selection** - Pick and launch any Ollama model with one click—no manual configuration needed!

## Limitations & What This Is NOT

⚠️ **Be aware of these limitations before installing:**

- **Local Only** - Works exclusively with local Ollama models. Cannot connect to cloud APIs (OpenAI, Claude, etc.)
- **Hardware Dependent** - Performance depends on your CPU/GPU. Large models need 4-8GB RAM
- **No Streaming** - Responses arrive as complete blocks, not streamed character-by-character
- **Limited Context** - File attachments truncated at 600 lines; large codebases may not fit in context
- **Slower Than Cloud** - Responses take 2-10 seconds depending on model and hardware
- **Model Quality Varies** - Smaller/faster models (mistral, phi) produce lower quality than larger ones (llama3)
- **No Image Support** - Cannot process images or generate images
- **No Fine-Tuning** - Cannot customize or fine-tune models (use Ollama for that)
- **Manual Model Management** - Models must be pre-downloaded with `ollama pull <model>`
- **History Not Persistent** - Conversations are lost when you close the chat panel (by design for privacy)
- **No Agent/Tool Calls** - Cannot execute code automatically or call external tools
- **Language Model Limitations** - All limitations of LLMs apply (hallucinations, outdated knowledge, reasoning limits)

**Best Use Cases:**
✅ Code snippets and completions  
✅ Understanding existing code  
✅ Refactoring suggestions  
✅ Error debugging  
✅ Quick code generation  

**NOT Recommended For:**
❌ Critical production code without review  
❌ Complex multi-step automations  
❌ Real-time collaborative features  
❌ Replacing full IDE features  

## Prerequisites

Before using this extension, you need to install and run **Ollama**.

### Step 1: Install Ollama

1. **Download Ollama**
   - Visit [ollama.ai](https://ollama.ai) or [ollama.com](https://ollama.com)
   - Download the installer for your OS (Windows, Mac, or Linux)
   - Run the installer and follow the setup wizard

2. **Verify Installation**
   - Open a terminal/command prompt
   - Run: `ollama --version`
   - You should see the Ollama version number

### Step 2: Pull a Model

Pull at least one Ollama model. The extension will auto-detect and use any available model:

```bash
ollama pull llama3        # Balanced (good starting point)
ollama pull mistral       # Fast and efficient
ollama pull codellama     # Optimized for code
ollama pull neural-chat   # Optimized for conversations
```

Pick one (or more) based on your needs. The extension will automatically detect and use them.

### Step 3: Start the Ollama Server

**Option A: Serve in Background (Recommended)**
```bash
ollama serve
```
This starts the Ollama API server on `http://localhost:11434`. Leave this terminal running.

**Option B: Run as a Service**
- On **Windows**: Ollama runs as a background service automatically after installation
- On **Mac/Linux**: Follow the Ollama documentation for your OS

**Verify the server is running:**
```bash
curl http://localhost:11434/api/tags
```
You should see a list of your downloaded models.

### Step 4: Install the Extension

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "Ollama Code Assistant"
4. Click Install

Or manually install by copying this project to your VS Code extensions folder.

## Usage

### Finding the Extension in VS Code

The extension adds UI elements in several places:

1. **Status Bar Button** - Look at the bottom right of VS Code:
   - Shows "💬 Ollama" button
   - Click to open the chat panel
   - This is the quickest way to start chatting

2. **Activity Bar & Sidebar** - Look at the left sidebar:
   - Find "Ollama Chat" in the Activity Bar (left-most icons)
   - Click to open the chat panel
   - The panel shows conversation history and controls

2. **Inline Completions** - Activate automatically as you type
   - Start typing code and press `Ctrl+Space` to see suggestions
   - Completions appear in VS Code's autocomplete menu

3. **Commands** - Available via Command Palette (`Ctrl+Shift+P`):
   - `Ollama Code Assistant: Generate Code`
   - `Ollama Code Assistant: Refactor Code`
   - `Ollama Code Assistant: Explain Code`
   - `Ollama Code Assistant: Fix Errors`

### How to Start Chatting

**Step-by-step:**

1. **Open a file** in VS Code (any code file: .js, .py, .ts, .java, etc.)

2. **Open the Chat Panel**
   - Look at the left sidebar (Explorer view)
   - Find "Ollama Chat" and click it
   - The chat panel opens on the right side

3. **Type your message**
   - Click in the text input at the bottom of the chat panel
   - Type your request:
     - "Generate a React component for a to-do list"
     - "Explain this JavaScript function"
     - "Refactor this code to use async/await"
     - "Fix the error in my code"

4. **Send the message**
   - Press `Enter` or click the Send button
   - The AI processes your request (takes a few seconds)
   - Response appears with code blocks highlighted

5. **Apply Code to Your Editor**
   - If the response contains code, you'll see **"Apply to Editor"** buttons
   - Click to insert the code at your cursor position
   - Or click **"Copy"** to copy to clipboard

6. **Continue the Conversation**
   - Ask follow-up questions
   - The AI remembers context from previous messages
   - All conversation history is maintained in the session

### Example Workflow

```
You:  "Write a JavaScript function that fetches data from an API"

AI:   Here's a function that fetches data using the Fetch API:
      
      ```javascript
      async function fetchData(url) {
          try {
              const response = await fetch(url);
              if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
              }
              const data = await response.json();
              return data;
          } catch (error) {
              console.error('Error fetching data:', error);
          }
      }
      ```
      
      [Apply to Editor] [Copy]

You:  "Can you add error handling and a timeout?"

AI:   Sure! Here's an improved version with timeout...
```

### Inline Code Completions

As you type code, AI suggestions appear automatically in the autocomplete menu:

1. Start typing code in any file
2. After 500ms, AI completions appear (debounced to avoid slowdown)
3. Press `Tab` or `Enter` to accept a suggestion
4. Or press `Ctrl+Space` to manually trigger completions

**How it works:**
- The AI analyzes the last 10 lines of code for context
- Suggests the next 1-2 lines based on the pattern
- Works in any programming language supported by VS Code

**Tips:**
- Completions work best when there's enough context (previous code)
- Manual trigger with `Ctrl+Space` if suggestions don't appear automatically
- Debouncing prevents slowdown while typing fast

### Model Selection

You can switch between installed models in two ways:

**1. Chat Panel Dropdown** (Easiest)
   - Open the Ollama Chat panel in the sidebar
   - Use the model dropdown at the top
   - Select a different model from the list
   - The chat will use the selected model for next message

**2. Command Palette**
   - Press `Ctrl+Shift+P`
   - Type: `Ollama: Select and Start Model`
   - Pick a model from the list
   - A terminal opens running `ollama run <model>`
   - Subsequent chat messages will use this model

**Available Commands:**
- `Ollama: Select and Start Model` - Pick and launch a model
- `Ollama: Show Available Models` - List all installed models
- `Ollama: Stop Model` - Stop the currently running model

**Note:** The extension automatically uses the first available model if llama3 is not installed. You can override this with the `OLLAMA_MODEL` environment variable.

## Model Support

### Which Models Can This Extension Use?

**All of them!** This extension works with any Ollama model. The default priority is:

1. **Primary:** `llama3` (if installed)
2. **Fallback:** First available model on your system
3. **Override:** Set `OLLAMA_MODEL` environment variable

### Recommended Models

**Best for General Coding (Balanced):**
- `llama3` - ⭐ Default, good quality and speed
- `neural-chat` - Fast conversation, good context

**Best for Code Generation:**
- `codellama` - Specialized for coding tasks
- `mistral` - Fast and efficient

**For Low-Resource Machines:**
- `mistral` - 2.7GB, very fast
- `orca-mini` - 2.7GB, lightweight
- `phi` - 1.6GB, CPU-only friendly

### Model Performance Chart

| Model | Size | Speed | Quality | Best For |
|-------|------|-------|---------|----------|
| llama3 | 4.7GB | Medium | High | **General coding** ⭐ |
| codellama | 3.5GB | Medium | Very High | **Code generation** |
| mistral | 2.7GB | Fast | High | **Speed & efficiency** |
| neural-chat | 4.1GB | Medium | High | **Conversations** |
| orca-mini | 2.7GB | Fast | Medium | **Low-end machines** |
| phi | 1.6GB | Very Fast | Medium | **CPU-only** |

### How to Change the Default Model

**Option 1: Environment Variable (No Recompile)**

**Windows PowerShell:**
```powershell
$env:OLLAMA_MODEL = "mistral"
# Then reload VS Code
```

**Windows Command Prompt:**
```cmd
set OLLAMA_MODEL=mistral
```

**Mac/Linux:**
```bash
export OLLAMA_MODEL=mistral
```

**Option 2: Edit Source Code**

1. Open `src/ollamaClient.ts`
2. Find line 10: `let OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';`
3. Change `'llama3'` to your preferred model
4. Recompile: `npm run compile`

## Troubleshooting

### "Failed to connect to Ollama" or "Connection refused"

**Solution:**
1. Make sure Ollama is running:
   ```bash
   ollama serve
   ```
   Or check if it's running as a background service

2. Verify the server is accessible:
   ```bash
   curl http://localhost:11434/api/tags
   ```

3. Check that port 11434 isn't blocked by firewall

### "No model found" or "Model not found"

**Solution:**
1. List downloaded models:
   ```bash
   ollama list
   ```

2. Pull the default model:
   ```bash
   ollama pull llama3
   ```

3. If using a different model, update [src/ollamaClient.ts](src/ollamaClient.ts):
   - Change `model: 'llama3'` to match an installed model

### Responses are slow or incomplete

**Solution:**
1. **Reduce model size** - Use a faster model like `mistral` or `orca-mini`

2. **Check system resources**:
   - Close other applications
   - Check available RAM (models use 4-8GB)
   - Consider GPU acceleration if available

3. **Increase timeout** - Edit [src/ollamaClient.ts](src/ollamaClient.ts):
   - Requests currently have default timeouts; can be adjusted

### Extension not showing chat panel

**Solution:**
1. **Make sure Ollama is running:**
   ```bash
   ollama serve
   ```

2. **Reload VS Code**: `Ctrl+Shift+P` → "Reload Window"

3. **Check the Extension Output:**
   - Open Output panel (`Ctrl+Shift+U`)
   - Select "Extension Host" from dropdown
   - Look for error messages (should see "Ollama Code Assistant activated")

4. **Verify extension is packed correctly:**
   - If you built from source, ensure `.vscodeignore` includes `node_modules/`
   - Reinstall the `.vsix` file if you packaged it yourself

5. **Manually locate the chat panel:**
   - Click the **Explorer icon** in the left Activity Bar
   - Scroll down to find "Ollama Chat"
   - If not visible, the extension may not have activated properly

**Note for v0.1.1+:** The extension now activates instantly even if Ollama is offline. The chat icon should appear immediately in your Activity Bar.

## Development

### Building from Source

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode (auto-recompile on changes)
npm run watch
```

### Extension Structure

```
src/
├── extension.ts          # Main extension setup, command handlers
├── chatViewProvider.ts   # Chat sidebar WebView provider
├── completionProvider.ts # Inline code completions
├── codeAssistant.ts      # Code assistant wrapper class
└── ollamaClient.ts       # Ollama API client
```

## Tips & Tricks

1. **Use code context** - Select code in editor before chatting for better suggestions
2. **Clear chat history** - Click "Clear" button to start fresh conversation
3. **Copy code snippets** - Use "Copy" button in code blocks for quick access
4. **Experiment with models** - Try different models to find what works best for your use case
5. **Provide context** - More detailed prompts = better results

## Limitations

- Responses are limited by model size and knowledge cutoff
- Code suggestions may need review before use
- API calls go to local Ollama server only (no internet required)
- Performance depends on your hardware

## Future Enhancements

Planned features:
- [ ] VS Code settings panel for model configuration
- [ ] Multiple model support switching in UI
- [ ] Streaming responses for faster feedback
- [ ] Custom system prompts
- [ ] Code diff viewer before applying changes
- [ ] Multi-file context support
- [ ] GitHub Copilot-style ghost text suggestions

## License

MIT

## Support

For issues and feature requests, please open an issue on the repository.

## Privacy

All processing happens locally on your machine. Your code never leaves your computer—it's sent only to the local Ollama server running on `localhost:11434`.
