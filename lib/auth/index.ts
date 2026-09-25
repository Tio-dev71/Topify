import { headers } from 'next/headers';
import * as jwtPackage from 'jsonwebtoken';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

export const auth = async (...args: any[]) => {
  // We MUST call headers() and createClient() outside try/catch 
  // so Next.js can throw its internal bailout errors during static rendering.
  const headersList = await headers();
  const authHeader = headersList.get('authorization');
  
  // 1. Check for Bearer token from Desktop App API calls
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwtPackage.verify(token, process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'ToolAutoTop123456789!@#LongSecretString123') as any;
      
      return {
        user: {
          id: decoded.sub || decoded.id,
          role: decoded.role,
          workspaceId: decoded.workspaceId,
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
        select: { id: true, role: true, workspaceId: true },
      });

      if (dbUser) {
        return {
          user: {
            id: dbUser.id,
            role: dbUser.role,
            workspaceId: dbUser.workspaceId,
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

