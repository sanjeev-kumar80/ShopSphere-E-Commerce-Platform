import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function SellerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchSellerProfile = async () => {
      try {
        const res = await api.get("/seller/profile");
        if (!cancelled) {
          setSeller(res.data?.data?.seller || null);
        }
      } catch (err) {
        console.error("Failed to load seller profile:", err.message);
      }
    };
    fetchSellerProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/seller/login", { replace: true });
  };

  const navItems = [
    { name: "Dashboard Overview", path: "/seller/dashboard", icon: "📊" },
    { name: "My Products", path: "/seller/products", icon: "📦" },
    { name: "Add New Product", path: "/seller/products/new", icon: "➕" },
    { name: "Orders", path: "/seller/orders", icon: "🛍️" },
    { name: "Inventory Management", path: "/seller/inventory", icon: "📋" },
    { name: "Sales Analytics", path: "/seller/analytics", icon: "📈" },
    { name: "Store Profile", path: "/seller/profile", icon: "🏪" },
    { name: "Settings", path: "/seller/settings", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-800">
      {/* Mobile Top Header */}
      <div className="flex md:hidden items-center justify-between bg-white px-4 py-3 border-b border-slate-200">
        <Link to="/seller/dashboard" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-black text-white">
            S
          </span>
          <span className="font-bold text-slate-900 text-base">
            ShopSphere <span className="text-xs text-indigo-600 font-semibold">Seller</span>
          </span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          mobileMenuOpen ? "block" : "hidden"
        } md:block w-full md:w-64 bg-slate-950 p-5 text-white flex flex-col justify-between shrink-0 md:min-h-screen`}
      >
        <div>
          {/* Logo and Store Info */}
          <div className="hidden md:flex items-center gap-2.5 pb-6 border-b border-slate-800">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 font-black text-white text-base shadow-lg shadow-indigo-600/30">
              S
            </span>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">ShopSphere</h1>
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                Seller Center
              </span>
            </div>
          </div>

          {/* Store Quick Card */}
          <div className="my-5 rounded-xl bg-slate-900 p-3.5 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Store Name</span>
              {seller && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    seller.status === "APPROVED"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : seller.status === "REJECTED"
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {seller.status}
                </span>
              )}
            </div>
            <p className="mt-1 font-semibold text-white text-sm truncate">
              {seller?.storeName || user?.name || "My Store"}
            </p>
            <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/seller/dashboard"}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "text-slate-300 hover:text-white hover:bg-slate-900"
                  }`
                }
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="pt-6 border-t border-slate-800 space-y-2.5">
          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-850 hover:text-white border border-slate-800 transition"
          >
            <span>Visit Storefront ↗</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition"
          >
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-100">
        {/* Verification Alert Banner if not APPROVED */}
        {seller && seller.status !== "APPROVED" && (
          <div
            className={`px-6 py-3 text-xs font-medium border-b flex items-center justify-between ${
              seller.status === "REJECTED"
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-amber-50 border-amber-200 text-amber-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>
                {seller.status === "PENDING" &&
                  "Your seller account is currently under administrator review. You can set up your store profile and prepare products. Listings will be visible to buyers once approved."}
                {seller.status === "REJECTED" &&
                  `Account verification note: "${seller.rejectionReason || "Please verify your details"}". Update your profile and contact admin.`}
                {seller.status === "SUSPENDED" &&
                  "Your seller account has been temporarily suspended. Please contact platform support."}
              </span>
            </div>
            <Link
              to="/seller/profile"
              className="underline font-bold hover:text-slate-900 ml-4 shrink-0"
            >
              Review Profile →
            </Link>
          </div>
        )}

        {/* Dashboard Top Header Bar */}
        <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Seller Workspace</h2>
            <p className="text-xs text-slate-500">
              Signed in as <strong className="text-slate-700">{user?.name}</strong> ({seller?.storeName || "Store"})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-indigo-50 border border-indigo-200/60 px-3 py-1 text-xs font-semibold text-indigo-700">
              Merchant Mode
            </span>
          </div>
        </header>

        <div className="flex-1 p-5 md:p-8 overflow-y-auto">
          <Outlet context={{ seller, setSeller }} />
        </div>
      </main>
    </div>
  );
}
