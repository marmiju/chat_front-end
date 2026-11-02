import { User } from './types';
import { APP_CONFIG } from './config';

export const COOKIE_TOKEN_NAME = APP_CONFIG.COOKIE_TOKEN_NAME;
export const COOKIE_USER_NAME = APP_CONFIG.COOKIE_USER_NAME;

export function getClientToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp('(^|;\\s*)' + COOKIE_TOKEN_NAME + '=([^;]*)')
  );
  return match ? decodeURIComponent(match[2]) : null;
}

export function getClientUser(): User | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp('(^|;\\s*)' + COOKIE_USER_NAME + '=([^;]*)')
  );
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[2]));
  } catch {
    return null;
  }
}

export function setClientAuth(token: string, user: User): void {
  if (typeof document === 'undefined') return;
  const maxAge = APP_CONFIG.COOKIE_MAX_AGE;
  document.cookie = `${COOKIE_TOKEN_NAME}=${encodeURIComponent(
    token
  )}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `${COOKIE_USER_NAME}=${encodeURIComponent(
    JSON.stringify(user)
  )}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function clearClientAuth(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_TOKEN_NAME}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = `${COOKIE_USER_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

