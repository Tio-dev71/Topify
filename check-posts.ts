import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      platforms: true
    }
  });

  console.log(JSON.stringify(posts, null, 2));

  await prisma.$disconnect();
}

check().catch(console.error);
