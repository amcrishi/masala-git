import { generateText } from 'ai';
import { getGeminiModel } from '@/lib/ai';
import { authorizeRequest } from '@/lib/api-helpers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'AI not configured — add GOOGLE_AI_API_KEY in Vercel Environment Variables and redeploy.',
      }, { status: 503 });
    }

    const authResult = await authorizeRequest(request, 'admin', 'technician');
    if ('error' in authResult) return authResult.error;

    const { name, category } = await request.json();
    if (!name || !category) {
      return NextResponse.json({ success: false, error: 'Product name and category are required' }, { status: 400 });
    }

    const { text } = await generateText({
      model: getGeminiModel(),
      prompt: `Write a compelling product description for an Indian spice/masala product to be used on an e-commerce website.

Product name: "${name}"
Category: "${category}"

Requirements:
- 2-3 sentences, around 80-120 words
- Highlight flavor profile, aroma, and uses in Indian cooking
- Mention quality and authenticity
- End with a suggestion for which dishes it suits best
- Write in English, engaging and appetizing tone
- Do NOT include the product name at the start`,
      maxOutputTokens: 200,
    });

    return NextResponse.json({ success: true, description: text.trim() });
  } catch (error) {
    console.error('Description generation error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    const userMsg = msg.includes('API key') || msg.includes('api_key') || msg.includes('API_KEY')
      ? 'Invalid or missing GOOGLE_AI_API_KEY. Get a free key at aistudio.google.com/app/apikey'
      : msg.includes('quota') || msg.includes('429')
      ? 'Gemini quota exceeded. Try again in a moment.'
      : `AI error: ${msg}`;
    return NextResponse.json({ success: false, error: userMsg }, { status: 500 });
  }
}
