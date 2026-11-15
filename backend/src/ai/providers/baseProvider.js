/**
 * Base AI Provider Interface
 * All concrete providers (Ollama, Gemini, Groq) must extend this class
 * and adhere to its contract.
 */

class BaseAIProvider {
    /**
     * @param {string} name - Unique provider identifier (e.g. 'ollama', 'gemini', 'groq')
     * @param {object} config - Provider-specific configuration options
     */
    constructor(name, config = {}) {
        if (!name) {
            throw new Error("Provider must have a valid name");
        }
        this.name = name;
        this.config = config;
    }

    /**
     * Generate a chat completion.
     * @param {Array<{role: string, content: string}>} messages
     * @param {object} [options]
     * @returns {Promise<{
     *   text: string,
     *   provider: string,
     *   model: string,
     *   usage?: object,
     *   raw?: object
     * }>}
     */
    async generateChat(messages, options = {}) {
        throw new Error(`generateChat() is not implemented for provider '${this.name}'`);
    }

    /**
     * Perform a lightweight health and reachability check.
     * @returns {Promise<{
     *   healthy: boolean,
     *   provider: string,
     *   model: string,
     *   message?: string,
     *   latencyMs?: number
     * }>}
     */
    async checkHealth() {
        throw new Error(`checkHealth() is not implemented for provider '${this.name}'`);
    }

    /**
     * Helper to create an abort controller with a timeout.
     * @param {number} timeoutMs
     * @returns {{ controller: AbortController, timeoutId: NodeJS.Timeout }}
     */
    createTimeoutSignal(timeoutMs) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        return { controller, timeoutId };
    }
}

module.exports = BaseAIProvider;
