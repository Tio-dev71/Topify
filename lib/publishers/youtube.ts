import type { Publisher, PublishResult } from './types';
import type { Post, VideoAsset, SocialAccount, PostPlatform } from '@prisma/client';
import { getStorage } from '@/lib/storage';
import { getValidAccessToken } from './googleAuth';
import { prisma } from '@/lib/db';
import { safeSlice, sanitizeUtf8 } from '@/lib/utils';

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
      // If video was already uploaded previously, do not upload duplicate video!
      if (_platform?.externalPostId) {
        console.log(`[YouTubeShortsPublisher] Video đã được tải lên trước đó (ID: ${_platform.externalPostId}). Bỏ qua upload để tránh duplicate.`);
        return { success: true, externalPostId: _platform.externalPostId };
      }

      if (_platform?.id) {
        const freshPl = await prisma.postPlatform.findUnique({ where: { id: _platform.id } });
        if (freshPl?.externalPostId) {
          console.log(`[YouTubeShortsPublisher] Video đã có externalPostId trong CSDL (${freshPl.externalPostId}). Bỏ qua upload để tránh duplicate.`);
          return { success: true, externalPostId: freshPl.externalPostId };
        }
      }

      const token = await getValidAccessToken(socialAccount);
      const storage = getStorage();

      // Detect if video is standard landscape (16:9) or exceeding shorts duration (> 180s)
      const vidAny = videoAsset as any;
      const isHorizontalVideo = Boolean(vidAny.width && vidAny.height && vidAny.width > vidAny.height);
      const isOverDuration = Boolean(videoAsset.duration && videoAsset.duration > 180);
      const isStandardVideo = isHorizontalVideo || isOverDuration;

      // Ensure title includes #Shorts only if vertical/square shorts video (max 100 chars for YouTube Data API)
      let title = sanitizeUtf8(post.title) || (isStandardVideo ? 'Video' : 'Shorts');
      if (!isStandardVideo && !title.toLowerCase().includes('#shorts')) {
        if (Array.from(title).length + 8 <= 100) {
          title = `${title} #Shorts`;
        } else {
          title = `${safeSlice(title, 91)} #Shorts`;
        }
      }

      // Ensure description includes #Shorts tag only for vertical/square shorts videos
      let description = sanitizeUtf8([post.caption, post.hashtags].filter(Boolean).join('\n\n'));
      if (!isStandardVideo && !description.toLowerCase().includes('#shorts')) {
        description = description ? `${description}\n\n#Shorts #YouTubeShorts` : '#Shorts #YouTubeShorts';
      }

      // Warn/log video format details
      if (videoAsset.duration && videoAsset.duration > 180) {
        console.warn(`[YouTubeShortsPublisher] Video duration is ${videoAsset.duration}s (> 180s). YouTube will automatically process this as a Standard Long-form Video.`);
      }
      if (isHorizontalVideo) {
        console.log(`[YouTubeShortsPublisher] Video is Landscape/16:9 (${vidAny.width}x${vidAny.height}). Uploading as standard landscape YouTube Video.`);
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

      // Prepare tags from hashtags and guarantee Shorts tags if vertical
      const tags = post.hashtags
        ? post.hashtags.split(/[\s,]+/).map(t => t.replace(/^#/, '').trim()).filter(Boolean)
        : [];
      if (!isStandardVideo) {
        ['Shorts', 'Short', 'YouTubeShorts'].forEach(tag => {
          if (!tags.some(t => t.toLowerCase() === tag.toLowerCase())) {
            tags.push(tag);
          }
        });
      }

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
        if (errorText.includes('uploadLimitExceeded') || errorText.includes('exceeded the number of videos')) {
          return {
            success: false,
            errorMessage: 'Kênh YouTube đã đạt giới hạn số lượng video được phép tải lên trong ngày của YouTube (Daily Upload Limit). Vui lòng thử lại sau 24 giờ hoặc vào YouTube Studio xác minh Kênh (Tính năng nâng cao) để tăng hạn mức đăng video.'
          };
        }
        if (errorText.includes('quotaExceeded') || errorText.includes('quota')) {
          return {
            success: false,
            errorMessage: 'Hạn mức YouTube API trong ngày đã hết (Quota Exceeded). Hạn mức sẽ tự động được đặt lại vào 14:00 giờ Việt Nam (00:00 PST).'
          };
        }
        if (errorText.includes('videoTitleTooLong')) {
          return {
            success: false,
            errorMessage: 'Tiêu đề video vượt quá giới hạn tối đa 100 ký tự của YouTube. Vui lòng rút ngắn tiêu đề bài viết.'
          };
        }
        return { success: false, errorMessage: `Lỗi khởi tạo tải lên YouTube (${initRes.status}): ${errorText}` };
      }

      // Step 2: Upload video binary
      const videoBuffer = await storage.getBuffer(videoAsset.storageUrl);
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': videoAsset.mimeType,
          'Content-Length': videoBuffer.length.toString(),
        },
        body: new Uint8Array(videoBuffer),
      });

      const uploadData = await uploadRes.json();
      if (uploadData.id) {
        // Immediately persist externalPostId to prevent duplicate uploads during comments or timeouts
        if (_platform?.id) {
          await prisma.postPlatform.update({
            where: { id: _platform.id },
            data: { externalPostId: uploadData.id },
          }).catch((err: any) => console.warn('[YouTube] Warning persisting initial externalPostId:', err?.message));
        }

        // Step 3: Post the first comment if provided (retry with backoff as YouTube takes a moment to index new videos for comments)
        if (post.firstComment && post.firstComment.trim()) {
          console.log(`[YouTube] Preparing to post first comment on video ${uploadData.id}: "${post.firstComment.trim()}"`);
          // Wait 3s initially for YouTube to create and index the video resource in commentThreads
          await new Promise(r => setTimeout(r, 3000));

          let commentPosted = false;
          for (let attempt = 1; attempt <= 4; attempt++) {
            try {
              if (attempt > 1) {
                await new Promise(r => setTimeout(r, 3000 + attempt * 1000));
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
                        textOriginal: post.firstComment.trim(),
                      },
                    },
                  },
                }),
              });
              if (commentRes.ok) {
                const commentData = await commentRes.json();
                console.log(`✅ YouTube first comment posted successfully on attempt ${attempt} (commentId: ${commentData?.id})`);
                commentPosted = true;
                if (post.id) {
                  await prisma.publishLog.create({
                    data: {
                      postId: post.id,
                      platform: 'YOUTUBE_SHORTS',
                      level: 'INFO',
                      message: `Đã đăng bình luận đầu tiên lên YouTube thành công: "${post.firstComment.trim().slice(0, 50)}"`,
                      metadata: { commentId: commentData?.id },
                    },
                  }).catch(() => {});
                }
                break;
              } else {
                const commentErr = await commentRes.text();
                console.warn(`[YouTube] Comment attempt ${attempt} notice (${commentRes.status}):`, commentErr);
                if (commentErr.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT')) {
                  console.warn('[YouTube] Token lacks youtube.force-ssl scope. User needs to reconnect YouTube account to grant comment permission.');
                  if (post.id) {
                    await prisma.publishLog.create({
                      data: {
                        postId: post.id,
                        platform: 'YOUTUBE_SHORTS',
                        level: 'INFO',
                        message: '[Cảnh báo] Tài khoản YouTube cần được kết nối lại trong Cài đặt để cấp quyền bình luận (youtube.force-ssl).',
                      },
                    }).catch(() => {});
                  }
                  break;
                }
              }
            } catch (commentError) {
              console.error(`Attempt ${attempt} to post YouTube first comment failed:`, commentError);
            }
          }
          if (!commentPosted && post.id) {
            console.warn(`[YouTube] Could not post first comment on video ${uploadData.id}`);
            await prisma.publishLog.create({
              data: {
                postId: post.id,
                platform: 'YOUTUBE_SHORTS',
                level: 'INFO',
                message: `[Lưu ý] Chưa đăng được bình luận đầu tiên lên YouTube: Video đang được YouTube xử lý. Bạn có thể bấm "Gửi bình luận" trong màn hình Chi tiết bài viết.`,
              },
            }).catch(() => {});
          }
        }
        return { success: true, externalPostId: uploadData.id };
      }

      const rawUploadErr = JSON.stringify(uploadData);
      if (rawUploadErr.includes('uploadLimitExceeded') || rawUploadErr.includes('exceeded the number of videos')) {
        return {
          success: false,
          errorMessage: 'Kênh YouTube đã đạt giới hạn số lượng video được phép tải lên trong ngày của YouTube (Daily Upload Limit). Vui lòng thử lại sau 24 giờ hoặc vào YouTube Studio xác minh Kênh (Tính năng nâng cao) để tăng hạn mức đăng video.'
        };
      }
      return { success: false, errorMessage: `Tải video lên YouTube không thành công: ${rawUploadErr}` };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.includes('uploadLimitExceeded') || errMsg.includes('exceeded the number of videos')) {
        return {
          success: false,
          errorMessage: 'Kênh YouTube đã đạt giới hạn số lượng video được phép tải lên trong ngày của YouTube (Daily Upload Limit). Vui lòng thử lại sau 24 giờ hoặc vào YouTube Studio xác minh Kênh (Tính năng nâng cao) để tăng hạn mức đăng video.'
        };
      }
      if (errMsg.includes('Token is expired') || errMsg.includes('invalid_grant')) {
        return {
          success: false,
          errorMessage: 'Phiên đăng nhập YouTube/Google đã hết hạn hoặc bị thu hồi quyền. Vui lòng kết nối lại tài khoản YouTube tại mục Cài đặt -> Mạng xã hội.'
        };
      }
      return { success: false, errorMessage: `Lỗi YouTube Shorts: ${errMsg}` };
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
