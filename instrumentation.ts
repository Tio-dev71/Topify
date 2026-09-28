export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startScheduledPostChecker } = await import('@/lib/queue/scheduler');
    startScheduledPostChecker();
  }
}
