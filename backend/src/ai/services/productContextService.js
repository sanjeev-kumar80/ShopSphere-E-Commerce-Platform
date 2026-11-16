const mongoose = require("mongoose");
const Product = require("../../models/Product");
const { logSafeDiagnostic } = require("../utils/safeDiagnostics");
const Category = require("../../models/Category");
const Brand = require("../../models/Brand");

const LAPTOP_CATEGORY_NAMES = ["laptop", "laptops", "notebook", "notebooks"];
const LAPTOP_REGEX = /\b(?:laptops?|notebooks?)\b/i;
const ACCESSORY_CATEGORY_REGEX = /\baccessor(?:y|ies)\b/i;
const ACCESSORY_TYPES = [
    { name: "charger", regex: /\b(?:chargers?|power\s+adapters?|charging\s+adapters?|adapters?|adaptors?|power\s+bricks?)\b/i },
    { name: "bag", regex: /\b(?:bags?|backpacks?|sleeves?|cases?)\b/i },
    { name: "mouse", regex: /\b(?:mice|mouse)\b/i },
    { name: "keyboard", regex: /\bkeyboards?\b/i },
    { name: "stand", regex: /\b(?:stands?|risers?)\b/i },
    { name: "dock", regex: /\b(?:docks?|docking\s+stations?)\b/i },
    { name: "hub", regex: /\b(?:usb[- ]?c\s+)?hubs?\b/i },
    { name: "cooling", regex: /\b(?:cooling\s+pads?|laptop\s+coolers?)\b/i }
];
const ACCESSORY_REGEX = /\b(?:chargers?|power\s+adapters?|charging\s+adapters?|adapters?|adaptors?|power\s+bricks?|bags?|backpacks?|sleeves?|cases?|mice|mouse|keyboards?|stands?|risers?|docks?|docking\s+stations?|(?:usb[- ]?c\s+)?hubs?|cooling\s+pads?|laptop\s+coolers?|accessor(?:y|ies))\b/i;
const PRODUCT_SELECT_FIELDS = "name slug description shortDescription variants rating reviewCount isFeatured category brand tags images";
const MAX_CONTEXT_SUMMARY_CHARACTERS = 240;
const MAX_CONTEXT_ATTRIBUTE_CHARACTERS = 160;
const ORDINAL_REFERENCES = [
    { pattern: /\b(?:first|1st)\b/i, index: 0 },
    { pattern: /\b(?:second|2nd)\b/i, index: 1 },
    { pattern: /\b(?:third|3rd)\b/i, index: 2 }
];
const FOLLOW_UP_REFERENCE_REGEX = /\b(?:it|that|this one|that one|that laptop|that product|the product|those|them)\b/i;

const compactContextText = (value, maxCharacters) => {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (text.length <= maxCharacters) return text;

    const prefix = text.slice(0, maxCharacters - 1);
    const boundary = prefix.lastIndexOf(" ");
    const safePrefix = boundary >= maxCharacters * 0.75
        ? prefix.slice(0, boundary)
        : prefix;

    return `${safePrefix.trim()}…`;
};

/**
 * Product Context Service
 * Reuses existing Product, Category, and Brand models to ground the AI assistant
 * in real-time catalog data, stock availability, and accurate variant pricing.
 */
class ProductContextService {
    resolveFollowUpReferences(query, history = []) {
        const ordinalMatches = ORDINAL_REFERENCES
            .filter(({ pattern }) => pattern.test(query || ""))
            .map(({ index }) => index);
        const isFollowUp = ordinalMatches.length > 0 || FOLLOW_UP_REFERENCE_REGEX.test(query || "");
        if (!isFollowUp) return { isFollowUp: false, ambiguous: false, productIds: [] };

        const lastRecommendation = [...(Array.isArray(history) ? history : [])]
            .reverse()
            .find((item) => item?.role === "assistant" && Array.isArray(item.productIds));
        const productIds = [...new Set((lastRecommendation?.productIds || [])
            .filter((id) => typeof id === "string" && id.trim()))];

        if (ordinalMatches.length > 0) {
            const selectedIds = [...new Set(ordinalMatches.map((index) => productIds[index]).filter(Boolean))];
            return {
                isFollowUp: true,
                ambiguous: selectedIds.length !== ordinalMatches.length,
                productIds: selectedIds
            };
        }

        return {
            isFollowUp: true,
            ambiguous: productIds.length !== 1,
            productIds: productIds.length === 1 ? productIds : []
        };
    }

