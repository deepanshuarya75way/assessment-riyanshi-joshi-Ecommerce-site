import React from "react";
import Button from "../components/ui/Button.jsx";
import { useCart } from "../hooks/useCart.js";

export function CartItem({ product }) {
  const { removeCartItem, updateCartItem } = useCart();

  return (
    <div className="flex items-center gap-4 pb-4 border-b last:border-0">
      <img
        src={product.images?.[0] || "/placeholder.jpg"}
        alt={product.name}
        width="60"
        height="60"
        className="object-cover rounded"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{product.name}</p>
        <p className="text-sm text-muted-foreground">
          {product.sku || ""}
        </p>
      </div>
      <div className="w-24">
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateCartItem(product._id, 1)}
            disabled={true}
            className="flex-1 px-2 py-1 text-xs rounded border disabled:opacity-50 disabled:pointer-events-none"
          >
            +
          </button>
          <input
            type="number"
            value={product.quantity || 1}
            min="1"
            step="1"
            className="w-16 text-center border rounded"
            onChange={(e) => {
              const val = Math.max(1, parseInt(e.target.value) || 1);
              updateCartItem(product._id, val);
            }}
          />
          <button
            onClick={() => updateCartItem(product._id, Math.max(1, (product.quantity || 1) - 1))}
            className="flex-1 px-2 py-1 text-xs rounded border"
          >
            -
          </button>
        </div>
      </div>
      <div className="w-24 text-right font-medium">
        ${(
          (product.price || 0) * (product.quantity || 1)
        ).toFixed(2)}
      </div>
      <button
        onClick={() => removeCartItem(product._id)}
        className="text-red-600 text-xs hover:underline"
      >
        Remove
      </button>
    </div>
  );
}