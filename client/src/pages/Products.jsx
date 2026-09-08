import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { productAPI } from "../services/api.js";
import { categoryAPI } from "../services/api.js";
import Navbar from "../components/Navbar.jsx";
import ProductCard from "../components/ProductCard.jsx";
import ProductGrid from "../components/ProductGrid.jsx";
import Footer from "../components/Footer.jsx";

const DEALS_LIMIT = 4;
const TRENDING_LIMIT = 6;
const RECOMMENDED_LIMIT = 6;

export default function Products() {
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

    setCategories(cats.data.categories);
    setTrendingProducts(trending.data.products);
    setRecommendedProducts(recommended.data.products);

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
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-7xl">
          {/* Search Section */}
          <section className="mb-8">
            <div className="border-b border-slate-200 pb-4 mb-6">
              <div className="flex items-center gap-4">
                <svg
                  className="h-5 w-5 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="8" cy="21" r="1" />
                  <circle cx="19" cy="21" r="1" />
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
                <input
                  type="text"
                  placeholder="Search for products, brands, categories..."
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition"
                >
                  Search
                </button>
              </div>
            </div>
          </section>

          {/* Categories */}
          <section className="mb-8">
            <div className="border-b border-slate-200 pb-4 mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Categories</h2>
              <ul>
                <li>
                  <button
                    onClick={() => handleCategoryChange("")}
                    className="block w-full rounded-lg px-3 py-1.5 text-left text-sm transition bg-indigo-50 font-medium text-indigo-600"
                  >
                    All Categories
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat._id}>
                    <button
                      onClick={() => handleCategoryChange(cat._id)}
className="block w-full rounded-lg px-3 py-1.5 text-left text-sm transition ${
                          categoryFilter === cat._id
                            ? 'bg-indigo-50 font-medium text-indigo-600'
                            : 'text-slate-600 hover:bg-slate-50'
                        }"
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
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

      <Footer />
    </>
  );
}