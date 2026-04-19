import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { authorizeRequest } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { validateProductData, sanitizeInput } from '@/lib/validation';
import mongoose from 'mongoose';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid product ID', 400);
    }

    const product = await Product.findById(id).lean();
    if (!product) {
      return errorResponse('Product not found', 404);
    }

    return successResponse(product);
  } catch (error: unknown) {
    console.error('Get product error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch product';
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
      return errorResponse('Invalid product ID', 400);
    }

    const body = await request.json();
    const { name, description, price, mrp, stock, category, image, images } = body;

    const validation = validateProductData({ name, price, stock, category });
    if (!validation.valid) {
      return errorResponse(validation.errors.join(', '));
    }

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = sanitizeInput(name);
    if (description !== undefined) updateData.description = sanitizeInput(description);
    if (price !== undefined) updateData.price = price;
    if (mrp !== undefined) updateData.mrp = mrp;
    if (stock !== undefined) updateData.stock = stock;
    if (category) updateData.category = category;
    if (image) updateData.image = image;
    if (Array.isArray(images)) {
      updateData.images = images.slice(0, 5);
      if (images.length > 0) updateData.image = images[0];
    }

    if (mrp !== undefined && price !== undefined && mrp < price) {
      return errorResponse('MRP cannot be less than selling price');
    }

    const product = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).lean();

    if (!product) {
      return errorResponse('Product not found', 404);
    }

    return successResponse(product);
  } catch (error: unknown) {
    console.error('Update product error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update product';
    return errorResponse(message, 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authorizeRequest(request, 'admin');
    if ('error' in authResult) return authResult.error;

    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid product ID', 400);
    }

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return errorResponse('Product not found', 404);
    }

    return successResponse({ message: 'Product deleted successfully' });
  } catch (error: unknown) {
    console.error('Delete product error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete product';
    return errorResponse(message, 500);
  }
}
