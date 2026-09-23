import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productAPI, reviewAPI } from '../services/api.js';
import { useCart } from '../hooks/useCart.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useReviews } from '../hooks/useReviews.jsx';
import { useWishlist } from '../hooks/useWishlist.js';
import useRecentlyViewed from '../hooks/useRecentlyViewed.js';
import ProductGrid from '../components/ProductGrid.jsx';

const emptyReviewForm = {
  rating: 5,
  title: '',
  comment: '',
};

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eligibility, setEligibility] = useState('checking');
  const [myReview, setMyReview] = useState(null);
  const [reviewForm, setReviewForm] = useState(emptyReviewForm);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [savingReview, setSavingReview] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState('');
  const [cartMessage, setCartMessage] = useState('');

  const { addToCart, isInCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { products: recentlyViewed, loading: loadingRecentlyViewed, recordProduct } = useRecentlyViewed();
  const { reviews: productReviews, loadingReviews, errorReviews, refetch: refetchReviews } = useReviews(id);

  const fetchProduct = async () => {
    if (!id) return;

    setLoading(true);
    setError('');

    try {
      const res = await productAPI.getProduct(id);
      const productData = res.data.product;
      setProduct(productData);
      setSelectedImage(productData?.images?.[0] || '');
      recordProduct(productData?._id);

      if (productData?.category?._id) {
        const relatedResponse = await productAPI.getProducts({
          category: productData.category._id,
          limit: 4,
          sort: 'rating',
          inStock: true,
        });
        const related = relatedResponse.data.products || [];
        const uniqueRelated = related.filter(
          (item, index, items) => item._id !== productData._id
            && items.findIndex((candidate) => candidate._id === item._id) === index
        );
        setRelatedProducts(uniqueRelated);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Product not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const refreshEligibility = async () => {
    if (!isAuthenticated || !id) {
      setEligibility('not_logged_in');
      setMyReview(null);
      return;
    }

    try {
      const response = await reviewAPI.getEligibility(id);
      const { reviewed, canReview, eligible, review } = response.data;

      setMyReview(review || null);

      if (reviewed) {
        setEligibility('purchased_reviewed');
        setReviewForm({
          rating: review?.rating || 5,
          title: review?.title || '',
          comment: review?.comment || '',
        });
        return;
      }

      if (canReview) {
        setEligibility('purchased_not_reviewed');
        setReviewForm(emptyReviewForm);
        return;
      }

      setEligibility(eligible ? 'not_purchased' : 'not_logged_in');
      setReviewForm(emptyReviewForm);
    } catch (err) {
      setEligibility('not_purchased');
      setReviewForm(emptyReviewForm);
    }
  };

  useEffect(() => {
    refreshEligibility();
  }, [id, isAuthenticated]);

  const setEditForm = (review) => {
    setMyReview(review);
    setEligibility('purchased_reviewed');
    setReviewForm({
      rating: Number(review.rating) || 5,
      title: review.title || '',
      comment: review.comment || '',
    });
    setReviewError('');
    setReviewSuccess('');
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    setReviewError('');
    setReviewSuccess('');

    const rating = Number(reviewForm.rating);
    const title = reviewForm.title.trim();
    const comment = reviewForm.comment.trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setReviewError('Please choose a rating between 1 and 5.');
      return;
    }

    if (!comment) {
      setReviewError('Review text is required.');
      return;
    }

    if (title.length > 100) {
      setReviewError('Title must be at most 100 characters.');
      return;
    }

    if (comment.length > 2000) {
      setReviewError('Review text must be at most 2000 characters.');
      return;
    }

    setSavingReview(true);

    try {
      if (eligibility === 'purchased_reviewed' && myReview?._id) {
        await reviewAPI.updateReview(id, myReview._id, {
          rating,
          title,
          comment,
        });
        setReviewSuccess('Review updated successfully.');
      } else {
        await reviewAPI.createReview(id, {
          rating,
          title,
          comment,
        });
        setReviewSuccess('Review submitted successfully.');
      }

      setReviewForm(emptyReviewForm);
      await refetchReviews();
      await fetchProduct();
      await refreshEligibility();
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Unable to save review.');
    } finally {
      setSavingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!reviewId) return;
    if (!window.confirm('Delete this review?')) return;

    setDeletingReviewId(reviewId);
    setReviewError('');
    setReviewSuccess('');

    try {
      await reviewAPI.deleteReview(id, reviewId);
      setReviewSuccess('Review deleted successfully.');
      setMyReview(null);
      setReviewForm(emptyReviewForm);
      setEligibility('not_purchased');
      await refetchReviews();
      await fetchProduct();
      await refreshEligibility();
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Unable to delete review.');
    } finally {
      setDeletingReviewId(null);
    }
  };

  const handleAddToCart = async () => {
    if (!inStock) return;
    setCartMessage('');
    try {
      await addToCart(product._id, selectedQuantity);
      setCartMessage('Added to your cart.');
    } catch (err) {
      setCartMessage(err.response?.data?.message || 'Unable to add this product to your cart.');
    }
  };

  const isSaved = isInWishlist(product?._id);

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (isSaved) {
      await removeFromWishlist(product._id);
      return;
    }

    await addToWishlist(product._id);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid animate-pulse gap-8 lg:grid-cols-2">
          <div className="aspect-square rounded-2xl bg-slate-200" />
          <div className="space-y-4 py-4">
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="h-10 w-3/4 rounded bg-slate-200" />
            <div className="h-7 w-32 rounded bg-slate-200" />
            <div className="h-24 rounded bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Product unavailable</h1>
        <p className="mt-2 text-sm text-slate-500">{error || 'This product could not be found.'}</p>
        <Link to="/products" className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
          Back to products
        </Link>
      </div>
    );
  }

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;
  const inStock = product.stock > 0;
  const relatedIds = new Set(relatedProducts.map((item) => item._id));
  const visibleRecentlyViewed = recentlyViewed.filter(
    (item) => item._id !== product._id && !relatedIds.has(item._id)
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-slate-500">
        <Link to="/" className="hover:text-indigo-600">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/products" className="hover:text-indigo-600">Products</Link>
        {product.category && (
          <>
            <span className="mx-2">/</span>
            <Link to={`/products?category=${product.category._id}`} className="hover:text-indigo-600">
              {product.category.name}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-slate-700">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-2xl bg-slate-100">
            {product.images && product.images.length > 0 ? (
              <img src={selectedImage || product.images[0]} alt={product.name} className="h-full w-full object-cover" />
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
              {product.images.slice(0, 6).map((img, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  aria-label={`View ${product.name} image ${index + 1}`}
                  className={`aspect-square overflow-hidden rounded-lg bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${selectedImage === img ? 'ring-2 ring-indigo-600 ring-offset-2' : 'border border-slate-200'}`}
                >
                  <img src={img} alt={`${product.name} ${index + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.category && (
            <Link to={`/products?category=${product.category._id}`} className="text-sm font-medium text-indigo-600 hover:underline">
              {product.category.name}
            </Link>
          )}

          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{product.name}</h1>
          {product.brand && <p className="mt-1 text-sm text-slate-500">Brand: {product.brand}</p>}

          <div className="mt-3 flex items-center gap-2">
            {product.rating > 0 ? (
              <>
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, index) => (
                    <svg key={index} className={`h-5 w-5 ${index < Math.round(product.rating) ? 'fill-current' : 'fill-slate-200'}`} viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-slate-500">
                  {Number(product.rating || 0).toFixed(1)} ({product.numReviews || 0} review{(product.numReviews || 0) === 1 ? '' : 's'})
                </span>
              </>
            ) : (
              <span className="text-sm text-slate-500">No ratings yet</span>
            )}

            {eligibility === 'not_purchased' && (
              <span className="ml-2 text-xs text-slate-500">Purchase to review</span>
            )}
          </div>

          {eligibility === 'purchased_reviewed' && (
            <span className="ml-2 text-xs text-emerald-600">Already reviewed</span>
          )}

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-slate-900">${product.price.toFixed(2)}</span>
            {hasDiscount && (
              <>
                <span className="text-lg text-slate-400 line-through">${product.compareAtPrice.toFixed(2)}</span>
                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-sm font-bold text-red-600">Save {discountPercent}%</span>
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

          {cartMessage && (
            <div className={`mt-3 rounded-lg border px-3 py-2 text-sm ${cartMessage.startsWith('Added') ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
              {cartMessage}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <button
                type="button"
                onClick={() => setSelectedQuantity((current) => Math.max(1, current - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-lg leading-none text-slate-700 transition hover:bg-slate-100"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="min-w-8 text-center text-sm font-semibold text-slate-900">{selectedQuantity}</span>
              <button
                type="button"
                onClick={() => setSelectedQuantity((current) => Math.min(product.stock || 10, current + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-lg leading-none text-slate-700 transition hover:bg-slate-100"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            {inStock ? (
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!inStock || isInCart(product._id)}
                className="flex-1 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isInCart(product._id) ? 'Added to cart' : `Add to Cart (${selectedQuantity})`}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                Out of Stock
              </span>
            )}

            <button
              type="button"
              onClick={handleWishlistToggle}
              className={`inline-flex items-center justify-center rounded-lg border px-3 py-3 text-sm font-medium transition ${
                isSaved ? 'border-red-200 bg-red-50 text-red-600' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <svg viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="mr-2 h-4 w-4" aria-hidden="true">
                <path d="M12 21s-8.5-5.2-11-10.2C-1.1 7.3 1.4 3 5.5 3c2.6 0 4 1.4 6.5 4.1C14.6 4.4 16 3 18.5 3c4.1 0 6.6 4.3 4.5 7.8C20.5 15.8 12 21 12 21Z" />
              </svg>
              {isSaved ? 'Saved' : 'Wishlist'}
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <div className="flex items-center justify-between gap-3">
              <span>Payment provider</span>
              <span className="font-medium text-emerald-600">Stripe checkout</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span>Shipping address</span>
              <span className="font-medium text-indigo-600">Selected at checkout</span>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <h2 className="text-sm font-semibold text-slate-900">Product information</h2>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              {product.brand && <div><dt className="inline text-slate-500">Brand: </dt><dd className="inline font-medium text-slate-800">{product.brand}</dd></div>}
              {product.sku && <div><dt className="inline text-slate-500">SKU: </dt><dd className="inline font-medium text-slate-800">{product.sku}</dd></div>}
              {product.category?.name && <div><dt className="inline text-slate-500">Category: </dt><dd className="inline font-medium text-slate-800">{product.category.name}</dd></div>}
              <div><dt className="inline text-slate-500">Availability: </dt><dd className="inline font-medium text-slate-800">{inStock ? `${product.stock} available` : 'Out of stock'}</dd></div>
            </dl>
            <h2 className="mt-6 text-sm font-semibold text-slate-900">Description</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">{product.description}</p>
          </div>
        </div>
      </div>

      <div className="mt-12 border-t border-slate-200 pt-8">
        <h2 className="text-sm font-semibold text-slate-900">Reviews</h2>

        {loadingReviews && (
          <div className="mt-4 animate-pulse rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="grid grid-cols-3 gap-4">
              <div className="h-6 rounded bg-slate-200" />
              <div className="h-6 rounded bg-slate-200" />
              <div className="h-6 rounded bg-slate-200" />
            </div>
          </div>
        )}

        {!loadingReviews && errorReviews && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorReviews}
          </div>
        )}

        {!loadingReviews && !productReviews.length && (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
            No reviews yet. Be the first to share your experience.
          </div>
        )}

        {!loadingReviews && productReviews.length > 0 && (
          <div className="mt-5 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-slate-900">{Number(product.rating || 0).toFixed(1)}</span>
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, index) => (
                    <svg key={index} className={`h-5 w-5 ${index < Math.round(product.rating || 0) ? 'fill-current' : 'fill-slate-200'}`} viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-500">{product.numReviews || 0} global rating{(product.numReviews || 0) === 1 ? '' : 's'}</p>

              {[5, 4, 3, 2, 1].map((star) => {
                const count = productReviews.filter((review) => Number(review.rating) === star).length;
                const percent = productReviews.length ? (count / productReviews.length) * 100 : 0;

                return (
                  <div key={star} className="mt-3 flex items-center gap-3 text-sm text-slate-600">
                    <span className="w-5 text-right">{star}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="w-8 text-slate-500">{count}</span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-4">
              {productReviews.map((review) => (
                <div key={review._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, index) => (
                          <svg key={index} className={`h-4 w-4 ${index < Math.round(review.rating) ? 'fill-current' : 'fill-slate-200'}`} viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{review.user?.fullName || 'Anonymous'}</span>
                    </div>
                    <span className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>

                  {review.title && <p className="mt-3 text-sm font-medium text-slate-900">{review.title}</p>}
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{review.comment}</p>

                  {user?._id && review.user?._id === user._id && (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        onClick={() => setEditForm(review)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteReview(review._id)}
                        disabled={deletingReviewId === review._id}
                      >
                        {deletingReviewId === review._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {isAuthenticated && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {eligibility === 'checking' && (
              <p className="text-sm text-slate-500">Checking review eligibility...</p>
            )}

            {(eligibility === 'purchased_not_reviewed' || eligibility === 'purchased_reviewed') && (
              <>
                <h3 className="mb-3 text-sm font-medium text-indigo-700">
                  {eligibility === 'purchased_reviewed' ? 'Edit your review' : 'Write a review'}
                </h3>

                {reviewError && (
                  <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{reviewError}</div>
                )}
                {reviewSuccess && (
                  <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{reviewSuccess}</div>
                )}

                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Your rating</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                          onClick={() => setReviewForm((prev) => ({ ...prev, rating: star }))}
                          className="text-2xl transition hover:scale-105"
                        >
                          <span className={star <= reviewForm.rating ? 'text-amber-400' : 'text-slate-300'}>★</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="review-title" className="mb-1 block text-sm font-medium text-slate-700">Title</label>
                    <input
                      id="review-title"
                      type="text"
                      value={reviewForm.title}
                      maxLength={100}
                      onChange={(event) => setReviewForm((prev) => ({ ...prev, title: event.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Optional title"
                    />
                  </div>

                  <div>
                    <label htmlFor="review-comment" className="mb-1 block text-sm font-medium text-slate-700">Review</label>
                    <textarea
                      id="review-comment"
                      value={reviewForm.comment}
                      onChange={(event) => setReviewForm((prev) => ({ ...prev, comment: event.target.value }))}
                      maxLength={2000}
                      rows={4}
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Share your experience with this product"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      disabled={savingReview}
                      className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingReview ? (eligibility === 'purchased_reviewed' ? 'Saving...' : 'Submitting...') : (eligibility === 'purchased_reviewed' ? 'Save Changes' : 'Submit Review')}
                    </button>

                    {eligibility === 'purchased_reviewed' && myReview?._id && (
                      <button
                        type="button"
                        onClick={() => handleDeleteReview(myReview._id)}
                        disabled={deletingReviewId === myReview._id}
                        className="rounded-lg border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingReviewId === myReview._id ? 'Deleting...' : 'Delete review'}
                      </button>
                    )}
                  </div>
                </form>
              </>
            )}

            {eligibility === 'not_purchased' && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                You need to purchase this product before you can leave a review.
              </div>
            )}
          </div>
        )}

        {!isAuthenticated && (
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Log in to leave a review for this product.
          </div>
        )}
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 text-xl font-bold text-slate-900">You may also like</h2>
          <ProductGrid products={relatedProducts} />
        </div>
      )}

      {(loadingRecentlyViewed || visibleRecentlyViewed.length > 0) && (
        <div className="mt-12 border-t border-slate-200 pt-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">Recently viewed</h2>
            <p className="mt-1 text-sm text-slate-500">Products you viewed on this device.</p>
          </div>
          <ProductGrid products={visibleRecentlyViewed} loading={loadingRecentlyViewed} />
        </div>
      )}
    </div>
  );
}

