const { defaultGateway } = require("../services/aiGateway");
const productContextService = require("../services/productContextService");
const promptTemplates = require("../prompts/promptTemplates");
const { logSafeDiagnostic } = require("../utils/safeDiagnostics");

const sanitizeAttempts = (attempts = []) => attempts.map((attempt) => ({
    provider: attempt.provider,
    success: attempt.success === true,
    ...(Number.isFinite(attempt.durationMs)
        ? { durationMs: attempt.durationMs }
        : {})
}));

/**
 * AI Controller
 * Manages status checks, model diagnostics, and initial chat requests.
 */

/**
 * @desc    Get status & health of all AI providers and gateway configuration
 * @route   GET /api/ai/status
 * @access  Public
 */
const getAIStatus = async (req, res) => {
    try {
        const status = await defaultGateway.getProvidersStatus();
        const providers = Object.fromEntries(
            Object.entries(status.providers || {}).map(([name, providerStatus]) => [
                name,
                {
                    provider: name,
                    healthy: providerStatus?.healthy === true,
                    ...(Number.isFinite(providerStatus?.latencyMs)
                        ? { latencyMs: providerStatus.latencyMs }
                        : {})
                }
            ])
        );

        return res.status(200).json({
            success: true,
            data: {
                primaryProvider: status.primaryProvider,
                providers,
                timestamp: status.timestamp
            }
        });
    } catch (error) {
        logSafeDiagnostic("Provider status check failed", error);
        return res.status(500).json({
            success: false,
            message: "AI provider status is temporarily unavailable."
        });
    }
};

/**
 * @desc    Get configured AI models and primary provider
 * @route   GET /api/ai/models
 * @access  Public
 */
const getAvailableModels = async (req, res) => {
    try {
        const models = defaultGateway.listConfiguredModels();
        return res.status(200).json({
            success: true,
            data: {
                primaryProvider: defaultGateway.primaryProvider,
                fallbackOrder: defaultGateway.fallbackOrder,
                providers: models
            }
        });
    } catch (error) {
        logSafeDiagnostic("Model listing failed", error);
        return res.status(500).json({
            success: false,
            message: "AI model information is temporarily unavailable."
        });
    }
};

/**
 * @desc    Initial chat interaction with fallback support & catalog grounding
 * @route   POST /api/ai/chat
 * @access  Public
 */
const chat = async (req, res) => {
    try {
        const { message, history = [], provider, includeContext = true } = req.body;

        let catalogContext = "";
        let relevantProducts = [];
        if (includeContext) {
            relevantProducts = await productContextService.searchProducts(message, 4);
            catalogContext = productContextService.formatProductsForContext(relevantProducts);

            const budget = productContextService.extractBudget(message);
            if (budget !== null && relevantProducts.length === 0) {
                const formattedBudget = new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 2
                }).format(budget);

                return res.status(200).json({
                    success: true,
                    data: {
                        reply: `I couldn't find any active, in-stock products priced at or below ${formattedBudget}. Try a higher budget or a broader search.`,
                        provider: null,
                        model: null,
                        fallbackOccurred: false,
                        attempts: [],
                        usage: null,
                        products: []
                    }
                });
            }
        }

        const messages = promptTemplates.buildShoppingChatMessages(message, catalogContext, history);

        const result = await defaultGateway.generateChat(messages, {
            provider,
            temperature: 0.7
        });

        return res.status(200).json({
            success: true,
            data: {
                reply: result.text,
                provider: result.provider,
                model: result.model,
                fallbackOccurred: result.fallbackOccurred,
                attempts: sanitizeAttempts(result.attempts),
                usage: result.usage,
                products: relevantProducts
            }
        });
    } catch (error) {
        logSafeDiagnostic("Chat request failed", error);
        return res.status(502).json({
            success: false,
            message: "The AI assistant is temporarily unavailable. Please try again later."
        });
    }
};

module.exports = {
    getAIStatus,
    getAvailableModels,
    chat
};
