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

export const getFacebookPagePosts = async (pageUrlOrId: string) => {
  try {
    // Determine if input is a URL. If so, we need to fetch the page_id first.
    let page_id = pageUrlOrId;
    if (pageUrlOrId.includes('facebook.com')) {
      const info = await getFacebookPageInfo(pageUrlOrId);
      page_id = info?.results?.page_id || page_id;
    }

    const response = await rapidApiClient.get('https://facebook-scraper3.p.rapidapi.com/page/posts', {
      headers: { 'X-RapidAPI-Host': 'facebook-scraper3.p.rapidapi.com' },
      params: { page_id: page_id },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching Facebook page posts:', error);
    throw error;
  }
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
