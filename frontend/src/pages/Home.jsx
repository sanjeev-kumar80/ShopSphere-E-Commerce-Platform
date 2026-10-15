import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Home.css";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import { SparklesIcon } from "../components/Icons";

const slides = [
  {
    eyebrow: "THE NEW SEASON IS HERE",
    title: "Find your next\nfavourite thing.",
    description:
      "Discover everyday essentials, the latest tech and little luxuries made for you.",
    button: "Explore Collection",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
    className: "hero-lavender",
  },
  {
    eyebrow: "UPGRADE YOUR EVERYDAY",
    title: "Technology that\nmoves with you.",
    description:
      "Meet your next favourite headphones, smart accessories and modern essentials.",
    button: "Discover Gadgets",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    className: "hero-blue",
  },
  {
    eyebrow: "STYLE STARTS HERE",
    title: "A little style.\nA lot of you.",
    description:
      "Refresh your everyday look with timeless pieces and new-season favourites.",
    button: "Shop the Edit",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
    className: "hero-peach",
  },
];

const categoryVisuals = {
  "audio-wearables": {
    subtitle: "Immersive sound & gear",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80",
    tone: "category-purple",
  },
  "audio & wearables": {
    subtitle: "Immersive sound & gear",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80",
    tone: "category-purple",
  },
  "beauty-grooming": {
    subtitle: "Daily glow & self care",
    image:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=700&q=80",
    tone: "category-peach",
  },
  "beauty & grooming": {
    subtitle: "Daily glow & self care",
    image:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=700&q=80",
    tone: "category-peach",
  },
  electronics: {
    subtitle: "Smart picks for you",
    image:
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=700&q=80",
    tone: "category-blue",
  },
  "fashion-apparel": {
    subtitle: "Your everyday style",
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=700&q=80",
    tone: "category-peach",
  },
  "fashion & apparel": {
    subtitle: "Your everyday style",
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=700&q=80",
    tone: "category-peach",
  },
  fashion: {
    subtitle: "Your everyday style",
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=700&q=80",
    tone: "category-peach",
  },
  footwear: {
    subtitle: "Step into something new",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80",
    tone: "category-blue",
  },
  "home-living": {
    subtitle: "Craft your sanctuary",
    image:
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=700&q=80",
    tone: "category-green",
  },
  "home & living": {
    subtitle: "Craft your sanctuary",
    image:
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=700&q=80",
    tone: "category-green",
  },
  lifestyle: {
    subtitle: "Craft your sanctuary",
    image:
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=700&q=80",
    tone: "category-green",
  },
  "sports-fitness": {
    subtitle: "Gear up for greatness",
    image:
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=700&q=80",
    tone: "category-purple",
  },
  "sports & fitness": {
    subtitle: "Gear up for greatness",
    image:
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=700&q=80",
    tone: "category-purple",
  },
  fitness: {
    subtitle: "Gear up for greatness",
    image:
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=700&q=80",
    tone: "category-purple",
  },
  sports: {
    subtitle: "Gear up for greatness",
    image:
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=700&q=80",
    tone: "category-purple",
  },
};

const defaultCategoryVisual = {
  subtitle: "Discover something new",
  image:
    "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=700&q=80",
  tone: "category-purple",
};

const getCategoryVisual = (category) => {
  const slugKey = category?.slug?.toLowerCase().trim();
  const nameKey = category?.name?.toLowerCase().trim();

  let matched =
    (slugKey && categoryVisuals[slugKey]) ||
    (nameKey && categoryVisuals[nameKey]);

  if (!matched && (slugKey || nameKey)) {
    const combined = `${slugKey || ""} ${nameKey || ""}`;
    const foundEntry = Object.entries(categoryVisuals).find(([key]) =>
      combined.includes(key)
    );
    if (foundEntry) {
      matched = foundEntry[1];
    }
  }

  const baseVisual = matched || defaultCategoryVisual;

  const validBackendImage =
    category?.image &&
    typeof category.image === "string" &&
    category.image.trim() !== "" &&
    !category.image.includes("photo-1490312278390-ab64016e0aa9");

  const chosenImage = validBackendImage ? category.image : baseVisual.image;

  return {
    ...baseVisual,
    image: chosenImage,
    fallbackImage: baseVisual.image,
  };
};

const benefits = [
  {
    icon: "✦",
    title: "Curated for you",
    text: "Thoughtful finds for everyday living.",
  },
  {
    icon: "↗",
    title: "Easy shopping",
    text: "A smoother way to discover what you love.",
  },
  {
    icon: "♡",
    title: "Made to delight",
    text: "A little inspiration with every visit.",
  },
];

