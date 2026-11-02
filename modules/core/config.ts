export const APP_CONFIG = {
  APP_NAME: 'NexusPulse',
  BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000',
  BACKEND_INTERNAL_URL:
    process.env.BACKEND_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'http://localhost:5000',
  COOKIE_TOKEN_NAME: 'chat_token',
  COOKIE_USER_NAME: 'chat_user',
  COOKIE_MAX_AGE: 60 * 60 * 24 * 30, // 30 days
} as const;

