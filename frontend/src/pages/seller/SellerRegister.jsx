import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function SellerRegister() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: "",
    storeName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    businessCategory: "Electronics & Gadgets",
    businessDescription: "",
    gstin: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const categories = [
    "Electronics & Gadgets",
    "Fashion & Apparel",
    "Footwear & Bags",
    "Home & Living",
    "Sports & Fitness",
    "Beauty & Personal Care",
    "Books & Stationery",
    "General Retail",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: form.name.trim(),
        storeName: form.storeName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        businessAddress: {
          street: form.street.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          pincode: form.pincode.trim(),
          country: "India",
        },
        businessCategory: form.businessCategory,
        businessDescription: form.businessDescription.trim(),
        gstin: form.gstin.trim(),
      };

      const res = await api.post("/seller/register", payload);

      if (res.data?.success) {
        const { accessToken, user } = res.data.data;
        login(accessToken, user);
        setSuccess(true);
        setTimeout(() => {
          navigate("/seller/dashboard");
        }, 1500);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Registration failed. Please verify your details."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-black text-white shadow-md shadow-indigo-600/30">
              S
            </span>
            <span className="text-2xl font-black text-slate-900">
              Shop<span className="text-indigo-600">Sphere</span>
            </span>
          </Link>
        </div>

        <h1 className="mt-5 text-center text-3xl font-black text-slate-900">
          Become a ShopSphere Seller
        </h1>
        <p className="mt-2 text-center text-xs text-slate-500 max-w-md mx-auto">
          Start your multi-vendor storefront on ShopSphere. Reach thousands of customers nationwide.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="rounded-3xl bg-white p-7 sm:p-10 shadow-xl border border-slate-200/80">
          {error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700">
              🎉 Seller account registered successfully! Redirecting to your Dashboard...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border-b border-slate-100 pb-5">
              <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                1. Account Credentials
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@store.com"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password (min 8 chars) *
                  </label>
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
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
                  />
                </div>
              </div>
            </div>

            <div className="border-b border-slate-100 pb-5">
              <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                2. Store & Business Information
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Store / Business Name *
                  </label>
                  <input
                    type="text"
                    name="storeName"
                    required
                    value={form.storeName}
                    onChange={handleChange}
                    placeholder="e.g. Apex Electronics Hub"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Business Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 9876543210"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Category *
                  </label>
                  <select
                    name="businessCategory"
                    value={form.businessCategory}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GSTIN (Optional)
                  </label>
                  <input
                    type="text"
                    name="gstin"
                    value={form.gstin}
                    onChange={handleChange}
                    placeholder="22AAAAA0000A1Z5"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs uppercase text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Business Description
                  </label>
                  <textarea
                    name="businessDescription"
                    rows={2}
                    value={form.businessDescription}
                    onChange={handleChange}
                    placeholder="Describe the products you specialize in..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                3. Business Address
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Street / Warehouse Address
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={form.street}
                    onChange={handleChange}
                    placeholder="Shop #12, Commercial Market"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Mumbai"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    placeholder="Maharashtra"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={form.pincode}
                    onChange={handleChange}
                    placeholder="400001"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition"
            >
              {loading ? "Registering Store..." : "Register & Open Seller Dashboard"}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">
            Already have a seller account?{" "}
            <Link
              to="/seller/login"
              className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              Log in here
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
