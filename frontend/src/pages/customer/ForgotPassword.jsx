import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/forgot-password", {
        email: trimmedEmail,
      });

      setSubmitted(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to request password reset. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg border border-slate-100">
        <Link to="/" className="mb-8 block text-center text-3xl font-bold">
          Shop<span className="text-indigo-600">Sphere</span>
        </Link>

        {submitted ? (
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <svg
                className="w-7 h-7"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900">
              Check your email
            </h1>

            <p className="text-sm text-gray-600 leading-relaxed">
              If an account exists for{" "}
              <strong className="text-slate-900">{email}</strong>, we have sent a
              secure link to reset your password. The link will expire in 15 minutes.
            </p>

            <div className="pt-4 space-y-3">
              <Link
                to="/login"
                className="block w-full rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition"
              >
                Back to Login
              </Link>

              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setEmail("");
                }}
                className="w-full text-center text-xs text-slate-500 hover:text-indigo-600 font-medium transition"
              >
                Try with a different email address
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Forgot your password?
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            {error && (
              <p
                role="alert"
                className="mt-5 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                <span>{loading ? "Sending reset link..." : "Send Reset Link"}</span>
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              Remember your password?{" "}
              <Link
                to="/login"
                className="font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Sign in
              </Link>
            </div>

            <p className="mt-4 text-center text-sm">
              <Link to="/" className="text-gray-500 hover:text-indigo-600">
                ← Back to ShopSphere
              </Link>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
