# Model Selection & Switching

## Quick Start

The extension makes it easy to use any Ollama model. Here are your options:

---

## Method 1: Chat Panel Dropdown (Easiest)

1. Open **Ollama Chat** in the sidebar
2. Find the **model dropdown** at the top
3. Select a different model
4. The next message will use the selected model

**No restart needed!** Model changes apply instantly.

---

## Method 2: Command Palette

**Step 1:** Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)

**Step 2:** Type one of these commands:
- `Ollama: Select and Start Model` - Pick model from list & launch it
- `Ollama: Show Available Models` - See all installed models
- `Ollama: Stop Model` - Stop the running model

**Step 3:** Select your model from the quick pick

This opens a terminal with `ollama run <model>` running.

---

## Method 3: Environment Variables

**Windows PowerShell:**
```powershell
$env:OLLAMA_MODEL = "mistral"
# Reload VS Code
```

**Windows Command Prompt:**
```cmd
set OLLAMA_MODEL=mistral
```

**Mac/Linux:**
```bash
export OLLAMA_MODEL=mistral
```

Then reload VS Code for changes to take effect.

---

## Method 4: Edit Source Code

For a permanent default change:

1. Open `src/ollamaClient.ts`
2. Find line 10: `let OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';`
3. Change `'llama3'` to your preferred model
4. Recompile: `npm run compile`

---

## Available Models

Any model from Ollama works! Popular choices:

| Model | Size | Speed | Best For |
|-------|------|-------|----------|
| llama3 | 4.7GB | Medium | **Default, general coding** |
| codellama | 3.5GB | Medium | **Code generation** |
| mistral | 2.7GB | Fast | **Speed-focused** |
| neural-chat | 4.1GB | Medium | **Conversations** |
| orca-mini | 2.7GB | Fast | **Low-resource machines** |
| phi | 1.6GB | Very Fast | **CPU-only** |

---

## Pull a Model

```bash
ollama pull llama3        # Default
ollama pull mistral       # Fast alternative
ollama pull codellama     # For coding tasks
ollama pull neural-chat   # For conversations
```

---

## How It Works

### Auto-Detection Priority

The extension uses this priority:

1. **Environment Variable** → `$OLLAMA_MODEL` (if set)
2. **Default Model** → `llama3` (if installed)
3. **First Available** → Any installed model
4. **Error** → "No models found"

### Model Switching Under the Hood

When you switch models via the chat panel:

```
User selects model in dropdown
          ↓
setOllamaModel(newModel)  (updates OLLAMA_MODEL variable)
          ↓
Next chat message uses new model
          ↓
No restart or reload needed!
```

---

## Command Reference

```
Ctrl+Shift+P → Ollama: Select and Start Model
Ctrl+Shift+P → Ollama: Show Available Models
Ctrl+Shift+P → Ollama: Stop Model
```

These commands come from `modelManager.ts`:
- `selectAndStartModel()` - Show quick pick & launch
- `showAvailableModels()` - List all downloaded models
- `stopModel()` - Kill the running model process

---

## Examples

### Example 1: Quick Model Switch
```
1. Chat panel dropdown shows: "llama3"
2. User selects: "mistral"
3. Send next message → uses mistral
4. User selects: "codellama"
5. Send next message → uses codellama
```

### Example 2: Environment Variable Method
```bash
# Before opening VS Code
set OLLAMA_MODEL=codellama

# Open VS Code
code .

# Extension uses codellama for all messages
```

### Example 3: Command Palette Method
```
Ctrl+Shift+P
> Ollama: Select and Start Model
> Pick "neural-chat"
> Terminal runs: ollama run neural-chat
> Chat uses neural-chat model
```

---

## Troubleshooting

### "No models found"
**Solution:** Pull at least one model
```bash
ollama pull llama3
```

### Model dropdown shows nothing
**Solution:** 
1. Make sure Ollama is running: `ollama serve`
2. Reload VS Code: `Ctrl+Shift+P` → Reload Window

### Environment variable not working
**Solution:**
- Reload VS Code after setting variable
- Or use chat panel dropdown instead

### Switching models doesn't seem to work
**Solution:**
- Reload VS Code: `Ctrl+Shift+P` → Reload Window
- Or close and reopen the chat panel

---

## Best Practices

✅ **Do:**
- Use the chat panel dropdown for quick switches (recommended)
- Set environment variable for persistent defaults in terminal
- Use `Ollama: Select and Start Model` for one-off model launches

❌ **Don't:**
- Edit ollamaClient.ts unless you want a permanent default
- Rely on manual terminal setup (the UI is easier!)
- Leave multiple Ollama processes running (memory intensive)

---

## Performance Notes

- **Model switching** is instant (no reload needed)
- **First message with new model** may take 1-2s (model loading)
- **Chat speed** depends on model size and your hardware
- **Model unload** takes a few seconds (frees up memory)

---

## See Also

- [README.md](README.md) - Full feature overview
- [INSTALLATION.md](INSTALLATION.md) - Setup guide
- [FEATURE_SUMMARY.md](FEATURE_SUMMARY.md) - All features at a glance
- [Ollama Documentation](https://ollama.com) - Official Ollama docs
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

