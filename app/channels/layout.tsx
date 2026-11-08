import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession, fetchServerGroups } from '@/lib/api-server';
import WorkspaceProvider from '@/modules/workspace/workspace-provider';
import { WorkspaceSkeleton } from '@/modules/core/skeletons';

export const metadata = {
  title: 'Workspace | NexusPulse',
  description: 'Team channels and real-time collaboration',
};

async function AuthenticatedWorkspace({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ token, user }, groups] = await Promise.all([
    getServerSession(),
    fetchServerGroups(),
  ]);

  if (!token) {
    redirect('/login');
  }

  return (
    <WorkspaceProvider initialGroups={groups} currentUser={user}>
      {children}
    </WorkspaceProvider>
  );
}

export default function ChannelsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<WorkspaceSkeleton />}>
      <AuthenticatedWorkspace>{children}</AuthenticatedWorkspace>
    </Suspense>
  );
}
