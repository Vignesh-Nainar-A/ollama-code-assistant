# 🧪 Extension Testing Guide
## Ollama Code Assistant VS Code Extension

---

## ✅ Pre-Test Checklist

Before starting tests, ensure:

- [ ] Ollama is running: Open terminal and run `ollama serve`
- [ ] At least one model is installed (you have: qwen3.5, devstral, qwen2.5-coder)
- [ ] VS Code is closed
- [ ] Extension folder is at: `c:\Users\dell\Projects\ollama-code-assistant`
- [ ] Code compiled with no errors: `npm run compile`

---

## 🚀 Launch Debug Mode

**Steps:**
1. Open `c:\Users\dell\Projects\ollama-code-assistant` folder in VS Code
2. Press **F5** to start debugging
3. A new VS Code window opens (ExtensionHost)
4. Wait 2-3 seconds for extension to load
5. Check the **Debug Console** for messages

**Expected Output:**
```
Congratulations, your extension "ollama-code-assistant" is now active!
Model "..." is available  (or auto-selected if configured model missing)
Ollama client initialized with model: qwen3.5:latest
```

---

## 🧪 Test 1: Extension Loads Successfully

### What to Check:
- [ ] New VS Code window opens without errors
- [ ] Debug console shows activation message
- [ ] No red errors in Debug Console

### Expected Result:
✅ Extension loads, model is auto-detected and displayed

---

## 🧪 Test 2: Status Bar Shows Model

### Steps:
1. Look at **bottom right corner** of the VS Code window
2. Find the status bar area

### Expected Result:
- [ ] Shows **`🤖 qwen3.5:latest`** (or your model name)
- [ ] Shows **`💬 Chat`** button next to it
- [ ] Both are clickable

### What They Do:
- **Model indicator**: Click to select different model
- **Chat button**: Click to open chat window

---

## 🧪 Test 3: Chat Functionality (SimpleChat)

### Steps:
1. Click the **💬 Chat** button in bottom right
2. An input box appears with title "Chat (Model: qwen3.5:latest)"
3. Type: `Hello, what is 2+2?`
4. Press Enter
5. Wait for response (status bar shows 🤔 Thinking...)
6. Response appears in an information message
7. Type another message: `What is 5*6?`
8. Press Enter for follow-up
9. Press **Escape** to exit chat

### Expected Results:
- ✅ Input box appears
- ✅ Messages are processed
- ✅ Responses come from Ollama
- ✅ Multi-turn conversation works
- ✅ Can continue chatting in same session

### If You Get 404 Error:
⚠️ The auto-detection failed or model is not responding. Check Debug Console for exact error.

---

## 🧪 Test 4: Command Palette Commands

### How to Access:
Press **Ctrl+Shift+P** to open Command Palette

### Test 4A: Show Available Models
1. Type: `Ollama: Show Models`
2. Should list: qwen3.5, devstral, qwen2.5-coder (all 6)

### Test 4B: Select and Start Model
1. Type: `Ollama: Select and Start Model`
2. Quick Pick menu shows all models
3. Click to select one
4. Terminal opens with `ollama run qwen3.5:latest`
5. Model starts running in terminal
6. Status bar updates to show new model

### Test 4C: Generate Code
1. Type: `Ollama: Generate Code`
2. Prompt box appears: "Enter your code generation prompt"
3. Type: `Write a React component that displays a counter`
4. Press Enter
5. Message shows: "Code generated successfully!"
6. Open **Debug Console** to see generated code

### Test 4D: Refactor Code
1. Type: `Ollama: Refactor Code`
2. Enter prompt: `Refactor to use arrow functions`
3. Press Enter
4. Should succeed

### Test 4E: Explain Code
1. Type: `Ollama: Explain Code`
2. Enter prompt: `Explain what this code does: const x = 5 * 10`
3. Press Enter
4. Explanation should appear

### Test 4F: Fix Errors
1. Type: `Ollama: Fix Errors`
2. Enter: `Fix the syntax error: const x = 5 +`
3. Press Enter
4. Should suggest fix

### Expected Result for All Commands:
- ✅ Command appears in palette
- ✅ Input box shows
- ✅ "Success" message shows
- ✅ Debug Console shows result

---

## 🧪 Test 5: Inline Code Completions

### Steps:
1. Create a new file: **Ctrl+N** → Language Select → **Python**
2. Type: `def hello`
3. Wait 500ms (debounce time)
4. Completion menu should appear with suggestions

### Expected Result:
- ✅ Completion menu shows during typing
- ✅ Suggestions are code-related
- ✅ No errors in Debug Console

