const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");
const { performance } = require("node:perf_hooks");

const servicePath = path.resolve(__dirname, "../src/ai/services/productContextService.js");
const controllerPath = path.resolve(__dirname, "../src/ai/controllers/aiController.js");
const gatewayPath = path.resolve(__dirname, "../src/ai/services/aiGateway.js");
const categories = [
    { _id: "cat-electronics", name: "Electronics", slug: "electronics", isActive: true },
    { _id: "cat-laptops", name: "Laptops", slug: "laptops", isActive: true },
    { _id: "cat-accessories", name: "Accessories", slug: "accessories", isActive: true },
    { _id: "cat-chargers", name: "Chargers", slug: "chargers", isActive: true }
];
const brands = [{ _id: "brand-acer", name: "Acer" }];
const PRODUCT_IDS = {
    laptop: "507f1f77bcf86cd799439011",
    charger: "507f1f77bcf86cd799439012",
    bag: "507f1f77bcf86cd799439013",
    inactive: "507f1f77bcf86cd799439014",
    unavailable: "507f1f77bcf86cd799439015"
};
const products = [
    {
        _id: PRODUCT_IDS.laptop,
        name: "ZenBook 14",
        slug: "zenbook-14",
        shortDescription: "Portable laptop for study and programming.",
        description: "Laptop for programming and daily work.",
        category: "cat-electronics",
        brand: "brand-acer",
        tags: ["laptop", "notebook", "programming", "electronics"],
        isActive: true,
        rating: 4.6,
        reviewCount: 12,
        variants: [
            { sku: "ZEN-48", price: 48000, stock: 4, isActive: true, attributes: { memory: "16GB" } },
            { sku: "ZEN-62", price: 62000, stock: 2, isActive: true, attributes: { memory: "32GB" } },
            { sku: "ZEN-OOS", price: 44000, stock: 0, isActive: true, attributes: {} },
            { sku: "ZEN-OFF", price: 39000, stock: 3, isActive: false, attributes: {} }
        ]
    },
    {
        _id: PRODUCT_IDS.charger,
        name: "Fast Charging 65W GaN Charger",
        slug: "fast-gan-charger",
        shortDescription: "Compact 65W charger.",
        description: "Power adapter capable of charging laptops, phones, and tablets.",
        category: "cat-electronics",
        brand: "brand-acer",
        tags: ["charger", "gadgets", "usb-c", "electronics"],
        isActive: true,
        rating: 4.8,
        reviewCount: 18,
        variants: [{ sku: "CHG-65", price: 2499, stock: 7, isActive: true, attributes: {} }]
    },
    {
        _id: PRODUCT_IDS.bag,
        name: "Everyday Laptop Sleeve Bag",
        slug: "laptop-sleeve-bag",
        shortDescription: "Protective laptop sleeve.",
        description: "A carry bag for a laptop.",
        category: "cat-accessories",
        brand: "brand-acer",
        tags: ["laptop", "sleeve", "bag", "accessories"],
        isActive: true,
        rating: 4.2,
        reviewCount: 4,
        variants: [{ sku: "BAG-01", price: 1200, stock: 5, isActive: true, attributes: {} }]
    },
    {
        _id: PRODUCT_IDS.inactive,
        name: "Inactive Laptop",
        slug: "inactive-laptop",
        shortDescription: "Inactive record.",
        description: "Laptop record disabled in the catalog.",
        category: "cat-laptops",
        brand: "brand-acer",
        tags: ["laptop"],
        isActive: false,
        variants: [{ sku: "OFF-1", price: 30000, stock: 5, isActive: true, attributes: {} }]
    },
    {
        _id: PRODUCT_IDS.unavailable,
        name: "Unavailable Laptop",
        slug: "unavailable-laptop",
        shortDescription: "No purchasable variants.",
        description: "Laptop model is currently unavailable.",
        category: "cat-laptops",
        brand: "brand-acer",
        tags: ["laptop"],
        isActive: true,
        variants: [
            { sku: "OOS-1", price: 32000, stock: 0, isActive: true, attributes: {} },
            { sku: "OFF-2", price: 28000, stock: 4, isActive: false, attributes: {} }
        ]
    }
];

