import { config } from 'dotenv';
import { rapidApiClient } from './lib/rapidapi/client';
config();

async function test() {
  console.log("RAPIDAPI_KEY exists?", !!process.env.RAPIDAPI_KEY);
  
  try {
    const facebookRes = await rapidApiClient.get('https://facebook-scraper3.p.rapidapi.com/page/info', {
      params: { url: 'https://www.facebook.com/zuck' }
    });
    console.log("Facebook API success. Status:", facebookRes.status);
    console.log("Data keys:", Object.keys(facebookRes.data));
    console.log("Data:", JSON.stringify(facebookRes.data).slice(0, 200));
  } catch (err: any) {
    console.error("Facebook API error:", err.message);
    if (err.response) {
      console.error("Response data:", err.response.data);
    }
  }
}

test();
