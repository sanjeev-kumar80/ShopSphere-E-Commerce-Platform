
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";

function formatDate(date) {
  if (!date) return "N/A";

  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatPrice(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/orders/${id}`);
      setOrder(response.data.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load order details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?"
    );

    if (!confirmed) return;

    try {
      setCancelling(true);
      setError("");
      setMessage("");

      const response = await api.post(`/orders/${id}/cancel`);

      setOrder(response.data.data);
      setMessage(
        response.data.message || "Order cancelled successfully."
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to cancel order."
      );
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 text-center">
        Loading order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 text-center">
        <p className="mb-4 text-red-600">
          {error || "Order not found."}
        </p>
        <Link
          to="/orders"
          className="font-semibold text-blue-600 hover:underline"
        >
          Back to My Orders
        </Link>
      </div>
    );
  }

  const status = order.orderStatus || "UNKNOWN";

  const canCancel =
    !["SHIPPED", "DELIVERED", "CANCELLED"].includes(status);

  const items = order.items || [];

  const totalAmount =
    order.totalAmount ?? order.total ?? order.grandTotal ?? 0;

  const address =
    order.shippingAddress ||
    order.deliveryAddress ||
    order.address;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => navigate("/orders")}
          className="mb-6 text-sm font-semibold text-blue-600 hover:underline"
        >
          ← Back to My Orders
        </button>

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Order Details
              </h1>

              <p className="mt-2 break-all text-sm text-gray-500">
                Order ID: {order._id}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Placed on: {formatDate(order.createdAt)}
              </p>
            </div>

            <span className="w-fit rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800">
              {status.replaceAll("_", " ")}
            </span>
          </div>

          {message && (
            <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {message}
            </p>
          )}

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-bold text-gray-900">
            Ordered Items
          </h2>

          <div className="space-y-5">
            {items.map((item, index) => {
              const product =
                item.product && typeof item.product === "object"
                  ? item.product
                  : null;

              const productName =
                product?.name || item.name || "Product";

              const rawImage = product?.images?.[0] || item.image;
              const imageUrl =
                typeof rawImage === "string"
                  ? rawImage
                  : rawImage?.url || rawImage?.secure_url;

              const quantity = item.quantity || 1;

              const price =
                item.price ??
                item.unitPrice ??
                item.productPrice ??
                0;

              return (
                <div
                  key={item._id || `${productName}-${index}`}
                  className="flex gap-4 border-b border-gray-100 pb-5 last:border-0 last:pb-0"
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={productName}
                      className="h-20 w-20 rounded-lg border object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                      No image
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {productName}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Quantity: {quantity}
                    </p>

                    <p className="mt-2 font-semibold text-gray-800">
                      {formatPrice(price * quantity)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">
              Payment Information
            </h2>

            <div className="space-y-3 text-sm">
              <p className="flex justify-between gap-3">
                <span className="text-gray-500">Payment Method</span>
                <span className="font-medium">
                  {order.paymentMethod || "N/A"}
                </span>
              </p>

              <p className="flex justify-between gap-3">
                <span className="text-gray-500">Payment Status</span>
                <span className="font-medium">
                  {order.paymentStatus || "N/A"}
                </span>
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">
              Order Summary
            </h2>

            <div className="flex justify-between gap-3">
              <span className="text-gray-600">Total Amount</span>
              <span className="text-xl font-bold text-gray-900">
                {formatPrice(totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {address && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-bold text-gray-900">
              Delivery Address
            </h2>

            {typeof address === "object" ? (
              <div className="space-y-1 text-sm text-gray-600">
                {[
                  address.fullName || address.name,
                  address.phone,
                  address.addressLine1 || address.addressLine,
                  address.addressLine2,
                  address.city,
                  address.state,
                  address.postalCode || address.pincode,
                ]
                  .filter(Boolean)
                  .map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">{address}</p>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {canCancel && (
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="rounded-lg bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelling ? "Cancelling..." : "Cancel Order"}
            </button>
          )}

          <Link
            to="/shop"
            className="rounded-lg border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 hover:bg-gray-100"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;