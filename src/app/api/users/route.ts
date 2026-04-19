import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { authorizeRequest } from '@/lib/api-helpers';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/api-helpers';
import { hashPassword } from '@/lib/auth';
import { validateEmail, validatePassword, sanitizeInput } from '@/lib/validation';

export async function GET(request: Request) {
  try {
    const authResult = await authorizeRequest(request, 'admin');
    if ('error' in authResult) return authResult.error;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    const query: Record<string, unknown> = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort('-createdAt').skip(skip).limit(limit).lean(),
      User.countDocuments(query),
    ]);

    return paginatedResponse(users, total, page, limit);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch users';
    return errorResponse(message, 500);
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await authorizeRequest(request, 'admin');
    if ('error' in authResult) return authResult.error;

    await dbConnect();

    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return errorResponse('Name, email, and password are required');
    }

    const sanitizedEmail = sanitizeInput(email).toLowerCase();
    if (!validateEmail(sanitizedEmail)) {
      return errorResponse('Invalid email format');
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return errorResponse(passwordValidation.message);
    }

    const validRoles = ['admin', 'technician', 'user'];
    const userRole = validRoles.includes(role) ? role : 'user';

    const existing = await User.findOne({ email: sanitizedEmail });
    if (existing) {
      return errorResponse('Email already registered');
    }

    const hashed = await hashPassword(password);
    const user = await User.create({
      name: sanitizeInput(name),
      email: sanitizedEmail,
      password: hashed,
      role: userRole,
    });

    const userObj = user.toObject() as unknown as Record<string, unknown>;
    delete userObj.password;
    return successResponse(userObj, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create user';
    return errorResponse(message, 500);
  }
}
