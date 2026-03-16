# Changelog

All notable changes to **Ollama Code Assistant** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-03-16

### Added
- 🦙 **Activity Bar chat panel** — Copilot-style sidebar with full conversation history
- 📎 **Attach current file** — Send your open editor file as context with a single click
- 🤖 **Multi-turn conversation memory** — The model remembers the full session history
- 🎨 **Animated thinking indicator** — "Loading model..." messages with escalating status and a Cancel button
- 🚀 **Auto model detection** — Automatically detects and uses the first available Ollama model on activation
- 🔄 **Model switcher dropdown** — Switch between installed Ollama models directly in the chat panel
- ✏️ **Apply/Insert code buttons** — Insert AI-generated code blocks directly into the active editor
- 📋 **Copy code button** — One-click copy for every code block in responses
- 💬 **Inline code completions** — AI suggestions as you type
- 🖱️ **Right-click context menu** — Explain, Refactor, or Fix selected code
- ⌨️ **Keyboard shortcut support** — Enter to send, Shift+Enter for newline
- 🔒 **Strict Content Security Policy** — External JS loaded via `webview.asWebviewUri()`, no `unsafe-inline`

### Fixed
- Corrected Ollama API endpoint from `/api/generate` to `/api/chat` for multi-turn support
- Fixed model dropdown showing "Loading..." indefinitely (models now baked into HTML before render)
- Resolved send button remaining disabled after first message

### Technical
- All webview JavaScript moved to `media/chat.js` (external file) — eliminates TypeScript template-literal escaping issues
- 3-minute AbortController safety timeout on all Ollama requests
