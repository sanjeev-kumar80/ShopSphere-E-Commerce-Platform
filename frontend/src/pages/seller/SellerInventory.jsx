import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";

export default function SellerInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStock, setUpdatingStock] = useState({});
  const [actionMessage, setActionMessage] = useState("");

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/seller/products", { params: { limit: 100 } });
      setProducts(res.data?.data?.products || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleStockUpdate = async (productId, variantId, newStock) => {
    if (newStock < 0 || isNaN(newStock)) return;
    const key = `${productId}_${variantId}`;

    try {
      setUpdatingStock((prev) => ({ ...prev, [key]: true }));
      setActionMessage("");

      await api.patch(`/seller/products/${productId}/stock`, {
        variantId,
        stock: Number(newStock),
      });

      setProducts((prev) =>
        prev.map((p) => {
          if (p._id !== productId) return p;
          return {
            ...p,
            variants: p.variants.map((v) =>
              v._id === variantId ? { ...v, stock: Number(newStock) } : v
            ),
          };
        })
      );

      setActionMessage("Inventory stock updated successfully.");
      setTimeout(() => setActionMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update stock");
    } finally {
      setUpdatingStock((prev) => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time stock controls. Update variant quantities instantly without opening individual edit forms.
          </p>
        </div>

        <button
          onClick={fetchInventory}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          🔄 Refresh
        </button>
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

      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <p className="mt-3">Loading inventory matrix...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No products found in store inventory.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">SKU Code</th>
                  <th className="py-3 px-4">Attributes</th>
                  <th className="py-3 px-4">Unit Price</th>
                  <th className="py-3 px-4">Stock Level</th>
                  <th className="py-3 px-4 text-right">Quick Update Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {products.flatMap((product) =>
                  (product.variants || []).map((v) => {
                    const key = `${product._id}_${v._id}`;
                    const isSaving = updatingStock[key];

                    return (
                      <tr key={key} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900 max-w-[220px] truncate">
                          {product.name}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-800">
                          {v.sku}
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-slate-500">
                          {Object.entries(v.attributes || {})
                            .map(([k, val]) => `${k}: ${val}`)
                            .join(", ") || "Standard"}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          ₹{(v.price || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              v.stock > 10
                                ? "bg-emerald-100 text-emerald-800"
                                : v.stock > 0
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {v.stock > 0 ? `${v.stock} units` : "Out of stock"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <input
                              type="number"
                              min="0"
                              defaultValue={v.stock}
                              id={`stock_input_${key}`}
                              className="w-20 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900 text-right focus:border-indigo-600 focus:outline-none"
                            />
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() => {
                                const input = document.getElementById(`stock_input_${key}`);
                                if (input) {
                                  handleStockUpdate(product._id, v._id, input.value);
                                }
                              }}
                              className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                            >
                              {isSaving ? "Saving..." : "Set"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
