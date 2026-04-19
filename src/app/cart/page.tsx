'use client';

import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, totalPrice, totalSavings, totalItems } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const handleCheckout = () => {
    if (!user) {
      router.push('/login?callbackUrl=/cart');
      return;
    }
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <span className="text-7xl block mb-4">🛒</span>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Browse our collection of premium masalas</p>
        <Link href="/products" className="bg-amber-700 hover:bg-amber-600 text-white px-8 py-3 rounded-xl font-semibold transition-colors">
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Shopping Cart <span className="text-lg text-gray-400 font-normal">({totalItems} items)</span></h1>
        <button onClick={clearCart} className="text-red-600 hover:text-red-700 text-sm font-medium">Clear Cart</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(({ product, quantity }) => {
            const hasImage = product.images?.length > 0 || (product.image && product.image !== '/images/default-product.jpg');
            const imgSrc = product.images?.[0] || product.image;
            const discount = product.mrp && product.mrp > product.price
              ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

            return (
              <div key={product._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-4">
                {/* Image */}
                <div className="w-24 h-24 rounded-lg bg-amber-50 flex-shrink-0 overflow-hidden relative">
                  {hasImage ? (
                    <Image src={imgSrc} alt={product.name} fill className="object-cover" sizes="96px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🌶️</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${product._id}`} className="font-semibold text-gray-900 hover:text-amber-700 line-clamp-1">
                    {product.name}
                  </Link>

                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-bold text-amber-700">₹{product.price.toLocaleString('en-IN')}</span>
                    {discount > 0 && (
                      <>
                        <span className="text-sm text-gray-400 line-through">₹{product.mrp.toLocaleString('en-IN')}</span>
                        <span className="text-xs font-bold text-emerald-600">{discount}% off</span>
                      </>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(product._id, quantity - 1)}
                        className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 font-bold"
                      >−</button>
                      <span className="px-3 py-1.5 font-medium text-gray-900 bg-gray-50 min-w-[2.5rem] text-center">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(product._id, quantity + 1)}
                        disabled={quantity >= product.stock}
                        className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 font-bold disabled:opacity-30"
                      >+</button>
                    </div>
                    <button
                      onClick={() => removeFromCart(product._id)}
                      className="text-red-500 hover:text-red-600 text-sm font-medium"
                    >Remove</button>
                  </div>
                </div>

                {/* Line total */}
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-gray-900">₹{(product.price * quantity).toLocaleString('en-IN')}</div>
                  {discount > 0 && (
                    <div className="text-xs text-emerald-600">Save ₹{((product.mrp - product.price) * quantity).toLocaleString('en-IN')}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit sticky top-20">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal ({totalItems} items)</span>
              <span>₹{(totalPrice + totalSavings).toLocaleString('en-IN')}</span>
            </div>
            {totalSavings > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount</span>
                <span>- ₹{totalSavings.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Delivery</span>
              <span className="text-emerald-600 font-medium">FREE</span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold text-gray-900">
              <span>Total</span>
              <span>₹{totalPrice.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {totalSavings > 0 && (
            <div className="mt-3 p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-emerald-700 text-center font-medium">
              🎉 You save ₹{totalSavings.toLocaleString('en-IN')} on this order!
            </div>
          )}

          <button
            onClick={handleCheckout}
            className="w-full mt-4 bg-gradient-to-r from-amber-700 to-orange-600 hover:from-amber-600 hover:to-orange-500 text-white py-3.5 rounded-xl font-bold text-lg transition-all shadow-lg shadow-amber-200/50"
          >
            {user ? '💳 Proceed to Checkout' : '🔐 Login to Checkout'}
          </button>

          <Link href="/products" className="block text-center mt-3 text-amber-700 hover:text-amber-600 text-sm font-medium">
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
