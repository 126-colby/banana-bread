import type { APIRoute } from 'astro';

interface GeminiRequest {
  prompt: string;
  imageBase64?: string | null;
  useJsonMode?: boolean;
}

interface GeminiTextPart {
  text: string;
}

interface GeminiInlineDataPart {
  inlineData: {
    mimeType: string;
    data: string;
  };
}

type GeminiPart = GeminiTextPart | GeminiInlineDataPart;

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json() as GeminiRequest;
    const { prompt, imageBase64, useJsonMode } = body;
    
    const apiKey = locals.runtime.env.GEMINI_API_KEY as string;
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: '⚠️ API Key missing. Unable to contact Gemini.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

    const parts: GeminiPart[] = [{ text: prompt }];
    
    if (imageBase64) {
      const base64Data = imageBase64.includes(',') 
        ? imageBase64.split(',')[1] 
        : imageBase64;
      
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data
        }
      });
    }

    const requestBody: any = { contents: [{ parts }] };
    
    if (useJsonMode) {
      requestBody.generationConfig = {
        response_mime_type: "application/json"
      };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.error(`Gemini API HTTP error: ${response.status} ${response.statusText}`);
      return new Response(
        JSON.stringify({ error: `Gemini API error: ${response.statusText}` }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json() as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Gemini couldn't process that.";
    
    return new Response(
      JSON.stringify({ text }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Gemini API Error:", error);
    return new Response(
      JSON.stringify({ error: "Error connecting to Gemini. Please try again." }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
