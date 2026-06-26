import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '../LanguageContext';
import EthnicLogo from './EthnicLogo';
import { base44 } from '@/api/base44Client';
import { Menu, X, User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';

const NAV_LINKS = [
  { key: 'home', page: 'PublicHome' },
  { key: 'events', page: 'PublicEvents' },
  { key: 'gallery', page: 'PublicGallery' },
  { key: 'videos', page: 'PublicWatch' },
  { key: 'label', page: 'PublicAbout' },
  { key: 'souq', page: 'PublicSouq' },
  { key: 'contact', page: 'PublicContact' },
];

export default function PublicNav() {
  const { lang, setLang, t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(undefined); // undefined = loading, null = not logged in
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => setUser(null));
  }, []);

  // Close account dropdown on outside click
  useEffect(() => {
    if (!accountOpen) return;
    const handler = () => setAccountOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [accountOpen]);

  const handleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl('PostLogin'));
  };

  const handleLogout = () => {
    base44.auth.logout(createPageUrl('PublicHome'));
  };

  const initials = user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled || mobileOpen
          ? 'bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/5'
          : 'bg-gradient-to-b from-[#0A0A0A]/80 to-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to={createPageUrl('PublicHome')} className="flex items-center gap-2 group">
            <EthnicLogo size={28} showText={false} />
            <div>
              <span className="text-[#F5F0EB] font-display text-xs tracking-[0.25em] uppercase group-hover:text-[#C9A96E] transition-colors">
                ETHNIC
              </span>
              <p className="text-[8px] text-[#555] tracking-[0.3em] uppercase leading-none">Community</p>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.key}
                to={createPageUrl(link.page)}
                className="px-3 py-1.5 text-[11px] text-[#8A8A8A] hover:text-[#F5F0EB] tracking-[0.15em] uppercase transition-colors"
              >
                {t(link.key)}
              </Link>
            ))}
          </div>

          {/* Right: lang + account */}
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
              className="hidden sm:flex px-2.5 py-1 text-[10px] text-[#555] hover:text-[#F5F0EB] tracking-widest uppercase transition-colors border border-white/5 hover:border-white/15 rounded-lg"
            >
              {lang === 'fr' ? 'EN' : 'FR'}
            </button>

            {/* Account button */}
            {user === undefined ? (
              <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
            ) : user ? (
              <div className="relative" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setAccountOpen(!accountOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-[#C9A96E]/20 hover:border-[#C9A96E]/50 bg-[#C9A96E]/5 hover:bg-[#C9A96E]/10 transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-[#C9A96E]/20 flex items-center justify-center text-[#C9A96E] text-[10px] font-semibold">
                    {initials}
                  </div>
                  <span className="hidden sm:block text-[11px] text-[#E0CBA8] tracking-wide max-w-[80px] truncate">
                    {user.full_name || user.email?.split('@')[0]}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-[#8A8A8A] transition-transform ${accountOpen ? 'rotate-180' : ''}`} />
                </button>

                {accountOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-xs text-[#F5F0EB] font-medium truncate">{user.full_name || 'Account'}</p>
                      <p className="text-[10px] text-[#555] truncate">{user.email}</p>
                    </div>
                    <Link
                      to={createPageUrl('MyAccount')}
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-xs text-[#8A8A8A] hover:text-[#F5F0EB] hover:bg-white/5 transition-all"
                    >
                      <User className="w-3.5 h-3.5" />
                      {lang === 'fr' ? 'Mon compte' : 'My account'}
                    </Link>
                    <Link
                      to={createPageUrl('PostLogin')}
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-xs text-[#8A8A8A] hover:text-[#F5F0EB] hover:bg-white/5 transition-all"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      {lang === 'fr' ? 'Espace privé' : 'Private space'}
                    </Link>
                    <div className="border-t border-white/5">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-xs text-red-400/70 hover:text-red-400 hover:bg-red-400/5 transition-all w-full"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        {lang === 'fr' ? 'Déconnexion' : 'Log out'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center gap-2 px-4 py-2 bg-[#C9A96E]/10 border border-[#C9A96E]/30 text-[#C9A96E] rounded-full text-[11px] tracking-[0.15em] uppercase hover:bg-[#C9A96E]/20 hover:border-[#C9A96E]/60 transition-all"
              >
                <User className="w-3.5 h-3.5" />
                {lang === 'fr' ? 'Connexion' : 'Login'}
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-[#8A8A8A] hover:text-[#F5F0EB] transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/5 bg-[#0A0A0A] px-4 py-4 space-y-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.key}
                to={createPageUrl(link.page)}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 text-sm text-[#8A8A8A] hover:text-[#F5F0EB] tracking-widest uppercase transition-colors rounded-lg hover:bg-white/5"
              >
                {t(link.key)}
              </Link>
            ))}
            <div className="pt-3 border-t border-white/5">
              {user ? (
                <>
                  <Link to={createPageUrl('MyAccount')} onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-sm text-[#C9A96E] tracking-wide">
                    {lang === 'fr' ? 'Mon compte' : 'My account'}
                  </Link>
                  <Link to={createPageUrl('PostLogin')} onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-sm text-[#8A8A8A] hover:text-[#F5F0EB] tracking-wide">
                    {lang === 'fr' ? 'Espace privé' : 'Private space'}
                  </Link>
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-2.5 text-sm text-red-400 tracking-wide">
                    {lang === 'fr' ? 'Déconnexion' : 'Log out'}
                  </button>
                </>
              ) : (
                <button onClick={handleLogin} className="w-full px-4 py-2.5 bg-[#C9A96E]/10 border border-[#C9A96E]/20 text-[#C9A96E] rounded-xl text-sm tracking-wide">
                  {lang === 'fr' ? 'Se connecter' : 'Log in'}
                </button>
              )}
              <button
                onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
                className="mt-2 px-4 py-2 text-[10px] text-[#555] hover:text-[#F5F0EB] tracking-widest uppercase"
              >
                {lang === 'fr' ? 'Switch to English' : 'Passer en Français'}
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}