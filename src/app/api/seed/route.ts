import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';

const demoProducts = [
  {
    name: 'Royal Garam Masala',
    description:
      'A premium blend of 12 whole spices, slow-roasted and ground to perfection. Our signature Garam Masala elevates any curry, biryani, or dal to restaurant quality. Made with cardamom, cinnamon, cloves, black pepper, bay leaves, mace, and more.',
    price: 249,
    mrp: 349,
    stock: 50,
    category: 'blended-masala',
    image: '/images/default-product.jpg',
    images: [],
  },
  {
    name: 'Kashmiri Red Chilli Powder',
    description:
      'Vibrant, deep-red Kashmiri chilli powder sourced directly from the valleys of Kashmir. Known for its rich colour and mild heat, perfect for tandoori dishes, gravies, and marinades. No artificial colouring — 100% pure Kashmiri Deghi Mirch.',
    price: 199,
    mrp: 279,
    stock: 75,
    category: 'ground-spices',
    image: '/images/default-product.jpg',
    images: [],
  },
  {
    name: 'Organic Turmeric Powder',
    description:
      'Certified organic Lakadong turmeric from Meghalaya — the highest curcumin content turmeric in the world (7-12%). This golden spice is perfect for curries, golden milk, and health remedies. Lab-tested for purity, no fillers or additives.',
    price: 179,
    mrp: 249,
    stock: 100,
    category: 'organic',
    image: '/images/default-product.jpg',
    images: [],
  },
  {
    name: 'Whole Kerala Black Pepper',
    description:
      'Premium Malabar black peppercorns, hand-picked from the spice gardens of Kerala. Known as the "King of Spices", these bold peppercorns deliver intense aroma and sharp heat. Perfect for seasoning, grinding, or tempering.',
    price: 349,
    mrp: 449,
    stock: 40,
    category: 'whole-spices',
    image: '/images/default-product.jpg',
    images: [],
  },
  {
    name: 'Kitchen Essentials Combo Pack',
    description:
      'Everything your kitchen needs in one box! Includes Turmeric Powder (200g), Red Chilli Powder (200g), Coriander Powder (200g), Cumin Powder (100g), and Garam Masala (100g). All freshly ground and vacuum-sealed for maximum freshness. Save ₹200 with this combo!',
    price: 599,
    mrp: 899,
    stock: 30,
    category: 'combo-packs',
    image: '/images/default-product.jpg',
    images: [],
  },
];

export async function POST(request: Request) {
  try {
    const seedKey = request.headers.get('x-seed-key');
    if (seedKey !== process.env.JWT_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const results = [];
    for (const product of demoProducts) {
      const existing = await Product.findOne({ name: product.name });
      if (!existing) {
        const created = await Product.create(product);
        results.push({ name: created.name, status: 'created' });
      } else {
        results.push({ name: existing.name, status: 'already exists' });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${results.filter((r) => r.status === 'created').length} products`,
      data: results,
    });
  } catch (error: unknown) {
    console.error('Seed error:', error);
    const message = error instanceof Error ? error.message : 'Seed failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
