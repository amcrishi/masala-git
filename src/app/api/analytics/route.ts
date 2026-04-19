import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';
import User from '@/models/User';
import { authorizeRequest } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET(request: Request) {
  try {
    const authResult = await authorizeRequest(request, 'admin', 'technician');
    if ('error' in authResult) return authResult.error;

    await dbConnect();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalProducts,
      totalOrders,
      totalUsers,
      lowStockProducts,
      outOfStockProducts,
      revenueAgg,
      ordersByStatus,
      ordersByPayment,
      productsByCategory,
      topProducts,
      recentOrders,
      revenueLast7Days,
      ordersLast7Days,
      usersByRole,
    ] = await Promise.all([
      Product.countDocuments({}),
      Order.countDocuments({}),
      User.countDocuments({}),
      Product.countDocuments({ stock: { $gt: 0, $lte: 10 } }),
      Product.countDocuments({ stock: 0 }),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $group: { _id: '$paymentStatus', count: { $sum: 1 } } },
      ]),
      Product.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 }, totalStock: { $sum: '$stock' } } },
        { $sort: { count: -1 } },
      ]),
      Order.aggregate([
        { $unwind: '$products' },
        {
          $group: {
            _id: '$products.product',
            quantitySold: { $sum: '$products.quantity' },
            revenue: { $sum: { $multiply: ['$products.quantity', '$products.price'] } },
          },
        },
        { $sort: { quantitySold: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            quantitySold: 1,
            revenue: 1,
            name: '$product.name',
            category: '$product.category',
            price: '$product.price',
          },
        },
      ]),
      Order.find({})
        .populate('user', 'name email')
        .sort('-createdAt')
        .limit(5)
        .lean(),
      Order.aggregate([
        { $match: { paymentStatus: 'paid', createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;

    const newUsersLast30Days = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    const newOrdersLast30Days = await Order.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    return successResponse({
      summary: {
        totalProducts,
        totalOrders,
        totalUsers,
        totalRevenue,
        lowStockProducts,
        outOfStockProducts,
        newUsersLast30Days,
        newOrdersLast30Days,
      },
      breakdown: {
        ordersByStatus: ordersByStatus.reduce<Record<string, number>>((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        ordersByPayment: ordersByPayment.reduce<Record<string, number>>((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        usersByRole: usersByRole.reduce<Record<string, number>>((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        productsByCategory,
      },
      topProducts,
      recentOrders,
      timeline: {
        revenueLast7Days,
        ordersLast7Days,
      },
    });
  } catch (error: unknown) {
    console.error('Analytics error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch analytics';
    return errorResponse(message, 500);
  }
}
