import Navbar from '@/components/marketing/navbar';
import Footer from '@/components/marketing/footer';

export const dynamic = 'force-dynamic';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-blue-500/30">
      <Navbar />
      <main>
        {children}
      </main>
      <Footer />
    </div>
  );
}
