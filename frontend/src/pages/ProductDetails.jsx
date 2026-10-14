import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useStore } from "../context/StoreContext";
import ProductCard from "../components/ProductCard";
import {
  HeartIcon,
  StarIcon,
  CartIcon,
  TruckIcon,
  ShieldCheckIcon,
  RotateCcwIcon,
  CheckIcon,
  ChevronRightIcon,
} from "../components/Icons";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, isInWishlist, toggleWishlist, showToast } = useStore();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [activeTab, setActiveTab] = useState("description");

  // Image zoom state
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imageContainerRef = useRef(null);

  // Related products state
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  // Fetch product data
  useEffect(() => {
    let cancelled = false;

    const fetchProduct = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/products/${id}`);
        const prod = res.data.data?.product;
        if (!cancelled && prod) {
          setProduct(prod);

          // Select first available variant with stock, or fallback to first
          const activeVars = (prod.variants || []).filter((v) => v.isActive);
          const firstInStock = activeVars.find((v) => v.stock > 0);
          setSelectedVariantId(firstInStock?._id || activeVars[0]?._id || "");
          setQuantity(1);
          setActiveImageIndex(0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message || "Failed to load product details."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo({ top: 0, behavior: "smooth" });

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Fetch related products when product category is available
  useEffect(() => {
    if (!product?.category?._id) return;
    let cancelled = false;

    const fetchRelated = async () => {
      setRelatedLoading(true);
      try {
        const res = await api.get("/products", {
          params: {
            category: product.category._id,
            limit: 5,
          },
        });
        const list = res.data.data?.products || [];
        if (!cancelled) {
          // Filter out current product
          setRelatedProducts(list.filter((p) => p._id !== product._id).slice(0, 4));
        }
      } catch (err) {
        console.warn("Failed to load related products:", err.message);
      } finally {
        if (!cancelled) setRelatedLoading(false);
      }
    };

    fetchRelated();
    return () => {
      cancelled = true;
    };
  }, [product]);

  // Active variants
  const activeVariants = useMemo(() => {
    return (product?.variants || []).filter((v) => v.isActive);
  }, [product]);

  const selectedVariant = useMemo(() => {
    return (
      activeVariants.find((v) => String(v._id) === String(selectedVariantId)) ||
      activeVariants[0]
    );
  }, [activeVariants, selectedVariantId]);

  // Collect all gallery images: variant images + product images
  const allImages = useMemo(() => {
    const list = [];
    if (selectedVariant?.images && selectedVariant.images.length > 0) {
      selectedVariant.images.forEach((img) => list.push(img.url));
    }
    if (product?.images && product.images.length > 0) {
      product.images.forEach((img) => {
        if (!list.includes(img.url)) list.push(img.url);
      });
    }
    if (list.length === 0) {
      list.push(
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80"
      );
    }
    return list;
  }, [product, selectedVariant]);

  const currentImage = allImages[activeImageIndex] || allImages[0];

  const inWishlist = isInWishlist(product?._id);
  const stock = selectedVariant?.stock ?? 0;
  const isOutOfStock = stock <= 0;
  const price = selectedVariant?.price ?? 0;
  const compareAtPrice = selectedVariant?.compareAtPrice;

  const discountPercent =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : null;

  // Zoom mouse handlers
  const handleMouseMove = (e) => {
    if (!imageContainerRef.current) return;
    const { left, top, width, height } =
      imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const handleAddToCart = async () => {
    if (isOutOfStock || !selectedVariant) return;
    setAddingToCart(true);
    await addToCart(product, selectedVariant._id, quantity);
    setAddingToCart(false);
  };

  const handleBuyNow = async () => {
    if (isOutOfStock || !selectedVariant) return;
    setAddingToCart(true);
    const added = await addToCart(product, selectedVariant._id, quantity, true);
    setAddingToCart(false);
    if (added) {
      navigate("/checkout");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-3xl bg-slate-200" />
          <div className="space-y-4">
            <div className="h-6 w-1/4 animate-pulse rounded-md bg-slate-200" />
            <div className="h-10 w-3/4 animate-pulse rounded-md bg-slate-200" />
            <div className="h-6 w-1/2 animate-pulse rounded-md bg-slate-200" />
            <div className="h-24 w-full animate-pulse rounded-xl bg-slate-200" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="rounded-3xl border border-slate-200 bg-white p-12 shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 text-2xl font-bold">
            !
          </div>
          <h2 className="mt-4 text-2xl font-bold text-slate-900">
            {error || "Product Not Found"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            The item you are looking for might have been removed or is temporarily unavailable.
          </p>
          <div className="mt-6">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700"
            >
              Browse ShopSphere Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-indigo-600 transition">
          Home
        </Link>
        <ChevronRightIcon className="w-3 h-3 text-slate-300" />
        <Link to="/shop" className="hover:text-indigo-600 transition">
          Shop
        </Link>
        {product.category && (
          <>
            <ChevronRightIcon className="w-3 h-3 text-slate-300" />
            <Link
              to={`/shop?category=${product.category._id}`}
              className="hover:text-indigo-600 transition"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRightIcon className="w-3 h-3 text-slate-300" />
        <span className="truncate max-w-[200px] sm:max-w-xs font-semibold text-slate-800">
          {product.name}
        </span>
      </nav>

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
        {/* Left Column: Interactive Multi-Image Gallery with Zoom (5 cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-4">
            {/* Main Stage Image with Zoom */}
            <div
              ref={imageContainerRef}
              onMouseEnter={() => setIsZooming(true)}
              onMouseLeave={() => setIsZooming(false)}
              onMouseMove={handleMouseMove}
              className="relative aspect-square w-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm cursor-crosshair"
            >
              <img
                src={currentImage}
                alt={product.name}
                className={`h-full w-full object-cover object-center transition-transform duration-200 ${
                  isZooming ? "scale-150" : "scale-100"
                }`}
                style={
                  isZooming
                    ? {
                        transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                      }
                    : undefined
                }
              />

              {/* Floating Badges */}
              <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-2">
                {discountPercent && (
                  <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-extrabold text-white shadow-md">
                    {discountPercent}% OFF
                  </span>
                )}
                {product.isFeatured && (
                  <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-extrabold text-white shadow-md">
                    Featured Pick
                  </span>
                )}
              </div>

              {/* Wishlist Heart Toggle */}
              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                aria-label="Wishlist toggle"
                className={`absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/95 shadow-md backdrop-blur-md transition-all active:scale-90 ${
                  inWishlist
                    ? "text-red-500 hover:bg-red-50"
                    : "text-slate-600 hover:text-red-500 hover:bg-white"
                }`}
              >
                <HeartIcon className="w-5 h-5" filled={inWishlist} />
              </button>

              {/* Hover zoom hint */}
              {!isZooming && (
                <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-slate-900/60 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-xs">
                  🔍 Hover to Zoom
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                {allImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition-all ${
                      activeImageIndex === idx
                        ? "border-indigo-600 ring-2 ring-indigo-600/20 shadow-md scale-95"
                        : "border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      className="h-full w-full object-cover object-center"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Information, Variant Picker, Actions (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Header tags: Brand & Category */}
            <div className="flex flex-wrap items-center gap-3">
              {product.brand?.name && (
                <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
                  {product.brand.name}
                </span>
              )}
              {product.category?.name && (
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {product.category.name}
                </span>
              )}
              <span className="text-xs text-slate-400">
                SKU: <strong className="text-slate-600">{selectedVariant?.sku || "N/A"}</strong>
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl leading-snug">
              {product.name}
            </h1>

            {/* Star Rating & Reviews */}
            <div className="flex items-center gap-3">
              <div className="flex items-center text-amber-500">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    className="w-4 h-4"
                    filled={star <= Math.round(product.rating || 5)}
                  />
                ))}
                <span className="ml-2 font-bold text-slate-800 text-sm">
                  {product.rating > 0 ? product.rating.toFixed(1) : "4.8"}
                </span>
              </div>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-medium text-indigo-600 hover:underline cursor-pointer">
                {product.reviewCount || 42} Customer Reviews
              </span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                <CheckIcon className="w-3.5 h-3.5" /> Verified Purchase
              </span>
            </div>

            {/* Price Box */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-slate-900">
                  ₹{price.toLocaleString("en-IN")}
                </span>
                {compareAtPrice && compareAtPrice > price && (
                  <span className="text-lg text-slate-400 line-through">
                    ₹{compareAtPrice.toLocaleString("en-IN")}
                  </span>
                )}
                {discountPercent && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                    Save {discountPercent}%
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Inclusive of all taxes. Free shipping on orders over ₹499.
              </p>
            </div>

            {/* Short Description */}
            {product.shortDescription && (
              <p className="text-sm leading-relaxed text-slate-600">
                {product.shortDescription}
              </p>
            )}

            {/* Variant Picker (Size, Color, RAM, Storage, etc.) */}
            {activeVariants.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Select Option / Variant:
                  </label>
                  <span className="text-xs text-indigo-600 font-semibold">
                    {activeVariants.length} option{activeVariants.length > 1 ? "s" : ""} available
                  </span>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {activeVariants.map((variant) => {
                    const isSelected = String(variant._id) === String(selectedVariantId);
                    const isVarOutOfStock = variant.stock <= 0;

                    const label =
                      variant.attributes && typeof variant.attributes === "object"
                        ? Object.entries(variant.attributes)
                            .map(([key, val]) => `${key}: ${val}`)
                            .join(" | ")
                        : variant.sku;

                    return (
                      <button
                        key={variant._id}
                        type="button"
                        onClick={() => {
                          setSelectedVariantId(variant._id);
                          setQuantity(1);
                        }}
                        disabled={isVarOutOfStock}
                        className={`group relative flex flex-col items-start rounded-2xl border px-4 py-2.5 text-left text-xs transition-all ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/30 text-indigo-900 font-bold shadow-sm"
                            : isVarOutOfStock
                            ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60 line-through"
                            : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                        }`}
                      >
                        <span className="font-semibold">{label}</span>
                        <span className="mt-0.5 text-[11px] font-bold text-slate-900">
                          ₹{variant.price.toLocaleString("en-IN")}
                        </span>
                        {isVarOutOfStock && (
                          <span className="text-[10px] text-red-500 font-medium no-underline">
                            Sold Out
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Live Stock Indicator */}
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-slate-500">Availability:</span>
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 font-bold text-rose-700 border border-rose-200">
                  <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
                  Out of Stock
                </span>
              ) : stock <= 3 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 font-bold text-amber-700 border border-amber-200">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Only {stock} left in stock — order soon!
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-bold text-emerald-700 border border-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  In Stock & Ready to Ship
                </span>
              )}
            </div>

            {/* Quantity Selector + Add to Cart + Buy Now Actions */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-4">
                {/* Quantity Controls */}
                <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition"
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-slate-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                    disabled={quantity >= stock || isOutOfStock}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition"
                  >
                    +
                  </button>
                </div>

                {/* Add to Cart button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || addingToCart}
                  className="flex flex-1 min-w-[160px] items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition-all duration-200 hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                >
                  {addingToCart ? (
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <CartIcon className="w-5 h-5" />
                      <span>{isOutOfStock ? "Out of Stock" : "Add to Cart"}</span>
                    </>
                  )}
                </button>

                {/* Buy Now button */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock || addingToCart}
                  className="flex flex-1 min-w-[160px] items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition-all duration-200 hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                >
                  ⚡ Buy Now
                </button>
              </div>
            </div>

            {/* Trust Badges Bar */}
            <div className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 text-center text-xs">
              <div className="flex flex-col items-center gap-1">
                <TruckIcon className="w-5 h-5 text-indigo-600" />
                <span className="font-bold text-slate-800">Fast Shipping</span>
                <span className="text-[10px] text-slate-500">Dispatched in 24h</span>
              </div>
              <div className="flex flex-col items-center gap-1 border-x border-slate-200">
                <RotateCcwIcon className="w-5 h-5 text-amber-600" />
                <span className="font-bold text-slate-800">7-Day Return</span>
                <span className="text-[10px] text-slate-500">100% Guaranteed</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheckIcon className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-slate-800">Authentic</span>
                <span className="text-[10px] text-slate-500">Direct from Brand</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section: Description, Specifications, Shipping */}
      <section className="mt-16 border-t border-slate-200 pt-10">
        <div className="border-b border-slate-200">
          <div className="flex gap-8 text-sm font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("description")}
              className={`pb-3 transition border-b-2 ${
                activeTab === "description"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Description
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("specifications")}
              className={`pb-3 transition border-b-2 ${
                activeTab === "specifications"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Specifications
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("shipping")}
              className={`pb-3 transition border-b-2 ${
                activeTab === "shipping"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Shipping & Returns
            </button>
          </div>
        </div>

        <div className="py-8">
          {activeTab === "description" && (
            <div className="prose max-w-none text-slate-700 leading-relaxed space-y-4">
              <p className="text-base font-medium">{product.description}</p>
              {product.tags && product.tags.length > 0 && (
                <div className="pt-4 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">Tags:</span>
                  {product.tags.map((t, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "specifications" && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-slate-50/50">
                    <td className="w-1/3 p-4 font-bold text-slate-900">Product Name</td>
                    <td className="p-4 text-slate-700">{product.name}</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-900">Brand</td>
                    <td className="p-4 text-slate-700">{product.brand?.name || "Generic"}</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-900">Category</td>
                    <td className="p-4 text-slate-700">{product.category?.name || "General"}</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-900">Active SKU</td>
                    <td className="p-4 text-slate-700">{selectedVariant?.sku || "N/A"}</td>
                  </tr>
                  {selectedVariant?.attributes &&
                    Object.entries(selectedVariant.attributes).map(([k, v]) => (
                      <tr key={k} className="bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-900 capitalize">{k}</td>
                        <td className="p-4 text-slate-700">{v}</td>
                      </tr>
                    ))}
                  <tr>
                    <td className="p-4 font-bold text-slate-900">Warranty</td>
                    <td className="p-4 text-slate-700">1 Year Brand Domestic Warranty</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "shipping" && (
            <div className="space-y-4 text-xs text-slate-600 max-w-2xl leading-relaxed">
              <h4 className="text-sm font-bold text-slate-900">Delivery Information</h4>
              <p>
                Standard delivery takes 3 to 5 business days across India. Express same-day or next-day delivery options are available in select metro areas.
              </p>
              <h4 className="text-sm font-bold text-slate-900 pt-2">Return & Replacement Policy</h4>
              <p>
                Products can be replaced or returned within 7 days of delivery in original condition with intact packaging. Contact customer support or navigate to your Orders page to initiate a replacement.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Related Products Grid */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 border-t border-slate-200 pt-10">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                You might also like
              </p>
              <h2 className="text-2xl font-black text-slate-900">Related Products</h2>
            </div>
            <Link
              to={`/shop?category=${product.category?._id}`}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              View More in {product.category?.name} →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((relProd) => (
              <ProductCard key={relProd._id} product={relProd} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
