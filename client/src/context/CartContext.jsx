import { createContext, useState, useEffect, useCallback, useContext } from "react";
import { cartAPI } from "../services/api.js";
import { AuthContext } from "../context/AuthContext.jsx";

export const CartContext = createContext(null);

export function CartProvider({ children }) {
  const authContext = useContext(AuthContext) || { user: null };
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getCart = useCallback(async () => {
    if (!authContext.user) {
      setCart(null);
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await cartAPI.getCart();
      setCart(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load cart");
      setCart(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [authContext.user]);

  const addToCart = useCallback(async (productId, quantity = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartAPI.addToCart(productId, quantity);
      setCart(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add to cart");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCartItem = useCallback(async (productId, quantity) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartAPI.updateCartItem(productId, quantity);
      setCart(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update cart item");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeCartItem = useCallback(async (productId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartAPI.removeCartItem(productId);
      setCart(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove from cart");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartAPI.clearCart();
      setCart(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to clear cart");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authContext.user) {
      getCart();
      return;
    }

    setCart(null);
    setError(null);
    setLoading(false);
  }, [authContext.user, getCart]);

  const isInCart = useCallback((productId) => {
    if (!productId || !cart || !Array.isArray(cart.items)) return false;
    return cart.items.some((item) => {
      if (!item) return false;
      const itemProductId = typeof item.product === 'string' ? item.product : item?.product?._id;
      return itemProductId && itemProductId.toString() === productId.toString();
    });
  }, [cart]);

  const value = {
    cart,
    items: cart ? cart.items : [],
    cartCount: cart ? cart.items.reduce((total, item) => total + (item.quantity || 0), 0) : 0,
    cartTotal: cart ? cart.items.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 1)), 0) : 0,
    loading,
    error,
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    isInCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}