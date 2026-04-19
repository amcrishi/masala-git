import { createGoogleGenerativeAI } from '@ai-sdk/google';

export function getGeminiModel() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY is not set');
  const google = createGoogleGenerativeAI({ apiKey });
  return google('gemini-1.5-flash');
}
