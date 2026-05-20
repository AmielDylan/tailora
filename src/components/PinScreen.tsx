import { useEffect, useState } from 'react';
import { PIN_KEY, AUTH_KEY } from '@/constants';
import { cn } from '@/lib/utils';

const BG_IMAGES = ['/images/tailor_men.png', '/images/tailor_women.png'];
const MAX_ATTEMPTS = 3;

type Props = {
  mode: 'create' | 'unlock';
  onSuccess: () => void;
  onLockout?: () => void; // called after 3 failed attempts in unlock mode
};

export function PinScreen({ mode, onSuccess, onLockout }: Props) {
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [attempts, setAttempts] = useState(0);

  const [imgIndex, setImgIndex] = useState(() => Math.floor(Math.random() * BG_IMAGES.length));

  useEffect(() => {
    const id = setInterval(() => setImgIndex((i) => (i + 1) % BG_IMAGES.length), 8000);
    return () => clearInterval(id);
  }, []);

  const current = step === 'confirm' ? confirmPin : pin;
  const filled = current.length;

  function pressKey(digit: string) {
    if (current.length >= 4) return;
    setErrorMsg('');
    if (step === 'confirm') setConfirmPin((p) => p + digit);
    else setPin((p) => p + digit);
  }

  function pressDelete() {
    setErrorMsg('');
    if (step === 'confirm') setConfirmPin((p) => p.slice(0, -1));
    else setPin((p) => p.slice(0, -1));
  }

  useEffect(() => {
    if (mode === 'create') {
      if (step === 'enter' && pin.length === 4) {
        setStep('confirm');
      } else if (step === 'confirm' && confirmPin.length === 4) {
        if (confirmPin === pin) {
          localStorage.setItem(PIN_KEY, pin);
          onSuccess();
        } else {
          setErrorMsg('Les codes ne correspondent pas. Recommencez.');
          setPin('');
          setConfirmPin('');
          setStep('enter');
        }
      }
    } else {
      if (pin.length === 4) {
        const stored = localStorage.getItem(PIN_KEY);
        if (pin === stored) {
          onSuccess();
        } else {
          const next = attempts + 1;
          setAttempts(next);
          setPin('');
          if (next >= MAX_ATTEMPTS) {
            setErrorMsg('Trop de tentatives. Reconnectez-vous.');
            // Short delay so user sees the message before lockout
            setTimeout(() => {
              localStorage.removeItem(AUTH_KEY);
              onLockout?.();
            }, 1500);
          } else {
            setErrorMsg(`Code incorrect. ${MAX_ATTEMPTS - next} tentative${MAX_ATTEMPTS - next > 1 ? 's' : ''} restante${MAX_ATTEMPTS - next > 1 ? 's' : ''}.`);
          }
        }
      }
    }
  }, [pin, confirmPin, step]);

  const title =
    mode === 'create'
      ? step === 'enter' ? 'Définir votre code PIN' : 'Confirmez votre code PIN'
      : 'Déverrouiller Tailora';

  const subtitle =
    mode === 'create'
      ? step === 'enter'
        ? 'Choisissez un code à 4 chiffres.'
        : 'Saisissez à nouveau votre code.'
      : 'Entrez votre code PIN à 4 chiffres.';

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div className="h-screen flex overflow-hidden">
      {/* ── Panneau gauche ── */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-8 py-12 bg-background">
        <div className="w-full max-w-xs space-y-8">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">Tailora</h1>

          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>

          <div className="flex items-center justify-center gap-4" aria-label="Code PIN saisi">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  'h-3 w-3 rounded-full border-2 transition-all duration-150',
                  i < filled
                    ? errorMsg
                      ? 'border-destructive bg-destructive'
                      : 'border-foreground bg-foreground'
                    : 'border-border bg-transparent',
                )}
              />
            ))}
          </div>

          <div className="min-h-5 text-center text-sm text-destructive">{errorMsg}</div>

          <div className="grid grid-cols-3 gap-3">
            {keys.map((key, i) => {
              if (key === '') return <div key={i} />;
              if (key === 'del') return (
                <button
                  key={i}
                  onClick={pressDelete}
                  aria-label="Effacer"
                  className="flex h-14 w-full items-center justify-center rounded-full border border-border bg-secondary text-foreground transition-colors hover:bg-accent active:scale-95"
                >
                  ⌫
                </button>
              );
              return (
                <button
                  key={i}
                  onClick={() => pressKey(key)}
                  className="flex h-14 w-full items-center justify-center rounded-full border border-border bg-card text-lg font-medium text-foreground shadow-sm transition-colors hover:bg-secondary active:scale-95"
                >
                  {key}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Panneau droit (desktop) ── */}
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
