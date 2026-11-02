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
import { groupsService } from '@/modules/groups/groups.service';
import WorkspaceRail from './workspace-rail';
import ChannelsSidebar from '@/modules/groups/channels-sidebar';

interface WorkspaceContextType {
  onlineUsers: OnlineUser[];
  currentUser: User | null;
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
  currentUser,
  children,
}: {
  initialGroups: Group[];
  currentUser: User | null;
  children: React.ReactNode;
}) {
  const [groups, setGroups] = useState<Group[]>(initialGroups || []);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  const addGroup = useCallback(
    (group: Group) => {
      setGroups((prev) => {
        if (prev.some((g) => g._id === group._id)) return prev;
        return [...prev, group];
      });
      groupsService.joinGroupRoomSocket(currentUser, group._id);
    },
    [currentUser]
  );

  const updateGroup = useCallback((group: Group) => {
    setGroups((prev) => prev.map((g) => (g._id === group._id ? group : g)));
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
    };
  }, [currentUser, addGroup, updateGroup, removeGroup]);

  return (
    <WorkspaceContext.Provider
      value={{
        onlineUsers,
        currentUser,
        groups,
        setGroups,
        addGroup,
        updateGroup,
        removeGroup,
        removeMemberFromLocalGroup,
      }}
    >
      <div className="h-screen w-screen flex bg-white text-zinc-950 overflow-hidden">
        <WorkspaceRail currentUser={currentUser} />
        <ChannelsSidebar
          groups={groups}
          currentUser={currentUser}
          onlineUsers={onlineUsers}
        />
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-white">
          {children}
        </main>
      </div>
    </WorkspaceContext.Provider>
  );
}

