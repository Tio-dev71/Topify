import { getFacebookPagePosts } from '../lib/rapidapi/client';

async function run() {
  const posts = await getFacebookPagePosts('100064903443387');
  console.log('Posts:', JSON.stringify(posts, null, 2).slice(0, 500));
}
run();
