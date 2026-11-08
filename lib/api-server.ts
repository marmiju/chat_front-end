import { cookies } from 'next/headers';
import { Group, Message, User } from './types';
import { COOKIE_TOKEN_NAME, COOKIE_USER_NAME } from './cookie';

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export async function getServerToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_TOKEN_NAME)?.value || null;
}

export async function getServerSession(): Promise<{ token: string | null; user: User | null }> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_TOKEN_NAME)?.value || null;
  const userCookie = cookieStore.get(COOKIE_USER_NAME)?.value || null;
  let user: User | null = null;

  if (userCookie) {
    try {
      user = JSON.parse(decodeURIComponent(userCookie));
    } catch {
      user = null;
    }
  }

  if (token) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/user/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });
      if (res.ok) {
        const freshUser = await res.json();
        user = { ...user, ...freshUser, token };
      }
    } catch {
      // Fallback to cookie user if backend is unreachable
    }
  }

  return { token, user };
}

export async function fetchServerGroups(): Promise<Group[]> {
  const token = await getServerToken();
  if (!token) return [];

  try {
    const res = await fetch(`${BACKEND_URL}/api/groups`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return [];
    }

    const groups: Group[] = await res.json();
    return Array.isArray(groups) ? groups : [];
  } catch (error) {
    console.error('Error in fetchServerGroups:', error);
    return [];
  }
}

export async function fetchServerGroup(groupId: string): Promise<Group | null> {
  const token = await getServerToken();
  if (!token) return null;

  try {
    const res = await fetch(`${BACKEND_URL}/api/groups/${groupId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error(`Error in fetchServerGroup for ${groupId}:`, error);
    return null;
  }
}

export async function fetchServerMessages(groupId: string): Promise<Message[]> {
  const token = await getServerToken();
  if (!token) return [];

  try {
    const res = await fetch(`${BACKEND_URL}/api/chats/${groupId}?limit=100`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return [];
    }

    const messages = await res.json();
    return Array.isArray(messages) ? messages : [];
  } catch (error) {
    console.error(`Error in fetchServerMessages for ${groupId}:`, error);
    return [];
  }
}
