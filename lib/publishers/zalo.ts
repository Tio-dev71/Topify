import type { Publisher, PublishResult } from './types';
import type { Post, VideoAsset, SocialAccount, PostPlatform } from '@prisma/client';

export class ZaloPublisher implements Publisher {
  async publishReel(
    post: Post,
    videoAsset: VideoAsset,
    socialAccount: SocialAccount,
    _platform: PostPlatform
  ): Promise<PublishResult> {
    try {
      console.log(`[ZaloPublisher] Uploading video to Zalo OA for post ${post.id}`);
      console.log(`[ZaloPublisher] Using token: ${socialAccount.accessToken?.substring(0, 10)}...`);
      console.log(`[ZaloPublisher] Video URL: ${videoAsset.storageUrl}`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      return {
        success: true,
        externalPostId: `zalo_mock_video_${Date.now()}`
      };
    } catch (error: unknown) {
      console.error('[ZaloPublisher] Video upload failed:', error);
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown Zalo upload error'
      };
    }
  }

  async publishFeed(
    post: Post,
    _videoAsset: VideoAsset | null,
    _socialAccount: SocialAccount,
    _platform: PostPlatform
  ): Promise<PublishResult> {
    try {
      console.log(`[ZaloPublisher] Publishing article/feed to Zalo OA for post ${post.id}`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        externalPostId: `zalo_mock_article_${Date.now()}`
      };
    } catch (error: unknown) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown Zalo article upload error'
      };
    }
  }

  async publishCarousel(
    post: Post,
    _videoAssets: VideoAsset[],
    _socialAccount: SocialAccount,
    _platform: PostPlatform
  ): Promise<PublishResult> {
    try {
      // Zalo OA doesn't have a direct equivalent to carousel posts in the same way FB/IG do, 
      // but they do support multi-photo articles.
      console.log(`[ZaloPublisher] Publishing multi-image article to Zalo OA for post ${post.id}`);
      
      await new Promise(resolve => setTimeout(resolve, 1500));

      return {
        success: true,
        externalPostId: `zalo_mock_carousel_${Date.now()}`
      };
    } catch (error: unknown) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown Zalo carousel upload error'
      };
    }
  }
}
