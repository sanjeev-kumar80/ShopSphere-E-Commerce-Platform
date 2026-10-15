
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
  const [isUnverified, setIsUnverified] = useState(false);
  const [resendStatus, setResendStatus] = useState({ loading: false, message: "", error: "" });
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

  const handleResend = async () => {
    const targetEmail = form.email.trim();
    if (!targetEmail) return;

    setResendStatus({ loading: true, message: "", error: "" });
    try {
      const response = await api.post("/auth/resend-verification", {
        email: targetEmail,
      });
      setResendStatus({
        loading: false,
        message: response.data?.message || "Verification email sent! Please check your inbox.",
        error: "",
      });
    } catch (err) {
      setResendStatus({
        loading: false,
        message: "",
        error: err.response?.data?.message || "Failed to resend. Please try again later.",
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsUnverified(false);
    setResendStatus({ loading: false, message: "", error: "" });
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: form.email.trim(),
        password: form.password,
      });

      const { user, accessToken } = response.data.data;

      if (user.role !== "USER") {
        setError(
          "Admin account detected. Please use the admin login portal."
        );
        return;
      }

      // Save customer session
      login(accessToken, user);

      // Redirect to the main ShopSphere homepage
      navigate("/", { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data?.emailUnverified || err.response?.status === 403) {
        setIsUnverified(true);
      }
      setError(
        data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg border border-gray-100">
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

        {isUnverified && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
            <div className="flex items-start gap-2.5">
              <span className="text-base">✉️</span>
              <div>
                <p className="font-semibold text-amber-950">Email Verification Required</p>
                <p className="mt-1 text-amber-800">
                  Please verify your email address to log in. Check your spam folder if you can't find it.
                </p>
                {resendStatus.message && (
                  <p className="mt-2 font-medium text-emerald-700">{resendStatus.message}</p>
                )}
                {resendStatus.error && (
                  <p className="mt-2 font-medium text-red-600">{resendStatus.error}</p>
                )}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendStatus.loading}
                  className="mt-2.5 inline-block font-bold text-indigo-700 underline hover:text-indigo-900 disabled:opacity-50"
                >
                  {resendStatus.loading ? "Sending link..." : "Resend Verification Email"}
                </button>
              </div>
            </div>
          </div>
        )}

        {error && !isUnverified && (
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
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium"
            >
              Password
            </label>

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

        <p className="mt-5 text-center text-xs text-gray-400">
          Admin?{" "}
          <Link to="/admin/login" className="underline">
            Admin login
          </Link>
        </p>
      </div>
    </main>
  );
}

export default CustomerLogin;
