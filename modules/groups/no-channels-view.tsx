'use client';

import React, { useState } from 'react';
import { Plus, MessageSquare } from 'lucide-react';
import CreateChannelModal from './create-channel-modal';

export default function NoChannelsView() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white text-center px-4">
      <div className="max-w-md p-8 border border-zinc-200 rounded-[8px] bg-[#fafafa]">
        <div className="w-12 h-12 rounded-[6px] bg-white border border-zinc-200 text-zinc-950 flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-zinc-950 mb-1.5">
          No Active Channels Yet
        </h2>
        <p className="text-xs text-zinc-600 mb-6 leading-relaxed">
          Create your first channel to start sending real-time messages,
          inviting teammates, and tracking read receipts.
        </p>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-[6px] bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-xs border border-zinc-950 inline-flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create First Channel</span>
        </button>
      </div>

      <CreateChannelModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}

