import React from "react";
import Button from "../components/ui/Button.jsx";
import { useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart.js";

export function CartSummary() {
  const navigate = useNavigate();
  const { cart, cartTotal, cartCount } = useCart();

  if (!cart) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Order summary</h2>
      <div className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Items</span>
          <span>{cartCount}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Subtotal</span>
          <span>${cartTotal.toFixed(2)}</span>
        </div>
      </div>
      <div className="mt-5 flex justify-between border-t border-slate-200 pt-4 text-base font-semibold text-slate-900">
        <span>Total</span>
        <span>${cartTotal.toFixed(2)}</span>
      </div>
      {cart.items.length > 0 && (
        <Button
          width="100%"
          variant="primary"
          className="mt-5"
          onClick={() => navigate("/checkout")}
        >
          Proceed to Checkout
        </Button>
      )}
    </div>
  );
}