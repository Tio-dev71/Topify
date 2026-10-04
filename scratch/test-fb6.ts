import { getFacebookPagePosts } from '../lib/rapidapi/client';

async function run() {
  const posts = await getFacebookPagePosts('https://www.facebook.com/zuck');
  console.log('Posts:', JSON.stringify(posts, null, 2).slice(0, 500));
}
run();
