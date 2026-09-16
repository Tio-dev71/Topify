import type { Publisher, PublishResult } from './types';
import type { Post, VideoAsset, SocialAccount, PostPlatform } from '@prisma/client';

export class TikTokPublisher implements Publisher {
  async publishReel(
    post: Post,
    videoAsset: VideoAsset,
    socialAccount: SocialAccount,
    platform: PostPlatform
  ): Promise<PublishResult> {
    try {
      // Mocking TikTok API call for Video (Reel equivalent)
      console.log(`[TikTokPublisher] Uploading video to TikTok for post ${post.id}`);
      console.log(`[TikTokPublisher] Using token: ${socialAccount.accessToken?.substring(0, 10)}...`);
      console.log(`[TikTokPublisher] Video URL: ${videoAsset.storageUrl}`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      return {
        success: true,
        externalPostId: `tiktok_mock_video_${Date.now()}`
      };
    } catch (error: any) {
      console.error('[TikTokPublisher] Video upload failed:', error);
      return {
        success: false,
        errorMessage: error.message || 'Unknown TikTok upload error'
      };
    }
  }

  async publishFeed(
    post: Post,
    videoAsset: VideoAsset | null,
    socialAccount: SocialAccount,
    platform: PostPlatform
  ): Promise<PublishResult> {
    try {
      // Mocking TikTok Photo Mode (Feed equivalent)
      console.log(`[TikTokPublisher] Uploading photo mode to TikTok for post ${post.id}`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        externalPostId: `tiktok_mock_photo_${Date.now()}`
      };
    } catch (error: any) {
      return {
        success: false,
        errorMessage: error.message || 'Unknown TikTok photo mode upload error'
      };
    }
  }

  async publishCarousel(
    post: Post,
    videoAssets: VideoAsset[],
    socialAccount: SocialAccount,
    platform: PostPlatform
  ): Promise<PublishResult> {
    try {
      console.log(`[TikTokPublisher] Uploading photo carousel to TikTok for post ${post.id}`);
      
      await new Promise(resolve => setTimeout(resolve, 1500));

      return {
        success: true,
        externalPostId: `tiktok_mock_carousel_${Date.now()}`
      };
    } catch (error: any) {
      return {
        success: false,
        errorMessage: error.message || 'Unknown TikTok carousel upload error'
      };
    }
  }
}
