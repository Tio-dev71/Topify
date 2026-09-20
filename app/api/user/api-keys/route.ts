import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { encryptApiKey, makeKeyHint } from '@/lib/crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.AUTH_SECRET || 'topify-secret';

// Helper to authenticate request (supports NextAuth & JWT token fallback for Desktop App)
async function authenticate(req: NextRequest) {
  // 1. Try NextAuth (Web)
  const session = await auth();
  if (session?.user?.id) {
    return session.user;
  }

  // 2. Try JWT token (Desktop)
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded.sub || decoded.id) {
        return {
          id: decoded.sub || decoded.id,
          role: decoded.role,
          workspaceId: decoded.workspaceId,
        };
      }
    } catch (e) {
      // Invalid token
    }
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKeys = await prisma.userApiKey.findMany({
      where: user.workspaceId ? { workspaceId: user.workspaceId } : { userId: user.id },
      select: {
        id: true,
        keyName: true,
        hint: true,
        updatedAt: true,
      }
    });

    return NextResponse.json(apiKeys);
  } catch (error) {
    console.error('Failed to fetch api keys:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { keyName, keyValue } = await req.json();

    if (!keyName || !keyValue) {
      return NextResponse.json({ error: 'Key Name and Value are required' }, { status: 400 });
    }

    // Encrypt the API key before saving
    const { encrypted, iv, authTag } = encryptApiKey(keyValue);
    const hint = makeKeyHint(keyValue);

    let apiKey;

    if (user.workspaceId) {
      // Upsert by workspaceId and keyName
      const existingKey = await prisma.userApiKey.findFirst({
        where: {
          workspaceId: user.workspaceId,
          keyName
        }
      });

      if (existingKey) {
        apiKey = await prisma.userApiKey.update({
          where: { id: existingKey.id },
          update: { encrypted, iv, authTag, hint }
        });
      } else {
        apiKey = await prisma.userApiKey.create({
          data: {
            userId: user.id,
            workspaceId: user.workspaceId,
            keyName,
            encrypted,
            iv,
            authTag,
            hint
          }
        });
      }
    } else {
      apiKey = await prisma.userApiKey.upsert({
        where: {
          userId_keyName: {
            userId: user.id,
            keyName,
          }
        },
        update: {
          encrypted,
          iv,
          authTag,
          hint
        },
        create: {
          userId: user.id,
          keyName,
          encrypted,
          iv,
          authTag,
          hint
        }
      });
    }

    return NextResponse.json({ 
      success: true,
      data: {
        id: apiKey.id,
        keyName: apiKey.keyName,
        hint: apiKey.hint
      }
    });
  } catch (error) {
    console.error('Failed to save api key:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const keyName = searchParams.get('keyName');

    if (!keyName) {
      return NextResponse.json({ error: 'Key Name is required' }, { status: 400 });
    }

    if (user.workspaceId) {
      const existingKey = await prisma.userApiKey.findFirst({
        where: {
          workspaceId: user.workspaceId,
          keyName
        }
      });
      if (existingKey) {
        await prisma.userApiKey.delete({
          where: { id: existingKey.id }
        });
      }
    } else {
      await prisma.userApiKey.delete({
        where: {
          userId_keyName: {
            userId: user.id,
            keyName,
          }
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete api key:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
