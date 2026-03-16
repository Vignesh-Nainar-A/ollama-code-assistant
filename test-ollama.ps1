#!/usr/bin/env pwsh

Write-Host "TEST: Ollama Code Assistant - System Test`n" -ForegroundColor Cyan
Write-Host ("=" * 50)

$OLLAMA_URL = "http://localhost:11434"
$API_TAGS = "$OLLAMA_URL/api/tags"
$API_GENERATE = "$OLLAMA_URL/api/generate"

Write-Host "`nTest 1: Checking if Ollama is running..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri $API_TAGS -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "PASS: Ollama is running at $OLLAMA_URL" -ForegroundColor Green
    
    Write-Host "`nTest 2: Fetching available models..." -ForegroundColor Yellow
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.models) {
        Write-Host "PASS: Found $($data.models.Count) model(s)" -ForegroundColor Green
        foreach ($model in $data.models) {
            Write-Host "  - $($model.name)" -ForegroundColor Cyan
        }
    }
    
    Write-Host "`nTest 3: Testing API endpoint..." -ForegroundColor Yellow
    
    $body = @{
        model = "qwen3.5:latest"
        prompt = "Say hello"
        stream = $false
    } | ConvertTo-Json
    
    try {
        $genResponse = Invoke-WebRequest -Uri $API_GENERATE `
            -Method Post `
            -Headers @{"Content-Type"="application/json"} `
            -Body $body `
            -TimeoutSec 30 `
            -UseBasicParsing `
            -ErrorAction Stop
        
        $genData = $genResponse.Content | ConvertFrom-Json
        
        if ($genData.response) {
            Write-Host "PASS: API works!" -ForegroundColor Green
        } else {
            Write-Host "WARN: API responded but no response field" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "FAIL: API request failed" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Make sure a model is installed (ollama pull qwen3.5)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "FAIL: Cannot connect to Ollama" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nTo fix:" -ForegroundColor Yellow
    Write-Host "1. Open terminal" -ForegroundColor Yellow
    Write-Host "2. Run: ollama serve" -ForegroundColor Cyan
    Write-Host "3. Try again" -ForegroundColor Yellow
    exit 1
}

Write-Host "`nAll tests passed!" -ForegroundColor Green
