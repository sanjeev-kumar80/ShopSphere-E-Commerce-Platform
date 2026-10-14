
import { Link, useLocation } from "react-router-dom";

export default function OrderSuccess() {
  const location = useLocation();
  const order = location.state?.order;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl text-green-600">
          ✓
        </div>

        <h1 className="mb-3 text-3xl font-bold text-gray-900">
          Order Placed Successfully!
        </h1>

        <p className="mb-6 text-gray-600">
          Thank you for shopping with ShopSphere. Your order has been
          received.
        </p>

        {order?._id && (
          <div className="mb-6 rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Order ID</p>
            <p className="break-all font-semibold">{order._id}</p>

            {order.orderStatus && (
              <p className="mt-2 text-sm">
                Status: <strong>{order.orderStatus}</strong>
              </p>
            )}

            {order.paymentMethod && (
              <p className="mt-1 text-sm">
                Payment: <strong>{order.paymentMethod}</strong>
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/shop"
            className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
          >
            Continue Shopping
          </Link>

          <Link
            to="/orders"
            className="rounded-lg border border-gray-300 px-5 py-3 font-medium hover:bg-gray-50"
          >
            My Orders
          </Link>
        </div>
      </div>
    </div>
  );
}