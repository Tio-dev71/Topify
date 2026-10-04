'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import vi from './vi.json';
import en from './en.json';

export type Language = 'vi' | 'en';

const dictionaries: Record<Language, Record<string, string>> = { vi, en };

const LANGUAGE_STORAGE_KEY = 'topify_language';

const detectLanguage = (): Language => {
  if (typeof window === 'undefined') return 'vi';

  const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
  if (saved && dictionaries[saved]) return saved;

  // Default to Vietnamese for Topify's primary audience unless explicitly set
  return 'vi';
};

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('vi');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLanguageState(detectLanguage());
    setMounted(true);
  }, []);

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
      document.documentElement.lang = nextLanguage;
    }
  };

  useEffect(() => {
    if (mounted) document.documentElement.lang = language;
  }, [language, mounted]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t: (key: string) => dictionaries[language]?.[key] || dictionaries.vi[key] || key,
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'vi', label: 'VI', flag: '🇻🇳' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
];
