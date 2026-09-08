import { createContext, useState, useEffect, useCallback, useContext } from "react";
import { cartAPI } from "../services/api.js";
import { AuthContext } from "../context/AuthContext.jsx";

export const CartContext = createContext(null);

export function CartProvider({ children }) {
  const authContext = useContext(AuthContext);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartAPI.getCart();
      setCart(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load cart");
    } finally {
      setLoading(false);
    }
  }, []);

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
    }
  }, [getCart]);

  const value = {
    cart,
    items: cart ? cart.items : [],
    cartCount: cart ? cart.items.reduce((total, item) => total + (item.quantity || 0), 0) : 0,
    cartTotal: cart ? cart.items.reduce((total, item) => total + (item.price || 0) * (item.quantity || 1), 0) : 0,
    loading,
    error,
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}