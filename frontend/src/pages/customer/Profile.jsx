import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import {
  CheckIcon,
  CloseIcon,
} from "../../components/Icons";

const initialAddressState = {
  fullName: "",
  phone: "",
  addressLine: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  addressType: "HOME",
  isDefault: false,
};

export default function Profile() {
  const { user, updateUser } = useAuth();

  // Profile states
  const [profileForm, setProfileForm] = useState(() => ({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  }));
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: "", text: "" });
  const [profileErrors, setProfileErrors] = useState({});

  // Address states
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addressMessage, setAddressMessage] = useState({ type: "", text: "" });
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState(initialAddressState);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressFormErrors, setAddressFormErrors] = useState({});
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Fetch addresses helper
  const fetchAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const res = await api.get("/users/addresses");
      setAddresses(res.data?.data || []);
    } catch (err) {
      setAddressMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to load addresses",
      });
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    let active = true;
    api
      .get("/users/addresses")
      .then((res) => {
        if (active) {
          setAddresses(res.data?.data || []);
          setLoadingAddresses(false);
        }
      })
      .catch((err) => {
        if (active) {
          setAddressMessage({
            type: "error",
            text: err.response?.data?.message || "Failed to load addresses",
          });
          setLoadingAddresses(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Profile validation
  const validateProfile = () => {
    const errors = {};
    const nameTrim = profileForm.name.trim();
    if (!nameTrim) {
      errors.name = "Full name is required";
    } else if (nameTrim.length < 2 || nameTrim.length > 50) {
      errors.name = "Name must be between 2 and 50 characters";
    }

    const emailTrim = profileForm.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailTrim) {
      errors.email = "Email address is required";
    } else if (!emailRegex.test(emailTrim)) {
      errors.email = "Please enter a valid email address";
    }

    const phoneTrim = profileForm.phone.trim();
    if (phoneTrim) {
      const phoneRegex = /^[+]?[\d\s-]{10,15}$/;
      if (!phoneRegex.test(phoneTrim)) {
        errors.phone = "Please enter a valid 10-15 digit phone number";
      }
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Profile submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMessage({ type: "", text: "" });

    if (!validateProfile()) {
      return;
    }

    try {
      setProfileSaving(true);
      const res = await api.put("/users/profile", {
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
      });

      const updatedUser = res.data?.data?.user;
      if (updatedUser && updateUser) {
        updateUser(updatedUser);
      }

      setProfileMessage({
        type: "success",
        text: res.data?.message || "Profile updated successfully!",
      });
      setIsEditingProfile(false);
    } catch (err) {
      setProfileMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          "Failed to update profile. Please try again.",
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleCancelProfileEdit = () => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
    setProfileErrors({});
    setIsEditingProfile(false);
  };

  // Address validation
  const validateAddress = () => {
    const errors = {};
    if (!addressForm.fullName.trim()) errors.fullName = "Full name is required";
    const phoneTrim = addressForm.phone.trim();
    if (!phoneTrim) {
      errors.phone = "Phone number is required";
    } else if (!/^[+]?[\d\s-]{10,15}$/.test(phoneTrim)) {
      errors.phone = "Enter a valid 10-15 digit phone number";
    }

    if (!addressForm.addressLine.trim()) errors.addressLine = "Street address is required";
    if (!addressForm.city.trim()) errors.city = "City is required";
    if (!addressForm.state.trim()) errors.state = "State is required";

    const pinTrim = addressForm.pincode.trim();
    if (!pinTrim) {
      errors.pincode = "Pincode is required";
    } else if (!/^\d{4,8}$/.test(pinTrim)) {
      errors.pincode = "Enter a valid postal code";
    }

    setAddressFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Open modal for add
  const handleOpenAddModal = () => {
    setEditingAddressId(null);
    setAddressForm({
      ...initialAddressState,
      isDefault: addresses.length === 0,
    });
    setAddressFormErrors({});
    setAddressMessage({ type: "", text: "" });
    setShowAddressModal(true);
  };

  // Open modal for edit
  const handleOpenEditModal = (addr) => {
    setEditingAddressId(addr._id);
    setAddressForm({
      fullName: addr.fullName || "",
      phone: addr.phone || "",
      addressLine: addr.addressLine || "",
      landmark: addr.landmark || "",
      city: addr.city || "",
      state: addr.state || "",
      pincode: addr.pincode || "",
      addressType: addr.addressType || "HOME",
      isDefault: !!addr.isDefault,
    });
    setAddressFormErrors({});
    setAddressMessage({ type: "", text: "" });
    setShowAddressModal(true);
  };

  // Save address (create or update)
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!validateAddress()) return;

    try {
      setAddressSaving(true);
      setAddressMessage({ type: "", text: "" });

      const payload = {
        fullName: addressForm.fullName.trim(),
        phone: addressForm.phone.trim(),
        addressLine: addressForm.addressLine.trim(),
        landmark: addressForm.landmark.trim(),
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        pincode: addressForm.pincode.trim(),
        addressType: addressForm.addressType,
        isDefault: addressForm.isDefault,
      };

      if (editingAddressId) {
        const res = await api.put(`/users/addresses/${editingAddressId}`, payload);
        const updated = res.data?.data;
        setAddresses((prev) =>
          prev.map((item) => {
            if (item._id === editingAddressId) return updated;
            if (payload.isDefault) return { ...item, isDefault: false };
            return item;
          })
        );
        setAddressMessage({
          type: "success",
          text: "Address updated successfully!",
        });
      } else {
        const res = await api.post("/users/addresses", payload);
        const created = res.data?.data;
        setAddresses((prev) => {
          const list = created.isDefault
            ? prev.map((a) => ({ ...a, isDefault: false }))
            : [...prev];
          return [created, ...list];
        });
        setAddressMessage({
          type: "success",
          text: "New address added successfully!",
        });
      }

      setShowAddressModal(false);
      fetchAddresses();
    } catch (err) {
      setAddressMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to save address",
      });
    } finally {
      setAddressSaving(false);
    }
  };

  // Delete address
  const handleDeleteAddress = async (id) => {
    try {
      setActionLoadingId(id);
      setAddressMessage({ type: "", text: "" });
      await api.delete(`/users/addresses/${id}`);
      setDeleteConfirmId(null);
      setAddressMessage({
        type: "success",
        text: "Address deleted successfully!",
      });
      fetchAddresses();
    } catch (err) {
      setAddressMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to delete address",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Set default address
  const handleSetDefault = async (id) => {
    try {
      setActionLoadingId(id);
      setAddressMessage({ type: "", text: "" });
      const res = await api.patch(`/users/addresses/${id}/default`);
      const updated = res.data?.data;

      setAddresses((prev) =>
        prev.map((addr) => ({
          ...addr,
          isDefault: addr._id === (updated?._id || id),
        }))
      );
      setAddressMessage({
        type: "success",
        text: "Default delivery address updated!",
      });
      fetchAddresses();
    } catch (err) {
      setAddressMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to set default address",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6 flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link to="/" className="hover:text-indigo-600 transition">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">My Profile & Addresses</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Customer Profile & Address Book
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your personal contact information and delivery destinations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ======================================================== */}
          {/* LEFT COLUMN: Customer Profile Card (4 cols on lg) */}
          {/* ======================================================== */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-lg shadow-md shadow-indigo-500/20">
                    {user?.name ? user.name[0].toUpperCase() : "U"}
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-base">
                      {user?.name || "Customer"}
                    </h2>
                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                      {user?.role === "USER" ? "Customer Account" : user?.role || "Customer"}
                    </span>
                  </div>
                </div>

                {!isEditingProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingProfile(true);
                      setProfileMessage({ type: "", text: "" });
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition active:scale-95"
                  >
                    <svg
                      className="w-3.5 h-3.5 text-slate-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                      />
                    </svg>
                    Edit
                  </button>
                )}
              </div>

              {/* Profile Alerts */}
              {profileMessage.text && (
                <div
                  className={`mt-4 rounded-xl p-3 text-xs font-medium flex items-center gap-2 ${
                    profileMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {profileMessage.type === "success" ? (
                    <CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <CloseIcon className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{profileMessage.text}</span>
                </div>
              )}

              {/* View / Edit Mode */}
              {!isEditingProfile ? (
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Full Name
                    </label>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                      {user?.name || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Email Address
                    </label>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800 truncate">
                      {user?.email || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Phone Number
                    </label>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                      {user?.phone ? (
                        user.phone
                      ) : (
                        <span className="text-slate-400 italic font-normal">
                          No phone number linked
                        </span>
                      )}
                    </p>
                  </div>

                  {user?.createdAt && (
                    <div className="border-t border-slate-100 pt-3">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Member Since
                      </label>
                      <p className="mt-0.5 text-xs text-slate-600">
                        {new Date(user.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Edit Profile Form */
                <form onSubmit={handleProfileSubmit} className="mt-5 space-y-4">
                  <div>
                    <label
                      htmlFor="profile-name"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="profile-name"
                      type="text"
                      value={profileForm.name}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, name: e.target.value })
                      }
                      placeholder="Your full name"
                      className={`mt-1 w-full rounded-xl border px-3.5 py-2 text-sm text-slate-800 transition focus:outline-none focus:ring-4 ${
                        profileErrors.name
                          ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/10"
                          : "border-slate-200 bg-slate-50/50 focus:border-indigo-500 focus:bg-white focus:ring-indigo-500/10"
                      }`}
                    />
                    {profileErrors.name && (
                      <p className="mt-1 text-xs text-rose-600">
                        {profileErrors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="profile-email"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="profile-email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, email: e.target.value })
                      }
                      placeholder="name@example.com"
                      className={`mt-1 w-full rounded-xl border px-3.5 py-2 text-sm text-slate-800 transition focus:outline-none focus:ring-4 ${
                        profileErrors.email
                          ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/10"
                          : "border-slate-200 bg-slate-50/50 focus:border-indigo-500 focus:bg-white focus:ring-indigo-500/10"
                      }`}
                    />
                    {profileErrors.email && (
                      <p className="mt-1 text-xs text-rose-600">
                        {profileErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="profile-phone"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Phone Number
                    </label>
                    <input
                      id="profile-phone"
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, phone: e.target.value })
                      }
                      placeholder="e.g. 9876543210"
                      className={`mt-1 w-full rounded-xl border px-3.5 py-2 text-sm text-slate-800 transition focus:outline-none focus:ring-4 ${
                        profileErrors.phone
                          ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/10"
                          : "border-slate-200 bg-slate-50/50 focus:border-indigo-500 focus:bg-white focus:ring-indigo-500/10"
                      }`}
                    />
                    {profileErrors.phone && (
                      <p className="mt-1 text-xs text-rose-600">
                        {profileErrors.phone}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-slate-400">
                      Used for delivery notifications and courier contact.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition active:scale-95 disabled:opacity-60"
                    >
                      {profileSaving && (
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      )}
                      <span>{profileSaving ? "Saving..." : "Save Changes"}</span>
                    </button>
                    <button
                      type="button"
                      disabled={profileSaving}
                      onClick={handleCancelProfileEdit}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition active:scale-95 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Quick Links Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">
                Quick Shortcuts
              </h3>
              <Link
                to="/orders"
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition"
              >
                <span>📦 View Order History</span>
                <span className="text-slate-400">→</span>
              </Link>
              <Link
                to="/wishlist"
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition"
              >
                <span>❤️ Saved Wishlist</span>
                <span className="text-slate-400">→</span>
              </Link>
              <Link
                to="/cart"
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition"
              >
                <span>🛒 Shopping Cart</span>
                <span className="text-slate-400">→</span>
              </Link>
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: Saved Address Book (7 cols on lg) */}
          {/* ======================================================== */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              {/* Address Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Saved Delivery Addresses
                  </h2>
                  <p className="text-xs text-slate-500">
                    {addresses.length === 1
                      ? "1 address stored in your address book"
                      : `${addresses.length} addresses stored in your address book`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition active:scale-95"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span>Add New Address</span>
                </button>
              </div>

              {/* Address Alert Banner */}
              {addressMessage.text && (
                <div
                  className={`mt-4 rounded-xl p-3 text-xs font-medium flex items-center gap-2 ${
                    addressMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {addressMessage.type === "success" ? (
                    <CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <CloseIcon className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{addressMessage.text}</span>
                </div>
              )}

              {/* Address List */}
              <div className="mt-5">
                {loadingAddresses ? (
                  <div className="py-12 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                    <p className="mt-2 text-xs text-slate-500">
                      Loading addresses...
                    </p>
                  </div>
                ) : addresses.length === 0 ? (
                  /* Empty state */
                  <div className="py-12 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                      <svg
                        className="w-7 h-7"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                        />
                      </svg>
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-slate-800">
                      No addresses saved yet
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                      Add a shipping address so you can checkout quickly when placing orders.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenAddModal}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
                    >
                      + Add Your First Address
                    </button>
                  </div>
                ) : (
                  /* Address Cards */
                  <div className="grid grid-cols-1 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr._id}
                        className={`relative rounded-2xl border p-5 transition ${
                          addr.isDefault
                            ? "border-indigo-400 bg-indigo-50/20 shadow-sm ring-1 ring-indigo-500/20"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        {/* Header Badges */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase text-slate-700">
                              {addr.addressType || "HOME"}
                            </span>

                            {addr.isDefault && (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                <CheckIcon className="w-3 h-3 text-emerald-600" />
                                <span>Default Address</span>
                              </span>
                            )}
                          </div>

                          {/* Top Actions: Set Default Button */}
                          {!addr.isDefault && (
                            <button
                              type="button"
                              disabled={actionLoadingId === addr._id}
                              onClick={() => handleSetDefault(addr._id)}
                              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition disabled:opacity-50"
                            >
                              {actionLoadingId === addr._id
                                ? "Updating..."
                                : "Set as Default"}
                            </button>
                          )}
                        </div>

                        {/* Recipient Details */}
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-slate-900">
                            {addr.fullName}
                          </h4>
                          <p className="text-xs text-slate-600 flex items-center gap-1.5">
                            <svg
                              className="w-3.5 h-3.5 text-slate-400 shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
                              />
                            </svg>
                            <span>{addr.phone}</span>
                          </p>
                          <p className="text-xs text-slate-700 leading-relaxed pt-1">
                            {addr.addressLine}
                            {addr.landmark && `, near ${addr.landmark}`}
                          </p>
                          <p className="text-xs font-semibold text-slate-800">
                            {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                        </div>

                        {/* Card Bottom Actions */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(addr)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                            >
                              <svg
                                className="w-3 h-3 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
                                />
                              </svg>
                              <span>Edit</span>
                            </button>

                            {deleteConfirmId === addr._id ? (
                              <div className="flex items-center gap-1.5 animate-in fade-in">
                                <span className="text-[11px] text-rose-600 font-semibold">
                                  Sure?
                                </span>
                                <button
                                  type="button"
                                  disabled={actionLoadingId === addr._id}
                                  onClick={() => handleDeleteAddress(addr._id)}
                                  className="rounded-lg bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-rose-700 transition"
                                >
                                  {actionLoadingId === addr._id ? "..." : "Yes, Delete"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="rounded-lg border border-slate-200 px-2 py-0.5 text-[11px] text-slate-600 hover:bg-slate-100 transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(addr._id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition"
                              >
                                <svg
                                  className="w-3 h-3 text-rose-500"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={2}
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                  />
                                </svg>
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ADDRESS MODAL (Add / Edit) */}
      {/* ======================================================== */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingAddressId ? "Edit Address" : "Add New Delivery Address"}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveAddress} className="mt-4 space-y-4">
              {/* Full Name & Phone in 2-col */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Recipient Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressForm.fullName}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, fullName: e.target.value })
                    }
                    placeholder="e.g. John Doe"
                    className={`mt-1 w-full rounded-xl border px-3.5 py-2 text-sm text-slate-800 transition focus:outline-none focus:ring-4 ${
                      addressFormErrors.fullName
                        ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/10"
                        : "border-slate-200 bg-slate-50/50 focus:border-indigo-500 focus:bg-white focus:ring-indigo-500/10"
                    }`}
                  />
                  {addressFormErrors.fullName && (
                    <p className="mt-1 text-xs text-rose-600">
                      {addressFormErrors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={addressForm.phone}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, phone: e.target.value })
                    }
                    placeholder="e.g. 9876543210"
                    className={`mt-1 w-full rounded-xl border px-3.5 py-2 text-sm text-slate-800 transition focus:outline-none focus:ring-4 ${
                      addressFormErrors.phone
                        ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/10"
                        : "border-slate-200 bg-slate-50/50 focus:border-indigo-500 focus:bg-white focus:ring-indigo-500/10"
                    }`}
                  />
                  {addressFormErrors.phone && (
                    <p className="mt-1 text-xs text-rose-600">
                      {addressFormErrors.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Address Line */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Street Address / Flat / Floor / Building <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={addressForm.addressLine}
                  onChange={(e) =>
                    setAddressForm({
                      ...addressForm,
                      addressLine: e.target.value,
                    })
                  }
                  placeholder="e.g. Flat 402, Sunset Heights, 5th Cross Road"
                  className={`mt-1 w-full rounded-xl border px-3.5 py-2 text-sm text-slate-800 transition focus:outline-none focus:ring-4 ${
                    addressFormErrors.addressLine
                      ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/10"
                      : "border-slate-200 bg-slate-50/50 focus:border-indigo-500 focus:bg-white focus:ring-indigo-500/10"
                  }`}
                />
                {addressFormErrors.addressLine && (
                  <p className="mt-1 text-xs text-rose-600">
                    {addressFormErrors.addressLine}
                  </p>
                )}
              </div>

              {/* Landmark */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Landmark <span className="text-slate-400 text-[11px]">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={addressForm.landmark}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, landmark: e.target.value })
                  }
                  placeholder="e.g. Near City Park or Behind Metro Station"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-800 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              {/* City, State, Pincode in 3-col */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, city: e.target.value })
                    }
                    placeholder="e.g. Mumbai"
                    className={`mt-1 w-full rounded-xl border px-3.5 py-2 text-sm text-slate-800 transition focus:outline-none focus:ring-4 ${
                      addressFormErrors.city
                        ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/10"
                        : "border-slate-200 bg-slate-50/50 focus:border-indigo-500 focus:bg-white focus:ring-indigo-500/10"
                    }`}
                  />
                  {addressFormErrors.city && (
                    <p className="mt-1 text-xs text-rose-600">
                      {addressFormErrors.city}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    State <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressForm.state}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, state: e.target.value })
                    }
                    placeholder="e.g. Maharashtra"
                    className={`mt-1 w-full rounded-xl border px-3.5 py-2 text-sm text-slate-800 transition focus:outline-none focus:ring-4 ${
                      addressFormErrors.state
                        ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/10"
                        : "border-slate-200 bg-slate-50/50 focus:border-indigo-500 focus:bg-white focus:ring-indigo-500/10"
                    }`}
                  />
                  {addressFormErrors.state && (
                    <p className="mt-1 text-xs text-rose-600">
                      {addressFormErrors.state}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Pincode <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressForm.pincode}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, pincode: e.target.value })
                    }
                    placeholder="e.g. 400001"
                    className={`mt-1 w-full rounded-xl border px-3.5 py-2 text-sm text-slate-800 transition focus:outline-none focus:ring-4 ${
                      addressFormErrors.pincode
                        ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/10"
                        : "border-slate-200 bg-slate-50/50 focus:border-indigo-500 focus:bg-white focus:ring-indigo-500/10"
                    }`}
                  />
                  {addressFormErrors.pincode && (
                    <p className="mt-1 text-xs text-rose-600">
                      {addressFormErrors.pincode}
                    </p>
                  )}
                </div>
              </div>

              {/* Address Type radio selectors */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Address Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["HOME", "WORK", "OTHER"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setAddressForm({ ...addressForm, addressType: type })
                      }
                      className={`rounded-xl border py-2 text-xs font-bold transition ${
                        addressForm.addressType === type
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {type === "HOME" && "🏠 Home"}
                      {type === "WORK" && "🏢 Work"}
                      {type === "OTHER" && "📍 Other"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Is Default Checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        isDefault: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Set as default delivery address
                  </span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={addressSaving}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition active:scale-95 disabled:opacity-60"
                >
                  {addressSaving && (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  <span>
                    {addressSaving
                      ? "Saving..."
                      : editingAddressId
                      ? "Update Address"
                      : "Save Address"}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={addressSaving}
                  onClick={() => setShowAddressModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition active:scale-95 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
