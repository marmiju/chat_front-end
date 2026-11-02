'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from './auth.service';
import { ArrowRight, Loader2, User, Mail, Lock } from 'lucide-react';

export default function RegisterView() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data = await authService.register({ username, email, password });
      if (data.token) {
        router.push('/channels');
        router.refresh();
      } else {
        const loginData = await authService.login({ email, password });
        if (loginData.token) {
          router.push('/channels');
          router.refresh();
        }
      }
    } catch (err: any) {
      setError(
        err.message || 'Registration failed. Please check your details.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-950 flex flex-col justify-between px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Bar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[6px] bg-zinc-950 text-white flex items-center justify-center font-mono text-xs font-bold">
            NP
          </div>
          <span className="font-bold text-sm tracking-tight text-zinc-950">
            NexusPulse
          </span>
        </Link>
        <Link
          href="/login"
          className="text-xs font-medium text-zinc-600 hover:text-zinc-950 border border-zinc-200 bg-white px-3 py-1.5 rounded-[6px] transition-colors"
        >
          Sign In
        </Link>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md mx-auto my-12">
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-white border border-zinc-200 text-[11px] font-mono text-zinc-600 mb-3">
            <span>AUTH MODULE • /api/user/register</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
            Create your account
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 mt-1">
            Set up your profile to create channels and collaborate in real time.
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-[8px] p-6 sm:p-7">
          {error && (
            <div className="mb-5 p-3 rounded-[6px] bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-[2px] bg-red-600 mt-1.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="alex_morgan"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-[6px] bg-white border border-zinc-200 text-zinc-950 placeholder-zinc-400 text-sm focus:outline-none focus:border-zinc-900 transition-colors"
                />
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">
                Minimum 3 characters, used for @mentions and search.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-[6px] bg-white border border-zinc-200 text-zinc-950 placeholder-zinc-400 text-sm focus:outline-none focus:border-zinc-900 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-[6px] bg-white border border-zinc-200 text-zinc-950 placeholder-zinc-400 text-sm focus:outline-none focus:border-zinc-900 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-[6px] text-xs font-semibold text-white bg-zinc-950 hover:bg-zinc-800 border border-zinc-950 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Workspace Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-zinc-600">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-zinc-950 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>

      <div className="text-center text-[11px] font-mono text-zinc-400">
        Zod Schema Validated • Instant Token Provisioning
      </div>
    </div>
  );
}

