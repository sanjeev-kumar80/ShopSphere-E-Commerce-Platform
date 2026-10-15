
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import api from "../../services/api";

export default function AdminDashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState([
  { title: "Total Products", value: 0 },
  { title: "Total Orders", value: 0 },
  { title: "Customers", value: 0 },
  { title: "Revenue", value: "₹0" },
]);

useEffect(() => {
  loadDashboardStats();
}, []);

const loadDashboardStats = async () => {
  try {
    const [productsRes, ordersRes] = await Promise.all([
      api.get("/products", {
        params: {
          page: 1,
          limit: 1000,
        },
      }),
      api.get("/orders/admin/all"),
    ]);

    const products =
      productsRes.data?.data?.products || [];

    const orders =
      ordersRes.data?.data || [];

    const customers = new Set(
      orders
        .filter((order) => order.user?._id)
        .map((order) => order.user._id)
    ).size;

    const revenue = orders.reduce(
      (total, order) => total + Number(order.total || 0),
      0
    );
    const pendingOrders = orders.filter(
      (order) => order.orderStatus === "PLACED"
    ).length;

    setStats([
      {
        title: "Total Products",
        value: products.length,
      },
      {
        title: "Total Orders",
        value: orders.length,
      },
      {
        title: "Customers",
        value: customers,
      },
      {
        title: "Revenue",
        value: `₹${revenue.toLocaleString("en-IN")}`,
      },
      {
        title: "Pending Orders",
        value: pendingOrders,
      },
    ]);
  } catch (error) {
    console.error("Dashboard Error:", error);
  }
};

  

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">
        Dashboard
      </h1>
      <p className="mt-2 text-slate-500">
        Welcome back, {user.name}. Here is your store overview.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm text-slate-500">{stat.title}</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Store management</h2>
        <p className="mt-2 text-sm text-slate-500">
          Your dashboard is ready. Connect product, order and customer
          data as their management modules are implemented.
        </p>
      </section>
    </div>
  );
}