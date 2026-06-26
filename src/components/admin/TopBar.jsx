import React from 'react';
import { useLanguage } from '../LanguageContext';
import { Button } from '@/components/ui/button';

export default function TopBar({ title, children }) {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <h1 className="text-2xl md:text-3xl font-display text-[#F5F0EB] tracking-wide">{title}</h1>
      <div className="flex items-center gap-3">
        {/* Language toggle */}
        <div className="flex bg-[#1A1A1A] rounded-lg p-0.5 border border-white/5">
          <button
            onClick={() => setLang('fr')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              lang === 'fr' ? 'bg-[#C9A96E] text-[#0A0A0A]' : 'text-[#8A8A8A] hover:text-[#F5F0EB]'
            }`}
          >
            FR
          </button>
          <button
            onClick={() => setLang('en')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              lang === 'en' ? 'bg-[#C9A96E] text-[#0A0A0A]' : 'text-[#8A8A8A] hover:text-[#F5F0EB]'
            }`}
          >
            EN
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}