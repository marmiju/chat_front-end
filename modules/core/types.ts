export interface User {
  _id: string;
  username: string;
  email: string;
  token?: string;
  isAdmin?: boolean;
}

export interface Delivery {
  user: string | { _id: string; username: string };
  status: 'sent' | 'delivered' | 'read';
  at: string;
}

export interface Message {
  _id: string;
  sender: {
    _id: string;
    username: string;
    email: string;
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

