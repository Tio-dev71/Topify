import CrmHero from '@/components/marketing/crm/crm-hero';
import CrmChannels from '@/components/marketing/crm/crm-channels';
import CrmFeatures from '@/components/marketing/crm/crm-features';
import CrmBenefits from '@/components/marketing/crm/crm-benefits';
import CrmWorkflow from '@/components/marketing/crm/crm-workflow';
import CrmIntegrations from '@/components/marketing/crm/crm-integrations';
import CrmCta from '@/components/marketing/crm/crm-cta';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Topify CRM - Quản lý hội thoại đa kênh',
  description: 'Chăm sóc khách hàng đa kênh - Tăng chuyển đổi - Giữ chân khách hàng',
};

export default function CrmPage() {
  return (
    <main className="min-h-screen bg-white">
      <CrmHero />
      <CrmChannels />
      <CrmFeatures />
      <CrmBenefits />
      <CrmWorkflow />
      <CrmIntegrations />
      <CrmCta />
    </main>
  );
}
