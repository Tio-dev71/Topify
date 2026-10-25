import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    // Centralize operational features in Desktop App; redirect web subroutes to dashboard
    if (
        pathname.startsWith('/dashboard/content') ||
        pathname.startsWith('/dashboard/crm') ||
        pathname.startsWith('/dashboard/social') ||
        pathname.startsWith('/dashboard/inbox') ||
        pathname.startsWith('/dashboard/tasks') ||
        pathname.startsWith('/dashboard/campaigns') ||
        pathname.startsWith('/dashboard/audit-log') ||
        pathname.startsWith('/dashboard/wallet') ||
        pathname.startsWith('/dashboard/referral')
    ) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return updateSession(request);
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
