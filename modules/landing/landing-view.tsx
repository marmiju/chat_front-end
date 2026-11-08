'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getClientToken, getClientUser } from '@/modules/core/storage';
import { ThemeToggle } from '@/modules/core/theme-provider';
import { Hash, MessageSquare, CheckCheck, ArrowRight } from 'lucide-react';

export default function LandingView() {
  const [loggedInUser, setLoggedInUser] = useState<{ username: string } | null>(
    null
  );

  useEffect(() => {
    const token = getClientToken();
    const user = getClientUser();
    if (token && user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoggedInUser(user);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col justify-between">
      {/* Minimal Header */}
      <header className="max-w-5xl w-full mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-zinc-900 text-white flex items-center justify-center text-xs font-semibold">
            N
          </div>
          <span className="font-semibold text-sm tracking-tight">
            NexusPulse
          </span>
        </Link>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          {loggedInUser ? (
            <Link
              href="/channels"
              className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Open Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-950 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-3xl w-full mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-zinc-950 leading-tight">
          Calm, fast messaging for teams.
        </h1>
        <p className="mt-4 text-sm sm:text-base text-zinc-500 max-w-xl mx-auto leading-relaxed">
          Organize conversations in channels, message teammates directly, and
          see when your messages are delivered and read in real time.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href={loggedInUser ? '/channels' : '/register'}
            className="px-5 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors"
          >
            <span>{loggedInUser ? 'Go to Channels' : 'Start chatting'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          {!loggedInUser && (
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>

        {/* 3 Minimalist Feature Pillars */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="p-5 rounded-xl bg-[#fafafa] border border-zinc-200/70">
            <Hash className="w-4 h-4 text-zinc-700 mb-3" />
            <h2 className="text-xs font-semibold text-zinc-900">
              Focused Channels
            </h2>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Keep projects and topics organized in clean, distraction-free
              group channels.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#fafafa] border border-zinc-200/70">
            <MessageSquare className="w-4 h-4 text-zinc-700 mb-3" />
            <h2 className="text-xs font-semibold text-zinc-900">
              Direct Messages
            </h2>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Start a private 1-on-1 conversation with any teammate in a single
              click.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#fafafa] border border-zinc-200/70">
            <CheckCheck className="w-4 h-4 text-zinc-700 mb-3" />
            <h2 className="text-xs font-semibold text-zinc-900">
              Live Presence & Receipts
            </h2>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Instant online indicators, typing status, and real-time read
              receipts.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto px-6 py-8 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
        <span>NexusPulse</span>
        <span>Real-time team communication</span>
      </footer>
    </div>
  );
}
