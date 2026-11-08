'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Group, User, OnlineUser } from '@/modules/core/types';
import { getSocket } from '@/modules/core/socket-client';
import { getClientUser, updateClientUser } from '@/modules/core/storage';
import { authService } from '@/modules/auth/auth.service';
import { groupsService } from '@/modules/groups/groups.service';
import {
  pushService,
  PushNotificationPayload,
} from '@/modules/notifications/push.service';
import ChannelsSidebar from '@/modules/groups/channels-sidebar';
import ProfileSettingsModal from './profile-settings-modal';
import UserAvatar from '@/modules/core/user-avatar';
import { Hash, X } from 'lucide-react';

interface WorkspaceContextType {
  onlineUsers: OnlineUser[];
  currentUser: User | null;
  updateCurrentUser: (user: User) => void;
  openProfileModal: () => void;
  groups: Group[];
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  addGroup: (group: Group) => void;
  updateGroup: (group: Group) => void;
  removeGroup: (groupId: string) => void;
  removeMemberFromLocalGroup: (groupId: string, userId: string) => void;
  unreadCounts: Record<string, number>;
  clearUnread: (groupId: string) => void;
  pushEnabled: boolean;
  pushPermission: NotificationPermission;
  togglePushNotifications: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  onlineUsers: [],
  currentUser: null,
  updateCurrentUser: () => {},
  openProfileModal: () => {},
  groups: [],
  setGroups: () => {},
  addGroup: () => {},
  updateGroup: () => {},
  removeGroup: () => {},
  removeMemberFromLocalGroup: () => {},
  unreadCounts: {},
  clearUnread: () => {},
  pushEnabled: false,
  pushPermission: 'default',
  togglePushNotifications: async () => {},
});

export const useWorkspace = () => useContext(WorkspaceContext);

