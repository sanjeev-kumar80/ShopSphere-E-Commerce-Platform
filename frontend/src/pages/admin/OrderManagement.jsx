
import { useEffect, useState } from "react";
import api from "../../services/api";

const statusOptions = [
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const statusColors = {
  PLACED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-indigo-100 text-indigo-700",
  PROCESSING: "bg-yellow-100 text-yellow-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/orders/admin/all");
      setOrders(response.data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load orders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, orderStatus) => {
    try {
      setUpdatingId(orderId);
      setMessage("");
      setError("");

      const response = await api.patch(
        `/orders/admin/${orderId}/status`,
        { orderStatus }
      );

      const updatedOrder = response.data.data;

      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          order._id === orderId
            ? { ...order, ...updatedOrder }
            : order
        )
      );

      setMessage("Order status updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update order status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <p className="text-slate-600">Loading orders...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Orders Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View customer orders and manage their status.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          Refresh Orders
        </button>
      </div>

      {message && (
        <p className="rounded-lg bg-green-100 p-3 text-green-700">
          {message}
        </p>
      )}

      {error && (
        <p className="rounded-lg bg-red-100 p-3 text-red-700">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Orders</p>
          <p className="mt-2 text-2xl font-bold">{orders.length}</p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pending / Placed</p>
          <p className="mt-2 text-2xl font-bold">
            {orders.filter((o) => o.orderStatus === "PLACED").length}
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Delivered</p>
          <p className="mt-2 text-2xl font-bold">
            {orders.filter((o) => o.orderStatus === "DELIVERED").length}
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <h2 className="font-semibold text-slate-800">
            No orders found
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Customer orders will appear here once placed.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <div
              key={order._id}
              className="rounded-xl bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <p className="font-semibold text-slate-900">
                    Order #{order._id.slice(-8).toUpperCase()}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    Customer: {order.user?.name || "Unknown"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {order.user?.email || "No email available"}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    statusColors[order.orderStatus] ||
                    "bg-slate-100 text-slate-700"
                  }`}
                >
                  {order.orderStatus}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-5 py-4 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 font-semibold text-slate-800">
                    Order Items
                  </h3>

                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div
                        key={item._id || index}
                        className="rounded-lg bg-slate-50 p-3 text-sm"
                      >
                        <p className="font-medium text-slate-800">
                          {item.productName ||
                            item.product?.name ||
                            "Product"}
                        </p>
                        <p className="mt-1 text-slate-500">
                          Qty: {item.quantity} × ₹
                          {item.price?.toLocaleString("en-IN")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold text-slate-800">
                    Shipping Address
                  </h3>

                  <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                    <p className="font-medium text-slate-800">
                      {order.shippingAddress?.fullName}
                    </p>
                    <p>{order.shippingAddress?.phone}</p>
                    <p>{order.shippingAddress?.addressLine}</p>
                    <p>
                      {order.shippingAddress?.city},{" "}
                      {order.shippingAddress?.state} -{" "}
                      {order.shippingAddress?.pincode}
                    </p>
                    {order.shippingAddress?.landmark && (
                      <p>Landmark: {order.shippingAddress.landmark}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-end justify-between gap-4 border-t border-slate-200 pt-4">
                <div className="text-sm text-slate-600">
                  <p>
                    Payment:{" "}
                    <span className="font-medium text-slate-900">
                      {order.paymentMethod}
                    </span>
                  </p>
                  <p className="mt-1">
                    Payment Status:{" "}
                    <span className="font-medium text-slate-900">
                      {order.paymentStatus}
                    </span>
                  </p>
                  <p className="mt-2 text-lg font-bold text-slate-900">
                    Total: ₹{order.total?.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="w-full sm:w-56">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Update Order Status
                  </label>

                  <select
                    value={order.orderStatus}
                    disabled={
                      updatingId === order._id ||
                      ["DELIVERED", "CANCELLED"].includes(order.orderStatus)
                    }
                    onChange={(e) =>
                      handleStatusChange(order._id, e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:bg-slate-100"
                  >
                    {order.orderStatus === "PLACED" && (
                      <option value="PLACED">PLACED</option>
                    )}

                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  {updatingId === order._id && (
                    <p className="mt-1 text-xs text-slate-500">
                      Updating status...
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}