let queryDelayMs = 0;
let productQueryCount = 0;
let categoryQueryCount = 0;
const seenProductFilters = [];
const activeProducts = () => products.filter((product) => product.isActive !== false);

const delay = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

const matchesValue = (value, condition) => {
    if (condition instanceof RegExp) {
        return (Array.isArray(value) ? value : [value]).some((entry) => condition.test(String(entry ?? "")));
    }

    if (condition && typeof condition === "object" && !Array.isArray(condition)) {
        if ("$elemMatch" in condition) {
            return (value || []).some((entry) => matches(entry, condition.$elemMatch));
        }
        if ("$type" in condition && condition.$type === "number" && typeof value !== "number") return false;
        if ("$gt" in condition && !(value > condition.$gt)) return false;
        if ("$gte" in condition && !(value >= condition.$gte)) return false;
        if ("$lte" in condition && !(value <= condition.$lte)) return false;
        if ("$in" in condition && !condition.$in.some((entry) =>
            entry instanceof RegExp
                ? entry.test(String(value ?? ""))
                : Array.isArray(value) ? value.includes(entry) : value === entry
        )) return false;
        if ("$nin" in condition && condition.$nin.some((entry) =>
            Array.isArray(value) ? value.includes(entry) : value === entry
        )) return false;
        return Object.entries(condition).every(([key, nested]) =>
            key.startsWith("$") || matchesValue(value?.[key], nested)
        );
    }

    return Array.isArray(value) ? value.includes(condition) : value === condition;
};

function matches(document, filter = {}) {
    return Object.entries(filter).every(([key, condition]) => {
        if (key === "$or") return condition.some((clause) => matches(document, clause));
        if (key === "$and") return condition.every((clause) => matches(document, clause));
        if (key === "$nor") return condition.every((clause) => !matches(document, clause));
        return matchesValue(document[key], condition);
    });
}

const createQuery = (records, filter, populateProducts = false) => {
    let limit = Infinity;
    return {
        populate() { return this; },
        select() { return this; },
        sort() { return this; },
        limit(value) { limit = value; return this; },
        async lean() {
            if (queryDelayMs > 0) await delay(queryDelayMs);
            return records.filter((record) => matches(record, filter)).slice(0, limit).map((record) => {
                if (!populateProducts) return { ...record };
                return {
                    ...record,
                    variants: (record.variants || []).map((variant) => ({ ...variant })),
                    category: categories.find((category) => category._id === record.category) || record.category,
                    brand: brands.find((brand) => brand._id === record.brand) || record.brand
                };
            });
        }
    };
};

const Product = {
    find(filter) {
        productQueryCount += 1;
        seenProductFilters.push(filter);
        return createQuery(activeProducts(), filter, true);
    }
};
const Category = {
    find(filter) {
        categoryQueryCount += 1;
        return createQuery(categories, filter);
    }
};
const Brand = {};

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
    if (parent?.filename === servicePath) {
        if (request === "../../models/Product") return Product;
        if (request === "../../models/Category") return Category;
        if (request === "../../models/Brand") return Brand;
    }
    if (parent?.filename === controllerPath && request === "../services/aiGateway") {
        return { defaultGateway: chatGateway };
    }
    if (parent?.filename === controllerPath && request === "../services/productContextService") {
        return productContextService;
    }
    if (parent?.filename === gatewayPath && request === "../config/aiConfig") {
        return {
            gateway: { fallbackOrder: ["ollama", "gemini", "groq"] },
            ollama: {},
            gemini: {},
            groq: {}
        };
    }
    if (parent?.filename === gatewayPath && request === "../providers") {
        return {
            OllamaProvider: class { constructor() { this.name = "ollama"; } },
            GeminiProvider: class { constructor() { this.name = "gemini"; } },
            GroqProvider: class { constructor() { this.name = "groq"; } }
        };
    }
    return originalLoad.call(this, request, parent, isMain);
};

