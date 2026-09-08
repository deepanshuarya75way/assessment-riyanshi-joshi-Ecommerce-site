import React from "react";
import Button from "../components/ui/Button.jsx";
import { useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart.js";

export function CartSummary() {
  const navigate = useNavigate();
  const { cart, cartTotal, cartCount } = useCart();

  if (!cart) return null;

  return (
    <div className="mt-6 p-5 border-t">
      <div className="flex justify-between mb-4">
        <span>Total items</span>
        <span>{cartCount}</span>
      </div>
      <div className="flex justify-between mb-4">
        <span>Subtotal</span>
        <span>${cartTotal.toFixed(2)}</span>
      </div>
      {cart.items.length > 0 && (
        <Button
          width="100%"
          variant="primary"
          className="mt-3"
          onClick={() => navigate("/checkout")}
        >
          Proceed to Checkout
        </Button>
      )}
    </div>
  );
}