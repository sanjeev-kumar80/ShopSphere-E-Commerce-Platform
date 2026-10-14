
import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";

const emptyVariant = () => ({
  sku: "",
  price: "",
  compareAtPrice: "",
  stock: "0",
  attributesText: "{}",
});

const emptyForm = () => ({
  name: "",
  description: "",
  shortDescription: "",
  category: "",
  brand: "",
  images: [],
  variants: [emptyVariant()],
  tagsText: "",
  isFeatured: false,
  isActive: true,
});

const getId = (value) =>
  typeof value === "object" && value !== null
    ? value._id || value.id || ""
    : value || "";

const normalizeImage = (image) => ({
  url: image?.url || image?.secure_url || "",
  publicId: image?.publicId || image?.public_id || "",
  alt: image?.alt || "",
});

const getErrorMessage = (error) =>
  error?.response?.data?.errors?.map((item) => item.msg).join(", ") ||
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong.";

const inputClass =
  "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

const labelClass = "block text-sm font-medium text-gray-700";

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/products", {
        params: { search, page: 1, limit: 100, sort: "newest" },
      });

      setProducts(response.data?.data?.products || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search]);

  const loadOptions = useCallback(async () => {
    try {
      const [categoryResult, brandResult] = await Promise.allSettled([
        api.get("/categories"),
        api.get("/brands", { params: { limit: 100 } }),
      ]);

      if (categoryResult.status === "fulfilled") {
        setCategories(
          categoryResult.value.data?.data?.categories || []
        );
      }

      if (brandResult.status === "fulfilled") {
        setBrands(
          brandResult.value.data?.data?.brands || []
        );
      } else {
        // Product creation can still work without selecting a brand.
        setBrands([]);
      }
    } catch {
      setError("Could not load categories. Check your backend routes.");
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const updateField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const updateVariant = (index, field, value) => {
    setForm((previous) => ({
      ...previous,
      variants: previous.variants.map((variant, i) =>
        i === index ? { ...variant, [field]: value } : variant
      ),
    }));
  };

  const addVariant = () => {
    setForm((previous) => ({
      ...previous,
      variants: [...previous.variants, emptyVariant()],
    }));
  };

  const removeVariant = (index) => {
    setForm((previous) => ({
      ...previous,
      variants:
        previous.variants.length === 1
          ? previous.variants
          : previous.variants.filter((_, i) => i !== index),
    }));
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm());
    setError("");
    setMessage("");
    setFormOpen(true);
  };

  const openEditForm = (product) => {
    setEditingId(product._id);
    setError("");
    setMessage("");

    setForm({
      name: product.name || "",
      description: product.description || "",
      shortDescription: product.shortDescription || "",
      category: getId(product.category),
      brand: getId(product.brand),
      images: (product.images || []).map(normalizeImage),
      variants: (product.variants || []).map((variant) => ({
        sku: variant.sku || "",
        price: String(variant.price ?? ""),
        compareAtPrice:
          variant.compareAtPrice == null
            ? ""
            : String(variant.compareAtPrice),
        stock: String(variant.stock ?? 0),
        attributesText: JSON.stringify(
          variant.attributes || {},
          null,
          2
        ),
      })),
      tagsText: (product.tags || []).join(", "),
      isFeatured: Boolean(product.isFeatured),
      isActive: product.isActive !== false,
    });

    setFormOpen(true);
  };

  const uploadImages = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (!files.length) return;

    setUploading(true);
    setError("");
    setMessage("");

    try {
      const uploadedImages = [];

      for (const file of files) {
        const data = new FormData();
        data.append("image", file);

        const response = await api.post("/uploads/product-image", data);
        const result = normalizeImage(response.data?.data);

        if (!result.url || !result.publicId) {
          throw new Error(
            "Upload response must include image URL and public ID."
          );
        }

        uploadedImages.push(result);
      }

      setForm((previous) => ({
        ...previous,
        images: [...previous.images, ...uploadedImages],
      }));

      setMessage(`${uploadedImages.length} image(s) uploaded.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setForm((previous) => ({
      ...previous,
      images: previous.images.filter((_, i) => i !== index),
    }));
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (!form.category) {
        throw new Error("Please select a category.");
      }

      if (!form.variants.length) {
        throw new Error("Add at least one product variant.");
      }

      const variants = form.variants.map((variant) => {
        let attributes;

        try {
          attributes = JSON.parse(variant.attributesText || "{}");
        } catch {
          throw new Error(
            `Variant ${variant.sku || "(without SKU)"} has invalid attributes JSON.`
          );
        }

        if (
          !attributes ||
          typeof attributes !== "object" ||
          Array.isArray(attributes)
        ) {
          throw new Error("Variant attributes must be a JSON object.");
        }

        if (!variant.sku.trim()) {
          throw new Error("Every variant must have a SKU.");
        }

        if (variant.price === "" || Number(variant.price) < 0) {
          throw new Error("Enter a valid variant price.");
        }

        if (
          variant.stock === "" ||
          !Number.isInteger(Number(variant.stock)) ||
          Number(variant.stock) < 0
        ) {
          throw new Error("Stock must be a non-negative whole number.");
        }

        const result = {
          sku: variant.sku.trim().toUpperCase(),
          price: Number(variant.price),
          stock: Number(variant.stock),
          attributes,
        };

        if (variant.compareAtPrice !== "") {
          if (Number(variant.compareAtPrice) < 0) {
            throw new Error("Compare-at price cannot be negative.");
          }

          result.compareAtPrice = Number(variant.compareAtPrice);
        }

        return result;
      });

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        shortDescription: form.shortDescription.trim(),
        category: form.category,
        images: form.images,
        variants,
        tags: form.tagsText
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        isFeatured: form.isFeatured,
        isActive: form.isActive,
      };

      if (form.brand) payload.brand = form.brand;

      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        setMessage("Product updated successfully.");
      } else {
        await api.post("/products", payload);
        setMessage("Product created successfully.");
      }

      setFormOpen(false);
      setEditingId(null);
      setForm(emptyForm());
      await loadProducts();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (product) => {
    const confirmed = window.confirm(
      `Deactivate "${product.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await api.delete(`/products/${product._id}`);
      setMessage("Product deactivated successfully.");
      await loadProducts();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Product Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage products, images, variants and inventory.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            + Add Product
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

        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row">
          <form
            className="flex flex-1 gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(searchInput.trim());
            }}
          >
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search products..."
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
            <button className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
              Search
            </button>
          </form>

          <button
            type="button"
            onClick={loadProducts}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">
              Products ({products.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-gray-500">
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-gray-700">No products found</p>
              <p className="mt-1 text-sm text-gray-500">
                Add a product or change your search.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Price</th>
                    <th className="px-5 py-3">Stock</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => {
                    const variantPrices = (product.variants || [])
                      .map((variant) => Number(variant.price))
                      .filter(Number.isFinite);

                    const stock = (product.variants || []).reduce(
                      (total, variant) =>
                        total + Number(variant.stock || 0),
                      0
                    );

                    const priceLabel =
                      variantPrices.length > 1
                        ? `₹${Math.min(...variantPrices).toLocaleString("en-IN")} – ₹${Math.max(...variantPrices).toLocaleString("en-IN")}`
                        : `₹${(variantPrices[0] || 0).toLocaleString("en-IN")}`;

                    const image = normalizeImage(product.images?.[0]);

                    return (
                      <tr key={product._id} className="hover:bg-gray-50">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {image.url ? (
                              <img
                                src={image.url}
                                alt={image.alt || product.name}
                                className="h-12 w-12 rounded-lg border border-gray-200 object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                                No img
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">
                                {product.name}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                {product.variants?.length || 0} variant(s)
                                {product.isFeatured ? " · Featured" : ""}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          {product.category?.name || "—"}
                        </td>
                        <td className="px-5 py-4 font-medium text-gray-900">
                          {priceLabel}
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          {stock}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              product.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {product.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => openEditForm(product)}
                              className="font-medium text-indigo-600 hover:text-indigo-800"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteProduct(product)}
                              className="font-medium text-red-600 hover:text-red-800"
                            >
                              Deactivate
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {formOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-3 sm:p-6">
            <div className="mx-auto my-4 max-w-4xl rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 sm:px-7">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {editingId ? "Edit Product" : "Add Product"}
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Fields marked with * are required.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-lg px-3 py-2 text-xl text-gray-500 hover:bg-gray-100"
                  aria-label="Close form"
                >
                  ×
                </button>
              </div>

              <form onSubmit={saveProduct} className="space-y-6 p-5 sm:p-7">
                <section className="space-y-4">
                  <h3 className="font-semibold text-gray-900">
                    Basic information
                  </h3>

                  <div>
                    <label className={labelClass}>Product name *</label>
                    <input
                      required
                      minLength={2}
                      maxLength={200}
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      className={inputClass}
                      placeholder="e.g. Classic Cotton T-Shirt"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Description *</label>
                    <textarea
                      required
                      rows={4}
                      value={form.description}
                      onChange={(e) =>
                        updateField("description", e.target.value)
                      }
                      className={inputClass}
                      placeholder="Describe the product..."
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Short description</label>
                    <textarea
                      rows={2}
                      maxLength={500}
                      value={form.shortDescription}
                      onChange={(e) =>
                        updateField("shortDescription", e.target.value)
                      }
                      className={inputClass}
                      placeholder="A short summary (optional)"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Category *</label>
                      <select
                        required
                        value={form.category}
                        onChange={(e) =>
                          updateField("category", e.target.value)
                        }
                        className={inputClass}
                      >
                        <option value="">Select category</option>
                        {categories.map((category) => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      {categories.length === 0 && (
                        <p className="mt-1 text-xs text-amber-700">
                          Create an active category first.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className={labelClass}>Brand (optional)</label>
                      <select
                        value={form.brand}
                        onChange={(e) =>
                          updateField("brand", e.target.value)
                        }
                        className={inputClass}
                      >
                        <option value="">No brand</option>
                        {brands.map((brand) => (
                          <option key={brand._id} value={brand._id}>
                            {brand.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Tags</label>
                    <input
                      value={form.tagsText}
                      onChange={(e) =>
                        updateField("tagsText", e.target.value)
                      }
                      className={inputClass}
                      placeholder="cotton, casual, summer (comma-separated)"
                    />
                  </div>
                </section>

                <section className="space-y-4 border-t border-gray-100 pt-5">
                  <h3 className="font-semibold text-gray-900">
                    Product images
                  </h3>

                  <div>
                    <label className={labelClass}>
                      Upload images (PNG, JPG, WebP)
                    </label>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      onChange={uploadImages}
                      disabled={uploading}
                      className="mt-2 block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {uploading && (
                      <p className="mt-2 text-sm text-indigo-600">
                        Uploading image(s) to Cloudinary...
                      </p>
                    )}
                  </div>

                  {form.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {form.images.map((image, index) => (
                        <div
                          key={`${image.publicId}-${index}`}
                          className="relative overflow-hidden rounded-lg border border-gray-200"
                        >
                          <img
                            src={image.url}
                            alt={image.alt || `Product ${index + 1}`}
                            className="h-28 w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute right-1 top-1 rounded-md bg-white/95 px-2 py-1 text-xs font-semibold text-red-600 shadow"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="space-y-4 border-t border-gray-100 pt-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-semibold text-gray-900">
                      Variants and inventory *
                    </h3>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="rounded-lg border border-indigo-200 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
                    >
                      + Add variant
                    </button>
                  </div>

                  {form.variants.map((variant, index) => (
                    <div
                      key={index}
                      className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-800">
                          Variant {index + 1}
                        </h4>
                        {form.variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVariant(index)}
                            className="text-xs font-medium text-red-600 hover:text-red-800"
                          >
                            Remove variant
                          </button>
                        )}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className={labelClass}>SKU *</label>
                          <input
                            required
                            value={variant.sku}
                            onChange={(e) =>
                              updateVariant(index, "sku", e.target.value)
                            }
                            className={inputClass}
                            placeholder="TSHIRT-BLK-M"
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Price (₹) *</label>
                          <input
                            required
                            type="number"
                            min="0"
                            step="0.01"
                            value={variant.price}
                            onChange={(e) =>
                              updateVariant(index, "price", e.target.value)
                            }
                            className={inputClass}
                            placeholder="499"
                          />
                        </div>
                        <div>
                          <label className={labelClass}>
                            Compare-at price (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={variant.compareAtPrice}
                            onChange={(e) =>
                              updateVariant(
                                index,
                                "compareAtPrice",
                                e.target.value
                              )
                            }
                            className={inputClass}
                            placeholder="699"
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Stock *</label>
                          <input
                            required
                            type="number"
                            min="0"
                            step="1"
                            value={variant.stock}
                            onChange={(e) =>
                              updateVariant(index, "stock", e.target.value)
                            }
                            className={inputClass}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>
                          Attributes (JSON object)
                        </label>
                        <textarea
                          rows={3}
                          value={variant.attributesText}
                          onChange={(e) =>
                            updateVariant(
                              index,
                              "attributesText",
                              e.target.value
                            )
                          }
                          className={inputClass}
                          placeholder={'{"size":"M","color":"Black"}'}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Example: {"{"}"size":"M","color":"Black"{"}"}
                        </p>
                      </div>
                    </div>
                  ))}
                </section>

                <section className="space-y-3 border-t border-gray-100 pt-5">
                  <h3 className="font-semibold text-gray-900">
                    Visibility
                  </h3>

                  <label className="flex items-center gap-3 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.isFeatured}
                      onChange={(e) =>
                        updateField("isFeatured", e.target.checked)
                      }
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                    />
                    Mark as featured product
                  </label>

                  <label className="flex items-center gap-3 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) =>
                        updateField("isActive", e.target.checked)
                      }
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                    />
                    Product is active
                  </label>
                </section>

                <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || uploading || categories.length === 0}
                    className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Update Product"
                        : "Create Product"}
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