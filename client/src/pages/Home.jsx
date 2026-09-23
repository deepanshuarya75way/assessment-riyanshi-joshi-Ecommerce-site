import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoryAPI, productAPI } from '../services/api.js';
import Hero from '../components/Hero.jsx';
import ProductGrid from '../components/ProductGrid.jsx';

const FEATURED_LIMIT = 4;
const NEW_ARRIVALS_LIMIT = 4;
const DEALS_LIMIT = 4;

const withoutDuplicates = (products, excludedIds = new Set()) => products.filter(
  (product, index, items) => !excludedIds.has(product._id)
    && items.findIndex((candidate) => candidate._id === product._id) === index
);

export default function Home() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse, featuredResponse, arrivalsResponse, dealsResponse] = await Promise.all([
          categoryAPI.getCategories(),
          productAPI.getProducts({ limit: FEATURED_LIMIT, sort: 'rating', minRating: 4, inStock: true }),
          productAPI.getProducts({ limit: 12, sort: 'newest', inStock: true }),
          productAPI.getProducts({ limit: 12, sort: 'price_asc', discounted: true, inStock: true }),
        ]);

        const categoriesData = categoriesResponse.data.categories || [];
        const featuredData = featuredResponse.data.products || [];
        const arrivalsData = arrivalsResponse.data.products || [];
        const dealsData = dealsResponse.data.products || [];
        const featuredIds = new Set(featuredData.map((product) => product._id));
        const discountedData = withoutDuplicates(dealsData, featuredIds).slice(0, DEALS_LIMIT);
        const usedIds = new Set([...featuredIds, ...discountedData.map((product) => product._id)]);
        const arrivalData = withoutDuplicates(arrivalsData, usedIds).slice(0, NEW_ARRIVALS_LIMIT);

        setCategories(categoriesData);
        setFeaturedProducts(featuredData);
        setDeals(discountedData);
        setNewArrivals(arrivalData);

        const allProducts = [...featuredData, ...arrivalData, ...discountedData];
        const uniqueBrands = [...new Set(allProducts.map((product) => product.brand).filter(Boolean))];
        setBrands(uniqueBrands.slice(0, 8));
      } catch (err) {
        console.error('Failed to fetch home data:', err);
        setError('We could not load products right now. Please try again shortly.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const openProducts = (params = {}) => {
    const nextParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value) nextParams.set(key, String(value));
    });

    navigate(`/products${nextParams.toString() ? `?${nextParams.toString()}` : ''}`);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-7xl">
        <Hero />

        <section className="mb-10 mt-8">
          <div className="mb-6 flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <h2 className="text-lg font-semibold text-slate-900">Shop by category</h2>
            <button
              type="button"
              onClick={() => openProducts()}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              View all products
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <button
              type="button"
              onClick={() => openProducts()}
              className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-4 text-left text-sm font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100"
            >
              All products
            </button>
            {categories.map((category, index) => (
              <button
                key={category._id}
                type="button"
                onClick={() => openProducts({ category: category._id })}
                className={`rounded-2xl border px-4 py-4 text-left text-sm font-semibold transition ${
                  index % 2 === 0
                    ? 'border-slate-200 bg-white text-slate-800 hover:border-indigo-300 hover:text-indigo-600'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </section>

        {error && (
          <div className="mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mb-8">
          <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="text-lg font-semibold text-slate-900">Value picks</h2>
            <button
              type="button"
              onClick={() => openProducts({ discounted: true, inStock: true })}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Browse by price
            </button>
          </div>
          <ProductGrid products={deals} loading={loading} emptyMessage="No discounted products available at the moment." />
        </section>

        <section className="mb-8">
          <div className="mb-6 border-b border-slate-200 pb-4">
            <h2 className="text-lg font-semibold text-slate-900">Featured products</h2>
            <p className="mt-1 text-sm text-slate-500">Highest-rated available products in the catalog.</p>
          </div>
          <ProductGrid products={featuredProducts} loading={loading} emptyMessage="No featured products available at the moment." />
        </section>

        <section className="mb-8">
          <div className="mb-6 border-b border-slate-200 pb-4">
            <h2 className="text-lg font-semibold text-slate-900">New arrivals</h2>
            <p className="mt-1 text-sm text-slate-500">Recently added products with available stock.</p>
          </div>
          <ProductGrid products={newArrivals} loading={loading} emptyMessage="No new arrivals available at the moment." />
        </section>

        <section className="mb-8">
          <div className="mb-6 border-b border-slate-200 pb-4">
            <h2 className="text-lg font-semibold text-slate-900">Shop by brand</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {brands.length > 0 ? (
              brands.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => openProducts({ brand })}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-500 hover:text-indigo-600"
                >
                  {brand}
                </button>
              ))
            ) : (
              <div className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Shop all products to discover more brands.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}