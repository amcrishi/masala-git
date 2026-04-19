import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { authorizeRequest } from '@/lib/api-helpers';
import { uploadToCloudinary } from '@/lib/cloudinary';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'products');
const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

const useCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

export async function POST(request: Request) {
  try {
    const authResult = await authorizeRequest(request, 'admin', 'technician');
    if ('error' in authResult) return authResult.error;

    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: 'No files uploaded' }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json({ success: false, error: `Maximum ${MAX_FILES} images allowed` }, { status: 400 });
    }

    const uploadedPaths: string[] = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ success: false, error: `Invalid file type: ${file.type}` }, { status: 400 });
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ success: false, error: `"${file.name}" exceeds 5MB limit` }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      if (useCloudinary) {
        // Production: upload to Cloudinary
        const url = await uploadToCloudinary(buffer, file.name);
        uploadedPaths.push(url);
      } else {
        // Development: save locally
        if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true });
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
        await writeFile(path.join(UPLOAD_DIR, uniqueName), buffer);
        uploadedPaths.push(`/uploads/products/${uniqueName}`);
      }
    }

    return NextResponse.json({ success: true, data: { paths: uploadedPaths } });
  } catch (error: unknown) {
    console.error('Upload error:', error);
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
