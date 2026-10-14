import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const { user } = useAuth();

  const [cart, setCart] = useState({ items: [], total: 0 });
  const [cartLoading, setCartLoading] = useState(false);

  const [wishlist, setWishlist] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 3500);
  }, []);

  // Fetch Cart
  const fetchCart = useCallback(async () => {
    if (!user) {
      setCart({ items: [], total: 0 });
      return;
    }
    try {
      setCartLoading(true);
      const res = await api.get("/cart");
      setCart(res.data.data || { items: [], total: 0 });
    } catch (err) {
      console.warn("Failed to fetch cart:", err.message);
    } finally {
      setCartLoading(false);
    }
  }, [user]);

  // Fetch Wishlist
  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlist([]);
      return;
    }
    try {
      setWishlistLoading(true);
      const res = await api.get("/wishlist");
      const list = res.data.data?.products || [];
      setWishlist(list);
    } catch (err) {
      console.warn("Failed to fetch wishlist:", err.message);
    } finally {
      setWishlistLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCart();
      fetchWishlist();
    } else {
      setCart({ items: [], total: 0 });
      setWishlist([]);
    }
  }, [user, fetchCart, fetchWishlist]);

  // Total items in cart
  const cartCount = useMemo(() => {
    if (!cart?.items) return 0;
    return cart.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, [cart]);

  // Wishlist item count
  const wishlistCount = useMemo(() => wishlist.length, [wishlist]);

  // Wishlist lookup set for fast O(1) checks
  const wishlistIds = useMemo(() => {
    return new Set(wishlist.map((p) => (typeof p === "object" ? p._id : p)));
  }, [wishlist]);

  const isInWishlist = useCallback(
    (productId) => {
      if (!productId) return false;
      return wishlistIds.has(String(productId));
    },
    [wishlistIds]
  );

  // Add to Cart
  const addToCart = useCallback(
    async (product, variantId, quantity = 1, silent = false) => {
      if (!user) {
        showToast("Please log in to add items to your cart", "info");
        return false;
      }
      if (!product || !variantId) {
        showToast("Please choose an available variant first", "error");
        return false;
      }

      try {
        const res = await api.post("/cart/items", {
          productId: product._id || product,
          variantId,
          quantity,
        });
        setCart(res.data.data || { items: [], total: 0 });
        if (!silent) {
          showToast(`Added "${product.name || "item"}" to cart!`, "success");
        }
        return true;
      } catch (err) {
        const msg = err.response?.data?.message || "Failed to add to cart";
        showToast(msg, "error");
        return false;
      }
    },
    [user, showToast]
  );

  // Update Cart Item Quantity
  const updateCartItem = useCallback(
    async (itemId, quantity) => {
      try {
        const res = await api.put(`/cart/items/${itemId}`, { quantity });
        setCart(res.data.data);
        return true;
      } catch (err) {
        const msg = err.response?.data?.message || "Failed to update quantity";
        showToast(msg, "error");
        return false;
      }
    },
    [showToast]
  );

  // Remove Cart Item
  const removeFromCart = useCallback(
    async (itemId) => {
      try {
        const res = await api.delete(`/cart/items/${itemId}`);
        setCart(res.data.data);
        showToast("Item removed from cart", "info");
        return true;
      } catch (err) {
        const msg = err.response?.data?.message || "Failed to remove item";
        showToast(msg, "error");
        return false;
      }
    },
    [showToast]
  );

  // Clear Cart
  const clearCart = useCallback(async () => {
    try {
      await api.delete("/cart");
      setCart({ items: [], total: 0 });
      return true;
    } catch (err) {
      console.warn("Failed to clear cart:", err.message);
      return false;
    }
  }, []);

  // Toggle Wishlist
  const toggleWishlist = useCallback(
    async (product) => {
      if (!user) {
        showToast("Please log in to manage your wishlist", "info");
        return false;
      }
      const productId = typeof product === "object" ? product._id : product;
      const alreadyIn = isInWishlist(productId);

      try {
        if (alreadyIn) {
          await api.delete(`/wishlist/${productId}`);
          setWishlist((prev) => prev.filter((p) => (p._id || p) !== productId));
          showToast("Removed from wishlist", "info");
        } else {
          await api.post(`/wishlist/${productId}`);
          setWishlist((prev) => [...prev, product]);
          showToast("Saved to wishlist!", "success");
        }
        return true;
      } catch (err) {
        const msg = err.response?.data?.message || "Wishlist update failed";
        showToast(msg, "error");
        return false;
      }
    },
    [user, isInWishlist, showToast]
  );

  // Remove from Wishlist explicitly
  const removeFromWishlist = useCallback(
    async (productId) => {
      try {
        await api.delete(`/wishlist/${productId}`);
        setWishlist((prev) => prev.filter((p) => (p._id || p) !== productId));
        showToast("Item removed from wishlist", "info");
        return true;
      } catch (err) {
        const msg = err.response?.data?.message || "Failed to remove item";
        showToast(msg, "error");
        return false;
      }
    },
    [showToast]
  );

  // Move from Wishlist to Cart
  const moveToCart = useCallback(
    async (product, variantId) => {
      const added = await addToCart(product, variantId, 1, true);
      if (added) {
        await removeFromWishlist(product._id || product);
        showToast(`Moved "${product.name || "Item"}" to cart!`, "success");
        return true;
      }
      return false;
    },
    [addToCart, removeFromWishlist, showToast]
  );

  const value = {
    cart,
    cartCount,
    cartLoading,
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,

    wishlist,
    wishlistCount,
    wishlistLoading,
    fetchWishlist,
    isInWishlist,
    toggleWishlist,
    removeFromWishlist,
    moveToCart,

    toast,
    showToast,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
