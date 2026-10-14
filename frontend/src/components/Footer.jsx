import { Link } from "react-router-dom";
import { TruckIcon, ShieldCheckIcon, RotateCcwIcon, SparklesIcon } from "./Icons";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      {/* Trust & Guarantee Banner */}
      <div className="border-b border-slate-100 bg-slate-50/50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <TruckIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Free Express Delivery</h4>
                <p className="text-xs text-slate-500">On all prepaid orders over ₹499</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <ShieldCheckIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">100% Secure Checkout</h4>
                <p className="text-xs text-slate-500">Razorpay verified encryption</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <RotateCcwIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">7-Day Easy Returns</h4>
                <p className="text-xs text-slate-500">Hassle-free replacement policy</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                <SparklesIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Original & Authentic</h4>
                <p className="text-xs text-slate-500">Curated genuine brands</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2 text-2xl font-black text-slate-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white text-lg">
                S
              </span>
              <span>
                Shop<span className="text-indigo-600">Sphere</span>
              </span>
            </Link>
            <p className="text-sm text-slate-600 max-w-sm leading-relaxed">
              Your premier destination for high-quality electronics, modern fashion, and everyday essentials. Discover curated products with unmatched speed and support.
            </p>
            <div className="pt-2">
              <p className="text-xs font-semibold text-slate-900">Subscribe for exclusive deals & drops</p>
              <form onSubmit={(e) => e.preventDefault()} className="mt-2 flex max-w-sm gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-indigo-600 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Join
                </button>
              </form>
            </div>
          </div>

          {/* Catalog Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Catalog</h4>
            <ul className="mt-4 space-y-2.5 text-xs text-slate-600">
              <li>
                <Link to="/shop" className="hover:text-indigo-600 transition">All Products</Link>
              </li>
              <li>
                <Link to="/shop?sort=newest" className="hover:text-indigo-600 transition">New Arrivals</Link>
              </li>
              <li>
                <Link to="/shop?featured=true" className="hover:text-indigo-600 transition">Featured Picks</Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-indigo-600 transition">My Wishlist</Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Customer Care</h4>
            <ul className="mt-4 space-y-2.5 text-xs text-slate-600">
              <li>
                <Link to="/orders" className="hover:text-indigo-600 transition">Track Your Order</Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-indigo-600 transition">Shopping Cart</Link>
              </li>
              <li>
                <a href="#shipping" className="hover:text-indigo-600 transition">Shipping Rates</a>
              </li>
              <li>
                <a href="#returns" className="hover:text-indigo-600 transition">Return Policy</a>
              </li>
            </ul>
          </div>

          {/* Account & Company */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Account</h4>
            <ul className="mt-4 space-y-2.5 text-xs text-slate-600">
              <li>
                <Link to="/login" className="hover:text-indigo-600 transition">Sign In</Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-indigo-600 transition">Create Account</Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-indigo-600 transition">Merchant Portal</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} ShopSphere Inc. All rights reserved. Built with pride.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
            <span>•</span>
            <span>Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
