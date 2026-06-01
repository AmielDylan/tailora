import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import {
  CREDENTIALS_KEY,
  PIN_KEY,
  PIN_ENABLED_KEY,
  LOCK_TIMEOUT_KEY,
  AUTH_KEY,
  LAST_ACTIVE_KEY,
  STORAGE_KEY,
  USER_PROFILE_KEY,
  WORKSHOPS_KEY,
  ACTIVE_WORKSHOP_ID_KEY,
} from '@/constants';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { updateCurrentPassword } from '@/lib/auth';
import { useAccountContext } from '@/context/AccountContext';

type Credentials = {
  phone: string;
  password?: string;
  passwordHash?: string;
  passwordSalt?: string;
  authProvider?: 'firebase' | 'local';
  firebaseUid?: string;
  updatedAt?: string;
};

const TIMEOUT_OPTIONS = [
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 0, label: 'Désactivé' },
];

const PIN_KEYS_PAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

function InlinePinCreate({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const current = step === 'confirm' ? confirmPin : pin;
  const filled = current.length;

  function pressKey(digit: string) {
    if (current.length >= 4) return;
    setError('');
    if (step === 'confirm') setConfirmPin((p) => p + digit);
    else setPin((p) => p + digit);
  }

  function pressDelete() {
    setError('');
    if (step === 'confirm') setConfirmPin((p) => p.slice(0, -1));
    else setPin((p) => p.slice(0, -1));
  }

  useEffect(() => {
    if (step === 'enter' && pin.length === 4) {
      setStep('confirm');
    } else if (step === 'confirm' && confirmPin.length === 4) {
      if (confirmPin === pin) {
        localStorage.setItem(PIN_KEY, pin);
        onCreated();
      } else {
        setError('Les codes ne correspondent pas. Recommencez.');
        setPin('');
        setConfirmPin('');
        setStep('enter');
      }
    }
  }, [pin, confirmPin, step]);

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-foreground">
          {step === 'enter' ? 'Entrez un code à 4 chiffres' : 'Confirmez votre code'}
        </p>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <div className="flex justify-center gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'h-3 w-3 rounded-full border-2 transition-all duration-150',
              i < filled
                ? error ? 'border-destructive bg-destructive' : 'border-foreground bg-foreground'
                : 'border-border bg-transparent',
            )}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 mx-auto max-w-xs">
        {PIN_KEYS_PAD.map((key, i) => {
          if (key === '') return <div key={i} />;
          if (key === 'del') return (
            <button
              key={i}
              onClick={pressDelete}
              aria-label="Effacer"
              className="flex h-12 w-full items-center justify-center rounded-full border border-border bg-secondary text-foreground transition-colors hover:bg-accent active:scale-95"
            >
              ⌫
            </button>
          );
          return (
            <button
              key={i}
              onClick={() => pressKey(key)}
              className="flex h-12 w-full items-center justify-center rounded-full border border-border bg-card text-base font-medium text-foreground shadow-sm transition-colors hover:bg-secondary active:scale-95"
            >
              {key}
            </button>
          );
        })}
      </div>

      <button
        onClick={onCancel}
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
      >
        Annuler
      </button>
    </div>
  );
}

