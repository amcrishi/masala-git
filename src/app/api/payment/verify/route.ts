import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { authenticateRequest } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export async function POST(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if ('error' in authResult) return authResult.error;

    await dbConnect();

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return errorResponse('Missing payment verification data');
    }

    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(sign)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return errorResponse('Invalid payment signature', 400);
    }

    // Update order
    const order = await Order.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        paymentStatus: 'paid',
        razorpayPaymentId: razorpay_payment_id,
        status: 'confirmed',
      },
      { new: true }
    )
      .populate('products.product', 'name price image')
      .lean();

    if (!order) {
      return errorResponse('Order not found', 404);
    }

    return successResponse({
      message: 'Payment verified successfully',
      order,
    });
  } catch (error: unknown) {
    console.error('Verify payment error:', error);
    const message = error instanceof Error ? error.message : 'Payment verification failed';
    return errorResponse(message, 500);
  }
}
