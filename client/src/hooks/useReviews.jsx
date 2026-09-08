import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { reviewAPI } from '../services/api.js';

export const useReviews = (productId) => {
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [errorReviews, setErrorReviews] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalReviews: 0 });

  useEffect(() => {
    const fetchReviews = async () => {
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
    };
    fetchReviews();
  }, [productId]);

  return {
    reviews,
    loadingReviews,
    errorReviews,
    pagination,
    refetch: fetchReviews,
  };
};