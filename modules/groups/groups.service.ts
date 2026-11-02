import { httpRequest } from '../core/http-client';
import {
  Group,
  GroupMember,
  User,
  SocketAckResponse,
} from '../core/types';
import { getSocket, emitWithAck } from '../core/socket-client';

export function isDirectGroup(group?: Group | null): boolean {
  if (!group) return false;
  return Boolean(group.isDirect || group.name?.startsWith('dm-'));
}

export function getDirectPartner(
  group: Group,
  currentUser: User | null
): GroupMember | null {
  if (!group.members || group.members.length === 0) return null;
  if (!currentUser) return group.members[0] || null;
  const partner = group.members.find((m) => m._id !== currentUser._id);
  return partner || group.members[0] || null;
}

export function getGroupDisplayName(
  group: Group,
  currentUser: User | null
): string {
  if (isDirectGroup(group)) {
    const partner = getDirectPartner(group, currentUser);
    if (partner?.username) return partner.username;
  }
  return group.name;
}

export const groupsService = {
  async getGroups(): Promise<Group[]> {
    return httpRequest<Group[]>('/api/groups', {
      method: 'GET',
    });
  },

  async getGroupById(groupId: string): Promise<Group> {
    return httpRequest<Group>(`/api/groups/${groupId}`, {
      method: 'GET',
    });
  },

  async createGroup(payload: {
    name: string;
    description?: string;
  }): Promise<Group> {
    return httpRequest<Group>('/api/groups', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async startDirectMessage(targetUserId: string): Promise<Group> {
    return httpRequest<Group>(`/api/groups/dm/${targetUserId}`, {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    });
  },

  async joinGroup(
    groupId: string,
    userId?: string
  ): Promise<{ message: string; group: Group }> {
    const endpoint = userId
      ? `/api/groups/${groupId}/join/${userId}`
      : `/api/groups/${groupId}/join`;
    return httpRequest<{ message: string; group: Group }>(endpoint, {
      method: 'POST',
    });
  },

  async leaveGroup(groupId: string): Promise<{ message: string }> {
    return httpRequest<{ message: string }>(`/api/groups/${groupId}/leave`, {
      method: 'POST',
    });
  },

  async deleteGroup(
    groupId: string
  ): Promise<{ message: string; group: Group }> {
    return httpRequest<{ message: string; group: Group }>(
      `/api/groups/${groupId}`,
      {
        method: 'DELETE',
      }
    );
  },

  async adminRemoveMemberSocket(
    currentUser: User | null,
    groupId: string,
    userIdToRemove: string
  ): Promise<SocketAckResponse> {
    const socket = getSocket(currentUser);
    return emitWithAck(socket, 'admin_remove_member', {
      groupId,
      userIdToRemove,
    });
  },

  joinGroupRoomSocket(currentUser: User | null, groupId: string): void {
    const socket = getSocket(currentUser);
    if (socket) {
      socket.emit('join_group_room', { groupId });
    }
  },
};
