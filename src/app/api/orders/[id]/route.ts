import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { authenticateRequest, authorizeRequest } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import mongoose from 'mongoose';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if ('error' in authResult) return authResult.error;

    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid order ID', 400);
    }

    const order = await Order.findById(id)
      .populate('user', 'name email')
      .populate('products.product', 'name price image')
      .lean();

    if (!order) {
      return errorResponse('Order not found', 404);
    }

    // Users can only view their own orders
    if (
      authResult.user.role === 'user' &&
      order.user._id?.toString() !== authResult.user.userId
    ) {
      return errorResponse('Not authorized to view this order', 403);
    }

    return successResponse(order);
  } catch (error: unknown) {
    console.error('Get order error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch order';
    return errorResponse(message, 500);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authorizeRequest(request, 'admin');
    if ('error' in authResult) return authResult.error;

    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid order ID', 400);
    }

    const body = await request.json();
    const { status, paymentStatus } = body;

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const order = await Order.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('user', 'name email')
      .populate('products.product', 'name price image')
      .lean();

    if (!order) {
      return errorResponse('Order not found', 404);
    }

    return successResponse(order);
  } catch (error: unknown) {
    console.error('Update order error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update order';
    return errorResponse(message, 500);
  }
}
