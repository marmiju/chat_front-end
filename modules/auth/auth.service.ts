import { httpRequest } from '../core/http-client';
import { User } from '../core/types';
import { setClientAuth, clearClientAuth } from '../core/storage';
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

