import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { fetchServerGroups } from '@/lib/api-server';
import NoChannelsView from '@/modules/groups/no-channels-view';

async function ChannelsIndexContent() {
  const groups = await fetchServerGroups();

  if (groups && groups.length > 0) {
    redirect(`/channels/${groups[0]._id}`);
  }

  return <NoChannelsView />;
}

export default function ChannelsPage() {
  return (
    <Suspense fallback={<div className="flex-1 bg-white h-screen" />}>
      <ChannelsIndexContent />
    </Suspense>
  );
}

