import axios from 'axios';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '1c1b890f51mshfef6bf40abdd8abp127863jsn409835c737f5';

export const rapidApiClient = axios.create({
  headers: {
    'X-RapidAPI-Key': RAPIDAPI_KEY,
  },
});

// 1. Spy Đối Thủ (Facebook)
export const getFacebookPageInfo = async (pageUrlOrId: string) => {
  try {
    const response = await rapidApiClient.get('https://facebook-scraper3.p.rapidapi.com/page/info', {
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
    const response = await rapidApiClient.get('https://facebook-scraper3.p.rapidapi.com/page/posts', {
      headers: { 'X-RapidAPI-Host': 'facebook-scraper3.p.rapidapi.com' },
      params: { url: pageUrlOrId },
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
    const response = await rapidApiClient.get('https://google-keyword-insight1.p.rapidapi.com/keyword/search', {
      headers: { 'X-RapidAPI-Host': 'google-keyword-insight1.p.rapidapi.com' },
      params: { keyword, country: 'vn', language: 'vi' },
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
