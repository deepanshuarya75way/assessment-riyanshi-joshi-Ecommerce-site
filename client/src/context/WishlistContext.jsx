import { createContext, useState, useEffect, useCallback, useContext } from "react";
import { wishlistAPI } from "../services/api.js";
import { AuthContext } from "../context/AuthContext.jsx";

export const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const authContext = useContext(AuthContext);
  const [wishlist, setWishlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getWishlist = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await wishlistAPI.getWishlist();
      setWishlist(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  }, []);

  const addToWishlist = useCallback(async (productId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await wishlistAPI.addToWishlist(productId);
      setWishlist(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add to wishlist");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeFromWishlist = useCallback(async (productId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await wishlistAPI.removeFromWishlist(productId);
      setWishlist(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove from wishlist");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearWishlist = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await wishlistAPI.clearWishlist();
      setWishlist(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to clear wishlist");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const isInWishlist = useCallback((productId) => {
    if (!wishlist || !wishlist.products) return false;
    return wishlist.products.some((item) => item.product.equals(productId));
  }, [wishlist]);

  useEffect(() => {
    if (authContext.user) {
      getWishlist();
    }
  }, [getWishlist]);

  const value = {
    wishlist,
    products: wishlist ? wishlist.products : [],
    loading,
    error,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    isInWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}