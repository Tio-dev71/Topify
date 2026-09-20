'use client';

import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, PieChart, Calendar, FileText, Users, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function AnalyticsReports() {
  const { t } = useLanguage();
  return (
    <div className="bg-white py-24 relative overflow-hidden">
      <div className="max-w-[1350px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            {t('analytics.reports.title')}
          </h2>
        </div>

        {/* Top Row: 2 Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Card 1: Báo cáo tổng quan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white border border-gray-100 rounded-3xl p-8 lg:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_40px_rgba(91,61,245,0.08)] transition-all flex flex-col h-full"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#5B3DF5]">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{t('analytics.reports.overview.title')}</h3>
            </div>
            
            {/* Graphic */}
            <div className="bg-gray-50/50 rounded-2xl p-6 mb-8 h-[200px] flex items-center justify-center relative">
               {/* Mock Line Chart */}
               <div className="w-full h-full relative">
                 <div className="absolute left-0 bottom-0 top-0 border-l border-gray-200 flex flex-col justify-between text-[9px] text-gray-400 pl-2"></div>
                 <div className="absolute left-0 bottom-0 right-0 border-b border-gray-200 flex justify-between text-[9px] text-gray-400 pb-2"></div>
                 <svg viewBox="0 0 400 150" className="w-full h-full overflow-visible">
                    <path d="M 10 120 L 80 80 L 150 90 L 220 50 L 290 60 L 390 20" fill="none" stroke="#5B3DF5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M 10 140 L 80 110 L 150 130 L 220 90 L 290 100 L 390 60" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
                    <path d="M 10 100 L 80 50 L 150 70 L 220 30 L 290 40 L 390 10" fill="none" stroke="#ec4899" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
                 </svg>
               </div>
            </div>

            <div className="flex flex-col gap-3 flex-1 mb-8">
              {[
                t('analytics.reports.overview.item1'),
                t('analytics.reports.overview.item2'),
                t('analytics.reports.overview.item3')
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#5B3DF5] mt-2 shrink-0"></div>
                  <span className="text-[15px] text-gray-600 font-medium">{item}</span>
                </div>
              ))}
            </div>

            <a href="/" className="inline-flex items-center text-[15px] font-bold text-[#5B3DF5] hover:text-blue-700 transition-colors mt-auto group">
              {t('analytics.reports.learn_more')}
              <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>

          {/* Card 2: Báo cáo kênh */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white border border-gray-100 rounded-3xl p-8 lg:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_40px_rgba(91,61,245,0.08)] transition-all flex flex-col h-full"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-500">
                <PieChart className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{t('analytics.reports.channels.title')}</h3>
            </div>
            
            {/* Graphic */}
            <div className="bg-gray-50/50 rounded-2xl p-6 mb-8 h-[200px] flex items-center justify-center gap-8">
               {/* Mock Donut */}
               <div className="w-[120px] h-[120px] relative shrink-0">
                 <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#5B3DF5" strokeWidth="20" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="20" strokeDasharray="251.2" strokeDashoffset="150" className="origin-center rotate-[180deg]" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#ec4899" strokeWidth="20" strokeDasharray="251.2" strokeDashoffset="200" className="origin-center rotate-[90deg]" />
                 </svg>
               </div>
               {/* Mock Legend */}
               <div className="flex flex-col gap-2 flex-1">
                 {[
                   { l: 'Facebook', c: 'bg-[#5B3DF5]' },
                   { l: 'TikTok', c: 'bg-blue-500' },
                   { l: 'Google', c: 'bg-pink-500' },
                   { l: 'Zalo', c: 'bg-teal-500' },
                   { l: 'Email', c: 'bg-gray-400' },
                   { l: 'Khác', c: 'bg-gray-300' }
                 ].map((lg, i) => (
                   <div key={i} className="flex items-center gap-2">
                     <div className={`w-2.5 h-2.5 rounded-full ${lg.c}`}></div>
                     <span className="text-[10px] font-bold text-gray-600">{lg.l}</span>
                   </div>
                 ))}
               </div>
            </div>

            <div className="flex flex-col gap-3 flex-1 mb-8">
              {[
                t('analytics.reports.channels.item1'),
                t('analytics.reports.channels.item2'),
                t('analytics.reports.channels.item3')
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 shrink-0"></div>
                  <span className="text-[15px] text-gray-600 font-medium">{item}</span>
                </div>
              ))}
            </div>

            <a href="/" className="inline-flex items-center text-[15px] font-bold text-teal-600 hover:text-teal-700 transition-colors mt-auto group">
              {t('analytics.reports.learn_more')}
              <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>

        {/* Bottom Row: 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 3: Báo cáo chiến dịch */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white border border-gray-100 rounded-3xl p-6 lg:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_40px_rgba(91,61,245,0.08)] transition-all flex flex-col h-full"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{t('analytics.reports.campaigns.title')}</h3>
            </div>
            
            {/* Graphic */}
            <div className="bg-gray-50/50 rounded-2xl p-4 mb-8 h-[160px] flex flex-col justify-center gap-2">
               {/* Mock Table */}
               <div className="flex justify-between text-[8px] font-bold text-gray-400 mb-2 border-b border-gray-200 pb-1">
                 <span>{t('analytics.reports.campaigns.col1')}</span><span>{t('analytics.reports.campaigns.col2')}</span><span>{t('analytics.reports.campaigns.col3')}</span><span>{t('analytics.reports.campaigns.col4')}</span>
               </div>
               {[
                 { n: 'Spring Sale', c: '12.5M', r: '89.2M', ro: '7.14', co: 'text-green-500' },
                 { n: 'Brand Awareness', c: '8.2M', r: '32.6M', ro: '3.98', co: 'text-green-500' },
                 { n: 'Remarketing', c: '6.7M', r: '45.1M', ro: '6.73', co: 'text-green-500' },
                 { n: 'Lead Gen', c: '4.3M', r: '18.7M', ro: '4.35', co: 'text-green-500' },
               ].map((row, i) => (
                 <div key={i} className="flex justify-between text-[9px] font-semibold text-gray-700 items-center">
                   <span className="w-1/4 truncate">{row.n}</span>
                   <span className="w-1/4 text-center">{row.c}</span>
                   <span className="w-1/4 text-center">{row.r}</span>
                   <span className={`w-1/4 text-right ${row.co}`}>{row.ro}</span>
                 </div>
               ))}
            </div>

            <div className="flex flex-col gap-3 flex-1 mb-8">
              {[
                t('analytics.reports.campaigns.item1'),
                t('analytics.reports.campaigns.item2'),
                t('analytics.reports.campaigns.item3')
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0"></div>
                  <span className="text-[14px] text-gray-600 font-medium">{item}</span>
                </div>
              ))}
            </div>

            <a href="/" className="inline-flex items-center text-[14px] font-bold text-purple-600 hover:text-purple-700 transition-colors mt-auto group">
              {t('analytics.reports.learn_more')}
              <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>

          {/* Card 4: Báo cáo nội dung */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white border border-gray-100 rounded-3xl p-6 lg:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_40px_rgba(91,61,245,0.08)] transition-all flex flex-col h-full"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{t('analytics.reports.content.title')}</h3>
            </div>
            
            {/* Graphic */}
            <div className="bg-gray-50/50 rounded-2xl p-4 mb-8 h-[160px] flex flex-col justify-center gap-3">
               <div className="flex justify-between text-[8px] font-bold text-gray-400 border-b border-gray-200 pb-1">
                 <span>{t('analytics.reports.content.col1')}</span><span>{t('analytics.reports.content.col2')}</span><span>{t('analytics.reports.content.col3')}</span><span>{t('analytics.reports.content.col4')}</span>
               </div>
               {[
                 { n: `${t('analytics.reports.content.post')} 1`, w: '70%', v1: '125.6K', v2: '8.3K', v3: '6.21%' },
                 { n: `${t('analytics.reports.content.post')} 2`, w: '50%', v1: '98.4K', v2: '6.1K', v3: '5.47%' },
                 { n: `${t('analytics.reports.content.post')} 3`, w: '40%', v1: '76.2K', v2: '4.8K', v3: '4.98%' },
                 { n: `${t('analytics.reports.content.post')} 4`, w: '30%', v1: '52.3K', v2: '3.2K', v3: '4.21%' },
               ].map((row, i) => (
                 <div key={i} className="flex justify-between items-center text-[9px] font-semibold text-gray-700">
                   <div className="w-1/4">
                     <div className="h-1.5 bg-gray-200 rounded-full w-full overflow-hidden">
                       <div className="h-full bg-pink-500 rounded-full" style={{width: row.w}}></div>
                     </div>
                   </div>
                   <span className="w-1/4 text-center">{row.v1}</span>
                   <span className="w-1/4 text-center">{row.v2}</span>
                   <span className="w-1/4 text-right">{row.v3}</span>
                 </div>
               ))}
            </div>

            <div className="flex flex-col gap-3 flex-1 mb-8">
              {[
                t('analytics.reports.content.item1'),
                t('analytics.reports.content.item2'),
                t('analytics.reports.content.item3')
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-2 shrink-0"></div>
                  <span className="text-[14px] text-gray-600 font-medium">{item}</span>
                </div>
              ))}
            </div>

            <a href="/" className="inline-flex items-center text-[14px] font-bold text-pink-600 hover:text-pink-700 transition-colors mt-auto group">
              {t('analytics.reports.learn_more')}
              <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>

          {/* Card 5: Báo cáo khách hàng */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white border border-gray-100 rounded-3xl p-6 lg:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_40px_rgba(91,61,245,0.08)] transition-all flex flex-col h-full"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{t('analytics.reports.customers.title')}</h3>
            </div>
            
            {/* Graphic */}
            <div className="bg-gray-50/50 rounded-2xl p-4 mb-8 h-[160px] flex items-center justify-center">
               {/* Mock Funnel */}
               <div className="w-full flex flex-col items-center gap-1 relative">
                 <div className="w-full max-w-[140px] h-6 bg-[#5B3DF5] opacity-100 rounded-sm flex items-center justify-center text-[9px] text-white font-bold">120.000</div>
                 <div className="w-full max-w-[110px] h-6 bg-[#5B3DF5] opacity-80 rounded-sm flex items-center justify-center text-[9px] text-white font-bold">45.000</div>
                 <div className="w-full max-w-[80px] h-6 bg-[#5B3DF5] opacity-60 rounded-sm flex items-center justify-center text-[9px] text-white font-bold">18.500</div>
                 <div className="w-full max-w-[50px] h-6 bg-[#5B3DF5] opacity-40 rounded-sm flex items-center justify-center text-[9px] text-white font-bold">3.200</div>
                 
                 <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[9px] font-bold text-gray-500 py-1">
                   <div className="flex items-center gap-2"><div className="w-2 h-[1px] bg-gray-300"></div>{t('analytics.reports.customers.funnel1')}</div>
                   <div className="flex items-center gap-2"><div className="w-2 h-[1px] bg-gray-300"></div>{t('analytics.reports.customers.funnel2')}</div>
                   <div className="flex items-center gap-2"><div className="w-2 h-[1px] bg-gray-300"></div>{t('analytics.reports.customers.funnel3')}</div>
                   <div className="flex items-center gap-2"><div className="w-2 h-[1px] bg-gray-300"></div>{t('analytics.reports.customers.funnel4')}</div>
                 </div>
               </div>
            </div>

            <div className="flex flex-col gap-3 flex-1 mb-8">
              {[
                t('analytics.reports.customers.item1'),
                t('analytics.reports.customers.item2'),
                t('analytics.reports.customers.item3')
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                  <span className="text-[14px] text-gray-600 font-medium">{item}</span>
                </div>
              ))}
            </div>

            <a href="/" className="inline-flex items-center text-[14px] font-bold text-blue-600 hover:text-blue-700 transition-colors mt-auto group">
              {t('analytics.reports.learn_more')}
              <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
