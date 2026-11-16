import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

export default function SellerProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [inStockFilter, setInStockFilter] = useState("ALL");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = {
        limit: 100,
        sort: "newest",
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== "ALL") params.approvalStatus = statusFilter;
      if (inStockFilter === "true") params.inStock = "true";
      if (inStockFilter === "false") params.inStock = "false";

      const res = await api.get("/seller/products", { params });
      setProducts(res.data?.data?.products || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, inStockFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDeleteProduct = async (id) => {
    try {
      setDeleting(true);
      await api.delete(`/seller/products/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      setActionMessage("Product removed successfully.");
      setDeleteConfirmId(null);
      setTimeout(() => setActionMessage(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete product.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Products</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your store's listings, track verification statuses, and update pricing.
          </p>
        </div>

        <Link
          to="/seller/products/new"
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition"
        >
          <span>➕</span>
          <span>Add New Product</span>
        </Link>
      </div>

      {actionMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-700">
          ✓ {actionMessage}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700">
          ✕ {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, SKU, or tags..."
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
          >
            <option value="ALL">All Approvals</option>
            <option value="APPROVED">Approved & Live</option>
            <option value="PENDING">Pending Review</option>
            <option value="REJECTED">Needs Revision</option>
          </select>
        </div>

        <div>
          <select
            value={inStockFilter}
            onChange={(e) => setInStockFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
          >
            <option value="ALL">All Stock Levels</option>
            <option value="true">In Stock</option>
            <option value="false">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <p className="mt-3">Loading catalog items...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <span className="text-3xl block mb-2">📦</span>
            No products found matching the criteria.
            <div className="mt-4">
              <Link
                to="/seller/products/new"
                className="inline-block rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                Create First Product
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Product Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Variants / SKU</th>
                  <th className="py-3 px-4">Price (₹)</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {products.map((product) => {
                  const mainVariant = product.variants?.[0] || {};
                  const totalStock = (product.variants || []).reduce(
                    (acc, v) => acc + (v.stock || 0),
                    0
                  );
                  const minPrice = Math.min(
                    ...(product.variants || []).map((v) => v.price || 0)
                  );
                  const primaryImage =
                    product.images?.[0]?.url ||
                    mainVariant.images?.[0]?.url ||
                    "https://placehold.co/100x100?text=No+Image";

                  return (
                    <tr key={product._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={primaryImage}
                            alt={product.name}
                            className="h-11 w-11 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-50"
                          />
                          <div className="min-w-0 max-w-[220px]">
                            <p className="font-bold text-slate-900 truncate">{product.name}</p>
                            <span className="text-[10px] text-slate-400 block truncate">
                              /{product.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {product.category?.name || "General"}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] text-slate-800">
                          {mainVariant.sku || "N/A"}
                        </span>
                        {product.variants?.length > 1 && (
                          <span className="ml-1.5 text-[10px] text-indigo-600 font-semibold">
                            (+{product.variants.length - 1} more)
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        ₹{minPrice.toLocaleString("en-IN")}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold ${
                            totalStock > 5
                              ? "text-emerald-600"
                              : totalStock > 0
                              ? "text-amber-600"
                              : "text-rose-600"
                          }`}
                        >
                          {totalStock > 0 ? `${totalStock} in stock` : "Out of stock"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div>
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              product.approvalStatus === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800"
                                : product.approvalStatus === "REJECTED"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {product.approvalStatus || "APPROVED"}
                          </span>
                          {product.approvalStatus === "REJECTED" && product.rejectionReason && (
                            <p className="mt-1 text-[10px] text-rose-600 max-w-[160px] truncate" title={product.rejectionReason}>
                              Note: {product.rejectionReason}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-2">
                        <Link
                          to={`/seller/products/edit/${product._id}`}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => setDeleteConfirmId(product._id)}
                          className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Product Deletion */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Delete Product</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Are you sure you want to delete this listing? This action is permanent and cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => handleDeleteProduct(deleteConfirmId)}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, Delete Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