function Home() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const navigate = useNavigate();

  // Slide autoplay
  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, []);

  // Fetch Categories
  useEffect(() => {
    let cancelled = false;

    const fetchCategories = async () => {
      try {
        const response = await api.get("/categories");
        const categoryList = response.data?.data?.categories || [];

        if (!cancelled) {
          setCategories(categoryList);
        }
      } catch (error) {
        console.error("Categories fetch failed:", error.message);
      } finally {
        if (!cancelled) {
          setCategoriesLoading(false);
        }
      }
    };

    fetchCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch Featured Products
  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      try {
        const res = await api.get("/products", {
          params: { limit: 8, sort: "newest" },
        });
        const list = res.data.data?.products || [];
        if (!cancelled) {
          setFeaturedProducts(list);
        }
      } catch (err) {
        console.warn("Featured products load error:", err.message);
      } finally {
        if (!cancelled) {
          setProductsLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const changeSlide = (direction) => {
    setActiveSlide(
      (current) => (current + direction + slides.length) % slides.length
    );
  };

  const slide = slides[activeSlide];

  return (
    <div className="shop-home">
      <main>
        {/* Hero Slider */}
        <section
          className={`hero-banner ${slide.className}`}
          style={{ "--hero-image": `url("${slide.image}")` }}
        >
          <div className="hero-copy" key={activeSlide}>
            <span className="hero-eyebrow">
              <span className="eyebrow-line" />
              {slide.eyebrow}
            </span>

            <h1>{slide.title}</h1>
            <p>{slide.description}</p>

            <button
              className="primary-button"
              onClick={() => navigate("/shop")}
            >
              {slide.button}
              <span>↗</span>
            </button>

            <div className="hero-note">
              <span className="hero-note-icon">✳</span>
              Good finds. Great feelings.
            </div>
          </div>

          <button
            className="hero-arrow hero-prev"
            onClick={() => changeSlide(-1)}
            aria-label="Previous slide"
          >
            ‹
          </button>

          <button
            className="hero-arrow hero-next"
            onClick={() => changeSlide(1)}
            aria-label="Next slide"
          >
            ›
          </button>

          <div className="hero-pagination">
            {slides.map((item, index) => (
              <button
                key={item.eyebrow}
                className={`hero-dot ${
                  index === activeSlide ? "active" : ""
                }`}
                onClick={() => setActiveSlide(index)}
                aria-label={`Show slide ${index + 1}`}
              />
            ))}

            <span>
              0{activeSlide + 1}{" "}
              <span className="pagination-divider">/</span> 0{slides.length}
            </span>
          </div>
        </section>

        {/* Benefits Strip */}
        <section className="benefits-strip">
          {benefits.map((benefit) => (
            <div className="benefit-item" key={benefit.title}>
              <div className="benefit-icon">{benefit.icon}</div>
              <div>
                <h3>{benefit.title}</h3>
                <p>{benefit.text}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Categories Section */}
        <section className="home-section categories-section">
          <div className="section-heading">
            <div>
              <span className="section-kicker">
                A LITTLE BIT OF EVERYTHING
              </span>
              <h2>
                Explore your world<span>.</span>
              </h2>
              <p>Good things are waiting in every corner.</p>
            </div>

            <Link to="/shop" className="text-link">
              Explore all categories <span>↗</span>
            </Link>
          </div>

          {categoriesLoading ? (
            <p className="category-status">Loading categories...</p>
          ) : categories.length === 0 ? (
            <p className="category-status">
              Categories are not available right now.
            </p>
          ) : (
            <div className="category-grid">
              {categories.map((category, index) => {
                const visual = getCategoryVisual(category);

                return (
                  <Link
                    to={`/shop?category=${encodeURIComponent(category._id)}`}
                    className={`category-card ${visual.tone}`}
                    key={category._id}
                  >
                    <div className="category-image">
                      <img
                        src={visual.image}
                        alt={category.name}
                        loading="lazy"
                        onError={(e) => {
                          if (e.currentTarget.src !== visual.fallbackImage) {
                            e.currentTarget.src = visual.fallbackImage;
                          }
                        }}
                      />
                      <span className="category-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <div className="category-info">
                      <div>
                        <h3>{category.name}</h3>
                        <p>{visual.subtitle}</p>
                      </div>
                      <span className="category-arrow">↗</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Featured Products Showcase Section */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 border-t border-slate-100">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600">
                <SparklesIcon className="w-4 h-4 text-amber-500" /> Handpicked For You
              </span>
              <h2 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
                Featured New Arrivals
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Explore popular essentials and best sellers in stock right now.
              </p>
            </div>

            <Link
              to="/shop"
              className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-800 transition hover:bg-indigo-50 hover:text-indigo-600"
            >
              <span>View All Catalog</span>
              <span>→</span>
            </Link>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse space-y-4"
                >
                  <div className="aspect-square rounded-xl bg-slate-200" />
                  <div className="h-4 w-1/3 rounded bg-slate-200" />
                  <div className="h-5 w-3/4 rounded bg-slate-200" />
                  <div className="h-10 w-full rounded-xl bg-slate-200" />
                </div>
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-10">
              No products found. Run seed script or add products in admin panel.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {featuredProducts.map((prod) => (
                <ProductCard key={prod._id} product={prod} />
              ))}
            </div>
          )}
        </section>

        {/* Collection Banner */}
        <section className="collection-banner">
          <div className="collection-copy">
            <span className="section-kicker">YOUR NEXT DISCOVERY</span>
            <h2>
              Less scrolling.
              <br />
              More loving what you find.
            </h2>
            <p>
              Explore our collection and find something that feels just right.
            </p>
            <button
              className="primary-button"
              onClick={() => navigate("/shop")}
            >
              Find Your Favourite <span>↗</span>
            </button>
          </div>

          <div className="collection-art">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-center">
              <span>YOUR</span>
              <strong>
                next
                <br />
                favourite
              </strong>
              <span>IS HERE ✳</span>
            </div>
            <span className="floating-star star-one">✳</span>
            <span className="floating-star star-two">✦</span>
            <span className="floating-star star-three">✧</span>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="bottom-cta">
          <div>
            <span className="section-kicker">READY WHEN YOU ARE</span>
            <h2>Something good is just around the corner.</h2>
          </div>
          <button
            className="primary-button"
            onClick={() => navigate("/shop")}
          >
            Start Exploring <span>↗</span>
          </button>
        </section>
      </main>
    </div>
  );
}

export default Home;
