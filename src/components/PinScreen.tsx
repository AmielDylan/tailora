import React, { useEffect, useState } from 'react';
import { PIN_KEY, AUTH_KEY } from '../constants';

type Props = { onSuccess: () => void; mode: 'create' | 'unlock' };

export function PinScreen({ onSuccess, mode }: Props) {
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [attempts, setAttempts] = useState(0);

  const current = step === 'confirm' ? confirmPin : pin;
  const filled = current.length;

  function pressKey(digit: string) {
    if (current.length >= 4) return;
    setErrorMsg('');
    if (step === 'confirm') {
      setConfirmPin((prev) => prev + digit);
    } else {
      setPin((prev) => prev + digit);
    }
  }

  function pressDelete() {
    setErrorMsg('');
    if (step === 'confirm') {
      setConfirmPin((prev) => prev.slice(0, -1));
    } else {
      setPin((prev) => prev.slice(0, -1));
    }
  }

  useEffect(() => {
    if (mode === 'create') {
      if (step === 'enter' && pin.length === 4) {
        setStep('confirm');
      } else if (step === 'confirm' && confirmPin.length === 4) {
        if (confirmPin === pin) {
          localStorage.setItem(PIN_KEY, pin);
          localStorage.setItem(AUTH_KEY, 'true');
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
          localStorage.setItem(AUTH_KEY, 'true');
          onSuccess();
        } else {
          const next = attempts + 1;
          setAttempts(next);
          setErrorMsg(next >= 3 ? 'Code incorrect. Vérifiez votre PIN.' : 'Code incorrect.');
          setPin('');
        }
      }
    }
  }, [pin, confirmPin, step]);

  const title = mode === 'create'
    ? step === 'enter' ? 'Créer votre code PIN' : 'Confirmez votre code PIN'
    : 'Déverrouiller Tailora';

  const subtitle = mode === 'create'
    ? step === 'enter' ? 'Choisissez un code à 4 chiffres pour protéger vos données.' : 'Saisissez à nouveau votre code pour confirmer.'
    : 'Entrez votre code PIN à 4 chiffres.';

  const dots = [0, 1, 2, 3].map((i) => (
    <div key={i} className={`pin-dot ${i < filled ? (errorMsg ? 'error' : 'filled') : ''}`} />
  ));

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div className="pin-screen">
      <div className="pin-card">
        <h2>{title}</h2>
        <p>{subtitle}</p>
        <div className="pin-dots">{dots}</div>
        <div className="pin-error">{errorMsg}</div>
        <div className="pin-keypad">
          {keys.map((key, i) => {
            if (key === '') return <div key={i} className="pin-key empty" />;
            if (key === 'del') return (
              <div key={i} className="pin-key delete" onClick={pressDelete} role="button" aria-label="Effacer">⌫</div>
            );
            return <div key={i} className="pin-key" onClick={() => pressKey(key)} role="button">{key}</div>;
          })}
        </div>
      </div>
    </div>
  );
}
