import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { useCart } from "../hooks/useCart.js";
import { useWishlist } from "../hooks/useWishlist.js";
import Button from "../components/ui/Button.jsx";

export function Wishlist() {
  const { user } = useContext(AuthContext);
  const { addToCart, isInCart } = useCart();
  const {
    wishlist,
    products,
    loading,
    error,
    getWishlist,
    removeFromWishlist,
  } = useWishlist();

  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    if (!wishlist) {
      getWishlist();
    }
  }, [user, wishlist, getWishlist, navigate]);

  if (!user) return null;

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-12 text-center text-slate-500 sm:px-6 lg:px-8">Loading wishlist...</div>;
  }

  if (error) {
    return <div className="mx-auto max-w-2xl px-4 py-12 text-center text-red-600 sm:px-6">Error: {error}</div>;
  }

  if (!products || products.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6">
        <h3 className="text-xl font-semibold text-slate-900">Your wishlist is empty</h3>
        <p className="mt-2 text-sm text-slate-500">Save products you love here.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/products')}>
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-bold text-slate-900">My Wishlist</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {products.map((item) => {
          const product = item.product;
          if (!product) return null;

          const inCart = isInCart(product._id);
          const inStock = product.isActive && product.stock > 0;

          return (
            <div key={product._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              {product.images?.[0] ? (
                <img src={product.images[0]} alt={product.name} className="h-48 w-full rounded-xl object-cover" />
              ) : (
                <div className="flex h-48 w-full items-center justify-center rounded-xl bg-slate-100 text-sm font-medium text-slate-400">No image</div>
              )}

              <div className="mt-4">
                <h3 className="text-base font-semibold text-slate-900">{product.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{product.brand || product.sku || ''}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-lg font-bold text-slate-900">${Number(product.price || 0).toFixed(2)}</span>
                  <span className={`text-xs font-medium ${inStock ? 'text-emerald-600' : 'text-red-600'}`}>
                    {inStock ? 'In stock' : 'Out of stock'}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  disabled={!inStock || inCart}
                  onClick={async () => {
                    await addToCart(product._id, 1);
                    await removeFromWishlist(product._id);
                  }}
                >
                  {inCart ? 'In cart' : 'Move to cart'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => removeFromWishlist(product._id)}>
                  Remove
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
