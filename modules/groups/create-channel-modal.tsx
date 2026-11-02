'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/modules/workspace/workspace-provider';
import { groupsService } from './groups.service';
import { Hash, X, Loader2 } from 'lucide-react';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateChannelModal({
  isOpen,
  onClose,
}: CreateChannelModalProps) {
  const router = useRouter();
  const { addGroup } = useWorkspace();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const formattedName = name.trim().toLowerCase().replace(/\s+/g, '-');
      const newGroup = await groupsService.createGroup({
        name: formattedName,
        description: description.trim(),
      });

      addGroup(newGroup);
      onClose();
      setName('');
      setDescription('');
      router.push(`/channels/${newGroup._id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create channel');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white border border-zinc-200 rounded-[8px] p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-900 transition-colors p-1 rounded-[4px] hover:bg-zinc-100 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-[6px] bg-zinc-100 border border-zinc-200 text-zinc-900 flex items-center justify-center">
            <Hash className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-bold text-zinc-950">Create a channel</h2>
        </div>
        <p className="text-xs text-zinc-600 mb-5">
          Channels organize conversations around a topic — e.g. #backend-api,
          #design, or #releases.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-[6px] bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
              Channel Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 font-bold text-sm">
                #
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. architecture-sync"
                className="w-full pl-7 pr-3.5 py-2 rounded-[6px] bg-white border border-zinc-200 text-zinc-950 placeholder-zinc-400 text-sm focus:outline-none focus:border-zinc-900"
              />
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">
              Spaces are automatically formatted to hyphens.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
              Description{' '}
              <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this channel used for?"
              className="w-full px-3.5 py-2 rounded-[6px] bg-white border border-zinc-200 text-zinc-950 placeholder-zinc-400 text-sm focus:outline-none focus:border-zinc-900 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[6px] text-xs font-medium text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 border border-zinc-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="px-4 py-2 rounded-[6px] text-xs font-semibold text-white bg-zinc-950 hover:bg-zinc-800 border border-zinc-950 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Channel</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

