import { useCallback, useEffect, useState } from 'react';
import { AUTH_KEY, PIN_ENABLED_KEY, LAST_ACTIVE_KEY, LOCK_TIMEOUT_KEY } from '@/constants';
import { PhoneAuthScreen } from '@/components/auth/PhoneAuthScreen';
import { PinScreen } from '@/components/PinScreen';
import { AppDataProvider } from '@/context/AppDataContext';
import { NavigationProvider } from '@/context/NavigationContext';
import { AppShell } from '@/components/layout/AppShell';
import { logoutAuth } from '@/lib/auth';

export function App() {
  const [authenticated, setAuthenticated] = useState(() => localStorage.getItem(AUTH_KEY) === 'true');
  const [locked, setLocked] = useState(false);

  function logout() {
    void logoutAuth();
    localStorage.removeItem(LAST_ACTIVE_KEY);
    setLocked(false);
    setAuthenticated(false);
  }

  // ── Surveillance d'inactivité ──────────────────────────────────
  const resetActivity = useCallback(() => {
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
  }, []);

  useEffect(() => {
    if (!authenticated) return;

    const pinEnabled = localStorage.getItem(PIN_ENABLED_KEY) === 'true';
    if (!pinEnabled) return;

    const timeoutMin = Number(localStorage.getItem(LOCK_TIMEOUT_KEY) ?? 10);
    if (timeoutMin === 0) return; // manual lock only

    const events = ['mousemove', 'keydown', 'touchstart', 'click'] as const;
    events.forEach((e) => window.addEventListener(e, resetActivity, { passive: true }));
    resetActivity();

    const interval = setInterval(() => {
      const last = Number(localStorage.getItem(LAST_ACTIVE_KEY) ?? Date.now());
      if (Date.now() - last > timeoutMin * 60_000) {
        setLocked(true);
      }
    }, 30_000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetActivity));
      clearInterval(interval);
    };
  }, [authenticated, resetActivity]);

  // ── Couche 1 : auth complète ────────────────────────────────────
  if (!authenticated) {
    return (
      <PhoneAuthScreen onSuccess={() => setAuthenticated(true)} />
    );
  }

  // ── Couche 2 : PIN lock ─────────────────────────────────────────
  if (locked) {
    return (
      <PinScreen
        mode="unlock"
        onSuccess={() => { setLocked(false); resetActivity(); }}
        onLockout={() => { setAuthenticated(false); setLocked(false); }}
      />
    );
  }

  return (
    <AppDataProvider>
      <NavigationProvider>
        <AppShell
          onLock={() => setLocked(true)}
          onLogout={logout}
          pinEnabled={localStorage.getItem(PIN_ENABLED_KEY) === 'true'}
        />
      </NavigationProvider>
    </AppDataProvider>
  );
}
