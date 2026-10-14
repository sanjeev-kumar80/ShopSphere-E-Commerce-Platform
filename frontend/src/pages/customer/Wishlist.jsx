import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useStore } from "../../context/StoreContext";
import {
  HeartIcon,
  CartIcon,
  TrashIcon,
  StarIcon,
  ChevronRightIcon,
  SparklesIcon,
} from "../../components/Icons";

export default function Wishlist() {
  const { user } = useAuth();
  const {
    wishlist,
    wishlistLoading,
    removeFromWishlist,
    moveToCart,
    addToCart,
    showToast,
  } = useStore();

  const [selectedVariants, setSelectedVariants] = useState({});
  const [movingId, setMovingId] = useState("");

  const handleVariantChange = (productId, variantId) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: variantId,
    }));
  };

  const handleMoveToCart = async (product) => {
    const activeVars = (product.variants || []).filter((v) => v.isActive);
    const chosenVariantId =
      selectedVariants[product._id] ||
      activeVars.find((v) => v.stock > 0)?._id ||
      activeVars[0]?._id;

    if (!chosenVariantId) {
      showToast("No active variant available for this product", "error");
      return;
    }

    setMovingId(product._id);
    await moveToCart(product, chosenVariantId);
    setMovingId("");
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 sm:p-14 shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <HeartIcon className="w-8 h-8" />
          </div>
          <h2 className="mt-4 text-2xl font-black text-slate-900">
            Sign in to view your wishlist
          </h2>
          <p className="mt-2 text-xs text-slate-500 max-w-sm mx-auto">
            Save items you love across all your devices and keep track of price drops and availability.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/login"
              className="rounded-xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700"
            >
              Sign In to Your Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-indigo-600 transition">
          Home
        </Link>
        <ChevronRightIcon className="w-3 h-3 text-slate-300" />
        <span className="font-semibold text-slate-800">My Wishlist</span>
      </nav>

      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
              My Wishlist
            </h1>
            <span className="rounded-full bg-red-50 border border-red-200 px-3 py-0.5 text-xs font-bold text-red-600">
              {wishlist.length} item{wishlist.length !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Products you have bookmarked for later. Move them to your cart anytime!
          </p>
        </div>

        {wishlist.length > 0 && (
          <Link
            to="/shop"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Continue Shopping
          </Link>
        )}
      </div>

      {wishlistLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse space-y-4"
            >
              <div className="aspect-square rounded-xl bg-slate-200" />
              <div className="h-4 w-1/3 rounded bg-slate-200" />
              <div className="h-5 w-3/4 rounded bg-slate-200" />
              <div className="h-10 w-full rounded-xl bg-slate-200" />
            </div>
          ))}
        </div>
      ) : wishlist.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-red-500">
            <HeartIcon className="w-10 h-10" />
          </div>
          <h2 className="mt-5 text-xl font-black text-slate-900">
            Your wishlist is empty
          </h2>
          <p className="mt-2 text-xs text-slate-500 max-w-sm mx-auto">
            Explore our curated catalog and tap the heart icon on any product card to save your favorite things here!
          </p>
          <div className="mt-6">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700"
            >
              <SparklesIcon className="w-4 h-4 text-amber-300" />
              <span>Explore ShopSphere Catalog</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Wishlist Items Grid */
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {wishlist.map((item) => {
            const product = typeof item === "object" ? item : null;
            if (!product) return null;

            const activeVars = (product.variants || []).filter((v) => v.isActive);
            const currentVariantId =
              selectedVariants[product._id] ||
              activeVars.find((v) => v.stock > 0)?._id ||
              activeVars[0]?._id;

            const currentVariant =
              activeVars.find((v) => String(v._id) === String(currentVariantId)) ||
              activeVars[0];

            const stock = currentVariant?.stock ?? 0;
            const isOutOfStock = stock <= 0;
            const price = currentVariant?.price ?? 0;
            const comparePrice = currentVariant?.compareAtPrice;

            const img =
              currentVariant?.images?.[0]?.url ||
              product.images?.[0]?.url ||
              "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80";

            return (
              <article
                key={product._id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition hover:shadow-xl hover:-translate-y-1"
              >
                {/* Image + Quick Remove */}
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-100">
                  <Link to={`/products/${product._id}`} className="block h-full w-full">
                    <img
                      src={img}
                      alt={product.name}
                      className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-105"
                    />
                  </Link>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeFromWishlist(product._id)}
                    aria-label="Remove item from wishlist"
                    className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-slate-500 shadow-md transition hover:bg-red-50 hover:text-red-600 active:scale-90"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>

                  {/* Stock tag */}
                  {isOutOfStock && (
                    <div className="absolute inset-x-0 bottom-0 bg-slate-900/80 py-1 text-center text-[10px] font-bold text-white">
                      Out of Stock
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between pt-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {product.brand?.name || product.category?.name || "ShopSphere"}
                    </span>

                    <h3 className="mt-1 line-clamp-2 text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition">
                      <Link to={`/products/${product._id}`}>{product.name}</Link>
                    </h3>

                    {/* Variant picker if multiple */}
                    {activeVars.length > 1 && (
                      <div className="mt-2">
                        <select
                          value={currentVariantId}
                          onChange={(e) =>
                            handleVariantChange(product._id, e.target.value)
                          }
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-700"
                        >
                          {activeVars.map((v) => {
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

                  {/* Pricing & Move to Cart */}
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-extrabold text-slate-900">
                        ₹{price.toLocaleString("en-IN")}
                      </span>
                      {comparePrice && comparePrice > price && (
                        <span className="text-xs text-slate-400 line-through">
                          ₹{comparePrice.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleMoveToCart(product)}
                      disabled={isOutOfStock || movingId === product._id}
                      className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2 px-3 text-xs font-bold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                      {movingId === product._id ? (
                        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <>
                          <CartIcon className="w-3.5 h-3.5" />
                          <span>Move to Cart</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
