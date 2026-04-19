import Razorpay from 'razorpay';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { authenticateRequest } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import mongoose from 'mongoose';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if ('error' in authResult) return authResult.error;

    await dbConnect();

    const body = await request.json();
    const { orderId } = body;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return errorResponse('Valid order ID is required');
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return errorResponse('Order not found', 404);
    }

    if (order.user.toString() !== authResult.user.userId) {
      return errorResponse('Not authorized', 403);
    }

    if (order.paymentStatus === 'paid') {
      return errorResponse('Order is already paid');
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.totalAmount * 100), // Razorpay expects amount in paise
      currency: 'INR',
      receipt: order._id.toString(),
      notes: {
        orderId: order._id.toString(),
        userId: authResult.user.userId,
      },
    });

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    return successResponse({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      orderId: order._id,
    });
  } catch (error: unknown) {
    console.error('Create payment order error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create payment order';
    return errorResponse(message, 500);
  }
}
