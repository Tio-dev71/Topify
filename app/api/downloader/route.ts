import { NextRequest, NextResponse } from 'next/server';

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Follow redirects for short TikTok URLs (vt.tiktok.com, vm.tiktok.com, etc.)
async function resolveTikTokUrl(inputUrl: string): Promise<string> {
  try {
    const isShortUrl =
      inputUrl.includes('vt.tiktok.com') ||
      inputUrl.includes('vm.tiktok.com') ||
      inputUrl.includes('/t/');

    if (!isShortUrl) return inputUrl;

    const res = await fetch(inputUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    return res.url || inputUrl;
  } catch (err) {
    console.warn('[Downloader] Error resolving TikTok redirect:', err);
    return inputUrl;
  }
}

async function getFacebookMetadata(inputUrl: string): Promise<{
  title?: string;
  author?: string;
  description?: string;
  thumbnail?: string;
} | null> {
  try {
    const res = await fetch(inputUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent':
          'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return null;
    const html = await res.text();

    const decodeEntities = (str: string) => {
      if (!str) return '';
      return str
        .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
        .replace(/&#([0-9]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 10)))
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
    };

    const ogTitleMatch =
      html.match(/<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:title["']/i);
    const ogDescMatch =
      html.match(/<meta\s+(?:property|name)=["']og:description["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:description["']/i);
    const ogImageMatch =
      html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image["']/i);
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);

    const ogTitle = ogTitleMatch ? decodeEntities(ogTitleMatch[1]) : '';
    const ogDesc = ogDescMatch ? decodeEntities(ogDescMatch[1]) : '';
    const pageTitle = titleMatch ? decodeEntities(titleMatch[1]) : '';
    const thumbnail = ogImageMatch ? decodeEntities(ogImageMatch[1]) : undefined;

    const isGeneric = (t: string) => {
      if (!t) return true;
      const lower = t.toLowerCase();
      return (
        lower === '- facebook reel' ||
        lower === 'facebook reel' ||
        lower === '- facebook video' ||
        lower === 'facebook video' ||
        lower === '- facebook watch' ||
        lower === 'facebook watch' ||
        lower === 'video' ||
        lower === 'reel' ||
        lower === 'user' ||
        lower.startsWith('- facebook reel') ||
        lower.startsWith('- facebook video')
      );
    };

    let chosenTitle = !isGeneric(ogTitle) ? ogTitle : !isGeneric(ogDesc) ? ogDesc : pageTitle;

    let author = '';
    if (chosenTitle.includes(' | ')) {
      const parts = chosenTitle.split(' | ');
      author = parts.pop()?.trim() || '';
      chosenTitle = parts.join(' | ').trim();
    } else if (chosenTitle.endsWith(' - Facebook')) {
      chosenTitle = chosenTitle.replace(/ - Facebook$/, '').trim();
    }

    chosenTitle = chosenTitle
      .replace(/\s*-\s*Facebook Reel\s*/gi, ' ')
      .replace(/\s*-\s*Facebook Video\s*/gi, ' ')
      .replace(/^-\s*/, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (isGeneric(chosenTitle) && ogDesc && !isGeneric(ogDesc)) {
      chosenTitle = ogDesc
        .replace(/\s*-\s*Facebook Reel\s*/gi, ' ')
        .replace(/^-\s*/, '')
        .trim();
    }

    return {
      title: chosenTitle || undefined,
      author: author || undefined,
      description: ogDesc || undefined,
      thumbnail: thumbnail,
    };
  } catch (err) {
    console.warn('[Downloader] Error scraping Facebook metadata:', err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, isTikTokNoWatermark, type } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Vui lòng cung cấp đường link video hợp lệ' }, { status: 400 });
    }

    const trimmedUrl = url.trim();
    const isTikTokSpecific =
      isTikTokNoWatermark === true ||
      type === 'tiktok-no-watermark' ||
      trimmedUrl.includes('tiktok.com');

    // Handle TikTok No Watermark API specifically
    if (isTikTokSpecific) {
      const tiktokHost =
        process.env.TIKTOK_RAPIDAPI_HOST || 'tiktok-video-no-watermark2.p.rapidapi.com';
      const tiktokKey =
        process.env.TIKTOK_RAPIDAPI_KEY ||
        process.env.RAPIDAPI_KEY ||
        '1c1b890f51mshfef6bf40abdd8abp127863jsn409835c737f5';

      const targetUrl = await resolveTikTokUrl(trimmedUrl);
      console.log(`[TikTok Downloader] Fetching No Watermark for: ${targetUrl}`);

      const tiktokApiUrl = `https://${tiktokHost}/?url=${encodeURIComponent(targetUrl)}`;
      const tiktokRes = await fetch(tiktokApiUrl, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': tiktokKey,
          'x-rapidapi-host': tiktokHost,
        },
      });

      if (!tiktokRes.ok) {
        const errorText = await tiktokRes.text();
        console.error('[TikTok API Error]:', errorText);
        return NextResponse.json(
          { error: 'Không thể kết nối đến máy chủ TikTok. Vui lòng thử lại sau.' },
          { status: tiktokRes.status }
        );
      }

      const tiktokData = await tiktokRes.json();

      if (tiktokData.code !== 0 || !tiktokData.data) {
        console.warn('[TikTok API Response Not Success]:', tiktokData);
        // If specific tiktok request failed, return descriptive error
        return NextResponse.json(
          {
            error:
              tiktokData.msg ||
              'Không tìm thấy video TikTok này. Vui lòng kiểm tra lại đường dẫn và đảm bảo video đang ở chế độ công khai.',
          },
          { status: 400 }
        );
      }

      const data = tiktokData.data;
      const medias: any[] = [];
      const isPhotoPost = Array.isArray(data.images) && data.images.length > 0;

      if (isPhotoPost) {
        // Handle TikTok Photo Mode (Slide ảnh)
        data.images.forEach((imgUrl: string, idx: number) => {
          medias.push({
            url: imgUrl,
            quality: `Ảnh ${idx + 1} (HD Không Logo)`,
            extension: 'jpg',
            type: 'image',
            size: '',
            isNoWatermark: true,
            isRecommended: false,
          });
        });

        // Background music for photo slide
        const musicUrl = data.music || data.music_info?.play || (typeof data.play === 'string' && (data.play.includes('.mp3') || data.play.includes('mime_type=audio_mpeg')) ? data.play : undefined);
        if (musicUrl) {
          medias.push({
            url: musicUrl,
            quality: data.music_info?.title ? `Nhạc nền (${data.music_info.title})` : 'Nhạc nền (Original Audio)',
            extension: 'mp3',
            type: 'audio',
            size: '',
            isNoWatermark: false,
            isRecommended: false,
          });
        }

        return NextResponse.json({
          success: true,
          isTikTok: true,
          isPhotoPost: true,
          images: data.images,
          title: data.title || 'TikTok Photo Album',
          thumbnail: data.cover || data.origin_cover || data.images[0],
          duration: 0,
          author: data.author
            ? {
                nickname: data.author.nickname,
                unique_id: data.author.unique_id,
                avatar: data.author.avatar,
              }
            : undefined,
          medias,
          musicUrl,
          musicTitle: data.music_info?.title || 'Nhạc nền TikTok',
        });
      }

      // 1. No Watermark Video (Top recommendation)
      if (data.play) {
        medias.push({
          url: data.play,
          quality: 'HD Không Logo (No Watermark)',
          extension: 'mp4',
          type: 'video',
          size: formatBytes(data.size),
          isNoWatermark: true,
          isRecommended: true,
        });
      }

      // 2. Watermarked Video
      if (data.wmplay) {
        medias.push({
          url: data.wmplay,
          quality: 'Video Gốc Có Logo',
          extension: 'mp4',
          type: 'video',
          size: formatBytes(data.wm_size),
          isNoWatermark: false,
          isRecommended: false,
        });
      }

      // 3. Audio / Music
      const musicUrl = data.music || data.music_info?.play;
      if (musicUrl) {
        medias.push({
          url: musicUrl,
          quality: data.music_info?.title ? `Nhạc nền (${data.music_info.title})` : 'Nhạc nền (Original Audio)',
          extension: 'mp3',
          type: 'audio',
          size: '',
          isNoWatermark: false,
          isRecommended: false,
        });
      }

      return NextResponse.json({
        success: true,
        isTikTok: true,
        isPhotoPost: false,
        title: data.title || 'TikTok Video',
        thumbnail: data.cover || data.origin_cover || data.ai_dynamic_cover,
        duration: data.duration,
        author: data.author
          ? {
              nickname: data.author.nickname,
              unique_id: data.author.unique_id,
              avatar: data.author.avatar,
            }
          : undefined,
        medias,
      });
    }

    // Universal Downloader (YouTube, Facebook, Instagram, Twitter, etc.)
    const rapidApiKey = process.env.RAPIDAPI_KEY || '1c1b890f51mshfef6bf40abdd8abp127863jsn409835c737f5';
    const rapidApiHost = process.env.RAPIDAPI_HOST || 'auto-download-all-in-one-big.p.rapidapi.com';

    const fetchUrl = `https://${rapidApiHost}/v1/social/autolink`;
    console.log(`[Universal Downloader] Fetching: ${fetchUrl} for ${trimmedUrl}`);

    const isFacebook =
      trimmedUrl.includes('facebook.com') ||
      trimmedUrl.includes('fb.watch') ||
      trimmedUrl.includes('fb.com');

    // Run Facebook metadata scraping in parallel if Facebook link
    const [fbMeta, response] = await Promise.all([
      isFacebook ? getFacebookMetadata(trimmedUrl) : Promise.resolve(null),
      fetch(fetchUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-rapidapi-key': rapidApiKey,
          'x-rapidapi-host': rapidApiHost,
        },
        body: JSON.stringify({ url: trimmedUrl }),
      }),
    ]);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Universal RapidAPI Error]:', errorText);
      return NextResponse.json(
        { error: 'Không thể tải video từ đường link này. Vui lòng kiểm tra lại.', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    const isGenericTitle = (t?: string) => {
      if (!t) return true;
      const clean = t.trim().toLowerCase();
      return (
        clean === '- facebook reel' ||
        clean === 'facebook reel' ||
        clean === '- facebook video' ||
        clean === 'facebook video' ||
        clean === '- facebook watch' ||
        clean === 'facebook watch' ||
        clean === 'user' ||
        clean === 'video' ||
        clean.startsWith('- facebook reel') ||
        clean.startsWith('- facebook video')
      );
    };

    // Apply resolved Facebook metadata
    if (fbMeta?.title) {
      data.title = fbMeta.title;
      if (fbMeta.author && (!data.author || data.author === 'User')) {
        data.author = fbMeta.author;
      }
      if (!data.thumbnail && fbMeta.thumbnail) {
        data.thumbnail = fbMeta.thumbnail;
      }
    } else if (
      isGenericTitle(data.title) &&
      (isFacebook || data.source === 'facebook' || (data.url && data.url.includes('facebook.com')))
    ) {
      // Lazy fetch if parallel fetch was skipped or didn't get title
      const fallbackMeta = await getFacebookMetadata(data.url || trimmedUrl);
      if (fallbackMeta?.title) {
        data.title = fallbackMeta.title;
        if (fallbackMeta.author && (!data.author || data.author === 'User')) {
          data.author = fallbackMeta.author;
        }
        if (!data.thumbnail && fallbackMeta.thumbnail) {
          data.thumbnail = fallbackMeta.thumbnail;
        }
      }
    }

    // Clean up any remaining "- Facebook Reel" or leading dashes in title
    if (typeof data.title === 'string') {
      data.title = data.title
        .replace(/\s*-\s*Facebook Reel\s*/gi, ' ')
        .replace(/\s*-\s*Facebook Video\s*/gi, ' ')
        .replace(/^-\s*/, '')
        .trim();
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Downloader API Error]:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống khi xử lý video' }, { status: 500 });
  }
}
