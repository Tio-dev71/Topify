import type { Publisher, PublishResult } from './types';
import type { Post, VideoAsset, SocialAccount, PostPlatform } from '@prisma/client';

/**
 * Mock publisher for development/testing.
 * Simulates a 3-second delay and returns success 90% of the time.
 */
export class MockPublisher implements Publisher {
  private platformName: string;

  constructor(platformName: string) {
    this.platformName = platformName;
  }

  async publishReel(
    post: Post,
    _videoAsset: VideoAsset,
    _socialAccount: SocialAccount,
    _platform: PostPlatform
  ): Promise<PublishResult> {
    console.log(`[MOCK] Publishing "${post.title}" to ${this.platformName}...`);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 90% success rate
    const isSuccess = Math.random() > 0.1;

    if (isSuccess) {
      const mockId = `mock_${this.platformName.toLowerCase()}_${Date.now()}`;
      console.log(`[MOCK] ✅ Published to ${this.platformName}: ${mockId}`);
      return {
        success: true,
        externalPostId: mockId,
      };
    } else {
      const errorMsg = `[MOCK] Simulated failure for ${this.platformName}: API rate limit exceeded`;
      console.log(`[MOCK] ❌ ${errorMsg}`);
      return {
        success: false,
        errorMessage: errorMsg,
      };
    }
  }

  async publishFeed(
    post: Post,
    _videoAsset: VideoAsset | null,
    _socialAccount: SocialAccount,
    _platform: PostPlatform
  ): Promise<PublishResult> {
    console.log(`[MOCK] Publishing Feed "${post.title}" to ${this.platformName}...`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const isSuccess = Math.random() > 0.1;

    if (isSuccess) {
      const mockId = `mock_feed_${this.platformName.toLowerCase()}_${Date.now()}`;
      console.log(`[MOCK] ✅ Published Feed to ${this.platformName}: ${mockId}`);
      return { success: true, externalPostId: mockId };
    } else {
      const errorMsg = `[MOCK] Simulated failure for Feed ${this.platformName}`;
      console.log(`[MOCK] ❌ ${errorMsg}`);
      return { success: false, errorMessage: errorMsg };
    }
  }

  async publishCarousel(
    post: Post,
    _videoAssets: VideoAsset[],
    _socialAccount: SocialAccount,
    _platform: PostPlatform
  ): Promise<PublishResult> {
    console.log(`[MOCK] Publishing Carousel "${post.title}" to ${this.platformName}...`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const isSuccess = Math.random() > 0.1;

    if (isSuccess) {
      const mockId = `mock_carousel_${this.platformName.toLowerCase()}_${Date.now()}`;
      console.log(`[MOCK] ✅ Published Carousel to ${this.platformName}: ${mockId}`);
      return { success: true, externalPostId: mockId };
    } else {
      const errorMsg = `[MOCK] Simulated failure for Carousel ${this.platformName}`;
      console.log(`[MOCK] ❌ ${errorMsg}`);
      return { success: false, errorMessage: errorMsg };
    }
  }
}
