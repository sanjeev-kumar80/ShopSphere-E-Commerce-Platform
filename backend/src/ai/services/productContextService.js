const Product = require("../../models/Product");
const Category = require("../../models/Category");
const Brand = require("../../models/Brand");

/**
 * Product Context Service
 * Reuses existing Product, Category, and Brand models to ground the AI assistant
 * in real-time catalog data, stock availability, and accurate variant pricing.
 */
class ProductContextService {
    /**
     * Find active products matching a search query or conversational keywords.
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
            const populateOptions = [
                { path: "category", select: "name slug" },
                { path: "brand", select: "name" }
            ];
            const selectFields = "name slug description shortDescription variants rating reviewCount isFeatured category brand tags images";

            // 1. Try exact phrase match first (for specific model or brand queries)
            const regex = new RegExp(cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

            let products = await Product.find({
                isActive: true,
                $or: [
                    { name: regex },
                    { tags: regex },
                    { shortDescription: regex },
                    { description: regex }
                ]
            })
                .populate(populateOptions)
                .select(selectFields)
                .limit(limit)
                .lean();

            if (products.length >= limit) {
                return products;
            }

            // 2. Extract salient keywords for conversational queries (e.g. "Can you recommend a smartphone with good camera")
            const stopwords = new Set([
                "can", "you", "recommend", "me", "a", "an", "the", "with", "good",
                "best", "for", "and", "or", "in", "of", "to", "do", "have", "any",
                "what", "which", "show", "tell", "about", "some", "i", "need",
                "want", "looking", "please", "store", "product", "products", "item", "items"
            ]);

            const tokens = cleanQuery
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, " ")
                .split(/\s+/)
                .filter((w) => !stopwords.has(w) && w.length >= 3);

            if (tokens.length > 0) {
                const keywordClauses = [];
                for (const token of tokens) {
                    const tokenRegex = new RegExp(token, "i");
                    keywordClauses.push(
                        { name: tokenRegex },
                        { tags: tokenRegex },
                        { shortDescription: tokenRegex },
                        { description: tokenRegex }
                    );
                }

                const existingIds = products.map((p) => p._id);
                const remainingLimit = limit - products.length;

                const tokenMatches = await Product.find({
                    isActive: true,
                    _id: { $nin: existingIds },
                    $or: keywordClauses
                })
                    .populate(populateOptions)
                    .select(selectFields)
                    .limit(remainingLimit)
                    .lean();

                products = products.concat(tokenMatches);
            }

            return products;
        } catch (error) {
            console.error("ProductContextService.searchProducts error:", error.message);
            return [];
        }
    }

    /**
     * Retrieve featured and top-rated products for general recommendations.
     * @param {number} [limit=5]
     */
    async getFeaturedProducts(limit = 5) {
        try {
            return await Product.find({ isActive: true, isFeatured: true })
                .populate("category", "name")
                .populate("brand", "name")
                .select("name slug shortDescription variants rating reviewCount category brand")
                .limit(limit)
                .lean();
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
        if (!products || products.length === 0) {
            return "No matching products found in catalog.";
        }

        return products
            .map((p, index) => {
                // Ground pricing and stock strictly on active variants
                const activeVariants = (p.variants || []).filter((v) => v.isActive !== false);

                let priceStr = "N/A";
                let stockStr = "Out of Stock";
                let attributesList = [];

                if (activeVariants.length > 0) {
                    const prices = activeVariants.map((v) => v.price).filter((pr) => typeof pr === "number");
                    if (prices.length > 0) {
                        const minPrice = Math.min(...prices);
                        const maxPrice = Math.max(...prices);
                        priceStr = minPrice === maxPrice ? `$${minPrice}` : `$${minPrice} - $${maxPrice}`;
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
