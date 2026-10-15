import { NextRequest, NextResponse } from 'next/server';
import { topifyAiStore } from '@/lib/ai/topify-ai-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, topic, brandVoice, targetDuration, productName, benefits, framework, systemPrompt } = body;

    if (type === 'video_script') {
      if (!topic) {
        return NextResponse.json({ error: 'topic is required' }, { status: 400 });
      }
      const script = await topifyAiStore.generateVideoScript({ topic, brandVoice, targetDuration, systemPrompt });
      return NextResponse.json({ script });
    }

    if (type === 'viral_headlines') {
      if (!topic) {
        return NextResponse.json({ error: 'topic is required' }, { status: 400 });
      }
      const headlines = await topifyAiStore.generateViralHeadlines({ topic, systemPrompt });
      return NextResponse.json({ headlines });
    }

    if (type === 'captions') {
      if (!productName || !benefits) {
        return NextResponse.json({ error: 'productName and benefits are required' }, { status: 400 });
      }
      const caption = await topifyAiStore.generateCaptions({
        productName,
        benefits,
        framework: framework || 'AIDA',
        systemPrompt,
      });
      return NextResponse.json({ caption });
    }

    return NextResponse.json({ error: 'Invalid generation type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate content' }, { status: 500 });
  }
}
