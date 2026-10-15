import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";
import api from "../services/api";
import {
  CartIcon,
  HeartIcon,
  SearchIcon,
  UserIcon,
  ChevronDownIcon,
  CloseIcon,
  SparklesIcon,
} from "./Icons";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount, wishlistCount } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchInput, setSearchInput] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const categoryRef = useRef(null);
  const accountRef = useRef(null);

  // Sync search input with URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchInput(params.get("search") || "");
  }, [location.search]);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setCategoryDropdownOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch categories for dropdown
  useEffect(() => {
    let cancelled = false;
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories");
        const list = res.data.data?.categories || [];
        if (!cancelled) setCategories(list);
      } catch (err) {
        console.warn("Failed to fetch nav categories:", err.message);
      }
    };
    fetchCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchInput.trim();
    setMobileMenuOpen(false);
    if (query) {
      navigate(`/shop?search=${encodeURIComponent(query)}`);
    } else {
      navigate("/shop");
    }
  };

  const handleLogout = async () => {
    setAccountDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      {/* Top micro-announcement banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 px-4 py-1.5 text-center text-xs font-medium text-white/90">
        <span className="inline-flex items-center gap-1.5">
          <SparklesIcon className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>Free Express Delivery on orders over ₹499 • Use code <strong>SHOPSPHERE</strong> for 10% off</span>
        </span>
      </div>

      {/* Main Navbar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          to="/"
          className="group flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-slate-900 transition hover:opacity-90"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20 transition-transform group-hover:scale-105">
            <span className="text-xl font-black">S</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xl font-bold text-slate-900">
              Shop<span className="text-indigo-600">Sphere</span>
            </span>
            <span className="-mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Storefront
            </span>
          </div>
        </Link>

        {/* Search Bar - Desktop */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 max-w-lg items-center relative"
        >
          <div className="relative w-full">
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products, brands, essentials..."
              className="w-full rounded-full border border-slate-200 bg-slate-50/80 pl-11 pr-24 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-inner transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
            />
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <SearchIcon className="w-4 h-4" />
            </div>
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 active:scale-95 shadow-sm shadow-indigo-600/30"
            >
              Search
            </button>
          </div>
        </form>

        {/* Action icons: Wishlist, Cart, Account */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Wishlist Link */}
          <Link
            to="/wishlist"
            aria-label="Wishlist"
            className="group relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100 active:scale-95"
          >
            <HeartIcon className="w-5 h-5 transition group-hover:text-red-500" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white shadow-sm ring-2 ring-white animate-in zoom-in">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Link */}
          <Link
            to="/cart"
            aria-label="Shopping Cart"
            className="group relative flex items-center gap-2 rounded-xl bg-slate-100/80 px-3 py-2 text-slate-800 transition hover:bg-indigo-50 hover:text-indigo-600 active:scale-95"
          >
            <div className="relative">
              <CartIcon className="w-5 h-5 transition group-hover:scale-110" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-in zoom-in">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </div>
            <span className="hidden font-semibold text-xs sm:inline">Cart</span>
          </Link>

          {/* Account Menu */}
          <div className="relative" ref={accountRef}>
            {user ? (
              <button
                type="button"
                onClick={() => setAccountDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs uppercase">
                  {user.name ? user.name[0] : "U"}
                </div>
                <span className="max-w-[90px] truncate hidden sm:inline">
                  {user.name?.split(" ")[0]}
                </span>
                <ChevronDownIcon
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    accountDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-95"
              >
                <UserIcon className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Account Dropdown */}
            {accountDropdownOpen && user && (
              <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2">
                <div className="border-b border-slate-100 px-3 py-2.5">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {user.email}
                  </p>
                  <span className="mt-1 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">
                    Role: {user.role || "Customer"}
                  </span>
                </div>

                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setAccountDropdownOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    👤 My Profile & Addresses
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setAccountDropdownOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    📦 My Orders
                  </Link>
                  <Link
                    to="/wishlist"
                    onClick={() => setAccountDropdownOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    ❤️ My Wishlist ({wishlistCount})
                  </Link>

                  {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setAccountDropdownOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-lg bg-indigo-50/70 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                    >
                      ⚡ Admin Dashboard
                    </Link>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    🚪 Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="flex h-10 w-10 md:hidden items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <CloseIcon className="w-6 h-6" />
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Subnav links & Category Dropdown */}
      <nav className="border-t border-slate-100 bg-slate-50/60 hidden md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs font-medium text-slate-600 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            {/* Category Dropdown */}
            <div className="relative" ref={categoryRef}>
              <button
                type="button"
                onClick={() => setCategoryDropdownOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 font-semibold text-slate-800 shadow-sm border border-slate-200 hover:bg-slate-50"
              >
                <span>All Categories</span>
                <ChevronDownIcon
                  className={`w-3.5 h-3.5 transition-transform ${
                    categoryDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {categoryDropdownOpen && (
                <div className="absolute left-0 z-50 mt-1.5 w-60 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in">
                  <div className="max-h-64 overflow-y-auto py-1">
                    <Link
                      to="/shop"
                      onClick={() => setCategoryDropdownOpen(false)}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                    >
                      <span>Explore All Products</span>
                      <span>→</span>
                    </Link>
                    {categories.length > 0 ? (
                      categories.map((cat) => (
                        <Link
                          key={cat._id}
                          to={`/shop?category=${cat._id}`}
                          onClick={() => setCategoryDropdownOpen(false)}
                          className="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-100"
                        >
                          <span className="capitalize">{cat.name}</span>
                          <span className="text-[10px] text-slate-400">View</span>
                        </Link>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-xs text-slate-400">
                        No categories found
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/shop"
              className={`hover:text-indigo-600 transition ${
                location.pathname === "/shop" && !location.search
                  ? "text-indigo-600 font-semibold"
                  : ""
              }`}
            >
              Shop All
            </Link>
            <Link
              to="/shop?sort=newest"
              className="hover:text-indigo-600 transition"
            >
              New Arrivals
            </Link>
            <Link
              to="/shop?inStock=true"
              className="hover:text-indigo-600 transition"
            >
              In Stock Deals
            </Link>
            <Link
              to="/orders"
              className="hover:text-indigo-600 transition"
            >
              Track Orders
            </Link>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span className="inline-flex items-center gap-1 text-[11px]">
              🔒 100% Verified Merchant
            </span>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden shadow-lg animate-in slide-in-from-top duration-200">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="mb-4">
            <div className="relative">
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search products..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-20 py-2.5 text-sm"
              />
              <SearchIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white"
              >
                Search
              </button>
            </div>
          </form>

          <div className="space-y-1">
            <Link
              to="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2 font-medium text-slate-800 hover:bg-slate-100"
            >
              Shop All Products
            </Link>
            <Link
              to="/wishlist"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-2 font-medium text-slate-800 hover:bg-slate-100"
            >
              <span>Wishlist</span>
              {wishlistCount > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link
              to="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-2 font-medium text-slate-800 hover:bg-slate-100"
            >
              <span>My Cart</span>
              {cartCount > 0 && (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-600">
                  {cartCount}
                </span>
              )}
            </Link>
            {user && (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 font-medium text-slate-800 hover:bg-slate-100"
                >
                  My Profile & Addresses
                </Link>
                <Link
                  to="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 font-medium text-slate-800 hover:bg-slate-100"
                >
                  My Orders
                </Link>
              </>
            )}

            {/* Category listing on mobile */}
            {categories.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <p className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Categories
                </p>
                <div className="grid grid-cols-2 gap-1 pt-1">
                  {categories.slice(0, 6).map((cat) => (
                    <Link
                      key={cat._id}
                      to={`/shop?category=${cat._id}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-lg px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 capitalize"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100">
              {user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Sign Out ({user.name})
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-800"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
