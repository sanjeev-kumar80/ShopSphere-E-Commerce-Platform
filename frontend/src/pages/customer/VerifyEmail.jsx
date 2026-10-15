import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";

function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState("verifying"); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState({ loading: false, message: "", error: "" });

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token was provided.");
      return;
    }

    const performVerification = async () => {
      try {
        const response = await api.get(`/auth/verify-email/${token}`);
        setStatus("success");
        setMessage(
          response.data?.message ||
            "Your email has been verified successfully! You can now log in to ShopSphere."
        );
      } catch (err) {
        setStatus("error");
        setMessage(
          err.response?.data?.message ||
            "The verification link is invalid or has expired. Please request a new one."
        );
      }
    };

    performVerification();
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail.trim()) {
      setResendStatus({ loading: false, message: "", error: "Please enter your email address." });
      return;
    }

    setResendStatus({ loading: true, message: "", error: "" });
    try {
      const response = await api.post("/auth/resend-verification", {
        email: resendEmail.trim(),
      });
      setResendStatus({
        loading: false,
        message:
          response.data?.message ||
          "If an account exists, a new verification email has been sent.",
        error: "",
      });
    } catch (err) {
      setResendStatus({
        loading: false,
        message: "",
        error:
          err.response?.data?.message ||
          "Failed to resend verification email. Please try again.",
      });
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
        <div className="text-center">
          <Link to="/" className="inline-block text-3xl font-extrabold tracking-tight">
            Shop<span className="text-indigo-600">Sphere</span>
          </Link>
        </div>

        {status === "verifying" && (
          <div className="mt-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
              <svg
                className="h-7 w-7 animate-spin text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                ></path>
              </svg>
            </div>
            <h2 className="mt-5 text-xl font-bold text-gray-900">
              Verifying your email...
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Please wait while we confirm your account details.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="mt-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-5 text-2xl font-bold text-gray-900">
              Account Verified! 🎉
            </h2>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">
              {message}
            </p>
            <div className="mt-7">
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition"
              >
                Proceed to Login
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="mt-8">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="mt-5 text-xl font-bold text-gray-900">
                Verification Failed
              </h2>
              <p className="mt-2 text-sm text-gray-600">{message}</p>
            </div>

            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
              <h3 className="text-sm font-semibold text-gray-800">
                Need a new verification link?
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Enter your registered email address below and we'll send you a fresh link.
              </p>

              {resendStatus.message && (
                <p className="mt-3 rounded-lg bg-green-50 p-2.5 text-xs font-medium text-green-800">
                  {resendStatus.message}
                </p>
              )}

              {resendStatus.error && (
                <p className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs font-medium text-red-700">
                  {resendStatus.error}
                </p>
              )}

              <form onSubmit={handleResend} className="mt-4 space-y-3">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={resendStatus.loading}
                  className="w-full rounded-lg bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {resendStatus.loading ? "Sending..." : "Resend Verification Email"}
                </button>
              </form>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
              >
                &larr; Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default VerifyEmail;
