import { PrismaClient } from '@prisma/client';
import { getValidAccessToken } from './lib/publishers/googleAuth';

const prisma = new PrismaClient();

async function main() {
  const account = await prisma.socialAccount.findFirst({
    where: { provider: 'YOUTUBE' }
  });
  
  if (!account) {
    console.log("No Youtube account found");
    return;
  }
  
  try {
    const token = await getValidAccessToken(account);
    console.log("Got token:", token.substring(0, 20) + "...");
    
    // Check scopes or channel info
    const res = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet,status&mine=true', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const data = await res.json();
    console.log("Channel info response:", JSON.stringify(data, null, 2));
    
  } catch (err) {
    console.error("Error:", err);
  }
  
  await prisma.$disconnect();
}
main().catch(console.error);
