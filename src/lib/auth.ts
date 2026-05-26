import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
  type AuthError,
  type User,
} from 'firebase/auth';
import { AUTH_KEY, CREDENTIALS_KEY } from '@/constants';
import { getFirebaseServices } from '@/lib/firebase';

const BENIN_DIAL_CODE = '+229';
const PHONE_EMAIL_DOMAIN = 'phone.tailora.app';

type StoredCredentials = {
  phone: string;
  password?: string;
  passwordHash?: string;
  passwordSalt?: string;
  authProvider?: 'firebase' | 'local';
  firebaseUid?: string;
  updatedAt?: string;
};

export type AuthResult = {
  provider: 'firebase' | 'local';
  user?: User;
};

export function beninPhoneDigits(value: string) {
  const digits = value.replace(/\D/g, '').replace(/^229/, '');
  if (!digits) return '';
  if (digits.startsWith('01')) return digits.slice(0, 10);
  return `01${digits.replace(/^0+/, '')}`.slice(0, 10);
}

export function formatBeninPhone(value: string) {
  return beninPhoneDigits(value).replace(/(\d{2})(?=\d)/g, '$1 ').trim();
}

export function isValidBeninPhone(value: string) {
  const digits = beninPhoneDigits(value);
  return digits.length === 10 && digits.startsWith('01');
}

export function fullBeninPhone(value: string) {
  const localPhone = formatBeninPhone(value);
  return localPhone ? `${BENIN_DIAL_CODE} ${localPhone}` : '';
}

export function phoneAuthEmail(value: string) {
  return `p229${beninPhoneDigits(value)}@${PHONE_EMAIL_DOMAIN}`;
}

export function hasStoredAccount() {
  return Boolean(localStorage.getItem(CREDENTIALS_KEY));
}

function isFirebaseUnavailable(error: unknown) {
  const code = (error as Partial<AuthError>)?.code;
  return (
    !code ||
    code === 'auth/network-request-failed' ||
    code === 'auth/operation-not-allowed' ||
    code === 'auth/configuration-not-found' ||
    code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.' ||
    code === 'auth/invalid-api-key'
  );
}

function readStoredCredentials(): StoredCredentials | null {
  try {
    const raw = localStorage.getItem(CREDENTIALS_KEY);
    return raw ? JSON.parse(raw) as StoredCredentials : null;
  } catch {
    return null;
  }
}

function randomSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password: string, salt: string) {
  return sha256(`${salt}:${password}`);
}

async function saveLocalAccount(phone: string, password: string, firebaseUid?: string): Promise<void> {
  const salt = randomSalt();
  const credentials: StoredCredentials = {
    phone: fullBeninPhone(phone),
    passwordHash: await hashPassword(password, salt),
    passwordSalt: salt,
    authProvider: firebaseUid ? 'firebase' : 'local',
    firebaseUid,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
}

async function localPasswordMatches(phone: string, password: string) {
  const stored = readStoredCredentials();
  if (!stored) return false;

  const samePhone = beninPhoneDigits(stored.phone) === beninPhoneDigits(phone);
  if (!samePhone) return false;

  if (stored.passwordHash && stored.passwordSalt) {
    return await hashPassword(password, stored.passwordSalt) === stored.passwordHash;
  }

  return stored.password === password;
}

async function persistFirebaseSession(user: User, phone: string, password: string) {
  await updateProfile(user, { displayName: fullBeninPhone(phone) }).catch(() => undefined);
  await saveLocalAccount(phone, password, user.uid);
}

function markAuthenticated() {
  localStorage.setItem(AUTH_KEY, 'true');
}

export async function registerWithPhonePassword(phone: string, password: string): Promise<AuthResult> {
  const services = getFirebaseServices();

  if (services) {
    try {
      const result = await createUserWithEmailAndPassword(services.auth, phoneAuthEmail(phone), password);
      await persistFirebaseSession(result.user, phone, password);
      markAuthenticated();
      return { provider: 'firebase', user: result.user };
    } catch (error) {
      if (!isFirebaseUnavailable(error)) throw error;
    }
  }

  await saveLocalAccount(phone, password);
  markAuthenticated();
  return { provider: 'local' };
}

export async function loginWithPhonePassword(phone: string, password: string): Promise<AuthResult> {
  const services = getFirebaseServices();

  if (services) {
    try {
      const result = await signInWithEmailAndPassword(services.auth, phoneAuthEmail(phone), password);
      await persistFirebaseSession(result.user, phone, password);
      markAuthenticated();
      return { provider: 'firebase', user: result.user };
    } catch (error) {
      const canMigrateLocalAccount =
        (error as Partial<AuthError>)?.code === 'auth/invalid-credential' ||
        (error as Partial<AuthError>)?.code === 'auth/user-not-found';

      if (canMigrateLocalAccount && await localPasswordMatches(phone, password)) {
        return registerWithPhonePassword(phone, password);
      }

      if (!isFirebaseUnavailable(error)) throw error;
    }
  }

  if (await localPasswordMatches(phone, password)) {
    await saveLocalAccount(phone, password);
    markAuthenticated();
    return { provider: 'local' };
  }

  throw new Error('INVALID_CREDENTIALS');
}

export async function updateCurrentPassword(newPassword: string): Promise<void> {
  const services = getFirebaseServices();
  if (services?.auth.currentUser) {
    await updatePassword(services.auth.currentUser, newPassword);
  }

  const stored = readStoredCredentials();
  if (stored?.phone) {
    await saveLocalAccount(stored.phone, newPassword, stored.firebaseUid);
  }
}

export async function logoutAuth(): Promise<void> {
  const services = getFirebaseServices();
  if (services) await signOut(services.auth).catch(() => undefined);
  localStorage.removeItem(AUTH_KEY);
}
