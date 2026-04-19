import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { hashPassword, signToken } from '@/lib/auth';
import { validateEmail, validatePassword, sanitizeInput } from '@/lib/validation';
import { errorResponse } from '@/lib/api-helpers';

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return errorResponse('Name, email, and password are required');
    }

    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = sanitizeInput(email).toLowerCase();

    if (!validateEmail(sanitizedEmail)) {
      return errorResponse('Invalid email format');
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return errorResponse(passwordValidation.message);
    }

    const existingUser = await User.findOne({ email: sanitizedEmail });
    if (existingUser) {
      return errorResponse('Email is already registered');
    }

    const hashedPassword = await hashPassword(password);
    
    const user = await User.create({
      name: sanitizedName,
      email: sanitizedEmail,
      password: hashedPassword,
      role: 'user',
    });

    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
      },
      { status: 201 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    console.error('Registration error:', error);
    const message = error instanceof Error ? error.message : 'Registration failed';
    return errorResponse(message, 500);
  }
}
