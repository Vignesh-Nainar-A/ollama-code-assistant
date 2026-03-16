# Installation & Model Switching Guide

## Quick Installation

### For Development (Testing the Extension)

```bash
cd c:\Users\dell\Projects\ollama-code-assistant

# Install dependencies
npm install

# Compile the code
npm run compile

# Press F5 in VS Code to launch in debug mode
# (Opens a new VS Code window with your extension)
```

### For Production (Package & Install)

```bash
# Install vsce (one time)
npm install -g @vscode/vsce

# From your project directory:
npm run compile
npm run package

# This creates: ollama-code-assistant-0.1.0.vsix
# Then in VS Code:
# Extensions (Ctrl+Shift+X) → ... menu → Install from VSIX
```

**Important**: Make sure `node_modules/` is NOT excluded in `.vscodeignore` — the extension needs access to `node-fetch` at runtime.

---

## Model Configuration

### Auto-Detection and Defaults

The extension uses this priority for selecting a model:

1. Check if `OLLAMA_MODEL` environment variable is set → use that
2. Check if `llama3` is installed → use `llama3`
3. If neither → use the first available model
4. If no models available → show an error

This means you don't have to configure anything! Just install Ollama and pull a model.

### How to Change the Default Model

#### Method 1: Environment Variable (No Recompile)

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

#### Method 2: Edit Source Code (Permanent Change)

1. Open `src/ollamaClient.ts`
2. On line 10, change:
   ```typescript
   let OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';
   ```
   To:
   ```typescript
   let OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral';  // Your model here
   ```
3. Recompile:
   ```bash
   npm run compile
   ```
4. Reinstall the extension

### Switching Models While Using the Extension

You don't need to restart anything! Use the **Chat Panel Model Dropdown**:

1. Open the Ollama Chat panel in the sidebar
2. Click the model dropdown at the top
3. Select a different model
4. The next message will use the new model

Or use **Command Palette**:
1. Press `Ctrl+Shift+P`
2. Type: `Ollama: Select and Start Model`
3. Pick a model (opens `ollama run <model>` in terminal)

Make sure you pull the model first:

```bash
ollama pull mistral
ollama pull codellama
ollama pull neural-chat
ollama pull llama2
ollama pull orca-mini
ollama pull phi
```

Then switch using environment variable or edit the code.

### What Changed in ollamaClient.ts?

**Before:**
```typescript
const OLLAMA_MODEL = 'llama3';  // Hardcoded, can't change
```

**Now:**
```typescript
let OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';  // Configurable!

export function setOllamaModel(model: string) {
    OLLAMA_MODEL = model;  // Can switch models dynamically
}

export function getOllamaModel(): string {
    return OLLAMA_MODEL;  // Check current model
}
```

---

## Step-by-Step Installation in VS Code

### Step 1: Compile the Extension
```bash
cd c:\Users\dell\Projects\ollama-code-assistant
npm install
npm run compile
```

### Step 2: Load in VS Code (Development Mode)
- Open the project in VS Code: `code .`
- Press **F5** to launch
- A new VS Code window opens with your extension installed
- Test it out!

### Step 3: (Optional) Package for Distribution
```bash
npm install -g @vscode/vsce
vsce package
```

This creates a `.vsix` file you can share or install on other machines.

---

## Verify Installation

After installing/loading the extension:

1. **Check Extension is Active**
   - Open Output panel: `Ctrl+Shift+U`
   - Look for "Ollama Code Assistant" in dropdown
   - Should show: `"Ollama client initialized with model: llama3"`

2. **Find the Chat Panel**
   - Look in left sidebar (Explorer view)
   - Find **"Ollama Chat"** and click it
   - Chat panel should appear

3. **Test a Message**
   - Type: "Hello, say 'Model working!'"
   - Should get a response from Ollama

---

## Troubleshooting

### Extension Not Appearing in Debug Mode?
```bash
npm run compile
# Reload the debug window (Ctrl+R)
```

### Can't Find Ollama Chat Panel?
1. Click the Explorer icon in left sidebar
2. Look for "Ollama Chat"
3. If not found, reload VS Code: `Ctrl+Shift+P` → "Reload Window"

### Error: "Failed to connect to Ollama"
Make sure Ollama is running:
```bash
ollama serve
```

### Error: "Model not found" when using a different model
Make sure you pulled it first:
```bash
ollama pull [model-name]
ollama list  # Verify it's installed
```

---

## Summary

✅ **You're NOT limited to llama3!**
- Originally was hardcoded
- Now supports any Ollama model via environment variable
- Easy to switch: `set OLLAMA_MODEL=mistral` (or edit code)
- All code properly updated to use the variable
