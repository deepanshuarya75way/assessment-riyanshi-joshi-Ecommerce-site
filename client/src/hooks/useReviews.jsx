import { useState, useEffect, useCallback } from 'react';
import { reviewAPI } from '../services/api.js';

export const useReviews = (productId) => {
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [errorReviews, setErrorReviews] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalReviews: 0 });

  const fetchReviews = useCallback(async () => {
    if (!productId) {
      setLoadingReviews(false);
      return;
    }

    setLoadingReviews(true);
    try {
      const res = await reviewAPI.getProductReviews(productId, { page: 1, limit: 10 });
      setReviews(res.data.reviews);
      setPagination({
        page: res.data.currentPage,
        limit: res.data.limit,
        totalPages: res.data.totalPages,
        totalReviews: res.data.totalReviews,
      });
    } catch (err) {
      setErrorReviews(err.response?.data?.message || 'Failed to fetch reviews');
    } finally {
      setLoadingReviews(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return {
    reviews,
    loadingReviews,
    errorReviews,
    pagination,
    refetch: fetchReviews,
  };
};