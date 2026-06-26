import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User, LogOut, Settings, ShoppingBag, ChevronDown } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

export default function PublicAccountMenu() {
  const { lang } = useLanguage();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (loading) return <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />;

  if (!user) {
    return (
      <button
        onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
        className="flex items-center gap-1.5 text-[#8A8A8A] hover:text-[#F5F0EB] transition-colors"
        title={lang === 'fr' ? 'Connexion' : 'Sign in'}
      >
        <User className="w-4 h-4" />
        <span className="hidden sm:block text-[10px] tracking-widest uppercase">
          {lang === 'fr' ? 'Connexion' : 'Sign in'}
        </span>
      </button>
    );
  }

  const initials = user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 group"
      >
        <div className="w-7 h-7 rounded-full bg-[#C9A96E]/20 border border-[#C9A96E]/30 flex items-center justify-center text-[#C9A96E] text-[10px] font-semibold group-hover:border-[#C9A96E]/60 transition-all">
          {initials}
        </div>
        <ChevronDown className={`w-3 h-3 text-[#8A8A8A] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
          {/* User info */}
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-sm text-[#F5F0EB] font-medium truncate">{user.full_name || user.email}</p>
            <p className="text-[10px] text-[#8A8A8A] truncate">{user.email}</p>
          </div>

          {/* Links */}
          <div className="py-1">
            <Link
              to={createPageUrl('MyAccount')}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#8A8A8A] hover:text-[#F5F0EB] hover:bg-white/5 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              {lang === 'fr' ? 'Mon compte' : 'My account'}
            </Link>
            <Link
              to={createPageUrl('MyOrders')}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#8A8A8A] hover:text-[#F5F0EB] hover:bg-white/5 transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              {lang === 'fr' ? 'Mes commandes' : 'My orders'}
            </Link>
            {(user.role === 'admin') && (
              <Link
                to={createPageUrl('Dashboard')}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#C9A96E] hover:text-[#E0CBA8] hover:bg-[#C9A96E]/5 transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                Ethnic OS ERP
              </Link>
            )}
          </div>

          {/* Logout */}
          <div className="border-t border-white/5 py-1">
            <button
              onClick={() => { base44.auth.logout(); setOpen(false); }}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#8A8A8A] hover:text-red-400 hover:bg-red-400/5 transition-colors w-full"
            >
              <LogOut className="w-3.5 h-3.5" />
              {lang === 'fr' ? 'Déconnexion' : 'Sign out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}