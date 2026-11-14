require("dotenv").config();

/**
 * AI Module Configuration
 * Centralizes all provider settings, model defaults, and gateway policies.
 */

const aiConfig = {
    // Gateway settings
    gateway: {
        primaryProvider: process.env.AI_PRIMARY_PROVIDER || "ollama",
        fallbackOrder: (process.env.AI_FALLBACK_ORDER || "ollama,gemini,groq")
            .split(",")
            .map((p) => p.trim().toLowerCase()),
        timeoutMs: parseInt(process.env.AI_TIMEOUT_MS, 10) || 15000,
        maxRetriesPerProvider: parseInt(process.env.AI_MAX_RETRIES, 10) || 1
    },

    // 1. Ollama (Primary - Local / Self-hosted)
    ollama: {
        baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
        model: process.env.OLLAMA_MODEL || "qwen2.5:3b",
        temperature: parseFloat(process.env.OLLAMA_TEMPERATURE) || 0.7,
        timeoutMs: parseInt(process.env.OLLAMA_TIMEOUT_MS, 10) || 12000
    },

    // 2. Google Gemini (Fallback 1)
    gemini: {
        apiKey: process.env.GEMINI_API_KEY || "",
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        apiVersion: process.env.GEMINI_API_VERSION || "v1beta",
        temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.7,
        timeoutMs: parseInt(process.env.GEMINI_TIMEOUT_MS, 10) || 15000
    },

    // 3. Groq (Fallback 2 - Ultra-low latency cloud)
    groq: {
        apiKey: process.env.GROQ_API_KEY || "",
        baseUrl: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
        model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
        temperature: parseFloat(process.env.GROQ_TEMPERATURE) || 0.7,
        timeoutMs: parseInt(process.env.GROQ_TIMEOUT_MS, 10) || 10000
    }
};

module.exports = aiConfig;
