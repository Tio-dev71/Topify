require('dotenv').config();
const axios = require('axios');
const https = require('https');
const dns = require('dns');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '1c1b890f51mshfef6bf40abdd8abp127863jsn409835c737f5';
const dnsCache = {};

const customLookup = (hostname, options, callback) => {
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
          const aRecord = json.Answer.find((a) => a.type === 1);
          if (aRecord) {
            dnsCache[hostname] = aRecord.data;
            return isAll ? callback(null, [{ address: aRecord.data, family: 4 }]) : callback(null, aRecord.data, 4);
          }
        }
        dns.lookup(hostname, options, callback);
      } catch (e) { dns.lookup(hostname, options, callback); }
    });
  }).on('error', () => { dns.lookup(hostname, options, callback); });
};

const httpsAgent = new https.Agent({ lookup: customLookup });
const rapidApiClient = axios.create({
  headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY },
  httpsAgent,
});

async function test() {
  try {
    console.log("Testing Facebook Page Posts...");
    const info = await rapidApiClient.get('https://facebook-scraper3.p.rapidapi.com/page/details', {
      headers: { 'X-RapidAPI-Host': 'facebook-scraper3.p.rapidapi.com' },
      params: { url: 'https://www.facebook.com/zuck' }
    });
    const page_id = info.data.results?.page_id || 'zuck';
    console.log("Page ID:", page_id);
    
    const posts = await rapidApiClient.get('https://facebook-scraper3.p.rapidapi.com/page/posts', {
      headers: { 'X-RapidAPI-Host': 'facebook-scraper3.p.rapidapi.com' },
      params: { page_id: page_id },
    });
    
    console.log("Posts Data Structure:", Object.keys(posts.data));
    const actualPosts = posts.data.results || posts.data.data || posts.data.posts || [];
    if (actualPosts.length > 0) {
      console.log("First Post Keys:", Object.keys(actualPosts[0]));
    } else {
      console.log("No posts found in array.");
      console.log(JSON.stringify(posts.data).substring(0, 300));
    }
  } catch (err) {
    console.error(err.message);
    if(err.response) console.error(err.response.data);
  }
}

test();
