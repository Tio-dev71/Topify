import { getFacebookPageInfo } from '../lib/rapidapi/client';

async function run() {
  const url = 'https://www.facebook.com/zuck';
  const info = await getFacebookPageInfo(url);
  console.log('Resolved page_id:', info?.results?.page_id);
}
run();
