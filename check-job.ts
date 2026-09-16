import { publishQueue } from './lib/queue';

async function main() {
  const job = await publishQueue.getJob('publish-cmu42oxud00051ks59y2az4yr');
  console.log('Job:', job ? {
    id: job.id,
    data: job.data,
    name: job.name,
    timestamp: job.timestamp,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
    failedReason: job.failedReason,
    returnvalue: job.returnvalue,
    isCompleted: await job.isCompleted(),
    isFailed: await job.isFailed()
  } : 'Not found');
  process.exit(0);
}
main().catch(console.error);
