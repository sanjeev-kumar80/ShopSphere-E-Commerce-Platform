import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../../services/api";

export default function SellerProfile() {
  const { seller, setSeller } = useOutletContext();
  const [form, setForm] = useState({
    storeName: "",
    phone: "",
    businessCategory: "",
    businessDescription: "",
    gstin: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    logoUrl: "",
    bannerUrl: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (seller) {
      setForm({
        storeName: seller.storeName || "",
        phone: seller.phone || "",
        businessCategory: seller.businessCategory || "General Retail",
        businessDescription: seller.businessDescription || "",
        gstin: seller.gstin || "",
        street: seller.businessAddress?.street || "",
        city: seller.businessAddress?.city || "",
        state: seller.businessAddress?.state || "",
        pincode: seller.businessAddress?.pincode || "",
        logoUrl: seller.logo?.url || "",
        bannerUrl: seller.banner?.url || "",
      });
    }
  }, [seller]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setLoading(true);

      const payload = {
        storeName: form.storeName.trim(),
        phone: form.phone.trim(),
        businessCategory: form.businessCategory,
        businessDescription: form.businessDescription.trim(),
        gstin: form.gstin.trim(),
        businessAddress: {
          street: form.street.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          pincode: form.pincode.trim(),
          country: "India",
        },
        logo: form.logoUrl ? { url: form.logoUrl.trim(), publicId: "logo" } : undefined,
        banner: form.bannerUrl ? { url: form.bannerUrl.trim(), publicId: "banner" } : undefined,
      };

      const res = await api.put("/seller/profile", payload);
      setSeller(res.data?.data?.seller);
      setSuccess("Store profile updated successfully!");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update store profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Store Profile & Verification</h1>
          <p className="text-xs text-slate-500 mt-1">
            Update store branding, business address, and regulatory details.
          </p>
        </div>

        {seller && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              seller.status === "APPROVED"
                ? "bg-emerald-100 text-emerald-800"
                : seller.status === "REJECTED"
                ? "bg-rose-100 text-rose-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            Verification: {seller.status}
          </span>
        )}
      </div>

      {seller?.status === "REJECTED" && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <strong className="block font-bold mb-1">Feedback from Admin:</strong>
          {seller.rejectionReason || "Please verify your GSTIN or business address and resubmit."}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-700">
          ✓ {success}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700">
          ✕ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider border-b border-slate-100 pb-3">
            Branding & Assets
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Store Logo URL</label>
              <input
                type="url"
                name="logoUrl"
                value={form.logoUrl}
                onChange={handleChange}
                placeholder="https://example.com/logo.png"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
              />
              {form.logoUrl && (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={form.logoUrl}
                    alt="Logo preview"
                    className="h-10 w-10 rounded-lg object-cover border border-slate-200"
                  />
                  <span className="text-[11px] text-slate-500">Logo Preview</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Store Banner URL</label>
              <input
                type="url"
                name="bannerUrl"
                value={form.bannerUrl}
                onChange={handleChange}
                placeholder="https://example.com/banner.jpg"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
              />
              {form.bannerUrl && (
                <div className="mt-2">
                  <img
                    src={form.bannerUrl}
                    alt="Banner preview"
                    className="h-14 w-full rounded-lg object-cover border border-slate-200"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider border-b border-slate-100 pb-3">
            Store & Tax Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Store Name *</label>
              <input
                type="text"
                name="storeName"
                required
                value={form.storeName}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Business Phone *</label>
              <input
                type="text"
                name="phone"
                required
                value={form.phone}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Business Category</label>
              <input
                type="text"
                name="businessCategory"
                value={form.businessCategory}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN / Tax ID</label>
              <input
                type="text"
                name="gstin"
                value={form.gstin}
                onChange={handleChange}
                placeholder="22AAAAA0000A1Z5"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs uppercase text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Store Description</label>
              <textarea
                name="businessDescription"
                rows={3}
                value={form.businessDescription}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider border-b border-slate-100 pb-3">
            Business Address & Fulfillment Location
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Street / Warehouse Address</label>
              <input
                type="text"
                name="street"
                value={form.street}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
              <input
                type="text"
                name="state"
                value={form.state}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
              <input
                type="text"
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition"
          >
            {loading ? "Saving Profile..." : "Save Store Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
