import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import {
  PhoneInput,
  PhoneInputCountrySelect,
  PhoneInputField,
} from '@/components/ui/phone-input';
import { cn } from '@/lib/utils';
import {
  isValidInternationalPhone,
  loginWithPhonePassword,
  normalizeInternationalPhone,
  registerWithPhonePassword,
} from '@/lib/auth';
import {
  isPhoneOtpEnabled,
  phoneVerificationCredential,
  resetPhoneVerifier,
  startPhoneVerification,
} from '@/lib/phone-verification';

const BG_IMAGES = ['/images/tailor_men.webp', '/images/tailor_women.webp'];
const RECAPTCHA_CONTAINER_ID = 'tailora-phone-recaptcha';

type AuthMode = 'login' | 'register';

type Props = {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onSuccess: () => void;
};

function authMessage(code: string, isRegistration: boolean) {
  if (code === 'ACCOUNT_NOT_FOUND') return 'Aucun compte ne correspond à ce numéro.';
  if (code === 'WRONG_PASSWORD') return 'Le mot de passe saisi est incorrect.';
  if (code === 'PHONE_ALREADY_REGISTERED') return 'Un compte existe déjà avec ce numéro. Connectez-vous plutôt.';
  if (code === 'TOO_MANY_ATTEMPTS') return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.';
  if (code === 'NETWORK_ERROR') return 'Connexion impossible. Vérifiez internet puis réessayez.';
  if (code === 'FIREBASE_NOT_CONFIGURED') return 'La vérification téléphone n’est pas encore configurée.';
  if (code === 'auth/invalid-verification-code') return 'Code SMS incorrect.';
  if (code === 'auth/code-expired') return 'Code SMS expiré. Demandez un nouveau code.';
  if (code === 'INVALID_CREDENTIALS') return 'Numéro ou mot de passe incorrect.';
  return isRegistration
    ? 'Impossible de créer le compte pour le moment. Réessayez dans un instant.'
    : 'Impossible de se connecter pour le moment. Réessayez dans un instant.';
}

export function PhoneAuthScreen({ mode, onModeChange, onSuccess }: Props) {
  const isRegistration = mode === 'register';

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [verificationId, setVerificationId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [imgIndex, setImgIndex] = useState(() => Math.floor(Math.random() * BG_IMAGES.length));

  const otpEnabled = isRegistration && isPhoneOtpEnabled();

  useEffect(() => {
    const id = setInterval(() => setImgIndex((i) => (i + 1) % BG_IMAGES.length), 8000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setVerificationId('');
    setOtpCode('');
    setError('');
    void resetPhoneVerifier();
  }, [mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const normalizedPhone = normalizeInternationalPhone(phone);
    const trimPass = password.trim();

    if (!normalizedPhone) { setError('Entrez votre numéro de téléphone.'); return; }
    if (!isValidInternationalPhone(normalizedPhone)) { setError('Entrez un numéro valide avec son indicatif pays.'); return; }
    if (trimPass.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return; }

    setLoading(true);
    try {
      if (isRegistration) {
        if (trimPass !== confirm.trim()) { setError('Les mots de passe ne correspondent pas.'); return; }

        if (otpEnabled && !verificationId) {
          const nextVerificationId = await startPhoneVerification(normalizedPhone, RECAPTCHA_CONTAINER_ID);
          setVerificationId(nextVerificationId);
          return;
        }

        if (otpEnabled && otpCode.trim().length < 6) {
          setError('Entrez le code reçu par SMS.');
          return;
        }

        const credential = otpEnabled
          ? phoneVerificationCredential(verificationId, otpCode.trim())
          : undefined;

        await registerWithPhonePassword(normalizedPhone, trimPass, credential);
      } else {
        await loginWithPhonePassword(normalizedPhone, trimPass);
      }
      onSuccess();
    } catch (authError) {
      const code = (authError as { code?: string }).code ?? (authError as Error).message;
      setError(authMessage(code, isRegistration));
      if (code === 'auth/code-expired') {
        setVerificationId('');
        setOtpCode('');
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
              <PhoneInput
                value={phone}
                onValueChange={(value) => { setPhone(value); setError(''); setVerificationId(''); setOtpCode(''); }}
                defaultCountry="BJ"
                placeholder="Entrez le numéro"
                invalid={Boolean(error) && !isValidInternationalPhone(phone)}
                className="h-11 rounded-lg bg-background"
              >
                <PhoneInputCountrySelect />
                <PhoneInputField autoComplete="tel" />
              </PhoneInput>
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

            {otpEnabled && verificationId && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">Code reçu par SMS</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}

            {otpEnabled && <div id={RECAPTCHA_CONTAINER_ID} />}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-foreground py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? 'Veuillez patienter...'
                : otpEnabled && isRegistration && !verificationId
                  ? 'Recevoir le code'
                  : isRegistration
                    ? 'Créer mon compte'
                    : 'Se connecter'}
            </button>

            <button
              type="button"
              onClick={() => onModeChange(isRegistration ? 'login' : 'register')}
              className="w-full text-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {isRegistration ? 'J’ai déjà un compte' : 'Créer un nouveau compte'}
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
