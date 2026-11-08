'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User } from '@/modules/core/types';
import { authService } from '@/modules/auth/auth.service';
import UserAvatar from '@/modules/core/user-avatar';
import { Hash, Home, LogOut, Settings } from 'lucide-react';

interface WorkspaceRailProps {
  currentUser: User | null;
  onOpenProfile?: () => void;
}

export default function WorkspaceRail({
  currentUser,
  onOpenProfile,
}: WorkspaceRailProps) {
  const router = useRouter();

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="w-14 bg-[#fafafa] border-r border-zinc-200 flex flex-col items-center justify-between py-3 select-none shrink-0 z-30">
      {/* Top Icons */}
      <div className="flex flex-col items-center gap-2.5 w-full">
        <Link
          href="/channels"
          title="Workspace Home"
          className="w-9 h-9 rounded-[6px] bg-zinc-950 text-white flex items-center justify-center font-mono text-xs font-bold border border-zinc-950 hover:bg-zinc-800 transition-colors"
        >
          NP
        </Link>

        <div className="w-7 h-px bg-zinc-200 my-1" />

        <Link
          href="/channels"
          title="Channels"
          className="w-9 h-9 rounded-[6px] bg-white border border-zinc-200 text-zinc-900 flex items-center justify-center hover:bg-zinc-100 transition-colors"
        >
          <Hash className="w-4 h-4" />
        </Link>

        <Link
          href="/"
          title="Landing Page & Architecture"
          className="w-9 h-9 rounded-[6px] text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 border border-transparent hover:border-zinc-200 flex items-center justify-center transition-colors"
        >
          <Home className="w-4 h-4" />
        </Link>
      </div>

      {/* Bottom Profile & Logout */}
      <div className="flex flex-col items-center gap-2.5 w-full">
        <button
          type="button"
          onClick={onOpenProfile}
          title="Edit Profile & Settings"
          className="w-9 h-9 rounded-[6px] text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 border border-transparent hover:border-zinc-200 flex items-center justify-center transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleLogout}
          title="Sign Out"
          className="w-9 h-9 rounded-[6px] text-zinc-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 flex items-center justify-center transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onOpenProfile}
          title={`Edit Profile: ${
            currentUser?.displayName || currentUser?.username || 'User'
          } (${currentUser?.email || ''})`}
          className="cursor-pointer rounded-[6px] hover:ring-2 hover:ring-zinc-300 transition-all"
        >
          <UserAvatar
            name={currentUser?.displayName || currentUser?.username}
            avatar={currentUser?.avatar}
            size="lg"
            variant="subtle"
            isOnline={true}
            showStatusDot={true}
          />
        </button>
      </div>
    </aside>
  );
}

