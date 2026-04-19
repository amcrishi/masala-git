import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { signToken } from '@/lib/auth';
import { errorResponse } from '@/lib/api-helpers';

interface GoogleTokenPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
}

async function verifyGoogleToken(idToken: string): Promise<GoogleTokenPayload | null> {
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );
    if (!res.ok) return null;
    const payload = await res.json();

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (clientId && payload.aud !== clientId) {
      return null;
    }

    if (!payload.email_verified) return null;

    return {
      sub: payload.sub,
      email: payload.email,
      email_verified: payload.email_verified,
      name: payload.name,
      picture: payload.picture,
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { credential } = body;

    if (!credential) {
      return errorResponse('Google credential is required');
    }

    const googleUser = await verifyGoogleToken(credential);
    if (!googleUser) {
      return errorResponse('Invalid Google credential', 401);
    }

    // Find by googleId or email
    let user = await User.findOne({
      $or: [
        { googleId: googleUser.sub },
        { email: googleUser.email.toLowerCase() },
      ],
    });

    if (user) {
      // Link Google to existing account if not already linked
      if (!user.googleId) {
        user.googleId = googleUser.sub;
        user.authProvider = user.authProvider === 'local' ? 'local' : 'google';
        if (googleUser.picture && !user.avatar) {
          user.avatar = googleUser.picture;
        }
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        name: googleUser.name,
        email: googleUser.email.toLowerCase(),
        googleId: googleUser.sub,
        avatar: googleUser.picture || '',
        authProvider: 'google',
        role: 'user',
      });
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
    console.error('Google auth error:', error);
    const message = error instanceof Error ? error.message : 'Google authentication failed';
    return errorResponse(message, 500);
  }
}
