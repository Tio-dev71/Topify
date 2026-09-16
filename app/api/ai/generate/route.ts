import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { decryptApiKey } from '@/lib/crypto';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider, prompt } = await req.json();

    if (!provider || !prompt) {
      return NextResponse.json(
        { error: 'Provider and prompt are required' },
        { status: 400 }
      );
    }

    // Get user's API key
    const apiKeyRecord = await prisma.userApiKey.findUnique({
      where: {
        userId_keyName: {
          userId: session.user.id,
          keyName: provider.toUpperCase(),
        },
      },
    });

    if (!apiKeyRecord) {
      return NextResponse.json(
        { error: `No API key found for provider ${provider}. Please add it in settings.` },
        { status: 400 }
      );
    }

    const apiKey = decryptApiKey({
      encrypted: apiKeyRecord.encrypted,
      iv: apiKeyRecord.iv,
      authTag: apiKeyRecord.authTag,
    });

    let generatedText = '';

    if (provider.toUpperCase() === 'GEMINI') {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      generatedText = response.text || '';
    } else if (provider.toUpperCase() === 'OPENAI') {
      const openai = new OpenAI({ apiKey });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      });
      generatedText = response.choices[0]?.message?.content || '';
    } else {
      return NextResponse.json(
        { error: `Unsupported provider: ${provider}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, text: generatedText });
  } catch (error: any) {
    console.error('AI generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
