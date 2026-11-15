const SYSTEM_PROMPTS = require("./systemPrompts");

/**
 * Prompt Templates
 * Standardized structures for assembling chat messages with context grounding.
 */

const promptTemplates = {
    /**
     * Build standard shopping assistant conversation payload.
     * @param {string} userMessage
     * @param {string} [catalogContext]
     * @param {Array<{role: string, content: string}>} [history=[]]
     * @returns {Array<{role: string, content: string}>}
     */
    buildShoppingChatMessages(userMessage, catalogContext = "", history = []) {
        const messages = [];

        // System message with injected catalog grounding
        let systemContent = SYSTEM_PROMPTS.SHOPPING_ASSISTANT;
        if (catalogContext) {
            systemContent += `\n\n[RELEVANT CATALOG CONTEXT]:\n${catalogContext}\n\nUse this context to answer customer questions accurately.`;
        }

        messages.push({
            role: "system",
            content: systemContent
        });

        // Append recent conversation history (sanitized to role & content)
        if (Array.isArray(history) && history.length > 0) {
            for (const h of history) {
                if (h.role && h.content) {
                    messages.push({
                        role: h.role === "assistant" || h.role === "model" ? "assistant" : "user",
                        content: String(h.content)
                    });
                }
            }
        }

        // Add current user prompt
        messages.push({
            role: "user",
            content: userMessage
        });

        return messages;
    }
};

module.exports = promptTemplates;
