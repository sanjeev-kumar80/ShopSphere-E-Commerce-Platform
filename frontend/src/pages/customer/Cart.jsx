import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../../context/StoreContext";
import {
  CartIcon,
  TrashIcon,
  ChevronRightIcon,
  TruckIcon,
  ShieldCheckIcon,
} from "../../components/Icons";

export default function Cart() {
  const { cart, cartLoading, updateCartItem, removeFromCart } = useStore();
  const navigate = useNavigate();

  const [updatingId, setUpdatingId] = useState("");

  const handleUpdateQty = async (itemId, qty) => {
    if (qty < 1) return;
    setUpdatingId(itemId);
    await updateCartItem(itemId, qty);
    setUpdatingId("");
  };

  const handleRemove = async (itemId) => {
    setUpdatingId(itemId);
    await removeFromCart(itemId);
    setUpdatingId("");
  };

  const items = cart?.items || [];
  const subtotal = cart?.total || 0;
  const isFreeDelivery = subtotal >= 499;
  const shippingFee = subtotal > 0 ? (isFreeDelivery ? 0 : 50) : 0;
  const orderTotal = subtotal + shippingFee;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-indigo-600 transition">
          Home
        </Link>
        <ChevronRightIcon className="w-3 h-3 text-slate-300" />
        <Link to="/shop" className="hover:text-indigo-600 transition">
          Shop
        </Link>
        <ChevronRightIcon className="w-3 h-3 text-slate-300" />
        <span className="font-semibold text-slate-800">Shopping Cart</span>
      </nav>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
            Shopping Cart
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {items.length === 0
              ? "Your cart is currently empty"
              : `You have ${items.length} unique item${
                  items.length > 1 ? "s" : ""
                } ready for checkout`}
          </p>
        </div>

        <Link
          to="/shop"
          className="text-xs font-bold text-indigo-600 hover:underline"
        >
          ← Continue Shopping
        </Link>
      </div>

      {cartLoading && items.length === 0 ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        /* Empty Cart State */
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm max-w-2xl mx-auto">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600">
            <CartIcon className="w-10 h-10" />
          </div>
          <h2 className="mt-5 text-xl font-black text-slate-900">
            Your cart feels lonely!
          </h2>
          <p className="mt-2 text-xs text-slate-500 max-w-sm mx-auto">
            Discover thousands of top quality products across fashion, electronics, and lifestyle, and add them to your cart.
          </p>
          <div className="mt-6">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700"
            >
              Explore Products Now
            </Link>
          </div>
        </div>
      ) : (
        /* Main Cart Layout */
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Left: Cart Items List (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Free shipping progress alert */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-xs font-semibold text-indigo-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TruckIcon className="w-5 h-5 text-indigo-600" />
                {isFreeDelivery ? (
                  <span>
                    🎉 <strong>Congratulations!</strong> You qualify for Free Express Shipping.
                  </span>
                ) : (
                  <span>
                    Add <strong>₹{499 - subtotal}</strong> more to unlock <strong>Free Express Shipping</strong>!
                  </span>
                )}
              </span>
            </div>

            <div className="divide-y divide-slate-100 rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
              {items.map((item) => {
                const product =
                  item.product && typeof item.product === "object"
                    ? item.product
                    : null;

                const variant = product?.variants?.find(
                  (v) => String(v._id) === String(item.variantId)
                );

                const image =
                  variant?.images?.[0]?.url ||
                  product?.images?.[0]?.url ||
                  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80";

                const isUpdating = updatingId === item._id;

                const attrs =
                  variant?.attributes && typeof variant.attributes === "object"
                    ? Object.entries(variant.attributes)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(", ")
                    : variant?.sku;

                return (
                  <div
                    key={item._id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 hover:bg-slate-50/60 transition"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                        <img
                          src={image}
                          alt={product?.name || "Product"}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>

                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {product?.category?.name || "Product"}
                        </span>
                        <h3 className="line-clamp-1 font-bold text-sm text-slate-900 hover:text-indigo-600 transition">
                          {product?._id ? (
                            <Link to={`/products/${product._id}`}>
                              {product.name}
                            </Link>
                          ) : (
                            item.productName || "Product"
                          )}
                        </h3>
                        {attrs && (
                          <p className="mt-0.5 text-xs text-slate-500">
                            Option: <strong className="text-slate-700">{attrs}</strong>
                          </p>
                        )}
                        <p className="mt-1 font-bold text-xs text-slate-800">
                          ₹{item.price?.toLocaleString("en-IN")} each
                        </p>
                      </div>
                    </div>

                    <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                      {/* Quantity selector */}
                      <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-xs">
                        <button
                          type="button"
                          disabled={item.quantity <= 1 || isUpdating}
                          onClick={() =>
                            handleUpdateQty(item._id, item.quantity - 1)
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            handleUpdateQty(item._id, item.quantity + 1)
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                        >
                          +
                        </button>
                      </div>

                      {/* Line Item Total */}
                      <div className="text-right min-w-[80px]">
                        <p className="font-black text-sm text-slate-900">
                          ₹{((item.price || 0) * item.quantity).toLocaleString("en-IN")}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleRemove(item._id)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="Remove item"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Order Summary Box (4 cols) */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
              <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                Order Summary
              </h2>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-slate-900">
                    ₹{subtotal.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Estimated Delivery</span>
                  <span className="font-bold">
                    {shippingFee === 0 ? (
                      <strong className="text-emerald-600">FREE</strong>
                    ) : (
                      `₹${shippingFee}`
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Taxes (GST)</span>
                  <span className="text-slate-500">Included in price</span>
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-between text-sm font-black text-slate-900">
                  <span>Estimated Total</span>
                  <span className="text-base text-indigo-600">
                    ₹{orderTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                type="button"
                onClick={() => navigate("/checkout")}
                className="w-full rounded-2xl bg-indigo-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Proceed to Checkout</span>
                <span>→</span>
              </button>

              <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500 space-y-1.5">
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
                  <span>Razorpay 256-bit Secure Encryption</span>
                </div>
                <div className="flex items-center gap-2">
                  <TruckIcon className="w-4 h-4 text-indigo-600" />
                  <span>Standard Delivery: 3–5 Business Days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}