import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart.js";
import { AuthContext } from "../context/AuthContext.jsx";
import { CartItem } from "../components/CartItem.jsx";
import { CartSummary } from "../components/CartSummary.jsx";
import Button from "../components/ui/Button.jsx";

export function Cart() {
  const { user } = useContext(AuthContext);
  const { cart, loading, error, getCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    getCart();
  }, [user, navigate, getCart]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-40 rounded bg-slate-200" />
          <div className="h-28 rounded-2xl bg-slate-200" />
          <div className="h-28 rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-xl font-semibold text-slate-900">We could not load your cart</h1>
        <p className="mt-2 text-sm text-red-600">{error}</p>
        <Button variant="outline" className="mt-5" onClick={getCart}>Try again</Button>
      </div>
    );
  }

  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          <span className="text-2xl" aria-hidden="true">+</span>
        </div>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">Your cart is empty</h1>
        <p className="mt-2 text-sm text-slate-500">Browse the catalog and add something you like.</p>
        <Button variant="outline" className="mt-5" onClick={() => navigate("/products")}>
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">Your selection</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Shopping cart</h1>
        </div>
        <button type="button" onClick={() => navigate('/products')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
          Continue shopping
        </button>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="space-y-4">
          {cart.items.map((item) => (
            <CartItem key={item.product?._id || item.product} product={item} />
          ))}
        </div>
        <CartSummary />
      </div>
    </div>
  );
}