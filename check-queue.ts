import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL as string, { maxRetriesPerRequest: null });
const publishQueue = new Queue('publish-reel', { connection: connection as any });

async function check() {
  const waiting = await publishQueue.getWaiting();
  const active = await publishQueue.getActive();
  const delayed = await publishQueue.getDelayed();
  const failed = await publishQueue.getFailed();

  console.log('Waiting:', waiting.length);
  waiting.forEach(j => console.log('W:', j.id, j.data));
  console.log('Active:', active.length);
  active.forEach(j => console.log('A:', j.id, j.data));
  console.log('Delayed:', delayed.length);
  delayed.forEach(j => console.log('D:', j.id, j.data));
  console.log('Failed:', failed.length);
  failed.forEach(j => console.log('F:', j.id, j.data, j.failedReason));

  await connection.quit();
}

check().catch(console.error);
