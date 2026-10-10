
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import CustomerNavbar from "../../components/CustomerNavbar";

export default function Cart() {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchCart = async () => {
    try {
      setError("");
      const response = await api.get("/cart");
      setCart(response.data.data || { items: [], total: 0 });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Cart load nahi hua. Customer account mein login karo."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQuantity = async (itemId, quantity) => {
    try {
      setError("");
      const response = await api.put(`/cart/items/${itemId}`, {
        quantity,
      });
      setCart(response.data.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Quantity update nahi hui."
      );
    }
  };

  const removeItem = async (itemId) => {
    try {
      setError("");
      const response = await api.delete(`/cart/items/${itemId}`);
      setCart(response.data.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Item remove nahi hua."
      );
    }
  };

  return (
    <>
      {/* Customer name and navigation */}
      <CustomerNavbar />

      {loading ? (
        <div className="min-h-screen bg-gray-50 p-8 text-center">
          Loading cart...
        </div>
      ) : (
        <main className="min-h-screen bg-gray-50 p-6 md:p-10">
          <div className="mx-auto max-w-4xl">
            <Link
              to="/shop"
              className="text-indigo-600 hover:underline"
            >
              ← Continue shopping
            </Link>

            <h1 className="my-6 text-3xl font-bold">Your Cart</h1>

            {error && (
              <p className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
                {error}
              </p>
            )}

            {cart.items.length === 0 ? (
              <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                <p className="text-lg">Your cart is empty.</p>

                <Link
                  to="/shop"
                  className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-3 text-white"
                >
                  Browse products
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {cart.items.map((item) => {
                    const product =
                      item.product &&
                      typeof item.product === "object"
                        ? item.product
                        : null;

                    const variant = product?.variants?.find(
                      (v) =>
                        String(v._id) === String(item.variantId)
                    );

                    const image = product?.images?.[0]?.url;

                    return (
                      <div
                        key={item._id}
                        className="flex flex-wrap items-center gap-4 rounded-xl bg-white p-4 shadow-sm"
                      >
                        {image ? (
                          <img
                            src={image}
                            alt={product?.name || "Product"}
                            className="h-24 w-24 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-400">
                            No image
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <h2 className="font-semibold">
                            {product?.name || "Product"}
                          </h2>

                          {variant?.name && (
                            <p className="text-sm text-gray-500">
                              Variant: {variant.name}
                            </p>
                          )}

                          <p className="mt-1 font-medium">
                            ₹{item.price}
                          </p>

                          <div className="mt-3 flex items-center gap-3">
                            <button
                              type="button"
                              disabled={item.quantity <= 1}
                              onClick={() =>
                                updateQuantity(
                                  item._id,
                                  item.quantity - 1
                                )
                              }
                              className="rounded border px-3 py-1 disabled:opacity-40"
                            >
                              −
                            </button>

                            <span>{item.quantity}</span>

                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item._id,
                                  item.quantity + 1
                                )
                              }
                              className="rounded border px-3 py-1"
                            >
                              +
                            </button>

                            <button
                              type="button"
                              onClick={() => removeItem(item._id)}
                              className="ml-2 text-sm text-red-600 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        <p className="font-bold">
                          ₹{item.price * item.quantity}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Subtotal</span>
                    <span>₹{cart.total ?? 0}</span>
                  </div>

                  <p className="mt-2 text-sm text-gray-500">
                    Shipping charges checkout par calculate honge.
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate("/checkout")}
                    disabled={!cart.items?.length}
                    className="mt-4 rounded-lg bg-blue-600 px-5 py-3 text-white disabled:bg-gray-400"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      )}
    </>
  );
}
