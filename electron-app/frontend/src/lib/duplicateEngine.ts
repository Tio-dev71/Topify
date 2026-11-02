/**
 * Duplicate Content Detection Engine (F082)
 * Client-side N-Gram & Jaccard Similarity Algorithm with Workspace Posts Matching
 * Supports independent Title and Caption comparison (OR condition)
 */

export interface DuplicateMatch {
  postId: string;
  title: string;
  captionSnippet: string;
  similarity: number; // percentage (0 - 100)
  matchedReason?: string;
  isMediaMatch: boolean;
  status: string;
  createdAt: string | Date;
  publishedAt: string | Date | null;
}

export interface DuplicateCheckResult {
  hasDuplicates: boolean;
  maxSimilarity: number; // percentage (0 - 100)
  riskLevel: 'SAFE' | 'MODERATE' | 'HIGH';
  isMediaDuplicate: boolean;
  matches: DuplicateMatch[];
  checkedCount: number;
}

/**
 * Clean & normalize text for duplicate detection (strip hashtags like #Shorts, punctuation, excess whitespace)
 */
export function normalizeText(text: string): string {
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
export function extractNgrams(text: string): Set<string> {
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
 * Calculate Jaccard similarity between two ngram sets (0.0 - 1.0)
 */
export function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
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
export function computeTextSimilarity(textA: string, textB: string): number {
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

/**
 * Client-side duplicate checker against workspace posts
 * Strictly follows OR condition: Duplicate Title OR Duplicate Caption triggers match!
 */
export function checkDuplicateClient(
  title: string,
  caption: string,
  candidatePosts: Array<{
    id: string;
    title?: string;
    caption?: string;
    status?: string;
    createdAt?: string | Date;
    publishedAt?: string | Date | null;
  }> = [],
  threshold = 0.35
): DuplicateCheckResult {
  const trimmedCaption = (caption || '').trim();
  const trimmedTitle = (title || '').trim();

  const hasInputTitle = Boolean(trimmedTitle && trimmedTitle.length >= 2);
  const hasInputCaption = Boolean(trimmedCaption && trimmedCaption.length >= 3);

  if (!hasInputTitle && !hasInputCaption) {
    return {
      hasDuplicates: false,
      maxSimilarity: 0,
      riskLevel: 'SAFE',
      isMediaDuplicate: false,
      matches: [],
      checkedCount: candidatePosts.length,
    };
  }

  let maxSimilarity = 0;
  const matches: DuplicateMatch[] = [];

  for (const post of candidatePosts) {
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

    // (c) Cross-check
    if (hasInputTitle && post.caption && titleSim < 0.3) {
      const sim = computeTextSimilarity(trimmedTitle, post.caption);
      if (sim >= threshold) {
        crossSim = Math.max(crossSim, sim);
      }
    }
    if (hasInputCaption && post.title && captionSim < 0.3) {
      const sim = computeTextSimilarity(trimmedCaption, post.title);
      if (sim >= threshold) {
        crossSim = Math.max(crossSim, sim);
      }
    }

    // (d) Combined similarity if both title & caption provided
    if (hasInputTitle && hasInputCaption && (post.title || post.caption)) {
      const inputFull = `${trimmedTitle} ${trimmedCaption}`.trim();
      const postFull = `${post.title || ''} ${post.caption || ''}`.trim();
      combinedSim = computeTextSimilarity(inputFull, postFull);
    }

    // Maximum similarity across any dimension (OR condition)
    const textSim = Math.max(titleSim, captionSim, crossSim, combinedSim);
    const simPercentage = Math.round(textSim * 100);

    if (simPercentage > maxSimilarity) {
      maxSimilarity = simPercentage;
    }

    // Human-readable match reason
    let matchedReason = '';
    if (titleSim >= threshold && captionSim >= threshold) {
      matchedReason = 'Trùng cả tiêu đề và nội dung caption';
    } else if (titleSim >= threshold) {
      matchedReason = 'Trùng tiêu đề bài viết';
    } else if (captionSim >= threshold) {
      matchedReason = 'Trùng nội dung caption';
    } else if (crossSim >= threshold || combinedSim >= threshold) {
      matchedReason = 'Trùng nội dung bài viết';
    }

    if (simPercentage >= Math.round(threshold * 100)) {
      matches.push({
        postId: post.id,
        title: post.title || 'Bài viết trong Workspace',
        captionSnippet: post.caption
          ? post.caption.length > 120
            ? post.caption.slice(0, 120) + '...'
            : post.caption
          : '',
        similarity: simPercentage,
        matchedReason,
        isMediaMatch: false,
        status: post.status || 'PUBLISHED',
        createdAt: post.createdAt || new Date(),
        publishedAt: post.publishedAt || null,
      });
    }
  }

  matches.sort((a, b) => b.similarity - a.similarity);
  const topMatches = matches.slice(0, 5);

  let riskLevel: 'SAFE' | 'MODERATE' | 'HIGH' = 'SAFE';
  if (maxSimilarity >= 75) {
    riskLevel = 'HIGH';
  } else if (maxSimilarity >= 40) {
    riskLevel = 'MODERATE';
  }

  return {
    hasDuplicates: topMatches.length > 0,
    maxSimilarity,
    riskLevel,
    isMediaDuplicate: false,
    matches: topMatches,
    checkedCount: candidatePosts.length,
  };
}
