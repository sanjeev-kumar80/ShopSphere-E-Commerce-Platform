import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { StarIcon, CheckIcon } from "./Icons";

export default function ProductReviews({
  productId,
  productRating = 0,
  productReviewCount = 0,
  onReviewChange,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Reviews and stats state
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    averageRating: productRating,
    totalReviews: productReviewCount,
    breakdown: [
      { stars: 5, count: 0, percentage: 0 },
      { stars: 4, count: 0, percentage: 0 },
      { stars: 3, count: 0, percentage: 0 },
      { stars: 2, count: 0, percentage: 0 },
      { stars: 1, count: 0, percentage: 0 },
    ],
  });

  // Current user's review status
  const [userReviewData, setUserReviewData] = useState({
    hasReviewed: false,
    review: null,
    isVerifiedPurchase: false,
  });

  // Loading states and refresh trigger
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filtering & Pagination
  const [sort, setSort] = useState("newest");
  const [filterRating, setFilterRating] = useState(null);
  const [filterVerified, setFilterVerified] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [formTitle, setFormTitle] = useState("");
  const [formComment, setFormComment] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Optional image upload state
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  // Full-size image modal (Lightbox)
  const [lightboxImage, setLightboxImage] = useState(null);

  // Delete modal state
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch reviews list and aggregated stats
  useEffect(() => {
    if (!productId) return;
    let cancelled = false;

    const loadReviews = async () => {
      setReviewsLoading(true);
      try {
        const params = {
          page: currentPage,
          limit: 8,
          sort,
        };
        if (filterRating) params.rating = filterRating;
        if (filterVerified) params.verified = "true";

        const res = await api.get(`/reviews/product/${productId}`, { params });
        if (!cancelled && res.data?.success) {
          setReviews(res.data.data.reviews || []);
          if (res.data.data.stats) {
            setStats(res.data.data.stats);
          }
          if (res.data.data.pagination) {
            setTotalPages(res.data.data.pagination.totalPages || 1);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load reviews:", err);
        }
      } finally {
        if (!cancelled) {
          setReviewsLoading(false);
        }
      }
    };

    loadReviews();

    return () => {
      cancelled = true;
    };
  }, [productId, currentPage, sort, filterRating, filterVerified, refreshKey]);

  // Fetch current user's review if authenticated
  useEffect(() => {
    let cancelled = false;

    const loadUserReview = async () => {
      if (!user || !productId) {
        await Promise.resolve();
        if (!cancelled) {
          setUserReviewData({
            hasReviewed: false,
            review: null,
            isVerifiedPurchase: false,
          });
        }
        return;
      }

      try {
        const res = await api.get(`/reviews/product/${productId}/my-review`);
        if (!cancelled && res.data?.success) {
          setUserReviewData(res.data.data);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn("Could not fetch user review status:", err.message);
        }
      }
    };

    loadUserReview();

    return () => {
      cancelled = true;
    };
  }, [user, productId, refreshKey]);

  // Clean up object URLs when previews change or unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => {
        if (url && url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [imagePreviews]);

  // Handle Form Open for New Review
  const handleOpenNewReview = (initialRating = 5) => {
    setEditMode(false);
    setFormRating(initialRating);
    setFormTitle("");
    setFormComment("");
    setSelectedImages([]);
    setImagePreviews([]);
    setExistingImages([]);
    setFormError("");
    setFormSuccess("");
    setFormOpen(true);

    setTimeout(() => {
      const el = document.getElementById("review-form-container");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  // Handle Form Open for Editing Existing Review
  const handleOpenEditReview = (reviewToEdit) => {
    const target = reviewToEdit || userReviewData.review;
    if (!target) return;
    setEditMode(true);
    setFormRating(target.rating || 5);
    setFormTitle(target.title || "");
    setFormComment(target.comment || "");
    setSelectedImages([]);
    setImagePreviews([]);
    setExistingImages(target.images || []);
    setFormError("");
    setFormSuccess("");
    setFormOpen(true);

    setTimeout(() => {
      const formElement = document.getElementById("review-form-container");
      if (formElement) {
        formElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  // File upload selection handler (Browse file manager)
  const handleFilesSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const currentTotal = existingImages.length + selectedImages.length;
    const remainingSlots = 5 - currentTotal;
    if (remainingSlots <= 0) {
      alert("You can attach up to 5 photos per review.");
      return;
    }

    const validFiles = files.slice(0, remainingSlots).filter((file) => {
      if (!file.type.startsWith("image/")) {
        alert(`"${file.name}" is not an image file.`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`"${file.name}" exceeds the 5MB size limit.`);
        return false;
      }
      return true;
    });

    const newPreviews = validFiles.map((f) => URL.createObjectURL(f));

    setSelectedImages((prev) => [...prev, ...validFiles]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);

    if (e.target) e.target.value = "";
  };

  const handleRemoveNewImage = (idx) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => {
      if (prev[idx] && prev[idx].startsWith("blob:")) {
        URL.revokeObjectURL(prev[idx]);
      }
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleRemoveExistingImage = (idx) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // Handle Review Submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!user) {
      navigate(`/login?redirect=/products/${productId}`);
      return;
    }

    if (!formRating || formRating < 1 || formRating > 5) {
      setFormError("Please select a star rating between 1 and 5.");
      return;
    }

    if (!formTitle.trim()) {
      setFormError("Please enter a review headline or title.");
      return;
    }

    if (formTitle.trim().length > 120) {
      setFormError("Title cannot exceed 120 characters.");
      return;
    }

    if (!formComment.trim()) {
      setFormError("Please write a detailed review comment.");
      return;
    }

    if (formComment.trim().length > 2000) {
      setFormError("Comment cannot exceed 2000 characters.");
      return;
    }

    setFormSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("productId", productId);
      formData.append("rating", formRating);
      formData.append("title", formTitle.trim());
      formData.append("comment", formComment.trim());

      // Existing images to keep (for edit mode)
      if (editMode) {
        formData.append("images", JSON.stringify(existingImages));
      }

      // New files selected by user via Browse
      selectedImages.forEach((file) => {
        formData.append("images", file);
      });

      let res;
      if (editMode && userReviewData.review?._id) {
        res = await api.put(`/reviews/${userReviewData.review._id}`, formData);
      } else {
        res = await api.post(`/reviews`, formData);
      }

      if (res.data?.success) {
        setFormSuccess(
          editMode
            ? "Your review has been updated successfully!"
            : "Thank you! Your review has been submitted successfully."
        );

        setTimeout(() => {
          setFormOpen(false);
          setFormSuccess("");
        }, 1500);

        if (onReviewChange && res.data.data) {
          onReviewChange({
            rating: res.data.data.productRating,
            reviewCount: res.data.data.productReviewCount,
          });
        }

        setRefreshKey((k) => k + 1);
      }
    } catch (err) {
      console.error("Submit review error:", err);
      setFormError(
        err.response?.data?.message ||
          "Failed to submit review. Please try again."
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Review Deletion
  const handleDeleteReview = async () => {
    if (!deletingId) return;
    setIsDeleting(true);

    try {
      const res = await api.delete(`/reviews/${deletingId}`);
      if (res.data?.success) {
        setDeletingId(null);

        if (onReviewChange && res.data.data) {
          onReviewChange({
            rating: res.data.data.productRating,
            reviewCount: res.data.data.productReviewCount,
          });
        }

        if (formOpen && editMode) {
          setFormOpen(false);
        }

        setRefreshKey((k) => k + 1);
      }
    } catch (err) {
      console.error("Delete review error:", err);
      alert(
        err.response?.data?.message ||
          "Failed to delete review. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const ratingLabels = {
    1: "1 Star - Poor / Disappointed",
    2: "2 Stars - Fair / Needs improvement",
    3: "3 Stars - Average / Met expectations",
    4: "4 Stars - Good / Very satisfied",
    5: "5 Stars - Excellent / Highly recommended!",
  };

  const activeRatingValue = hoverRating || formRating;

  return (
    <div id="customer-reviews-section" className="space-y-10">
      {/* ------------------------------------------------------------- */}
      {/* Header & Overall Ratings Summary & Breakdown */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-12 md:p-8">
        {/* Left Column: Overall Score & Quick Rate */}
        <div className="flex flex-col items-center justify-center border-b border-slate-100 pb-6 text-center md:col-span-5 md:border-b-0 md:border-r md:pr-8 md:pb-0">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Overall Customer Rating
          </span>
          <div className="my-2 flex items-baseline gap-1">
            <span className="text-5xl font-black tracking-tight text-slate-900">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "0.0"}
            </span>
            <span className="text-lg font-medium text-slate-400">/ 5</span>
          </div>

          <div className="flex items-center gap-1 text-amber-500">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon
                key={star}
                className="w-5 h-5"
                filled={star <= Math.round(stats.averageRating || 0)}
              />
            ))}
          </div>

          <p className="mt-2 text-xs font-medium text-slate-500">
            Based on{" "}
            <strong className="text-slate-800">
              {stats.totalReviews || 0}
            </strong>{" "}
            verified customer rating{stats.totalReviews === 1 ? "" : "s"}
          </p>

          {/* Quick Rate or Write Review CTA */}
          <div className="mt-5 w-full space-y-2.5">
            {user ? (
              userReviewData.hasReviewed ? (
                <button
                  type="button"
                  onClick={() => handleOpenEditReview()}
                  className="w-full rounded-xl border border-indigo-600 bg-indigo-50 px-4 py-2.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 active:scale-95 cursor-pointer shadow-xs"
                >
                  ✏️ Edit Your Review
                </button>
              ) : (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 text-center">
                  <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
                    Have you used this product? Rate it:
                  </span>
                  <div className="flex justify-center items-center gap-1.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleOpenNewReview(star)}
                        className="p-1 hover:scale-125 transition-transform cursor-pointer focus:outline-none"
                        title={`Rate ${star} star${star > 1 ? "s" : ""}`}
                      >
                        <StarIcon className="w-5 h-5" filled={false} />
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenNewReview(5)}
                    className="mt-3 w-full rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-95 cursor-pointer"
                  >
                    ★ Write a Review
                  </button>
                </div>
              )
            ) : (
              <Link
                to={`/login?redirect=/products/${productId}`}
                className="inline-block w-full rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-slate-900/15 transition hover:bg-slate-800 text-center"
              >
                Sign In to Leave a Review
              </Link>
            )}
          </div>
        </div>

        {/* Right Column: Rating Breakdown Bars */}
        <div className="space-y-2.5 md:col-span-7 md:pl-2">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-sm font-bold text-slate-900">
              Rating Distribution
            </h3>
            {filterRating && (
              <button
                type="button"
                onClick={() => setFilterRating(null)}
                className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
              >
                Clear {filterRating}-star filter
              </button>
            )}
          </div>

          {(stats.breakdown || []).map((row) => {
            const isFilterActive = filterRating === row.stars;
            return (
              <button
                key={row.stars}
                type="button"
                onClick={() =>
                  setFilterRating(isFilterActive ? null : row.stars)
                }
                className={`group flex w-full items-center gap-3 rounded-lg px-2 py-1 text-left transition cursor-pointer ${
                  isFilterActive ? "bg-indigo-50/70 ring-1 ring-indigo-300" : "hover:bg-slate-50"
                }`}
                title={`Click to filter by ${row.stars} stars`}
              >
                <div className="flex items-center gap-1 w-12 text-xs font-semibold text-slate-700">
                  <span>{row.stars}</span>
                  <StarIcon className="w-3.5 h-3.5 text-amber-500" filled />
                </div>

                {/* Progress bar container */}
                <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFilterActive ? "bg-indigo-600" : "bg-amber-400 group-hover:bg-amber-500"
                    }`}
                    style={{ width: `${row.percentage}%` }}
                  />
                </div>

                <div className="flex w-16 justify-between text-[11px] font-medium text-slate-400">
                  <span>{row.percentage}%</span>
                  <span className="text-slate-600">({row.count})</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Current User Review Card (if already reviewed) */}
      {/* ------------------------------------------------------------- */}
      {user && userReviewData.hasReviewed && userReviewData.review && !formOpen && (
        <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50/40 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  Your Review
                </span>
                {userReviewData.review.isVerifiedPurchase && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                    <CheckIcon className="w-3.5 h-3.5" /> Verified Purchase
                  </span>
                )}
                <span className="text-xs text-slate-400">
                  {new Date(userReviewData.review.createdAt).toLocaleDateString(
                    "en-IN",
                    { year: "numeric", month: "short", day: "numeric" }
                  )}
                </span>
              </div>

              <div className="flex items-center gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    className="w-4 h-4"
                    filled={star <= userReviewData.review.rating}
                  />
                ))}
                <span className="ml-1 text-xs font-bold text-slate-800">
                  {userReviewData.review.rating} / 5
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900">
                {userReviewData.review.title}
              </h4>

              <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-line">
                {userReviewData.review.comment}
              </p>

              {/* Photos attached to user's review */}
              {userReviewData.review.images && userReviewData.review.images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 pt-1">
                  {userReviewData.review.images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setLightboxImage(img.url)}
                      className="h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 hover:border-indigo-500 transition cursor-pointer"
                    >
                      <img src={img.url} alt={`Your review photo ${idx + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 self-start pt-1">
              <button
                type="button"
                onClick={() => handleOpenEditReview()}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer"
              >
                Edit Review
              </button>
              <button
                type="button"
                onClick={() => setDeletingId(userReviewData.review._id)}
                className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-600 shadow-sm transition hover:bg-rose-50 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Review Submission / Edit Form Modal or Inline Box */}
      {/* ------------------------------------------------------------- */}
      {formOpen && (
        <div
          id="review-form-container"
          className="rounded-3xl border border-indigo-200 bg-gradient-to-b from-indigo-50/40 to-white p-6 shadow-md md:p-8"
        >
          <div className="mb-6 flex items-center justify-between border-b border-indigo-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {editMode ? "Edit Your Review" : "Write a Customer Review"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Share your rating, feedback, and photos to help other buyers.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                setFormError("");
                setFormSuccess("");
              }}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Verified purchase status banner */}
          {userReviewData.isVerifiedPurchase && (
            <div className="mb-6 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs font-semibold text-emerald-800">
              <CheckIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>You have purchased this item. Your review will be marked with a <strong>Verified Purchase</strong> badge.</span>
            </div>
          )}

          {formError && (
            <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-700">
              ⚠️ {formError}
            </div>
          )}

          {formSuccess && (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-medium text-emerald-700">
              ✓ {formSuccess}
            </div>
          )}

          <form onSubmit={handleSubmitReview} className="space-y-6">
            {/* Star Rating Picker with explicit Submit button helper */}
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Your Rating <span className="text-rose-500">*</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5" onMouseLeave={() => setHoverRating(0)}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          className="p-1 transition-transform hover:scale-115 focus:outline-none cursor-pointer"
                        >
                          <StarIcon
                            className="w-8 h-8"
                            filled={star <= activeRatingValue}
                          />
                        </button>
                      ))}
                    </div>

                    <span className="ml-2 text-xs font-bold text-slate-700">
                      {ratingLabels[activeRatingValue] || ""}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block sm:inline">
                    Click stars to rate (1–5)
                  </span>
                </div>
              </div>
            </div>

            {/* Title / Headline */}
            <div>
              <label
                htmlFor="review-title"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2"
              >
                Headline / Title <span className="text-rose-500">*</span>
              </label>
              <input
                id="review-title"
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                maxLength={120}
                placeholder="What's the most important thing to know?"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 transition focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <div className="flex justify-between mt-1 text-[11px] text-slate-400">
                <span>Summarize your experience in one sentence</span>
                <span>{formTitle.length} / 120</span>
              </div>
            </div>

            {/* Review Comment */}
            <div>
              <label
                htmlFor="review-comment"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2"
              >
                Written Review <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="review-comment"
                rows={4}
                value={formComment}
                onChange={(e) => setFormComment(e.target.value)}
                maxLength={2000}
                placeholder="What did you like or dislike? How was the fit, material, durability, or performance?"
                className="w-full rounded-xl border border-slate-300 bg-white p-4 text-sm text-slate-900 transition focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 leading-relaxed"
              />
              <div className="flex justify-between mt-1 text-[11px] text-slate-400">
                <span>Detailed feedback helps the community make informed decisions</span>
                <span>{formComment.length} / 2000</span>
              </div>
            </div>

            {/* Optional Photo Upload Section with Browse button */}
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Add Photos
                    </label>
                    <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
                      Optional
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Upload up to 5 photos showing the product in hand (JPEG, PNG, WebP up to 5MB each).
                  </p>
                </div>

                {/* Browse Button that triggers File Manager */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFilesSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={existingImages.length + selectedImages.length >= 5}
                    className="inline-flex items-center gap-2 rounded-xl border border-indigo-300 bg-white px-4 py-2.5 text-xs font-bold text-indigo-700 shadow-xs hover:bg-indigo-50 active:scale-95 transition disabled:opacity-50 cursor-pointer"
                  >
                    <span>📁 Browse Photos</span>
                  </button>
                </div>
              </div>

              {/* Photo Previews Gallery */}
              {(existingImages.length > 0 || imagePreviews.length > 0) && (
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-600 block mb-2">
                    Selected Photos ({existingImages.length + selectedImages.length} of 5):
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {/* Existing photos (edit mode) */}
                    {existingImages.map((img, idx) => (
                      <div
                        key={`existing-${idx}`}
                        className="relative h-20 w-20 rounded-xl overflow-hidden border border-slate-200 group shadow-xs"
                      >
                        <img
                          src={img.url}
                          alt={`Existing upload ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(idx)}
                          className="absolute top-1 right-1 h-5 w-5 rounded-full bg-slate-900/80 text-white text-[10px] font-bold flex items-center justify-center hover:bg-rose-600 transition cursor-pointer"
                          title="Remove photo"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {/* Newly selected photos */}
                    {imagePreviews.map((url, idx) => (
                      <div
                        key={`new-${idx}`}
                        className="relative h-20 w-20 rounded-xl overflow-hidden border-2 border-indigo-400 group shadow-xs"
                      >
                        <img
                          src={url}
                          alt={`New preview ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveNewImage(idx)}
                          className="absolute top-1 right-1 h-5 w-5 rounded-full bg-slate-900/80 text-white text-[10px] font-bold flex items-center justify-center hover:bg-rose-600 transition cursor-pointer"
                          title="Remove photo"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions: Clear Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                disabled={formSubmitting}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={formSubmitting}
                className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-700 active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {formSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : editMode ? (
                  "Update Review"
                ) : (
                  "Submit Review"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Reviews List & Filter Controls */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-6">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              Customer Reviews ({stats.totalReviews})
            </h3>
            {filterRating && (
              <span className="text-xs text-indigo-600 font-semibold">
                Showing only {filterRating}-star reviews
              </span>
            )}
          </div>

          {/* Sort & Filters Toolbar with Write Review button */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Write Review Button in toolbar */}
            {user && !userReviewData.hasReviewed && (
              <button
                type="button"
                onClick={() => handleOpenNewReview(5)}
                className="rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
              >
                ★ Write a Review
              </button>
            )}

            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterVerified}
                onChange={(e) => {
                  setFilterVerified(e.target.checked);
                  setCurrentPage(1);
                }}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-medium">Verified only</span>
            </label>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium">Sort:</span>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:border-indigo-600 focus:outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        {reviewsLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-xs font-medium">Loading customer reviews...</span>
          </div>
        )}

        {/* Empty State */}
        {!reviewsLoading && reviews.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 py-16 px-4 text-center">
            <div className="mb-3 rounded-full bg-slate-100 p-4 text-2xl">
              💬
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              {filterRating || filterVerified
                ? "No matching reviews found"
                : "No customer reviews yet"}
            </h4>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              {filterRating || filterVerified
                ? "Try clearing the active rating or verified purchase filters."
                : "Have you tried this product? Be the first to share your experience with photos and feedback!"}
            </p>

            {filterRating || filterVerified ? (
              <button
                type="button"
                onClick={() => {
                  setFilterRating(null);
                  setFilterVerified(false);
                }}
                className="mt-4 rounded-xl border border-indigo-600 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 cursor-pointer"
              >
                Reset Filters
              </button>
            ) : user ? (
              <button
                type="button"
                onClick={() => handleOpenNewReview(5)}
                className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 cursor-pointer"
              >
                ★ Be the First to Review
              </button>
            ) : (
              <Link
                to={`/login?redirect=/products/${productId}`}
                className="mt-4 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800"
              >
                Sign In to Leave a Review
              </Link>
            )}
          </div>
        )}

        {/* Reviews Cards */}
        {!reviewsLoading && reviews.length > 0 && (
          <div className="space-y-4">
            {reviews.map((rev) => {
              const isOwner =
                user &&
                rev.user &&
                (rev.user._id === user._id || rev.user === user._id);

              const reviewerName = rev.user?.name || "Verified Customer";
              const initial = reviewerName.charAt(0).toUpperCase();

              return (
                <div
                  key={rev._id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 transition hover:border-slate-300 sm:p-6 shadow-xs"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    {/* Reviewer Details */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 text-sm font-bold text-white shadow-sm">
                        {initial}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {reviewerName}
                          </span>
                          {rev.isVerifiedPurchase && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              <CheckIcon className="w-3 h-3 text-emerald-600" />
                              Verified Purchase
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-slate-400">
                          Reviewed on{" "}
                          {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Author Actions (Edit / Delete) */}
                    {isOwner && (
                      <div className="flex items-center gap-2 self-start text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => handleOpenEditReview(rev)}
                          className="text-indigo-600 hover:underline cursor-pointer"
                        >
                          Edit
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={() => setDeletingId(rev._id)}
                          className="text-rose-600 hover:underline cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Rating Stars & Title */}
                  <div className="mt-3.5 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          className="w-4 h-4"
                          filled={star <= rev.rating}
                        />
                      ))}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">
                      {rev.title}
                    </h4>

                    <p className="text-xs leading-relaxed text-slate-600 whitespace-pre-line pt-1">
                      {rev.comment}
                    </p>

                    {/* Photos attached to this review */}
                    {rev.images && rev.images.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2.5 pt-1">
                        {rev.images.map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setLightboxImage(img.url)}
                            className="group relative h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 transition hover:border-indigo-500 hover:shadow-md cursor-pointer"
                            title="Click to view full photo"
                          >
                            <img
                              src={img.url}
                              alt={`Review attachment ${idx + 1}`}
                              className="h-full w-full object-cover transition duration-200 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {!reviewsLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs font-medium text-slate-500">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Full-Size Photo Modal (Lightbox) */}
      {/* ------------------------------------------------------------- */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-slate-900 p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-black/60 text-white font-bold flex items-center justify-center hover:bg-rose-600 transition cursor-pointer"
              title="Close image"
            >
              ✕
            </button>
            <img
              src={lightboxImage}
              alt="Review attachment preview"
              className="max-h-[80vh] max-w-full rounded-xl object-contain mx-auto"
            />
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Delete Confirmation Modal */}
      {/* ------------------------------------------------------------- */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h4 className="text-base font-black text-slate-900">
              Delete Review?
            </h4>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete your review? This action cannot be undone and will recalculate the product rating.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                disabled={isDeleting}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteReview}
                disabled={isDeleting}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