const productContextService = require(servicePath);
let aiCalls = 0;
let lastChatMessages = [];
const chatGateway = {
    config: { gateway: { maxOutputTokens: 128 } },
    async generateChat(messages) {
        aiCalls += 1;
        lastChatMessages = messages;
        return {
            text: "Here is a matching laptop.",
            provider: "ollama",
            model: "qwen2.5:3b",
            fallbackOccurred: false,
            attempts: [{ provider: "ollama", success: true, durationMs: 4 }],
            products: []
        };
    }
};
const { chat } = require(controllerPath);
const { AIGateway } = require(gatewayPath);
Module._load = originalLoad;

const resetQueryCounts = () => {
    productQueryCount = 0;
    categoryQueryCount = 0;
    seenProductFilters.length = 0;
};

const makeResponse = () => ({
    statusCode: null,
    body: null,
    finishHandler: null,
    once(event, handler) { if (event === "finish") this.finishHandler = handler; return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    finish() { this.finishHandler?.(); }
});

async function testProviderFallback() {
    const calls = [];
    const gateway = Object.create(AIGateway.prototype);
    gateway.config = { gateway: { timeoutMs: 1000 } };
    gateway.primaryProvider = "ollama";
    gateway.fallbackOrder = ["ollama", "gemini", "groq"];
    gateway.providers = new Map([
        ["ollama", { name: "ollama", async generateChat() { calls.push("ollama"); throw new Error("mock primary failure"); } }],
        ["gemini", { name: "gemini", async generateChat() { calls.push("gemini"); return { text: "fallback reply", provider: "gemini", model: "mock-gemini" }; } }],
        ["groq", { name: "groq", async generateChat() { calls.push("groq"); return { text: "unexpected", provider: "groq", model: "mock-groq" }; } }]
    ]);

    const result = await gateway.generateChat([{ role: "user", content: "test" }]);
    assert.deepEqual(calls, ["ollama", "gemini"]);
    assert.equal(result.provider, "gemini");
    assert.equal(result.fallbackOccurred, true);
}

async function run() {
    const laptopQuery = "Recommend a laptop for programming";

    resetQueryCounts();
    const laptops = await productContextService.searchProducts(laptopQuery, 4);
    assert.deepEqual(laptops.map((product) => product.name), ["ZenBook 14"]);
    assert.equal(laptops[0].variants.some((variant) => variant.sku === "ZEN-OOS" || variant.sku === "ZEN-OFF"), false);
    assert.equal(productQueryCount, 1);
    assert.equal(categoryQueryCount, 1);
    assert.equal(seenProductFilters.some((filter) => filter.description || filter.shortDescription), false);

    resetQueryCounts();
    const chargerRecommendations = await productContextService.searchProducts("Recommend a laptop charger", 4);
    assert.deepEqual(chargerRecommendations.map((product) => product.name), ["Fast Charging 65W GaN Charger"]);

    const categoryOnlyLaptop = {
        _id: "category-only-laptop",
        name: "Swift 14 Ultrabook",
        slug: "swift-14-ultrabook",
        shortDescription: "Portable 14-inch computer.",
        category: "cat-laptops",
        brand: "brand-acer",
        tags: ["ultrabook", "programming"],
        isActive: true,
        rating: 4.3,
        reviewCount: 3,
        variants: [{ sku: "SWIFT-14", price: 45000, stock: 2, isActive: true, attributes: { memory: "16GB" } }]
    };
    products.push(categoryOnlyLaptop);
    resetQueryCounts();
    const categoryLaptops = await productContextService.searchProducts("Recommend a laptop", 4);
    assert.equal(categoryLaptops.some((product) => product._id === categoryOnlyLaptop._id), true);
    assert.equal(categoryLaptops.some((product) => product._id === PRODUCT_IDS.charger || product._id === PRODUCT_IDS.bag), false);
    products.pop();

    resetQueryCounts();
    const accessories = await productContextService.searchProducts("Show me laptop accessories", 4);
    assert.deepEqual(accessories.map((product) => product.name).sort(), ["Everyday Laptop Sleeve Bag", "Fast Charging 65W GaN Charger"].sort());

    resetQueryCounts();
    const budgetLaptops = await productContextService.searchProducts("Laptop under ₹50,000", 4);
    assert.deepEqual(budgetLaptops.map((product) => product.name), ["ZenBook 14"]);
    assert.deepEqual(budgetLaptops[0].variants.map((variant) => variant.sku), ["ZEN-48"]);

    const savedProducts = products.splice(0, products.length, ...products.filter((product) => product._id !== PRODUCT_IDS.laptop));
    resetQueryCounts();
    const noLaptops = await productContextService.searchProducts(laptopQuery, 4);
    assert.deepEqual(noLaptops, []);

    let infoLog = "";
    const originalInfo = console.info;
    console.info = (...args) => { infoLog = JSON.stringify(args); };
    aiCalls = 0;
    const response = makeResponse();
    await chat({ body: { message: laptopQuery } }, response);
    response.finish();
    console.info = originalInfo;
    assert.equal(response.statusCode, 200);
    assert.match(response.body.data.reply, /couldn't find.*laptops/i);
    assert.deepEqual(response.body.data.products, []);
    assert.equal(aiCalls, 0);
    assert.match(infoLog, /catalogSearchMs/);
    assert.match(infoLog, /providerGenerationMs/);
    assert.match(infoLog, /totalApiResponseMs/);

    products.splice(0, products.length, ...savedProducts);
    const originalInfoForSuccess = console.info;
    console.info = () => {};
    const successfulResponse = makeResponse();
    await chat({ body: { message: laptopQuery } }, successfulResponse);
    successfulResponse.finish();
    console.info = originalInfoForSuccess;
    const responseData = successfulResponse.body.data;
    assert.equal(successfulResponse.statusCode, 200);
    assert.equal(typeof responseData.reply, "string");
    assert.equal(responseData.provider, "ollama");
    assert.equal(responseData.model, "qwen2.5:3b");
    assert.equal(typeof responseData.fallbackOccurred, "boolean");
    assert.equal(Array.isArray(responseData.attempts), true);
    assert.equal(Array.isArray(responseData.products), true);
    assert.deepEqual(responseData.products.map((product) => product.name), ["ZenBook 14"]);
    assert.equal(responseData.products[0].slug, "zenbook-14");
    assert.equal(responseData.products[0].brand.name, "Acer");
    assert.equal(responseData.products[0].category.name, "Electronics");
    assert.equal(responseData.products[0].variants[0].price, 48000);

    const unavailableOnly = products.filter((product) => product._id === PRODUCT_IDS.unavailable);
    products.splice(0, products.length, ...unavailableOnly);
    resetQueryCounts();
    assert.deepEqual(await productContextService.searchProducts("laptop", 4), []);
    products.splice(0, products.length, ...savedProducts);

    const history = Array.from({ length: 20 }, (_, index) => ({ role: "user", content: `turn-${index}` }));
    const promptTemplates = require("../src/ai/prompts/promptTemplates");
    const messages = promptTemplates.buildShoppingChatMessages("current request", "", history);
    assert.equal(messages.length, 10);
    assert.equal(messages[1].content, "turn-12");
    assert.equal(messages.at(-2).content, "turn-19");

    const followUpHistory = [
        { role: "user", content: "Recommend laptops under ₹50,000." },
        { role: "assistant", content: `Acer Aspire 5 Laptop costs ₹47,990. Lenovo IdeaPad Slim Laptop costs ₹49,990.${" Additional catalog detail.".repeat(50)}` }
    ];
    const followUpMessages = promptTemplates.buildShoppingChatMessages(
        "What about the second one?",
        "",
        followUpHistory
    );
    assert.match(followUpMessages[0].content, /history only to resolve follow-up references/i);
    assert.match(followUpMessages[0].content, /only from \[CATALOG\]/i);
    assert.match(followUpMessages[2].content, /Lenovo IdeaPad Slim Laptop/);
    assert.equal(followUpMessages[2].content.length, 900);
    assert.equal(followUpMessages.at(-1).content, "What about the second one?");

    const recommendationHistory = [
        { role: "user", content: "Recommend laptops under ₹50,000." },
        { role: "assistant", content: "Here are three options.", productIds: [PRODUCT_IDS.laptop, PRODUCT_IDS.charger, PRODUCT_IDS.bag] }
    ];
    assert.deepEqual(
        productContextService.resolveFollowUpReferences("What about the second one?", recommendationHistory),
        { isFollowUp: true, ambiguous: false, productIds: [PRODUCT_IDS.charger] }
    );
    assert.deepEqual(
        productContextService.resolveFollowUpReferences("Compare the first and third ones", recommendationHistory),
        { isFollowUp: true, ambiguous: false, productIds: [PRODUCT_IDS.laptop, PRODUCT_IDS.bag] }
    );
    assert.deepEqual(
        productContextService.resolveFollowUpReferences("Tell me more about that laptop", [
            { role: "assistant", content: "One laptop recommendation.", productIds: [PRODUCT_IDS.laptop] }
        ]),
        { isFollowUp: true, ambiguous: false, productIds: [PRODUCT_IDS.laptop] }
    );
    assert.deepEqual(
        productContextService.resolveFollowUpReferences("Is that still within my budget?", [
            { role: "assistant", content: "One laptop recommendation.", productIds: [PRODUCT_IDS.laptop] }
        ]),
        { isFollowUp: true, ambiguous: false, productIds: [PRODUCT_IDS.laptop] }
    );
    assert.equal(productContextService.resolveFollowUpReferences("Does it have good battery life?", recommendationHistory).ambiguous, true);
    assert.equal(productContextService.resolveFollowUpReferences("What about the third one?", recommendationHistory.slice(0, 1)).ambiguous, true);

    const constraints = productContextService.getFollowUpConstraints(
        "Is that still within my budget?",
        recommendationHistory
    );
    assert.equal(constraints.budget, 50000);
    assert.equal(constraints.intent.kind, "laptop");

    resetQueryCounts();
    assert.deepEqual(await productContextService.getProductsByIds(["malformed-id"]), []);
    assert.deepEqual(await productContextService.getProductsByIds(["bad-one", "bad-two"]), []);
    assert.deepEqual(await productContextService.getProductsByIds([""]), []);
    assert.equal(productQueryCount, 0, "invalid and empty IDs must not reach Product.find");

    const secondProduct = await productContextService.getProductsByIds(
        [PRODUCT_IDS.laptop, "malformed-id"],
        4,
        constraints
    );
    assert.deepEqual(secondProduct.map((product) => product._id), [PRODUCT_IDS.laptop]);
    assert.deepEqual(secondProduct[0].variants.map((variant) => variant.sku), ["ZEN-48"]);
    assert.equal(productQueryCount, 1);
    assert.deepEqual(seenProductFilters.at(-1)._id.$in, [PRODUCT_IDS.laptop]);
    const duplicateProducts = await productContextService.getProductsByIds(
        [PRODUCT_IDS.laptop, PRODUCT_IDS.laptop],
        4,
        constraints
    );
    assert.deepEqual(duplicateProducts.map((product) => product._id), [PRODUCT_IDS.laptop]);
    assert.deepEqual(await productContextService.getProductsByIds([PRODUCT_IDS.inactive]), []);
    assert.deepEqual(await productContextService.getProductsByIds([PRODUCT_IDS.unavailable]), []);
    assert.deepEqual(await productContextService.getProductsByIds([PRODUCT_IDS.charger], 4, constraints), []);

    const followUpResponse = makeResponse();
    await chat({ body: {
        message: "What about the first one?",
        history: [
            { role: "user", content: "Recommend laptops under ₹50,000." },
            { role: "assistant", content: "Here is one laptop.", productIds: [PRODUCT_IDS.laptop] }
        ]
    } }, followUpResponse);
    followUpResponse.finish();
    assert.equal(followUpResponse.statusCode, 200);
    assert.deepEqual(followUpResponse.body.data.products.map((product) => product._id), [PRODUCT_IDS.laptop]);
    assert.match(lastChatMessages[0].content, /ZenBook 14/);
    assert.match(lastChatMessages[0].content, /₹48000/);
    assert.deepEqual(followUpResponse.body.data.products[0].variants.map((variant) => variant.sku), ["ZEN-48"]);

    const ambiguousCallsBefore = aiCalls;
    const ambiguousResponse = makeResponse();
    await chat({ body: {
        message: "Does it have good battery life?",
        history: [
            { role: "assistant", content: "Two options.", productIds: [PRODUCT_IDS.laptop, PRODUCT_IDS.bag] }
        ]
    } }, ambiguousResponse);
    assert.match(ambiguousResponse.body.data.reply, /Which product do you mean/);
    assert.deepEqual(ambiguousResponse.body.data.products, []);
    assert.equal(aiCalls, ambiguousCallsBefore);

    const unavailableCallsBefore = aiCalls;
    const unavailableReferenceResponse = makeResponse();
    await chat({ body: {
        message: "Tell me more about that laptop",
        history: [
            { role: "user", content: "Recommend a laptop." },
            { role: "assistant", content: "Here is a laptop.", productIds: [PRODUCT_IDS.unavailable] }
        ]
    } }, unavailableReferenceResponse);
    assert.match(unavailableReferenceResponse.body.data.reply, /couldn't find any active, in-stock laptops/i);
    assert.deepEqual(unavailableReferenceResponse.body.data.products, []);
    assert.equal(aiCalls, unavailableCallsBefore);

    const longDescriptionProduct = {
        name: "Long Description Laptop",
        brand: { name: "Acer" },
        category: { name: "Laptops" },
        shortDescription: "Portable programming laptop. ".repeat(30),
        rating: 4.5,
        reviewCount: 99,
        variants: [{
            price: 49000,
            stock: 2,
            isActive: true,
            attributes: { memory: "16GB", storage: "512GB", notes: "specification ".repeat(30) }
        }]
    };
    const compactContext = productContextService.formatProductsForContext([longDescriptionProduct]);
    const summary = compactContext.match(/Summary: (.+)/)?.[1];
    assert.ok(summary);
    assert.equal(summary.length <= 240, true);
    assert.match(compactContext, /memory: 16GB, storage: 512GB/);
    const options = compactContext.match(/Available Options: ([^\n]+)/)?.[1];
    assert.ok(options);
    assert.equal(options.length <= 160, true);
    assert.match(compactContext, /Price: ₹49000/);
    assert.match(compactContext, /In Stock \(2 available\)/);
    assert.match(compactContext, /4.5\/5 \(99 reviews\)/);

    await testProviderFallback();

    resetQueryCounts();
    queryDelayMs = 8;
    const benchmarkStart = performance.now();
    const searchStart = performance.now();
    const measuredProducts = await productContextService.searchProducts("Recommend a laptop for programming under ₹50,000", 4);
    const catalogSearchMs = performance.now() - searchStart;
    const contextStart = performance.now();
    const context = productContextService.formatProductsForContext(measuredProducts);
    const prompt = promptTemplates.buildShoppingChatMessages("Recommend a laptop for programming under ₹50,000", context, []);
    const contextPreparationMs = performance.now() - contextStart;
    const providerStart = performance.now();
    await delay(80);
    const providerGenerationMs = performance.now() - providerStart;
    const totalApiMs = performance.now() - benchmarkStart;
    queryDelayMs = 0;
    assert.deepEqual(measuredProducts.map((product) => product.name), ["ZenBook 14"]);
    assert.equal(productQueryCount, 1);
    assert.equal(categoryQueryCount, 1);

    console.log("PASS: intent/category accuracy, no-match, accessory intent, budget, stock/active variants, compact context, validated follow-up IDs, ordinal/pronoun references, ambiguity, current-catalog revalidation, API response shape, and mocked Ollama-to-Gemini fallback checks.");
    console.log(JSON.stringify({
        stage: "after",
        catalogSearchMs: Number(catalogSearchMs.toFixed(1)),
        catalogQueries: productQueryCount,
        categoryQueries: categoryQueryCount,
        contextPreparationMs: Number(contextPreparationMs.toFixed(1)),
        providerGenerationMs: Number(providerGenerationMs.toFixed(1)),
        totalApiMs: Number(totalApiMs.toFixed(1)),
        productNames: measuredProducts.map((product) => product.name),
        promptCharacters: prompt.reduce((sum, item) => sum + item.content.length, 0)
    }));
}

run().catch(() => {
    queryDelayMs = 0;
    console.error("FAIL: AI recommendation pipeline checks failed; details omitted.");
    process.exitCode = 1;
});
