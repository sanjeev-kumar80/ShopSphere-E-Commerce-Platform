import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = {
        limit: 100,
      };
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get("/seller/orders", { params });
      setOrders(res.data?.data?.orders || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId, itemId, newStatus) => {
    try {
      setUpdatingItemId(itemId);
      setSuccessMessage("");
      setError("");

      await api.patch(`/seller/orders/${orderId}/items/status`, {
        itemId,
        status: newStatus,
      });

      setOrders((prev) =>
        prev.map((order) => {
          if (order._id !== orderId) return order;
          return {
            ...order,
            items: order.items.map((item) =>
              item._id === itemId ? { ...item, status: newStatus } : item
            ),
          };
        })
      );

      setSuccessMessage("Fulfillment status updated successfully.");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update fulfillment status.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders & Fulfillment</h1>
          <p className="text-xs text-slate-500 mt-1">
            Fulfill individual order items purchased from your store. Multi-vendor data is strictly isolated.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
        >
          🔄 Refresh Orders
        </button>
      </div>

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-700">
          ✓ {successMessage}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700">
          ✕ {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order ID, Customer Name, SKU..."
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
          >
            <option value="ALL">All Item Statuses</option>
            <option value="PLACED">Placed</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-xs text-slate-500 shadow-xs">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <p className="mt-3">Loading order items...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-xs text-slate-400 shadow-xs">
            <span className="text-3xl block mb-2">🛍️</span>
            No orders found matching the filter criteria.
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order._id}
              className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden"
            >
              {/* Order Header */}
              <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Order ID: </span>
                  <span className="font-mono font-bold text-slate-900">#{order._id}</span>
                  <span className="mx-2 text-slate-300">•</span>
                  <span className="text-slate-500">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-slate-600">
                    Payment:{" "}
                    <strong className="text-slate-900">
                      {order.paymentMethod} ({order.paymentStatus})
                    </strong>
                  </span>
                  <span className="text-slate-600">
                    Your Share:{" "}
                    <strong className="text-emerald-600 text-sm font-black">
                      ₹{(order.sellerSubtotal || 0).toLocaleString("en-IN")}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Order Body: Customer & Items */}
              <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Customer Fulfillment Address */}
                <div className="border-b lg:border-b-0 lg:border-r border-slate-100 pb-4 lg:pb-0 lg:pr-4 text-xs space-y-1.5">
                  <h4 className="font-bold uppercase text-[10px] tracking-wider text-indigo-600">
                    Delivery Recipient
                  </h4>
                  <p className="font-bold text-slate-900">{order.customer.name}</p>
                  <p className="text-slate-600">{order.customer.phone || "No phone provided"}</p>
                  <p className="text-slate-500 leading-relaxed">
                    {order.customer.addressLine}
                    {order.customer.city && `, ${order.customer.city}`}
                    {order.customer.state && `, ${order.customer.state}`}
                    {order.customer.pincode && ` - ${order.customer.pincode}`}
                  </p>
                </div>

                {/* Seller's Products inside this order */}
                <div className="lg:col-span-2 space-y-3">
                  <h4 className="font-bold uppercase text-[10px] tracking-wider text-indigo-600">
                    Items Belonging To Your Store ({order.items.length})
                  </h4>

                  <div className="space-y-2.5">
                    {order.items.map((item) => (
                      <div
                        key={item._id}
                        className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{item.productName}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            SKU: <span className="font-mono text-slate-700">{item.sku}</span> • Qty:{" "}
                            <strong>{item.quantity}</strong> • Unit Price: ₹
                            {item.price.toLocaleString("en-IN")}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                          <span className="font-black text-slate-900">
                            ₹{(item.subtotal || 0).toLocaleString("en-IN")}
                          </span>

                          <div className="flex items-center gap-2">
                            <select
                              value={item.status || order.overallOrderStatus}
                              disabled={
                                updatingItemId === item._id ||
                                (item.status || order.overallOrderStatus) === "CANCELLED"
                              }
                              onChange={(e) =>
                                handleUpdateStatus(order._id, item._id, e.target.value)
                              }
                              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold outline-none transition ${
                                (item.status || order.overallOrderStatus) === "DELIVERED"
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                  : (item.status || order.overallOrderStatus) === "SHIPPED"
                                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                                  : (item.status || order.overallOrderStatus) === "CANCELLED"
                                  ? "border-rose-300 bg-rose-50 text-rose-700"
                                  : "border-amber-300 bg-amber-50 text-amber-700"
                              }`}
                            >
                              <option value="PLACED">Placed</option>
                              <option value="CONFIRMED">Confirmed</option>
                              <option value="PROCESSING">Processing</option>
                              <option value="SHIPPED">Shipped</option>
                              <option value="DELIVERED">Delivered</option>
                            </select>

                            {updatingItemId === item._id && (
                              <span className="text-[10px] text-indigo-600 animate-pulse font-medium">
                                Updating...
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
