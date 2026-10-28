import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

// OPTIONS /api/content/duplicate-check
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * Tokenize and generate N-grams (unigrams + bigrams + trigrams)
 */
function extractNgrams(text: string): Set<string> {
  const clean = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = clean.split(' ').filter(w => w.length > 1);
  const ngrams = new Set<string>();

  // Unigrams
  for (const word of words) {
    ngrams.add(word);
  }

  // Bigrams (weighted capture for context)
  for (let i = 0; i < words.length - 1; i++) {
    ngrams.add(`${words[i]}_${words[i + 1]}`);
  }

  // Trigrams (capture full phrases)
  for (let i = 0; i < words.length - 2; i++) {
    ngrams.add(`${words[i]}_${words[i + 1]}_${words[i + 2]}`);
  }

  return ngrams;
}

/**
 * Calculate Jaccard similarity between two ngram sets
 */
function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersectionSize = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersectionSize++;
    }
  }
  const unionSize = setA.size + setB.size - intersectionSize;
  return unionSize > 0 ? intersectionSize / unionSize : 0;
}

// POST /api/content/duplicate-check - Check for duplicate content (text & media)
export async function POST(req: NextRequest) {
  try {
    let session = await auth();
    let userId = session?.user?.id;
    let workspaceId = (session?.user as any)?.workspaceId;

    // Fallback cho development nếu không có session
    if (!userId && process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
      const mockUser = await prisma.user?.findFirst?.().catch(() => null);
      if (mockUser) {
        userId = mockUser.id;
        workspaceId = mockUser.workspaceId;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    if (!workspaceId && userId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { workspaceId: true },
      });
      workspaceId = dbUser?.workspaceId || null;
    }

    const body = await req.json();
    const {
      caption = '',
      title = '',
      videoAssetId,
      mediaUrls = [],
      currentPostId,
      threshold = 0.35, // 35% threshold to start catching similar content
    } = body;

    const trimmedCaption = (caption || '').trim();
    const trimmedTitle = (title || '').trim();
    const combinedInputText = `${trimmedTitle} ${trimmedCaption}`.trim();

    // Check if there is enough content or media to check
    if (combinedInputText.length < 5 && !videoAssetId && (!mediaUrls || mediaUrls.length === 0)) {
      return NextResponse.json({
        hasDuplicates: false,
        maxSimilarity: 0,
        riskLevel: 'SAFE',
        isMediaDuplicate: false,
        matches: [],
        checkedCount: 0,
      }, { headers: corsHeaders });
    }

    const where: any = {};
    if (workspaceId) {
      where.workspaceId = workspaceId;
    } else if (userId) {
      where.createdById = userId;
    }

    // Exclude current post if editing
    if (currentPostId) {
      where.id = { not: currentPostId };
    }

    // Fetch up to 300 recent posts in the workspace
    const candidatePosts = await prisma.post.findMany({
      where,
      select: {
        id: true,
        title: true,
        caption: true,
        videoAssetId: true,
        status: true,
        createdAt: true,
        publishedAt: true,
        media: {
          select: {
            mediaAsset: {
              select: { storageUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });

    const inputNgrams = extractNgrams(combinedInputText);
    const normalizedMediaUrls = new Set((mediaUrls || []).map((u: string) => u.trim()));

    let maxSimilarity = 0;
    let isMediaDuplicate = false;

    const matches: Array<{
      postId: string;
      title: string;
      captionSnippet: string;
      similarity: number;
      isMediaMatch: boolean;
      status: string;
      createdAt: Date;
      publishedAt: Date | null;
    }> = [];

    for (const post of candidatePosts) {
      let mediaMatched = false;

      // 1. Check video asset matching
      if (videoAssetId && post.videoAssetId && post.videoAssetId === videoAssetId) {
        mediaMatched = true;
        isMediaDuplicate = true;
      }

      // 2. Check image / media URLs matching
      const postMediaUrls = ((post as any).media || [])
        .map((m: any) => m.mediaAsset?.storageUrl?.trim())
        .filter(Boolean) as string[];

      if (!mediaMatched && normalizedMediaUrls.size > 0 && postMediaUrls.length > 0) {
        for (const pUrl of postMediaUrls) {
          if (normalizedMediaUrls.has(pUrl)) {
            mediaMatched = true;
            isMediaDuplicate = true;
            break;
          }
        }
      }

      // 3. Check text similarity
      const postText = `${post.title || ''} ${post.caption || ''}`.trim();
      let textSim = 0;
      if (inputNgrams.size > 0 && postText.length > 0) {
        const postNgrams = extractNgrams(postText);
        textSim = calculateJaccardSimilarity(inputNgrams, postNgrams);
      }

      const simPercentage = Math.round(textSim * 100);

      // If media matches, give a high similarity floor (e.g., 90%)
      const finalSimScore = mediaMatched ? Math.max(simPercentage, 90) : simPercentage;

      if (finalSimScore > maxSimilarity) {
        maxSimilarity = finalSimScore;
      }

      if (finalSimScore >= Math.round(threshold * 100) || mediaMatched) {
        matches.push({
          postId: post.id,
          title: post.title,
          captionSnippet: post.caption ? (post.caption.length > 120 ? post.caption.slice(0, 120) + '...' : post.caption) : '',
          similarity: finalSimScore,
          isMediaMatch: mediaMatched,
          status: post.status,
          createdAt: post.createdAt,
          publishedAt: post.publishedAt,
        });
      }
    }

    // Sort matches by similarity desc
    matches.sort((a, b) => b.similarity - a.similarity);
    const topMatches = matches.slice(0, 5);

    // Determine riskLevel
    let riskLevel: 'SAFE' | 'MODERATE' | 'HIGH' = 'SAFE';
    if (maxSimilarity >= 75 || isMediaDuplicate) {
      riskLevel = 'HIGH';
    } else if (maxSimilarity >= 40) {
      riskLevel = 'MODERATE';
    }

    return NextResponse.json({
      hasDuplicates: topMatches.length > 0,
      maxSimilarity,
      riskLevel,
      isMediaDuplicate,
      matches: topMatches,
      checkedCount: candidatePosts.length,
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('❌ [DUPLICATE-CHECK-API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
