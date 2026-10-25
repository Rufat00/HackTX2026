import { createContext, useContext } from 'react';

export const ShellSearchContext = createContext('');
export function useShellSearch() {
  return useContext(ShellSearchContext);
}