### What's Being Tested:
- Completion provider registration
- API communication with Ollama
- Response handling and formatting

---

## 🧪 Test 6: Model Switching

### Steps:
1. Click model name in status bar: `🤖 qwen3.5:latest`
2. Quick Pick shows available models
3. Select: `devstral:latest`
4. A terminal window opens with `ollama run devstral:latest`
5. Wait for model to load (watch terminal)
6. Status bar updates to: `🤖 devstral:latest`
7. Open chat again: Chat button
8. Type: `What model are you?`
9. Response should say: "devstral" model

### Expected Results:
- ✅ Model switches in terminal
- ✅ Status bar updates
- ✅ Chat uses new model
- ✅ New model name appears in chat prompt

---

## 🧪 Test 7: Error Scenarios

### Scenario 7A: Stop Model First
1. No model running in terminal
2. Click chat button
3. Should still work with auto-detection

### Scenario 7B: Connect Without Model Running
1. Close all terminal windows with `ollama run`
2. Click chat
3. Ollama background service should respond (models running in background)
4. Chat should still work

### Expected Results:
- ✅ Extension is resilient
- ✅ Falls back gracefully
- ✅ Shows clear error messages

---

## 🧪 Test 8: WebView Chat (Optional - Advanced)

### Note:
The SimpleChat (input boxes) is primary. WebView is experimental.

### Steps (if you want to test):
1. Look for "Ollama Chat" in Explorer sidebar (left)
2. If visible, click it
3. A chat panel should appear on the right
4. Type message and hit Enter

### Current Status:
- ⚠️ WebView provider exists but may not display in sidebar
- ✅ SimpleChat is the reliable alternative
- 📝 WebView can be fixed if needed

---

## 📊 Test Results Summary

Create a checklist as you test:

### Basic Functionality:
- [ ] Test 1: Extension loads ✅
- [ ] Test 2: Status bar visible ✅
- [ ] Test 3: Chat works ✅
- [ ] Test 4: Commands work ✅
- [ ] Test 5: Completions work ✅
- [ ] Test 6: Model switching works ✅

### Advanced (Optional):
- [ ] Test 7: Error handling works
- [ ] Test 8: WebView chat works

---

## 🔍 Debugging Tips

### If Something Fails:

1. **Check Debug Console**
   - Press **Ctrl+`** in debug window
   - Look for error messages with line numbers
   - Filter by "chat", "ollama", "error"

2. **Check Ollama is Running**
   - Open terminal: `curl http://localhost:11434/api/tags`
   - Should show JSON with models list

3. **Check Model is Available**
   - Run: `ollama list`
   - Should show qwen3.5, devstral, etc.

4. **Reload Extension**
   - In debug window: **Ctrl+R** (reload)
   - Restarts extension in test window

5. **Check Logs**
   - Output Panel: **Ctrl+J**
   - Select "Ollama Code Assistant" channel
   - Shows all extension logs

---

## 🎯 Quick Test (3 minutes)

If you just want to quickly verify it works:

1. Press **F5** to launch
2. Wait for extension to load
3. Click **💬 Chat** button
4. Type: `Hello`
5. Press Enter
6. Verify response appears
7. Press Escape to exit
8. ✅ **WORKS!**

---

## 📝 Notes

- **First chat response takes longer** (model initialization)
- **Subsequent responses are faster** (model stays warm)
- **Switching models** creates new terminal tab
- **Debug window can be minimized** after extension loads
- **Extension auto-reloads** if you modify code and save

---

## 🚨 Important: Model Auto-Detection

**What Changed:**
- Extension now checks if configured model (llama3) exists
- **If NOT found:** Automatically uses first available model
- **Works with:** qwen3.5, devstral, qwen2.5-coder, or any Ollama model
- **No more 404 errors** on startup

**Example:**
- Old behavior: ❌ Crashes with 404 when llama3 missing
- New behavior: ✅ Auto-selects qwen3.5 and works

---

## ✅ Final Verification

When all tests pass:

1. ✅ Extension loads without errors
2. ✅ Chat is functional via SimpleChat
3. ✅ Status bar shows current model
4. ✅ Model auto-detection works
5. ✅ Commands complete successfully
6. ✅ No 404 errors
7. ✅ Any model can be used
8. ✅ Error handling is graceful

**Extension is READY FOR PRODUCTION** ✅

---

## 📞 Need Help?

If tests fail:
1. Check the CODE_AUDIT.md for detailed architecture
2. Review the error message in Debug Console
3. Verify Ollama is actually running and model is available
4. Check network connectivity to localhost:11434

Good luck! 🚀
