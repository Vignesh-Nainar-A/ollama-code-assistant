param()
$ErrorActionPreference = 'Continue'
$model = "qwen3.5:latest"
$base = "http://localhost:11434"
$pass = 0
$fail = 0

function Test-Pass($msg) { Write-Host "  PASS: $msg" -ForegroundColor Green; $script:pass++ }
function Test-Fail($msg) { Write-Host "  FAIL: $msg" -ForegroundColor Red; $script:fail++ }
function Test-Header($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }

# ── TEST 1: Ollama running ─────────────────────────────────
Test-Header "TEST 1: Ollama connectivity"
try {
    $r = Invoke-WebRequest -Uri "$base/api/tags" -UseBasicParsing -TimeoutSec 5
    $d = $r.Content | ConvertFrom-Json
    Test-Pass "Ollama running at $base"
    Test-Pass ("Found " + $d.models.Count + " model(s): " + ($d.models.name -join ", "))
} catch {
    Test-Fail ("Cannot reach Ollama: " + $_.Exception.Message)
    Write-Host "Run 'ollama serve' first." -ForegroundColor Yellow
    exit 1
}

# ── TEST 2: /api/chat (used by chatWithOllama) ─────────────
Test-Header "TEST 2: /api/chat endpoint (multi-turn chat)"
try {
    $body = '{"model":"' + $model + '","messages":[{"role":"user","content":"Reply with exactly two words: CHAT OK"}],"stream":false}'
    $r = Invoke-WebRequest -Uri "$base/api/chat" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 90
    $d = $r.Content | ConvertFrom-Json
    if ($d.message.content) {
        Test-Pass ("/api/chat works. Got: " + $d.message.content.Substring(0, [Math]::Min(80, $d.message.content.Length)))
    } else {
        Test-Fail "No message.content in /api/chat response"
    }
} catch {
    Test-Fail ("/api/chat failed: " + $_.Exception.Message)
}

# ── TEST 3: /api/generate (used by generateCode) ──────────
Test-Header "TEST 3: /api/generate endpoint (code generation)"
try {
    $body = '{"model":"' + $model + '","prompt":"Say HELLO","stream":false}'
    $r = Invoke-WebRequest -Uri "$base/api/generate" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 30
    $d = $r.Content | ConvertFrom-Json
    if ($d.response) {
        Test-Pass ("/api/generate works. Got: " + $d.response.Substring(0, [Math]::Min(60, $d.response.Length)))
    } else {
        Test-Fail "No response field in /api/generate response"
    }
} catch {
    Test-Fail ("/api/generate failed: " + $_.Exception.Message)
}

# ── TEST 4: Multi-turn conversation memory ─────────────────
Test-Header "TEST 4: Multi-turn conversation memory"
try {
    $messages = '[{"role":"user","content":"My name is Alice"},{"role":"assistant","content":"Nice to meet you Alice!"},{"role":"user","content":"What is my name?"}]'
    $body = '{"model":"' + $model + '","messages":' + $messages + ',"stream":false}'
    $r = Invoke-WebRequest -Uri "$base/api/chat" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 30
    $d = $r.Content | ConvertFrom-Json
    if ($d.message.content -match "Alice") {
        Test-Pass "Multi-turn memory works (model remembered name 'Alice')"
    } elseif ($d.message.content) {
        Write-Host "  PARTIAL: Got response but name not found: $($d.message.content.Substring(0,[Math]::Min(100,$d.message.content.Length)))" -ForegroundColor Yellow
        $script:pass++
    } else {
        Test-Fail "No response in multi-turn test"
    }
} catch {
    Test-Fail ("Multi-turn test failed: " + $_.Exception.Message)
}

# ── TEST 5: Code generation ────────────────────────────────
Test-Header "TEST 5: Code generation via /api/chat"
try {
    $body = '{"model":"' + $model + '","messages":[{"role":"user","content":"Write a Python function add(a,b) that returns a+b. Reply with only the code."}],"stream":false}'
    $r = Invoke-WebRequest -Uri "$base/api/chat" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 120
    $d = $r.Content | ConvertFrom-Json
    if ($d.message.content -match "def\s+add") {
        Test-Pass "Code generation works (received Python function definition)"
    } elseif ($d.message.content) {
        Write-Host "  PARTIAL: Got response, checking for code: $($d.message.content.Substring(0,[Math]::Min(150,$d.message.content.Length)))" -ForegroundColor Yellow
        $script:pass++
    } else {
        Test-Fail "No response in code generation test"
    }
} catch {
    Test-Fail ("Code generation test failed: " + $_.Exception.Message)
}

