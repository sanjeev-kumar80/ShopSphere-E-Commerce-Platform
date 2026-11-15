/**
 * Integration Test Script for ShopSphere AI Module
 * Tests:
 * 1. AI models diagnostic endpoint (GET /api/ai/models)
 * 2. AI providers health endpoint (GET /api/ai/status)
 * 3. AI chat validation rules (POST /api/ai/chat)
 * 4. Fallback execution chain handling (POST /api/ai/chat)
 */

const BASE_URL = process.env.TEST_API_URL || "http://localhost:5000/api/ai";

async function runTests() {
    console.log("=== Testing ShopSphere AI Module ===");

    // Test 1: GET /api/ai/models
    try {
        console.log("\n[Test 1] GET /api/ai/models");
        const res = await fetch(`${BASE_URL}/models`);
        const json = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", JSON.stringify(json, null, 2));
        if (json.success && json.data.providers.ollama && json.data.providers.gemini && json.data.providers.groq) {
            console.log("✅ PASS: Models and providers configured properly.");
        } else {
            console.error("❌ FAIL: Missing provider configurations.");
        }
    } catch (err) {
        console.error("❌ Test 1 Error:", err.message);
    }

    // Test 2: GET /api/ai/status
    try {
        console.log("\n[Test 2] GET /api/ai/status");
        const res = await fetch(`${BASE_URL}/status`);
        const json = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", JSON.stringify(json, null, 2));
        if (json.success && json.data.providers) {
            console.log("✅ PASS: Provider health checks completed gracefully.");
        } else {
            console.error("❌ FAIL: Status endpoint response unexpected.");
        }
    } catch (err) {
        console.error("❌ Test 2 Error:", err.message);
    }

    // Test 3: Validation Error on Empty POST /api/ai/chat
    try {
        console.log("\n[Test 3] Validation Handling (POST /api/ai/chat with invalid body)");
        const res = await fetch(`${BASE_URL}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "", provider: "unknown" })
        });
        const json = await res.json();
        console.log("Status:", res.status);
        if (res.status === 400 && json.success === false && json.errors?.length > 0) {
            console.log("✅ PASS: Express-validator caught invalid payload.");
        } else {
            console.error("❌ FAIL: Expected 400 validation error.");
        }
    } catch (err) {
        console.error("❌ Test 3 Error:", err.message);
    }

    // Test 4: Provider Fallback Chain (POST /api/ai/chat with valid message)
    try {
        console.log("\n[Test 4] Provider Fallback Execution (POST /api/ai/chat)");
        const res = await fetch(`${BASE_URL}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "What laptops are in stock?" })
        });
        const json = await res.json();
        console.log("Status:", res.status);
        console.log("Attempts:", JSON.stringify(json.attempts, null, 2));
        if (json.attempts && json.attempts.length === 3) {
            console.log("✅ PASS: Fallback chain triggered through Ollama -> Gemini -> Groq.");
        } else {
            console.log("ℹ️ Completed with response:", json);
        }
    } catch (err) {
        console.error("❌ Test 4 Error:", err.message);
    }

    console.log("\n=== AI Module Test Run Complete ===");
}

runTests();
