import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="overflow-hidden bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-300">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" aria-hidden="true" />
            Your one-stop online marketplace
          </span>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Everything you need,
            <span className="block text-indigo-300">
              all in one place.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Discover great products at fair prices, with a fast and friendly
            shopping experience built for you.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/products"
              className="rounded-full bg-indigo-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Start shopping
            </Link>
            <Link
              to="/products"
              className="rounded-full border border-slate-700 px-7 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Browse categories
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
