import { createContext, useState, useEffect, useCallback, useContext } from "react";
import { wishlistAPI } from "../services/api.js";
import { AuthContext } from "../context/AuthContext.jsx";

export const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const authContext = useContext(AuthContext) || { user: null };
  const [wishlist, setWishlist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getWishlist = useCallback(async () => {
    if (!authContext.user) {
      setWishlist(null);
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await wishlistAPI.getWishlist();
      setWishlist(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load wishlist");
      setWishlist(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [authContext.user]);

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
    if (!productId || !wishlist || !Array.isArray(wishlist.products)) return false;
    return wishlist.products.some((item) => {
      if (!item) return false;
      const itemProductId = typeof item.product === 'string' ? item.product : item?.product?._id;
      return itemProductId && itemProductId.toString() === productId.toString();
    });
  }, [wishlist]);

  useEffect(() => {
    if (authContext.user) {
      getWishlist();
      return;
    }

    setWishlist(null);
    setError(null);
    setLoading(false);
  }, [authContext.user, getWishlist]);

  const value = {
    wishlist,
    products: wishlist ? wishlist.products : [],
    loading,
    error,
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    isInWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}