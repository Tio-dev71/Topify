import { NextRequest, NextResponse } from 'next/server';
import { topifyAiStore } from '@/lib/ai/topify-ai-engine';

export async function GET() {
  try {
    const images = topifyAiStore.getGeneratedImages();
    return NextResponse.json({ images });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch images' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, style = '3D_RENDER', aspectRatio = '1:1' } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    const image = await topifyAiStore.generateImage({
      prompt,
      style,
      aspectRatio,
    });

    return NextResponse.json({ image });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate image' }, { status: 500 });
  }
}
