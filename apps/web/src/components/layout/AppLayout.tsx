import type { ReactNode } from 'react';
import { Navbar } from './Navbar';

export function AppLayout({
  children,
  fullBleed = false,
}: {
  children: ReactNode;
  fullBleed?: boolean;
}) {
  return (
    <div
      className={`flex flex-col bg-gray-50 ${fullBleed ? 'h-screen overflow-hidden' : 'min-h-screen'}`}
    >
      <Navbar />
      <main
        className={
          fullBleed ? 'min-h-0 flex-1 overflow-hidden' : 'mx-auto w-full max-w-6xl px-6 py-8'
        }
      >
        {children}
      </main>
    </div>
  );
}
