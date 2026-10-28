import axios from 'axios';
import https from 'https';
import dns from 'dns';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '1c1b890f51mshfef6bf40abdd8abp127863jsn409835c737f5';

const dnsCache: Record<string, string> = {};

const customLookup = (hostname: string, options: any, callback: any) => {
  const isAll = typeof options === 'object' && options !== null && options.all;
  
  if (dnsCache[hostname]) {
    const ip = dnsCache[hostname];
    return isAll ? callback(null, [{ address: ip, family: 4 }]) : callback(null, ip, 4);
  }

  https.get(`https://dns.google/resolve?name=${hostname}&type=A`, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.Answer && json.Answer.length > 0) {
          const aRecord = json.Answer.find((a: any) => a.type === 1);
          if (aRecord) {
            dnsCache[hostname] = aRecord.data;
            return isAll ? callback(null, [{ address: aRecord.data, family: 4 }]) : callback(null, aRecord.data, 4);
          }
        }
        dns.lookup(hostname, options, callback);
      } catch (e) {
        dns.lookup(hostname, options, callback);
      }
    });
  }).on('error', () => {
    dns.lookup(hostname, options, callback);
  });
};

const httpsAgent = new https.Agent({ lookup: customLookup });

export const rapidApiClient = axios.create({
  headers: {
    'X-RapidAPI-Key': RAPIDAPI_KEY,
  },
  httpsAgent,
});

