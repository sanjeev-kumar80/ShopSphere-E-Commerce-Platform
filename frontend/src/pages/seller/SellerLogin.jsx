import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function SellerLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      const res = await api.post("/auth/login", {
        email: form.email.trim(),
        password: form.password,
      });

      const { accessToken, user } = res.data.data;

      if (user.role !== "SELLER") {
        setError("This portal is exclusively for registered sellers. Please sign in with a seller account.");
        setLoading(false);
        return;
      }

      login(accessToken, user);
      navigate("/seller/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 sm:p-10 shadow-xl border border-slate-200/80">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-black text-white shadow-md shadow-indigo-600/30">
              S
            </span>
            <span className="text-2xl font-black text-slate-900">
              Shop<span className="text-indigo-600">Sphere</span>
            </span>
          </Link>
          <span className="mt-2 block text-xs font-bold uppercase tracking-wider text-indigo-600">
            Seller Portal
          </span>
        </div>

        <h1 className="mt-6 text-2xl font-bold text-slate-900">
          Seller Sign In
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Manage your products, process customer orders, and view sales performance.
        </p>

        {error && (
          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Seller Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="seller@store.com"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              name="password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition"
          >
            {loading ? "Authenticating..." : "Sign In to Seller Dashboard"}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">
          Want to start selling on ShopSphere?{" "}
          <Link
            to="/seller/register"
            className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            Register your store
          </Link>
        </div>
      </div>
    </main>
  );
}
