import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

export default function SellerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/seller/dashboard");
      setData(res.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="mt-4 text-xs text-slate-500 font-medium">Loading seller metrics & analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
        <p className="font-semibold">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { overview, recentOrders, bestSellingProducts, salesChart, seller } = data || {};

  const statCards = [
    {
      label: "Total Products",
      value: overview?.totalProducts || 0,
      icon: "📦",
      change: `${overview?.activeProducts || 0} active in catalog`,
      bg: "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      label: "Pending Approvals",
      value: overview?.pendingProducts || 0,
      icon: "⏳",
      change: `${overview?.rejectedProducts || 0} needs revision`,
      bg: "bg-amber-50 text-amber-600 border-amber-100",
    },
    {
      label: "Total Orders",
      value: overview?.totalOrders || 0,
      icon: "🛍️",
      change: `${overview?.pendingOrders || 0} pending fulfillment`,
      bg: "bg-purple-50 text-purple-600 border-purple-100",
    },
    {
      label: "Total Sales Revenue",
      value: `₹${(overview?.totalSalesRevenue || 0).toLocaleString("en-IN")}`,
      icon: "💰",
      change: "Net seller earnings",
      bg: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time performance metrics for{" "}
            <span className="font-semibold text-slate-800">{seller?.storeName}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/seller/products/new"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition"
          >
            <span>➕</span>
            <span>Add New Product</span>
          </Link>
          <button
            onClick={fetchDashboardData}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
            title="Refresh"
          >
            🔄
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${card.bg}`}>
                {card.icon}
              </span>
              <span className="text-[11px] font-medium text-slate-500">{card.change}</span>
            </div>
            <p className="mt-4 text-xs font-medium text-slate-500">{card.label}</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Sales Overview Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Sales Overview (Last 7 Days)</h2>
            <p className="text-xs text-slate-500 mt-0.5">Calculated from completed items in your store</p>
          </div>
          <Link to="/seller/analytics" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
            Full Analytics →
          </Link>
        </div>

        {salesChart && salesChart.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-2 h-44 items-end pt-4 border-b border-slate-100 pb-2">
              {(() => {
                const maxRev = Math.max(...salesChart.map((d) => d.revenue), 100);
                return salesChart.map((day, idx) => {
                  const heightPercent = Math.round((day.revenue / maxRev) * 100);
                  return (
                    <div key={idx} className="flex flex-col items-center h-full justify-end group relative">
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-900 text-[10px] text-white px-2 py-1 rounded shadow-md pointer-events-none transition whitespace-nowrap z-10">
                        ₹{day.revenue.toLocaleString("en-IN")} ({day.orders} orders)
                      </div>
                      <div
                        style={{ height: `${Math.max(heightPercent, 8)}%` }}
                        className="w-full max-w-[42px] bg-indigo-600 rounded-t-lg group-hover:bg-indigo-700 transition"
                      />
                      <span className="mt-2 text-[10px] font-semibold text-slate-500">
                        {day.label}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-medium">
              <span>7 Days Revenue Total: ₹{(salesChart.reduce((a, b) => a + b.revenue, 0)).toLocaleString("en-IN")}</span>
              <span>Based on fulfilled store items</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-8">No recent sales data recorded.</p>
        )}
      </div>

      {/* Two Column Section: Recent Orders & Best-Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900">Recent Store Orders</h2>
              <Link to="/seller/orders" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
                View All Orders →
              </Link>
            </div>

            {recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order._id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 hover:border-slate-200 transition"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{order.customerName}</p>
                      <p className="text-[11px] text-slate-500">
                        {order.itemsCount} store item(s) •{" "}
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900">
                        ₹{(order.sellerItemsSubtotal || 0).toLocaleString("en-IN")}
                      </p>
                      <span
                        className={`inline-block mt-0.5 rounded px-2 py-0.5 text-[9px] font-bold ${
                          order.status === "DELIVERED"
                            ? "bg-emerald-100 text-emerald-800"
                            : order.status === "SHIPPED"
                            ? "bg-indigo-100 text-indigo-800"
                            : order.status === "CANCELLED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                <span className="text-2xl block mb-2">🛍️</span>
                No orders received yet. Once customers order your items, they will appear here.
              </div>
            )}
          </div>
        </div>

        {/* Best-Selling Products */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900">Top Performing Products</h2>
              <Link to="/seller/products" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
                Manage Products →
              </Link>
            </div>

            {bestSellingProducts && bestSellingProducts.length > 0 ? (
              <div className="space-y-3">
                {bestSellingProducts.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
                          {p.productName}
                        </p>
                        <p className="text-[10px] text-slate-500">SKU: {p.sku}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900">{p.unitsSold} units</p>
                      <p className="text-[10px] text-emerald-600 font-bold">
                        ₹{(p.revenue || 0).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                <span className="text-2xl block mb-2">📦</span>
                Start listing products to see real-time sales performance.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
