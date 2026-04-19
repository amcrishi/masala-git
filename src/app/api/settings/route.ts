import dbConnect from '@/lib/mongodb';
import Settings from '@/models/Settings';
import { errorResponse, authenticateRequest } from '@/lib/api-helpers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await dbConnect();
    const settings = await Settings.find({}).lean();
    const map: Record<string, unknown> = {};
    for (const s of settings) map[s.key] = s.value;
    return NextResponse.json({ success: true, data: map });
  } catch {
    return errorResponse('Failed to fetch settings', 500);
  }
}

export async function PUT(request: Request) {
  const auth = await authenticateRequest(request);
  if ('error' in auth || auth.user?.role !== 'admin') {
    return errorResponse('Admin access required', 403);
  }

  try {
    await dbConnect();
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return errorResponse('Key and value are required');
    }

    const updated = await Settings.findOneAndUpdate(
      { key },
      { value },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return errorResponse('Failed to update setting', 500);
  }
}
