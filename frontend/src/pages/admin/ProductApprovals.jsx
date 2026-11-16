import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";

export default function ProductApprovals() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [updatingId, setUpdatingId] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [rejectModal, setRejectModal] = useState({ open: false, productId: null, reason: "" });

  const fetchPendingProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (statusFilter !== "ALL") params.status = statusFilter;

      const res = await api.get("/admin/products/pending", { params });
      setProducts(res.data?.data?.products || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load pending products");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchPendingProducts();
  }, [fetchPendingProducts]);

  const handleApproval = async (productId, approvalStatus, rejectionReason = "") => {
    try {
      setUpdatingId(productId);
      setActionMessage("");
      setError("");

      await api.patch(`/admin/products/${productId}/approval`, {
        approvalStatus,
        rejectionReason,
      });

      setProducts((prev) =>
        prev.map((p) => (p._id === productId ? { ...p, approvalStatus, rejectionReason } : p))
      );

      setActionMessage(`Product status set to ${approvalStatus}.`);
      setRejectModal({ open: false, productId: null, reason: "" });
      setTimeout(() => setActionMessage(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update approval status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Product Listing Approvals</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review products submitted by marketplace sellers. Only approved products are indexed on the customer storefront.
          </p>
        </div>

        <button
          onClick={fetchPendingProducts}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          🔄 Refresh
        </button>
      </div>

      {actionMessage && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800">
          ✓ {actionMessage}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-800">
          ✕ {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        {["PENDING", "APPROVED", "REJECTED", "ALL"].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              statusFilter === tab
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Products Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500">Loading catalog items...</div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            No products found with status "{statusFilter}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Product Info</th>
                  <th className="py-3 px-4">Seller Store</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Min Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Approval Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {products.map((p) => {
                  const minPrice = Math.min(
                    ...(p.variants || []).map((v) => v.price || 0)
                  );
                  const totalStock = (p.variants || []).reduce(
                    (acc, v) => acc + (v.stock || 0),
                    0
                  );
                  const primaryImage =
                    p.images?.[0]?.url ||
                    p.variants?.[0]?.images?.[0]?.url ||
                    "https://placehold.co/100x100?text=No+Img";

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={primaryImage}
                            alt={p.name}
                            className="h-11 w-11 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-50"
                          />
                          <div className="max-w-[220px]">
                            <p className="font-bold text-slate-900 truncate">{p.name}</p>
                            <p className="text-[11px] text-slate-500 truncate">{p.shortDescription || p.description}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {p.seller ? (
                          <div>
                            <span className="font-semibold text-slate-900">{p.seller.storeName}</span>
                            <span className="block text-[10px] text-slate-400">Seller: {p.seller.status}</span>
                          </div>
                        ) : (
                          <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                            Admin Listed
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {p.category?.name || "General"}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        ₹{minPrice.toLocaleString("en-IN")}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold ${
                            totalStock > 0 ? "text-slate-800" : "text-rose-600"
                          }`}
                        >
                          {totalStock} units
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            p.approvalStatus === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : p.approvalStatus === "REJECTED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {p.approvalStatus || "APPROVED"}
                        </span>
                        {p.rejectionReason && (
                          <p className="mt-1 text-[10px] text-slate-500 max-w-[150px] truncate" title={p.rejectionReason}>
                            Reason: {p.rejectionReason}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-2">
                        {p.approvalStatus !== "APPROVED" && (
                          <button
                            disabled={updatingId === p._id}
                            onClick={() => handleApproval(p._id, "APPROVED")}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Approve
                          </button>
                        )}

                        {p.approvalStatus !== "REJECTED" && (
                          <button
                            disabled={updatingId === p._id}
                            onClick={() =>
                              setRejectModal({
                                open: true,
                                productId: p._id,
                                reason: "Specifications or images require revision.",
                              })
                            }
                            className="rounded-lg bg-rose-50 px-3 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 border border-rose-200 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Rejecting Product with Reason */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Provide Rejection Reason</h3>
            <p className="mt-1 text-xs text-slate-500">
              The seller will receive this reason to adjust their listing and resubmit.
            </p>

            <textarea
              rows={3}
              value={rejectModal.reason}
              onChange={(e) =>
                setRejectModal((prev) => ({ ...prev, reason: e.target.value }))
              }
              className="mt-4 w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
              placeholder="e.g. Unclear product images or inaccurate SKU specs."
            />

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModal({ open: false, productId: null, reason: "" })}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  handleApproval(rejectModal.productId, "REJECTED", rejectModal.reason)
                }
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
              >
                Reject Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
