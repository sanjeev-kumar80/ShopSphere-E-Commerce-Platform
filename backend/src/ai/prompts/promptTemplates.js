const SYSTEM_PROMPTS = require("./systemPrompts");
const MAX_HISTORY_MESSAGES_FOR_PROMPT = 8;
const MAX_HISTORY_CONTENT_CHARACTERS = 900;

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

        // The system prompt names the catalog section and defines its grounding rules.
        let systemContent = SYSTEM_PROMPTS.SHOPPING_ASSISTANT;
        if (catalogContext) {
            systemContent += `\n\n[CATALOG]\n${catalogContext}`;
        }

        messages.push({
            role: "system",
            content: systemContent
        });

        // Append recent conversation history (sanitized to role & content)
        if (Array.isArray(history) && history.length > 0) {
            for (const h of history.slice(-MAX_HISTORY_MESSAGES_FOR_PROMPT)) {
                if (h.role && h.content) {
                    messages.push({
                        role: h.role === "assistant" || h.role === "model" ? "assistant" : "user",
                        // Preserve the beginning where product names and key facts usually appear.
                        content: String(h.content).slice(0, MAX_HISTORY_CONTENT_CHARACTERS)
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