export function ProfilePage() {
  const storedCreds = JSON.parse(localStorage.getItem(CREDENTIALS_KEY) ?? '{}') as Partial<Credentials>;
  const { profile, saveProfile } = useAccountContext();

  const [firstName, setFirstName] = useState(profile?.firstName ?? '');
  const [lastName, setLastName] = useState(profile?.lastName ?? '');
  const [profileMsg, setProfileMsg] = useState('');
  const [phone, setPhone] = useState(storedCreds.phone ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [identityMsg, setIdentityMsg] = useState('');

  const [pinEnabled, setPinEnabled] = useState(localStorage.getItem(PIN_ENABLED_KEY) === 'true');
  const [lockTimeout, setLockTimeout] = useState(Number(localStorage.getItem(LOCK_TIMEOUT_KEY) ?? 10));
  const [showPinCreate, setShowPinCreate] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);

  function savePersonalProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg('');

    const trimFirstName = firstName.trim();
    const trimLastName = lastName.trim();
    if (!trimFirstName || !trimLastName) {
      setProfileMsg('Le prénom et le nom sont requis.');
      return;
    }

    saveProfile({ firstName: trimFirstName, lastName: trimLastName });
    setProfileMsg('Profil mis à jour.');
  }

  async function saveIdentity(e: React.FormEvent) {
    e.preventDefault();
    setIdentityMsg('');
    const trimPhone = phone.trim();
    if (!trimPhone) { setIdentityMsg('Le numéro est requis.'); return; }

    if (newPassword.trim() && newPassword.trim().length < 6) {
      setIdentityMsg('Le nouveau mot de passe doit contenir au moins 6 caractères.'); return;
    }
    if (newPassword.trim() && newPassword.trim() !== confirmPassword.trim()) {
      setIdentityMsg('Les mots de passe ne correspondent pas.'); return;
    }

    if (newPassword.trim()) {
      try {
        await updateCurrentPassword(newPassword.trim());
      } catch {
        setIdentityMsg('Impossible de mettre à jour le mot de passe pour le moment.');
        return;
      }
    }

    const latest = JSON.parse(localStorage.getItem(CREDENTIALS_KEY) ?? '{}') as Partial<Credentials>;
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify({
      ...latest,
      phone: trimPhone,
      updatedAt: new Date().toISOString(),
    }));
    setNewPassword('');
    setConfirmPassword('');
    setIdentityMsg('Profil mis à jour.');
  }

  function togglePin(enabled: boolean) {
    if (enabled) {
      setShowPinCreate(true);
    } else {
      localStorage.removeItem(PIN_KEY);
      localStorage.setItem(PIN_ENABLED_KEY, 'false');
      setPinEnabled(false);
    }
  }

  function handlePinCreated() {
    localStorage.setItem(PIN_ENABLED_KEY, 'true');
    setPinEnabled(true);
    setShowPinCreate(false);
  }

  function updateTimeout(value: number) {
    setLockTimeout(value);
    localStorage.setItem(LOCK_TIMEOUT_KEY, String(value));
  }

  function deleteAccount() {
    localStorage.removeItem(CREDENTIALS_KEY);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(PIN_KEY);
    localStorage.removeItem(PIN_ENABLED_KEY);
    localStorage.removeItem(LOCK_TIMEOUT_KEY);
    localStorage.removeItem(LAST_ACTIVE_KEY);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_PROFILE_KEY);
    localStorage.removeItem(WORKSHOPS_KEY);
    localStorage.removeItem(ACTIVE_WORKSHOP_ID_KEY);
    window.location.reload();
  }

  return (
    <>
      <PageHeader title="Profil" />
      <div className="mx-auto max-w-lg px-4 py-6 space-y-6">

        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Profil personnel</h3>
          <form onSubmit={savePersonalProfile} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">Prénom</label>
                <input
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); setProfileMsg(''); }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">Nom</label>
                <input
                  value={lastName}
                  onChange={(e) => { setLastName(e.target.value); setProfileMsg(''); }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            {profileMsg && (
              <p className={`text-sm ${profileMsg.includes('mis à jour') ? 'text-muted-foreground' : 'text-destructive'}`}>
                {profileMsg}
              </p>
            )}
            <button
              type="submit"
              className="w-full rounded-full bg-foreground py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
            >
              Enregistrer le profil
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Connexion</h3>
          <form onSubmit={saveIdentity} className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Numéro de téléphone</label>
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setIdentityMsg(''); }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Nouveau mot de passe</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={newPassword}
                  placeholder="Laisser vide pour conserver l'actuel"
                  onChange={(e) => { setNewPassword(e.target.value); setIdentityMsg(''); }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {newPassword && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setIdentityMsg(''); }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}
            {identityMsg && (
              <p className={`text-sm ${identityMsg.includes('mis à jour') ? 'text-emerald-600' : 'text-destructive'}`}>
                {identityMsg}
              </p>
            )}
            <button
              type="submit"
              className="w-full rounded-full bg-foreground py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
            >
              Enregistrer
            </button>
          </form>
        </section>

        {/* Section verrouillage PIN */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Verrouillage PIN</h3>

          {/* Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Activer le code PIN</p>
              <p className="text-xs text-muted-foreground">Protège l'app après inactivité ou au clic "Verrouiller"</p>
            </div>
            <button
              role="switch"
              aria-checked={pinEnabled}
              onClick={() => togglePin(!pinEnabled)}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                pinEnabled ? 'bg-foreground' : 'bg-input',
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg transition-transform',
                  pinEnabled ? 'translate-x-5' : 'translate-x-0',
                )}
              />
            </button>
          </div>

          {pinEnabled && !showPinCreate && (
            <>
              {/* Lock timeout */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Délai d'auto-verrouillage</p>
                <div className="flex flex-wrap gap-2">
                  {TIMEOUT_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => updateTimeout(value)}
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                        lockTimeout === value
                          ? 'bg-foreground text-background'
                          : 'border border-border text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Change PIN */}
              <button
                onClick={() => setShowPinCreate(true)}
                className="w-full rounded-full border border-border py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Modifier le code PIN
              </button>
            </>
          )}

          {showPinCreate && (
            <InlinePinCreate
              onCreated={handlePinCreated}
              onCancel={() => { setShowPinCreate(false); if (!localStorage.getItem(PIN_KEY)) setPinEnabled(false); }}
            />
          )}
        </section>

        {/* Section danger */}
        <section className="rounded-xl border border-destructive/30 bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold text-destructive">Zone de danger</h3>
          <p className="text-xs text-muted-foreground">La suppression du profil efface toutes les données locales. Cette action est irréversible.</p>
          <button
            onClick={() => setDeleteOpen(true)}
            className="w-full rounded-full border border-destructive/50 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            Supprimer mon profil
          </button>
        </section>
      </div>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer votre profil ?</DialogTitle>
            <DialogDescription>
              Toutes vos données (clients, commandes, paramètres) seront effacées définitivement. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <button
              onClick={() => setDeleteOpen(false)}
              className="flex-1 rounded-full border border-border py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Annuler
            </button>
            <button
              onClick={deleteAccount}
              className="flex-1 rounded-full bg-destructive py-2 text-sm font-medium text-white transition-opacity hover:opacity-80"
            >
              Supprimer définitivement
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
