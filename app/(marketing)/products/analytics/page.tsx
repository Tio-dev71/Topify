import ClientMarquee from '@/components/marketing/shared/client-marquee';
import AnalyticsHero from '@/components/marketing/analytics/analytics-hero';
import AnalyticsIntegrations from '@/components/marketing/analytics/analytics-integrations';
import AnalyticsReports from '@/components/marketing/analytics/analytics-reports';
import AnalyticsAi from '@/components/marketing/analytics/analytics-ai';
import AnalyticsCta from '@/components/marketing/analytics/analytics-cta';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Topify Analytics - Phân tích dữ liệu thông minh',
  description: 'Topify Analytics tổng hợp và phân tích dữ liệu từ mọi kênh marketing, bán hàng và vận hành.',
};

export const dynamic = 'force-dynamic';

export default function AnalyticsPage() {
  return (
    <>
      <AnalyticsHero />
      <AnalyticsIntegrations />
      <AnalyticsReports />
      <AnalyticsAi />
      <AnalyticsCta />
      {/* Partner Logos at the very bottom as seen in design */}
      <div className="bg-white pt-8 pb-16">
        <div className="max-w-[1350px] mx-auto px-4 sm:px-6 lg:px-8">
          <ClientMarquee />
        </div>
      </div>
    </>
  );
}
