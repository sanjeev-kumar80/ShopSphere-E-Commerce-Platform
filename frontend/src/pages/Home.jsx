
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Home.css";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const slides = [
  {
    eyebrow: "THE NEW SEASON IS HERE",
    title: "Find your next\nfavourite thing.",
    description:
      "Discover everyday essentials, the latest tech and little luxuries made for you.",
    button: "Explore Collection",
    image: "/hero-products.png",
    className: "hero-lavender",
  },
  {
    eyebrow: "UPGRADE YOUR EVERYDAY",
    title: "Technology that\nmoves with you.",
    description:
      "Meet your next favourite headphones, smart accessories and modern essentials.",
    button: "Discover Gadgets",
    image: "/hero-tech.png",
    className: "hero-blue",
  },
  {
    eyebrow: "STYLE STARTS HERE",
    title: "A little style.\nA lot of you.",
    description:
      "Refresh your everyday look with timeless pieces and new-season favourites.",
    button: "Shop the Edit",
    image: "/hero-fashion.png",
    className: "hero-peach",
  },
];

const categoryVisuals = {
  electronics: {
    subtitle: "Smart picks for you",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80",
    tone: "category-purple",
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
  lifestyle: {
    subtitle: "Little things, big joy",
    image:
      "https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=700&q=80",
    tone: "category-green",
  },
};

const defaultCategoryVisual = {
  subtitle: "Discover something new",
  image:
    "https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=700&q=80",
  tone: "category-purple",
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
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const navigate = useNavigate();

  const { user, logout } = useAuth();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setAccountMenuOpen(false);
    navigate("/");
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

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
        console.error(
          "Categories fetch failed:",
          error.response?.data || error.message
        );
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

  const changeSlide = (direction) => {
    setActiveSlide(
      (current) => (current + direction + slides.length) % slides.length
    );
  };

  const handleSearch = (event) => {
    event.preventDefault();

    const query = search.trim();

    navigate(
      query ? `/shop?search=${encodeURIComponent(query)}` : "/shop"
    );
  };

  const openCategory = (category) => {
    if (!category?._id) {
      navigate("/shop");
      return;
    }

    navigate(`/shop?category=${encodeURIComponent(category._id)}`);
  };

  const slide = slides[activeSlide];

  return (
    <div className="shop-home">
      <div className="announcement-bar">
        <span>✦</span>
        Your next favourite find is just a click away.
        <span>✦</span>
      </div>

      <header className="store-header">
        <Link to="/" className="store-logo">
          <span className="logo-mark">S</span>
          <span>
            shop<span className="logo-accent">sphere</span>
          </span>
        </Link>

        <form className="store-search" onSubmit={handleSearch}>
          <span className="search-icon">⌕</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search for products, brands and more..."
            aria-label="Search products"
          />
          <button type="submit">Search</button>
        </form>

        <div className="header-actions">

          {user ? (
            <div className="account-menu-wrapper">
              <button
                type="button"
                className="header-action"
                onClick={() => setAccountMenuOpen((open) => !open)}
              >
                <span className="action-icon">♙</span>
                <span>{user.name || "Account"} ▾</span>
              </button>

              {accountMenuOpen && (
                <div className="account-dropdown">
                  <Link to="/orders" onClick={() => setAccountMenuOpen(false)}>
                    My Orders
                  </Link>

                  <button type="button" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="header-action">
              <span className="action-icon">♙</span>
              <span>Login / Account</span>
            </Link>
          )}

          <Link to="/cart" className="header-action">
            <span className="action-icon">♧</span>
            <span>Cart</span>
          </Link>
        </div>
      </header>

      <nav className="store-nav">
        <Link to="/shop" className="nav-highlight">
          Shop All
        </Link>

        {["Electronics", "Fashion", "Footwear", "Lifestyle"].map((name) => {
          const category = categories.find(
            (item) => item.name?.toLowerCase() === name.toLowerCase()
          );

          return (
            <button
              key={name}
              type="button"
              className="nav-category-button"
              onClick={() => openCategory(category)}
            >
              {name}
            </button>
          );
        })}

        <Link to="/shop?sort=newest">New Arrivals</Link>
        <Link to="/orders">My Orders</Link>
      </nav>

      <main>
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
                const visual =
                  categoryVisuals[category.name?.toLowerCase()] ||
                  defaultCategoryVisual;

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

      <footer className="store-footer">
        <Link to="/" className="store-logo footer-logo">
          <span className="logo-mark">S</span>
          <span>
            shop<span className="logo-accent">sphere</span>
          </span>
        </Link>
        <p>Discover good things. Make them yours.</p>
        <span>© {new Date().getFullYear()} ShopSphere</span>
      </footer>
    </div>
  );
}

export default Home;
