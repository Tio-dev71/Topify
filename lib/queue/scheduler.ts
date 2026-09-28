import { checkAndPublishDuePosts } from './publisher-service';

declare global {
  // eslint-disable-next-line no-var
  var __scheduledPostCheckerTimer: NodeJS.Timeout | null | undefined;
  // eslint-disable-next-line no-var
  var __scheduledPostCheckerRunning: boolean | undefined;
}

let isRunning = false;

/**
 * Start background post scheduler that runs every 20 seconds
 */
export function startScheduledPostChecker(intervalMs: number = 20000) {
  if (globalThis.__scheduledPostCheckerTimer) {
    return;
  }

  console.log(`⏰ [Scheduler] Khởi động tiến trình ngầm kiểm tra bài hẹn giờ (chu kỳ ${intervalMs / 1000}s)`);

  const runCheck = async () => {
    if (isRunning || globalThis.__scheduledPostCheckerRunning) return;
    isRunning = true;
    globalThis.__scheduledPostCheckerRunning = true;

    try {
      await checkAndPublishDuePosts();
    } catch (err: any) {
      console.error('[Scheduler] Lỗi trong chu kỳ check bài hẹn giờ:', err.message);
    } finally {
      isRunning = false;
      globalThis.__scheduledPostCheckerRunning = false;
    }
  };

  // Run immediate initial check after 2 seconds
  setTimeout(runCheck, 2000);

  // Set recurring interval
  const timer = setInterval(runCheck, intervalMs);
  if (typeof timer.unref === 'function') {
    timer.unref();
  }

  globalThis.__scheduledPostCheckerTimer = timer;
}

export function stopScheduledPostChecker() {
  if (globalThis.__scheduledPostCheckerTimer) {
    clearInterval(globalThis.__scheduledPostCheckerTimer);
    globalThis.__scheduledPostCheckerTimer = null;
    globalThis.__scheduledPostCheckerRunning = false;
    console.log('⏰ [Scheduler] Đã dừng tiến trình ngầm kiểm tra bài hẹn giờ');
  }
}
