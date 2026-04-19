import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import dbConnect from '@/lib/mongodb';
import Settings from '@/models/Settings';

export const metadata: Metadata = {
  title: 'SpiceCraft - Authentic Indian Masalas',
  description: 'Premium quality traditional Indian masalas handcrafted with love. Bringing authentic flavours to your kitchen since generations.',
};

async function getSiteTheme(): Promise<string> {
  try {
    await dbConnect();
    const setting = await Settings.findOne({ key: 'site-theme' }).lean();
    return (setting?.value as string) || 'amber';
  } catch {
    return 'amber';
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getSiteTheme();

  return (
    <html lang="en" data-theme={theme === 'amber' ? undefined : theme}>
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
