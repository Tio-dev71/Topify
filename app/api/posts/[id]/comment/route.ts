import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { getValidAccessToken } from '@/lib/publishers/googleAuth';
import { decryptToken } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// GET /api/posts/[id]/comment — Fetch live comments from social platforms (YouTube, Facebook, etc.)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { id } = await params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        platforms: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404, headers: corsHeaders });
    }

    const firstComment = (post.firstComment || '').trim();
    const liveComments: Array<{
      id: string;
      platform: string;
      author: string;
      authorAvatar?: string;
      text: string;
      likeCount: number;
      publishedAt: string;
      isFirstComment: boolean;
    }> = [];

    for (const pl of post.platforms) {
      if (pl.platform === 'YOUTUBE_SHORTS' && pl.externalPostId) {
        try {
          const socialAccount = await prisma.socialAccount.findFirst({
            where: {
              provider: 'YOUTUBE',
              status: 'CONNECTED',
              ...(post.workspaceId ? { workspaceId: post.workspaceId } : { userId: post.createdById }),
            },
          });

          if (socialAccount) {
            const token = await getValidAccessToken(socialAccount);
            const res = await fetch(
              `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${encodeURIComponent(pl.externalPostId)}&maxResults=50`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data.items)) {
                for (const item of data.items) {
                  const snippet = item.snippet?.topLevelComment?.snippet;
                  if (snippet) {
                    const text = snippet.textOriginal || snippet.textDisplay || '';
                    liveComments.push({
                      id: item.id,
                      platform: 'YOUTUBE_SHORTS',
                      author: snippet.authorDisplayName || 'Người dùng YouTube',
                      authorAvatar: snippet.authorProfileImageUrl,
                      text,
                      likeCount: snippet.likeCount || 0,
                      publishedAt: snippet.publishedAt,
                      isFirstComment: firstComment ? text.trim().toLowerCase() === firstComment.toLowerCase() : false,
                    });
                  }
                }
              }
            } else {
              console.warn(`[CommentsAPI] YouTube comment fetch notice (${res.status}):`, await res.text());
            }
          }
        } catch (ytErr: any) {
          console.warn('[CommentsAPI] Error fetching live YouTube comments:', ytErr.message);
        }
      }
    }

    return NextResponse.json({
      success: true,
      firstComment: post.firstComment || null,
      comments: liveComments,
      totalCount: liveComments.length,
      hasFirstCommentPosted: firstComment ? liveComments.some(c => c.isFirstComment) : false,
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Fetch live comments error:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// POST /api/posts/[id]/comment — Send/retry the first comment on published platforms
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { id } = await params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        platforms: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404, headers: corsHeaders });
    }

    const firstComment = (post.firstComment || '').trim();
    if (!firstComment) {
      return NextResponse.json(
        { error: 'Bài viết này không có nội dung Bình luận đầu tiên' },
        { status: 400, headers: corsHeaders }
      );
    }

    const publishedPlatforms = post.platforms.filter(
      (p) => p.status === 'PUBLISHED' && p.externalPostId
    );

    if (publishedPlatforms.length === 0) {
      return NextResponse.json(
        { error: 'Bài viết chưa được xuất bản thành công lên nền tảng nào' },
        { status: 400, headers: corsHeaders }
      );
    }

    const results: Array<{ platform: string; success: boolean; message: string }> = [];

    for (const pl of publishedPlatforms) {
      if (pl.platform === 'YOUTUBE_SHORTS') {
        try {
          // Find connected YouTube account for user/workspace
          const socialAccount = await prisma.socialAccount.findFirst({
            where: {
              provider: 'YOUTUBE',
              status: 'CONNECTED',
              ...(post.workspaceId ? { workspaceId: post.workspaceId } : { userId: post.createdById }),
            },
          });

          if (!socialAccount) {
            results.push({
              platform: pl.platform,
              success: false,
              message: 'Không tìm thấy tài khoản YouTube đã kết nối để đăng bình luận.',
            });
            continue;
          }

          const token = await getValidAccessToken(socialAccount);

          const commentRes = await fetch(
            'https://www.googleapis.com/youtube/v3/commentThreads?part=snippet',
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                snippet: {
                  videoId: pl.externalPostId,
                  topLevelComment: {
                    snippet: {
                      textOriginal: firstComment,
                    },
                  },
                },
              }),
            }
          );

          if (commentRes.ok) {
            results.push({
              platform: pl.platform,
              success: true,
              message: 'Đã đăng bình luận đầu tiên lên YouTube thành công!',
            });
          } else {
            const errText = await commentRes.text();
            if (errText.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT')) {
              results.push({
                platform: pl.platform,
                success: false,
                message:
                  'Tài khoản YouTube cần được kết nối lại để cấp quyền quản lý bình luận (youtube.force-ssl). Vui lòng vào Cài đặt -> Mạng xã hội -> Kết nối lại YouTube.',
              });
            } else {
              results.push({
                platform: pl.platform,
                success: false,
                message: `Lỗi YouTube API (${commentRes.status}): ${errText}`,
              });
            }
          }
        } catch (ytErr: any) {
          results.push({
            platform: pl.platform,
            success: false,
            message: ytErr?.message || 'Lỗi khi gửi bình luận lên YouTube',
          });
        }
      } else if (pl.platform === 'FACEBOOK_REELS') {
        try {
          const socialAccount = await prisma.socialAccount.findFirst({
            where: {
              provider: 'META',
              status: 'CONNECTED',
              ...(post.workspaceId ? { workspaceId: post.workspaceId } : { userId: post.createdById }),
            },
          });

          if (!socialAccount) {
            results.push({
              platform: pl.platform,
              success: false,
              message: 'Không tìm thấy tài khoản Facebook đã kết nối.',
            });
            continue;
          }

          const accessToken = decryptToken(socialAccount.accessToken);
          const fbRes = await fetch(`https://graph.facebook.com/v19.0/${pl.externalPostId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: firstComment,
              access_token: accessToken,
            }),
          });

          if (fbRes.ok) {
            results.push({
              platform: pl.platform,
              success: true,
              message: 'Đã đăng bình luận đầu tiên lên Facebook thành công!',
            });
          } else {
            const fbErr = await fbRes.text();
            results.push({
              platform: pl.platform,
              success: false,
              message: `Lỗi Facebook API (${fbRes.status}): ${fbErr}`,
            });
          }
        } catch (fbErr: any) {
          results.push({
            platform: pl.platform,
            success: false,
            message: fbErr?.message || 'Lỗi khi gửi bình luận lên Facebook',
          });
        }
      }
    }

    const anySuccess = results.some((r) => r.success);
    const firstErrorMessage = results.find((r) => !r.success)?.message;

    return NextResponse.json(
      {
        success: anySuccess,
        results,
        message: anySuccess
          ? 'Bình luận đầu tiên đã được gửi lên nền tảng!'
          : firstErrorMessage || 'Không thể đăng bình luận lên các nền tảng',
      },
      {
        status: anySuccess ? 200 : 400,
        headers: corsHeaders,
      }
    );
  } catch (error: any) {
    console.error('[Post Comment API Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

