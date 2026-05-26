import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formatBeninPhone,
  fullBeninPhone,
  hasStoredAccount,
  isValidBeninPhone,
  loginWithPhonePassword,
  registerWithPhonePassword,
} from '@/lib/auth';

const BG_IMAGES = ['/images/tailor_men.webp', '/images/tailor_women.webp'];
const BENIN_DIAL_CODE = '+229';

type Props = { onSuccess: () => void };

export function PhoneAuthScreen({ onSuccess }: Props) {
  const isRegistration = !hasStoredAccount();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [imgIndex, setImgIndex] = useState(() => Math.floor(Math.random() * BG_IMAGES.length));

  useEffect(() => {
    const id = setInterval(() => setImgIndex((i) => (i + 1) % BG_IMAGES.length), 8000);
    return () => clearInterval(id);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const trimPhone = formatBeninPhone(phone);
    const trimPass = password.trim();

    if (!trimPhone) { setError('Entrez votre numéro de téléphone.'); return; }
    if (!isValidBeninPhone(trimPhone)) { setError('Entrez un numéro béninois valide au format 01 90 00 00 00.'); return; }
    if (trimPass.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return; }

    setLoading(true);
    try {
      if (isRegistration) {
        if (trimPass !== confirm.trim()) { setError('Les mots de passe ne correspondent pas.'); return; }
        await registerWithPhonePassword(fullBeninPhone(phone), trimPass);
      } else {
        await loginWithPhonePassword(fullBeninPhone(phone), trimPass);
      }
      onSuccess();
    } catch (authError) {
      if ((authError as Error).message === 'INVALID_CREDENTIALS') {
        setError('Numéro ou mot de passe incorrect.');
      } else {
        setError('Impossible de se connecter pour le moment. Réessayez dans un instant.');
      }
    } finally {
      setLoading(false);
    }
  }

  const title = isRegistration ? 'Créer votre compte' : 'Bon retour';
  const subtitle = isRegistration
    ? 'Créez votre accès Tailora avec votre numéro.'
    : 'Connectez-vous avec votre numéro et votre mot de passe.';

  return (
    <div className="relative h-screen overflow-hidden lg:flex">
      <div className="absolute inset-0 lg:hidden">
        {BG_IMAGES.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            className={cn(
              'absolute inset-0 h-full w-full object-cover transition-opacity duration-700',
              i === imgIndex ? 'opacity-100' : 'opacity-0',
            )}
          />
        ))}
        <div className="absolute inset-0 bg-black/25" />
      </div>
      <div className="relative z-10 flex h-full flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-8 sm:px-8 lg:bg-background lg:py-12">
        <div className="w-full max-w-sm space-y-8 rounded-xl border border-white/40 bg-background/90 p-6 shadow-xl shadow-black/15 backdrop-blur-md supports-[backdrop-filter]:bg-background/90 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              Tailora
            </h1>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Numéro de téléphone</label>
              <div className="flex overflow-hidden rounded-lg border border-border bg-background focus-within:ring-2 focus-within:ring-ring">
                <div
                  aria-label="Indicatif Bénin"
                  className="flex shrink-0 items-center gap-2 border-r border-border bg-muted px-3 text-sm font-medium text-foreground"
                >
                  <span
                    aria-hidden="true"
                    className="grid h-3.5 w-5 grid-cols-[2fr_3fr] grid-rows-2 overflow-hidden rounded-[2px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]"
                  >
                    <span className="row-span-2 bg-[#008751]" />
                    <span className="bg-[#fcd116]" />
                    <span className="bg-[#e8112d]" />
                  </span>
                  <span>{BENIN_DIAL_CODE}</span>
                </div>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="01 97 00 00 00"
                  value={phone}
                  onChange={(e) => { setPhone(formatBeninPhone(e.target.value)); setError(''); }}
                  className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isRegistration ? 'new-password' : 'current-password'}
                  placeholder="6 caractères minimum"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {isRegistration && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">Confirmer le mot de passe</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Répétez le mot de passe"
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setError(''); }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showConfirm ? 'Masquer' : 'Afficher'}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-foreground py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Veuillez patienter...' : isRegistration ? 'Créer mon compte' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>

      <div className="relative hidden lg:block lg:w-1/2">
        {BG_IMAGES.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            className={cn(
              'absolute inset-0 h-full w-full object-cover transition-opacity duration-700',
              i === imgIndex ? 'opacity-100' : 'opacity-0',
            )}
          />
        ))}
        <div className="absolute inset-0 bg-black/10" />
      </div>
    </div>
  );
}
