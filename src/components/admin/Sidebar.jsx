import React, { useState } from 'react';
import EthnicLogo from '../public/EthnicLogo';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '../LanguageContext';
import {
  LayoutDashboard, FolderKanban, Users,
  ShoppingBag, Package, Globe, ChevronLeft, ChevronRight, LogOut, Menu, X,
  FileText, Search, ImageIcon, ExternalLink, UserCog, User, Sofa
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { usePermissions } from '../usePermissions';

// Each nav item can declare which module permission key it requires
// If no permKey → always visible (dashboard, search, etc.)
// adminOnly → only admin (platform role)
// managerPlus → manager or admin account_type
const navGroups = [
  {
    label: 'Operations',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
      { key: 'search', label: 'Search', icon: Search, page: 'GlobalSearch' },
    ]
  },
  {
    label: 'Production',
    items: [
      { key: 'projects', label: 'Projects', icon: FolderKanban, page: 'Projects' },
    ]
  },
  {
    label: 'Community',
    items: [
      { key: 'crm', label: 'Contacts', icon: Users, page: 'CRM' },
    ]
  },
  {
    label: 'Boutique',
    items: [
      { key: 'souq', label: 'Souq', icon: ShoppingBag, page: 'Products' },
      { key: 'orders', label: 'Orders', icon: Package, page: 'Orders' },
      { key: 'inventaire', label: 'Inventaire', icon: Sofa, page: 'Inventaire' },
    ]
  },
  {
    label: 'Communication',
    items: [
      { key: 'content', label: 'Contenu', icon: FileText, page: 'Content' },
    ]
  },
  {
    label: 'Website',
    items: [
      { key: 'websitemanager', label: 'Gérer le site', icon: Globe, page: 'WebsiteManager' },
      { key: 'media', label: 'Médiathèque', icon: ImageIcon, page: 'MediaLibrary' },
      { key: 'website', label: 'Voir le site', icon: ExternalLink, page: 'PublicHome' },
    ]
  },
  {
    label: 'System',
    adminOnly: true,
    items: [
      { key: 'usermanagement', label: 'Users & Perms', icon: UserCog, page: 'UserManagement' },
    ]
  },
];

export default function Sidebar({ currentPage }) {
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, permissions, can, isAdmin } = usePermissions();

  const isManagerPlus = isAdmin ||
    permissions?.account_type === 'manager' ||
    permissions?.account_type === 'admin';

  const handleLogout = () => {
    base44.auth.logout(createPageUrl('PublicHome'));
  };

  const isItemVisible = (item) => {
    if (!item.permKey) return true; // no restriction
    if (isAdmin) return true;
    return can(item.permKey.replace('_access', ''), 'read_only');
  };

  const isGroupVisible = (group) => {
    if (group.adminOnly && !isAdmin) return false;
    if (group.managerPlus && !isManagerPlus) return false;
    // Check if at least one item in the group is visible
    return group.items.some(item => isItemVisible(item));
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 flex items-center gap-2 border-b border-white/5">
        {collapsed ? (
          <EthnicLogo size={28} showText={false} />
        ) : (
          <div className="flex items-center gap-2">
            <EthnicLogo size={32} showText={false} />
            <div>
              <span className="text-[#F5F0EB] font-display text-sm tracking-[0.2em] uppercase">Ethnic OS</span>
              <p className="text-[9px] text-[#8A8A8A] tracking-wider">ERP Platform</p>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-4">
        {navGroups.filter(isGroupVisible).map(group => {
          const visibleItems = group.items.filter(isItemVisible);
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label}>
              {!collapsed && (
                <p className="text-[9px] text-[#8A8A8A]/50 uppercase tracking-widest font-semibold px-3 mb-1">{group.label}</p>
              )}
              <div className="space-y-0.5">
                {visibleItems.map(item => {
                  const isActive = currentPage === item.page;
                  return (
                    <Link
                      key={item.key}
                      to={createPageUrl(item.page)}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                        isActive
                          ? 'bg-[#C9A96E]/10 text-[#C9A96E]'
                          : 'text-[#8A8A8A] hover:text-[#F5F0EB] hover:bg-white/5'
                      }`}
                    >
                      <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#C9A96E]' : 'group-hover:text-[#F5F0EB]'}`} />
                      {!collapsed && <span className="text-sm">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom: user + logout */}
      <div className="p-3 border-t border-white/5 space-y-1">
        {/* User identity */}
        {!collapsed && user && (
          <Link
            to={createPageUrl('MyAccount')}
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#8A8A8A] hover:text-[#F5F0EB] hover:bg-white/5 transition-all"
          >
            <div className="w-6 h-6 rounded-full bg-[#C9A96E]/10 border border-[#C9A96E]/20 flex items-center justify-center text-[#C9A96E] text-[10px] font-semibold flex-shrink-0">
              {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#F5F0EB] truncate">{user.full_name || user.email}</p>
              <p className="text-[9px] text-[#555] truncate capitalize">{permissions?.account_type || user.role || 'user'}</p>
            </div>
          </Link>
        )}
        {collapsed && user && (
          <Link to={createPageUrl('MyAccount')} className="flex items-center justify-center p-2 rounded-lg text-[#8A8A8A] hover:text-[#C9A96E] transition-colors">
            <User className="w-4 h-4" />
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#8A8A8A] hover:text-red-400 hover:bg-red-400/5 transition-all w-full"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Déconnexion</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#1A1A1A] rounded-lg border border-white/10"
      >
        {mobileOpen ? <X className="w-5 h-5 text-[#F5F0EB]" /> : <Menu className="w-5 h-5 text-[#F5F0EB]" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside className={`lg:hidden fixed top-0 left-0 z-40 h-full w-64 bg-[#0A0A0A] border-r border-white/5 transform transition-transform ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <NavContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col h-screen sticky top-0 bg-[#0A0A0A] border-r border-white/5 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-56'
      }`}>
        <NavContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-8 w-6 h-6 bg-[#1A1A1A] border border-white/10 rounded-full flex items-center justify-center text-[#8A8A8A] hover:text-[#F5F0EB]"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>
    </>
  );
}