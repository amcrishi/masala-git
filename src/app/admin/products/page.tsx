'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import ProductTable from '@/components/admin/ProductTable';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { IProduct } from '@/types';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '10');
      if (search) params.set('search', search);
      if (category) params.set('category', category);

      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data || []);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, category]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = (id: string) => {
    setProducts((prev) => prev.filter((p) => p._id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-amber-900">Product Management</h1>
          <p className="text-gray-500 mt-1">Add, edit, and manage your masala products</p>
        </div>
        <Link
          href="/admin/products/new"
          className="bg-amber-700 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          + Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-900"
        />
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-900"
        >
          <option value="">All Categories</option>
          <option value="whole-spices">Whole Spices</option>
          <option value="ground-spices">Ground Spices</option>
          <option value="blended-masala">Blended Masala</option>
          <option value="herbs">Herbs</option>
          <option value="seasoning">Seasoning</option>
          <option value="organic">Organic</option>
          <option value="premium">Premium</option>
          <option value="combo-packs">Combo Packs</option>
        </select>
      </div>

      {loading ? (
        <div className="py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <ProductTable products={products} onDelete={handleDelete} />
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
