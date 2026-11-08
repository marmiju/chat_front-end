import { httpRequest } from '../core/http-client';
import { User, UpdateProfilePayload } from '../core/types';
import {
  setClientAuth,
  updateClientUser,
  clearClientAuth,
  getClientUser,
} from '../core/storage';
import { disconnectSocket } from '../core/socket-client';

export const authService = {
  async login(payload: { email: string; password: string }): Promise<User> {
    const user = await httpRequest<User>('/api/user/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (user.token) {
      setClientAuth(user.token, user);
    }
    return user;
  },

  async register(payload: {
    username: string;
    email: string;
    password: string;
  }): Promise<User> {
    const user = await httpRequest<User>('/api/user/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (user.token) {
      setClientAuth(user.token, user);
    }
    return user;
  },

  async getProfile(): Promise<User> {
    const profile = await httpRequest<User>('/api/user/me', {
      method: 'GET',
    });
    const existing = getClientUser();
    const merged = { ...existing, ...profile };
    updateClientUser(merged);
    return merged;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const updated = await httpRequest<User>('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    const existing = getClientUser();
    const merged = { ...existing, ...updated };
    updateClientUser(merged);
    return merged;
  },

  async searchUsers(username: string): Promise<User[]> {
    return httpRequest<User[]>(
      `/api/user/search?username=${encodeURIComponent(username)}`,
      { method: 'GET' }
    );
  },

  logout(): void {
    disconnectSocket();
    clearClientAuth();
  },
};

