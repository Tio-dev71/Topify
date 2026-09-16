import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const logs = await prisma.publishLog.findMany({
    where: { postId: 'cmu42oxud00051ks59y2az4yr' },
    orderBy: { createdAt: 'desc' },
  });

  console.log('Logs:', JSON.stringify(logs, null, 2));

  await prisma.$disconnect();
}

check().catch(console.error);
