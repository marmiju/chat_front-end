'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Group, User, OnlineUser } from '@/modules/core/types';
import {
  groupsService,
  isDirectGroup,
  getDirectPartner,
  getGroupDisplayName,
} from './groups.service';
import {
  X,
  Hash,
  UserPlus,
  LogOut,
  Trash2,
  Crown,
  Calendar,
  Users,
  Info,
  Loader2,
  UserMinus,
  Mail,
} from 'lucide-react';
import { useWorkspace } from '@/modules/workspace/workspace-provider';
import AddMemberModal from './add-member-modal';

interface ChannelDetailsDrawerProps {
  channel: Group;
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  onlineUsers?: OnlineUser[];
}

export default function ChannelDetailsDrawer({
  channel,
  currentUser,
  isOpen,
  onClose,
  onlineUsers = [],
}: ChannelDetailsDrawerProps) {
  const router = useRouter();
  const { removeGroup, removeMemberFromLocalGroup } = useWorkspace();
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isDirect = isDirectGroup(channel);
  const directPartner = isDirect
    ? getDirectPartner(channel, currentUser)
    : null;
  const displayName = getGroupDisplayName(channel, currentUser);

  const adminId =
    typeof channel.admin === 'string' ? channel.admin : channel.admin?._id;
  const adminUsername =
    typeof channel.admin === 'object' ? channel.admin?.username : 'Admin';

  const isAdmin = Boolean(currentUser && adminId === currentUser._id);

  const isOnline = (userId: string) =>
    onlineUsers.some((u) => u.userId === userId);

  const handleLeaveChannel = async () => {
    if (!confirm(`Leave ${isDirect ? `@${displayName}` : `#${channel.name}`}?`))
      return;
    setIsLeaving(true);
    setActionError(null);

    try {
      await groupsService.leaveGroup(channel._id);
      removeGroup(channel._id);
      router.push('/channels');
    } catch (err: any) {
      setActionError(err.message || 'Failed to leave conversation');
      setIsLeaving(false);
    }
  };

  const handleDeleteChannel = async () => {
    if (
      !confirm(
        `Delete ${
          isDirect ? `conversation with @${displayName}` : `#${channel.name}`
        }? This will permanently delete all messages.`
      )
    )
      return;
    setIsDeleting(true);
    setActionError(null);

    try {
      await groupsService.deleteGroup(channel._id);
      removeGroup(channel._id);
      router.push('/channels');
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete conversation');
      setIsDeleting(false);
    }
  };

  const handleAdminRemoveMember = async (memberId: string, username: string) => {
    if (!confirm(`Remove @${username} from #${channel.name}?`)) return;
    setRemovingUserId(memberId);
    setActionError(null);

    try {
      await groupsService.adminRemoveMemberSocket(
        currentUser,
        channel._id,
        memberId
      );
      removeMemberFromLocalGroup(channel._id, memberId);
    } catch (err: any) {
      setActionError(err.message || 'Failed to remove member');
    } finally {
      setRemovingUserId(null);
    }
  };

  const createdDate = channel.createdAt
    ? new Date(channel.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <>
      <aside className="w-80 bg-[#fafafa] border-l border-zinc-200 flex flex-col justify-between h-full shrink-0 z-20">
        <div className="flex flex-col h-full overflow-hidden">
          <div className="h-14 px-4 border-b border-zinc-200 bg-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-zinc-500" />
              <span className="font-bold text-zinc-950 text-xs uppercase tracking-wider font-mono">
                {isDirect ? 'Direct Message Profile' : 'Channel Inspector'}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-[4px] text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {actionError && (
            <div className="m-3 p-2.5 rounded-[6px] bg-red-50 border border-red-200 text-red-700 text-xs">
              {actionError}
            </div>
          )}

          <div className="overflow-y-auto flex-1 p-4 space-y-5">
            {/* Identity Card */}
            <div className="p-4 rounded-[6px] bg-white border border-zinc-200">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-9 h-9 rounded-[6px] bg-zinc-950 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                  {isDirect ? (
                    displayName.charAt(0).toUpperCase()
                  ) : (
                    <Hash className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-zinc-950 truncate">
                    {isDirect ? `@${displayName}` : `#${channel.name}`}
                  </h2>
                  <div className="text-[11px] font-mono text-zinc-500">
                    {isDirect
                      ? '1-to-1 Direct Message'
                      : `ID: ${channel._id.slice(-8)}`}
                  </div>
                </div>
              </div>
              {isDirect && directPartner?.email ? (
                <div className="flex items-center gap-1.5 text-xs text-zinc-600 mt-2 pt-2 border-t border-zinc-100">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="truncate">{directPartner.email}</span>
                </div>
              ) : (
                channel.description && (
                  <p className="text-xs text-zinc-600 mt-2 pt-2 border-t border-zinc-100">
                    {channel.description}
                  </p>
                )
              )}
            </div>

            {/* Metadata */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                Metadata
              </div>
              <div className="p-3 rounded-[6px] bg-white border border-zinc-200 space-y-2 text-xs">
                {createdDate && (
                  <div className="flex items-center gap-2 text-zinc-600">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Started {createdDate}</span>
                  </div>
                )}
                {!isDirect && adminId && (
                  <div className="flex items-center gap-2 text-zinc-600">
                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                    <span>Admin: @{adminUsername}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Participants List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    {isDirect
                      ? 'Participants (2)'
                      : `Members (${channel.members?.length || 0})`}
                  </span>
                </div>
                {!isDirect && (
                  <button
                    type="button"
                    onClick={() => setIsAddMemberModalOpen(true)}
                    className="text-zinc-950 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Invite</span>
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5">
                {channel.members?.map((member) => {
                  const online = isOnline(member._id);
                  const isMemberAdmin = !isDirect && adminId === member._id;
                  const canRemove =
                    !isDirect &&
                    isAdmin &&
                    !isMemberAdmin &&
                    member._id !== currentUser?._id;

                  return (
                    <div
                      key={member._id}
                      className="flex items-center justify-between p-2 rounded-[6px] bg-white border border-zinc-200"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative shrink-0">
                          <div className="w-7 h-7 rounded-[4px] bg-zinc-100 border border-zinc-200 text-zinc-900 flex items-center justify-center text-xs font-bold">
                            {member.username.charAt(0).toUpperCase()}
                          </div>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-[2px] border border-white ${
                              online ? 'bg-emerald-600' : 'bg-zinc-300'
                            }`}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-zinc-950 flex items-center gap-1 truncate">
                            <span className="truncate">@{member.username}</span>
                            {isMemberAdmin && (
                              <span title="Channel Admin">
                                <Crown className="w-3 h-3 text-amber-600 shrink-0" />
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-500 truncate max-w-[130px]">
                            {member.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[10px] font-mono ${
                            online ? 'text-emerald-700' : 'text-zinc-400'
                          }`}
                        >
                          {online ? 'online' : 'offline'}
                        </span>
                        {canRemove && (
                          <button
                            type="button"
                            disabled={removingUserId === member._id}
                            onClick={() =>
                              handleAdminRemoveMember(
                                member._id,
                                member.username
                              )
                            }
                            title={`Remove @${member.username}`}
                            className="p-1 rounded-[4px] text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            {removingUserId === member._id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <UserMinus className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Controls */}
            <div className="pt-3 border-t border-zinc-200 space-y-2">
              {!isDirect && (
                <button
                  type="button"
                  disabled={isLeaving}
                  onClick={handleLeaveChannel}
                  className="w-full py-2 px-3 rounded-[6px] bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {isLeaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LogOut className="w-3.5 h-3.5" />
                  )}
                  <span>Leave Channel</span>
                </button>
              )}

              {isAdmin && (
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteChannel}
                  className="w-full py-2 px-3 rounded-[6px] border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {isDeleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  )}
                  <span>
                    {isDirect
                      ? 'Delete Conversation'
                      : 'Delete Channel (Admin)'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {!isDirect && (
        <AddMemberModal
          isOpen={isAddMemberModalOpen}
          onClose={() => setIsAddMemberModalOpen(false)}
          channel={channel}
        />
      )}
    </>
  );
}
