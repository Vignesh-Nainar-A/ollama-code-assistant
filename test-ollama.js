#!/usr/bin/env node

/**
 * Ollama Code Assistant - Full System Test
 * Tests all functionality before using the extension
 */

const OLLAMA_API_URL = 'http://localhost:11434/api/generate';
const OLLAMA_TAGS_URL = 'http://localhost:11434/api/tags';
const OLLAMA_STATUS_URL = 'http://localhost:11434/api/tags';

console.log('🧪 Ollama Code Assistant - Comprehensive Test Suite\n');
console.log('='.repeat(50));

async function runTests() {
    const fetch = (await import('node-fetch')).default;
    let testsPassed = 0;
    let testsFailed = 0;

    // Test 1: Check if Ollama is running
    console.log('\n✓ Test 1: Checking if Ollama is running...');
    try {
        const response = await fetch(OLLAMA_STATUS_URL, { timeout: 5000 });
        if (response.ok) {
            console.log('  ✅ PASS: Ollama is running on http://localhost:11434');
            testsPassed++;
        } else {
            console.log(`  ❌ FAIL: Ollama returned status ${response.status}`);
            testsFailed++;
        }
    } catch (error) {
        console.log(`  ❌ FAIL: Cannot connect to Ollama`);
        console.log(`     Error: ${error.message}`);
        console.log(`     Make sure to run: ollama serve`);
        testsFailed++;
        return; // Can't continue without Ollama
    }

    // Test 2: Check available models
    console.log('\n✓ Test 2: Fetching available models...');
    try {
        const response = await fetch(OLLAMA_TAGS_URL);
        const data = await response.json();
        if (data.models && Array.isArray(data.models)) {
            console.log(`  ✅ PASS: Found ${data.models.length} model(s)`);
            data.models.forEach(m => {
                const sizeGB = (m.size / 1024 / 1024 / 1024).toFixed(2);
                console.log(`     - ${m.name} (${sizeGB}GB)`);
            });
            testsPassed++;
        } else {
            console.log('  ❌ FAIL: Invalid response format');
            testsFailed++;
        }
    } catch (error) {
        console.log(`  ❌ FAIL: ${error.message}`);
        testsFailed++;
    }

    // Test 3: Test code generation endpoint
    console.log('\n✓ Test 3: Testing code generation endpoint...');
    try {
        const response = await fetch(OLLAMA_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3',
                prompt: 'Say hello',
                stream: false
            }),
            timeout: 30000
        });

        if (!response.ok) {
            console.log(`  ❌ FAIL: HTTP ${response.status} - ${response.statusText}`);
            console.log(`     URL: ${OLLAMA_API_URL}`);
            console.log(`     Make sure the model "llama3" is pulled: ollama pull llama3`);
            testsFailed++;
        } else {
            const data = await response.json();
            if (data.response) {
                console.log(`  ✅ PASS: Generated response`);
                console.log(`     Response preview: ${data.response.substring(0, 50)}...`);
                testsPassed++;
            } else {
                console.log('  ❌ FAIL: No response in reply');
                testsFailed++;
            }
        }
    } catch (error) {
        console.log(`  ❌ FAIL: ${error.message}`);
        console.log(`     This could mean:`);
        console.log(`     1. Ollama is not running (run: ollama serve)`);
        console.log(`     2. The model is not installed (run: ollama pull llama3)`);
        console.log(`     3. Network issue or timeout`);
        testsFailed++;
    }

    // Test 4: Test chat endpoint
    console.log('\n✓ Test 4: Testing chat messages endpoint...');
    try {
        const response = await fetch(OLLAMA_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3',
                messages: [{ role: 'user', content: 'Hi' }],
                stream: false
            }),
            timeout: 30000
        });

        if (!response.ok) {
            console.log(`  ❌ FAIL: HTTP ${response.status}`);
            testsFailed++;
        } else {
            const data = await response.json();
            if (data.response) {
                console.log(`  ✅ PASS: Chat endpoint works`);
                testsPassed++;
            } else {
                console.log('  ⚠️  WARN: Endpoint responded but no message data');
            }
        }
    } catch (error) {
        console.log(`  ❌ FAIL: ${error.message}`);
        testsFailed++;
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`\n📊 Test Results:`);
    console.log(`  ✅ Passed: ${testsPassed}`);
    console.log(`  ❌ Failed: ${testsFailed}`);
    console.log(`  Total: ${testsPassed + testsFailed}\n`);

    if (testsFailed === 0) {
        console.log('🎉 All tests passed! Your extension is ready to use.\n');
        console.log('Next steps:');
        console.log('1. Press F5 in VS Code (in the project folder)');
        console.log('2. Click the "$(comment) Chat" button at the bottom right');
        console.log('3. Type your message and press Enter');
        return true;
    } else {
        console.log('⚠️  Some tests failed. Please fix the issues above.\n');
        return false;
    }
}

runTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
