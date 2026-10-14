
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get("/orders");
        setOrders(response.data.data || []);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Orders load nahi ho paaye. Please login karke try karo."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formatStatus = (status) =>
    String(status || "PLACED")
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-600">
        Loading your orders...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              My Orders
            </h1>
            <p className="mt-2 text-gray-600">
              View your order history and current order status.
            </p>
          </div>

          <Link
            to="/shop"
            className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
          >
            Continue Shopping
          </Link>
        </div>

        {error && (
          <div className="mb-5 rounded-lg bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        {!error && orders.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            <h2 className="mb-3 text-xl font-semibold">
              No orders yet
            </h2>
            <p className="mb-6 text-gray-600">
              Your placed orders will appear here.
            </p>
            <Link
              to="/shop"
              className="rounded-lg bg-blue-600 px-5 py-3 text-white"
            >
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <article
                key={order._id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                 <Link
                    to={`/orders/${order._id}`}
                    className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    View Details
                  </Link>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b bg-gray-50 p-5">
                  <div>
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="break-all font-semibold text-gray-900">
                      {order._id}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Order Date</p>
                    <p className="font-medium">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Order Status</p>
                    <span className="mt-1 inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                      {formatStatus(order.orderStatus)}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  {(order.items || []).map((item, index) => (
                    <div
                      key={item._id || `${order._id}-${index}`}
                      className="flex items-center gap-4"
                    >
                      {item.product?.images?.[0]?.url ? (
                        <img
                          src={item.product.images[0].url}
                          alt={item.product.name || "Product"}
                          className="h-20 w-20 rounded-lg border object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                          No image
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900">
                          {item.product?.name || "Product unavailable"}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Quantity: {item.quantity}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">
                          ₹{Number(item.price || 0).toFixed(2)} each
                        </p>
                      </div>

                      <p className="font-semibold">
                        ₹
                        {(
                          Number(item.price || 0) *
                          Number(item.quantity || 0)
                        ).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t p-5">
                  <div className="text-sm text-gray-600">
                    Payment:{" "}
                    <span className="font-medium text-gray-900">
                      {order.paymentMethod || "N/A"}
                    </span>
                    {" · "}
                    Payment status:{" "}
                    <span className="font-medium text-gray-900">
                      {formatStatus(order.paymentStatus)}
                    </span>
                  </div>

                  <p className="text-lg font-bold text-gray-900">
                    Total: ₹{Number(order.totalAmount ?? order.total ?? 0).toFixed(2)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}