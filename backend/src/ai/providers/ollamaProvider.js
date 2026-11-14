const BaseAIProvider = require("./baseProvider");

/**
 * Ollama AI Provider (Primary)
 * Communicates with a local or self-hosted Ollama server instance.
 */
class OllamaProvider extends BaseAIProvider {
    constructor(config = {}) {
        super("ollama", config);
        this.baseUrl = (config.baseUrl || "http://localhost:11434").replace(/\/$/, "");
        this.model = config.model || "llama3.2";
        this.timeoutMs = config.timeoutMs || 12000;
        this.temperature = config.temperature ?? 0.7;
    }

    /**
     * Check if the Ollama instance is reachable and healthy.
     */
    async checkHealth() {
        const start = Date.now();
        const { controller, timeoutId } = this.createTimeoutSignal(Math.min(this.timeoutMs, 4000));

        try {
            const res = await fetch(`${this.baseUrl}/api/tags`, {
                method: "GET",
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const latencyMs = Date.now() - start;

            if (res.ok) {
                const data = await res.json();
                const availableModels = (data.models || []).map((m) => m.name);
                const hasTargetModel = availableModels.some((m) =>
                    m.toLowerCase().startsWith(this.model.toLowerCase())
                );

                return {
                    healthy: true,
                    provider: this.name,
                    model: this.model,
                    latencyMs,
                    message: hasTargetModel
                        ? `Ollama reachable, target model '${this.model}' is available.`
                        : `Ollama reachable, but '${this.model}' not yet pulled. Available models: [${availableModels.join(", ")}]`
                };
            }

            return {
                healthy: false,
                provider: this.name,
                model: this.model,
                latencyMs,
                message: `Ollama returned status ${res.status}: ${res.statusText}`
            };
        } catch (error) {
            clearTimeout(timeoutId);
            return {
                healthy: false,
                provider: this.name,
                model: this.model,
                message: error.name === "AbortError"
                    ? "Ollama health check timed out"
                    : `Ollama unreachable: ${error.message}`
            };
        }
    }

    /**
     * Generate chat completion via Ollama /api/chat.
     */
    async generateChat(messages, options = {}) {
        const model = options.model || this.model;
        const temperature = options.temperature ?? this.temperature;
        const timeoutMs = options.timeoutMs || this.timeoutMs;

        const { controller, timeoutId } = this.createTimeoutSignal(timeoutMs);

        try {
            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model,
                    messages: messages.map((m) => ({
                        role: m.role,
                        content: m.content
                    })),
                    options: {
                        temperature
                    },
                    stream: false
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Ollama HTTP ${response.status}: ${errorBody}`);
            }

            const data = await response.json();

            return {
                text: data.message?.content || "",
                provider: this.name,
                model,
                usage: {
                    promptTokens: data.prompt_eval_count || 0,
                    completionTokens: data.eval_count || 0,
                    totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
                },
                raw: data
            };
        } catch (error) {
            clearTimeout(timeoutId);
            const isTimeout = error.name === "AbortError";
            const enhancedError = new Error(
                isTimeout
                    ? `Ollama provider timed out after ${timeoutMs}ms`
                    : `Ollama request failed: ${error.message}`
            );
            enhancedError.provider = this.name;
            enhancedError.isTimeout = isTimeout;
            throw enhancedError;
        }
    }
}

module.exports = OllamaProvider;
