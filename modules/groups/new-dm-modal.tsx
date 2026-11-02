'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/modules/auth/auth.service';
import { groupsService } from './groups.service';
import { User } from '@/modules/core/types';
import { useWorkspace } from '@/modules/workspace/workspace-provider';
import { MessageSquare, Search, X, Loader2, ArrowRight } from 'lucide-react';

interface NewDirectMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  teammates?: Array<{ _id: string; username: string; email: string }>;
}

export default function NewDirectMessageModal({
  isOpen,
  onClose,
  teammates = [],
}: NewDirectMessageModalProps) {
  const router = useRouter();
  const { currentUser, addGroup } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [startingUserId, setStartingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setError(null);
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
        setSearchResults(
          (users || []).filter((u) => u._id !== currentUser?._id)
        );
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, currentUser?._id]);

  if (!isOpen) return null;

  const displayUsers = searchQuery.trim() ? searchResults : teammates;

  const handleStartDM = async (targetUser: {
    _id: string;
    username: string;
  }) => {
    setStartingUserId(targetUser._id);
    setError(null);

    try {
      const dmGroup = await groupsService.startDirectMessage(targetUser._id);
      addGroup(dmGroup);
      onClose();
      router.push(`/channels/${dmGroup._id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to start direct message');
    } finally {
      setStartingUserId(null);
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
            <MessageSquare className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-bold text-zinc-950">
            New Direct Message
          </h2>
        </div>
        <p className="text-xs text-zinc-600 mb-4">
          Start a private 1-to-1 conversation with any user in the workspace.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-[6px] bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
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
            placeholder="Find a person by username..."
            className="w-full pl-9 pr-4 py-2 rounded-[6px] bg-white border border-zinc-200 text-zinc-950 placeholder-zinc-400 text-sm focus:outline-none focus:border-zinc-900"
          />
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
            </div>
          )}
        </div>

        <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-2">
          {searchQuery.trim() ? 'Search Results' : 'Suggested Teammates'}
        </div>

        <div className="max-h-60 overflow-y-auto space-y-1.5 mb-4 pr-0.5">
          {displayUsers.length > 0 ? (
            displayUsers.map((user) => {
              const isStarting = startingUserId === user._id;
              return (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-2.5 rounded-[6px] bg-[#fafafa] border border-zinc-200 hover:border-zinc-300 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-[4px] bg-zinc-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-zinc-950 truncate">
                        @{user.username}
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate">
                        {user.email}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isStarting}
                    onClick={() => handleStartDM(user)}
                    className="px-3 py-1.5 rounded-[4px] text-xs font-semibold text-white bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {isStarting ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Opening...</span>
                      </>
                    ) : (
                      <>
                        <span>Message</span>
                        <ArrowRight className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </div>
              );
            })
          ) : searchQuery.trim() && !isSearching ? (
            <div className="text-center py-6 text-xs text-zinc-500 border border-zinc-200 rounded-[6px] bg-[#fafafa]">
              No user found matching &quot;{searchQuery}&quot;
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-zinc-500 border border-zinc-200 rounded-[6px] bg-[#fafafa]">
              Type any username above to start a 1-to-1 conversation.
            </div>
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-zinc-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-[6px] text-xs font-medium text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 border border-zinc-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

