import { createContext, useContext, type ReactNode } from 'react';
import { useNavigation } from '@/hooks/useNavigation';

type NavigationContextValue = ReturnType<typeof useNavigation>;

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const value = useNavigation();
  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigationContext(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigationContext must be used within NavigationProvider');
  return ctx;
}
