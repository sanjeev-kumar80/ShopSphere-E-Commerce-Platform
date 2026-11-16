import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../../services/api";

export default function SellerProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    shortDescription: "",
    category: "",
    brand: "",
    tagsText: "",
    imageUrlInput: "",
    images: [],
    variants: [
      {
        sku: "",
        price: "",
        compareAtPrice: "",
        stock: 10,
        attributesText: "{}",
      },
    ],
  });

  useEffect(() => {
    let cancelled = false;

    const loadMetadata = async () => {
      try {
        const [catRes, brandRes] = await Promise.allSettled([
          api.get("/categories"),
          api.get("/brands", { params: { limit: 100 } }),
        ]);

        if (!cancelled) {
          if (catRes.status === "fulfilled") {
            const list = catRes.value.data?.data?.categories || [];
            setCategories(list);
            if (!isEditing && list.length > 0) {
              setForm((f) => ({ ...f, category: list[0]._id }));
            }
          }
          if (brandRes.status === "fulfilled") {
            setBrands(brandRes.value.data?.data?.brands || []);
          }
        }
      } catch (err) {
        console.error("Failed to load categories/brands", err);
      }
    };

    const loadProductForEdit = async () => {
      if (!isEditing) return;
      try {
        setFetching(true);
        const res = await api.get(`/seller/products`);
        const list = res.data?.data?.products || [];
        const target = list.find((p) => p._id === id);

        if (!target) {
          setError("Product not found or not owned by you.");
          return;
        }

        setForm({
          name: target.name || "",
          description: target.description || "",
          shortDescription: target.shortDescription || "",
          category: target.category?._id || target.category || "",
          brand: target.brand?._id || target.brand || "",
          tagsText: Array.isArray(target.tags) ? target.tags.join(", ") : "",
          imageUrlInput: "",
          images: target.images || [],
          variants: (target.variants || []).map((v) => ({
            _id: v._id,
            sku: v.sku || "",
            price: v.price || "",
            compareAtPrice: v.compareAtPrice || "",
            stock: v.stock !== undefined ? v.stock : 0,
            attributesText: JSON.stringify(v.attributes || {}),
          })),
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load product for editing");
      } finally {
        setFetching(false);
      }
    };

    loadMetadata();
    loadProductForEdit();

    return () => {
      cancelled = true;
    };
  }, [id, isEditing]);

  const handleBasicChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleVariantChange = (index, field, value) => {
    setForm((prev) => {
      const nextVariants = [...prev.variants];
      nextVariants[index] = { ...nextVariants[index], [field]: value };
      return { ...prev, variants: nextVariants };
    });
  };

  const addVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          sku: "",
          price: "",
          compareAtPrice: "",
          stock: 10,
          attributesText: "{}",
        },
      ],
    }));
  };

  const removeVariant = (index) => {
    if (form.variants.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const addImageUrl = () => {
    const url = form.imageUrlInput.trim();
    if (!url) return;
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, { url, publicId: `seller_img_${Date.now()}`, alt: prev.name }],
      imageUrlInput: "",
    }));
  };

  const removeImage = (index) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim() || !form.description.trim() || !form.category) {
      setError("Please fill in the product title, description, and select a category.");
      return;
    }

    if (form.variants.length === 0) {
      setError("At least one product variant with an SKU and price is required.");
      return;
    }

    try {
      setLoading(true);

      const parsedVariants = form.variants.map((v) => {
        let attributes = {};
        try {
          attributes = JSON.parse(v.attributesText || "{}");
        } catch {
          attributes = {};
        }

        return {
          ...(v._id ? { _id: v._id } : {}),
          sku: v.sku.trim().toUpperCase(),
          price: Number(v.price),
          compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : undefined,
          stock: Number(v.stock || 0),
          attributes,
          isActive: true,
        };
      });

      const tags = form.tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        shortDescription: form.shortDescription.trim(),
        category: form.category,
        brand: form.brand || null,
        images: form.images.length > 0 ? form.images : [
          { url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800", publicId: "default", alt: form.name }
        ],
        variants: parsedVariants,
        tags,
      };

      if (isEditing) {
        await api.put(`/seller/products/${id}`, payload);
        setSuccess("Product updated successfully! Returning to catalog...");
      } else {
        await api.post(`/seller/products`, payload);
        setSuccess("Product listing submitted for admin approval! Returning to catalog...");
      }

      setTimeout(() => {
        navigate("/seller/products");
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to save product. Check SKUs for uniqueness."
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="py-24 text-center text-xs text-slate-500">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        <p className="mt-3">Loading product details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEditing ? "Edit Product Listing" : "Add New Product"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isEditing
              ? "Update product specifications, prices, or inventory."
              : "Create a new catalog item. Newly submitted items undergo administrator verification."}
          </p>
        </div>

        <Link
          to="/seller/products"
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
        >
          ← Back to Products
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          ✕ {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700">
          ✓ {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Details */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider border-b border-slate-100 pb-3">
            1. General Information
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name *</label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleBasicChange}
              placeholder="e.g. Wireless Noise Canceling Over-Ear Headphones"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <select
                name="category"
                required
                value={form.category}
                onChange={handleBasicChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brand (Optional)</label>
              <select
                name="brand"
                value={form.brand}
                onChange={handleBasicChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
              >
                <option value="">Select Brand</option>
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Short Summary</label>
            <input
              type="text"
              name="shortDescription"
              value={form.shortDescription}
              onChange={handleBasicChange}
              placeholder="One-liner feature highlight seen on product cards"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Description *</label>
            <textarea
              name="description"
              required
              rows={4}
              value={form.description}
              onChange={handleBasicChange}
              placeholder="Detailed specifications, dimensions, features, warranty, and materials..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tags (comma separated)</label>
            <input
              type="text"
              name="tagsText"
              value={form.tagsText}
              onChange={handleBasicChange}
              placeholder="wireless, anc, premium, audio"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
            />
          </div>
        </div>

        {/* Media / Images */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider border-b border-slate-100 pb-3">
            2. Product Images
          </h3>

          <div className="flex gap-2">
            <input
              type="url"
              value={form.imageUrlInput}
              onChange={(e) => setForm((f) => ({ ...f, imageUrlInput: e.target.value }))}
              placeholder="Paste direct image URL (e.g. https://images.unsplash.com/...)"
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition"
            />
            <button
              type="button"
              onClick={addImageUrl}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
            >
              Add URL
            </button>
          </div>

          {form.images.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {form.images.map((img, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200">
                  <img src={img.url} alt="Product preview" className="h-28 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1.5 right-1.5 rounded-full bg-rose-600 text-white p-1 text-[10px] hover:bg-rose-700 shadow-sm"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              No custom image added. A default high-resolution image will be automatically assigned.
            </p>
          )}
        </div>

        {/* Variants / SKUs & Pricing */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              3. Pricing & Variants
            </h3>
            <button
              type="button"
              onClick={addVariant}
              className="rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1 text-xs font-semibold transition"
            >
              + Add Variant
            </button>
          </div>

          <div className="space-y-4">
            {form.variants.map((v, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Variant #{idx + 1}</span>
                  {form.variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(idx)}
                      className="text-xs font-semibold text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">SKU Code *</label>
                    <input
                      type="text"
                      required
                      value={v.sku}
                      onChange={(e) => handleVariantChange(idx, "sku", e.target.value)}
                      placeholder="e.g. SONY-XM5-BLK"
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 uppercase focus:border-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={v.price}
                      onChange={(e) => handleVariantChange(idx, "price", e.target.value)}
                      placeholder="2999"
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Original Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={v.compareAtPrice}
                      onChange={(e) => handleVariantChange(idx, "compareAtPrice", e.target.value)}
                      placeholder="3999"
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Initial Stock *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={v.stock}
                      onChange={(e) => handleVariantChange(idx, "stock", e.target.value)}
                      placeholder="10"
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Attributes JSON (e.g. {"{\"Color\": \"Black\", \"Size\": \"M\"}"})
                  </label>
                  <input
                    type="text"
                    value={v.attributesText}
                    onChange={(e) => handleVariantChange(idx, "attributesText", e.target.value)}
                    placeholder='{"Color": "Black"}'
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Link
            to="/seller/products"
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition"
          >
            {loading ? "Submitting..." : isEditing ? "Save Changes" : "Submit Listing"}
          </button>
        </div>
      </form>
    </div>
  );
}
