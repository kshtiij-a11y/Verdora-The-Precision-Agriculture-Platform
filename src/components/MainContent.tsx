
"use client";

import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';

export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't render the main Header and Sidebar on the landing, role selection, or farmer portal pages
  if (pathname === '/' || pathname === '/role-selection' || pathname.startsWith('/farmer')) {
    return <>{children}</>;
  }

  // This is the layout for the Admin Portal
  return (
    <>
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </>
  );
}