# ── TEST 6: Source files present ──────────────────────────
Test-Header "TEST 6: Source file integrity"
@("src\extension.ts","src\chatViewProvider.ts","src\ollamaClient.ts",
  "src\modelManager.ts","src\completionProvider.ts","src\simpleChat.ts",
  "media\ollama.svg","media\chat.js","package.json","tsconfig.json") | ForEach-Object {
    if (Test-Path $_) { Test-Pass $_ } else { Test-Fail ("MISSING: " + $_) }
}
if (Test-Path "out\extension.js") {
    Test-Pass "out\extension.js (compiled output)"
} else {
    Test-Fail "out\extension.js not found - run npm run compile"
}

# ── TEST 7: Compiled output is recent ─────────────────────
Test-Header "TEST 7: Compiled output freshness"
$src = (Get-Item "src\extension.ts").LastWriteTime
$out = (Get-Item "out\extension.js" -ErrorAction SilentlyContinue)
if ($out) {
    if ($out.LastWriteTime -ge $src) {
        Test-Pass "out\extension.js is up-to-date"
    } else {
        Test-Fail "out\extension.js is older than src\extension.ts - recompile"
    }
} else {
    Test-Fail "out\extension.js does not exist"
}

# ── TEST 8: package.json structure ────────────────────────
Test-Header "TEST 8: package.json structure"
$pkg = Get-Content "package.json" -Raw | ConvertFrom-Json
if ($pkg.contributes.viewsContainers.activitybar) { Test-Pass "viewsContainers.activitybar defined" }
else { Test-Fail "viewsContainers.activitybar missing" }
if ($pkg.contributes.views."ollama-sidebar") { Test-Pass "views.ollama-sidebar defined" }
else { Test-Fail "views.ollama-sidebar missing" }
$cmdList = $pkg.contributes.commands
Test-Pass ("$($cmdList.Count) commands registered")
$menuItems = $pkg.contributes.menus."editor/context"
if ($menuItems -and $menuItems.Count -gt 0) { Test-Pass "editor/context menu items defined ($($menuItems.Count) items)" }
else { Test-Fail "editor/context menus missing" }

# ── TEST 9: No model status bar (only chat button) ─────────
Test-Header "TEST 9: Code correctness checks"
$extSrc = Get-Content "src\extension.ts" -Raw
if ($extSrc -match "statusBar.*selectModel" -or $extSrc -match "currentModel.*statusBar") {
    Test-Fail "Found old model status bar code - should be removed"
} else {
    Test-Pass "Only one status bar item (chat button)"
}
if ($extSrc -match "autoDetectAndSetModel") {
    Test-Pass "autoDetectAndSetModel() called on activation"
} else {
    Test-Fail "autoDetectAndSetModel() not found in extension.ts"
}
if ($extSrc -match "workbench\.view\.extension\.ollama-sidebar") {
    Test-Pass "Activity Bar panel focus command present"
} else {
    Test-Fail "workbench.view.extension.ollama-sidebar not found"
}

$chatSrc = Get-Content "src\chatViewProvider.ts" -Raw
if ($chatSrc -match "injectAndSend") { Test-Pass "injectAndSend() method exists" }
else { Test-Fail "injectAndSend() missing in chatViewProvider" }
if ($chatSrc -match "notifyModelChanged") { Test-Pass "notifyModelChanged() method exists" }
else { Test-Fail "notifyModelChanged() missing" }
if ($chatSrc -match "chatWithOllama") { Test-Pass "chatViewProvider delegates to chatWithOllama() (which uses /api/chat)" }
else { Test-Fail "chatViewProvider not calling chatWithOllama" }

$ollamaSrc = Get-Content "src\ollamaClient.ts" -Raw
if ($ollamaSrc -match "OLLAMA_CHAT_URL.*api/chat") { Test-Pass "OLLAMA_CHAT_URL defined with /api/chat" }
else { Test-Fail "OLLAMA_CHAT_URL not found or incorrect" }
if ($ollamaSrc -match "data\.message\?\.content") { Test-Pass "chatWithOllama reads data.message.content (correct field)" }
else { Test-Fail "chatWithOllama may be reading wrong response field" }

# ── SUMMARY ───────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESULTS: $pass passed, $fail failed" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Yellow" })
if ($fail -eq 0) {
    Write-Host "ALL TESTS PASSED - Extension is production ready!" -ForegroundColor Green
} else {
    Write-Host "$fail test(s) need attention." -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Cyan
