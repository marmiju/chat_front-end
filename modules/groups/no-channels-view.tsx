'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import CreateChannelModal from './create-channel-modal';

export default function NoChannelsView() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white text-center px-4">
      <div className="max-w-sm">
        <p className="text-sm font-medium text-zinc-900 mb-1">
          No channels yet
        </p>
        <p className="text-xs text-zinc-400 mb-5">
          Create a channel to start a conversation.
        </p>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New channel</span>
        </button>
      </div>

      <CreateChannelModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}


