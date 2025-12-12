import type { APIRoute } from 'astro';
import { GoogleGenAI } from '@google/genai';

interface GeminiRequest {
  prompt: string;
  imageBase64?: string | null;
  useJsonMode?: boolean;
}

// CORS configuration
const ALLOWED_ORIGINS = [
  'https://banana-recipe.hacolby.workers.dev',
  'http://localhost:4321',
  'http://localhost:8788',
  'http://127.0.0.1:4321',
  'http://127.0.0.1:8788'
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
  }

  return headers;
}

// Handle OPTIONS preflight requests
export const OPTIONS: APIRoute = async ({ request }) => {
  const origin = request.headers.get('origin');
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin)
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  try {
    const body = await request.json() as GeminiRequest;
    const { prompt, imageBase64, useJsonMode } = body;

    const apiKey = locals.runtime.env.GEMINI_API_KEY as string;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: '⚠️ API Key missing. Unable to contact Gemini.' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Initialize the Google Generative AI client
    const genAI = new GoogleGenAI({ apiKey });
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: useJsonMode ? {
        responseMimeType: "application/json"
      } : undefined
    });

    // Prepare the content parts
    const parts: Array<string | { inlineData: { data: string; mimeType: string } }> = [prompt];

    if (imageBase64) {
      const base64Data = imageBase64.includes(',')
        ? imageBase64.split(',')[1]
        : imageBase64;

      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      });
    }

    // Generate content using the SDK
    const result = await model.generateContent(parts);
    const response = result.response;
    const text = response.text() || "Gemini couldn't process that.";

    return new Response(
      JSON.stringify({ text }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Gemini API Error:', error);
    return new Response(
      JSON.stringify({ error: "Error connecting to Gemini. Please try again." }),
      { status: 500, headers: corsHeaders }
    );
  }
};
