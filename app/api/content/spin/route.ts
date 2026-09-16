import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// POST /api/content/spin - Spin content to generate variants
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { content, count = 3, tone } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Get brand voice if available
    let brandVoiceGuide = '';
    const defaultVoice = await prisma.brandVoice.findFirst({
      where: {
        workspaceId: (session.user as any).workspaceId,
        isDefault: true,
      },
    });

    if (defaultVoice) {
      brandVoiceGuide = `
Brand voice guidelines:
- Tone: ${defaultVoice.tone || 'neutral'}
- Personality: ${defaultVoice.personality || ''}
- Banned words: ${defaultVoice.bannedWords || 'none'}
- Preferred CTA: ${defaultVoice.preferredCTA || ''}
`;
    }

    // Use AI to generate spin variants
    const { GoogleGenAI } = await import('@google/genai');
    
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      // Fallback: simple algorithmic spinning
      const variants = generateSimpleSpins(content, count);
      return NextResponse.json({ variants });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Bạn là chuyên gia content marketing. Hãy tạo ${count} biến thể từ nội dung gốc dưới đây. 
Mỗi biến thể phải:
- Giữ nguyên ý nghĩa chính
- Thay đổi cách diễn đạt để tránh trùng lặp/spam
- Phù hợp để đăng trên mạng xã hội
${tone ? `- Giọng điệu: ${tone}` : ''}
${brandVoiceGuide}

Nội dung gốc:
${content}

Trả về dạng JSON array: ["variant1", "variant2", ...]`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    try {
      const text = response.text || '';
      const jsonMatch = text.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const variants = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ variants });
      }
    } catch {
      // fallback
    }

    const variants = generateSimpleSpins(content, count);
    return NextResponse.json({ variants });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Simple algorithmic spinning fallback
function generateSimpleSpins(content: string, count: number): string[] {
  const variants: string[] = [];
  const sentences = content.split(/[.!?]+/).filter(s => s.trim());
  
  for (let i = 0; i < count; i++) {
    // Shuffle sentences and add emoji variations
    const emojis = ['🔥', '✨', '💡', '🎯', '⚡', '🚀', '💪', '📌', '👉', '🌟'];
    const shuffled = [...sentences].sort(() => Math.random() - 0.5);
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    variants.push(`${emoji} ${shuffled.join('. ').trim()}.`);
  }
  
  return variants;
}
