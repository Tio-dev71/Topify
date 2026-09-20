'use client';

import { motion } from 'framer-motion';
import { LayoutGrid, Calendar, Folder, BarChart2, Users, Check, Star, Plus, Search, ChevronDown, Globe, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function SocialFeatures() {
  const { t } = useLanguage();
  const tabs = [
    { name: t('social.features.tab1'), icon: <LayoutGrid className="w-4 h-4" />, active: true },
    { name: t('social.features.tab2'), icon: <Calendar className="w-4 h-4" /> },
    { name: t('social.features.tab3'), icon: <Folder className="w-4 h-4" /> },
    { name: t('social.features.tab4'), icon: <BarChart2 className="w-4 h-4" /> },
    { name: t('social.features.tab5'), icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="py-24 bg-gray-50 overflow-hidden">
      <div className="max-w-[1350px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight"
            dangerouslySetInnerHTML={{ __html: t('social.features.title') }}
          />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-16">
          {tabs.map((tab, idx) => (
            <button
              key={idx}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all ${
                tab.active 
                  ? 'bg-white text-[#5B3DF5] shadow-[0_4px_20px_rgba(91,61,245,0.1)]' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </div>

        {/* Feature Detail Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
          
          {/* Left: Text & Features */}
          <div className="max-w-xl">
            <h3 className="text-3xl font-bold text-gray-900 mb-8 leading-tight">
              {t('social.features.subtitle')}
            </h3>
            
            <div className="space-y-6 mb-10">
              {[
                { title: t('social.features.p1.title'), desc: t('social.features.p1.desc') },
                { title: t('social.features.p2.title'), desc: t('social.features.p2.desc') },
                { title: t('social.features.p3.title'), desc: t('social.features.p3.desc') },
                { title: t('social.features.p4.title'), desc: t('social.features.p4.desc') },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-[#5B3DF5]" />
                  </div>
                  <div>
                    <p className="text-[15px] text-gray-900">
                      <span className="font-semibold">{item.title}</span> {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#5B3DF5]/5 border border-[#5B3DF5]/10 rounded-2xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#5B3DF5] flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 text-white fill-white" />
              </div>
              <p className="text-[15px] font-medium text-[#5B3DF5] leading-relaxed">
                {t('social.features.highlight')}
              </p>
            </div>
          </div>

          {/* Right: UI Mockup */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-purple-50 transform rounded-3xl -rotate-3 scale-[1.02] -z-10"></div>
            
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 flex flex-col sm:flex-row gap-8">
              
              {/* Vertical Icons Nav */}
              <div className="flex flex-row sm:flex-col gap-4 border-b sm:border-b-0 sm:border-r border-gray-100 pb-4 sm:pb-0 sm:pr-6 shrink-0 overflow-x-auto">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                  <div className="w-5 h-5 font-bold flex items-center justify-center text-[10px]">f</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center shrink-0 text-white">
                  <div className="w-5 h-5 font-bold flex items-center justify-center text-[10px]">t</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 flex items-center justify-center shrink-0 text-white">
                  <div className="w-5 h-5 font-bold flex items-center justify-center text-[10px]">i</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shrink-0 text-white">
                  <div className="w-5 h-5 font-bold flex items-center justify-center text-[10px]">▶</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shrink-0 text-white">
                  <div className="w-5 h-5 font-bold flex items-center justify-center text-[10px]">Z</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-500">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center shrink-0 text-gray-400 mt-auto">
                  <Plus className="w-5 h-5" />
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-lg font-bold text-gray-900">{t('social.mockup.features.channels')}</h4>
                  <button className="bg-[#5B3DF5] text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md">
                    <Plus className="w-3.5 h-3.5" /> {t('social.mockup.features.btn_connect')}
                  </button>
                </div>
                
                <div className="flex gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder={t('social.mockup.features.search_placeholder')} className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none" />
                  </div>
                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm flex items-center gap-2 cursor-pointer text-gray-600 font-medium">
                    {t('social.mockup.features.filter_all')} <ChevronDown className="w-4 h-4" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Channel Cards */}
                  {[
                    { n: 'Topify Official', t: 'Facebook Page', f: `32.5K ${t('social.mockup.features.followers')}`, bg: 'bg-blue-500', i: 'f' },
                    { n: 'Topify Shop', t: 'TikTok Account', f: `76.1K ${t('social.mockup.features.followers')}`, bg: 'bg-black', i: 't' },
                    { n: 'Topify Vietnam', t: 'Instagram Business', f: `12.3K ${t('social.mockup.features.followers')}`, bg: 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500', i: 'i' },
                    { n: 'Topify Channel', t: 'YouTube Channel', f: `45.2K ${t('social.mockup.features.subscribers')}`, bg: 'bg-red-600', i: '▶' },
                    { n: 'Topify Zalo OA', t: 'Zalo Official Account', f: `18.7K ${t('social.mockup.features.interested')}`, bg: 'bg-blue-500', i: 'Z' },
                    { n: 'Topify Website', t: 'Website/Blog', f: '--', bg: 'bg-gray-800', i: 'W' },
                  ].map((ch, idx) => (
                    <div key={idx} className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow relative group">
                      <div className="absolute top-3 right-3 text-gray-300 group-hover:text-gray-500 cursor-pointer">
                        <Plus className="w-4 h-4 rotate-45" /> {/* Use plus rotated as close/options */}
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-8 h-8 rounded-full ${ch.bg} flex items-center justify-center text-white shrink-0`}>
                          <span className="font-bold text-[10px]">{ch.i}</span>
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-[13px] font-bold text-gray-900 truncate">{ch.n}</h5>
                          <p className="text-[11px] text-gray-500 truncate">{ch.t}</p>
                        </div>
                      </div>
                      <div className="text-[11px] text-gray-500 mb-3">{ch.f}</div>
                      <div className="inline-flex px-2 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded">
                        {t('social.mockup.features.status_active')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow group">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-[17px] font-bold text-gray-900 mb-3">{t('social.features.c1.title')}</h4>
            <p className="text-[14px] text-gray-600 mb-6 leading-relaxed">
              {t('social.features.c1.desc')}
            </p>
            <Link href="/" className="inline-flex items-center text-[13px] font-bold text-[#5B3DF5] hover:text-[#4F2FE0]">
              {t('social.features.btn_learn_more')} <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow group">
            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 mb-6 group-hover:scale-110 transition-transform">
              <Folder className="w-6 h-6 fill-teal-600/20" />
            </div>
            <h4 className="text-[17px] font-bold text-gray-900 mb-3">{t('social.features.c2.title')}</h4>
            <p className="text-[14px] text-gray-600 mb-6 leading-relaxed">
              {t('social.features.c2.desc')}
            </p>
            <Link href="/" className="inline-flex items-center text-[13px] font-bold text-[#5B3DF5] hover:text-[#4F2FE0]">
              {t('social.features.btn_learn_more')} <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
              <BarChart2 className="w-6 h-6" />
            </div>
            <h4 className="text-[17px] font-bold text-gray-900 mb-3">{t('social.features.c3.title')}</h4>
            <p className="text-[14px] text-gray-600 mb-6 leading-relaxed">
              {t('social.features.c3.desc')}
            </p>
            <Link href="/" className="inline-flex items-center text-[13px] font-bold text-[#5B3DF5] hover:text-[#4F2FE0]">
              {t('social.features.btn_learn_more')} <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow group">
            <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600 mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-[17px] font-bold text-gray-900 mb-3">{t('social.features.c4.title')}</h4>
            <p className="text-[14px] text-gray-600 mb-6 leading-relaxed">
              {t('social.features.c4.desc')}
            </p>
            <Link href="/" className="inline-flex items-center text-[13px] font-bold text-[#5B3DF5] hover:text-[#4F2FE0]">
              {t('social.features.btn_learn_more')} <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
