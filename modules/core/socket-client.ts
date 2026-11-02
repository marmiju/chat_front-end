'use client';

import { io, Socket } from 'socket.io-client';
import { User, SocketAckResponse } from './types';
import { APP_CONFIG } from './config';
import { getClientToken } from './storage';

let socketInstance: Socket | null = null;
let connectedUserId: string | null = null;

export function getSocket(user?: User | null): Socket | null {
  if (typeof window === 'undefined') return null;

  if (
    socketInstance &&
    socketInstance.connected &&
    (!user || connectedUserId === user._id)
  ) {
    return socketInstance;
  }

  if (!user) {
    return socketInstance;
  }

  const token = getClientToken() || user.token;

  if (socketInstance && connectedUserId !== user._id) {
    socketInstance.disconnect();
    socketInstance = null;
  }

  if (!socketInstance) {
    connectedUserId = user._id;
    socketInstance = io(APP_CONFIG.BACKEND_URL, {
      auth: {
        token: token || undefined,
        user: JSON.stringify(user),
      },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      withCredentials: true,
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('Socket connection warning:', err.message);
    });
  }

  return socketInstance;
}

export function emitWithAck<TPayload>(
  socket: Socket | null,
  event: string,
  payload: TPayload
): Promise<SocketAckResponse> {
  return new Promise((resolve, reject) => {
    if (!socket) {
      return reject(new Error('Socket not connected'));
    }
    socket.emit(event, payload, (response: SocketAckResponse) => {
      if (response?.status === 'error') {
        reject(new Error(response.message || 'Socket operation failed'));
      } else {
        resolve(response || { status: 'ok' });
      }
    });
  });
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    connectedUserId = null;
  }
}

