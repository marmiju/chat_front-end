'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { Group, User, OnlineUser } from '@/modules/core/types';
import { getSocket } from '@/modules/core/socket-client';
import { getClientUser, updateClientUser } from '@/modules/core/storage';
import { authService } from '@/modules/auth/auth.service';
import { groupsService } from '@/modules/groups/groups.service';
import ChannelsSidebar from '@/modules/groups/channels-sidebar';
import ProfileSettingsModal from './profile-settings-modal';

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
  const [currentUser, setCurrentUser] = useState<User | null>(
    initialCurrentUser
  );
  const [groups, setGroups] = useState<Group[]>(initialGroups || []);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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
    };
  }, [
    currentUser,
    addGroup,
    updateGroup,
    removeGroup,
    applyUserUpdateToGroups,
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
      }}
    >
      <div className="h-screen w-screen flex bg-white text-zinc-900 overflow-hidden">
        <ChannelsSidebar
          groups={groups}
          currentUser={currentUser}
          onlineUsers={onlineUsers}
        />
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-white">
          {children}
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

