import { NextRequest, NextResponse } from 'next/server';

const GITHUB_API_KEY = process.env.GITHUB_MODELS_API_KEY;
const EMBEDDING_MODEL = 'text-embedding-3-small';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (!GITHUB_API_KEY) {
      console.error('GITHUB_MODELS_API_KEY is not set');
      return NextResponse.json(
        { error: 'API key not configured. Please set GITHUB_MODELS_API_KEY in your .env file.' },
        { status: 500 }
      );
    }

    const response = await fetch(
      'https://models.inference.ai.azure.com/embeddings',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GITHUB_API_KEY}`,
        },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          input: text,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub Models API error:', response.status, errorText);
      throw new Error(`Failed to generate embedding: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const embedding = data.data[0].embedding;

    return NextResponse.json({ embedding });
  } catch (error: any) {
    console.error('Embedding generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate embedding' },
      { status: 500 }
    );
  }
}
