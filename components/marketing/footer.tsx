'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <Image src="/Topify-logo.png" alt="Topify Logo" width={200} height={56} className="h-12 w-auto object-contain" unoptimized />
            </Link>
            <p className="text-gray-600 text-sm leading-relaxed max-w-xs">
              {t('footer.desc')}
            </p>
          </div>
          
          <div>
            <h4 className="text-gray-900 font-semibold mb-6">{t('footer.products')}</h4>
            <ul className="space-y-4 text-sm text-gray-600">
              <li><Link href="/products/analytics" className="hover:text-blue-600 transition-colors">Topify Analytics</Link></li>
              <li><Link href="/products/social" className="hover:text-blue-600 transition-colors">Topify Social</Link></li>
              <li><Link href="/products/crm" className="hover:text-blue-600 transition-colors">Topify CRM</Link></li>
              <li><Link href="/products/work" className="hover:text-blue-600 transition-colors">Topify Work</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-gray-900 font-semibold mb-6">{t('footer.resources')}</h4>
            <ul className="space-y-4 text-sm text-gray-600">
              <li><Link href="/" className="hover:text-blue-600 transition-colors">{t('footer.blog')}</Link></li>
              <li><Link href="/" className="hover:text-blue-600 transition-colors">{t('footer.help')}</Link></li>
              <li><Link href="/" className="hover:text-blue-600 transition-colors">{t('footer.community')}</Link></li>
              <li><Link href="/" className="hover:text-blue-600 transition-colors">{t('footer.webinar')}</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-gray-900 font-semibold mb-6">{t('footer.company')}</h4>
            <ul className="space-y-4 text-sm text-gray-600">
              <li><Link href="/" className="hover:text-blue-600 transition-colors">{t('footer.about')}</Link></li>
              <li><Link href="/" className="hover:text-blue-600 transition-colors">{t('footer.careers')}</Link></li>
              <li><Link href="/" className="hover:text-blue-600 transition-colors">{t('footer.security')}</Link></li>
              <li><Link href="/" className="hover:text-blue-600 transition-colors">{t('footer.terms')}</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            {t('footer.copyright').replace('{year}', currentYear.toString())}
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
              <span className="sr-only">Facebook</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
              <span className="sr-only">Twitter</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
