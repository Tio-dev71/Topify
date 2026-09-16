import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const workspaces = await prisma.workspace.findMany()
  console.log(workspaces)
  const users = await prisma.user.findMany()
  console.log(users)
}
main().catch(console.error).finally(() => prisma.$disconnect())
