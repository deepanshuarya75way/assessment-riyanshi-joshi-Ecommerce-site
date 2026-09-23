import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { categoryAPI, productAPI } from '../services/api.js';
import ProductGrid from '../components/ProductGrid.jsx';

const PAGE_SIZE = 8;

const cleanQuery = (params, key) => {
  if (!params.has(key)) return '';
  const value = params.get(key);
  return value ? value : '';
};

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState(cleanQuery(searchParams, 'search'));
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalProducts: 0 });

  const activeSearch = cleanQuery(searchParams, 'search');
  const activeCategory = cleanQuery(searchParams, 'category');
  const activeBrand = cleanQuery(searchParams, 'brand');
  const activeSort = searchParams.get('sort') || 'newest';
  const activeMinPrice = cleanQuery(searchParams, 'minPrice');
  const activeMaxPrice = cleanQuery(searchParams, 'maxPrice');
  const activeDiscounted = cleanQuery(searchParams, 'discounted');
  const activePage = Number(searchParams.get('page')) || 1;

  useEffect(() => {
    setSearchInput(activeSearch);
  }, [activeSearch]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [categoriesResponse, productsResponse] = await Promise.all([
          categoryAPI.getCategories(),
          productAPI.getProducts({
            page: activePage,
            limit: PAGE_SIZE,
            search: activeSearch || undefined,
            category: activeCategory || undefined,
            brand: activeBrand || undefined,
            minPrice: activeMinPrice || undefined,
            maxPrice: activeMaxPrice || undefined,
            discounted: activeDiscounted || undefined,
            sort: activeSort || 'newest',
          }),
        ]);

        const productsData = productsResponse.data.products || [];
        setCategories(categoriesResponse.data.categories || []);
        setProducts(productsData);
        setPagination({
          currentPage: productsResponse.data.currentPage || 1,
          totalPages: productsResponse.data.totalPages || 1,
          totalProducts: productsResponse.data.totalProducts || 0,
        });

        const uniqueBrands = [...new Set(productsData.map((product) => product.brand).filter(Boolean))];
        setBrands(uniqueBrands);
      } catch (err) {
        console.error('Failed to fetch products data:', err);
        setError('We could not load products for this selection. Please try again.');
        setProducts([]);
        setPagination({ currentPage: 1, totalPages: 1, totalProducts: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activePage, activeSearch, activeCategory, activeBrand, activeSort, activeMinPrice, activeMaxPrice, activeDiscounted]);

  const updateQuery = (updates) => {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === '') {
        nextParams.delete(key);
      } else {
        nextParams.set(key, String(value));
      }
    });

    if (!updates.page) {
      nextParams.delete('page');
    }

    setSearchParams(nextParams, { replace: true });
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmedQuery = searchInput.trim();
    updateQuery({ search: trimmedQuery, page: 1 });
  };

  const handleCategoryChange = (value) => {
    updateQuery({ category: value, brand: '', search: activeSearch, page: 1 });
  };

  const handleBrandClick = (value) => {
    updateQuery({ brand: value, page: 1 });
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters = Boolean(activeSearch || activeCategory || activeBrand || activeMinPrice || activeMaxPrice || activeDiscounted || activeSort !== 'newest');

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-7xl">
        <section className="mb-8">
          <div className="mb-6 border-b border-slate-200 pb-4">
            <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex-1 relative">
                <svg className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search products, brands, categories..."
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500">
                Search
              </button>
              {hasActiveFilters && (
                <button type="button" onClick={resetFilters} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                  Reset filters
                </button>
              )}
            </form>
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Browse by category</h2>
            <button type="button" onClick={() => handleCategoryChange('')} className={`text-left text-sm font-medium ${!activeCategory ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}>
              All products
            </button>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => (
              <button
                key={category._id}
                type="button"
                onClick={() => handleCategoryChange(category._id)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-sm transition ${
                  activeCategory === category._id ? 'border-indigo-500 bg-indigo-50 font-medium text-indigo-600' : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row">
              <label className="text-sm font-medium text-slate-700">
                Min price
                <input
                  type="number"
                  min="0"
                  value={activeMinPrice}
                  onChange={(event) => updateQuery({ minPrice: event.target.value, page: 1 })}
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="0"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Max price
                <input
                  type="number"
                  min="0"
                  value={activeMaxPrice}
                  onChange={(event) => updateQuery({ maxPrice: event.target.value, page: 1 })}
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="500"
                />
              </label>
            </div>

            <label className="text-sm font-medium text-slate-700">
              Sort by
              <select
                value={activeSort}
                onChange={(event) => updateQuery({ sort: event.target.value, page: 1 })}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="newest">Newest</option>
                <option value="rating">Top rated</option>
                <option value="price_asc">Price: Low to high</option>
                <option value="price_desc">Price: High to low</option>
              </select>
            </label>
          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mb-8">
          <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {pagination.totalProducts} result{pagination.totalProducts === 1 ? '' : 's'}
            </h2>
            <div className="text-sm text-slate-500">
              {activeCategory ? 'Category filter active' : 'All categories'}
            </div>
          </div>

          <ProductGrid
            products={products}
            loading={loading}
            emptyMessage="No products match your current search and filters."
          />
        </section>

        {brands.length > 0 && (
          <section className="mb-8">
            <div className="mb-6 border-b border-slate-200 pb-4">
              <h2 className="text-lg font-semibold text-slate-900">Popular Brands</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {brands.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => handleBrandClick(brand)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    activeBrand === brand ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-300 text-slate-600 hover:border-indigo-500 hover:text-indigo-600'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </section>
        )}

        {pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setSearchParams({ ...Object.fromEntries(searchParams.entries()), page: Math.max(1, pagination.currentPage - 1) })}
              disabled={pagination.currentPage <= 1}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setSearchParams({ ...Object.fromEntries(searchParams.entries()), page: Math.min(pagination.totalPages, pagination.currentPage + 1) })}
              disabled={pagination.currentPage >= pagination.totalPages}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </main>
  );
}