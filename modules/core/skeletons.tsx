import React from 'react';

export function MessageListSkeleton() {
  const rows = [
    { nameWidth: 'w-24', line1: 'w-64', line2: 'w-44' },
    { nameWidth: 'w-20', line1: 'w-80', line2: '' },
    { nameWidth: 'w-28', line1: 'w-72', line2: 'w-52' },
    { nameWidth: 'w-16', line1: 'w-56', line2: '' },
    { nameWidth: 'w-24', line1: 'w-96 max-w-full', line2: 'w-60' },
    { nameWidth: 'w-20', line1: 'w-48', line2: '' },
  ];

  return (
    <div className="px-6 py-5 space-y-5 animate-pulse">
      {rows.map((row, idx) => (
        <div key={idx} className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-100 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <div className={`h-3.5 ${row.nameWidth} bg-zinc-200/80 rounded`} />
              <div className="h-2.5 w-10 bg-zinc-100 rounded" />
            </div>
            <div className={`h-3.5 ${row.line1} bg-zinc-100 rounded`} />
            {row.line2 && (
              <div className={`h-3.5 ${row.line2} bg-zinc-100/80 rounded`} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChannelChatSkeleton() {
  return (
    <div className="flex-1 flex flex-col bg-white h-screen overflow-hidden">
      {/* Top Channel Header Skeleton */}
      <header className="h-14 border-b border-zinc-200/80 px-5 flex items-center justify-between bg-white shrink-0 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded bg-zinc-200/80" />
          <div className="h-4 w-32 bg-zinc-200/80 rounded" />
          <div className="hidden sm:block h-3 w-48 bg-zinc-100 rounded ml-2" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-7 w-16 bg-zinc-100 rounded-md" />
          <div className="h-7 w-7 bg-zinc-100 rounded-md" />
        </div>
      </header>

      {/* Message Stream Skeleton */}
      <div className="flex-1 overflow-hidden">
        <MessageListSkeleton />
      </div>

      {/* Bottom Composer Skeleton */}
      <div className="px-5 pb-5 pt-1 bg-white shrink-0 animate-pulse">
        <div className="h-11 rounded-xl border border-zinc-200/80 bg-zinc-50/70 px-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded bg-zinc-200/70" />
            <div className="h-3.5 w-44 bg-zinc-200/70 rounded" />
          </div>
          <div className="w-7 h-7 rounded-lg bg-zinc-200/80" />
        </div>
      </div>
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <aside className="w-64 bg-[#fafafa] border-r border-zinc-200/80 flex flex-col justify-between select-none shrink-0 h-full animate-pulse">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Header */}
        <div className="h-14 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-zinc-200" />
            <div className="h-4 w-24 bg-zinc-200 rounded" />
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 rounded-md bg-zinc-200/60" />
            <div className="w-6 h-6 rounded-md bg-zinc-200/60" />
          </div>
        </div>

        {/* Navigation Lists */}
        <div className="flex-1 px-3 py-2 space-y-6">
          {/* Channels Section */}
          <div>
            <div className="px-2 mb-2 flex items-center justify-between">
              <div className="h-2.5 w-16 bg-zinc-200 rounded" />
              <div className="w-4 h-4 bg-zinc-200/70 rounded" />
            </div>
            <div className="space-y-1">
              {['w-28', 'w-20', 'w-32', 'w-24', 'w-28'].map((w, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-md ${
                    i === 0 ? 'bg-zinc-200/60' : ''
                  }`}
                >
                  <div className="w-3.5 h-3.5 rounded bg-zinc-200 shrink-0" />
                  <div className={`h-3 ${w} bg-zinc-200 rounded`} />
                </div>
              ))}
            </div>
          </div>

          {/* Direct Messages Section */}
          <div>
            <div className="px-2 mb-2 flex items-center justify-between">
              <div className="h-2.5 w-24 bg-zinc-200 rounded" />
              <div className="w-4 h-4 bg-zinc-200/70 rounded" />
            </div>
            <div className="space-y-1">
              {['w-24', 'w-28', 'w-20', 'w-24'].map((w, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md"
                >
                  <div className="w-5 h-5 rounded-full bg-zinc-200 shrink-0" />
                  <div className={`h-3 ${w} bg-zinc-200 rounded`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom User Footer */}
      <div className="p-2.5 border-t border-zinc-200/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 p-1.5 flex-1">
          <div className="w-8 h-8 rounded-full bg-zinc-200 shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-24 bg-zinc-200 rounded" />
            <div className="h-2.5 w-16 bg-zinc-200/70 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 rounded bg-zinc-200/60" />
          <div className="w-6 h-6 rounded bg-zinc-200/60" />
        </div>
      </div>
    </aside>
  );
}

export function WorkspaceSkeleton() {
  return (
    <div className="h-screen w-screen flex bg-white text-zinc-900 overflow-hidden">
      <SidebarSkeleton />
      <ChannelChatSkeleton />
    </div>
  );
}

export function AuthPageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-white animate-pulse">
      <div className="w-full max-w-xs space-y-6">
        <div className="flex flex-col items-center space-y-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-200" />
          <div className="h-5 w-36 bg-zinc-200 rounded" />
          <div className="h-3 w-48 bg-zinc-100 rounded" />
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="h-3 w-14 bg-zinc-200 rounded" />
            <div className="h-9 w-full bg-zinc-100 rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-16 bg-zinc-200 rounded" />
            <div className="h-9 w-full bg-zinc-100 rounded-lg" />
          </div>
          <div className="h-9 w-full bg-zinc-200 rounded-lg mt-2" />
        </div>

        <div className="h-3 w-40 bg-zinc-100 rounded mx-auto" />
      </div>
    </div>
  );
}

export function LandingPageSkeleton() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between animate-pulse">
      <header className="h-14 border-b border-zinc-100 px-6 flex items-center justify-between max-w-5xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-zinc-200" />
          <div className="h-4 w-24 bg-zinc-200 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-7 w-14 bg-zinc-100 rounded-lg" />
          <div className="h-7 w-20 bg-zinc-200 rounded-lg" />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-2xl mx-auto space-y-5">
        <div className="h-6 w-40 bg-zinc-100 rounded-full" />
        <div className="h-10 w-80 sm:w-96 bg-zinc-200 rounded-lg" />
        <div className="h-4 w-72 sm:w-80 bg-zinc-100 rounded" />
        <div className="flex items-center gap-3 pt-2">
          <div className="h-9 w-32 bg-zinc-200 rounded-lg" />
          <div className="h-9 w-24 bg-zinc-100 rounded-lg" />
        </div>
      </main>

      <footer className="h-14 border-t border-zinc-100 px-6 flex items-center justify-between max-w-5xl w-full mx-auto">
        <div className="h-3 w-24 bg-zinc-100 rounded" />
        <div className="h-3 w-36 bg-zinc-100 rounded" />
      </footer>
    </div>
  );
}

