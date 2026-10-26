import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function AdminDashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    customers: 0,
    revenue: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [productsResponse, ordersResponse] = await Promise.all([
        api.get("/products", {
          params: {
            page: 1,
            limit: 1000,
          },
        }),
        api.get("/orders/admin/all"),
      ]);

      const products =
        productsResponse.data?.data?.products || [];

      const orders =
        ordersResponse.data?.data || [];

      const revenue = orders.reduce(
        (total, order) => total + Number(order.total || 0),
        0
      );

      const uniqueCustomers = new Set(
        orders
          .filter((order) => order.user?._id)
          .map((order) => order.user._id)
      );

      setStats({
        products: products.length,
        orders: orders.length,
        customers: uniqueCustomers.size,
        revenue,
      });
    } catch (error) {
      console.error("Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const dashboardCards = [
    {
      title: "Total Products",
      value: stats.products,
    },
    {
      title: "Total Orders",
      value: stats.orders,
    },
    {
      title: "Customers",
      value: stats.customers,
    },
    {
      title: "Revenue",
      value: `₹${stats.revenue.toLocaleString("en-IN")}`,
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">
        Dashboard
      </h1>

      <p className="mt-2 text-slate-500">
        Welcome back, {user?.name}.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardCards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm text-slate-500">
              {card.title}
            </p>

            <p className="mt-3 text-3xl font-bold text-slate-900">
              {loading ? "..." : card.value}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">
          Store Management
        </h2>

        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm text-slate-500">
              Products
            </p>
            <p className="text-xl font-bold">
              {stats.products}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Orders
            </p>
            <p className="text-xl font-bold">
              {stats.orders}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Customers
            </p>
            <p className="text-xl font-bold">
              {stats.customers}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Revenue
            </p>
            <p className="text-xl font-bold">
              ₹{stats.revenue.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}