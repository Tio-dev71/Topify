import { headers } from 'next/headers';
import * as jwtPackage from 'jsonwebtoken';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

const JWT_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'ToolAutoTop123456789!@#LongSecretString123';

async function ensureUserWorkspace(userId: string, defaultName?: string | null): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { workspaceId: true, name: true, email: true }
  });
  if (user?.workspaceId) return user.workspaceId;

  const ws = await prisma.workspace.create({
    data: {
      name: defaultName || user?.name || user?.email ? `${defaultName || user?.name || user?.email}'s Workspace` : 'Personal Workspace',
      plan: 'FREE'
    }
  });
  await prisma.user.update({
    where: { id: userId },
    data: { workspaceId: ws.id }
  });
  return ws.id;
}

export const auth = async (...args: any[]) => {
  // We MUST call headers() and createClient() outside try/catch 
  // so Next.js can throw its internal bailout errors during static rendering.
  const headersList = await headers();
  const authHeader = headersList.get('authorization');
  
  // 1. Check for Bearer token from Desktop App API calls
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwtPackage.verify(token, JWT_SECRET) as any;
      const userId = decoded.sub || decoded.id;
      let workspaceId = decoded.workspaceId;

      if (!workspaceId && userId) {
        workspaceId = await ensureUserWorkspace(userId, decoded.name);
      }
      
      return {
        user: {
          id: userId,
          role: decoded.role,
          name: decoded.name,
          email: decoded.email,
          workspaceId,
        }
      };
    } catch (e) {
      // If token is invalid or missing, silently fallback to standard session
    }
  }

  // 2. Fallback to Supabase Auth session (Cookies from Web App)
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (user && user.email) {
      // Get role and workspace from Prisma
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true, name: true, role: true, workspaceId: true },
      });

      if (dbUser) {
        let workspaceId = dbUser.workspaceId;
        if (!workspaceId) {
          workspaceId = await ensureUserWorkspace(dbUser.id, dbUser.name);
        }

        return {
          user: {
            id: dbUser.id,
            name: dbUser.name,
            role: dbUser.role,
            workspaceId,
            email: user.email,
          }
        };
      }
    }
  } catch (e) {
    // Ignore Supabase/Prisma errors
  }

  return null;
};

