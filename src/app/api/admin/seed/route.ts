import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-helpers';

const DEFAULT_ADMIN = {
  name: 'Super Admin',
  email: 'admin@spicecraft.in',
  password: 'Admin@123456',
  role: 'admin' as const,
};

export async function POST(request: Request) {
  try {
    const seedKey = request.headers.get('x-seed-key');
    if (seedKey !== process.env.JWT_SECRET) {
      return errorResponse('Unauthorized', 401);
    }

    await dbConnect();

    const hashed = await hashPassword(DEFAULT_ADMIN.password);
    const existing = await User.findOne({ email: DEFAULT_ADMIN.email });

    if (existing) {
      existing.password = hashed;
      existing.role = 'admin';
      existing.name = DEFAULT_ADMIN.name;
      await existing.save();
      return successResponse({
        message: 'Admin updated',
        email: DEFAULT_ADMIN.email,
        password: DEFAULT_ADMIN.password,
      });
    }

    await User.create({ ...DEFAULT_ADMIN, password: hashed });
    return successResponse({
      message: 'Admin created',
      email: DEFAULT_ADMIN.email,
      password: DEFAULT_ADMIN.password,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Seed failed';
    return errorResponse(message, 500);
  }
}
