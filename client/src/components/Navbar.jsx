import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart.js";
import { useWishlist } from "../hooks/useWishlist.js";
import SearchBar from "./SearchBar.jsx";
import useAuth from "../hooks/useAuth.js";

function Logo() {
  return (
    <NavLink to="/" className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-500/30">
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
      </span>
      <span className="text-lg font-extrabold tracking-tight text-slate-900">
        Ecommerce<span className="text-indigo-600">-Site</span>
      </span>
    </NavLink>
  );
}

function CartButton() {
  const { cartCount } = useCart();
  const navigate = useNavigate();

  return (
    <button
      type="button"
      aria-label="Shopping cart"
      onClick={() => navigate("/cart")}
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-indigo-600"
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
      <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
        {cartCount || 0}
      </span>
    </button>
  );
}

function WishlistButton() {
  const { products: wishlistProducts } = useWishlist();
  const navigate = useNavigate();

  return (
    <button
      type="button"
      aria-label="Wishlist"
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-indigo-600"
      onClick={() => navigate("/wishlist")}
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
        {wishlistProducts?.length || 0}
      </span>
    </button>
  );
}

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, loading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
    navigate("/");
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition ${
      isActive ? "text-indigo-600" : "text-slate-600 hover:text-slate-900"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-4">
          <Logo />

          <div className="hidden flex-1 px-6 lg:block">
            <div className="mx-auto max-w-xl">
              <SearchBar />
            </div>
          </div>

          <nav className="ml-auto hidden items-center gap-6 md:flex" aria-label="Main navigation">
            <NavLink to="/" end className={navLinkClass}>Home</NavLink>
            <NavLink to="/products" className={navLinkClass}>Shop</NavLink>
            {!loading && isAuthenticated && (
              <NavLink to="/orders" className={navLinkClass}>Orders</NavLink>
            )}
            {!loading && user?.role === 'admin' && (
              <NavLink to="/admin" className={navLinkClass}>Admin</NavLink>
            )}
            {!loading && !isAuthenticated ? (
              <NavLink to="/login" className={navLinkClass}>Account</NavLink>
            ) : (
              <NavLink to="/profile" className={navLinkClass}>Account</NavLink>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-1 md:ml-2">
            <CartButton />
            <WishlistButton />
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-indigo-600 md:hidden"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="pb-3 lg:hidden">
          <SearchBar />
        </div>
      </div>

      {isMenuOpen && (
        <nav id="mobile-menu" className="border-t border-slate-200 bg-white px-4 py-3 md:hidden" aria-label="Mobile navigation">
          <ul className="space-y-1">
            <li>
              <NavLink to="/" end onClick={() => setIsMenuOpen(false)} className={({ isActive }) => `block rounded-lg px-3 py-2 text-sm font-medium ${isActive ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50"}`} >Home</NavLink>
            </li>
            <li>
              <NavLink to="/products" onClick={() => setIsMenuOpen(false)} className={({ isActive }) => `block rounded-lg px-3 py-2 text-sm font-medium ${isActive ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50"}`} >Shop</NavLink>
            </li>
            <li>
              <NavLink to="/cart" onClick={() => setIsMenuOpen(false)} className={({ isActive }) => `block rounded-lg px-3 py-2 text-sm font-medium ${isActive ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50"}`} >Cart</NavLink>
            </li>
            <li>
              <NavLink to="/wishlist" onClick={() => setIsMenuOpen(false)} className={({ isActive }) => `block rounded-lg px-3 py-2 text-sm font-medium ${isActive ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50"}`} >Wishlist</NavLink>
            </li>

            {!loading && (
              <>
                {isAuthenticated ? (
                  <>
                    <li className="border-t border-slate-100 pt-2 mt-2">
                      <NavLink to="/profile" onClick={() => setIsMenuOpen(false)} className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50"}`} >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600">
                          {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                        {user?.fullName}
                      </NavLink>
                    </li>
                    {user?.role === 'admin' && (
                      <li>
                        <NavLink to="/admin" onClick={() => setIsMenuOpen(false)} className={({ isActive }) => `block rounded-lg px-3 py-2 text-sm font-medium ${isActive ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50"}`} >Admin Dashboard</NavLink>
                      </li>
                    )}
                    <li>
                      <button type="button" onClick={handleLogout} className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-50">Logout</button>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="border-t border-slate-100 pt-2 mt-2">
                      <NavLink to="/login" onClick={() => setIsMenuOpen(false)} className={({ isActive }) => `block rounded-lg px-3 py-2 text-sm font-medium ${isActive ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50"}`} >Login</NavLink>
                    </li>
                    <li>
                      <NavLink to="/register" onClick={() => setIsMenuOpen(false)} className={({ isActive }) => `block rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-500 md:block`} >Register</NavLink>
                    </li>
                  </>
                )}
              </>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}
