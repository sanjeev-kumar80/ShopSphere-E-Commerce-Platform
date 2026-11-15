/**
 * Live AI Integration Test Suite for ShopSphere
 * Tests live connections to:
 * 1. Primary: Ollama (qwen2.5:3b)
 * 2. Fallback 1: Google Gemini (gemini-2.5-flash)
 * 3. Fallback 2: Groq (openai/gpt-oss-120b)
 * 4. Fallback execution chain when primary fails
 * 5. End-to-end POST /api/ai/chat with live MongoDB product catalog grounding
 * 6. Negative anti-hallucination verification
 */

require("dotenv").config({ path: "backend/.env" });
const OllamaProvider = require("../src/ai/providers/ollamaProvider");
const GeminiProvider = require("../src/ai/providers/geminiProvider");
const GroqProvider = require("../src/ai/providers/groqProvider");
const { AIGateway } = require("../src/ai/services/aiGateway");

const BASE_URL = process.env.TEST_API_URL || "http://localhost:5000/api/ai";

async function runLiveSuite() {
    console.log("===============================================================");
    console.log("   SHOPSPHERE - LIVE AI PROVIDER INTEGRATION TEST SUITE");
    console.log("===============================================================\n");

    const report = {
        ollama: false,
        gemini: false,
        groq: false,
        fallback: false,
        catalogGrounding: false,
        antiHallucination: false
    };

    // 1. Test Real Ollama (qwen2.5:3b)
    try {
        console.log("[Test 1] Testing Real Ollama (qwen2.5:3b)...");
        const ollama = new OllamaProvider({
            baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
            model: process.env.OLLAMA_MODEL || "qwen2.5:3b",
            timeoutMs: 60000
        });

        const start = Date.now();
        const res = await ollama.generateChat([
            { role: "user", content: "In 5 words, describe ShopSphere online store." }
        ]);
        const duration = Date.now() - start;

        if (res.text && res.provider === "ollama") {
            console.log(`✅ PASS: Ollama responded in ${duration}ms.`);
            console.log(`   Model: ${res.model}`);
            console.log(`   Reply: "${res.text.trim()}"`);
            report.ollama = true;
        }
    } catch (err) {
        console.error("❌ FAIL Ollama:", err.message);
    }

    // 2. Test Real Gemini (gemini-2.5-flash)
    try {
        console.log("\n[Test 2] Testing Real Gemini (gemini-2.5-flash)...");
        const gemini = new GeminiProvider({
            apiKey: process.env.GEMINI_API_KEY,
            model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
            timeoutMs: 15000
        });

        const start = Date.now();
        const res = await gemini.generateChat([
            { role: "user", content: "In 5 words, describe online customer care." }
        ]);
        const duration = Date.now() - start;

        if (res.text && res.provider === "gemini") {
            console.log(`✅ PASS: Gemini responded in ${duration}ms.`);
            console.log(`   Model: ${res.model}`);
            console.log(`   Reply: "${res.text.trim()}"`);
            report.gemini = true;
        }
    } catch (err) {
        console.error("❌ FAIL Gemini:", err.message);
    }

    // 3. Test Real Groq (openai/gpt-oss-120b)
    try {
        console.log("\n[Test 3] Testing Real Groq (openai/gpt-oss-120b)...");
        const groq = new GroqProvider({
            apiKey: process.env.GROQ_API_KEY,
            model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
            timeoutMs: 15000
        });

        const start = Date.now();
        const res = await groq.generateChat([
            { role: "user", content: "In 5 words, describe e-commerce speed." }
        ]);
        const duration = Date.now() - start;

        if (res.text && res.provider === "groq") {
            console.log(`✅ PASS: Groq responded in ${duration}ms.`);
            console.log(`   Model: ${res.model}`);
            console.log(`   Reply: "${res.text.trim()}"`);
            report.groq = true;
        }
    } catch (err) {
        console.error("❌ FAIL Groq:", err.message);
    }

    // 4. Test Live Fallback (Ollama offline -> Fallback to Gemini)
    try {
        console.log("\n[Test 4] Testing Live Fallback (Simulating Ollama down -> Gemini)...");
        const gw = new AIGateway();
        gw.registerProvider(new OllamaProvider({ baseUrl: "http://127.0.0.1:59995", timeoutMs: 1000 }));
        gw.registerProvider(new GeminiProvider({ apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL || "gemini-2.5-flash" }));
        gw.registerProvider(new GroqProvider({ apiKey: process.env.GROQ_API_KEY, model: process.env.GROQ_MODEL || "openai/gpt-oss-120b" }));

        const res = await gw.generateChat([
            { role: "user", content: "Reply with 'Fallback Success'." }
        ]);

        if (res.fallbackOccurred && res.provider === "gemini") {
            console.log("✅ PASS: Gateway caught Ollama failure and successfully fell back to Gemini.");
            console.log(`   Active Provider: ${res.provider}`);
            console.log(`   Attempts Logged: ${res.attempts.length}`);
            report.fallback = true;
        }
    } catch (err) {
        console.error("❌ FAIL Fallback:", err.message);
    }

    // 5. Test Live POST /api/ai/chat with Real MongoDB Products Grounding
    try {
        console.log("\n[Test 5] Testing POST /api/ai/chat with Real Shopping Query...");
        const res = await fetch(`${BASE_URL}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: "What running shoes do you have in stock?",
                provider: "groq" // Use Groq for ultra-fast verification
            })
        });

        const data = await res.json();
        const reply = data.data?.reply || "";

        const mentionsAdidas = reply.toLowerCase().includes("adidas") || reply.toLowerCase().includes("ultraboost");
        const mentionsNike = reply.toLowerCase().includes("nike") || reply.toLowerCase().includes("air max");

        if (res.status === 200 && (mentionsAdidas || mentionsNike)) {
            console.log("✅ PASS: Live chat grounded in real MongoDB products.");
            console.log(`   Provider Used: ${data.data?.provider}`);
            console.log(`   Assistant Response Snippet:\n   ${reply.slice(0, 200)}...`);
            report.catalogGrounding = true;
        } else {
            console.log("Response:", reply);
            throw new Error("Chat did not ground response in catalog shoes");
        }
    } catch (err) {
        console.error("❌ FAIL Catalog Grounding:", err.message);
    }

    // 6. Test Anti-Hallucination Guardrail
    try {
        console.log("\n[Test 6] Testing Anti-Hallucination Guardrail on Non-Existent Items...");
        const res = await fetch(`${BASE_URL}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: "Do you have any scuba diving oxygen tanks?",
                provider: "groq"
            })
        });

        const data = await res.json();
        const reply = data.data?.reply || "";
        const admitsNotCarried =
            reply.toLowerCase().includes("don't have") ||
            reply.toLowerCase().includes("not currently") ||
            reply.toLowerCase().includes("does not include") ||
            reply.toLowerCase().includes("does not carry") ||
            reply.toLowerCase().includes("out of stock") ||
            reply.toLowerCase().includes("no matching");

        if (res.status === 200 && admitsNotCarried) {
            console.log("✅ PASS: Anti-hallucination enforced (assistant politely declined out-of-catalog item).");
            console.log(`   Assistant Response: "${reply.trim().slice(0, 150)}..."`);
            report.antiHallucination = true;
        } else {
            throw new Error("Assistant did not decline out-of-catalog item cleanly: " + reply);
        }
    } catch (err) {
        console.error("❌ FAIL Anti-Hallucination:", err.message);
    }

    console.log("\n===============================================================");
    console.log("   LIVE INTEGRATION SUITE SUMMARY");
    console.log("===============================================================");
    console.log(`1. Ollama (qwen2.5:3b):            ${report.ollama ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`2. Gemini (gemini-2.5-flash):      ${report.gemini ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`3. Groq (openai/gpt-oss-120b):     ${report.groq ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`4. Multi-Provider Fallback:        ${report.fallback ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`5. Real MongoDB Catalog Grounding: ${report.catalogGrounding ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`6. Anti-Hallucination Guardrail:   ${report.antiHallucination ? "✅ PASS" : "❌ FAIL"}`);
    console.log("===============================================================\n");
}

runLiveSuite();
