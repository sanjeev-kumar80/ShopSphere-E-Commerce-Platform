const { performance } = require("node:perf_hooks");
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

const logChatPerformance = (res, requestStartedAt, timings) => {
    if (typeof res.once !== "function") return;

    res.once("finish", () => {
        const formatMs = (value) => Number.isFinite(value)
            ? Number(value.toFixed(2))
            : null;

        console.info("[AI] chat performance", {
            catalogSearchMs: formatMs(timings.catalogSearchMs),
            contextPreparationMs: formatMs(timings.contextPreparationMs),
            providerGenerationMs: formatMs(timings.providerGenerationMs),
            totalApiResponseMs: formatMs(performance.now() - requestStartedAt),
            provider: timings.provider
        });
    });
};

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
    const requestStartedAt = performance.now();
    const timings = {
        catalogSearchMs: null,
        contextPreparationMs: null,
        providerGenerationMs: null,
        provider: null
    };
    logChatPerformance(res, requestStartedAt, timings);

    try {
        const { message, history = [], provider, includeContext = true } = req.body;

        let catalogContext = "";
        let relevantProducts = [];
        let budget = null;
        let specificIntent = null;
        if (includeContext) {
            const followUp = productContextService.resolveFollowUpReferences(message, history);
            const searchStartedAt = performance.now();
            try {
                if (followUp.isFollowUp) {
                    if (followUp.ambiguous) {
                        timings.catalogSearchMs = 0;
                        return res.status(200).json({
                            success: true,
                            data: {
                                reply: "Which product do you mean? Please name it or choose one recommendation.",
                                provider: null,
                                model: null,
                                fallbackOccurred: false,
                                attempts: [],
                                usage: null,
                                products: []
                            }
                        });
                    }

                    const constraints = productContextService.getFollowUpConstraints(message, history);
                    relevantProducts = await productContextService.getProductsByIds(
                        followUp.productIds,
                        4,
                        constraints
                    );
                    budget = constraints.budget;
                    specificIntent = constraints.intent;
                } else {
                    relevantProducts = await productContextService.searchProducts(message, 4);
                    budget = productContextService.extractBudget(message);
                    specificIntent = productContextService.getSpecificProductIntent(message);
                }
            } finally {
                timings.catalogSearchMs = performance.now() - searchStartedAt;
            }

            const contextStartedAt = performance.now();
            catalogContext = productContextService.formatProductsForContext(relevantProducts);

            if (relevantProducts.length === 0 && (budget !== null || specificIntent)) {
                timings.contextPreparationMs = performance.now() - contextStartedAt;
                const formattedBudget = budget === null
                    ? null
                    : new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 2
                    }).format(budget);

                const reply = budget !== null
                    ? `I couldn't find active, in-stock ${specificIntent ? `${specificIntent.label} ` : "products "}priced at or below ${formattedBudget}. Try a higher budget or a broader search.`
                    : `I couldn't find any active, in-stock ${specificIntent.label} matching your request. Try a different search or budget.`;

                return res.status(200).json({
                    success: true,
                    data: {
                        reply,
                        provider: null,
                        model: null,
                        fallbackOccurred: false,
                        attempts: [],
                        usage: null,
                        products: []
                    }
                });
            }

            if (followUp.isFollowUp && relevantProducts.length === 0) {
                timings.contextPreparationMs = performance.now() - contextStartedAt;
                return res.status(200).json({
                    success: true,
                    data: {
                        reply: "I couldn't verify that recommendation as active and in stock under your constraints. Would you like me to find current alternatives?",
                        provider: null,
                        model: null,
                        fallbackOccurred: false,
                        attempts: [],
                        usage: null,
                        products: []
                    }
                });
            }

            const messages = promptTemplates.buildShoppingChatMessages(message, catalogContext, history);
            timings.contextPreparationMs = performance.now() - contextStartedAt;
            const providerStartedAt = performance.now();
            let result;
            try {
                result = await defaultGateway.generateChat(messages, {
                    provider,
                    temperature: 0.7,
                    maxOutputTokens: defaultGateway.config?.gateway?.maxOutputTokens || 128
                });
            } finally {
                timings.providerGenerationMs = performance.now() - providerStartedAt;
            }

            timings.provider = result.provider;

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
        }

        const contextStartedAt = performance.now();
        const messages = promptTemplates.buildShoppingChatMessages(message, catalogContext, history);
        timings.contextPreparationMs = performance.now() - contextStartedAt;

        const providerStartedAt = performance.now();
        let result;
        try {
            result = await defaultGateway.generateChat(messages, {
                provider,
                temperature: 0.7,
                maxOutputTokens: defaultGateway.config?.gateway?.maxOutputTokens || 128
            });
        } finally {
            timings.providerGenerationMs = performance.now() - providerStartedAt;
        }

        timings.provider = result.provider;

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
