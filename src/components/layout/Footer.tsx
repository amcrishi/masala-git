import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-amber-950 text-amber-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-3xl">🌿</span>
              <span className="text-2xl font-bold">SpiceCraft</span>
            </div>
            <p className="text-amber-300 mb-4 max-w-md">
              Bringing the authentic flavours of India to your kitchen. Our traditional masalas 
              are handcrafted using age-old recipes passed down through generations.
            </p>
            <p className="text-amber-400 text-sm">
              &copy; {new Date().getFullYear()} SpiceCraft. All rights reserved.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-amber-200">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="text-amber-300 hover:text-white transition-colors">
                  Our Products
                </Link>
              </li>
              <li>
                <Link href="/products?category=organic" className="text-amber-300 hover:text-white transition-colors">
                  Organic Spices
                </Link>
              </li>
              <li>
                <Link href="/products?category=premium" className="text-amber-300 hover:text-white transition-colors">
                  Premium Collection
                </Link>
              </li>
              <li>
                <Link href="/products?category=combo-packs" className="text-amber-300 hover:text-white transition-colors">
                  Combo Packs
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-amber-200">Contact Us</h3>
            <ul className="space-y-2 text-amber-300">
              <li className="flex items-center space-x-2">
                <span>📧</span>
                <span>info@spicecraft.in</span>
              </li>
              <li className="flex items-center space-x-2">
                <span>📞</span>
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center space-x-2">
                <span>📍</span>
                <span>Mumbai, Maharashtra, India</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
