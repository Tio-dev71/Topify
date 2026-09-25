import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Providers } from './providers';
import OnboardingPage from './onboarding/page';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const isSuperAdmin = session.user.role === 'SUPER_ADMIN';

  if (!session.user.workspaceId && !isSuperAdmin) {
    return (
      <Providers>
        <OnboardingPage />
      </Providers>
    );
  }

  return (
    <Providers>
      <div className="min-h-screen bg-background">
        <Sidebar />
        {/* Main content area */}
        <main className="lg:pl-[260px] transition-all duration-300">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 lg:pt-8">
            {children}
          </div>
        </main>
      </div>
    </Providers>
  );
}
