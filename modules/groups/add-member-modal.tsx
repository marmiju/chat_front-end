'use client';

import React, { useState, useEffect } from 'react';
import { authService } from '@/modules/auth/auth.service';
import { groupsService } from './groups.service';
import { Group, User } from '@/modules/core/types';
import { useWorkspace } from '@/modules/workspace/workspace-provider';
import { UserPlus, Search, X, Loader2, Check } from 'lucide-react';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: Group;
}

export default function AddMemberModal({
  isOpen,
  onClose,
  channel,
}: AddMemberModalProps) {
  const { updateGroup } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setError(null);
      try {
        const users = await authService.searchUsers(searchQuery.trim());
        setSearchResults(users || []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isOpen) return null;

  const existingMemberIds = new Set(channel.members.map((m) => m._id));

  const handleAddUser = async (user: User) => {
    setAddingUserId(user._id);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await groupsService.joinGroup(channel._id, user._id);
      if (res?.group) {
        updateGroup(res.group);
      }
      setSuccessMsg(`Added @${user.username} to #${channel.name}`);
      setTimeout(() => {
        onClose();
      }, 650);
    } catch (err: any) {
      setError(err.message || 'Failed to add user to channel');
    } finally {
      setAddingUserId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white border border-zinc-200 rounded-[8px] p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-900 transition-colors p-1 rounded-[4px] hover:bg-zinc-100 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-[6px] bg-zinc-100 border border-zinc-200 text-zinc-900 flex items-center justify-center">
            <UserPlus className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-bold text-zinc-950">
            Add members to #{channel.name}
          </h2>
        </div>
        <p className="text-xs text-zinc-600 mb-4">
          Search registered teammates by username to add them to this channel.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-[6px] bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-[6px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username..."
            className="w-full pl-9 pr-4 py-2 rounded-[6px] bg-white border border-zinc-200 text-zinc-950 placeholder-zinc-400 text-sm focus:outline-none focus:border-zinc-900"
          />
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
            </div>
          )}
        </div>

        <div className="max-h-60 overflow-y-auto space-y-1.5 mb-4 pr-0.5">
          {searchResults.length > 0 ? (
            searchResults.map((user) => {
              const isAlreadyMember = existingMemberIds.has(user._id);
              const isAdding = addingUserId === user._id;

              return (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-2.5 rounded-[6px] bg-[#fafafa] border border-zinc-200"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-[4px] bg-zinc-900 text-white flex items-center justify-center text-xs font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-950">
                        @{user.username}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        {user.email}
                      </div>
                    </div>
                  </div>

                  {isAlreadyMember ? (
                    <span className="text-[11px] font-mono px-2 py-1 rounded-[4px] bg-zinc-100 text-zinc-500 border border-zinc-200">
                      Member
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isAdding}
                      onClick={() => handleAddUser(user)}
                      className="px-3 py-1.5 rounded-[4px] text-xs font-semibold text-white bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {isAdding ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Adding...</span>
                        </>
                      ) : (
                        <span>Add</span>
                      )}
                    </button>
                  )}
                </div>
              );
            })
          ) : searchQuery.trim() && !isSearching ? (
            <div className="text-center py-6 text-xs text-zinc-500 border border-zinc-200 rounded-[6px] bg-[#fafafa]">
              No users found matching &quot;{searchQuery}&quot;
            </div>
          ) : !searchQuery.trim() ? (
            <div className="text-center py-6 text-xs text-zinc-500 border border-zinc-200 rounded-[6px] bg-[#fafafa]">
              Type a username to search via `/api/user/search`
            </div>
          ) : null}
        </div>

        <div className="flex justify-end pt-3 border-t border-zinc-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-[6px] text-xs font-medium text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 border border-zinc-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

