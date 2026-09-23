import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart.js';
import { useWishlist } from '../hooks/useWishlist.js';
import useAuth from '../hooks/useAuth.js';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, isInCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;

  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  const inStock = product.stock > 0;
  const isSaved = isInWishlist(product._id);

  const addToCartHandler = () => {
    if (!inStock) return;
    addToCart(product._id, 1);
  };

  const toggleWishlist = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      navigate('/login');
      return;
    }

    if (isSaved) {
      await removeFromWishlist(product._id);
      return;
    }

    await addToWishlist(product._id);
  };

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative">
        <Link to={`/products/${product._id}`} className="block">
          <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-slate-100">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">
                <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}

            {hasDiscount && (
              <span className="absolute left-3 top-3 rounded-full bg-red-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                -{discountPercent}%
              </span>
            )}

            {!inStock && (
              <span className="absolute right-3 top-3 rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Sold out
              </span>
            )}
          </div>
        </Link>

        <button
          type="button"
          aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={toggleWishlist}
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/90 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
            isSaved ? 'text-red-600' : 'text-slate-700'
          }`}
        >
          <svg viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
            <path d="M12 21s-8.5-5.2-11-10.2C-1.1 7.3 1.4 3 5.5 3c2.6 0 4 1.4 6.5 4.1C14.6 4.4 16 3 18.5 3c4.1 0 6.6 4.3 4.5 7.8C20.5 15.8 12 21 12 21Z" />
          </svg>
        </button>
      </div>

      <Link to={`/products/${product._id}`} className="block p-4">
        {product.category?.name && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-600">{product.category.name}</p>
        )}

        <h3 className="mt-2 text-sm font-semibold text-slate-900 line-clamp-2 group-hover:text-indigo-600">
          {product.name}
        </h3>

        {product.brand && (
          <p className="mt-1 text-xs text-slate-500">{product.brand}</p>
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
          <span className="text-lg font-bold text-slate-900">${product.price.toFixed(2)}</span>
          {hasDiscount && (
            <span className="text-sm text-slate-400 line-through">${product.compareAtPrice.toFixed(2)}</span>
          )}
        </div>

        <p className="mt-1 text-xs text-slate-500">
          {inStock ? `${product.stock} in stock` : 'Out of stock'}
        </p>
      </Link>

      {inStock && (
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={addToCartHandler}
            className="w-full rounded-lg bg-indigo-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!inStock || isInCart(product._id)}
          >
            {isInCart(product._id) ? 'In cart' : 'Add to Cart'}
          </button>
        </div>
      )}
    </div>
  );
}
