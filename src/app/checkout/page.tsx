'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { IProduct } from '@/types';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const productId = searchParams.get('productId');
  const quantity = parseInt(searchParams.get('quantity') || '1');

  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
  });

  useEffect(() => {
    if (!productId) return;
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${productId}`);
        const data = await res.json();
        if (data.success) setProduct(data.data);
      } catch (e) {
        console.error('Failed to fetch product:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !user) return;
    setError('');
    setProcessing(true);

    try {
      // 1. Create order
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: [{ product: product._id, quantity }],
          shippingAddress: address,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderData.success) {
        setError(orderData.error || 'Failed to create order');
        setProcessing(false);
        return;
      }

      // 2. Create Razorpay order
      const paymentRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderData.data._id }),
      });
      const paymentData = await paymentRes.json();
      if (!paymentData.success) {
        setError(paymentData.error || 'Failed to create payment');
        setProcessing(false);
        return;
      }

      // 3. Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: paymentData.data.amount,
        currency: paymentData.data.currency,
        name: 'SpiceCraft',
        description: `Order for ${product.name}`,
        order_id: paymentData.data.razorpayOrderId,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          // 4. Verify payment
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            setSuccess(true);
          } else {
            setError('Payment verification failed');
          }
          setProcessing(false);
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: '#92400e',
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          },
        },
      };

      if (typeof window !== 'undefined' && window.Razorpay) {
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        setError('Payment gateway not loaded. Please refresh and try again.');
        setProcessing(false);
      }
    } catch {
      setError('Something went wrong');
      setProcessing(false);
    }
  };

  if (loading) return <div className="py-20"><LoadingSpinner size="lg" /></div>;

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <span className="text-6xl block mb-4">🎉</span>
        <h2 className="text-3xl font-bold text-green-700 mb-4">Payment Successful!</h2>
        <p className="text-gray-600 mb-8">Your order has been confirmed. Thank you for shopping with SpiceCraft!</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-amber-700 hover:bg-amber-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
        >
          View My Orders
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-amber-900 mb-8">Checkout</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="bg-amber-50 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-amber-100 rounded-lg flex items-center justify-center text-2xl">
              🌶️
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{product.name}</h3>
              <p className="text-gray-500 text-sm">Qty: {quantity}</p>
            </div>
            <span className="ml-auto font-bold text-amber-700">₹{product.price * quantity}</span>
          </div>
          <div className="border-t border-amber-200 pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-amber-700">₹{(product.price * quantity).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address Form */}
        <form onSubmit={handleCheckout} className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Shipping Address</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
            <input
              type="text"
              value={address.street}
              onChange={(e) => setAddress({ ...address, street: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
              <input
                type="text"
                value={address.pincode}
                onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                required
                pattern="\d{6}"
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-900"
                placeholder="6-digit pincode"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={address.phone}
                onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                required
                pattern="\d{10}"
                maxLength={10}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-900"
                placeholder="10-digit number"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={processing}
            className="w-full bg-amber-700 hover:bg-amber-600 text-white py-4 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 mt-4"
          >
            {processing ? 'Processing...' : `Pay ₹${(product.price * quantity).toFixed(2)}`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="py-20"><LoadingSpinner size="lg" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
