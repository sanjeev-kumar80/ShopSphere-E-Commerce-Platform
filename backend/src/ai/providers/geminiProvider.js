const BaseAIProvider = require("./baseProvider");

/**
 * Google Gemini AI Provider (Fallback 1)
 * Communicates with Google Generative AI REST API directly without extra packages.
 */
class GeminiProvider extends BaseAIProvider {
    constructor(config = {}) {
        super("gemini", config);
        this.apiKey = config.apiKey || "";
        this.model = config.model || "gemini-1.5-flash";
        this.maxOutputTokens = config.maxOutputTokens || 128;
        this.apiVersion = config.apiVersion || "v1beta";
        this.timeoutMs = config.timeoutMs || 15000;
        this.temperature = config.temperature ?? 0.7;
    }

    /**
     * Check if Gemini API key is configured and accessible.
     */
    async checkHealth() {
        if (!this.apiKey) {
            return {
                healthy: false,
                provider: this.name,
                model: this.model,
                message: "Gemini API key is not configured (GEMINI_API_KEY is empty)"
            };
        }

        const start = Date.now();
        const { controller, timeoutId } = this.createTimeoutSignal(4000);

        try {
            // Uses x-goog-api-key header to prevent key leakage in URLs/logs
            const url = `https://generativelanguage.googleapis.com/${this.apiVersion}/models/${this.model}`;
            const res = await fetch(url, {
                method: "GET",
                headers: {
                    "x-goog-api-key": this.apiKey
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
                    message: "Gemini API is accessible and credentials are valid"
                };
            }

            return {
                healthy: false,
                provider: this.name,
                model: this.model,
                latencyMs,
                message: `Gemini API returned status ${res.status}`
            };
        } catch (error) {
            clearTimeout(timeoutId);
            return {
                healthy: false,
                provider: this.name,
                model: this.model,
                message: error.name === "AbortError"
                    ? "Gemini health check timed out"
                    : `Gemini health check failed: ${error.message}`
            };
        }
    }

    /**
     * Transform OpenAI/standard chat messages into Gemini API format.
     * Enforces Gemini's requirement that turns alternate between 'user' and 'model'.
     */
    _formatContents(messages) {
        let systemInstruction = null;
        const rawTurns = [];

        for (const msg of messages) {
            if (msg.role === "system") {
                systemInstruction = {
                    parts: [{ text: msg.content }]
                };
            } else {
                const role = msg.role === "assistant" || msg.role === "model" ? "model" : "user";
                rawTurns.push({ role, text: msg.content });
            }
        }

        // Gemini requires alternating turns: merge consecutive turns of identical role
        const contents = [];
        for (const turn of rawTurns) {
            const lastTurn = contents[contents.length - 1];
            if (lastTurn && lastTurn.role === turn.role) {
                lastTurn.parts.push({ text: turn.text });
            } else {
                contents.push({
                    role: turn.role,
                    parts: [{ text: turn.text }]
                });
            }
        }

        // If conversation does not start with user turn, insert a priming user turn
        if (contents.length > 0 && contents[0].role !== "user") {
            contents.unshift({
                role: "user",
                parts: [{ text: "Hello" }]
            });
        }

        // Ensure at least one user turn exists
        if (contents.length === 0) {
            contents.push({
                role: "user",
                parts: [{ text: "Hello" }]
            });
        }

        return { systemInstruction, contents };
    }

    /**
     * Generate chat completion via Gemini generateContent endpoint.
     */
    async generateChat(messages, options = {}) {
        if (!this.apiKey) {
            const err = new Error("Gemini API key is not configured");
            err.provider = this.name;
            throw err;
        }

        const model = options.model || this.model;
        const temperature = options.temperature ?? this.temperature;
        const maxOutputTokens = options.maxOutputTokens || this.maxOutputTokens;
        const timeoutMs = options.timeoutMs || this.timeoutMs;

        const { systemInstruction, contents } = this._formatContents(messages);

        const requestBody = {
            contents,
            generationConfig: {
                temperature,
                maxOutputTokens
            }
        };

        if (systemInstruction) {
            requestBody.systemInstruction = systemInstruction;
        }

        // Uses x-goog-api-key header instead of query parameter for security
        const url = `https://generativelanguage.googleapis.com/${this.apiVersion}/models/${model}:generateContent`;
        const { controller, timeoutId } = this.createTimeoutSignal(timeoutMs);

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": this.apiKey
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Gemini HTTP ${response.status}: ${errorBody}`);
            }

            const data = await response.json();
            const candidate = data.candidates?.[0];
            const text = candidate?.content?.parts?.map((p) => p.text).join("") || "";

            return {
                text,
                provider: this.name,
                model,
                usage: {
                    promptTokens: data.usageMetadata?.promptTokenCount || 0,
                    completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
                    totalTokens: data.usageMetadata?.totalTokenCount || 0
                },
                raw: data
            };
        } catch (error) {
            clearTimeout(timeoutId);
            const isTimeout = error.name === "AbortError";
            const enhancedError = new Error(
                isTimeout
                    ? `Gemini provider timed out after ${timeoutMs}ms`
                    : `Gemini request failed: ${error.message}`
            );
            enhancedError.provider = this.name;
            enhancedError.isTimeout = isTimeout;
            throw enhancedError;
        }
    }
}

module.exports = GeminiProvider;
