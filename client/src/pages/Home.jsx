import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { productAPI } from "../services/api.js";
import { categoryAPI } from "../services/api.js";
import Hero from "../components/Hero.jsx";
import ProductCard from "../components/ProductCard.jsx";
import ProductGrid from "../components/ProductGrid.jsx";
import SearchBar from "../components/SearchBar.jsx";

const DEALS_LIMIT = 4;
const TRENDING_LIMIT = 6;
const RECOMMENDED_LIMIT = 6;

export default function Home() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
const [cats, trending, recommended] = await Promise.all([
      categoryAPI.getCategories(),
      productAPI.getProducts({ limit: DEALS_LIMIT, sort: "newest" }),
      productAPI.getProducts({ limit: RECOMMENDED_LIMIT, sort: "rating" }),
    ]);

    setCategories(cats.data.categories || []);
    setTrendingProducts(trending.data.products || []);
    setRecommendedProducts(recommended.data.products || []);

    // Extract unique brands from products
    const allProducts = [...trending.data.products, ...recommended.data.products];
    const uniqueBrands = [
      ...new Set(allProducts.map((p) => p.brand).filter((b) => b)),
    ];
    } catch (error) {
      console.error("Failed to fetch home data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-7xl">
          {/* Categories */}
          <section className="mb-8">
            <div className="border-b border-slate-200 pb-4 mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Categories</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition"
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Hero Banner */}
          <Hero />

          {/* Deals Section */}
          <section className="mb-8">
            <div className="border-b border-slate-200 pb-4 mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Deals</h2>
            </div>
            <ProductGrid
              products={trendingProducts}
              loading={loading}
              emptyMessage="No deals available at the moment."
            />
          </section>

          {/* Trending Products Section */}
          <section className="mb-8">
            <div className="border-b border-slate-200 pb-4 mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Trending Products</h2>
            </div>
            <ProductGrid
              products={trendingProducts}
              loading={loading}
              emptyMessage="No trending products at the moment."
            />
          </section>

          {/* Recommended Products Section */}
          <section className="mb-8">
            <div className="border-b border-slate-200 pb-4 mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Recommended for You</h2>
            </div>
            <ProductGrid
              products={recommendedProducts}
              loading={loading}
              emptyMessage="No recommended products at the moment."
            />
          </section>

          {/* Brands Section */}
          <section className="mb-8">
            <div className="border-b border-slate-200 pb-4 mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Brands</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {brands.map((brand) => (
                <div
                  key={brand}
                  className="border rounded-lg p-4 border-slate-300 hover:border-indigo-500 transition"
                >
                  <span className="text-lg font-medium text-slate-900">{brand}</span>
                </div>
              ))}
              {brands.length < 4 && (
                <div
                  className="border rounded-lg p-4 border-slate-300 text-center text-slate-500"
                >
                  More brands coming soon
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}