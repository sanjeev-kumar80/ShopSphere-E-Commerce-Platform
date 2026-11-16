import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

function CustomerLogin() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: form.email.trim(),
        password: form.password,
      });

      const { user, accessToken } = response.data.data;

      if (user.role === "SELLER") {
        login(accessToken, user);
        navigate("/seller/dashboard", { replace: true });
        return;
      }

      if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
        login(accessToken, user);
        navigate("/admin/dashboard", { replace: true });
        return;
      }

      // Customer role
      login(accessToken, user);
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <Link
          to="/"
          className="mb-8 block text-center text-3xl font-bold"
        >
          Shop<span className="text-indigo-600">Sphere</span>
        </Link>

        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back!
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Login to continue shopping.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium"
            >
              Email address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium"
              >
                Password
              </label>

              <Link
                to="/forgot-password"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Forgot password?
              </Link>
            </div>

            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Create account
          </Link>
        </p>

        <p className="mt-4 text-center text-sm">
          <Link
            to="/"
            className="text-gray-500 hover:text-indigo-600"
          >
            ← Back to ShopSphere
          </Link>
        </p>

        {/* Seller & Admin portal quick-links */}
        <div className="mt-6 border-t border-gray-100 pt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
          <span>
            Seller?{" "}
            <Link to="/seller/login" className="font-medium text-indigo-600 hover:underline">
              Seller Login
            </Link>{" "}
            •{" "}
            <Link to="/seller/register" className="font-medium text-indigo-600 hover:underline">
              Register
            </Link>
          </span>
          <span>|</span>
          <span>
            Admin?{" "}
            <Link to="/admin/login" className="font-medium text-gray-500 hover:text-gray-700 underline">
              Admin Login
            </Link>
          </span>
        </div>
      </div>
    </main>
  );
}

export default CustomerLogin;
