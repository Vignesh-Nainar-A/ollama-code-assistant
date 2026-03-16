# Model Selection Feature - Quick Start

## What's New?

Your extension now has **automatic model selection and launching**! No more manual setup—just pick a model and it runs.

## How It Works

### 1. **Status Bar Icon** (Quickest)
- Look at the **bottom right** of VS Code
- You'll see `$(hubot) Model Name` icon
- **Click it** to select and start a model
- The handler automatically runs `ollama run <model>` in a terminal

### 2. **Chat Panel Button** (In the Chat)
- Open the **Ollama Chat** panel (left sidebar)
- Click **"Select Model"** button at the top right
- Pick a model from the quick pick list
- Model starts automatically

### 3. **Command Palette** (Traditional)
```
Ctrl+Shift+P (or Cmd+Shift+P on Mac)
> Ollama: Select and Start Ollama Model
```

## Workflow

Here's how smooth it is now:

**Old Way:**
```bash
# In terminal:
ollama run devstral
# Manually set environment:
set OLLAMA_MODEL=devstral
# Start VS Code extension
```

**New Way:**
```
1. Open VS Code (Ollama running in background)
2. Click model icon in status bar (or "Select Model" in chat)
3. Pick "devstral" from list
4. ✅ Done! Extension automatically runs `ollama run devstral`
```

## Features Added

### Files Created:
- **`src/modelManager.ts`** - Handles model selection and running

### Files Modified:
- **`src/ollamaClient.ts`** - Added model fetching APIs
- **`src/extension.ts`** - Added status bar + commands
- **`src/chatViewProvider.ts`** - Added "Select Model" button
- **`package.json`** - Registered new commands

### New Commands:
```
codeAssistant.selectModel      → Select and start a model
codeAssistant.showModels       → Show all available models
codeAssistant.stopModel        → Stop the running model
```

## Implementation Details

### ollamaClient.ts Changes
```typescript
// New function to fetch all available models
export async function getAvailableModels(): Promise<OllamaModel[]>
export async function getAvailableModelNames(): Promise<string[]>
```

### modelManager.ts New Features
```typescript
// Select model with UI and auto-start
static async selectAndStartModel()

// Directly start any model
static async startModel(modelName: string)

// Show available models
static async showAvailableModels()

// Get current model
static getCurrentRunningModel(): string | undefined
```

### extension.ts Changes
Added:
- Status bar item showing current model (clickable!)
- Model selector command
- Show models command
- Stop model command
- Auto-updating status every 2 seconds

### chatViewProvider.ts Changes
- "Select Model" button in chat header
- Click to trigger model selection
- Model status display

## Step-by-Step Setup

1. **Compile the code:**
   ```bash
   npm run compile
   ```

2. **Start using:**
   - Press F5 to launch extension in debug mode
   - Look for the status bar icon or chat panel button

3. **Select a model:**
   - Click the model icon in bottom right
   - Or click "Select Model" in Ollama Chat panel
   - Pick your model (e.g., "devstral", "mistral", etc.)
   - It auto-runs!

## Under the Hood

When you click "Select Model":

1. ✅ Fetches available models from `http://localhost:11434/api/tags`
2. ✅ Shows you a quick pick list
3. ✅ When you choose one, creates a terminal
4. ✅ Runs `ollama run <model>` automatically
5. ✅ Updates status bar to show running model
6. ✅ Sets the extension to use that model

## Status Bar Indicator

The status bar shows:
- `$(hubot) llama3` - Current model running
- Click it to change models
- Updates every 2 seconds

## Error Handling

If anything goes wrong:
- ❌ No models? → "Please pull a model first: `ollama pull llama3`"
- ❌ Can't connect? → Error message shown
- ❌ Terminal issue? → Creates new terminal automatically

## Terminal Management

- Opens a persistent terminal named "Ollama"
- Runs `ollama run <model>` in it
- Terminal stays open so model keeps running
- You can close it manually to stop the model
- Extension detects if terminal is closed

## What's Still the Same?

✅ Your code completions work the same  
✅ Chat functionality works the same  
✅ All original features intact  
✅ Environment variables still work (fallback)  

## Advanced Usage

### Environment Variable (Still Works!)
```bash
set OLLAMA_MODEL=devstral
# Or command palette → Select Model
```

### Programmatic (For Extensions)
```typescript
import { ModelManager } from './modelManager';
await ModelManager.startModel('mistral');
```

## Troubleshooting

**Q: Model selector not appearing?**
- Reload VS Code: `Ctrl+Shift+P` → "Reload Window"

**Q: Terminal not opening?**
- Make sure Ollama is installed
- Check VS Code allows terminal creation

**Q: Model runs but extension doesn't use it?**
- The extension should auto-detect
- Check status bar shows correct model
- Reload if needed

**Q: Want to go back to manual mode?**
- Still works! Use environment variables: `set OLLAMA_MODEL=llama3`

