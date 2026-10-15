import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../../services/api";

export default function VerifyEmail() {
  const { token: paramToken } = useParams();
  const [searchParams] = useSearchParams();
  const token = paramToken || searchParams.get("token") || "";

  const navigate = useNavigate();

  const [status, setStatus] = useState(() => (token ? "verifying" : "idle"));
  const [error, setError] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState("");
  const [resendError, setResendError] = useState("");

  useEffect(() => {
    if (!token) return;

    let active = true;

    api
      .get(`/auth/verify-email/${token}`)
      .then(() => {
        if (active) {
          setStatus("success");
        }
      })
      .catch((err) => {
        if (active) {
          setStatus("failed");
          setError(
            err.response?.data?.message ||
              "Email verification link is invalid or has expired."
          );
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    setResendError("");
    setResendSuccess("");

    const trimmed = resendEmail.trim();
    if (!trimmed) {
      setResendError("Please enter your registered email address.");
      return;
    }

    setResending(true);

    try {
      const res = await api.post("/auth/resend-verification", {
        email: trimmed,
      });

      setResendSuccess(
        res.data?.message ||
          "If an account exists, a new verification email has been sent."
      );
      setResendEmail("");
    } catch (err) {
      setResendError(
        err.response?.data?.message ||
          "Failed to resend verification email. Please try again."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg border border-slate-100">
        <Link to="/" className="mb-8 block text-center text-3xl font-bold">
          Shop<span className="text-indigo-600">Sphere</span>
        </Link>

        {status === "verifying" ? (
          <div className="py-10 text-center space-y-3">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            <h1 className="text-xl font-bold text-slate-800">
              Verifying your email...
            </h1>
            <p className="text-xs text-slate-500">
              Please wait while we confirm your email address.
            </p>
          </div>
        ) : status === "success" ? (
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
              Email Verified!
            </h1>

            <p className="text-sm text-gray-600">
              Your email address has been verified successfully. You now have full
              access to ShopSphere.
            </p>

            <div className="pt-3 space-y-2">
              <button
                type="button"
                onClick={() => navigate("/login", { replace: true })}
                className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition"
              >
                Continue to Login
              </button>

              <Link
                to="/shop"
                className="block text-center text-xs font-semibold text-slate-600 hover:text-indigo-600 transition pt-1"
              >
                Browse Products
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="text-center space-y-2">
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
                {status === "failed" ? "Verification Failed" : "Verify Your Email"}
              </h1>

              <p className="text-sm text-gray-600">
                {error ||
                  "Please verify your email address to unlock all account capabilities."}
              </p>
            </div>

            {/* Resend Verification Form */}
            <div className="border-t border-slate-100 pt-4">
              <h2 className="text-sm font-semibold text-slate-800 mb-1">
                Resend Verification Link
              </h2>
              <p className="text-xs text-slate-500 mb-3">
                Enter your account email to receive a new verification link.
              </p>

              {resendError && (
                <p className="mb-3 rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
                  {resendError}
                </p>
              )}

              {resendSuccess && (
                <p className="mb-3 rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800">
                  {resendSuccess}
                </p>
              )}

              <form onSubmit={handleResend} className="space-y-3">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="yourname@example.com"
                  required
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />

                <button
                  type="submit"
                  disabled={resending}
                  className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {resending && (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  <span>{resending ? "Sending..." : "Resend Verification Email"}</span>
                </button>
              </form>
            </div>

            <div className="text-center pt-2">
              <Link to="/login" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                ← Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
