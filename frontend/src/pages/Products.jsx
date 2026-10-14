import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import {
  FilterIcon,
  CloseIcon,
  SearchIcon,
  StarIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RotateCcwIcon,
} from "../components/Icons";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL search params state
  const search = searchParams.get("search") || "";
  const categoryParam = searchParams.get("category") || "";
  const brandParam = searchParams.get("brand") || "";
  const minPriceParam = searchParams.get("minPrice") || "";
  const maxPriceParam = searchParams.get("maxPrice") || "";
  const inStockParam = searchParams.get("inStock") === "true";
  const ratingParam = searchParams.get("minRating") || "";
  const sortParam = searchParams.get("sort") || "newest";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);

  // Data state
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Accordion toggle state for individual filter sections inside the sidebar
  const [openSections, setOpenSections] = useState({
    category: true,
    brand: true,
    price: true,
    rating: true,
  });

  const toggleSection = (sectionKey) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const allOpen = useMemo(
    () => Object.values(openSections).every(Boolean),
    [openSections]
  );

  const toggleAllSections = () => {
    const nextState = !allOpen;
    setOpenSections({
      category: nextState,
      brand: nextState,
      price: nextState,
      rating: nextState,
    });
  };

  // Local filter form state
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedBrands, setSelectedBrands] = useState(() =>
    brandParam ? brandParam.split(",") : []
  );
  const [minPrice, setMinPrice] = useState(minPriceParam);
  const [maxPrice, setMaxPrice] = useState(maxPriceParam);
  const [inStockOnly, setInStockOnly] = useState(inStockParam);
  const [minRating, setMinRating] = useState(ratingParam);
  const [sort, setSort] = useState(sortParam);

  // Sync state with URL params
  useEffect(() => {
    setSelectedCategory(categoryParam);
    setSelectedBrands(brandParam ? brandParam.split(",") : []);
    setMinPrice(minPriceParam);
    setMaxPrice(maxPriceParam);
    setInStockOnly(inStockParam);
    setMinRating(ratingParam);
    setSort(sortParam);
  }, [
    categoryParam,
    brandParam,
    minPriceParam,
    maxPriceParam,
    inStockParam,
    ratingParam,
    sortParam,
  ]);

  // Fetch Categories & Brands once
  useEffect(() => {
    let cancelled = false;

    const fetchMeta = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          api.get("/categories"),
          api.get("/brands"),
        ]);
        if (!cancelled) {
          setCategories(catRes.data.data?.categories || []);
          setBrands(brandRes.data.data?.brands || []);
        }
      } catch (err) {
        console.warn("Failed to load filter metadata:", err.message);
      }
    };

    fetchMeta();

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch Products based on current URL query params
  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      setLoading(true);
      setError("");

      try {
        const params = {
          page: pageParam,
          limit: 12,
          sort: sortParam,
        };

        if (search.trim()) params.search = search.trim();
        if (categoryParam) params.category = categoryParam;
        if (brandParam) params.brand = brandParam;
        if (minPriceParam) params.minPrice = minPriceParam;
        if (maxPriceParam) params.maxPrice = maxPriceParam;
        if (inStockParam) params.inStock = "true";
        if (ratingParam) params.minRating = ratingParam;

        const res = await api.get("/products", { params });
        const data = res.data.data;

        if (!cancelled) {
          if (Array.isArray(data)) {
            setProducts(data);
            setPagination({
              currentPage: 1,
              totalPages: 1,
              totalProducts: data.length,
              hasNextPage: false,
              hasPreviousPage: false,
            });
          } else {
            setProducts(data?.products || []);
            setPagination(
              data?.pagination || {
                currentPage: 1,
                totalPages: 1,
                totalProducts: data?.products?.length || 0,
                hasNextPage: false,
                hasPreviousPage: false,
              }
            );
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Products fetch error:", err);
          setError(
            err.response?.data?.message || "Failed to load products. Please try again."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProducts();
    window.scrollTo({ top: 0, behavior: "smooth" });

    return () => {
      cancelled = true;
    };
  }, [
    search,
    categoryParam,
    brandParam,
    minPriceParam,
    maxPriceParam,
    inStockParam,
    ratingParam,
    sortParam,
    pageParam,
  ]);

  // Apply filters by pushing to searchParams
  const applyFilters = useCallback(
    (customUpdates = {}) => {
      const next = new URLSearchParams(searchParams);

      // Reset page to 1 whenever filters change (unless page is explicitly updated)
      if (!customUpdates.page) {
        next.set("page", "1");
      }

      const updates = {
        category: selectedCategory,
        brand: selectedBrands.join(","),
        minPrice,
        maxPrice,
        inStock: inStockOnly ? "true" : "",
        minRating,
        sort,
        ...customUpdates,
      };

      Object.entries(updates).forEach(([key, val]) => {
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          next.set(key, String(val).trim());
        } else {
          next.delete(key);
        }
      });

      setSearchParams(next);
      setMobileFilterOpen(false);
    },
    [
      searchParams,
      selectedCategory,
      selectedBrands,
      minPrice,
      maxPrice,
      inStockOnly,
      minRating,
      sort,
      setSearchParams,
    ]
  );

  // Clear all filters
  const resetAllFilters = () => {
    setSelectedCategory("");
    setSelectedBrands([]);
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
    setMinRating("");
    setSort("newest");

    const next = new URLSearchParams();
    if (search.trim()) next.set("search", search.trim());
    setSearchParams(next);
    setMobileFilterOpen(false);
  };

  // Toggle single brand checkbox
  const handleBrandToggle = (brandId) => {
    setSelectedBrands((prev) => {
      const next = prev.includes(brandId)
        ? prev.filter((id) => id !== brandId)
        : [...prev, brandId];
      return next;
    });
  };

  // Check active filter count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (categoryParam) count++;
    if (brandParam) count += brandParam.split(",").length;
    if (minPriceParam || maxPriceParam) count++;
    if (inStockParam) count++;
    if (ratingParam) count++;
    return count;
  }, [
    categoryParam,
    brandParam,
    minPriceParam,
    maxPriceParam,
    inStockParam,
    ratingParam,
  ]);

  // Handle Sort Change immediately
  const handleSortChange = (newSort) => {
    setSort(newSort);
    applyFilters({ sort: newSort });
  };

  // Handle Page Change
  const handlePageChange = (newPage) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(newPage));
    setSearchParams(next);
  };

  // Section-specific clear handlers
  const handleClearCategory = (e) => {
    e.stopPropagation();
    setSelectedCategory("");
    applyFilters({ category: "" });
  };

  const handleClearBrands = (e) => {
    e.stopPropagation();
    setSelectedBrands([]);
    applyFilters({ brand: "" });
  };

  const handleClearPrice = (e) => {
    e.stopPropagation();
    setMinPrice("");
    setMaxPrice("");
    applyFilters({ minPrice: "", maxPrice: "" });
  };

  const handleClearRating = (e) => {
    e.stopPropagation();
    setMinRating("");
    applyFilters({ minRating: "" });
  };

  const handleInStockToggle = () => {
    const nextVal = !inStockOnly;
    setInStockOnly(nextVal);
    applyFilters({ inStock: nextVal ? "true" : "" });
  };

  // Sidebar filter component (shared between desktop and mobile)
  const FilterContent = (
    <div className="space-y-4 text-xs text-slate-700">
      {/* Category Filter */}
      <div className="pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => toggleSection("category")}
            className="flex-1 flex items-center justify-between group cursor-pointer pr-2 text-left focus:outline-none"
            aria-expanded={openSections.category}
          >
            <div className="flex items-center gap-2">
              <h3 className="font-bold uppercase tracking-wider text-slate-900 text-[11px] group-hover:text-indigo-600 transition-colors">
                Category
              </h3>
              {selectedCategory && (
                <span className="max-w-[110px] truncate rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-100">
                  {categories.find((c) => c._id === selectedCategory)?.name || "1"}
                </span>
              )}
            </div>
            <ChevronDownIcon
              className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
                openSections.category ? "rotate-180" : ""
              }`}
            />
          </button>
          {selectedCategory && (
            <button
              type="button"
              onClick={handleClearCategory}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline px-1 py-0.5"
            >
              Clear
            </button>
          )}
        </div>
        <div
          className={`overflow-hidden transition-all duration-200 ease-in-out ${
            openSections.category
              ? "max-h-72 opacity-100 mt-2.5"
              : "max-h-0 opacity-0 pointer-events-none mt-0"
          }`}
        >
          <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
            <label className="flex items-center gap-2 cursor-pointer font-medium hover:text-indigo-600">
              <input
                type="radio"
                name="cat"
                checked={!selectedCategory}
                onChange={() => setSelectedCategory("")}
                className="accent-indigo-600"
              />
              <span>All Categories</span>
            </label>
            {categories.map((cat) => (
              <label
                key={cat._id}
                className="flex items-center gap-2 cursor-pointer capitalize hover:text-indigo-600"
              >
                <input
                  type="radio"
                  name="cat"
                  checked={selectedCategory === cat._id}
                  onChange={() => setSelectedCategory(cat._id)}
                  className="accent-indigo-600"
                />
                <span>{cat.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Brand Filter */}
      {brands.length > 0 && (
        <div className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => toggleSection("brand")}
              className="flex-1 flex items-center justify-between group cursor-pointer pr-2 text-left focus:outline-none"
              aria-expanded={openSections.brand}
            >
              <div className="flex items-center gap-2">
                <h3 className="font-bold uppercase tracking-wider text-slate-900 text-[11px] group-hover:text-indigo-600 transition-colors">
                  Brands
                </h3>
                {selectedBrands.length > 0 && (
                  <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-100">
                    {selectedBrands.length} selected
                  </span>
                )}
              </div>
              <ChevronDownIcon
                className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
                  openSections.brand ? "rotate-180" : ""
                }`}
              />
            </button>
            {selectedBrands.length > 0 && (
              <button
                type="button"
                onClick={handleClearBrands}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline px-1 py-0.5"
              >
                Clear
              </button>
            )}
          </div>
          <div
            className={`overflow-hidden transition-all duration-200 ease-in-out ${
              openSections.brand
                ? "max-h-72 opacity-100 mt-2.5"
                : "max-h-0 opacity-0 pointer-events-none mt-0"
            }`}
          >
            <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
              {brands.map((b) => (
                <label
                  key={b._id}
                  className="flex items-center gap-2.5 cursor-pointer hover:text-indigo-600"
                >
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(b._id)}
                    onChange={() => handleBrandToggle(b._id)}
                    className="rounded border-slate-300 accent-indigo-600"
                  />
                  <span className="capitalize">{b.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Price Range */}
      <div className="pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => toggleSection("price")}
            className="flex-1 flex items-center justify-between group cursor-pointer pr-2 text-left focus:outline-none"
            aria-expanded={openSections.price}
          >
            <div className="flex items-center gap-2">
              <h3 className="font-bold uppercase tracking-wider text-slate-900 text-[11px] group-hover:text-indigo-600 transition-colors">
                Price Range (₹)
              </h3>
              {(minPrice || maxPrice) && (
                <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-100">
                  ₹{minPrice || "0"}–₹{maxPrice || "∞"}
                </span>
              )}
            </div>
            <ChevronDownIcon
              className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
                openSections.price ? "rotate-180" : ""
              }`}
            />
          </button>
          {(minPrice || maxPrice) && (
            <button
              type="button"
              onClick={handleClearPrice}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline px-1 py-0.5"
            >
              Clear
            </button>
          )}
        </div>
        <div
          className={`overflow-hidden transition-all duration-200 ease-in-out ${
            openSections.price
              ? "max-h-72 opacity-100 mt-2.5"
              : "max-h-0 opacity-0 pointer-events-none mt-0"
          }`}
        >
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
            />
            <span className="text-slate-400 font-bold">—</span>
            <input
              type="number"
              min="0"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
            />
          </div>

          {/* Quick presets */}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {[
              { label: "< ₹1,000", min: "", max: "1000" },
              { label: "₹1k–₹5k", min: "1000", max: "5000" },
              { label: "₹5k–₹20k", min: "5000", max: "20000" },
              { label: "> ₹20k", min: "20000", max: "" },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setMinPrice(preset.min);
                  setMaxPrice(preset.max);
                }}
                className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* In-Stock Only Toggle Switch */}
      <div className="pb-3 border-b border-slate-100">
        <div
          role="button"
          tabIndex={0}
          onClick={handleInStockToggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleInStockToggle();
            }
          }}
          className="flex items-center justify-between cursor-pointer select-none group py-1"
        >
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              In-Stock Items Only
            </span>
            <span className="text-[10px] text-slate-400">
              Exclude out-of-stock items
            </span>
          </div>
          <div
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
              inStockOnly ? "bg-indigo-600" : "bg-slate-200"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${
                inStockOnly ? "translate-x-4.5" : "translate-x-1"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Minimum Rating */}
      <div className="pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => toggleSection("rating")}
            className="flex-1 flex items-center justify-between group cursor-pointer pr-2 text-left focus:outline-none"
            aria-expanded={openSections.rating}
          >
            <div className="flex items-center gap-2">
              <h3 className="font-bold uppercase tracking-wider text-slate-900 text-[11px] group-hover:text-indigo-600 transition-colors">
                Rating
              </h3>
              {minRating && (
                <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                  {minRating}★+
                </span>
              )}
            </div>
            <ChevronDownIcon
              className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
                openSections.rating ? "rotate-180" : ""
              }`}
            />
          </button>
          {minRating && (
            <button
              type="button"
              onClick={handleClearRating}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline px-1 py-0.5"
            >
              Clear
            </button>
          )}
        </div>
        <div
          className={`overflow-hidden transition-all duration-200 ease-in-out ${
            openSections.rating
              ? "max-h-48 opacity-100 mt-2"
              : "max-h-0 opacity-0 pointer-events-none mt-0"
          }`}
        >
          <div className="space-y-1.5">
            {[4, 3, 2].map((stars) => (
              <label
                key={stars}
                className="flex items-center gap-2 cursor-pointer hover:text-indigo-600"
              >
                <input
                  type="radio"
                  name="rating"
                  checked={minRating === String(stars)}
                  onChange={() => setMinRating(String(stars))}
                  className="accent-indigo-600"
                />
                <span className="flex items-center gap-1 font-semibold">
                  {stars}★ & above
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Action Buttons */}
      <div className="pt-2 space-y-2">
        <button
          type="button"
          onClick={() => applyFilters()}
          className="w-full rounded-xl bg-indigo-600 py-2.5 font-bold text-white shadow-sm hover:bg-indigo-700 transition"
        >
          Apply Filters
        </button>
        <button
          type="button"
          onClick={resetAllFilters}
          className="w-full rounded-xl border border-slate-200 py-2 font-semibold text-slate-600 hover:bg-slate-100 transition"
        >
          Reset All
        </button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
            {search ? `Search results for "${search}"` : "ShopSphere Catalog"}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {loading
              ? "Scanning store catalog..."
              : `Found ${pagination.totalProducts} product${
                  pagination.totalProducts !== 1 ? "s" : ""
                } matching your criteria`}
          </p>
        </div>

        {/* Sort & Filter controls */}
        <div className="flex items-center gap-3">
          {/* Desktop Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className={`hidden lg:flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition shadow-sm ${
              sidebarOpen
                ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                : "border-indigo-600 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            }`}
          >
            <FilterIcon className="w-4 h-4 text-indigo-600" />
            <span>{sidebarOpen ? "Hide Filters" : "Show Filters"}</span>
            {activeFiltersCount > 0 && (
              <span className="rounded-full bg-indigo-600 px-1.5 py-0.2 text-[10px] text-white">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Mobile Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50 lg:hidden"
          >
            <FilterIcon className="w-4 h-4 text-indigo-600" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="rounded-full bg-indigo-600 px-1.5 py-0.2 text-[10px] text-white">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-xs font-semibold text-slate-500 hidden sm:inline">
              Sort by:
            </label>
            <select
              id="sort-select"
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-sm focus:border-indigo-600 focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Customer Rated</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Badges */}
      {activeFiltersCount > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Active filters:</span>
          {categoryParam && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              Category:{" "}
              {categories.find((c) => c._id === categoryParam)?.name || "Selected"}
              <button
                type="button"
                onClick={() => applyFilters({ category: "" })}
                className="hover:text-indigo-900"
              >
                ×
              </button>
            </span>
          )}
          {brandParam && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              Brands ({brandParam.split(",").length})
              <button
                type="button"
                onClick={() => applyFilters({ brand: "" })}
                className="hover:text-indigo-900"
              >
                ×
              </button>
            </span>
          )}
          {(minPriceParam || maxPriceParam) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              Price: ₹{minPriceParam || "0"} – ₹{maxPriceParam || "∞"}
              <button
                type="button"
                onClick={() => applyFilters({ minPrice: "", maxPrice: "" })}
                className="hover:text-indigo-900"
              >
                ×
              </button>
            </span>
          )}
          {inStockParam && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              In Stock Only
              <button
                type="button"
                onClick={() => applyFilters({ inStock: "" })}
                className="hover:text-emerald-900"
              >
                ×
              </button>
            </span>
          )}
          {ratingParam && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              {ratingParam}★ & above
              <button
                type="button"
                onClick={() => applyFilters({ minRating: "" })}
                className="hover:text-amber-900"
              >
                ×
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={resetAllFilters}
            className="text-xs font-bold text-red-600 hover:underline ml-2"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Main Grid: Left Sidebar + Product List */}
      <div className={`grid grid-cols-1 gap-8 ${sidebarOpen ? "lg:grid-cols-4" : ""}`}>
        {/* Left Desktop Sidebar */}
        {sidebarOpen && (
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FilterIcon className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-extrabold text-slate-900">Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                      {activeFiltersCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleAllSections}
                    className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
                  >
                    {allOpen ? "Collapse All" : "Expand All"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center justify-center h-6 w-6 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                    title="Hide sidebar"
                  >
                    <CloseIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {FilterContent}
            </div>
          </aside>
        )}

        {/* Product Cards Grid */}
        <div className={sidebarOpen ? "lg:col-span-3" : "w-full"}>
          {error && (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          {loading ? (
            <div
              className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${
                sidebarOpen ? "xl:grid-cols-3" : "lg:grid-cols-3 xl:grid-cols-4"
              }`}
            >
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse space-y-4"
                >
                  <div className="aspect-square rounded-xl bg-slate-200" />
                  <div className="h-4 w-1/3 rounded bg-slate-200" />
                  <div className="h-5 w-3/4 rounded bg-slate-200" />
                  <div className="h-4 w-1/2 rounded bg-slate-200" />
                  <div className="h-10 w-full rounded-xl bg-slate-200" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            /* Empty State */
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 text-2xl font-bold">
                🔍
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-900">
                No matching products found
              </h2>
              <p className="mt-2 text-xs text-slate-500 max-w-sm mx-auto">
                We couldn't find any items matching your active filter criteria. Try adjusting your price range, clearing brand selections, or searching for another keyword.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Product Grid */}
              <div
                className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${
                  sidebarOpen ? "xl:grid-cols-3" : "lg:grid-cols-3 xl:grid-cols-4"
                }`}
              >
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="mt-12 flex flex-wrap items-center justify-center gap-2 border-t border-slate-200/80 pt-6">
                  {/* Previous button */}
                  <button
                    type="button"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPreviousPage}
                    className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {[...Array(pagination.totalPages)].map((_, idx) => {
                      const pageNum = idx + 1;
                      const isCurrent = pageNum === pagination.currentPage;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => handlePageChange(pageNum)}
                          className={`h-9 w-9 rounded-xl text-xs font-bold transition shadow-sm ${
                            isCurrent
                              ? "bg-indigo-600 text-white shadow-indigo-600/20 scale-105"
                              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next button */}
                  <button
                    type="button"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>Next</span>
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Slide-over Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileFilterOpen(false)}
          />

          {/* Drawer Sheet */}
          <div className="relative ml-auto flex h-full w-full max-w-xs flex-col bg-white shadow-2xl p-5 overflow-y-auto z-10 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <FilterIcon className="w-4 h-4 text-indigo-600" /> Filter Catalog
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleAllSections}
                  className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  {allOpen ? "Collapse All" : "Expand All"}
                </button>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="py-4">{FilterContent}</div>
          </div>
        </div>
      )}
    </div>
  );
}