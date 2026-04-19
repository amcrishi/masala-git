'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { IProduct } from '@/types';

interface ProductTableProps {
  products: IProduct[];
  onDelete: (id: string) => void;
}

export default function ProductTable({ products, onDelete }: ProductTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    
    setDeletingId(id);
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        onDelete(id);
      } else {
        alert(data.error || 'Failed to delete product');
      }
    } catch {
      alert('Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  const categoryLabels: Record<string, string> = {
    'whole-spices': 'Whole Spices',
    'ground-spices': 'Ground Spices',
    'blended-masala': 'Blended Masala',
    herbs: 'Herbs',
    seasoning: 'Seasoning',
    organic: 'Organic',
    premium: 'Premium',
    'combo-packs': 'Combo Packs',
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-amber-50">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-semibold text-amber-900">Product</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-amber-900">Category</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-amber-900">Price</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-amber-900">Stock</th>
              <th className="text-right px-6 py-3 text-sm font-semibold text-amber-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((product) => {
              const discount = product.mrp && product.mrp > product.price
                ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
                : 0;
              const hasImage = product.images?.length > 0 || (product.image && product.image !== '/images/default-product.jpg');
              const thumbSrc = product.images?.[0] || product.image;

              return (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-amber-50 flex-shrink-0 border border-gray-100">
                        {hasImage ? (
                          <Image
                            src={thumbSrc}
                            alt={product.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">🌶️</div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>
                        {product.images?.length > 1 && (
                          <div className="text-xs text-gray-400">{product.images.length} images</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                      {categoryLabels[product.category] || product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-amber-700">₹{product.price.toLocaleString('en-IN')}</div>
                    {discount > 0 && (
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400 line-through">₹{product.mrp.toLocaleString('en-IN')}</span>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {discount}% off
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${
                      product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link
                      href={`/admin/products/${product._id}/edit`}
                      className="inline-block px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(product._id, product.name)}
                      disabled={deletingId === product._id}
                      className="px-3 py-1.5 bg-red-50 text-red-700 rounded-md text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      {deletingId === product._id ? '...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {products.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <span className="text-4xl block mb-2">📦</span>
          <p>No products found</p>
        </div>
      )}
    </div>
  );
}
