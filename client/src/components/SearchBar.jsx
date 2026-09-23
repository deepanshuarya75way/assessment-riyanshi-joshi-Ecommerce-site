import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function SearchBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setQuery(params.get('search') || '');
  }, [location.search]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    const params = new URLSearchParams();

    if (trimmed) {
      params.set('search', trimmed);
    }

    navigate(`/products${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <form role="search" onSubmit={handleSubmit} className="w-full">
      <label htmlFor="site-search" className="sr-only">
        Search products
      </label>
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          id="site-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search for products, brands and more..."
          className="w-full rounded-full border border-slate-200 bg-slate-100 py-2.5 pl-11 pr-11 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-lg leading-none text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            &times;
          </button>
        )}
      </div>
    </form>
  );
}
