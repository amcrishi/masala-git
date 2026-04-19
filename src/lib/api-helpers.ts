import { NextResponse } from 'next/server';
import { verifyToken, type JWTPayload } from './auth';
import type { UserRole } from '@/types';

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  status = 200
) {
  return NextResponse.json(
    {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
    { status }
  );
}

export async function authenticateRequest(
  request: Request
): Promise<{ user: JWTPayload } | { error: NextResponse }> {
  const token = request.headers.get('cookie')?.match(/token=([^;]+)/)?.[1];
  
  if (!token) {
    return { error: errorResponse('Authentication required', 401) };
  }

  const user = await verifyToken(token);
  if (!user) {
    return { error: errorResponse('Invalid or expired token', 401) };
  }

  return { user };
}

export async function authorizeRequest(
  request: Request,
  ...allowedRoles: UserRole[]
): Promise<{ user: JWTPayload } | { error: NextResponse }> {
  const authResult = await authenticateRequest(request);
  
  if ('error' in authResult) {
    return authResult;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(authResult.user.role)) {
    return { error: errorResponse('Insufficient permissions', 403) };
  }

  return authResult;
}
