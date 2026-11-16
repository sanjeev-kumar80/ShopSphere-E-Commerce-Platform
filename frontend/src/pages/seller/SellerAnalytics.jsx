import { useState, useEffect } from "react";
import api from "../../services/api";

export default function SellerAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/seller/analytics");
      setAnalytics(res.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load sales analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-slate-500">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        <p className="mt-3">Compiling revenue performance and product sales reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
        <p>{error}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const {
    totalRevenue = 0,
    totalItemsSold = 0,
    totalOrders = 0,
    averageOrderValue = 0,
    dailyRevenue = {},
    monthlyRevenue = {},
    productWiseSales = [],
  } = analytics || {};

  const dailyEntries = Object.entries(dailyRevenue).slice(-14);
  const monthlyEntries = Object.entries(monthlyRevenue);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sales & Revenue Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">
          Detailed metrics based on actual eligible item orders. Non-eligible and cancelled items are excluded.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Total Net Revenue</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">
            ₹{totalRevenue.toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Across all fulfilled order items</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Total Units Sold</p>
          <p className="mt-2 text-2xl font-black text-indigo-600">
            {totalItemsSold.toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">All variant units purchased</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Store Orders</p>
          <p className="mt-2 text-2xl font-black text-purple-600">{totalOrders}</p>
          <p className="text-[10px] text-slate-400 mt-1">Orders with your products</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Avg. Basket Contribution</p>
          <p className="mt-2 text-2xl font-black text-amber-600">
            ₹{averageOrderValue.toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Per store order</p>
        </div>
      </div>

      {/* Daily & Monthly Revenue Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Daily Revenue History</h2>
          {dailyEntries.length > 0 ? (
            <div className="space-y-2">
              {dailyEntries.map(([date, rev]) => (
                <div
                  key={date}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs"
                >
                  <span className="font-mono text-slate-700">{date}</span>
                  <span className="font-bold text-emerald-600">
                    ₹{rev.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No daily sales recorded yet.</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Monthly Revenue Breakdown</h2>
          {monthlyEntries.length > 0 ? (
            <div className="space-y-2">
              {monthlyEntries.map(([month, rev]) => (
                <div
                  key={month}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs"
                >
                  <span className="font-mono text-slate-700">{month}</span>
                  <span className="font-bold text-indigo-600">
                    ₹{rev.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No monthly sales recorded yet.</p>
          )}
        </div>
      </div>

      {/* Product-Wise Sales Performance Matrix */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Product-Wise Sales Matrix</h2>
          <p className="text-xs text-slate-500 mt-0.5">Ranking products by gross revenue generated</p>
        </div>

        {productWiseSales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4 text-center">Units Sold</th>
                  <th className="py-3 px-4 text-right">Gross Revenue (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {productWiseSales.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-bold text-indigo-600">#{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{p.productName}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{p.sku}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">{p.unitsSold}</td>
                    <td className="py-3 px-4 text-right font-black text-emerald-600">
                      ₹{p.revenue.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-12 text-center">
            No product sales generated yet.
          </p>
        )}
      </div>
    </div>
  );
}
