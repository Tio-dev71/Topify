import { getFacebookPageInfo } from '../lib/rapidapi/client';

async function run() {
  const url = 'https://www.facebook.com/10117988912521901';
  const info = await getFacebookPageInfo(url);
  console.log('Info for numeric FB URL:', JSON.stringify(info, null, 2));
}
run();
