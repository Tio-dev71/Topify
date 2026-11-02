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
 * Clean & normalize text for duplicate detection (strip hashtags like #Shorts, punctuation, excess whitespace)
 */
function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/#[\p{L}\p{N}_-]+/gu, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokenize and generate N-grams (unigrams + bigrams + trigrams)
 */
function extractNgrams(text: string): Set<string> {
  const clean = normalizeText(text);
  const words = clean.split(' ').filter(Boolean);
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

/**
 * Compute text similarity between two texts (title vs title, or caption vs caption)
 */
function computeTextSimilarity(textA: string, textB: string): number {
  const normA = normalizeText(textA);
  const normB = normalizeText(textB);
  if (!normA || !normB) return 0;

  // Exact normalized match
  if (normA === normB) return 1.0;

  // Substring match: if one contains the other and length ratio >= 0.5
  if (normA.includes(normB) || normB.includes(normA)) {
    const minLen = Math.min(normA.length, normB.length);
    const maxLen = Math.max(normA.length, normB.length);
    const ratio = minLen / maxLen;
    if (ratio >= 0.5) {
      return Math.max(0.85, ratio);
    }
  }

  // N-gram Jaccard
  const ngramsA = extractNgrams(normA);
  const ngramsB = extractNgrams(normB);
  const jaccard = calculateJaccardSimilarity(ngramsA, ngramsB);

  // Word containment overlap
  const wordsA = new Set(normA.split(' ').filter(Boolean));
  const wordsB = new Set(normB.split(' ').filter(Boolean));
  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }
  const containment = Math.max(
    wordsA.size > 0 ? overlap / wordsA.size : 0,
    wordsB.size > 0 ? overlap / wordsB.size : 0
  );

  return Math.max(jaccard, containment >= 0.75 ? containment * 0.95 : 0);
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

    // Check if there is enough content or media to check
    const hasInputTitle = Boolean(trimmedTitle && trimmedTitle.length >= 2);
    const hasInputCaption = Boolean(trimmedCaption && trimmedCaption.length >= 3);

    if (!hasInputTitle && !hasInputCaption && !videoAssetId && (!mediaUrls || mediaUrls.length === 0)) {
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

    const normalizedMediaUrls = new Set((mediaUrls || []).map((u: string) => u.trim()));

    let maxSimilarity = 0;
    let isMediaDuplicate = false;

    const matches: Array<{
      postId: string;
      title: string;
      captionSnippet: string;
      similarity: number;
      matchedReason?: string;
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

      // 3. Check text similarity with OR condition (Trùng Tiêu đề HOẶC Trùng Caption)
      let titleSim = 0;
      let captionSim = 0;
      let crossSim = 0;
      let combinedSim = 0;

      // (a) Title vs Title
      if (hasInputTitle && post.title) {
        titleSim = computeTextSimilarity(trimmedTitle, post.title);
      }

      // (b) Caption vs Caption
      if (hasInputCaption && post.caption) {
        captionSim = computeTextSimilarity(trimmedCaption, post.caption);
      }

      // (c) Cross-check: If user entered Title only, does it match post.caption?
      if (hasInputTitle && post.caption && titleSim < 0.3) {
        const sim = computeTextSimilarity(trimmedTitle, post.caption);
        if (sim >= threshold) {
          crossSim = Math.max(crossSim, sim);
        }
      }
      // If user entered Caption only, does it match post.title?
      if (hasInputCaption && post.title && captionSim < 0.3) {
        const sim = computeTextSimilarity(trimmedCaption, post.title);
        if (sim >= threshold) {
          crossSim = Math.max(crossSim, sim);
        }
      }

      // (d) Combined similarity (when both title & caption provided)
      if (hasInputTitle && hasInputCaption && (post.title || post.caption)) {
        const inputFull = `${trimmedTitle} ${trimmedCaption}`.trim();
        const postFull = `${post.title || ''} ${post.caption || ''}`.trim();
        combinedSim = computeTextSimilarity(inputFull, postFull);
      }

      // OR logic: Maximum similarity across all dimensions
      const textSim = Math.max(titleSim, captionSim, crossSim, combinedSim);
      const simPercentage = Math.round(textSim * 100);

      // If media matches, give a high similarity floor (e.g., 90%)
      const finalSimScore = mediaMatched ? Math.max(simPercentage, 90) : simPercentage;

      if (finalSimScore > maxSimilarity) {
        maxSimilarity = finalSimScore;
      }

      // Determine human-readable reason
      let matchedReason = '';
      if (mediaMatched) {
        matchedReason = 'Trùng tệp video/media';
      } else if (titleSim >= threshold && captionSim >= threshold) {
        matchedReason = 'Trùng cả tiêu đề và nội dung caption';
      } else if (titleSim >= threshold) {
        matchedReason = 'Trùng tiêu đề bài viết';
      } else if (captionSim >= threshold) {
        matchedReason = 'Trùng nội dung caption';
      } else if (crossSim >= threshold || combinedSim >= threshold) {
        matchedReason = 'Trùng nội dung bài viết';
      }

      if (finalSimScore >= Math.round(threshold * 100) || mediaMatched) {
        matches.push({
          postId: post.id,
          title: post.title || 'Bài viết trong Workspace',
          captionSnippet: post.caption ? (post.caption.length > 120 ? post.caption.slice(0, 120) + '...' : post.caption) : '',
          similarity: finalSimScore,
          matchedReason,
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
