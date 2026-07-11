import { useState, type ReactNode } from 'react';
import { Navbar } from './Navbar';
import { RailContext } from './RailContext';

export function AppLayout({
  children,
  fullBleed = false,
}: {
  children: ReactNode;
  fullBleed?: boolean;
}) {
  const [railOpen, setRailOpen] = useState(false);

  return (
    <div
      className={`flex flex-col bg-gray-50 ${fullBleed ? 'h-screen overflow-hidden' : 'min-h-screen'}`}
    >
      <Navbar railOpen={railOpen} onRailOpenChange={setRailOpen} />
      <RailContext.Provider value={railOpen}>
        <main
          className={
            fullBleed
              ? 'min-h-0 flex-1 overflow-hidden sm:pl-16'
              : 'mx-auto w-full max-w-6xl px-6 py-8 sm:pl-16'
          }
        >
          {children}
        </main>
        {railOpen && (
          <div
            className="fixed inset-x-0 bottom-0 top-16 z-[1140] hidden bg-black/40 sm:block"
            onClick={() => setRailOpen(false)}
          />
        )}
      </RailContext.Provider>
    </div>
  );
}
