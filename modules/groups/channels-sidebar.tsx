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
import { useWorkspace } from '@/modules/workspace/workspace-provider';
import {
  Hash,
  Plus,
  Search,
  ChevronDown,
  Users,
  MessageSquare,
  Loader2,
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
  const { addGroup } = useWorkspace();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isNewDMModalOpen, setIsNewDMModalOpen] = useState(false);
  const [isQuickSwitcherOpen, setIsQuickSwitcherOpen] = useState(false);
  const [isChannelsExpanded, setIsChannelsExpanded] = useState(true);
  const [isDMsExpanded, setIsDMsExpanded] = useState(true);
  const [openingDMUserId, setOpeningDMUserId] = useState<string | null>(null);

  const channelGroups = groups.filter((g) => !isDirectGroup(g));
  const directGroups = groups.filter((g) => isDirectGroup(g));

  const uniqueMembersMap = new Map<
    string,
    { _id: string; username: string; email: string }
  >();
  groups.forEach((g) => {
    g.members?.forEach((m) => {
      if (m._id !== currentUser?._id) {
        uniqueMembersMap.set(m._id, m);
      }
    });
  });
  const teammates = Array.from(uniqueMembersMap.values());

  const isOnline = (userId: string) =>
    onlineUsers.some((u) => u.userId === userId);

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

  return (
    <>
      <aside className="w-64 bg-[#fafafa] border-r border-zinc-200 flex flex-col justify-between select-none shrink-0 h-full">
        <div className="flex flex-col overflow-y-auto">
          {/* Workspace Header */}
          <div className="h-14 px-4 border-b border-zinc-200 bg-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 truncate">
              <span className="font-bold text-zinc-950 tracking-tight truncate text-sm">
                NexusPulse Workspace
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsNewDMModalOpen(true)}
                title="New Direct Message"
                className="w-7 h-7 rounded-[6px] bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 hover:text-zinc-950 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                title="New Channel"
                className="w-7 h-7 rounded-[6px] bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 hover:text-zinc-950 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Search / Quick Switcher */}
          <div className="p-3 border-b border-zinc-200 shrink-0">
            <button
              type="button"
              onClick={() => setIsQuickSwitcherOpen(true)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 text-xs transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-zinc-400" />
                <span>Jump to channel or DM...</span>
              </div>
              <kbd className="px-1.5 py-0.5 rounded-[4px] bg-zinc-50 text-[10px] font-mono text-zinc-500 border border-zinc-200">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Channels Section */}
          <div className="px-3 pt-3">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-zinc-500 px-1.5 py-1 mb-1">
              <button
                type="button"
                onClick={() => setIsChannelsExpanded(!isChannelsExpanded)}
                className="flex items-center gap-1.5 hover:text-zinc-900 transition-colors cursor-pointer"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                    isChannelsExpanded ? '' : '-rotate-90'
                  }`}
                />
                <span>Channels ({channelGroups.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                title="Create Channel"
                className="w-5 h-5 rounded-[4px] hover:bg-zinc-200/70 text-zinc-600 hover:text-zinc-950 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {isChannelsExpanded && (
              <div className="space-y-0.5 max-h-44 overflow-y-auto pr-0.5">
                {channelGroups.length > 0 ? (
                  channelGroups.map((group) => {
                    const isActive = pathname === `/channels/${group._id}`;
                    return (
                      <Link
                        key={group._id}
                        href={`/channels/${group._id}`}
                        className={`group flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-xs font-medium transition-colors border ${
                          isActive
                            ? 'bg-zinc-950 text-white border-zinc-950'
                            : 'text-zinc-700 border-transparent hover:text-zinc-950 hover:bg-zinc-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Hash
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isActive
                                ? 'text-zinc-300'
                                : 'text-zinc-400 group-hover:text-zinc-700'
                            }`}
                          />
                          <span className="truncate">{group.name}</span>
                        </div>
                        {group.members && (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] ${
                              isActive
                                ? 'bg-zinc-800 text-zinc-200'
                                : 'bg-zinc-200/60 text-zinc-600'
                            }`}
                          >
                            {group.members.length}
                          </span>
                        )}
                      </Link>
                    );
                  })
                ) : (
                  <div className="p-2.5 rounded-[6px] bg-white border border-zinc-200 text-xs text-zinc-500 text-center">
                    No channels yet.
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(true)}
                      className="block mx-auto mt-1 text-zinc-950 font-semibold hover:underline cursor-pointer"
                    >
                      + Create a channel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Direct Messages (1-to-1 Person-to-Person) Section */}
          <div className="px-3 pt-4">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-zinc-500 px-1.5 py-1 mb-1">
              <button
                type="button"
                onClick={() => setIsDMsExpanded(!isDMsExpanded)}
                className="flex items-center gap-1.5 hover:text-zinc-900 transition-colors cursor-pointer"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                    isDMsExpanded ? '' : '-rotate-90'
                  }`}
                />
                <span>Direct Messages ({directGroups.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setIsNewDMModalOpen(true)}
                title="Start Person-to-Person DM"
                className="w-5 h-5 rounded-[4px] hover:bg-zinc-200/70 text-zinc-600 hover:text-zinc-950 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {isDMsExpanded && (
              <div className="space-y-0.5 max-h-44 overflow-y-auto pr-0.5">
                {directGroups.length > 0 ? (
                  directGroups.map((dmGroup) => {
                    const isActive = pathname === `/channels/${dmGroup._id}`;
                    const partner = getDirectPartner(dmGroup, currentUser);
                    const partnerName = partner?.username || dmGroup.name;
                    const online = partner ? isOnline(partner._id) : false;

                    return (
                      <Link
                        key={dmGroup._id}
                        href={`/channels/${dmGroup._id}`}
                        className={`group flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-xs font-medium transition-colors border ${
                          isActive
                            ? 'bg-zinc-950 text-white border-zinc-950'
                            : 'text-zinc-700 border-transparent hover:text-zinc-950 hover:bg-zinc-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className="relative shrink-0">
                            <div
                              className={`w-5 h-5 rounded-[4px] flex items-center justify-center text-[10px] font-bold border ${
                                isActive
                                  ? 'bg-zinc-800 text-white border-zinc-700'
                                  : 'bg-white text-zinc-900 border-zinc-200'
                              }`}
                            >
                              {partnerName.charAt(0).toUpperCase()}
                            </div>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-[2px] border border-white ${
                                online ? 'bg-emerald-600' : 'bg-zinc-300'
                              }`}
                            />
                          </div>
                          <span className="truncate">@{partnerName}</span>
                        </div>
                        <span
                          className={`text-[10px] font-mono ${
                            isActive
                              ? 'text-zinc-300'
                              : online
                              ? 'text-emerald-700'
                              : 'text-zinc-400'
                          }`}
                        >
                          {online ? 'online' : '1:1'}
                        </span>
                      </Link>
                    );
                  })
                ) : (
                  <div className="p-2.5 rounded-[6px] bg-white border border-zinc-200 text-xs text-zinc-500 text-center">
                    No direct messages yet.
                    <button
                      type="button"
                      onClick={() => setIsNewDMModalOpen(true)}
                      className="block mx-auto mt-1 text-zinc-950 font-semibold hover:underline cursor-pointer"
                    >
                      + Message a person
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Clickable Teammates Section (click any user to message 1-on-1) */}
          <div className="px-3 pt-4 pb-3">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-zinc-500 px-1.5 py-1 mb-1">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Teammates ({teammates.length})</span>
              </div>
            </div>

            <div className="space-y-0.5 max-h-40 overflow-y-auto pr-0.5">
              {teammates.length > 0 ? (
                teammates.map((member) => {
                  const online = isOnline(member._id);
                  const isOpening = openingDMUserId === member._id;
                  return (
                    <button
                      key={member._id}
                      type="button"
                      disabled={isOpening}
                      onClick={() => handleOpenTeammateDM(member._id)}
                      title={`Click to message @${member.username} directly`}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-xs text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="relative shrink-0">
                          <div className="w-6 h-6 rounded-[4px] bg-white border border-zinc-200 text-zinc-900 flex items-center justify-center text-[10px] font-bold">
                            {member.username.charAt(0).toUpperCase()}
                          </div>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-[2px] border border-white ${
                              online ? 'bg-emerald-600' : 'bg-zinc-300'
                            }`}
                          />
                        </div>
                        <span className="truncate font-medium">
                          @{member.username}
                        </span>
                      </div>
                      {isOpening ? (
                        <Loader2 className="w-3 h-3 animate-spin text-zinc-500" />
                      ) : (
                        <span
                          className={`text-[10px] font-mono ${
                            online ? 'text-emerald-700' : 'text-zinc-400'
                          }`}
                        >
                          {online ? 'online' : 'message'}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="px-2 py-2 text-xs text-zinc-500">
                  Search any user via + above to start a 1:1 chat.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Current User Strip */}
        <div className="p-3 border-t border-zinc-200 bg-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-[6px] bg-zinc-950 text-white flex items-center justify-center text-xs font-bold">
                  {currentUser?.username
                    ? currentUser.username.charAt(0).toUpperCase()
                    : 'U'}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-600 border border-white rounded-[2px]" />
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-zinc-950 truncate">
                  @{currentUser?.username || 'user'}
                </div>
                <div className="text-[11px] text-zinc-500 truncate">
                  {currentUser?.email || 'Connected'}
                </div>
              </div>
            </div>
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
        teammates={teammates}
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
