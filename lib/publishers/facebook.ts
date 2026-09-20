import type { Publisher, PublishResult } from './types';
import type { Post, VideoAsset, SocialAccount, PostPlatform } from '@prisma/client';
import { getStorage } from '@/lib/storage';
import { decryptToken } from '@/lib/crypto';
import fs from 'fs';

/**
 * Facebook Reels publisher using Meta Graph API.
 * 
 * Flow:
 * 1. Upload video to Facebook Page via resumable upload
 * 2. Create reel with video
 * 
 * Required permissions: pages_manage_posts, pages_read_engagement
 * Required SocialAccount fields: pageId, accessToken
 */
export class FacebookReelsPublisher implements Publisher {
  async publishReel(
    post: Post,
    videoAsset: VideoAsset,
    socialAccount: SocialAccount,
    _platform: PostPlatform
  ): Promise<PublishResult> {
    try {
      if (!socialAccount.pageId) {
        return { success: false, errorMessage: 'No Facebook Page ID configured' };
      }

      const accessToken = decryptToken(socialAccount.accessToken);
      const storage = getStorage();
      const videoPath = storage.getPath(videoAsset.storageUrl);

      // Step 1: Initialize upload session
      const initRes = await fetch(
        `https://graph.facebook.com/v19.0/${socialAccount.pageId}/video_reels`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            upload_phase: 'start',
            access_token: accessToken,
          }),
        }
      );

      const initData = await initRes.json();
      if (!initData.video_id) {
        return { success: false, errorMessage: `Failed to init upload: ${JSON.stringify(initData)}` };
      }

      const videoId = initData.video_id;

      // Step 2: Upload video binary
      const videoBuffer = fs.readFileSync(videoPath);
      const uploadRes = await fetch(
        `https://rupload.facebook.com/video-upload/v19.0/${videoId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `OAuth ${accessToken}`,
            offset: '0',
            file_size: videoBuffer.length.toString(),
            'Content-Type': 'application/octet-stream',
          },
          body: videoBuffer,
        }
      );

      const uploadData = await uploadRes.json();
      if (!uploadData.success) {
        return { success: false, errorMessage: `Upload failed: ${JSON.stringify(uploadData)}` };
      }

      // Step 3: Publish reel
      const description = [post.caption, post.hashtags].filter(Boolean).join('\n\n');
      const publishRes = await fetch(
        `https://graph.facebook.com/v19.0/${socialAccount.pageId}/video_reels`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            upload_phase: 'finish',
            video_id: videoId,
            title: post.title,
            description,
            access_token: accessToken,
          }),
        }
      );

      const publishData = await publishRes.json();
      if (publishData.success) {
        // Step 4: Post first comment if provided
        if (post.firstComment) {
          try {
            await fetch(`https://graph.facebook.com/v19.0/${videoId}/comments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: post.firstComment,
                access_token: accessToken,
              }),
            });
          } catch (commentError) {
            console.error('Failed to post Facebook first comment:', commentError);
          }
        }
        return { success: true, externalPostId: videoId };
      }

      return { success: false, errorMessage: `Publish failed: ${JSON.stringify(publishData)}` };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return { success: false, errorMessage: `Facebook Reels error: ${msg}` };
    }
  }

  async publishFeed(
    post: Post,
    videoAsset: VideoAsset | null,
    socialAccount: SocialAccount,
    _platform: PostPlatform
  ): Promise<PublishResult> {
    try {
      if (!socialAccount.pageId) {
        return { success: false, errorMessage: 'No Facebook Page ID configured' };
      }

      const accessToken = decryptToken(socialAccount.accessToken);
      const description = [post.caption, post.hashtags].filter(Boolean).join('\n\n');

      if (videoAsset) {
        // Publish as photo (assuming image asset is passed in videoAsset for simplicity right now)
        // Note: For real feed posts, we should probably have an ImageAsset type, but using VideoAsset for now
        const initRes = await fetch(
          `https://graph.facebook.com/v19.0/${socialAccount.pageId}/photos`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: videoAsset.storageUrl,
              message: description,
              access_token: accessToken,
            }),
          }
        );
        const data = await initRes.json();
        if (data.id) {
          return { success: true, externalPostId: data.id };
        }
        return { success: false, errorMessage: `Feed photo publish failed: ${JSON.stringify(data)}` };
      } else {
        // Text-only feed post
        const initRes = await fetch(
          `https://graph.facebook.com/v19.0/${socialAccount.pageId}/feed`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: description,
              access_token: accessToken,
            }),
          }
        );
        const data = await initRes.json();
        if (data.id) {
          return { success: true, externalPostId: data.id };
        }
        return { success: false, errorMessage: `Feed text publish failed: ${JSON.stringify(data)}` };
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return { success: false, errorMessage: `Facebook Feed error: ${msg}` };
    }
  }

  async publishCarousel(
    post: Post,
    _videoAssets: VideoAsset[],
    _socialAccount: SocialAccount,
    _platform: PostPlatform
  ): Promise<PublishResult> {
    try {
      // Mocking Carousel for now as it requires creating unpublished photos first then attaching to feed
      console.log(`[FacebookPublisher] Mocking carousel publish for post ${post.id}`);
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true, externalPostId: `fb_mock_carousel_${Date.now()}` };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return { success: false, errorMessage: `Facebook Carousel error: ${msg}` };
    }
  }
}
