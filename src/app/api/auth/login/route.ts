import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { comparePassword, signToken } from '@/lib/auth';
import { validateEmail, sanitizeInput } from '@/lib/validation';
import { errorResponse } from '@/lib/api-helpers';

export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse('Email and password are required');
    }

    const sanitizedEmail = sanitizeInput(email).toLowerCase();

    if (!validateEmail(sanitizedEmail)) {
      return errorResponse('Invalid email format');
    }

    const user = await User.findOne({ email: sanitizedEmail }).select('+password');
    if (!user) {
      return errorResponse('Invalid email or password', 401);
    }

    // Account was created via Google SSO — no password set
    if (!user.password) {
      return errorResponse('This account uses Google Sign-In. Please use the "Sign in with Google" button.', 401);
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return errorResponse('Invalid email or password', 401);
    }

    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    console.error('Login error:', error);
    const message = error instanceof Error ? error.message : 'Login failed';
    return errorResponse(message, 500);
  }
}
