import type { Publisher, PublishResult } from './types';
import type { Post, VideoAsset, SocialAccount, PostPlatform } from '@prisma/client';
import { getStorage } from '@/lib/storage';
import { getValidAccessToken } from './googleAuth';
import fs from 'fs';

/**
 * YouTube Shorts publisher using YouTube Data API v3.
 * 
 * Flow:
 * 1. Upload video via videos.insert (resumable upload)
 * 2. Set title with #Shorts tag
 * 
 * Required scopes: youtube.upload
 * Required SocialAccount fields: youtubeChannelId, accessToken, refreshToken
 */
export class YouTubeShortsPublisher implements Publisher {
  async publishReel(
    post: Post,
    videoAsset: VideoAsset,
    socialAccount: SocialAccount,
    _platform: PostPlatform
  ): Promise<PublishResult> {
    try {
      const token = await getValidAccessToken(socialAccount);
      const storage = getStorage();
      const videoPath = storage.getPath(videoAsset.storageUrl);

      // Ensure title includes #Shorts for YouTube to recognize it
      let title = post.title;
      if (!title.toLowerCase().includes('#shorts')) {
        title = `${title} #Shorts`;
      }

      const description = [post.caption, post.hashtags].filter(Boolean).join('\n\n');

      // Step 1: Initialize resumable upload
      const initRes = await fetch(
        'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            snippet: {
              title,
              description,
              categoryId: '22', // People & Blogs
            },
            status: {
              privacyStatus: 'public',
              selfDeclaredMadeForKids: false,
            },
          }),
        }
      );

      const uploadUrl = initRes.headers.get('location');
      if (!uploadUrl) {
        const errorText = await initRes.text();
        return { success: false, errorMessage: `Failed to init upload: ${initRes.status} ${initRes.statusText}. Details: ${errorText}` };
      }

      // Step 2: Upload video binary
      const videoBuffer = fs.readFileSync(videoPath);
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': videoAsset.mimeType,
          'Content-Length': videoBuffer.length.toString(),
        },
        body: videoBuffer,
      });

      const uploadData = await uploadRes.json();
      if (uploadData.id) {
        // Step 3: Post the first comment if provided
        if (post.firstComment) {
          try {
            await fetch('https://www.googleapis.com/youtube/v3/commentThreads?part=snippet', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                snippet: {
                  videoId: uploadData.id,
                  topLevelComment: {
                    snippet: {
                      textOriginal: post.firstComment,
                    },
                  },
                },
              }),
            });
          } catch (commentError) {
            console.error('Failed to post YouTube first comment:', commentError);
          }
        }
        return { success: true, externalPostId: uploadData.id };
      }

      return { success: false, errorMessage: `Upload failed: ${JSON.stringify(uploadData)}` };
    } catch (error: unknown) {
      return { success: false, errorMessage: `YouTube Shorts error: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  async publishFeed(
    _post: Post,
    _videoAsset: VideoAsset | null,
    _socialAccount: SocialAccount,
    _platform: PostPlatform
  ): Promise<PublishResult> {
    // YouTube Data API does not publicly support creating Community Posts for all users.
    // We will mock this or return an error indicating it's unsupported.
    return {
      success: false,
      errorMessage: 'Publishing Feed/Community Posts to YouTube is not supported by the public YouTube Data API.'
    };
  }

  async publishCarousel(
    _post: Post,
    _videoAssets: VideoAsset[],
    _socialAccount: SocialAccount,
    _platform: PostPlatform
  ): Promise<PublishResult> {
    return {
      success: false,
      errorMessage: 'Publishing Carousel posts to YouTube is not supported.'
    };
  }
}
