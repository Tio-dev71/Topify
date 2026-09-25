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
    const response = await rapidApiClient.get('https://real-time-news-data.p.rapidapi.com/search', {
      headers: { 'X-RapidAPI-Host': 'real-time-news-data.p.rapidapi.com' },
      params: { query: 'facebook', country: 'VN', lang: 'vi' },
    });
    console.log("Keys:", Object.keys(response.data));
    console.log("Data sample:", JSON.stringify(response.data).substring(0, 300));
  } catch (err) {
    console.error(err.message);
  }
}
test();
