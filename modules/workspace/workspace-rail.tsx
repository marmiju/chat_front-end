'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User } from '@/modules/core/types';
import { authService } from '@/modules/auth/auth.service';
import { Hash, Home, LogOut, Terminal } from 'lucide-react';

interface WorkspaceRailProps {
  currentUser: User | null;
}

export default function WorkspaceRail({ currentUser }: WorkspaceRailProps) {
  const router = useRouter();

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
    router.refresh();
  };

  const userInitial = currentUser?.username
    ? currentUser.username.charAt(0).toUpperCase()
    : 'U';

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
          onClick={handleLogout}
          title="Sign Out"
          className="w-9 h-9 rounded-[6px] text-zinc-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 flex items-center justify-center transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>

        <div
          title={`${currentUser?.username || 'User'} (${
            currentUser?.email || ''
          })`}
          className="relative"
        >
          <div className="w-9 h-9 rounded-[6px] bg-zinc-100 border border-zinc-200 text-zinc-900 flex items-center justify-center font-bold text-xs">
            {userInitial}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-600 border border-white rounded-[2px]" />
        </div>
      </div>
    </aside>
  );
}

