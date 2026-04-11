'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isLoginPage = pathname === '/login' || pathname === '/change-password';
  const isSuperAdminPage = pathname.startsWith('/super-admin');

  if (isLoginPage || isSuperAdminPage) {

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-md lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Floating Card Style */}
      <div className={`fixed inset-y-0 left-0 z-50 p-4 transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full w-64 ios-card overflow-hidden">
          <Sidebar onClose={() => setIsSidebarOpen(false)} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden w-full lg:pr-4 lg:py-4">
        <div className="flex flex-1 flex-col overflow-hidden ios-card">
          <Header onMenuClick={() => setIsSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-hide">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
