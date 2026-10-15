import { NextRequest, NextResponse } from 'next/server';
import { topifyAiStore } from '@/lib/ai/topify-ai-engine';

export async function GET() {
  try {
    const videos = topifyAiStore.getGeneratedVideos();
    return NextResponse.json({ videos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch videos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, aspectRatio = '9:16', systemPrompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    const video = await topifyAiStore.generateVideoStoryboard({
      prompt,
      aspectRatio,
      systemPrompt,
    });

    return NextResponse.json({ video });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate video storyboard' }, { status: 500 });
  }
}
