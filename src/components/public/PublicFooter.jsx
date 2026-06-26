import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '../LanguageContext';

export default function PublicFooter() {
  const { lang } = useLanguage();

  return (
    <footer className="bg-[#0A0A0A] border-t border-white/5 px-6 sm:px-12 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <p className="font-display text-[#F5F0EB] tracking-[0.3em] uppercase mb-3 text-sm">ETHNIC</p>
            <p className="text-[#C9A96E] text-[10px] tracking-[0.4em] uppercase mb-4">COMMUNITY</p>
            <p className="text-xs text-[#555] leading-relaxed">
              {lang === 'fr' ? 'Musique · Arts · Culture · Communauté · Paris' : 'Music · Arts · Culture · Community · Paris'}
            </p>
          </div>

          {/* Explore */}
          <div>
            <p className="text-[10px] text-[#8A8A8A] tracking-widest uppercase mb-4">
              {lang === 'fr' ? 'Explorer' : 'Explore'}
            </p>
            <div className="space-y-2">
              {[
                { label: lang === 'fr' ? 'Événements' : 'Events', page: 'PublicEvents' },
                { label: lang === 'fr' ? 'À propos' : 'About', page: 'PublicAbout' },
                { label: 'Souq', page: 'PublicSouq' },
                { label: 'Gallery', page: 'PublicGallery' },
              ].map(l => (
                <Link key={l.page} to={createPageUrl(l.page)} className="block text-xs text-[#555] hover:text-[#8A8A8A] transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Community */}
          <div>
            <p className="text-[10px] text-[#8A8A8A] tracking-widest uppercase mb-4">
              {lang === 'fr' ? 'Communauté' : 'Community'}
            </p>
            <div className="space-y-2">
              {[
                { label: lang === 'fr' ? 'Rejoindre' : 'Join us', page: 'JoinCommunity' },
                { label: lang === 'fr' ? 'Contact' : 'Contact', page: 'PublicContact' },
                { label: lang === 'fr' ? 'Mon compte' : 'My account', page: 'MyAccount' },
              ].map(l => (
                <Link key={l.page} to={createPageUrl(l.page)} className="block text-xs text-[#555] hover:text-[#8A8A8A] transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="text-[10px] text-[#8A8A8A] tracking-widest uppercase mb-4">Contact</p>
            <div className="space-y-2">
              <a href="mailto:contact@ethnic-community.org" className="block text-xs text-[#555] hover:text-[#8A8A8A] transition-colors">
                contact@ethnic-community.org
              </a>
              <a href="https://instagram.com/ethnic_community_" target="_blank" rel="noreferrer" className="block text-xs text-[#555] hover:text-[#8A8A8A] transition-colors">
                @ethnic_community_
              </a>
              <p className="text-xs text-[#555]">Paris, France</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-[#333] tracking-wider">
            © {new Date().getFullYear()} Ethnic Community. All rights reserved.
          </p>
          <p className="text-[10px] text-[#222] tracking-wider">
            Powered by Ethnic OS
          </p>
        </div>
      </div>
    </footer>
  );
}