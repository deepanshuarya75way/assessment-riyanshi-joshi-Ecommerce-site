import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart.js';

export default function ProductCard({ product }) {
  const { addToCart, isInCart } = useCart();
  const hasDiscount =
    product.compareAtPrice && product.compareAtPrice > product.price;

  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  const inStock = product.stock > 0;

  const addToCartHandler = () => {
    if (!inStock) return;
    addToCart(product._id, 1);
  };

  return (
    <Link
      to={`/products/${product._id}`}
      className="group block rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-slate-100">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {hasDiscount && (
          <span className="absolute left-3 top-3 rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-bold text-white">
            -{discountPercent}%
          </span>
        )}

        {!inStock && (
          <span className="absolute right-3 top-3 rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-white">
            Out of stock
          </span>
        )}
      </div>

      <div className="p-4">
        {product.category?.name && (
          <p className="text-xs font-medium text-indigo-600">{product.category.name}</p>
        )}

        <h3 className="mt-1 text-sm font-semibold text-slate-900 line-clamp-2 group-hover:text-indigo-600">
          {product.name}
        </h3>

        {product.brand && (
          <p className="mt-0.5 text-xs text-slate-500">{product.brand}</p>
        )}

        {product.rating > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className={`h-3.5 w-3.5 ${i < Math.round(product.rating) ? 'fill-current' : 'fill-slate-200'}`} viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-slate-500">
              {product.rating.toFixed(1)} ({product.numReviews} review{product.numReviews !== 1 ? 's' : ''})
            </span>
          </div>
        )}

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-bold text-slate-900">
            ${product.price.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-slate-400 line-through">
              ${product.compareAtPrice.toFixed(2)}
            </span>
          )}
        </div>

        <p className="mt-1 text-xs text-slate-500">
          {inStock ? `${product.stock} in stock` : 'Out of stock'}
        </p>

        {inStock && (
          <button
            onClick={addToCartHandler}
            className="mt-2 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!inStock}
          >
            {isInCart ? "In cart" : "Add to Cart"}
          </button>
        )}
      </div>
    </Link>
  );
}
