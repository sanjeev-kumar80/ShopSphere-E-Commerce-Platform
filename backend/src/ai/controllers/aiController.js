const { defaultGateway } = require("../services/aiGateway");
const productContextService = require("../services/productContextService");
const promptTemplates = require("../prompts/promptTemplates");

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
        return res.status(200).json({
            success: true,
            data: status
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve AI providers status",
            error: error.message
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
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve AI models",
            error: error.message
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
            if (relevantProducts.length > 0) {
                catalogContext = productContextService.formatProductsForContext(relevantProducts);
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
                attempts: result.attempts,
                usage: result.usage,
                products: relevantProducts
            }
        });
    } catch (error) {
        return res.status(502).json({
            success: false,
            message: error.message || "AI providers could not process the request",
            attempts: error.attempts || []
        });
    }
};

module.exports = {
    getAIStatus,
    getAvailableModels,
    chat
};
