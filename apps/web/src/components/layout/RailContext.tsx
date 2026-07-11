import { createContext, useContext, useState, type ReactNode } from 'react';

interface RailContextValue {
  railOpen: boolean;
  setRailOpen: (open: boolean) => void;
}

const RailContext = createContext<RailContextValue>({
  railOpen: false,
  setRailOpen: () => {},
});

export function RailProvider({ children }: { children: ReactNode }) {
  const [railOpen, setRailOpen] = useState(false);
  return <RailContext.Provider value={{ railOpen, setRailOpen }}>{children}</RailContext.Provider>;
}

export function useRail() {
  return useContext(RailContext);
}

export function useRailOpen() {
  return useContext(RailContext).railOpen;
}
