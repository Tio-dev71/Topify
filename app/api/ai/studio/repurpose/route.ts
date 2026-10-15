import { NextRequest, NextResponse } from 'next/server';
import { topifyAiStore } from '@/lib/ai/topify-ai-engine';

export async function GET() {
  try {
    const packages = topifyAiStore.getRepurposedPackages();
    return NextResponse.json({ packages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch repurposed packages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text || text.trim().length < 20) {
      return NextResponse.json({ error: 'Text must be at least 20 characters' }, { status: 400 });
    }

    const pkg = await topifyAiStore.repurposeContent(text);
    return NextResponse.json({ package: pkg });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to repurpose content' }, { status: 500 });
  }
}
