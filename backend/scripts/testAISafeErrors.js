const assert = require("node:assert/strict");
const path = require("node:path");
const Module = require("node:module");

const controllerPath = path.resolve(__dirname, "../src/ai/controllers/aiController.js");
const secretMarker = "TEST_ONLY_PROVIDER_SECRET_94721";
const passwordMarker = "TEST_ONLY_PASSWORD_381";
const tokenMarker = "TEST_ONLY_TOKEN_526";
const googleKeyMarker = "TEST_ONLY_GOOGLE_KEY_734";
const internalUrl = "https://internal.provider.test/private?token=private-token";
let statusFails = false;
let modelListingFails = false;
let chatSucceeds = false;

const diagnosticError = new Error(
    `Provider rejected request apiKey=${secretMarker} Authorization: Bearer bearer-secret password="${passwordMarker} with spaces" token=${tokenMarker} x-goog-api-key=${googleKeyMarker} ${internalUrl}`
);
diagnosticError.attempts = [
    { provider: "gemini", success: false, error: `${secretMarker} ${internalUrl}` }
];

const gateway = {
    primaryProvider: "ollama",
    fallbackOrder: ["ollama", "gemini", "groq"],
    async getProvidersStatus() {
        if (statusFails) throw diagnosticError;
        return {
            primaryProvider: "ollama",
            fallbackOrder: ["ollama", "gemini", "groq"],
            timestamp: "2026-01-01T00:00:00.000Z",
            providers: {
                ollama: {
                    provider: "ollama",
                    healthy: false,
                    model: "internal-model-name",
                    message: `${secretMarker} ${internalUrl}`
                },
                gemini: {
                    provider: "gemini",
                    healthy: true,
                    latencyMs: 42,
                    apiKey: secretMarker,
                    message: `Healthy ${secretMarker}`
                }
            }
        };
    },
    listConfiguredModels() {
        if (modelListingFails) throw diagnosticError;
        return {};
    },
    async generateChat() {
        if (chatSucceeds) {
            return {
                text: "Safe reply",
                provider: "gemini",
                model: "gemini-model",
                fallbackOccurred: true,
                attempts: [
                    { provider: "ollama", success: false, durationMs: 3, error: `${secretMarker} ${internalUrl}` },
                    { provider: "gemini", success: true, durationMs: 4 }
                ]
            };
        }
        throw diagnosticError;
    }
};

const productContextService = {
    async searchProducts() { return []; },
    formatProductsForContext() { return ""; },
    extractBudget() { return null; }
};

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
    if (parent?.filename === controllerPath) {
        if (request === "../services/aiGateway") return { defaultGateway: gateway };
        if (request === "../services/productContextService") return productContextService;
        if (request === "../prompts/promptTemplates") {
            return { buildShoppingChatMessages: () => [{ role: "user", content: "test" }] };
        }
    }
    return originalLoad.call(this, request, parent, isMain);
};

const { getAIStatus, getAvailableModels, chat } = require(controllerPath);
Module._load = originalLoad;

const serverLogs = [];
const originalConsoleError = console.error;
console.error = (...args) => serverLogs.push(args.map((arg) =>
    typeof arg === "string" ? arg : JSON.stringify(arg)
).join(" "));
let testStage = "initialization";

const makeResponse = () => ({
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
});

const responseText = (response) => JSON.stringify(response.body);

async function run() {
    testStage = "provider status allowlist";
    const statusResponse = makeResponse();
    await getAIStatus({}, statusResponse);
    assert.equal(statusResponse.statusCode, 200);
    assert.equal(statusResponse.body.data.providers.ollama.healthy, false);
    assert.equal(statusResponse.body.data.providers.gemini.healthy, true);
    assert.equal(statusResponse.body.data.providers.gemini.latencyMs, 42);
    assert.equal("message" in statusResponse.body.data.providers.ollama, false);
    assert.equal("model" in statusResponse.body.data.providers.ollama, false);
    assert.equal("apiKey" in statusResponse.body.data.providers.gemini, false);
    assert.ok(!responseText(statusResponse).includes(secretMarker));
    assert.ok(!responseText(statusResponse).includes(internalUrl));

    testStage = "successful fallback response";
    chatSucceeds = true;
    const fallbackResponse = makeResponse();
    await chat({ body: { message: "test" } }, fallbackResponse);
    assert.equal(fallbackResponse.statusCode, 200);
    assert.equal(fallbackResponse.body.data.provider, "gemini");
    assert.equal(fallbackResponse.body.data.fallbackOccurred, true);
    assert.equal("error" in fallbackResponse.body.data.attempts[0], false);
    assert.ok(!responseText(fallbackResponse).includes(secretMarker));
    assert.ok(!responseText(fallbackResponse).includes(internalUrl));

    testStage = "failed chat response";
    chatSucceeds = false;
    const chatResponse = makeResponse();
    await chat({ body: { message: "test" } }, chatResponse);
    assert.equal(chatResponse.statusCode, 502);
    assert.equal(chatResponse.body.message, "The AI assistant is temporarily unavailable. Please try again later.");
    assert.equal("attempts" in chatResponse.body, false);
    assert.ok(!responseText(chatResponse).includes(secretMarker));
    assert.ok(!responseText(chatResponse).includes(internalUrl));

    testStage = "status failure response";
    statusFails = true;
    const failedStatusResponse = makeResponse();
    await getAIStatus({}, failedStatusResponse);
    assert.equal(failedStatusResponse.statusCode, 500);
    assert.equal(failedStatusResponse.body.message, "AI provider status is temporarily unavailable.");
    assert.ok(!responseText(failedStatusResponse).includes(secretMarker));

    testStage = "model failure response";
    modelListingFails = true;
    const modelResponse = makeResponse();
    await getAvailableModels({}, modelResponse);
    assert.equal(modelResponse.statusCode, 500);
    assert.ok(!responseText(modelResponse).includes(secretMarker));

    testStage = "redacted server diagnostics";
    const combinedLogs = serverLogs.join("\n");
    testStage = "diagnostic redaction marker";
    assert.ok(combinedLogs.includes("[REDACTED]"));
    testStage = "diagnostic API key redaction";
    assert.ok(!combinedLogs.includes(secretMarker));
    testStage = "diagnostic bearer token redaction";
    assert.ok(!combinedLogs.includes("bearer-secret"));
    testStage = "diagnostic password redaction";
    assert.ok(!combinedLogs.includes(passwordMarker));
    testStage = "diagnostic token redaction";
    assert.ok(!combinedLogs.includes(tokenMarker));
    testStage = "diagnostic provider key redaction";
    assert.ok(!combinedLogs.includes(googleKeyMarker));
    testStage = "diagnostic URL redaction";
    assert.ok(!combinedLogs.includes(internalUrl));

    console.error = originalConsoleError;
    console.log("PASS: public AI status/chat/model errors are generic and exclude provider diagnostics; server logs redact secrets and URLs.");
}

run().catch((error) => {
    console.error = originalConsoleError;
    console.error(`FAIL: AI safe error test failed during ${testStage} (${error.name}).`);
    process.exitCode = 1;
});
