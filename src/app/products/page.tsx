'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductGrid from '@/components/products/ProductGrid';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { IProduct } from '@/types';

const categories = [
  { value: '', label: 'All Categories' },
  { value: 'whole-spices', label: 'Whole Spices' },
  { value: 'ground-spices', label: 'Ground Spices' },
  { value: 'blended-masala', label: 'Blended Masala' },
  { value: 'herbs', label: 'Herbs' },
  { value: 'seasoning', label: 'Seasoning' },
  { value: 'organic', label: 'Organic' },
  { value: 'premium', label: 'Premium' },
  { value: 'combo-packs', label: 'Combo Packs' },
];

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  
  const page = parseInt(searchParams.get('page') || '1');
  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '12');
      if (category) params.set('category', category);
      if (search) params.set('search', search);

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
  }, [page, category, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== 'page') params.set('page', '1');
    router.push(`/products?${params}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-amber-900 mb-2">Our Masala Collection</h1>
        <p className="text-gray-600">Discover the perfect blend for every dish</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search masalas..."
            defaultValue={search}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateParams('search', (e.target as HTMLInputElement).value);
              }
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-900"
          />
        </div>
        <select
          value={category}
          onChange={(e) => updateParams('category', e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-900"
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Products */}
      {loading ? (
        <div className="py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <ProductGrid products={products} />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => updateParams('page', p.toString())}
          />
        </>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="py-20"><LoadingSpinner size="lg" /></div>}>
      <ProductsContent />
    </Suspense>
  );
}
