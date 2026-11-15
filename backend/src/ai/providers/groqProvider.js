const BaseAIProvider = require("./baseProvider");

/**
 * Groq AI Provider (Fallback 2)
 * High-speed inference using Groq's OpenAI-compatible REST API.
 */
class GroqProvider extends BaseAIProvider {
    constructor(config = {}) {
        super("groq", config);
        this.apiKey = config.apiKey || "";
        this.baseUrl = (config.baseUrl || "https://api.groq.com/openai/v1").replace(/\/$/, "");
        this.model = config.model || "llama-3.3-70b-versatile";
        this.timeoutMs = config.timeoutMs || 10000;
        this.temperature = config.temperature ?? 0.7;
    }

    /**
     * Check if Groq API key is configured and endpoint reachable.
     */
    async checkHealth() {
        if (!this.apiKey) {
            return {
                healthy: false,
                provider: this.name,
                model: this.model,
                message: "Groq API key is not configured (GROQ_API_KEY is empty)"
            };
        }

        const start = Date.now();
        const { controller, timeoutId } = this.createTimeoutSignal(4000);

        try {
            const res = await fetch(`${this.baseUrl}/models`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${this.apiKey}`
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const latencyMs = Date.now() - start;

            if (res.ok) {
                return {
                    healthy: true,
                    provider: this.name,
                    model: this.model,
                    latencyMs,
                    message: "Groq API is reachable and credentials are valid"
                };
            }

            return {
                healthy: false,
                provider: this.name,
                model: this.model,
                latencyMs,
                message: `Groq API returned status ${res.status}`
            };
        } catch (error) {
            clearTimeout(timeoutId);
            return {
                healthy: false,
                provider: this.name,
                model: this.model,
                message: error.name === "AbortError"
                    ? "Groq health check timed out"
                    : `Groq health check failed: ${error.message}`
            };
        }
    }

    /**
     * Generate chat completion via Groq /chat/completions endpoint.
     */
    async generateChat(messages, options = {}) {
        if (!this.apiKey) {
            const err = new Error("Groq API key is not configured");
            err.provider = this.name;
            throw err;
        }

        const model = options.model || this.model;
        const temperature = options.temperature ?? this.temperature;
        const timeoutMs = options.timeoutMs || this.timeoutMs;

        const { controller, timeoutId } = this.createTimeoutSignal(timeoutMs);

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model,
                    messages: messages.map((m) => ({
                        // Normalize 'model' role to OpenAI standard 'assistant'
                        role: m.role === "model" ? "assistant" : m.role,
                        content: m.content
                    })),
                    temperature,
                    stream: false
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Groq HTTP ${response.status}: ${errorBody}`);
            }

            const data = await response.json();
            const choice = data.choices?.[0];
            const text = choice?.message?.content || "";

            return {
                text,
                provider: this.name,
                model,
                usage: {
                    promptTokens: data.usage?.prompt_tokens || 0,
                    completionTokens: data.usage?.completion_tokens || 0,
                    totalTokens: data.usage?.total_tokens || 0
                },
                raw: data
            };
        } catch (error) {
            clearTimeout(timeoutId);
            const isTimeout = error.name === "AbortError";
            const enhancedError = new Error(
                isTimeout
                    ? `Groq provider timed out after ${timeoutMs}ms`
                    : `Groq request failed: ${error.message}`
            );
            enhancedError.provider = this.name;
            enhancedError.isTimeout = isTimeout;
            throw enhancedError;
        }
    }
}

module.exports = GroqProvider;
