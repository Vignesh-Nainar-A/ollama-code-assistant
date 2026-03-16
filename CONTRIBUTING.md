# Contributing to Ollama Code Assistant

Thank you for taking the time to contribute! 🎉

## Ways to Contribute

- **Bug reports** — Open an issue describing what went wrong and steps to reproduce
- **Feature requests** — Open an issue with the `enhancement` label
- **Pull requests** — Fork, branch, implement, test, then open a PR

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org) v18+
- [VS Code](https://code.visualstudio.com) 1.70+
- [Ollama](https://ollama.com) running locally
- An installed Ollama model (e.g. `ollama pull llama3`)

### Getting Started

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/ollama-code-assistant.git
cd ollama-code-assistant

# 2. Install dependencies
npm install

# 3. Compile TypeScript
npm run compile

# 4. Open in VS Code
code .
```

Press **F5** to launch the Extension Development Host with your changes loaded.

### Project Structure

```
src/
  extension.ts          # Entry point — commands, status bar, activation
  chatViewProvider.ts   # WebView sidebar (chat UI backend)
  ollamaClient.ts       # Ollama HTTP API (chat, generate, model list)
  completionProvider.ts # Inline code completion provider
  modelManager.ts       # Model pick/launch helper
  simpleChat.ts         # Lightweight chat utility
media/
  chat.js               # Webview JavaScript (loaded as external file)
  ollama.svg            # Activity Bar icon
out/                    # Compiled JS (generated, not committed)
```

### Key Architecture Notes

- **Webview JS lives in `media/chat.js`** — Never embed large JS in TypeScript template literals; it causes silent escaping corruption.
- **CSP**: The webview CSP uses `script-src ${webview.cspSource}` (not `'unsafe-inline'`) because the script is loaded as an external file via `webview.asWebviewUri()`.
- **Model list** is fetched in `resolveWebviewView` before HTML is rendered and baked into the `<select>` options — no postMessage race condition.

### Running Tests

```bash
# Static analysis (checks code correctness)
node test-static.js

# Integration tests (requires Ollama running)
powershell -ExecutionPolicy Bypass -File test-full.ps1
```

### Code Style

- TypeScript strict mode is on
- Avoid adding dependencies unless truly necessary
- Keep the webview JS in `media/chat.js` — never inline it

### Pull Request Guidelines

1. Branch from `main`: `git checkout -b feat/your-feature`
2. Keep changes focused — one feature or fix per PR
3. Ensure `npm run compile` succeeds with zero errors
4. Run `node test-static.js` and verify all checks pass
5. Describe what and why in the PR description

## Reporting Bugs

Please include:
- OS and VS Code version
- Ollama version (`ollama --version`)
- Which model you're using
- Steps to reproduce
- What you expected vs. what happened
- Any errors from the VS Code Developer Console (`Help > Toggle Developer Tools`)

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
