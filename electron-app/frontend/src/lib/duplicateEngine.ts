/**
 * Duplicate Content Detection Engine (F082)
 * Client-side N-Gram & Jaccard Similarity Algorithm with Workspace Posts Matching
 */

export interface DuplicateMatch {
  postId: string;
  title: string;
  captionSnippet: string;
  similarity: number; // percentage (0 - 100)
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
 * Tokenize and generate N-grams (unigrams + bigrams + trigrams)
 */
export function extractNgrams(text: string): Set<string> {
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

  // Bigrams
  for (let i = 0; i < words.length - 1; i++) {
    ngrams.add(`${words[i]}_${words[i + 1]}`);
  }

  // Trigrams
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
 * Client-side duplicate checker against workspace posts
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
  const combinedInputText = `${trimmedTitle} ${trimmedCaption}`.trim();

  if (combinedInputText.length < 5) {
    return {
      hasDuplicates: false,
      maxSimilarity: 0,
      riskLevel: 'SAFE',
      isMediaDuplicate: false,
      matches: [],
      checkedCount: candidatePosts.length,
    };
  }

  const inputNgrams = extractNgrams(combinedInputText);
  let maxSimilarity = 0;
  const matches: DuplicateMatch[] = [];

  for (const post of candidatePosts) {
    const postText = `${post.title || ''} ${post.caption || ''}`.trim();
    if (!postText) continue;

    const postNgrams = extractNgrams(postText);
    const textSim = calculateJaccardSimilarity(inputNgrams, postNgrams);
    const simPercentage = Math.round(textSim * 100);

    if (simPercentage > maxSimilarity) {
      maxSimilarity = simPercentage;
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
