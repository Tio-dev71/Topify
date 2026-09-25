import { Queue } from 'bullmq';
import IORedis from 'ioredis';


console.log("=== QUEUE INIT ===");
console.log("CWD:", process.cwd());
console.log("REDIS_URL defined?", !!process.env.REDIS_URL);
if (process.env.REDIS_URL) {
  console.log("REDIS_URL starts with:", process.env.REDIS_URL.substring(0, 10));
}

const isBuild = process.env.NEXT_PHASE === 'phase-production-build' || process.env.npm_lifecycle_event === 'build';

const connection = isBuild ? {} as any : new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

export const publishQueue = isBuild ? { add: async () => {} } as any : new Queue('publish-reel', {
  connection: connection as never,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

/**
 * Add a post to the publish queue for immediate processing
 */
export async function enqueuePublish(postId: string) {
  await publishQueue.add('publish', { postId }, {
    jobId: `publish-${postId}-${Date.now()}`,
  });
}

/**
 * Add a post to the publish queue with a delay
 */
export async function schedulePublish(postId: string, scheduledAt: Date) {
  const delay = Math.max(0, scheduledAt.getTime() - Date.now());
  await publishQueue.add('publish', { postId }, {
    jobId: `publish-${postId}-${Date.now()}`,
    delay,
  });
}

export const tokenMonitorQueue = isBuild ? { add: async () => {} } as any : new Queue('token-monitor', {
  connection: connection as never,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

/**
 * Schedule daily token monitor
 */
export async function scheduleTokenMonitor() {
  await tokenMonitorQueue.add('check-tokens', {}, {
    jobId: 'token-monitor-daily',
    repeat: {
      pattern: '0 0 * * *', // Run daily at midnight
    },
  });
}