    getFollowUpConstraints(query, history = []) {
        const userMessages = (Array.isArray(history) ? history : [])
            .filter((item) => item?.role === "user" && typeof item.content === "string")
            .slice(-8)
            .reverse();
        const budget = this.extractBudget(query) ??
            userMessages.map((item) => this.extractBudget(item.content)).find((value) => value !== null) ?? null;
        const intent = this.getSpecificProductIntent(query) ||
            userMessages.map((item) => this.getSpecificProductIntent(item.content)).find(Boolean) || null;
        return { budget, intent };
    }

    async getProductsByIds(ids, limit = 4, { budget = null, intent = null } = {}) {
        if (!Array.isArray(ids) || ids.length === 0) return [];

        const validIds = [...new Set(ids
            .filter((id) => typeof id === "string" && mongoose.isObjectIdOrHexString(id.trim()))
            .map((id) => id.trim()))];
        if (validIds.length === 0) return [];

        const products = await Product.find({
            ...this._eligibleProductFilter(budget),
            _id: { $in: validIds }
        })
            .populate([
                { path: "category", select: "name slug" },
                { path: "brand", select: "name" }
            ])
            .select(PRODUCT_SELECT_FIELDS)
            .lean();

        const eligible = this._filterEligibleProducts(products, budget)
            .filter((product) => !intent || this._matchesSpecificIntent(product, intent));
        const productsById = new Map(eligible.map((product) => [String(product._id), product]));
        return validIds.map((id) => productsById.get(id)).filter(Boolean).slice(0, limit);
    }

    extractBudget(query) {
        if (!query || typeof query !== "string") return null;

        const match = query.match(
            /\b(?:under|below|less\s+than|up\s+to|maximum(?:\s+budget)?|max(?:imum)?(?:\s+budget)?|budget(?:\s+of)?|within|not\s+more\s+than)\b\s*(?:(?:is|of|:)\s*)?(?:₹|rs\.?|inr)?\s*(\d[\d,]*(?:\.\d+)?)\s*(?:(k|thousand|lakh|lac|l)\b)?/i
        );
        if (!match) return null;

        const amount = Number(match[1].replace(/,/g, ""));
        if (!Number.isFinite(amount) || amount < 0) return null;

        const unit = (match[2] || "").toLowerCase();
        const multiplier = ["lakh", "lac", "l"].includes(unit)
            ? 100000
            : ["k", "thousand"].includes(unit)
                ? 1000
                : 1;

        return amount * multiplier;
    }

    getSpecificProductIntent(query) {
        if (!query || typeof query !== "string") return null;

        const requestsLaptop = LAPTOP_REGEX.test(query);
        const requestedAccessoryTypes = ACCESSORY_TYPES.filter(({ regex }) => regex.test(query));
        const requestsAllAccessories = ACCESSORY_CATEGORY_REGEX.test(query);

        if (requestedAccessoryTypes.length > 0 || requestsAllAccessories) {
            return {
                kind: "accessory",
                label: requestsLaptop
                    ? "laptop accessories"
                    : requestedAccessoryTypes.length === 1
                        ? `${requestedAccessoryTypes[0].name} products`
                        : "accessories",
                requestedAccessoryTypes
            };
        }

        if (requestsLaptop) {
            return {
                kind: "laptop",
                label: "laptops",
                requestedAccessoryTypes: []
            };
        }

        return null;
    }

