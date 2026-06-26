import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

// Pages that are "child/detail" routes — show back button
const DETAIL_ROUTES = ['/ProjectDetail', '/EventDetail', '/PersonDetail', '/ContactDetail'];

const ROUTE_LABELS = {
  '/ProjectDetail': 'Projet',
  '/EventDetail': 'Événement',
  '/PersonDetail': 'Contact',
};

export default function MobileHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isDetail = DETAIL_ROUTES.some(r => pathname.startsWith(r));

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center px-4 bg-[#0A0A0A]/95 backdrop-blur border-b border-white/5 pt-safe" style={{ height: 'calc(52px + env(safe-area-inset-top))' }}>
      {isDetail ? (
        <>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-[#C9A96E] select-none -ml-1 pr-3"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Retour</span>
          </button>
          <span className="text-sm font-medium text-[#F5F0EB] ml-auto mr-auto pr-16">
            {ROUTE_LABELS[pathname] || ''}
          </span>
        </>
      ) : (
        <span className="font-display text-[#C9A96E] tracking-[0.15em] text-sm mx-auto">ETHNIC</span>
      )}
    </header>
  );
}