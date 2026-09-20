import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const prisma = new PrismaClient();
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
const publishQueue = new Queue('publish-reel', { connection: connection as never });

async function main() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    take: 1
  });
  
  if (posts.length > 0) {
    const postId = posts[0].id;
    console.log('Adding post', postId, 'to queue...');
    await publishQueue.add('publish-reel', { postId });
    console.log('Job added!');
  } else {
    console.log('No posts found');
  }
  await prisma.$disconnect();
  connection.disconnect();
}
main().catch(console.error);
