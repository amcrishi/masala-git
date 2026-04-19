import { generateText } from 'ai';
import { gemini } from '@/lib/ai';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json({ success: false, data: [] });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    if (!productId) {
      return NextResponse.json({ success: false, error: 'productId required' }, { status: 400 });
    }

    await dbConnect();
    const currentProduct = await Product.findById(productId).lean();
    if (!currentProduct) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    // Get all other products to match against
    const allProducts = await Product.find({
      _id: { $ne: productId },
      stock: { $gt: 0 },
    })
      .select('_id name category price mrp images image')
      .lean();

    if (allProducts.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const productNames = allProducts.map((p) => p.name).join(', ');

    const { text } = await generateText({
      model: gemini,
      prompt: `A customer is viewing "${currentProduct.name}" (${currentProduct.category}).
From this list of available products: ${productNames}
Pick the 4 most complementary products that go well with "${currentProduct.name}" for Indian cooking.
Reply with ONLY a JSON array of product names, exactly as they appear in the list. Example: ["Name1", "Name2", "Name3", "Name4"]`,
      maxOutputTokens: 150,
    });

    // Parse AI response and match to real products
    let recommendedNames: string[] = [];
    try {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) recommendedNames = JSON.parse(match[0]);
    } catch {
      recommendedNames = [];
    }

    const recommended = allProducts
      .filter((p) => recommendedNames.includes(p.name))
      .slice(0, 4);

    return NextResponse.json({ success: true, data: JSON.parse(JSON.stringify(recommended)) });
  } catch (error) {
    console.error('Recommendations error:', error);
    return NextResponse.json({ success: true, data: [] }); // fail silently
  }
}
