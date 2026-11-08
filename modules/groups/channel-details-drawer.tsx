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
  Loader2,
  UserMinus,
  Mail,
  Briefcase,
  Phone,
} from 'lucide-react';
import { useWorkspace } from '@/modules/workspace/workspace-provider';
import UserAvatar from '@/modules/core/user-avatar';
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

  const isAdmin = Boolean(
    currentUser && String(adminId) === String(currentUser._id)
  );

  const isOnline = (userId: string) =>
    onlineUsers.some((u) => String(u.userId) === String(userId));

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

  const handleAdminRemoveMember = async (
    memberId: string,
    username: string
  ) => {
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

  return (
    <>
      <aside className="w-72 bg-[#fafafa] border-l border-zinc-200/80 flex flex-col justify-between h-full shrink-0 z-20">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="h-14 px-4 border-b border-zinc-200/80 flex items-center justify-between shrink-0">
            <span className="font-semibold text-zinc-900 text-xs">
              {isDirect ? 'Profile' : 'Channel details'}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/60 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {actionError && (
            <div className="m-3 p-2.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs">
              {actionError}
            </div>
          )}

          <div className="overflow-y-auto flex-1 p-4 space-y-6">
            {/* Identity Summary */}
            <div>
              <div className="flex items-center gap-3">
                {isDirect ? (
                  <UserAvatar
                    name={directPartner?.displayName || displayName}
                    avatar={directPartner?.avatar}
                    size="lg"
                    variant="dark"
                    isOnline={
                      directPartner ? isOnline(directPartner._id) : false
                    }
                    showStatusDot={true}
                  />
                ) : (
                  <div className="w-9 h-9 rounded-md bg-zinc-200/80 text-zinc-800 flex items-center justify-center shrink-0">
                    <Hash className="w-4 h-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-zinc-950 truncate">
                    {isDirect
                      ? directPartner?.displayName || `@${displayName}`
                      : channel.name}
                  </h2>
                  <div className="text-xs text-zinc-400 truncate">
                    {isDirect
                      ? `@${displayName}`
                      : `${channel.members?.length || 0} members`}
                  </div>
                </div>
              </div>

              {isDirect ? (
                <div className="space-y-2 mt-4 text-xs text-zinc-600">
                  {directPartner?.statusText && (
                    <div className="text-zinc-800 font-medium">
                      {directPartner.statusText}
                    </div>
                  )}
                  {directPartner?.title && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{directPartner.title}</span>
                    </div>
                  )}
                  {directPartner?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{directPartner.email}</span>
                    </div>
                  )}
                  {directPartner?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{directPartner.phone}</span>
                    </div>
                  )}
                  {directPartner?.bio && (
                    <p className="text-xs text-zinc-500 pt-2 border-t border-zinc-200/70 leading-relaxed">
                      {directPartner.bio}
                    </p>
                  )}
                </div>
              ) : (
                channel.description && (
                  <p className="text-xs text-zinc-500 mt-3 leading-relaxed">
                    {channel.description}
                  </p>
                )
              )}
            </div>

            {/* Members */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                  Members ({channel.members?.length || 0})
                </span>
                {!isDirect && (
                  <button
                    type="button"
                    onClick={() => setIsAddMemberModalOpen(true)}
                    className="text-xs text-zinc-700 hover:text-zinc-950 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                )}
              </div>

              <div className="space-y-1">
                {channel.members?.map((member) => {
                  const online = isOnline(member._id);
                  const isMemberAdmin =
                    !isDirect && String(adminId) === String(member._id);
                  const canRemove =
                    !isDirect &&
                    isAdmin &&
                    !isMemberAdmin &&
                    String(member._id) !== String(currentUser?._id);

                  return (
                    <div
                      key={member._id}
                      className="group flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-zinc-200/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar
                          name={member.displayName || member.username}
                          avatar={member.avatar}
                          size="xs"
                          variant="subtle"
                          isOnline={online}
                          showStatusDot={true}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-zinc-900 flex items-center gap-1 truncate">
                            <span className="truncate">
                              {member.displayName || member.username}
                            </span>
                            {isMemberAdmin && (
                              <span title="Channel Admin">
                                <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {canRemove && (
                        <button
                          type="button"
                          disabled={removingUserId === member._id}
                          onClick={() =>
                            handleAdminRemoveMember(member._id, member.username)
                          }
                          title={`Remove @${member.username}`}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-400 hover:text-red-600 transition-opacity cursor-pointer"
                        >
                          {removingUserId === member._id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <UserMinus className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quiet Actions */}
            <div className="pt-4 border-t border-zinc-200/80 space-y-1.5">
              {!isDirect && (
                <button
                  type="button"
                  disabled={isLeaving}
                  onClick={handleLeaveChannel}
                  className="w-full py-1.5 px-2.5 rounded-md hover:bg-zinc-200/60 text-zinc-600 hover:text-zinc-900 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {isLeaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LogOut className="w-3.5 h-3.5" />
                  )}
                  <span>Leave channel</span>
                </button>
              )}

              {isAdmin && (
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteChannel}
                  className="w-full py-1.5 px-2.5 rounded-md hover:bg-red-50 text-red-600 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {isDeleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isDirect ? 'Delete conversation' : 'Delete channel'}
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
