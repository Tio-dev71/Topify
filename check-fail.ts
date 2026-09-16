import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const post = await prisma.post.findUnique({
    where: { id: 'cmu42oxud00051ks59y2az4yr' },
    include: {
      platforms: true,
      logs: true
    }
  });
  
  console.dir(post, { depth: null });
  await prisma.$disconnect();
}
main().catch(console.error);
