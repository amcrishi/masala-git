import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { authorizeRequest, authenticateRequest } from '@/lib/api-helpers';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/api-helpers';
import { validateProductData, sanitizeInput } from '@/lib/validation';

export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12')));
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || '-createdAt';

    const query: Record<string, unknown> = {};
    if (category) query.category = category;
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Product.countDocuments(query),
    ]);

    return paginatedResponse(products, total, page, limit);
  } catch (error: unknown) {
    console.error('Get products error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch products';
    return errorResponse(message, 500);
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await authorizeRequest(request, 'admin');
    if ('error' in authResult) return authResult.error;

    await dbConnect();

    const body = await request.json();
    const { name, description, price, mrp, stock, category, image, images } = body;

    const validation = validateProductData({ name, price, stock, category });
    if (!validation.valid) {
      return errorResponse(validation.errors.join(', '));
    }

    if (mrp && mrp < price) {
      return errorResponse('MRP cannot be less than selling price');
    }

    const productImages = Array.isArray(images) ? images.slice(0, 5) : [];

    const product = await Product.create({
      name: sanitizeInput(name),
      description: sanitizeInput(description || ''),
      price,
      mrp: mrp || 0,
      stock: stock || 0,
      category,
      image: productImages[0] || image || '/images/default-product.jpg',
      images: productImages,
    });

    return successResponse(product, 201);
  } catch (error: unknown) {
    console.error('Create product error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create product';
    return errorResponse(message, 500);
  }
}
