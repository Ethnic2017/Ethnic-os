import React from 'react';
import { LanguageProvider } from './components/LanguageContext';
import Sidebar from './components/admin/Sidebar';
import BottomTabBar from './components/mobile/BottomTabBar';
import MobileHeader from './components/mobile/MobileHeader';
import { base44 } from '@/api/base44Client';

// Pages that are publicly accessible (no login required)
const publicPages = [
  'PublicHome', 'PublicEvents', 'PublicAbout', 'PublicGallery',
  'PublicContact', 'PublicSouq', 'JoinCommunity', 'PublicWatch',
  'MyAccount', 'MyOrders', 'PostLogin'
];

// Pages that require login but NOT necessarily module permissions
// (i.e. any logged-in user can see them)
const privateBasicPages = ['MyAccount', 'MyOrders', 'PostLogin'];



export default function Layout({ children, currentPageName }) {
  const isPublic = publicPages.includes(currentPageName);

  if (isPublic) {
    return (
      <LanguageProvider>
        <div className="min-h-screen bg-[#0A0A0A]">
          {children}
        </div>
      </LanguageProvider>
    );
  }

  // Private ERP pages — show sidebar
  return (
    <LanguageProvider>
      <div className="flex min-h-screen bg-[#0A0A0A]">
        <MobileHeader />
        <Sidebar currentPage={currentPageName} />
        <main className="flex-1 p-4 md:p-8 lg:pl-8 pt-16 lg:pt-8 pb-24 lg:pb-8 overflow-auto">
          {children}
        </main>
        <BottomTabBar />
      </div>
    </LanguageProvider>
  );
}