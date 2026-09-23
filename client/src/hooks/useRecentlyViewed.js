import { useCallback, useEffect, useState } from 'react';
import { productAPI } from '../services/api.js';

const STORAGE_KEY = 'ecommerce-site-recently-viewed';
const MAX_ITEMS = 8;

const readProductIds = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(stored) ? stored.filter(Boolean).slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
};

export default function useRecentlyViewed() {
  const [productIds, setProductIds] = useState(readProductIds);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!productIds.length) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const results = await Promise.allSettled(
      productIds.map((productId) => productAPI.getProduct(productId))
    );
    const validProducts = results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value.data?.product)
      .filter((product) => product?.isActive && Number(product.stock) > 0);

    setProducts(validProducts);
    setLoading(false);
  }, [productIds]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const recordProduct = useCallback((productId) => {
    if (!productId) return;

    setProductIds((currentIds) => {
      const nextIds = [String(productId), ...currentIds.filter((id) => String(id) !== String(productId))]
        .slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextIds));
      return nextIds;
    });
  }, []);

  return { products, loading, recordProduct, refresh };
}
