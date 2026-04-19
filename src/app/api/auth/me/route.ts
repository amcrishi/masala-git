import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { authenticateRequest } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if ('error' in authResult) return authResult.error;

    await dbConnect();

    const user = await User.findById(authResult.user.userId).select('-password');
    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error: unknown) {
    console.error('Get user error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get user';
    return errorResponse(message, 500);
  }
}
