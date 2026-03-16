// Ollama Chat – Webview script (external file, no template-literal escaping needed)
(function () {
    'use strict';

    const vscode = acquireVsCodeApi();

    // ── State ────────────────────────────────────────────
    let sending = false;
    let thinkEl = null;
    let timers = [];
    let attachedFile = null; // { filename, lang, content }

    // ── DOM refs ─────────────────────────────────────────
    const msgs          = document.getElementById('messages');
    const input         = document.getElementById('chat-input');
    const sendBtn       = document.getElementById('send-btn');
    const modelSel      = document.getElementById('model-select');
    const newChatBtn    = document.getElementById('new-chat-btn');
    const attachBtn     = document.getElementById('attach-btn');
    const fileChipRow   = document.getElementById('file-chip-row');
    const fileChipName  = document.getElementById('file-chip-name');
    const fileChipRemove = document.getElementById('file-chip-remove');
    let   welcome       = document.getElementById('welcome');

    // ── Helpers ──────────────────────────────────────────
    function post(obj) { vscode.postMessage(obj); }

    function hideWelcome() {
        if (welcome && welcome.parentNode) {
            welcome.parentNode.removeChild(welcome);
            welcome = null;
        }
    }

    function scrollBottom() {
        setTimeout(function () { msgs.scrollTop = msgs.scrollHeight; }, 30);
    }

    function escHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function fmtText(raw) {
        var s = escHtml(raw);
        s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
        s = s.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
        // inline code – backtick literal in JS is fine here (no TS template literal)
        s = s.replace(/`([^`\n]+)`/g, '<code class="inline-code">$1</code>');
        s = s.replace(/\n/g, '<br>');
        return s;
    }

    function parseCodeBlocks(text) {
        var parts = [], last = 0, m;
        // Triple-backtick fenced blocks – fine in plain JS regex
        var re = /```(\w*)[\r\n]([\s\S]*?)```/g;
        while ((m = re.exec(text)) !== null) {
            if (m.index > last) { parts.push({ t: 'text', v: text.slice(last, m.index) }); }
            parts.push({ t: 'code', lang: m[1] || '', v: m[2] });
            last = re.lastIndex;
        }
        if (last < text.length) { parts.push({ t: 'text', v: text.slice(last) }); }
        return parts;
    }

    function makeCodeBlock(lang, code) {
        var wrap = document.createElement('div'); wrap.className = 'code-block';
        var hdr  = document.createElement('div'); hdr.className  = 'code-header';
        var lbl  = document.createElement('span'); lbl.className  = 'code-lang';
        lbl.textContent = lang || 'code';
        var btns = document.createElement('div'); btns.className = 'code-btns';

        var copyBtn = document.createElement('button'); copyBtn.className = 'code-btn'; copyBtn.textContent = 'Copy';
        copyBtn.onclick = function () {
            navigator.clipboard.writeText(code).then(function () {
                copyBtn.textContent = '✓ Copied';
                setTimeout(function () { copyBtn.textContent = 'Copy'; }, 2000);
            });
        };

        var insertBtn = document.createElement('button'); insertBtn.className = 'code-btn'; insertBtn.textContent = 'Insert';
        insertBtn.onclick = function () { post({ type: 'applyCode', code: code }); };

        btns.appendChild(copyBtn); btns.appendChild(insertBtn);
        hdr.appendChild(lbl); hdr.appendChild(btns); wrap.appendChild(hdr);

        var pre = document.createElement('pre'); pre.className = 'code-pre';
        var codeEl = document.createElement('code'); codeEl.textContent = code.trimEnd();
        pre.appendChild(codeEl); wrap.appendChild(pre);
        return wrap;
    }

    function addMsg(text, role) {
        hideWelcome();
        var g = document.createElement('div'); g.className = 'msg-group ' + role;
        var lbl = document.createElement('div'); lbl.className = 'msg-label';
        lbl.textContent = role === 'user' ? 'You' : 'Ollama';
        g.appendChild(lbl);

        if (role === 'user') {
            var b = document.createElement('div'); b.className = 'msg-bubble';
            b.innerHTML = fmtText(text); g.appendChild(b);
        } else {
            var parts = parseCodeBlocks(text);
            parts.forEach(function (p) {
                if (p.t === 'text' && p.v.trim()) {
                    var b2 = document.createElement('div'); b2.className = 'msg-bubble';
                    b2.innerHTML = fmtText(p.v.trim()); g.appendChild(b2);
                } else if (p.t === 'code') {
                    g.appendChild(makeCodeBlock(p.lang, p.v));
                }
            });
            if (g.children.length === 1) {
                var b3 = document.createElement('div'); b3.className = 'msg-bubble';
                b3.textContent = text || '(empty response)'; g.appendChild(b3);
            }
        }
        msgs.appendChild(g); scrollBottom();
    }

    function addError(text) {
        hideWelcome();
        var g = document.createElement('div'); g.className = 'msg-group error';
        var b = document.createElement('div'); b.className = 'msg-bubble'; b.textContent = text;
        g.appendChild(b); msgs.appendChild(g); scrollBottom();
    }

    // ── Thinking indicator ───────────────────────────────
    function clearTimers() { timers.forEach(function (t) { clearTimeout(t); }); timers = []; }

    function doneThinking() {
        clearTimers();
        if (thinkEl && thinkEl.parentNode) { thinkEl.parentNode.removeChild(thinkEl); thinkEl = null; }
    }

    function showThinking() {
        hideWelcome(); doneThinking();
        thinkEl = document.createElement('div'); thinkEl.id = 'thinking';
        thinkEl.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div><span id="think-txt">Sending...</span>';

        var cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.cssText = 'display:none;margin-left:auto;font-size:11px;padding:2px 8px;background:#3a3d41;color:#ccc;border:none;border-radius:4px;cursor:pointer;';
        cancelBtn.onclick = function () {
            doneThinking(); sending = false; sendBtn.style.opacity = '1';
            addError('Cancelled. You can send another message.');
        };
        thinkEl.appendChild(cancelBtn);
        msgs.appendChild(thinkEl); scrollBottom();

        timers.push(setTimeout(function () { cancelBtn.style.display = 'inline-block'; }, 5000));
        timers.push(setTimeout(function () { var t = document.getElementById('think-txt'); if (t) t.textContent = 'Thinking...'; }, 1500));
        timers.push(setTimeout(function () { var t = document.getElementById('think-txt'); if (t) t.textContent = 'Loading model into memory, please wait...'; }, 8000));
        timers.push(setTimeout(function () { var t = document.getElementById('think-txt'); if (t) t.textContent = 'Still loading — large models can take 1-2 min on first use...'; }, 25000));
        timers.push(setTimeout(function () {
            doneThinking(); sending = false; sendBtn.style.opacity = '1';
            addError('No response after 3 minutes. Check Ollama is running and try again.');
        }, 180000));
    }

    function detachFile() {
        attachedFile = null;
        fileChipRow.style.display = 'none';
        attachBtn.classList.remove('active');
        input.placeholder = 'Ask me anything... (Enter to send, Shift+Enter for new line)';
    }

    // ── Send ─────────────────────────────────────────────
    function sendMsg(text) {
        text = (text || '').trim();
        if (!text || sending) { return; }
        sending = true;
        sendBtn.style.opacity = '0.4';

        var fullText = text;
        var displayText = text;
        if (attachedFile) {
            fullText = 'File: ' + attachedFile.filename + '\n```' + attachedFile.lang + '\n' + attachedFile.content + '\n```\n\n' + text;
            displayText = '[\uD83D\uDCC4 ' + attachedFile.filename + ']\n' + text;
            detachFile();
        }

        addMsg(displayText, 'user');
        showThinking();
        input.value = ''; input.style.height = 'auto';
        post({ type: 'send', text: fullText });
    }

    // ── Event listeners ──────────────────────────────────
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(input.value); }
    });
    input.addEventListener('input', function () {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });
    sendBtn.addEventListener('click', function () { sendMsg(input.value); });
    modelSel.addEventListener('change', function () { post({ type: 'changeModel', model: modelSel.value }); });
    newChatBtn.addEventListener('click', function () {
        post({ type: 'clearHistory' });
        msgs.innerHTML = '<p style="text-align:center;color:var(--vscode-descriptionForeground,#666);font-size:12px;margin-top:40px;">New conversation started</p>';
        sending = false; sendBtn.style.opacity = '1';
        detachFile();
    });
    attachBtn.addEventListener('click', function () { post({ type: 'getFile' }); });
    fileChipRemove.addEventListener('click', function () { detachFile(); input.focus(); });
    document.querySelectorAll('.hint-card').forEach(function (card) {
        card.addEventListener('click', function () {
            var m = card.getAttribute('data-msg');
            if (m) { input.value = m; input.focus(); }
        });
    });

    // ── Messages from extension host ─────────────────────
    window.addEventListener('message', function (ev) {
        var d = ev.data;
        switch (d.type) {
            case 'response':
                doneThinking(); addMsg(d.text, 'assistant');
                sending = false; sendBtn.style.opacity = '1'; input.focus();
                break;
            case 'error':
                doneThinking(); addError('Error: ' + d.text);
                sending = false; sendBtn.style.opacity = '1';
                break;
            case 'thinking':
                showThinking();
                break;
            case 'init':
                if (d.models && d.models.length) {
                    modelSel.innerHTML = '';
                    d.models.forEach(function (m) {
                        var o = document.createElement('option');
                        o.value = m; o.textContent = m;
                        if (m === d.current) { o.selected = true; }
                        modelSel.appendChild(o);
                    });
                }
                break;
            case 'modelChanged':
                for (var i = 0; i < modelSel.options.length; i++) {
                    if (modelSel.options[i].value === d.model) { modelSel.selectedIndex = i; break; }
                }
                break;
            case 'inject':
                input.value = d.text; sendMsg(d.text);
                break;
            case 'fileContext':
                if (d.error) {
                    addError(d.error);
                } else {
                    attachedFile = { filename: d.filename, lang: d.lang, content: d.content };
                    fileChipName.textContent = d.filename + ' (' + d.lines + ' lines)';
                    fileChipRow.style.display = 'block';
                    attachBtn.classList.add('active');
                    input.placeholder = 'Ask about ' + d.filename + '...';
                    input.focus();
                }
                break;
        }
    });

    // Signal ready
    post({ type: 'ready' });
    input.focus();
}());
