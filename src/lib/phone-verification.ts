import {
  PhoneAuthProvider,
  RecaptchaVerifier,
  type AuthCredential,
} from 'firebase/auth';
import { getFirebaseServices } from '@/lib/firebase';

let verifier: RecaptchaVerifier | null = null;

export function isPhoneOtpEnabled() {
  return import.meta.env.VITE_FIREBASE_PHONE_OTP_ENABLED === 'true';
}

export async function startPhoneVerification(phone: string, containerId: string) {
  const services = getFirebaseServices();
  if (!services) throw new Error('FIREBASE_NOT_CONFIGURED');

  verifier = new RecaptchaVerifier(services.auth, containerId, {
    size: 'invisible',
  });

  const provider = new PhoneAuthProvider(services.auth);
  return provider.verifyPhoneNumber(phone, verifier);
}

export function phoneVerificationCredential(verificationId: string, code: string): AuthCredential {
  return PhoneAuthProvider.credential(verificationId, code);
}

export async function resetPhoneVerifier() {
  if (!verifier) return;
  await verifier.clear();
  verifier = null;
}
