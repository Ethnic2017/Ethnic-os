import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Users, UserCircle } from 'lucide-react';

const TABS = [
  { path: '/Dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/Projects', icon: FolderKanban, label: 'Projets' },
  { path: '/CRM', icon: Users, label: 'CRM' },
  { path: '/MyAccount', icon: UserCircle, label: 'Compte' },
];

export default function BottomTabBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0A]/95 backdrop-blur border-t border-white/5 flex items-center justify-around pb-safe">
      {TABS.map(({ path, icon: Icon, label }) => {
        const active = pathname === path || pathname.startsWith(path + '/');
        return (
          <button
            key={path}
            onClick={() => {
              if (active) {
                // Reset to root path if already on this tab
                navigate(path, { replace: true });
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                navigate(path);
              }
            }}
            className={`flex flex-col items-center gap-1 px-4 py-3 min-w-[44px] min-h-[44px] select-none transition-colors ${
              active ? 'text-[#C9A96E]' : 'text-[#555] hover:text-[#8A8A8A]'
            }`}
          >
            <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
            <span className="text-[9px] tracking-wide uppercase">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}