import { createContext, useContext } from 'react';

export const RailContext = createContext(false);

export function useRailOpen() {
  return useContext(RailContext);
}
