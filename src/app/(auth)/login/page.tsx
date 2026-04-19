'use client';

import { Suspense } from 'react';
import LoginForm from '@/components/forms/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-amber-50 to-white py-12">
      <Suspense fallback={<div className="text-center py-20">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
