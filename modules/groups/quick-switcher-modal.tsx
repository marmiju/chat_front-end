'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Group } from '@/modules/core/types';
import { isDirectGroup, getGroupDisplayName } from './groups.service';
import { useWorkspace } from '@/modules/workspace/workspace-provider';
import { Search, Hash, Plus, X, MessageSquare } from 'lucide-react';

interface QuickSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: Group[];
  onOpenCreate: () => void;
}

export default function QuickSwitcherModal({
  isOpen,
  onClose,
  groups,
  onOpenCreate,
}: QuickSwitcherModalProps) {
  const router = useRouter();
  const { currentUser } = useWorkspace();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredGroups = groups.filter((g) => {
    const label = getGroupDisplayName(g, currentUser);
    return label.toLowerCase().includes(query.toLowerCase().trim());
  });

  const handleSelectGroup = (groupId: string) => {
    router.push(`/channels/${groupId}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-zinc-950/40 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white border border-zinc-200 rounded-[8px] overflow-hidden">
        <div className="border-b border-zinc-200 p-3 flex items-center gap-2.5">
          <Search className="w-4 h-4 text-zinc-400 shrink-0 ml-1" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter channels or @direct-messages..."
            className="w-full bg-transparent text-zinc-950 placeholder-zinc-400 text-sm focus:outline-none py-1"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-900 rounded-[4px] hover:bg-zinc-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-2.5 py-1.5">
            Conversations ({filteredGroups.length})
          </div>
          {filteredGroups.length > 0 ? (
            filteredGroups.map((g) => {
              const direct = isDirectGroup(g);
              const label = getGroupDisplayName(g, currentUser);

              return (
                <button
                  key={g._id}
                  type="button"
                  onClick={() => handleSelectGroup(g._id)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-[6px] hover:bg-zinc-100 text-zinc-800 text-xs transition-colors group text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {direct ? (
                      <MessageSquare className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900" />
                    ) : (
                      <Hash className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900" />
                    )}
                    <span className="font-bold text-zinc-950">
                      {direct ? `@${label}` : label}
                    </span>
                    {!direct && g.description && (
                      <span className="text-xs text-zinc-500 truncate max-w-xs">
                        {g.description}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {direct ? '1:1 DM' : `${g.members?.length || 0} members`}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="text-center py-6 text-xs text-zinc-500">
              No conversation matches &quot;{query}&quot;
            </div>
          )}

          <div className="pt-2 mt-2 border-t border-zinc-200">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCreate();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-[6px] text-zinc-950 hover:bg-zinc-100 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create a new channel</span>
            </button>
          </div>
        </div>

        <div className="bg-[#fafafa] px-4 py-2 text-[11px] font-mono text-zinc-500 flex items-center justify-between border-t border-zinc-200">
          <span>Quick Switcher</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
}