    _eligibleProductFilter(budget = null) {
        const priceFilter = { $type: "number", $gte: 0 };
        if (budget !== null) priceFilter.$lte = budget;

        return {
            isActive: true,
            variants: {
                $elemMatch: {
                    isActive: true,
                    stock: { $gt: 0 },
                    price: priceFilter
                }
            }
        };
    }

    _filterEligibleProducts(products, budget = null) {
        return (products || [])
            .map((product) => ({
                ...product,
                variants: (product.variants || []).filter((variant) =>
                    variant.isActive === true &&
                    Number.isFinite(variant.price) &&
                    variant.price >= 0 &&
                    Number.isFinite(variant.stock) &&
                    variant.stock > 0 &&
                    (budget === null || variant.price <= budget)
                )
            }))
            .filter((product) => product.variants.length > 0);
    }

    _isAccessoryProduct(product) {
        const categoryText = `${product.category?.name || ""} ${product.category?.slug || ""}`;
        const productText = `${product.name || ""} ${(product.tags || []).join(" ")} ${categoryText}`;
        return ACCESSORY_REGEX.test(productText);
    }

    _matchesSpecificIntent(product, intent) {
        const categoryName = product.category?.name || "";
        const categorySlug = product.category?.slug || "";
        const categoryText = `${categoryName} ${categorySlug}`;
        const productText = `${product.name || ""} ${(product.tags || []).join(" ")} ${categoryText}`;

        if (intent.kind === "laptop") {
            const categoryIsLaptop = LAPTOP_CATEGORY_NAMES.includes(categoryName.toLowerCase().trim()) ||
                LAPTOP_CATEGORY_NAMES.includes(categorySlug.toLowerCase().trim());
            return (LAPTOP_REGEX.test(productText) || categoryIsLaptop) && !this._isAccessoryProduct(product);
        }

        if (intent.kind === "accessory") {
            if (intent.requestedAccessoryTypes.length > 0) {
                return intent.requestedAccessoryTypes.some(({ regex }) => regex.test(productText));
            }
            return ACCESSORY_REGEX.test(productText) || ACCESSORY_CATEGORY_REGEX.test(categoryText);
        }

        return true;
    }

