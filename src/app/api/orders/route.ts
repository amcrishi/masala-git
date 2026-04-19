import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { authenticateRequest, authorizeRequest } from '@/lib/api-helpers';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/api-helpers';
import { validateOrderData } from '@/lib/validation';

export async function GET(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if ('error' in authResult) return authResult.error;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));

    const query: Record<string, unknown> = {};
    
    // Admin can see all orders, users see only their own
    if (authResult.user.role === 'user') {
      query.user = authResult.user.userId;
    }

    const status = searchParams.get('status');
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email')
        .populate('products.product', 'name price image')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ]);

    return paginatedResponse(orders, total, page, limit);
  } catch (error: unknown) {
    console.error('Get orders error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch orders';
    return errorResponse(message, 500);
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if ('error' in authResult) return authResult.error;

    await dbConnect();

    const body = await request.json();
    
    const validation = validateOrderData(body);
    if (!validation.valid) {
      return errorResponse(validation.errors.join(', '));
    }

    // Verify products exist and calculate total
    let totalAmount = 0;
    const orderProducts = [];

    for (const item of body.products) {
      const product = await Product.findById(item.product);
      if (!product) {
        return errorResponse(`Product ${item.product} not found`, 404);
      }
      if (product.stock < item.quantity) {
        return errorResponse(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
      }

      orderProducts.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
      });
      totalAmount += product.price * item.quantity;
    }

    // Reduce stock
    for (const item of orderProducts) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    const order = await Order.create({
      user: authResult.user.userId,
      products: orderProducts,
      totalAmount,
      shippingAddress: body.shippingAddress,
      status: 'pending',
      paymentStatus: 'pending',
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('products.product', 'name price image')
      .lean();

    return successResponse(populatedOrder, 201);
  } catch (error: unknown) {
    console.error('Create order error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create order';
    return errorResponse(message, 500);
  }
}
