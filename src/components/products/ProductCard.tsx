'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import type { IProduct } from '@/types';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface ProductCardProps {
  product: IProduct;
}

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

const categoryEmoji: Record<string, string> = {
  'whole-spices': '🌿',
  'ground-spices': '🌶️',
  'blended-masala': '✨',
  herbs: '🍃',
  seasoning: '🧂',
  organic: '🍃',
  premium: '👑',
  'combo-packs': '🎁',
};

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [imgError, setImgError] = useState(false);

  const discount = product.mrp && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const rawImage = product.images?.[0] || product.image;
  const isValidImage = !imgError &&
    rawImage &&
    rawImage !== '/images/default-product.jpg' &&
    rawImage.trim() !== '';

  const fallbackEmoji = categoryEmoji[product.category] || '🌶️';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`/login?callbackUrl=/products/${product._id}`);
      return;
    }
    addToCart(product);
  };

  return (
    <Link href={`/products/${product._id}`}>
      <div className="group relative bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-amber-200 hover:-translate-y-1">
        {/* Image Area */}
        <div className="relative h-52 bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden">
          {isValidImage ? (
            <Image
              src={rawImage}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-7xl group-hover:scale-110 transition-transform duration-500 drop-shadow-lg">
                {fallbackEmoji}
              </span>
            </div>
          )}

          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Out of Stock badge */}
          {product.stock === 0 && (
            <div className="absolute top-3 right-3 bg-red-500/90 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-semibold shadow-lg">
              Out of Stock
            </div>
          )}

          {/* Category pill */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-amber-800 text-xs px-3 py-1 rounded-full font-semibold shadow-sm">
            {categoryLabels[product.category] || product.category}
          </div>

          {/* Discount Badge — glowing futuristic style */}
          {discount > 0 && (
            <div className="absolute bottom-3 right-3">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-400 rounded-full blur-md opacity-60 animate-pulse" />
                <div className="relative bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-full shadow-lg">
                  {discount}% OFF
                </div>
              </div>
            </div>
          )}

          {/* Image count indicator */}
          {product.images?.length > 1 && isValidImage && (
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {product.images.length}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-amber-700 transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="text-gray-500 text-sm mb-3 line-clamp-2 leading-relaxed">{product.description}</p>

          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {discount > 0 && (
                <span className="text-sm text-gray-400 line-through decoration-red-400 decoration-2">
                  ₹{product.mrp.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            {product.stock === 0 ? (
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-50 text-red-600">
                Sold out
              </span>
            ) : product.stock > 0 && product.stock < 5 ? (
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-700 animate-pulse">
                ⚠️ Few left
              </span>
            ) : null}
          </div>

          {/* Savings line */}
          {discount > 0 && (
            <div className="mt-2 text-xs font-medium text-emerald-600 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              You save ₹{(product.mrp - product.price).toLocaleString('en-IN')}
            </div>
          )}

          {product.stock > 0 && (
            <button
              onClick={handleAddToCart}
              className="mt-3 w-full bg-amber-700 hover:bg-amber-600 text-white py-2 rounded-lg font-semibold text-sm transition-colors"
            >
              {user ? 'Add to Cart 🛒' : '🔐 Login to Buy'}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
