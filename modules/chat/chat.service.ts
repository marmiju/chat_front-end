import { httpRequest } from '../core/http-client';
import { Message, User } from '../core/types';
import { getSocket } from '../core/socket-client';

export const chatService = {
  async getMessages(
    groupId: string,
    limit = 60,
    before?: string
  ): Promise<Message[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (before) params.set('before', before);
    return httpRequest<Message[]>(
      `/api/chats/${groupId}?${params.toString()}`,
      { method: 'GET' }
    );
  },

  async sendMessage(groupId: string, content: string): Promise<Message> {
    return httpRequest<Message>('/api/chats', {
      method: 'POST',
      body: JSON.stringify({ group_id: groupId, groupId, content }),
    });
  },

  setActiveGroup(currentUser: User | null, groupId: string): void {
    const socket = getSocket(currentUser);
    if (socket) {
      socket.emit('active_group', { groupId });
    }
  },

  clearActiveGroup(currentUser: User | null): void {
    const socket = getSocket(currentUser);
    if (socket) {
      socket.emit('inactive_group');
    }
  },

  markAsRead(
    currentUser: User | null,
    groupId: string,
    unreadIds: string[]
  ): void {
    if (!unreadIds.length) return;
    const socket = getSocket(currentUser);
    if (socket && socket.connected) {
      socket.emit('mark_as_read', { groupId, unreadIds });
    } else {
      if (socket) {
        socket.emit('mark_as_read', { groupId, unreadIds });
      }
      httpRequest<Message[]>(`/api/chats/${groupId}/read`, {
        method: 'POST',
        body: JSON.stringify({ unreadIds }),
      }).catch(() => {
        // Ignore fallback error
      });
    }
  },

  emitTyping(
    currentUser: User | null,
    groupId: string,
    isTyping: boolean
  ): void {
    const socket = getSocket(currentUser);
    if (socket) {
      socket.emit('typing', { groupId, isTyping });
    }
  },
};

