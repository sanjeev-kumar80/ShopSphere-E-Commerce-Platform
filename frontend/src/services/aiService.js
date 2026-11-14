import api from "./api";

/**
 * AI Shopping Assistant Service
 * Connects the React storefront to the ShopSphere backend AI gateway (/api/ai).
 * Automatically carries auth headers via the existing Axios interceptors.
 */

export const aiService = {
  /**
   * Send user message to AI gateway with conversation history
   * @param {string} message - Current user message
   * @param {Array<{role: string, content: string}>} history - Previous conversation turns
   * @param {object} [options] - Optional overrides (provider, includeContext)
   * @returns {Promise<{
   *   reply: string,
   *   provider: string,
   *   model: string,
   *   fallbackOccurred: boolean,
   *   attempts: Array<object>,
   *   products: Array<object>
   * }>}
   */
  async sendMessage(message, history = [], options = {}) {
    try {
      const response = await api.post(
        "/ai/chat",
        {
          message,
          history: history.slice(-20), // Max 20 history items
          provider: options.provider,
          includeContext: options.includeContext !== false,
        },
        {
          timeout: 60000, // 60s timeout for local LLM generation
        }
      );

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.message || "Invalid AI response format");
    } catch (error) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        throw new Error(
          "The AI Assistant took too long to respond. Please try again."
        );
      }
      throw new Error(
        error.message || "Unable to reach the AI assistant. Please check your connection."
      );
    }
  },

  /**
   * Fetch live status and health of configured providers
   */
  async getStatus() {
    try {
      const response = await api.get("/ai/status", { timeout: 8000 });
      return response.data?.data || null;
    } catch (error) {
      console.warn("Could not fetch AI status:", error.message);
      return null;
    }
  },

  /**
   * Fetch active model configuration
   */
  async getModels() {
    try {
      const response = await api.get("/ai/models", { timeout: 8000 });
      return response.data?.data || null;
    } catch (error) {
      console.warn("Could not fetch AI models:", error.message);
      return null;
    }
  },
};

export default aiService;
