import { Link } from 'react-router-dom';

const supportLinks = ['Help center', 'Shipping info', 'Returns', 'Contact us'];

function PlaceholderLinkList({ title, links }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((label) => (
          <li key={label}>
            <span className="cursor-default text-sm text-slate-400 transition hover:text-slate-200" title="Coming soon">
              {label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <span className="text-lg font-extrabold tracking-tight text-white">
              Ecommerce<span className="text-indigo-400">-Site</span>
            </span>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              A modern online marketplace built to bring you everything you
              need, all in one place.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Shop</h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link to="/products" className="text-sm text-slate-400 transition hover:text-slate-200">
                  Categories
                </Link>
              </li>
              <li>
                <span className="cursor-default text-sm text-slate-400 transition hover:text-slate-200" title="Coming soon">
                  Today&apos;s deals
                </span>
              </li>
              <li>
                <span className="cursor-default text-sm text-slate-400 transition hover:text-slate-200" title="Coming soon">
                  New arrivals
                </span>
              </li>
              <li>
                <span className="cursor-default text-sm text-slate-400 transition hover:text-slate-200" title="Coming soon">
                  Best sellers
                </span>
              </li>
            </ul>
          </div>
          <PlaceholderLinkList title="Support" links={supportLinks} />
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-800 pt-6 sm:flex-row">
          <p className="text-xs text-slate-500">
            &copy; {year} Ecommerce-Site. All rights reserved.
          </p>
          <p className="text-xs text-slate-500">Built with the MERN stack.</p>
        </div>
      </div>
    </footer>
  );
}
