import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const posts = await prisma.post.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 3,
    include: {
      platforms: true
    }
  });

  console.log(JSON.stringify(posts, null, 2));

  await prisma.$disconnect();
}

check().catch(console.error);
