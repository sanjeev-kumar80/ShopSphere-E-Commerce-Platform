const Product = require("../../models/Product");
const Category = require("../../models/Category");
const Brand = require("../../models/Brand");

/**
 * Product Context Service
 * Reuses existing Product, Category, and Brand models to ground the AI assistant
 * in real-time catalog data, stock availability, and accurate variant pricing.
 */
class ProductContextService {
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

    /**
     * Find active products matching a search query or conversational keywords.
     * Uses a priority search strategy:
     *   1. Exact phrase match across name/tags/description
     *   2. Per-token AND match (all keywords must appear in one field — avoids false matches)
     *   3. Per-token OR match within name/tags only (category-level fallback)
     *   4. Featured products only for broad queries with no meaningful search terms
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
            const selectFields = "name slug description shortDescription variants rating reviewCount isFeatured category brand tags images";

            // ── Pass 1: Exact phrase match across all text fields ──────────────────
            const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const phraseRegex = new RegExp(escapeRegex(cleanQuery), "i");

            let products = await Product.find({
                ...eligibleProductFilter,
                $or: [
                    { name: phraseRegex },
                    { tags: phraseRegex },
                    { shortDescription: phraseRegex },
                    { description: phraseRegex }
                ]
            })
                .populate(populateOptions)
                .select(selectFields)
                .limit(limit)
                .lean();

            if (products.length >= limit) return this._filterEligibleProducts(products, budget);

            // ── Tokenize query ────────────────────────────────────────────────────
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
                if (budget !== null) {
                    const budgetMatches = await Product.find(eligibleProductFilter)
                        .populate(populateOptions)
                        .select(selectFields)
                        .sort({ isFeatured: -1, rating: -1, reviewCount: -1 })
                        .limit(limit - products.length)
                        .lean();
                    products = products.concat(budgetMatches);
                    return this._filterEligibleProducts(products, budget);
                }

                // Keep featured recommendations for broad queries only.
                return this._getFeaturedFallback(products, limit, budget);
            }

            const existingIds = () => products.map((p) => p._id);

            // ── Pass 2: AND match — all tokens must appear in name or tags ─────────
            // (Prevents "laptop for programming" matching a GaN charger description)
            if (tokens.length > 1) {
                const andClauses = tokens.map((token) => ({
                    $or: [
                        { name: new RegExp(token, "i") },
                        { tags: new RegExp(token, "i") },
                    ]
                }));

                const andMatches = await Product.find({
                    ...eligibleProductFilter,
                    _id: { $nin: existingIds() },
                    $and: andClauses
                })
                    .populate(populateOptions)
                    .select(selectFields)
                    .limit(limit - products.length)
                    .lean();

                products = products.concat(andMatches);
                if (products.length >= limit) return this._filterEligibleProducts(products, budget);
            }

            // ── Pass 3: OR match within name and tags only ────────────────────────
            // (Category-level: "smartphone" → Electronics products)
            const nameClauses = tokens.flatMap((token) => [
                { name: new RegExp(token, "i") },
                { tags: new RegExp(token, "i") },
            ]);

            const nameMatches = await Product.find({
                ...eligibleProductFilter,
                _id: { $nin: existingIds() },
                $or: nameClauses
            })
                .populate(populateOptions)
                .select(selectFields)
                .limit(limit - products.length)
                .lean();

            products = products.concat(nameMatches);
            if (products.length >= limit) return this._filterEligibleProducts(products, budget);

            // ── Pass 4: Description-level OR match (last resort for exact terms) ──
            const descClauses = tokens.flatMap((token) => [
                { shortDescription: new RegExp(token, "i") },
                { description: new RegExp(token, "i") },
            ]);

            const descMatches = await Product.find({
                ...eligibleProductFilter,
                _id: { $nin: existingIds() },
                $or: descClauses
            })
                .populate(populateOptions)
                .select(selectFields)
                .limit(limit - products.length)
                .lean();

            products = products.concat(descMatches);

            // A specific query with no catalog match must not be replaced by unrelated featured items.
            return this._filterEligibleProducts(products, budget);
        } catch (error) {
            console.error("ProductContextService.searchProducts error:", error.message);
            return [];
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
            console.error("ProductContextService.getFeaturedProducts error:", error.message);
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
                    stockStr = totalStock > 0 ? `In Stock (${totalStock} available across variants)` : "Out of Stock";

                    // Collect sample variant attributes (e.g. Size, Color)
                    for (const v of activeVariants) {
                        if (v.attributes && typeof v.attributes === "object") {
                            const entries = v.attributes instanceof Map
                                ? Array.from(v.attributes.entries())
                                : Object.entries(v.attributes);
                            const attrText = entries.map(([k, val]) => `${k}: ${val}`).join(", ");
                            if (attrText && !attributesList.includes(attrText)) {
                                attributesList.push(attrText);
                            }
                        }
                    }
                }

                const summary = p.shortDescription || p.description?.slice(0, 250) || "No description provided.";
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
