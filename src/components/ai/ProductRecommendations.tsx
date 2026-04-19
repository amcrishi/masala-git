'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface RecommendedProduct {
  _id: string;
  name: string;
  category: string;
  price: number;
  mrp?: number;
  image?: string;
  images?: string[];
}

const categoryEmoji: Record<string, string> = {
  'whole-spices': '🌿',
  'ground-spices': '🌶️',
  'blended-masala': '✨',
  herbs: '🍃',
  seasoning: '🧂',
  organic: '🫚',
  premium: '👑',
  'combo-packs': '🎁',
};

export default function ProductRecommendations({ productId }: { productId: string }) {
  const [products, setProducts] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/ai/recommendations?productId=${productId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setProducts(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  if (!loading && products.length === 0) return null;

  return (
    <section className="mt-12 border-t border-amber-100 pt-10">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">✨</span>
        <h2 className="text-2xl font-bold text-amber-900">AI Recommended Pairings</h2>
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium ml-1">
          Powered by Gemini
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-amber-50 rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {products.map((product) => {
            const img = product.images?.[0] || product.image;
            const isValidImg = !!img && !img.includes('default-product');
            const emoji = categoryEmoji[product.category] || '🌶️';
            const discount =
              product.mrp && product.mrp > product.price
                ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
                : 0;

            return (
              <Link key={product._id} href={`/products/${product._id}`}>
                <div className="bg-white rounded-xl overflow-hidden border border-amber-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
                  <div className="relative h-32 bg-gradient-to-br from-amber-50 to-orange-50">
                    {isValidImg ? (
                      <Image
                        src={img!}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-4xl">{emoji}</span>
                      </div>
                    )}
                    {discount > 0 && (
                      <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                        -{discount}%
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-amber-700 transition-colors">
                      {product.name}
                    </p>
                    <p className="text-amber-700 font-bold text-sm mt-1">₹{product.price}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
