import type { Publisher, PublishResult } from './types';
import type { Post, VideoAsset, SocialAccount, PostPlatform } from '@prisma/client';
import { getStorage } from '@/lib/storage';
import { getValidAccessToken } from './googleAuth';
import { prisma } from '@/lib/db';

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

      // Ensure title includes #Shorts for YouTube algorithm to recognize it (max 100 chars for YouTube Data API)
      let title = post.title?.trim() || 'Shorts';
      if (!title.toLowerCase().includes('#shorts')) {
        if (title.length + 8 <= 100) {
          title = `${title} #Shorts`;
        } else {
          title = `${title.slice(0, 91)} #Shorts`;
        }
      }

      // Ensure description includes #Shorts tag
      let description = [post.caption, post.hashtags].filter(Boolean).join('\n\n');
      if (!description.toLowerCase().includes('#shorts')) {
        description = description ? `${description}\n\n#Shorts #YouTubeShorts` : '#Shorts #YouTubeShorts';
      }

      // Warn if video duration exceeds YouTube Shorts limits (> 180s)
      if (videoAsset.duration && videoAsset.duration > 180) {
        console.warn(`[YouTubeShortsPublisher] Video duration is ${videoAsset.duration}s (> 180s). YouTube will automatically process this as a Standard Long-form Video.`);
      }

      // Auto-detect channel if not yet stored
      if (!socialAccount.youtubeChannelId) {
        try {
          const chRes = await fetch(
            'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const chData = await chRes.json();
          const channel = chData.items?.[0];
          if (channel) {
            await prisma.socialAccount.update({
              where: { id: socialAccount.id },
              data: {
                youtubeChannelId: channel.id,
                accountName: channel.snippet.title,
                status: 'CONNECTED',
              },
            });
          } else {
            return {
              success: false,
              errorMessage: 'Tài khoản Google này chưa tạo Kênh YouTube (YouTube Channel). Vui lòng vào https://youtube.com hoặc YouTube Studio để tạo kênh cho tài khoản này trước khi đăng bài.'
            };
          }
        } catch (e) {
          // ignore auto-detect failure and continue
        }
      }

      // Prepare tags from hashtags and guarantee Shorts tags
      const tags = post.hashtags
        ? post.hashtags.split(/[\s,]+/).map(t => t.replace(/^#/, '').trim()).filter(Boolean)
        : [];
      ['Shorts', 'Short', 'YouTubeShorts'].forEach(tag => {
        if (!tags.some(t => t.toLowerCase() === tag.toLowerCase())) {
          tags.push(tag);
        }
      });

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
              tags,
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
        if (errorText.includes('youtubeSignupRequired')) {
          return {
            success: false,
            errorMessage: 'Tài khoản Google này chưa tạo Kênh YouTube (YouTube Channel). Vui lòng vào https://youtube.com hoặc YouTube Studio để tạo kênh cho tài khoản này trước khi đăng bài.'
          };
        }
        return { success: false, errorMessage: `Failed to init upload: ${initRes.status} ${initRes.statusText}. Details: ${errorText}` };
      }

      // Step 2: Upload video binary
      const videoBuffer = await storage.getBuffer(videoAsset.storageUrl);
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
        // Step 3: Post the first comment if provided (retry up to 3 times as YouTube takes a moment to index new videos for comments)
        if (post.firstComment) {
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              if (attempt > 1) {
                await new Promise(r => setTimeout(r, 2000));
              }
              const commentRes = await fetch('https://www.googleapis.com/youtube/v3/commentThreads?part=snippet', {
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
              if (commentRes.ok) {
                console.log(`✅ YouTube first comment posted successfully on attempt ${attempt}`);
                break;
              } else {
                const commentErr = await commentRes.text();
                console.warn(`YouTube comment attempt ${attempt} warning (${commentRes.status}):`, commentErr);
              }
            } catch (commentError) {
              console.error(`Attempt ${attempt} to post YouTube first comment failed:`, commentError);
            }
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
