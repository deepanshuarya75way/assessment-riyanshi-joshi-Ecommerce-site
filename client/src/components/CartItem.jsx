import React, { useMemo } from "react";
import { useCart } from "../hooks/useCart.js";

export function CartItem({ product }) {
  const { removeCartItem, updateCartItem } = useCart();
  const productData = product?.product || product;
  const productId = productData?._id || product?.product || product?._id;
  const availableStock = Number(productData?.stock ?? productData?.availableStock ?? 999);
  const currentQuantity = Number(product?.quantity || 1);
  const lineTotal = (Number(productData?.price ?? product?.price ?? 0) * currentQuantity).toFixed(2);
  const canIncrease = useMemo(() => currentQuantity < availableStock, [currentQuantity, availableStock]);

  const handleQuantityChange = async (nextValue) => {
    const safeValue = Math.max(1, Math.min(availableStock || 1, Number(nextValue) || 1));
    await updateCartItem(productId, safeValue);
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
      {productData?.images?.[0] ? (
        <img
          src={productData.images[0]}
          alt={productData?.name || "Product"}
          width="72"
          height="72"
          className="h-20 w-20 rounded-xl object-cover"
        />
      ) : (
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
          No image
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-slate-900">{productData?.name || "Product"}</p>
        <p className="text-sm text-slate-500">{productData?.sku || ""}</p>
        <p className="mt-1 text-sm text-slate-500">
          {availableStock > 0 ? `${availableStock} in stock` : "Out of stock"}
        </p>
      </div>

      <div className="w-full max-w-[180px]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleQuantityChange(currentQuantity + 1)}
            disabled={!canIncrease}
            aria-label="Increase quantity"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-lg text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>

          <input
            type="number"
            value={currentQuantity}
            min="1"
            max={availableStock || 1}
            step="1"
            aria-label={`Quantity for ${productData?.name || "product"}`}
            className="w-16 rounded-lg border border-slate-300 px-2 py-2 text-center text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            onChange={(e) => handleQuantityChange(e.target.value)}
          />

          <button
            type="button"
            onClick={() => handleQuantityChange(currentQuantity - 1)}
            disabled={currentQuantity <= 1}
            aria-label="Decrease quantity"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-lg text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            -
          </button>
        </div>
      </div>

      <div className="w-full text-left font-semibold text-slate-900 sm:w-24 sm:text-right">
        ${lineTotal}
      </div>

      <button
        type="button"
        onClick={() => removeCartItem(productId)}
        className="text-sm font-medium text-red-600 transition hover:text-red-700"
      >
        Remove
      </button>
    </div>
  );
}