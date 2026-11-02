'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from './auth.service';
import { ArrowRight, Loader2, Sparkles, Lock, Mail } from 'lucide-react';

export default function LoginView() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data = await authService.login({ email, password });
      if (data.token) {
        router.push('/channels');
        router.refresh();
      } else {
        throw new Error('No authentication token received');
      }
    } catch (err: any) {
      setError(
        err.message || 'Login failed. Please verify your email and password.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('test@test.com');
    setPassword('123456');
    setError(null);
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
          href="/register"
          className="text-xs font-medium text-zinc-600 hover:text-zinc-950 border border-zinc-200 bg-white px-3 py-1.5 rounded-[6px] transition-colors"
        >
          Create Account
        </Link>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md mx-auto my-12">
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-white border border-zinc-200 text-[11px] font-mono text-zinc-600 mb-3">
            <span>AUTH MODULE • /api/user/login</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
            Sign in to workspace
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 mt-1">
            Enter your account credentials to connect to real-time channels.
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
                Email Address
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
                  placeholder="name@company.com"
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
                  placeholder="••••••••"
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
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Demo Autofill */}
          <div className="mt-5 pt-4 border-t border-zinc-200">
            <button
              type="button"
              onClick={handleFillDemo}
              className="w-full py-2 px-3 rounded-[6px] border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Autofill Demo Credentials (test@test.com)</span>
            </button>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-zinc-600">
          New to NexusPulse?{' '}
          <Link
            href="/register"
            className="font-semibold text-zinc-950 hover:underline"
          >
            Create a workspace account
          </Link>
        </p>
      </div>

      <div className="text-center text-[11px] font-mono text-zinc-400">
        JWT Bearer Session • Express & Socket.IO Handshake
      </div>
    </div>
  );
}

