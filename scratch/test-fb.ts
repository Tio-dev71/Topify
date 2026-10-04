import { getFacebookPageInfo, getFacebookPagePosts } from '../lib/rapidapi/client';

async function run() {
  try {
    const url = 'https://www.facebook.com/zuck';
    console.log('Fetching info for', url);
    const info = await getFacebookPageInfo(url);
    console.log('Info:', JSON.stringify(info, null, 2));

    const posts = await getFacebookPagePosts(url);
    console.log('Posts:', JSON.stringify(posts, null, 2));
  } catch (err) {
    console.error(err);
  }
}

run();
