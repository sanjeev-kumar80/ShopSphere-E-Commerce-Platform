const aiConfig = require("../config/aiConfig");
const { OllamaProvider, GeminiProvider, GroqProvider } = require("../providers");

/**
 * AI Gateway
 * Orchestrates provider selection, automatic fallbacks, and health diagnostics.
 * Default chain: Ollama (Primary) -> Gemini (Fallback 1) -> Groq (Fallback 2).
 */
class AIGateway {
    constructor(config = aiConfig) {
        this.config = config;
        this.providers = new Map();

        // Register default providers
        this.registerProvider(new OllamaProvider(config.ollama));
        this.registerProvider(new GeminiProvider(config.gemini));
        this.registerProvider(new GroqProvider(config.groq));

        this.fallbackOrder = config.gateway.fallbackOrder || ["ollama", "gemini", "groq"];
        this.primaryProvider = config.gateway.primaryProvider || "ollama";
    }

    /**
     * Register or update a provider instance.
     * @param {BaseAIProvider} provider
     */
    registerProvider(provider) {
        this.providers.set(provider.name.toLowerCase(), provider);
    }

    /**
     * Retrieve a registered provider by name.
     * @param {string} name
     * @returns {BaseAIProvider | undefined}
     */
    getProvider(name) {
        return this.providers.get(name?.toLowerCase());
    }

    /**
     * Determine the execution chain for a given request.
     * @param {string} [requestedProvider]
     * @returns {string[]}
     */
    getExecutionChain(requestedProvider) {
        if (requestedProvider) {
            const normalized = requestedProvider.toLowerCase();
            if (this.providers.has(normalized)) {
                // If a specific provider is requested, put it first, followed by others as fallback
                return [normalized, ...this.fallbackOrder.filter((p) => p !== normalized)];
            }
        }
        return [...this.fallbackOrder];
    }

    /**
     * Execute chat completion across provider chain with automatic fallback.
     * @param {Array<{role: string, content: string}>} messages
     * @param {object} [options]
     * @returns {Promise<{
     *   text: string,
     *   provider: string,
     *   model: string,
     *   fallbackOccurred: boolean,
     *   attempts: Array<{provider: string, success: boolean, durationMs: number, error?: string}>,
     *   usage?: object
     * }>}
     */
    async generateChat(messages, options = {}) {
        const chain = this.getExecutionChain(options.provider);
        const attempts = [];
        let lastError = null;

        for (const providerName of chain) {
            const provider = this.getProvider(providerName);
            if (!provider) continue;

            const start = Date.now();
            try {
                const result = await provider.generateChat(messages, options);
                const durationMs = Date.now() - start;

                attempts.push({
                    provider: providerName,
                    success: true,
                    durationMs
                });

                return {
                    text: result.text,
                    provider: result.provider,
                    model: result.model,
                    fallbackOccurred: attempts.length > 1,
                    attempts,
                    usage: result.usage,
                    raw: options.includeRaw ? result.raw : undefined
                };
            } catch (err) {
                const durationMs = Date.now() - start;
                attempts.push({
                    provider: providerName,
                    success: false,
                    durationMs,
                    error: err.message
                });
                lastError = err;
                // Continue to the next fallback provider
            }
        }

        const aggregatedMessage = attempts
            .map((a) => `[${a.provider}]: ${a.error}`)
            .join("; ");

        const failureError = new Error(
            `All AI providers failed. Attempts: ${aggregatedMessage}`
        );
        failureError.attempts = attempts;
        failureError.lastError = lastError;
        throw failureError;
    }

    /**
     * Check health status of all registered providers.
     * @returns {Promise<object>}
     */
    async getProvidersStatus() {
        const statuses = {};
        for (const [name, provider] of this.providers.entries()) {
            try {
                statuses[name] = await provider.checkHealth();
            } catch (error) {
                statuses[name] = {
                    healthy: false,
                    provider: name,
                    message: error.message
                };
            }
        }

        return {
            primaryProvider: this.primaryProvider,
            fallbackOrder: this.fallbackOrder,
            providers: statuses,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Return list of models configured for each provider.
     */
    listConfiguredModels() {
        const list = {};
        for (const [name, provider] of this.providers.entries()) {
            list[name] = {
                model: provider.model,
                timeoutMs: provider.timeoutMs
            };
        }
        return list;
    }
}

// Export singleton instance as default, and class for custom tests
const defaultGateway = new AIGateway();

module.exports = {
    AIGateway,
    defaultGateway
};
