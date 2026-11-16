import { useState } from "react";
import api from "../../services/api";

export default function SellerSettings() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (form.newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    try {
      setSaving(true);
      await api.post("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      setMessage("Password updated successfully.");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Seller Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Account credentials, security, and marketplace seller operational standards.
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-700">
          ✓ {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700">
          ✕ {error}
        </div>
      )}

      {/* Change Password */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider border-b border-slate-100 pb-3">
          Security: Change Password
        </h3>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
            <input
              type="password"
              name="currentPassword"
              required
              value={form.currentPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                name="newPassword"
                required
                value={form.newPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                required
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition"
            >
              {saving ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>

      {/* Operational Policy & Guidelines */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3 text-xs text-slate-600">
        <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider border-b border-slate-100 pb-3">
          Marketplace Operational Guidelines
        </h3>
        <p>
          • <strong>Fulfillment SLA:</strong> Orders must be confirmed within 24 hours of placement and shipped within 48 hours to ensure customer satisfaction.
        </p>
        <p>
          • <strong>Catalog Compliance:</strong> Newly added products are reviewed by platform admins to maintain authenticity and correct categorization before being shown on the storefront.
        </p>
        <p>
          • <strong>Customer Service:</strong> Shipments are tracked via assigned delivery partners. Maintain accurate SKU stock to avoid cancellations.
        </p>
      </div>
    </div>
  );
}