    /**
 * Find active products matching a search query or conversational keywords.
 * Specific laptop/accessory intents use strict type and category constraints;
 * general searches use one name/tag query, while broad requests use featured items.
     *
     * @param {string} query - Keyword, phrase, or customer question
     * @param {number} [limit=5]
     * @returns {Promise<Array<object>>}
     */
    async searchProducts(query, limit = 5) {
        if (!query || typeof query !== "string") {
            return [];
        }

        const cleanQuery = query.trim();
        if (!cleanQuery) return [];

        try {
            const budget = this.extractBudget(cleanQuery);
            const eligibleProductFilter = this._eligibleProductFilter(budget);
            const populateOptions = [
                { path: "category", select: "name slug" },
                { path: "brand", select: "name" }
            ];
            const intent = this.getSpecificProductIntent(cleanQuery);

            if (intent) {
                const categoryConditions = [
                    { name: ACCESSORY_CATEGORY_REGEX },
                    { slug: ACCESSORY_CATEGORY_REGEX }
                ];

                if (intent.kind === "laptop") {
                    categoryConditions.push(
                        { name: { $in: LAPTOP_CATEGORY_NAMES } },
                        { slug: { $in: LAPTOP_CATEGORY_NAMES } }
                    );
                } else {
                    for (const accessoryType of intent.requestedAccessoryTypes) {
                        categoryConditions.push(
                            { name: accessoryType.regex },
                            { slug: accessoryType.regex }
                        );
                    }
                }

                const categories = await Category.find({
                    isActive: true,
                    $or: categoryConditions
                }).select("name slug").lean();

                const laptopCategoryIds = categories
                    .filter((category) => LAPTOP_CATEGORY_NAMES.includes(
                        `${category.name || ""}`.toLowerCase().trim()
                    ) || LAPTOP_CATEGORY_NAMES.includes(
                        `${category.slug || ""}`.toLowerCase().trim()
                    ))
                    .map((category) => category._id);
                const accessoryCategoryIds = categories
                    .filter((category) => ACCESSORY_CATEGORY_REGEX.test(
                        `${category.name || ""} ${category.slug || ""}`
                    ))
                    .map((category) => category._id);
                const typedAccessoryCategoryIds = categories
                    .filter((category) => intent.requestedAccessoryTypes.some(({ regex }) =>
                        regex.test(`${category.name || ""} ${category.slug || ""}`)
                    ))
                    .map((category) => category._id);

                const requestedPatterns = intent.kind === "laptop"
                    ? [LAPTOP_REGEX]
                    : intent.requestedAccessoryTypes.length > 0
                        ? intent.requestedAccessoryTypes.map(({ regex }) => regex)
                        : [ACCESSORY_REGEX];
                const matchingCategoryIds = intent.kind === "laptop"
                    ? laptopCategoryIds
                    : intent.requestedAccessoryTypes.length > 0
                        ? typedAccessoryCategoryIds
                        : accessoryCategoryIds;
                const intentClauses = requestedPatterns.flatMap((pattern) => [
                    { name: pattern },
                    { tags: pattern }
                ]);

                if (matchingCategoryIds.length > 0) {
                    intentClauses.push({ category: { $in: matchingCategoryIds } });
                }

                const queryFilter = {
                    ...eligibleProductFilter,
                    $or: intentClauses
                };

                if (intent.kind === "laptop") {
                    queryFilter.$nor = [
                        { name: ACCESSORY_REGEX },
                        { tags: ACCESSORY_REGEX },
                        ...(accessoryCategoryIds.length > 0
                            ? [{ category: { $in: accessoryCategoryIds } }]
                            : [])
                    ];
                }

                const products = await Product.find(queryFilter)
                    .populate(populateOptions)
                    .select(PRODUCT_SELECT_FIELDS)
                    .sort({ rating: -1, reviewCount: -1 })
                    .limit(Math.max(limit * 2, limit))
                    .lean();

                return this._filterEligibleProducts(products, budget)
                    .filter((product) => this._matchesSpecificIntent(product, intent))
                    .slice(0, limit);
            }

            // Tokenize once and issue one product query; specific product intents use
            // the strict category/type path above and never search descriptions.
            const stopwords = new Set([
                "can", "you", "recommend", "me", "a", "an", "the", "with", "good",
                "best", "for", "and", "or", "in", "of", "to", "do", "have", "any",
                "what", "which", "show", "tell", "about", "some", "i", "need",
                "want", "looking", "please", "store", "product", "products", "item",
                "items", "suggest", "find", "get", "give", "are", "there", "that",
                "this", "these", "those", "how", "much", "rupees", "inr", "rs",
                "under", "below", "above", "over", "between", "price", "budget",
                "two", "compare", "comparison", "available", "current", "maximum",
                "max", "up", "less", "than", "within", "lakh", "lac", "thousand",
                "anything", "something"
            ]);

            const tokens = cleanQuery
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, " ")
                .split(/\s+/)
                .filter((w) => !stopwords.has(w) && w.length >= 3 && !/^\d+$/.test(w));

            if (tokens.length === 0) {
                if (budget === null) return this._getFeaturedFallback([], limit, budget);
            }

            const tokenClauses = tokens.flatMap((token) => {
                const tokenRegex = new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
                return [{ name: tokenRegex }, { tags: tokenRegex }];
            });
            const searchFilter = tokenClauses.length > 0
                ? { ...eligibleProductFilter, $or: tokenClauses }
                : eligibleProductFilter;

            const products = await Product.find(searchFilter)
                .populate(populateOptions)
                .select(PRODUCT_SELECT_FIELDS)
                .sort({ isFeatured: -1, rating: -1, reviewCount: -1 })
                .limit(limit)
                .lean();

            return this._filterEligibleProducts(products, budget);
        } catch (error) {
            logSafeDiagnostic("Product context search failed", error);
            throw error;
        }
    }

    /**
     * Return top-rated / featured products for context when no keyword match exists.
     * @private
     */
    async _getFeaturedFallback(existing, limit, budget = null) {
        try {
            const existingIds = existing.map((p) => p._id);
            const remaining = limit - existing.length;
            if (remaining <= 0) return existing;

            const featured = await Product.find({
                ...this._eligibleProductFilter(budget),
                _id: { $nin: existingIds },
                isFeatured: true
            })
                .populate([
                    { path: "category", select: "name slug" },
                    { path: "brand", select: "name" }
                ])
                .select("name slug description shortDescription variants rating reviewCount isFeatured category brand tags images")
                .sort({ rating: -1, reviewCount: -1 })
                .limit(remaining)
                .lean();

            return this._filterEligibleProducts(existing.concat(featured), budget);
        } catch (e) {
            return this._filterEligibleProducts(existing, budget);
        }
    }

    /**
     * Retrieve featured and top-rated products for general recommendations.
     * @param {number} [limit=5]
     */
    async getFeaturedProducts(limit = 5) {
        try {
            const products = await Product.find({
                ...this._eligibleProductFilter(),
                isFeatured: true
            })
                .populate("category", "name")
                .populate("brand", "name")
                .select("name slug shortDescription variants rating reviewCount category brand images")
                .sort({ rating: -1, reviewCount: -1 })
                .limit(limit)
                .lean();
            return this._filterEligibleProducts(products);
        } catch (error) {
            logSafeDiagnostic("Featured product lookup failed", error);
            return [];
        }
    }

    /**
     * Format product records into compact contextual string for prompt injection.
     * Accurately reflects only active variants, exact prices, stock, and attributes.
     * @param {Array<object>} products
     * @returns {string}
     */
    formatProductsForContext(products) {
        const eligibleProducts = this._filterEligibleProducts(products);
        if (eligibleProducts.length === 0) {
            return "No matching products found in catalog.";
        }

        return eligibleProducts
            .map((p, index) => {
                // Only active variants with actual stock and database prices reach the prompt.
                const activeVariants = p.variants;

                let priceStr = "N/A";
                let stockStr = "Out of Stock";
                let attributesList = [];

                if (activeVariants.length > 0) {
                    const prices = activeVariants.map((v) => v.price).filter((pr) => typeof pr === "number");
                    if (prices.length > 0) {
                        const minPrice = Math.min(...prices);
                        const maxPrice = Math.max(...prices);
                        priceStr = minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice} - ₹${maxPrice}`;
                    }

                    const totalStock = activeVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
                    stockStr = totalStock > 0 ? `In Stock (${totalStock} available)` : "Out of Stock";

                    // Collect sample variant attributes (e.g. Size, Color)
                    for (const v of activeVariants) {
                        if (v.attributes && typeof v.attributes === "object") {
                            const entries = v.attributes instanceof Map
                                ? Array.from(v.attributes.entries())
                                : Object.entries(v.attributes);
                            const attrText = compactContextText(
                                entries.map(([k, val]) => `${k}: ${val}`).join(", "),
                                MAX_CONTEXT_ATTRIBUTE_CHARACTERS
                            );
                            if (attrText && !attributesList.includes(attrText)) {
                                attributesList.push(attrText);
                            }
                        }
                    }
                }

                const summary = compactContextText(
                    p.shortDescription || p.description || "No description provided.",
                    MAX_CONTEXT_SUMMARY_CHARACTERS
                );
                const attrDisplay = attributesList.length > 0 ? `\n   - Available Options: ${attributesList.slice(0, 3).join("; ")}` : "";

                return `${index + 1}. [${p.name}]
   - Brand: ${p.brand?.name || "Generic"}
   - Category: ${p.category?.name || "General"}
   - Price: ${priceStr}
   - Availability: ${stockStr}
   - Rating: ${p.rating || 0}/5 (${p.reviewCount || 0} reviews)${attrDisplay}
   - Summary: ${summary}`;
            })
            .join("\n\n");
    }
}

module.exports = new ProductContextService();
