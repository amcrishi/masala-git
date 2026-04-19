'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import ProductRecommendations from '@/components/ai/ProductRecommendations';
import type { IProduct } from '@/types';

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

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [ordering, setOrdering] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});
  const { user } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        if (data.success) {
          setProduct(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  const handleOrder = async () => {
    if (!user) {
      router.push('/login?callbackUrl=' + encodeURIComponent(`/products/${id}`));
      return;
    }
    router.push(`/checkout?productId=${id}&quantity=${quantity}`);
  };

  if (loading) {
    return (
      <div className="py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <span className="text-6xl block mb-4">😕</span>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
        <Link href="/products" className="text-amber-600 hover:text-amber-500 font-medium">
          ← Back to products
        </Link>
      </div>
    );
  }

  const discount = product.mrp && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const hasImages = product.images?.length > 0;
  const allImages = hasImages
    ? product.images
    : product.image && product.image !== '/images/default-product.jpg'
    ? [product.image]
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/products" className="text-amber-600 hover:text-amber-500 font-medium mb-6 inline-flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to products
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-4">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl overflow-hidden h-80 md:h-[480px] shadow-lg">
            {allImages.length > 0 && !imgErrors[activeImage] ? (
              <Image
                src={allImages[activeImage] || allImages[0]}
                alt={product.name}
                fill
                className="object-cover transition-all duration-500"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                onError={() => setImgErrors((prev) => ({ ...prev, [activeImage]: true }))}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-9xl drop-shadow-xl">🌶️</span>
              </div>
            )}

            {/* Discount badge on image */}
            {discount > 0 && (
              <div className="absolute top-4 right-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-400 rounded-xl blur-lg opacity-50 animate-pulse" />
                  <div className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white font-extrabold px-4 py-2 rounded-xl shadow-2xl text-lg">
                    {discount}% OFF
                  </div>
                </div>
              </div>
            )}

            {/* Image counter */}
            {allImages.length > 1 && (
              <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-full">
                {activeImage + 1} / {allImages.length}
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {allImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {allImages.map((img, i) => (
                <button
                  key={`thumb-${i}`}
                  onClick={() => setActiveImage(i)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all duration-300 ${
                    i === activeImage
                      ? 'border-amber-500 ring-2 ring-amber-200 scale-105'
                      : 'border-gray-200 hover:border-amber-300 opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-semibold mb-3">
              {categoryLabels[product.category] || product.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
              {product.name}
            </h1>
          </div>

          <p className="text-gray-600 text-lg leading-relaxed">
            {product.description}
          </p>

          {/* Price Block — Futuristic */}
          <div className="bg-gradient-to-br from-gray-50 to-amber-50/50 rounded-2xl p-6 border border-amber-100 shadow-sm">
            <div className="flex items-end gap-4 flex-wrap">
              {/* Selling Price */}
              <div className="text-4xl font-black bg-gradient-to-r from-amber-700 via-orange-600 to-red-600 bg-clip-text text-transparent">
                ₹{product.price.toLocaleString('en-IN')}
              </div>

              {/* MRP strikethrough */}
              {discount > 0 && (
                <div className="flex items-center gap-3 pb-1">
                  <span className="text-xl text-gray-400 line-through decoration-red-500 decoration-2">
                    MRP ₹{product.mrp.toLocaleString('en-IN')}
                  </span>
                  <span className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-extrabold rounded-full shadow-md shadow-emerald-200">
                    SAVE {discount}%
                  </span>
                </div>
              )}
            </div>

            {/* Savings banner */}
            {discount > 0 && (
              <div className="mt-3 flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">
                  You save ₹{(product.mrp - product.price).toLocaleString('en-IN')} on this product!
                </span>
              </div>
            )}

            <p className="text-xs text-gray-400 mt-2">Inclusive of all taxes</p>
          </div>

          {/* Stock status — hide exact count from customers, warn only when < 5 */}
          {product.stock === 0 ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-red-50 text-red-600 border border-red-200">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              Out of Stock
            </div>
          ) : product.stock < 5 ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              ⚠️ Only a few left — hurry!
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              In Stock
            </div>
          )}

          {/* Quantity + Buy */}
          {product.stock > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-semibold text-gray-700">Quantity:</label>
                <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 font-bold text-lg transition-colors"
                  >
                    −
                  </button>
                  <span className="px-5 py-2.5 font-bold text-gray-900 bg-gray-50 min-w-[3rem] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 font-bold text-lg transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-sm text-gray-500">Total:</span>
                <span className="text-2xl font-extrabold text-amber-700">
                  ₹{(product.price * quantity).toLocaleString('en-IN')}
                </span>
                {discount > 0 && (
                  <span className="text-sm text-emerald-600 font-semibold">
                    (saving ₹{((product.mrp - product.price) * quantity).toLocaleString('en-IN')})
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  if (!user) {
                    router.push(`/login?callbackUrl=/products/${id}`);
                    return;
                  }
                  addToCart(product, quantity);
                }}
                className="w-full bg-white border-2 border-amber-700 text-amber-700 hover:bg-amber-50 py-4 rounded-2xl font-extrabold text-lg transition-all"
              >
                {user ? '🛒 Add to Cart' : '🔐 Login to Add to Cart'}
              </button>

              <button
                onClick={handleOrder}
                disabled={ordering}
                className="w-full relative overflow-hidden bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700 hover:from-amber-600 hover:via-orange-500 hover:to-amber-600 text-white py-4 rounded-2xl font-extrabold text-lg transition-all disabled:opacity-50 shadow-xl shadow-amber-200/50 hover:shadow-amber-300/50 hover:scale-[1.01] active:scale-[0.99]"
              >
                <span className="relative z-10">
                  {ordering ? 'Processing...' : user ? '⚡ Buy Now' : '🔐 Login to Buy'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI Recommendations */}
      <ProductRecommendations productId={id} />
    </div>
  );
}
