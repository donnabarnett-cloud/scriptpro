import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useStore } from '@/store';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { focusMode, settings } = useStore();
  const theme = settings?.theme || 'dark';

  if (focusMode) {
    return (
      <div className={`h-screen w-screen ${theme}`}>
        <div className="h-full bg-[var(--bg-primary)] text-[var(--text-primary)]">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen w-screen flex flex-col ${theme}`}>
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden bg-[var(--bg-primary)]">
          {children}
        </main>
      </div>
    </div>
  );
}
