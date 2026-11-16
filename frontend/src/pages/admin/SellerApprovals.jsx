import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";

export default function SellerApprovals() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [updatingId, setUpdatingId] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [rejectionModal, setRejectionModal] = useState({ open: false, sellerId: null, reason: "" });

  const fetchSellers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (statusFilter !== "ALL") params.status = statusFilter;

      const res = await api.get("/admin/sellers", { params });
      setSellers(res.data?.data?.sellers || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load sellers");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchSellers();
  }, [fetchSellers]);

  const handleStatusChange = async (sellerId, status, rejectionReason = "") => {
    try {
      setUpdatingId(sellerId);
      setActionMessage("");
      setError("");

      await api.patch(`/admin/sellers/${sellerId}/status`, {
        status,
        rejectionReason,
      });

      setSellers((prev) =>
        prev.map((s) => (s._id === sellerId ? { ...s, status, rejectionReason } : s))
      );

      setActionMessage(`Seller account marked as ${status}.`);
      setRejectionModal({ open: false, sellerId: null, reason: "" });
      setTimeout(() => setActionMessage(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update seller status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Seller Management & Approvals</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review multi-vendor seller registrations, approve onboarding applications, or suspend non-compliant stores.
          </p>
        </div>

        <button
          onClick={fetchSellers}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          🔄 Refresh List
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
        {["PENDING", "APPROVED", "REJECTED", "SUSPENDED", "ALL"].map((tab) => (
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

      {/* Sellers Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500">Loading sellers...</div>
        ) : sellers.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            No sellers found with status "{statusFilter}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Store & Contact</th>
                  <th className="py-3 px-4">Owner Name</th>
                  <th className="py-3 px-4">Category & GSTIN</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sellers.map((seller) => (
                  <tr key={seller._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{seller.storeName}</p>
                      <p className="text-[11px] text-slate-500">{seller.user?.email || "N/A"}</p>
                      <p className="text-[11px] text-slate-500">{seller.phone}</p>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {seller.user?.name || "N/A"}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        {seller.businessCategory || "General Retail"}
                      </span>
                      {seller.gstin && (
                        <p className="mt-1 font-mono text-[10px] text-slate-500">
                          GST: {seller.gstin}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                      {seller.businessAddress?.city && `${seller.businessAddress.city}, `}
                      {seller.businessAddress?.state || "India"}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          seller.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : seller.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800"
                            : seller.status === "SUSPENDED"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {seller.status}
                      </span>
                      {seller.rejectionReason && (
                        <p className="mt-1 text-[10px] text-slate-500 max-w-[150px] truncate" title={seller.rejectionReason}>
                          {seller.rejectionReason}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      {seller.status !== "APPROVED" && (
                        <button
                          disabled={updatingId === seller._id}
                          onClick={() => handleStatusChange(seller._id, "APPROVED")}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                      )}

                      {seller.status !== "REJECTED" && (
                        <button
                          disabled={updatingId === seller._id}
                          onClick={() =>
                            setRejectionModal({
                              open: true,
                              sellerId: seller._id,
                              reason: "Please verify your business GSTIN and store contact details.",
                            })
                          }
                          className="rounded-lg bg-rose-50 px-3 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 border border-rose-200 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      )}

                      {seller.status === "APPROVED" && (
                        <button
                          disabled={updatingId === seller._id}
                          onClick={() => handleStatusChange(seller._id, "SUSPENDED", "Temporarily suspended by administrator")}
                          className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
                        >
                          Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Rejection Reason */}
      {rejectionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Provide Rejection Reason</h3>
            <p className="mt-1 text-xs text-slate-500">
              The seller will see this note in their dashboard so they can revise their details.
            </p>

            <textarea
              rows={3}
              value={rejectionModal.reason}
              onChange={(e) =>
                setRejectionModal((prev) => ({ ...prev, reason: e.target.value }))
              }
              className="mt-4 w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
              placeholder="e.g. Invalid GSTIN or address verification failed."
            />

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectionModal({ open: false, sellerId: null, reason: "" })}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  handleStatusChange(rejectionModal.sellerId, "REJECTED", rejectionModal.reason)
                }
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
