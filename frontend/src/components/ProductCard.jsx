import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { HeartIcon, StarIcon, CartIcon } from "./Icons";

export default function ProductCard({ product }) {
  const { isInWishlist, toggleWishlist, addToCart } = useStore();

  const [adding, setAdding] = useState(false);

  // Filter active variants
  const activeVariants = (product?.variants || []).filter((v) => v.isActive);

  // Default to first variant with stock > 0, or fallback to first variant
  const [selectedVariantId, setSelectedVariantId] = useState(() => {
    const inStockVar = activeVariants.find((v) => v.stock > 0);
    return inStockVar?._id || activeVariants[0]?._id || "";
  });

  const selectedVariant =
    activeVariants.find((v) => String(v._id) === String(selectedVariantId)) ||
    activeVariants[0];

  const inWishlist = isInWishlist(product?._id);

  const price = selectedVariant?.price ?? 0;
  const compareAtPrice = selectedVariant?.compareAtPrice;
  const stock = selectedVariant?.stock ?? 0;
  const isOutOfStock = stock <= 0;

  // Calculate discount percentage
  const discountPercent =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : null;

  // Primary image
  const primaryImage =
    selectedVariant?.images?.[0]?.url ||
    product?.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80";

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || !selectedVariant) return;

    setAdding(true);
    await addToCart(product, selectedVariant._id, 1);
    setAdding(false);
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <article className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl">
      {/* Top Image + Badges */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-100">
        <Link to={`/products/${product._id}`} className="block h-full w-full">
          <img
            src={primaryImage}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {/* Discount Badge */}
        {discountPercent ? (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-bold tracking-tight text-white shadow-sm">
            {discountPercent}% OFF
          </span>
        ) : product.isFeatured ? (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-indigo-600 px-2 py-0.5 text-[11px] font-bold tracking-tight text-white shadow-sm">
            Featured
          </span>
        ) : null}

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-md transition-all duration-200 active:scale-90 ${
            inWishlist
              ? "text-red-500 hover:bg-red-50"
              : "text-slate-600 hover:text-red-500 hover:bg-white"
          }`}
        >
          <HeartIcon className="w-4 h-4" filled={inWishlist} />
        </button>

        {/* Out of Stock Overlay Ribbon */}
        {isOutOfStock && (
          <div className="absolute inset-x-0 bottom-0 bg-slate-900/80 py-1 text-center text-[11px] font-semibold text-white backdrop-blur-xs">
            Currently Out of Stock
          </div>
        )}
      </div>

      {/* Product Content Details */}
      <div className="flex flex-1 flex-col justify-between pt-3.5">
        <div>
          {/* Brand & Category row */}
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <span>{product.brand?.name || product.category?.name || "ShopSphere"}</span>
            {stock > 0 && stock <= 3 && (
              <span className="text-amber-600 font-bold">Only {stock} left!</span>
            )}
          </div>

          {/* Product Title */}
          <h3 className="mt-1 line-clamp-2 text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
            <Link to={`/products/${product._id}`}>{product.name}</Link>
          </h3>

          {/* Star Rating & Review count */}
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
            <div className="flex items-center text-amber-500">
              <StarIcon className="w-3.5 h-3.5 fill-current" />
              <span className="ml-1 font-bold text-slate-800 text-xs">
                {product.rating > 0 ? product.rating.toFixed(1) : "4.8"}
              </span>
            </div>
            <span>•</span>
            <span className="text-[11px] text-slate-400">
              ({product.reviewCount || 18})
            </span>
          </div>

          {/* Variant Selector (if more than 1 variant) */}
          {activeVariants.length > 1 && (
            <div className="mt-2.5">
              <label htmlFor={`var-select-${product._id}`} className="sr-only">
                Choose variant
              </label>
              <select
                id={`var-select-${product._id}`}
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2 py-1 text-xs text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white"
              >
                {activeVariants.map((v) => {
                  const attrs =
                    v.attributes && typeof v.attributes === "object"
                      ? Object.entries(v.attributes)
                          .map(([k, val]) => `${k}: ${val}`)
                          .join(", ")
                      : "";
                  return (
                    <option key={v._id} value={v._id} disabled={v.stock <= 0}>
                      {attrs || v.sku} — ₹{v.price} {v.stock <= 0 ? "(Out of stock)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        {/* Pricing & Add to Cart button */}
        <div className="mt-3.5 border-t border-slate-100 pt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-extrabold text-slate-900">
              ₹{price.toLocaleString("en-IN")}
            </span>
            {compareAtPrice && compareAtPrice > price && (
              <span className="text-xs text-slate-400 line-through">
                ₹{compareAtPrice.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={isOutOfStock || adding}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold transition-all duration-200 shadow-sm active:scale-95 ${
                isOutOfStock
                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20"
              }`}
            >
              {adding ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : isOutOfStock ? (
                <span>Out of Stock</span>
              ) : (
                <>
                  <CartIcon className="w-3.5 h-3.5" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>

            <Link
              to={`/products/${product._id}`}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition text-xs font-bold"
              title="View Product Details"
            >
              →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
