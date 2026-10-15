import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../../services/api";

export default function ResetPassword() {
  const { token: paramToken } = useParams();
  const [searchParams] = useSearchParams();
  const token = paramToken || searchParams.get("token") || "";

  const navigate = useNavigate();

  const [tokenStatus, setTokenStatus] = useState(() => (token ? "checking" : "missing"));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) return;

    let active = true;

    api
      .get(`/auth/reset-password/${token}`)
      .then(() => {
        if (active) {
          setTokenStatus("valid");
        }
      })
      .catch((err) => {
        if (active) {
          setTokenStatus("invalid");
          setError(
            err.response?.data?.message ||
              "This password reset link is invalid or has expired."
          );
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Please enter a new password.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await api.post(`/auth/reset-password/${token}`, {
        password,
      });

      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to reset password. The link may have expired."
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

        {tokenStatus === "checking" ? (
          <div className="py-10 text-center space-y-3">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            <p className="text-sm font-medium text-slate-600">
              Verifying your reset link...
            </p>
          </div>
        ) : tokenStatus === "missing" || tokenStatus === "invalid" ? (
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
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
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900">
              Invalid or Expired Link
            </h1>

            <p className="text-sm text-gray-600">
              {error ||
                "This password reset link is invalid, incomplete, or has already expired."}
            </p>

            <div className="pt-3 space-y-3">
              <Link
                to="/forgot-password"
                className="block w-full rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition"
              >
                Request New Reset Link
              </Link>

              <Link
                to="/login"
                className="block text-center text-xs font-semibold text-slate-600 hover:text-indigo-600 transition"
              >
                Back to Login
              </Link>
            </div>
          </div>
        ) : success ? (
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
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900">
              Password Reset Successful
            </h1>

            <p className="text-sm text-gray-600">
              Your password has been securely updated. You can now log in with your
              new password.
            </p>

            <button
              type="button"
              onClick={() => navigate("/login", { replace: true })}
              className="mt-4 block w-full rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition"
            >
              Sign In to Your Account
            </button>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Set New Password
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Please enter your new password below.
            </p>

            {error && (
              <p
                role="alert"
                className="mt-5 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  New Password <span className="text-xs text-slate-400 font-normal">(min. 8 characters)</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-11 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
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
                <span>{loading ? "Updating password..." : "Reset Password"}</span>
              </button>
            </form>

            <p className="mt-5 text-center text-sm">
              <Link to="/login" className="text-gray-500 hover:text-indigo-600">
                ← Back to Login
              </Link>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