export default function WorkspaceProvider({
  initialGroups,
  currentUser: initialCurrentUser,
  children,
}: {
  initialGroups: Group[];
  currentUser: User | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(
    initialCurrentUser
  );
  const [groups, setGroups] = useState<Group[]>(initialGroups || []);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushPermission, setPushPermission] =
    useState<NotificationPermission>('default');
  const [activeToast, setActiveToast] =
    useState<PushNotificationPayload | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
    const match = pathname?.match(/^\/channels\/([^/]+)/);
    if (match?.[1]) {
      const activeGroupId = match[1];
      setUnreadCounts((prev) => {
        if (!prev[activeGroupId]) return prev;
        const next = { ...prev };
        delete next[activeGroupId];
        return next;
      });
    }
  }, [pathname]);

  useEffect(() => {
    if (!pushService.isSupported()) return;
    const perm = pushService.getPermission();
    setPushPermission(perm);
    const enabled = perm === 'granted' && !pushService.isMuted();
    setPushEnabled(enabled);

    if (enabled) {
      pushService.syncIfGranted().catch(() => {});
    } else {
      pushService.registerServiceWorker().catch(() => {});
    }
  }, []);

  const togglePushNotifications = useCallback(async () => {
    if (!pushService.isSupported()) return;

    if (pushEnabled) {
      await pushService.unsubscribeFromWebPush();
      setPushEnabled(false);
      setPushPermission(pushService.getPermission());
    } else {
      const ok = await pushService.subscribeToWebPush();
      setPushPermission(pushService.getPermission());
      setPushEnabled(ok);
    }
  }, [pushEnabled]);

  const clearUnread = useCallback((groupId: string) => {
    setUnreadCounts((prev) => {
      if (!prev[groupId]) return prev;
      const next = { ...prev };
      delete next[groupId];
      return next;
    });
  }, []);

  const showToast = useCallback((payload: PushNotificationPayload) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setActiveToast(payload);
    toastTimerRef.current = setTimeout(() => {
      setActiveToast(null);
    }, 4500);
  }, []);

  const applyUserUpdateToGroups = useCallback((updatedUser: User) => {
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        admin:
          typeof g.admin === 'object' && g.admin?._id === updatedUser._id
            ? { ...g.admin, ...updatedUser }
            : g.admin,
        members: g.members?.map((m) =>
          m._id === updatedUser._id ? { ...m, ...updatedUser } : m
        ),
      }))
    );
  }, []);

  const updateCurrentUser = useCallback(
    (updatedUser: User) => {
      setCurrentUser((prev) => {
        const merged = { ...prev, ...updatedUser };
        updateClientUser(merged);
        return merged;
      });
      applyUserUpdateToGroups(updatedUser);
    },
    [applyUserUpdateToGroups]
  );

  useEffect(() => {
    const stored = getClientUser();
    if (stored && (!initialCurrentUser || stored._id === initialCurrentUser._id)) {
      setCurrentUser((prev) => ({ ...prev, ...stored }));
    }
    authService
      .getProfile()
      .then((fresh) => {
        setCurrentUser((prev) => ({ ...prev, ...fresh }));
        applyUserUpdateToGroups(fresh);
      })
      .catch(() => {
        // Keep existing user if offline
      });
    groupsService
      .getGroups()
      .then((freshGroups) => {
        if (Array.isArray(freshGroups)) {
          setGroups(freshGroups);
        }
      })
      .catch(() => {
        // Keep initialGroups if offline
      });
  }, [initialCurrentUser, applyUserUpdateToGroups]);

  const addGroup = useCallback(
    (group: Group) => {
      setGroups((prev) => {
        if (prev.some((g) => g._id === group._id)) {
          return prev.map((g) => (g._id === group._id ? group : g));
        }
        return [...prev, group];
      });
      groupsService.joinGroupRoomSocket(currentUser, group._id);
    },
    [currentUser]
  );

  const updateGroup = useCallback((group: Group) => {
    setGroups((prev) => {
      const exists = prev.some((g) => g._id === group._id);
      if (!exists) return [...prev, group];
      return prev.map((g) => (g._id === group._id ? group : g));
    });
  }, []);

  const removeGroup = useCallback((groupId: string) => {
    setGroups((prev) => prev.filter((g) => g._id !== groupId));
  }, []);

  const removeMemberFromLocalGroup = useCallback(
    (groupId: string, userId: string) => {
      setGroups((prev) =>
        prev.map((g) =>
          g._id === groupId
            ? {
                ...g,
                members: g.members.filter((m) => m._id !== userId),
              }
            : g
        )
      );
    },
    []
  );

  useEffect(() => {
    setGroups(initialGroups || []);
  }, [initialGroups]);

  useEffect(() => {
    if (!currentUser) return;

    const socket = getSocket(currentUser);
    if (!socket) return;

    const handleInitialOnline = (data: {
      groupId: string;
      users: OnlineUser[];
    }) => {
      if (Array.isArray(data.users)) {
        setOnlineUsers((prev) => {
          const map = new Map(prev.map((u) => [u.userId, u]));
          data.users.forEach((u) => map.set(u.userId, u));
          return Array.from(map.values());
        });
      }
    };

    const handleOnlineMember = (member: OnlineUser) => {
      setOnlineUsers((prev) => {
        if (prev.some((u) => u.userId === member.userId)) return prev;
        return [...prev, member];
      });
    };

    const handleUserOffline = (data: { userId: string }) => {
      setOnlineUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    };

    const handleGroupCreated = (newGroup: Group) => {
      addGroup(newGroup);
    };

    const handleAddedToGroup = (newGroup: Group) => {
      addGroup(newGroup);
    };

    const handleGroupMemberAdded = (data: { groupId: string; group: Group }) => {
      if (data?.group) {
        updateGroup(data.group);
      }
    };

    const handleGroupMemberLeft = (data: { groupId: string; group: Group }) => {
      if (data?.group) {
        updateGroup(data.group);
      }
    };

    const handleMemberRemoved = (data: { userId: string; by: string }) => {
      if (data?.userId) {
        setGroups((prev) =>
          prev.map((g) => ({
            ...g,
            members: g.members.filter((m) => m._id !== data.userId),
          }))
        );
      }
    };

    const handleGroupDeleted = (data: { groupId: string }) => {
      if (data?.groupId) {
        removeGroup(data.groupId);
      }
    };

    const handleRemovedFromGroup = (data: { groupId: string }) => {
      if (data?.groupId) {
        removeGroup(data.groupId);
      }
    };

    const handleUserUpdated = (updatedUser: User) => {
      if (!updatedUser?._id) return;
      applyUserUpdateToGroups(updatedUser);
      if (updatedUser._id === currentUser._id) {
        setCurrentUser((prev) => {
          const merged = { ...prev, ...updatedUser };
          updateClientUser(merged);
          return merged;
        });
      }
    };

    const handlePushNotification = (payload: PushNotificationPayload) => {
      if (!payload?.groupId) return;
      if (payload.senderId && payload.senderId === currentUser._id) return;

      const dedupeKey =
        payload.messageId ||
        `${payload.groupId}-${payload.createdAt || Date.now()}`;
      if (seenNotificationIdsRef.current.has(dedupeKey)) return;
      seenNotificationIdsRef.current.add(dedupeKey);

      const currentPath = pathnameRef.current || '';
      const targetPath = `/channels/${payload.groupId}`;
      const isViewingChannel = currentPath === targetPath;
      const isTabHidden =
        typeof document !== 'undefined' &&
        (document.hidden || !document.hasFocus());

      if (!isViewingChannel) {
        setUnreadCounts((prev) => ({
          ...prev,
          [payload.groupId]: (prev[payload.groupId] || 0) + 1,
        }));
      }

      if (!isViewingChannel || isTabHidden) {
        pushService.playChime();
      }

      if (isTabHidden) {
        // Tab is in the background or unfocused: show OS/browser notification only
        pushService.showNativeNotification(payload, (url) => {
          router.push(url);
        });
      } else if (!isViewingChannel && !pushService.isMuted()) {
        // User is actively inside the app on another channel: show in-app toast only
        showToast(payload);
      }
    };

    socket.on('initialonline', handleInitialOnline);
    socket.on('online_member', handleOnlineMember);
    socket.on('user_offline', handleUserOffline);
    socket.on('group_created', handleGroupCreated);
    socket.on('added_to_group', handleAddedToGroup);
    socket.on('group_member_added', handleGroupMemberAdded);
    socket.on('group_member_left', handleGroupMemberLeft);
    socket.on('member_removed', handleMemberRemoved);
    socket.on('group_deleted', handleGroupDeleted);
    socket.on('removed_from_group', handleRemovedFromGroup);
    socket.on('user_updated', handleUserUpdated);
    socket.on('push_notification', handlePushNotification);

    return () => {
      socket.off('initialonline', handleInitialOnline);
      socket.off('online_member', handleOnlineMember);
      socket.off('user_offline', handleUserOffline);
      socket.off('group_created', handleGroupCreated);
      socket.off('added_to_group', handleAddedToGroup);
      socket.off('group_member_added', handleGroupMemberAdded);
      socket.off('group_member_left', handleGroupMemberLeft);
      socket.off('member_removed', handleMemberRemoved);
      socket.off('group_deleted', handleGroupDeleted);
      socket.off('removed_from_group', handleRemovedFromGroup);
      socket.off('user_updated', handleUserUpdated);
      socket.off('push_notification', handlePushNotification);
    };
  }, [
    currentUser,
    addGroup,
    updateGroup,
    removeGroup,
    applyUserUpdateToGroups,
    router,
    showToast,
  ]);

  return (
    <WorkspaceContext.Provider
      value={{
        onlineUsers,
        currentUser,
        updateCurrentUser,
        openProfileModal: () => setIsProfileModalOpen(true),
        groups,
        setGroups,
        addGroup,
        updateGroup,
        removeGroup,
        removeMemberFromLocalGroup,
        unreadCounts,
        clearUnread,
        pushEnabled,
        pushPermission,
        togglePushNotifications,
      }}
    >
      <div className="h-screen w-screen flex bg-white text-zinc-900 overflow-hidden">
        <ChannelsSidebar
          groups={groups}
          currentUser={currentUser}
          onlineUsers={onlineUsers}
        />
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-white relative">
          {children}

          {activeToast && (
            <div className="fixed top-4 right-4 z-50 max-w-sm w-full animate-in fade-in slide-in-from-top-2 duration-150">
              <div
                onClick={() => {
                  const target =
                    activeToast.url || `/channels/${activeToast.groupId}`;
                  setActiveToast(null);
                  router.push(target);
                }}
                className="bg-white border border-zinc-200/90 rounded-xl p-3.5 shadow-lg flex items-start gap-3 cursor-pointer hover:border-zinc-300 transition-colors"
              >
                {activeToast.isDirect ? (
                  <UserAvatar
                    name={activeToast.senderName || activeToast.title}
                    avatar={activeToast.senderAvatar}
                    size="sm"
                    variant="subtle"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center shrink-0">
                    <Hash className="w-4 h-4" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-zinc-900 truncate">
                      {activeToast.title}
                    </p>
                    <span className="text-[10px] text-zinc-400 shrink-0">
                      now
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 truncate mt-0.5">
                    {activeToast.body}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveToast(null);
                  }}
                  className="text-zinc-400 hover:text-zinc-700 p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onProfileUpdated={updateCurrentUser}
      />
    </WorkspaceContext.Provider>
  );
}

