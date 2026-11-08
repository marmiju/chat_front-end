'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/modules/workspace/workspace-provider';
import { groupsService } from './groups.service';
import { Loader2 } from 'lucide-react';

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
  const [name, setName] = useState('new_channel');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('new_channel');
      setDescription('');
      setError(null);
      setTimeout(() => {
        titleInputRef.current?.focus();
        titleInputRef.current?.select();
      }, 10);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim() || isLoading) return;

    setError(null);
    setIsLoading(true);

    try {
      const formattedName = name.trim().toLowerCase().replace(/\s+/g, '_');
      const newGroup = await groupsService.createGroup({
        name: formattedName,
        description: description.trim(),
      });

      addGroup(newGroup);
      onClose();
      router.push(`/channels/${newGroup._id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create channel');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/25 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white border border-zinc-200/80 rounded-xl p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {error && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-lg font-semibold text-zinc-400 select-none">
              #
            </span>
            <input
              ref={titleInputRef}
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="new_channel"
              className="w-full bg-transparent text-lg font-semibold text-zinc-900 placeholder-zinc-300 focus:outline-none rounded px-1 -mx-1 hover:bg-zinc-50 focus:bg-zinc-50/80 transition-colors"
            />
          </div>

          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                handleSubmit();
              }
            }}
            placeholder="Add a description..."
            className="w-full bg-transparent text-sm text-zinc-600 placeholder-zinc-400 focus:outline-none resize-none rounded px-1 -mx-1 py-1 hover:bg-zinc-50 focus:bg-zinc-50/80 transition-colors leading-relaxed"
          />

          <div className="flex items-center justify-end gap-2 pt-3 mt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


