import { redirect } from 'next/navigation';
import { getServerSession, fetchServerGroups } from '@/lib/api-server';
import WorkspaceProvider from '@/modules/workspace/workspace-provider';

export const metadata = {
  title: 'Workspace | NexusPulse',
  description: 'Team channels and real-time collaboration',
};

export default async function ChannelsLayout({
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
