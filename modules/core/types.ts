export interface User {
  _id: string;
  username: string;
  email: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  title?: string;
  statusText?: string;
  phone?: string;
  token?: string;
  isAdmin?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfilePayload {
  username?: string;
  email?: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  title?: string;
  statusText?: string;
  phone?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface Delivery {
  user: string | { _id: string; username: string; displayName?: string; avatar?: string };
  status: 'sent' | 'delivered' | 'read';
  at: string;
}

export interface Message {
  _id: string;
  sender: {
    _id: string;
    username: string;
    email: string;
    displayName?: string;
    avatar?: string;
    bio?: string;
    title?: string;
    statusText?: string;
  };
  content: string;
  group: string | { _id: string; name: string };
  type: 'message' | 'notification';
  deliveries?: Delivery[];
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  _id: string;
  username: string;
  email: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  title?: string;
  statusText?: string;
  phone?: string;
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  admin: GroupMember | string;
  isDirect?: boolean;
  members: GroupMember[];
  createdAt: string;
  updatedAt: string;
  unreadCount?: number;
}

export interface OnlineUser {
  userId: string;
  username: string;
}

export interface SocketAckResponse {
  status?: 'ok' | 'success' | 'error';
  message?: string;
  messageId?: string;
}

