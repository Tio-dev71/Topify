import { Queue } from 'bullmq';
import IORedis from 'ioredis';


console.log("=== QUEUE INIT ===");
console.log("CWD:", process.cwd());
console.log("REDIS_URL defined?", !!process.env.REDIS_URL);
if (process.env.REDIS_URL) {
  console.log("REDIS_URL starts with:", process.env.REDIS_URL.substring(0, 10));
}

const isBuild = process.env.npm_lifecycle_event === 'build' || process.env.NEXT_PHASE === 'phase-production-build';

const connection = isBuild ? {} as any : new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  enableOfflineQueue: false,
  retryStrategy(times) {
    if (times > 3) return null;
    return Math.min(times * 500, 2000);
  },
});

if (!isBuild && connection && typeof connection.on === 'function') {
  connection.on('error', (err: any) => {
    if (err.code !== 'ECONNREFUSED') {
      console.warn('[Queue IORedis Warning]:', err.message);
    }
  });
}

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
  try {
    await publishQueue.add('publish', { postId }, {
      jobId: `publish-${postId}-${Date.now()}`,
    });
  } catch (err: any) {
    console.warn(`[Queue] Không thể kết nối Redis (${err.message}). Tự động xuất bản trực tiếp cho bài: ${postId}`);
    const { publishPostDirectly } = await import('./publisher-service');
    publishPostDirectly(postId).catch((directErr) => {
      console.error(`[Queue] Lỗi khi xuất bản trực tiếp cho bài ${postId}:`, directErr);
    });
  }
}

/**
 * Add a post to the publish queue with a delay
 */
export async function schedulePublish(postId: string, scheduledAt: Date) {
  try {
    const delay = Math.max(0, scheduledAt.getTime() - Date.now());
    await publishQueue.add('publish', { postId }, {
      jobId: `publish-${postId}-${Date.now()}`,
      delay,
    });
  } catch (err: any) {
    console.warn(`[Queue] Redis không sẵn sàng cho BullMQ delay (${err.message}). Bài viết ${postId} đã được lưu vào CSDL với trạng thái SCHEDULED và sẽ được tiến trình ngầm (Scheduler) tự động xử lý khi đến giờ hẹn.`);
  }
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

export const keywordScraperQueue = isBuild ? { add: async () => {} } as any : new Queue('keyword-scraper', {
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
 * Schedule daily keyword scraper
 */
export async function scheduleKeywordScraper() {
  await keywordScraperQueue.add('scrape-keywords', {}, {
    jobId: 'keyword-scraper-daily',
    repeat: {
      pattern: '0 0 * * *', // Run daily at midnight (24h)
    },
  });
}
