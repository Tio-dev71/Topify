import { getFacebookPagePosts } from '../lib/rapidapi/client';

async function run() {
  const posts = await getFacebookPagePosts('https://www.facebook.com/10117988912521901');
  console.log('Posts:', JSON.stringify(posts, null, 2).slice(0, 500));
}
run();
