'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Group, User, OnlineUser } from '@/modules/core/types';
import {
  groupsService,
  isDirectGroup,
  getDirectPartner,
} from './groups.service';
import { authService } from '@/modules/auth/auth.service';
import { useWorkspace } from '@/modules/workspace/workspace-provider';
import UserAvatar from '@/modules/core/user-avatar';
import {
  Hash,
  Plus,
  Search,
  Loader2,
  Settings,
  LogOut,
  MessageSquarePlus,
} from 'lucide-react';
import CreateChannelModal from './create-channel-modal';
import QuickSwitcherModal from './quick-switcher-modal';
import NewDirectMessageModal from './new-dm-modal';

interface ChannelsSidebarProps {
  groups: Group[];
  currentUser: User | null;
  onlineUsers?: OnlineUser[];
}

export default function ChannelsSidebar({
  groups,
  currentUser,
  onlineUsers = [],
}: ChannelsSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { addGroup, openProfileModal } = useWorkspace();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isNewDMModalOpen, setIsNewDMModalOpen] = useState(false);
  const [isQuickSwitcherOpen, setIsQuickSwitcherOpen] = useState(false);
  const [openingDMUserId, setOpeningDMUserId] = useState<string | null>(null);

  const channelGroups = groups.filter((g) => !isDirectGroup(g));
  const directGroups = groups.filter((g) => isDirectGroup(g));

  // Collect teammates not already shown in an existing 1-to-1 DM
  const dmPartnerIds = new Set<string>();
  directGroups.forEach((dm) => {
    const partner = getDirectPartner(dm, currentUser);
    if (partner?._id) dmPartnerIds.add(String(partner._id));
  });

  const uniqueMembersMap = new Map<
    string,
    {
      _id: string;
      username: string;
      email: string;
      displayName?: string;
      avatar?: string;
      statusText?: string;
    }
  >();
  groups.forEach((g) => {
    g.members?.forEach((m) => {
      if (m._id && m._id !== currentUser?._id) {
        uniqueMembersMap.set(String(m._id), m);
      }
    });
  });

  const allTeammates = Array.from(uniqueMembersMap.values());
  const otherTeammates = allTeammates.filter(
    (m) => !dmPartnerIds.has(String(m._id))
  );

  const isOnline = (userId: string) =>
    onlineUsers.some((u) => String(u.userId) === String(userId));

  const handleOpenTeammateDM = async (targetUserId: string) => {
    if (openingDMUserId) return;
    setOpeningDMUserId(targetUserId);
    try {
      const dmGroup = await groupsService.startDirectMessage(targetUserId);
      addGroup(dmGroup);
      router.push(`/channels/${dmGroup._id}`);
    } catch (err) {
      console.error('Failed to open direct message:', err);
    } finally {
      setOpeningDMUserId(null);
    }
  };

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      <aside className="w-64 bg-[#fafafa] border-r border-zinc-200/80 flex flex-col justify-between select-none shrink-0 h-full">
        {/* Top Area */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* App Brand + Quick Actions */}
          <div className="h-14 px-4 flex items-center justify-between shrink-0">
            <Link
              href="/channels"
              className="flex items-center gap-2.5 text-zinc-900 hover:opacity-80 transition-opacity truncate"
            >
              <div className="w-6 h-6 rounded-md bg-zinc-900 text-white flex items-center justify-center text-[11px] font-semibold shrink-0">
                N
              </div>
              <span className="font-semibold text-sm tracking-tight truncate">
                NexusPulse
              </span>
            </Link>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsQuickSwitcherOpen(true)}
                title="Search conversations"
                className="w-7 h-7 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/60 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsNewDMModalOpen(true)}
                title="New direct message"
                className="w-7 h-7 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/60 flex items-center justify-center transition-colors cursor-pointer"
              >
                <MessageSquarePlus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Navigation Lists */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
            {/* Channels */}
            <div>
              <div className="flex items-center justify-between px-2 mb-1.5">
                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                  Channels
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  title="New channel"
                  className="w-5 h-5 rounded text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/60 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-0.5">
                {channelGroups.length > 0 ? (
                  channelGroups.map((group) => {
                    const isActive = pathname === `/channels/${group._id}`;
                    return (
                      <Link
                        key={group._id}
                        href={`/channels/${group._id}`}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] transition-colors ${
                          isActive
                            ? 'bg-zinc-200/80 text-zinc-950 font-medium'
                            : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                        }`}
                      >
                        <Hash
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? 'text-zinc-900' : 'text-zinc-400'
                          }`}
                        />
                        <span className="truncate">{group.name}</span>
                      </Link>
                    );
                  })
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                  >
                    + Create your first channel
                  </button>
                )}
              </div>
            </div>

            {/* Direct Messages & People */}
            <div>
              <div className="flex items-center justify-between px-2 mb-1.5">
                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                  Direct Messages
                </span>
                <button
                  type="button"
                  onClick={() => setIsNewDMModalOpen(true)}
                  title="New direct message"
                  className="w-5 h-5 rounded text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/60 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-0.5">
                {directGroups.map((dmGroup) => {
                  const isActive = pathname === `/channels/${dmGroup._id}`;
                  const partner = getDirectPartner(dmGroup, currentUser);
                  const partnerName =
                    partner?.displayName || partner?.username || dmGroup.name;
                  const online = partner ? isOnline(partner._id) : false;

                  return (
                    <Link
                      key={dmGroup._id}
                      href={`/channels/${dmGroup._id}`}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors ${
                        isActive
                          ? 'bg-zinc-200/80 text-zinc-950 font-medium'
                          : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                      }`}
                    >
                      <UserAvatar
                        name={partnerName}
                        avatar={partner?.avatar}
                        size="xs"
                        variant="subtle"
                        isOnline={online}
                        showStatusDot={true}
                      />
                      <span className="truncate">{partnerName}</span>
                    </Link>
                  );
                })}

                {otherTeammates.map((member) => {
                  const online = isOnline(member._id);
                  const isOpening = openingDMUserId === member._id;
                  const label = member.displayName || member.username;

                  return (
                    <button
                      key={member._id}
                      type="button"
                      disabled={isOpening}
                      onClick={() => handleOpenTeammateDM(member._id)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[13px] text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <UserAvatar
                          name={label}
                          avatar={member.avatar}
                          size="xs"
                          variant="subtle"
                          isOnline={online}
                          showStatusDot={true}
                        />
                        <span className="truncate">{label}</span>
                      </div>
                      {isOpening && (
                        <Loader2 className="w-3 h-3 animate-spin text-zinc-400 shrink-0" />
                      )}
                    </button>
                  );
                })}

                {directGroups.length === 0 && otherTeammates.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setIsNewDMModalOpen(true)}
                    className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                  >
                    + Find someone to message
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Minimalist Bottom User Footer */}
        <div className="p-2.5 border-t border-zinc-200/80 flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={openProfileModal}
            title="Edit profile & status"
            className="flex-1 flex items-center gap-2.5 p-1.5 rounded-md hover:bg-zinc-200/60 transition-colors cursor-pointer text-left min-w-0"
          >
            <UserAvatar
              name={currentUser?.displayName || currentUser?.username}
              avatar={currentUser?.avatar}
              size="md"
              variant="dark"
              isOnline={true}
              showStatusDot={true}
            />
            <div className="truncate">
              <div className="text-xs font-medium text-zinc-900 truncate">
                {currentUser?.displayName || currentUser?.username || 'User'}
              </div>
              <div className="text-[11px] text-zinc-500 truncate">
                {currentUser?.statusText ||
                  currentUser?.title ||
                  `@${currentUser?.username || 'online'}`}
              </div>
            </div>
          </button>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={openProfileModal}
              title="Profile settings"
              className="w-7 h-7 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/60 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              className="w-7 h-7 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      <CreateChannelModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <NewDirectMessageModal
        isOpen={isNewDMModalOpen}
        onClose={() => setIsNewDMModalOpen(false)}
        teammates={allTeammates}
      />

      <QuickSwitcherModal
        isOpen={isQuickSwitcherOpen}
        onClose={() => setIsQuickSwitcherOpen(false)}
        groups={groups}
        onOpenCreate={() => setIsCreateModalOpen(true)}
      />
    </>
  );
}
