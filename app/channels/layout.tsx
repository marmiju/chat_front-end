import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession, fetchServerGroups } from '@/lib/api-server';
import WorkspaceProvider from '@/modules/workspace/workspace-provider';

export const metadata = {
  title: 'Workspace | NexusPulse',
  description: 'Team channels and real-time collaboration',
};

async function AuthenticatedWorkspace({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, user } = await getServerSession();

  if (!token) {
    redirect('/login');
  }

  const groups = await fetchServerGroups();

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
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <AuthenticatedWorkspace>{children}</AuthenticatedWorkspace>
    </Suspense>
  );
}
