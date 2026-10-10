
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

function Products() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";

  const [searchInput, setSearchInput] = useState(search);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const [products, setProducts] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [addingId, setAddingId] = useState("");

  // Keep the search input synchronized with the URL.
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Fetch products.
  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/products", {
          params: {
            search: search.trim() || undefined,
            category: category || undefined,
          },
        });

        const result = response.data.data;
        const list = Array.isArray(result)
          ? result
          : result?.products || [];

        if (cancelled) return;

        setProducts(list);

        const defaults = {};

        list.forEach((product) => {
          const variant = product.variants?.find(
            (v) => v.isActive && v.stock > 0
          );

          if (variant) {
            defaults[product._id] = variant._id;
          }
        });

        setSelectedVariants(defaults);
      } catch (err) {
        if (!cancelled) {
          console.error("Products error:", err);
          setError(
            err.response?.data?.message || "Failed to load products."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [search, category]);

  const handleSearch = (event) => {
    event.preventDefault();

    const query = searchInput.trim();

    navigate(
      query ? `/shop?search=${encodeURIComponent(query)}` : "/shop"
    );
  };

    
const handleLogout = async () => {
  setAccountMenuOpen(false);

  await logout();

  navigate("/", { replace: true });
};
// navigate("/", { replace: true });


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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Announcement */}
      <div className="bg-indigo-950 px-4 py-2 text-center text-sm text-white">
        ✦ Your next favourite find is just a click away. ✦
      </div>

      {/* Main Navbar */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
              S
            </span>
            <span>
              shop<span className="text-indigo-600">sphere</span>
            </span>
          </Link>

          {/* Search */}
          <form
            onSubmit={handleSearch}
            className="order-3 flex w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50 md:order-none md:max-w-xl md:flex-1"
          >
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search products, brands and more..."
              aria-label="Search products"
              className="min-w-0 flex-1 bg-transparent px-4 py-3 outline-none"
            />
            <button
              type="submit"
              className="bg-indigo-600 px-5 font-medium text-white hover:bg-indigo-700"
            >
              Search
            </button>
          </form>

          {/* Account and Cart */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setAccountMenuOpen((open) => !open)
                  }
                  aria-expanded={accountMenuOpen}
                  className="flex max-w-48 items-center gap-2 rounded-lg px-2 py-2 font-medium text-gray-800 hover:bg-gray-100"
                >
                  <span className="text-xl">♙</span>
                  <span className="truncate">
                    {user.name || "My Account"}
                  </span>
                  <span>▾</span>
                </button>

                {accountMenuOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                    <p className="truncate px-3 py-2 text-sm text-gray-500">
                      {user.email}
                    </p>

                    <Link
                      to="/orders"
                      onClick={() => setAccountMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 hover:bg-gray-100"
                    >
                      My Orders
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full rounded-lg px-3 py-2 text-left text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="rounded-lg px-3 py-2 font-medium hover:bg-gray-100"
              >
                ♙ Login / Account
              </Link>
            )}

            <Link
              to="/cart"
              className="rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white hover:bg-indigo-700"
            >
              ♧ Cart
            </Link>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="border-t border-gray-100">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-7 gap-y-2 px-4 py-3 text-sm font-medium md:px-8">
            <Link to="/shop" className="text-indigo-700">
              Shop All
            </Link>
            <Link to="/shop?sort=newest" className="hover:text-indigo-700">
              New Arrivals
            </Link>
            <Link to="/orders" className="hover:text-indigo-700">
              My Orders
            </Link>
          </div>
        </nav>
      </header>

      {/* Products */}
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-indigo-600">
              Discover your favourites
            </p>
            <h1 className="text-3xl font-bold text-gray-900">
              ShopSphere Products
            </h1>
          </div>
          <Link
            to="/cart"
            className="rounded-lg border border-indigo-600 px-5 py-3 font-medium text-indigo-700 hover:bg-indigo-50"
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

        {loading ? (
          <p className="py-12 text-center text-gray-500">
            Loading products...
          </p>
        ) : products.length === 0 ? (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <h2 className="text-xl font-semibold">No products found</h2>
            <p className="mt-2 text-gray-500">
              Try another search or explore our collection later.
            </p>
            <Link
              to="/shop"
              className="mt-5 inline-block rounded-lg bg-indigo-600 px-5 py-3 text-white"
            >
              View All Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => {
              const variants = (product.variants || []).filter(
                (variant) => variant.isActive
              );

              const selectedVariant = variants.find(
                (variant) =>
                  variant._id === selectedVariants[product._id]
              );

              return (
                <article
                  key={product._id}
                  className="rounded-xl bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
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

                  <h2 className="text-lg font-semibold text-gray-900">
                    {product.name}
                  </h2>

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
                        <p className="mt-3 text-xl font-bold">
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

      <footer className="mt-12 border-t bg-white px-4 py-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} ShopSphere. Discover good things.
      </footer>
    </div>
  );
}

export default Products;