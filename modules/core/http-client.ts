import { APP_CONFIG } from './config';
import { getClientToken } from './storage';

export class HttpClientError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'HttpClientError';
    this.status = status;
  }
}

export async function httpRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getClientToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${APP_CONFIG.BACKEND_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg =
      data?.message || `Request failed with status ${response.status}`;
    throw new HttpClientError(errorMsg, response.status);
  }

  return data as T;
}

