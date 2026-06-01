import {
  createUserWithEmailAndPassword,
  deleteUser,
  linkWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
  type AuthCredential,
  type AuthError,
  type User,
} from 'firebase/auth';
import {
  ACTIVE_WORKSHOP_ID_KEY,
  AUTH_KEY,
  CREDENTIALS_KEY,
  STORAGE_KEY,
  USER_PROFILE_KEY,
  WORKSHOPS_KEY,
} from '@/constants';
import { getFirebaseServices } from '@/lib/firebase';

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

export function internationalPhoneDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function normalizeInternationalPhone(value: string) {
  const digits = internationalPhoneDigits(value);
  return digits ? `+${digits}` : '';
}

export function isValidInternationalPhone(value: string) {
  const digits = internationalPhoneDigits(value);
  return digits.length >= 6 && digits.length <= 15;
}

export function phoneAuthEmail(value: string) {
  return `p${internationalPhoneDigits(value)}@${PHONE_EMAIL_DOMAIN}`;
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
    phone: normalizeInternationalPhone(phone),
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

  const samePhone = internationalPhoneDigits(stored.phone) === internationalPhoneDigits(phone);
  if (!samePhone) return false;

  if (stored.passwordHash && stored.passwordSalt) {
    return await hashPassword(password, stored.passwordSalt) === stored.passwordHash;
  }

  return stored.password === password;
}

async function persistFirebaseSession(user: User, phone: string, password: string) {
  await updateProfile(user, { displayName: normalizeInternationalPhone(phone) }).catch(() => undefined);
  await saveLocalAccount(phone, password, user.uid);
}

function markAuthenticated() {
  localStorage.setItem(AUTH_KEY, 'true');
}

function resetAppDataForNewAccount() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(USER_PROFILE_KEY);
  localStorage.removeItem(WORKSHOPS_KEY);
  localStorage.removeItem(ACTIVE_WORKSHOP_ID_KEY);
}

export async function registerWithPhonePassword(phone: string, password: string, phoneCredential?: AuthCredential): Promise<AuthResult> {
  const services = getFirebaseServices();

  if (services) {
    try {
      const result = await createUserWithEmailAndPassword(services.auth, phoneAuthEmail(phone), password);
      if (phoneCredential) {
        try {
          await linkWithCredential(result.user, phoneCredential);
        } catch (linkError) {
          await deleteUser(result.user).catch(() => undefined);
          throw linkError;
        }
      }
      await persistFirebaseSession(result.user, phone, password);
      resetAppDataForNewAccount();
      markAuthenticated();
      return { provider: 'firebase', user: result.user };
    } catch (error) {
      if (!isFirebaseUnavailable(error)) throw error;
    }
  }

  await saveLocalAccount(phone, password);
  resetAppDataForNewAccount();
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
