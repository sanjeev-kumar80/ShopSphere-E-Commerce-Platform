
import { useEffect, useState } from "react";
import api from "../../services/api";

const initialForm = {
  name: "",
  slug: "",
  description: "",
  image: "",
  parent: "",
  sortOrder: 0,
};

function createSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadCategories = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/categories");
      setCategories(response.data.data.categories || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not load categories."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleNameChange = (value) => {
    setForm((current) => ({
      ...current,
      name: value,
      slug: slugManuallyEdited ? current.slug : createSlug(value),
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setSlugManuallyEdited(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      slug: createSlug(form.slug),
      description: form.description.trim(),
      image: form.image.trim(),
      parent: form.parent || null,
      sortOrder: Number(form.sortOrder) || 0,
    };

    try {
      if (editingId) {
        const response = await api.put(
          `/categories/${editingId}`,
          payload
        );
        setMessage(
          response.data.message || "Category updated successfully."
        );
      } else {
        const response = await api.post("/categories", payload);
        setMessage(
          response.data.message || "Category created successfully."
        );
      }

      resetForm();
      await loadCategories();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not save category. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category) => {
    setForm({
      name: category.name || "",
      slug: category.slug || "",
      description: category.description || "",
      image: category.image || "",
      parent:
        typeof category.parent === "object"
          ? category.parent?._id || ""
          : category.parent || "",
      sortOrder: category.sortOrder ?? 0,
    });

    setEditingId(category._id);
    setSlugManuallyEdited(true);
    setError("");
    setMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `Deactivate category "${category.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await api.delete(
        `/categories/${category._id}`
      );

      setMessage(
        response.data.message || "Category deactivated successfully."
      );

      if (editingId === category._id) {
        resetForm();
      }

      await loadCategories();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not deactivate category."
      );
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Categories
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Organize the products in your store.
          </p>
        </div>

        <button
          type="button"
          onClick={loadCategories}
          disabled={loading}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700"
        >
          {message}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">
          {editingId ? "Edit Category" : "Add New Category"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Category Name *
              </label>
              <input
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                minLength={2}
                maxLength={100}
                placeholder="e.g. Men's Clothing"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Slug *
              </label>
              <input
                value={form.slug}
                onChange={(e) => {
                  setSlugManuallyEdited(true);
                  setForm((current) => ({
                    ...current,
                    slug: createSlug(e.target.value),
                  }));
                }}
                required
                placeholder="mens-clothing"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                Used in URLs. Generated from the name by default.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                maxLength={500}
                rows={3}
                placeholder="Describe this category..."
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Image URL (optional)
              </label>
              <input
                type="url"
                value={form.image}
                onChange={(e) =>
                  setForm({ ...form, image: e.target.value })
                }
                placeholder="https://example.com/category.jpg"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Parent Category (optional)
              </label>
              <select
                value={form.parent}
                onChange={(e) =>
                  setForm({ ...form, parent: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500"
              >
                <option value="">No parent category</option>
                {categories
                  .filter((category) => category._id !== editingId)
                  .map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Sort Order
              </label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                Lower numbers appear first.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Category"
                  : "Create Category"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-300 px-5 py-3 font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Existing Categories
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {categories.length} active categor
            {categories.length === 1 ? "y" : "ies"}
          </p>
        </div>

        {loading ? (
          <p className="p-6 text-slate-500">Loading categories...</p>
        ) : categories.length === 0 ? (
          <div className="p-10 text-center">
            <h3 className="font-semibold text-slate-800">
              No categories yet
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Use the form above to create your first category.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead className="bg-slate-50 text-sm text-slate-600">
                <tr>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Slug</th>
                  <th className="px-6 py-4 font-medium">Parent</th>
                  <th className="px-6 py-4 font-medium">Sort Order</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((category) => (
                  <tr key={category._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">
                        {category.name}
                      </p>
                      {category.description && (
                        <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                          {category.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {category.slug}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {category.parent?.name || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {category.sortOrder ?? 0}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleEdit(category)}
                          className="font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(category)}
                          className="font-medium text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}