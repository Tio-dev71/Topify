import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function check() {
  const post = await prisma.post.findUnique({
    where: { id: 'cmu42oxud00051ks59y2az4yr' },
    include: { videoAsset: true }
  });

  console.log(post?.videoAsset);
  if (post?.videoAsset) {
    console.log(fs.statSync('./lib/storage/...' /* wait, I don't know the exact path */));
  }
  await prisma.$disconnect();
}
check().catch(console.error);
