'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  return (
    <nav className="bg-amber-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🌿</span>
              <span className="text-xl font-bold tracking-wide">SpiceCraft</span>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="hover:text-amber-200 transition-colors font-medium">
              Home
            </Link>
            <Link href="/products" className="hover:text-amber-200 transition-colors font-medium">
              Products
            </Link>

            {/* Cart icon — only shown when logged in */}
            {!loading && user && (
              <Link href="/cart" className="hover:text-amber-200 transition-colors font-medium relative">
                🛒
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </Link>
            )}

            {loading ? (
              <div className="w-8 h-8 rounded-full bg-amber-800 animate-pulse" />
            ) : user ? (
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="hover:text-amber-200 transition-colors font-medium">
                  Dashboard
                </Link>
                {(user.role === 'admin' || user.role === 'technician') && (
                  <Link href="/admin" className="hover:text-amber-200 transition-colors font-medium">
                    Admin
                  </Link>
                )}
                <div className="flex items-center space-x-3">
                  <span className="text-amber-200 text-sm">
                    {user.name}
                    <span className="ml-1 px-2 py-0.5 bg-amber-700 rounded-full text-xs capitalize">
                      {user.role}
                    </span>
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-amber-700 hover:bg-amber-600 px-3 py-1.5 rounded-md text-sm transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="hover:text-amber-200 transition-colors font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-amber-600 hover:bg-amber-500 px-4 py-2 rounded-md transition-colors font-medium"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/" className="block py-2 hover:text-amber-200" onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
            <Link href="/products" className="block py-2 hover:text-amber-200" onClick={() => setMobileMenuOpen(false)}>
              Products
            </Link>
            {/* Mobile cart — only when logged in */}
            {user && (
              <Link href="/cart" className="block py-2 hover:text-amber-200" onClick={() => setMobileMenuOpen(false)}>
                🛒 Cart {totalItems > 0 && `(${totalItems})`}
              </Link>
            )}
            {user ? (
              <>
                <Link href="/dashboard" className="block py-2 hover:text-amber-200" onClick={() => setMobileMenuOpen(false)}>
                  Dashboard
                </Link>
                {(user.role === 'admin' || user.role === 'technician') && (
                  <Link href="/admin" className="block py-2 hover:text-amber-200" onClick={() => setMobileMenuOpen(false)}>
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-2 text-amber-200"
                >
                  Logout ({user.name})
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block py-2 hover:text-amber-200" onClick={() => setMobileMenuOpen(false)}>
                  Login
                </Link>
                <Link href="/register" className="block py-2 hover:text-amber-200" onClick={() => setMobileMenuOpen(false)}>
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
