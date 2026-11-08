import { User } from './types';
import { APP_CONFIG } from './config';

export const COOKIE_TOKEN_NAME = APP_CONFIG.COOKIE_TOKEN_NAME;
export const COOKIE_USER_NAME = APP_CONFIG.COOKIE_USER_NAME;
const LOCAL_USER_PROFILE_KEY = 'nexuspulse_user_profile';

export function getClientToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp('(^|;\\s*)' + COOKIE_TOKEN_NAME + '=([^;]*)')
  );
  return match ? decodeURIComponent(match[2]) : null;
}

export function getClientUser(): User | null {
  if (typeof document === 'undefined') return null;
  let cookieUser: User | null = null;
  const match = document.cookie.match(
    new RegExp('(^|;\\s*)' + COOKIE_USER_NAME + '=([^;]*)')
  );
  if (match) {
    try {
      cookieUser = JSON.parse(decodeURIComponent(match[2]));
    } catch {
      cookieUser = null;
    }
  }

  try {
    const rawLocal = window.localStorage.getItem(LOCAL_USER_PROFILE_KEY);
    if (rawLocal) {
      const localUser = JSON.parse(rawLocal) as User;
      if (!cookieUser || cookieUser._id === localUser._id) {
        return { ...cookieUser, ...localUser };
      }
    }
  } catch {
    // Ignore localStorage access errors
  }

  return cookieUser;
}

export function updateClientUser(user: User): void {
  if (typeof document === 'undefined') return;
  const maxAge = APP_CONFIG.COOKIE_MAX_AGE;

  try {
    window.localStorage.setItem(LOCAL_USER_PROFILE_KEY, JSON.stringify(user));
  } catch {
    // Ignore storage quota errors
  }

  // Keep cookie under the 4KB browser limit by omitting large base64 data URLs from the cookie
  const cookieSafeUser: User = {
    ...user,
    avatar:
      user.avatar && user.avatar.length > 1024 ? '' : user.avatar || '',
  };

  document.cookie = `${COOKIE_USER_NAME}=${encodeURIComponent(
    JSON.stringify(cookieSafeUser)
  )}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function setClientAuth(token: string, user: User): void {
  if (typeof document === 'undefined') return;
  const maxAge = APP_CONFIG.COOKIE_MAX_AGE;
  document.cookie = `${COOKIE_TOKEN_NAME}=${encodeURIComponent(
    token
  )}; path=/; max-age=${maxAge}; SameSite=Lax`;
  updateClientUser(user);
}

export function clearClientAuth(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_TOKEN_NAME}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = `${COOKIE_USER_NAME}=; path=/; max-age=0; SameSite=Lax`;
  try {
    window.localStorage.removeItem(LOCAL_USER_PROFILE_KEY);
  } catch {
    // Ignore
  }
}

