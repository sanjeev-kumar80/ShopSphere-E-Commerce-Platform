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
const products = [
    {
        _id: "laptop-available",
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
        _id: "charger",
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
        _id: "laptop-bag",
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
        _id: "inactive-laptop",
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
        _id: "unavailable-laptop",
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
const chatGateway = {
    config: { gateway: { maxOutputTokens: 192 } },
    async generateChat() {
        aiCalls += 1;
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

    resetQueryCounts();
    const accessories = await productContextService.searchProducts("Show me laptop accessories", 4);
    assert.deepEqual(accessories.map((product) => product.name).sort(), ["Everyday Laptop Sleeve Bag", "Fast Charging 65W GaN Charger"].sort());

    resetQueryCounts();
    const budgetLaptops = await productContextService.searchProducts("Laptop under ₹50,000", 4);
    assert.deepEqual(budgetLaptops.map((product) => product.name), ["ZenBook 14"]);
    assert.deepEqual(budgetLaptops[0].variants.map((variant) => variant.sku), ["ZEN-48"]);

    const savedProducts = products.splice(0, products.length, ...products.filter((product) => product._id !== "laptop-available"));
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
    const unavailableOnly = products.filter((product) => product._id === "unavailable-laptop");
    products.splice(0, products.length, ...unavailableOnly);
    resetQueryCounts();
    assert.deepEqual(await productContextService.searchProducts("laptop", 4), []);
    products.splice(0, products.length, ...savedProducts);

    const history = Array.from({ length: 20 }, (_, index) => ({ role: "user", content: `turn-${index}` }));
    const promptTemplates = require("../src/ai/prompts/promptTemplates");
    const messages = promptTemplates.buildShoppingChatMessages("current request", "", history);
    assert.equal(messages.length, 12);
    assert.equal(messages[1].content, "turn-10");
    assert.equal(messages.at(-2).content, "turn-19");

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

    console.log("PASS: laptop-only, no-match, accessory intent, budget, stock/active variants, history compaction, and mocked Ollama-to-Gemini fallback checks.");
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
