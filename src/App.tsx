import { useState } from 'react';
import { AUTH_KEY, PIN_KEY } from '@/constants';
import { PinScreen } from '@/components/PinScreen';
import { AppDataProvider } from '@/context/AppDataContext';
import { NavigationProvider } from '@/context/NavigationContext';
import { PageRouter } from '@/components/layout/PageRouter';

export function App() {
  const [authenticated, setAuthenticated] = useState(() => localStorage.getItem(AUTH_KEY) === 'true');
  const pinExists = Boolean(localStorage.getItem(PIN_KEY));

  function lock() {
    localStorage.removeItem(AUTH_KEY);
    setAuthenticated(false);
  }

  if (!authenticated) {
    return (
      <PinScreen
        mode={pinExists ? 'unlock' : 'create'}
        onSuccess={() => setAuthenticated(true)}
      />
    );
  }

  return (
    <AppDataProvider>
      <NavigationProvider>
        <PageRouter onLock={lock} />
      </NavigationProvider>
    </AppDataProvider>
  );
}
