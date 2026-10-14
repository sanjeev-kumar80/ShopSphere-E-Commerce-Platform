
import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";

const emptyForm = {
  name: "",
  slug: "",
  logo: "",
  description: "",
};

const inputClass =
  "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500";

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export default function BrandManagement() {
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadBrands = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/brands");
      setBrands(response.data?.data?.brands || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load brands."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setMessage("");
    setFormOpen(true);
  };

  const openEdit = (brand) => {
    setEditingId(brand._id);
    setForm({
      name: brand.name || "",
      slug: brand.slug || "",
      logo: brand.logo || "",
      description: brand.description || "",
    });
    setError("");
    setMessage("");
    setFormOpen(true);
  };

  const uploadLogo = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setUploading(true);
    setError("");
    setMessage("");

    try {
      const data = new FormData();
      data.append("image", file);

      const response = await api.post("/upload/product-image", data);
      const result = response.data?.data;
      const logoUrl = result?.url || result?.secure_url;

      if (!logoUrl) {
        throw new Error("Image URL was not returned by the server.");
      }

      updateField("logo", logoUrl);
      setMessage("Logo uploaded successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Logo upload failed."
      );
    } finally {
      setUploading(false);
    }
  };

  const saveBrand = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      name: form.name.trim(),
      slug: slugify(form.slug || form.name),
      logo: form.logo.trim(),
      description: form.description.trim(),
    };

    try {
      if (editingId) {
        await api.put(`/brands/${editingId}`, payload);
        setMessage("Brand updated successfully.");
      } else {
        await api.post("/brands", payload);
        setMessage("Brand created successfully.");
      }

      setFormOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadBrands();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to save brand."
      );
    } finally {
      setSaving(false);
    }
  };

  const deactivateBrand = async (brand) => {
    if (!window.confirm(`Deactivate "${brand.name}"?`)) return;

    setError("");
    setMessage("");

    try {
      await api.delete(`/brands/${brand._id}`);
      setMessage("Brand deactivated successfully.");
      await loadBrands();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to deactivate brand."
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Brand Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Create, edit and manage product brands.
            </p>
          </div>

          <button
            onClick={openCreate}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            + Add Brand
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {message}
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">
              Brands ({brands.length})
            </h2>

            <button
              onClick={loadBrands}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="p-8 text-center text-sm text-gray-500">
              Loading brands...
            </p>
          ) : brands.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-500">
              No brands found. Click Add Brand to create one.
            </p>
          ) : (
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3">Brand</th>
                  <th className="px-5 py-3">Slug</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {brands.map((brand) => (
                  <tr key={brand._id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {brand.logo ? (
                          <img
                            src={brand.logo}
                            alt={brand.name}
                            className="h-10 w-10 rounded-lg border border-gray-200 object-contain"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                            Logo
                          </div>
                        )}
                        <span className="font-medium text-gray-900">
                          {brand.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {brand.slug}
                    </td>

                    <td className="max-w-xs px-5 py-4 text-gray-600">
                      {brand.description || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => openEdit(brand)}
                          className="font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deactivateBrand(brand)}
                          className="font-medium text-red-600 hover:text-red-800"
                        >
                          Deactivate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {formOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
            <div className="mx-auto my-8 max-w-xl rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <h2 className="text-lg font-bold text-gray-900">
                  {editingId ? "Edit Brand" : "Add Brand"}
                </h2>

                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-lg px-3 py-1 text-xl text-gray-500 hover:bg-gray-100"
                >
                  ×
                </button>
              </div>

              <form onSubmit={saveBrand} className="space-y-4 p-5">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Brand Name *
                  </label>
                  <input
                    required
                    minLength={2}
                    maxLength={100}
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        name,
                        slug: slugify(name),
                      }));
                    }}
                    className={inputClass}
                    placeholder="e.g. Nike"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Slug *
                  </label>
                  <input
                    required
                    value={form.slug}
                    onChange={(e) =>
                      updateField("slug", slugify(e.target.value))
                    }
                    className={inputClass}
                    placeholder="nike"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={form.description}
                    onChange={(e) =>
                      updateField("description", e.target.value)
                    }
                    className={inputClass}
                    placeholder="Brand description (optional)"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Brand Logo (optional)
                  </label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={uploadLogo}
                    disabled={uploading}
                    className="mt-2 block w-full text-sm text-gray-600"
                  />

                  {uploading && (
                    <p className="mt-1 text-sm text-indigo-600">
                      Uploading logo...
                    </p>
                  )}

                  {form.logo && (
                    <div className="mt-3 flex items-center gap-3">
                      <img
                        src={form.logo}
                        alt="Brand logo preview"
                        className="h-16 w-16 rounded-lg border border-gray-200 object-contain p-1"
                      />
                      <button
                        type="button"
                        onClick={() => updateField("logo", "")}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove logo
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving || uploading}
                    className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Update Brand"
                        : "Create Brand"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}