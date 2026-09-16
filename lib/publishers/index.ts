import type { Publisher } from './types';
import type { Platform } from '@prisma/client';
import { MockPublisher } from './mock';
import { FacebookReelsPublisher } from './facebook';
import { InstagramReelsPublisher } from './instagram';
import { YouTubeShortsPublisher } from './youtube';
import { TikTokPublisher } from './tiktok';
import { ZaloPublisher } from './zalo';

const useMock = process.env.USE_MOCK_PUBLISHERS === 'true';

/**
 * Returns the appropriate publisher for a given platform.
 * Uses mock publishers in dev when USE_MOCK_PUBLISHERS=true.
 */
export function getPublisher(platform: Platform): Publisher {
  if (useMock) {
    return new MockPublisher(platform);
  }

  switch (platform) {
    case 'FACEBOOK_REELS':
      return new FacebookReelsPublisher();
    case 'INSTAGRAM_REELS':
      return new InstagramReelsPublisher();
    case 'YOUTUBE_SHORTS':
      return new YouTubeShortsPublisher();
    case 'TIKTOK_VIDEO':
      return new TikTokPublisher();
    case 'ZALO_POST':
      return new ZaloPublisher();
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}
