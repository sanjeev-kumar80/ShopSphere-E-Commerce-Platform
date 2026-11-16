import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function AdminLogin() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return <div className="p-8">Checking session...</div>;
  }

  if (user && ["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const { user: userData, accessToken } = response.data.data;

      if (!["ADMIN", "SUPER_ADMIN"].includes(userData.role)) {
        setError("You do not have admin access.");
        return;
      }

      login(accessToken, userData);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      console.log("Login error:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-lg"
      >
        <Link
          to="/"
          className="absolute right-8 top-8 text-sm font-medium text-slate-600 hover:text-indigo-600"
        >
          ← Back to Store
        </Link>

        <Link to="/" className="text-2xl font-bold text-indigo-600">
          ShopSphere
        </Link>

        <h1 className="mt-6 text-2xl font-bold text-slate-900">
          Admin Login
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Sign in to manage your store.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <label className="mt-6 block text-sm font-medium">
          Email address
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@shopsphere.com"
          className="mt-2 w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-indigo-600"
        />

        <label className="mt-4 block text-sm font-medium">
          Password
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="mt-2 w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-indigo-600"
        />

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? "Signing in..." : "Sign In to Admin"}
        </button>

        {/* Quick-links for Seller Portal */}
        <div className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-400">
          <span>
            Seller?{" "}
            <Link to="/seller/login" className="font-medium text-indigo-600 hover:underline">
              Seller Login
            </Link>{" "}
            •{" "}
            <Link to="/seller/register" className="font-medium text-indigo-600 hover:underline">
              Register Store
            </Link>
          </span>
        </div>
      </form>
    </main>
  );
}
