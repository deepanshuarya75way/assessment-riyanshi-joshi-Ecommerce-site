import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productAPI, reviewAPI } from '../services/api.js';
import { useCart } from '../hooks/useCart.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useReviews } from '../hooks/useReviews.jsx';

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eligibility, setEligibility] = useState(null);

  const { addToCart, isInCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  const { reviews: productReviews, loadingReviews, errorReviews, pagination } = useReviews(id);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await productAPI.getProduct(id);
        setProduct(res.data.product);
      } catch (err) {
        setError(err.response?.data?.message || 'Product not found');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    const checkEligibility = async () => {
      if (!isAuthenticated) {
        setEligibility('not_logged_in');
        return;
      }

      // Check if user already reviewed this product
      try {
        const myReview = await reviewAPI.getMyReview(id);
        if (myReview.data.reviewed) {
          setEligibility('purchased_reviewed');
          return;
        }
        setEligibility('purchased_not_reviewed');
      } catch (err) {
        setEligibility('not_purchased');
      }
    };
    checkEligibility();
  }, [isAuthenticated, id]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-slate-500">
        <Link to="/" className="hover:text-indigo-600">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/products" className="hover:text-indigo-600">Products</Link>
        {product.category && (
          <>
            <span className="mx-2">/</span>
            <Link
              to={`/products?category=${product.category._id}`}
              className="hover:text-indigo-600"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-slate-700">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Images */}
        <div>
          <div className="aspect-square overflow-hidden rounded-2xl bg-slate-100">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">
                <svg className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {product.images.slice(0, 4).map((img, i) => (
                <div key={i} className="aspect-square overflow-hidden rounded-lg bg-slate-100">
                  <img src={img} alt={`${product.name} ${i + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.category && (
            <Link
              to={`/products?category=${product.category._id}`}
              className="text-sm font-medium text-indigo-600 hover:underline"
            >
              {product.category.name}
            </Link>
          )}

          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            {product.name}
          </h1>

          {product.brand && (
            <p className="mt-1 text-sm text-slate-500">Brand: {product.brand}</p>
          )}

          <div className="mt-3 flex items-center gap-2">
            {product.rating > 0 && (
              <>
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`h-5 w-5 ${i < Math.round(product.rating) ? 'fill-current' : 'fill-slate-200'}`}
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                      />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-slate-500">
                  {product.rating.toFixed(1)} ({product.numReviews} review{product.numReviews !== 1 ? 's' : ''})
                </span>
              </>
            )}

            {eligibility && eligibility === 'not_purchased' && (
              <span className="ml-2 text-xs text-slate-500 cursor-not-allowed">
                Purchase to review
              </span>
            )}
          </div>

          {eligibility === 'purchased_reviewed' && (
            <span className="ml-2 text-xs text-emerald-600">
              Already reviewed
            </span>
          )}

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-slate-900">
              ${product.price.toFixed(2)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-lg text-slate-400 line-through">
                  ${product.compareAtPrice.toFixed(2)}
                </span>
                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-sm font-bold text-red-600">
                  Save {discountPercent}%
                </span>
              </>
            )}
          </div>

          <div className="mt-4">
            {inStock ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                In Stock ({product.stock} available)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                Out of Stock
              </span>
            )}
          </div>

          <div className="mt-4">
            {inStock ? (
              <button
                type="button"
                onClick={() => addToCart(product._id, 1)}
                disabled={!inStock || isInCart}
                className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {isInCart ? "In cart" : "Add to Cart"}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                Out of Stock
              </span>
            )}
            <p className="mt-2 text-xs text-slate-400">Added to cart successfully</p>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <h2 className="text-sm font-semibold text-slate-900">Description</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {product.description}
            </p>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12 pt-8 border-t border-slate-200">
        <h2 className="text-sm font-semibold text-slate-900">Reviews</h2>

        {loadingReviews && (
          <div className="h-64 animate-pulse">
            <div className="grid grid-cols-3 gap-4 py-8">
              <div className="aspect-square rounded bg-slate-100" />
              <div className="aspect-square rounded bg-slate-100" />
              <div className="aspect-square rounded bg-slate-100" />
            </div>
          </div>
        )}

        {errorReviews && (
          <p className="text-sm text-slate-500 mt-2">{errorReviews}</p>
        )}

        {productReviews.length > 0 && (
          <>
            <div className="mt-4">
              {productReviews.map((review) => (
                <div key={review._id} className="mt-3 p-3 rounded bg-slate-50">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="h-4 w-4 text-amber-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                      />
                    </svg>
                    {Array.from({ length: Math.round(review.rating) }).fill(0).map((_, i) => i + 1)}
                  </div>

                  <p className="text-sm font-medium text-slate-900">
                    {review.title || 'No title'}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    {review.comment}
                  </p>
                  <div className="text-xs text-slate-400">
                    {review.user.fullName || 'Anonymous'} ·
                    {new Date(review.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Review eligibility and form */}
        {isAuthenticated && (
          <>
            {eligibility === 'purchased_not_reviewed' && (
              <div className="mt-6 p-4 rounded-lg bg-indigo-50 border border-indigo-200">
                <h3 className="text-sm font-medium text-indigo-700 mb-3">Write a Review</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const rating = Number(e.target.rating.value);
                    const title = e.target.title.value;
                    const comment = e.target.comment.value;
                    reviewAPI.createReview(id, { rating, title, comment });
                  }}
                  className="space-y-3"
                >
                  <div>
                    <label className="block text-sm text-slate-700 mb-1">Rating</label>
                    <select name="rating" required className="w-full rounded-lg border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <option key={star} value={star}>
                          {star} star{star !== 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-700 mb-1">Title</label>
                    <input
                      type="text"
                      name="title"
                      placeholder="Optional title"
                      maxLength={100}
                      className="w-full rounded-lg border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-700 mb-1">Comment</label>
                    <textarea
                      name="comment"
                      placeholder="Share your experience..."
                      maxLength={2000}
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                    </textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={true}
                    className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Submit Review
                  </button>
                </form>
              </div>
            )}

            {eligibility === 'purchased_reviewed' && (
              <div className="mt-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                <h3 className="text-sm font-medium text-emerald-700 mb-3">Edit Review</h3>
                <p className="text-sm text-emerald-600 mb-3">
                  You've already reviewed this product. Edit your review below.
                </p>
                <p>Edit review functionality coming soon</p>
              </div>
            )}

            {eligibility === 'not_purchased' && (
              <div className="mt-6 p-4 bg-slate-50 border border-slate-200">
                <h3 className="text-sm font-medium text-slate-600 mb-3">
                  Purchase this product to leave a review
                </h3>
                <p className="text-sm text-slate-500">
                  You need to purchase this product before you can leave a review.
                </p>
              </div>
            )}
          </>
        )}

        {!isAuthenticated && (
          <div className="mt-6 p-4 bg-slate-50 border border-slate-200">
            <h3 className="text-sm font-medium text-slate-600 mb-3">Login to review</h3>
            <p className="text-sm text-slate-500">
              Login to leave a review for this product.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

