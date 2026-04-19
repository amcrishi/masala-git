import { streamText } from 'ai';
import { getGeminiModel } from '@/lib/ai';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
    }

    const { messages } = await request.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 });
    }

    // Fetch product catalog to inject as context
    await dbConnect();
    const products = await Product.find({ stock: { $gt: 0 } })
      .select('name category price description')
      .limit(50)
      .lean();

    const productList = products
      .map((p) => `- ${p.name} (${p.category}) — ₹${p.price}: ${p.description?.slice(0, 80)}`)
      .join('\n');

    const systemPrompt = `You are SpiceCraft's friendly AI Spice Assistant for an Indian masala brand.
Your job is to help customers find the right spices and masalas for their cooking needs.

Available products in our store:
${productList}

Guidelines:
- Always suggest specific products from the list above when relevant
- Give short, friendly, helpful answers (2-4 sentences max)
- Mention prices when recommending products
- If asked about a dish, suggest the best matching masala from our catalog
- Stay focused on spices, cooking, and our products
- Respond in the same language the user writes in (English or Hinglish is fine)`;

    const result = streamText({
      model: getGeminiModel(),
      system: systemPrompt,
      messages,
      maxOutputTokens: 300,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json({ error: 'AI service error' }, { status: 500 });
  }
}
