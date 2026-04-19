import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { authorizeRequest } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { hashPassword } from '@/lib/auth';
import { validateEmail, validatePassword, sanitizeInput } from '@/lib/validation';
import mongoose from 'mongoose';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authorizeRequest(request, 'admin');
    if ('error' in authResult) return authResult.error;

    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid user ID', 400);
    }

    const user = await User.findById(id).select('-password').lean();
    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse(user);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch user';
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
      return errorResponse('Invalid user ID', 400);
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = sanitizeInput(name);
    if (email) {
      const sanitizedEmail = sanitizeInput(email).toLowerCase();
      if (!validateEmail(sanitizedEmail)) {
        return errorResponse('Invalid email format');
      }
      updateData.email = sanitizedEmail;
    }
    if (password) {
      const validation = validatePassword(password);
      if (!validation.valid) return errorResponse(validation.message);
      updateData.password = await hashPassword(password);
    }
    if (role) {
      const validRoles = ['admin', 'technician', 'user'];
      if (!validRoles.includes(role)) return errorResponse('Invalid role');
      
      // Prevent admin from removing their own admin role
      if (id === authResult.user.userId && role !== 'admin') {
        return errorResponse('You cannot change your own admin role', 403);
      }
      updateData.role = role;
    }

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password').lean();

    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse(user);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update user';
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
      return errorResponse('Invalid user ID', 400);
    }

    if (id === authResult.user.userId) {
      return errorResponse('You cannot delete your own account', 403);
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse({ message: 'User deleted successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete user';
    return errorResponse(message, 500);
  }
}
