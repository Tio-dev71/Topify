import { enqueuePublish } from './lib/queue';

async function main() {
  console.log('Enqueuing post cmu42oxud00051ks59y2az4yr...');
  await enqueuePublish('cmu42oxud00051ks59y2az4yr');
  console.log('Done');
  process.exit(0);
}
main().catch(console.error);
