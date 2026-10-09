
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function Products() {
  const [products, setProducts] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [addingId, setAddingId] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get("/products");
        const result = response.data.data;
        const list = Array.isArray(result)
          ? result
          : result?.products || [];

        setProducts(list);

        const defaults = {};
        list.forEach((product) => {
          const variant = product.variants?.find(
            (v) => v.isActive && v.stock > 0
          );
          if (variant) defaults[product._id] = variant._id;
        });

        setSelectedVariants(defaults);
      } catch (err) {
        console.error("Products error:", err);
        setError("Failed to load products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const addToCart = async (product) => {
    const variantId = selectedVariants[product._id];

    if (!variantId) {
      setError("Is product ka koi in-stock variant available nahi hai.");
      setMessage("");
      return;
    }

    try {
      setAddingId(product._id);
      setError("");
      setMessage("");

      await api.post("/cart/items", {
        productId: product._id,
        variantId,
        quantity: 1,
      });

      setMessage(`${product.name} cart mein add ho gaya!`);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Cart mein add nahi hua. Customer login check karo."
      );
    } finally {
      setAddingId("");
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading products...</div>;
  }

  if (error && products.length === 0) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">ShopSphere Products</h1>
        <Link
          to="/cart"
          className="rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white"
        >
          View Cart
        </Link>
      </div>

      {message && (
        <p className="mb-4 rounded-lg bg-green-100 p-3 text-green-800">
          {message}
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
          {error}
        </p>
      )}

      {products.length === 0 ? (
        <p>No products available.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => {
            const variants = (product.variants || []).filter(
              (variant) => variant.isActive
            );

            const selectedVariant = variants.find(
              (variant) => variant._id === selectedVariants[product._id]
            );

            return (
              <article
                key={product._id}
                className="rounded-xl bg-white p-4 shadow"
              >
                <div className="mb-4 flex h-48 items-center justify-center rounded-lg bg-gray-100">
                  {product.images?.[0]?.url ? (
                    <img
                      src={product.images[0].url}
                      alt={product.images[0].alt || product.name}
                      className="h-full w-full rounded-lg object-cover"
                    />
                  ) : (
                    <span className="text-gray-400">No Image</span>
                  )}
                </div>

                <h2 className="text-lg font-semibold">{product.name}</h2>

                <p className="mt-1 text-sm text-gray-500">
                  {product.shortDescription}
                </p>

                {variants.length > 0 ? (
                  <>
                    <label className="mt-4 block text-sm font-medium">
                      Select variant
                    </label>

                    <select
                      value={selectedVariants[product._id] || ""}
                      onChange={(event) =>
                        setSelectedVariants((prev) => ({
                          ...prev,
                          [product._id]: event.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border p-2"
                    >
                      {variants.map((variant) => {
                        const attributes =
                          variant.attributes &&
                          typeof variant.attributes === "object"
                            ? Object.entries(variant.attributes)
                                .map(([key, value]) => `${key}: ${value}`)
                                .join(", ")
                            : "";

                        return (
                          <option
                            key={variant._id}
                            value={variant._id}
                            disabled={variant.stock < 1}
                          >
                            {attributes || variant.sku} — ₹{variant.price}
                            {variant.stock < 1 ? " (Out of stock)" : ""}
                          </option>
                        );
                      })}
                    </select>

                    {selectedVariant && (
                      <p className="mt-3 font-bold">
                        ₹{selectedVariant.price}
                      </p>
                    )}

                    <button
                      onClick={() => addToCart(product)}
                      disabled={
                        !selectedVariant ||
                        selectedVariant.stock < 1 ||
                        addingId === product._id
                      }
                      className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {addingId === product._id
                        ? "Adding..."
                        : selectedVariant?.stock < 1
                          ? "Out of Stock"
                          : "Add to Cart"}
                    </button>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-red-600">
                    No active variants available.
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default Products;