// 1. Spy Đối Thủ (Facebook)
export const getFacebookPageInfo = async (pageUrlOrId: string) => {
  try {
    const response = await rapidApiClient.get('https://facebook-scraper3.p.rapidapi.com/page/details', {
      headers: { 'X-RapidAPI-Host': 'facebook-scraper3.p.rapidapi.com' },
      params: { url: pageUrlOrId },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching Facebook page info:', error);
    throw error;
  }
};

export const getFacebookGroupDetails = async (groupUrl: string) => {
  try {
    const response = await rapidApiClient.get('https://facebook-scraper3.p.rapidapi.com/group/details', {
      headers: { 'X-RapidAPI-Host': 'facebook-scraper3.p.rapidapi.com' },
      params: { url: groupUrl },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching Facebook group details:', error);
    throw error;
  }
};

export const getFacebookPagePosts = async (pageUrlOrId: string, cursor?: string) => {
  try {
    let page_id = pageUrlOrId;
    if (pageUrlOrId.includes('facebook.com') || pageUrlOrId.includes('fb.com') || pageUrlOrId.includes('fb.watch') || pageUrlOrId.startsWith('http')) {
      const info = await getFacebookPageInfo(pageUrlOrId);
      page_id = info?.results?.page_id || info?.results?.id || page_id;
    }

    const params: Record<string, string> = { page_id };
    if (cursor) {
      params.cursor = cursor;
    }

    const response = await rapidApiClient.get('https://facebook-scraper3.p.rapidapi.com/page/posts', {
      headers: { 'X-RapidAPI-Host': 'facebook-scraper3.p.rapidapi.com' },
      params,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching Facebook page posts:', error);
    throw error;
  }
};

export const getFacebookGroupPosts = async (groupUrlOrId: string, cursor?: string) => {
  try {
    let group_id = groupUrlOrId;
    const groupMatch = groupUrlOrId.match(/groups\/([^/?#]+)/);
    if (groupMatch) {
      const extracted = groupMatch[1];
      if (/^\d+$/.test(extracted)) {
        group_id = extracted;
      } else {
        const details = await getFacebookGroupDetails(groupUrlOrId);
        group_id = details?.group_details?.id || extracted;
      }
    }

    const params: Record<string, string> = { group_id };
    if (cursor) {
      params.cursor = cursor;
    }

    const response = await rapidApiClient.get('https://facebook-scraper3.p.rapidapi.com/group/posts', {
      headers: { 'X-RapidAPI-Host': 'facebook-scraper3.p.rapidapi.com' },
      params,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching Facebook group posts:', error);
    throw error;
  }
};

export interface DeepScanOptions {
  maxPages?: number;
  minPosts?: number;
  stopBeforeDate?: Date;
}

export const getFacebookDeepPosts = async (targetUrlOrId: string, options: DeepScanOptions = {}) => {
  const maxPages = options.maxPages || 12;
  const minPosts = options.minPosts || 20;
  const stopBeforeDate = options.stopBeforeDate;

  const isGroup = targetUrlOrId.includes('/groups/');
  const allPosts: any[] = [];
  let cursor: string | undefined = undefined;
  let pageNum = 0;

  // Pre-resolve page_id or group_id once to avoid resolving on every page iteration
  let resolvedId = targetUrlOrId;
  if (isGroup) {
    const groupMatch = targetUrlOrId.match(/groups\/([^/?#]+)/);
    if (groupMatch) {
      const extracted = groupMatch[1];
      if (/^\d+$/.test(extracted)) {
        resolvedId = extracted;
      } else {
        try {
          const details = await getFacebookGroupDetails(targetUrlOrId);
          resolvedId = details?.group_details?.id || extracted;
        } catch {
          resolvedId = extracted;
        }
      }
    }
  } else if (targetUrlOrId.includes('facebook.com') || targetUrlOrId.includes('fb.com') || targetUrlOrId.includes('fb.watch') || targetUrlOrId.startsWith('http')) {
    try {
      const info = await getFacebookPageInfo(targetUrlOrId);
      resolvedId = info?.results?.page_id || info?.results?.id || resolvedId;
    } catch {
      // keep original
    }
  }

  while (pageNum < maxPages) {
    pageNum++;
    try {
      const resData = isGroup 
        ? await getFacebookGroupPosts(resolvedId, cursor)
        : await getFacebookPagePosts(resolvedId, cursor);

      const items: any[] = resData?.results || resData?.posts || resData?.data || [];
      if (items.length === 0) break;

      allPosts.push(...items);
      cursor = resData?.cursor || undefined;

      const lastItem = items[items.length - 1];
      const ts = lastItem.timestamp || lastItem.created_time || lastItem.time;
      let lastDate: Date | null = null;
      if (ts) {
        lastDate = typeof ts === 'number' || /^\d+$/.test(String(ts))
          ? new Date(parseInt(String(ts), 10) * 1000)
          : new Date(ts);
      }

      // Check if we have passed the stopBeforeDate AND collected enough minPosts
      if (stopBeforeDate && lastDate && !isNaN(lastDate.getTime()) && lastDate < stopBeforeDate) {
        if (allPosts.length >= minPosts) {
          break;
        }
      }

      if (!cursor) {
        break;
      }
    } catch (pageErr) {
      console.warn(`[getFacebookDeepPosts] Page ${pageNum} error:`, pageErr);
      break;
    }
  }

  return { posts: allPosts, pagesScanned: pageNum };
};


// 2. Tiktok Scraper
export const getTiktokUserInfo = async (username: string) => {
  try {
    const response = await rapidApiClient.get('https://tiktok-api23.p.rapidapi.com/api/user/info', {
      headers: { 'X-RapidAPI-Host': 'tiktok-api23.p.rapidapi.com' },
      params: { uniqueId: username },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching Tiktok user info:', error);
    throw error;
  }
};

export const getTiktokUserPosts = async (username: string) => {
  try {
    const response = await rapidApiClient.get('https://tiktok-api23.p.rapidapi.com/api/user/posts', {
      headers: { 'X-RapidAPI-Host': 'tiktok-api23.p.rapidapi.com' },
      params: { uniqueId: username },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching Tiktok posts:', error);
    throw error;
  }
};

// 3. Từ khóa (Google Keyword Insight)
export const getKeywordInsights = async (keyword: string) => {
  try {
    const response = await rapidApiClient.get('https://google-keyword-insight1.p.rapidapi.com/keysuggest/', {
      headers: { 'X-RapidAPI-Host': 'google-keyword-insight1.p.rapidapi.com' },
      params: { keyword, location: 'VN', lang: 'vi' },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching Keyword Insights:', error);
    throw error;
  }
};

// 4. Cảnh báo (Real-Time News Data)
export const getRealTimeNews = async (query: string) => {
  try {
    const response = await rapidApiClient.get('https://real-time-news-data.p.rapidapi.com/search', {
      headers: { 'X-RapidAPI-Host': 'real-time-news-data.p.rapidapi.com' },
      params: { query, country: 'VN', lang: 'vi' },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching Real-Time News:', error);
    throw error;
  }
};
