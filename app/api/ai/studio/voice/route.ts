import { NextRequest, NextResponse } from 'next/server';
import { topifyAiStore } from '@/lib/ai/topify-ai-engine';

export async function GET() {
  try {
    const voices = topifyAiStore.getGeneratedVoices();
    return NextResponse.json({ voices });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch voice items' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, voiceId = 'vi-VN-HoaiMy', tone = 'ENTHUSIASTIC', speed = 1.0 } = body;

    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    const voice = await topifyAiStore.generateVoice({
      text,
      voiceId,
      tone,
      speed,
    });

    return NextResponse.json({ voice });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate voice' }, { status: 500 });
  }
}
