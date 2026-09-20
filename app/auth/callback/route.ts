import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  try {
    if (code) {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        // Sync the profile after a successful OAuth exchange
        const { data: { user } } = await supabase.auth.getUser()
        if (user && user.email) {
          try {
            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
              where: { email: user.email }
            });

            if (existingUser) {
              // Update existing user
              await prisma.user.update({
                where: { email: user.email },
                data: {
                  name: user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0],
                  image: user.user_metadata?.avatar_url || '',
                  emailVerified: new Date(),
                }
              });
            } else {
              // Check if invited
              const invite = await prisma.allowedEmail.findUnique({
                where: { email: user.email }
              });

              if (invite && invite.workspaceId) {
                // Invited staff
                await prisma.user.create({
                  data: {
                    email: user.email,
                    name: user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0],
                    image: user.user_metadata?.avatar_url || '',
                    emailVerified: new Date(),
                    role: invite.role,
                    workspaceId: invite.workspaceId,
                  }
                });
              } else {
                // New user registration - no workspace yet
                const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0];

                await prisma.user.create({
                  data: {
                    email: user.email,
                    name,
                    image: user.user_metadata?.avatar_url || '',
                    emailVerified: new Date(),
                    role: 'STAFF',
                    workspaceId: null,
                  }
                });
              }
            }
          } catch (dbError) {
            console.error("Prisma upsert error in auth callback:", dbError);
            return NextResponse.redirect(`${origin}/login?error=database_sync_failed`);
          }
        }

        const forwardedHost = request.headers.get('x-forwarded-host') 
        const isLocalEnv = process.env.NODE_ENV === 'development'
        
        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${next}`)
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`)
        } else {
          return NextResponse.redirect(`${origin}${next}`)
        }
      }
    }
  } catch (err) {
    console.error("Global error in auth callback:", err);
    return NextResponse.redirect(`${origin}/login?error=auth_callback_crashed`);
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
