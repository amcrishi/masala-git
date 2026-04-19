import Link from 'next/link';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import FeaturedProducts from '@/components/products/FeaturedProducts';

const categories = [
  { name: 'Whole Spices', slug: 'whole-spices', icon: '🌿', description: 'Pure, unground spices for maximum flavour' },
  { name: 'Ground Spices', slug: 'ground-spices', icon: '🌶️', description: 'Freshly ground to perfection' },
  { name: 'Blended Masala', slug: 'blended-masala', icon: '✨', description: 'Our signature masala blends' },
  { name: 'Organic', slug: 'organic', icon: '🍃', description: '100% certified organic spices' },
  { name: 'Premium', slug: 'premium', icon: '👑', description: 'Hand-selected premium quality' },
  { name: 'Combo Packs', slug: 'combo-packs', icon: '🎁', description: 'Value packs for every kitchen' },
];

const features = [
  { title: 'Farm Fresh', description: 'Sourced directly from spice farms across India', icon: '🌾' },
  { title: 'No Additives', description: 'Pure spices with zero artificial colours or preservatives', icon: '🚫' },
  { title: 'Traditional Recipes', description: 'Age-old recipes passed down through generations', icon: '📜' },
  { title: 'Pan-India Delivery', description: 'Fast and reliable delivery across India', icon: '🚚' },
];

async function getFeaturedProducts() {
  try {
    await dbConnect();
    const products = await Product.find({ stock: { $gt: 0 } })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();
    return JSON.parse(JSON.stringify(products));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-amber-800 via-amber-900 to-amber-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Authentic Indian <br />
              <span className="text-amber-300">Masalas & Spices</span>
            </h1>
            <p className="text-lg md:text-xl text-amber-100 mb-8 leading-relaxed">
              Handcrafted with love using age-old recipes. Bringing the rich, aromatic flavours 
              of India straight to your kitchen. Every pinch tells a story of tradition.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/products"
                className="bg-amber-500 hover:bg-amber-400 text-amber-950 px-8 py-3 rounded-lg font-bold text-lg transition-colors"
              >
                Shop Now 🛒
              </Link>
              <Link
                href="/products?category=premium"
                className="border-2 border-amber-400 text-amber-300 hover:bg-amber-400 hover:text-amber-950 px-8 py-3 rounded-lg font-bold text-lg transition-colors"
              >
                Premium Collection
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 text-9xl">🌿</div>
          <div className="absolute bottom-10 right-40 text-8xl">🌶️</div>
          <div className="absolute top-40 right-60 text-7xl">✨</div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="text-center p-6">
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-16 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-amber-900 mb-4">
                🔥 Bestselling Masalas
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Our most loved spices, trusted by thousands of Indian kitchens
              </p>
            </div>
            <FeaturedProducts products={featuredProducts} />
            <div className="text-center mt-10">
              <Link
                href="/products"
                className="inline-block bg-amber-700 hover:bg-amber-600 text-white px-8 py-3 rounded-lg font-bold transition-colors"
              >
                View All Products →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="py-16 bg-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-amber-900 mb-4">
              Explore Our Collection
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From whole spices to premium blends, discover the perfect masala for every dish
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link key={category.slug} href={`/products?category=${category.slug}`}>
                <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer border border-amber-100">
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                    {category.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-amber-700 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-gray-500">{category.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Story */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-amber-900 mb-6">
              Our Story
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              For generations, our family has been dedicated to the art of spice blending. 
              Every masala at SpiceCraft is a testament to our commitment to quality and tradition.
              We source the finest ingredients directly from spice farms across Kerala, Rajasthan, 
              and other spice-rich regions of India.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              Our state-of-the-art processing ensures that every grain of spice retains its 
              natural oils, aroma, and flavour — giving you an authentic taste experience 
              that transforms every meal into a celebration.
            </p>
            <Link
              href="/products"
              className="inline-block bg-amber-700 hover:bg-amber-600 text-white px-8 py-3 rounded-lg font-bold transition-colors"
            >
              Discover Our Products →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-amber-700 to-amber-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Spice Up Your Kitchen?
          </h2>
          <p className="text-amber-200 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of happy customers who trust SpiceCraft for their daily cooking needs.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/register"
              className="bg-white text-amber-900 hover:bg-amber-50 px-8 py-3 rounded-lg font-bold transition-colors"
            >
              Create Account
            </Link>
            <Link
              href="/products"
              className="border-2 border-white hover:bg-white hover:text-amber-900 px-8 py-3 rounded-lg font-bold transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
